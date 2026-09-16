/**
 * 저장용 대칭 암호화.
 *
 * 팀이 맡긴 API 키를 평문으로 두지 않기 위한 최소 장치다. AES-256-GCM이라
 * 복호화 시점에 위변조도 같이 걸러진다.
 *
 * 한계를 분명히 해 둔다 — 마스터 키가 같은 서버의 환경변수에 있으므로,
 * 서버가 통째로 털리면 이 암호화는 의미가 없다. 이건 '디스크·백업·DB 파일이
 * 유출됐을 때'를 막는 장치지, 서버 침해를 막는 장치가 아니다. 그 이상이
 * 필요해지면 KMS나 외부 시크릿 매니저로 옮겨야 한다.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // GCM 표준 nonce 길이
const TAG_LEN = 16;

/**
 * 마스터 키는 환경변수에서만 온다. 없으면 기본값으로 때우지 않고 던진다 —
 * 조용히 약한 키로 암호화하는 것이 암호화를 안 하는 것보다 나쁘다.
 * 안전하다고 착각하게 만들기 때문이다.
 */
function masterKey(): Buffer {
  const secret = process.env.AIOFFICE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AIOFFICE_SECRET이 설정되지 않았습니다(16자 이상). API 키를 저장하려면 " +
        ".env에 충분히 긴 임의 문자열을 넣어 주세요.",
    );
  }
  // 고정 salt를 쓰는 대신 secret 자체를 salt로도 섞는다. 저장소마다 키가
  // 달라지므로 한 서비스의 DB를 다른 서비스 키로 열 수 없다.
  return scryptSync(secret, "aioffice:credentials:v1", 32);
}

export function hasMasterKey(): boolean {
  const secret = process.env.AIOFFICE_SECRET;
  return Boolean(secret && secret.length >= 16);
}

/** 평문 → "iv.tag.ciphertext" (모두 base64url). */
export function seal(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, body].map((b) => b.toString("base64url")).join(".");
}

/** seal()의 역. 위변조되었거나 다른 키로 봉한 값이면 던진다. */
export function open(sealed: string): string {
  const parts = sealed.split(".");
  if (parts.length !== 3) throw new Error("저장된 자격증명 형식이 올바르지 않습니다");

  const [iv, tag, body] = parts.map((p) => Buffer.from(p, "base64url"));
  if (!iv || !tag || !body || iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("저장된 자격증명이 손상되었습니다");
  }

  const decipher = createDecipheriv(ALGO, masterKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

/**
 * 화면에 돌려줄 마스킹 값. 키 자체는 저장 후 두 번 다시 내보내지 않으므로,
 * 어떤 키를 넣었는지 사용자가 알아볼 수 있을 만큼만 남긴다.
 */
export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "•".repeat(trimmed.length);
  return `${trimmed.slice(0, 4)}${"•".repeat(6)}${trimmed.slice(-4)}`;
}

/** 길이 노출 없이 비교해야 하는 곳을 위한 헬퍼. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
