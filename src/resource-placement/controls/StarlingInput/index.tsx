import React from 'react';
import { LocalSelect as Select } from '../Select';
import { Button, Input, Modal, Space, Typography } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';
import GroupContainer from '../GroupContainer';
import { useStarlingInput, textTypes } from './useStarlingInput';
import { VariableRow, LanguageRow } from './StarlingRows';
import type { StarlingInputProps } from './types';
import styles from './style.module.scss';
export type { StarlingValue } from './types';

/** 编辑普通或 Starling 文案，并配置变量和本地语言值。 */
export default function StarlingInput(props: StarlingInputProps) {
  const { disabled } = props;
  const {
    current, variables, languages, isStarling, placeholder, editingVariables, title, visible,
    changeType, changeText, openVariables, openLanguages, close, confirm,
    changeVariable, removeVariable, addVariable, changeLanguage, changeLanguageText, removeLanguage, addLanguage,
  } = useStarlingInput(props);

  return (
    <div className={styles.starling_wrapper}>
      <GroupContainer>
        <Select
          aria-label="文案类型"
          disabled={disabled}
          className={styles.starling_type_select}
          value={current.type}
          optionList={textTypes}
          onChange={changeType}
        />
        <Input disabled={disabled} value={current.value} placeholder={placeholder} onChange={changeText} />
      </GroupContainer>
      {isStarling && (
        <Button
          theme="borderless"
          disabled={disabled}
          className={styles.starling_extra_info_add}
          onClick={openVariables}
        >设置变量</Button>
      )}
      <Button
        theme="borderless"
        disabled={disabled}
        className={styles.starling_extra_info_add}
        onClick={openLanguages}
      >本地语言值</Button>
      <Modal title={title} visible={visible} onCancel={close} onOk={confirm}>
        <Typography.Paragraph type="secondary">配置与语言值仅保存在本地资源位中。</Typography.Paragraph>
        {editingVariables ? (
          <Space vertical align="start" style={{ width: '100%' }}>
            {variables.map((variable, index) => (
              <VariableRow
                key={index}
                variable={variable}
                index={index}
                onChange={changeVariable}
                onRemove={removeVariable}
              />
            ))}
            <Button icon={<IconPlus />} onClick={addVariable}>添加变量</Button>
          </Space>
        ) : (
          <Space vertical align="start" style={{ width: '100%' }}>
            {languages.map(([language, text], index) => (
              <LanguageRow
                key={index}
                language={language}
                text={text}
                index={index}
                onLanguageChange={changeLanguage}
                onTextChange={changeLanguageText}
                onRemove={removeLanguage}
              />
            ))}
            <Button icon={<IconPlus />} onClick={addLanguage}>添加语言</Button>
          </Space>
        )}
      </Modal>
    </div>
  );
}
