// ── BudgetOverviewBar.tsx ─────────────────────────────────────────────────────
// The continuous split bar at the top of the page, for the month or the current pay period.
import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import SegmentedToggle from './SegmentedToggle';
import { T, FONT_MONO, cardSx, money } from '../budgetTheme';

export type OverviewMode = 'month' | 'pay';

export interface MonthOverview {
    monthLabel: string;
    totalBudget: number;       // budgetStats[0].totalBudget
    totalSpent: number;        // expenseCategories.actualExpenses
    totalSaved: number;        // savingsCategories.actualSavedAmount
    remaining: number;         // totalBudget − totalSpent
    recurringBudgeted: number; // recurring budgetPeriodCategories
    bucketPlans: number;       // page-state buckets
    avgSpendPerDay: number;
    daysRemaining: number;
}

export interface PayPeriodOverview {
    periodLabel: string;      // "Oct 7 – 20"
    daysToPayday: number;
    paycheck: number;
    spent: number;
    billsBeforePayday: number;
    bucketPlansLeft: number;
    savingsPotential: number;
    dailyAllowance: number;   // savingsPotential ÷ days left
}

interface Segment { label: string; amount: number; color: string; bordered?: boolean; }

interface Props {
    mode: OverviewMode;
    onModeChange: (m: OverviewMode) => void;
    month: MonthOverview | null;
    payPeriod: PayPeriodOverview | null;   // null: no pay schedule, toggle disabled
    isLoading: boolean;
}

const Metric: React.FC<{ label: string; value: string; positive?: boolean }> = ({ label, value, positive }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: positive ? T.successText : T.muted, fontWeight: positive ? 600 : 400 }}>{label}</Typography>
        <Typography sx={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: positive ? T.successText : T.text }}>{value}</Typography>
    </Box>
);

const SplitBar: React.FC<{ segments: Segment[]; ariaLabel: string }> = ({ segments, ariaLabel }) => {
    const total = segments.reduce((t, s) => t + Math.max(0, s.amount), 0) || 1;
    return (
        <>
            <Box role="img" aria-label={ariaLabel} sx={{ display: 'flex', height: 12, borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
                {segments.filter(s => s.amount > 0).map(s => (
                    <Box key={s.label} sx={{ width: `${(s.amount / total) * 100}%`, bgcolor: s.color }} />
                ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: 12, color: T.ink2 }}>
                {segments.map(s => (
                    <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: s.color, border: s.bordered ? '1px solid #9CC5AC' : 'none' }} />
                        {s.label}
                    </Box>
                ))}
            </Box>
        </>
    );
};

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const BudgetOverviewBar: React.FC<Props> = ({ mode, onModeChange, month, payPeriod, isLoading }) => {
    const effectiveMode: OverviewMode = mode === 'pay' && !payPeriod ? 'month' : mode;
    const title = effectiveMode === 'pay' && payPeriod
        ? `Pay period ${payPeriod.periodLabel} · ${payPeriod.daysToPayday} days to payday`
        : `Where ${month?.monthLabel ?? 'this month'}’s money goes`;

    return (
        <Box component="section" aria-labelledby="overview-h" sx={{ ...cardSx, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Typography id="overview-h" component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
                <SegmentedToggle<OverviewMode>
                    label="Overview period" value={effectiveMode} onChange={onModeChange}
                    options={[{ value: 'month', label: 'Month' }, { value: 'pay', label: 'Pay period', disabled: !payPeriod }]}
                />
            </Box>

            {isLoading || !month ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Skeleton variant="rounded" height={52} />
                    <Skeleton variant="rounded" height={12} />
                </Box>
            ) : effectiveMode === 'month' ? (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                        <Metric label="Total budget" value={money(month.totalBudget, 2)} />
                        <Metric label="Spent" value={money(month.totalSpent, 2)} />
                        <Metric label="Saved" value={money(month.totalSaved, 2)} />
                        <Metric label="Remaining" value={money(Math.max(0, month.remaining), 2)} positive={month.remaining >= 0} />
                        <Metric label="Recurring bills" value={money(month.recurringBudgeted, 2)} />
                        <Metric label="Bucket plans" value={money(month.bucketPlans, 2)} />
                    </Box>
                    <SplitBar
                        ariaLabel={`Budget split: ${pct(month.totalSpent, month.totalBudget)}% spent, ${pct(month.totalSaved, month.totalBudget)}% saved, ${pct(Math.max(0, month.remaining), month.totalBudget)}% remaining`}
                        segments={[
                            { label: 'Spent', amount: month.totalSpent, color: T.accent },
                            { label: 'Saved', amount: month.totalSaved, color: T.success },
                            { label: 'Remaining', amount: Math.max(0, month.remaining), color: '#CFE6D8', bordered: true },
                        ]}
                    />
                    <Typography sx={{ fontSize: 12, color: T.muted }}>
                        Avg {money(month.avgSpendPerDay)}/day · {month.daysRemaining} days left in {month.monthLabel}
                    </Typography>
                </>
            ) : payPeriod && (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                        <Metric label="Paycheck" value={money(payPeriod.paycheck, 2)} />
                        <Metric label="Spent so far" value={money(payPeriod.spent, 2)} />
                        <Metric label="Bills before payday" value={money(payPeriod.billsBeforePayday, 2)} />
                        <Metric label="Bucket plans left" value={money(payPeriod.bucketPlansLeft, 2)} />
                        <Metric label="Savings potential" value={money(payPeriod.savingsPotential, 2)} positive />
                    </Box>
                    <SplitBar
                        ariaLabel={`Paycheck split: ${pct(payPeriod.spent, payPeriod.paycheck)}% spent, ${pct(payPeriod.billsBeforePayday, payPeriod.paycheck)}% bills, ${pct(payPeriod.bucketPlansLeft, payPeriod.paycheck)}% bucket plans, ${pct(payPeriod.savingsPotential, payPeriod.paycheck)}% savings potential`}
                        segments={[
                            { label: 'Spent', amount: payPeriod.spent, color: '#A89E9B' },
                            { label: 'Bills', amount: payPeriod.billsBeforePayday, color: T.ink2 },
                            { label: 'Buckets', amount: payPeriod.bucketPlansLeft, color: T.accent },
                            { label: 'Savings potential', amount: payPeriod.savingsPotential, color: T.success },
                        ]}
                    />
                    <Box sx={{ p: '10px 12px', borderRadius: '8px', bgcolor: '#F7F2F1', fontSize: 13, color: '#2B2322' }}>
                        Spending more than{' '}
                        <Box component="span" sx={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{money(payPeriod.dailyAllowance, 2)}/day</Box>
                        {' '}on unplanned items before payday starts eating into savings.
                    </Box>
                </>
            )}
        </Box>
    );
};

export default BudgetOverviewBar;