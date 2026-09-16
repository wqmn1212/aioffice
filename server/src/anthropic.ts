import Anthropic from "@anthropic-ai/sdk";

/** 자격증명은 환경에서 자동 해석된다. 키를 코드에 넣지 않는다. */
export const anthropic = new Anthropic();

export const LEAD_MODEL = "claude-opus-5";
