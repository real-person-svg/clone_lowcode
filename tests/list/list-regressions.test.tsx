// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
vi.hoisted(/* 为列表相关真实控件提供 jsdom 尺寸与绘图替身。 */ () => {
  globalThis.ResizeObserver = class {
    /** 测试不执行尺寸观察。 */
    observe() {}
    /** 测试没有真实观察需取消。 */
    unobserve() {}
    /** 测试没有真实观察器资源需释放。 */
    disconnect() {}
  };
  HTMLCanvasElement.prototype.getContext = (/* 返回列表控件初始化所需的最小绘图上下文。 */ () => ({
    fillStyle: '',
    /** 忽略无关的矩形绘制。 */
    fillRect() {},
    /** 忽略无关的图片绘制。 */
    drawImage() {},
    /** 提供固定文字宽度供控件测量。 */
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
import OperationLogModal from '../../src/features/resource-placement/list/operation-logs';
import { api } from '../../src/features/resource-placement/api/client';
import { resource, originalConfig } from './fixtures';
vi.mock('react-diff-viewer', /* 替换差异查看器，暴露前后文本供 DOM 断言。 */ () => ({
  default: /* 展示差异标题及前后值，隔离第三方差异渲染。 */ ({
    leftTitle,
    rightTitle,
    oldValue,
    newValue
  }: {
    leftTitle: React.ReactNode;
    rightTitle: React.ReactNode;
    oldValue: string;
    newValue: string;
  }) => (
    <div>
      <div data-testid="diff-before">{leftTitle}</div>
      <div data-testid="diff-after">{rightTitle}</div>
      <pre data-testid="diff-before-value">{oldValue}</pre>
      <pre data-testid="diff-after-value">{newValue}</pre>
    </div>
  ),
  DiffMethod: { WORDS: 'words' }
}));
afterEach(/* 每个用例后清理 DOM 并恢复 spy。 */ () => {
  cleanup();
  vi.restoreAllMocks();
});
it('操作日志接入真实快照过滤与Diff格式化，关闭Diff不关闭日志', async () => {
  const getLogs = vi.spyOn(api, 'getOperationLogs').mockResolvedValue({
    list: [{
      versionId: 12,
      resourcePlacementId: 1,
      operationType: 'UPDATE',
      oldConfig: '{"resourceName":"之前","creator":"a","revision":1,"configData":"{\\"z\\":2,\\"a\\":1}"}',
      newConfig: '{"resourceName":"之后","updater":"b","updatedAt":"now","configData":"{\\"z\\":1,\\"a\\":false}"}',
      operator: 'local',
      operationTime: '2026-01-01T00:00:00.000Z'
    }],
    total: 1,
    page: 1,
    pageSize: 10
  });
  const onClose = vi.fn();
  render(<OperationLogModal resourceId={1} onClose={onClose} loadData={/* 本用例不需要额外的列表刷新操作。 */ () => undefined} />);
  fireEvent.click(await screen.findByText('比对变更'));
  expect(getLogs).toHaveBeenCalledWith({ resourcePlacementId: 1, page: 1, pageSize: 10 });
  expect(screen.getByTestId('diff-before-value').textContent).toBe(`{
  "configData": {
    "a": 1,
    "z": 2
  },
  "resourceName": "之前"
}`);
  expect(screen.getByTestId('diff-after-value').textContent).toBe(`{
  "configData": {
    "a": false,
    "z": 1
  },
  "resourceName": "之后"
}`);
  const diffDialog = screen.getByText('差异比对').closest('.semi-modal-content')!;
  fireEvent.click(within(diffDialog as HTMLElement).getByRole('button', { name: 'close' }));
  await waitFor(/* 等待差异弹窗关闭，确认差异内容已卸载。 */ () => expect(screen.queryByTestId('diff-after-value')).toBeNull());
  expect(screen.getByText('操作日志')).toBeTruthy();
  expect(onClose).not.toHaveBeenCalled();
});
it('实际Semi复制侧栏提交保留普通/数组/函数字符串配置，并生成新身份', async () => {
  const create = vi
    .spyOn(api, 'create')
    .mockResolvedValue({ ...resource, id: 2, resourceKey: 'banner_copy' });
  const onClose = vi.fn();
  await act(/* 挂载复制侧栏，等待表单字段完成初始化。 */ async () => {
    render(
      <BasicInfoSheet
        mode="copy"
        record={resource}
        onClose={onClose}
        onSaved={/* 本用例不检查保存后的列表刷新。 */ () => undefined}
      />
    );
  });
  await act(/* 输入复制资源的新 Key。 */ async () => {
    fireEvent.change(screen.getByPlaceholderText('请输入资源位Key'), {
      target: { value: 'banner_copy' }
    });
  });
  await act(/* 确认提交复制表单。 */ async () => {
    fireEvent.click(screen.getByText('确认'));
  });
  await waitFor(/* 等待创建请求触发且仅触发一次。 */ () => expect(create).toHaveBeenCalledTimes(1));
  expect(create.mock.calls[0][0]).toMatchObject({
    resourceKey: 'banner_copy',
    configData: originalConfig,
    parentResourceKey: null
  });
  expect(create.mock.calls[0][0]).not.toHaveProperty('id', 1);
  expect(resource.configData).toBe(originalConfig);
  await waitFor(/* 等待保存成功后侧栏关闭一次。 */ () => expect(onClose).toHaveBeenCalledTimes(1));
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
        onClose={/* 本用例不处理差异弹窗关闭。 */ () => undefined}
      />
    );
    fireEvent.click(
      within(
        screen.getByTestId(type === 'CREATE' ? 'diff-before' : 'diff-after')
      ).getByText('复制')
    );
    await waitFor(/* 等待空配置复制为空文本。 */ () => expect(writeText).toHaveBeenCalledWith(''));
    fireEvent.click(
      within(
        screen.getByTestId(type === 'CREATE' ? 'diff-after' : 'diff-before')
      ).getByText('复制')
    );
    await waitFor(/* 等待另一侧复制也完成。 */ () => expect(writeText).toHaveBeenCalledTimes(2));
    expect(JSON.parse(writeText.mock.calls[1][0])).toEqual({
      resourceName: '首页横幅',
      configData: JSON.parse(originalConfig)
    });
  }
);
it('Diff复制等待真实clipboard成功，失败仅显示失败反馈', async () => {
  let resolveWrite!: () => void;
  const pending = new Promise<void>(/* 捕获剪贴板写入的完成方法，便于测试控制异步结果。 */ (resolve) => {
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
      onClose={/* 本用例不处理差异弹窗关闭。 */ () => undefined}
    />
  );
  const copy = within(screen.getByTestId('diff-after')).getByText('复制');
  fireEvent.click(copy);
  expect(success).not.toHaveBeenCalled();
  await act(/* 完成挂起的剪贴板写入，允许检查成功提示。 */ async () => resolveWrite());
  expect(success).toHaveBeenCalledTimes(1);
  fireEvent.click(copy);
  await waitFor(/* 等待拒绝的写入产生复制失败提示。 */ () => expect(error).toHaveBeenCalledWith('复制失败，请重试'));
  expect(success).toHaveBeenCalledTimes(1);
});
