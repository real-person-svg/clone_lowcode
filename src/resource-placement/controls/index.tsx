import React from 'react';
import { useFormApi, withField } from '@douyinfe/semi-ui';
import Input from './Input';
import Select from './Select';
import Switch from './Switch';
import DatePicker from './DatePicker';
import CheckboxGroup from './CheckboxGroup';
import RadioGroup from './RadioGroup';
import InputNumber from './InputNumber';
import ColorPicker from './ColorPicker';
import Upload from './Upload';
import InputTagPanel from './TagInput';
import StarlingInput from './StarlingInput';
import StarlingUpload from './StarlingUpload';
import StarlingSchema from './StarlingSchema';
import Card from './Card';
import Container from './Container';
import WrapContainer from './WrapContainer';
import ColumnContainer from './ColumnContainer';

type AnyControl = React.ComponentType<any>;
export interface ControlDefinition {
  C: AnyControl;
  type: 'INTERACTIVE' | 'NO_INTERACTIVE';
}
const controls: Record<
  string,
  {
    C: AnyControl;
    valueKey?: string;
    changeKey?: string;
    valuePath?: string;
    layout?: boolean;
  }
> = {
  Input: { C: Input },
  Select: { C: Select },
  Switch: { C: Switch, valueKey: 'checked' },
  DatePicker: { C: DatePicker },
  CheckboxGroup: { C: CheckboxGroup },
  RadioGroup: { C: RadioGroup, valuePath: 'target.value' },
  InputNumber: { C: InputNumber, changeKey: 'onNumberChange' },
  ColorPicker: { C: ColorPicker },
  Upload: { C: Upload },
  InputTagPanel: { C: InputTagPanel },
  StarlingInput: { C: StarlingInput },
  StarlingUpload: { C: StarlingUpload },
  StarlingSchema: { C: StarlingSchema },
  Card: { C: Card, layout: true },
  Container: { C: Container, layout: true },
  WrapContainer: { C: WrapContainer, layout: true },
  ColumnContainer: { C: ColumnContainer, layout: true },
};
export const controlLib: Record<string, ControlDefinition> = {};
for (const [
  name,
  { C, valueKey = 'value', changeKey = 'onChange', valuePath, layout },
] of Object.entries(controls)) {
  controlLib[name] = { C, type: layout ? 'NO_INTERACTIVE' : 'INTERACTIVE' };

  /** 适配原生控件与表单，处理输入输出格式化及字段联动。 */
  const Middleware: AnyControl = ({
    inputFormat,
    outputFormat,
    onChangeState,
    onLocalValueChange,
    ...props
  }) => {
    const formApi = useFormApi();
    let value = props[valueKey];
    if (typeof inputFormat === 'function') value = inputFormat(value);

    const change = (raw: unknown) => {
      const output = typeof outputFormat === 'function' ? outputFormat(raw) : raw;
      props[changeKey]?.(output);
      onLocalValueChange?.(output);
      if (typeof onChangeState === 'function') onChangeState(raw, formApi);
    };

    const controlProps = { ...props, [valueKey]: value, [changeKey]: change };

    return <C {...controlProps} />;
  };

  const fieldOptions: { valueKey: string; onKeyChangeFnName: string; valuePath?: string } = {
    valueKey,
    onKeyChangeFnName: changeKey,
  };
  if (valuePath) fieldOptions.valuePath = valuePath;

  controlLib[`Form${name}`] = {
    C: withField(Middleware, fieldOptions),
    type: 'INTERACTIVE',
  };
}
export const controlNameEnum = Object.fromEntries(
  Object.keys(controlLib).map(
    /* 生成控件名称到自身名称的枚举映射。 */
    (key) => [key, key]),
);
