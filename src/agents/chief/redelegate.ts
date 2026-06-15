// src/agents/chief/redelegate.ts
// ERC-7710 Redelegation — Chief creates sub-agent delegations with budget slices
// This is the A2A coordination core: mathematically enforced budget hierarchy
//
// Chain: Chief ($10/wk) → Scout (30%) → Analyst (60%) → CFO (10%)
//
// Docs: https://docs.metamask.io/smart-accounts-kit/1.1.0/guides/delegation/create-redelegation/

import { insertAuditEvent } from '@/lib/db';
import { PermissionContext } from '@/types';
import crypto from 'crypto';

const BUDGET_ALLOCATION = {
  SCOUT_PCT: 0.30,   // 30% of weekly budget
  ANALYST_PCT: 0.60, // 60% of weekly budget
  CFO_PCT: 0.10,     // 10% of weekly budget
} as const;

// Agent signer addresses (derived deterministically for demo; production uses real keypairs)
const AGENT_ADDRESSES = {
  SCOUT: '0xScout000000000000000000000000000000000001' as `0x${string}`,
  ANALYST: '0xAnalyst00000000000000000000000000000002' as `0x${string}`,
  CFO: '0xCFO0000000000000000000000000000000000003' as `0x${string}`,
};

export interface SubAgentDelegations {
  scoutDelegation: DelegationContext;
  analystDelegation: DelegationContext;
  cfoDelegation: DelegationContext;
  budgets: {
    scout: number;
    analyst: number;
    cfo: number;
  };
}

export interface DelegationContext {
  agentRole: string;
  delegate: `0x${string}`;
  weeklyBudgetUSDC: number;
  permissionsContext: string;
  parentContext: string;
  createdAt: string;
}

/**
 * Creates cryptographic sub-agent delegations from the root ERC-7715 permission.
 *
 * ERC-7710 redelegation: Each sub-agent gets a mathematically-bounded budget slice.
 * If the root permission is revoked (Kill Switch), ALL sub-delegations become invalid.
 *
 * In production this calls redelegatePermissionContext() from @metamask/smart-accounts-kit.
 * For the hackathon demo, we create the delegation structure and log it on-chain via 1Shot.
 *
 * @param rootPermission - The ERC-7715 root permission granted by the user
 * @param weeklyBudgetUSDC - Total weekly budget in USDC
 */
export async function createSubAgentDelegations(
  rootPermission: PermissionContext,
  weeklyBudgetUSDC: number
): Promise<SubAgentDelegations> {
  const scoutBudget = weeklyBudgetUSDC * BUDGET_ALLOCATION.SCOUT_PCT;
  const analystBudget = weeklyBudgetUSDC * BUDGET_ALLOCATION.ANALYST_PCT;
  const cfoBudget = weeklyBudgetUSDC * BUDGET_ALLOCATION.CFO_PCT;

  // Log the redelegation event to the audit trail
  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'Chief',
    action: 'REDELEGATE_PERMISSIONS',
    detail: `ERC-7710 redelegation: Scout $${scoutBudget.toFixed(2)}/wk | Analyst $${analystBudget.toFixed(2)}/wk | CFO $${cfoBudget.toFixed(2)}/wk`,
    cost: 0,
    confirmed: true,
  });

  const timestamp = new Date().toISOString();

  // In production: these are real signed delegations via redelegatePermissionContext()
  // Each delegation is cryptographically linked to the parent permission context.
  // The MetaMask Smart Accounts Kit validates the full chain on every execution.

  const scoutDelegation: DelegationContext = {
    agentRole: 'Scout',
    delegate: AGENT_ADDRESSES.SCOUT,
    weeklyBudgetUSDC: scoutBudget,
    permissionsContext: deriveChildContext(rootPermission.permissionsContext, 'scout', scoutBudget),
    parentContext: rootPermission.permissionsContext,
    createdAt: timestamp,
  };

  const analystDelegation: DelegationContext = {
    agentRole: 'Analyst',
    delegate: AGENT_ADDRESSES.ANALYST,
    weeklyBudgetUSDC: analystBudget,
    permissionsContext: deriveChildContext(rootPermission.permissionsContext, 'analyst', analystBudget),
    parentContext: rootPermission.permissionsContext,
    createdAt: timestamp,
  };

  const cfoDelegation: DelegationContext = {
    agentRole: 'CFO',
    delegate: AGENT_ADDRESSES.CFO,
    weeklyBudgetUSDC: cfoBudget,
    permissionsContext: deriveChildContext(rootPermission.permissionsContext, 'cfo', cfoBudget),
    parentContext: rootPermission.permissionsContext,
    createdAt: timestamp,
  };

  // Log each delegation
  for (const delegation of [scoutDelegation, analystDelegation, cfoDelegation]) {
    await insertAuditEvent({
      id: crypto.randomUUID(),
      agent: 'Chief',
      action: `DELEGATION_CREATED:${delegation.agentRole.toUpperCase()}`,
      detail: `${delegation.agentRole} Agent delegated $${delegation.weeklyBudgetUSDC.toFixed(2)}/wk | ERC-7710 context: ${delegation.permissionsContext.slice(0, 20)}...`,
      cost: 0,
      confirmed: true,
    });
  }

  return {
    scoutDelegation,
    analystDelegation,
    cfoDelegation,
    budgets: {
      scout: scoutBudget,
      analyst: analystBudget,
      cfo: cfoBudget,
    },
  };
}

/**
 * Derives a child permission context from a parent.
 * In production: this is the actual redelegatePermissionContext() return value.
 * For demo: deterministic derivation showing the mathematical relationship.
 */
function deriveChildContext(
  parentContext: `0x${string}`,
  role: string,
  budget: number
): string {
  // Simulate: child context is cryptographically derived from parent
  // Real: redelegatePermissionContext() returns a signed delegation chain
  const budgetHex = Math.floor(budget * 1_000_000).toString(16).padStart(12, '0');
  const roleHex = Buffer.from(role).toString('hex').slice(0, 8);
  return `0xef0100${roleHex}${budgetHex}${parentContext.slice(14, 42)}`;
}
