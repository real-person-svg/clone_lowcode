// @vitest-environment jsdom
import { vi } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { useCodeModalSnapshot } from '../../src/features/resource-placement/editor/code/useCodeModalSnapshot';

const mockMount = vi.fn();
const mockDispose = vi.fn();
const mockSetValue = vi.fn();
let mockEditorProps: { value: string; onChange: (value: string) => void } = {
  value: '',
  onChange: () => undefined
};
let mockModelValue = '';

vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: function MockEditor(props: any) {
    mockEditorProps = props;
    React.useLayoutEffect(() => {
      mockModelValue = props.value;
      mockMount();
      props.onMount(
        {
          getModel: () => ({
            setValue: (value: string) => {
              mockSetValue(value);
              mockModelValue = value;
              mockEditorProps.onChange(value);
            }
          }),
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
    return <textarea value={props.value} onChange={(e) => props.onChange(e.target.value)} />;
  }
}));

vi.mock('@douyinfe/semi-ui', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  withField: (Component: any) => Component
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires -- Register mocks before importing the editor.
import CodeEditor, { FormCodeEditor } from '../../src/features/resource-placement/editor/code/CodeEditor';
vi.mock('../../src/features/resource-placement/editor/code/monaco',()=>({}));
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

test('snapshot is generated only when opened and each new session captures the latest configuration', () => {
  const serialize = vi.fn((version: string) => version);
  let modal!: ReturnType<typeof useCodeModalSnapshot>;
  const Host = ({ version }: {version:string}) => {
    modal = useCodeModalSnapshot(() => serialize(version));
    return null;
  };
  act(() => root.render(<Host version="A" />));
  act(() => root.render(<Host version="B" />));
  expect(serialize).not.toHaveBeenCalled();
  act(() => modal.open());
  expect(modal.snapshot).toBe('B');
  act(() => root.render(<Host version="C" />));
  expect(modal.snapshot).toBe('B');
  act(() => modal.close());
  act(() => modal.open());
  expect(modal.snapshot).toBe('C');
  expect(serialize).toHaveBeenCalledTimes(2);
});

test('a failed snapshot leaves the current session unchanged', () => {
  let modal!: ReturnType<typeof useCodeModalSnapshot>;
  const Host = () => {
    modal = useCodeModalSnapshot(() => {
      throw Error('invalid config');
    });
    return null;
  };
  act(() => root.render(<Host />));
  expect(() => modal.open()).toThrow('invalid config');
  expect(modal.visible).toBe(false);
  expect(modal.snapshot).toBeUndefined();
});

test('field editor reuses its instance, switches document content and suppresses programmatic writebacks', () => {
  const change = vi.fn();
  act(() =>
    root.render(<FormCodeEditor field="cProps" componentId="A" documentValue={'{"a":1}'} onChange={change} />)
  );
  expect(mockEditorProps.value).toBe('{\n  \"a\": 1\n}');
  act(() =>
    root.render(<FormCodeEditor field="cProps" componentId="B" documentValue="" onChange={change} />)
  );
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(mockDispose).not.toHaveBeenCalled();
  expect(mockSetValue).toHaveBeenLastCalledWith('');
  expect(mockEditorProps.value).toBe('');
  expect(change).not.toHaveBeenCalled();
  act(() => mockEditorProps.onChange('{"b":2}'));
  expect(change).toHaveBeenCalledWith('{"b":2}');
});

test('selection changes format nested objects without publishing and reset only that document history', () => {
  const change = vi.fn();
  const first = '{"a":{"items":[true,"text"]}}';
  const second = '{"b":2}';
  act(() => root.render(<CodeEditor documentKey="A" restProps={{ value: first, onChange: change }} />));
  expect(mockEditorProps.value).toBe(JSON.stringify(JSON.parse(first), null, 2));
  const calls = mockSetValue.mock.calls.length;
  act(() => mockEditorProps.onChange('{"a":'));
  act(() => root.render(<CodeEditor documentKey="A" restProps={{ value: '{"a":', onChange: change }} />));
  expect(mockEditorProps.value).toBe('{"a":');
  expect(mockSetValue).toHaveBeenCalledTimes(calls);
  act(() => root.render(<CodeEditor documentKey="B" restProps={{ value: second, onChange: change }} />));
  expect(mockSetValue).toHaveBeenLastCalledWith(JSON.stringify(JSON.parse(second), null, 2));
  expect(mockEditorProps.value).toBe(JSON.stringify(JSON.parse(second), null, 2));
  act(() => root.render(<CodeEditor documentKey="A" restProps={{ value: '{"a":', onChange: change }} />));
  expect(mockSetValue).toHaveBeenLastCalledWith('{"a":');
  expect(mockEditorProps.value).toBe('{"a":');
  expect(change).toHaveBeenCalledTimes(1);
});

test('modal accepts an empty snapshot when reopened and cleans up deferred formatting', () => {
  act(() => root.render(<CodeEditor modelConfig={{ visible: true }} initCodeValue="first" />));
  expect(mockEditorProps.value).toBe('first');
  act(() => root.render(<CodeEditor modelConfig={{ visible: false }} initCodeValue="first" />));
  expect(vi.getTimerCount()).toBe(0);
  act(() => root.render(<CodeEditor modelConfig={{ visible: true }} initCodeValue="" />));
  expect(mockEditorProps.value).toBe('');
  act(() => root.unmount());
  expect(vi.getTimerCount()).toBe(0);
  root = createRoot(container);
});
