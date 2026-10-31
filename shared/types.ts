export interface VersionLimitItem {
  platform?: string;
  operator?: string;
  version?: string;
}
export interface ResourcePlacement {
  id: number;
  resourceKey: string;
  resourceName: string;
  bizId: number;
  env: string;
  description: string;
  exampleImage: string | null;
  directoryPath: string;
  pageFrom: string | null;
  showFrequencyControl: number;
  showReco: number;
  abExperimentOptionEnabled: number;
  parentResourceKey: string | null;
  version: string | null;
  versionAlias: string | null;
  versionLimit: string | null;
  configData: string;
  extra: string | null;
  status: 0 | 1 | 2;
  creator: string;
  updater: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  from: '数据库';
}
export type ResourceInput = Pick<
  ResourcePlacement,
  'resourceKey' | 'resourceName' | 'bizId' | 'env'
> &
  Partial<
    Omit<
      ResourcePlacement,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'creator'
      | 'updater'
      | 'from'
      | 'status'
    >
  >;
export interface ListFilters {
  resourceKey?: string;
  resourceName?: string;
  env?: string;
  bizId?: number[];
  creator?: string;
  page?: number;
  pageSize?: number;
}
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface OperationLog {
  versionId: number;
  resourcePlacementId: number;
  operationType: string;
  oldConfig: string;
  newConfig: string;
  operator: string;
  operationTime: string;
}
export interface PublishResult {
  success: boolean;
  message: string;
  data: {
    id?: number;
    action?: string;
    sourceId?: number;
    onlineUpdateTime?: string;
    sourceCreateTime?: string;
  };
}
export interface Asset {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}
export const appList = [
  { value: 3006, label: 'CapCut APP' },
  { value: 7356, label: 'Hypic APP' },
  { value: 359289, label: 'CapCut PC' },
  { value: 348188, label: 'CapCut Web' },
  { value: 573081, label: 'Pippit Web' },
  { value: 862354, label: 'Pippit APP' },
  { value: 791253, label: 'Dreamina APP' },
  { value: 513641, label: 'Dreamina Web' }
];
export const ONLINE_ENV = 'online';
export const ResourceStatus = { UNABLE: 0, ENABLE: 1, DELETE: 2 } as const;
