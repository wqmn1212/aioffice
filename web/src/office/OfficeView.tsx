/**
 * 도트 오피스 메인 화면.
 *
 * 캐릭터 위치는 서버가 내려준 활동(working/meeting/resting)에서만 결정된다.
 * 화면이 자체적으로 상태를 지어내지 않으므로, 보이는 그림은 항상 DB의
 * 업무 상태와 일치한다. 이동은 좌표를 바꾸고 CSS transition에 맡긴다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type OfficeAgent, type OfficeState, type RunResult } from "../api";
import { buildLayout, CHAR_H, CHAR_W, type Point } from "./layout";
import { spriteUrl } from "./sprite";
import "./office.css";

const ACTIVITY_ICON: Record<OfficeAgent["activity"], string> = {
  working: "💻",
  meeting: "💬",
  resting: "☕",
};

const ACTIVITY_LABEL: Record<OfficeAgent["activity"], string> = {
  working: "업무 중",
  meeting: "회의 중",
  resting: "휴식 중",
};

const TICK_MS = 2600;

/** 부서 안에서의 자리 번호. 팀장이 0번, 팀원이 1~3번. */
function seatIndexes(agents: OfficeAgent[]): Map<string, number> {
  const byDepartment = new Map<string, OfficeAgent[]>();
  for (const agent of agents) {
    const list = byDepartment.get(agent.departmentId) ?? [];
    list.push(agent);
    byDepartment.set(agent.departmentId, list);
  }

  const seats = new Map<string, number>();
  for (const list of byDepartment.values()) {
    const ordered = [...list].sort((a, b) => {
      if (a.seniority !== b.seniority) return a.seniority === "lead" ? -1 : 1;
      return a.id.localeCompare(b.id); // 새로고침해도 자리가 바뀌지 않게.
    });
    ordered.forEach((agent, index) => seats.set(agent.id, index));
  }
  return seats;
}

