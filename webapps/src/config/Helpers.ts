import { BudgetEnvelope, EnvelopeContribution, PlanEntry, PlanResult, AffordabilityResult, AmortizationRow, PaymentPlan } from './Types';

// ── Formatting ─────────────────────────────────────────────────────────────────
export const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Date math ──────────────────────────────────────────────────────────────────
export function daysUntil(dateStr?: string): number | null {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function addMonths(base: Date, n: number): Date {
    const d = new Date(base);
    d.setMonth(d.getMonth() + n);
    return d;
}

export function monthsBetween(from: Date, to: Date): number {
    return Math.max(
        (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 1,
    );
}

// ── Progress ───────────────────────────────────────────────────────────────────
export function progressPct(current: number, target: number): number {
    if (target <= 0) return 100;
    return Math.min((current / target) * 100, 100);
}

export function projectedCompletion(remaining: number, monthly: number): Date {
    if (monthly <= 0) return addMonths(new Date(), 999);
    return addMonths(new Date(), Math.ceil(remaining / monthly));
}

// ── Envelope analytics ─────────────────────────────────────────────────────────
export function urgencyScore(env: BudgetEnvelope): number {
    let score = 0;
    if (env.targetDate) {
        const days = Math.max((new Date(env.targetDate).getTime() - Date.now()) / 86400000, 1);
        score += 10000 / days;
    }
    if (env.envelopeType === 'PAYOFF')    score += 500;
    if (env.envelopeType === 'EMERGENCY') score += 300;
    score += (env.targetAmount > 0 ? env.remainingAmount / env.targetAmount : 0) * 100;
    return score;
}

export function velocityDays(env: BudgetEnvelope): number | null {
    if (!env.targetDate) return null;
    const start  = new Date(env.startDate).getTime();
    const end    = new Date(env.targetDate).getTime();
    const now    = Date.now();
    const total  = end - start;
    if (total <= 0) return null;
    const elapsed     = now - start;
    const expectedPct = Math.min(elapsed / total, 1);
    const actualPct   = progressPct(env.currentAmount, env.targetAmount) / 100;
    const diffPct     = actualPct - expectedPct;
    const totalDays   = total / 86400000;
    return Math.round(diffPct * totalDays);
}

export function requiredMonthly(env: BudgetEnvelope): number | null {
    if (!env.targetDate) return null;
    const months = monthsBetween(new Date(), new Date(env.targetDate));
    return Math.max(Math.ceil((env.remainingAmount / months) * 100) / 100, 0);
}

export function avgContribution(contributions: EnvelopeContribution[], envelopeId: number): number | null {
    const c = contributions.filter(x => x.envelopeId === envelopeId);
    if (!c.length) return null;
    return Math.round(c.reduce((s, x) => s + x.amount, 0) / c.length * 100) / 100;
}

// ── Month filtering ────────────────────────────────────────────────────────────
export function isEnvelopeActiveInMonth(env: BudgetEnvelope, monthStart: Date, monthEnd: Date): boolean {
    const start = new Date(env.startDate);
    if (start > monthEnd) return false;
    if (!env.targetDate)  return true;
    const end = new Date(env.targetDate);
    return end >= monthStart;
}

export function monthlyContributed(
    contributions: EnvelopeContribution[],
    envelopeId: number,
    monthStart: Date,
    monthEnd: Date,
): number {
    return contributions
        .filter(c => {
            if (c.envelopeId !== envelopeId) return false;
            const d = new Date(c.contributedAt);
            return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, c) => s + c.amount, 0);
}

// ── Planner helpers ────────────────────────────────────────────────────────────
export function distributeAuto(entries: PlanEntry[], envelopes: BudgetEnvelope[], budget: number): PlanEntry[] {
    const locked    = entries.filter(e => e.locked);
    const unlocked  = entries.filter(e => !e.locked);
    const lockedSum = locked.reduce((s, e) => s + e.monthlyAlloc, 0);
    const remaining = Math.max(budget - lockedSum, 0);
    const envMap    = new Map(envelopes.map(e => [e.id, e]));
    const scores    = unlocked.map(e => ({ id: e.envelopeId, score: urgencyScore(envMap.get(e.envelopeId)!) }));
    const total     = scores.reduce((s, x) => s + x.score, 0);
    return entries.map(entry => {
        if (entry.locked) return entry;
        const sc      = scores.find(s => s.id === entry.envelopeId);
        const alloc   = total > 0 ? (sc!.score / total) * remaining : remaining / unlocked.length;
        const rounded = Math.round(alloc * 100) / 100;
        return { ...entry, monthlyAlloc: rounded, autoAlloc: rounded };
    });
}

export function computeResults(entries: PlanEntry[], envelopes: BudgetEnvelope[]): PlanResult[] {
    const envMap = new Map(envelopes.map(e => [e.id, e]));
    return entries.map(entry => {
        const env         = envMap.get(entry.envelopeId)!;
        const remaining   = env.remainingAmount;
        const monthly     = entry.monthlyAlloc;
        const projDate    = projectedCompletion(remaining, monthly);
        const targetDate  = env.targetDate ? new Date(env.targetDate) : null;
        const meetsTarget = !targetDate || projDate <= targetDate;
        const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : 999;
        const shortfall    = targetDate && !meetsTarget
            ? Math.round((projDate.getTime() - targetDate.getTime()) / 86400000) : 0;
        return { envelopeId: entry.envelopeId, monthlyAlloc: monthly, projectedDate: projDate, meetsTarget, monthsNeeded, shortfall };
    });
}

export function computeAffordability(envelopes: BudgetEnvelope[], availableBalance: number): AffordabilityResult[] {
    let remaining = availableBalance;
    return [...envelopes].sort((a, b) => a.priority - b.priority).map(env => {
        const needed = Math.min(env.allocatedAmount, env.remainingAmount);
        if (remaining <= 0) return { envelopeId: env.id, suggested: 0, status: 'SKIP' as const };
        if (remaining >= needed) { remaining -= needed; return { envelopeId: env.id, suggested: needed, status: 'FULL' as const }; }
        const partial = Math.round(remaining * 100) / 100;
        remaining = 0;
        return { envelopeId: env.id, suggested: partial, status: 'PARTIAL' as const };
    });
}

// ── Amortization ───────────────────────────────────────────────────────────────
export function buildAmortization(plan: PaymentPlan, paid: number, monthly: number): AmortizationRow[] {
    const rows: AmortizationRow[] = [];
    let balance = plan.originalBalance;
    const start = new Date('2026-02-01');
    let paidSoFar = 0;
    let m = 0;
    while (balance > 0.01 && m < 60) {
        const payment   = Math.min(monthly, balance);
        const interest  = plan.apr > 0 ? balance * (plan.apr / 100 / 12) : 0;
        const principal = payment - interest;
        balance         = Math.max(balance - principal, 0);
        paidSoFar      += payment;
        const date = addMonths(start, m);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        let status: AmortizationRow['status'] = 'UPCOMING';
        if (paidSoFar - payment < paid && paidSoFar <= paid) status = 'PAID';
        else if (paidSoFar - payment < paid) status = 'DUE';
        if (balance < 0.01) status = status === 'PAID' ? 'PAID' : 'FINAL';
        rows.push({
            month: m + 1,
            date:  dateStr,
            payment: Math.round(payment * 100) / 100,
            principal: Math.round(principal * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            balance:  Math.round(balance * 100) / 100,
            status,
        });
        m++;
    }
    return rows;
}