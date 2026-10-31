import { z } from 'zod';
import { parseConfig } from '../../shared/config';
import {
  appList,
  type ResourceInput,
  type ResourcePlacement,
  type ListFilters
} from '../../shared/types';
import { ResourceRepository } from '../repositories/resources';
import { ServiceError } from '../errors';
const text = z.string().trim().min(1, '不能为空');
const jsonString = z.string().nullable().optional();
const editableSchema = z.object({
  resourceKey: text.regex(
    /^[A-Za-z0-9_-]+$/,
    '资源位 Key 仅支持字母、数字、下划线和横线'
  ),
  resourceName: text,
  bizId: z
    .number()
    .int()
    .refine((v) => appList.some((a) => a.value === v), '无效业务线'),
  env: text.regex(/^\S+$/, '环境不能包含空格'),
  description: z.string().optional(),
  exampleImage: z.string().nullable().optional(),
  directoryPath: text,
  pageFrom: jsonString,
  showFrequencyControl: z.number().int().min(0).max(1).optional(),
  showReco: z.number().int().min(0).max(1).optional(),
  abExperimentOptionEnabled: z.number().int().min(0).max(1).optional(),
  parentResourceKey: jsonString,
  version: jsonString,
  versionAlias: jsonString,
  versionLimit: jsonString,
  configData: z.string().optional(),
  extra: jsonString,
  revision: z.number().int().positive().optional()
});
export class ResourceService {
  constructor(
    public repository: ResourceRepository,
    private now = () => new Date().toISOString(),
    private operator = 'local'
  ) {}
  detail(id: number, includeDeleted = false) {
    const value = this.repository.find(id);
    if (!value || (!includeDeleted && value.status === 2))
      throw new ServiceError('NOT_FOUND', '资源位不存在', 404);
    return value;
  }
  private validate(data: ResourceInput) {
    const parsed = editableSchema.parse(data);
    if (!parsed.exampleImage?.trim())
      throw new ServiceError('INVALID_RESOURCE', '请上传资源位示例图');
    try {
      parsed.configData = JSON.stringify(parseConfig(parsed.configData ?? ''));
    } catch (e) {
      throw new ServiceError(
        'INVALID_CONFIG',
        `配置非法：${(e as Error).message}`
      );
    }
    if (parsed.extra) {
      try {
        const value = JSON.parse(parsed.extra);
        if (!value || typeof value !== 'object' || Array.isArray(value))
          throw new Error();
      } catch {
        throw new ServiceError('INVALID_EXTRA', 'extra 必须是 JSON 对象');
      }
    }
    if (parsed.versionLimit) {
      try {
        const value: unknown = JSON.parse(parsed.versionLimit);
        z.array(
          z.object({
            platform: z.enum(['ios', 'android', 'mac', 'windows']),
            operator: z.enum(['>=', '<=', '=']),
            version: z.string().regex(/^\d+\.\d+\.(\d+|\*)$/)
          })
        ).parse(value);
      } catch {
        throw new ServiceError(
          'INVALID_VERSION_LIMIT',
          '客户端版本限制需要客户端、操作符和有效版本号（如 1.2.3）'
        );
      }
    }
    return parsed;
  }
  private unique(
    data: { bizId: number; resourceKey: string; env: string },
    ignoreId?: number
  ) {
    const existing = this.repository.identity(
      data.bizId,
      data.resourceKey,
      data.env
    );
    if (existing && existing.id !== ignoreId)
      throw new ServiceError(
        'DUPLICATE',
        '该业务线、环境下已存在相同的资源位 Key',
        409
      );
  }
  list(filters: ListFilters) {
    return this.repository.list(filters);
  }
  create(input: ResourceInput) {
    return this.repository.db.transaction(() => {
      const data = this.validate(input);
      this.unique(data);
      if (data.parentResourceKey) {
        const parent = this.repository.parent(
          data.bizId,
          data.parentResourceKey
        );
        if (!parent || parent.parentResourceKey)
          throw new ServiceError(
            'INVALID_PARENT',
            '只能为已有的非子版本资源位添加子版本'
          );
        if (
          !data.version?.match(/^[A-Za-z0-9_-]+$/) ||
          data.resourceKey !== `${parent.resourceKey}_${data.version}`
        )
          throw new ServiceError(
            'INVALID_CHILD',
            '子版本 Key 必须由父资源位 Key 与版本生成'
          );
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
      if (input.revision !== undefined && input.revision !== old.revision)
        throw new ServiceError(
          'REVISION_CONFLICT',
          '资源位已被修改，请刷新后重试',
          409
        );
      const data = this.validate({ ...old, ...input });
      if (
        data.resourceKey !== old.resourceKey ||
        data.bizId !== old.bizId ||
        (old.env === 'online' && data.env !== old.env)
      )
        throw new ServiceError(
          'IMMUTABLE_IDENTITY',
          '资源位 Key、业务线及线上环境不可修改'
        );
      if (
        data.parentResourceKey !== old.parentResourceKey ||
        data.version !== old.version
      )
        throw new ServiceError('IMMUTABLE_IDENTITY', '子版本关系不可修改');
      this.unique(data, id);
      const time = this.now();
      const next = this.repository.save({
        ...old,
        ...data,
        updatedAt: time,
        updater: this.operator,
        revision: old.revision + 1
      });
      this.repository.log('UPDATE', old, next, id, time, this.operator);
      return next;
    })();
  }
  updateStatus(id: number, status: 0 | 1) {
    return this.repository.db.transaction(() => {
      const old = this.detail(id),
        time = this.now();
      const next = this.repository.save({
        ...old,
        status,
        updatedAt: time,
        updater: this.operator,
        revision: old.revision + 1
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
      if (old.env === 'online' && old.status === 1)
        throw new ServiceError('ONLINE_ENABLED', '线上启用中的资源位不能删除');
      const time = this.now();
      this.repository.save({
        ...old,
        status: 2,
        updatedAt: time,
        updater: this.operator,
        revision: old.revision + 1
      });
      this.repository.log('DELETE', old, undefined, id, time, this.operator);
      return { success: true };
    })();
  }
  publish(id: number, forcePublish = false, deleteAfterPublish = true) {
    return this.repository.db.transaction(() => {
      const source = this.detail(id);
      if (source.env === 'online')
        throw new ServiceError('ONLINE_PUBLISH', '线上环境资源位不能发布');
      const online = this.repository.identity(
        source.bizId,
        source.resourceKey,
        'online'
      );
      if (online && !forcePublish && online.updatedAt > source.createdAt)
        return {
          success: false,
          message: 'CONFLICT',
          data: {
            sourceId: id,
            onlineUpdateTime: online.updatedAt,
            sourceCreateTime: source.createdAt
          }
        };
      const time = this.now();
      const next = online
        ? this.repository.save({
            ...source,
            id: online.id,
            env: 'online',
            creator: online.creator,
            createdAt: online.createdAt,
            updater: this.operator,
            updatedAt: time,
            revision: online.revision + 1
          })
        : this.repository.insert({
            ...source,
            env: 'online',
            creator: this.operator,
            createdAt: time,
            updater: this.operator,
            updatedAt: time,
            revision: 1
          });
      this.repository.log(
        'PUBLISH',
        online,
        next,
        next.id,
        time,
        this.operator
      );
      if (deleteAfterPublish) {
        this.repository.save({
          ...source,
          status: 2,
          updatedAt: time,
          updater: this.operator,
          revision: source.revision + 1
        });
        this.repository.log(
          'DELETE',
          source,
          undefined,
          source.id,
          time,
          this.operator
        );
      }
      return {
        success: true,
        message: online
          ? '发布成功，已更新线上资源位'
          : '发布成功，已创建线上资源位',
        data: { id: next.id, action: online ? 'updated' : 'created' }
      };
    })();
  }
  logs(id: number, page?: number, pageSize?: number) {
    this.detail(id, true);
    return this.repository.logs(id, page, pageSize);
  }
  roll(id: number, versionId: number) {
    return this.repository.db.transaction(() => {
      const old = this.detail(id, true),
        operation = this.repository.operation(id, versionId);
      if (!operation?.newConfig)
        throw new ServiceError(
          'INVALID_SNAPSHOT',
          '该操作没有可恢复的操作后快照'
        );
      const snapshot = JSON.parse(operation.newConfig) as ResourcePlacement;
      if (snapshot.id !== id)
        throw new ServiceError('INVALID_SNAPSHOT', '操作快照与资源位不匹配');
      const data = this.validate(snapshot);
      this.unique(data, id);
      const time = this.now();
      const next = this.repository.save({
        ...old,
        ...data,
        status: snapshot.status,
        creator: old.creator,
        createdAt: old.createdAt,
        updater: this.operator,
        updatedAt: time,
        revision: old.revision + 1
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
