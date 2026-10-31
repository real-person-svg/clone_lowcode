import type { VersionLimitItem } from './types';

export function validateVersionLimits(value?: VersionLimitItem[]) {
  if (!value?.length) return '';

  const complete = value.every((row) => row.platform && row.operator && /^\d+\.\d+\.(\d+|\*)$/.test(row.version || ''));
  return complete ? '' : '请补全客户端、操作符和有效版本号，如 1.2.3';
}

export function createVersionLimitActions(value: VersionLimitItem[], onChange?: (value: VersionLimitItem[]) => void) {
  /** 更新指定限制行的字段，版本文本会去除首尾空白。 */
  const handleChange = (
    index: number,
    key: keyof VersionLimitItem,
    nextValue: string
  ) => {
    const normalizedValue =
      key === 'version' && typeof nextValue === 'string'
        ? nextValue.trim()
        : nextValue;
    onChange?.(
      value?.map(
        /* 只替换目标行的指定字段，保留其余限制。 */
        (item, idx) =>
          idx === index
            ? {
              ...item,
              [key]: normalizedValue
            }
            : item
      )
    );
  };

  /** 追加一条默认使用大于等于比较符的版本限制。 */
  const handleAdd = () => {
    onChange?.([
      ...value,
      {
        platform: undefined,
        operator: '>=',
        version: ''
      }
    ]);
  };

  /** 删除指定版本限制并通知表单。 */
  const handleRemove = (index: number) => {
    const nextList = value.filter(
      /* 保留目标索引以外的限制行。 */
      (_, idx) => idx !== index);
    onChange?.(nextList);
  };

  return { handleChange, handleAdd, handleRemove };
}
