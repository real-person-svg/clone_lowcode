import React from 'react';
import { Form, InputGroup } from '@douyinfe/semi-ui';
import { appList } from '@shared/types';
import { basicFields } from './fields';
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
            label={basicFields.resourceKey.label}
            placeholder="请输入资源位Key"
            disabled={isEdit}
            rules={basicFields.resourceKey.rules}
          />
          <InputGroup className="basic-input-group">
            <Form.Select
              field="bizId"
              label={basicFields.bizId.label}
              optionList={appList}
              disabled={isEdit}
              showClear={false}
              style={{ width: '100%' }}
              fieldStyle={{ flex: 1 }}
              rules={basicFields.bizId.rules}
            />
            <Form.Input
              field="directoryPath"
              label={basicFields.directoryPath.label}
              placeholder="请输入二级目录名称"
              fieldStyle={{ flex: 1 }}
              rules={basicFields.directoryPath.rules}
            />
            <Form.Input
              field="resourceName"
              label={basicFields.resourceName.label}
              placeholder="请输入资源位名称"
              fieldStyle={{ flex: 1 }}
              rules={basicFields.resourceName.rules}
            />
          </InputGroup>
        </>
      )}
      {isChild && (
        <>
          <Form.Input
            field="version"
            label={basicFields.version.label}
            placeholder="请输入资源位子版本，比如 v1、v2、v3"
            rules={basicFields.version.rules}
          />
          <Form.Input
            field="versionAlias"
            label={basicFields.versionAlias.label}
            placeholder="请输入子版本别名"
          />
        </>
      )}
    </>
  );
}
