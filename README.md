# 资源位配置

本地资源位列表和低码编辑器，SQLite 保存资源位、操作历史与上传文件元数据，Vite 构建 React 页面。

需要 Node.js 22+（`.nvmrc` 指定 22.22.2）。本机默认 Node 18 时，先使用 nvm 切换版本；原生 SQLite 依赖应在同一 Node 版本下安装与运行。在项目目录执行：

```sh
nvm use
npm ci
npm run dev
```

打开 http://127.0.0.1:5173/lowcode 。开发 API 默认监听 127.0.0.1:3001。

```sh
npm run typecheck
npm test
npm run build
npm start
```

生产页面与 API 由同一服务提供，打开 http://127.0.0.1:3001/lowcode ，编辑器深链接 `/lowcode-editor/:id` 支持刷新。

`DATA_DIR` 指定数据库与上传文件的持久化目录，默认项目 `data/`；`PORT` 指定 API/生产服务端口，默认 `3001`。首次启动只建立数据库结构，列表为空；操作人固定为 `local`。构建不会清理持久化目录。测试自行建立临时数据库和上传目录。

列表保留原页面业务线、环境与全部基础字段，以及资源位启禁用、复制/子版本、发布、操作日志/Diff/回滚。当前环境启用配置优先，`online` 启用配置兜底。发布和日志、泳道清理在同一事务内处理。`revision` 用于检测陈旧页面保存；业务子版本字段单独持久化。

依赖锁定原仓库 pnpm-lock 对应的 Semi UI/Icons 2.102.0。Header、列表容器、客户端版本限制、Diff 和编辑器沿用原组件与样式，并将内部平台依赖替换为本地 API。react-diff-viewer 3.1.1 的旧 React peer 声明由项目 `.npmrc` 中 `legacy-peer-deps` 处理，页面实际使用 React 18.2。
