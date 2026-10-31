import React, { useMemo } from 'react';
import {
  Button,
  Input,
  InputGroup,
  Select,
  withField
} from '@douyinfe/semi-ui';
import { IconMinusCircle, IconPlusCircle } from '@douyinfe/semi-icons';

import styles from './style.module.scss';

export interface VersionLimitItem {
  platform?: string;
  operator?: string;
  version?: string;
}

export interface ClientVersionLimitProps {
  value?: VersionLimitItem[];
  onChange?: (value: VersionLimitItem[]) => void;
  disabled?: boolean;
}

const PLATFORM_OPTIONS = [
  { label: 'ios', value: 'ios' },
  { label: 'android', value: 'android' },
  { label: 'mac', value: 'mac' },
  { label: 'windows', value: 'windows' }
];

const OPERATOR_OPTIONS = [
  { label: '>=', value: '>=' },
  { label: '<=', value: '<=' },
  { label: '=', value: '=' }
];

/** 编辑多条客户端版本限制，提供平台、比较符和版本输入。 */
const ClientVersionLimit: React.FC<ClientVersionLimitProps> = ({
  value = [],
  onChange,
  disabled
}) => {
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
      value?.map(/* 只替换目标行的指定字段，保留其余限制。 */ (item, idx) =>
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
    const nextList = value.filter(/* 保留目标索引以外的限制行。 */ (_, idx) => idx !== index);
    onChange?.(nextList);
  };

  return (
    <div className={styles.container}>
      {value.map(/* 为每条版本限制生成平台、比较符和版本编辑控件。 */ (item, index) => (
        <div
          className={styles.row}
          key={`${index}-${item.platform ?? 'unknown'}`}
        >
          <InputGroup className={styles.group}>
            <Select<string>
              style={{ width: 150 }}
              value={item.platform}
              disabled={disabled}
              placeholder="选择客户端"
              optionList={PLATFORM_OPTIONS}
              onChange={/* 更新当前行的客户端平台。 */ (val) => handleChange(index, 'platform', val as string)}
            />
            <Select<string>
              value={item.operator}
              style={{ width: 50 }}
              disabled={disabled}
              placeholder="选择操作符"
              optionList={OPERATOR_OPTIONS}
              className={styles.operator}
              onChange={/* 更新当前行的版本比较符。 */ (val) => handleChange(index, 'operator', val as string)}
            />
            <Input
              value={item.version}
              disabled={disabled}
              placeholder="请输入版本号"
              className={styles.version}
              onChange={/* 更新当前行的版本文本。 */ (val) => handleChange(index, 'version', val)}
            />
          </InputGroup>
          <Button
            size="large"
            theme="borderless"
            disabled={disabled}
            className={styles.remove}
            icon={<IconMinusCircle />}
            onClick={/* 删除当前限制行。 */ () => handleRemove(index)}
          />
        </div>
      ))}
      <Button
        theme="light"
        icon={<IconPlusCircle />}
        disabled={disabled}
        onClick={handleAdd}
        className={styles.add}
      >
        添加限制条件
      </Button>
    </div>
  );
};

export default ClientVersionLimit;

export const FormClientVersionLimit = withField(ClientVersionLimit, {
  valueKey: 'value',
  onKeyChangeFnName: 'onChange'
});
