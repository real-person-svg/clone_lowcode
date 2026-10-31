import React from 'react';
import { RadioGroup } from '@douyinfe/semi-ui';
import { RadioGroupProps } from '@douyinfe/semi-ui/lib/es/radio';

import styles from './style.module.scss';

const ControlRadioGroup = (props: RadioGroupProps) => (
  <RadioGroup {...props} className={styles['control_radio_group']} />
);

export default ControlRadioGroup;
