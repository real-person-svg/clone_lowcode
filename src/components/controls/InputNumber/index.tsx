import React from 'react';
import { InputNumber } from '@douyinfe/semi-ui';
import type { InputNumberProps } from '@douyinfe/semi-ui/lib/es/inputNumber';
import styles from './style.module.scss';
interface Props extends Omit<InputNumberProps, 'onNumberChange'> {
  canInputZero?: boolean | string;
  canInputFloat?: boolean | string;
  onNumberChange?: (value: number | undefined) => void;
}
/** 包装数字输入，处理零值、小数及清空选项。 */
export default function ControlInputNumber({
  canInputZero: rawZero = true,
  canInputFloat: rawFloat = false,
  onNumberChange,
  showClear,
  value,
  ...props
}: Props) {
  const canInputZero = String(rawZero) !== 'false';
  const canInputFloat = String(rawFloat) === 'true';
  /** 按整数或小数模式格式化输入，并按零值限制选择替代值。 */
  const formatter = React.useCallback(
    (raw: string | number) => {
      const text = String(raw);
      if (showClear && text === '') return '';
      const parsed = canInputFloat
        ? Number.parseFloat(text)
        : Number.parseInt(text, 10);
      if (Number.isNaN(parsed))
        return canInputZero ? '0' : text.startsWith('-') ? '-1' : '1';
      // 不允许零时按输入符号及当前值选择正负 1，配合步进时跨过零点。
      if (!canInputZero && parsed === 0)
        return text.startsWith('-') || (typeof value === 'number' && value > 0)
          ? '-1'
          : '1';
      return String(parsed);
    },
    [canInputZero, canInputFloat, showClear, value],
  );
  return (
    <InputNumber
      {...props}
      min={props.min === undefined ? undefined : Number(props.min)}
      max={props.max === undefined ? undefined : Number(props.max)}
      step={props.step === undefined ? undefined : Number(props.step)}
      showClear={showClear}
      value={value}
      formatter={formatter}
      onChange={/* 将清空转为 undefined，其余输入转为数字后通知表单。 */ (next) =>
        onNumberChange?.(next === '' ? undefined : Number(next))
      }
      className={`${styles.control_input_number} ${props.className || ''}`}
    />
  );
}
