import { I18n } from '../localization';
import React from 'react';
import { Button, Input, Tag, Toast } from '@douyinfe/semi-ui';
import { IconCrossStroked, IconPlusStroked } from '@douyinfe/semi-icons';

import styles from './style.module.scss';

interface InputTagPanelProps {
  value: Array<string>;
  onChange: (value: InputTagPanelProps['value']) => void;
  separator?: Array<string>; // 分割符号
  color?: string;
  placeholder?: string;
  isRowDirection?: boolean;
  disabled?: boolean;
}

const InputTagPanel = ({
  value = [],
  onChange,
  separator,
  color = 'white',
  placeholder = '',
  isRowDirection,
  disabled,
}: InputTagPanelProps) => {
  const [rawData, setRawData] = React.useState('');
  const tags = value.map((tag, index) => ({
    color,
    children: tag,
    closable: true,
  }));
  const onHandleInput = React.useCallback((value: string) => {
    // TODO: 后续看看需不需要增加输入校验
    setRawData(value);
  }, []);

  const onHandleAdd = React.useCallback(() => {
    const pendingString = rawData.trim();
    if (!pendingString) {
      return;
    }
    let separatorRegExp = null;
    if (Array.isArray(separator) && separator.length) {
      separatorRegExp = new RegExp(`\\${separator.join('|\\')}`, 'g');
    }
    const addTags = pendingString
      .split(separatorRegExp ?? /(?!) /)
      .filter((i) => Boolean(i))
      ?.map((item) => item?.trim());
    const newTags = [...new Set([...value, ...addTags])];
    if (newTags.length !== value.length + addTags.length) {
      Toast.info(
        I18n.t(
          'entering_duplicates_is_not_supported_for_the_time_being',
          {},
          '暂不支持输入重复项',
        ),
      );
    }
    onChange(newTags);
    setRawData('');
  }, [rawData, separator, onChange, value]);

  const onHandleDelete = React.useCallback(
    (children: string) => {
      if (disabled) {
        return;
      }
      const newTags = [...tags];
      const closeTagIndex = newTags.findIndex((t) => t.children === children);
      newTags.splice(closeTagIndex, 1);
      onChange(newTags.map(({ children }) => children));
    },
    [tags, onChange, disabled],
  );

  const onHandleClear = React.useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div
      className={`${styles['control_input_tag_panel']} ${isRowDirection ? styles['row_direction'] : ''}`}
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
          disabled={!rawData.trim() || disabled}
          onClick={onHandleAdd}
        />
      </div>
      {tags.length ? (
        <div className={styles['result_panel']}>
          <div className={styles['tag_group']}>
            {tags.map((itemProps: any) => (
              <Tag
                key={itemProps.children}
                {...itemProps}
                closable={!disabled}
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
