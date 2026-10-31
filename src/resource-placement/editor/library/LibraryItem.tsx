import React from 'react';
import { Typography } from '@douyinfe/semi-ui';
import type { AddComponentHandler, ComponentType } from '../configuration/types';
import { useLibraryItem } from './useLibraryItem';
import styles from './style.module.scss';

const { Text } = Typography;

interface DraggableComponentProps {
  config: ComponentType;
  onAddComponent: AddComponentHandler;
}

/** 展示可拖拽的组件库条目，也支持点击添加。 */
const LibraryItem: React.FC<DraggableComponentProps> = ({
  config,
  onAddComponent,
}) => {
  const { drag, handleClick, className } = useLibraryItem(config, onAddComponent);

  return (
    <div
      ref={drag}
      className={className}
      onClick={handleClick}
    >
      <div className={styles.componentIcon}>{config.icon}</div>
      <Text size="small">{config.name}</Text>
    </div>
  );
};

export default LibraryItem;
