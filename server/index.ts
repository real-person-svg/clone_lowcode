import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db';
import { createApp } from './app';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(moduleDir, '..');
const defaultDataDir = resolve(projectDir, 'data');
const dataDir = resolve(process.env.DATA_DIR || defaultDataDir);
const databasePath = resolve(dataDir, 'resources.sqlite');
const distDir = resolve(projectDir, 'dist');

const db = openDatabase(databasePath);
const app = createApp(db, dataDir, distDir);
const port = Number(process.env.PORT || 3001);

const onListening = () => {
  console.log(`资源位配置：http://127.0.0.1:${port}`);
};

const onClosed = () => {
  db.close();
  process.exit(0);
};

const server = app.listen(port, '127.0.0.1', onListening);

const closeServer = () => {
  server.close(onClosed);
};

const shutdownSignals = ['SIGINT', 'SIGTERM'] as const;
for (const signal of shutdownSignals) {
  process.on(signal, closeServer);
}
