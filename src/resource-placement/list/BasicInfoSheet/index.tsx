import React from 'react';
import { Button, Form, SideSheet, Space } from '@douyinfe/semi-ui';
import IdentityFields from './IdentityFields';
import BusinessOptionsFields from './BusinessOptionsFields';
import ConfigurationFields from './ConfigurationFields';
import type { Values } from './values';
import { useBasicInfoSheet, type BasicInfoSheetProps } from './useBasicInfoSheet';
import './form.scss';
export type { SheetMode } from './values';

/** 提供新建、编辑、复制和子版本共用的基础信息侧栏。 */
export default function BasicInfoSheet(props: BasicInfoSheetProps) {
  const { mode, record, onClose } = props;
  const { isEdit, initial, saving, title, submitForm, setFormApi, handleSubmit } = useBasicInfoSheet(props);

  return (
    <SideSheet
      title={title}
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
            onClick={submitForm}
          >
            确认
          </Button>
        </Space>
      }
    >
      <Form<Partial<Values>>
        initValues={initial}
        getFormApi={setFormApi}
        onSubmit={handleSubmit}
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
