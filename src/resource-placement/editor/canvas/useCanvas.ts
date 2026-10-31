import type React from 'react';
import { useDrop } from 'react-dnd';
import type { DragItem } from '../configuration/types';
import type { CanvasProps } from './types';
import styles from './style.module.scss';

export function useCanvas({ components, onSelectComponent, onAddComponent }: CanvasProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'component',
    /* 仅在子节点尚未处理放置时，将组件库的新组件添加到根层。 */
    drop: (item: DragItem, monitor) => {
      if (
        !monitor.didDrop() &&
        item.type === 'component' &&
        item.componentType
      ) {
        // 从组件库拖拽到画布
        onAddComponent(item.componentType);
      }
    },
    /* 收集画布浅层悬停与可放置状态，用于视觉反馈。 */
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  /** 点击画布空白区域时清除组件选择。 */
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    // 检查是否点击了Canvas容器或canvasContent容器（空白区域）
    // 排除点击组件的情况（组件会调用stopPropagation阻止冒泡）
    const isCanvasClick = target === currentTarget;
    const isCanvasContentClick = target.className.includes('canvasContent');

    if (isCanvasClick || isCanvasContentClick) {
      onSelectComponent(undefined);
    }
  };

  const empty = components.length === 0;
  const classNames = [styles.canvas];
  if (empty) classNames.push(styles.emptyCanvas);
  if (isOver && canDrop) classNames.push(styles.dropOver);
  const canvasClassName = classNames.join(' ');

  return { drop, handleCanvasClick, empty, canvasClassName };
}
