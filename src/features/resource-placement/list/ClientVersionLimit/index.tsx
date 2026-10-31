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

const ClientVersionLimit: React.FC<ClientVersionLimitProps> = ({
  value = [],
  onChange,
  disabled
}) => {
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
      value?.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [key]: normalizedValue
            }
          : item
      )
    );
  };

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

  const handleRemove = (index: number) => {
    const nextList = value.filter((_, idx) => idx !== index);
    onChange?.(nextList);
  };

  return (
    <div className={styles.container}>
      {value.map((item, index) => (
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
              onChange={(val) => handleChange(index, 'platform', val as string)}
            />
            <Select<string>
              value={item.operator}
              style={{ width: 50 }}
              disabled={disabled}
              placeholder="选择操作符"
              optionList={OPERATOR_OPTIONS}
              className={styles.operator}
              onChange={(val) => handleChange(index, 'operator', val as string)}
            />
            <Input
              value={item.version}
              disabled={disabled}
              placeholder="请输入版本号"
              className={styles.version}
              onChange={(val) => handleChange(index, 'version', val)}
            />
          </InputGroup>
          <Button
            size="large"
            theme="borderless"
            disabled={disabled}
            className={styles.remove}
            icon={<IconMinusCircle />}
            onClick={() => handleRemove(index)}
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
