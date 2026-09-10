export const departments = ['sales', 'marketing', 'development', 'design', 'hr', 'operations'];
export const models = ['gemini_3_flash', 'gemini_3_1_pro', 'gpt_5_mini', 'gpt_5_4', 'claude_sonnet_4_6', 'claude_opus_4_6'];
export const leaders = { sales: '세일', marketing: '마크', development: '데브', design: '드로', hr: '피플', operations: '오피' };
export function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}