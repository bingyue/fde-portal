# FDE Portal

FDE 专用的 AI 交付项目管理平台，统一管理企业 AI 项目的需求澄清、POC、Eval、风险、评审与验收。当前版本已实现“创建项目 → 场景卡 → POC → Eval → AI 资产 → 评审 → 验收报告”的完整纵向闭环。

## 快速开始

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，先创建 Workspace，再通过“AI 模型配置”连接 DeepSeek。系统不会预置业务样例；Workspace 和项目数据保存在浏览器 `localStorage`，密钥只保存在服务端环境变量或权限为 `0600` 的本地文件中。

## 已完成功能

- 登录入口、Workspace 选择/创建、团队/企业两类交付空间
- 工作台、项目列表、待办、高风险提醒、活动和 AI 建议
- 三类项目的空白创建流程；不内置业务项目或评测样例
- 项目总览六项指标与 P0–P5 阶段门禁
- 完整场景卡、草稿版本、AI 需求访谈、Zod 校验、预览确认后写入
- POC 验收项、证据关联、风险关闭、提交条件检查和阶段评审
- Eval Suite、真实 CSV Case 导入/导出、外部 Run 结果登记、版本趋势与多指标对比
- 10 类 AI 资产元数据、版本、权限、评测结果和复用标记
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
4. 创建 Auth 用户。`supabase/seed.sql` 故意留空，首个 Workspace 与项目从界面创建。

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
