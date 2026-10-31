import {
  appList,
  type ResourcePlacement,
  type ResourceInput
} from '@shared/types';

export type SheetMode = 'create' | 'edit' | 'copy' | 'child';
export interface Values {
  resourceKey: string;
  resourceName: string;
  bizId: number;
  directoryPath: string;
  version: string;
  versionAlias?: string;
  env: string;
  exampleImage: string | null;
  showFrequencyControl: number;
  showReco: number;
  abExperimentOptionEnabled: number;
  pageFrom?: string | null;
  versionLimit?: { platform?: string; operator?: string; version?: string }[];
}

/** 根据侧栏模式生成初始表单值，并还原序列化的版本限制。 */
export function initialValues(mode: SheetMode, record?: ResourcePlacement) {
  return {
    showFrequencyControl: 0,
    showReco: 0,
    abExperimentOptionEnabled: 0,
    bizId: appList[0].value,
    ...record,
    id: mode === 'copy' ? undefined : record?.id,
    version: mode === 'child' ? '' : record?.version || undefined,
    versionAlias: mode === 'child' ? '' : record?.versionAlias || undefined,
    versionLimit: record?.versionLimit ? JSON.parse(record.versionLimit) : []
  };
}

/** 将表单值转换为 API 输入，按复制和子版本规则处理身份与配置。 */
export function resourceInput(
  mode: SheetMode,
  values: Values,
  record?: ResourcePlacement
) {
  const data = {
    ...values,
    description: record?.description || '',
    versionLimit: values.versionLimit?.length
      ? JSON.stringify(values.versionLimit)
      : null,
    configData:
      mode === 'edit' || mode === 'copy'
        ? record!.configData
        : '{"content":[]}',
    extra: record?.extra ?? null
  } as ResourceInput;

  // 子版本沿用父资源基础信息但重新生成身份并清空配置；复制则解除父子关系。
  if (mode === 'child') {
    Object.assign(data, {
      ...record,
      ...data,
      resourceKey: `${record!.resourceKey}_${values.version}`,
      resourceName: `${record!.resourceName}_${values.version}`,
      parentResourceKey: record!.resourceKey,
      id: undefined,
      configData: '{"content":[]}'
    });
  } else if (mode === 'copy') {
    Object.assign(data, {
      parentResourceKey: null,
      version: null,
      versionAlias: null
    });
  }
  return data;
}
