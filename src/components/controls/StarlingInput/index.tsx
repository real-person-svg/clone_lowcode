import React from 'react';
import { LocalSelect as Select } from '../Select';
import { Button, Input, Modal, Space, Typography } from '@douyinfe/semi-ui';
import { IconPlus, IconClose } from '@douyinfe/semi-icons';
import GroupContainer from '../GroupContainer';
import { CAPCUT_LG } from '../localization';
import styles from './style.module.scss';
export interface StarlingValue {
  $fieldType: 'STARLING_FIELD';
  type: string;
  value: string;
  variables?: { type?: number; key: string; value: string }[];
  languages?: Record<string, string>;
}
/** 编辑普通或 Starling 文案，并配置变量和本地语言值。 */
export default function StarlingInput({
  value,
  onChange,
  disabled,
}: {
  value?: StarlingValue;
  onChange?: (value: StarlingValue) => void;
  disabled?: boolean;
}) {
  const current: StarlingValue = value ?? {
    $fieldType: 'STARLING_FIELD',
    type: 'STARLING',
    value: '',
    variables: [],
    languages: {},
  };
  const [modal, setModal] = React.useState<'variables' | 'languages' | null>(
    null,
  );
  const [variables, setVariables] = React.useState<
    NonNullable<StarlingValue['variables']>
  >([]);
  const [languages, setLanguages] = React.useState<[string, string][]>([]);
  /** 合并文案配置的局部变化并通知表单。 */
  const change = (patch: Partial<StarlingValue>) =>
    onChange?.({ ...current, ...patch });
  return (
    <div className={styles.starling_wrapper}>
      <GroupContainer>
        <Select
          aria-label="文案类型"
          disabled={disabled}
          className={styles.starling_type_select}
          value={current.type}
          optionList={[
            { value: 'STARLING', label: 'starling' },
            { value: 'NORMAL', label: '普通' },
          ]}
          onChange={/* 更新当前文案类型。 */ (type) => change({ type: String(type) })}
        />
        <Input
          disabled={disabled}
          value={current.value}
          placeholder={
            current.type === 'STARLING'
              ? '请输入本地 starling key'
              : '请输入文案'
          }
          onChange={/* 更新当前文案内容或 Starling Key。 */ (value) => change({ value })}
        />
      </GroupContainer>
      {current.type === 'STARLING' && (
        <Button
          theme="borderless"
          disabled={disabled}
          className={styles.starling_extra_info_add}
          onClick={/* 载入当前变量配置并打开变量弹窗。 */ () => {
            setVariables(current.variables ?? []);
            setModal('variables');
          }}
        >
          设置变量
        </Button>
      )}
      <Button
        theme="borderless"
        disabled={disabled}
        className={styles.starling_extra_info_add}
        onClick={/* 载入当前本地语言配置并打开语言弹窗。 */ () => {
          setLanguages(Object.entries(current.languages ?? {}));
          setModal('languages');
        }}
      >
        本地语言值
      </Button>
      <Modal
        title={modal === 'variables' ? '变量设置' : '本地语言值'}
        visible={modal !== null}
        onCancel={/* 取消本次弹窗编辑。 */ () => setModal(null)}
        onOk={/* 提交变量或过滤空语言编码后的语言值，并关闭弹窗。 */ () => {
          if (modal === 'variables') change({ variables });
          else
            change({
              languages: Object.fromEntries(languages.filter(/* 只保留已选择语言编码的配置。 */ ([key]) => key)),
            });
          setModal(null);
        }}
      >
        <Typography.Paragraph type="secondary">
          配置与语言值仅保存在本地资源位中。
        </Typography.Paragraph>
        {modal === 'variables' ? (
          <Space vertical align="start" style={{ width: '100%' }}>
            {variables.map(/* 为每个变量渲染名称、内容及删除操作。 */ (variable, index) => (
              <Space key={index}>
                <Input
                  placeholder="变量名"
                  value={variable.key}
                  onChange={/* 更新当前变量名称。 */ (key) =>
                    setVariables(
                      variables.map(/* 只替换当前变量的名称。 */ (item, i) =>
                        i === index ? { ...item, key } : item,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="变量值"
                  value={variable.value}
                  onChange={/* 更新当前变量内容。 */ (value) =>
                    setVariables(
                      variables.map(/* 只替换当前变量的内容。 */ (item, i) =>
                        i === index ? { ...item, value } : item,
                      ),
                    )
                  }
                />
                <Button
                  icon={<IconClose />}
                  onClick={/* 移除当前变量行。 */ () =>
                    setVariables(variables.filter(/* 保留删除目标以外的变量。 */ (_, i) => i !== index))
                  }
                />
              </Space>
            ))}
            <Button
              icon={<IconPlus />}
              onClick={/* 追加一条空变量配置。 */ () =>
                setVariables([...variables, { type: 1, key: '', value: '' }])
              }
            >
              添加变量
            </Button>
          </Space>
        ) : (
          <Space vertical align="start" style={{ width: '100%' }}>
            {languages.map(/* 为每个本地语言值渲染编辑行。 */ ([language, text], index) => (
              <Space key={index}>
                <Select
                  style={{ width: 120 }}
                  placeholder="选择语言"
                  optionList={CAPCUT_LG}
                  value={language}
                  onChange={/* 更新当前语言编码。 */ (key) =>
                    setLanguages(
                      languages.map(/* 只替换当前行的语言编码，保留内容。 */ (item, i) =>
                        i === index ? [String(key), item[1]] : item,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="本地语言值"
                  value={text}
                  onChange={/* 更新当前语言的文案内容。 */ (text) =>
                    setLanguages(
                      languages.map(/* 只替换当前行的文案，保留语言编码。 */ (item, i) =>
                        i === index ? [item[0], text] : item,
                      ),
                    )
                  }
                />
                <Button
                  icon={<IconClose />}
                  onClick={/* 移除当前本地语言行。 */ () =>
                    setLanguages(languages.filter(/* 保留删除目标以外的语言行。 */ (_, i) => i !== index))
                  }
                />
              </Space>
            ))}
            <Button
              icon={<IconPlus />}
              onClick={/* 追加一条空语言配置。 */ () => setLanguages([...languages, ['', '']])}
            >
              添加语言
            </Button>
          </Space>
        )}
      </Modal>
    </div>
  );
}
