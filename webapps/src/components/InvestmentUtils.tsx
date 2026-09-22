import { alpha } from '@mui/material';

// ── Shared design tokens ──────────────────────────────────────────────────
export const MAROON      = '#6b1a1a';
export const MAROON_DARK = '#4a1010';

// ── Domain types ───────────────────────────────────────────────────────────
export type AccountType = '401k' | 'ira' | 'brokerage' | 'savings' | 'emergency';

export interface InvestmentAccount {
    id: number;
    name: string;
    institution: string;
    type: AccountType;
    balance: number;
    monthlyContribution: number;
    floorThreshold: number | null;   // minimum balance the user wants to monitor
    goalAmount: number | null;       // target balance
    goalDate: string | null;         // ISO date string, target date for goalAmount
    plaidAccountId?: string | null;  // present if this account came from Plaid Link
    loan?: Loan;
}

// ── Card theme tokens — same shape as BudgetPage's CARD_THEMES ────────────
export const ACCOUNT_THEMES = {
    retirement: {
        base: '#fdf6ec', border: '#B8935A', valueColor: '#5a4321',
        barColor: '#B8935A', chipBg: 'rgba(184,147,90,0.14)', chipColor: '#8a6a3f', labelColor: '#8a7355',
    },
    brokerage: {
        base: '#f0f9ff', border: '#0284c7', valueColor: '#0c4a6e',
        barColor: '#0284c7', chipBg: 'rgba(2,132,199,0.12)', chipColor: '#075985', labelColor: '#3a6070',
    },
    savings_goal: {
        base: '#f0fdf4', border: '#16a34a', valueColor: '#14532d',
        barColor: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', labelColor: '#4a7060',
    },
    emergency: {
        base: '#fff1f2', border: MAROON, valueColor: '#7f1d1d',
        barColor: MAROON, chipBg: alpha(MAROON, 0.10), chipColor: MAROON, labelColor: '#7a3030',
    },
} as const;

export type AccountThemeKey = keyof typeof ACCOUNT_THEMES;

/**
 * Maps a Plaid account subtype (returned from Link/accounts) to our internal
 * AccountType. Plaid's investment subtypes are more granular than we need to
 * show in the UI, so several collapse into the same bucket.
 * Reference: https://plaid.com/docs/api/accounts/#account-type-schema
 */
export function mapPlaidSubtypeToAccountType(subtype: string): AccountType {
    const s = subtype.toLowerCase();
    if (['401k', '401a', '403b', '457b', 'pension', 'profit sharing plan', 'thrift savings plan'].includes(s)) return '401k';
    if (['ira', 'roth', 'roth 401k', 'sep ira', 'simple ira', 'sarsep'].includes(s)) return 'ira';
    if (['hsa', 'cd', 'money market', 'savings'].includes(s)) return 'savings';
    // brokerage, non-taxable brokerage account, mutual fund, stock plan, etc.
    return 'brokerage';
}

export function themeForAccount(type: AccountType): { key: AccountThemeKey; label: string } {
    switch (type) {
        case '401k':
        case 'ira':      return { key: 'retirement', label: type === '401k' ? '401(k)' : 'IRA' };
        case 'brokerage': return { key: 'brokerage', label: 'Brokerage' };
        case 'emergency': return { key: 'emergency', label: 'Emergency Fund' };
        default:          return { key: 'savings_goal', label: 'Savings' };
    }
}

export function thresholdStatus(balance: number, floor: number | null): { label: string; ok: boolean } {
    if (floor === null) return { label: 'No floor set', ok: true };
    const cushion = balance - floor;
    if (cushion < 0) return { label: `$${Math.abs(cushion).toLocaleString()} below floor`, ok: false };
    if (cushion < floor * 0.05) return { label: `$${cushion.toLocaleString()} above floor`, ok: false };
    return { label: `$${cushion.toLocaleString()} above floor`, ok: true };
}

export function goalProgress(balance: number, goalAmount: number | null): number {
    if (!goalAmount || goalAmount <= 0) return 0;
    return Math.min(100, (balance / goalAmount) * 100);
}

export const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ── Projection helpers ──────────────────────────────────────────────────────
// Default assumed annual growth rate by account type. Swap for the user's own
// assumption (or a real market-data source) once this is wired to the backend.
export function defaultGrowthRate(type: AccountType): number {
    switch (type) {
        case '401k':
        case 'ira':
        case 'brokerage': return 7;   // long-horizon market accounts
        case 'savings':
        case 'emergency': return 4;   // high-yield savings APY
        default: return 0;
    }
}

export interface ProjectionPoint { month: number; balance: number; }

/**
 * Projects an account's balance forward `months` months, compounding
 * `annualGrowthPct` monthly and adding `monthlyContribution + extraMonthly`
 * at the end of each month. This is a simple linear/compounding estimate for
 * previewing "what if" scenarios — not a substitute for a real market model.
 */
export function projectSeries(
    account: InvestmentAccount,
    months: number,
    extraMonthly: number,
    annualGrowthPct: number
): ProjectionPoint[] {
    const monthlyRate = annualGrowthPct / 100 / 12;
    const points: ProjectionPoint[] = [];
    let balance = account.balance;
    for (let m = 0; m <= months; m++) {
        points.push({ month: m, balance: Math.round(balance) });
        balance = balance * (1 + monthlyRate) + account.monthlyContribution + extraMonthly;
    }
    return points;
}

