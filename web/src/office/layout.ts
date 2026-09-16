/**
 * 오피스 평면도 계산.
 *
 * 좌표는 전부 고정 크기의 가상 평면(px) 위에서 계산하고, 화면 크기에 맞추는
 * 일은 CSS transform: scale 한 번으로 끝낸다. 이렇게 두면 캐릭터 이동을
 * 좌표 보간이 아니라 CSS transition에 맡길 수 있다.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
}

export interface RoomLayout extends Rect {
  id: string;
  /** 책상 4개. 팀장 1 + 팀원 3의 자리. */
  desks: Rect[];
  /** 책상에서 일할 때 캐릭터가 서는 위치. desks와 같은 순서. */
  deskSeats: Point[];
  table: Rect;
  /** 회의 테이블 둘레 자리. */
  meetSeats: Point[];
  /** 대표가 회의에 들어왔을 때 앉는 상석. */
  headSeat: Point;
}

export interface OfficeLayout {
  width: number;
  height: number;
  rooms: RoomLayout[];
  roomById: Map<string, RoomLayout>;
  ceoRoom: Rect;
  ceoDesk: Point;
  lounge: Rect;
  /** 휴게실에서 쉴 때 설 수 있는 자리들. */
  loungeSpots: Point[];
}

export const CHAR_W = 30;
export const CHAR_H = 35;

const PAD = 18;
const GAP = 16;
const COLS = 3;
const ROOM_W = 300;
const ROOM_H = 250;
const CEO_ROOM_W = 214;
/** 휴게실 자리 간격. 이름표까지 들어가야 해서 캐릭터 폭보다 넉넉히 준다. */
const SPOT_W = 54;
const SPOT_H = 46;
const LOUNGE_TOP = 46;
const LOUNGE_MIN_ROWS = 2;

/** 방 안에서의 상대 좌표. 방 하나의 내부 배치는 어디서나 같다. */
function roomInterior(x: number, y: number) {
  const desks: Rect[] = [];
  const deskSeats: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const dx = x + 12 + i * 74;
    const dy = y + 66;
    desks.push({ x: dx, y: dy, w: 54, h: 26 });
    // 캐릭터는 책상 바로 뒤에 선다. 발끝이 책상 상단에 살짝 가리도록.
    deskSeats.push({ x: dx + 12, y: dy - CHAR_H + 6 });
  }

  const table: Rect = { x: x + 70, y: y + 152, w: 160, h: 40 };
  const meetSeats: Point[] = [
    { x: x + 92, y: y + 152 - CHAR_H - 2 },
    { x: x + 156, y: y + 152 - CHAR_H - 2 },
    { x: x + 92, y: y + 196 },
    { x: x + 156, y: y + 196 },
  ];

  return {
    desks,
    deskSeats,
    table,
    meetSeats,
    headSeat: { x: x + 28, y: y + 156 } as Point,
  };
}

/**
 * @param agentCount 전원이 동시에 쉴 수 있어야 하므로 휴게실 크기는
 *   부서 수가 아니라 사람 수로 정한다. 모자라면 이름표가 서로 겹친다.
 */
export function buildLayout(departmentIds: string[], agentCount: number): OfficeLayout {
  const rows = Math.max(1, Math.ceil(departmentIds.length / COLS));
  const cols = Math.min(COLS, Math.max(1, departmentIds.length));

  const rooms: RoomLayout[] = departmentIds.map((id, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = PAD + col * (ROOM_W + GAP);
    const y = PAD + row * (ROOM_H + GAP);
    return { id, x, y, w: ROOM_W, h: ROOM_H, ...roomInterior(x, y) };
  });

  const width = PAD * 2 + cols * ROOM_W + (cols - 1) * GAP;
  const roomsBottom = PAD + rows * ROOM_H + (rows - 1) * GAP;
  const loungeY = roomsBottom + GAP;

  const loungeW = width - PAD * 2 - CEO_ROOM_W - GAP;
  // 마지막 열은 half-step 밀리는 몫까지 감안해 한 칸 뺀다.
  const spotCols = Math.max(1, Math.floor((loungeW - 40) / SPOT_W));
  const spotRows = Math.max(LOUNGE_MIN_ROWS, Math.ceil(agentCount / spotCols));
  const loungeH = LOUNGE_TOP + spotRows * SPOT_H + 14;

  const ceoRoom: Rect = { x: PAD, y: loungeY, w: CEO_ROOM_W, h: loungeH };
  const lounge: Rect = { x: PAD + CEO_ROOM_W + GAP, y: loungeY, w: loungeW, h: loungeH };

  // 줄마다 half-step 어긋나게 둬서 쉬는 사람이 많아도 도열한 것처럼 보이지 않게 한다.
  const loungeSpots: Point[] = [];
  for (let r = 0; r < spotRows; r++) {
    for (let c = 0; c < spotCols; c++) {
      loungeSpots.push({
        x: lounge.x + 20 + c * SPOT_W + (r % 2 === 1 ? SPOT_W / 2 : 0),
        y: lounge.y + LOUNGE_TOP + r * SPOT_H,
      });
    }
  }

  return {
    width,
    height: loungeY + loungeH + PAD,
    rooms,
    roomById: new Map(rooms.map((room) => [room.id, room])),
    ceoRoom,
    ceoDesk: { x: ceoRoom.x + CEO_ROOM_W / 2 - CHAR_W / 2, y: ceoRoom.y + loungeH / 2 - 8 },
    lounge,
    loungeSpots,
  };
}
