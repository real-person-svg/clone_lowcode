import React, { useState } from 'react';
import { Checkbox, Modal, Toast } from '@douyinfe/semi-ui';
import type { ResourcePlacement } from '@shared/types';
import { api } from '../../api/client';

function PublishConfirmContent({
  record,
  onChange
}: {
  record: ResourcePlacement;
  onChange: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(true);
  return (
    <div>
      <p>
        是否确认将资源位「{record.resourceName}
        」发布到线上环境？确认后会使用该泳道的资源位配置，覆盖到 online
        环境的相同资源位
      </p>
      <Checkbox
        checked={checked}
        onChange={(e) => {
          const next = Boolean(e.target.checked);
          setChecked(next);
          onChange(next);
        }}
      >
        发布后自动删除对应泳道数据
      </Checkbox>
    </div>
  );
}
export function useResourceActions(loadData: () => void) {
  const [publishingId, setPublishingId] = useState<number>();
  const publishRequest = async (
    id: number,
    forcePublish: boolean,
    deleteAfterPublish: boolean
  ) => {
    setPublishingId(id);
    try {
      const result = await api.publish({
        id,
        forcePublish,
        deleteAfterPublish
      });
      if (result.message === 'CONFLICT') {
        Modal.confirm({
          title: '配置冲突提醒',
          content: (
            <div>
              <p>检测到线上环境的配置在您创建当前环境配置后有更新：</p>
              <p>
                • 线上配置最后更新时间：
                {new Date(result.data.onlineUpdateTime!).toLocaleString()}
              </p>
              <p>
                • 当前环境配置创建时间：
                {new Date(result.data.sourceCreateTime!).toLocaleString()}
              </p>
              <p>继续发布将覆盖线上的最新配置，是否确认？</p>
            </div>
          ),
          onOk: () => publishRequest(id, true, deleteAfterPublish)
        });
        return;
      }
      Toast.success(result.message);
      loadData();
    } catch (e) {
      Toast.error(`发布失败: ${(e as Error).message}`);
      throw e;
    } finally {
      setPublishingId(undefined);
    }
  };
  const publish = (r: ResourcePlacement) => {
    let cleanup = true;
    Modal.confirm({
      title: '确认发布',
      content: (
        <PublishConfirmContent
          record={r}
          onChange={(v) => {
            cleanup = v;
          }}
        />
      ),
      onOk: () => publishRequest(r.id, false, cleanup)
    });
  };
  const toggle = (r: ResourcePlacement) => {
    const action = r.status === 1 ? '禁用' : '启用';
    Modal.confirm({
      title: `确认${action}`,
      content:
        r.status === 1
          ? '禁用后该环境不再提供此资源位配置，查询将尝试 online 环境的启用配置。'
          : '启用后，该环境可提供此资源位的表单配置。',
      onOk: async () => {
        try {
          await api.updateStatus({ id: r.id, status: r.status === 1 ? 0 : 1 });
          Toast.success(`${action}成功`);
          loadData();
        } catch (e) {
          Toast.error((e as Error).message);
          throw e;
        }
      }
    });
  };
  const remove = (r: ResourcePlacement) =>
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除资源位「${r.resourceName}」吗？`,
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await api.delete({ id: r.id });
          Toast.success('删除成功');
          loadData();
        } catch (e) {
          Toast.error(`删除失败: ${(e as Error).message}`);
          throw e;
        }
      }
    });
  return { publishingId, publish, toggle, remove };
}
