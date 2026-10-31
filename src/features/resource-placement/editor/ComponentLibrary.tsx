import React from 'react';
import { useDrag } from 'react-dnd';
import { Typography, Collapse } from '@douyinfe/semi-ui';

import { COMPONENT_CONFIGS } from './componentConfigs';
import { AddComponentHandler, ComponentType } from './types';

import styles from './style.module.scss';

const { Text } = Typography;
const { Panel } = Collapse;

interface DraggableComponentProps {
  config: ComponentType;
  onAddComponent: AddComponentHandler;
}

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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

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

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
}) => {
  // 按类别分组组件
  const componentsByCategory = React.useMemo(() => {
    const categories: Record<
      string,
      { name: string; components: ComponentType[] }
    > = {
      layout: { name: '布局组件', components: [] as ComponentType[] },
      input: { name: '输入控件', components: [] as ComponentType[] },
    };

    Object.values(COMPONENT_CONFIGS).forEach((config) => {
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
          {Object.entries(componentsByCategory).map(([key, category]) => (
            <Panel key={key} header={category.name} itemKey={key}>
              <div className={styles.componentGrid}>
                {category.components.map((config) => (
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
