import type { ResourceInput } from '../../../shared/types';

/** 生成带有效必填字段的资源位输入，允许用例覆盖特定字段。 */
export const input = (overrides: Partial<ResourceInput> = {}): ResourceInput => ({
  resourceKey: 'home_banner',
  resourceName: '首页横幅',
  bizId: 3006,
  env: 'ppe_test',
  directoryPath: '首页',
  exampleImage: '/uploads/example.png',
  ...overrides
});
