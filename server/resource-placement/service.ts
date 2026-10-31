import type {
  ResourceInput,
  ResourcePlacement,
  ListFilters
} from '../../shared/types';
import { ResourceRepository } from './repository';
import { ServiceError } from '../errors';
import { validateResource } from './validation';
import { ensureUniqueResource } from './identity';
import { publishResource } from './publish';
import { getUpdateMetadata } from './metadata';

export class ResourceService {
  /** 注入资源仓库、时钟和操作人，供业务写入及审计使用。 */
  constructor(
    public repository: ResourceRepository,
    private now = () => new Date().toISOString(),
    private operator = 'local'
  ) {}

  /** 读取资源位详情，默认将软删除记录视为不存在。 */
  detail(id: number, includeDeleted = false) {
    const resource = this.repository.find(id);
    const hiddenDeletedResource = !includeDeleted && resource?.status === 2;

    if (!resource || hiddenDeletedResource) {
      throw new ServiceError('NOT_FOUND', '资源位不存在', 404);
    }

    return resource;
  }

  /** 按筛选与分页条件读取资源位列表。 */
  list(filters: ListFilters) {
    return this.repository.list(filters);
  }

  /** 校验并创建资源位，同时记录创建快照。 */
  create(input: ResourceInput) {
    const createResource = this.repository.db.transaction(() => {
      const data = validateResource(input);
      ensureUniqueResource(this.repository, data);

      // 子版本基于非子版本资源创建，并以空配置开始。
      if (data.parentResourceKey) {
        const parent = this.repository.parent(data.bizId, data.parentResourceKey);

        if (!parent || parent.parentResourceKey) {
          throw new ServiceError('INVALID_PARENT', '只能为已有的非子版本资源位添加子版本');
        }

        const validVersion = Boolean(data.version?.match(/^[A-Za-z0-9_-]+$/));
        const expectedKey = `${parent.resourceKey}_${data.version}`;
        const invalidChild = !validVersion || data.resourceKey !== expectedKey;

        if (invalidChild) {
          throw new ServiceError('INVALID_CHILD', '子版本 Key 必须由父资源位 Key 与版本生成');
        }

        data.configData = '{"content":[]}';
      }

      const time = this.now();
      const newResource = {
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
        status: 1 as const,
        creator: this.operator,
        updater: this.operator,
        createdAt: time,
        updatedAt: time,
        revision: 1
      };
      const resource = this.repository.insert(newResource);

      this.repository.log('CREATE', undefined, resource, resource.id, time, this.operator);

      return resource;
    });

    return createResource();
  }

  /** 校验修订号及不可变身份字段，保存修改并记录快照。 */
  update(id: number, input: Partial<ResourceInput>) {
    const updateResource = this.repository.db.transaction(() => {
      const current = this.detail(id);
      const revisionConflict = input.revision !== undefined && input.revision !== current.revision;

      // 未传修订号的调用继续沿用既有更新契约。
      if (revisionConflict) {
        throw new ServiceError('REVISION_CONFLICT', '资源位已被修改，请刷新后重试', 409);
      }

      const mergedInput = { ...current, ...input };
      const data = validateResource(mergedInput);
      const identityChanged = data.resourceKey !== current.resourceKey || data.bizId !== current.bizId;
      const onlineEnvironmentChanged = current.env === 'online' && data.env !== current.env;

      if (identityChanged || onlineEnvironmentChanged) {
        throw new ServiceError('IMMUTABLE_IDENTITY', '资源位 Key、业务线及线上环境不可修改');
      }

      const childIdentityChanged =
        data.parentResourceKey !== current.parentResourceKey || data.version !== current.version;

      if (childIdentityChanged) {
        throw new ServiceError('IMMUTABLE_IDENTITY', '子版本关系不可修改');
      }

      ensureUniqueResource(this.repository, data, id);

      const time = this.now();
      const metadata = getUpdateMetadata(current, time, this.operator);
      const updatedResource = { ...current, ...data, ...metadata };
      const next = this.repository.save(updatedResource);

      this.repository.log('UPDATE', current, next, id, time, this.operator);

      return next;
    });

    return updateResource();
  }

