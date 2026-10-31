import express from 'express';
import { z } from 'zod';
import type { ResourceService } from '../services/resources';
const id = z.number().int().positive();
const pageShape = {
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(10)
};

/** 创建资源位路由，将请求参数校验与业务服务连接起来。 */
export function createResourceRouter(service: ResourceService) {
  const router = express.Router();
  const handlers: Record<string, (data: unknown) => unknown> = {
    list: /* 校验筛选和分页参数后查询资源位列表。 */ (raw) => service.list(z.object({
      resourceKey: z.string().optional(),
      resourceName: z.string().optional(),
      env: z.string().optional(),
      bizId: z.array(z.number().int()).optional(),
      creator: z.string().optional(),
      ...pageShape
    }).parse(raw)),

    detail: /* 校验资源位 ID 后读取详情。 */ (raw) => service.detail(z.object({ id }).parse(raw).id),

    create: /* 将创建输入交给服务层执行完整业务校验。 */ (raw) => service.create(raw as Parameters<ResourceService['create']>[0]),

    update: /* 提取资源位 ID，并将其余更新字段交给服务层。 */ (raw) => {
      const data = z.object({ id }).passthrough().parse(raw);
      return service.update(
        data.id,
        data as Parameters<ResourceService['update']>[1]
      );
    },

    delete: /* 校验资源位 ID 后执行软删除。 */ (raw) => service.delete(z.object({ id }).parse(raw).id),

    updateStatus: /* 只接受启用或禁用状态并交给服务层更新。 */ (raw) => {
      const data = z.object({ id, status: z.union([z.literal(0), z.literal(1)]) }).parse(raw);
      return service.updateStatus(data.id, data.status);
    },

    publish: /* 校验发布选项后发布指定资源位。 */ (raw) => {
      const data = z.object({
        id,
        forcePublish: z.boolean().optional(),
        deleteAfterPublish: z.boolean().optional()
      }).parse(raw);

      return service.publish(
        data.id,
        data.forcePublish,
        data.deleteAfterPublish
      );
    },

    getOperationLogs: /* 校验资源位 ID 和分页参数后读取操作历史。 */ (raw) => {
      const data = z.object({ resourcePlacementId: id, ...pageShape }).parse(raw);
      return service.logs(data.resourcePlacementId, data.page, data.pageSize);
    },

    roll: /* 校验资源位及操作版本后恢复历史快照。 */ (raw) => {
      const data = z.object({ resourcePlacementId: id, versionId: id }).parse(raw);
      return service.roll(data.resourcePlacementId, data.versionId);
    },

    getResourceConfig: /* 校验业务线、Key 和环境后查找可用配置。 */ (raw) => {
      const data = z.object({
        bizId: id,
        resourceKey: z.string().min(1),
        env: z.string().min(1)
      }).parse(raw);

      return service.getResourceConfig(data.bizId, data.resourceKey, data.env);
    }
  };

  for (const [action, handler] of Object.entries(handlers)){
    router.post('/' + action, /* 执行对应业务处理器，并将异常转给统一错误中间件。 */ (req, res, next) => {
      try {
        res.json(handler(req.body));
      } catch (e) {
        next(e);
      }
    });
  }
  
  return router;
}
