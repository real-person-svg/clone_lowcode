import React from 'react';
import { Typography, Collapse } from '@douyinfe/semi-ui';

import LibraryItem from './LibraryItem';
import { groupComponents, defaultActiveCategories } from './categories';
import { COMPONENT_CONFIGS } from './componentConfigs';
import { AddComponentHandler } from '../configuration/types';

import styles from './style.module.scss';

const { Text } = Typography;
const { Panel } = Collapse;

interface ComponentLibraryProps {
  onAddComponent: AddComponentHandler;
}

/** 按类别展示可供添加的组件库。 */
const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
}) => {
  const componentsByCategory = React.useMemo(() => groupComponents(COMPONENT_CONFIGS), []);

  return (
    <div className={styles.componentLibrary}>
      <div className={styles.libraryHeader}>
        <Text strong>组件库</Text>
      </div>

      <div className={styles.libraryContent}>
        <Collapse defaultActiveKey={defaultActiveCategories}>
          {Object.entries(componentsByCategory).map(
            /* 为每个组件分类渲染折叠面板。 */
            ([key, category]) => (
              <Panel key={key} header={category.name} itemKey={key}>
                <div className={styles.componentGrid}>
                  {category.components.map(
                    /* 在分类内渲染可拖拽组件条目。 */
                    (config) => (
                      <LibraryItem
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
