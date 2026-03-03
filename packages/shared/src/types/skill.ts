/** 技能分类 */
export type SkillCategory = 'development' | 'automation' | 'data' | 'writing' | 'system' | 'web' | 'business' | 'custom';

/** 技能状态 */
export type SkillStatus = 'draft' | 'active' | 'disabled';

/** 技能来源 */
export type SkillSource = 'built-in' | 'installed' | 'custom';

/** 技能参数定义 */
export interface SkillParameter {
  name: string;                     // kebab-case
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  required: boolean;
  default?: string | number | boolean;
  options?: string[];               // for type=select
}

/** 技能定义 (对齐 Anthropic Agent Skills 规范) */
export interface SkillDefinition {
  id: string;                       // = name, kebab-case (如 "monthly-report")
  name: string;                     // 同 id，规范 name 字段
  description: string;              // max 1024, 含触发场景描述
  category: SkillCategory;
  status: SkillStatus;
  source: SkillSource;
  allowedTools: string[];           // 工具域限定
  parameters: SkillParameter[];
  instructions: string;             // SKILL.md Markdown body
  // 规范可选字段
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  // 运行时
  skillDir: string;                 // 技能目录路径 (用于读取 bundled files)
  createdAt?: string;
  updatedAt?: string;
}

/** 技能执行记录 */
export interface SkillExecution {
  id: string;
  skillId: string;
  personaId: string;
  triggerType: 'manual' | 'agent_tool' | 'proactive';
  parameters: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
  model?: string;
  toolCallsExecuted?: number;
  startedAt: string;
  completedAt?: string;
}
