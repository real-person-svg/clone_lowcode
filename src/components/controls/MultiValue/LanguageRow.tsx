import React, { type ReactNode } from 'react';
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
  renderInput: (
    value: string | undefined,
    onChange: (value: string) => void
  ) => ReactNode;
  onChange: (value: LanguageEntry) => void;
  onRemove: () => void;
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
  renderInput,
  onChange,
  onRemove
}: LanguageRowProps) {
  return (
    <section className={styles.popover_card_content} style={{ marginTop: 10 }}>
      <Row type="flex" style={{ width: '100%' }} align="middle">
        <Col span={upload ? 8 : 6}>
          <Select
            aria-label={`选择${kind}${index + 1}`}
            placeholder={`选择${kind}`}
            style={{ width: '100%' }}
            disabled={disabled}
            filter
            value={item.UserConfigTypeValue}
            optionList={optionList}
            onChange={/* 更新当前行的语言或地区编码。 */ (value) =>
              onChange({ ...item, UserConfigTypeValue: String(value) })
            }
          />
        </Col>
        <Col span={upload ? 12 : 14}>
          <div style={{ marginLeft: 7 }}>
            {renderInput(item.Value, /* 更新当前行的链接或配图内容。 */ (Value) => onChange({ ...item, Value }))}
          </div>
        </Col>
        <Col span={4}>
          <Button
            theme="borderless"
            type="danger"
            aria-label={`删除${kind}${index + 1}`}
            icon={<IconClose />}
            disabled={disabled}
            onClick={onRemove}
          />
        </Col>
      </Row>
    </section>
  );
}
