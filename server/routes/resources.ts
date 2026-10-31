import express from 'express';
import { z } from 'zod';
import type { ResourceService } from '../services/resources';
const id = z.number().int().positive();
const pageShape = {
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(10)
};

export function createResourceRouter(service: ResourceService) {
  const router = express.Router();
  const handlers: Record<string, (data: unknown) => unknown> = {
    list: (raw) => service.list(z.object({
      resourceKey: z.string().optional(),
      resourceName: z.string().optional(),
      env: z.string().optional(),
      bizId: z.array(z.number().int()).optional(),
      creator: z.string().optional(),
      ...pageShape
    }).parse(raw)),

    detail: (raw) => service.detail(z.object({ id }).parse(raw).id),

    create: (raw) => service.create(raw as Parameters<ResourceService['create']>[0]),

    update: (raw) => {
      const data = z.object({ id }).passthrough().parse(raw);
      return service.update(
        data.id,
        data as Parameters<ResourceService['update']>[1]
      );
    },

    delete: (raw) => service.delete(z.object({ id }).parse(raw).id),

    updateStatus: (raw) => {
      const data = z.object({ id, status: z.union([z.literal(0), z.literal(1)]) }).parse(raw);
      return service.updateStatus(data.id, data.status);
    },

    publish: (raw) => {
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

    getOperationLogs: (raw) => {
      const data = z.object({ resourcePlacementId: id, ...pageShape }).parse(raw);
      return service.logs(data.resourcePlacementId, data.page, data.pageSize);
    },

    roll: (raw) => {
      const data = z.object({ resourcePlacementId: id, versionId: id }).parse(raw);
      return service.roll(data.resourcePlacementId, data.versionId);
    },

    getResourceConfig: (raw) => {
      const data = z.object({
        bizId: id,
        resourceKey: z.string().min(1),
        env: z.string().min(1)
      }).parse(raw);

      return service.getResourceConfig(data.bizId, data.resourceKey, data.env);
    }
  };

  for (const [action, handler] of Object.entries(handlers)){
    router.post('/' + action, (req, res, next) => {
      try {
        res.json(handler(req.body));
      } catch (e) {
        next(e);
      }
    });
  }
  
  return router;
}
