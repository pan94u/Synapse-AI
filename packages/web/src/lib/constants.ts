import {
  MessageSquare,
  Users,
  Wrench,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  Store,
  Cable,
  Settings,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'sidebar.chat', icon: MessageSquare, href: '/chat' },
  { id: 'personas', label: 'sidebar.personas', icon: Users, href: '/personas' },
  { id: 'skills', label: 'sidebar.skills', icon: Wrench, href: '/skills' },
  { id: 'memory', label: 'sidebar.memory', icon: Brain, href: '/memory' },
  { id: 'compliance', label: 'sidebar.compliance', icon: Shield, href: '/compliance' },
  { id: 'proactive', label: 'sidebar.proactive', icon: Zap, href: '/proactive' },
  { id: 'decision', label: 'sidebar.decision', icon: TrendingUp, href: '/decision' },
  { id: 'marketplace', label: 'sidebar.marketplace', icon: Store, href: '/marketplace' },
  { id: 'mcp-marketplace', label: 'sidebar.mcpMarketplace', icon: LayoutGrid, href: '/mcp-marketplace' },
  { id: 'mcp', label: 'sidebar.mcp', icon: Cable, href: '/mcp' },
  { id: 'settings', label: 'sidebar.settings', icon: Settings, href: '/settings' },
];

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
