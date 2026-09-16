/**
 * 업무·보고서 화면.
 *
 * 지시한 업무가 어디까지 왔는지(대기→진행→검토→완료)와, 완료된 것의
 * 산출물을 보는 곳이다. 오피스 화면은 '지금 이 순간'만 보여 주므로
 * 지나간 결과를 확인할 곳이 따로 필요하다.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ReportDetail, type ReportSummary } from "../api";
import Markdown from "./Markdown";
import "./reports.css";

const STATUS_LABEL: Record<string, string> = {
  todo: "대기",
  doing: "진행 중",
  review: "검토 중",
  done: "완료",
};

/**
 * 오피스의 자동 진행(tick)은 모델을 부르지 않고 상태만 넘긴다. 그래서 산출물
 * 없이 'done'이 된 업무가 생긴다. 이걸 실제 보고서와 같은 '완료'로 묶으면
 * 개수가 거짓말이 되므로, 산출물 유무를 상태보다 앞세워 구분한다.
 */
function statusOf(report: ReportSummary): { label: string; cls: string } {
  if (report.has_output) return { label: "보고서", cls: "rp-done" };
  if (report.status === "done") return { label: "처리됨", cls: "rp-empty-done" };
  return { label: STATUS_LABEL[report.status] ?? report.status, cls: `rp-${report.status}` };
}

const FILTERS = [
  { id: "all", label: "전체" },
  { id: "reports", label: "보고서" },
  { id: "open", label: "진행 중" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

function when(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return "방금";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR");
}

export default function ReportsView({
  companyId,
  departmentNames,
}: {
  companyId: string;
  departmentNames: Map<string, { name: string; emoji: string }>;
}) {
  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .reports(companyId)
      .then((r) => setReports(r.reports))
      .catch((e: Error) => setError(e.message));
  }, [companyId]);

  useEffect(load, [load]);

  // 목록에 본문이 없으므로 펼칠 때 한 건만 따로 받아 온다.
  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    let cancelled = false;
    api
      .report(companyId, openId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, openId]);

  const visible = useMemo(() => {
    const list = reports ?? [];
    if (filter === "reports") return list.filter((r) => r.has_output);
    if (filter === "open") return list.filter((r) => r.status !== "done");
    return list;
  }, [reports, filter]);

  const doneCount = (reports ?? []).filter((r) => r.has_output).length;
  const simulated = (reports ?? []).filter((r) => r.status === "done" && !r.has_output).length;
  const hasDemo = (reports ?? []).some((r) => r.provider === "demo");

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.seedDemoReports(companyId);
      setReports(result.reports);
      if (result.skipped) setError("이미 샘플 보고서가 있습니다.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function clearDemo() {
    if (!window.confirm("샘플 보고서를 지울까요? 실제 실행 결과는 남습니다.")) return;
    setBusy(true);
    try {
      const result = await api.clearDemoReports(companyId);
      setReports(result.reports);
      setOpenId(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!reports) return <p className="hint rp-pad">보고서를 불러오는 중…</p>;

  return (
    <section className="reports">
      <div className="rp-bar">
        <div className="rp-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? "rp-filter on" : "rp-filter"}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === "reports" && doneCount > 0 && (
                <span className="rp-badge">{doneCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="rp-actions">
          <button type="button" className="rp-ghost" onClick={load} disabled={busy}>
            새로고침
          </button>
          {hasDemo ? (
            <button type="button" className="rp-ghost danger" onClick={clearDemo} disabled={busy}>
              샘플 지우기
            </button>
          ) : (
            <button type="button" className="rp-ghost" onClick={seed} disabled={busy}>
              샘플 보고서 채우기
            </button>
          )}
        </div>
      </div>

      {error && <p className="error rp-pad">{error}</p>}

      {simulated > 0 && (
        <p className="rp-note">
          <b>처리됨 {simulated}건</b>은 오피스의 자동 진행으로 상태만 넘어간 업무입니다. 모델을
          호출하지 않았으므로 산출물이 없습니다 — 실제 보고서는 <b>보고서</b> 탭에만 나옵니다.
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rp-empty">
          <p>
            {filter === "reports"
              ? "완성된 보고서가 아직 없습니다."
              : "표시할 업무가 없습니다."}
          </p>
          <p className="hint">
            오피스 화면에서 업무를 지시하고 담당자를 눌러 실행하면 여기에 쌓입니다. 실제 실행 없이
            화면만 먼저 보시려면 <b>샘플 보고서 채우기</b>를 눌러 보세요.
          </p>
        </div>
      ) : (
        <ul className="rp-list">
          {visible.map((report) => {
            const dept = departmentNames.get(report.department_id);
            const open = openId === report.id;
            return (
              <li key={report.id} className={open ? "rp-item open" : "rp-item"}>
                <button
                  type="button"
                  className="rp-head"
                  onClick={() => setOpenId(open ? null : report.id)}
                  aria-expanded={open}
                >
                  <span className={`rp-status ${statusOf(report).cls}`}>
                    {statusOf(report).label}
                  </span>
                  <span className="rp-title">{report.title}</span>
                  <span className="rp-meta">
                    {dept && (
                      <span className="rp-dept">
                        {dept.emoji} {dept.name}
                      </span>
                    )}
                    {report.agent_name && <span>{report.agent_name}</span>}
                    <span className="rp-when">{when(report.ran_at ?? report.created_at)}</span>
                  </span>
                  <span className="rp-caret">{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div className="rp-body">
                    {loadingDetail && <p className="hint">불러오는 중…</p>}

                    {!loadingDetail && detail?.id === report.id && (
                      <>
                        <div className="rp-runmeta">
                          {detail.provider ? (
                            <>
                              <span
                                className={detail.provider === "demo" ? "rp-tag demo" : "rp-tag"}
                              >
                                {detail.provider === "demo" ? "샘플 데이터" : detail.provider}
                              </span>
                              {detail.model && detail.provider !== "demo" && (
                                <span>{detail.model}</span>
                              )}
                              {detail.input_tokens !== null && (
                                <span>
                                  입력 {detail.input_tokens.toLocaleString()} · 출력{" "}
                                  {(detail.output_tokens ?? 0).toLocaleString()} 토큰
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="rp-tag pending">아직 실행되지 않음</span>
                          )}
                        </div>

                        {detail.error && (
                          <p className="error rp-runerror">마지막 실행 실패: {detail.error}</p>
                        )}

                        {detail.output ? (
                          <article className="rp-report">
                            <Markdown source={detail.output} />
                          </article>
                        ) : (
                          <p className="hint">
                            아직 산출물이 없습니다. 오피스 화면에서 담당자를 눌러 실행하세요.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
