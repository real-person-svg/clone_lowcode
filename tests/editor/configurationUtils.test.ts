import { vi } from 'vitest';
import type { ComponentInstance } from '../../src/features/resource-placement/editor/configuration/types';
import {
  findComponentById,
  generateComponentId,
  getIsDeepComponent,
  getRequiredPropertyFields,
  validateAllComponents,
  validateRequiredProperties,
} from '../../src/features/resource-placement/editor/configuration/utils';
import { transformConfigToEditorData } from '../../src/features/resource-placement/editor/configuration/dataTransform';

/** 构造可覆盖属性的最小组件实例。 */
const component = (
  id: string,
  properties: Record<string, unknown> = {},
): ComponentInstance => ({ id, properties });

afterEach(/* 每个用例后还原时间、随机数等 spy，避免相互污染。 */ () => vi.restoreAllMocks());

test('component lookup returns the first preorder match and the original reference', () => {
  const first = component('match');
  const later = component('match');
  const parent = {
    ...component('parent'),
    children: [{ ...component('nested'), children: [first] }],
  };
  const nodes = [parent, later];
  expect(findComponentById(nodes, 'match')).toBe(first);
  expect(findComponentById(nodes, 'parent')).toBe(parent);
  expect(findComponentById(nodes, 'missing')).toBeNull();
  expect(findComponentById([], 'match')).toBeNull();
  expect(nodes[0].children![0].children![0]).toBe(first);
});

test('component IDs keep the existing timestamp and nine-character random suffix', () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  expect(generateComponentId()).toBe('component_1700000000000_4fzzzxjyl');
  expect(now).toHaveBeenCalledTimes(1);
  expect(random).toHaveBeenCalledTimes(1);
});

test('config import allocates IDs once per node in parent-before-child order', () => {
  const calls: string[] = [];
  let timestamp = 1000;
  const now = vi.spyOn(Date, 'now').mockImplementation(/* 记录并递增模拟时间，以检查 ID 生成调用顺序。 */ () => {
    calls.push('time');
    return ++timestamp;
  });
  const random = vi.spyOn(Math, 'random').mockImplementation(/* 记录随机数调用，并返回固定随机片段。 */ () => {
    calls.push('random');
    return 0.5;
  });
  const nodes = transformConfigToEditorData(JSON.stringify({
    content: [
      {
        type: 'Container',
        path: 'config.layout',
        children: [{
          type: 'ArrayContainer',
          path: 'config.rows',
          children: [{ type: 'Input', path: 'title', label: '标题' }],
        }],
      },
      { type: 'Input', path: 'config.caption', label: '文案' },
    ],
  }));
  const [parent, sibling] = nodes;
  const array = parent.children![0];
  const child = array.children![0];
  expect([parent.id, array.id, child.id, sibling.id]).toEqual([
    'component_1001_i',
    'component_1002_i',
    'component_1003_i',
    'component_1004_i',
  ]);
  expect([parent.parent, array.parent, child.parent, sibling.parent]).toEqual([
    undefined, 'component_1001_i', 'component_1002_i', undefined,
  ]);
  expect(now).toHaveBeenCalledTimes(4);
  expect(random).toHaveBeenCalledTimes(4);
  expect(calls).toEqual([
    'time', 'random', 'time', 'random', 'time', 'random', 'time', 'random',
  ]);
});

test.each([
  'Card', 'Container', 'WrapContainer', 'ArrayContainer',
  'FormCard', 'FormContainer', 'FormWrapContainer', 'FormArrayContainer',
])('%s requires path and type, while only arrays reset child paths', (type) => {
  const node = component('layout', { type });
  expect(getRequiredPropertyFields(node)).toEqual([
    { key: 'path', label: '端上读取的字段名' },
    { key: 'type', label: '组件类型' },
  ]);
  expect(validateRequiredProperties(node).errors).toEqual([
    '端上读取的字段名 不能为空',
  ]);
  expect(getIsDeepComponent(node)).toBe(
    type === 'ArrayContainer' || type === 'FormArrayContainer',
  );
});

test.each(['Input', 'FormInput', 'Unknown', 'FormFormContainer', undefined])(
  'leaf, unknown or missing type %s retains ordered title validation',
  (type) => {
    const node = component('leaf', { type, path: ' ', label: '\t' });
    expect(getRequiredPropertyFields(node)).toEqual([
      { key: 'path', label: '端上读取的字段名' },
      { key: 'type', label: '组件类型' },
      { key: 'label', label: '标题' },
    ]);
    expect(validateRequiredProperties(node).errors).toEqual(
      type
        ? ['端上读取的字段名 不能为空', '标题 不能为空']
        : ['端上读取的字段名 不能为空', '组件类型 不能为空', '标题 不能为空'],
    );
    expect(getIsDeepComponent(node)).toBe(false);
  },
);

test('required values retain falsy checks without tightening other property values', () => {
  for (const path of ['', ' \n', undefined, null, false, 0]) {
    const node = component('empty', { type: 'Input', path, label: '标题' });
    expect(validateRequiredProperties(node)).toEqual({
      valid: false,
      errors: ['端上读取的字段名 不能为空'],
      componentName: '标题',
    });
  }
  expect(validateRequiredProperties(component('legacy', {
    type: 'Input', path: [], label: {},
  }))).toEqual({ valid: true, errors: [], componentName: {} });
  expect(validateRequiredProperties(component('container', {
    type: 'Container', path: 'layout',
  }))).toEqual({ valid: true, errors: [], componentName: 'Container' });
});

test('full-tree validation preserves preorder, node references and each error order', () => {
  const first = component('first', { type: 'Container' });
  const nested = component('nested', { path: '' });
  first.children = [nested];
  const valid = component('valid', { type: 'Input', path: 'valid', label: '有效' });
  const last = component('last', { type: 'Input', path: 'last' });
  const result = validateAllComponents([first, valid, last]);
  expect(result.valid).toBe(false);
  expect(result.invalidComponents.map(/* 提取无效组件 ID，验证错误顺序符合先序遍历。 */ ({ component }) => component.id)).toEqual([
    'first', 'nested', 'last',
  ]);
  expect(result.invalidComponents[0].component).toBe(first);
  expect(result.invalidComponents[1].component).toBe(nested);
  expect(result.invalidComponents.map(/* 提取错误数组，验证各组件缺失字段的提示。 */ ({ errors }) => errors)).toEqual([
    ['端上读取的字段名 不能为空'],
    ['端上读取的字段名 不能为空', '组件类型 不能为空', '标题 不能为空'],
    ['标题 不能为空'],
  ]);
  expect(validateAllComponents([valid])).toEqual({ valid: true, invalidComponents: [] });
});
