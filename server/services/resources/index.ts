import type {
  ResourceInput,
  ResourcePlacement,
  ListFilters
} from '../../../shared/types';
import { ResourceRepository } from '../../repositories/resources';
import { ServiceError } from '../../errors';
import { validateResource } from './validation';
import { ensureUniqueResource } from './identity';
import { publishResource } from './publish';
import { getUpdateMetadata } from './metadata';

export class ResourceService {
  /** 注入资源仓库、时钟和操作人，供业务写入及审计使用。 */
  constructor(
    public repository: ResourceRepository,
    private now = /* 默认以当前 UTC 时间生成审计时间戳。 */ () => new Date().toISOString(),
    private operator = 'local'
  ) {}

  /** 读取资源位详情，默认将软删除记录视为不存在。 */
  detail(id: number, includeDeleted = false) {
    const value = this.repository.find(id);
    if (!value || (!includeDeleted && value.status === 2)) throw new ServiceError('NOT_FOUND', '资源位不存在', 404);
    return value;
  }

  /** 按筛选与分页条件读取资源位列表。 */
  list(filters: ListFilters) {
    return this.repository.list(filters);
  }

  /** 校验并创建资源位，同时记录创建快照。 */
  create(input: ResourceInput) {
    return this.repository.db.transaction(/* 在同一事务内校验子版本关系、插入记录并写入日志。 */ () => {
      const data = validateResource(input);
      ensureUniqueResource(this.repository, data);

      // 子版本只能基于非子版本父资源创建，Key 由父 Key 与版本组成，初始配置独立置空。
      if (data.parentResourceKey) {
        const parent = this.repository.parent(
          data.bizId,
          data.parentResourceKey
        );

        if (!parent || parent.parentResourceKey){
          throw new ServiceError('INVALID_PARENT', '只能为已有的非子版本资源位添加子版本');
        }

        if (!data.version?.match(/^[A-Za-z0-9_-]+$/) || data.resourceKey !== `${parent.resourceKey}_${data.version}`){
          throw new ServiceError('INVALID_CHILD', '子版本 Key 必须由父资源位 Key 与版本生成');
        }

        data.configData = '{"content":[]}';
      }

      const time = this.now();
      const resource = this.repository.insert({
        description: '',
        exampleImage: null,
        pageFrom: null,
        showFrequencyControl: 0,
        showReco: 0,
        abExperimentOptionEnabled: 0,
        parentResourceKey: null,
        version: null,
        versionAlias: null,
        versionLimit: null,
        configData: '{"content":[]}',
        extra: null,
        ...data,
        status: 1,
        creator: this.operator,
        updater: this.operator,
        createdAt: time,
        updatedAt: time,
        revision: 1
      });

      this.repository.log(
        'CREATE',
        undefined,
        resource,
        resource.id,
        time,
        this.operator
      );

      return resource;
    })();
  }

  /** 校验修订号及不可变身份字段，保存修改并记录快照。 */
  update(id: number, input: Partial<ResourceInput>) {
    return this.repository.db.transaction(/* 将冲突检查、资源更新和操作日志合并为一次原子写入。 */ () => {
      const old = this.detail(id);
      // 仅在调用方提供修订号时检测旧页面覆盖，未传修订号的调用仍沿用既有更新契约。
      if (input.revision !== undefined && input.revision !== old.revision){
        throw new ServiceError('REVISION_CONFLICT', '资源位已被修改，请刷新后重试', 409);
      }

      const data = validateResource({ ...old, ...input });

      // Key 和业务线不可变，线上记录也不能迁出 online；泳道记录仍可更换环境。
      if (
        data.resourceKey !== old.resourceKey ||
        data.bizId !== old.bizId ||
        (old.env === 'online' && data.env !== old.env)
      ){
        throw new ServiceError('IMMUTABLE_IDENTITY', '资源位 Key、业务线及线上环境不可修改');
      }

      if (
        data.parentResourceKey !== old.parentResourceKey ||
        data.version !== old.version
      ){
        throw new ServiceError('IMMUTABLE_IDENTITY', '子版本关系不可修改');
      }

      ensureUniqueResource(this.repository, data, id);
      const time = this.now();
      const next = this.repository.save({
        ...old,
        ...data,
        ...getUpdateMetadata(old, time, this.operator)
      });

      this.repository.log('UPDATE', old, next, id, time, this.operator);
      return next;
    })();
  }

