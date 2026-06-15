// SENTINEL — Type Definitions
// Central type registry for the entire application

export interface IntelligenceCard {
  id: string;
  headline: string;
  summary: string;
  urgency: 'low' | 'medium' | 'high';
  actionSuggested: string;
  sourceCount: number;
  sources: Source[];
  delegationTrace: DelegationStep[];
  totalCost: number; // in USDC
  createdAt: string;
  brief: string;
}

export interface Source {
  title: string;
  url: string;
  type: 'free' | 'x402';
  cost?: number;
}

export interface DelegationStep {
  agent: 'Chief' | 'Scout' | 'Analyst' | 'CFO';
  action: string;
  cost: number;
  txHash?: string;
  confirmed: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  agent: 'Chief' | 'Scout' | 'Analyst' | 'CFO' | 'System';
  action: string;
  detail: string;
  cost?: number;
  txHash?: string;
  confirmed?: boolean;
}

export interface AgentState {
  id: 'chief' | 'scout' | 'analyst' | 'cfo';
  name: string;
  status: 'idle' | 'active' | 'killed' | 'error';
  currentAction?: string;
  remainingBudget: number; // USDC in 6-decimal representation
  weeklyBudget: number;
  lastSeen?: string;
}

export interface SessionConfig {
  brief: string;
  competitors: string[];
  sources: string[];
  weeklyBudgetUSDC: number; // e.g. 10.00
  userAddress: `0x${string}`;
  permissionContext?: unknown;
  sessionAccount?: `0x${string}`;
}

export interface PermissionContext {
  permissionsContext: `0x${string}`;
  permissions: unknown[];
  expiry: number;
  signerData?: unknown;
}

export interface TaskList {
  scout: ScoutTask[];
  analyst: string[];
  thresholds: ComputeThresholds;
}

export interface ScoutTask {
  source: string;
  query: string;
  priority: 'high' | 'medium' | 'low';
  endpoint?: string;
}

export interface ScoutResult {
  source: string;
  query: string;
  data: string;
  cost: number;
  txHash?: string;
}

export interface ComputeMetrics {
  weeklyX402Spend: number;
  projectedMonthlySpend: number;
  diemMintThreshold: number;
}

export interface ComputeThresholds {
  maxCostPerQuery: number;
  alertOnHighUrgency: boolean;
  evaluateDIEMWeekly: boolean;
}

export interface OneShotWebhookPayload {
  taskId: string;
  status: 'Pending' | 'Submitted' | 'Confirmed' | 'Failed';
  transactionHash?: string;
  chainId?: number;
  error?: string;
  timestamp: string;
}

export interface RelayerCapabilities {
  targetAddress: `0x${string}`;
  feeCollector: `0x${string}`;
  supportedTokens: {
    chainId: number;
    tokens: Array<{ address: `0x${string}`; symbol: string; decimals: number }>;
  }[];
}
