import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db/index';
import { createApp } from './app';
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(process.env.DATA_DIR || resolve(projectDir, 'data'));
const db = openDatabase(resolve(dataDir, 'resources.sqlite'));
const app = createApp(db, dataDir, resolve(projectDir, 'dist'));
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '127.0.0.1', /* 服务开始监听后输出本地访问地址。 */ () =>
  console.log(`资源位配置：http://127.0.0.1:${port}`)
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, /* 收到退出信号后停止接受新连接。 */ () =>
    server.close(/* 等待 HTTP 服务关闭后释放数据库并退出。 */ () => {
      db.close();
      process.exit(0);
    })
  );
