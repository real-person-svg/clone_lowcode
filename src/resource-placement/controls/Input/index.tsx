import React from 'react';
import { Input } from '@douyinfe/semi-ui';
import { InputProps } from '@douyinfe/semi-ui/lib/es/input';

import styles from './style.module.scss';

export interface Props extends Omit<InputProps, 'onChange'> {
  onChange: (v: string) => void;
}

/** 包装文本输入框，在失焦时去除首尾空白。 */
const ControlInput = (props: Props) => {
  const { onChange: publishChange } = props;

  /** 将去除首尾空白的输入值通知表单。 */
  const onBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (typeof value === 'string' && typeof publishChange === 'function') {
        publishChange(value.trim());
      }
    },
    [publishChange],
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
