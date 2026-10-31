import React from 'react';
import { useDrag } from 'react-dnd';
import { Typography, Collapse } from '@douyinfe/semi-ui';

import { COMPONENT_CONFIGS } from './componentConfigs';
import { AddComponentHandler, ComponentType } from '../configuration/types';

import styles from './style.module.scss';

const { Text } = Typography;
const { Panel } = Collapse;

interface DraggableComponentProps {
  config: ComponentType;
  onAddComponent: AddComponentHandler;
}

/** 展示可拖拽的组件库条目，也支持点击添加。 */
const DraggableComponent: React.FC<DraggableComponentProps> = ({
  config,
  onAddComponent,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: {
      type: 'component',
      componentType: config.type,
      name: config.name,
    },
    collect: /* 收集组件库条目的拖动状态。 */ (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  /** 点击时将该类型的新组件添加到画布。 */
  const handleClick = () => {
    onAddComponent(config.type);
  };

  return (
    <div
      ref={drag}
      className={`${styles.componentItem} ${isDragging ? styles.dragging : ''}`}
      onClick={handleClick}
    >
      <div className={styles.componentIcon}>{config.icon}</div>
      <Text size="small">{config.name}</Text>
    </div>
  );
};

interface ComponentLibraryProps {
  onAddComponent: AddComponentHandler;
}

/** 按类别展示可供添加的组件库。 */
const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
}) => {
  // 按类别分组组件
  /** 将注册组件分组为布局组件和输入控件。 */
  const componentsByCategory = React.useMemo(() => {
    const categories: Record<
      string,
      { name: string; components: ComponentType[] }
    > = {
      layout: { name: '布局组件', components: [] as ComponentType[] },
      input: { name: '输入控件', components: [] as ComponentType[] },
    };

    Object.values(COMPONENT_CONFIGS).forEach(/* 将组件加入其已定义的分类。 */ (config) => {
      if (categories[config.category]) {
        categories[config.category].components.push(config);
      }
    });

    return categories;
  }, []);

  return (
    <div className={styles.componentLibrary}>
      <div className={styles.libraryHeader}>
        <Text strong>组件库</Text>
      </div>

      <div className={styles.libraryContent}>
        <Collapse defaultActiveKey={['layout', 'input', 'business', 'display']}>
          {Object.entries(componentsByCategory).map(/* 为每个组件分类渲染折叠面板。 */ ([key, category]) => (
            <Panel key={key} header={category.name} itemKey={key}>
              <div className={styles.componentGrid}>
                {category.components.map(/* 在分类内渲染可拖拽组件条目。 */ (config) => (
                  <DraggableComponent
                    key={config.type}
                    config={config}
                    onAddComponent={onAddComponent}
                  />
                ))}
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default ComponentLibrary;
