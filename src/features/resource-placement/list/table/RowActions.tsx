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
  return (
    <div className={styles.actions}>
      <Button size="small" onClick={/* 打开当前资源位的基础信息编辑侧栏。 */ () => onEdit('edit', r)}>
        基础信息
      </Button>
      <Button size="small" onClick={/* 进入当前资源位的表单配置页。 */ () => onConfigure(r.id)}>
        表单配置
      </Button>
      <Button size="small" onClick={/* 打开当前资源位操作日志。 */ () => onLogs(r.id)}>
        操作日志
      </Button>
      {r.env !== 'online' && (
        <Button
          size="small"
          type="primary"
          loading={publishingId === r.id}
          onClick={/* 发起当前泳道资源位的发布确认。 */ () => onPublish(r)}
        >
          发布上线
        </Button>
      )}
      {!r.parentResourceKey && (
        <Button size="small" onClick={/* 打开当前资源位的子版本创建侧栏。 */ () => onEdit('child', r)}>
          添加子版本
        </Button>
      )}
      <Button size="small" onClick={/* 打开以当前资源位为来源的复制侧栏。 */ () => onEdit('copy', r)}>
        复制
      </Button>
      <Button
        size="small"
        type={r.status === 1 ? 'danger' : 'primary'}
        onClick={/* 发起当前资源位启用或禁用确认。 */ () => onToggle(r)}
      >
        {r.status === 1 ? '禁用' : '启用'}
      </Button>
      {!(r.env === 'online' && r.status === 1) && (
        <Button size="small" type="danger" onClick={/* 发起当前资源位删除确认。 */ () => onRemove(r)}>
          删除
        </Button>
      )}
    </div>
  );
}
