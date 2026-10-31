export type DropPosition = 'before' | 'after' | 'inside';

/** Use the current pointer for the action; React state only paints the indicator. */
export function getDropPosition(
  rect: { top: number; bottom: number } | null,
  pointer: { y: number } | null,
  allowChildren: boolean,
): DropPosition | null {
  if (!rect || !pointer) return null;
  const offset = pointer.y - rect.top;
  const height = rect.bottom - rect.top;
  if (allowChildren) {
    if (offset < 10) return 'before';
    if (offset > height - 10) return 'after';
    return 'inside';
  }
  return offset < height / 2 ? 'before' : 'after';
}
