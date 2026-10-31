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

/** 尝试将符合当前识别条件的 RGBA 文本转换为色板接受的分量对象。 */
const getRGBAColor = (val: string | undefined) => {
  if (val && typeof val === 'string' && /^rgba\($/g.test(val)) {
    const [r, g, b, a] = val
      .replace(/^rgba\(/g, '')
      .replace(/\)/g, '')
      .split(',')
      .map(/* 将颜色分量文本转换为数字。 */ (i) => {
        i.trim();
        return getNumber(i);
      });
    return { r, g, b, a };
  }
  return val;
};

/** 展示当前颜色，并提供色板选择及清空操作。 */
const ColorPicker = ({ value, onChange, disabled }: Props) => {
  /** 将色板结果转换为 RGBA 字符串通知调用方。 */
  const onHandleChange = React.useCallback(
    ({ rgb }: ColorResult) => {
      const { r, g, b, a } = rgb;
      onChange?.(`rgba(${r}, ${g}, ${b}, ${a})`);
    },
    [onChange],
  );

  /** 清空已选择的颜色。 */
  const onHandleClear = React.useCallback(() => {
    onChange?.(undefined);
  }, [onChange]);

  /** 根据当前值生成色板内容。 */
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
