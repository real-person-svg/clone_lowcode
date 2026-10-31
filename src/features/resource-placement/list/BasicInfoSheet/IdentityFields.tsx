import React from 'react';
import { Form, InputGroup } from '@douyinfe/semi-ui';
import { appList } from '@shared/types';
import { fieldLabel } from '../FieldLabel';
import type { SheetMode } from './values';

/** 根据新建、编辑或子版本模式展示资源身份字段及编辑限制。 */
export default function IdentityFields({ mode }: { mode: SheetMode }) {
  const isChild = mode === 'child';
  const isEdit = mode === 'edit';
  return (
    <>
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
    </>
  );
}
