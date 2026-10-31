import type { ResourcePlacement } from '../../../shared/types';
import type { ResourceRepository } from '../../repositories/resources';
import { ServiceError } from '../../errors';
import { getUpdateMetadata } from './metadata';

/** 检测线上覆盖冲突并发布配置，按选项软删除来源；事务由调用方负责。 */
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

  // 线上更新晚于泳道创建表示可能覆盖后续修改，先返回冲突；强制发布时跳过此确认。
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
  // 覆盖时沿用线上记录的 ID、创建信息和修订序列；首次上线则建立新记录。
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

  // 来源清理采用软删除，并与线上写入、发布日志共用调用方事务和本次时间戳。
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
