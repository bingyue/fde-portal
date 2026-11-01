export type StackCategory = "网页与产品" | "AI 与数据" | "部署与交付";
export type LearningStack = {
  id: string;
  name: string;
  category: StackCategory;
  level: string;
  goal: string;
  summary: string;
  parts: { name: string; role: string }[];
  fit: string;
  tradeoff: string;
  exercise: string;
  steps: string[];
  checks: string[];
  docs: { name: string; url: string }[];
};
export const learningStacks: LearningStack[] = [
  {
    id: "next-supabase",
    name: "Next.js + Supabase",
    category: "网页与产品",
    level: "完整应用",
    goal: "做一个有登录和数据的产品",
    summary:
      "前后端放在一个 TypeScript 项目里，配合托管数据库、身份认证与文件存储。",
    parts: [
      { name: "Next.js / React", role: "页面、路由与服务端接口" },
      { name: "TypeScript", role: "为数据和函数定义类型" },
      { name: "Tailwind CSS", role: "界面样式与响应式布局" },
      { name: "Supabase", role: "Postgres 数据库、Auth 与 Storage" },
    ],
    fit: "客户门户、项目工作台、带账号的业务应用。",
    tradeoff:
      "需要理解服务端与浏览器边界，以及数据库权限。托管服务省去部分运维，但仍需评估区域、配额、费用和数据要求。",
    exercise: "做一个需求收集工作台：登录 → 创建需求 → 查看列表 → 修改状态。",
    steps: [
      "先定义需求记录的字段、负责人和完成条件，只实现一条用户路径。",
      "搭建列表和表单，补齐校验、空状态、加载与错误提示。",
      "接入数据库迁移和身份认证；用两名测试用户验证行级访问权限。",
      "在服务端调用 AI，把建议与用户确认的数据分开保存。",
    ],
    checks: [
      "用户 A 不能读取或修改用户 B 的私有记录。",
      "刷新后数据保留；接口失败时用户能重试。",
      "服务端密钥不出现在浏览器代码、网络响应或 Git 中。",
    ],
    docs: [
      {
        name: "Next.js 入门",
        url: "https://nextjs.org/docs/app/getting-started/installation",
      },
      {
        name: "Supabase 入门",
        url: "https://supabase.com/docs/guides/getting-started",
      },
      {
        name: "数据行级权限",
        url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
      },
    ],
  },
  {
    id: "react-vite",
    name: "React + Vite",
    category: "网页与产品",
    level: "前端起步",
    goal: "做交互原型或内部看板",
    summary:
      "用 React 组织界面，用 Vite 提供开发与构建工具。已有后端时，可以专注交互与数据呈现。",
    parts: [
      { name: "React", role: "组件、状态与交互" },
      { name: "Vite", role: "本地开发和前端打包" },
      { name: "TypeScript", role: "接口和组件类型" },
      { name: "HTTP API", role: "连接已有业务服务" },
    ],
    fit: "运营看板、表单工具、已有 API 的管理界面。",
    tradeoff:
      "Vite 不替你提供业务后端或数据库。需要独立考虑鉴权、服务端 API、部署路由与数据存储；依赖搜索收录的内容站可比较静态生成或服务端渲染方案。",
    exercise: "做一个工单看板：列表 → 搜索与筛选 → 详情 → 更新处理状态。",
    steps: [
      "先画出组件层级和状态流向，再让 AI 实现单个页面。",
      "为 API 定义类型，明确加载、失败、无结果三种状态。",
      "将筛选条件与业务记录分开，接入真实后端后验证状态更新。",
      "构建后用静态服务器访问，检查直接打开详情页是否正常。",
    ],
    checks: [
      "搜索和筛选组合使用时结果正确。",
      "修改状态后刷新页面仍能看到真实后端保存的结果。",
      "窄屏、键盘操作和接口超时都有可用反馈。",
    ],
    docs: [
      { name: "Vite 指南", url: "https://vite.dev/guide/" },
      {
        name: "Tailwind + Vite",
        url: "https://tailwindcss.com/docs/installation/using-vite",
      },
    ],
  },
  {
    id: "vue-vite",
    name: "Vue + Vite",
    category: "网页与产品",
    level: "内部工具",
    goal: "用清晰的模板构建业务界面",
    summary:
      "以 Vue 组件组织模板和交互，按需加入路由与共享状态管理。选型时优先考虑团队已有经验。",
    parts: [
      { name: "Vue", role: "组件模板与响应式状态" },
      { name: "Vite", role: "开发与构建" },
      { name: "Vue Router", role: "多页面路由" },
      { name: "Pinia（按需）", role: "跨组件共享状态" },
    ],
    fit: "表单密集的内部系统、已有 Vue 团队维护的业务工具。",
    tradeoff:
      "仍需要后端承接权限、校验和持久化。小页面不用一开始就引入复杂全局状态；选组件库时核对版本兼容性。",
    exercise: "做一份供应商档案：录入 → 校验 → 查询 → 编辑。",
    steps: [
      "定义档案字段、必填规则与编辑权限。",
      "先实现一个表单组件与列表组件，明确谁持有数据。",
      "跨页面确有共享状态时再引入 Pinia，远端数据仍以服务端为准。",
      "补充保存失败、重复提交与离开未保存表单的处理。",
    ],
    checks: [
      "必填字段与错误提示对应清楚。",
      "重复点击保存不会产生重复业务记录。",
      "深层链接刷新后正常显示，未授权编辑会被服务端拒绝。",
    ],
    docs: [
      {
        name: "Vue 官方指南",
        url: "https://vuejs.org/guide/introduction.html",
      },
      { name: "Vite 入门", url: "https://vite.dev/guide/" },
    ],
  },
  {
    id: "astro",
    name: "Astro + CSS / Tailwind",
    category: "网页与产品",
    level: "内容站",
    goal: "发布产品介绍、文档或案例",
    summary:
      "先把内容结构和阅读体验做好，需要交互的部分再加入组件。适合以内容展示为主的网站。",
    parts: [
      { name: "Astro", role: "页面、内容组织与构建" },
      { name: "Markdown", role: "编写案例和说明" },
      { name: "CSS / Tailwind", role: "排版与视觉样式" },
      { name: "静态托管", role: "发布构建产物" },
    ],
    fit: "产品官网、案例库、文档站和个人作品集。",
    tradeoff:
      "复杂业务状态、账号体系和后台管理需要额外设计。留言或线索表单也必须有真实接收服务，不能只显示成功动画。",
    exercise: "做一页 PoC 案例：客户问题 → 方法 → 证据 → 结果边界 → 联系方式。",
    steps: [
      "写清目标读者与页面希望促成的行动，先准备真实内容。",
      "用统一版式组织案例、目录与导航，设置页面标题和描述。",
      "只给必要区域增加交互；表单明确提交到哪里。",
      "验证移动端阅读、资源加载、外部链接与表单接收结果。",
    ],
    checks: [
      "案例中的数字有来源，未知结果明确标为待验证。",
      "图片和链接可访问，移动端标题不溢出。",
      "表单提交有真实记录，失败时不显示成功。",
    ],
    docs: [
      {
        name: "Astro 入门",
        url: "https://docs.astro.build/en/getting-started/",
      },
      { name: "Vercel 部署说明", url: "https://vercel.com/docs/deployments" },
    ],
  },
  {
    id: "fastapi",
    name: "FastAPI + React",
    category: "AI 与数据",
    level: "前后端协作",
    goal: "把 Python 能力变成 AI 服务",
    summary:
      "Python 服务负责数据处理、模型调用和业务规则，前端负责交互。用明确的 API 契约连接两部分。",
    parts: [
      { name: "FastAPI", role: "Python HTTP 服务与接口校验" },
      { name: "React / Next.js", role: "对话、表单与结果呈现" },
      { name: "模型 API", role: "服务端推理调用" },
      { name: "数据库 / 任务队列", role: "按需保存记录和执行长任务" },
    ],
    fit: "文档分析、业务问答、数据处理与 Python 算法服务。",
    tradeoff:
      "前后端要分别部署并约定接口。长耗时任务应考虑后台执行、状态查询和重试；加上向量库不等于已经具备可靠的知识问答。",
    exercise:
      "做一份文本诊断工具：提交资料 → 服务端校验 → 模型分析 → 人工确认。",
    steps: [
      "定义输入长度、输出 Schema、错误码和超时策略。",
      "先验证一个真实模型请求，密钥只放服务端环境或受保护的配置文件。",
      "加入原文引用、未知项标记与人工确认，避免把模型推断当作业务事实。",
      "用正常、缺失、矛盾和恶意指令样本测试；记录延迟与调用成本。",
    ],
    checks: [
      "模型超时或返回无效 JSON 时有明确失败状态。",
      "引用可追溯到输入资料，业务写入需要明确授权。",
      "重复请求、权限与长任务恢复策略经过验证。",
    ],
    docs: [
      { name: "FastAPI 官方文档", url: "https://fastapi.tiangolo.com/" },
      {
        name: "Next.js 服务端入门",
        url: "https://nextjs.org/docs/app/getting-started/installation",
      },
    ],
  },
  {
    id: "streamlit",
    name: "Python + Streamlit",
    category: "AI 与数据",
    level: "快速验证",
    goal: "先验证数据分析是否有用",
    summary:
      "用 Python 脚本组合输入控件、计算逻辑与可视化，快速把分析过程交给业务方体验。",
    parts: [
      { name: "Python", role: "处理数据与业务计算" },
      { name: "Streamlit", role: "交互界面与展示" },
      { name: "数据处理库", role: "清洗、聚合与指标计算" },
      { name: "模型 API（可选）", role: "生成解释或辅助分析" },
    ],
    fit: "数据分析演示、小范围实验和算法验证。",
    tradeoff:
      "需要理解脚本重跑与会话状态。多用户权限、复杂前端交互和高并发服务应另行设计，不能因为演示可用就认定已经生产就绪。",
    exercise:
      "上传一份脱敏 CSV，检查字段、计算一个指标，并展示口径和异常记录。",
    steps: [
      "先定义字段字典、计算公式与缺失值处理方式。",
      "增加文件检查与预览，让用户知道输入是否可用。",
      "展示中间计算结果和异常明细，避免只给一个总数。",
      "让业务方用另一份数据复验，记录差异并修正指标口径。",
    ],
    checks: [
      "错误格式和空文件会得到清晰提示。",
      "结果能用小样本手工复算。",
      "不同会话的数据不被意外复用或泄露。",
    ],
    docs: [
      { name: "Streamlit 入门", url: "https://docs.streamlit.io/get-started" },
    ],
  },
  {
    id: "docker",
    name: "Docker + Ubuntu + Nginx",
    category: "部署与交付",
    level: "上线运营",
    goal: "把应用交到客户能访问的地址",
    summary:
      "将应用打包为容器，用反向代理提供 HTTPS，明确数据、密钥、重启和回退的管理方式。",
    parts: [
      { name: "Docker", role: "封装可重复运行的应用环境" },
      { name: "Compose", role: "管理服务、网络与数据卷" },
      { name: "Ubuntu", role: "承载运行环境" },
      { name: "Nginx + HTTPS", role: "访问入口、认证与反向代理" },
    ],
    fit: "企业自有服务器、单机 PoC 和需要控制部署环境的应用。",
    tradeoff:
      "服务器部署意味着持续维护：证书、补丁、磁盘、日志、备份和恢复都需要负责人。一个容器可以运行，不代表具备多实例容灾能力。",
    exercise:
      "将已完成的小应用部署到独立路径，确认刷新、写入、重启与版本回退。",
    steps: [
      "固定依赖与构建方式，将密钥、业务数据和本地缓存排除在镜像之外。",
      "把业务数据映射到持久化目录，以非 root 用户运行应用。",
      "配置 HTTPS 和访问认证，只暴露必要入口。",
      "检查健康状态、日志与重启策略，保留旧版本并实际验证备份恢复。",
    ],
    checks: [
      "未登录不能读取项目或修改模型配置。",
      "容器重建后业务数据仍在，证书校验通过。",
      "有明确的回退版本、备份位置和维护负责人。",
    ],
    docs: [
      {
        name: "Docker Compose 官方文档",
        url: "https://docs.docker.com/compose/",
      },
    ],
  },
];
export const practiceSteps = [
  {
    id: "scope",
    title: "写清一个用户任务",
    body: "说明谁在什么场景使用，输入、输出和完成条件是什么。先选一条闭环。",
    deliverable: "一页需求说明 + 明确不做的范围",
  },
  {
    id: "stack",
    title: "选一套能维护的技术栈",
    body: "先看团队技能、现有系统与部署环境，再比较工具。记录选它的理由。",
    deliverable: "组件分工 + 一条数据流",
  },
  {
    id: "slice",
    title: "让 AI 完成一个小切片",
    body: "一次实现一条用户路径。看代码差异、运行结果和报错，再继续下一步。",
    deliverable: "能亲自操作的最小版本",
  },
  {
    id: "data",
    title: "接入真实数据与权限",
    body: "区分原型数据与正式数据，补齐服务端校验、身份验证和持久化。",
    deliverable: "可核实的数据记录 + 权限边界",
  },
  {
    id: "verify",
    title: "验证成功和失败路径",
    body: "检查空输入、接口超时、重复提交、刷新恢复和移动端。AI 说通过不等于验收通过。",
    deliverable: "验收记录 + 已知限制",
  },
  {
    id: "ship",
    title: "部署并保留恢复办法",
    body: "用真实访问地址验收，准备日志、备份与回退版本，然后再收集下一轮反馈。",
    deliverable: "可访问 URL + 交接说明",
  },
];
export const glossary = [
  [
    "技术栈",
    "为一个产品协同工作的技术组合：界面、服务、数据、模型和部署。选型要覆盖整条用户路径。",
  ],
  [
    "AI 编程助手与模型 API",
    "编程助手帮助你写代码；产品中的模型 API 为最终用户提供 AI 功能。两者的配置、权限与费用需要分别考虑。",
  ],
  [
    "前端与后端",
    "前端运行在用户界面一侧；后端承接受保护的规则、数据访问和密钥。隐藏按钮不能代替服务端权限检查。",
  ],
  [
    "数据库与 localStorage",
    "数据库负责服务端持久化与共享；localStorage 属于当前浏览器，不能当作跨设备数据库，也不适合保存服务端密钥。",
  ],
  [
    "RAG、Workflow 与 Agent",
    "RAG 为回答提供检索上下文；Workflow 按明确步骤执行；Agent 在约束内选择下一步或工具。先从简单可验证的流程开始。",
  ],
  [
    "Git 与回退",
    "Git 保存代码版本和变更记录。一次改动尽量围绕一个目的；代码回退与数据库回退需要分别设计。",
  ],
  [
    "环境变量与密钥",
    "配置随环境变化，密钥只应由获授权的服务读取。带 NEXT_PUBLIC_ 的变量会面向浏览器，不能放服务端秘密。",
  ],
  [
    "PoC 与生产",
    "PoC 用小范围验证关键假设；生产还要具备权限、监控、备份、故障恢复与维护责任。",
  ],
] as const;
export function starterPrompt(stack: LearningStack) {
  return `我要为【目标用户】开发【产品名称】，帮助他们完成【一个具体任务】。
采用技术组合：${stack.parts.map((p) => p.name).join(" + ")}。
参考练习：${stack.exercise}

请先确认：
1. 输入、输出、数据来源与可验证的验收标准。
2. 页面、服务端、数据存储分别负责什么。
3. 当前环境、依赖版本、现有代码与部署限制。

先实现一条最小用户路径，每次修改后解释变化并验证结果。
补齐加载、空状态、错误与重试；密钥只放服务端，不写进 Git。
不要编造已执行的测试、真实业务数据或系统集成。
完成后提供运行方式、验证结果、已知限制与下一步。`;
}
