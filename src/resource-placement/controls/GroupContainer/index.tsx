import React, { CSSProperties } from 'react';

import styles from './style.module.scss';

export interface Props {
  children: React.ReactNode[];
  style?: CSSProperties;
}

/** 组合展示多个子控件，并为每项补充分组样式。 */
const GroupContainer = ({ children, style }: Props) => (
  <div className={styles['group_container_wrapper']} style={style}>
    {React.Children.map(children,
      /* 保留子控件属性并追加组内项样式。 */
      (child: any) =>
        React.cloneElement(child, {
          ...child.props,
          className: `${child.props.className || ''} ${styles['group_item']}`,
        }),
    )}
  </div>
);

export default GroupContainer;
