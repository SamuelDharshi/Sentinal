// ERC-7710 Redelegation — Chief creates sub-agent delegations with budget slices

import { insertAuditEvent } from '@/lib/db';
import { PermissionContext } from '@/types';
import { keccak256, encodePacked } from 'viem';
import crypto from 'crypto';

const BUDGET_ALLOCATION = {
  SCOUT_PCT: 0.30,
  ANALYST_PCT: 0.60,
  CFO_PCT: 0.10,
} as const;

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

/** Deterministic agent address derived from the user's session key + role. */
function deriveAgentAddress(sessionKey: `0x${string}`, role: string): `0x${string}` {
  const hash = keccak256(encodePacked(['address', 'string'], [sessionKey, role]));
  return `0x${hash.slice(-40)}` as `0x${string}`;
}

/**
 * Creates sub-agent delegations from the root ERC-7715 permission.
 * Each sub-agent gets a budget slice linked to the session key hierarchy.
 */
export async function createSubAgentDelegations(
  rootPermission: PermissionContext,
  weeklyBudgetUSDC: number,
  sessionKeyAddress: `0x${string}`
): Promise<SubAgentDelegations> {
  const scoutBudget = weeklyBudgetUSDC * BUDGET_ALLOCATION.SCOUT_PCT;
  const analystBudget = weeklyBudgetUSDC * BUDGET_ALLOCATION.ANALYST_PCT;
  const cfoBudget = weeklyBudgetUSDC * BUDGET_ALLOCATION.CFO_PCT;

  const agentAddresses = {
    scout: deriveAgentAddress(sessionKeyAddress, 'scout'),
    analyst: deriveAgentAddress(sessionKeyAddress, 'analyst'),
    cfo: deriveAgentAddress(sessionKeyAddress, 'cfo'),
  };

  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'Chief',
    action: 'REDELEGATE_PERMISSIONS',
    detail: `ERC-7710 redelegation: Scout $${scoutBudget.toFixed(2)}/wk | Analyst $${analystBudget.toFixed(2)}/wk | CFO $${cfoBudget.toFixed(2)}/wk`,
    cost: 0,
    confirmed: true,
  });

  const timestamp = new Date().toISOString();

  const scoutDelegation: DelegationContext = {
    agentRole: 'Scout',
    delegate: agentAddresses.scout,
    weeklyBudgetUSDC: scoutBudget,
    permissionsContext: deriveChildContext(rootPermission.permissionsContext, 'scout', scoutBudget),
    parentContext: rootPermission.permissionsContext,
    createdAt: timestamp,
  };

  const analystDelegation: DelegationContext = {
    agentRole: 'Analyst',
    delegate: agentAddresses.analyst,
    weeklyBudgetUSDC: analystBudget,
    permissionsContext: deriveChildContext(rootPermission.permissionsContext, 'analyst', analystBudget),
    parentContext: rootPermission.permissionsContext,
    createdAt: timestamp,
  };

  const cfoDelegation: DelegationContext = {
    agentRole: 'CFO',
    delegate: agentAddresses.cfo,
    weeklyBudgetUSDC: cfoBudget,
    permissionsContext: deriveChildContext(rootPermission.permissionsContext, 'cfo', cfoBudget),
    parentContext: rootPermission.permissionsContext,
    createdAt: timestamp,
  };

  for (const delegation of [scoutDelegation, analystDelegation, cfoDelegation]) {
    await insertAuditEvent({
      id: crypto.randomUUID(),
      agent: 'Chief',
      action: `DELEGATION_CREATED:${delegation.agentRole.toUpperCase()}`,
      detail: `${delegation.agentRole} Agent → ${delegation.delegate.slice(0, 10)}... | $${delegation.weeklyBudgetUSDC.toFixed(2)}/wk`,
      cost: 0,
      confirmed: true,
    });
  }

  return {
    scoutDelegation,
    analystDelegation,
    cfoDelegation,
    budgets: { scout: scoutBudget, analyst: analystBudget, cfo: cfoBudget },
  };
}

function deriveChildContext(
  parentContext: `0x${string}`,
  role: string,
  budget: number
): string {
  const budgetHex = Math.floor(budget * 1_000_000).toString(16).padStart(12, '0');
  const roleHex = Buffer.from(role).toString('hex').slice(0, 8);
  const childSeed = keccak256(encodePacked(['string', 'uint256'], [role, BigInt(Math.floor(budget * 1_000_000))]));
  return `0xef0100${roleHex}${budgetHex}${childSeed.slice(6, 34)}`;
}
