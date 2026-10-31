import React, { CSSProperties } from 'react';

import styles from './style.module.scss';

export interface Props {
  children: React.ReactNode;
  style?: CSSProperties;
}

const ColumnContainer = ({ children, style }: Props) => (
  <div className={styles.column_container_wrapper} style={style}>
    {children}
  </div>
);

export default ColumnContainer;
