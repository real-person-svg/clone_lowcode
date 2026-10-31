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
