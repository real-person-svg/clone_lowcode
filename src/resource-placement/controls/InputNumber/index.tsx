import React from 'react';
import { InputNumber } from '@douyinfe/semi-ui';
import { useNumberInput, type NumberInputProps } from './useNumberInput';

/** 包装数字输入，处理零值、小数及清空选项。 */
export default function ControlInputNumber(props: NumberInputProps) {
  const { canInputZero, canInputFloat, onNumberChange, ...inputProps } = props;
  const { formatter, change, min, max, step, className } = useNumberInput(props);

  return <InputNumber
    {...inputProps}
    min={min}
    max={max}
    step={step}
    formatter={formatter}
    onChange={change}
    className={className}
  />;
}
