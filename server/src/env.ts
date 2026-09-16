/**
 * API 포트.
 *
 * 범용 PORT보다 API_PORT를 먼저 본다. 상위 도구(에디터 미리보기, 태스크
 * 러너)가 웹 포트를 PORT로 주입하는 일이 있는데, 그걸 그대로 쓰면 API가
 * Vite와 같은 포트에 붙는다. 두 프로세스가 각각 IPv4/IPv6에 바인딩되면
 * 충돌 에러도 없이 프록시만 조용히 실패하므로 원인을 찾기가 어렵다.
 */
export const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 8787);

/**
 * Anthropic 자격증명은 SDK가 환경에서 직접 읽는다(ANTHROPIC_API_KEY 등).
 * 여기서는 키가 아예 없을 때 서버 시작 시점에 알려주기만 한다.
 */
export function hasAnthropicCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