/** Returns the first month index at which the account reaches `goalAmount`, or null if beyond the horizon. */
export function monthsToReachGoal(
    account: InvestmentAccount,
    annualGrowthPct: number,
    extraMonthly: number = 0,
    horizonMonths: number = 600
): number | null {
    if (!account.goalAmount) return null;
    if (account.balance >= account.goalAmount) return 0;
    const monthlyRate = annualGrowthPct / 100 / 12;
    let balance = account.balance;
    for (let m = 1; m <= horizonMonths; m++) {
        balance = balance * (1 + monthlyRate) + account.monthlyContribution + extraMonthly;
        if (balance >= account.goalAmount) return m;
    }
    return null;
}

// ── Portfolios ───────────────────────────────────────────────────────────────
// A Portfolio groups one or more accounts under a single target amount / date
// / contribution plan — e.g. a single 401(k), or a "Retirement" portfolio
// spanning a 401(k) + an IRA + a brokerage account together.
export interface Portfolio {
    id: number;
    name: string;
    goal: string;                    // short description of what this is for
    accountIds: number[];            // one id = single-account portfolio, several = multi-account
    targetAmount: number;
    targetDate: string;              // ISO date
    contributionPercentage: number;  // % of monthly income allocated to this portfolio
}

export function portfolioAccounts(portfolio: Portfolio, accounts: InvestmentAccount[]): InvestmentAccount[] {
    return accounts.filter(a => portfolio.accountIds.includes(a.id));
}

export function portfolioBalance(portfolio: Portfolio, accounts: InvestmentAccount[]): number {
    return portfolioAccounts(portfolio, accounts).reduce((s, a) => s + a.balance, 0);
}

/** Balance-weighted average growth rate across the portfolio's underlying accounts. */
export function portfolioGrowthRate(portfolio: Portfolio, accounts: InvestmentAccount[]): number {
    const linked = portfolioAccounts(portfolio, accounts);
    if (linked.length === 0) return 0;
    const totalBalance = linked.reduce((s, a) => s + a.balance, 0) || 1;
    return linked.reduce((s, a) => s + defaultGrowthRate(a.type) * (a.balance / totalBalance), 0);
}

export function portfolioMonthlyDollarContribution(portfolio: Portfolio, monthlyIncome: number): number {
    return monthlyIncome * (portfolio.contributionPercentage / 100);
}

export function monthsUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24 * 30.44)));
}

/**
 * Generic version of projectSeries — projects a starting balance forward
 * with a flat monthly contribution, compounding monthly. Used for portfolios,
 * where the "contribution" is derived from a percentage of income rather
 * than a fixed per-account dollar amount.
 */
export function projectBalanceSeries(
    startBalance: number,
    monthlyContribution: number,
    months: number,
    annualGrowthPct: number
): ProjectionPoint[] {
    const monthlyRate = annualGrowthPct / 100 / 12;
    const points: ProjectionPoint[] = [];
    let balance = startBalance;
    for (let m = 0; m <= months; m++) {
        points.push({ month: m, balance: Math.round(balance) });
        balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    return points;
}

/** Generic version of monthsToReachGoal, not tied to an InvestmentAccount. */
export function monthsToReachAmount(
    startBalance: number,
    monthlyContribution: number,
    targetAmount: number,
    annualGrowthPct: number,
    horizonMonths: number = 600
): number | null {
    if (startBalance >= targetAmount) return 0;
    const monthlyRate = annualGrowthPct / 100 / 12;
    let balance = startBalance;
    for (let m = 1; m <= horizonMonths; m++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
        if (balance >= targetAmount) return m;
    }
    return null;
}

/**
 * Solves for the flat monthly contribution needed to grow `startBalance` to
 * `targetAmount` in exactly `monthsRemaining` months, given a monthly-
 * compounding `annualGrowthPct`. Uses the future-value-of-an-annuity formula;
 * falls back to simple division when the growth rate is 0.
 */
export function requiredMonthlyContribution(
    startBalance: number,
    targetAmount: number,
    monthsRemaining: number,
    annualGrowthPct: number
): number {
    const n = Math.max(1, monthsRemaining);
    const r = annualGrowthPct / 100 / 12;
    if (r === 0) return Math.max(0, (targetAmount - startBalance) / n);
    const futureValueOfCurrentBalance = startBalance * Math.pow(1 + r, n);
    const stillNeeded = targetAmount - futureValueOfCurrentBalance;
    if (stillNeeded <= 0) return 0;
    const annuityFactor = (Math.pow(1 + r, n) - 1) / r;
    return stillNeeded / annuityFactor;
}

// ── Contributions ────────────────────────────────────────────────────────────
export type ContributionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'one-time';

export interface Contribution {
    id: number;
    accountId: number;
    amount: number;
    frequency: ContributionFrequency;
    date: string; // ISO date this contribution was made
    name?: string;
}

export const FREQUENCY_LABEL: Record<ContributionFrequency, string> = {
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    'one-time': 'One-time',
};

export interface Loan {
    originalAmount: number;
    remainingBalance: number;
    interestRate: number;
    monthlyRepayment: number;
}

/** Converts a per-contribution amount at a given cadence into an equivalent monthly figure. */
export function contributionToMonthly(amount: number, frequency: ContributionFrequency): number {
    switch (frequency) {
        case 'weekly': return amount * 52 / 12;
        case 'biweekly': return amount * 26 / 12;
        case 'monthly': return amount;
        case 'one-time': return amount;
    }
}