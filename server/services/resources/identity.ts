import type { ResourceRepository } from '../../repositories/resources';
import { ServiceError } from '../../errors';

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

  if (existing && existing.id !== ignoreId){
    throw new ServiceError('DUPLICATE', '该业务线、环境下已存在相同的资源位 Key', 409);
  }
}
