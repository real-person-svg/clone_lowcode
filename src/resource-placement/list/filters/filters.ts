import { appList, type ListFilters } from '@shared/types';

export const initialFilters: ListFilters = {
  resourceKey: '',
  resourceName: '',
  env: '',
  bizId: appList.map(
    /* 提取业务线编号作为默认筛选范围。 */
    (app) => app.value),
  creator: ''
};
