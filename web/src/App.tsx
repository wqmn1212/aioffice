import { useEffect, useMemo, useState } from "react";
import OfficeView from "./office/OfficeView";
import LandingPage from "./landing/LandingPage";
import ProviderSettings from "./providers/ProviderSettings";
import ReportsView from "./reports/ReportsView";
import {
  api,
  type Agent,
  type Company,
  type CompanyState,
  type DepartmentSpec,
  type Health,
  type Task,
} from "./api.ts";

type View =
  | { kind: "landing" }
  | { kind: "start" }
  | { kind: "founding"; name: string; demo: boolean }
  | { kind: "company"; id: string };

/**
 * 앱에 한 번이라도 들어간 사람에게는 다음 방문부터 랜딩을 건너뛴다.
 * 소개 문구는 처음 한 번만 필요하고, 그 뒤로는 방해물이다.
 */
const SEEN_KEY = "aioffice:seen-landing";

function initialView(): View {
  try {
    return localStorage.getItem(SEEN_KEY) ? { kind: "start" } : { kind: "landing" };
  } catch {
    // 시크릿 모드 등에서 접근이 막히면 랜딩을 보여 준다.
    return { kind: "landing" };
  }
}

const SAMPLE = {
  name: "넬리아랩",
  description:
    "국내 중소 제조업체를 대상으로 재고 관리 SaaS를 만듭니다. 월 구독 모델이고 현재는 창업자 1인 체제입니다.",
};

export default function App() {
  const [view, setView] = useState<View>(initialView);
  const [org, setOrg] = useState<DepartmentSpec[]>([]);
  const [health, setHealth] = useState<Health | null>(null);

  // 폼과 에러는 App이 들고 있어야 한다. 설립 화면으로 넘어가는 동안
  // StartScreen이 언마운트되기 때문에, 거기 두면 실패 메시지가 사라진다.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.org().then((r) => setOrg(r.departments)).catch(() => setOrg([]));
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  function enterApp() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // 저장에 실패해도 이번 세션 이동은 막지 않는다.
    }
    setView({ kind: "start" });
  }

  async function found(demo: boolean) {
    const useName = name.trim() || (demo ? SAMPLE.name : "");
    const useDescription = description.trim() || (demo ? SAMPLE.description : "");
    setError(null);
    setView({ kind: "founding", name: useName, demo });

    const startedAt = Date.now();
    try {
      const result = await api.foundCompany(useName, useDescription, demo);
      // 데모는 즉시 끝나기 때문에 설립 화면이 한 프레임도 보이지 않는다.
      // 화면을 확인할 수 있도록 최소 노출 시간을 준다.
      const elapsed = Date.now() - startedAt;
      if (demo && elapsed < 1600) {
        await new Promise((resolve) => setTimeout(resolve, 1600 - elapsed));
      }
      setView({ kind: "company", id: result.companyId });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setView({ kind: "start" });
    }
  }

  // 랜딩은 자체 헤더와 푸터를 가진 독립 화면이라 앱 크롬을 씌우지 않는다.
  if (view.kind === "landing") return <LandingPage onEnterApp={enterApp} />;

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setView({ kind: "start" })}>
          AI<span>OFFICE</span>
        </button>
        <span className="badge-ceo">대표이사</span>
      </header>

      {view.kind === "start" && (
        <StartScreen
          name={name}
          description={description}
          error={error}
          health={health}
          onName={setName}
          onDescription={setDescription}
          onFound={found}
          onOpen={(id) => setView({ kind: "company", id })}
        />
      )}
      {view.kind === "founding" && <FoundingScreen name={view.name} demo={view.demo} />}
      {view.kind === "company" && <CompanyScreen id={view.id} org={org} />}
    </div>
  );
}

