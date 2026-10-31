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
    },
  })) as any;
});
vi.mock('./CodeEditor', async () => {
  const { Form } = await import('@douyinfe/semi-ui');
  return {
    FormCodeEditor: ({ componentId, documentValue, ...props }: any) => (
      <Form.Input {...props} />
    ),
  };
});
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import PropertyPanel from './PropertyPanel';
import { patchTreeNode, insertTreeNode } from './componentTree';
import {
  transformEditorDataToConfig,
  transformConfigToEditorData,
} from './dataTransform';
import { PropertyConfigManager } from './PropertyConfigManager';
import type { ComponentInstance } from './types';
const leaf: ComponentInstance = {
  id: 'leaf',
  properties: { type: 'FormInput', path: 'title', label: '标题' },
};
afterEach(cleanup);
let current: ComponentInstance;
const Host = ({ initial }: { initial: ComponentInstance }) => {
  const [nodes, setNodes] = React.useState([initial]);
  current = nodes[0];
  return (
    <PropertyPanel
      selectedComponent={nodes[0]}
      onUpdateComponent={(id, updates) =>
        setNodes((previous) => patchTreeNode(previous, id, updates))
      }
    />
  );
};
const typeSelect = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.semi-form-field'))
    .find((field) =>
      field.querySelector('label')?.textContent?.includes('组件类型'),
    )!
    .querySelector('.semi-select')!;
async function selectType(container: HTMLElement, label: string) {
  await act(async () => {
    fireEvent.click(typeSelect(container));
  });
  const option = Array.from(
    document.querySelectorAll('.semi-select-option'),
  ).find((item) => item.textContent === label)!;
  expect(option).toBeTruthy();
  await act(async () => {
    fireEvent.click(option);
  });
}

test('real property type selection converts leaf to empty container and an empty container back to leaf', async () => {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<Host initial={leaf} />);
  });
  await selectType(result.container, '容器');
  expect(current.properties.type).toBe('Container');
  expect(current.children).toEqual([]);
  const reloaded = transformConfigToEditorData(
    JSON.stringify(transformEditorDataToConfig([current])),
  );
  expect(reloaded[0].children).toEqual([]);
  await selectType(result.container, '输入框');
  expect(current.properties.type).toBe('FormInput');
  expect(current.children).toBeUndefined();
  expect(() => transformEditorDataToConfig([current])).not.toThrow();
});
test('a populated container keeps its children, disables leaf choices and explains the action', async () => {
  const initial = insertTreeNode(
    [
      {
        ...leaf,
        properties: { ...leaf.properties, type: 'Container' },
        children: [],
      },
    ],
    {
      id: 'child',
      properties: { type: 'FormInput', path: 'child', label: '子项' },
    },
    'leaf',
  )[0];
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<Host initial={initial} />);
  });
  expect(result.container.textContent).toContain('请先移出或删除子组件');
  const options = PropertyConfigManager.getBaseProperties(current).find(
    (field) => field.key === 'type',
  )!.props!.optionList!;
  expect(options.find((option) => option.value === 'FormInput')?.disabled).toBe(
    true,
  );
  expect(options.find((option) => option.value === 'Card')?.disabled).toBe(
    false,
  );
  await selectType(result.container, '输入框');
  expect(current.properties.type).toBe('Container');
  expect(current.children).toHaveLength(1);
  const reopened = transformConfigToEditorData(
    JSON.stringify(transformEditorDataToConfig([current])),
  );
  expect(reopened[0].children).toHaveLength(1);
});
