# 验证记录

## 原实际应用运行尝试

- 参考源码 HEAD：`17a20dcf2d05e158b955b2d8faef2ead45036a3e`。
- 将原 commercialization 的 src/api/shared/locales 和构建配置复制到 `.task-workspaces/original-reference`，不更改原业务源码；已有依赖只读链接原仓库，生成缓存置副本本地目录。
- 使用 Node 22.22.2、原 EdenX 1.60.6 CLI，以 `EDENX_DEPLOY_REGION=sg` 启动 `edenx dev`。已取得本地监听许可，并补齐原 CLI PATH。
- 原 BFF 启动失败：`ErrConnectNoCredentialCreateStub: ERR_CONNECT: no credential (ZTI or GDPR or MANUAL) to create client (primary stub)`，发生于原 KMSv2 插件初始化。
- 原前端编译失败：原依赖缺少 `@gulux-bam/capcut_commerce_admin`，多个原路由无法解析。
- 浏览器访问 `http://localhost:8080/commercialization/page/resource-placement/lowcode` 返回连接失败，未取得原页面截图。已停止该副本进程。
- 用户已明确允许改为“源码核对与复刻 UI 验证”。最终保留未进行原实际页成对截图对照的限制；不是声称已完成原页面截图一致性验收。

## 最终集成验证

所有验证数据使用隔离临时目录，不向默认交付数据库添加业务种子。下列预检来自 B Vite + A API 初版候选，不能替代修复后最终集成复验。

### 初版预检（第5/6/7轮审查并行期间）

- 空库页面实际新建 `ui_banner`，上传PNG、频控=是、客户端ios >=1.2.3、pageFrom保存；编辑重开回填，Key/业务线不可编辑。截图01..03。
- 点击添加Card和Input，实际原生拖拽将Input移入Card；字段/标题修改、属性选中、高级配置可用。校验表达式输入bad显示“不能使用bad”；保存刷新仍保留Card嵌套和表达式。截图04..06。
- JSON modal使用实际Monaco键盘输入。`{"content":{}}`确认后保留modal和原画布；取消重开显示当前有效配置。截图07..08。
- TS `interface Banner { title: string; count: number; enabled: boolean; }` 本地快速推导生成原解析器支持的三字段；AI按钮disabled。截图09。
- 经JSON UI导入Card/Container/WrapContainer/ArrayContainer及全部13输入类组件，实际17类渲染；包含20节点。切换Switch使条件字段出现/消失，条件require跟随；outputFormat把abc转ABC，onChangeState填联动字段，本地asyncInject显示中国/美国/日本/英国/新加坡选项。
- 本地语言值编辑英语Hello→Hello local，31项原语言枚举可选；多语言图片默认/英语均实际上传本地PNG；地区链接填CN/default；普通上传控件使用本地PNG。保存后刷新，语言/地区链接实际回填。截图10..13。
- 只读HTTP detail核对已保存20节点配置：languages.en=Hello local、zh-Hans保留、语言图片URL位于/uploads、CN链接正确、数组子字段path=name。响应revision=5；后续普通上传再次保存递增。
- 当前独立审查确认R5/R6/R7问题未关闭；上述预检不声称批次完成。后续针对修复、列表发布/回滚、最终生产版本继续验证。
- 实际首次发布创建online记录2，取消默认清理后源泳道1保留；online启用行无删除入口。再次发布触发冲突，显示线上更新时间/泳道创建时间，确认强制覆盖仍保留泳道。截图14..15。
- 操作日志显示6条真实历史；最新Diff高亮普通图片initValue新增行；选择02:40:48的历史操作后快照回滚，编辑器恢复Card+横幅标题输入，三类语言控件消失，与该快照一致。截图16..19。Diff空白侧复制修复仍待新版复验。
- 修复预检：导入不带children的空Container/Array，保存刷新后真实拖入Input成功；JSON UI确认Container子字段为config.first，Array子字段为second并保留顶层email rules。输入not-an-email实际显示“请输入有效邮箱”。含子项容器类型菜单的13种叶类型disabled并说明先移出/删除；无子项叶→容器→叶能保存。截图20..21。
- 在选中源组件后实际before/after排序均成功，但快速拖拽存在依赖hover state的时序风险，已单独交B修复；最终需复验该修复。

