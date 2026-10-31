import type { ResourceInput } from '../../../shared/types';

export const input = (overrides: Partial<ResourceInput> = {}): ResourceInput => ({
  resourceKey: 'home_banner',
  resourceName: '首页横幅',
  bizId: 3006,
  env: 'ppe_test',
  directoryPath: '首页',
  exampleImage: '/uploads/example.png',
  ...overrides
});
