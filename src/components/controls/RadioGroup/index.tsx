import React from 'react';
import { RadioGroup } from '@douyinfe/semi-ui';
import { RadioGroupProps } from '@douyinfe/semi-ui/lib/es/radio';

import styles from './style.module.scss';

/** 为单选组透传属性并应用统一控件样式。 */
const ControlRadioGroup = (props: RadioGroupProps) => (
  <RadioGroup {...props} className={styles['control_radio_group']} />
);

export default ControlRadioGroup;
