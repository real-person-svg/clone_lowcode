import React from 'react';
import { Form } from '@douyinfe/semi-ui';
import type { ResourcePlacement } from '@shared/types';
import { basicFields } from './fields';
import { FormClientVersionLimit } from './ClientVersionLimit';
import { validateVersionLimits } from './ClientVersionLimit/versionLimits';
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
  const environmentDisabled = isEdit && record?.env === 'online';

  return (
    <>
      <Form.Input
        field="env"
        label={basicFields.env.label}
        placeholder="请输入泳道，如果要直接创建线上资源位则输入 online"
        disabled={environmentDisabled}
        rules={basicFields.env.rules}
      />
      <FormImage
        field="exampleImage"
        label={basicFields.exampleImage.label}
        rules={basicFields.exampleImage.rules}
      />
      {children}
      <FormClientVersionLimit
        field="versionLimit"
        label={basicFields.versionLimit.label}
        validate={validateVersionLimits}
      />
    </>
  );
}
