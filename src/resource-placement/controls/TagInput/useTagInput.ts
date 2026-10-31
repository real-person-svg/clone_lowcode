import React from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { I18n } from '../localization';
import type { InputTagPanelProps } from './types';
import { mergeTags } from './tagValues';
import styles from './style.module.scss';

export function useTagInput({ value = [], onChange, separator, color = 'white', isRowDirection, disabled }: InputTagPanelProps) {
  const [rawData, setRawData] = React.useState('');
  const tags = value.map(
    /* 为已有标签生成展示属性。 */
    (tag) => ({
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
    const { newTags, hasDuplicates } = mergeTags(value, pendingString, separator);
    if (hasDuplicates) {
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
      const closeTagIndex = newTags.findIndex(
        /* 定位待删除标签的展示项。 */
        (t) => t.children === children);
      newTags.splice(closeTagIndex, 1);
      onChange(newTags.map(
        /* 从展示项中提取剩余标签文本。 */
        ({ children }) => children));
    },
    [tags, onChange, disabled],
  );

  /** 清空全部标签。 */
  const onHandleClear = React.useCallback(() => {
    onChange([]);
  }, [onChange]);

  const className = `${styles.control_input_tag_panel} ${isRowDirection ? styles.row_direction : ''}`;
  const addDisabled = !rawData.trim() || disabled;
  const closable = !disabled;

  return { rawData, tags, onHandleInput, onHandleAdd, onHandleDelete, onHandleClear, className, addDisabled, closable };
}
