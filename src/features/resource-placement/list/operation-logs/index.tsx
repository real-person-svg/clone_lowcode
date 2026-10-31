import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Typography, Toast } from '@douyinfe/semi-ui';
import type { OperationLog, PageResult } from '@shared/types';
import { api } from '../../api/client';
import ConfigDiffModal from './ConfigDiffModal';
import { parseLogSnapshot } from './snapshots';
const types: Record<string, string> = {
  CREATE: '创建资源位',
  UPDATE: '更新配置',
  DELETE: '删除资源位',
  PUBLISH: '发布上线',
  ENABLE: '启用资源位',
  UNABLE: '禁用资源位',
  ROLL: '回滚'
};
export default function OperationLogModal({
  resourceId,
  onClose,
  loadData
}: {
  resourceId: number;
  onClose: () => void;
  loadData: () => void;
}) {
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [loading, setLoading] = useState(false),
    [data, setData] = useState<PageResult<OperationLog>>({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    }),
    [diff, setDiff] = useState<OperationLog>();
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getOperationLogs({ resourcePlacementId: resourceId, page, pageSize })
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active) Toast.error(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resourceId, page, pageSize]);
  const roll = (record: OperationLog) =>
    Modal.confirm({
      title: '确认回滚',
      okButtonProps: { type: 'danger' },
      content: '确定后会使用该次操作记录后的数据覆盖到当前资源位配置中。',
      onOk: async () => {
        try {
          await api.roll({
            resourcePlacementId: resourceId,
            versionId: record.versionId
          });
          Toast.success('回滚成功');
          onClose();
          loadData();
        } catch (e) {
          Toast.error(`回滚失败: ${(e as Error).message}`);
          throw e;
        }
      }
    });
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
          columns={[
            {
              title: '操作类型',
              dataIndex: 'operationType',
              width: 120,
              render: (v: string) => (
                <Typography.Text>{types[v] || v}</Typography.Text>
              )
            },
            {
              title: '操作时间',
              dataIndex: 'operationTime',
              width: 150,
              render: (v: string) => new Date(v).toLocaleString('sv-SE')
            },
            { title: '操作人', dataIndex: 'operator', width: 100 },
            {
              title: '操作',
              width: 240,
              render: (_v: unknown, r: OperationLog) => (
                <div style={{ display: 'flex' }}>
                  <Button
                    size="small"
                    theme="borderless"
                    onClick={() => setDiff(r)}
                  >
                    比对变更
                  </Button>
                  <Button
                    size="small"
                    theme="borderless"
                    disabled={!r.newConfig}
                    onClick={() => roll(r)}
                  >
                    回滚到此版本
                  </Button>
                </div>
              )
            }
          ]}
          dataSource={data.list}
          loading={loading}
          size="small"
          scroll={{ y: 600 }}
          pagination={{
            currentPage: page,
            pageSize,
            total: data.total,
            showQuickJumper: false,
            showSizeChanger: true,
            pageSizeOpts: [10, 20, 50],
            onChange: (p, size) => {
              setPage(p);
              setPageSize(size);
            }
          }}
          empty="暂无操作记录"
        />
      </Modal>
      {diff && (
        <ConfigDiffModal
          visible
          oldConfig={parseLogSnapshot(diff.oldConfig)}
          newConfig={parseLogSnapshot(diff.newConfig)}
          onClose={() => setDiff(undefined)}
        />
      )}
    </>
  );
}
