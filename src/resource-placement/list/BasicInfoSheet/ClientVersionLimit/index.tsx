import React from 'react';
import { Button, withField } from '@douyinfe/semi-ui';
import { IconPlusCircle } from '@douyinfe/semi-icons';
import VersionLimitRow from './VersionLimitRow';
import { createVersionLimitActions } from './versionLimits';
import type { ClientVersionLimitProps } from './types';
import styles from './style.module.scss';
export type { VersionLimitItem, ClientVersionLimitProps } from './types';

/** 编辑多条客户端版本限制，提供平台、比较符和版本输入。 */
const ClientVersionLimit: React.FC<ClientVersionLimitProps> = ({ value = [], onChange, disabled }) => {
  const { handleChange, handleAdd, handleRemove } = createVersionLimitActions(value, onChange);

  return (
    <div className={styles.container}>
      {value.map((item, index) => (
        <VersionLimitRow
          key={`${index}-${item.platform ?? 'unknown'}`}
          item={item}
          index={index}
          disabled={disabled}
          onChange={handleChange}
          onRemove={handleRemove}
        />
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
