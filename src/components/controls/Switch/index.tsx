import React from 'react';
import { Switch } from '@douyinfe/semi-ui';
import { SwitchProps } from '@douyinfe/semi-ui/lib/es/switch';

import styles from './style.module.scss';

const ControlSwitch = (props: SwitchProps) => (
  <div className={styles['control_switch']}>
    <Switch {...props} />
  </div>
);

export default ControlSwitch;
