import React from 'react';

import styles from './style.module.scss';

export interface TitleProps {
  value: string | number;
  size?: 'default' | 'small';
}

const sizeClassNameMap = {
  default: '',
  small: styles.small,
};

/** 按指定尺寸展示控件标题。 */
const ControlTitle = ({ value, size = 'default' }: TitleProps) => (
  <div className={`${styles['control_title']} ${sizeClassNameMap[size]}`}>
    {value}
  </div>
);

export default ControlTitle;
