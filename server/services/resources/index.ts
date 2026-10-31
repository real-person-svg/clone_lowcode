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
  constructor(
    public repository: ResourceRepository,
    private now = () => new Date().toISOString(),
    private operator = 'local'
  ) {}

  detail(id: number, includeDeleted = false) {
    const value = this.repository.find(id);
    if (!value || (!includeDeleted && value.status === 2)) throw new ServiceError('NOT_FOUND', '资源位不存在', 404);
    return value;
  }

  list(filters: ListFilters) {
    return this.repository.list(filters);
  }

  create(input: ResourceInput) {
    return this.repository.db.transaction(() => {
      const data = validateResource(input);
      ensureUniqueResource(this.repository, data);

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

  update(id: number, input: Partial<ResourceInput>) {
    return this.repository.db.transaction(() => {
      const old = this.detail(id);
      if (input.revision !== undefined && input.revision !== old.revision){
        throw new ServiceError('REVISION_CONFLICT', '资源位已被修改，请刷新后重试', 409);
      }

      const data = validateResource({ ...old, ...input });

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

  updateStatus(id: number, status: 0 | 1) {
    return this.repository.db.transaction(() => {
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

  delete(id: number) {
    return this.repository.db.transaction(() => {
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

  publish(id: number, forcePublish = false, deleteAfterPublish = true) {
    return this.repository.db.transaction(() =>
      publishResource(
        this.repository,
        this.detail(id),
        forcePublish,
        deleteAfterPublish,
        () => this.now(),
        this.operator
      )
    )();
  }

  logs(id: number, page?: number, pageSize?: number) {
    this.detail(id, true);
    return this.repository.logs(id, page, pageSize);
  }

  roll(id: number, versionId: number) {
    return this.repository.db.transaction(() => {
      const old = this.detail(id, true)
      const operation = this.repository.operation(id, versionId);

      if (!operation?.newConfig){
        throw new ServiceError('INVALID_SNAPSHOT', '该操作没有可恢复的操作后快照');
      }
      
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
        creator: old.creator,
        createdAt: old.createdAt,
        ...getUpdateMetadata(old, time, this.operator)
      });

      this.repository.log('ROLL', old, next, id, time, this.operator);
      return next;
    })();
  }

  getResourceConfig(bizId: number, key: string, env: string) {
    const candidates = [
      this.repository.identity(bizId, key, env),
      this.repository.identity(bizId, key, 'online')
    ];
    
    const resource = candidates.find((r) => r?.status === 1);
    return resource ? { configured: true, resource } : { configured: false };
  }
}
