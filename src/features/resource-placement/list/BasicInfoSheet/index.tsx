import React, { useRef, useState } from 'react';
import { Button, Form, SideSheet, Space, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import type { ResourcePlacement } from '@shared/types';
import { api } from '../../api/client';
import IdentityFields from './IdentityFields';
import BusinessOptionsFields from './BusinessOptionsFields';
import ConfigurationFields from './ConfigurationFields';
import {
  initialValues,
  resourceInput,
  type SheetMode,
  type Values
} from './values';
import './form.scss';
export type { SheetMode } from './values';

const titles: Record<SheetMode, string> = {
  create: '新建资源位',
  edit: '编辑资源位',
  copy: '复制资源位',
  child: '创建子版本'
};

/** 提供新建、编辑、复制和子版本共用的基础信息侧栏。 */
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
  const form = useRef<FormApi<Partial<Values>>>();
  const [saving, setSaving] = useState(false);
  const isEdit = mode === 'edit';
  const initial = initialValues(mode, record);
  /** 按当前模式提交资源位数据，编辑时携带修订号检测冲突。 */
  const submit = async (values: Values) => {
    setSaving(true);
    try {
      const data = resourceInput(mode, values, record);
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
      title={titles[mode]}
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
            onClick={/* 触发表单校验及提交。 */ () => form.current?.submitForm()}
          >
            确认
          </Button>
        </Space>
      }
    >
      <Form<Partial<Values>>
        initValues={initial}
        getFormApi={/* 保存表单 API，供确认按钮调用。 */ (value) => {
          form.current = value;
        }}
        onSubmit={/* 将校验通过的表单值交给资源位提交流程。 */ (values) => void submit(values as Values)}
        labelPosition="top"
        style={{ width: '100%' }}
      >
        <IdentityFields mode={mode} />
        <ConfigurationFields isEdit={isEdit} record={record}>
          {mode !== 'child' && <BusinessOptionsFields />}
        </ConfigurationFields>
      </Form>
    </SideSheet>
  );
}
