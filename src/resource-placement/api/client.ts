import type {
  Asset,
  ListFilters,
  OperationLog,
  PageResult,
  PublishResult,
  ResourceInput,
  ResourcePlacement
} from '@shared/types';
export class ApiError extends Error {
  /** 封装服务端业务错误及附加详情。 */
  constructor(message: string, public code: string, public details?: unknown) {
    super(message);
  }
}

/** 以统一 JSON POST 协议请求资源位 API，并转换错误响应。 */
export async function request<T>(action: string, data: unknown): Promise<T> {
  const response = await fetch(`/api/resourcePlacementLowCode/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(
      body.error?.message || '请求失败',
      body.error?.code || 'REQUEST_FAILED',
      body.error?.details
    );
  }
  return body as T;
}

export const api = {
  /* 请求分页资源位列表。 */
  list: (data: ListFilters) =>
    request<PageResult<ResourcePlacement>>('list', data),
  /* 请求指定资源位详情。 */
  detail: (data: { id: number }) => request<ResourcePlacement>('detail', data),
  /* 提交新建资源位数据。 */
  create: (data: ResourceInput) => request<ResourcePlacement>('create', data),
  /* 提交资源位局部更新及可选修订号。 */
  update: (data: Partial<ResourceInput> & { id: number; revision?: number }) =>
    request<ResourcePlacement>('update', data),
  /* 请求软删除指定资源位。 */
  delete: (data: { id: number }) =>
    request<{ success: boolean }>('delete', data),
  /* 请求切换指定资源位的启禁用状态。 */
  updateStatus: (data: { id: number; status: 0 | 1 }) =>
    request<ResourcePlacement>('updateStatus', data),
  /* 请求发布泳道资源位及可选的覆盖、清理策略。 */
  publish: (data: {
    id: number;
    forcePublish?: boolean;
    deleteAfterPublish?: boolean;
  }) => request<PublishResult>('publish', data),
  /* 请求指定资源位的分页操作日志。 */
  getOperationLogs: (data: {
    resourcePlacementId: number;
    page?: number;
    pageSize?: number;
  }) => request<PageResult<OperationLog>>('getOperationLogs', data),
  /* 请求恢复指定操作版本的快照。 */
  roll: (data: { resourcePlacementId: number; versionId: number }) =>
    request<ResourcePlacement>('roll', data),
  /* 按业务线、Key 和环境请求可用资源位配置。 */
  getResourceConfig: (data: {
    resourceKey: string;
    bizId: number;
    env: string;
  }) =>
    request<{ configured: boolean; resource?: ResourcePlacement }>(
      'getResourceConfig',
      data
    )
};

/** 以 multipart 表单上传资源文件，并返回文件元数据。 */
export async function uploadAsset(file: File): Promise<Asset> {
  const data = new FormData();
  data.append('file', file);
  const response = await fetch('/api/assets/upload', {
    method: 'POST',
    body: data
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || '上传失败');
  return body;
}