  /** 切换资源位启禁用状态并更新审计信息。 */
  updateStatus(id: number, status: 0 | 1) {
    const updateResourceStatus = this.repository.db.transaction(() => {
      const current = this.detail(id);
      const time = this.now();
      const metadata = getUpdateMetadata(current, time, this.operator);
      const updatedResource = { ...current, status, ...metadata };
      const next = this.repository.save(updatedResource);

      const operation = status === 1 ? 'ENABLE' : 'UNABLE';
      this.repository.log(operation, current, next, id, time, this.operator);

      return next;
    });

    return updateResourceStatus();
  }

  /** 软删除资源位，禁止删除线上启用中的记录。 */
  delete(id: number) {
    const deleteResource = this.repository.db.transaction(() => {
      const current = this.detail(id);
      const enabledOnlineResource = current.env === 'online' && current.status === 1;

      if (enabledOnlineResource) {
        throw new ServiceError('ONLINE_ENABLED', '线上启用中的资源位不能删除');
      }

      const time = this.now();
      const metadata = getUpdateMetadata(current, time, this.operator);
      const deletedResource = { ...current, status: 2 as const, ...metadata };
      this.repository.save(deletedResource);

      this.repository.log('DELETE', current, undefined, id, time, this.operator);

      return { success: true };
    });

    return deleteResource();
  }

  /** 在线上写入、来源清理和发布日志之间保留同一个事务。 */
  publish(id: number, forcePublish = false, deleteAfterPublish = true) {
    const publish = this.repository.db.transaction(() => {
      const source = this.detail(id);
      const now = () => this.now();

      return publishResource(
        this.repository,
        source,
        forcePublish,
        deleteAfterPublish,
        now,
        this.operator
      );
    });

    return publish();
  }

  /** 确认资源位存在后读取操作历史，允许已删除资源位查询。 */
  logs(id: number, page?: number, pageSize?: number) {
    this.detail(id, true);

    return this.repository.logs(id, page, pageSize);
  }

  /** 校验历史快照并恢复业务数据，保留当前记录的创建信息。 */
  roll(id: number, versionId: number) {
    const restoreResource = this.repository.db.transaction(() => {
      const current = this.detail(id, true);
      const operation = this.repository.operation(id, versionId);

      if (!operation?.newConfig) {
        throw new ServiceError('INVALID_SNAPSHOT', '该操作没有可恢复的操作后快照');
      }

      const snapshot = JSON.parse(operation.newConfig) as ResourcePlacement;
      if (snapshot.id !== id) {
        throw new ServiceError('INVALID_SNAPSHOT', '操作快照与资源位不匹配');
      }

      const data = validateResource(snapshot);
      ensureUniqueResource(this.repository, data, id);

      const time = this.now();
      const metadata = getUpdateMetadata(current, time, this.operator);
      const restoredResource = {
        ...current,
        ...data,
        status: snapshot.status,
        creator: current.creator,
        createdAt: current.createdAt,
        ...metadata
      };
      const next = this.repository.save(restoredResource);

      this.repository.log('ROLL', current, next, id, time, this.operator);

      return next;
    });

    return restoreResource();
  }

  /** 优先返回当前环境的启用配置，再回退到线上启用配置。 */
  getResourceConfig(bizId: number, key: string, env: string) {
    const environmentResource = this.repository.identity(bizId, key, env);
    const onlineResource = this.repository.identity(bizId, key, 'online');
    const candidates = [environmentResource, onlineResource];
    const resource = candidates.find((candidate) => candidate?.status === 1);

    if (!resource) return { configured: false };

    return { configured: true, resource };
  }
}
