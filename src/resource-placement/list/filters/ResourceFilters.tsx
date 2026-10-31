import React from 'react';
import { Button, Form } from '@douyinfe/semi-ui';
import { appList, type ListFilters } from '@shared/types';
import { filterFields } from './fields';
import { initialFilters } from './filters';
import { useResourceFilters } from './useResourceFilters';
import styles from './style.module.scss';

/** 展示资源位筛选表单，提供搜索及重置入口。 */
export default function ResourceFilters({
  loading,
  onSearch
}: {
  loading: boolean;
  onSearch: (filters: ListFilters) => void;
}) {
  const { reset, setFormApi, submit } = useResourceFilters(onSearch);

  return (
    <div className={styles.wrapper}>
      <Form<ListFilters>
        initValues={initialFilters}
        getFormApi={setFormApi}
        onSubmit={submit}
        labelPosition="top"
      >
        <div className={styles.fields}>
          <Form.Input
            field="resourceKey"
            label={filterFields.resourceKey.label}
            placeholder="请输入资源位Key"
          />
          <Form.Input
            field="resourceName"
            label={filterFields.resourceName.label}
            placeholder="请输入资源位名称"
          />
          <Form.Input
            field="env"
            label={filterFields.env.label}
            placeholder="请输入泳道名称"
          />
          <Form.Select
            field="bizId"
            label={filterFields.bizId.label}
            optionList={appList}
            multiple
            maxTagCount={1}
            ellipsisTrigger
            placeholder="请选择业务线"
            style={{ width: '100%' }}
          />
          <Form.Input
            field="creator"
            label={filterFields.creator.label}
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
