import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import type { SqliteDatabase } from './db/index';
import { ResourceService } from './services/resources';
import { ResourceRepository } from './repositories/resources';
import { ServiceError } from './errors';
const id = z.number().int().positive();
const pageShape = {
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(10)
};
export function createApp(
  db: SqliteDatabase,
  dataDir: string,
  distDir = resolve('dist')
) {
  const app = express();
  const service = new ResourceService(new ResourceRepository(db));
  app.use(express.json({ limit: '5mb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  const router = express.Router();
  const handlers: Record<string, (data: unknown) => unknown> = {
    list: (raw) =>
      service.list(
        z
          .object({
            resourceKey: z.string().optional(),
            resourceName: z.string().optional(),
            env: z.string().optional(),
            bizId: z.array(z.number().int()).optional(),
            creator: z.string().optional(),
            ...pageShape
          })
          .parse(raw)
      ),
    detail: (raw) => service.detail(z.object({ id }).parse(raw).id),
    create: (raw) =>
      service.create(raw as Parameters<ResourceService['create']>[0]),
    update: (raw) => {
      const data = z.object({ id }).passthrough().parse(raw);
      return service.update(
        data.id,
        data as Parameters<ResourceService['update']>[1]
      );
    },
    delete: (raw) => service.delete(z.object({ id }).parse(raw).id),
    updateStatus: (raw) => {
      const data = z
        .object({ id, status: z.union([z.literal(0), z.literal(1)]) })
        .parse(raw);
      return service.updateStatus(data.id, data.status);
    },
    publish: (raw) => {
      const data = z
        .object({
          id,
          forcePublish: z.boolean().optional(),
          deleteAfterPublish: z.boolean().optional()
        })
        .parse(raw);
      return service.publish(
        data.id,
        data.forcePublish,
        data.deleteAfterPublish
      );
    },
    getOperationLogs: (raw) => {
      const data = z
        .object({ resourcePlacementId: id, ...pageShape })
        .parse(raw);
      return service.logs(data.resourcePlacementId, data.page, data.pageSize);
    },
    roll: (raw) => {
      const data = z
        .object({ resourcePlacementId: id, versionId: id })
        .parse(raw);
      return service.roll(data.resourcePlacementId, data.versionId);
    },
    getResourceConfig: (raw) => {
      const data = z
        .object({
          bizId: id,
          resourceKey: z.string().min(1),
          env: z.string().min(1)
        })
        .parse(raw);
      return service.getResourceConfig(data.bizId, data.resourceKey, data.env);
    }
  };
  for (const [action, handler] of Object.entries(handlers))
    router.post('/' + action, (req, res, next) => {
      try {
        res.json(handler(req.body));
      } catch (e) {
        next(e);
      }
    });
  app.use('/api/resourcePlacementLowCode', router);
  const uploadDir = join(dataDir, 'uploads');
  mkdirSync(uploadDir, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const extension =
          /\.(png|jpe?g|gif|webp|svg|avif|mp4|pdf|txt)$/i
            .exec(file.originalname)?.[0]
            .toLowerCase() || '.bin';
        cb(null, randomUUID() + extension);
      }
    }),
    limits: { fileSize: 50 * 1024 * 1024, files: 1 }
  });
  app.post('/api/assets/upload', upload.single('file'), (req, res, next) => {
    const file = req.file;
    if (!file) {
      next(new ServiceError('FILE_REQUIRED', '请选择上传文件'));
      return;
    }
    try {
      const asset = {
        id: file.filename,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: '/uploads/' + file.filename
      };
      db.prepare(
        'INSERT INTO assets (id,name,type,size,path,url,created_at) VALUES (?,?,?,?,?,?,?)'
      ).run(
        asset.id,
        asset.name,
        asset.type,
        asset.size,
        file.filename,
        asset.url,
        new Date().toISOString()
      );
      res.json(asset);
    } catch (e) {
      unlinkSync(file.path);
      next(e);
    }
  });
  app.use(
    '/uploads',
    express.static(uploadDir, {
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    })
  );
  app.use('/api', (_req, _res, next) =>
    next(new ServiceError('NOT_FOUND', '接口不存在', 404))
  );
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')));
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof SyntaxError && 'body' in error) {
        res
          .status(400)
          .json({
            error: { code: 'INVALID_JSON', message: '请求内容必须是有效 JSON' }
          });
        return;
      }
      if (error instanceof ServiceError) {
        res
          .status(error.status)
          .json({
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            }
          });
        return;
      }
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            error: {
              code: 'INVALID_PARAMETER',
              message: error.issues
                .map((i) => `${i.path.join('.')}: ${i.message}`)
                .join('；')
            }
          });
        return;
      }
      if (error instanceof multer.MulterError) {
        res
          .status(400)
          .json({
            error: {
              code: 'UPLOAD_FAILED',
              message:
                error.code === 'LIMIT_FILE_SIZE'
                  ? '文件不能超过 50MB'
                  : error.message
            }
          });
        return;
      }
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        String(error.code).startsWith('SQLITE_CONSTRAINT_UNIQUE')
      ) {
        res
          .status(409)
          .json({
            error: {
              code: 'DUPLICATE',
              message: '该业务线、环境下已存在相同的资源位 Key'
            }
          });
        return;
      }
      console.error(error);
      res
        .status(500)
        .json({
          error: { code: 'SERVER_ERROR', message: '操作失败，请稍后重试' }
        });
    }
  );
  return app;
}
