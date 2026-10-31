import { useCallback, useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import type { ResourcePlacement, ListFilters, PageResult } from '@shared/types';
import { api } from '../api/client';
import type { SheetMode } from './BasicInfoSheet/values';
import { initialFilters } from './filters/filters';
import { useResourceActions } from './actions/useResourceActions';

/** 管理列表查询、分页、弹层与资源位操作。 */
export function useResourceList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<PageResult<ResourcePlacement>>({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10
  });
  const [sheet, setSheet] = useState<{
    mode: SheetMode;
    record?: ResourcePlacement;
  }>();
  const [logId, setLogId] = useState<number>();
  /** 增加刷新标记以重新请求当前页。 */
  const loadData = useCallback(() => setRefresh(
    /* 在上次标记基础上递增，确保每次刷新生效。 */
    (value) => value + 1), []);
  const { publishingId, publish, toggle, remove } =
    useResourceActions(loadData);

  /** 应用新筛选条件并回到第一页。 */
  const search = (values: ListFilters) => {
    setPage(1);
    setFilters(values);
  };

  /** 更新分页，切换每页条数时回到第一页。 */
  const changePage = (nextPage: number, nextPageSize: number) => {
    setPage(nextPageSize === pageSize ? nextPage : 1);
    setPageSize(nextPageSize);
  };

  useEffect(
    /* 按当前筛选和分页加载数据，并隔离失效请求的状态回写。 */
    () => {
      let active = true;
      setLoading(true);
      api
        .list({ ...filters, page, pageSize })
        .then(
          /* 仅在本轮请求仍有效时应用列表结果。 */
          (v) => {
            if (active) setData(v);
          })
        .catch(
          /* 仅在本轮请求仍有效时显示加载错误。 */
          (e) => {
            if (active) Toast.error(`加载数据失败: ${e.message}`);
          })
        .finally(
          /* 仅在本轮请求仍有效时结束加载状态。 */
          () => {
            if (active) setLoading(false);
          });
      /* 使本轮请求失效，避免旧结果覆盖新页面状态。 */
      return () => {
        active = false;
      };
    }, [filters, page, pageSize, refresh]);

  const openCreateSheet = () => setSheet({ mode: 'create' });

  const openSheet = (mode: SheetMode, record: ResourcePlacement) => setSheet({ mode, record });

  const closeSheet = () => setSheet(undefined);

  const configure = (id: number) => navigate(`/lowcode-editor/${id}`);

  const closeLogs = () => setLogId(undefined);

  const sheetKey = `${sheet?.mode}-${sheet?.record?.id || 'new'}`;

  return {
    data, page, pageSize, loading, sheet, sheetKey, logId, publishingId,
    search, changePage, publish, toggle, remove, loadData,
    openCreateSheet, openSheet, closeSheet, configure, openLogs: setLogId, closeLogs,
  };
}
