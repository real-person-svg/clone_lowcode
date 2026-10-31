import React, { useCallback, useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import type { ResourcePlacement, ListFilters, PageResult } from '@shared/types';
import { api } from '../api/client';
import BasicInfoSheet, { type SheetMode } from './BasicInfoSheet';
import OperationLogModal from './operation-logs';
import ResourceFilters, { initialFilters } from './filters/ResourceFilters';
import ResourceTable from './table/ResourceTable';
import { useResourceActions } from './actions/useResourceActions';
import styles from './style.module.scss';

/** 协调资源位筛选、分页、行操作、基础信息侧栏和日志弹窗。 */
export default function ResourcePlacementList() {
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
  const loadData = useCallback(() => setRefresh(/* 在上次标记基础上递增，确保每次刷新生效。 */ (value) => value + 1), []);
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
  useEffect(/* 按当前筛选和分页加载数据，并隔离失效请求的状态回写。 */ () => {
    let active = true;
    setLoading(true);
    api
      .list({ ...filters, page, pageSize })
      .then(/* 仅在本轮请求仍有效时应用列表结果。 */ (v) => {
        if (active) setData(v);
      })
      .catch(/* 仅在本轮请求仍有效时显示加载错误。 */ (e) => {
        if (active) Toast.error(`加载数据失败: ${e.message}`);
      })
      .finally(/* 仅在本轮请求仍有效时结束加载状态。 */ () => {
        if (active) setLoading(false);
      });
    return /* 使本轮请求失效，避免旧结果覆盖新页面状态。 */ () => {
      active = false;
    };
  }, [filters, page, pageSize, refresh]);
  return (
    <div className={styles.resourcePlacementList}>
      <Header
        className={styles.header}
        title="资源位列表"
        operateLabel="新建资源位"
        operateClick={/* 打开新建资源位侧栏。 */ () => setSheet({ mode: 'create' })}
      />
      <div className={styles.content}>
        <ResourceFilters loading={loading} onSearch={search} />
        <ResourceTable
          data={data}
          page={page}
          pageSize={pageSize}
          loading={loading}
          onPageChange={changePage}
          publishingId={publishingId}
          onEdit={/* 按指定模式打开当前行的基础信息侧栏。 */ (mode, record) => setSheet({ mode, record })}
          onConfigure={/* 跳转到当前资源位的低码编辑器。 */ (id) => navigate(`/lowcode-editor/${id}`)}
          onLogs={setLogId}
          onPublish={publish}
          onToggle={toggle}
          onRemove={remove}
        />
      </div>
      {sheet && (
        <BasicInfoSheet
          key={`${sheet.mode}-${sheet.record?.id || 'new'}`}
          {...sheet}
          onClose={/* 关闭基础信息侧栏。 */ () => setSheet(undefined)}
          onSaved={loadData}
        />
      )}
      {logId !== undefined && (
        <OperationLogModal
          resourceId={logId}
          onClose={/* 关闭操作日志弹窗。 */ () => setLogId(undefined)}
          loadData={loadData}
        />
      )}
    </div>
  );
}
