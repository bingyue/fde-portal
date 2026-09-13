export type StageStatus =
  "未开始" | "进行中" | "存在风险" | "待评审" | "已通过" | "未通过";
export type RiskLevel = "低" | "中" | "高";
export type EvidenceDimension = "技术" | "业务" | "采纳";

export interface Workspace {
  id: string;
  name: string;
  type: "团队空间" | "企业空间";
  members: number;
}

export interface Project {
  id: string;
  name: string;
  type: "企业POC" | "内部AI创新项目";
  organization: string;
  industry: string;
  goal: string;
  owner: string;
  businessOwner: string;
  stage: string;
  status: string;
  updatedAt: string;
}

export interface ScenarioCard {
  id: string;
  name: string;
  department: string;
  businessOwner: string;
  users: string;
  frequency: string;
  trigger: string;
  input: string;
  currentProcess: string;
  currentOutput: string;
  duration: string;
  cost: string;
  baseline: string;
  aiTask: string;
  targetOutput: string;
  targetMetrics: string;
  humanBoundary: string;
  exclusions: string;
  dataSources: string;
  businessRules: string;
  sensitiveLevel: string;
  agentName: string;
  workflow: string;
  skills: string;
  tools: string;
  exceptionHandling: string;
  testRequirements: string;
  dimensions: string;
  threshold: string;
  failureTypes: string;
  acceptanceOwner: string;
  valueTarget: string;
  version: number;
  status: "草稿" | "待评审" | "已通过";
}

export interface PocStage {
  id: string;
  code: string;
  name: string;
  objective: string;
  status: StageStatus;
  owner: string;
  dueDate: string;
  criteriaTotal: number;
  criteriaPassed: number;
  evidenceCount: number;
  blockers: string[];
  criteria?: AcceptanceCriterion[];
}

export interface AcceptanceCriterion {
  id: string;
  title: string;
  dimension: EvidenceDimension;
  passed: boolean;
}

export interface OutcomeContract {
  sponsor: string;
  metricName: string;
  baselineValue: string;
  targetValue: string;
  unit: string;
  annualValue: number;
  annualCost: number;
  valueFormula: string;
  successCondition: string;
  stopCondition: string;
  riskLevel: RiskLevel;
  status: "草稿" | "已确认";
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  level: "战略层" | "运营层" | "执行层";
  stance: "推动" | "中立" | "阻碍";
}

export interface WorkflowStep {
  id: string;
  name: string;
  owner: string;
  mode: "人工处理" | "AI建议" | "人工确认" | "自动执行";
  system: string;
  outcome: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  dimension: EvidenceDimension;
  uncertainty: RiskLevel;
  experiment: string;
  threshold: string;
  owner: string;
  evidence: string;
  status: "待验证" | "实验中" | "已验证" | "已否定";
}

export interface OperatingChecklistItem {
  id: string;
  title: string;
  owner: string;
  completed: boolean;
}

export interface AdoptionPlan {
  champion: string;
  targetUsers: number;
  activeUsers: number;
  items: OperatingChecklistItem[];
}

export interface ProductionProfile {
  automationLevel: "AI建议" | "人工确认" | "异常确认" | "自动执行";
  availabilityTarget: string;
  taskCostBudget: number;
  rollbackOwner: string;
  items: OperatingChecklistItem[];
}

export interface EvalRun {
  id: string;
  version: string;
  model: string;
  promptVersion: string;
  successRate: number;
  businessScore: number;
  severeFailures: number;
  cost: number;
  latency: number;
  takeoverRate: number;
  createdAt: string;
}

export interface EvalCase {
  id: string;
  input: string;
  expected: string;
  type: string;
  severity: "低" | "中" | "高";
  source: string;
}

export interface EvalSuite {
  id: string;
  name: string;
  version: string;
  threshold: number;
  status: "草稿" | "执行中" | "已完成";
  caseCount: number;
  cases?: EvalCase[];
  runs: EvalRun[];
}

export interface Asset {
  id: string;
  name: string;
  type:
    | "Agent"
    | "Skill"
    | "Tool"
    | "Prompt"
    | "Workflow"
    | "MCP"
    | "Knowledge Base"
    | "Dataset"
    | "Eval Suite"
    | "Report Template";
  version: string;
  owner: string;
  status: "草稿" | "验证中" | "可复用";
  score: number;
  permission: string;
  reusable: boolean;
}

export interface Risk {
  id: string;
  title: string;
  level: RiskLevel;
  status: "开放" | "监控中" | "已关闭";
  owner: string;
}

export interface Review {
  id: string;
  type: string;
  title: string;
  submitter: string;
  reviewer: string;
  version: string;
  status: "待评审" | "已通过" | "退回修改" | "有条件通过";
  submittedAt: string;
}

export interface Report {
  id: string;
  type: "POC立项书" | "Eval评测报告" | "POC验收报告";
  version: string;
  status: "草稿" | "待确认" | "已确认";
  generatedAt: string;
}

export interface Activity {
  id: string;
  text: string;
  actor: string;
  time: string;
  tone: "neutral" | "success" | "warning";
}

export interface PortalState {
  diagnoses: import("./diagnosis").DiagnosisSession[];
  workspace: Workspace;
  project: Project;
  outcomeContract: OutcomeContract;
  stakeholders: Stakeholder[];
  workflowSteps: WorkflowStep[];
  hypotheses: Hypothesis[];
  adoptionPlan: AdoptionPlan;
  productionProfile: ProductionProfile;
  scenario: ScenarioCard;
  stages: PocStage[];
  evalSuites: EvalSuite[];
  assets: Asset[];
  risks: Risk[];
  reviews: Review[];
  reports: Report[];
  activities: Activity[];
  flow: {
    workspaceCreated: boolean;
    projectCreated: boolean;
    scenarioConfirmed: boolean;
    pocGenerated: boolean;
    evalCreated: boolean;
    assetRegistered: boolean;
    reviewSubmitted: boolean;
    reportGenerated: boolean;
  };
}
