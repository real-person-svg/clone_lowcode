import { useResourceService } from './fixture';
import { input } from './input';

const fixture = useResourceService();

it('回滚恢复选中操作后的快照并追加历史，删除操作无快照时明确失败', () => {
  const resource = fixture.service.create(input());
  fixture.service.update(resource.id, { resourceName: '版本二' });
  const selected = fixture.service.logs(resource.id).list[0];
  fixture.service.update(resource.id, { resourceName: '版本三' });
  expect(fixture.service.roll(resource.id, selected.versionId).resourceName).toBe(
    '版本二'
  );
  expect(fixture.service.logs(resource.id).list[0].operationType).toBe('ROLL');
  expect(fixture.service.logs(resource.id).total).toBe(4);
  fixture.service.delete(resource.id);
  const deleted = fixture.service.logs(resource.id).list[0];
  expect(() => fixture.service.roll(resource.id, deleted.versionId)).toThrow(
    '没有可恢复'
  );
  expect(() => fixture.service.roll(resource.id, 99999)).toThrow('没有可恢复');
});

it('回滚唯一性失败不会改变资源或历史', () => {
  const resource = fixture.service.create(input());
  const selected = fixture.service.logs(resource.id).list[0];
  fixture.service.update(resource.id, { env: 'ppe_other' });
  fixture.service.create(input());
  const before = fixture.service.detail(resource.id),
    logs = fixture.service.logs(resource.id).total;
  expect(() => fixture.service.roll(resource.id, selected.versionId)).toThrow('相同');
  expect(fixture.service.detail(resource.id)).toEqual(before);
  expect(fixture.service.logs(resource.id).total).toBe(logs);
});

