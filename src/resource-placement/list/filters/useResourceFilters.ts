import { useRef } from 'react';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import type { ListFilters } from '@shared/types';
import { initialFilters } from './filters';

export function useResourceFilters(onSearch: (filters: ListFilters) => void) {
  const form = useRef<FormApi<ListFilters>>();

  /** 恢复默认筛选并立即重新搜索。 */
  const reset = () => {
    form.current?.setValues(initialFilters);
    onSearch(initialFilters);
  };

  const setFormApi = (value: FormApi<ListFilters>) => {
    form.current = value;
  };

  const submit = (values: unknown) => onSearch(values as ListFilters);

  return { reset, setFormApi, submit };
}