export default function OfficeView({ companyId }: { companyId: string }) {
  const [office, setOffice] = useState<OfficeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);

  const [orderDept, setOrderDept] = useState("");
  const [orderTitle, setOrderTitle] = useState("");

  // 업무 실행. 실행 중에는 자동 진행을 멈춘다 — tick이 중간에 상태를 바꾸면
  // 방금 실행한 업무가 화면에서 사라져 결과를 볼 수 없다.
  const [running, setRunning] = useState<string | null>(null);
  const [runOutput, setRunOutput] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    api.office(companyId).then(setOffice).catch((e: Error) => setError(e.message));
  }, [companyId]);

  const step = useCallback(async () => {
    try {
      setOffice(await api.tick(companyId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setAuto(false); // 실패하면 같은 요청을 계속 두드리지 않는다.
    }
  }, [companyId]);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(step, TICK_MS);
    return () => clearInterval(timer);
  }, [auto, step]);

  const layout = useMemo(
    () => buildLayout((office?.departments ?? []).map((d) => d.id), office?.agents.length ?? 0),
    [office?.departments, office?.agents.length],
  );

  // 평면도를 화면 폭에 맞춘다. 확대는 하지 않는다 — 도트가 뭉개진다.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const fit = () => setScale(Math.min(1, element.clientWidth / layout.width));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [layout.width]);

  const seats = useMemo(() => seatIndexes(office?.agents ?? []), [office?.agents]);
  const colorOf = useMemo(() => {
    const map = new Map((office?.departments ?? []).map((d) => [d.id, d.color]));
    return (id: string) => map.get(id) ?? "#64748b";
  }, [office?.departments]);

  function positionOf(agent: OfficeAgent, globalIndex: number): Point {
    const room = layout.roomById.get(agent.departmentId);
    const seat = seats.get(agent.id) ?? 0;
    if (room && agent.activity === "working") return room.deskSeats[seat] ?? room.deskSeats[0]!;
    if (room && agent.activity === "meeting") return room.meetSeats[seat] ?? room.meetSeats[0]!;
    const spots = layout.loungeSpots;
    return spots[globalIndex % spots.length] ?? { x: layout.lounge.x + 20, y: layout.lounge.y + 40 };
  }

  async function execute(taskId: string) {
    setRunning(taskId);
    setRunError(null);
    setRunOutput(null);
    setAuto(false);
    try {
      const result = await api.runTask(companyId, taskId);
      setRunOutput(result);
      setOffice(await api.office(companyId));
    } catch (e) {
      setRunError((e as Error).message);
    } finally {
      setRunning(null);
    }
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!orderDept || orderTitle.trim().length < 2) return;
    setBusy(true);
    try {
      await api.order(companyId, orderDept, orderTitle.trim());
      setOrderTitle("");
      setOffice(await api.office(companyId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !office) return <p className="error">{error}</p>;
  if (!office) return <p className="hint">오피스를 불러오는 중…</p>;

  const selectedAgent = office.agents.find((a) => a.id === selected) ?? null;
  const ordered = [...office.agents].sort((a, b) => a.id.localeCompare(b.id));
  const ceoRoom = office.ceoVisiting ? layout.roomById.get(office.ceoVisiting) : undefined;
  const ceoPoint = ceoRoom ? ceoRoom.headSeat : layout.ceoDesk;

  return (
    <div className="office">
      <div className="office-bar">
        <div className="office-metrics">
          <span className="metric metric-working">💻 업무 {office.counts.working}</span>
          <span className="metric metric-meeting">💬 회의 {office.counts.meeting}</span>
          <span className="metric metric-resting">☕ 휴식 {office.counts.resting}</span>
          <span className="metric">남은 업무 {office.openTasks}</span>
          <span className="metric metric-dim">{office.tick}일차</span>
        </div>
        <div className="office-controls">
          <button
            type="button"
            className={auto ? "toggle-btn on" : "toggle-btn"}
            onClick={() => setAuto((v) => !v)}
          >
            {auto ? "⏸ 자동 진행 중" : "▶ 자동 진행"}
          </button>
          <button type="button" className="ghost-btn" onClick={step} disabled={auto}>
            한 스텝
          </button>
        </div>
      </div>

      <form className="order-bar" onSubmit={submitOrder}>
        <span className="order-tag">대표 지시</span>
        <select value={orderDept} onChange={(e) => setOrderDept(e.target.value)}>
          <option value="">부서 선택</option>
          {office.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.emoji} {d.name}
            </option>
          ))}
        </select>
        <input
          value={orderTitle}
          placeholder="예: 경쟁사 상위 10개 썸네일 비교 분석"
          onChange={(e) => setOrderTitle(e.target.value)}
          maxLength={200}
        />
        <button type="submit" disabled={busy || !orderDept || orderTitle.trim().length < 2}>
          지시
        </button>
      </form>

      {error && <p className="error office-error">{error}</p>}
      {office.openTasks === 0 && (
        <p className="hint office-idle">
          남은 업무가 없어 전원이 휴게실에 있습니다. 위에서 업무를 지시해 보세요.
        </p>
      )}

      {/* scale은 transform이라 레이아웃 높이를 줄이지 않는다. 축소한 만큼을
          스테이지 높이에 직접 반영해야 아래쪽에 빈 공간이 남지 않는다. */}
      <div
        className="office-stage"
        ref={stageRef}
        style={{ height: layout.height * scale }}
      >
        <div
          className="office-floor"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${scale})`,
          }}
        >
          {office.departments.map((dept) => {
            const room = layout.roomById.get(dept.id);
            if (!room) return null;
            return (
              <div
                key={dept.id}
                className={room && dept.inMeeting ? "room in-meeting" : "room"}
                style={
                  {
                    left: room.x,
                    top: room.y,
                    width: room.w,
                    height: room.h,
                    "--dept": dept.color,
                  } as React.CSSProperties
                }
              >
                <div className="room-name">
                  {dept.emoji} {dept.name}
                  {dept.inMeeting && <span className="meeting-flag">회의 중</span>}
                </div>
                {room.desks.map((desk, i) => (
                  <div
                    key={i}
                    className="desk"
                    style={{
                      left: desk.x - room.x,
                      top: desk.y - room.y,
                      width: desk.w,
                      height: desk.h,
                    }}
                  >
                    <span className="monitor" />
                  </div>
                ))}
                <div
                  className="table"
                  style={{
                    left: room.table.x - room.x,
                    top: room.table.y - room.y,
                    width: room.table.w,
                    height: room.table.h,
                  }}
                />
              </div>
            );
          })}

          <div
            className="room ceo-room"
            style={{
              left: layout.ceoRoom.x,
              top: layout.ceoRoom.y,
              width: layout.ceoRoom.w,
              height: layout.ceoRoom.h,
            }}
          >
            <div className="room-name">👑 대표실</div>
            <div className="ceo-desk" />
          </div>

          <div
            className="room lounge"
            style={{
              left: layout.lounge.x,
              top: layout.lounge.y,
              width: layout.lounge.w,
              height: layout.lounge.h,
            }}
          >
            <div className="room-name">🍵 탕비실 · 휴게실</div>
            <span className="vending" />
            <span className="sofa" />
          </div>

          {ordered.map((agent, index) => {
            const point = positionOf(agent, index);
            return (
              <button
                key={agent.id}
                type="button"
                className={
                  selected === agent.id ? "char-slot selected" : "char-slot"
                }
                style={{ transform: `translate(${point.x}px, ${point.y}px)`, width: CHAR_W, height: CHAR_H }}
                onClick={() => setSelected(selected === agent.id ? null : agent.id)}
                title={`${agent.name} · ${agent.title}`}
              >
                <span className="char-icon">{ACTIVITY_ICON[agent.activity]}</span>
                <span
                  className={agent.activity === "working" ? "char bob" : "char"}
                  style={{
                    width: CHAR_W,
                    height: CHAR_H,
                    backgroundImage: spriteUrl(
                      colorOf(agent.departmentId),
                      agent.seniority === "lead" ? "lead" : "member",
                    ),
                  }}
                />
                <span className="char-name">{agent.name}</span>
              </button>
            );
          })}

          <div
            className="char-slot ceo-slot"
            style={{ transform: `translate(${ceoPoint.x}px, ${ceoPoint.y}px)`, width: CHAR_W, height: CHAR_H }}
            title="대표이사"
          >
            <span className="char-icon">{office.ceoVisiting ? "🗣" : "👑"}</span>
            <span
              className="char bob"
              style={{
                width: CHAR_W,
                height: CHAR_H,
                backgroundImage: spriteUrl("#facc15", "ceo"),
              }}
            />
            <span className="char-name">대표</span>
          </div>
        </div>
      </div>

      {selectedAgent && (
        <aside className="agent-card">
          <button type="button" className="close-btn" onClick={() => setSelected(null)}>
            ✕
          </button>
          <h3>
            {selectedAgent.name}
            <span className="agent-role">{selectedAgent.title}</span>
          </h3>
          <p className="agent-activity">
            {ACTIVITY_ICON[selectedAgent.activity]} {ACTIVITY_LABEL[selectedAgent.activity]}
          </p>
          <p className="agent-task">
            {selectedAgent.currentTask ?? "지금 맡은 업무가 없습니다."}
          </p>

          {selectedAgent.currentTaskId && (
            <div className="agent-run">
              <button
                type="button"
                className="run-btn"
                onClick={() => execute(selectedAgent.currentTaskId!)}
                disabled={running !== null}
              >
                {running === selectedAgent.currentTaskId ? "실행 중…" : "▶ 이 업무 실행"}
              </button>
              <span className="run-hint">연동한 모델로 실제 호출합니다</span>
            </div>
          )}

          {runError && <p className="error run-error">{runError}</p>}

          {runOutput && runOutput.taskId === selectedAgent.currentTaskId && (
            <div className="agent-output">
              <div className="output-meta">
                {runOutput.provider} · {runOutput.model}
                {runOutput.inputTokens !== null &&
                  ` · 입력 ${runOutput.inputTokens.toLocaleString()} / 출력 ${(
                    runOutput.outputTokens ?? 0
                  ).toLocaleString()} 토큰`}
              </div>
              <pre>{runOutput.output}</pre>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
