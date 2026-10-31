import { useDrag } from 'react-dnd';
import type { AddComponentHandler, ComponentType } from '../configuration/types';
import styles from './style.module.scss';

export function useLibraryItem(config: ComponentType, onAddComponent: AddComponentHandler) {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: {
      type: 'component',
      componentType: config.type,
      name: config.name,
    },
    /* 收集组件库条目的拖动状态。 */
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  /** 点击时将该类型的新组件添加到画布。 */
  const handleClick = () => {
    onAddComponent(config.type);
  };

  const className = `${styles.componentItem} ${isDragging ? styles.dragging : ''}`;

  return { drag, handleClick, className };
}
