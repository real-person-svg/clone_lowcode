import React from 'react';
import { useDrop } from 'react-dnd';
import { Empty } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

import { AddComponentHandler, ComponentInstance, DragItem } from '../configuration/types';
import ComponentRenderer from './ComponentRenderer';
import { SelectionContext, SelectionStore } from '../state/selectionStore';
import { CanvasProfiler } from '../runtime/performance';
import { CanvasForm } from '../runtime/formValuesStore';

import styles from './style.module.scss';

interface CanvasProps {
  components: ComponentInstance[];
  selectionStore: SelectionStore;
  onSelectComponent: (componentId?: string) => void;
  onUpdateComponent: (
    componentId: string,
    updates: Partial<ComponentInstance>,
  ) => void;
  onRemoveComponent: (componentId: string) => void;
  onMoveComponent: (
    dragId: string,
    hoverId: string,
    dropPosition: 'before' | 'after' | 'inside',
  ) => void;
  onAddComponent: AddComponentHandler;
}

/** 展示组件树画布，提供表单、选择上下文及根级拖放入口。 */
const Canvas: React.FC<CanvasProps> = ({
  components,
  selectionStore,
  onSelectComponent,
  onUpdateComponent,
  onRemoveComponent,
  onMoveComponent,
  onAddComponent,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'component',
    drop: /* 仅在子节点尚未处理放置时，将组件库的新组件添加到根层。 */ (item: DragItem, monitor) => {
      if (
        !monitor.didDrop() &&
        item.type === 'component' &&
        item.componentType
      ) {
        // 从组件库拖拽到画布
        onAddComponent(item.componentType);
      }
    },
    collect: /* 收集画布浅层悬停与可放置状态，用于视觉反馈。 */ (monitor) => ({
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

  if (components.length === 0) {
    return (
      <div
        ref={drop}
        className={`${styles.canvas} ${styles.emptyCanvas} ${isOver && canDrop ? styles.dropOver : ''}`}
        onClick={handleCanvasClick}
      >
        <Empty
          image={<IconPlus size="extra-large" />}
          title="开始搭建您的资源位"
          description="从左侧组件库中点击组件添加到此处"
        />
      </div>
    );
  }

  return (
    <div
      ref={drop}
      className={`${styles.canvas} ${isOver && canDrop ? styles.dropOver : ''}`}
      onClick={handleCanvasClick}
    >
      <SelectionContext.Provider value={selectionStore}>
        <CanvasProfiler>
          <div className={styles.canvasContent}>
            <CanvasForm>
              {components.map(/* 按组件树顺序渲染根级组件及编辑操作。 */ (component, index) => (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  index={index}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveComponent={onRemoveComponent}
                  onMove={onMoveComponent}
                  onSelectComponent={onSelectComponent}
                  onAddComponent={onAddComponent}
                />
              ))}
            </CanvasForm>
          </div>
        </CanvasProfiler>
      </SelectionContext.Provider>
    </div>
  );
};

export default React.memo(Canvas);
