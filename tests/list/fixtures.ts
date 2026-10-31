import type { ResourcePlacement } from '../../shared/types';

export const originalConfig = JSON.stringify({
  content: [
    {
      type: 'FormInput',
      path: 'config.title',
      label: '标题',
      isShow: '(state) => Boolean(state.config.enabled)'
    },
    {
      type: 'ArrayContainer',
      path: 'config.items',
      children: [
        {
          type: 'Input',
          path: 'title',
          label: '条目',
          validate: '(value) => value ? "" : "必填"'
        }
      ]
    }
  ]
});
export const resource: ResourcePlacement = {
  id: 1,
  resourceKey: 'banner',
  resourceName: '首页横幅',
  bizId: 3006,
  env: 'ppe_source',
  description: '',
  exampleImage: '/uploads/example.png',
  directoryPath: '首页',
  pageFrom: null,
  showFrequencyControl: 0,
  showReco: 1,
  abExperimentOptionEnabled: 1,
  parentResourceKey: null,
  version: null,
  versionAlias: null,
  versionLimit: null,
  configData: originalConfig,
  extra: null,
  status: 1,
  creator: 'local',
  updater: 'local',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  revision: 1,
  from: '数据库'
};
