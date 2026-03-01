export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  personality: {
    tone: 'professional' | 'friendly' | 'concise' | 'detailed';
    focus: 'accuracy' | 'speed' | 'creativity' | 'compliance';
    caution: 'high' | 'medium' | 'low';
  };
  defaultSkills: string[];
  allowedMcpServers: string[];
  allowedTools?: string[];
  complianceRuleset: string;
  proactiveTasks?: Array<{
    schedule?: string;
    trigger?: string;
    action: string;
  }>;
  orgMemoryAccess?: string[];
}

export interface PersonaContext {
  personaId: string;
  personaName: string;
  systemPromptAddition: string;
  allowedTools: string[];
  complianceRuleset: string;
}