  /** 切换资源位启禁用状态并更新审计信息。 */
  updateStatus(id: number, status: 0 | 1) {
    return this.repository.db.transaction(/* 在同一事务内更新状态和记录对应启禁用日志。 */ () => {
      const old = this.detail(id)
      const time = this.now();

      const next = this.repository.save({
        ...old,
        status,
        ...getUpdateMetadata(old, time, this.operator)
      });

      this.repository.log(
        status === 1 ? 'ENABLE' : 'UNABLE',
        old,
        next,
        id,
        time,
        this.operator
      );

      return next;
    })();
  }

  /** 软删除资源位，禁止删除线上启用中的记录。 */
  delete(id: number) {
    return this.repository.db.transaction(/* 将删除标记与删除日志一起持久化。 */ () => {
      const old = this.detail(id);
      if (old.env === 'online' && old.status === 1){
        throw new ServiceError('ONLINE_ENABLED', '线上启用中的资源位不能删除');
      }

      const time = this.now();
      this.repository.save({
        ...old,
        status: 2,
        ...getUpdateMetadata(old, time, this.operator)
      });

      this.repository.log('DELETE', old, undefined, id, time, this.operator);
      return { success: true };
    })();
  }

  /** 将泳道配置发布到线上，按选项清理来源并记录日志。 */
  publish(id: number, forcePublish = false, deleteAfterPublish = true) {
    return this.repository.db.transaction(/* 用同一事务保护线上写入、来源清理和全部发布日志。 */ () =>
      publishResource(
        this.repository,
        this.detail(id),
        forcePublish,
        deleteAfterPublish,
        /** 向发布逻辑提供当前注入的时钟。 */
        () => this.now(),
        this.operator
      )
    )();
  }

  /** 确认资源位存在后读取操作历史，允许已删除资源位查询。 */
  logs(id: number, page?: number, pageSize?: number) {
    this.detail(id, true);
    return this.repository.logs(id, page, pageSize);
  }

  /** 校验历史快照并恢复其业务数据，保留当前记录的创建信息。 */
  roll(id: number, versionId: number) {
    return this.repository.db.transaction(/* 在同一事务内验证快照、恢复记录并写入回滚日志。 */ () => {
      const old = this.detail(id, true)
      const operation = this.repository.operation(id, versionId);

      if (!operation?.newConfig){
        throw new ServiceError('INVALID_SNAPSHOT', '该操作没有可恢复的操作后快照');
      }
      
      // 回滚只接受该资源的操作后快照，重新执行当前结构校验和身份唯一性检查。
      const snapshot = JSON.parse(operation.newConfig) as ResourcePlacement;
      if (snapshot.id !== id){
        throw new ServiceError('INVALID_SNAPSHOT', '操作快照与资源位不匹配');
      }
      const data = validateResource(snapshot);
      ensureUniqueResource(this.repository, data, id);

      const time = this.now();
      const next = this.repository.save({
        ...old,
        ...data,
        status: snapshot.status,
        // 恢复业务内容和状态，但保留当前记录的创建身份，并递增当前修订号。
        creator: old.creator,
        createdAt: old.createdAt,
        ...getUpdateMetadata(old, time, this.operator)
      });

      this.repository.log('ROLL', old, next, id, time, this.operator);
      return next;
    })();
  }

  /** 优先返回当前环境的启用配置，再回退到线上启用配置。 */
  getResourceConfig(bizId: number, key: string, env: string) {
    const candidates = [
      this.repository.identity(bizId, key, env),
      this.repository.identity(bizId, key, 'online')
    ];
    
    const resource = candidates.find(/* 从按环境优先级排列的候选中选出首个启用记录。 */ (r) => r?.status === 1);
    return resource ? { configured: true, resource } : { configured: false };
  }
}
