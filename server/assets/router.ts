import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { SqliteDatabase } from '../db';
import { ServiceError } from '../errors';

/** 注册本地上传接口及上传文件的静态访问路由。 */
export function registerAssets(
  app: express.Express,
  db: SqliteDatabase,
  dataDir: string
) {
  const uploadDir = join(dataDir, 'uploads');
  mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, callback) => {
      const extensionMatch = /\.(png|jpe?g|gif|webp|svg|avif|mp4|pdf|txt)$/i.exec(file.originalname);
      const extension = extensionMatch?.[0].toLowerCase() || '.bin';
      const filename = randomUUID() + extension;

      callback(null, filename);
    }
  });
  const limits = { fileSize: 50 * 1024 * 1024, files: 1 };
  const upload = multer({ storage, limits });
  const receiveFile = upload.single('file');

  app.post('/api/assets/upload', receiveFile, (req, res, next) => {
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
      const sql = `
        INSERT INTO assets (id,name,type,size,path,url,created_at)
        VALUES (?,?,?,?,?,?,?)
      `;
      const statement = db.prepare(sql);
      const createdAt = new Date().toISOString();
      const parameters = [
        asset.id,
        asset.name,
        asset.type,
        asset.size,
        file.filename,
        asset.url,
        createdAt
      ];

      statement.run(...parameters);
      res.json(asset);
    } catch (error) {
      unlinkSync(file.path);
      next(error);
    }
  });

  const staticOptions = {
    /** 禁止浏览器嗅探上传文件的内容类型。 */
    setHeaders(res: express.Response) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  };
  const serveUploads = express.static(uploadDir, staticOptions);

  app.use('/uploads', serveUploads);
}
