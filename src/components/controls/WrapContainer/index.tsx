import React, { CSSProperties } from 'react';

import styles from './style.module.scss';

export interface Props {
  children: React.ReactNode;
  style?: CSSProperties;
}

const WrapContainer = ({ children, style }: Props) => (
  <div className={styles['wrap_container_wrapper']} style={style}>
    {children}
  </div>
);

export default WrapContainer;
