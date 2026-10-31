import React from 'react';
import { LocalSelect as Select } from './Select';
import { Button, Col, Collapsible, Input, Row } from '@douyinfe/semi-ui';
import { IconPlus, IconClose } from '@douyinfe/semi-icons';
import Upload, { type LocalUploadProps } from './Upload';
import { CAPCUT_LG, regionList } from './localization';

export interface LanguageValue {
  $fieldType: 'LAN_FIELD';
  starling_default?: string;
  starling_list: { UserConfigTypeValue: string; Value: string }[];
  config_type: 1 | 2;
}
export interface MultiValueProps extends Omit<
  LocalUploadProps,
  'value' | 'onChange'
> {
  value?: string | LanguageValue;
  onChange?: (value: string | LanguageValue) => void;
  optionList?: { value: string; label: string }[];
}
/** Language and region controls share the original persisted LAN_FIELD contract. */
export default function MultiValue({
  value,
  onChange,
  optionList = regionList,
  upload = false,
  styles,
  ...rest
}: MultiValueProps & { upload?: boolean; styles: Record<string, string> }) {
  const [mode, setMode] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [fixed, setFixed] = React.useState('');
  const [multi, setMulti] = React.useState<LanguageValue>({
    $fieldType: 'LAN_FIELD',
    config_type: 1,
    starling_default: '',
    starling_list: [],
  });
  React.useEffect(() => {
    if (typeof value === 'string') {
      setFixed(value);
      setMode((previous) => previous || 'default');
    } else if (value) {
      setMulti({ ...value, starling_list: value.starling_list ?? [] });
      setMode(value.config_type === 2 ? 'region' : 'starling');
    }
  }, [value]);
  const update = (patch: Partial<LanguageValue>) => {
    const next = { ...multi, ...patch };
    setMulti(next);
    onChange?.(next);
  };
  const kind = mode === 'region' ? '地区' : '语言';
  const noun = upload ? '配图' : '链接';
  const renderInput = (
    text: string | undefined,
    change: (text: string) => void,
  ) =>
    upload ? (
      <Upload
        {...rest}
        value={text ? [text] : []}
        onChange={(urls) => change(urls[0] ?? '')}
      />
    ) : (
      <Input
        disabled={rest.disabled}
        style={{ width: '100%' }}
        value={text ?? ''}
        placeholder={`${kind}${noun}`}
        onChange={change}
      />
    );
  return (
    <>
      <Select
        aria-label={`${noun}填充方式`}
        placeholder="填充方式"
        style={{ width: 120, marginBottom: 10 }}
        value={mode}
        disabled={rest.disabled}
        onChange={(value) => {
          const nextMode = String(value);
          setMode(nextMode);
          if (nextMode === 'default') onChange?.(fixed);
          else update({ config_type: nextMode === 'region' ? 2 : 1 });
        }}
        optionList={[
          { value: 'default', label: `固定${noun}` },
          { value: 'starling', label: `多语言${noun}` },
          { value: 'region', label: `多地区${noun}` },
        ]}
      />
      {mode === 'default' ? (
        <div style={{ marginLeft: 20, maxWidth: 400 }}>
          {renderInput(fixed, (text) => {
            setFixed(text);
            onChange?.(text);
          })}
        </div>
      ) : (
        mode && (
          <>
            <Button
              style={{ marginBottom: 10, marginLeft: 20 }}
              onClick={() => setOpen(!open)}
            >
              {open ? '收起' : '展开'}多{kind}
              {noun}
            </Button>
            <Collapsible isOpen={open}>
              <div className={styles.popover_card_wrapper}>
                <section className={styles.popover_card_content}>
                  <Row type="flex" style={{ width: '100%' }} align="middle">
                    <Col span={upload ? 8 : 4}>默认{noun}</Col>
                    <Col span={upload ? 12 : 16}>
                      {renderInput(multi.starling_default, (text) =>
                        update({ starling_default: text }),
                      )}
                    </Col>
                  </Row>
                </section>
                {multi.starling_list.map((item, index) => (
                  <section
                    key={index}
                    className={styles.popover_card_content}
                    style={{ marginTop: 10 }}
                  >
                    <Row type="flex" style={{ width: '100%' }} align="middle">
                      <Col span={upload ? 8 : 6}>
                        <Select
                          aria-label={`选择${kind}${index + 1}`}
                          placeholder={`选择${kind}`}
                          style={{ width: '100%' }}
                          disabled={rest.disabled}
                          filter
                          value={item.UserConfigTypeValue}
                          optionList={
                            mode === 'region' ? optionList : CAPCUT_LG
                          }
                          onChange={(value) =>
                            update({
                              starling_list: multi.starling_list.map(
                                (row, i) =>
                                  i === index
                                    ? {
                                        ...row,
                                        UserConfigTypeValue: String(value),
                                      }
                                    : row,
                              ),
                            })
                          }
                        />
                      </Col>
                      <Col span={upload ? 12 : 14}>
                        <div style={{ marginLeft: 7 }}>
                          {renderInput(item.Value, (Value) =>
                            update({
                              starling_list: multi.starling_list.map(
                                (row, i) =>
                                  i === index ? { ...row, Value } : row,
                              ),
                            }),
                          )}
                        </div>
                      </Col>
                      <Col span={4}>
                        <Button
                          theme="borderless"
                          type="danger"
                          aria-label={`删除${kind}${index + 1}`}
                          icon={<IconClose />}
                          disabled={rest.disabled}
                          onClick={() =>
                            update({
                              starling_list: multi.starling_list.filter(
                                (_, i) => i !== index,
                              ),
                            })
                          }
                        />
                      </Col>
                    </Row>
                  </section>
                ))}
                <section className={styles.popover_card_content_center}>
                  <Button
                    icon={<IconPlus />}
                    disabled={rest.disabled}
                    onClick={() =>
                      update({
                        starling_list: [
                          ...multi.starling_list,
                          { UserConfigTypeValue: '', Value: '' },
                        ],
                      })
                    }
                  >
                    添加{kind}
                  </Button>
                </section>
              </div>
            </Collapsible>
          </>
        )
      )}
    </>
  );
}