### 最终集成候选与命令结果

- 最终代码清单：`FINAL-CANDIDATE.sha256`，122文件；清单SHA-256 `9832681f04feac54e5923ec172cbe120265d3f20f1c662d1115d99535824c31d`。A/B通过版本逐文件核对后复制，没有冲突，没有以未提交Git状态虚构版本。
- Node **22.22.2**，根目录独立执行 **npm ci 成功**，669包、8秒；根依赖独立于开发副本。
- 根目录执行 `npm test && npm run build`，退出0：**13测试文件、95/95通过**（5.81秒）；build内的 `tsc --noEmit` 通过；**Vite6.1生产构建通过**（16.53秒），包括本地Monaco JSON/TS/editor workers和字体。
- 命令提示包含Sass legacy API、Monaco大chunk和原属性透传componentId开发警告；负路径测试的async-validator消息为预期。未因这些非阻塞提示改动功能范围；生产正常加载控制台未记录error。
- 停止B Vite及原预检API，再从最终根目录以 `DATA_DIR=/tmp/resource-placement-ui-validation/data PORT=3001 npm start` 启动生产服务。3001页面由构建产物提供；HTTP深链接200且无Vite开发客户端。
- 另用全新 `empty-production` 临时目录、PORT3002启动同一生产代码，SQL实查资源位/日志/素材表均0，页面空态。默认交付目录 `data/` 从未创建。

### 固定条件

- 浏览器：Codex 的 ChatGPT in-app browser；工具未返回精确浏览器版本。最终生产验收使用同一浏览器、1440 × 900、DPR1、中文、默认缩放；窄视口为1024 × 768。少量早期预检截图为1280 × 720，不用作最终固定尺寸截图。
- 上传测试文件：`/tmp/resource-placement-ui-validation/example.png`，仅用于本次验证。
- API 服务约定：`DATA_DIR` 指向隔离目录，`PORT=3001`；开发 Vite 5173，最终生产产物由 Node 服务提供。
- 视觉证据包括冻结源码布局/样式/列与控件核对，以及本应用实际截图；不宣称已完成原实际页面成对截图。

### 最终生产 UI 与数据核验

- **展示与源码**：28个迁移SCSS文件与冻结原源码去空白比较全部一致，见 `style-comparison.json`；187参考文件SHA未变，技术方案SHA未变。原普通列宽、名称/Id左固定、状态文案已恢复。生产实测背景rgb(246,247,249)、表格scrollWidth1800、SideSheet宽600；横滚scrollLeft442时Id左坐标241保持固定。原语言31项值/顺序/fallback经reviewer独立比对一致。
- **列表**：经页面复制建立9条临时分页记录；与原创建/发布/复制/子版本共13有效记录时，第二页显示11～13条；Key+名称+环境+创建人组合筛出9条，移除CapCut APP业务线后为空，重置恢复。原本地全部业务线枚举保留。截图22～27。
- **复制/子版本**：生产API重启后的新版UI复制online记录生成id3，并在SQLite验证configData与源记录一致。将另一环境父名称改为“线上名称”，仍能从较旧的ppe父行派生v1；子版本Key/名称从所选行生成、别名保存、初始空配置，不能继续派生。子版本基础侧栏另保存算法/实验开关，SQL均为1。
- **启禁用/删除/Diff**：id3实际禁用→启用→删除，有效列表移除；数据库保留CREATE/UNABLE/ENABLE/DELETE四条历史，detail返回404。创建日志的空白侧复制真实剪贴板为空文本，配置侧复制得到ui_copy快照，均成功反馈。截图27。
- **生产编辑器与重启**：直接访问、刷新编辑器id2成功，重启后本地语言值Hello local、zh-Hans、四个本地PNG与地区链接保留；图片实际complete=true/naturalWidth=1，HTTP文件PNG头及内容访问正常。普通上传移除后上传入口恢复，未保存刷新仍显示已存图片。截图28、43。
- **拖拽修复**：生产实际两次before落位均正确；跨容器移入保存重开的空Container成功；父节点拖向自己的后代不改变节点数；库拖入新Input可编辑属性，删除后选择清空，保存刷新仍为Container+Input、Array+Input结构，数组子项path=second。截图29；SQLite结构断言通过。
- **17类逐项**：在临时资源id13先通过JSON清空，再逐一从库点击添加17类，每类选中后编辑path=palette_0..16，适用的label也编辑，全部保存成功；SQL核实17根节点。截图42。这一记录是浏览器操作生成的验证记录，不进入默认数据目录。
- **发布/回滚**：生产默认“清理泳道”勾选，发布ui_bulk_1后源id5软删、online id14出现，目标配置与源完全相同；此前预检已实测冲突/强制与不清理选择。生产日志12条时实际分页到第11～12条，再选择02:40:48操作后的快照回滚，编辑器恢复Card/横幅标题；随后再选02:58:52快照恢复四节点结构，追加历史。截图37～39；SQL累计3次ROLL。
- **异常反馈**：生产不存在资源返回“资源位加载失败/资源位不存在”；isShow主动抛出本地错误时显示Toast且字段保持可用；清除该表达式后保存正常；空TS快速推导给明确错误并保留弹窗/画布。截图31、40～41。此处为故意触发的负路径反馈，不是未捕获异常。
- **加载/窄视口**：为截取真实请求等待态，短暂停止本任务自己的临时API进程，页面查询显示Semi Spin；截图35后立即恢复进程，列表12条重新加载成功（截图36）。1024视口保存按钮right=1004，在视口内可达（截图32），随后恢复1440。
- **HTTP/SQLite三方**：见 `production-smoke-evidence.json`、`persistence-evidence.json`、`empty-database-evidence.json`：生产深链接200、已存上传4个、当前环境返回id1、缺环境兜底id2、未配置明确false、删除历史保留4条；临时数据库最终14记录/12有效，默认data目录不存在。

