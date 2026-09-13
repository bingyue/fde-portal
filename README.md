# FDE Portal

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
