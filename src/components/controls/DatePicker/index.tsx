import React from 'react';
import { DatePicker } from '@douyinfe/semi-ui';
import { DatePickerProps } from '@douyinfe/semi-ui/lib/es/datePicker';

import styles from './style.module.scss';

export interface Props extends Omit<DatePickerProps, 'onChange'> {
  onChange: (v: number) => void;
}

/** 包装日期选择控件，统一向表单输出时间戳或时间戳数组。 */
const ControlDatePicker = (props: Props) => {
  /** 将清空、单日期和日期范围转换为对应的表单值。 */
  const onChange = React.useCallback(
    (v: any) => {
      let temp = v;
      if (!v) {
        temp = undefined;
      } else if (Array.isArray(v)) {
        temp = v.map(/* 将范围中的单个日期转换为毫秒时间戳。 */ (i) => {
          const temp = new Date(i);
          return temp.getTime();
        });
      } else {
        temp = new Date(v);
        temp = temp.getTime();
      }
      props?.onChange?.(temp);
    },
    [props.onChange],
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
