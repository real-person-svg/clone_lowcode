import React from 'react';
import { Form } from '@douyinfe/semi-ui';
import type { ResourcePlacement } from '@shared/types';
import { fieldLabel } from '../FieldLabel';
import { FormClientVersionLimit } from './ClientVersionLimit';
import { FormImage } from './ImageField';

/** 展示环境、示例图、业务扩展字段与客户端版本限制。 */
export default function ConfigurationFields({
  isEdit,
  record,
  children
}: {
  isEdit: boolean;
  record?: ResourcePlacement;
  children?: React.ReactNode;
}) {
  return (
    <>
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
      {children}
      <FormClientVersionLimit
        field="versionLimit"
        label={fieldLabel('客户端版本限制', false)}
        validate={/* 允许空限制列表，否则要求每一行填写完整且版本格式有效。 */ (value) => {
          if (!value?.length) return '';
          return value.every(
            /** 校验单条限制的平台、比较符及三段版本格式。 */
            (row: { platform?: string; operator?: string; version?: string }) =>
              row.platform &&
              row.operator &&
              /^\d+\.\d+\.(\d+|\*)$/.test(row.version || '')
          )
            ? ''
            : '请补全客户端、操作符和有效版本号，如 1.2.3';
        }}
      />
    </>
  );
}
