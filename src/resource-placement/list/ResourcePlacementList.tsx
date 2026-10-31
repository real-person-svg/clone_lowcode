import React from 'react';
import Header from './Header';
import BasicInfoSheet from './BasicInfoSheet';
import OperationLogModal from './operation-logs';
import ResourceFilters from './filters/ResourceFilters';
import ResourceTable from './table/ResourceTable';
import { useResourceList } from './useResourceList';
import styles from './style.module.scss';

/** 组合资源位列表、筛选、基础信息及操作历史。 */
export default function ResourcePlacementList() {
  const {
    data, page, pageSize, loading, sheet, sheetKey, logId, publishingId,
    search, changePage, publish, toggle, remove, loadData,
    openCreateSheet, openSheet, closeSheet, configure, openLogs, closeLogs,
  } = useResourceList();

  return (
    <div className={styles.resourcePlacementList}>
      <Header
        className={styles.header}
        title="资源位列表"
        operateLabel="新建资源位"
        operateClick={openCreateSheet}
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
          onEdit={openSheet}
          onConfigure={configure}
          onLogs={openLogs}
          onPublish={publish}
          onToggle={toggle}
          onRemove={remove}
        />
      </div>
      {sheet && (
        <BasicInfoSheet
          key={sheetKey}
          {...sheet}
          onClose={closeSheet}
          onSaved={loadData}
        />
      )}
      {logId !== undefined && (
        <OperationLogModal
          resourceId={logId}
          onClose={closeLogs}
          loadData={loadData}
        />
      )}
    </div>
  );
}
