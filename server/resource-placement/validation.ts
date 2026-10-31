import { z } from 'zod';
import { parseConfig } from '../../shared/config';
import { appList, type ResourceInput } from '../../shared/types';
import { ServiceError } from '../errors';

const text = z.string().trim().min(1, '不能为空');
const jsonString = z.string().nullable().optional();

function isSupportedBusinessId(bizId: number) {
  return appList.some((app) => app.value === bizId);
}

const editableSchema = z.object({
  resourceKey: text.regex(/^[A-Za-z0-9_-]+$/, '资源位 Key 仅支持字母、数字、下划线和横线'),
  resourceName: text,
  bizId: z.number().int().refine(isSupportedBusinessId, '无效业务线'),
  env: text.regex(/^\S+$/, '环境不能包含空格'),
  description: z.string().optional(),
  exampleImage: z.string().nullable().optional(),
  directoryPath: text,
  pageFrom: jsonString,
  showFrequencyControl: z.number().int().min(0).max(1).optional(),
  showReco: z.number().int().min(0).max(1).optional(),
  abExperimentOptionEnabled: z.number().int().min(0).max(1).optional(),
  parentResourceKey: jsonString,
  version: jsonString,
  versionAlias: jsonString,
  versionLimit: jsonString,
  configData: z.string().optional(),
  extra: jsonString,
  revision: z.number().int().positive().optional()
});

const versionLimitItemSchema = z.object({
  platform: z.enum(['ios', 'android', 'mac', 'windows']),
  operator: z.enum(['>=', '<=', '=']),
  version: z.string().regex(/^\d+\.\d+\.(\d+|\*)$/)
});
const versionLimitSchema = z.array(versionLimitItemSchema);

/** 校验资源位字段、低码配置和附加 JSON，并返回规范化输入。 */
export function validateResource(data: ResourceInput) {
  const parsed = editableSchema.parse(data);
  const exampleImage = parsed.exampleImage?.trim();

  if (!exampleImage) {
    throw new ServiceError('INVALID_RESOURCE', '请上传资源位示例图');
  }

  // 规范化配置文本，并将结构错误转换为既有业务错误。
  try {
    const configText = parsed.configData ?? '';
    const config = parseConfig(configText);
    parsed.configData = JSON.stringify(config);
  } catch (error) {
    const message = (error as Error).message;
    throw new ServiceError('INVALID_CONFIG', `配置非法：${message}`);
  }

  if (parsed.extra) {
    try {
      const extra = JSON.parse(parsed.extra);
      const isObject = extra && typeof extra === 'object' && !Array.isArray(extra);

      if (!isObject) throw new Error();
    } catch {
      throw new ServiceError('INVALID_EXTRA', 'extra 必须是 JSON 对象');
    }
  }

  if (parsed.versionLimit) {
    try {
      const versionLimits: unknown = JSON.parse(parsed.versionLimit);
      versionLimitSchema.parse(versionLimits);
    } catch {
      throw new ServiceError('INVALID_VERSION_LIMIT', '客户端版本限制需要客户端、操作符和有效版本号（如 1.2.3）');
    }
  }

  return parsed;
}
