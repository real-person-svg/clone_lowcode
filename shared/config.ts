export interface ConfigNode {
  type: string;
  key?: string;
  path?: string;
  children?: ConfigNode[];
  cProps?: Record<string, unknown>;
  [key: string]: unknown;
}
export interface ResourceConfig {
  content: ConfigNode[];
  [key: string]: unknown;
}
const controlTypes = new Set([
  'Card',
  'Container',
  'WrapContainer',
  'ArrayContainer',
  'Input',
  'Select',
  'Switch',
  'DatePicker',
  'CheckboxGroup',
  'RadioGroup',
  'InputNumber',
  'ColorPicker',
  'Upload',
  'InputTagPanel',
  'StarlingInput',
  'StarlingUpload',
  'StarlingSchema'
]);
const unsafeSegments = new Set(['__proto__', 'constructor', 'prototype']);
/** 拒绝字段路径中的原型相关段，避免不安全的对象路径访问。 */
function safePath(value: string) {
  return !value
    .split(/[.\[\]]+/)
    .some(/* 检测当前路径段是否属于禁止访问的名称。 */ (segment) => unsafeSegments.has(segment));
}
/** 校验导入和持久化配置共用的结构契约，不执行配置中的函数文本。 */
export function validateConfig(
  value: unknown
): asserts value is ResourceConfig {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !Array.isArray((value as ResourceConfig).content)
  )
    throw new Error('配置必须是包含 content 数组的对象');
  // 递归共用节点计数，分别限制整棵树的规模和单条路径深度，避免过大配置消耗资源。
  let count = 0;
  /** 递归校验节点类型、属性和容器结构，并限制总节点数与深度。 */
  function check(nodes: unknown[], depth: number) {
    if (depth > 50) throw new Error('配置嵌套层级超过 50');
    for (const raw of nodes) {
      if (++count > 5000) throw new Error('配置组件数量超过 5000');
      if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        throw new Error('配置组件必须是对象');
      const node = raw as ConfigNode;
      if (
        typeof node.type !== 'string' ||
        !controlTypes.has(node.type.replace(/^Form/, ''))
      )
        throw new Error(`未知组件类型：${String(node.type)}`);
      for (const field of [
        'key',
        'path',
        'label',
        'validate',
        'inputFormat',
        'outputFormat',
        'onChangeState'
      ])
        if (node[field] !== undefined && typeof node[field] !== 'string')
          throw new Error(`${field} 必须是字符串`);
      // key/path 可被表单按对象路径访问，需同时拦截点号与括号语法中的危险路径段。
      for (const field of ['key', 'path'])
        if (typeof node[field] === 'string' && !safePath(node[field] as string))
          throw new Error(`${field} 包含不允许的路径段`);
      if (
        node.isShow !== undefined &&
        typeof node.isShow !== 'string' &&
        typeof node.isShow !== 'boolean'
      )
        throw new Error('isShow 必须是布尔值或函数字符串');
      if (
        node.require !== undefined &&
        typeof node.require !== 'boolean' &&
        typeof node.require !== 'string'
      )
        throw new Error('require 必须是布尔值或函数字符串');
      if (node.asyncInject !== undefined) {
        const tuple = node.asyncInject;
        if (
          !Array.isArray(tuple) ||
          tuple.length !== 2 ||
          typeof tuple[1] !== 'string' ||
          !(
            typeof tuple[0] === 'string' ||
            (Array.isArray(tuple[0]) &&
              tuple[0].every(/* 确保异步注入的每个上下文名称都是字符串。 */ (item) => typeof item === 'string'))
          )
        )
          throw new Error('asyncInject 必须是 [string | string[], string]');
      }
      if (
        node.cProps !== undefined &&
        (!node.cProps ||
          typeof node.cProps !== 'object' ||
          Array.isArray(node.cProps))
      )
        throw new Error('cProps 必须是 JSON 对象');
      if (node.children !== undefined) {
        if (!Array.isArray(node.children))
          throw new Error('children 必须是数组');
        if (
          !['Card', 'Container', 'WrapContainer', 'ArrayContainer'].includes(
            node.type.replace(/^Form/, '')
          ) &&
          node.children.length
        )
          throw new Error('只有容器组件可以包含子组件');
        check(node.children, depth + 1);
      }
    }
  }
  check((value as ResourceConfig).content, 0);
}
/** 解析 JSON 或对象配置，空文本使用空配置，并执行结构校验。 */
export function parseConfig(value: unknown): ResourceConfig {
  const parsed: unknown =
    typeof value === 'string'
      ? value.trim()
        ? JSON.parse(value)
        : { content: [] }
      : value;
  validateConfig(parsed);
  return parsed;
}
