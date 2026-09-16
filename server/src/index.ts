import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import * as z from "zod/v4";

import { PORT, hasAnthropicCredentials } from "./env.js";
import { DEPARTMENTS } from "./org.js";
import { queries } from "./db.js";
import { foundCompany, loadCompany, deleteCompany } from "./founding.js";
import { computeOffice, tickOffice, issueOrder, openTaskCount } from "./office.js";
import { runTask, usageSummary, purgeCredentials } from "./runner.js";
import { seedDemoReports, clearDemoReports } from "./seed-reports.js";
import { hasMasterKey, maskKey, seal } from "./secretbox.js";
import {
  isProvider,
  PROVIDER_INFO,
  ProviderError,
  verifyKey,
  type Provider,
} from "./providers.js";

const app = new Hono();

const FoundRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(4000),
  demo: z.boolean().optional(),
});

app.get("/api/health", (c) => c.json({ ok: true, credentials: hasAnthropicCredentials() }));

/** 부서·직무 카탈로그. 프론트가 조직도와 도트 오피스를 그릴 때 쓴다. */
app.get("/api/org", (c) => c.json({ departments: DEPARTMENTS }));

app.get("/api/companies", (c) => c.json({ companies: queries.listCompanies.all() }));

const WaitlistRequest = z.object({
  // 이 단계에서 필요한 건 연락 수단 하나뿐이다. 나머지는 전부 선택.
  email: z.email().max(200),
  channels: z.array(z.string().max(40)).max(8).optional(),
  plan: z.string().max(40).optional(),
  note: z.string().max(1000).optional(),
});

app.post("/api/waitlist", async (c) => {
  const body = WaitlistRequest.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "이메일 주소를 확인해 주세요" }, 400);

  const { email, channels, plan, note } = body.data;
  queries.upsertWaitlist.run(
    randomUUID(),
    email.trim().toLowerCase(),
    (channels ?? []).join(","),
    plan ?? "",
    note ?? "",
    new Date().toISOString(),
  );
  const { n } = queries.countWaitlist.get() as { n: number };
  return c.json({ ok: true, position: n }, 201);
});

app.get("/api/waitlist/count", (c) => {
  const { n } = queries.countWaitlist.get() as { n: number };
  return c.json({ count: n });
});

app.get("/api/companies/:id", (c) => {
  const state = loadCompany(c.req.param("id"));
  if (!state) return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  return c.json(state);
});

/** 연동 가능한 제공자 카탈로그. 화면이 설정 폼을 그릴 때 쓴다. */
app.get("/api/providers", (c) =>
  c.json({ providers: Object.values(PROVIDER_INFO), secretReady: hasMasterKey() }),
);

/** 이 회사가 연동한 제공자 목록. 키는 절대 포함되지 않는다(마스킹만). */
app.get("/api/companies/:id/providers", (c) => {
  if (!queries.getCompany.get(c.req.param("id"))) {
    return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  }
  return c.json({ credentials: queries.listCredentials.all(c.req.param("id")) });
});

const CredentialRequest = z.object({
  provider: z.string().refine(isProvider, "지원하지 않는 제공자입니다"),
  apiKey: z.string().min(8).max(500),
  model: z.string().min(1).max(100).optional(),
  /** 저장 전에 실제 호출로 키를 검증할지. 기본은 검증한다. */
  verify: z.boolean().optional(),
});

app.put("/api/companies/:id/providers", async (c) => {
  const companyId = c.req.param("id");
  if (!queries.getCompany.get(companyId)) {
    return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  }
  if (!hasMasterKey()) {
    return c.json(
      {
        error:
          "서버에 AIOFFICE_SECRET이 설정되지 않아 키를 안전하게 저장할 수 없습니다. " +
          ".env에 16자 이상의 임의 문자열을 넣고 서버를 다시 시작하세요.",
      },
      503,
    );
  }

  const body = CredentialRequest.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: body.error.issues[0]?.message ?? "입력을 확인해 주세요" }, 400);
  }

  const provider = body.data.provider as Provider;
  const info = PROVIDER_INFO[provider];
  const model = body.data.model?.trim() || info.defaultModel;
  const apiKey = body.data.apiKey.trim();

  if (body.data.verify !== false) {
    const check = await verifyKey(provider, apiKey, model);
    if (!check.ok) return c.json({ error: check.error, kind: check.kind }, 400);
  }

  queries.upsertCredential.run(
    companyId,
    provider,
    seal(apiKey),
    maskKey(apiKey),
    model,
    new Date().toISOString(),
  );
  return c.json({ ok: true, credentials: queries.listCredentials.all(companyId) }, 201);
});

app.delete("/api/companies/:id/providers/:provider", (c) => {
  const provider = c.req.param("provider");
  if (!isProvider(provider)) return c.json({ error: "지원하지 않는 제공자입니다" }, 400);
  queries.deleteCredential.run(c.req.param("id"), provider);
  return c.json({ ok: true, credentials: queries.listCredentials.all(c.req.param("id")) });
});

const RunRequest = z.object({ provider: z.string().refine(isProvider).optional() });

