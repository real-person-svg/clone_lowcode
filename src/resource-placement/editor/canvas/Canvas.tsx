import React from 'react';
import { Empty } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

import ComponentRenderer from './ComponentRenderer';
import { SelectionContext } from '../state/selectionStore';
import { CanvasProfiler } from '../runtime/performance';
import { CanvasForm } from '../runtime/formValuesStore';

import { useCanvas } from './useCanvas';
import type { CanvasProps } from './types';
import styles from './style.module.scss';

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
  const { drop, handleCanvasClick, empty, canvasClassName } = useCanvas({
    components, selectionStore, onSelectComponent, onUpdateComponent,
    onRemoveComponent, onMoveComponent, onAddComponent,
  });

  if (empty) {
    return (
      <div
        ref={drop}
        className={canvasClassName}
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
      className={canvasClassName}
      onClick={handleCanvasClick}
    >
      <SelectionContext.Provider value={selectionStore}>
        <CanvasProfiler>
          <div className={styles.canvasContent}>
            <CanvasForm>
              {components.map(
                /* 按组件树顺序渲染根级组件及编辑操作。 */
                (component, index) => (
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
