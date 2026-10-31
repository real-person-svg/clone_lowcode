import React from 'react';
import { Switch } from '@douyinfe/semi-ui';
import { SwitchProps } from '@douyinfe/semi-ui/lib/es/switch';

import styles from './style.module.scss';

/** 包装开关控件并应用统一样式。 */
const ControlSwitch = (props: SwitchProps) => (
  <div className={styles['control_switch']}>
    <Switch {...props} />
  </div>
);

export default ControlSwitch;
