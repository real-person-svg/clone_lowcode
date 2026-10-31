import { useResourceService } from './fixture';
import { input } from './input';

const fixture = useResourceService();

it('默认启用，有效唯一性按业务线、Key、环境隔离，软删历史保留', () => {
  const first = fixture.service.create(input());
  expect(first.status).toBe(1);
  expect(/* 重复创建同身份资源，验证唯一性约束。 */ () => fixture.service.create(input())).toThrow('相同');
  expect(fixture.service.create(input({ bizId: 7356 })).id).not.toBe(first.id);
  expect(fixture.service.create(input({ env: 'online' })).id).not.toBe(first.id);
  fixture.service.delete(first.id);
  const recreated = fixture.service.create(input());
  expect(recreated.id).not.toBe(first.id);
  expect(fixture.service.logs(first.id).total).toBe(2);
});

it('组合筛选与分页total一致，LIKE通配字符按字面搜索', () => {
  for (let i = 0; i < 12; i++)
    fixture.service.create(
      input({
        resourceKey: 'home_' + i,
        resourceName: i < 11 ? '首页' + i : '侧栏'
      })
    );
  expect(
    fixture.service.list({
      resourceName: '首页',
      env: 'ppe',
      bizId: [3006],
      creator: 'local',
      page: 2,
      pageSize: 5
    })
  ).toMatchObject({ total: 11, page: 2, pageSize: 5 });
  expect(fixture.service.list({ resourceKey: 'home_', pageSize: 5 }).total).toBe(12);
  expect(fixture.service.list({ resourceKey: '%' }).total).toBe(0);
  expect(fixture.service.list({ bizId: [7356] }).total).toBe(0);
});

it('online启用不能删，禁用后可以删除', () => {
  const online = fixture.service.create(input({ env: 'online' }));
  expect(/* 删除线上启用记录，断言业务禁止该操作。 */ () => fixture.service.delete(online.id)).toThrow('不能删除');
  fixture.service.updateStatus(online.id, 0);
  fixture.service.delete(online.id);
  expect(/* 读取已软删除资源，断言默认详情不可见。 */ () => fixture.service.detail(online.id)).toThrow('不存在');
  expect(fixture.service.logs(online.id).total).toBe(3);
});

it('更新保留配置与高级字段，检测陈旧revision并禁止身份漂移', () => {
  const resource = fixture.service.create(
    input({
      showReco: 1,
      abExperimentOptionEnabled: 1,
      versionLimit: '[{"platform":"ios","operator":">=","version":"1.2.*"}]',
      extra: '{"custom":true}',
      configData:
        '{"content":[{"type":"FormInput","path":"config.title","label":"标题"}]}'
    })
  );
  const updated = fixture.service.update(resource.id, {
    resourceName: '新版',
    revision: resource.revision
  });
  expect(updated.configData).toBe(resource.configData);
  expect(updated.showReco).toBe(1);
  expect(updated.extra).toBe(resource.extra);
  expect(/* 用旧修订号覆盖资源，断言并发冲突。 */ () =>
    fixture.service.update(resource.id, {
      resourceName: '覆盖',
      revision: resource.revision
    })
  ).toThrow('已被修改');
  expect(/* 修改不可变 Key，断言身份约束。 */ () => fixture.service.update(resource.id, { resourceKey: 'new_key' })).toThrow(
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
    expect(/* 创建含非法字段的资源，断言完整输入校验。 */ () => fixture.service.create(input(fields))).toThrow();
  expect(fixture.service.list({}).total).toBe(0);
  expect(
    (
      fixture.db
        .prepare('SELECT count(*) AS n FROM resource_placement_operations')
        .get() as { n: number }
    ).n
  ).toBe(0);
});

it.each([null, '', '   '])(
  '更新清空必填示例图 %j 失败，保留资源、revision和日志',
  (exampleImage) => {
    const resource = fixture.service.create(input());
    const logs = fixture.service.logs(resource.id);
    expect(/* 清空已有示例图，断言失败且不产生额外写入。 */ () => fixture.service.update(resource.id, { exampleImage })).toThrow(
      '请上传资源位示例图'
    );
    expect(fixture.service.detail(resource.id)).toEqual(resource);
    expect(fixture.service.logs(resource.id)).toEqual(logs);
  }
);

it('配置查询当前环境优先、online兜底，仅返回启用资源', () => {
  const online = fixture.service.create(input({ env: 'online' })),
    source = fixture.service.create(input());
  expect(
    fixture.service.getResourceConfig(3006, 'home_banner', 'ppe_test').resource?.id
  ).toBe(source.id);
  fixture.service.updateStatus(source.id, 0);
  expect(
    fixture.service.getResourceConfig(3006, 'home_banner', 'ppe_test').resource?.id
  ).toBe(online.id);
  fixture.service.updateStatus(online.id, 0);
  expect(fixture.service.getResourceConfig(3006, 'home_banner', 'ppe_test')).toEqual({
    configured: false
  });
  fixture.service.delete(source.id);
  expect(fixture.service.getResourceConfig(7356, 'home_banner', 'online')).toEqual({
    configured: false
  });
});
