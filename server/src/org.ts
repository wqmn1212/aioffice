/**
 * 회사 조직 카탈로그.
 *
 * 각 부서는 팀장 1명 + 팀원 3명으로 구성된다. 이 구조는 Managed Agents의
 * 위임 1단계 제약과 맞물려 있다 — 팀장이 coordinator, 팀원 3명이 roster.
 * roster 멤버는 자기 roster를 가질 수 없으므로 이보다 깊은 계층은 만들 수 없다.
 */

export type Seniority = "lead" | "member";

/** agent_toolset_20260401에서 켤 수 있는 도구 이름. */
export type ToolName =
  | "read"
  | "write"
  | "edit"
  | "bash"
  | "glob"
  | "grep"
  | "web_search"
  | "web_fetch";

const RESEARCH: ToolName[] = ["read", "glob", "grep", "web_search", "web_fetch"];
const AUTHOR: ToolName[] = [...RESEARCH, "write", "edit"];
const BUILD: ToolName[] = [...AUTHOR, "bash"];

export interface RoleSpec {
  id: string;
  /** 한글 직함. UI와 도트 캐릭터 이름표에 쓰인다. */
  title: string;
  seniority: Seniority;
  /** 이 역할의 담당 범위. 에이전트 system 프롬프트를 만들 때 재료로 쓰인다. */
  mission: string;
  model: string;
  tools: ToolName[];
  /** 도트 스프라이트 키. assets/sprites/<sprite>.png */
  sprite: string;
}

export interface DepartmentSpec {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  /** 오피스 화면에서 이 부서 구역의 색. */
  color: string;
  mission: string;
  /**
   * 업종에 따라 빼도 되는 부서인지. 온보딩 때 전략기획 에이전트가
   * 사업 설명을 읽고 optional 부서의 활성 여부를 결정한다.
   */
  optional: boolean;
  /** 연동 후보 MCP 서버. 대표가 켜야 실제로 붙는다. */
  mcpProfile: string[];
  roles: RoleSpec[];
}

/** 팀장은 판단·통합을, 팀원은 실행을 맡으므로 모델 등급을 다르게 둔다. */
const LEAD_MODEL = "claude-opus-5";
const SPECIALIST_MODEL = "claude-sonnet-5";
const RESEARCHER_MODEL = "claude-haiku-4-5";

