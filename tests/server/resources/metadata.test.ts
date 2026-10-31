import { vi } from 'vitest';
import { ResourceService } from '../../../server/services/resources';
import { useResourceService } from './fixture';
import { input } from './input';

const fixture = useResourceService();

it('更新、同状态切换、删除和恢复使用当前revision，日志保留准确的前后快照', () => {
  const author = new ResourceService(fixture.service.repository, /* 固定创建时间，供审计字段保留断言使用。 */ () => '2026-01-01T00:00:00.000Z', 'author');
  const original = author.create(input());
  const creation = author.logs(original.id).list[0];
  let tick = 10;
  const now = vi.fn(/* 让后续修改时间逐秒递增，便于检查更新元数据。 */ () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString());
  const editor = new ResourceService(author.repository, now, 'editor');

  const updated = editor.update(original.id, { resourceName: '新版', revision: original.revision });
  expect(updated).toMatchObject({
    revision: 2,
    updater: 'editor',
    updatedAt: '2026-01-01T00:00:10.000Z',
    creator: 'author',
    createdAt: '2026-01-01T00:00:00.000Z'
  });
  const updateLog = editor.logs(original.id).list[0];
  expect(JSON.parse(updateLog.oldConfig)).toEqual(original);
  expect(JSON.parse(updateLog.newConfig)).toEqual(updated);
  expect(updateLog).toMatchObject({ operationType: 'UPDATE', operator: 'editor', operationTime: updated.updatedAt });

  const enabled = editor.updateStatus(original.id, 1);
  expect(enabled).toMatchObject({ status: 1, revision: 3, updater: 'editor', updatedAt: '2026-01-01T00:00:11.000Z' });
  const enableLog = editor.logs(original.id).list[0];
  expect(enableLog.operationType).toBe('ENABLE');
  expect(JSON.parse(enableLog.oldConfig)).toEqual(updated);
  expect(JSON.parse(enableLog.newConfig)).toEqual(enabled);

  editor.delete(original.id);
  const deleted = editor.detail(original.id, true);
  expect(deleted).toMatchObject({ status: 2, revision: 4, updater: 'editor', updatedAt: '2026-01-01T00:00:12.000Z' });
  const deleteLog = editor.logs(original.id).list[0];
  expect(deleteLog).toMatchObject({ operationType: 'DELETE', newConfig: '', operator: 'editor', operationTime: deleted.updatedAt });
  expect(JSON.parse(deleteLog.oldConfig)).toEqual(enabled);

  const restored = editor.roll(original.id, creation.versionId);
  expect(restored).toEqual({
    ...original,
    revision: 5,
    updater: 'editor',
    updatedAt: '2026-01-01T00:00:13.000Z'
  });
  const rollLog = editor.logs(original.id).list[0];
  expect(rollLog).toMatchObject({ operationType: 'ROLL', operator: 'editor', operationTime: restored.updatedAt });
  expect(JSON.parse(rollLog.oldConfig)).toEqual(deleted);
  expect(JSON.parse(rollLog.newConfig)).toEqual(restored);
  expect(now).toHaveBeenCalledTimes(4);
});

it('首次发布的线上行从revision 1开始，源清理与目标日志共享一次取时', () => {
  const author = new ResourceService(fixture.service.repository, /* 固定来源创建时间。 */ () => '2026-01-01T00:00:00.000Z', 'author');
  let source = author.create(input());
  source = author.update(source.id, { resourceName: '准备发布' });
  source = author.updateStatus(source.id, 1);
  const now = vi.fn(/* 固定首次发布到线上的时间。 */ () => '2026-01-01T00:00:50.000Z');
  const publisher = new ResourceService(author.repository, now, 'publisher');

  const result = publisher.publish(source.id);
  const online = publisher.detail(result.data.id!);
  expect(online).toMatchObject({
    env: 'online', resourceName: '准备发布', revision: 1,
    creator: 'publisher', updater: 'publisher',
    createdAt: '2026-01-01T00:00:50.000Z', updatedAt: '2026-01-01T00:00:50.000Z'
  });
  expect(publisher.detail(source.id, true)).toEqual({
    ...source, status: 2, revision: 4,
    updater: 'publisher', updatedAt: '2026-01-01T00:00:50.000Z'
  });
  const publishLog = publisher.logs(online.id).list[0];
  const cleanupLog = publisher.logs(source.id).list[0];
  expect(publishLog).toMatchObject({ operationType: 'PUBLISH', oldConfig: '', operator: 'publisher', operationTime: online.updatedAt });
  expect(JSON.parse(publishLog.newConfig)).toEqual(online);
  expect(cleanupLog).toMatchObject({ operationType: 'DELETE', newConfig: '', operator: 'publisher', operationTime: online.updatedAt });
  expect(JSON.parse(cleanupLog.oldConfig)).toEqual(source);
  expect(cleanupLog.versionId).toBeGreaterThan(publishLog.versionId);
  expect(now).toHaveBeenCalledTimes(1);
});

