import { join } from 'node:path';
import { openDatabase } from '../../../server/db';
import { ResourceRepository } from '../../../server/repositories/resources';
import { ResourceService } from '../../../server/services/resources';
import { useResourceService } from './fixture';
import { input } from './input';

const fixture = useResourceService();

it('只初始化结构，重复迁移不重置数据，重启可恢复配置', () => {
  for (const table of [
    'resource_placements',
    'resource_placement_operations',
    'assets'
  ])
    expect(
      (fixture.db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number })
        .n
    ).toBe(0);
  const created = fixture.service.create(
    input({
      configData: JSON.stringify({
        content: [{ type: 'Input', path: 'config.title', isShow: false }]
      })
    })
  );
  fixture.db.close();
  fixture.db = openDatabase(join(fixture.dir, 'resource.sqlite'));
  fixture.service = new ResourceService(new ResourceRepository(fixture.db));
  expect(fixture.service.detail(created.id).configData).toContain('config.title');
  expect(fixture.service.logs(created.id).total).toBe(1);
});

it('更新与日志在同一事务，日志失败保持原值和revision', () => {
  const resource = fixture.service.create(input());
  fixture.db.exec(
    "CREATE TRIGGER reject_update BEFORE INSERT ON resource_placement_operations WHEN NEW.operation_type='UPDATE' BEGIN SELECT RAISE(ABORT,'test_log_failure'); END"
  );
  expect(() =>
    fixture.service.update(resource.id, { resourceName: '不应保存' })
  ).toThrow();
  expect(fixture.service.detail(resource.id)).toEqual(resource);
  expect(fixture.service.logs(resource.id).total).toBe(1);
});
