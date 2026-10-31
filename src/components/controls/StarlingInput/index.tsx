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
          onChange={(type) => change({ type: String(type) })}
        />
        <Input
          disabled={disabled}
          value={current.value}
          placeholder={
            current.type === 'STARLING'
              ? '请输入本地 starling key'
              : '请输入文案'
          }
          onChange={(value) => change({ value })}
        />
      </GroupContainer>
      {current.type === 'STARLING' && (
        <Button
          theme="borderless"
          disabled={disabled}
          className={styles.starling_extra_info_add}
          onClick={() => {
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
        onClick={() => {
          setLanguages(Object.entries(current.languages ?? {}));
          setModal('languages');
        }}
      >
        本地语言值
      </Button>
      <Modal
        title={modal === 'variables' ? '变量设置' : '本地语言值'}
        visible={modal !== null}
        onCancel={() => setModal(null)}
        onOk={() => {
          if (modal === 'variables') change({ variables });
          else
            change({
              languages: Object.fromEntries(languages.filter(([key]) => key)),
            });
          setModal(null);
        }}
      >
        <Typography.Paragraph type="secondary">
          配置与语言值仅保存在本地资源位中。
        </Typography.Paragraph>
        {modal === 'variables' ? (
          <Space vertical align="start" style={{ width: '100%' }}>
            {variables.map((variable, index) => (
              <Space key={index}>
                <Input
                  placeholder="变量名"
                  value={variable.key}
                  onChange={(key) =>
                    setVariables(
                      variables.map((item, i) =>
                        i === index ? { ...item, key } : item,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="变量值"
                  value={variable.value}
                  onChange={(value) =>
                    setVariables(
                      variables.map((item, i) =>
                        i === index ? { ...item, value } : item,
                      ),
                    )
                  }
                />
                <Button
                  icon={<IconClose />}
                  onClick={() =>
                    setVariables(variables.filter((_, i) => i !== index))
                  }
                />
              </Space>
            ))}
            <Button
              icon={<IconPlus />}
              onClick={() =>
                setVariables([...variables, { type: 1, key: '', value: '' }])
              }
            >
              添加变量
            </Button>
          </Space>
        ) : (
          <Space vertical align="start" style={{ width: '100%' }}>
            {languages.map(([language, text], index) => (
              <Space key={index}>
                <Select
                  style={{ width: 120 }}
                  placeholder="选择语言"
                  optionList={CAPCUT_LG}
                  value={language}
                  onChange={(key) =>
                    setLanguages(
                      languages.map((item, i) =>
                        i === index ? [String(key), item[1]] : item,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="本地语言值"
                  value={text}
                  onChange={(text) =>
                    setLanguages(
                      languages.map((item, i) =>
                        i === index ? [item[0], text] : item,
                      ),
                    )
                  }
                />
                <Button
                  icon={<IconClose />}
                  onClick={() =>
                    setLanguages(languages.filter((_, i) => i !== index))
                  }
                />
              </Space>
            ))}
            <Button
              icon={<IconPlus />}
              onClick={() => setLanguages([...languages, ['', '']])}
            >
              添加语言
            </Button>
          </Space>
        )}
      </Modal>
    </div>
  );
}
