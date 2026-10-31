import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { DropTargetMonitor } from 'react-dnd';
import { Button, Popconfirm } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';

import { AddComponentHandler, ComponentInstance, DragItem } from '../configuration/types';
import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import ComponentContent from './ComponentContent';
import { ComponentVisibility } from '../runtime/formValuesStore';
import { useNodeSelected } from '../state/selectionStore';
import { useRenderMetric } from '../runtime/performance';
import { getDropPosition } from '../dropPosition';

import styles from './style.module.scss';

export interface ComponentRendererProps {
  component: ComponentInstance;
  index: number;
  fieldPrefix?: string;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onRemoveComponent: (id: string) => void;
  onMove: (
    dragId: string,
    hoverId: string,
    dropPosition: 'before' | 'after' | 'inside',
  ) => void;
  onSelectComponent: (componentId?: string) => void;
  onAddComponent: AddComponentHandler;
}

/** 为组件内容提供选择、拖拽、放置指示和删除工具栏。 */
const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  index,
  onUpdateComponent,
  onRemoveComponent,
  onMove,
  fieldPrefix,
  onSelectComponent,
  onAddComponent,
}) => {
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
    collect: /* 收集当前节点的拖动状态。 */ (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, dropPosition }, drop] = useDrop<
    DragItem,
    { handled: boolean; position: 'before' | 'after' | 'inside' },
    { isOver: boolean; dropPosition: 'before' | 'after' | 'inside' }
  >({
    accept: 'component',
    hover: /* 根据当前指针计算悬停位置，只处理最内层命中的目标。 */ (item: DragItem, monitor: DropTargetMonitor<DragItem, unknown>) => {
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
    drop: /* 根据放下时的指针移动现有节点或插入新组件，避免重复处理。 */ (item: DragItem, monitor) => {
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
    collect: /* 收集浅层悬停状态和当前放置指示位置。 */ (monitor) => ({
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

  return (
    <div
      ref={setRefs}
      className={`${styles.componentWrapper} ${isSelected ? styles.selected : ''} ${
        isDragging ? styles.dragging : ''
      } ${isOver ? styles.dropOver : ''}`}
      onClick={handleClick}
    >
      {isSelected && (
        <div className={styles.componentToolbar}>
          <span className={styles.toolbarActions}>
            {config?.name || component.properties.type}
          </span>
          <div className={styles.toolbarActions}>
            <Popconfirm
              title="确定要删除这个组件吗？"
              onConfirm={/* 确认删除当前组件，并避免误选父节点。 */ (e) => {
                e?.stopPropagation();
                onRemoveComponent(component.id);
              }}
              onCancel={/* 取消删除时阻止事件继续冒泡。 */ (e) => e?.stopPropagation()}
            >
              <Button
                icon={<IconDelete />}
                style={{ color: 'white', height: '100%' }}
                size="small"
                onClick={/* 点击删除按钮时避免触发组件选中逻辑。 */ (e) => e.stopPropagation()}
              />
            </Popconfirm>
          </div>
        </div>
      )}

      <div className={styles.componentContent}>
        <ComponentVisibility expression={component.properties.isShow}>
          <ComponentContent
            component={component}
            fieldPrefix={fieldPrefix}
            onUpdateComponent={onUpdateComponent}
            onRemoveComponent={onRemoveComponent}
            onMove={onMove}
            onSelectComponent={onSelectComponent}
            onAddComponent={onAddComponent}
          />
        </ComponentVisibility>
      </div>

      {isOver && (
        <div className={`${styles.dropIndicator} ${styles[dropPosition]}`} />
      )}
    </div>
  );
};

export default React.memo(ComponentRenderer);
