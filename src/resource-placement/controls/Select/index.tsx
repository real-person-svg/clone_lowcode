import React from 'react';
import { Select } from '@douyinfe/semi-ui';
import type { SelectProps } from '@douyinfe/semi-ui/lib/es/select';
import styles from './style.module.scss';
export const LocalSelect =
  Select as unknown as React.ComponentType<SelectProps>;

/** 包装本地下拉选择器，保留原生属性及统一样式。 */
export default function ControlSelect(props: SelectProps) {
  return (
    <LocalSelect
      {...props}
      className={`${styles.control_select} ${props.className || ''}`}
    />
  );
}
