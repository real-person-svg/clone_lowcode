import express from 'express';
import type { ResourceService } from './service';
import { requestSchemas } from './requestSchemas';

/** 创建资源位路由，依次校验请求、调用服务并输出结果。 */
export function createResourceRouter(service: ResourceService) {
  const router = express.Router();
  const handlers: Record<string, (data: unknown) => unknown> = {
    list: (raw) => {
      const filters = requestSchemas.list.parse(raw);

      return service.list(filters);
    },

    detail: (raw) => {
      const data = requestSchemas.detail.parse(raw);

      return service.detail(data.id);
    },

    create: (raw) => {
      const input = raw as Parameters<ResourceService['create']>[0];

      return service.create(input);
    },

    update: (raw) => {
      const data = requestSchemas.update.parse(raw);
      const input = data as Parameters<ResourceService['update']>[1];

      return service.update(data.id, input);
    },

    delete: (raw) => {
      const data = requestSchemas.delete.parse(raw);

      return service.delete(data.id);
    },

    updateStatus: (raw) => {
      const data = requestSchemas.updateStatus.parse(raw);

      return service.updateStatus(data.id, data.status);
    },

    publish: (raw) => {
      const data = requestSchemas.publish.parse(raw);

      return service.publish(data.id, data.forcePublish, data.deleteAfterPublish);
    },

    getOperationLogs: (raw) => {
      const data = requestSchemas.getOperationLogs.parse(raw);

      return service.logs(data.resourcePlacementId, data.page, data.pageSize);
    },

    roll: (raw) => {
      const data = requestSchemas.roll.parse(raw);

      return service.roll(data.resourcePlacementId, data.versionId);
    },

    getResourceConfig: (raw) => {
      const data = requestSchemas.getResourceConfig.parse(raw);

      return service.getResourceConfig(data.bizId, data.resourceKey, data.env);
    }
  };

  for (const [action, handler] of Object.entries(handlers)) {
    const route = '/' + action;
    router.post(route, (req, res, next) => {
      try {
        const result = handler(req.body);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });
  }

  return router;
}
