import React from 'react';
import { DatePicker } from '@douyinfe/semi-ui';
import { DatePickerProps } from '@douyinfe/semi-ui/lib/es/datePicker';

import styles from './style.module.scss';

export interface Props extends Omit<DatePickerProps, 'onChange'> {
  onChange: (v: number) => void;
}

const ControlDatePicker = (props: Props) => {
  const onChange = React.useCallback(
    (v: any) => {
      let temp = v;
      if (!v) {
        temp = undefined;
      } else if (Array.isArray(v)) {
        temp = v.map((i) => {
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
