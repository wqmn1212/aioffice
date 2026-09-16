/**
 * 서비스 랜딩 페이지.
 *
 * 목적은 하나 — 사전 신청 이메일을 받는 것. 계정·과금이 붙기 전까지는
 * 이게 유일하게 정직한 '가입'이다. 폼은 이메일만 필수로 두고, 판매 채널과
 * 관심 플랜은 선택으로 받아 제품 우선순위를 정하는 데 쓴다.
 */

import { useEffect, useState } from "react";
import { api } from "../api";
import HeroOffice from "./HeroOffice";
import { spriteUrl } from "../office/sprite";
import "./landing.css";

const CHANNELS = ["쿠팡", "스마트스토어", "자사몰", "아마존", "기타"];

const PAINS = [
  {
    icon: "📄",
    title: "고쳐야 하는 건 아는데",
    body: "상세페이지 전환율이 낮다는 건 압니다. 그런데 어느 구간에서 이탈하는지, 무엇부터 고쳐야 하는지는 아무도 알려주지 않습니다.",
  },
  {
    icon: "🔍",
    title: "경쟁사는 매일 바뀌는데",
    body: "상위 노출 상품의 가격과 옵션은 주 단위로 달라집니다. 확인하려면 매번 손으로 훑어야 하고, 그럴 시간은 없습니다.",
  },
  {
    icon: "💸",
    title: "광고비는 나가는데",
    body: "무엇이 먹히고 무엇이 새는지 판단하려면 데이터를 붙들고 앉아야 합니다. 그 일을 대신 해 줄 사람이 없습니다.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "사업을 한 문단으로 설명",
    body: "무엇을 어디서 파는지 적으면 필요한 부서만 꾸려집니다. 물건을 안 다루면 물류팀은 만들지 않습니다.",
  },
  {
    n: "02",
    title: "팀이 자리에 앉습니다",
    body: "팀장 1명과 팀원 3명이 배치되고 각자 첫 업무를 받습니다. 누가 무엇을 하는지 오피스 화면에 그대로 보입니다.",
  },
  {
    n: "03",
    title: "대표는 지시만 합니다",
    body: "부서를 골라 업무를 내리면 팀장이 받아 팀에 배분합니다. 검토가 필요하면 회의를 소집합니다.",
  },
];

const ROSTER = [
  { emoji: "🛒", name: "커머스", color: "#84cc16", roles: "상세페이지 · 썸네일 · 경쟁상품", star: true },
  { emoji: "📣", name: "마케팅", color: "#ec4899", roles: "콘텐츠 · 퍼포먼스 광고 · SEO" },
  { emoji: "🧭", name: "전략기획", color: "#6366f1", roles: "시장조사 · 사업기획 · 데이터분석" },
  { emoji: "📦", name: "물류", color: "#a16207", roles: "재고 · 배송 · 공급업체" },
  { emoji: "🧾", name: "세무·회계", color: "#22c55e", roles: "장부 · 신고 · 자금" },
  { emoji: "🤝", name: "영업", color: "#f59e0b", roles: "리드 · 아웃리치 · 제안" },
];

const PLANS = [
  {
    id: "무료",
    price: "₩0",
    unit: "",
    tag: "지금 가능",
    live: true,
    lines: ["데모 회사 1개", "부서 편성·오피스 화면", "업무 진행 시뮬레이션"],
    caveat: "실제 산출물은 나오지 않습니다.",
  },
  {
    id: "셀러",
    price: "₩39,000",
    unit: "/월",
    tag: "출시 예정",
    live: false,
    highlight: true,
    lines: ["커머스·마케팅·전략 3개 부서", "월 200건 업무 실행", "상세페이지·썸네일 리포트"],
    caveat: "가격은 확정 전이며 사전 신청자 의견을 반영합니다.",
  },
  {
    id: "브랜드",
    price: "₩129,000",
    unit: "/월",
    tag: "출시 예정",
    live: false,
    lines: ["전 부서 개방", "월 800건 업무 실행", "판매·광고 데이터 연동"],
    caveat: "가격은 확정 전이며 사전 신청자 의견을 반영합니다.",
  },
];

