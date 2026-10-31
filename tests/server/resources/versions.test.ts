import { useResourceService } from './fixture';
import { input } from './input';

const fixture = useResourceService();

it('子版本保留父身份和版本别名，禁止子版本继续派生，配置从空态开始', () => {
  const parent = fixture.service.create(
    input({
      configData: '{"content":[{"type":"Input","path":"config.title"}]}'
    })
  );
  const child = fixture.service.create(
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
  expect(/* 尝试对子版本再建子版本，验证只允许一层父子关系。 */ () =>
    fixture.service.create(
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
  const source = fixture.service.create(input());
  const first = fixture.service.publish(source.id, false, false);
  expect(first.success).toBe(true);
  expect(fixture.service.detail(source.id).env).toBe('ppe_test');
  const online = fixture.service.detail(first.data.id!);
  fixture.service.update(online.id, { resourceName: '线上新版本' });
  const beforeLogs = fixture.service.logs(online.id).total;
  const conflict = fixture.service.publish(source.id, false, false);
  expect(conflict.message).toBe('CONFLICT');
  expect(conflict.data).toHaveProperty('onlineUpdateTime');
  expect(fixture.service.detail(online.id).resourceName).toBe('线上新版本');
  expect(fixture.service.logs(online.id).total).toBe(beforeLogs);
  expect(fixture.service.publish(source.id, true, false).success).toBe(true);
  expect(fixture.service.detail(source.id)).toBeDefined();
  expect(fixture.service.detail(online.id).resourceName).toBe('首页横幅');
  fixture.service.publish(source.id, true, true);
  expect(/* 读取发布后已清理的来源，验证默认详情不可见。 */ () => fixture.service.detail(source.id)).toThrow('不存在');
  expect(fixture.service.logs(source.id).list[0].operationType).toBe('DELETE');
});

it('没有时间冲突时可覆盖已有online，同业务线隔离', () => {
  const online = fixture.service.create(input({ env: 'online', resourceName: '旧版' })),
    other = fixture.service.create(input({ env: 'online', bizId: 7356 })),
    source = fixture.service.create(input());
  expect(fixture.service.publish(source.id, false, false).success).toBe(true);
  expect(fixture.service.detail(online.id).resourceName).toBe('首页横幅');
  expect(fixture.service.detail(other.id).bizId).toBe(7356);
});

it('发布、目标日志和源清理在同一事务，日志失败全部回滚', () => {
  const source = fixture.service.create(input());
  fixture.db.exec(
    "CREATE TRIGGER reject_publish BEFORE INSERT ON resource_placement_operations WHEN NEW.operation_type='PUBLISH' BEGIN SELECT RAISE(ABORT,'test_log_failure'); END"
  );
  expect(/* 触发日志失败的发布，验证线上写入与来源清理一起回滚。 */ () => fixture.service.publish(source.id)).toThrow('test_log_failure');
  expect(
    fixture.service.repository.identity(3006, source.resourceKey, 'online')
  ).toBeUndefined();
  expect(fixture.service.detail(source.id).status).toBe(1);
  expect(fixture.service.logs(source.id).total).toBe(1);
});

it('同Key跨环境名称独立，较旧父行仍能按所选名称创建子版本', () => {
  const online = fixture.service.create(
    input({ env: 'online', resourceName: '线上名' })
  );
  fixture.service.create(input({ env: 'ppe_new', resourceName: '泳道名' }));
  const child = fixture.service.create(
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
  expect(fixture.service.detail(online.id).resourceName).toBe('线上名');
  expect(/* 使用不符合父 Key 与版本组合的子版本 Key，断言拒绝。 */ () =>
    fixture.service.create(
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

