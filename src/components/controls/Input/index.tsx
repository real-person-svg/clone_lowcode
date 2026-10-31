import React from 'react';
import { Input, withField } from '@douyinfe/semi-ui';
import { InputProps } from '@douyinfe/semi-ui/lib/es/input';

import styles from './style.module.scss';

export interface Props extends Omit<InputProps, 'onChange'> {
  onChange: (v: string) => void;
}

const ControlInput = (props: Props) => {
  const onBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (typeof value === 'string' && typeof props.onChange === 'function') {
        props.onChange(value.trim());
      }
    },
    [props?.onChange],
  );
  return (
    <Input
      {...props}
      autoComplete="off"
      onBlur={onBlur}
      className={`${styles['control_input']} ${props.className || ''}`}
    />
  );
};

export default ControlInput;
