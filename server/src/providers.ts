/**
 * 모델 제공자 추상화.
 *
 * 팀마다 이미 쓰는 제공자가 다르므로(Claude / GPT / Gemini), 업무 실행기는
 * 한 인터페이스만 보고 돌아가야 한다. SDK를 셋 다 넣는 대신 각 사의 HTTP
 * API를 직접 호출한다 — 필요한 건 "system + prompt → 텍스트" 하나뿐이라
 * SDK 세 개의 의존성과 버전 관리를 짊어질 이유가 없다.
 *
 * 에러는 전부 ProviderError로 좁혀서 올린다. 키가 틀린 것인지, 한도가 찬
 * 것인지, 모델명이 틀린 것인지를 사용자가 구분할 수 있어야 고칠 수 있다.
 */

export const PROVIDERS = ["anthropic", "openai", "gemini"] as const;
export type Provider = (typeof PROVIDERS)[number];

export function isProvider(value: string): value is Provider {
  return (PROVIDERS as readonly string[]).includes(value);
}

export interface ProviderInfo {
  id: Provider;
  label: string;
  /** 키를 발급받는 곳. 설정 화면에 그대로 띄운다. */
  console: string;
  keyHint: string;
  defaultModel: string;
  models: string[];
}

export const PROVIDER_INFO: Record<Provider, ProviderInfo> = {
  anthropic: {
    id: "anthropic",
    label: "Claude",
    console: "https://console.anthropic.com/settings/keys",
    keyHint: "sk-ant-…",
    defaultModel: "claude-sonnet-5",
    models: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"],
  },
  openai: {
    id: "openai",
    label: "GPT",
    console: "https://platform.openai.com/api-keys",
    keyHint: "sk-…",
    defaultModel: "gpt-5",
    models: ["gpt-5", "gpt-5-mini", "gpt-4.1"],
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    console: "https://aistudio.google.com/apikey",
    keyHint: "AIza…",
    defaultModel: "gemini-2.5-pro",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
  },
};

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "rate" | "model" | "network" | "unknown",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface CompleteRequest {
  provider: Provider;
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  /** 호출이 매달려 있지 않도록 항상 상한을 둔다. */
  timeoutMs?: number;
}

export interface CompleteResult {
  text: string;
  /** 원가 계산에 쓴다. 제공자가 안 주면 null. */
  inputTokens: number | null;
  outputTokens: number | null;
}

const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_TOKENS = 4000;

/** 상태 코드를 사용자가 고칠 수 있는 분류로 옮긴다. */
function classify(status: number, body: string): ProviderError {
  const snippet = body.slice(0, 300);
  if (status === 401 || status === 403) {
    return new ProviderError("API 키가 유효하지 않거나 권한이 없습니다.", "auth", status);
  }
  if (status === 429) {
    return new ProviderError("제공자 사용 한도에 걸렸습니다. 잠시 후 다시 시도하세요.", "rate", status);
  }
  if (status === 404 || status === 400) {
    return new ProviderError(`요청이 거부되었습니다(모델명을 확인하세요): ${snippet}`, "model", status);
  }
  return new ProviderError(`제공자 오류 (${status}): ${snippet}`, "unknown", status);
}

async function post(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProviderError("제공자 응답이 제한 시간을 넘겼습니다.", "network");
    }
    throw new ProviderError(
      `제공자에 연결하지 못했습니다: ${err instanceof Error ? err.message : String(err)}`,
      "network",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(req: CompleteRequest, timeoutMs: number): Promise<CompleteResult> {
  const response = await post(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": req.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: req.system,
        messages: [{ role: "user", content: req.prompt }],
      }),
    },
    timeoutMs,
  );

  if (!response.ok) throw classify(response.status, await response.text());

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  return {
    text,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  };
}

async function callOpenAI(req: CompleteRequest, timeoutMs: number): Promise<CompleteResult> {
  const response = await post(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${req.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        max_completion_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.prompt },
        ],
      }),
    },
    timeoutMs,
  );

  if (!response.ok) throw classify(response.status, await response.text());

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    text: data.choices?.[0]?.message?.content ?? "",
    inputTokens: data.usage?.prompt_tokens ?? null,
    outputTokens: data.usage?.completion_tokens ?? null,
  };
}

async function callGemini(req: CompleteRequest, timeoutMs: number): Promise<CompleteResult> {
  // 키를 쿼리스트링에 붙이면 프록시·액세스 로그에 남는다. 헤더로 보낸다.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    req.model,
  )}:generateContent`;

  const response = await post(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": req.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: { maxOutputTokens: req.maxTokens ?? DEFAULT_MAX_TOKENS },
      }),
    },
    timeoutMs,
  );

  if (!response.ok) throw classify(response.status, await response.text());

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");

  return {
    text,
    inputTokens: data.usageMetadata?.promptTokenCount ?? null,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
  };
}

export async function complete(req: CompleteRequest): Promise<CompleteResult> {
  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT;
  const result =
    req.provider === "anthropic"
      ? await callAnthropic(req, timeoutMs)
      : req.provider === "openai"
        ? await callOpenAI(req, timeoutMs)
        : await callGemini(req, timeoutMs);

  // 빈 응답은 성공이 아니다. 여기서 막지 않으면 빈 산출물이 '완료'로 저장된다.
  if (!result.text.trim()) {
    throw new ProviderError(
      "제공자가 빈 응답을 돌려줬습니다(안전 필터 또는 토큰 한도일 수 있습니다).",
      "unknown",
    );
  }
  return result;
}

/**
 * 키가 실제로 동작하는지 확인한다. 저장 전에 한 번 호출해서, 오타를 몇 주 뒤
 * 업무 실행이 실패할 때가 아니라 입력하는 순간에 알려 준다.
 */
export async function verifyKey(
  provider: Provider,
  apiKey: string,
  model: string,
): Promise<{ ok: true } | { ok: false; error: string; kind: ProviderError["kind"] }> {
  try {
    await complete({
      provider,
      apiKey,
      model,
      system: "Reply with the single word: OK",
      prompt: "OK",
      maxTokens: 16,
      timeoutMs: 30_000,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof ProviderError) {
      // 빈 응답이나 토큰 한도는 키 문제가 아니다. 연결은 된 것으로 본다.
      if (err.kind === "unknown" && !err.status) return { ok: true };
      return { ok: false, error: err.message, kind: err.kind };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err), kind: "unknown" };
  }
}
