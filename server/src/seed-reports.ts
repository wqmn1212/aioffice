/**
 * 샘플 보고서 채우기.
 *
 * 보고서 화면은 실제 산출물이 쌓여야 확인할 수 있는데, 산출물이 쌓이려면
 * API 키와 실행 시간이 필요하다. 화면을 먼저 보고 고칠 수 있도록 실행 없이
 * 채워 넣는 경로를 둔다.
 *
 * 여기서 만든 보고서는 provider를 'demo'로 박아 둔다. 실제 모델이 쓴 것과
 * 화면에서 구분되지 않으면, 나중에 어느 것이 진짜였는지 알 수 없게 된다.
 */

import { db, queries, type AgentRow, type TaskRow } from "./db.js";

export const DEMO_PROVIDER = "demo";

interface Draft {
  /** 이 보고서를 맡길 역할. 해당 역할이 없는 회사면 건너뛴다. */
  roleId: string;
  title: string;
  body: string;
  inputTokens: number;
  outputTokens: number;
}

const DRAFTS: Draft[] = [
  {
    roleId: "thumbnail-analyst",
    title: "쿠팡 생활용품 상위 10개 썸네일 공통 패턴 분석",
    inputTokens: 2840,
    outputTokens: 1120,
    body: `## 요약

상위 10개 중 7개가 **흰 배경 + 제품 단독 + 좌상단 텍스트** 구조를 씁니다. 우리 썸네일은 배경이 회색이고 텍스트가 하단에 있어, 검색결과 크기에서 텍스트가 가장 먼저 사라집니다.

## 검증 방법

썸네일을 쿠팡 검색결과 실제 노출 크기(약 220×220px)로 축소한 뒤 비교했습니다. 원본 크기에서는 우리 썸네일도 충분히 읽혔습니다 — **원본으로만 보면 이 문제는 보이지 않습니다.**

## 구간별 관찰

| 항목 | 상위 10개 | 우리 |
|---|---|---|
| 흰 배경 | 7건 | 회색 |
| 텍스트 위치 | 좌상단 8건 | 하단 |
| 텍스트 글자 수 | 평균 6자 | 14자 |
| 제품 외 요소 | 평균 0.8개 | 3개(로고·뱃지·말풍선) |

## 지적

1. **텍스트 14자는 축소 시 읽히지 않습니다.** 상위권 평균은 6자입니다.
2. **회색 배경은 쿠팡 UI 배경과 대비가 부족합니다.** 썸네일 경계가 흐려집니다.
3. 뱃지 3개가 제품 면적을 약 18% 가립니다(이미지에서 측정).

## 제안 (검증 필요)

- 배경을 #FFFFFF로, 텍스트를 6자 이내로 줄여 좌상단 배치
- 뱃지는 1개만 남기고 나머지는 상세페이지로 이동

> 위 제안은 상위권 패턴에서 역산한 **가설**입니다. 실제 전환율 개선 여부는
> A/B 테스트로 확인해야 합니다. 상위 노출이 썸네일 때문인지, 판매량·리뷰 때문인지는
> 이 조사만으로 구분할 수 없습니다.`,
  },
  {
    roleId: "detail-page-analyst",
    title: "주력 상품 상세페이지 스크롤 구간별 이탈 지점 점검",
    inputTokens: 3610,
    outputTokens: 1480,
    body: `## 요약

구매 이유가 **4번째 스크롤(약 2,800px)**에서야 처음 나옵니다. 첫 화면은 브랜드 스토리로 채워져 있어, 가격을 보러 온 사람이 이탈할 구간이 앞에 3개 있습니다.

## 구간별 점검

| 구간 | 위치 | 내용 | 판단 |
|---|---|---|---|
| 1 | 0–900px | 브랜드 로고 + 감성 카피 | 구매 정보 없음 |
| 2 | 900–1,800px | 모델 착용 사진 4장 | 사이즈 정보 없음 |
| 3 | 1,800–2,800px | 브랜드 철학 | **이탈 위험 최대** |
| 4 | 2,800–3,600px | 소재·사이즈 표 | 여기가 첫 번째 구매 정보 |
| 5 | 3,600–4,200px | 배송·반품 | 적절 |
| 6 | 4,200px– | 리뷰 | 적절 |

## 지적

1. **3번 구간(브랜드 철학)이 구매 결정에 기여하지 않습니다.** 재구매 고객에게는 의미가 있을 수 있으나, 신규 유입에게는 1,000px의 스크롤 비용입니다.
2. **사이즈 정보가 2,800px에 있습니다.** 의류·생활용품에서 사이즈는 가장 먼저 확인하는 항목입니다.
3. 첫 화면에 가격·배송일이 없습니다.

## 제안 (검증 필요)

- 4번 구간(소재·사이즈 표)을 2번 위로 올리기
- 3번 구간은 접이식으로 바꾸거나 하단으로 이동
- 첫 화면에 "무료배송 · 내일 도착" 한 줄 추가

> 이탈 지점은 페이지 구조에서 추론한 것이며, **실제 이탈률 데이터를 보지 못했습니다.**
> 쿠팡은 구간별 체류 데이터를 제공하지 않으므로, 자사몰에 동일 구조를 올려
> 스크롤 깊이를 측정하는 방법이 대안입니다.`,
  },
  {
    roleId: "competitor-researcher",
    title: "'주방 정리용품' 키워드 상위 노출 상품 비교표",
    inputTokens: 4120,
    outputTokens: 980,
    body: `## 조사 조건

- 키워드: 주방 정리용품
- 조사 시점: 2026-09-15 21:00 (쿠팡 정렬 기본값)
- 상위 8개 기준

## 비교표

| 순위 | 가격대 | 리뷰 수 | 배송 | 옵션 수 |
|---|---|---|---|---|
| 1 | 12,900원 | 24,100 | 로켓 | 6 |
| 2 | 9,900원 | 18,700 | 로켓 | 3 |
| 3 | 15,800원 | 11,200 | 로켓 | 8 |
| 4 | 11,500원 | 9,800 | 판매자 | 4 |
| 5 | 8,900원 | 8,100 | 로켓 | 2 |
| 6 | 19,900원 | 6,400 | 로켓 | 12 |
| 7 | 13,200원 | 5,900 | 판매자 | 5 |
| 8 | 10,500원 | 4,200 | 로켓 | 3 |

## 관찰

- 상위 8개 중 **6개가 로켓배송**입니다. 판매자배송은 4·7위 두 건뿐입니다.
- 가격대는 8,900~19,900원에 몰려 있고, 중앙값은 11,850원입니다.
- 리뷰 수와 순위의 상관이 뚜렷합니다(1~3위가 리뷰 1만 이상).

## 우리 위치

현재 우리 상품은 14,800원 / 리뷰 320건 / 판매자배송입니다. 가격은 상위권 범위 안이지만 **리뷰 수가 최하위권과도 한 자릿수 배 차이**입니다.

> 순위 결정 요인은 쿠팡이 공개하지 않습니다. 위 상관은 **관찰이지 인과가 아닙니다.**
> 리뷰를 늘리면 순위가 오른다고 단정할 수 없습니다.
> 출처: 쿠팡 검색결과 화면(로그인 없는 상태), 조사 시점 기준.`,
  },
  {
    roleId: "performance-ads",
    title: "지난 30일 광고 소재별 성과 정리",
    inputTokens: 2210,
    outputTokens: 760,
    body: `## 요약

소재 5종 중 **2종이 전체 지출의 68%를 쓰고 전환의 31%**를 만들었습니다. 이 둘을 멈추면 같은 예산으로 전환을 늘릴 여지가 있습니다.

## 소재별

| 소재 | 지출 비중 | 전환 비중 | 판단 |
|---|---|---|---|
| A (모델 착용) | 41% | 19% | 비효율 |
| B (제품 단독) | 27% | 12% | 비효율 |
| C (사용 장면) | 18% | 38% | **효율** |
| D (가격 강조) | 9% | 24% | **효율** |
| E (리뷰 인용) | 5% | 7% | 보통 |

## 제안 (검증 필요)

- A·B 예산을 줄이고 C·D로 이동
- C의 변형 소재를 2종 추가해 소재 피로도 대비

> **주의: 이 수치는 샘플 데이터입니다.** 광고 계정이 연동되지 않아 실제 성과를
> 조회하지 못했습니다. 연동 후 같은 형식으로 다시 작성해야 합니다.`,
  },
];

