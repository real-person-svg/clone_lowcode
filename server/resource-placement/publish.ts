import type { ResourcePlacement, PublishResult } from '../../shared/types';
import type { ResourceRepository } from './repository';
import { ServiceError } from '../errors';
import { getUpdateMetadata } from './metadata';

/** 检测线上覆盖冲突并发布配置，事务由调用方负责。 */
export function publishResource(
  repository: ResourceRepository,
  source: ResourcePlacement,
  forcePublish: boolean,
  deleteAfterPublish: boolean,
  now: () => string,
  operator: string
): PublishResult {
  const id = source.id;
  if (source.env === 'online') {
    throw new ServiceError('ONLINE_PUBLISH', '线上环境资源位不能发布');
  }

  const online = repository.identity(source.bizId, source.resourceKey, 'online');
  const hasConflict = online && !forcePublish && online.updatedAt > source.createdAt;

  // 冲突确认前不取时、不写入线上数据及操作日志。
  if (hasConflict) {
    const data = {
      sourceId: id,
      onlineUpdateTime: online.updatedAt,
      sourceCreateTime: source.createdAt
    };

    return { success: false, message: 'CONFLICT', data };
  }

  const time = now();
  let published: ResourcePlacement;

  if (online) {
    const metadata = getUpdateMetadata(online, time, operator);
    const updatedResource = {
      ...source,
      id: online.id,
      env: 'online',
      creator: online.creator,
      createdAt: online.createdAt,
      ...metadata
    };

    published = repository.save(updatedResource);
  } else {
    const newResource = {
      ...source,
      env: 'online',
      creator: operator,
      createdAt: time,
      updater: operator,
      updatedAt: time,
      revision: 1
    };

    published = repository.insert(newResource);
  }

  repository.log('PUBLISH', online, published, published.id, time, operator);

  // 来源软删除与线上写入共用调用方事务及本次时间戳。
  if (deleteAfterPublish) {
    const metadata = getUpdateMetadata(source, time, operator);
    const deletedResource = { ...source, status: 2 as const, ...metadata };
    repository.save(deletedResource);

    repository.log('DELETE', source, undefined, source.id, time, operator);
  }

  const message = online ? '发布成功，已更新线上资源位' : '发布成功，已创建线上资源位';
  const action = online ? 'updated' : 'created';
  const data = { id: published.id, action };

  return { success: true, message, data };
}
