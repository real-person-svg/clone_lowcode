import type { ResourceRepository } from './repository';
import { ServiceError } from '../errors';

/** 检查业务线、环境和 Key 的唯一性，更新时可排除自身。 */
export function ensureUniqueResource(
  repository: ResourceRepository,
  data: { bizId: number; resourceKey: string; env: string },
  ignoreId?: number
) {
  const existing = repository.identity(
    data.bizId,
    data.resourceKey,
    data.env
  );

  if (existing && existing.id !== ignoreId) {
    throw new ServiceError('DUPLICATE', '该业务线、环境下已存在相同的资源位 Key', 409);
  }
}
