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
/** 分页展示资源位操作历史，并提供差异比对和回滚入口。 */
export default function OperationLogModal({
  resourceId,
  onClose,
  loadData
}: {
  resourceId: number;
  onClose: () => void;
  loadData: () => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PageResult<OperationLog>>({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10
  });
  const [diff, setDiff] = useState<OperationLog>();
  useEffect(/* 加载当前资源及分页的日志，忽略清理后的状态回写。 */ () => {
    let active = true;
    setLoading(true);
    api
      .getOperationLogs({ resourcePlacementId: resourceId, page, pageSize })
      .then(/* 在请求仍有效时应用日志列表。 */ (v) => {
        if (active) setData(v);
      })
      .catch(/* 在请求仍有效时展示日志加载错误。 */ (e) => {
        if (active) Toast.error(e.message);
      })
      .finally(/* 在请求仍有效时结束加载状态。 */ () => {
        if (active) setLoading(false);
      });
    return /* 使本轮日志请求的后续状态回写失效。 */ () => {
      active = false;
    };
  }, [resourceId, page, pageSize]);
  /** 确认使用指定操作后的快照恢复当前资源位。 */
  const roll = (record: OperationLog) =>
    Modal.confirm({
      title: '确认回滚',
      okButtonProps: { type: 'danger' },
      content: '确定后会使用该次操作记录后的数据覆盖到当前资源位配置中。',
      onOk: /* 执行回滚，成功后关闭日志并刷新资源列表。 */ async () => {
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
              render: /* 将操作类型转换为可读名称，未知类型保留原文。 */ (v: string) => (
                <Typography.Text>{types[v] || v}</Typography.Text>
              )
            },
            {
              title: '操作时间',
              dataIndex: 'operationTime',
              width: 150,
              render: /* 将操作时间格式化为本地年月日及时间。 */ (v: string) => new Date(v).toLocaleString('sv-SE')
            },
            { title: '操作人', dataIndex: 'operator', width: 100 },
            {
              title: '操作',
              width: 240,
              render: /* 渲染当前日志的差异比对及回滚按钮。 */ (_v: unknown, r: OperationLog) => (
                <div style={{ display: 'flex' }}>
                  <Button
                    size="small"
                    theme="borderless"
                    onClick={/* 打开当前操作的配置差异弹窗。 */ () => setDiff(r)}
                  >
                    比对变更
                  </Button>
                  <Button
                    size="small"
                    theme="borderless"
                    disabled={!r.newConfig}
                    onClick={/* 发起当前操作版本的回滚确认。 */ () => roll(r)}
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
            onChange: /* 更新日志页码与每页条数。 */ (p, size) => {
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
          onClose={/* 关闭配置差异弹窗。 */ () => setDiff(undefined)}
        />
      )}
    </>
  );
}
