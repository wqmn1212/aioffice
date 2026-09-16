/**
 * 도트 캐릭터 스프라이트.
 *
 * PNG 자산을 두지 않고 문자 그리드에서 SVG를 만들어 쓴다. 팀 색이 부서마다
 * 다르고 부서는 앞으로 더 늘어나므로, 색을 바꿔 끼울 수 있는 편이 낫다.
 * 결과는 data URL 한 장이라 <img>/background-image로 바로 붙는다.
 *
 * 글자 의미: . 투명 / H 머리 / S 피부 / C 팀색(셔츠) / P 바지 / E 눈 / A 강조
 */

const BODY = [
  "...HHHHHH...",
  "..HHHHHHHH..",
  ".HHHHHHHHHH.",
  ".HSSSSSSSSH.",
  ".HSESSSSESH.",
  "..SSSSSSSS..",
  "..SSSAASSS..",
  "...SSSSSS...",
  "..CCCCCCCC..",
  ".CCCCCCCCCC.",
  ".SCCCCCCCCS.",
  ".SCCCCCCCCS.",
  "..PPP..PPP..",
  "..PPP..PPP..",
];

/** 팀장은 넥타이로 구분한다. 가슴 한가운데 두 칸. */
const LEAD_MARK: Array<[number, number]> = [
  [9, 5],
  [9, 6],
  [10, 5],
  [10, 6],
];

/** 대표는 왕관. 머리 위 한 줄을 덮어쓴다. */
const CEO_CROWN: Array<[number, number]> = [
  [0, 3],
  [0, 5],
  [0, 7],
  [0, 8],
  [1, 3],
  [1, 4],
  [1, 5],
  [1, 6],
  [1, 7],
  [1, 8],
];

export type SpriteVariant = "member" | "lead" | "ceo";

export interface SpritePalette {
  /** 셔츠 색. 부서 색을 그대로 쓴다. */
  shirt: string;
  hair: string;
  skin: string;
  pants: string;
  /** 넥타이·왕관 색. */
  accent: string;
}

export const SPRITE_W = BODY[0]!.length;
export const SPRITE_H = BODY.length;

const CHAR_COLOR: Record<string, keyof SpritePalette | null> = {
  ".": null,
  H: "hair",
  S: "skin",
  C: "shirt",
  P: "pants",
  E: "hair", // 눈은 머리색과 같은 톤으로 찍어야 도트에서 깔끔하다.
  A: "skin",
};

function paletteFor(shirt: string, variant: SpriteVariant): SpritePalette {
  return {
    shirt,
    hair: "#2b2118",
    skin: "#f2c9a0",
    pants: variant === "ceo" ? "#2f2a3d" : "#3c4457",
    accent: variant === "ceo" ? "#facc15" : "#ffffff",
  };
}

/** 그리드를 픽셀 rect가 늘어선 SVG 문자열로 편다. */
function renderSvg(shirt: string, variant: SpriteVariant): string {
  const palette = paletteFor(shirt, variant);
  const overlay = new Map<string, string>();

  if (variant === "lead") {
    for (const [y, x] of LEAD_MARK) overlay.set(`${x},${y}`, palette.accent);
  }
  if (variant === "ceo") {
    for (const [y, x] of CEO_CROWN) overlay.set(`${x},${y}`, palette.accent);
  }

  const rects: string[] = [];
  for (let y = 0; y < BODY.length; y++) {
    const row = BODY[y]!;
    for (let x = 0; x < row.length; x++) {
      const forced = overlay.get(`${x},${y}`);
      const key = CHAR_COLOR[row[x]!];
      const fill = forced ?? (key ? palette[key] : null);
      if (!fill) continue;
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SPRITE_W}" height="${SPRITE_H}" ` +
    `viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" shape-rendering="crispEdges">${rects.join("")}</svg>`
  );
}

// 부서 수만큼만 만들어지므로 캐시가 무한정 커지지 않는다.
const cache = new Map<string, string>();

/** 배경 이미지에 바로 넣을 수 있는 data URL. */
export function spriteUrl(shirt: string, variant: SpriteVariant): string {
  const key = `${shirt}|${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url = `url("data:image/svg+xml,${encodeURIComponent(renderSvg(shirt, variant))}")`;
  cache.set(key, url);
  return url;
}
