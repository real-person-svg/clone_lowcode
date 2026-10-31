import React from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconHelpCircleStroked } from '@douyinfe/semi-icons';
import styles from './FieldLabel.module.scss';
export function fieldLabel(text: string, required = false, tips?: string) {
  return {
    required: false,
    text: (
      <div className={styles.label_wrapper}>
        <div className={`${styles.tips} ${required ? styles.is_require : ''}`}>
          {text}
        </div>
        {tips && (
          <Tooltip content={tips}>
            <IconHelpCircleStroked className={styles.tips_icon} />
          </Tooltip>
        )}
      </div>
    )
  };
}
