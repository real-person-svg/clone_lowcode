import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../../../server/db';
import { ResourceRepository } from '../../../server/repositories/resources';
import { ResourceService } from '../../../server/services/resources';

/** 注册资源服务用例的独立数据库、时钟及生命周期清理。 */
export function useResourceService() {
  let dir: string;
  let db: ReturnType<typeof openDatabase>;
  let service: ResourceService;
  let tick: number;
  beforeEach(/* 为每个用例创建临时数据库和从零递增的模拟时钟。 */ () => {
    dir = mkdtempSync(join(tmpdir(), 'resource-service-'));
    db = openDatabase(join(dir, 'resource.sqlite'));
    tick = 0;
    service = new ResourceService(new ResourceRepository(db), /* 每次读取递增一秒，便于检查审计时间先后。 */ () =>
      new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString()
    );
  });
  afterEach(/* 用例结束后关闭数据库并移除临时文件。 */ () => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return {
    /** 读取当前用例数据库，供断言或重开连接使用。 */
    get db() {
      return db;
    },
    /** 替换用例数据库连接，供持久化恢复测试使用。 */
    set db(value: ReturnType<typeof openDatabase>) {
      db = value;
    },
    /** 读取当前用例的资源服务。 */
    get service() {
      return service;
    },
    /** 替换用例服务，供重建仓库或时钟场景使用。 */
    set service(value: ResourceService) {
      service = value;
    },
    /** 读取临时数据目录，供重开数据库场景定位文件。 */
    get dir() {
      return dir;
    }
  };
}
