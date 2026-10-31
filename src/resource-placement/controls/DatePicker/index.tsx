import React from 'react';
import { DatePicker } from '@douyinfe/semi-ui';
import { DatePickerProps } from '@douyinfe/semi-ui/lib/es/datePicker';

import { toDateValue } from './dateValue';
import styles from './style.module.scss';

export interface Props extends Omit<DatePickerProps, 'onChange'> {
  onChange: (v: number) => void;
}

/** 包装日期选择控件，统一向表单输出时间戳或时间戳数组。 */
const ControlDatePicker = (props: Props) => {
  const { onChange: publishChange } = props;

  /** 将清空、单日期和日期范围转换为对应的表单值。 */
  const onChange = React.useCallback(
    (value: any) => publishChange?.(toDateValue(value) as number),
    [publishChange],
  );

  return (
    <DatePicker
      showClear
      {...props}
      onChange={onChange}
      className={`${styles['control_date_picker']} ${props.className || ''}`}
    />
  );
};

export default ControlDatePicker;
