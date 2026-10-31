export type DropPosition = 'before' | 'after' | 'inside';

/** 根据当前指针计算放置位置；容器边缘插入同级，中部放入内部。 */
export function getDropPosition(
  rect: { top: number; bottom: number } | null,
  pointer: { y: number } | null,
  allowChildren: boolean,
): DropPosition | null {
  if (!rect || !pointer) return null;
  const offset = pointer.y - rect.top;
  const height = rect.bottom - rect.top;
  // 容器上下各 10 像素保留同级插入区，其余区域接纳子节点；叶子按中线分前后。
  if (allowChildren) {
    if (offset < 10) return 'before';
    if (offset > height - 10) return 'after';
    return 'inside';
  }
  return offset < height / 2 ? 'before' : 'after';
}
