/**
 * 히어로 영역의 미니 오피스 디오라마.
 *
 * 실제 오피스 화면과 같은 스프라이트 생성기를 쓴다. 랜딩에서 본 캐릭터가
 * 제품 안에서 그대로 나와야 하므로, 여기서만 쓰는 별도 그림을 두지 않는다.
 *
 * 구성 원칙: 제품의 세 가지 상태(업무·회의·휴식)가 한 화면에 모두 보여야 한다.
 * 비어 있는 가구는 두지 않는다 — 쓰이지 않는 책상은 그냥 잡동사니로 보인다.
 */

import { useEffect, useRef, useState } from "react";
import { spriteUrl } from "../office/sprite";

/** 디오라마 원본 크기. 내부 좌표는 전부 이 기준이다. */
const W = 420;
const H = 210;

interface Extra {
  /** 자리에서 일하는 중인지. 미세한 상하 움직임을 준다. */
  busy: boolean;
  x: number;
  y: number;
  color: string;
  lead?: boolean;
  key: string;
}

// 좌표는 .hero-diorama의 고정 크기(420x210) 기준이다.
const DESK_X = [30, 96, 162, 228];
const DESK_Y = 74;
const SEAT_Y = DESK_Y - 32;

const CAST: Extra[] = [
  // 윗줄 — 자리에서 일하는 중
  { key: "commerce-lead", x: DESK_X[0]! + 12, y: SEAT_Y, color: "#84cc16", lead: true, busy: true },
  { key: "detail", x: DESK_X[1]! + 12, y: SEAT_Y, color: "#84cc16", busy: true },
  { key: "thumb", x: DESK_X[2]! + 12, y: SEAT_Y, color: "#84cc16", busy: true },
  { key: "ads", x: DESK_X[3]! + 12, y: SEAT_Y, color: "#ec4899", busy: true },
  // 아랫줄 왼쪽 — 회의 테이블 둘레
  { key: "strategy-lead", x: 58, y: 113, color: "#6366f1", lead: true, busy: false },
  { key: "planner", x: 106, y: 113, color: "#6366f1", busy: false },
  { key: "ceo", x: 154, y: 113, color: "#facc15", lead: true, busy: false },
  // 오른쪽 아래 — 자판기 앞에서 쉬는 중
  { key: "resting", x: 334, y: 128, color: "#f59e0b", busy: false },
];

export default function HeroOffice() {
  const fitRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // 내부 좌표가 고정이라 컨테이너만 좁히면 오른쪽이 잘린다. 폭에 맞춰
  // 통째로 축소한다(확대는 하지 않는다 — 도트가 뭉개진다).
  useEffect(() => {
    const element = fitRef.current;
    if (!element) return;
    const fit = () => setScale(Math.min(1, element.clientWidth / W));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-diorama-fit" ref={fitRef} style={{ height: H * scale }}>
    <div
      className="hero-diorama"
      style={{ width: W, height: H, transform: `scale(${scale})` }}
      role="img"
      aria-label="도트 캐릭터들이 일하고, 회의하고, 쉬고 있는 AI 오피스 미리보기"
    >
      <div className="diorama-floor" />

      {DESK_X.map((x) => (
        <span key={x} className="dio-desk" style={{ left: x, top: DESK_Y }}>
          <span className="dio-monitor" />
        </span>
      ))}

      <span className="dio-table" />
      <span className="dio-vending" />

      {CAST.map((c) => (
        <span key={c.key} className="dio-char-slot" style={{ left: c.x, top: c.y }}>
          <span
            className={c.busy ? "dio-char dio-bob" : "dio-char"}
            style={{ backgroundImage: spriteUrl(c.color, c.lead ? "lead" : "member") }}
          />
        </span>
      ))}

      <span className="dio-tag dio-tag-work">💻 업무 중</span>
      <span className="dio-tag dio-tag-meet">💬 회의 중</span>
      <span className="dio-tag dio-tag-rest">☕ 휴식</span>
    </div>
    </div>
  );
}
