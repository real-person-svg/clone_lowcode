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

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: /* 使用随机文件名保存上传文件，仅保留允许的扩展名。 */ (_req, file, cb) => {
        const extension = /\.(png|jpe?g|gif|webp|svg|avif|mp4|pdf|txt)$/i.exec(file.originalname)?.[0].toLowerCase() || '.bin';
        cb(null, randomUUID() + extension);
      }
    }),
    limits: { fileSize: 50 * 1024 * 1024, files: 1 }
  });

  app.post('/api/assets/upload', upload.single('file'), /* 保存文件元数据并返回访问地址，入库失败时删除已上传文件。 */ (req, res, next) => {
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
      
      db.prepare('INSERT INTO assets (id,name,type,size,path,url,created_at) VALUES (?,?,?,?,?,?,?)').run(
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
      /** 禁止浏览器嗅探上传文件的内容类型。 */
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    })
  );
}
