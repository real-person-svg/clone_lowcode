import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../../../server/db';
import { ResourceRepository } from '../../../server/repositories/resources';
import { ResourceService } from '../../../server/services/resources';

export function useResourceService() {
  let dir: string;
  let db: ReturnType<typeof openDatabase>;
  let service: ResourceService;
  let tick: number;
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
  return {
    get db() {
      return db;
    },
    set db(value: ReturnType<typeof openDatabase>) {
      db = value;
    },
    get service() {
      return service;
    },
    set service(value: ResourceService) {
      service = value;
    },
    get dir() {
      return dir;
    }
  };
}
