import React, { CSSProperties } from 'react';

import styles from './style.module.scss';

export interface Props {
  children: React.ReactNode[];
  style?: CSSProperties;
}

const GroupContainer = ({ children, style }: Props) => (
  <div className={styles['group_container_wrapper']} style={style}>
    {React.Children.map(children, (child: any) =>
      React.cloneElement(child, {
        ...child.props,
        className: `${child.props.className || ''} ${styles['group_item']}`,
      }),
    )}
  </div>
);

export default GroupContainer;
