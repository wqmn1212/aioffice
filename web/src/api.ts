export interface RoleSpec {
  id: string;
  title: string;
  seniority: "lead" | "member";
  mission: string;
  model: string;
  sprite: string;
}

export interface DepartmentSpec {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  color: string;
  mission: string;
  optional: boolean;
  mcpProfile: string[];
  roles: RoleSpec[];
}

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  business_model: string;
  summary: string;
  created_at: string;
}

export interface Agent {
  id: string;
  company_id: string;
  department_id: string;
  role_id: string;
  name: string;
  persona: string;
  status: string;
}

export interface Task {
  id: string;
  department_id: string;
  agent_id: string;
  title: string;
  status: string;
  output: string | null;
}

export interface DepartmentState extends Partial<DepartmentSpec> {
  id: string;
  active: boolean;
  reason: string;
  mission: string;
}

export interface CompanyState {
  company: Company;
  departments: DepartmentState[];
  agents: Agent[];
  tasks: Task[];
}

export interface FoundingResult {
  companyId: string;
  demo: boolean;
  activeDepartments: string[];
  failedDepartments: { departmentId: string; error: string }[];
}

export interface Health {
  ok: boolean;
  credentials: boolean;
}

export type Provider = "anthropic" | "openai" | "gemini";

export interface ProviderInfo {
  id: Provider;
  label: string;
  console: string;
  keyHint: string;
  defaultModel: string;
  models: string[];
}

/** 화면이 받는 자격증명 정보. 키 자체는 절대 내려오지 않는다. */
export interface CredentialInfo {
  provider: Provider;
  masked: string;
  model: string;
  created_at: string;
}

export interface RunResult {
  taskId: string;
  output: string;
  provider: Provider;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface UsageSummary {
  runs: number;
  inputTokens: number;
  outputTokens: number;
  byProvider: Record<string, number>;
}

/** 목록용 요약. 본문(output)은 들어 있지 않다. */
export interface ReportSummary {
  id: string;
  title: string;
  status: string;
  department_id: string;
  created_at: string;
  ran_at: string | null;
  provider: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  error: string | null;
  agent_name: string | null;
  role_id: string | null;
  has_output: number;
}

export interface ReportDetail extends ReportSummary {
  output: string | null;
  agent_id: string;
}

export type Activity = "working" | "meeting" | "resting";

export interface OfficeAgent {
  id: string;
  departmentId: string;
  roleId: string;
  name: string;
  seniority: "lead" | "member";
  title: string;
  sprite: string;
  activity: Activity;
  currentTask: string | null;
  currentTaskId: string | null;
}

export interface OfficeDepartment {
  id: string;
  name: string;
  emoji: string;
  color: string;
  inMeeting: boolean;
  agenda: string[];
}

export interface OfficeState {
  departments: OfficeDepartment[];
  agents: OfficeAgent[];
  ceoVisiting: string | null;
  counts: { working: number; meeting: number; resting: number };
  tick: number;
  openTasks: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `요청 실패 (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("/api/health"),
  org: () => request<{ departments: DepartmentSpec[] }>("/api/org"),
  listCompanies: () => request<{ companies: Company[] }>("/api/companies"),
  getCompany: (id: string) => request<CompanyState>(`/api/companies/${id}`),
  deleteCompany: (id: string) =>
    request<{ ok: boolean }>(`/api/companies/${id}`, { method: "DELETE" }),
  waitlistCount: () => request<{ count: number }>("/api/waitlist/count"),
  joinWaitlist: (payload: {
    email: string;
    channels?: string[];
    plan?: string;
    note?: string;
  }) =>
    request<{ ok: boolean; position: number }>("/api/waitlist", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  providerCatalog: () =>
    request<{ providers: ProviderInfo[]; secretReady: boolean }>("/api/providers"),
  credentials: (id: string) =>
    request<{ credentials: CredentialInfo[] }>(`/api/companies/${id}/providers`),
  saveCredential: (
    id: string,
    payload: { provider: Provider; apiKey: string; model?: string; verify?: boolean },
  ) =>
    request<{ ok: boolean; credentials: CredentialInfo[] }>(`/api/companies/${id}/providers`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCredential: (id: string, provider: Provider) =>
    request<{ ok: boolean; credentials: CredentialInfo[] }>(
      `/api/companies/${id}/providers/${provider}`,
      { method: "DELETE" },
    ),
  runTask: (id: string, taskId: string, provider?: Provider) =>
    request<RunResult>(`/api/companies/${id}/tasks/${taskId}/run`, {
      method: "POST",
      body: JSON.stringify(provider ? { provider } : {}),
    }),
  usage: (id: string) => request<UsageSummary>(`/api/companies/${id}/usage`),
  reports: (id: string) => request<{ reports: ReportSummary[] }>(`/api/companies/${id}/reports`),
  report: (id: string, taskId: string) =>
    request<ReportDetail>(`/api/companies/${id}/reports/${taskId}`),
  seedDemoReports: (id: string) =>
    request<{ created: number; skipped: boolean; reports: ReportSummary[] }>(
      `/api/companies/${id}/reports/demo`,
      { method: "POST" },
    ),
  clearDemoReports: (id: string) =>
    request<{ removed: number; reports: ReportSummary[] }>(`/api/companies/${id}/reports/demo`, {
      method: "DELETE",
    }),
  office: (id: string) => request<OfficeState>(`/api/companies/${id}/office`),
  tick: (id: string) => request<OfficeState>(`/api/companies/${id}/tick`, { method: "POST" }),
  order: (id: string, departmentId: string, title: string) =>
    request<{ taskId: string }>(`/api/companies/${id}/orders`, {
      method: "POST",
      body: JSON.stringify({ departmentId, title }),
    }),
  foundCompany: (name: string, description: string, demo: boolean) =>
    request<FoundingResult>("/api/companies", {
      method: "POST",
      body: JSON.stringify({ name, description, demo }),
    }),
};
