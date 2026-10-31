// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Toast } from '@douyinfe/semi-ui';
import { vi } from 'vitest';
import type { PageResult, ResourcePlacement } from '@shared/types';
import { api } from '../../../src/resource-placement/api/client';
import { useResourceList } from '../../../src/resource-placement/list/useResourceList';
import { initialFilters } from '../../../src/resource-placement/list/filters/filters';
import { resource } from './fixtures';

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect() {},
    drawImage() {},
    measureText() { return { width: 0 }; }
  })) as any;
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });

  return { promise, resolve, reject };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

const pageResult = (page: number): PageResult<ResourcePlacement> => ({
  list: [{ ...resource, resourceName: `page-${page}` }],
  page,
  pageSize: 10,
  total: 30
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('a late response cannot overwrite a newer page or finish its loading state', async () => {
  const first = deferred<PageResult<ResourcePlacement>>();
  const second = deferred<PageResult<ResourcePlacement>>();
  vi.spyOn(api, 'list').mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { result } = renderHook(useResourceList, { wrapper });

  act(() => result.current.changePage(2, 10));
  await act(async () => first.resolve(pageResult(1)));
  expect(result.current.data.list).toEqual([]);
  expect(result.current.loading).toBe(true);

  await act(async () => second.resolve(pageResult(2)));
  expect(result.current.data).toEqual(pageResult(2));
  expect(result.current.loading).toBe(false);
});

test('inactive and unmounted requests do not display errors; the current request still does', async () => {
  const first = deferred<PageResult<ResourcePlacement>>();
  const second = deferred<PageResult<ResourcePlacement>>();
  const third = deferred<PageResult<ResourcePlacement>>();
  vi.spyOn(api, 'list')
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
    .mockReturnValueOnce(third.promise);
  const error = vi.spyOn(Toast, 'error').mockReturnValue('toast');
  const { result, unmount } = renderHook(useResourceList, { wrapper });

  act(() => result.current.changePage(2, 10));
  await act(async () => first.reject(new Error('stale')));
  expect(error).not.toHaveBeenCalled();

  await act(async () => second.reject(new Error('current')));
  expect(error).toHaveBeenCalledWith('加载数据失败: current');
  expect(result.current.loading).toBe(false);

  act(() => result.current.loadData());
  unmount();
  await act(async () => third.reject(new Error('unmounted')));
  expect(error).toHaveBeenCalledTimes(1);
});

test('changing page size or searching resets to page one while preserving the query contract', async () => {
  const list = vi.spyOn(api, 'list').mockResolvedValue(pageResult(1));
  const { result } = renderHook(useResourceList, { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => result.current.changePage(3, 10));
  await waitFor(() => expect(list).toHaveBeenLastCalledWith({ ...initialFilters, page: 3, pageSize: 10 }));

  act(() => result.current.changePage(3, 20));
  await waitFor(() => expect(list).toHaveBeenLastCalledWith({ ...initialFilters, page: 1, pageSize: 20 }));

  act(() => result.current.changePage(2, 20));
  act(() => result.current.search({ resourceName: 'new search' }));
  await waitFor(() => expect(list).toHaveBeenLastCalledWith({ resourceName: 'new search', page: 1, pageSize: 20 }));
});
