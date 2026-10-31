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
    .map(/* 为数据库列生成业务字段别名。 */ ([key, col]) => `${col} AS ${key}`)
    .join(',');
export class ResourceRepository {
  /** 保存数据库连接，供资源位及日志读写使用。 */
  constructor(public db: SqliteDatabase) {}
  /** 为查询结果补充数据来源，并保留未找到的情况。 */
  private map(row: unknown): ResourcePlacement | undefined {
    return row ? { ...(row as ResourcePlacement), from: '数据库' } : undefined;
  }
  /** 按 ID 查询资源位，包含软删除记录。 */
  find(id: number) {
    return this.map(
      this.db
        .prepare(`SELECT ${projection} FROM resource_placements WHERE id=?`)
        .get(id)
    );
  }
  /** 按业务线、Key 和环境查找未删除的资源位。 */
  identity(bizId: number, key: string, env: string) {
    return this.map(
      this.db
        .prepare(
          `SELECT ${projection} FROM resource_placements WHERE biz_id=? AND resource_key=? AND env=? AND status!=2`
        )
        .get(bizId, key, env)
    );
  }
  /** 查找指定业务线和 Key 下未删除的非子版本资源位。 */
  parent(bizId: number, key: string) {
    return this.map(
      this.db
        .prepare(
          `SELECT ${projection} FROM resource_placements WHERE biz_id=? AND resource_key=? AND status!=2 AND (parent_resource_key IS NULL OR parent_resource_key='') LIMIT 1`
        )
        .get(bizId, key)
    );
  }
  /** 插入完整资源位并返回数据库保存后的记录。 */
  insert(resource: Omit<ResourcePlacement, 'id' | 'from'>) {
    const keys = Object.keys(columns) as (keyof typeof columns)[];
    const id = Number(
      this.db
        .prepare(
          `INSERT INTO resource_placements (${keys
            .map(/* 按字段映射生成插入列名。 */ (k) => columns[k])
            .join(',')}) VALUES (${keys.map(/* 为每个插入字段生成参数占位符。 */ () => '?').join(',')})`
        )
        .run(...keys.map(/* 按列顺序提取插入参数。 */ (k) => resource[k])).lastInsertRowid
    );
    return this.find(id)!;
  }
  /** 保存资源位全部持久化字段并返回最新记录。 */
  save(resource: ResourcePlacement) {
    const keys = Object.keys(columns) as (keyof typeof columns)[];
    this.db
      .prepare(
        `UPDATE resource_placements SET ${keys
          .map(/* 为各字段生成参数化更新表达式。 */ (k) => `${columns[k]}=?`)
          .join(',')} WHERE id=?`
      )
      .run(...keys.map(/* 按更新列顺序提取字段值。 */ (k) => resource[k]), resource.id);
    return this.find(resource.id)!;
  }
  /** 组合筛选条件，分页查询未删除资源位及总数。 */
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
        // 转义 LIKE 通配符，让用户输入的 %、_ 和反斜线按字面值参与模糊匹配。
        values.push('%' + filters[field]!.replace(/[\\%_]/g, '\\$&') + '%');
      }
    }
    if (filters.bizId?.length) {
      where.push(`biz_id IN (${filters.bizId.map(/* 为业务线筛选生成参数占位符。 */ () => '?').join(',')})`);
      values.push(...filters.bizId);
    }
    // 计数与列表复用筛选条件及参数，保证分页总数和当前页记录口径一致。
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
      .map(/* 将查询行转换为带来源的资源位记录。 */ (r) => this.map(r)!);
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
  /** 分页读取资源位的操作历史，按版本倒序排列。 */
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
  /** 按资源位和操作版本读取操作后快照，供回滚校验使用。 */
  operation(id: number, versionId: number) {
    return this.db
      .prepare(
        'SELECT new_config AS newConfig FROM resource_placement_operations WHERE resource_placement_id=? AND version_id=?'
      )
      .get(id, versionId) as { newConfig: string } | undefined;
  }
}
