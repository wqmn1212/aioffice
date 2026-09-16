/**
 * 오피스 상태 계산.
 *
 * 캐릭터의 활동은 저장하지 않고 업무(tasks)에서 파생시킨다. 활동을 따로
 * 저장하면 업무 상태와 어긋난 화면이 나올 수 있는데, 파생시키면 그럴 수 없다.
 * agents.status는 이 계산 결과를 반영해 동기화만 해 둔다(외부 조회용).
 *
 * 규칙은 세 줄이 전부다:
 *   1. 부서에 검토(review) 대기 업무가 있으면 그 부서 전원이 회의 중이다.
 *   2. 아니면 자기 앞으로 진행(doing) 업무가 있는 사람은 자리에서 일한다.
 *   3. 나머지는 휴게실에 있다.
 */

import { randomUUID } from "node:crypto";
import { db, queries, type AgentRow, type TaskRow } from "./db.js";
import { DEPARTMENTS_BY_ID, leadOf } from "./org.js";

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
  /** 지금 붙들고 있는 업무. 말풍선에 띄운다. */
  currentTask: string | null;
  /** 그 업무의 id. 화면에서 바로 실행을 걸 수 있게 함께 내린다. */
  currentTaskId: string | null;
}

export interface OfficeDepartment {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** 이 부서가 회의 중인지. 회의실 조명과 대표 동선에 쓴다. */
  inMeeting: boolean;
  /** 회의 안건 = 검토 대기 중인 업무 제목들. */
  agenda: string[];
}

export interface OfficeState {
  departments: OfficeDepartment[];
  agents: OfficeAgent[];
  /** 대표가 들여다볼 회의. 없으면 대표실에 있다. */
  ceoVisiting: string | null;
  counts: { working: number; meeting: number; resting: number };
  tick: number;
}

const ACTIVE = new Set(["todo", "doing", "review"]);

/**
 * 부서가 몇 tick마다 회의를 소집하는지, 그리고 부서마다 그 주기를 얼마나
 * 어긋나게 둘지. 전부 같은 tick에 회의에 들어가면 사무실이 아니라 군무처럼
 * 보이므로, 부서 id에서 고정 오프셋을 뽑아 서로 다른 박자로 움직이게 한다.
 */
const MEETING_EVERY = 3;

