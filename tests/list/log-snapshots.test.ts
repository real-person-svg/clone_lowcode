import { vi } from 'vitest';
import {
  formatDiffConfig,
  parseLogSnapshot
} from '../../src/features/resource-placement/list/operation-logs/snapshots';

afterEach(/* 每个用例后恢复日志 spy，避免污染后续断言。 */ () => vi.restoreAllMocks());

it('日志仅过滤六个顶层审计字段，保留业务字段、嵌套同名字段和原始输入', () => {
  const text = '{"creator":"a","updater":"b","createdAt":"c","updatedAt":"d","revision":8,"from":"数据库","id":3,"status":0,"extra":{"creator":"nested","revision":2}}';
  expect(parseLogSnapshot(text)).toEqual({
    id: 3,
    status: 0,
    extra: { creator: 'nested', revision: 2 }
  });
  expect(JSON.parse(text)).toHaveProperty('creator', 'a');
  expect(parseLogSnapshot('')).toBeUndefined();
  expect(/* 解析损坏快照，以断言解析错误没有被隐藏。 */ () => parseLogSnapshot('{')).toThrow(SyntaxError);
});

it('Diff解析配置JSON，递归排列对象键但保持数组顺序和标量值', () => {
  expect(formatDiffConfig({
    resourceName: '测试',
    other: '{"z":1}',
    configData: '{"z":null,"a":[{"z":2,"a":false},{"z":1,"a":0}]}'
  })).toBe(`{
  "configData": {
    "a": [
      {
        "a": false,
        "z": 2
      },
      {
        "a": 0,
        "z": 1
      }
    ],
    "z": null
  },
  "other": "{\\"z\\":1}",
  "resourceName": "测试"
}`);
});

it('无效嵌套JSON保持原文，缺失侧和两侧空态的文本仍为空', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(/* 屏蔽预期的历史配置解析日志，并通过 spy 验证记录。 */ () => undefined);
  expect(formatDiffConfig({ configData: '{broken' })).toBe(`{
  "configData": "{broken"
}`);
  expect(log).toHaveBeenCalledWith('lxy parse diff configData error=== ', expect.any(SyntaxError));
  for (const missing of [undefined, null, false, '', 0]) {
    expect(formatDiffConfig(missing)).toBe('');
  }
  expect(formatDiffConfig({})).toBe('{}');
});

it.each([
  [null, '{\n  "configData": null\n}'],
  [false, '{\n  "configData": false\n}'],
  [0, '{\n  "configData": 0\n}'],
  ['null', '{\n  "configData": null\n}'],
  ['false', '{\n  "configData": false\n}']
])('非对象配置值 %j 保留其JSON含义', (configData, expected) => {
  expect(formatDiffConfig({ configData })).toBe(expected);
});

it('格式转换不改变传入对象和数组', () => {
  const rows = Object.freeze([Object.freeze({ z: 2, a: 1 }), Object.freeze({ z: 1, a: 2 })]);
  const configData = Object.freeze({ z: 0, a: rows });
  const snapshot = Object.freeze({ resourceName: '测试', configData });
  expect(/* 格式化冻结快照，验证不会尝试原地修改。 */ () => formatDiffConfig(snapshot)).not.toThrow();
  expect(snapshot.configData).toBe(configData);
  expect(configData.a).toBe(rows);
  expect(Object.keys(rows[0])).toEqual(['z', 'a']);
  expect(rows.map(/* 提取数组中业务字段，确认排序没有改变数组顺序。 */ (row) => row.z)).toEqual([2, 1]);
});
