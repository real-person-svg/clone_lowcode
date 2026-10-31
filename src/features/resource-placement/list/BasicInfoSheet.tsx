import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  InputGroup,
  SideSheet,
  Space,
  Toast,
  Upload,
  withField
} from '@douyinfe/semi-ui';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload/interface';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import {
  appList,
  type ResourcePlacement,
  type ResourceInput
} from '@shared/types';
import { api } from '../api/client';
import { FormClientVersionLimit } from './ClientVersionLimit';
import { fieldLabel } from './FieldLabel';
import { IconPlus } from '@douyinfe/semi-icons';
import './form.scss';
export type SheetMode = 'create' | 'edit' | 'copy' | 'child';
function LocalImage({
  value,
  onChange
}: {
  value?: string | null;
  onChange?: (value: string | null) => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  useEffect(() => {
    setFiles(
      value
        ? [
            {
              uid: value,
              status: 'success',
              size: '0 B',
              url: value,
              name: value
            }
          ]
        : []
    );
  }, [value]);
  return (
    <Upload
      action="/api/assets/upload"
      name="file"
      accept="image/*"
      listType="picture"
      limit={1}
      fileList={files}
      onChange={({ fileList }) => setFiles(fileList)}
      onSuccess={(response) => onChange?.((response as { url: string }).url)}
      onRemove={() => {
        onChange?.(null);
        return true;
      }}
      onError={() => Toast.error('上传失败，请重新上传')}
    >
      <IconPlus size="extra-large" />
    </Upload>
  );
}
const FormImage = withField(LocalImage, {
  valueKey: 'value',
  onKeyChangeFnName: 'onChange'
});
const yesNo = [
  { label: '否', value: 0 },
  { label: '是', value: 1 }
];
interface Values {
  resourceKey: string;
  resourceName: string;
  bizId: number;
  directoryPath: string;
  version: string;
  versionAlias?: string;
  env: string;
  exampleImage: string | null;
  showFrequencyControl: number;
  showReco: number;
  abExperimentOptionEnabled: number;
  pageFrom?: string | null;
  versionLimit?: { platform?: string; operator?: string; version?: string }[];
}
export default function BasicInfoSheet({
  mode,
  record,
  onClose,
  onSaved
}: {
  mode: SheetMode;
  record?: ResourcePlacement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useRef<FormApi<Partial<Values>>>(),
    [saving, setSaving] = useState(false),
    isChild = mode === 'child',
    isEdit = mode === 'edit';
  const initial = {
    showFrequencyControl: 0,
    showReco: 0,
    abExperimentOptionEnabled: 0,
    bizId: appList[0].value,
    ...record,
    id: mode === 'copy' ? undefined : record?.id,
    version: isChild ? '' : record?.version || undefined,
    versionAlias: isChild ? '' : record?.versionAlias || undefined,
    versionLimit: record?.versionLimit ? JSON.parse(record.versionLimit) : []
  };
  const submit = async (values: Values) => {
    setSaving(true);
    try {
      const data = {
        ...values,
        description: record?.description || '',
        versionLimit: values.versionLimit?.length
          ? JSON.stringify(values.versionLimit)
          : null,
        configData:
          isEdit || mode === 'copy' ? record!.configData : '{"content":[]}',
        extra: record?.extra ?? null
      } as ResourceInput;
      if (isChild) {
        Object.assign(data, {
          ...record,
          ...data,
          resourceKey: `${record!.resourceKey}_${values.version}`,
          resourceName: `${record!.resourceName}_${values.version}`,
          parentResourceKey: record!.resourceKey,
          id: undefined,
          configData: '{"content":[]}'
        });
      } else if (mode === 'copy') {
        Object.assign(data, {
          parentResourceKey: null,
          version: null,
          versionAlias: null
        });
      }
      if (isEdit)
        await api.update({
          ...data,
          id: record!.id,
          revision: record!.revision
        });
      else await api.create(data);
      Toast.success(isEdit ? '更新成功' : '创建成功');
      onSaved();
      onClose();
    } catch (error) {
      Toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <SideSheet
      title={
        mode === 'copy'
          ? '复制资源位'
          : isChild
          ? '创建子版本'
          : isEdit
          ? '编辑资源位'
          : '新建资源位'
      }
      visible
      onCancel={onClose}
      placement="right"
      width={600}
      maskClosable={false}
      closable
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            theme="solid"
            loading={saving}
            onClick={() => form.current?.submitForm()}
          >
            确认
          </Button>
        </Space>
      }
    >
      <Form<Partial<Values>>
        initValues={initial}
        getFormApi={(value) => {
          form.current = value;
        }}
        onSubmit={(values) => void submit(values as Values)}
        labelPosition="top"
        style={{ width: '100%' }}
      >
        {!isChild && (
          <>
            <Form.Input
              field="resourceKey"
              label={fieldLabel('资源位Key', true)}
              placeholder="请输入资源位Key"
              disabled={isEdit}
              rules={[
                { required: true, message: '请输入资源位Key' },
                {
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: '只能包含字母、数字、下划线和横线'
                }
              ]}
            />
            <InputGroup className="basic-input-group">
              <Form.Select
                field="bizId"
                label={fieldLabel('业务线', true)}
                optionList={appList}
                disabled={isEdit}
                showClear={false}
                style={{ width: '100%' }}
                fieldStyle={{ flex: 1 }}
                rules={[{ required: true, message: '请选择业务线' }]}
              />
              <Form.Input
                field="directoryPath"
                label={fieldLabel('资源位二级目录', true)}
                placeholder="请输入二级目录名称"
                fieldStyle={{ flex: 1 }}
                rules={[{ required: true, message: '请输入二级目录名称' }]}
              />
              <Form.Input
                field="resourceName"
                label={fieldLabel('资源位名称', true)}
                placeholder="请输入资源位名称"
                fieldStyle={{ flex: 1 }}
                rules={[{ required: true, message: '请输入资源位名称' }]}
              />
            </InputGroup>
          </>
        )}
        {isChild && (
          <>
            <Form.Input
              field="version"
              label={fieldLabel('资源位子版本', true)}
              placeholder="请输入资源位子版本，比如 v1、v2、v3"
              rules={[
                { required: true, message: '请输入资源位子版本' },
                {
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: '只能包含字母、数字、下划线和横线'
                }
              ]}
            />
            <Form.Input
              field="versionAlias"
              label={fieldLabel('资源位子版本别名', false)}
              placeholder="请输入子版本别名"
            />
          </>
        )}
        <Form.Input
          field="env"
          label={fieldLabel(
            '泳道环境',
            true,
            '优先使用当前泳道下启用的配置，不存在则使用 online 环境启用的配置。'
          )}
          placeholder="请输入泳道，如果要直接创建线上资源位则输入 online"
          disabled={isEdit && record?.env === 'online'}
          rules={[
            { required: true, message: '请输入泳道环境' },
            { pattern: /^\S+$/, message: '环境不能包含空格' }
          ]}
        />
        <FormImage
          field="exampleImage"
          label={fieldLabel('资源位示例图', true)}
          rules={[{ required: true, message: '请上传资源位示例图' }]}
        />
        {!isChild && (
          <>
            <Form.Select
              field="showFrequencyControl"
              label={fieldLabel('是否展示频控', false)}
              optionList={[
                { label: '是', value: 1 },
                { label: '否', value: 0 }
              ]}
              showClear={false}
              style={{ width: '100%' }}
            />
            <Form.Select
              field="showReco"
              label={fieldLabel(
                '是否支持开启算法开关',
                false,
                '打开时则 Vimo 资源位配置页面会展示「是否开启算法推荐」'
              )}
              optionList={yesNo}
              showClear={false}
              style={{ width: '100%' }}
            />
            <Form.Select
              field="abExperimentOptionEnabled"
              label={fieldLabel(
                '是否支持切换实验类型',
                false,
                '打开时可选择切换服务端实验和客户端 SDK 实验'
              )}
              optionList={yesNo}
              showClear={false}
              style={{ width: '100%' }}
            />
            <Form.Input
              field="pageFrom"
              label={fieldLabel(
                '埋点参数 pageFrom',
                false,
                '用于资源位配置跳转链接时，自动取该字段拼接到跳转链接的 ?page_form 参数中给端上上报埋点'
              )}
              placeholder="请输入 pageFrom"
            />
          </>
        )}
        <FormClientVersionLimit
          field="versionLimit"
          label={fieldLabel('客户端版本限制', false)}
          validate={(value) => {
            if (!value?.length) return '';
            return value.every(
              (row: {
                platform?: string;
                operator?: string;
                version?: string;
              }) =>
                row.platform &&
                row.operator &&
                /^\d+\.\d+\.(\d+|\*)$/.test(row.version || '')
            )
              ? ''
              : '请补全客户端、操作符和有效版本号，如 1.2.3';
          }}
        />
      </Form>
    </SideSheet>
  );
}
