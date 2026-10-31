import { useCallback } from 'react';
import type { InputNumberProps } from '@douyinfe/semi-ui/lib/es/inputNumber';
import { formatNumberInput } from './numberInput';
import styles from './style.module.scss';

export interface NumberInputProps extends Omit<InputNumberProps, 'onNumberChange'> {
  canInputZero?: boolean | string;
  canInputFloat?: boolean | string;
  onNumberChange?: (value: number | undefined) => void;
}

export function useNumberInput(props: NumberInputProps) {
  const { canInputZero: rawZero = true, canInputFloat: rawFloat = false, onNumberChange, showClear, value } = props;
  const canInputZero = String(rawZero) !== 'false';
  const canInputFloat = String(rawFloat) === 'true';
  const formatter = useCallback(
    (raw: string | number) => formatNumberInput(raw, canInputZero, canInputFloat, showClear, value),
    [canInputZero, canInputFloat, showClear, value],
  );

  const change = (next: string | number) => onNumberChange?.(next === '' ? undefined : Number(next));

  const min = props.min === undefined ? undefined : Number(props.min);
  const max = props.max === undefined ? undefined : Number(props.max);
  const step = props.step === undefined ? undefined : Number(props.step);
  const className = `${styles.control_input_number} ${props.className || ''}`;

  return { formatter, change, min, max, step, className };
}
