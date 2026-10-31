import React, { useRef } from 'react';
import { Button, Form } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import { appList, type ListFilters } from '@shared/types';
import { fieldLabel } from '../FieldLabel';
import styles from './style.module.scss';

export const initialFilters: ListFilters = {
  resourceKey: '',
  resourceName: '',
  env: '',
  bizId: appList.map(/* 提取业务线编号作为默认筛选范围。 */ (app) => app.value),
  creator: ''
};

/** 展示资源位筛选表单，提供搜索及重置入口。 */
export default function ResourceFilters({
  loading,
  onSearch
}: {
  loading: boolean;
  onSearch: (filters: ListFilters) => void;
}) {
  const form = useRef<FormApi<ListFilters>>();
  /** 恢复默认筛选并立即重新搜索。 */
  const reset = () => {
    form.current?.setValues(initialFilters);
    onSearch(initialFilters);
  };

  return (
    <div className={styles.wrapper}>
      <Form<ListFilters>
        initValues={initialFilters}
        getFormApi={/* 保存筛选表单 API，供重置时回填使用。 */ (value) => {
          form.current = value;
        }}
        onSubmit={/* 将校验后的筛选值传给列表查询。 */ (values) => onSearch(values as ListFilters)}
        labelPosition="top"
      >
        <div className={styles.fields}>
          <Form.Input
            field="resourceKey"
            label={fieldLabel('资源位Key')}
            placeholder="请输入资源位Key"
          />
          <Form.Input
            field="resourceName"
            label={fieldLabel('资源位名称')}
            placeholder="请输入资源位名称"
          />
          <Form.Input
            field="env"
            label={fieldLabel('环境')}
            placeholder="请输入泳道名称"
          />
          <Form.Select
            field="bizId"
            label={fieldLabel('业务线')}
            optionList={appList}
            multiple
            maxTagCount={1}
            ellipsisTrigger
            placeholder="请选择业务线"
            style={{ width: '100%' }}
          />
          <Form.Input
            field="creator"
            label={fieldLabel('创建人')}
            placeholder="请输入创建人"
          />
        </div>
        <div className={styles.actions}>
          <Button onClick={reset}>重置</Button>
          <Button theme="solid" htmlType="submit" loading={loading}>
            查询
          </Button>
        </div>
      </Form>
    </div>
  );
}
