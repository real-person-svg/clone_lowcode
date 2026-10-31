import { useEffect, useState } from 'react';
import { Modal, Toast } from '@douyinfe/semi-ui';
import type { OperationLog, PageResult } from '@shared/types';
import { api } from '../../api/client';
import { parseLogSnapshot } from './snapshots';

export interface OperationLogProps {
  resourceId: number;
  onClose: () => void;
  loadData: () => void;
}

export function useOperationLogs({ resourceId, onClose, loadData }: OperationLogProps) {
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
  useEffect(
    /* 加载当前资源及分页的日志，忽略清理后的状态回写。 */
    () => {
      let active = true;
      setLoading(true);
      api
        .getOperationLogs({ resourcePlacementId: resourceId, page, pageSize })
        .then(
          /* 在请求仍有效时应用日志列表。 */
          (v) => {
            if (active) setData(v);
          })
        .catch(
          /* 在请求仍有效时展示日志加载错误。 */
          (e) => {
            if (active) Toast.error(e.message);
          })
        .finally(
          /* 在请求仍有效时结束加载状态。 */
          () => {
            if (active) setLoading(false);
          });
      /* 使本轮日志请求的后续状态回写失效。 */
      return () => {
        active = false;
      };
    }, [resourceId, page, pageSize]);

  /** 确认使用指定操作后的快照恢复当前资源位。 */
  const roll = (record: OperationLog) =>
    Modal.confirm({
      title: '确认回滚',
      okButtonProps: { type: 'danger' },
      content: '确定后会使用该次操作记录后的数据覆盖到当前资源位配置中。',
      /* 执行回滚，成功后关闭日志并刷新资源列表。 */
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

  const closeDiff = () => setDiff(undefined);

  const changePage = (nextPage: number, nextSize: number) => {
    setPage(nextPage);
    setPageSize(nextSize);
  };

  const oldConfig = diff ? parseLogSnapshot(diff.oldConfig) : undefined;
  const newConfig = diff ? parseLogSnapshot(diff.newConfig) : undefined;
  const pagination = {
    currentPage: page,
    pageSize,
    total: data.total,
    showQuickJumper: false,
    showSizeChanger: true,
    pageSizeOpts: [10, 20, 50],
    onChange: changePage
  };

  return { data, loading, diff, oldConfig, newConfig, pagination, openDiff: setDiff, closeDiff, roll };
}
