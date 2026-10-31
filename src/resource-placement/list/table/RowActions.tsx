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

/** 按资源环境、状态和子版本关系展示当前行允许的操作。 */
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
  const edit = () => onEdit('edit', r);

  const configure = () => onConfigure(r.id);

  const showLogs = () => onLogs(r.id);

  const publish = () => onPublish(r);

  const addChild = () => onEdit('child', r);

  const copy = () => onEdit('copy', r);

  const toggle = () => onToggle(r);

  const remove = () => onRemove(r);

  const canPublish = r.env !== 'online';
  const canAddChild = !r.parentResourceKey;
  const canRemove = !(r.env === 'online' && r.status === 1);
  const isPublishing = publishingId === r.id;
  const toggleType = r.status === 1 ? 'danger' : 'primary';
  const toggleLabel = r.status === 1 ? '禁用' : '启用';

  return (
    <div className={styles.actions}>
      <Button size="small" onClick={edit}>
        基础信息
      </Button>
      <Button size="small" onClick={configure}>
        表单配置
      </Button>
      <Button size="small" onClick={showLogs}>
        操作日志
      </Button>
      {canPublish && (
        <Button
          size="small"
          type="primary"
          loading={isPublishing}
          onClick={publish}
        >
          发布上线
        </Button>
      )}
      {canAddChild && (
        <Button size="small" onClick={addChild}>
          添加子版本
        </Button>
      )}
      <Button size="small" onClick={copy}>
        复制
      </Button>
      <Button
        size="small"
        type={toggleType}
        onClick={toggle}
      >
        {toggleLabel}
      </Button>
      {canRemove && (
        <Button size="small" type="danger" onClick={remove}>
          删除
        </Button>
      )}
    </div>
  );
}
