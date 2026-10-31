// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect() {},
    drawImage() {},
    measureText() {
      return { width: 0 };
    }
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { Toast } from '@douyinfe/semi-ui';
import BasicInfoSheet from '../../src/features/resource-placement/list/BasicInfoSheet';
import ConfigDiffModal from '../../src/features/resource-placement/list/operation-logs/ConfigDiffModal';
import { api } from '../../src/features/resource-placement/api/client';
import { resource, originalConfig } from './fixtures';
vi.mock('react-diff-viewer', () => ({
  default: ({
    leftTitle,
    rightTitle
  }: {
    leftTitle: React.ReactNode;
    rightTitle: React.ReactNode;
  }) => (
    <div>
      <div data-testid="diff-before">{leftTitle}</div>
      <div data-testid="diff-after">{rightTitle}</div>
    </div>
  ),
  DiffMethod: { WORDS: 'words' }
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('实际Semi复制侧栏提交保留普通/数组/函数字符串配置，并生成新身份', async () => {
  const create = vi
    .spyOn(api, 'create')
    .mockResolvedValue({ ...resource, id: 2, resourceKey: 'banner_copy' });
  const onClose = vi.fn();
  await act(async () => {
    render(
      <BasicInfoSheet
        mode="copy"
        record={resource}
        onClose={onClose}
        onSaved={() => undefined}
      />
    );
  });
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('请输入资源位Key'), {
      target: { value: 'banner_copy' }
    });
  });
  await act(async () => {
    fireEvent.click(screen.getByText('确认'));
  });
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
  expect(create.mock.calls[0][0]).toMatchObject({
    resourceKey: 'banner_copy',
    configData: originalConfig,
    parentResourceKey: null
  });
  expect(create.mock.calls[0][0]).not.toHaveProperty('id', 1);
  expect(resource.configData).toBe(originalConfig);
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});
it.each(['CREATE', 'DELETE'])(
  '%s日志Diff空白侧可复制空文本，另一侧可复制真实快照',
  async (type) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    vi.spyOn(Toast, 'success').mockReturnValue('toast-id');
    const snapshot = { resourceName: '首页横幅', configData: originalConfig };
    render(
      <ConfigDiffModal
        visible
        oldConfig={type === 'CREATE' ? undefined : snapshot}
        newConfig={type === 'DELETE' ? undefined : snapshot}
        onClose={() => undefined}
      />
    );
    fireEvent.click(
      within(
        screen.getByTestId(type === 'CREATE' ? 'diff-before' : 'diff-after')
      ).getByText('复制')
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(''));
    fireEvent.click(
      within(
        screen.getByTestId(type === 'CREATE' ? 'diff-after' : 'diff-before')
      ).getByText('复制')
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(JSON.parse(writeText.mock.calls[1][0])).toEqual({
      resourceName: '首页横幅',
      configData: JSON.parse(originalConfig)
    });
  }
);
it('Diff复制等待真实clipboard成功，失败仅显示失败反馈', async () => {
  let resolveWrite!: () => void;
  const pending = new Promise<void>((resolve) => {
    resolveWrite = resolve;
  });
  const writeText = vi
    .fn()
    .mockReturnValueOnce(pending)
    .mockRejectedValueOnce(new Error('denied'));
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText }
  });
  const success = vi.spyOn(Toast, 'success').mockReturnValue('toast-id');
  const error = vi.spyOn(Toast, 'error').mockReturnValue('toast-id');
  render(
    <ConfigDiffModal
      visible
      newConfig={{ resourceName: '首页横幅' }}
      onClose={() => undefined}
    />
  );
  const copy = within(screen.getByTestId('diff-after')).getByText('复制');
  fireEvent.click(copy);
  expect(success).not.toHaveBeenCalled();
  await act(async () => resolveWrite());
  expect(success).toHaveBeenCalledTimes(1);
  fireEvent.click(copy);
  await waitFor(() => expect(error).toHaveBeenCalledWith('复制失败，请重试'));
  expect(success).toHaveBeenCalledTimes(1);
});
