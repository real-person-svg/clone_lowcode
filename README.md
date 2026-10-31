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

代码按资源位功能组织：

```text
src/app/                              # 应用入口、路由和全局样式
src/resource-placement/
  api/                                # 资源位 API 客户端
  list/                               # 列表、筛选和行操作
    BasicInfoSheet/                   # 基础信息、示例图、客户端版本限制
    operation-logs/                   # 日志、快照、Diff 与回滚交互
  editor/                             # 组件库、画布、属性、代码编辑和运行时
  controls/                           # 资源位表单专用控件及各自逻辑、样式
server/
  resource-placement/                 # 资源位路由、请求契约、服务、仓库及校验
  assets/                             # 上传路由与文件元数据写入
  db/                                 # SQLite 初始化和版本迁移
  middleware/                         # 跨功能错误响应
shared/                               # 前后端共用的数据契约和配置校验
tests/                                # 测试与辅助文件，与业务源码分离
  resource-placement/                 # 按 editor、controls、list 组织前端测试
  server/                             # HTTP 集成测试及资源服务测试
  shared/                             # 前后端共用配置校验的测试
```

组件保留 JSX 组合；列表查询、表单提交、拖放、上传和文档生命周期由各自功能内的 `useXxx` 管理。纯计算与数据转换使用普通函数，静态字段、校验规则及编辑器选项放在功能配置文件中。所有测试及 fixture 等测试辅助文件统一放在根目录 `tests/`，按对应功能组织；`src/`、`server/` 和 `shared/` 仅保留业务源码。服务端按 SQL 与参数准备、数据库执行、结果组装的顺序组织代码；资源变更与日志保留同一事务。移动模块时需同步更新相对导入、路径别名及测试 mock 引用。

运行 `npm run lint` 检查 TypeScript、React Hooks 和结构规则，`npm run lint:fix` 执行可自动修正的检查。注释独占一行，放在对应代码上方。ESLint 使用 flat config，禁止同行注释、嵌套三元表达式、条件展开、JSX 内联事件函数和复杂属性对象；Hooks 的调用顺序和依赖检查覆盖业务源码。测试替身允许内联事件与受控依赖。推荐提交前执行：

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

HTTP 集成测试需要临时监听本地端口；受限环境应允许本地端口后运行完整测试。
