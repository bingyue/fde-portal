# FDE Workbench · 企业 AI 转型智能工作台

面向真实企业项目的 FDE 工作台。主入口为 `/workbench`，围绕「输入现场资料 → 按需执行专业 Skills → FDE 核实事实与行动 → 关联证据 → 确认阶段」形成可追溯的交付闭环。默认一个共享空间，无 Workspace 创建或切换，也没有预置业务样例。

## 启动新版工作台

需要 Node.js 22+。

```bash
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3006
```

打开 [http://localhost:3006](http://localhost:3006)。生产模式使用 `npm run build`，然后 `npm run start -- --hostname 127.0.0.1 --port 3006`。

首次使用创建企业项目，并在 `/settings/ai` 上传 DeepSeek 密钥文件。密钥只在服务端读取；不配置模型也能保存资料，AI 分析会明确提示缺少配置，不返回模拟分析。模型网关复用现有 DeepSeek 配置和连接验证。

## Vibe Coding 学习中心

从工作台顶部或旧版侧栏进入 `/learn`。学习中心提供 7 套常见技术组合的适用场景、组件分工、选型取舍、动手练习、验收清单、可复制开工提示词和官方文档，支持分类与关键词搜索。

6 步实践路线的自查进度仅保存在当前浏览器；概念速查解释前后端、模型 API、数据存储、RAG、Git 和部署边界。学习内容不会创建业务样例或调用模型。内容集中维护在 `src/lib/learning.ts`，更新建议时同步核实官方文档并更新页面核对日期。

## 本次升级的六项核心能力

- **项目空间**：多个独立企业项目，原始资料、事实、分析记录、任务、证据、决策及交付版本保存在服务端。
- **统一 AI 输入**：输入问题、粘贴纪要、上传 UTF-8 TXT / Markdown / CSV / JSON（单文件最多 200 KB、6 万字符），或选择已有资料续分析。PDF、Word 和表格文件当前需要先导出为支持的文本格式。
- **Skill 注册与调度**：18 个独立 `skills/<id>/SKILL.md`，其中六个核心 Skill 提供专门的结构化输出与校验。先提取信息，再执行专业分析与缺口/场景评估，之后检查阶段、规划行动；后续步骤接收前序结果，前序失败会跳过依赖步骤。可额外选择最多 3 个专业 Skill；交付文档在人工确认后独立生成。没有后台数据库或 ERP 工具调用。
- **九阶段地图**：项目启动、企业访谈、场景诊断、价值评估、技术方案、PoC 验证、业务试点、生产上线、验收运营。节点可点击查看标准、证据、阻塞事项、相关 Skills 和交付物。支持并行任务与阶段回退。
- **三种独立确认**：事实核实后进入记忆；行动经编辑确认后创建带优先级、前置条件和任务依赖的任务，可同时申请生成行动计划草稿；文档需独立审核后才能成为证据。阶段必须补齐标准证据、完成阻塞任务、核实 P0 问题，再独立确认。每次确认记录姓名、依据、时间和关联记录。
- **持续项目记忆**：原文引用必须通过逐字匹配，事实仍需人工确认；新一轮输入保留项目记忆。缺口按问题合并，保留来源、历史分析和人工关闭证据；任务完成后自动复查下一步。资产同名时追加版本，可人工修订，不覆盖历史；支持 Markdown 导出。

新增任务不会自动完成，AI 建议不会自动推进阶段。退回阶段或重新打开已完成阶段的阻塞任务，将撤销相关阶段及下游完成审批；记录和交付资产保留。已过期的分析不能直接批准执行。

## 六个核心 Skills 与扩展协议

- `fde-interview-analyzer`：业务目标、痛点、待核实陈述、责任人和逐字引用。
- `fde-gap-finder`：缺少什么、为什么重要、问谁、怎么问，以及 P0/P1/P2 优先级。
- `fde-scenario-evaluator`：价值、难度、数据就绪、组织阻力和风险；无证据的维度不评分。
- `fde-stage-review`：逐项对照当前阶段完成标准，状态引擎阻塞项不能被模型覆盖。
- `fde-next-action`：综合前序结果与现有任务，建议优先级、前置条件、负责人和对应 Skill。
- `fde-deliverable-builder`：审批后按六类模板生成文档，关联真实资料和审批记录；草稿审核后才可作为证据。

完整工程协议、运行边界与行业包扩展计划见 [Skills 执行协议](docs/workbench-skills.md)。这些能力均通过服务端 DeepSeek 执行；测试替身只存在于测试进程，不会在缺少密钥时返回业务分析。

## 存储与运行边界

新版数据默认位于 `.data/workbench/<project-id>.json`，可通过 `FDE_DATA_DIR` 指定持久化目录。文件以 `0600` 权限原子写入；单进程写入队列与项目修订号避免覆盖并发确认。服务器重启后项目可恢复；执行中断的分析在 10 分钟后标记失败并允许重试。长时间分析使用 Next.js `after`，不是具备跨服务器恢复能力的任务队列。

这是**单机、单 Node 进程、可信用户使用**的版本；确认人姓名是审计字段，不是已认证身份。尚未接入登录、租户权限、PostgreSQL 仓储或多实例任务队列。不要直接作为公开多租户服务部署；正式团队部署应接入身份验证、数据库与队列，并备份持久化目录。现有 `supabase/` 迁移是旧版设计参考，不代表新版已连接数据库。

`.data/`、`.env*`（除空白模板）、测试产物均被 Git 忽略。备份项目时注意单独保管 `.data/ai-config.json` 中的密钥；不要提交或分享它。

旧版 `/dashboard`、`/chat` 与交付工具仍可访问，旧版浏览器数据不会被清除。在同一浏览器创建新版项目时，可将旧记录作为待核实资料导入；旧版结构化任务与审批不会自动转换成已确认的新阶段。新旧项目记录不双向同步。

## 验证

```bash
npm run check
npm run build
npm run test:e2e
```

单元测试覆盖三种确认隔离、证据门禁、并行任务、重复确认、版本、回退、过期分析、文件持久化、项目隔离、并发修订冲突、原文引用校验与模型失败。模型集成测试使用 `tests/mock-deepseek.mjs`，仅测试进程使用假密钥；不代表真实账户的计费与连通性验证。

## 旧版功能与开发说明

以下为保留的旧版模块说明；新版以以上工作台和服务端存储行为为准。

FDE 专用的 AI 交付项目管理平台，统一管理企业 AI 项目的结果契约、现场发现、实验学习、证据门禁、生产运营与能力复用。当前版本已实现“结果定义 → 现场发现 → 假设实验 → Eval → 业务采纳 → 生产决策 → 产品化沉淀”的完整闭环。

## 快速开始

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可进入工作台，开始 AI 场景诊断或直接创建项目。系统默认使用一个内部空间，无需创建或切换 Workspace；旧数据的空间标识保留，项目和对话不丢失。系统不会预置业务样例；项目数据保存在浏览器 `localStorage`，密钥只保存在服务端环境变量或权限为 `0600` 的本地文件中。

## 已完成功能

- 虚拟顾问「岚舟」：网页多轮访谈、场景诊断、需求备忘录、POC 预览与客户明确确认
- 默认单空间：打开即用，工作台直接进入诊断或项目创建
- 工作台、项目列表、待办、高风险提醒、活动和 AI 建议
- 企业 POC / 内部创新两类项目的空白创建流程；不内置业务项目或评测样例
- Outcome Contract：业务基线、目标、ROI、成功条件与停止条件
- 现场发现：三层干系人关系图与端到端 Hero Workflow
- 假设与实验：技术/业务/采纳三类假设、最小实验、证据和结论
- 技术价值与组织采纳双螺旋、六项指标与 P0–P5 阶段门禁
- 完整场景卡、草稿版本、AI 需求访谈、Zod 校验、预览确认后写入
- POC 技术/业务/采纳三维证据、风险关闭、提交条件检查和阶段评审
- Eval Suite、真实 CSV Case 导入/导出、外部 Run 结果登记、版本趋势与多指标对比
- 组织采纳计划、自动化权限阶梯、SLO 与生产就绪检查
- 10 类 AI 资产元数据、版本、权限、评测结果和产品化复用飞轮
- 场景卡/Eval/阶段/验收评审，通过、退回、有条件通过
- POC 立项书、Eval 评测报告、POC 验收报告；在线预览、业务确认、HTML 导出与打印 PDF
- 商务蓝 SaaS 设计系统、全浅色工作台，以及浅色/深色/跟随系统三态主题
- 响应式侧栏、移动端导航、键盘焦点、减少动画偏好、Loading、Empty、校验和确认
- 真实数据模式本地持久化；DeepSeek 服务端连接测试与安全密钥配置
- 从 `bingyue/fde-skills` 初始化 65 个 Skill、12 个分类和版本化清单
- Skill 搜索、详情、65 个独立 ZIP 下载与完整仓库下载
- Skill 在线触发、后台 Task ID、状态轮询、执行日志和 Markdown 工作产物
- 脚本型 Skill 强制 Prompt-only，仓库 Python/Shell/MCP 不会自动执行

## 技术栈

- Next.js 16 App Router、React 19、严格 TypeScript
- Tailwind CSS 4、Lucide、Recharts
- Zod 结构化输出校验
- Supabase Auth / PostgreSQL / Storage 数据模型与 RLS
- Vitest 单元测试、Playwright Chromium 核心流程测试

## 项目结构

```text
src/
  app/
    (portal)/              # 工作台与项目页面，共享应用壳
    api/ai/                # 服务端 AI Provider 与安全配置
    api/skills/tasks/      # Skill 后台任务与状态查询
  components/              # 企业级 UI、主题基础设施与 AppShell
  lib/
    ai/                    # Provider、Schema、10 个独立 Skill
    metrics.ts             # 核心指标计算
    skills/                # Skill 清单、任务队列与安全执行器
    store.tsx              # 真实业务数据的本地持久化层
    types.ts               # 领域类型
supabase/
  migrations/              # 18 个核心实体、索引、RLS、审计、Storage
  seed.sql                 # 故意留空，不写入业务样例
tests/e2e/                 # POC、Skill 与主题端到端测试
public/skill-downloads/    # 65 个可下载 Skill ZIP
scripts/sync-fde-skills.mjs # GitHub 仓库同步与打包器
```

## 配置 Supabase

1. 创建 Supabase 项目并复制 `.env.example` 为 `.env.local`。
2. 填写 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 和服务端 `SUPABASE_SERVICE_ROLE_KEY`。
3. 依次应用 `supabase/migrations/` 下的全部迁移。
4. `supabase/seed.sql` 故意留空。当前本地仓储自动准备默认空间；接入 Supabase 仓储时需将该空间映射到数据库记录并配置 Auth 用户。

Migration 包含 Workspace 多租户字段、外键、索引、删除策略、更新时间触发器、核心写操作 AuditLog、成员角色 RLS 以及私有 evidence Storage 策略。

## 配置 DeepSeek

在 `.env.local` 中填写：

```bash
DEEPSEEK_API_KEY=your_server_side_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

密钥仅由服务端 AI 与 Skill Task API 使用，不得添加 `NEXT_PUBLIC_` 前缀。也可在“AI 模型配置”页面上传 `.env`/`.txt` 或输入 Key；保存前会调用 `/models` 做真实连接验证。未配置 DeepSeek 时可以浏览和下载 Skill，但在线触发会返回清晰的配置提示。

10 个 AI Skill 分别位于 `src/lib/ai/skills/`，各自包含独立 Prompt、输入输出 Schema 与版本号：企业需求访谈、场景生成、完整性检查、价值/可行性评分、POC 计划、Eval 指标、测试案例、风险诊断、周报和验收报告。

## 网页场景诊断助手

打开 `/chat` 或工作台的“与岚舟诊断场景”，可直接开始访谈，无需预先创建项目。岚舟是明确标识的虚拟 AI 顾问，每轮追问 1–2 个关键问题，逐步完成认识业务、诊断现状、挖掘需求、划定边界、设计验证和方案确认。

回复通过现有服务端 DeepSeek 配置生成；未配置时页面会引导连接，不返回模拟诊断。`POST /api/ai/diagnosis` 发送完整会话和启动时的项目上下文，验证结构化回复，保留事实与待确认项，支持超时、停止和失败重试。单条消息最多 6000 字，单次请求最多 100 条消息。

客户修正需求后会撤回旧方案。资料完整且验收标准涵盖技术、业务、采纳后，才允许输入确认人姓名并勾选同意。确认会创建首个项目，或更新会话关联的当前项目，写入场景卡、结果契约草稿、POC 里程碑、未通过的验收项、开放风险和待评审记录。确认过的会话保持只读并可导出 Markdown，项目切换后旧会话不能覆盖新项目。

人设和欢迎语在 `src/lib/diagnosis.ts`，访谈策略在 `src/lib/ai/diagnosis.ts`。对话与确认记录随业务数据保存于当前浏览器，可刷新恢复；当前版本没有跨浏览器客户身份验证或共享会话服务。对外多客户上线需要接入身份认证与服务端会话仓储。

本地指定端口：`npm run build` 后运行 `npm run start -- --hostname 127.0.0.1 --port 3006`，访问 [场景诊断](http://127.0.0.1:3006/chat)。

## 同步与运行 FDE Skills

```bash
npm run skills:sync
```

同步脚本从 `bingyue/fde-skills` 的 `master` 分支读取目录，扫描含 `SKILL.md` 或 `prompt.md` 的 Skill，生成固定版本清单、服务端 Prompt 定义和每个 Skill 的独立 ZIP。当前快照为 commit `504a52b`，共 65 个 Skill。源仓库暂未声明 License，页面会明确展示该状态。

在线触发流程为 `POST /api/skills/tasks` → 返回 Task ID → Next.js `after()` 后台执行 → `GET /api/skills/tasks/{id}` 查询状态与日志。任务输入最多 8,000 字，最多 3 个并发任务，记录在当前 Node 进程内并于一小时后清理。带脚本的 Skill 也只执行 Prompt；不会运行任意代码、访问本地文件或自动调用外部 Tool。

单机 Node/Docker 可以直接使用当前后台队列。多实例或 Serverless 生产环境应将 Task Store 替换为 Supabase/Redis，并使用持久化 Worker/Queue；否则实例切换后任务状态可能丢失。

## 测试与构建

```bash
npm run typecheck
npm run lint
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

`npm run check` 会连续运行 TypeScript、Lint 和 Vitest。

## 部署到 Vercel

导入 Git 仓库，Framework 选择 Next.js，并配置服务端 DeepSeek 环境变量。Vercel 不允许通过页面写入运行时密钥文件，因此必须使用项目环境变量。生产模式建议同时应用 Supabase Migration，并将内存 Skill Task Store 替换为持久化队列。

## V1 边界与后续建议

本期没有实现即时聊天、甘特图、通用 Kanban、完整 Agent 运行基础设施或通用 Trace。Supabase 数据访问已完成 Schema 与安全策略，但业务 UI 当前使用浏览器本地仓储；生产部署下一步应补 `SupabaseRepository`，在登录会话存在时切换数据源。之后可增加真实 Evidence 文件上传、邮件通知、报告服务端 PDF 和外部 Eval Runner Webhook。
