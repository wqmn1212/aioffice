/**
 * 모델 제공자 연동 설정.
 *
 * 팀이 이미 쓰는 키(Claude / GPT / Gemini)를 등록하는 화면이다.
 * 키는 저장 후 두 번 다시 내려오지 않으므로, 입력란은 항상 비어 있고
 * 등록된 키는 마스킹된 형태로만 보여 준다. 이 화면에서 키를 '조회'하는
 * 경로는 없다 — 바꾸려면 새로 넣는 수밖에 없다.
 */

import { useCallback, useEffect, useState } from "react";
import {
  api,
  type CredentialInfo,
  type Provider,
  type ProviderInfo,
  type UsageSummary,
} from "../api";
import "./providers.css";

export default function ProviderSettings({ companyId }: { companyId: string }) {
  const [catalog, setCatalog] = useState<ProviderInfo[]>([]);
  const [secretReady, setSecretReady] = useState(true);
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api.credentials(companyId).then((r) => setCredentials(r.credentials)).catch(() => {});
    api.usage(companyId).then(setUsage).catch(() => {});
  }, [companyId]);

  useEffect(() => {
    api
      .providerCatalog()
      .then((r) => {
        setCatalog(r.providers);
        setSecretReady(r.secretReady);
      })
      .catch((e: Error) => setError(e.message));
    refresh();
  }, [refresh]);

  const connected = new Map(credentials.map((c) => [c.provider, c]));

  return (
    <section className="providers">
      {!secretReady && (
        <div className="pv-warn">
          <strong>서버에 암호화 키가 없습니다</strong>
          <p>
            <code>AIOFFICE_SECRET</code>이 설정되지 않아 API 키를 안전하게 저장할 수 없습니다.
            <code>.env</code>에 16자 이상의 임의 문자열을 넣고 서버를 다시 시작하세요.
          </p>
        </div>
      )}

      <div className="pv-intro">
        <h2 className="panel-title">모델 연동</h2>
        <p>
          팀이 이미 쓰는 API 키를 등록하면 그 제공자로 업무가 실행됩니다. 키는 암호화해 보관하며,
          등록 후에는 마스킹된 형태로만 표시됩니다.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="pv-grid">
        {catalog.map((info) => (
          <ProviderCard
            key={info.id}
            info={info}
            current={connected.get(info.id)}
            companyId={companyId}
            disabled={!secretReady}
            onChanged={(list) => {
              setCredentials(list);
              refresh();
            }}
          />
        ))}
      </div>

      {usage && usage.runs > 0 && (
        <div className="pv-usage">
          <h3>사용량</h3>
          <div className="pv-usage-row">
            <span>
              실행 <strong>{usage.runs}</strong>건
            </span>
            <span>
              입력 <strong>{usage.inputTokens.toLocaleString()}</strong> 토큰
            </span>
            <span>
              출력 <strong>{usage.outputTokens.toLocaleString()}</strong> 토큰
            </span>
          </div>
          <p className="pv-fine">
            업무 1건당 평균 입력 {Math.round(usage.inputTokens / usage.runs).toLocaleString()} ·
            출력 {Math.round(usage.outputTokens / usage.runs).toLocaleString()} 토큰입니다. 제공자
            단가를 곱하면 건당 원가가 나옵니다.
          </p>
        </div>
      )}
    </section>
  );
}

function ProviderCard({
  info,
  current,
  companyId,
  disabled,
  onChanged,
}: {
  info: ProviderInfo;
  current?: CredentialInfo;
  companyId: string;
  disabled: boolean;
  onChanged: (list: CredentialInfo[]) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(current?.model ?? info.defaultModel);
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    setMessage("키를 확인하는 중…");
    setFailed(false);
    try {
      const result = await api.saveCredential(companyId, {
        provider: info.id,
        apiKey: apiKey.trim(),
        model,
      });
      onChanged(result.credentials);
      setApiKey(""); // 저장 직후 입력란을 비운다. 화면에 남겨 둘 이유가 없다.
      setMessage("연동되었습니다");
    } catch (e) {
      setMessage((e as Error).message);
      setFailed(true);
    } finally {
      setState("idle");
    }
  }

  async function disconnect() {
    if (!window.confirm(`${info.label} 연동을 해제할까요? 저장된 키가 삭제됩니다.`)) return;
    try {
      const result = await api.deleteCredential(companyId, info.id);
      onChanged(result.credentials);
      setMessage(null);
      setFailed(false);
    } catch (e) {
      setMessage((e as Error).message);
      setFailed(true);
    }
  }

  return (
    <article className={current ? "pv-card on" : "pv-card"}>
      <header className="pv-card-head">
        <h3>{info.label}</h3>
        {current ? (
          <span className="pv-pill on">연동됨</span>
        ) : (
          <span className="pv-pill">미연동</span>
        )}
      </header>

      {current && (
        <p className="pv-current">
          <code>{current.masked}</code>
          <span>{current.model}</span>
        </p>
      )}

      <form onSubmit={save}>
        <label className="pv-label">
          API 키
          <input
            type="password"
            value={apiKey}
            autoComplete="off"
            placeholder={current ? "새 키로 교체하려면 입력" : info.keyHint}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="pv-label">
          모델
          <select value={model} onChange={(e) => setModel(e.target.value)} disabled={disabled}>
            {info.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <div className="pv-actions">
          <button type="submit" disabled={disabled || state === "saving" || apiKey.trim().length < 8}>
            {state === "saving" ? "확인 중…" : current ? "키 교체" : "연동"}
          </button>
          {current && (
            <button type="button" className="pv-danger" onClick={disconnect}>
              해제
            </button>
          )}
          <a href={info.console} target="_blank" rel="noreferrer noopener" className="pv-link">
            키 발급 ↗
          </a>
        </div>
      </form>

      {message && <p className={failed ? "pv-msg fail" : "pv-msg ok"}>{message}</p>}
    </article>
  );
}
