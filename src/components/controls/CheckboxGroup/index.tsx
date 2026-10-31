import React from 'react';
import { CheckboxGroup } from '@douyinfe/semi-ui';
import { CheckboxGroupProps } from '@douyinfe/semi-ui/lib/es/checkbox';

import styles from './style.module.scss';

const ControlCheckboxGroup = (props: CheckboxGroupProps) => (
  <CheckboxGroup {...props} className={styles['control_checkbox_group']} />
);

export default ControlCheckboxGroup;
