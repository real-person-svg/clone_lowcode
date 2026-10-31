import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/** 打开 SQLite 数据库并执行尚未应用的结构迁移。 */
export function openDatabase(filename: string) {
  if (filename !== ':memory:')
    mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)'
  );
  db.transaction(/* 将初始化结构与迁移版本记录放入同一事务，避免部分成功。 */ () => {
    if (
      !db.prepare('SELECT version FROM schema_migrations WHERE version=1').get()
    ) {
      db.exec(
        readFileSync(
          join(
            dirname(fileURLToPath(import.meta.url)),
            'migrations/001-initial.sql'
          ),
          'utf8'
        )
      );
      db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(
        1,
        new Date().toISOString()
      );
    }
  })();
  return db;
}
export type SqliteDatabase = ReturnType<typeof openDatabase>;
