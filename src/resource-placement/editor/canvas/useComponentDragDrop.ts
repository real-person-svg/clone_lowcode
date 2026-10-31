import React from 'react';
import { useDrag, useDrop, type DropTargetMonitor } from 'react-dnd';
import type { DragItem } from '../configuration/types';
import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import { useNodeSelected } from '../state/selectionStore';
import { useRenderMetric } from '../runtime/performance';
import { getDropPosition } from './dropPosition';
import type { ComponentRendererProps } from './types';
import styles from './style.module.scss';

/** 管理单个画布节点的选择、拖放和删除交互。 */
export function useComponentDragDrop({ component, index, onMove, onSelectComponent, onAddComponent, onRemoveComponent }: ComponentRendererProps) {
  useRenderMetric('shell');
  const isSelected = useNodeSelected(component.id);
  const config =
    COMPONENT_CONFIGS[(component.properties.type || '').replace(/^Form/, '')];
  const [currentDropPosition, setCurrentDropPosition] = React.useState<
    'before' | 'after' | 'inside' | null
  >(null);
  const nodeRef = React.useRef<HTMLDivElement | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: {
      type: 'existing-component',
      id: component.id,
      index,
    },
    /* 收集当前节点的拖动状态。 */
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, dropPosition }, drop] = useDrop<
    DragItem,
    { handled: boolean; position: 'before' | 'after' | 'inside' },
    { isOver: boolean; dropPosition: 'before' | 'after' | 'inside' }
  >({
    accept: 'component',
    /* 根据当前指针计算悬停位置，只处理最内层命中的目标。 */
    hover: (item: DragItem, monitor: DropTargetMonitor<DragItem, unknown>) => {
      const el = nodeRef.current;
      if (!el) {
        return;
      }

      if (!monitor.isOver({ shallow: true })) {
        setCurrentDropPosition(null);
        return;
      }

      if (item.type === 'existing-component' && item.id === component.id) {
        setCurrentDropPosition(null);
        return;
      }

      setCurrentDropPosition(
        getDropPosition(
          el.getBoundingClientRect(),
          monitor.getClientOffset(),
          Boolean(config?.allowChildren),
        ),
      );
    },
    /* 根据放下时的指针移动现有节点或插入新组件，避免重复处理。 */
    drop: (item: DragItem, monitor) => {
      // 嵌套目标已完成放置时，父目标不再重复移动或插入同一组件。
      if (monitor.didDrop()) {
        return undefined;
      }

      // 放下动作读取实时指针和矩形；悬停状态只画指示线，可能尚未提交或已过期。
      const position =
        getDropPosition(
          nodeRef.current?.getBoundingClientRect() ?? null,
          monitor.getClientOffset(),
          Boolean(config?.allowChildren),
        ) ??
        (item.type === 'component' && config?.allowChildren
          ? 'inside'
          : 'after');

      if (item.type === 'existing-component' && item.id !== component.id) {
        onMove(item.id!, component.id, position);
        setCurrentDropPosition(null);
        return { handled: true, position };
      }

      if (item.type === 'component' && item.componentType) {
        if (position === 'inside' && config?.allowChildren) {
          onAddComponent(item.componentType, component.id);
        } else {
          const insertParent = component.parent;
          const insertIndex = position === 'before' ? index : index + 1;
          onAddComponent(item.componentType, insertParent, insertIndex);
        }

        setCurrentDropPosition(null);
        return { handled: true, position };
      }

      return undefined;
    },
    /* 收集浅层悬停状态和当前放置指示位置。 */
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      dropPosition: currentDropPosition || 'after',
    }),
  });

  // 回调 ref 合并 drag 和 drop
  /** 将同一个 DOM 节点同时注册为拖动源和放置目标。 */
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      drag(node);
      drop(node);
    },
    [drag, drop],
  );

  /** 选中当前组件，并阻止点击冒泡到父节点。 */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectComponent(component.id);
  };

  const remove = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    onRemoveComponent(component.id);
  };

  const stopPropagation = (event?: React.MouseEvent) => event?.stopPropagation();

  const wrapperClassName = `${styles.componentWrapper} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${isOver ? styles.dropOver : ''}`;
  const indicatorClassName = `${styles.dropIndicator} ${styles[dropPosition]}`;
  const label = config?.name || component.properties.type;

  return {
    isSelected,
    isOver,
    setRefs,
    handleClick,
    remove,
    stopPropagation,
    wrapperClassName,
    indicatorClassName,
    label
  };
}
