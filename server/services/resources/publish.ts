import type { ResourcePlacement } from '../../../shared/types';
import type { ResourceRepository } from '../../repositories/resources';
import { ServiceError } from '../../errors';
import { getUpdateMetadata } from './metadata';

// The caller owns the transaction that also protects source cleanup and logs.
export function publishResource(
  repository: ResourceRepository,
  source: ResourcePlacement,
  forcePublish: boolean,
  deleteAfterPublish: boolean,
  now: () => string,
  operator: string
) {
  const id = source.id;
  if (source.env === 'online') throw new ServiceError('ONLINE_PUBLISH', '线上环境资源位不能发布');

  const online = repository.identity(
    source.bizId,
    source.resourceKey,
    'online'
  );

  if (online && !forcePublish && online.updatedAt > source.createdAt) {
    return {
      success: false,
      message: 'CONFLICT',
      data: {
        sourceId: id,
        onlineUpdateTime: online.updatedAt,
        sourceCreateTime: source.createdAt
      }
    };
  }

  const time = now();
  const next = online
    ? repository.save({
        ...source,
        id: online.id,
        env: 'online',
        creator: online.creator,
        createdAt: online.createdAt,
        ...getUpdateMetadata(online, time, operator)
      })
    : repository.insert({
        ...source,
        env: 'online',
        creator: operator,
        createdAt: time,
        updater: operator,
        updatedAt: time,
        revision: 1
      });

  repository.log(
    'PUBLISH',
    online,
    next,
    next.id,
    time,
    operator
  );

  if (deleteAfterPublish) {
    repository.save({
      ...source,
      status: 2,
      ...getUpdateMetadata(source, time, operator)
    });
    repository.log(
      'DELETE',
      source,
      undefined,
      source.id,
      time,
      operator
    );
  }

  return {
    success: true,
    message: online ? '发布成功，已更新线上资源位' : '发布成功，已创建线上资源位',
    data: { id: next.id, action: online ? 'updated' : 'created' }
  };
}
