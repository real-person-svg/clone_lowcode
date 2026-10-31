import React from 'react';
import { Button, Input, Tag } from '@douyinfe/semi-ui';
import { IconCrossStroked, IconPlusStroked } from '@douyinfe/semi-icons';

import styles from './style.module.scss';

import { useTagInput } from './useTagInput';
import type { InputTagPanelProps } from './types';

/** 编辑标签列表，支持分隔输入、去重、单项删除和清空。 */
const InputTagPanel = ({
  value = [],
  onChange,
  separator,
  color = 'white',
  placeholder = '',
  isRowDirection,
  disabled,
}: InputTagPanelProps) => {
  const { rawData, tags, onHandleInput, onHandleAdd, onHandleDelete, onHandleClear, className, addDisabled, closable } = useTagInput({ value, onChange, separator, color, isRowDirection, disabled });

  return (
    <div
      className={className}
    >
      <div className={styles['input_wrapper']}>
        <Input
          className={styles['raw_input']}
          value={rawData}
          disabled={disabled}
          onChange={onHandleInput}
          placeholder={placeholder}
        />
        <Button
          className={styles['add_icon']}
          icon={<IconPlusStroked />}
          disabled={addDisabled}
          onClick={onHandleAdd}
        />
      </div>
      {tags.length ? (
        <div className={styles['result_panel']}>
          <div className={styles['tag_group']}>
            {tags.map(
              /* 渲染每个标签及其删除入口。 */
              (itemProps: any) => (
                <Tag
                  key={itemProps.children}
                  {...itemProps}
                  closable={closable}
                  onClose={onHandleDelete}
                />
              ))}
          </div>
          <Button
            theme="light"
            className={styles['clear_btn']}
            disabled={disabled}
            icon={<IconCrossStroked size="extra-small" />}
            onClick={onHandleClear}
          />
        </div>
      ) : null}
    </div>
  );
};

export default InputTagPanel;
