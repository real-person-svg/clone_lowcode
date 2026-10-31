import React from 'react';
import ValueInput from './ValueInput';
import type { LocalUploadProps } from '../Upload/types';
import { Button, Col, Row } from '@douyinfe/semi-ui';
import { IconClose } from '@douyinfe/semi-icons';
import { LocalSelect as Select } from '../Select';
import type { LanguageValue } from './types';

type LanguageEntry = LanguageValue['starling_list'][number];
interface LanguageRowProps {
  item: LanguageEntry;
  index: number;
  kind: string;
  upload: boolean;
  disabled?: boolean;
  optionList: { value: string; label: string }[];
  styles: Record<string, string>;
  uploadProps: Omit<LocalUploadProps, 'value' | 'onChange'>;
  placeholder: string;
  onChange: (index: number, value: LanguageEntry) => void;
  onRemove: (index: number) => void;
}

/** 展示一条语言或地区配置，编辑选择项及对应内容。 */
export default function LanguageRow({
  item,
  index,
  kind,
  upload,
  disabled,
  optionList,
  styles,
  uploadProps,
  placeholder,
  onChange,
  onRemove
}: LanguageRowProps) {
  const labelSpan = upload ? 8 : 6;
  const inputSpan = upload ? 12 : 14;
  const selectLabel = `选择${kind}${index + 1}`;
  const selectPlaceholder = `选择${kind}`;
  const removeLabel = `删除${kind}${index + 1}`;

  const changeLanguage = (value: unknown) => onChange(index, { ...item, UserConfigTypeValue: String(value) });

  const changeValue = (Value: string) => onChange(index, { ...item, Value });

  const remove = () => onRemove(index);

  return (
    <section className={styles.popover_card_content} style={{ marginTop: 10 }}>
      <Row type="flex" style={{ width: '100%' }} align="middle">
        <Col span={labelSpan}>
          <Select
            aria-label={selectLabel}
            placeholder={selectPlaceholder}
            style={{ width: '100%' }}
            disabled={disabled}
            filter
            value={item.UserConfigTypeValue}
            optionList={optionList}
            onChange={changeLanguage}
          />
        </Col>
        <Col span={inputSpan}>
          <div style={{ marginLeft: 7 }}>
            <ValueInput
              upload={upload}
              text={item.Value}
              onChange={changeValue}
              placeholder={placeholder}
              uploadProps={uploadProps}
            />
          </div>
        </Col>
        <Col span={4}>
          <Button
            theme="borderless"
            type="danger"
            aria-label={removeLabel}
            icon={<IconClose />}
            disabled={disabled}
            onClick={remove}
          />
        </Col>
      </Row>
    </section>
  );
}
