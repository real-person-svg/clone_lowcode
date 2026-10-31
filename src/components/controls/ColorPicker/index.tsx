import { I18n } from '../localization';
import React from 'react';
import type { ColorResult } from 'react-color';
import { SketchPicker } from 'react-color';
import { Button, Tooltip } from '@douyinfe/semi-ui';
import { IconCrossStroked } from '@douyinfe/semi-icons';

import { getNumber } from '../utils';

import styles from './style.module.scss';

export interface Props {
  value?: string; // 目前传16进制
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}

const getRGBAColor = (val: string | undefined) => {
  if (val && typeof val === 'string' && /^rgba\($/g.test(val)) {
    const [r, g, b, a] = val
      .replace(/^rgba\(/g, '')
      .replace(/\)/g, '')
      .split(',')
      .map((i) => {
        i.trim();
        return getNumber(i);
      });
    return { r, g, b, a };
  }
  return val;
};

const ColorPicker = ({ value, onChange, disabled }: Props) => {
  const onHandleChange = React.useCallback(
    ({ rgb }: ColorResult) => {
      const { r, g, b, a } = rgb;
      onChange?.(`rgba(${r}, ${g}, ${b}, ${a})`);
    },
    [onChange],
  );

  const onHandleClear = React.useCallback(() => {
    onChange?.(undefined);
  }, [onChange]);

  const colorPickContent = React.useMemo(
    () => (
      <SketchPicker color={getRGBAColor(value)} onChange={onHandleChange} />
    ),
    [value, onHandleChange],
  );

  return (
    <Tooltip
      className={styles['color_tooltip_wrapper']}
      content={colorPickContent}
      trigger="click"
      showArrow={false}
    >
      <div
        className={`${styles['control_color_wrapper']} ${disabled ? styles.disabled : ''}`}
      >
        <span
          className={`${styles['color_panel']} ${value ? '' : styles['no_color']}`}
          style={value ? { backgroundColor: value } : {}}
        />
        <span className={styles['color_label']}>
          {value || I18n.t('not_set', {}, '未设置')}
        </span>
        <Button
          theme="light"
          className={styles['clear_btn']}
          disabled={disabled}
          icon={<IconCrossStroked size="extra-small" />}
          onClick={onHandleClear}
        />
      </div>
    </Tooltip>
  );
};

export default ColorPicker;
