export const DRAG_TYPES = {
  COMPONENT: 'component',
  EXISTING_COMPONENT: 'existing-component'
} as const;

export const DROP_POSITIONS = {
  BEFORE: 'before',
  AFTER: 'after',
  INSIDE: 'inside'
} as const;

export const COMPONENT_CATEGORIES = {
  LAYOUT: 'layout',
  INPUT: 'input',
  BUSINESS: 'business',
  DISPLAY: 'display'
} as const;

export const OPERATION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
} as const;

export const ONLINE_ENV = 'online';

export const TCC_URL_PREFIX = 'tcc__';

export enum ResourceStatus {
  UNABLE = 0,
  ENABLE = 1,
  DELETE = 2
}
export const resourceStatusLabel = {
  [ResourceStatus.UNABLE]: '已禁用',
  [ResourceStatus.ENABLE]: '启用中',
  [ResourceStatus.DELETE]: '已删除'
};
