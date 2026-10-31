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
  const loadData = useCallback(() => setRefresh((value) => value + 1), []);
  const { publishingId, publish, toggle, remove } =
    useResourceActions(loadData);
  const search = (values: ListFilters) => {
    setPage(1);
    setFilters(values);
  };
  const changePage = (nextPage: number, nextPageSize: number) => {
    setPage(nextPageSize === pageSize ? nextPage : 1);
    setPageSize(nextPageSize);
  };
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .list({ ...filters, page, pageSize })
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active) Toast.error(`加载数据失败: ${e.message}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, page, pageSize, refresh]);
  return (
    <div className={styles.resourcePlacementList}>
      <Header
        className={styles.header}
        title="资源位列表"
        operateLabel="新建资源位"
        operateClick={() => setSheet({ mode: 'create' })}
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
          onEdit={(mode, record) => setSheet({ mode, record })}
          onConfigure={(id) => navigate(`/lowcode-editor/${id}`)}
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
          onClose={() => setSheet(undefined)}
          onSaved={loadData}
        />
      )}
      {logId !== undefined && (
        <OperationLogModal
          resourceId={logId}
          onClose={() => setLogId(undefined)}
          loadData={loadData}
        />
      )}
    </div>
  );
}
