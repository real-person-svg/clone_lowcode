import { Button, Input, Space } from '@douyinfe/semi-ui';
import { IconClose } from '@douyinfe/semi-icons';
import { LocalSelect as Select } from '../Select';
import { CAPCUT_LG } from '../localization';
import type { StarlingValue } from './types';

type Variable = NonNullable<StarlingValue['variables']>[number];

export function VariableRow({ variable, index, onChange, onRemove }: {
  variable: Variable;
  index: number;
  onChange: (index: number, patch: Partial<Variable>) => void;
  onRemove: (index: number) => void;
}) {
  const changeKey = (key: string) => onChange(index, { key });

  const changeValue = (value: string) => onChange(index, { value });

  const remove = () => onRemove(index);

  return (
    <Space>
      <Input placeholder="变量名" value={variable.key} onChange={changeKey} />
      <Input placeholder="变量值" value={variable.value} onChange={changeValue} />
      <Button icon={<IconClose />} onClick={remove} />
    </Space>
  );
}

export function LanguageRow({ language, text, index, onLanguageChange, onTextChange, onRemove }: {
  language: string;
  text: string;
  index: number;
  onLanguageChange: (index: number, key: string) => void;
  onTextChange: (index: number, text: string) => void;
  onRemove: (index: number) => void;
}) {
  const changeLanguage = (key: unknown) => onLanguageChange(index, String(key));

  const changeText = (value: string) => onTextChange(index, value);

  const remove = () => onRemove(index);

  return (
    <Space>
      <Select
        style={{ width: 120 }}
        placeholder="选择语言"
        optionList={CAPCUT_LG}
        value={language}
        onChange={changeLanguage}
      />
      <Input placeholder="本地语言值" value={text} onChange={changeText} />
      <Button icon={<IconClose />} onClick={remove} />
    </Space>
  );
}
