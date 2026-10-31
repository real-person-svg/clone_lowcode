import express from 'express';
import { join, resolve } from 'node:path';
import type { SqliteDatabase } from './db';
import { ResourceService } from './services/resources';
import { ResourceRepository } from './repositories/resources';
import { ServiceError } from './errors';
import { createResourceRouter } from './routes/resources';
import { registerAssets } from './routes/assets';
import { errorHandler } from './middleware/errorHandler';

export function createApp(
  db: SqliteDatabase,
  dataDir: string,
  distDir = resolve('dist')
) {
  const app = express();
  const service = new ResourceService(new ResourceRepository(db));
  app.use(express.json({ limit: '5mb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/resourcePlacementLowCode', createResourceRouter(service));
  registerAssets(app, db, dataDir);
  app.use('/api', (_req, _res, next) => next(new ServiceError('NOT_FOUND', '接口不存在', 404)));
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')));
  app.use(errorHandler);
  return app;
}
