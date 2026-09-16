/**
 * 업무 실행기.
 *
 * 지금까지 tick은 업무 상태만 옮겼고 tasks.output은 계속 null이었다. 여기가
 * 그 구멍을 메우는 자리다 — 담당자의 역할·페르소나로 시스템 프롬프트를 만들고,
 * 그 회사가 연동한 제공자로 호출해서 결과를 저장한다.
 *
 * 제공자는 회사별 자격증명에서 고른다. 팀이 이미 쓰는 키로 돌아가야 하므로
 * 서버 소유 키를 기본값으로 끼워 넣지 않는다.
 */

import { db, queries, type AgentRow, type TaskRow } from "./db.js";
import { DEPARTMENTS_BY_ID } from "./org.js";
import { open } from "./secretbox.js";
import {
  complete,
  isProvider,
  PROVIDER_INFO,
  ProviderError,
  type Provider,
} from "./providers.js";

export interface RunResult {
  taskId: string;
  output: string;
  provider: Provider;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

interface CredentialRow {
  sealed_key: string;
  model: string;
}

/** 회사가 연동한 제공자 중 하나를 고른다. provider를 지정하면 그것만 본다. */
function pickCredential(
  companyId: string,
  provider?: Provider,
): { provider: Provider; apiKey: string; model: string } {
  const configured = queries.listCredentials.all(companyId) as unknown as Array<{
    provider: string;
  }>;
  if (configured.length === 0) {
    throw new ProviderError(
      "연동된 모델 제공자가 없습니다. 설정에서 Claude·GPT·Gemini 중 하나의 API 키를 등록하세요.",
      "auth",
    );
  }

  const chosen = provider ?? (configured[0]!.provider as Provider);
  if (!isProvider(chosen)) throw new ProviderError("알 수 없는 제공자입니다.", "unknown");

  const row = queries.getCredential.get(companyId, chosen) as unknown as
    | CredentialRow
    | undefined;
  if (!row) {
    throw new ProviderError(
      `${PROVIDER_INFO[chosen].label}가 연동되어 있지 않습니다.`,
      "auth",
    );
  }

  return { provider: chosen, apiKey: open(row.sealed_key), model: row.model };
}

/**
 * 담당자 한 명의 시스템 프롬프트. 역할(카탈로그)과 페르소나(설립 시 생성)를
 * 합쳐서 만든다. 둘 다 이미 DB에 있으므로 따로 저장할 필요가 없다.
 */
function systemPromptFor(agent: AgentRow, companyName: string, companyDesc: string): string {
  const spec = DEPARTMENTS_BY_ID.get(agent.department_id);
  const role = spec?.roles.find((r) => r.id === agent.role_id);

  return [
    `당신은 '${companyName}'의 ${spec?.name ?? ""} 부서 ${role?.title ?? "담당자"} ${agent.name}입니다.`,
    "",
    `# 회사`,
    companyDesc,
    "",
    `# 당신의 담당 범위`,
    role?.mission ?? "",
    "",
    `# 당신의 일하는 방식`,
    agent.persona || "구체적이고 검증 가능한 결과를 냅니다.",
    "",
    "# 작성 규칙",
    "- 결과는 한국어 마크다운으로 씁니다.",
    "- 추측과 확인된 사실을 반드시 구분해 표기합니다.",
    "- 모르는 것은 모른다고 적고, 무엇을 확인해야 하는지 남깁니다.",
    "- 숫자를 쓸 때는 근거나 가정을 함께 적습니다.",
    "- 서론 없이 바로 본론으로 들어갑니다.",
  ].join("\n");
}

/**
 * 업무 하나를 실제로 실행한다. 성공하면 완료로 넘기고 산출물을 남기며,
 * 실패하면 진행 중으로 되돌리고 사유를 적는다 — 실패한 업무를 완료로
 * 처리하면 화면에는 끝난 것처럼 보이는데 결과가 없다.
 */
export async function runTask(
  companyId: string,
  taskId: string,
  provider?: Provider,
): Promise<RunResult> {
  const company = queries.getCompany.get(companyId) as unknown as
    | { name: string; description: string }
    | undefined;
  if (!company) throw new ProviderError("회사를 찾을 수 없습니다.", "unknown");

  const task = queries.getTask.get(taskId, companyId) as unknown as TaskRow | undefined;
  if (!task) throw new ProviderError("업무를 찾을 수 없습니다.", "unknown");

  const agents = queries.listAgents.all(companyId) as unknown as AgentRow[];
  const agent = agents.find((a) => a.id === task.agent_id);
  if (!agent) throw new ProviderError("담당자를 찾을 수 없습니다.", "unknown");

  const credential = pickCredential(companyId, provider);
  const now = new Date().toISOString();

  try {
    const result = await complete({
      provider: credential.provider,
      apiKey: credential.apiKey,
      model: credential.model,
      system: systemPromptFor(agent, company.name, company.description),
      prompt: `다음 업무를 수행하고 결과물을 작성하세요.\n\n업무: ${task.title}`,
    });

    queries.saveTaskRun.run(
      "done",
      result.text,
      credential.provider,
      credential.model,
      result.inputTokens,
      result.outputTokens,
      now,
      null,
      taskId,
    );

    return {
      taskId,
      output: result.text,
      provider: credential.provider,
      model: credential.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // 완료로 올리지 않는다. 진행 중으로 두고 사유만 남겨 다시 시도할 수 있게.
    queries.saveTaskRun.run(
      "doing",
      task.output,
      credential.provider,
      credential.model,
      null,
      null,
      now,
      message,
      taskId,
    );
    throw err;
  }
}

/** 회사 전체의 토큰 사용량. 원가 확인용. */
export function usageSummary(companyId: string): {
  runs: number;
  inputTokens: number;
  outputTokens: number;
  byProvider: Record<string, number>;
} {
  const tasks = queries.listTasks.all(companyId) as unknown as TaskRow[];
  const summary = { runs: 0, inputTokens: 0, outputTokens: 0, byProvider: {} as Record<string, number> };

  for (const task of tasks) {
    if (!task.ran_at || !task.provider) continue;
    summary.runs += 1;
    summary.inputTokens += task.input_tokens ?? 0;
    summary.outputTokens += task.output_tokens ?? 0;
    summary.byProvider[task.provider] = (summary.byProvider[task.provider] ?? 0) + 1;
  }
  return summary;
}

/** 회사를 지울 때 자격증명도 같이 지운다. */
export function purgeCredentials(companyId: string): void {
  db.exec("BEGIN");
  try {
    queries.deleteCompanyCredentials.run(companyId);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
