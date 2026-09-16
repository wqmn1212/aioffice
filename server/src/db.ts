import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "aioffice.sqlite"));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS companies (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    description    TEXT NOT NULL,
    industry       TEXT NOT NULL DEFAULT '',
    business_model TEXT NOT NULL DEFAULT '',
    summary        TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS departments (
    company_id    TEXT NOT NULL,
    department_id TEXT NOT NULL,
    active        INTEGER NOT NULL,
    reason        TEXT NOT NULL DEFAULT '',
    mission       TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (company_id, department_id)
  );

  CREATE TABLE IF NOT EXISTS agents (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL,
    department_id TEXT NOT NULL,
    role_id       TEXT NOT NULL,
    name          TEXT NOT NULL,
    persona       TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'idle'
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL,
    department_id TEXT NOT NULL,
    agent_id      TEXT NOT NULL,
    title         TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'todo',
    output        TEXT,
    created_at    TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_agents_company ON agents (company_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks (company_id);

  -- 팀이 연동한 모델 제공자. 키는 봉해서(secretbox) 넣고 평문은 두지 않는다.
  -- masked는 화면에 "어떤 키를 넣었는지" 알아보게 하려는 용도이며, 이 값만
  -- 밖으로 나간다. sealed_key는 어떤 API 응답에도 포함되지 않는다.
  CREATE TABLE IF NOT EXISTS credentials (
    company_id TEXT NOT NULL,
    provider   TEXT NOT NULL,
    sealed_key TEXT NOT NULL,
    masked     TEXT NOT NULL,
    model      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (company_id, provider)
  );

  -- 사전 가입(대기자) 명단. 계정·과금이 붙기 전까지 수요를 받는 창구다.
  -- 이메일은 UNIQUE라 같은 사람이 여러 번 눌러도 한 줄만 남는다.
  CREATE TABLE IF NOT EXISTS waitlist (
    id         TEXT PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,
    channels   TEXT NOT NULL DEFAULT '',
    plan       TEXT NOT NULL DEFAULT '',
    note       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
`);

// 오피스 시계. 부서마다 회의 주기를 어긋나게 하려면 회사 단위의 단조 증가
// 카운터가 필요하다. 기존 DB에도 붙여야 하므로 ALTER로 더한다.
// (CREATE TABLE IF NOT EXISTS는 이미 있는 테이블에 컬럼을 추가하지 않는다.)
try {
  db.exec(`ALTER TABLE companies ADD COLUMN tick INTEGER NOT NULL DEFAULT 0`);
} catch {
  // 이미 있는 컬럼이다. node:sqlite는 여기서만 던지므로 삼켜도 안전하다.
}

// 업무 실행 기록. 어떤 제공자·모델로 돌렸고 토큰을 얼마나 썼는지 남긴다.
// 건당 원가를 모르면 요금을 정할 수 없으므로 실행기와 같이 들어가야 한다.
for (const column of [
  `provider TEXT NOT NULL DEFAULT ''`,
  `model TEXT NOT NULL DEFAULT ''`,
  `input_tokens INTEGER`,
  `output_tokens INTEGER`,
  `ran_at TEXT`,
  `error TEXT`,
]) {
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN ${column}`);
  } catch {
    // 이미 있는 컬럼.
  }
}

export interface CompanyRow {
  id: string;
  name: string;
  description: string;
  industry: string;
  business_model: string;
  summary: string;
  created_at: string;
}

export interface DepartmentRow {
  company_id: string;
  department_id: string;
  active: number;
  reason: string;
  mission: string;
}

export interface AgentRow {
  id: string;
  company_id: string;
  department_id: string;
  role_id: string;
  name: string;
  persona: string;
  status: string;
}

export interface TaskRow {
  id: string;
  company_id: string;
  department_id: string;
  agent_id: string;
  title: string;
  status: string;
  output: string | null;
  created_at: string;
  provider: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  ran_at: string | null;
  error: string | null;
}

export const queries = {
  insertCompany: db.prepare(
    `INSERT INTO companies (id, name, description, industry, business_model, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  updateCompanyAnalysis: db.prepare(
    `UPDATE companies SET industry = ?, business_model = ?, summary = ? WHERE id = ?`,
  ),
  getCompany: db.prepare(`SELECT * FROM companies WHERE id = ?`),
  listCompanies: db.prepare(`SELECT * FROM companies ORDER BY created_at DESC`),

  upsertDepartment: db.prepare(
    `INSERT INTO departments (company_id, department_id, active, reason, mission)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (company_id, department_id)
     DO UPDATE SET active = excluded.active, reason = excluded.reason, mission = excluded.mission`,
  ),
  listDepartments: db.prepare(`SELECT * FROM departments WHERE company_id = ?`),

  insertAgent: db.prepare(
    `INSERT INTO agents (id, company_id, department_id, role_id, name, persona, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  listAgents: db.prepare(`SELECT * FROM agents WHERE company_id = ?`),

  insertTask: db.prepare(
    `INSERT INTO tasks (id, company_id, department_id, agent_id, title, status, output, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  listTasks: db.prepare(`SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at`),
  setTaskStatus: db.prepare(`UPDATE tasks SET status = ? WHERE id = ?`),
  setTaskTitle: db.prepare(`UPDATE tasks SET title = ? WHERE id = ?`),
  deleteTask: db.prepare(`DELETE FROM tasks WHERE id = ?`),
  updateAgentStatus: db.prepare(`UPDATE agents SET status = ? WHERE id = ?`),
  bumpTick: db.prepare(`UPDATE companies SET tick = tick + 1 WHERE id = ?`),
  getTick: db.prepare(`SELECT tick FROM companies WHERE id = ?`),

  // 같은 이메일로 다시 신청하면 최신 응답으로 갱신한다. 두 번 눌렀다고
  // 에러를 보여 주면 이미 신청한 사람이 실패했다고 오해한다.
  upsertCredential: db.prepare(
    `INSERT INTO credentials (company_id, provider, sealed_key, masked, model, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (company_id, provider)
     DO UPDATE SET sealed_key = excluded.sealed_key, masked = excluded.masked,
                   model = excluded.model`,
  ),
  // 목록 조회에는 sealed_key를 절대 포함하지 않는다. 실수로 응답에 실리는
  // 경로를 아예 만들지 않기 위해 쿼리 단계에서 빼 둔다.
  listCredentials: db.prepare(
    `SELECT provider, masked, model, created_at FROM credentials WHERE company_id = ?`,
  ),
  getCredential: db.prepare(
    `SELECT sealed_key, model FROM credentials WHERE company_id = ? AND provider = ?`,
  ),
  deleteCredential: db.prepare(`DELETE FROM credentials WHERE company_id = ? AND provider = ?`),
  deleteCompanyCredentials: db.prepare(`DELETE FROM credentials WHERE company_id = ?`),

  getTask: db.prepare(`SELECT * FROM tasks WHERE id = ? AND company_id = ?`),

  // 목록에는 본문(output)을 싣지 않는다. 보고서 수십 건의 본문을 한 번에
  // 내리면 목록 화면이 느려지고, 대부분은 열어 보지도 않는다.
  listReports: db.prepare(
    `SELECT t.id, t.title, t.status, t.department_id, t.created_at, t.ran_at,
            t.provider, t.model, t.input_tokens, t.output_tokens, t.error,
            a.name AS agent_name, a.role_id,
            CASE WHEN t.output IS NULL OR t.output = '' THEN 0 ELSE 1 END AS has_output
     FROM tasks t
     LEFT JOIN agents a ON a.id = t.agent_id
     WHERE t.company_id = ?
     ORDER BY COALESCE(t.ran_at, t.created_at) DESC`,
  ),
  getReport: db.prepare(
    `SELECT t.*, a.name AS agent_name, a.role_id
     FROM tasks t
     LEFT JOIN agents a ON a.id = t.agent_id
     WHERE t.id = ? AND t.company_id = ?`,
  ),
  saveTaskRun: db.prepare(
    `UPDATE tasks SET status = ?, output = ?, provider = ?, model = ?,
                      input_tokens = ?, output_tokens = ?, ran_at = ?, error = ?
     WHERE id = ?`,
  ),

  upsertWaitlist: db.prepare(
    `INSERT INTO waitlist (id, email, channels, plan, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (email)
     DO UPDATE SET channels = excluded.channels, plan = excluded.plan, note = excluded.note`,
  ),
  countWaitlist: db.prepare(`SELECT COUNT(*) AS n FROM waitlist`),

  deleteCompany: db.prepare(`DELETE FROM companies WHERE id = ?`),
  deleteCompanyDepartments: db.prepare(`DELETE FROM departments WHERE company_id = ?`),
  deleteCompanyAgents: db.prepare(`DELETE FROM agents WHERE company_id = ?`),
  deleteCompanyTasks: db.prepare(`DELETE FROM tasks WHERE company_id = ?`),
};
