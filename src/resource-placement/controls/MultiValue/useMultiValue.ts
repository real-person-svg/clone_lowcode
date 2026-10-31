import React from 'react';
import { CAPCUT_LG, regionList } from '../localization';
import type { LanguageValue, MultiValueProps } from './types';

export function useMultiValue({ value, onChange, optionList = regionList, upload = false }: MultiValueProps & { upload?: boolean }) {
  const [mode, setMode] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [fixed, setFixed] = React.useState('');
  const [multi, setMulti] = React.useState<LanguageValue>({
    $fieldType: 'LAN_FIELD',
    config_type: 1,
    starling_default: '',
    starling_list: [],
  });
  const kind = mode === 'region' ? '地区' : '语言';
  const noun = upload ? '配图' : '链接';
  React.useEffect(
    /* 根据外部值同步固定内容或多值配置及展示模式。 */
    () => {
      if (typeof value === 'string') {
        setFixed(value);
        setMode(
          /* 仅在模式尚未选择时默认使用固定值模式。 */
          (previous) => previous || 'default');
      } else if (value) {
        setMulti({ ...value, starling_list: value.starling_list ?? [] });
        setMode(value.config_type === 2 ? 'region' : 'starling');
      }
    }, [value]);

  /** 合并多值配置的局部修改并通知表单。 */
  const update = (patch: Partial<LanguageValue>) => {
    const next = { ...multi, ...patch };
    setMulti(next);
    onChange?.(next);
  };

  const changeMode = (value: unknown) => {
    const nextMode = String(value);
    setMode(nextMode);
    if (nextMode === 'default') onChange?.(fixed);
    else update({ config_type: nextMode === 'region' ? 2 : 1 });
  };

  const changeFixed = (text: string) => {
    setFixed(text);
    onChange?.(text);
  };

  const changeDefault = (text: string) => update({ starling_default: text });

  const changeRow = (index: number, entry: LanguageValue['starling_list'][number]) => {
    const starling_list = multi.starling_list.map((row, i) => i === index ? entry : row);
    update({ starling_list });
  };

  const removeRow = (index: number) => {
    const starling_list = multi.starling_list.filter((_, i) => i !== index);
    update({ starling_list });
  };

  const addRow = () => {
    const starling_list = [...multi.starling_list, { UserConfigTypeValue: '', Value: '' }];
    update({ starling_list });
  };

  const toggleOpen = () => setOpen(!open);

  const modeOptions = [
    { value: 'default', label: `固定${noun}` },
    { value: 'starling', label: `多语言${noun}` },
    { value: 'region', label: `多地区${noun}` },
  ];
  const languageOptions = mode === 'region' ? optionList : CAPCUT_LG;
  const fillLabel = `${noun}填充方式`;
  const inputPlaceholder = `${kind}${noun}`;
  const toggleLabel = open ? '收起' : '展开';
  const labelSpan = upload ? 8 : 4;
  const inputSpan = upload ? 12 : 16;

  return {
    mode, open, fixed, multi, kind, noun, modeOptions, languageOptions, fillLabel, inputPlaceholder,
    toggleLabel, labelSpan, inputSpan, changeMode, changeFixed, changeDefault, changeRow, removeRow, addRow, toggleOpen
  };
}
