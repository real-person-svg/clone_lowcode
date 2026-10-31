// @vitest-environment jsdom
import { vi } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { useCodeModalSnapshot } from '../../../../src/resource-placement/editor/code/useCodeModalSnapshot';

const mockMount = vi.fn();
const mockDispose = vi.fn();
const mockSetValue = vi.fn();
let mockEditorProps: { value: string; onChange: (value: string) => void } = {
  value: '',
  /* 提供默认空输入回调，避免测试编辑器在挂载时依赖外部处理器。 */
  onChange: () => undefined
};
let mockModelValue = '';

vi.mock('@monaco-editor/react',
  /* 以可记录模型读写的替身隔离 Monaco，检查生命周期与文档同步。 */
  () => ({
    __esModule: true,
    /* 模拟 Monaco 编辑器，暴露模型值并转发文本输入。 */
    default: function MockEditor(props: any) {
      mockEditorProps = props;
      React.useLayoutEffect(
        /* 挂载时同步模型值，记录挂载并提供最小编辑器 API。 */
        () => {
          mockModelValue = props.value;
          mockMount();
          props.onMount(
            {
              /* 返回模拟文本模型，供文档切换调用。 */
              getModel: () => ({
                /* 记录程序写入并触发 change，验证同步过程不会误发布用户变更。 */
                setValue: (value: string) => {
                  mockSetValue(value);
                  mockModelValue = value;
                  mockEditorProps.onChange(value);
                }
              }),
              /* 返回模拟模型当前文本。 */
              getValue: () => mockModelValue,
              setValue: mockSetValue,
              setPosition: vi.fn(),
              setScrollTop: vi.fn()
            },
            {
              editor: { setModelLanguage: vi.fn(), setTheme: vi.fn() },
              languages: {
                json: { jsonDefaults: { setDiagnosticsOptions: vi.fn(), setModeConfiguration: vi.fn() } }
              }
            }
          );
          return mockDispose;
        }, []);
      return <textarea value={props.value} onChange={
        /* 将测试输入事件转交编辑器的 onChange。 */
        (e) => props.onChange(e.target.value)} />;
    }
  }));

vi.mock('@douyinfe/semi-ui',
  /* 用轻量弹窗和透传字段包装替代无关 UI。 */
  () => ({
    /* 保留弹窗子内容，便于检查编辑器状态。 */
    Modal: ({ children }: any) => <div>{children}</div>,
    /* 透传被包装组件，隔离 Semi 字段注册。 */
    withField: (Component: any) => Component
  }));

import CodeEditor, { FormCodeEditor } from '../../../../src/resource-placement/editor/code/CodeEditor';
vi.mock('../../../../src/resource-placement/editor/code/monaco',
  /* 跳过 Worker 初始化，避免 jsdom 创建真实 Monaco Worker。 */
  () => ({}));
let root: Root, container: HTMLDivElement;
beforeEach(
  /* 初始化虚拟定时器、React 测试环境和挂载根节点。 */
  () => {
    vi.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });
