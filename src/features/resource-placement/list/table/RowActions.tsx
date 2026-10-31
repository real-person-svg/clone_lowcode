import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import type { ResourcePlacement } from '@shared/types';
import type { SheetMode } from '../BasicInfoSheet';
import styles from './style.module.scss';

export interface RowActionHandlers {
  publishingId?: number;
  onEdit: (mode: SheetMode, record: ResourcePlacement) => void;
  onConfigure: (id: number) => void;
  onLogs: (id: number) => void;
  onPublish: (record: ResourcePlacement) => void;
  onToggle: (record: ResourcePlacement) => void;
  onRemove: (record: ResourcePlacement) => void;
}

export default function RowActions({
  record: r,
  publishingId,
  onEdit,
  onConfigure,
  onLogs,
  onPublish,
  onToggle,
  onRemove
}: RowActionHandlers & { record: ResourcePlacement }) {
  return (
    <div className={styles.actions}>
      <Button size="small" onClick={() => onEdit('edit', r)}>
        基础信息
      </Button>
      <Button size="small" onClick={() => onConfigure(r.id)}>
        表单配置
      </Button>
      <Button size="small" onClick={() => onLogs(r.id)}>
        操作日志
      </Button>
      {r.env !== 'online' && (
        <Button
          size="small"
          type="primary"
          loading={publishingId === r.id}
          onClick={() => onPublish(r)}
        >
          发布上线
        </Button>
      )}
      {!r.parentResourceKey && (
        <Button size="small" onClick={() => onEdit('child', r)}>
          添加子版本
        </Button>
      )}
      <Button size="small" onClick={() => onEdit('copy', r)}>
        复制
      </Button>
      <Button
        size="small"
        type={r.status === 1 ? 'danger' : 'primary'}
        onClick={() => onToggle(r)}
      >
        {r.status === 1 ? '禁用' : '启用'}
      </Button>
      {!(r.env === 'online' && r.status === 1) && (
        <Button size="small" type="danger" onClick={() => onRemove(r)}>
          删除
        </Button>
      )}
    </div>
  );
}