function StartScreen({
  name,
  description,
  error,
  health,
  onName,
  onDescription,
  onFound,
  onOpen,
}: {
  name: string;
  description: string;
  error: string | null;
  health: Health | null;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onFound: (demo: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    api.listCompanies().then((r) => setCompanies(r.companies)).catch(() => {});
  }, []);

  // 회사를 지우면 부서·에이전트·업무 기록이 함께 사라지고 되돌릴 수 없다.
  // 목록에서 여는 버튼 바로 옆에 있는 버튼이므로 반드시 한 번 되묻는다.
  async function remove(id: string, name: string) {
    const ok = window.confirm(
      `'${name}'을(를) 삭제할까요?\n\n부서·에이전트·업무 기록이 모두 사라지며 되돌릴 수 없습니다.`,
    );
    if (!ok) return;
    await api.deleteCompany(id).catch(() => {});
    setCompanies((list) => list.filter((c) => c.id !== id));
  }

  const noKey = health !== null && !health.credentials;

  return (
    <main className="start">
      <h1 className="hero">회사를 세우세요</h1>
      <p className="hero-sub">
        회사명과 사업 내용을 입력하면 AI 에이전트들이 부서를 구성하고 각자의 업무를 시작합니다.
      </p>

      {noKey && (
        <div className="banner">
          <strong>API 키가 없습니다</strong>
          <p>
            실제 분석은 Claude 호출이 필요합니다. 지금은 <b>데모로 둘러보기</b>로 전체 화면과
            흐름을 확인할 수 있습니다. 데모 데이터는 AI가 만든 것이 아닙니다.
          </p>
        </div>
      )}

      <form
        className="panel found-form"
        onSubmit={(event) => {
          event.preventDefault();
          onFound(false);
        }}
      >
        <label>
          회사명
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder={SAMPLE.name}
            maxLength={100}
          />
        </label>
        <label>
          어떤 회사인가요?
          <textarea
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            placeholder={SAMPLE.description}
            rows={5}
            maxLength={4000}
          />
          <small>{description.length}자 · 구체적일수록 조직이 정확해집니다</small>
        </label>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="submit" disabled={name.trim().length === 0 || description.trim().length < 10}>
            창업하기
          </button>
          <button type="button" className="ghost-btn" onClick={() => onFound(true)}>
            데모로 둘러보기
          </button>
        </div>
        <small className="hint">
          데모는 API 키 없이 즉시 실행되며, 비워두면 예시 회사로 채워집니다.
        </small>
      </form>

      {companies.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">기존 회사</h2>
          <ul className="company-list">
            {companies.map((company) => (
              <li key={company.id}>
                <button onClick={() => onOpen(company.id)}>
                  <strong>{company.name}</strong>
                  <span>{company.industry || "분석 중"}</span>
                </button>
                <button
                  className="delete-btn"
                  aria-label={`${company.name} 삭제`}
                  onClick={() => remove(company.id, company.name)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

const FOUNDING_STEPS = [
  "사업자등록 서류를 검토하는 중",
  "업종과 수익 모델을 분석하는 중",
  "필요한 부서를 선별하는 중",
  "팀장들을 채용하는 중",
  "팀원들을 배치하는 중",
  "각자의 첫 업무를 배정하는 중",
];

function FoundingScreen({ name, demo }: { name: string; demo: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = demo ? 260 : 4000;
    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, FOUNDING_STEPS.length - 1)),
      interval,
    );
    return () => clearInterval(timer);
  }, [demo]);

  return (
    <main className="founding">
      <div className="panel founding-panel">
        <h1>
          {name || "새 회사"} 설립 중{demo && <span className="demo-tag">DEMO</span>}
        </h1>
        <ol className="steps">
          {FOUNDING_STEPS.map((label, index) => (
            <li key={label} data-state={index < step ? "done" : index === step ? "active" : "wait"}>
              {label}
            </li>
          ))}
        </ol>
        <p className="hint">
          {demo
            ? "데모 데이터로 조직을 구성하고 있습니다."
            : "에이전트들이 실제로 분석하고 있습니다. 1분 정도 걸립니다."}
        </p>
      </div>
    </main>
  );
}

function CompanyScreen({ id, org }: { id: string; org: DepartmentSpec[] }) {
  const [state, setState] = useState<CompanyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 오피스가 기본 화면이다. 조직도와 연동은 참고·설정용으로 뒤에 둔다.
  const [tab, setTab] = useState<"office" | "reports" | "org" | "providers">("office");

  useEffect(() => {
    setState(null);
    api
      .getCompany(id)
      .then(setState)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  const specs = useMemo(() => new Map(org.map((d) => [d.id, d])), [org]);
  // 보고서 목록은 부서 id만 들고 있으므로 표시용 이름을 따로 넘겨준다.
  const departmentNames = useMemo(
    () => new Map(org.map((d) => [d.id, { name: d.name, emoji: d.emoji }])),
    [org],
  );

  if (error) return <main className="start"><p className="error">{error}</p></main>;
  if (!state) return <main className="start"><p className="hint">불러오는 중…</p></main>;

  const { company, departments, agents, tasks } = state;
  const active = departments.filter((d) => d.active);
  const inactive = departments.filter((d) => !d.active);

  return (
    <main className="company">
      <section className="panel company-head">
        <h1>{company.name}</h1>
        <div className="tags">
          <span className="tag">{company.industry}</span>
          <span className="tag ghost">{company.business_model}</span>
        </div>
        <p className="summary">{company.summary}</p>
        <div className="stats">
          <div><strong>{active.length}</strong><span>부서</span></div>
          <div><strong>{agents.length}</strong><span>에이전트</span></div>
          <div><strong>{tasks.length}</strong><span>진행 업무</span></div>
        </div>
      </section>

      <nav className="tabs">
        <button
          type="button"
          className={tab === "office" ? "tab on" : "tab"}
          onClick={() => setTab("office")}
        >
          🏢 오피스
        </button>
        <button
          type="button"
          className={tab === "reports" ? "tab on" : "tab"}
          onClick={() => setTab("reports")}
        >
          📄 업무·보고서
        </button>
        <button
          type="button"
          className={tab === "org" ? "tab on" : "tab"}
          onClick={() => setTab("org")}
        >
          📋 조직도
        </button>
        <button
          type="button"
          className={tab === "providers" ? "tab on" : "tab"}
          onClick={() => setTab("providers")}
        >
          🔌 모델 연동
        </button>
      </nav>

      {tab === "office" && <OfficeView companyId={id} />}
      {tab === "reports" && (
        <ReportsView companyId={id} departmentNames={departmentNames} />
      )}
      {tab === "providers" && <ProviderSettings companyId={id} />}

      {tab === "org" && (
      <div className="dept-grid">
        {active.map((dept) => (
          <DepartmentCard
            key={dept.id}
            spec={specs.get(dept.id)}
            mission={dept.mission}
            agents={agents.filter((a) => a.department_id === dept.id)}
            tasks={tasks.filter((t) => t.department_id === dept.id)}
          />
        ))}
      </div>
      )}

      {tab === "org" && inactive.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">이 회사에 두지 않은 부서</h2>
          <ul className="inactive-list">
            {inactive.map((dept) => (
              <li key={dept.id}>
                <strong>
                  {specs.get(dept.id)?.emoji} {specs.get(dept.id)?.name ?? dept.id}
                </strong>
                <span>{dept.reason || "이 사업에는 필요하지 않습니다"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function DepartmentCard({
  spec,
  mission,
  agents,
  tasks,
}: {
  spec: DepartmentSpec | undefined;
  mission: string;
  agents: Agent[];
  tasks: Task[];
}) {
  if (!spec) return null;

  const roleById = new Map(spec.roles.map((r) => [r.id, r]));
  const taskByAgent = new Map(tasks.map((t) => [t.agent_id, t]));
  const ordered = [...agents].sort((a, b) => {
    const aLead = roleById.get(a.role_id)?.seniority === "lead" ? 0 : 1;
    const bLead = roleById.get(b.role_id)?.seniority === "lead" ? 0 : 1;
    return aLead - bLead;
  });

  return (
    <article className="panel dept" style={{ ["--dept" as string]: spec.color }}>
      <header className="dept-head">
        <span className="dept-emoji">{spec.emoji}</span>
        <div>
          <h2>{spec.name}</h2>
          <small>{spec.nameEn}</small>
        </div>
      </header>
      <p className="dept-mission">{mission}</p>

      <ul className="roster">
        {ordered.map((agent) => {
          const role = roleById.get(agent.role_id);
          const task = taskByAgent.get(agent.id);
          const isLead = role?.seniority === "lead";
          return (
            <li key={agent.id} className={isLead ? "person lead" : "person"}>
              <div className="avatar" aria-hidden="true">{isLead ? "★" : "▪"}</div>
              <div className="person-body">
                <div className="person-name">
                  <strong>{agent.name}</strong>
                  <span className="role-title">{role?.title ?? agent.role_id}</span>
                </div>
                <p className="persona">{agent.persona}</p>
                {task && <p className="task">▸ {task.title}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
