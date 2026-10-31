import React from 'react';
import { Button, Col, Collapsible, Input, Row } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';
import { LocalSelect as Select } from '../Select';
import Upload from '../Upload';
import { CAPCUT_LG, regionList } from '../localization';
import LanguageRow from './LanguageRow';
import type { LanguageValue, MultiValueProps } from './types';

/** 编辑固定值或语言、地区值，沿用 LAN_FIELD 持久化结构。 */
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
  const kind = mode === 'region' ? '地区' : '语言';
  const noun = upload ? '配图' : '链接';
  React.useEffect(/* 根据外部值同步固定内容或多值配置及展示模式。 */ () => {
    if (typeof value === 'string') {
      setFixed(value);
      setMode(/* 仅在模式尚未选择时默认使用固定值模式。 */ (previous) => previous || 'default');
    } else if (value) {
      setMulti({ ...value, starling_list: value.starling_list ?? [] });
      setMode(value.config_type === 2 ? 'region' : 'starling');
    }
  }, [value]);
  /** 合并多值配置的局部修改并通知表单。 */
  const update = (patch: Partial<LanguageValue>) => {
    const next = { ...multi, ...patch };
    setMulti(next);
    onChange?.(next);
  };
  /** 按内容类型渲染图片上传或文本输入。 */
  const renderInput = (
    text: string | undefined,
    change: (text: string) => void,
  ) =>
    upload ? (
      <Upload
        {...rest}
        value={text ? [text] : []}
        onChange={/* 将上传列表的首个地址作为当前内容，清空时使用空串。 */ (urls) => change(urls[0] ?? '')}
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
        onChange={/* 切换填充方式并发布对应格式的当前值。 */ (value) => {
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
          {renderInput(fixed, /* 保存固定内容并通知表单。 */ (text) => {
            setFixed(text);
            onChange?.(text);
          })}
        </div>
      ) : (
        mode && (
          <>
            <Button
              style={{ marginBottom: 10, marginLeft: 20 }}
              onClick={/* 切换多语言或地区明细的展开状态。 */ () => setOpen(!open)}
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
                      {renderInput(multi.starling_default, /* 更新多值配置的默认内容。 */ (text) =>
                        update({ starling_default: text }),
                      )}
                    </Col>
                  </Row>
                </section>
                {multi.starling_list.map(/* 为每条语言或地区配置渲染编辑行。 */ (item, index) => (
                  <LanguageRow
                    key={index}
                    item={item}
                    index={index}
                    kind={kind}
                    upload={upload}
                    disabled={rest.disabled}
                    optionList={mode === 'region' ? optionList : CAPCUT_LG}
                    styles={styles}
                    renderInput={renderInput}
                    onChange={/* 将当前行的内容变化合并回配置列表。 */ (item) =>
                      update({
                        starling_list: multi.starling_list.map(/* 只替换当前编辑行，保留其余配置。 */ (row, i) =>
                          i === index ? item : row,
                        ),
                      })
                    }
                    onRemove={/* 删除当前语言或地区配置行。 */ () =>
                      update({
                        starling_list: multi.starling_list.filter(
                          /** 保留删除目标以外的配置行。 */
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  />
                ))}
                <section className={styles.popover_card_content_center}>
                  <Button
                    icon={<IconPlus />}
                    disabled={rest.disabled}
                    onClick={/* 追加一条空的语言或地区配置。 */ () =>
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
