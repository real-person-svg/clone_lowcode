import express from 'express';
import { join, resolve } from 'node:path';
import type { SqliteDatabase } from './db';
import { ResourceService } from './resource-placement/service';
import { ResourceRepository } from './resource-placement/repository';
import { ServiceError } from './errors';
import { createResourceRouter } from './resource-placement/router';
import { registerAssets } from './assets/router';
import { errorHandler } from './middleware/errorHandler';

/** 组装资源位 API、上传路由、静态页面和统一错误处理。 */
export function createApp(
  db: SqliteDatabase,
  dataDir: string,
  distDir = resolve('dist')
) {
  const app = express();
  const repository = new ResourceRepository(db);
  const service = new ResourceService(repository);

  const health: express.RequestHandler = (_req, res) => res.json({ ok: true });
  const apiNotFound: express.RequestHandler = (_req, _res, next) => {
    const error = new ServiceError('NOT_FOUND', '接口不存在', 404);
    next(error);
  };
  const servePage: express.RequestHandler = (_req, res) => {
    const entryPath = join(distDir, 'index.html');
    res.sendFile(entryPath);
  };

  app.use(express.json({ limit: '5mb' }));
  app.get('/api/health', health);
  app.use('/api/resourcePlacementLowCode', createResourceRouter(service));
  registerAssets(app, db, dataDir);

  app.use('/api', apiNotFound);
  app.use(express.static(distDir));
  app.get('*', servePage);
  app.use(errorHandler);

  return app;
}
