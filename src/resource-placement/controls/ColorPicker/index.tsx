import { I18n } from '../localization';
import React from 'react';
import type { ColorResult } from 'react-color';
import { SketchPicker } from 'react-color';
import { Button, Tooltip } from '@douyinfe/semi-ui';
import { IconCrossStroked } from '@douyinfe/semi-icons';

import { getRGBAColor } from './colors';

import styles from './style.module.scss';

export interface Props {
  // 目前传16进制
  value?: string;
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}

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

  const panelStyle = value ? { backgroundColor: value } : {};

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
          style={panelStyle}
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
