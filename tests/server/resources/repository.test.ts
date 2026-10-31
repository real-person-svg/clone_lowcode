import { useResourceService } from './fixture';
import { input } from './input';

const fixture = useResourceService();

it('组合文本筛选与多个业务线时，转义字符及分页参数保持各自顺序', () => {
  const name = 'literal_%\\name';
  const first = fixture.service.create(input({ resourceKey: 'literal_first', resourceName: name }));
  const second = fixture.service.create(input({ resourceKey: 'literal_second', resourceName: name, bizId: 7356 }));
  fixture.service.create(input({ resourceKey: 'literal_decoy', resourceName: 'literal_anything_name' }));
  const deleted = fixture.service.create(input({ resourceKey: 'literal_deleted', resourceName: name }));
  fixture.service.delete(deleted.id);

  const result = fixture.service.list({
    resourceKey: 'literal_',
    resourceName: '_%\\',
    env: 'ppe_test',
    creator: 'local',
    bizId: [3006, 7356],
    page: 2,
    pageSize: 1
  });

  expect(result).toMatchObject({ total: 2, page: 2, pageSize: 1 });
  expect(result.list).toEqual([first]);
  expect(fixture.service.list({ resourceName: '_%\\', bizId: [7356] }).list).toEqual([second]);
});

it('更新时间相同时继续按 id 倒序分页，空页保留筛选后的总数', () => {
  const first = fixture.service.create(input({ resourceKey: 'same_time_first' }));
  const second = fixture.service.create(input({ resourceKey: 'same_time_second' }));
  const third = fixture.service.create(input({ resourceKey: 'same_time_third' }));
  fixture.db.prepare('UPDATE resource_placements SET updated_at=?').run('2026-01-01T00:00:00.000Z');

  const firstPage = fixture.service.list({ resourceKey: 'same_time_', page: 1, pageSize: 2 });
  const secondPage = fixture.service.list({ resourceKey: 'same_time_', page: 2, pageSize: 2 });
  const emptyPage = fixture.service.list({ resourceKey: 'same_time_', page: 3, pageSize: 2 });

  expect(firstPage.list.map((resource) => resource.id)).toEqual([third.id, second.id]);
  expect(secondPage.list.map((resource) => resource.id)).toEqual([first.id]);
  expect(emptyPage).toEqual({ list: [], total: 3, page: 3, pageSize: 2 });
});

it('操作历史按资源隔离并按版本倒序分页，前后快照保持原有内容', () => {
  const resource = fixture.service.create(input());
  const updated = fixture.service.update(resource.id, { resourceName: '第二版' });
  fixture.service.updateStatus(resource.id, 0);
  fixture.service.create(input({ resourceKey: 'unrelated' }));

  const result = fixture.service.logs(resource.id, 2, 1);
  const emptyPage = fixture.service.logs(resource.id, 4, 1);

  expect(result).toMatchObject({ total: 3, page: 2, pageSize: 1 });
  expect(result.list).toHaveLength(1);
  expect(result.list[0].operationType).toBe('UPDATE');
  expect(JSON.parse(result.list[0].oldConfig)).toEqual(resource);
  expect(JSON.parse(result.list[0].newConfig)).toEqual(updated);
  expect(emptyPage).toEqual({ list: [], total: 3, page: 4, pageSize: 1 });
});