export const DEPARTMENTS: DepartmentSpec[] = [
  {
    id: "strategy",
    name: "전략기획",
    nameEn: "Strategy",
    emoji: "🧭",
    color: "#6366f1",
    mission:
      "대표 직속으로 회사의 방향을 잡는다. 시장과 경쟁사를 읽고, 사업 기회를 " +
      "구조화하고, 다른 부서가 실행할 수 있는 형태의 과제로 쪼갠다.",
    optional: false,
    mcpProfile: ["notion", "linear"],
    roles: [
      {
        id: "strategy-lead",
        title: "전략기획 팀장",
        seniority: "lead",
        mission:
          "대표의 지시를 회사 전체 관점에서 해석하고, 어느 부서가 무엇을 해야 " +
          "하는지 판단한다. 팀원의 조사 결과를 검증한 뒤 대표에게 보고한다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-strategy",
      },
      {
        id: "market-researcher",
        title: "시장조사 담당",
        seniority: "member",
        mission:
          "시장 규모, 성장률, 경쟁사, 규제 환경을 조사한다. 모든 주장에 출처 " +
          "URL을 붙인다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-research",
      },
      {
        id: "business-planner",
        title: "사업기획 담당",
        seniority: "member",
        mission:
          "수익 모델, 가격 정책, 사업 로드맵 초안을 작성한다. 가정을 명시하고 " +
          "숫자의 근거를 남긴다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-planner",
      },
      {
        id: "data-analyst",
        title: "데이터분석 담당",
        seniority: "member",
        mission:
          "지표를 정의하고 계산한다. 계산이 필요하면 코드를 작성해 실행하고 " +
          "결과 파일을 남긴다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-analyst",
      },
    ],
  },
  {
    id: "sales",
    name: "영업",
    nameEn: "Sales",
    emoji: "🤝",
    color: "#f59e0b",
    mission:
      "잠재 고객을 찾아 접촉하고, 제안과 견적을 만들어 계약까지 끌고 간다. " +
      "파이프라인의 현재 상태를 항상 설명할 수 있어야 한다.",
    optional: false,
    mcpProfile: ["apollo", "close", "hubspot", "gmail"],
    roles: [
      {
        id: "sales-lead",
        title: "영업 팀장",
        seniority: "lead",
        mission:
          "파이프라인 전체를 관리하고 우선순위를 정한다. 팀원이 만든 제안서와 " +
          "아웃리치 문안을 검수한 뒤 내보낸다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-sales",
      },
      {
        id: "lead-gen",
        title: "리드발굴 담당",
        seniority: "member",
        mission:
          "타깃 조건에 맞는 잠재 고객을 찾아 회사명·담당자·연락 근거를 정리한다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-hunter",
      },
      {
        id: "outreach",
        title: "아웃리치 담당",
        seniority: "member",
        mission:
          "상대 회사의 맥락을 반영한 콜드메일과 후속 메시지를 쓴다. 발송은 " +
          "팀장 승인 후에만 한다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-outreach",
      },
      {
        id: "proposal",
        title: "제안·견적 담당",
        seniority: "member",
        mission: "제안서와 견적서를 작성한다. 가격 근거와 산출 내역을 남긴다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-proposal",
      },
    ],
  },
  {
    id: "marketing",
    name: "마케팅",
    nameEn: "Marketing",
    emoji: "📣",
    color: "#ec4899",
    mission:
      "회사와 제품을 알린다. 캠페인을 기획하고 콘텐츠를 만들고 채널 성과를 " +
      "측정해 다음 캠페인에 반영한다.",
    optional: false,
    mcpProfile: ["ahrefs", "canva", "figma", "meta-ads", "klaviyo"],
    roles: [
      {
        id: "marketing-lead",
        title: "마케팅 팀장",
        seniority: "lead",
        mission:
          "캠페인 목표와 채널 전략을 정한다. 브랜드 톤에 맞는지 검수하고 " +
          "예산 배분을 결정한다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-marketing",
      },
      {
        id: "content-writer",
        title: "콘텐츠 담당",
        seniority: "member",
        mission:
          "블로그, 뉴스레터, 랜딩페이지 카피를 쓴다. 채널별 형식과 길이를 지킨다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-writer",
      },
      {
        id: "performance-ads",
        title: "퍼포먼스광고 담당",
        seniority: "member",
        mission:
          "광고 세트를 설계하고 성과 지표를 분석한다. 집행은 팀장 승인 후에만 한다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-ads",
      },
      {
        id: "seo-social",
        title: "SEO·소셜 담당",
        seniority: "member",
        mission:
          "키워드 기회와 경쟁사 콘텐츠 갭을 조사하고 소셜 포스팅을 만든다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-seo",
      },
    ],
  },
  {
    id: "operations",
    name: "운영",
    nameEn: "Operations",
    emoji: "⚙️",
    color: "#14b8a6",
    mission:
      "회사가 돌아가는 절차를 만들고 지킨다. 프로세스를 문서화하고 리스크를 " +
      "관리하며 주기적으로 상태를 보고한다.",
    optional: false,
    mcpProfile: ["notion", "linear", "slack", "clickup"],
    roles: [
      {
        id: "ops-lead",
        title: "운영 팀장",
        seniority: "lead",
        mission:
          "부서 간 업무 흐름의 병목을 찾아 정리한다. 대표에게 올라갈 주간 " +
          "리포트를 최종 확인한다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-ops",
      },
      {
        id: "sop-writer",
        title: "SOP작성 담당",
        seniority: "member",
        mission: "반복 업무를 재현 가능한 절차서로 만든다. 예외 상황도 함께 적는다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-sop",
      },
      {
        id: "risk-manager",
        title: "리스크관리 담당",
        seniority: "member",
        mission:
          "무엇이 잘못될 수 있는지 목록화하고 발생 가능성과 영향도를 매긴다. " +
          "완화 방안을 함께 제시한다.",
        model: SPECIALIST_MODEL,
        tools: RESEARCH,
        sprite: "member-risk",
      },
      {
        id: "reporter",
        title: "리포팅 담당",
        seniority: "member",
        mission: "각 부서의 산출물을 모아 대표가 읽을 수 있는 요약으로 만든다.",
        model: RESEARCHER_MODEL,
        tools: AUTHOR,
        sprite: "member-reporter",
      },
    ],
  },
  {
    id: "hr",
    name: "인사",
    nameEn: "People",
    emoji: "🧑‍💼",
    color: "#8b5cf6",
    mission:
      "사람을 뽑고 적응시키고 평가한다. 실제 직원이 없는 단계에서는 채용 " +
      "기준과 조직 설계를 준비한다.",
    optional: true,
    mcpProfile: ["gmail", "google-calendar", "notion"],
    roles: [
      {
        id: "hr-lead",
        title: "인사 팀장",
        seniority: "lead",
        mission:
          "조직 구조와 채용 계획을 설계한다. 직무기술서와 평가 기준을 확정한다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-hr",
      },
      {
        id: "recruiter",
        title: "채용 담당",
        seniority: "member",
        mission: "채용 공고를 쓰고 후보 소싱 채널을 조사한다. 면접 질문지를 만든다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-recruiter",
      },
      {
        id: "onboarding",
        title: "온보딩 담당",
        seniority: "member",
        mission: "입사자가 첫 주에 해야 할 일을 순서대로 정리한다.",
        model: RESEARCHER_MODEL,
        tools: AUTHOR,
        sprite: "member-onboard",
      },
      {
        id: "labor-affairs",
        title: "노무·평가 담당",
        seniority: "member",
        mission:
          "근로 조건과 관련 법령을 조사한다. 법률 자문이 아니라 확인이 필요한 " +
          "항목을 정리하는 역할임을 항상 밝힌다.",
        model: SPECIALIST_MODEL,
        tools: RESEARCH,
        sprite: "member-labor",
      },
    ],
  },
  {
    id: "finance",
    name: "세무·회계",
    nameEn: "Finance",
    emoji: "🧾",
    color: "#22c55e",
    mission:
      "돈의 흐름을 기록하고 예측한다. 장부, 세무 일정, 자금 계획을 관리한다.",
    optional: false,
    mcpProfile: ["google-drive", "xero"],
    roles: [
      {
        id: "finance-lead",
        title: "재무 팀장",
        seniority: "lead",
        mission:
          "재무 상태를 요약해 대표에게 보고한다. 세무·회계 판단이 필요한 " +
          "지점에서는 전문가 확인이 필요하다고 반드시 명시한다.",
        model: LEAD_MODEL,
        tools: BUILD,
        sprite: "lead-finance",
      },
      {
        id: "bookkeeper",
        title: "기장 담당",
        seniority: "member",
        mission: "거래 내역을 계정과목별로 분류하고 장부 형태로 정리한다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-books",
      },
      {
        id: "tax-filer",
        title: "세무신고 담당",
        seniority: "member",
        mission:
          "해당 사업 형태에 필요한 신고 항목과 기한을 조사해 달력으로 만든다. " +
          "실제 신고는 대리하지 않는다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-tax",
      },
      {
        id: "treasury",
        title: "자금관리 담당",
        seniority: "member",
        mission: "현금 흐름을 예측하고 런웨이를 계산한다. 계산은 코드로 검증한다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-treasury",
      },
    ],
  },
  {
    id: "logistics",
    name: "물류",
    nameEn: "Logistics",
    emoji: "📦",
    color: "#a16207",
    mission:
      "실물 상품의 재고, 배송, 공급처를 관리한다. 물리적 상품이 없는 사업이면 " +
      "이 부서는 비활성화된다.",
    optional: true,
    mcpProfile: ["google-drive"],
    roles: [
      {
        id: "logistics-lead",
        title: "공급망 팀장",
        seniority: "lead",
        mission: "재고 수준과 배송 리드타임의 균형을 잡는다. 벤더 선정을 결정한다.",
        model: LEAD_MODEL,
        tools: BUILD,
        sprite: "lead-logistics",
      },
      {
        id: "inventory",
        title: "재고 담당",
        seniority: "member",
        mission: "재고 회전율과 안전재고를 계산한다. 부족·과잉 품목을 알린다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-inventory",
      },
      {
        id: "shipping",
        title: "배송 담당",
        seniority: "member",
        mission: "배송 옵션과 비용을 비교하고 지연 건을 추적한다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-shipping",
      },
      {
        id: "vendor",
        title: "벤더관리 담당",
        seniority: "member",
        mission: "공급처를 조사해 단가·최소주문량·리드타임을 비교표로 만든다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-vendor",
      },
    ],
  },
  {
    id: "engineering",
    name: "개발",
    nameEn: "Engineering",
    emoji: "💻",
    color: "#3b82f6",
    mission: "제품을 만들고 고친다. 코드를 쓰고 테스트하고 배포 가능한 상태로 유지한다.",
    optional: true,
    mcpProfile: ["github", "linear"],
    roles: [
      {
        id: "eng-lead",
        title: "기술 팀장",
        seniority: "lead",
        mission:
          "아키텍처를 결정하고 작업을 쪼갠다. 팀원의 코드를 리뷰한 뒤 병합한다.",
        model: LEAD_MODEL,
        tools: BUILD,
        sprite: "lead-eng",
      },
      {
        id: "backend-dev",
        title: "백엔드 담당",
        seniority: "member",
        mission: "서버 로직과 데이터 모델을 구현한다. 작성한 코드는 실행해서 확인한다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-backend",
      },
      {
        id: "frontend-dev",
        title: "프론트엔드 담당",
        seniority: "member",
        mission: "화면과 상호작용을 구현한다. 접근성과 반응형을 함께 챙긴다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-frontend",
      },
      {
        id: "qa",
        title: "QA 담당",
        seniority: "member",
        mission:
          "테스트를 작성해 실행하고 결과를 보고한다. 테스트 대상 코드는 고치지 않는다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-qa",
      },
    ],
  },
  {
    id: "design",
    name: "디자인",
    nameEn: "Design",
    emoji: "🎨",
    color: "#f43f5e",
    mission: "보이는 모든 것의 일관성을 만든다. 브랜드, 제품 화면, 콘텐츠 비주얼.",
    optional: true,
    mcpProfile: ["figma", "canva"],
    roles: [
      {
        id: "design-lead",
        title: "디자인 팀장",
        seniority: "lead",
        mission: "브랜드 방향과 디자인 시스템을 정한다. 산출물의 일관성을 검수한다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-design",
      },
      {
        id: "brand-designer",
        title: "브랜드 담당",
        seniority: "member",
        mission: "로고 방향, 컬러 팔레트, 타이포그래피 가이드를 제안한다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-brand",
      },
      {
        id: "ui-designer",
        title: "UI·UX 담당",
        seniority: "member",
        mission: "화면 구조와 흐름을 설계한다. 상태와 예외 케이스를 빠뜨리지 않는다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-ui",
      },
      {
        id: "content-designer",
        title: "콘텐츠디자인 담당",
        seniority: "member",
        mission: "마케팅용 비주얼과 문구를 채널 규격에 맞춰 만든다.",
        model: RESEARCHER_MODEL,
        tools: AUTHOR,
        sprite: "member-content",
      },
    ],
  },
  {
    id: "commerce",
    name: "커머스",
    nameEn: "Commerce",
    emoji: "🛒",
    color: "#84cc16",
    mission:
      "쿠팡·스마트스토어·자사몰에서 상품이 팔리는 이유와 안 팔리는 이유를 찾는다. " +
      "상세페이지, 썸네일, 경쟁 상품을 실제 화면 기준으로 분석한다.",
    optional: true,
    mcpProfile: ["google-drive", "meta-ads"],
    roles: [
      {
        id: "commerce-lead",
        title: "커머스 팀장",
        seniority: "lead",
        mission:
          "팀원의 분석을 종합해 무엇을 먼저 고칠지 우선순위를 정한다. 근거 있는 " +
          "지적과 취향에 불과한 지적을 구분하고, 검증되지 않은 개선안은 A/B 테스트 " +
          "대상으로만 올린다.",
        model: LEAD_MODEL,
        tools: AUTHOR,
        sprite: "lead-commerce",
      },
      {
        id: "detail-page-analyst",
        title: "상세페이지 분석 담당",
        seniority: "member",
        mission:
          "상세페이지 이미지를 위에서 아래로 읽으며 스크롤 구간별로 구매자가 이탈할 " +
          "지점을 찾는다. 첫 화면에서 구매 이유가 보이는지, 가격·배송·반품·인증 정보가 " +
          "어느 구간에 나오는지 확인하고 구간별로 지적한다.",
        model: SPECIALIST_MODEL,
        tools: AUTHOR,
        sprite: "member-detail-page",
      },
      {
        id: "thumbnail-analyst",
        title: "썸네일 분석 담당",
        seniority: "member",
        // 썸네일은 원본 크기로 보면 판단이 틀린다. 검색결과에 실제로 노출되는
        // 크기로 줄여서 비교해야 하므로 이미지 조작이 가능한 BUILD를 준다.
        mission:
          "썸네일을 검색결과에 실제 노출되는 크기로 축소한 뒤 판단한다. 경쟁 썸네일과 " +
          "나란히 놓고 대비, 텍스트 가독성, 상품 인지 속도를 비교한다. 원본 크기에서만 " +
          "좋아 보이는 안은 반려한다.",
        model: SPECIALIST_MODEL,
        tools: BUILD,
        sprite: "member-thumbnail",
      },
      {
        id: "competitor-researcher",
        title: "경쟁상품 조사 담당",
        seniority: "member",
        // 시장 규모·규제 조사는 전략기획의 market-researcher 소관이다.
        // 여기는 개별 상품 단위 비교만 맡아 업무가 겹치지 않게 한다.
        mission:
          "특정 키워드의 상위 노출 상품을 모아 가격대, 리뷰 수, 배송 조건, 옵션 구성을 " +
          "표로 정리한다. 모든 항목에 출처 URL과 조사 시점을 남긴다. 시장 규모와 규제 " +
          "조사는 전략기획 소관이므로 중복하지 않는다.",
        model: RESEARCHER_MODEL,
        tools: RESEARCH,
        sprite: "member-competitor",
      },
    ],
  },
];

export const DEPARTMENTS_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]));

export function findRole(departmentId: string, roleId: string): RoleSpec | undefined {
  return DEPARTMENTS_BY_ID.get(departmentId)?.roles.find((r) => r.id === roleId);
}

export function leadOf(department: DepartmentSpec): RoleSpec {
  const lead = department.roles.find((r) => r.seniority === "lead");
  if (!lead) throw new Error(`부서 ${department.id}에 팀장이 없습니다`);
  return lead;
}

export function membersOf(department: DepartmentSpec): RoleSpec[] {
  return department.roles.filter((r) => r.seniority === "member");
}
