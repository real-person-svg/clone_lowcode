export function formatJsonDocument(value: string): string {
  if (!value.trim()) return value;
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // Partial input must remain editable instead of being replaced by an empty object.
    return value;
  }
}
