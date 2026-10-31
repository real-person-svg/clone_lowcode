import React from 'react';
import type { StarlingValue, StarlingInputProps } from './types';

export const textTypes = [
  { value: 'STARLING', label: 'starling' },
  { value: 'NORMAL', label: '普通' },
];

export function useStarlingInput({ value, onChange }: StarlingInputProps) {
  const current: StarlingValue = value ?? {
    $fieldType: 'STARLING_FIELD',
    type: 'STARLING',
    value: '',
    variables: [],
    languages: {},
  };
  const [modal, setModal] = React.useState<'variables' | 'languages' | null>(
    null,
  );
  const [variables, setVariables] = React.useState<
    NonNullable<StarlingValue['variables']>
  >([]);
  const [languages, setLanguages] = React.useState<[string, string][]>([]);

  /** 合并文案配置的局部变化并通知表单。 */
  const change = (patch: Partial<StarlingValue>) =>
    onChange?.({ ...current, ...patch });

  const changeType = (type: unknown) => change({ type: String(type) });

  const changeText = (value: string) => change({ value });

  const openVariables = () => {
    setVariables(current.variables ?? []);
    setModal('variables');
  };

  const openLanguages = () => {
    setLanguages(Object.entries(current.languages ?? {}));
    setModal('languages');
  };

  const close = () => setModal(null);

  const confirm = () => {
    if (modal === 'variables') change({ variables });
    else {
      const entries = languages.filter(([key]) => key);
      change({ languages: Object.fromEntries(entries) });
    }
    setModal(null);
  };

  const changeVariable = (index: number, patch: Partial<NonNullable<StarlingValue['variables']>[number]>) => {
    setVariables(variables.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const removeVariable = (index: number) => setVariables(variables.filter((_, i) => i !== index));

  const addVariable = () => setVariables([...variables, { type: 1, key: '', value: '' }]);

  const changeLanguage = (index: number, key: string) => {
    setLanguages(languages.map((item, i) => i === index ? [key, item[1]] : item));
  };

  const changeLanguageText = (index: number, text: string) => {
    setLanguages(languages.map((item, i) => i === index ? [item[0], text] : item));
  };

  const removeLanguage = (index: number) => setLanguages(languages.filter((_, i) => i !== index));

  const addLanguage = () => setLanguages([...languages, ['', '']]);

  const isStarling = current.type === 'STARLING';
  const placeholder = isStarling ? '请输入本地 starling key' : '请输入文案';
  const editingVariables = modal === 'variables';
  const title = editingVariables ? '变量设置' : '本地语言值';
  const visible = modal !== null;

  return {
    current, variables, languages, isStarling, placeholder, editingVariables, title, visible,
    changeType, changeText, openVariables, openLanguages, close, confirm,
    changeVariable, removeVariable, addVariable, changeLanguage, changeLanguageText, removeLanguage, addLanguage
  };
}
