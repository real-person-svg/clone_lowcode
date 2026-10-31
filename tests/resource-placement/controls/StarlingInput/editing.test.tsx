// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import StarlingInput from '../../../../src/resource-placement/controls/StarlingInput';
import type { StarlingValue } from '../../../../src/resource-placement/controls/StarlingInput/types';

vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect() {},
    drawImage() {},
    measureText() { return { width: 0 }; }
  })) as any;
});

const value: StarlingValue = {
  $fieldType: 'STARLING_FIELD',
  type: 'STARLING',
  value: 'greeting',
  variables: [{ type: 1, key: 'name', value: 'original' }],
  languages: { en: 'Hello', 'zh-Hans': '你好' }
};

afterEach(cleanup);

test('variable edits commit only on confirmation and retain the other persisted fields', async () => {
  const change = vi.fn();
  render(<StarlingInput value={value} onChange={change} />);
  fireEvent.click(screen.getByText('设置变量'));
  fireEvent.change(await screen.findByPlaceholderText('变量值'), { target: { value: 'updated' } });
  expect(change).not.toHaveBeenCalled();

  fireEvent.click(screen.getByText('确定'));
  await waitFor(() => expect(change).toHaveBeenCalledWith({
    ...value,
    variables: [{ type: 1, key: 'name', value: 'updated' }]
  }));
});

test('cancel discards the draft, and reopening reloads the current external value', async () => {
  const change = vi.fn();
  render(<StarlingInput value={value} onChange={change} />);
  fireEvent.click(screen.getByText('设置变量'));
  fireEvent.change(await screen.findByPlaceholderText('变量名'), { target: { value: 'discarded' } });
  fireEvent.click(screen.getByText('取消'));
  expect(change).not.toHaveBeenCalled();

  await act(async () => fireEvent.click(screen.getByText('设置变量')));
  expect((await screen.findByPlaceholderText('变量名') as HTMLInputElement).value).toBe('name');
});

test('language drafts preserve insertion order and omit unselected language rows on confirmation', async () => {
  const change = vi.fn();
  render(<StarlingInput value={value} onChange={change} />);
  fireEvent.click(screen.getByText('本地语言值'));
  const inputs = await screen.findAllByPlaceholderText('本地语言值');
  fireEvent.change(inputs[1], { target: { value: '新的文案' } });
  fireEvent.click(screen.getByText('添加语言'));
  fireEvent.click(screen.getByText('确定'));

  await waitFor(() => expect(change).toHaveBeenCalledWith({
    ...value,
    languages: { en: 'Hello', 'zh-Hans': '新的文案' }
  }));
});
