import React from 'react';
import { Modal, Table, Button, Typography } from '@douyinfe/semi-ui';
import type { OperationLog } from '@shared/types';
import ConfigDiffModal from './ConfigDiffModal';
import { operationTypes } from './constants';
import { useOperationLogs, type OperationLogProps } from './useOperationLogs';

function LogActions({ record, onDiff, onRoll }: {
  record: OperationLog;
  onDiff: (record: OperationLog) => void;
  onRoll: (record: OperationLog) => void;
}) {
  const showDiff = () => onDiff(record);

  const roll = () => onRoll(record);

  const rollbackDisabled = !record.newConfig;

  return (
    <div style={{ display: 'flex' }}>
      <Button size="small" theme="borderless" onClick={showDiff}>比对变更</Button>
      <Button size="small" theme="borderless" disabled={rollbackDisabled} onClick={roll}>
        回滚到此版本
      </Button>
    </div>
  );
}

/** 分页展示操作历史，组合差异比对和回滚入口。 */
export default function OperationLogModal(props: OperationLogProps) {
  const { onClose } = props;
  const { data, loading, diff, oldConfig, newConfig, pagination, openDiff, closeDiff, roll } = useOperationLogs(props);
  const columns = [
    {
      title: '操作类型',
      dataIndex: 'operationType',
      width: 120,
      /* 将操作类型转换为可读名称，未知类型保留原文。 */
      render: (v: string) => (
        <Typography.Text>{operationTypes[v] || v}</Typography.Text>
      )
    },
    {
      title: '操作时间',
      dataIndex: 'operationTime',
      width: 150,
      /* 将操作时间格式化为本地年月日及时间。 */
      render: (v: string) => new Date(v).toLocaleString('sv-SE')
    },
    { title: '操作人', dataIndex: 'operator', width: 100 },
    {
      title: '操作',
      width: 240,
      render: (_value: unknown, record: OperationLog) => (
        <LogActions record={record} onDiff={openDiff} onRoll={roll} />
      )
    }
  ];

  return (
    <>
      <Modal
        title="操作日志"
        visible
        width={900}
        footer={null}
        onCancel={onClose}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Table
          rowKey="versionId"
          columns={columns}
          dataSource={data.list}
          loading={loading}
          size="small"
          scroll={{ y: 600 }}
          pagination={pagination}
          empty="暂无操作记录"
        />
      </Modal>
      {diff && (
        <ConfigDiffModal
          visible
          oldConfig={oldConfig}
          newConfig={newConfig}
          onClose={closeDiff}
        />
      )}
    </>
  );
}
