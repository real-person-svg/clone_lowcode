import React from 'react';
import { Button, Popconfirm } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';
import ComponentContent from './ComponentContent';
import { ComponentVisibility } from '../runtime/formValuesStore';
import { useComponentDragDrop } from './useComponentDragDrop';
import type { ComponentRendererProps } from './types';
import styles from './style.module.scss';
export type { ComponentRendererProps } from './types';

/** 为控件内容组合选择工具栏和拖放指示。 */
const ComponentRenderer: React.FC<ComponentRendererProps> = (props) => {
  const { component, fieldPrefix, onUpdateComponent, onRemoveComponent, onMove, onSelectComponent, onAddComponent } = props;
  const {
    isSelected,
    isOver,
    setRefs,
    handleClick,
    remove,
    stopPropagation,
    wrapperClassName,
    indicatorClassName,
    label
  } = useComponentDragDrop(props);

  return (
    <div
      ref={setRefs}
      className={wrapperClassName}
      onClick={handleClick}
    >
      {isSelected && (
        <div className={styles.componentToolbar}>
          <span className={styles.toolbarActions}>
            {label}
          </span>
          <div className={styles.toolbarActions}>
            <Popconfirm
              title="确定要删除这个组件吗？"
              onConfirm={remove}
              onCancel={stopPropagation}
            >
              <Button
                icon={<IconDelete />}
                style={{ color: 'white', height: '100%' }}
                size="small"
                onClick={stopPropagation}
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
        <div className={indicatorClassName} />
      )}
    </div>
  );
};

export default React.memo(ComponentRenderer);
