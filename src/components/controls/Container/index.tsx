import React, { CSSProperties } from 'react';

import styles from './style.module.scss';

export interface Props {
  children: React.ReactNode;
  style?: CSSProperties;
}

// 一个单纯的Container，为了方便对一系列组件进行isShow等的统一控制
const Container = ({ children, style }: Props) => (
  <div style={style} className={styles['control_container']}>
    {children}
  </div>
);

export default Container;