function meetingOffset(departmentId: string): number {
  let hash = 0;
  for (const ch of departmentId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % MEETING_EVERY;
}

function currentTick(companyId: string): number {
  const row = queries.getTick.get(companyId) as { tick?: number } | undefined;
  return row?.tick ?? 0;
}

// node:sqlite는 Record<string, SQLOutputValue>를 돌려준다. 스키마상 행 모양이
// 보장되므로 여기서 한 번만 좁혀 두고, 아래에서는 행 타입으로 다룬다.
function agentRows(companyId: string): AgentRow[] {
  return queries.listAgents.all(companyId) as unknown as AgentRow[];
}

function taskRows(companyId: string): TaskRow[] {
  return queries.listTasks.all(companyId) as unknown as TaskRow[];
}

/** 회의 중인 부서 = 검토 대기 업무를 가진 부서. */
function meetingDepartments(tasks: TaskRow[]): Map<string, TaskRow[]> {
  const agenda = new Map<string, TaskRow[]>();
  for (const task of tasks) {
    if (task.status !== "review") continue;
    const list = agenda.get(task.department_id) ?? [];
    list.push(task);
    agenda.set(task.department_id, list);
  }
  return agenda;
}

export function computeOffice(companyId: string): OfficeState | null {
  const company = queries.getCompany.get(companyId);
  if (!company) return null;

  const agents = agentRows(companyId);
  const tasks = taskRows(companyId);
  const agenda = meetingDepartments(tasks);

  const doingByAgent = new Map<string, TaskRow>();
  for (const task of tasks) {
    if (task.status === "doing" && !doingByAgent.has(task.agent_id)) {
      doingByAgent.set(task.agent_id, task);
    }
  }

  const officeAgents: OfficeAgent[] = [];
  for (const agent of agents) {
    const spec = DEPARTMENTS_BY_ID.get(agent.department_id);
    const role = spec?.roles.find((r) => r.id === agent.role_id);
    if (!spec || !role) continue; // 카탈로그에서 사라진 역할은 그리지 않는다.

    const meeting = agenda.has(agent.department_id);
    const doing = doingByAgent.get(agent.id);
    const activity: Activity = meeting ? "meeting" : doing ? "working" : "resting";
    // 회의 중이면 안건(검토 대기) 첫 건, 아니면 자기가 붙들고 있는 업무.
    const focus = meeting ? agenda.get(agent.department_id)?.[0] : doing;

    officeAgents.push({
      id: agent.id,
      departmentId: agent.department_id,
      roleId: agent.role_id,
      name: agent.name,
      seniority: role.seniority,
      title: role.title,
      sprite: role.sprite,
      activity,
      currentTask: focus?.title ?? null,
      currentTaskId: focus?.id ?? null,
    });
  }

  // 화면에 그릴 부서 = 실제로 사람이 앉아 있는 부서.
  const staffed = [...new Set(officeAgents.map((a) => a.departmentId))];
  const departments: OfficeDepartment[] = staffed.flatMap((id) => {
    const spec = DEPARTMENTS_BY_ID.get(id);
    if (!spec) return [];
    return [
      {
        id,
        name: spec.name,
        emoji: spec.emoji,
        color: spec.color,
        inMeeting: agenda.has(id),
        agenda: (agenda.get(id) ?? []).map((task) => task.title),
      },
    ];
  });

  const counts = { working: 0, meeting: 0, resting: 0 };
  for (const a of officeAgents) counts[a.activity] += 1;

  return {
    departments,
    agents: officeAgents,
    ceoVisiting: departments.find((d) => d.inMeeting)?.id ?? null,
    counts,
    tick: currentTick(companyId),
  };
}

/**
 * 오피스를 한 스텝 진행시킨다. 부서마다 독립적으로 돌며, 한 번의 tick에서
 * 같은 업무가 두 단계 넘어가지 않도록 단계별로 분리해 처리한다.
 *
 *   검토 끝 → 완료 → (회의 해산)
 *   진행 중 가장 오래된 것 하나 → 검토 (회의 소집)
 *   놀고 있는 사람 → 대기 업무 착수
 */
export function tickOffice(companyId: string): OfficeState | null {
  const company = queries.getCompany.get(companyId);
  if (!company) return null;

  const agents = agentRows(companyId);
  const tasks = taskRows(companyId);
  const byDepartment = new Map<string, TaskRow[]>();
  for (const task of tasks) {
    const list = byDepartment.get(task.department_id) ?? [];
    list.push(task);
    byDepartment.set(task.department_id, list);
  }

  const nextTick = currentTick(companyId) + 1;

  db.exec("BEGIN");
  try {
    queries.bumpTick.run(companyId);

    for (const [departmentId, deptTasks] of byDepartment) {
      const reviewing = deptTasks.filter((t) => t.status === "review");

      if (reviewing.length > 0) {
        // 회의가 끝났다. 검토 대기를 모두 완료로 넘긴다.
        for (const task of reviewing) queries.setTaskStatus.run("done", task.id);
      } else if ((nextTick + meetingOffset(departmentId)) % MEETING_EVERY === 0) {
        // 이 부서의 회의 차례다. 가장 먼저 착수한 업무를 검토에 올린다.
        const oldest = deptTasks.filter((t) => t.status === "doing")[0];
        if (oldest) queries.setTaskStatus.run("review", oldest.id);
      }

      // 손이 빈 사람에게 대기 업무를 하나씩 쥐여 준다.
      const busy = new Set(
        deptTasks.filter((t) => t.status === "doing").map((t) => t.agent_id),
      );
      for (const task of deptTasks) {
        if (task.status !== "todo" || busy.has(task.agent_id)) continue;
        queries.setTaskStatus.run("doing", task.id);
        busy.add(task.agent_id);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const office = computeOffice(companyId);
  if (office) syncAgentStatus(agents, office);
  return office;
}

/** 파생된 활동을 agents.status에 반영한다. 화면은 이 값을 쓰지 않는다. */
function syncAgentStatus(agents: AgentRow[], office: OfficeState): void {
  const activityById = new Map(office.agents.map((a) => [a.id, a.activity]));
  db.exec("BEGIN");
  try {
    for (const agent of agents) {
      const next = activityById.get(agent.id);
      if (next && next !== agent.status) queries.updateAgentStatus.run(next, agent.id);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * 대표의 업무 지시. 부서 팀장 앞으로 대기 업무를 만든다.
 * 실제 착수는 다음 tick에서 일어난다 — 지시가 바로 실행되지 않고
 * 한 박자 뒤에 움직이는 편이 조직처럼 보인다.
 */
export function issueOrder(
  companyId: string,
  departmentId: string,
  title: string,
): { taskId: string } | null {
  const company = queries.getCompany.get(companyId);
  if (!company) return null;

  const spec = DEPARTMENTS_BY_ID.get(departmentId);
  if (!spec) return null;

  const agents = agentRows(companyId);
  const leadRoleId = leadOf(spec).id;
  const lead = agents.find(
    (a) => a.department_id === departmentId && a.role_id === leadRoleId,
  );
  if (!lead) return null;

  const taskId = randomUUID();
  queries.insertTask.run(
    taskId,
    companyId,
    departmentId,
    lead.id,
    title,
    "todo",
    null,
    new Date().toISOString(),
  );
  return { taskId };
}

/** 아직 끝나지 않은 업무 수. 화면 상단 지표에 쓴다. */
export function openTaskCount(companyId: string): number {
  const tasks = taskRows(companyId);
  return tasks.filter((t) => ACTIVE.has(t.status)).length;
}
