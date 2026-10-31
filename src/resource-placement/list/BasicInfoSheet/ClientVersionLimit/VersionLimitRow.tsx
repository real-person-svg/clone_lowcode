import { Button, Input, InputGroup, Select } from '@douyinfe/semi-ui';
import { IconMinusCircle } from '@douyinfe/semi-icons';
import type { VersionLimitItem } from './types';
import { PLATFORM_OPTIONS, OPERATOR_OPTIONS } from './options';
import styles from './style.module.scss';

export default function VersionLimitRow({ item, index, disabled, onChange, onRemove }: {
  item: VersionLimitItem;
  index: number;
  disabled?: boolean;
  onChange: (index: number, key: keyof VersionLimitItem, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const changePlatform = (value: unknown) => onChange(index, 'platform', value as string);

  const changeOperator = (value: unknown) => onChange(index, 'operator', value as string);

  const changeVersion = (value: string) => onChange(index, 'version', value);

  const remove = () => onRemove(index);

  return (
    <div className={styles.row}>
      <InputGroup className={styles.group}>
        <Select<string>
          style={{ width: 150 }}
          value={item.platform}
          disabled={disabled}
          placeholder="选择客户端"
          optionList={PLATFORM_OPTIONS}
          onChange={changePlatform}
        />
        <Select<string>
          value={item.operator}
          style={{ width: 50 }}
          disabled={disabled}
          placeholder="选择操作符"
          optionList={OPERATOR_OPTIONS}
          className={styles.operator}
          onChange={changeOperator}
        />
        <Input
          value={item.version}
          disabled={disabled}
          placeholder="请输入版本号"
          className={styles.version}
          onChange={changeVersion}
        />
      </InputGroup>
      <Button
        size="large"
        theme="borderless"
        disabled={disabled}
        className={styles.remove}
        icon={<IconMinusCircle />}
        onClick={remove}
      />
    </div>
  );
}
