import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../server/db';
import { ResourceRepository } from '../server/repositories/resources';
import { ResourceService } from '../server/services/resources';
import type { ResourceInput } from '../shared/types';
let dir: string,
  db: ReturnType<typeof openDatabase>,
  service: ResourceService,
  tick: number;
const input = (overrides: Partial<ResourceInput> = {}): ResourceInput => ({
  resourceKey: 'home_banner',
  resourceName: '首页横幅',
  bizId: 3006,
  env: 'ppe_test',
  directoryPath: '首页',
  exampleImage: '/uploads/example.png',
  ...overrides
});
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'resource-service-'));
  db = openDatabase(join(dir, 'resource.sqlite'));
  tick = 0;
  service = new ResourceService(new ResourceRepository(db), () =>
    new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString()
  );
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});
it('只初始化结构，重复迁移不重置数据，重启可恢复配置', () => {
  for (const table of [
    'resource_placements',
    'resource_placement_operations',
    'assets'
  ])
    expect(
      (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number })
        .n
    ).toBe(0);
  const created = service.create(
    input({
      configData: JSON.stringify({
        content: [{ type: 'Input', path: 'config.title', isShow: false }]
      })
    })
  );
  db.close();
  db = openDatabase(join(dir, 'resource.sqlite'));
  service = new ResourceService(new ResourceRepository(db));
  expect(service.detail(created.id).configData).toContain('config.title');
  expect(service.logs(created.id).total).toBe(1);
});
it('默认启用，有效唯一性按业务线、Key、环境隔离，软删历史保留', () => {
  const first = service.create(input());
  expect(first.status).toBe(1);
  expect(() => service.create(input())).toThrow('相同');
  expect(service.create(input({ bizId: 7356 })).id).not.toBe(first.id);
  expect(service.create(input({ env: 'online' })).id).not.toBe(first.id);
  service.delete(first.id);
  const recreated = service.create(input());
  expect(recreated.id).not.toBe(first.id);
  expect(service.logs(first.id).total).toBe(2);
});
it('组合筛选与分页total一致，LIKE通配字符按字面搜索', () => {
  for (let i = 0; i < 12; i++)
    service.create(
      input({
        resourceKey: 'home_' + i,
        resourceName: i < 11 ? '首页' + i : '侧栏'
      })
    );
  expect(
    service.list({
      resourceName: '首页',
      env: 'ppe',
      bizId: [3006],
      creator: 'local',
      page: 2,
      pageSize: 5
    })
  ).toMatchObject({ total: 11, page: 2, pageSize: 5 });
  expect(service.list({ resourceKey: 'home_', pageSize: 5 }).total).toBe(12);
  expect(service.list({ resourceKey: '%' }).total).toBe(0);
  expect(service.list({ bizId: [7356] }).total).toBe(0);
});
it('online启用不能删，禁用后可以删除', () => {
  const online = service.create(input({ env: 'online' }));
  expect(() => service.delete(online.id)).toThrow('不能删除');
  service.updateStatus(online.id, 0);
  service.delete(online.id);
  expect(() => service.detail(online.id)).toThrow('不存在');
  expect(service.logs(online.id).total).toBe(3);
});
it('更新保留配置与高级字段，检测陈旧revision并禁止身份漂移', () => {
  const resource = service.create(
    input({
      showReco: 1,
      abExperimentOptionEnabled: 1,
      versionLimit: '[{"platform":"ios","operator":">=","version":"1.2.*"}]',
      extra: '{"custom":true}',
      configData:
        '{"content":[{"type":"FormInput","path":"config.title","label":"标题"}]}'
    })
  );
  const updated = service.update(resource.id, {
    resourceName: '新版',
    revision: resource.revision
  });
  expect(updated.configData).toBe(resource.configData);
  expect(updated.showReco).toBe(1);
  expect(updated.extra).toBe(resource.extra);
  expect(() =>
    service.update(resource.id, {
      resourceName: '覆盖',
      revision: resource.revision
    })
  ).toThrow('已被修改');
  expect(() => service.update(resource.id, { resourceKey: 'new_key' })).toThrow(
    '不可修改'
  );
});
it('拒绝非法配置、JSON字段、版本限制和必填基础字段，失败不创建记录', () => {
  for (const fields of [
    { configData: '{"content":{}}' },
    { extra: '[]' },
    { versionLimit: '[{"platform":"ios"}]' },
    { exampleImage: null },
    { directoryPath: '' },
    { resourceKey: 'bad key' }
  ])
    expect(() => service.create(input(fields))).toThrow();
  expect(service.list({}).total).toBe(0);
  expect(
    (
      db
        .prepare('SELECT count(*) AS n FROM resource_placement_operations')
        .get() as { n: number }
    ).n
  ).toBe(0);
});
it('子版本保留父身份和版本别名，禁止子版本继续派生，配置从空态开始', () => {
  const parent = service.create(
    input({
      configData: '{"content":[{"type":"Input","path":"config.title"}]}'
    })
  );
  const child = service.create(
    input({
      resourceKey: parent.resourceKey + '_v1',
      resourceName: parent.resourceName + '_v1',
      parentResourceKey: parent.resourceKey,
      version: 'v1',
      versionAlias: '实验版',
      configData: parent.configData
    })
  );
  expect(child.configData).toBe('{"content":[]}');
  expect(child.versionAlias).toBe('实验版');
  expect(() =>
    service.create(
      input({
        resourceKey: child.resourceKey + '_v2',
        resourceName: child.resourceName + '_v2',
        parentResourceKey: child.resourceKey,
        version: 'v2'
      })
    )
  ).toThrow('非子版本');
});
it('发布到online、保留泳道，冲突确认前不改变线上数据，强制发布保持清理选择', () => {
  const source = service.create(input());
  const first = service.publish(source.id, false, false);
  expect(first.success).toBe(true);
  expect(service.detail(source.id).env).toBe('ppe_test');
  const online = service.detail(first.data.id!);
  service.update(online.id, { resourceName: '线上新版本' });
  const beforeLogs = service.logs(online.id).total;
  const conflict = service.publish(source.id, false, false);
  expect(conflict.message).toBe('CONFLICT');
  expect(conflict.data).toHaveProperty('onlineUpdateTime');
  expect(service.detail(online.id).resourceName).toBe('线上新版本');
  expect(service.logs(online.id).total).toBe(beforeLogs);
  expect(service.publish(source.id, true, false).success).toBe(true);
  expect(service.detail(source.id)).toBeDefined();
  expect(service.detail(online.id).resourceName).toBe('首页横幅');
  service.publish(source.id, true, true);
  expect(() => service.detail(source.id)).toThrow('不存在');
  expect(service.logs(source.id).list[0].operationType).toBe('DELETE');
});
it('没有时间冲突时可覆盖已有online，同业务线隔离', () => {
  const online = service.create(input({ env: 'online', resourceName: '旧版' })),
    other = service.create(input({ env: 'online', bizId: 7356 })),
    source = service.create(input());
  expect(service.publish(source.id, false, false).success).toBe(true);
  expect(service.detail(online.id).resourceName).toBe('首页横幅');
  expect(service.detail(other.id).bizId).toBe(7356);
});
it('发布、目标日志和源清理在同一事务，日志失败全部回滚', () => {
  const source = service.create(input());
  db.exec(
    "CREATE TRIGGER reject_publish BEFORE INSERT ON resource_placement_operations WHEN NEW.operation_type='PUBLISH' BEGIN SELECT RAISE(ABORT,'test_log_failure'); END"
  );
  expect(() => service.publish(source.id)).toThrow('test_log_failure');
  expect(
    service.repository.identity(3006, source.resourceKey, 'online')
  ).toBeUndefined();
  expect(service.detail(source.id).status).toBe(1);
  expect(service.logs(source.id).total).toBe(1);
});
it('更新与日志在同一事务，日志失败保持原值和revision', () => {
  const resource = service.create(input());
  db.exec(
    "CREATE TRIGGER reject_update BEFORE INSERT ON resource_placement_operations WHEN NEW.operation_type='UPDATE' BEGIN SELECT RAISE(ABORT,'test_log_failure'); END"
  );
  expect(() =>
    service.update(resource.id, { resourceName: '不应保存' })
  ).toThrow();
  expect(service.detail(resource.id)).toEqual(resource);
  expect(service.logs(resource.id).total).toBe(1);
});
it('回滚恢复选中操作后的快照并追加历史，删除操作无快照时明确失败', () => {
  const resource = service.create(input());
  service.update(resource.id, { resourceName: '版本二' });
  const selected = service.logs(resource.id).list[0];
  service.update(resource.id, { resourceName: '版本三' });
  expect(service.roll(resource.id, selected.versionId).resourceName).toBe(
    '版本二'
  );
  expect(service.logs(resource.id).list[0].operationType).toBe('ROLL');
  expect(service.logs(resource.id).total).toBe(4);
  service.delete(resource.id);
  const deleted = service.logs(resource.id).list[0];
  expect(() => service.roll(resource.id, deleted.versionId)).toThrow(
    '没有可恢复'
  );
  expect(() => service.roll(resource.id, 99999)).toThrow('没有可恢复');
});
it('回滚唯一性失败不会改变资源或历史', () => {
  const resource = service.create(input());
  const selected = service.logs(resource.id).list[0];
  service.update(resource.id, { env: 'ppe_other' });
  service.create(input());
  const before = service.detail(resource.id),
    logs = service.logs(resource.id).total;
  expect(() => service.roll(resource.id, selected.versionId)).toThrow('相同');
  expect(service.detail(resource.id)).toEqual(before);
  expect(service.logs(resource.id).total).toBe(logs);
});
it('配置查询当前环境优先、online兜底，仅返回启用资源', () => {
  const online = service.create(input({ env: 'online' })),
    source = service.create(input());
  expect(
    service.getResourceConfig(3006, 'home_banner', 'ppe_test').resource?.id
  ).toBe(source.id);
  service.updateStatus(source.id, 0);
  expect(
    service.getResourceConfig(3006, 'home_banner', 'ppe_test').resource?.id
  ).toBe(online.id);
  service.updateStatus(online.id, 0);
  expect(service.getResourceConfig(3006, 'home_banner', 'ppe_test')).toEqual({
    configured: false
  });
  service.delete(source.id);
  expect(service.getResourceConfig(7356, 'home_banner', 'online')).toEqual({
    configured: false
  });
});

