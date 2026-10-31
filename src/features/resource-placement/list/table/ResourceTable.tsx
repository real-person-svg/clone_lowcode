import React from 'react';
import { Table, Typography } from '@douyinfe/semi-ui';
import {
  appList,
  type PageResult,
  type ResourcePlacement
} from '@shared/types';
import RowActions, { type RowActionHandlers } from './RowActions';
import styles from './style.module.scss';

export default function ResourceTable({
  data,
  page,
  pageSize,
  loading,
  onPageChange,
  ...actions
}: RowActionHandlers & {
  data: PageResult<ResourcePlacement>;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
}) {
  const columns = [
    {
      title: '资源位名称',
      dataIndex: 'resourceName',
      width: 200,
      fixed: 'left' as const
    },
    { title: '资源位Id', dataIndex: 'id', width: 100, fixed: 'left' as const },
    { title: '资源位Key', dataIndex: 'resourceKey', width: 200 },
    { title: '泳道环境', dataIndex: 'env', width: 150 },
    {
      title: '业务线',
      dataIndex: 'bizId',
      width: 120,
      render: (v: number) => appList.find((a) => a.value === v)?.label || '-'
    },
    { title: '二级目录名称', dataIndex: 'directoryPath', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (
        <Typography.Text type={v === 1 ? 'success' : 'quaternary'}>
          {v === 1 ? '启用中' : '已禁用'}
        </Typography.Text>
      )
    },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 200,
      render: (v: string) => new Date(v).toLocaleString()
    },
    { title: '数据来源', dataIndex: 'from', width: 100 },
    {
      title: '操作',
      width: 320,
      fixed: 'right' as const,
      render: (_value: unknown, record: ResourcePlacement) => (
        <RowActions record={record} {...actions} />
      )
    }
  ];
  // Fixed offsets and physical column widths must use the same total.
  const tableWidth = columns.reduce((width, column) => width + column.width, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>资源位列表</div>
      <Table
        className={styles.table}
        rowKey="id"
        columns={columns}
        tableLayout="fixed"
        dataSource={data.list}
        scroll={{ x: tableWidth }}
        loading={loading}
        pagination={{
          currentPage: page,
          pageSize,
          total: data.total,
          showSizeChanger: true,
          showQuickJumper: false,
          onChange: onPageChange
        }}
      />
    </div>
  );
}
