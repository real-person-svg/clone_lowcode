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
  const [rawData, setRawData] = React.useState('');
  const tags = value.map(/* 为已有标签生成展示属性。 */ (tag, index) => ({
    color,
    children: tag,
    closable: true,
  }));
  /** 保存尚未添加到列表的输入文本。 */
  const onHandleInput = React.useCallback((value: string) => {
    // TODO: 后续看看需不需要增加输入校验
    setRawData(value);
  }, []);

  /** 拆分并合并待添加标签，提示重复项后清空输入。 */
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
      .filter(/* 过滤分隔产生的空项。 */ (i) => Boolean(i))
      ?.map(/* 去除每项标签首尾空白。 */ (item) => item?.trim());
    // 先保留已有顺序再合并新项，用 Set 去重；合并结果数量减少时提示存在重复项。
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

  /** 按标签内容删除一项，禁用时不处理。 */
  const onHandleDelete = React.useCallback(
    (children: string) => {
      if (disabled) {
        return;
      }
      const newTags = [...tags];
      const closeTagIndex = newTags.findIndex(/* 定位待删除标签的展示项。 */ (t) => t.children === children);
      newTags.splice(closeTagIndex, 1);
      onChange(newTags.map(/* 从展示项中提取剩余标签文本。 */ ({ children }) => children));
    },
    [tags, onChange, disabled],
  );

  /** 清空全部标签。 */
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
            {tags.map(/* 渲染每个标签及其删除入口。 */ (itemProps: any) => (
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
