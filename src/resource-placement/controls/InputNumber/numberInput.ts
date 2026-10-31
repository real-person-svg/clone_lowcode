export function formatNumberInput(raw: string | number, canInputZero: boolean, canInputFloat: boolean, showClear: boolean | undefined, value: unknown) {
  const text = String(raw);
  if (showClear && text === '') return '';

  const parsed = canInputFloat ? Number.parseFloat(text) : Number.parseInt(text, 10);
  if (Number.isNaN(parsed)) {
    if (canInputZero) return '0';
    return text.startsWith('-') ? '-1' : '1';
  }

  if (!canInputZero && parsed === 0) {
    const negative = text.startsWith('-') || (typeof value === 'number' && value > 0);
    return negative ? '-1' : '1';
  }

  return String(parsed);
}