/** 업무 하나를 실제 모델로 실행한다. 여기서 tasks.output이 채워진다. */
app.post("/api/companies/:id/tasks/:taskId/run", async (c) => {
  const body = RunRequest.safeParse((await c.req.json().catch(() => null)) ?? {});
  const provider = body.success ? (body.data.provider as Provider | undefined) : undefined;

  try {
    const result = await runTask(c.req.param("id"), c.req.param("taskId"), provider);
    return c.json(result);
  } catch (err) {
    if (err instanceof ProviderError) {
      const status = err.kind === "auth" ? 400 : err.kind === "rate" ? 429 : 502;
      return c.json({ error: err.message, kind: err.kind }, status);
    }
    console.error("[업무 실행 실패]", err);
    return c.json({ error: err instanceof Error ? err.message : "알 수 없는 오류" }, 500);
  }
});

/** 지시한 업무 전체 목록. 본문은 빼고 진행 상태만 내린다. */
app.get("/api/companies/:id/reports", (c) => {
  const companyId = c.req.param("id");
  if (!queries.getCompany.get(companyId)) {
    return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  }
  return c.json({ reports: queries.listReports.all(companyId) });
});

/** 보고서 한 건의 본문. */
app.get("/api/companies/:id/reports/:taskId", (c) => {
  const report = queries.getReport.get(c.req.param("taskId"), c.req.param("id"));
  if (!report) return c.json({ error: "보고서를 찾을 수 없습니다" }, 404);
  return c.json(report);
});

/** 샘플 보고서 채우기 — 실제 실행 없이 화면을 확인하기 위한 경로. */
app.post("/api/companies/:id/reports/demo", (c) => {
  const companyId = c.req.param("id");
  if (!queries.getCompany.get(companyId)) {
    return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  }
  const result = seedDemoReports(companyId);
  return c.json({ ...result, reports: queries.listReports.all(companyId) });
});

app.delete("/api/companies/:id/reports/demo", (c) => {
  const companyId = c.req.param("id");
  const removed = clearDemoReports(companyId);
  return c.json({ removed, reports: queries.listReports.all(companyId) });
});

/** 토큰 사용량 요약. 건당 원가를 확인하는 창구다. */
app.get("/api/companies/:id/usage", (c) => {
  if (!queries.getCompany.get(c.req.param("id"))) {
    return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  }
  return c.json(usageSummary(c.req.param("id")));
});

/** 도트 오피스 화면이 폴링하는 현재 상태. */
app.get("/api/companies/:id/office", (c) => {
  const office = computeOffice(c.req.param("id"));
  if (!office) return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  return c.json({ ...office, openTasks: openTaskCount(c.req.param("id")) });
});

/** 업무를 한 스텝 진행시킨다. 화면의 '진행' 버튼과 자동 진행이 호출한다. */
app.post("/api/companies/:id/tick", (c) => {
  const office = tickOffice(c.req.param("id"));
  if (!office) return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  return c.json({ ...office, openTasks: openTaskCount(c.req.param("id")) });
});

const OrderRequest = z.object({
  departmentId: z.string().min(1),
  title: z.string().min(2).max(200),
});

/** 대표의 업무 지시. */
app.post("/api/companies/:id/orders", async (c) => {
  const body = OrderRequest.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: "부서와 업무 내용(2자 이상)을 입력해 주세요" }, 400);
  }
  const result = issueOrder(c.req.param("id"), body.data.departmentId, body.data.title);
  if (!result) return c.json({ error: "부서 또는 회사를 찾을 수 없습니다" }, 404);
  return c.json(result, 201);
});

app.delete("/api/companies/:id", (c) => {
  // 회사가 사라지면 그 회사가 맡긴 키도 남아 있을 이유가 없다.
  purgeCredentials(c.req.param("id"));
  if (!deleteCompany(c.req.param("id"))) {
    return c.json({ error: "회사를 찾을 수 없습니다" }, 404);
  }
  return c.json({ ok: true });
});

app.post("/api/companies", async (c) => {
  const body = FoundRequest.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: "회사명과 사업 설명(10자 이상)을 입력해 주세요" }, 400);
  }

  const demo = body.data.demo ?? false;
  if (!demo && !hasAnthropicCredentials()) {
    return c.json(
      {
        error:
          "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env에 키를 넣거나 '데모로 둘러보기'를 사용하세요.",
        needsKey: true,
      },
      400,
    );
  }

  try {
    return c.json(await foundCompany(body.data.name, body.data.description, { demo }), 201);
  } catch (err) {
    // 구체적인 것부터. AnthropicError는 나머지 전부의 상위 클래스라 맨 뒤에 둔다.
    if (err instanceof Anthropic.AuthenticationError) {
      return c.json({ error: "Anthropic API 키가 유효하지 않습니다.", needsKey: true }, 401);
    }
    if (err instanceof Anthropic.RateLimitError) {
      return c.json({ error: "요청이 몰렸습니다. 잠시 후 다시 시도해 주세요." }, 429);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return c.json({ error: "Anthropic API에 연결하지 못했습니다." }, 503);
    }
    if (err instanceof Anthropic.APIError) {
      return c.json({ error: `Anthropic API 오류 (${err.status ?? "?"}): ${err.message}` }, 502);
    }
    if (err instanceof Anthropic.AnthropicError) {
      return c.json({ error: `Anthropic SDK 오류: ${err.message}`, needsKey: true }, 400);
    }
    console.error("[설립 실패]", err);
    return c.json({ error: err instanceof Error ? err.message : "알 수 없는 오류" }, 500);
  }
});

if (!hasAnthropicCredentials()) {
  console.warn(
    "[안내] ANTHROPIC_API_KEY가 없습니다. 화면에서 '데모로 둘러보기'로 전체 흐름을 확인할 수 있습니다.",
  );
}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`AI OFFICE 서버: http://localhost:${info.port}`);
});
