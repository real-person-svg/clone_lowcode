import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 打开 SQLite 数据库并执行尚未应用的结构迁移。 */
export function openDatabase(filename: string) {
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  const createMigrationsTable = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `;
  db.exec(createMigrationsTable);

  // 结构变更和迁移版本记录共用事务，避免部分成功。
  const applyInitialMigration = db.transaction(() => {
    const findMigration = db.prepare('SELECT version FROM schema_migrations WHERE version=1');
    const existingMigration = findMigration.get();
    if (existingMigration) return;

    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const migrationPath = join(moduleDir, 'migrations/001-initial.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql);

    const recordMigration = db.prepare('INSERT INTO schema_migrations VALUES (?,?)');
    const appliedAt = new Date().toISOString();
    recordMigration.run(1, appliedAt);
  });

  applyInitialMigration();

  return db;
}

export type SqliteDatabase = ReturnType<typeof openDatabase>;
