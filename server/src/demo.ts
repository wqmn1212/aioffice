/**
 * API 키 없이 전체 흐름을 확인하기 위한 데모 생성기.
 *
 * blueprint.ts와 같은 모양의 결과를 만들지만 Claude를 호출하지 않는다.
 * 화면·데이터 구조·라우팅을 점검하는 용도이며, 실제 분석이 아니다.
 */
import type { CompanyAnalysisResult, DepartmentStaffingResult } from "./blueprint.js";
import { DEPARTMENTS, leadOf, membersOf, type DepartmentSpec } from "./org.js";

const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오"];
const GIVEN = [
  "서연", "지훈", "민준", "하윤", "도현", "수아", "예준", "지우", "시윤", "유진",
  "채원", "건우", "다은", "현우", "소율", "우진", "나연", "성민", "가은", "태윤",
];

/**
 * 회사 안에서 이름이 겹치지 않도록 순차 배분한다.
 * 성 12개와 이름 20개를 각각 독립적으로 돌리면 최소공배수인 60명까지
 * 조합이 겹치지 않는다. 최대 인원이 36명이므로 항상 유일하다.
 */
export function createNameAllocator() {
  let index = 0;
  return () => {
    const surname = SURNAMES[index % SURNAMES.length] ?? "김";
    const given = GIVEN[index % GIVEN.length] ?? "지원";
    index += 1;
    return `${surname}${given}`;
  };
}

/** 사업 설명에 특정 주제가 들어 있는지 본다. */
function mentions(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function analyzeCompanyDemo(name: string, description: string): CompanyAnalysisResult {
  const isSoftware = mentions(description, ["saas", "앱", "플랫폼", "소프트웨어", "서비스", "웹"]);
  const isPhysical = mentions(description, ["제조", "재고", "배송", "물류", "상품", "커머스", "쇼핑"]);
  const isBrandLed = mentions(description, ["브랜드", "디자인", "커머스", "콘텐츠", "마케팅"]);
  const isHiring = mentions(description, ["채용", "팀", "인력", "직원", "조직"]);
  // 온라인 판매는 물류와 다르다. 재고를 다루지 않아도(위탁·구매대행) 상세페이지와
  // 썸네일은 필요하므로, 판매 채널이 언급되면 별도로 본다.
  const isOnlineSeller = mentions(description, [
    "온라인 판매",
    "온라인셀러",
    "셀러",
    "쿠팡",
    "스마트스토어",
    "네이버쇼핑",
    "자사몰",
    "카페24",
    "쇼피파이",
    "shopify",
    "상세페이지",
    "썸네일",
    "이커머스",
    "커머스",
    "쇼핑몰",
  ]);

  const activation: Record<string, { active: boolean; reason: string }> = {
    commerce: isOnlineSeller
      ? { active: true, reason: "온라인 채널에서 직접 판매하므로 상세페이지·썸네일·경쟁상품을 전담할 인력이 필요합니다." }
      : { active: false, reason: "온라인 스토어를 직접 운영하지 않아 커머스 부서는 두지 않습니다." },
    logistics: isPhysical
      ? { active: true, reason: "실물 상품과 재고를 다루는 사업이라 공급망 관리가 필요합니다." }
      : { active: false, reason: "물리적 상품을 다루지 않아 물류 부서는 두지 않습니다." },
    engineering: isSoftware
      ? { active: true, reason: "제품 자체가 소프트웨어라 개발 조직이 핵심입니다." }
      : { active: false, reason: "직접 개발할 제품이 뚜렷하지 않아 외주로 충분합니다." },
    design: isBrandLed || isSoftware
      ? { active: true, reason: "제품 화면과 브랜드 일관성을 맡을 인력이 필요합니다." }
      : { active: false, reason: "초기 단계에서는 외부 디자인으로 대응 가능합니다." },
    hr: isHiring
      ? { active: true, reason: "채용과 조직 설계가 당면 과제로 언급되어 있습니다." }
      : { active: false, reason: "1인 체제 단계라 인사 조직은 아직 이릅니다." },
  };

  return {
    industry: isSoftware ? "B2B SaaS" : isPhysical ? "이커머스·제조" : "일반 서비스업",
    businessModel: isSoftware
      ? "월 구독료를 받는 소프트웨어 서비스"
      : "상품 판매 마진으로 수익을 냅니다",
    summary:
      `${name}의 데모 조직입니다. 사업 설명을 키워드로만 해석해 부서를 배치했으며, ` +
      "Claude가 분석한 결과가 아닙니다. 실제 분석을 보려면 .env에 API 키를 설정하세요.",
    departments: DEPARTMENTS.map((spec) => ({
      departmentId: spec.id,
      active: spec.optional ? (activation[spec.id]?.active ?? false) : true,
      reason: activation[spec.id]?.reason ?? "이 사업의 기본 운영에 필요한 부서입니다.",
    })),
  };
}

export function staffDepartmentDemo(
  company: { name: string; industry: string },
  department: DepartmentSpec,
  nextName: () => string,
): DepartmentStaffingResult {
  const lead = leadOf(department);
  const members = membersOf(department);

  return {
    mission: `${company.name}의 ${department.name} 조직. ${department.mission}`,
    roles: [lead, ...members].map((role) => ({
      roleId: role.id,
      name: nextName(),
      persona:
        role.seniority === "lead"
          ? `${department.name} 전반을 책임진다. ${role.mission}`
          : `${role.title}. ${role.mission}`,
      firstTask:
        role.seniority === "lead"
          ? `${department.name} 첫 주 운영 계획 수립 및 팀원 업무 배분`
          : `${role.title} 영역의 현황 파악 및 우선순위 정리`,
    })),
  };
}
