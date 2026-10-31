import React, { CSSProperties } from 'react';

import styles from './style.module.scss';

export interface Props {
  children: React.ReactNode;
  style?: CSSProperties;
}

/** 按列布局展示子控件，并透传容器样式。 */
const ColumnContainer = ({ children, style }: Props) => (
  <div className={styles.column_container_wrapper} style={style}>
    {children}
  </div>
);

export default ColumnContainer;
