import React from 'react';
import { Select } from '@douyinfe/semi-ui';
import type { SelectProps } from '@douyinfe/semi-ui/lib/es/select';
import styles from './style.module.scss';
export const LocalSelect =
  Select as unknown as React.ComponentType<SelectProps>;
/** The editor uses local options, including the language and region enumerations. */
export default function ControlSelect(props: SelectProps) {
  return (
    <LocalSelect
      {...props}
      className={`${styles.control_select} ${props.className || ''}`}
    />
  );
}
