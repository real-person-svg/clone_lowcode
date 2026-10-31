import React from 'react';
import { InputNumber } from '@douyinfe/semi-ui';
import type { InputNumberProps } from '@douyinfe/semi-ui/lib/es/inputNumber';
import styles from './style.module.scss';
interface Props extends Omit<InputNumberProps, 'onNumberChange'> {
  canInputZero?: boolean | string;
  canInputFloat?: boolean | string;
  onNumberChange?: (value: number | undefined) => void;
}
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
  const formatter = React.useCallback(
    (raw: string | number) => {
      const text = String(raw);
      if (showClear && text === '') return '';
      const parsed = canInputFloat
        ? Number.parseFloat(text)
        : Number.parseInt(text, 10);
      if (Number.isNaN(parsed))
        return canInputZero ? '0' : text.startsWith('-') ? '-1' : '1';
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
      onChange={(next) =>
        onNumberChange?.(next === '' ? undefined : Number(next))
      }
      className={`${styles.control_input_number} ${props.className || ''}`}
    />
  );
}
