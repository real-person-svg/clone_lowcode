/** 格式化有效 JSON 以便编辑，空白或不完整文本保持原样。 */
export function formatJsonDocument(value: string): string {
  if (!value.trim()) return value;
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // Partial input must remain editable instead of being replaced by an empty object.
    return value;
  }
}