function WaitlistForm({ id, compact }: { id: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [plan, setPlan] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(channel: string) {
    setChannels((list) =>
      list.includes(channel) ? list.filter((c) => c !== channel) : [...list, channel],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      const result = await api.joinWaitlist({ email: email.trim(), channels, plan, note });
      setPosition(result.position);
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="wl-done">
        <span className="wl-done-mark">✓</span>
        <div>
          <strong>신청되었습니다</strong>
          <p>
            {position !== null && `${position}번째 신청자입니다. `}
            준비되면 {email} 으로 가장 먼저 알려드리겠습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={compact ? "wl-form compact" : "wl-form"} onSubmit={submit}>
      <div className="wl-row">
        <input
          id={`${id}-email`}
          type="email"
          required
          value={email}
          placeholder="이메일 주소"
          onChange={(e) => setEmail(e.target.value)}
          aria-label="이메일 주소"
        />
        <button type="submit" className="px-btn primary" disabled={state === "sending"}>
          {state === "sending" ? "보내는 중…" : "사전 신청"}
        </button>
      </div>

      {!compact && (
        <>
          <fieldset className="wl-fieldset">
            <legend>어디서 파시나요? (선택)</legend>
            <div className="wl-chips">
              {CHANNELS.map((channel) => (
                <label
                  key={channel}
                  className={channels.includes(channel) ? "wl-chip on" : "wl-chip"}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggle(channel)}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="wl-fieldset">
            <legend>관심 있는 플랜 (선택)</legend>
            <div className="wl-chips">
              {["셀러", "브랜드", "아직 모르겠음"].map((p) => (
                <label key={p} className={plan === p ? "wl-chip on" : "wl-chip"}>
                  <input
                    type="radio"
                    name={`${id}-plan`}
                    checked={plan === p}
                    onChange={() => setPlan(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>

          <textarea
            value={note}
            maxLength={1000}
            placeholder="가장 맡기고 싶은 업무가 있다면 적어 주세요 (선택)"
            onChange={(e) => setNote(e.target.value)}
            aria-label="맡기고 싶은 업무"
          />
        </>
      )}

      {error && <p className="wl-error">{error}</p>}
      <p className="wl-fine">이메일 외에는 아무것도 요구하지 않습니다. 광고성 메일은 보내지 않습니다.</p>
    </form>
  );
}

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .waitlistCount()
      .then((r) => setCount(r.count))
      .catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="lp-nav">
        <span className="lp-logo">
          AI <b>OFFICE</b>
        </span>
        <nav>
          <a href="#how">작동 방식</a>
          <a href="#plans">요금</a>
          <button type="button" className="px-btn ghost" onClick={onEnterApp}>
            데모 열기
          </button>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span className="lp-badge">온라인셀러 전용 · 비공개 베타</span>
          <h1>
            1인 셀러에게 없는 건
            <br />
            시간이 아니라 <em>팀</em>입니다
          </h1>
          <p className="lp-lede">
            사업을 한 문단으로 설명하면 부서가 꾸려집니다. 상세페이지를 뜯어보는 사람, 썸네일을
            검색결과 크기로 비교하는 사람, 경쟁 상품을 매일 훑는 사람이 자리에 앉습니다.
          </p>
          <WaitlistForm id="hero" compact />
          {count !== null && count > 0 && (
            <p className="lp-count">
              지금까지 <strong>{count}명</strong>이 사전 신청했습니다
            </p>
          )}
        </div>
        <HeroOffice />
      </section>

      <section className="lp-section lp-pains">
        <h2 className="lp-h2">이런 상태라면</h2>
        <div className="lp-cards">
          {PAINS.map((pain) => (
            <article key={pain.title} className="px-card">
              <span className="px-card-icon">{pain.icon}</span>
              <h3>{pain.title}</h3>
              <p>{pain.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section" id="how">
        <h2 className="lp-h2">작동 방식</h2>
        <div className="lp-steps">
          {STEPS.map((step) => (
            <article key={step.n} className="px-card step">
              <span className="step-n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <h2 className="lp-h2">배치되는 부서</h2>
        <p className="lp-sub">사업 설명에 따라 필요한 부서만 꾸려집니다. 부서마다 팀장 1명 + 팀원 3명.</p>
        <div className="lp-roster">
          {ROSTER.map((dept) => (
            <article
              key={dept.name}
              className={dept.star ? "px-card dept star" : "px-card dept"}
              style={{ "--dept": dept.color } as React.CSSProperties}
            >
              <div className="dept-head">
                <span className="dept-emoji">{dept.emoji}</span>
                <h3>{dept.name}</h3>
                {dept.star && <span className="dept-star">셀러 핵심</span>}
              </div>
              <p>{dept.roles}</p>
              <div className="dept-crew">
                {["lead", "member", "member", "member"].map((variant, i) => (
                  <span
                    key={i}
                    className="dept-sprite"
                    style={{ backgroundImage: spriteUrl(dept.color, variant as "lead" | "member") }}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section" id="plans">
        <h2 className="lp-h2">요금</h2>
        <p className="lp-sub">
          업무 실행 1건마다 모델 비용이 발생합니다. 그래서 인원수가 아니라 실행량으로 끊습니다.
        </p>
        <div className="lp-plans">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={plan.highlight ? "px-card plan highlight" : "px-card plan"}
            >
              <div className="plan-head">
                <h3>{plan.id}</h3>
                <span className={plan.live ? "plan-tag live" : "plan-tag"}>{plan.tag}</span>
              </div>
              <p className="plan-price">
                {plan.price}
                <span>{plan.unit}</span>
              </p>
              <ul>
                {plan.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="plan-caveat">{plan.caveat}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-final">
        <h2 className="lp-h2">먼저 써 보시겠어요?</h2>
        <p className="lp-sub">
          비공개 베타는 온라인셀러부터 엽니다. 어디서 파시는지 알려주시면 그 채널부터 준비합니다.
        </p>
        <WaitlistForm id="final" />
      </section>

      <footer className="lp-footer">
        <span>AI OFFICE</span>
        <button type="button" className="lp-link" onClick={onEnterApp}>
          데모 둘러보기 →
        </button>
      </footer>
    </div>
  );
}
