// AI CFO Agent — Venice AI compute cost optimization

import { insertAuditEvent, updateAgentState } from '@/lib/db';
import { ComputeMetrics } from '@/types';
import crypto from 'crypto';

const DIEM_BREAK_EVEN_MONTHLY_USD = 40;
const VVV_USDC_PRICE_ESTIMATE = 2.50;

export interface CFODecision {
  action: 'stake' | 'payAsYouGo';
  reasoning: string;
  diemAmount?: number;
  estimatedSavingsMonthly?: number;
}

export async function evaluateComputeStrategy(metrics: ComputeMetrics): Promise<CFODecision> {
  await updateAgentState('cfo', {
    status: 'active',
    currentAction: `Evaluating compute strategy: $${metrics.weeklyX402Spend.toFixed(3)}/wk Venice spend`,
  });

  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'CFO',
    action: 'EVALUATE_COMPUTE',
    detail: `Weekly Venice spend: $${metrics.weeklyX402Spend.toFixed(3)} | Projected monthly: $${metrics.projectedMonthlySpend.toFixed(2)} | Break-even: $${metrics.diemMintThreshold}/mo`,
    cost: 0,
    confirmed: true,
  });

  if (metrics.projectedMonthlySpend > metrics.diemMintThreshold) {
    return await recommendDIEMStaking(metrics);
  }
  return await recommendPayAsYouGo(metrics);
}

async function recommendDIEMStaking(metrics: ComputeMetrics): Promise<CFODecision> {
  const diemToBuy = Math.ceil(metrics.projectedMonthlySpend);
  const vvvNeeded = diemToBuy / VVV_USDC_PRICE_ESTIMATE;
  const usdcCost = diemToBuy * VVV_USDC_PRICE_ESTIMATE;
  const monthlySavings = metrics.projectedMonthlySpend;

  const reasoning = (
    `Monthly Venice spend of $${metrics.projectedMonthlySpend.toFixed(2)} exceeds ` +
    `DIEM break-even of $${metrics.diemMintThreshold}/month. ` +
    `Recommend acquiring ${diemToBuy} DIEM (via ${vvvNeeded.toFixed(1)} VVV on Aerodrome/Base). ` +
    `Pipeline: USDC → VVV → sVVV (4-week stake) → DIEM mint → perpetual daily credits. ` +
    `On-chain execution requires Venice VVV staking contracts — logged as recommendation only.`
  );

  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'CFO',
    action: 'DIEM_STAKE_RECOMMENDED',
    detail: reasoning,
    cost: usdcCost,
    confirmed: true,
  });

  await updateAgentState('cfo', { status: 'idle', currentAction: null });

  return {
    action: 'stake',
    reasoning,
    diemAmount: diemToBuy,
    estimatedSavingsMonthly: monthlySavings,
  };
}

async function recommendPayAsYouGo(metrics: ComputeMetrics): Promise<CFODecision> {
  const reasoning = (
    `Monthly Venice spend of $${metrics.projectedMonthlySpend.toFixed(2)} is below ` +
    `DIEM break-even of $${metrics.diemMintThreshold}/month. ` +
    `Continuing pay-as-you-go (x402) mode. ` +
    `Re-evaluate when projected monthly spend exceeds $${metrics.diemMintThreshold}.`
  );

  await insertAuditEvent({
    id: crypto.randomUUID(),
    agent: 'CFO',
    action: 'PAY_AS_YOU_GO',
    detail: reasoning,
    cost: 0,
    confirmed: true,
  });

  await updateAgentState('cfo', { status: 'idle', currentAction: null });

  return { action: 'payAsYouGo', reasoning };
}

export function calculateComputeMetrics(
  weeklyVeniceSpend: number,
  weeklyScoutSpend: number
): ComputeMetrics {
  const weeklyX402Spend = weeklyVeniceSpend + weeklyScoutSpend;
  const projectedMonthlySpend = weeklyX402Spend * 4.33;

  return {
    weeklyX402Spend,
    projectedMonthlySpend,
    diemMintThreshold: DIEM_BREAK_EVEN_MONTHLY_USD,
  };
}
