import type express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ServiceError } from '../errors';

export function errorHandler(
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
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
