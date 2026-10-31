// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import RowActions, {
  type RowActionHandlers
} from '../../../src/resource-placement/list/table/RowActions';
import { resource } from './fixtures';

/** 为每个行操作创建独立 spy，便于检查传参与触发次数。 */
const handlers = (): RowActionHandlers => ({
  onEdit: vi.fn(),
  onConfigure: vi.fn(),
  onLogs: vi.fn(),
  onPublish: vi.fn(),
  onToggle: vi.fn(),
  onRemove: vi.fn()
});

afterEach(cleanup);

it.each([
  {
    env: 'ppe_test',
    status: 1 as const,
    parentResourceKey: null,
    publish: true,
    child: true,
    remove: true
  },
  {
    env: 'online',
    status: 1 as const,
    parentResourceKey: null,
    publish: false,
    child: true,
    remove: false
  },
  {
    env: 'ppe_test',
    status: 0 as const,
    parentResourceKey: 'parent',
    publish: true,
    child: false,
    remove: true
  },
  {
    env: 'online',
    status: 0 as const,
    parentResourceKey: 'parent',
    publish: false,
    child: false,
    remove: true
  }
])('$env/$status/$parentResourceKey 保持业务操作显示条件', (scenario) => {
  render(<RowActions {...handlers()} record={{ ...resource, ...scenario }} />);
  expect(Boolean(screen.queryByRole('button', { name: '发布上线' }))).toBe(
    scenario.publish
  );
  expect(Boolean(screen.queryByRole('button', { name: '添加子版本' }))).toBe(
    scenario.child
  );
  expect(Boolean(screen.queryByRole('button', { name: '删除' }))).toBe(
    scenario.remove
  );
  expect(
    screen.getByRole('button', {
      name: scenario.status === 1 ? '禁用' : '启用'
    })
  ).toBeTruthy();
  for (const name of ['基础信息', '表单配置', '操作日志', '复制']) {
    expect(screen.getByRole('button', { name })).toBeTruthy();
  }
});

it('每个操作仍作用于当前资源位，发布 loading 不改变目标', () => {
  const actions = handlers();
  const record = { ...resource, id: 42 };
  render(<RowActions {...actions} publishingId={42} record={record} />);
  fireEvent.click(screen.getByRole('button', { name: '基础信息' }));
  fireEvent.click(screen.getByRole('button', { name: '添加子版本' }));
  fireEvent.click(screen.getByRole('button', { name: '复制' }));
  expect(actions.onEdit).toHaveBeenNthCalledWith(1, 'edit', record);
  expect(actions.onEdit).toHaveBeenNthCalledWith(2, 'child', record);
  expect(actions.onEdit).toHaveBeenNthCalledWith(3, 'copy', record);
  fireEvent.click(screen.getByRole('button', { name: '表单配置' }));
  fireEvent.click(screen.getByRole('button', { name: '操作日志' }));
  expect(actions.onConfigure).toHaveBeenCalledWith(42);
  expect(actions.onLogs).toHaveBeenCalledWith(42);
  fireEvent.click(screen.getByRole('button', { name: '禁用' }));
  fireEvent.click(screen.getByRole('button', { name: '删除' }));
  expect(actions.onToggle).toHaveBeenCalledWith(record);
  expect(actions.onRemove).toHaveBeenCalledWith(record);
  expect(screen.getByRole('button', { name: '发布上线' }).className).toContain(
    'loading'
  );
});
