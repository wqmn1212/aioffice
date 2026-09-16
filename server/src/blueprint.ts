import * as z from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, LEAD_MODEL } from "./anthropic.js";
import { DEPARTMENTS, leadOf, membersOf, type DepartmentSpec } from "./org.js";

const CompanyAnalysis = z.object({
  industry: z.string().describe("업종을 한국어 명사구로. 예: 'B2B SaaS', '수제 화장품 이커머스'"),
  businessModel: z.string().describe("돈을 어떻게 버는지 한 문장으로"),
  summary: z.string().describe("이 회사가 무엇을 하는 회사인지 2~3문장으로"),
  departments: z.array(
    z.object({
      departmentId: z.string(),
      active: z.boolean(),
      reason: z.string().describe("이 부서가 왜 필요한지 또는 왜 불필요한지 한 문장"),
    }),
  ),
});

const DepartmentStaffing = z.object({
  mission: z.string().describe("이 회사 맥락에 맞춘 부서의 임무. 2문장 이내"),
  roles: z.array(
    z.object({
      roleId: z.string(),
      name: z.string().describe("한국식 사람 이름 세 글자. 예: '김서연'"),
      persona: z.string().describe("이 담당자의 전문성과 일하는 방식. 1~2문장"),
      firstTask: z.string().describe("입사 첫 주에 착수할 구체적인 업무 하나"),
    }),
  ),
});

export type CompanyAnalysisResult = z.infer<typeof CompanyAnalysis>;
export type DepartmentStaffingResult = z.infer<typeof DepartmentStaffing>;

function catalogForPrompt(): string {
  return DEPARTMENTS.map(
    (d) =>
      `- id: ${d.id} | ${d.name} | ${d.optional ? "선택 부서" : "필수 부서"}\n  기본 임무: ${d.mission}`,
  ).join("\n");
}

/** 1단계: 회사를 분석하고 어떤 부서를 둘지 정한다. */
export async function analyzeCompany(
  name: string,
  description: string,
): Promise<CompanyAnalysisResult> {
  const response = await anthropic.messages.parse({
    model: LEAD_MODEL,
    max_tokens: 16000,
    system:
      "너는 신설 법인의 조직을 설계하는 전략기획 책임자다. 사업 설명을 읽고 " +
      "실제로 필요한 부서만 남긴다. 필수 부서는 항상 활성화한다. 선택 부서는 " +
      "그 사업에 실질적인 역할이 있을 때만 활성화한다. 예를 들어 물리적 상품을 " +
      "다루지 않는 사업이라면 물류 부서는 비활성화한다.",
    messages: [
      {
        role: "user",
        content: [
          `회사명: ${name}`,
          `사업 설명: ${description}`,
          "",
          "부서 카탈로그:",
          catalogForPrompt(),
          "",
          "카탈로그의 모든 부서에 대해 활성 여부를 판단해라. departmentId는 카탈로그의 id를 그대로 써라.",
        ].join("\n"),
      },
    ],
    output_config: { format: zodOutputFormat(CompanyAnalysis) },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("회사 분석 응답을 파싱하지 못했습니다");
  return parsed;
}

/** 2단계: 한 부서의 팀장과 팀원 3명에게 이름·성격·첫 업무를 부여한다. */
export async function staffDepartment(
  company: { name: string; description: string; industry: string },
  department: DepartmentSpec,
): Promise<DepartmentStaffingResult> {
  const lead = leadOf(department);
  const members = membersOf(department);
  const roster = [lead, ...members]
    .map(
      (r) =>
        `- roleId: ${r.id} | ${r.title} (${r.seniority === "lead" ? "팀장" : "팀원"})\n  담당: ${r.mission}`,
    )
    .join("\n");

  const response = await anthropic.messages.parse({
    model: LEAD_MODEL,
    max_tokens: 8000,
    system:
      "너는 신설 법인의 인사 담당자다. 주어진 부서의 각 자리에 사람을 배치한다. " +
      "이름은 서로 겹치지 않게 하고, 페르소나는 그 회사의 사업에 맞게 구체적으로 쓴다. " +
      "첫 업무는 실제로 이번 주에 착수할 수 있을 만큼 구체적이어야 한다.",
    messages: [
      {
        role: "user",
        content: [
          `회사명: ${company.name}`,
          `업종: ${company.industry}`,
          `사업 설명: ${company.description}`,
          "",
          `배치할 부서: ${department.name} (${department.id})`,
          `부서 기본 임무: ${department.mission}`,
          "",
          "자리 목록:",
          roster,
          "",
          "각 자리마다 roleId를 그대로 사용해 한 명씩 배치해라.",
        ].join("\n"),
      },
    ],
    output_config: { format: zodOutputFormat(DepartmentStaffing), effort: "medium" },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error(`${department.name} 인력 배치 응답을 파싱하지 못했습니다`);
  return parsed;
}
