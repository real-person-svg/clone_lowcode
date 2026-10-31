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
  constructor(message: string, public code: string, public details?: unknown) {
    super(message);
  }
}
export async function request<T>(action: string, data: unknown): Promise<T> {
  const response = await fetch(`/api/resourcePlacementLowCode/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(
      body.error?.message || '请求失败',
      body.error?.code || 'REQUEST_FAILED',
      body.error?.details
    );
  return body as T;
}
export const api = {
  list: (data: ListFilters) =>
    request<PageResult<ResourcePlacement>>('list', data),
  detail: (data: { id: number }) => request<ResourcePlacement>('detail', data),
  create: (data: ResourceInput) => request<ResourcePlacement>('create', data),
  update: (data: Partial<ResourceInput> & { id: number; revision?: number }) =>
    request<ResourcePlacement>('update', data),
  delete: (data: { id: number }) =>
    request<{ success: boolean }>('delete', data),
  updateStatus: (data: { id: number; status: 0 | 1 }) =>
    request<ResourcePlacement>('updateStatus', data),
  publish: (data: {
    id: number;
    forcePublish?: boolean;
    deleteAfterPublish?: boolean;
  }) => request<PublishResult>('publish', data),
  getOperationLogs: (data: {
    resourcePlacementId: number;
    page?: number;
    pageSize?: number;
  }) => request<PageResult<OperationLog>>('getOperationLogs', data),
  roll: (data: { resourcePlacementId: number; versionId: number }) =>
    request<ResourcePlacement>('roll', data),
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