it('覆盖发布按online递增revision并保留线上创建信息，源数据按独立revision清理', () => {
  const onlineAuthor = new ResourceService(fixture.service.repository, /* 固定原线上记录的创建时间。 */ () => '2026-01-01T00:00:00.000Z', 'online-author');
  let online = onlineAuthor.create(input({ env: 'online', resourceName: '线上旧版' }));
  online = onlineAuthor.updateStatus(online.id, 1);
  const sourceAuthor = new ResourceService(onlineAuthor.repository, /* 固定泳道来源的创建时间。 */ () => '2026-01-01T00:00:10.000Z', 'source-author');
  let source = sourceAuthor.create(input({ resourceName: '泳道新版' }));
  for (let i = 0; i < 4; i++) source = sourceAuthor.updateStatus(source.id, 1);
  let tick = 20;
  const now = vi.fn(/* 逐次推进发布时间，验证更新和来源清理的元数据。 */ () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString());
  const publisher = new ResourceService(sourceAuthor.repository, now, 'publisher');

  publisher.publish(source.id, false, false);
  const first = publisher.detail(online.id);
  expect(first).toEqual({
    ...source, id: online.id, env: 'online',
    creator: 'online-author', createdAt: '2026-01-01T00:00:00.000Z',
    updater: 'publisher', updatedAt: '2026-01-01T00:00:20.000Z', revision: 3
  });
  expect(publisher.detail(source.id)).toEqual(source);
  expect(JSON.parse(publisher.logs(online.id).list[0].oldConfig)).toEqual(online);
  expect(JSON.parse(publisher.logs(online.id).list[0].newConfig)).toEqual(first);
  expect(now).toHaveBeenCalledTimes(1);

  publisher.publish(source.id, true, true);
  const second = publisher.detail(online.id);
  expect(second).toMatchObject({ revision: 4, creator: 'online-author', createdAt: online.createdAt, updater: 'publisher', updatedAt: '2026-01-01T00:00:21.000Z' });
  expect(publisher.detail(source.id, true)).toEqual({
    ...source, status: 2, revision: 6, updater: 'publisher', updatedAt: '2026-01-01T00:00:21.000Z'
  });
  expect(publisher.logs(online.id).list[0].operationTime).toBe(second.updatedAt);
  expect(publisher.logs(source.id).list[0].operationTime).toBe(second.updatedAt);
  expect(now).toHaveBeenCalledTimes(2);
});

it('校验失败与发布冲突不取时、不写入；相等时间允许发布', () => {
  const author = new ResourceService(fixture.service.repository, /* 固定原作者创建资源的时间。 */ () => '2026-01-01T00:00:00.000Z', 'author');
  const source = author.create(input());
  const onlineAuthor = new ResourceService(author.repository, /* 固定冲突目标的创建时间。 */ () => '2026-01-01T00:00:01.000Z', 'online-author');
  const online = onlineAuthor.create(input({ env: 'online' }));
  const now = vi.fn(/* 固定失败操作的时间，检查失败不改变审计字段。 */ () => '2026-01-01T00:00:10.000Z');
  const editor = new ResourceService(author.repository, now, 'editor');
  const sourceLogs = editor.logs(source.id);
  const onlineLogs = editor.logs(online.id);

  expect(/* 使用陈旧修订号更新，验证失败不产生副作用。 */ () => editor.update(source.id, { revision: 999, resourceName: '' })).toThrow('已被修改');
  expect(/* 清空示例图，验证校验失败不产生副作用。 */ () => editor.update(source.id, { exampleImage: '' })).toThrow('请上传');
  expect(/* 修改不可变 Key，验证失败不写入。 */ () => editor.update(source.id, { resourceKey: 'different' })).toThrow('不可修改');
  expect(/* 修改为已有线上身份，验证冲突不写入。 */ () => editor.update(source.id, { env: 'online' })).toThrow('相同');
  expect(/* 更新不存在的资源，验证错误不改变已有记录。 */ () => editor.updateStatus(999, 0)).toThrow('不存在');
  expect(/* 删除线上启用记录，验证拒绝操作不写日志。 */ () => editor.delete(online.id)).toThrow('不能删除');
  expect(/* 恢复不存在的操作版本，验证失败不写入。 */ () => editor.roll(source.id, 999)).toThrow('没有可恢复');
  expect(/* 对线上记录执行发布，验证不允许该操作。 */ () => editor.publish(online.id)).toThrow('不能发布');
  expect(editor.publish(source.id)).toMatchObject({ success: false, message: 'CONFLICT' });
  expect(now).not.toHaveBeenCalled();
  expect(editor.detail(source.id)).toEqual(source);
  expect(editor.detail(online.id)).toEqual(online);
  expect(editor.logs(source.id)).toEqual(sourceLogs);
  expect(editor.logs(online.id)).toEqual(onlineLogs);

  const equalSource = onlineAuthor.create(input({ resourceKey: 'equal_time' }));
  onlineAuthor.create(input({ resourceKey: 'equal_time', env: 'online' }));
  expect(editor.publish(equalSource.id, false, false).success).toBe(true);
  expect(now).toHaveBeenCalledTimes(1);
});

it('源清理日志失败会回滚目标覆盖、发布日志和源revision', () => {
  const online = fixture.service.create(input({ env: 'online' }));
  const source = fixture.service.create(input({ resourceName: '发布候选' }));
  const onlineLogs = fixture.service.logs(online.id);
  const sourceLogs = fixture.service.logs(source.id);
  const now = vi.fn(/* 固定发布者时钟，检查事务失败不遗留元数据。 */ () => '2026-01-01T00:01:00.000Z');
  const publisher = new ResourceService(fixture.service.repository, now, 'publisher');
  fixture.db.exec("CREATE TRIGGER reject_cleanup BEFORE INSERT ON resource_placement_operations WHEN NEW.operation_type='DELETE' BEGIN SELECT RAISE(ABORT,'cleanup_log_failure'); END");

  expect(/* 触发被数据库拒绝的发布，验证整个事务回滚。 */ () => publisher.publish(source.id)).toThrow('cleanup_log_failure');
  expect(publisher.detail(online.id)).toEqual(online);
  expect(publisher.detail(source.id)).toEqual(source);
  expect(publisher.logs(online.id)).toEqual(onlineLogs);
  expect(publisher.logs(source.id)).toEqual(sourceLogs);
  expect(now).toHaveBeenCalledTimes(1);
});
