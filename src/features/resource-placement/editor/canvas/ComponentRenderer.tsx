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
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) {
        return undefined;
      }

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
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      dropPosition: currentDropPosition || 'after',
    }),
  });

  // 回调 ref 合并 drag 和 drop
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      drag(node);
      drop(node);
    },
    [drag, drop],
  );

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
              onConfirm={(e) => {
                e?.stopPropagation();
                onRemoveComponent(component.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <Button
                icon={<IconDelete />}
                style={{ color: 'white', height: '100%' }}
                size="small"
                onClick={(e) => e.stopPropagation()}
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