/**
 * 회사에 샘플 보고서를 채운다. 이미 채워 넣은 것이 있으면 다시 만들지 않는다
 * — 버튼을 두 번 눌렀다고 같은 보고서가 쌓이면 목록이 금방 쓸모없어진다.
 */
export function seedDemoReports(companyId: string): { created: number; skipped: boolean } {
  const existing = (queries.listTasks.all(companyId) as unknown as TaskRow[]).filter(
    (task) => task.provider === DEMO_PROVIDER,
  );
  if (existing.length > 0) return { created: 0, skipped: true };

  const agents = queries.listAgents.all(companyId) as unknown as AgentRow[];
  const tasks = queries.listTasks.all(companyId) as unknown as TaskRow[];
  const now = Date.now();

  let created = 0;
  db.exec("BEGIN");
  try {
    for (const [index, draft] of DRAFTS.entries()) {
      const agent = agents.find((a) => a.role_id === draft.roleId);
      if (!agent) continue; // 이 회사에 없는 역할이면 조용히 건너뛴다.

      // 이미 만들어져 있는 그 담당자의 대기 업무를 하나 재활용한다. 없으면 새로 만든다.
      const reusable = tasks.find(
        (t) => t.agent_id === agent.id && t.status === "todo" && t.provider === "",
      );
      const taskId = reusable?.id ?? crypto.randomUUID();
      // 목록이 한 덩어리로 보이지 않도록 실행 시각을 몇 시간씩 벌린다.
      const ranAt = new Date(now - (index + 1) * 5 * 3600_000).toISOString();

      if (!reusable) {
        queries.insertTask.run(
          taskId,
          companyId,
          agent.department_id,
          agent.id,
          draft.title,
          "todo",
          null,
          ranAt,
        );
      }

      queries.setTaskTitle.run(draft.title, taskId);
      queries.saveTaskRun.run(
        "done",
        draft.body,
        DEMO_PROVIDER,
        "sample",
        draft.inputTokens,
        draft.outputTokens,
        ranAt,
        null,
        taskId,
      );
      created += 1;
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return { created, skipped: false };
}

/** 샘플 보고서만 지운다. 실제 실행 결과는 건드리지 않는다. */
export function clearDemoReports(companyId: string): number {
  const demo = (queries.listTasks.all(companyId) as unknown as TaskRow[]).filter(
    (task) => task.provider === DEMO_PROVIDER,
  );
  db.exec("BEGIN");
  try {
    for (const task of demo) queries.deleteTask.run(task.id);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return demo.length;
}
