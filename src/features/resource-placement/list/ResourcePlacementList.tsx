import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  Modal,
  Space,
  Table,
  Toast,
  Typography
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { fieldLabel } from './FieldLabel';
import {
  appList,
  type ResourcePlacement,
  type ListFilters,
  type PageResult
} from '@shared/types';
import { api } from '../api/client';
import BasicInfoSheet, { type SheetMode } from './BasicInfoSheet';
import OperationLogModal from './OperationLogModal';
import styles from './style.module.scss';
import filtersStyles from './FilterSearch.module.scss';
import tableStyles from './SimpleTable.module.scss';
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
const initialFilters: ListFilters = {
  resourceKey: '',
  resourceName: '',
  env: '',
  bizId: appList.map((a) => a.value),
  creator: ''
};
export default function ResourcePlacementList() {
  const navigate = useNavigate(),
    form = useRef<FormApi<ListFilters>>();
  const [filters, setFilters] = useState<ListFilters>(initialFilters),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [loading, setLoading] = useState(false),
    [refresh, setRefresh] = useState(0),
    [data, setData] = useState<PageResult<ResourcePlacement>>({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    }),
    [sheet, setSheet] = useState<{
      mode: SheetMode;
      record?: ResourcePlacement;
    }>(),
    [logId, setLogId] = useState<number>(),
    [publishingId, setPublishingId] = useState<number>();
  const loadData = useCallback(() => setRefresh((v) => v + 1), []);
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
  const columns = [
    {
      title: '资源位名称',
      dataIndex: 'resourceName',
      width: 200,
      fixed: 'left' as const
    },
    { title: '资源位Id', dataIndex: 'id', width: 100, fixed: 'left' as const },
    { title: '资源位Key', dataIndex: 'resourceKey', width: 200 },
    { title: '泳道环境', dataIndex: 'env', width: 150 },
    {
      title: '业务线',
      dataIndex: 'bizId',
      width: 120,
      render: (v: number) => appList.find((a) => a.value === v)?.label || '-'
    },
    { title: '二级目录名称', dataIndex: 'directoryPath', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (
        <Typography.Text type={v === 1 ? 'success' : 'quaternary'}>
          {v === 1 ? '启用中' : '已禁用'}
        </Typography.Text>
      )
    },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 200,
      render: (v: string) => new Date(v).toLocaleString()
    },
    { title: '数据来源', dataIndex: 'from', width: 100 },
    {
      title: '操作',
      width: 320,
      fixed: 'right' as const,
      render: (_v: unknown, r: ResourcePlacement) => (
        <Space className={styles['table-operate-columns']}>
          <Button
            size="small"
            onClick={() => setSheet({ mode: 'edit', record: r })}
          >
            基础信息
          </Button>
          <Button
            size="small"
            onClick={() => navigate(`/lowcode-editor/${r.id}`)}
          >
            表单配置
          </Button>
          <Button size="small" onClick={() => setLogId(r.id)}>
            操作日志
          </Button>
          {r.env !== 'online' && (
            <Button
              size="small"
              type="primary"
              loading={publishingId === r.id}
              onClick={() => publish(r)}
            >
              发布上线
            </Button>
          )}
          {!r.parentResourceKey && (
            <Button
              size="small"
              onClick={() => setSheet({ mode: 'child', record: r })}
            >
              添加子版本
            </Button>
          )}
          <Button
            size="small"
            onClick={() => setSheet({ mode: 'copy', record: r })}
          >
            复制
          </Button>
          <Button
            size="small"
            type={r.status === 1 ? 'danger' : 'primary'}
            onClick={() => toggle(r)}
          >
            {r.status === 1 ? '禁用' : '启用'}
          </Button>
          {!(r.env === 'online' && r.status === 1) && (
            <Button size="small" type="danger" onClick={() => remove(r)}>
              删除
            </Button>
          )}
        </Space>
      )
    }
  ];
  return (
    <div className={styles.resourcePlacementList}>
      <Header
        title="资源位列表"
        operateLabel="新建资源位"
        operateClick={() => setSheet({ mode: 'create' })}
      />
      <div className={styles.content}>
        <div className={filtersStyles.filter_search_wrapper}>
          <Form<ListFilters>
            initValues={initialFilters}
            getFormApi={(value) => {
              form.current = value;
            }}
            onSubmit={(values) => {
              setPage(1);
              setFilters(values as ListFilters);
            }}
            labelPosition="top"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 110 }}>
              <Form.Input
                field="resourceKey"
                label={fieldLabel('资源位Key')}
                placeholder="请输入资源位Key"
                fieldStyle={{ width: 250 }}
              />
              <Form.Input
                field="resourceName"
                label={fieldLabel('资源位名称')}
                placeholder="请输入资源位名称"
                fieldStyle={{ width: 250 }}
              />
              <Form.Input
                field="env"
                label={fieldLabel('环境')}
                placeholder="请输入泳道名称"
                fieldStyle={{ width: 250 }}
              />
              <Form.Select
                field="bizId"
                label={fieldLabel('业务线')}
                optionList={appList}
                multiple
                placeholder="请选择业务线"
                style={{ width: '100%' }}
                fieldStyle={{ width: 250 }}
              />
              <Form.Input
                field="creator"
                label={fieldLabel('创建人')}
                placeholder="请输入创建人"
                fieldStyle={{ width: 250 }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 30,
                paddingTop: 5
              }}
            >
              <Button
                style={{ width: 100, borderRadius: 5 }}
                onClick={() => {
                  form.current?.setValues(initialFilters);
                  setPage(1);
                  setFilters(initialFilters);
                }}
              >
                重置
              </Button>
              <Button
                theme="solid"
                htmlType="submit"
                loading={loading}
                style={{ width: 100, borderRadius: 5 }}
              >
                查询
              </Button>
            </div>
          </Form>
        </div>
        <div className={tableStyles.simple_table_wrapper}>
          <div className={tableStyles.simple_table_header}>
            <div className={tableStyles.title}>资源位列表</div>
          </div>
          <Table
            className={tableStyles.simple_table_content}
            rowKey="id"
            columns={columns}
            dataSource={data.list}
            scroll={{ x: 1800 }}
            loading={loading}
            pagination={{
              currentPage: page,
              pageSize,
              total: data.total,
              showSizeChanger: true,
              showQuickJumper: false,
              onChange: (p, size) => {
                setPage(size === pageSize ? p : 1);
                setPageSize(size);
              }
            }}
          />
        </div>
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
