import { randomUUID } from "node:crypto";
import { db, queries } from "./db.js";
import {
  analyzeCompany,
  staffDepartment,
  type CompanyAnalysisResult,
  type DepartmentStaffingResult,
} from "./blueprint.js";
import { analyzeCompanyDemo, staffDepartmentDemo, createNameAllocator } from "./demo.js";
import { DEPARTMENTS, DEPARTMENTS_BY_ID, findRole, type DepartmentSpec } from "./org.js";

export interface FoundingResult {
  companyId: string;
  demo: boolean;
  activeDepartments: string[];
  failedDepartments: { departmentId: string; error: string }[];
}

interface StaffedDepartment {
  spec: DepartmentSpec;
  staffing: DepartmentStaffingResult;
}

/** 모델 출력은 신뢰 경계다. 필수 부서는 모델 판단과 무관하게 활성화한다. */
function selectDepartments(analysis: CompanyAnalysisResult) {
  const decisions = new Map(analysis.departments.map((d) => [d.departmentId, d]));
  return DEPARTMENTS.map((spec) => ({
    spec,
    active: spec.optional ? (decisions.get(spec.id)?.active ?? false) : true,
    reason: decisions.get(spec.id)?.reason ?? "",
  }));
}

/**
 * 회사를 설립한다: 사업 설명을 분석해 부서를 선별하고, 활성 부서마다
 * 팀장 1명과 팀원 3명을 배치한 뒤 각자의 첫 업무를 만든다.
 *
 * 생성이 모두 끝난 뒤에 한 번의 트랜잭션으로 저장한다. 중간에 실패하면
 * 껍데기 회사가 남지 않는다.
 */
export async function foundCompany(
  name: string,
  description: string,
  options: { demo: boolean },
): Promise<FoundingResult> {
  const analysis = options.demo
    ? analyzeCompanyDemo(name, description)
    : await analyzeCompany(name, description);

  const selection = selectDepartments(analysis);
  const active = selection.filter((d) => d.active).map((d) => d.spec);
  const company = { name, description, industry: analysis.industry };

  const staffed: StaffedDepartment[] = [];
  const failedDepartments: FoundingResult["failedDepartments"] = [];

  if (options.demo) {
    const nextName = createNameAllocator();
    for (const spec of active) {
      staffed.push({ spec, staffing: staffDepartmentDemo(company, spec, nextName) });
    }
  } else {
    const settled = await Promise.allSettled(active.map((spec) => staffDepartment(company, spec)));
    for (const [index, outcome] of settled.entries()) {
      const spec = active[index];
      if (!spec) continue;
      if (outcome.status === "fulfilled") {
        staffed.push({ spec, staffing: outcome.value });
      } else {
        failedDepartments.push({
          departmentId: spec.id,
          error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
        });
      }
    }
  }

  const companyId = randomUUID();
  const now = new Date().toISOString();
  const staffedIds = new Set(staffed.map((s) => s.spec.id));

  db.exec("BEGIN");
  try {
    queries.insertCompany.run(
      companyId,
      name,
      description,
      analysis.industry,
      analysis.businessModel,
      analysis.summary,
      now,
    );

    const staffingBySpec = new Map(staffed.map((s) => [s.spec.id, s.staffing]));

    for (const { spec, active: isActive, reason } of selection) {
      // 배치에 실패한 부서는 비활성으로 남긴다.
      const staffing = staffingBySpec.get(spec.id);
      const finallyActive = isActive && staffing !== undefined;
      queries.upsertDepartment.run(
        companyId,
        spec.id,
        finallyActive ? 1 : 0,
        finallyActive || !isActive ? reason : "인력 배치에 실패했습니다",
        staffing?.mission ?? spec.mission,
      );
    }

    for (const { spec, staffing } of staffed) {
      for (const assignment of staffing.roles) {
        // 모델이 만들어낸 roleId는 카탈로그에 있는 것만 받아들인다.
        if (!findRole(spec.id, assignment.roleId)) continue;

        const agentId = randomUUID();
        queries.insertAgent.run(
          agentId,
          companyId,
          spec.id,
          assignment.roleId,
          assignment.name,
          assignment.persona,
          "idle",
        );
        queries.insertTask.run(
          randomUUID(),
          companyId,
          spec.id,
          agentId,
          assignment.firstTask,
          "todo",
          null,
          now,
        );
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return {
    companyId,
    demo: options.demo,
    activeDepartments: [...staffedIds],
    failedDepartments,
  };
}

/** 화면 렌더링에 필요한 회사 전체 상태. */
export function loadCompany(companyId: string) {
  const company = queries.getCompany.get(companyId);
  if (!company) return null;

  const departments = queries.listDepartments.all(companyId) as Array<{
    department_id: string;
    active: number;
    reason: string;
    mission: string;
  }>;

  return {
    company,
    departments: departments.map((row) => ({
      ...DEPARTMENTS_BY_ID.get(row.department_id),
      id: row.department_id,
      active: row.active === 1,
      reason: row.reason,
      mission: row.mission,
    })),
    agents: queries.listAgents.all(companyId),
    tasks: queries.listTasks.all(companyId),
  };
}

export function deleteCompany(companyId: string): boolean {
  const existing = queries.getCompany.get(companyId);
  if (!existing) return false;

  db.exec("BEGIN");
  try {
    queries.deleteCompanyTasks.run(companyId);
    queries.deleteCompanyAgents.run(companyId);
    queries.deleteCompanyDepartments.run(companyId);
    queries.deleteCompany.run(companyId);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return true;
}
