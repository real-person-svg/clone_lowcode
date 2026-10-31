import type {
  ResourcePlacement,
  ListFilters,
  PageResult,
  OperationLog
} from '../../shared/types';
import type { SqliteDatabase } from '../db/index';
const columns = {
  resourceKey: 'resource_key',
  resourceName: 'resource_name',
  bizId: 'biz_id',
  env: 'env',
  description: 'description',
  exampleImage: 'example_image',
  directoryPath: 'directory_path',
  pageFrom: 'page_from',
  showFrequencyControl: 'show_frequency_control',
  showReco: 'show_reco',
  abExperimentOptionEnabled: 'ab_experiment_option_enabled',
  parentResourceKey: 'parent_resource_key',
  version: 'version',
  versionAlias: 'version_alias',
  versionLimit: 'version_limit',
  configData: 'config_data',
  extra: 'extra',
  status: 'status',
  creator: 'creator',
  updater: 'updater',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  revision: 'revision'
} as const;
const projection =
  'id,' +
  Object.entries(columns)
    .map(([key, col]) => `${col} AS ${key}`)
    .join(',');
export class ResourceRepository {
  constructor(public db: SqliteDatabase) {}
  private map(row: unknown): ResourcePlacement | undefined {
    return row ? { ...(row as ResourcePlacement), from: '数据库' } : undefined;
  }
  find(id: number) {
    return this.map(
      this.db
        .prepare(`SELECT ${projection} FROM resource_placements WHERE id=?`)
        .get(id)
    );
  }
  identity(bizId: number, key: string, env: string) {
    return this.map(
      this.db
        .prepare(
          `SELECT ${projection} FROM resource_placements WHERE biz_id=? AND resource_key=? AND env=? AND status!=2`
        )
        .get(bizId, key, env)
    );
  }
  parent(bizId: number, key: string) {
    return this.map(
      this.db
        .prepare(
          `SELECT ${projection} FROM resource_placements WHERE biz_id=? AND resource_key=? AND status!=2 AND (parent_resource_key IS NULL OR parent_resource_key='') LIMIT 1`
        )
        .get(bizId, key)
    );
  }
  insert(resource: Omit<ResourcePlacement, 'id' | 'from'>) {
    const keys = Object.keys(columns) as (keyof typeof columns)[];
    const id = Number(
      this.db
        .prepare(
          `INSERT INTO resource_placements (${keys
            .map((k) => columns[k])
            .join(',')}) VALUES (${keys.map(() => '?').join(',')})`
        )
        .run(...keys.map((k) => resource[k])).lastInsertRowid
    );
    return this.find(id)!;
  }
  save(resource: ResourcePlacement) {
    const keys = Object.keys(columns) as (keyof typeof columns)[];
    this.db
      .prepare(
        `UPDATE resource_placements SET ${keys
          .map((k) => `${columns[k]}=?`)
          .join(',')} WHERE id=?`
      )
      .run(...keys.map((k) => resource[k]), resource.id);
    return this.find(resource.id)!;
  }
  list(filters: ListFilters): PageResult<ResourcePlacement> {
    const where = ['status!=2'];
    const values: (string | number)[] = [];
    for (const [field, col] of [
      ['resourceKey', 'resource_key'],
      ['resourceName', 'resource_name'],
      ['env', 'env'],
      ['creator', 'creator']
    ] as const) {
      if (filters[field]) {
        where.push(`${col} LIKE ? ESCAPE '\\'`);
        values.push('%' + filters[field]!.replace(/[\\%_]/g, '\\$&') + '%');
      }
    }
    if (filters.bizId?.length) {
      where.push(`biz_id IN (${filters.bizId.map(() => '?').join(',')})`);
      values.push(...filters.bizId);
    }
    const clause = where.join(' AND '),
      page = filters.page || 1,
      pageSize = filters.pageSize || 10;
    const total = (
      this.db
        .prepare(
          `SELECT count(*) AS total FROM resource_placements WHERE ${clause}`
        )
        .get(...values) as { total: number }
    ).total;
    const list = this.db
      .prepare(
        `SELECT ${projection} FROM resource_placements WHERE ${clause} ORDER BY updated_at DESC,id DESC LIMIT ? OFFSET ?`
      )
      .all(...values, pageSize, (page - 1) * pageSize)
      .map((r) => this.map(r)!);
    return { list, total, page, pageSize };
  }
  log(
    type: string,
    old: ResourcePlacement | undefined,
    next: ResourcePlacement | undefined,
    id: number,
    time: string,
    operator: string
  ) {
    this.db
      .prepare(
        'INSERT INTO resource_placement_operations (resource_placement_id,operation_type,old_config,new_config,operator,operation_time) VALUES (?,?,?,?,?,?)'
      )
      .run(
        id,
        type,
        old ? JSON.stringify(old) : '',
        next ? JSON.stringify(next) : '',
        operator,
        time
      );
  }
  logs(id: number, page = 1, pageSize = 10): PageResult<OperationLog> {
    const total = (
      this.db
        .prepare(
          'SELECT count(*) AS total FROM resource_placement_operations WHERE resource_placement_id=?'
        )
        .get(id) as { total: number }
    ).total;
    const list = this.db
      .prepare(
        'SELECT version_id AS versionId,resource_placement_id AS resourcePlacementId,operation_type AS operationType,old_config AS oldConfig,new_config AS newConfig,operator,operation_time AS operationTime FROM resource_placement_operations WHERE resource_placement_id=? ORDER BY version_id DESC LIMIT ? OFFSET ?'
      )
      .all(id, pageSize, (page - 1) * pageSize) as OperationLog[];
    return { list, total, page, pageSize };
  }
  operation(id: number, versionId: number) {
    return this.db
      .prepare(
        'SELECT new_config AS newConfig FROM resource_placement_operations WHERE resource_placement_id=? AND version_id=?'
      )
      .get(id, versionId) as { newConfig: string } | undefined;
  }
}
