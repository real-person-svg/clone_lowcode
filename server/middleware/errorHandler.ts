import type express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ServiceError } from '../errors';

/** 将解析、业务、校验和存储异常转换为统一 HTTP 错误响应。 */
export function errorHandler(
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  const invalidJson = error instanceof SyntaxError && 'body' in error;
  if (invalidJson) {
    const responseError = { code: 'INVALID_JSON', message: '请求内容必须是有效 JSON' };
    res.status(400).json({ error: responseError });
    return;
  }

  if (error instanceof ServiceError) {
    const responseError = {
      code: error.code,
      message: error.message,
      details: error.details
    };
    res.status(error.status).json({ error: responseError });
    return;
  }

  if (error instanceof z.ZodError) {
    const messages = error.issues.map((issue) => {
      const fieldPath = issue.path.join('.');

      return `${fieldPath}: ${issue.message}`;
    });
    const message = messages.join('；');
    const responseError = { code: 'INVALID_PARAMETER', message };

    res.status(400).json({ error: responseError });
    return;
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? '文件不能超过 50MB' : error.message;
    const responseError = { code: 'UPLOAD_FAILED', message };

    res.status(400).json({ error: responseError });
    return;
  }

  let duplicateResource = false;
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    duplicateResource = code.startsWith('SQLITE_CONSTRAINT_UNIQUE');
  }

  if (duplicateResource) {
    const responseError = {
      code: 'DUPLICATE',
      message: '该业务线、环境下已存在相同的资源位 Key'
    };
    res.status(409).json({ error: responseError });
    return;
  }

  console.error(error);

  const responseError = { code: 'SERVER_ERROR', message: '操作失败，请稍后重试' };
  res.status(500).json({ error: responseError });
}