### 浏览器验证清单

| 区域 | 需要核实的实际操作 | 状态与证据 |
| --- | --- | --- |
| 启动与路由 | 空态、两个页面直达、刷新、错误资源、生产深链接 | 已验证，截图28、30、31、36及HTTP证据 |
| 基础信息 | 新建/编辑/复制/子版本、所有实际字段、本地图片与版本限制 | 已验证，截图02、03、22、23、33及SQL |
| 列表 | 五类筛选、查询/重置、分页与横滚、行操作条件 | 已验证，截图24～26、35～36 |
| 发布与状态 | 启禁用、online 删除限制、发布确认/冲突/强制覆盖、清理选择 | 已验证，截图14～15、37及SQL |
| 日志 | 分页、真实前后 Diff、选旧快照回滚 | 已验证，截图16～19、27、38～39 |
| 编辑器组件 | 17类控件、点击添加/拖入/排序/跨容器/无效嵌套、删除与选择 | 已验证，截图05、20～21、29、42及95项测试 |
| 属性与运行时 | 基础/cProps/高级、显隐/条件必填/校验/格式化/联动/本地注入、错误反馈 | 已验证，截图05～06、20、28、40及规则测试 |
| 代码与推导 | JSON确认/取消/非法结构、快照重开、TS常用定义、AI禁用说明 | 已验证，截图07～09、41 |
| 本地配套 | 三类多语言编辑/保存/重开、上传与预览、无外部平台调用 | 已验证，截图10～13、28、43；本地替换源码核查 |
| 持久化 | 保存/刷新/重进/服务重启、UI/API/SQLite一致、默认业务表为空 | 已验证，三份JSON证据；所有业务验证数据均在/tmp |
| 界面 | 源码尺寸/间距/字体/列/按钮对照、弹窗、滚动和较窄视口操作可达 | 已验证，28项SCSS一致、生产尺寸测量与截图28～43；原实际页成对截图按用户确认保留限制 |

### 验收限制

- 未完成原实际页面成对截图；用户已明确批准以冻结源码核对及复刻页实测替代，不能据此宣称逐像素一致。
- 精确浏览器版本未由工具提供；最终证据均来自同一Codex in-app browser会话及记录的实际视口。
- 最终独立验收结论由REVIEW.md记录，本文件不替代reviewer结论。