it('同Key跨环境名称独立，较旧父行仍能按所选名称创建子版本', () => {
  const online = service.create(
    input({ env: 'online', resourceName: '线上名' })
  );
  service.create(input({ env: 'ppe_new', resourceName: '泳道名' }));
  const child = service.create(
    input({
      env: online.env,
      resourceKey: `${online.resourceKey}_v1`,
      resourceName: `${online.resourceName}_v1`,
      parentResourceKey: online.resourceKey,
      version: 'v1'
    })
  );
  expect(child.resourceName).toBe('线上名_v1');
  expect(child.parentResourceKey).toBe(online.resourceKey);
  expect(service.detail(online.id).resourceName).toBe('线上名');
  expect(() =>
    service.create(
      input({
        env: 'ppe_new',
        resourceKey: 'wrong_key',
        resourceName: '任意名称',
        parentResourceKey: online.resourceKey,
        version: 'v2'
      })
    )
  ).toThrow('子版本 Key');
});

it.each([null, '', '   '])(
  '更新清空必填示例图 %j 失败，保留资源、revision和日志',
  (exampleImage) => {
    const resource = service.create(input());
    const logs = service.logs(resource.id);
    expect(() => service.update(resource.id, { exampleImage })).toThrow(
      '请上传资源位示例图'
    );
    expect(service.detail(resource.id)).toEqual(resource);
    expect(service.logs(resource.id)).toEqual(logs);
  }
);
