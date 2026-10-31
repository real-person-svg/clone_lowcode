import { z } from 'zod';

const id = z.number().int().positive();
const pageShape = {
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(10)
};

export const requestSchemas = {
  list: z.object({
    resourceKey: z.string().optional(),
    resourceName: z.string().optional(),
    env: z.string().optional(),
    bizId: z.array(z.number().int()).optional(),
    creator: z.string().optional(),
    ...pageShape
  }),
  detail: z.object({ id }),
  update: z.object({ id }).passthrough(),
  delete: z.object({ id }),
  updateStatus: z.object({
    id,
    status: z.union([z.literal(0), z.literal(1)])
  }),
  publish: z.object({
    id,
    forcePublish: z.boolean().optional(),
    deleteAfterPublish: z.boolean().optional()
  }),
  getOperationLogs: z.object({ resourcePlacementId: id, ...pageShape }),
  roll: z.object({ resourcePlacementId: id, versionId: id }),
  getResourceConfig: z.object({
    bizId: id,
    resourceKey: z.string().min(1),
    env: z.string().min(1)
  })
};
