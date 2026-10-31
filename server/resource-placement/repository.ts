import type {
  ResourcePlacement,
  ListFilters,
  PageResult,
  OperationLog
} from '../../shared/types';
import type { SqliteDatabase } from '../db';

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

const columnKeys = Object.keys(columns) as (keyof typeof columns)[];
const projectedColumns = columnKeys.map((key) => `${columns[key]} AS ${key}`);
const projection = ['id', ...projectedColumns].join(',');
const insertColumns = columnKeys.map((key) => columns[key]).join(',');
const insertPlaceholders = columnKeys.map(() => '?').join(',');
const updateAssignments = columnKeys.map((key) => `${columns[key]}=?`).join(',');

const textFilters = [
  ['resourceKey', 'resource_key'],
  ['resourceName', 'resource_name'],
  ['env', 'env'],
  ['creator', 'creator']
] as const;

export class ResourceRepository {
  /** 保存数据库连接，供资源位及日志读写使用。 */
  constructor(public db: SqliteDatabase) {}

  /** 为查询结果补充数据来源，并保留未找到的情况。 */
  private map(row: unknown): ResourcePlacement | undefined {
    if (!row) return undefined;

    return { ...(row as ResourcePlacement), from: '数据库' };
  }

  /** 按 ID 查询资源位，包含软删除记录。 */
  find(id: number) {
    const sql = `SELECT ${projection} FROM resource_placements WHERE id=?`;
    const statement = this.db.prepare(sql);
    const row = statement.get(id);

    return this.map(row);
  }

  /** 按业务线、Key 和环境查找未删除的资源位。 */
  identity(bizId: number, key: string, env: string) {
    const sql = `
      SELECT ${projection}
      FROM resource_placements
      WHERE biz_id=? AND resource_key=? AND env=? AND status!=2
    `;
    const statement = this.db.prepare(sql);
    const row = statement.get(bizId, key, env);

    return this.map(row);
  }

  /** 查找指定业务线和 Key 下未删除的非子版本资源位。 */
  parent(bizId: number, key: string) {
    const sql = `
      SELECT ${projection}
      FROM resource_placements
      WHERE biz_id=? AND resource_key=? AND status!=2
        AND (parent_resource_key IS NULL OR parent_resource_key='')
      LIMIT 1
    `;
    const statement = this.db.prepare(sql);
    const row = statement.get(bizId, key);

    return this.map(row);
  }

  /** 按固定列顺序插入字段，并返回数据库保存后的完整记录。 */
  insert(resource: Omit<ResourcePlacement, 'id' | 'from'>) {
    const sql = `
      INSERT INTO resource_placements (${insertColumns})
      VALUES (${insertPlaceholders})
    `;
    const statement = this.db.prepare(sql);
    const parameters = columnKeys.map((key) => resource[key]);
    const result = statement.run(...parameters);
    const id = Number(result.lastInsertRowid);

    return this.find(id)!;
  }

  /** 保存资源位全部持久化字段并返回最新记录。 */
  save(resource: ResourcePlacement) {
    const sql = `UPDATE resource_placements SET ${updateAssignments} WHERE id=?`;
    const statement = this.db.prepare(sql);
    const parameters = columnKeys.map((key) => resource[key]);
    statement.run(...parameters, resource.id);

    return this.find(resource.id)!;
  }

  /** 组合筛选条件，分页查询未删除资源位及总数。 */
  list(filters: ListFilters): PageResult<ResourcePlacement> {
    const conditions = ['status!=2'];
    const filterParameters: (string | number)[] = [];

    for (const [field, column] of textFilters) {
      const value = filters[field];
      if (!value) continue;

      const condition = `${column} LIKE ? ESCAPE '\\'`;
      conditions.push(condition);

      // 将通配符按字面值匹配，转义顺序与参数顺序保持一致。
      const escapedValue = value.replace(/[\\%_]/g, '\\$&');
      filterParameters.push('%' + escapedValue + '%');
    }

    if (filters.bizId?.length) {
      const placeholders = filters.bizId.map(() => '?').join(',');
      conditions.push(`biz_id IN (${placeholders})`);
      filterParameters.push(...filters.bizId);
    }

    const whereClause = conditions.join(' AND ');
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const offset = (page - 1) * pageSize;

    // 计数和分页共用筛选条件，分页参数单独追加。
    const countSql = `SELECT count(*) AS total FROM resource_placements WHERE ${whereClause}`;
    const countStatement = this.db.prepare(countSql);
    const countRow = countStatement.get(...filterParameters) as { total: number };
    const total = countRow.total;

    const listSql = `
      SELECT ${projection}
      FROM resource_placements
      WHERE ${whereClause}
      ORDER BY updated_at DESC,id DESC
      LIMIT ? OFFSET ?
    `;
    const listStatement = this.db.prepare(listSql);
    const listParameters = [...filterParameters, pageSize, offset];
    const rows = listStatement.all(...listParameters);
    const list = rows.map((row) => this.map(row)!);

    return { list, total, page, pageSize };
  }

  /** 写入操作前后快照及操作者信息。 */
  log(
    type: string,
    old: ResourcePlacement | undefined,
    next: ResourcePlacement | undefined,
    id: number,
    time: string,
    operator: string
  ) {
    const sql = `
      INSERT INTO resource_placement_operations (
        resource_placement_id, operation_type, old_config,
        new_config, operator, operation_time
      ) VALUES (?,?,?,?,?,?)
    `;
    const statement = this.db.prepare(sql);
    const oldConfig = old ? JSON.stringify(old) : '';
    const newConfig = next ? JSON.stringify(next) : '';
    const parameters = [id, type, oldConfig, newConfig, operator, time];

    statement.run(...parameters);
  }

  /** 分页读取资源位的操作历史，按版本倒序排列。 */
  logs(id: number, page = 1, pageSize = 10): PageResult<OperationLog> {
    const countSql = `
      SELECT count(*) AS total
      FROM resource_placement_operations
      WHERE resource_placement_id=?
    `;
    const countStatement = this.db.prepare(countSql);
    const countRow = countStatement.get(id) as { total: number };
    const total = countRow.total;

    const listSql = `
      SELECT version_id AS versionId,
        resource_placement_id AS resourcePlacementId,
        operation_type AS operationType, old_config AS oldConfig,
        new_config AS newConfig, operator, operation_time AS operationTime
      FROM resource_placement_operations
      WHERE resource_placement_id=?
      ORDER BY version_id DESC
      LIMIT ? OFFSET ?
    `;
    const listStatement = this.db.prepare(listSql);
    const offset = (page - 1) * pageSize;
    const list = listStatement.all(id, pageSize, offset) as OperationLog[];

    return { list, total, page, pageSize };
  }

  /** 按资源位和操作版本读取操作后快照，供回滚校验使用。 */
  operation(id: number, versionId: number) {
    const sql = `
      SELECT new_config AS newConfig
      FROM resource_placement_operations
      WHERE resource_placement_id=? AND version_id=?
    `;
    const statement = this.db.prepare(sql);
    const row = statement.get(id, versionId) as { newConfig: string } | undefined;

    return row;
  }
}
