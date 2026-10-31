import type { ResourcePlacement } from '../../../shared/types';

/** 生成本次更新的审计字段，并在当前修订号基础上递增。 */
export function getUpdateMetadata(
  current: Pick<ResourcePlacement, 'revision'>,
  time: string,
  operator: string
) {
  // 修订号属于当前数据库记录，不能从历史快照或发布来源继承旧的修订序列。
  // 调用方在校验通过后取时，同一次发布事务可复用该时间。
  return {
    updatedAt: time,
    updater: operator,
    revision: current.revision + 1
  };
}
