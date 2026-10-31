import React from 'react';
import { Button, Col, Collapsible, Row } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';
import { LocalSelect as Select } from '../Select';
import LanguageRow from './LanguageRow';
import ValueInput from './ValueInput';
import { useMultiValue } from './useMultiValue';
import type { MultiValueProps } from './types';
export type { MultiValueProps } from './types';

/** 编辑固定值或语言、地区值，沿用 LAN_FIELD 持久化结构。 */
export default function MultiValue(props: MultiValueProps & { upload?: boolean; styles: Record<string, string> }) {
  const { value, onChange, optionList, upload = false, styles, ...rest } = props;
  const {
    mode, open, fixed, multi, kind, noun, modeOptions, languageOptions, fillLabel, inputPlaceholder,
    toggleLabel, labelSpan, inputSpan, changeMode, changeFixed, changeDefault, changeRow, removeRow, addRow, toggleOpen,
  } = useMultiValue(props);

  return (
    <>
      <Select
        aria-label={fillLabel}
        placeholder="填充方式"
        style={{ width: 120, marginBottom: 10 }}
        value={mode}
        disabled={rest.disabled}
        onChange={changeMode}
        optionList={modeOptions}
      />
      {mode === 'default' ? (
        <div style={{ marginLeft: 20, maxWidth: 400 }}>
          <ValueInput
            upload={upload}
            text={fixed}
            onChange={changeFixed}
            placeholder={inputPlaceholder}
            uploadProps={rest}
          />
        </div>
      ) : (
        mode && (
          <>
            <Button style={{ marginBottom: 10, marginLeft: 20 }} onClick={toggleOpen}>
              {toggleLabel}多{kind}{noun}
            </Button>
            <Collapsible isOpen={open}>
              <div className={styles.popover_card_wrapper}>
                <section className={styles.popover_card_content}>
                  <Row type="flex" style={{ width: '100%' }} align="middle">
                    <Col span={labelSpan}>默认{noun}</Col>
                    <Col span={inputSpan}>
                      <ValueInput
                        upload={upload}
                        text={multi.starling_default}
                        onChange={changeDefault}
                        placeholder={inputPlaceholder}
                        uploadProps={rest}
                      />
                    </Col>
                  </Row>
                </section>
                {multi.starling_list.map((item, index) => (
                  <LanguageRow
                    key={index}
                    item={item}
                    index={index}
                    kind={kind}
                    upload={upload}
                    disabled={rest.disabled}
                    optionList={languageOptions}
                    styles={styles}
                    uploadProps={rest}
                    placeholder={inputPlaceholder}
                    onChange={changeRow}
                    onRemove={removeRow}
                  />
                ))}
                <section className={styles.popover_card_content_center}>
                  <Button icon={<IconPlus />} disabled={rest.disabled} onClick={addRow}>添加{kind}</Button>
                </section>
              </div>
            </Collapsible>
          </>
        )
      )}
    </>
  );
}