afterEach(
  /* 卸载测试根节点，清除容器并恢复真实定时器。 */
  () => {
    act(
      /* 在 act 内完成组件卸载及清理。 */
      () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

test('snapshot is generated only when opened and each new session captures the latest configuration', () => {
  const serialize = vi.fn(
    /* 原样返回输入版本，并记录快照生成次数。 */
    (version: string) => version);
  let modal!: ReturnType<typeof useCodeModalSnapshot>;
  /** 暴露代码弹窗 Hook，供用例控制不同版本。 */
  const Host = ({ version }: { version: string }) => {
    modal = useCodeModalSnapshot(
      /* 将本次渲染版本交给快照生成器。 */
      () => serialize(version));
    return null;
  };
  act(
    /* 渲染初始版本 A。 */
    () => root.render(<Host version="A" />));
  act(
    /* 更新到版本 B，检查关闭期间不生成快照。 */
    () => root.render(<Host version="B" />));
  expect(serialize).not.toHaveBeenCalled();
  act(
    /* 打开弹窗并捕获当前版本。 */
    () => modal.open());
  expect(modal.snapshot).toBe('B');
  act(
    /* 弹窗打开后更新为版本 C。 */
    () => root.render(<Host version="C" />));
  expect(modal.snapshot).toBe('B');
  act(
    /* 关闭弹窗，结束本次编辑会话。 */
    () => modal.close());
  act(
    /* 重新打开弹窗，检查捕获最新版本。 */
    () => modal.open());
  expect(modal.snapshot).toBe('C');
  expect(serialize).toHaveBeenCalledTimes(2);
});

test('a failed snapshot leaves the current session unchanged', () => {
  let modal!: ReturnType<typeof useCodeModalSnapshot>;
  /** 暴露快照生成失败场景下的弹窗状态。 */
  const Host = () => {
    modal = useCodeModalSnapshot(
      /* 模拟配置序列化失败。 */
      () => {
        throw Error('invalid config');
      });
    return null;
  };
  act(
    /* 挂载序列化失败场景。 */
    () => root.render(<Host />));
  expect(
    /* 打开弹窗以触发并断言序列化异常。 */
    () => modal.open()).toThrow('invalid config');
  expect(modal.visible).toBe(false);
  expect(modal.snapshot).toBeUndefined();
});

test('field editor reuses its instance, switches document content and suppresses programmatic writebacks', () => {
  const change = vi.fn();
  act(
    /* 挂载组件 A 的 cProps 文档。 */
    () =>
      root.render(<FormCodeEditor field="cProps" componentId="A" documentValue={'{"a":1}'} onChange={change} />)
  );
  expect(mockEditorProps.value).toBe('{\n  "a": 1\n}');
  act(
    /* 切换至空文档 B，验证旧内容不会残留。 */
    () =>
      root.render(<FormCodeEditor field="cProps" componentId="B" documentValue="" onChange={change} />)
  );
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(mockDispose).not.toHaveBeenCalled();
  expect(mockSetValue).toHaveBeenLastCalledWith('');
  expect(mockEditorProps.value).toBe('');
  expect(change).not.toHaveBeenCalled();
  act(
    /* 模拟在新文档 B 中输入 JSON。 */
    () => mockEditorProps.onChange('{"b":2}'));
  expect(change).toHaveBeenCalledWith('{"b":2}');
});

test('selection changes format nested objects without publishing and reset only that document history', () => {
  const change = vi.fn();
  const first = '{"a":{"items":[true,"text"]}}';
  const second = '{"b":2}';
  act(
    /* 挂载初始 JSON 文档 A。 */
    () => root.render(<CodeEditor documentKey="A" restProps={{ value: first, onChange: change }} />));
  expect(mockEditorProps.value).toBe(JSON.stringify(JSON.parse(first), null, 2));
  const calls = mockSetValue.mock.calls.length;
  act(
    /* 模拟用户输入尚未完成的 JSON。 */
    () => mockEditorProps.onChange('{"a":'));
  act(
    /* 回显当前文档的未完成输入，检查不会重置撤销历史。 */
    () => root.render(<CodeEditor documentKey="A" restProps={{ value: '{"a":', onChange: change }} />));
  expect(mockEditorProps.value).toBe('{"a":');
  expect(mockSetValue).toHaveBeenCalledTimes(calls);
  act(
    /* 切换到有效文档 B，检查模型重置。 */
    () => root.render(<CodeEditor documentKey="B" restProps={{ value: second, onChange: change }} />));
  expect(mockSetValue).toHaveBeenLastCalledWith(JSON.stringify(JSON.parse(second), null, 2));
  expect(mockEditorProps.value).toBe(JSON.stringify(JSON.parse(second), null, 2));
  act(
    /* 切回带未完成文本的 A，检查按身份重置模型。 */
    () => root.render(<CodeEditor documentKey="A" restProps={{ value: '{"a":', onChange: change }} />));
  expect(mockSetValue).toHaveBeenLastCalledWith('{"a":');
  expect(mockEditorProps.value).toBe('{"a":');
  expect(change).toHaveBeenCalledTimes(1);
});

test('modal accepts an empty snapshot when reopened and cleans up deferred formatting', () => {
  act(
    /* 打开弹窗并加载初始文本。 */
    () => root.render(<CodeEditor modelConfig={{ visible: true }} initCodeValue="first" />));
  expect(mockEditorProps.value).toBe('first');
  act(
    /* 关闭弹窗但保留组件实例。 */
    () => root.render(<CodeEditor modelConfig={{ visible: false }} initCodeValue="first" />));
  expect(vi.getTimerCount()).toBe(0);
  act(
    /* 重新打开空快照，验证不会复用上轮内容。 */
    () => root.render(<CodeEditor modelConfig={{ visible: true }} initCodeValue="" />));
  expect(mockEditorProps.value).toBe('');
  act(
    /* 卸载编辑器，完成资源清理。 */
    () => root.unmount());
  expect(vi.getTimerCount()).toBe(0);
  root = createRoot(container);
});
