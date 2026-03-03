import React, { useState, useMemo } from 'react';
import {
    Box, Typography, alpha, LinearProgress, Divider,
    TextField, Select, MenuItem, Button, Chip, Slider,
    InputAdornment, Collapse,
} from '@mui/material';
import {
    TrendingUp, TrendingDown, Target, CalendarDays,
    PiggyBank, Sparkles, ChevronDown, ChevronUp,
    TriangleAlert, ArrowRight, CheckCircle2, Zap,
    ShoppingBag, CircleDollarSign, Lightbulb,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';

// ── Shared types (mirror BudgetPlanner) ───────────────────────────────────────
interface BudgetItem { planned: number; estimated: number; remaining: number; }
interface WeekData { Housing: BudgetItem; Food: BudgetItem; Transportation: BudgetItem; Entertainment: BudgetItem; }
interface BudgetData { week1: WeekData; week2: WeekData; week3: WeekData; week4: WeekData; }
type CategoryKey = keyof WeekData;

interface BudgetRule {
    id: string; name: string; shortName: string; description: string;
    tagline: string; color: string;
    allocations: { Housing: number; Food: number; Transportation: number; Entertainment: number; Savings: number; Other?: number; };
    bestFor: string;
}

const BUDGET_RULES: BudgetRule[] = [
    { id: '50-30-20', name: '50 / 30 / 20', shortName: '50/30/20', description: 'Needs 50% · Wants 30% · Savings 20%', tagline: 'The classic balanced approach', color: TEAL,      allocations: { Housing: 35, Food: 15, Transportation: 10, Entertainment: 10, Savings: 20, Other: 10 }, bestFor: 'Most income levels' },
    { id: '70-20-10', name: '70 / 20 / 10', shortName: '70/20/10', description: 'Living 70% · Savings 20% · Giving 10%', tagline: 'For the generous saver',           color: '#7c3aed', allocations: { Housing: 35, Food: 20, Transportation: 10, Entertainment: 5,  Savings: 20, Other: 10 }, bestFor: 'Wealth-building focus' },
    { id: '80-20',    name: '80 / 20',       shortName: '80/20',    description: 'Living 80% · Savings 20%',             tagline: 'Simplified minimalism',             color: AMBER,     allocations: { Housing: 40, Food: 20, Transportation: 10, Entertainment: 10, Savings: 20, Other: 0  }, bestFor: 'Beginners & simplicity' },
    { id: '60-20-20', name: '60 / 20 / 20',  shortName: '60/20/20', description: 'Committed 60% · Savings 20% · Fun 20%', tagline: 'Strict essentials, free spending', color: MAROON,    allocations: { Housing: 35, Food: 15, Transportation: 10, Entertainment: 20, Savings: 20, Other: 0  }, bestFor: 'High earners' },
];

const CATEGORIES: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
const CAT_COLORS: Record<CategoryKey, string> = { Housing: TEAL, Food: MAROON, Transportation: AMBER, Entertainment: '#7c3aed' };

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) => n < 1000 ? `$${Math.round(n)}` : `$${(n / 1000).toFixed(1)}k`;

// ── Tab type ──────────────────────────────────────────────────────────────────
type PanelTab = 'forecast' | 'savings' | 'nextmonth';

// ── Props ─────────────────────────────────────────────────────────────────────
interface BudgetPlannerPanelProps {
    budgetData: BudgetData;
    totalPlanned: number;
    totalSpent: number;
    monthlyIncome: number;
    currentRuleId?: string;
    currentMonth: string;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; color?: string; children: React.ReactNode; defaultOpen?: boolean }> =
    ({ title, icon, color = MAROON, children, defaultOpen = true }) => {
        const [open, setOpen] = useState(defaultOpen);
        return (
            <Box sx={{ mb: 2 }}>
                <Box
                    onClick={() => setOpen(v => !v)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: open ? 1.25 : 0, userSelect: 'none' }}
                >
                    <Box sx={{ color, display: 'flex', flexShrink: 0 }}>{icon}</Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: NAVY, flex: 1 }}>
                        {title}
                    </Typography>
                    <Box sx={{ color: SLATE, display: 'flex' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</Box>
                </Box>
                <Collapse in={open}>{children}</Collapse>
            </Box>
        );
    };

// ── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill: React.FC<{ label: string; value: string; color: string; sub?: string }> = ({ label, value, color, sub }) => (
    <Box sx={{ flex: 1, p: 1.25, borderRadius: '10px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.16)}`, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.25 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: '0.6rem', color: SLATE, mt: 0.25 }}>{sub}</Typography>}
    </Box>
);

// ── Main panel ────────────────────────────────────────────────────────────────
const BudgetPlannerPanel: React.FC<BudgetPlannerPanelProps> = ({
                                                                           budgetData, totalPlanned, totalSpent, monthlyIncome, currentRuleId, currentMonth,
                                                                       }) => {
    const [activeTab, setActiveTab]             = useState<PanelTab>('forecast');
    const [savingsGoal, setSavingsGoal]         = useState<number>(400);
    const [nextMonthIncome, setNextMonthIncome] = useState<number>(monthlyIncome);
    const [nextMonthRuleId, setNextMonthRuleId] = useState<string>(currentRuleId || '50-30-20');
    const [nextMonthBudget, setNextMonthBudget] = useState<Record<CategoryKey, number>>(() =>
        Object.fromEntries(CATEGORIES.map(c => [c, Math.round(totalPlanned / 4 / CATEGORIES.length)])) as Record<CategoryKey, number>
    );
    const [tweaked, setTweaked] = useState(false);

    // ── Derived forecast numbers ───────────────────────────────────────────────
    const weeksElapsed = useMemo(() => {
        const weeks = ['week1','week2','week3','week4'] as const;
        return weeks.filter(wk => budgetData[wk].Housing.estimated > 0).length || 1;
    }, [budgetData]);

    const weeklyActualAvg = totalSpent / weeksElapsed;
    const projectedMonthTotal = weeklyActualAvg * 4;
    const projectedSavings = totalPlanned - projectedMonthTotal;
    const projectedVsPlanned = projectedMonthTotal - totalPlanned;
    const onTrack = projectedMonthTotal <= totalPlanned;

    // Per-category projections
    const categoryProjections = useMemo(() => CATEGORIES.map(cat => {
        const spent = ['week1','week2','week3','week4'].reduce((s, wk) => s + budgetData[wk as keyof BudgetData][cat].estimated, 0);
        const planned = ['week1','week2','week3','week4'].reduce((s, wk) => s + budgetData[wk as keyof BudgetData][cat].planned, 0);
        const weeklyAvg = spent / weeksElapsed;
        const projected = weeklyAvg * 4;
        return { cat, spent, planned, projected, delta: projected - planned, pct: planned === 0 ? 0 : (projected / planned) * 100 };
    }), [budgetData, weeksElapsed]);

    // Forecast line data (actuals so far + projection)
    const forecastLineData = useMemo(() => {
        const points = ['week1','week2','week3','week4'].map((wk, i) => {
            const w = budgetData[wk as keyof BudgetData];
            const spent = CATEGORIES.reduce((s, c) => s + w[c].estimated, 0);
            const cumulative = ['week1','week2','week3','week4']
                .slice(0, i + 1)
                .reduce((s, w2) => s + CATEGORIES.reduce((s2, c) => s2 + budgetData[w2 as keyof BudgetData][c].estimated, 0), 0);
            return { week: `Wk ${i + 1}`, actual: i < weeksElapsed ? cumulative : null, projected: i >= weeksElapsed - 1 ? (weeklyActualAvg * (i + 1)) : null };
        });
        return points;
    }, [budgetData, weeksElapsed, weeklyActualAvg]);

    // ── Savings goal logic ─────────────────────────────────────────────────────
    const currentProjSavings = Math.max(0, projectedSavings);
    const savingsGap = savingsGoal - currentProjSavings;
    const goalMet = savingsGap <= 0;

    // How much needs cutting per category to meet goal
    const cutNeeded = savingsGap > 0 ? savingsGap : 0;
    const categoryCuts = useMemo(() => {
        if (!cutNeeded) return [];
        // Prioritize highest-spending categories that are over budget
        return categoryProjections
            .filter(p => p.delta > 0)
            .sort((a, b) => b.delta - a.delta)
            .map(p => ({ cat: p.cat, cut: Math.min(p.delta, cutNeeded / categoryProjections.filter(x => x.delta > 0).length) }));
    }, [categoryProjections, cutNeeded]);

    // ── Next month planner ─────────────────────────────────────────────────────
    const selectedRule = BUDGET_RULES.find(r => r.id === nextMonthRuleId)!;
    const currentRule  = BUDGET_RULES.find(r => r.id === currentRuleId);

    const suggestedBudget = useMemo<Record<CategoryKey, number>>(() => {
        const rule = BUDGET_RULES.find(r => r.id === nextMonthRuleId)!;
        return Object.fromEntries(
            CATEGORIES.map(c => [c, Math.round((nextMonthIncome * (rule.allocations[c] ?? 0)) / 100)])
        ) as Record<CategoryKey, number>;
    }, [nextMonthRuleId, nextMonthIncome]);

    // Rule fit analysis — compare actuals to each rule's ideal
    const ruleFitScores = useMemo(() => BUDGET_RULES.map(rule => {
        const totalActual = totalSpent || 1;
        let drift = 0;
        CATEGORIES.forEach(cat => {
            const spent = ['week1','week2','week3','week4'].reduce((s, wk) => s + budgetData[wk as keyof BudgetData][cat].estimated, 0);
            const idealPct = rule.allocations[cat] ?? 0;
            const actualPct = (spent / totalActual) * 100;
            drift += Math.abs(actualPct - idealPct);
        });
        return { rule, drift, score: Math.max(0, 100 - drift * 2) };
    }).sort((a, b) => b.score - a.score), [budgetData, totalSpent]);

    const bestFitRule = ruleFitScores[0];

    // ── Tabs ─────────────────────────────────────────────────────────────────
    const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
        { id: 'forecast',  label: 'Forecast',    icon: <TrendingUp size={13} /> },
        { id: 'savings',   label: 'Savings Goal', icon: <Target size={13} /> },
        { id: 'nextmonth', label: 'Next Month',   icon: <CalendarDays size={13} /> },
    ];

    const ForecastTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <Box sx={{ p: 1.25, bgcolor: '#fff', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: `1px solid ${alpha(MAROON, 0.12)}` }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: NAVY, mb: 0.5 }}>{label}</Typography>
                {payload.map((p: any) => p.value != null && (
                    <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{p.name}:</Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>${fmt(p.value)}</Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Box sx={{
            width: '100%', height: '100%',
            borderRadius: '16px',
            border: `1px solid ${alpha(MAROON, 0.12)}`,
            boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}`,
            display: 'flex', flexDirection: 'column',
            bgcolor: '#fff', overflow: 'hidden',
        }}>
            {/* ── Header ── */}
            <Box sx={{
                px: 2.5, py: 2,
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 55%, #5a1515 100%)`,
                position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lightbulb size={16} color="#fff" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', lineHeight: 1 }}>Budget Planner</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>{currentMonth} · Planning assistant</Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Tabs ── */}
            <Box sx={{ display: 'flex', borderBottom: `1px solid ${alpha('#000', 0.07)}`, flexShrink: 0 }}>
                {TABS.map(tab => (
                    <Box
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        sx={{
                            flex: 1, py: 1.1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: 0.4, cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab.id ? MAROON : 'transparent'}`,
                            bgcolor: activeTab === tab.id ? alpha(MAROON, 0.03) : 'transparent',
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: alpha(MAROON, 0.04) },
                        }}
                    >
                        <Box sx={{ color: activeTab === tab.id ? MAROON : SLATE, display: 'flex' }}>{tab.icon}</Box>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: activeTab === tab.id ? 800 : 600, color: activeTab === tab.id ? MAROON : SLATE }}>
                            {tab.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', p: 2,
                '&::-webkit-scrollbar': { width: 5 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TEAL, 0.3), borderRadius: 3 },
            }}>

                {/* ══════════════ FORECAST TAB ══════════════ */}
                {activeTab === 'forecast' && (
                    <Box>
                        {/* Headline */}
                        <Box sx={{
                            p: 1.75, mb: 2, borderRadius: '12px',
                            bgcolor: alpha(onTrack ? GREEN : RED, 0.06),
                            border: `1px solid ${alpha(onTrack ? GREEN : RED, 0.18)}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                <Box sx={{ color: onTrack ? GREEN : RED, display: 'flex' }}>
                                    {onTrack ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: onTrack ? GREEN : RED }}>
                                    {onTrack ? 'On track this month' : 'Projected over budget'}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: SLATE, lineHeight: 1.5 }}>
                                At your current pace you'll spend{' '}
                                <strong style={{ color: NAVY }}>${fmt(projectedMonthTotal)}</strong> this month.
                                {onTrack
                                    ? ` That leaves ~$${fmt(projectedSavings)} saved.`
                                    : ` That's $${fmt(Math.abs(projectedVsPlanned))} over your $${fmt(totalPlanned)} plan.`}
                            </Typography>
                        </Box>

                        {/* Summary pills */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <StatPill label="Projected spend" value={fmtShort(projectedMonthTotal)} color={onTrack ? GREEN : RED} sub={`of ${fmtShort(totalPlanned)} planned`} />
                            <StatPill label="Projected savings" value={fmtShort(Math.max(0, projectedSavings))} color={TEAL} sub={projectedSavings < 0 ? 'over budget' : 'this month'} />
                        </Box>

                        {/* Line chart */}
                        <Section title="Spending trajectory" icon={<TrendingUp size={13} />} color={MAROON}>
                            <Box sx={{ height: 160, mb: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={forecastLineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
                                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: SLATE }} />
                                        <YAxis tick={{ fontSize: 10, fill: SLATE }} tickFormatter={v => `$${v}`} />
                                        <RechartsTooltip content={<ForecastTooltip />} />
                                        <ReferenceLine y={totalPlanned} stroke={alpha(MAROON, 0.4)} strokeDasharray="4 2" label={{ value: 'Plan', position: 'right', fontSize: 9, fill: MAROON }} />
                                        <Line dataKey="actual" name="Actual" stroke={TEAL} strokeWidth={2} dot={{ r: 3, fill: TEAL }} connectNulls={false} />
                                        <Line dataKey="projected" name="Projected" stroke={MAROON} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: MAROON }} connectNulls />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {[{ label: 'Actual', color: TEAL, dash: false }, { label: 'Projected', color: MAROON, dash: true }].map(({ label, color, dash }) => (
                                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                        <Box sx={{ width: 16, height: 2, bgcolor: color, opacity: dash ? 0.6 : 1, borderRadius: 1 }} />
                                        <Typography sx={{ fontSize: '0.62rem', color: SLATE, fontWeight: 600 }}>{label}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Section>

                        <Divider sx={{ my: 1.5, borderColor: alpha('#000', 0.06) }} />

                        {/* Per-category projections */}
                        <Section title="Category forecast" icon={<CircleDollarSign size={13} />} color={TEAL} defaultOpen={false}>
                            {categoryProjections.map(({ cat, planned, projected, delta, pct }) => {
                                const over = delta > 0;
                                const barColor = pct > 105 ? RED : pct > 90 ? AMBER : CAT_COLORS[cat];
                                return (
                                    <Box key={cat} sx={{ mb: 1.75 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: CAT_COLORS[cat] }} />
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Typography sx={{ fontSize: '0.68rem', color: over ? RED : GREEN, fontWeight: 700 }}>
                                                    {over ? '+' : ''}{fmtShort(delta)}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.65rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmtShort(projected)} / {fmtShort(planned)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ position: 'relative', height: 5, borderRadius: 3, bgcolor: alpha(barColor, 0.12) }}>
                                            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(pct, 100)}%`, bgcolor: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                                            <Box sx={{ position: 'absolute', right: 0, top: -2, bottom: -2, width: 2, bgcolor: alpha('#000', 0.12), borderRadius: 1 }} />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Section>
                    </Box>
                )}

                {/* ══════════════ SAVINGS GOAL TAB ══════════════ */}
                {activeTab === 'savings' && (
                    <Box>
                        {/* Goal input */}
                        <Box sx={{ p: 1.75, mb: 2, borderRadius: '12px', bgcolor: alpha(TEAL, 0.04), border: `1px solid ${alpha(TEAL, 0.15)}` }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 1 }}>
                                Monthly savings target
                            </Typography>
                            <TextField
                                size="small" fullWidth type="number"
                                value={savingsGoal}
                                onChange={e => setSavingsGoal(Math.max(0, Number(e.target.value)))}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Typography sx={{ color: SLATE, fontSize: '0.9rem', fontWeight: 700 }}>$</Typography></InputAdornment>,
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontWeight: 700, fontSize: '1rem' } }}
                            />
                        </Box>

                        {/* Goal status */}
                        <Box sx={{
                            p: 1.75, mb: 2, borderRadius: '12px',
                            bgcolor: alpha(goalMet ? GREEN : AMBER, 0.06),
                            border: `1px solid ${alpha(goalMet ? GREEN : AMBER, 0.2)}`,
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: goalMet ? GREEN : AMBER }}>
                                    {goalMet ? '🎉 Goal achievable!' : '⚠️ Goal needs adjustment'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                    {fmtShort(currentProjSavings)} / {fmtShort(savingsGoal)}
                                </Typography>
                            </Box>

                            {/* Progress bar toward goal */}
                            <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: alpha(goalMet ? GREEN : AMBER, 0.15), mb: 0.75 }}>
                                <Box sx={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0,
                                    width: `${Math.min((currentProjSavings / savingsGoal) * 100, 100)}%`,
                                    bgcolor: goalMet ? GREEN : AMBER, borderRadius: 4, transition: 'width 0.4s ease',
                                }} />
                            </Box>

                            <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>
                                {goalMet
                                    ? `You're projected to save $${fmt(currentProjSavings - savingsGoal)} more than your goal.`
                                    : `You need to cut $${fmt(cutNeeded)} more in spending to hit your goal.`}
                            </Typography>
                        </Box>

                        {/* What to cut */}
                        {!goalMet && categoryCuts.length > 0 && (
                            <Section title="Suggested cuts to hit goal" icon={<Zap size={13} />} color={AMBER}>
                                {categoryCuts.map(({ cat, cut }) => (
                                    <Box key={cat} sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        p: 1.25, mb: 1, borderRadius: '8px',
                                        bgcolor: alpha(CAT_COLORS[cat], 0.05), border: `1px solid ${alpha(CAT_COLORS[cat], 0.15)}`,
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CAT_COLORS[cat] }} />
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>Cut by</Typography>
                                            <Chip label={`-${fmtShort(cut)}`} size="small" sx={{ bgcolor: alpha(RED, 0.1), color: RED, fontWeight: 800, fontSize: '0.65rem', height: 18 }} />
                                        </Box>
                                    </Box>
                                ))}
                                <Typography sx={{ fontSize: '0.65rem', color: SLATE, mt: 0.5, lineHeight: 1.5 }}>
                                    These cuts are estimated from categories currently running over budget.
                                </Typography>
                            </Section>
                        )}

                        {/* If goal is met — show savings rate info */}
                        {goalMet && (
                            <Section title="Your savings rate" icon={<PiggyBank size={13} />} color={GREEN}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <StatPill label="This month" value={`${monthlyIncome > 0 ? ((currentProjSavings / monthlyIncome) * 100).toFixed(1) : 0}%`} color={GREEN} sub="of income saved" />
                                    <StatPill label="Annualised" value={fmtShort(currentProjSavings * 12)} color={TEAL} sub="projected per year" />
                                </Box>
                            </Section>
                        )}

                        <Divider sx={{ my: 1.5, borderColor: alpha('#000', 0.06) }} />

                        {/* Savings goal slider presets */}
                        <Section title="Quick goal presets" icon={<Target size={13} />} color={MAROON} defaultOpen={false}>
                            {[
                                { label: '10% of income', value: Math.round(monthlyIncome * 0.1) },
                                { label: '15% of income', value: Math.round(monthlyIncome * 0.15) },
                                { label: '20% of income', value: Math.round(monthlyIncome * 0.2) },
                                { label: '3-month fund (1mo)', value: Math.round(totalPlanned / 3) },
                            ].map(preset => (
                                <Box
                                    key={preset.label}
                                    onClick={() => setSavingsGoal(preset.value)}
                                    sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        px: 1.25, py: 0.9, mb: 0.75, borderRadius: '8px', cursor: 'pointer',
                                        bgcolor: savingsGoal === preset.value ? alpha(MAROON, 0.07) : alpha('#000', 0.02),
                                        border: `1px solid ${savingsGoal === preset.value ? alpha(MAROON, 0.25) : alpha('#000', 0.07)}`,
                                        '&:hover': { borderColor: alpha(MAROON, 0.2), bgcolor: alpha(MAROON, 0.04) },
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: savingsGoal === preset.value ? MAROON : NAVY }}>
                                        {preset.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: savingsGoal === preset.value ? MAROON : SLATE, fontVariantNumeric: 'tabular-nums' }}>
                                        ${fmt(preset.value)}
                                    </Typography>
                                </Box>
                            ))}
                        </Section>
                    </Box>
                )}

                {/* ══════════════ NEXT MONTH TAB ══════════════ */}
                {activeTab === 'nextmonth' && (
                    <Box>
                        {/* Rule fit analyzer */}
                        <Section title="Rule fit for your spending" icon={<Sparkles size={13} />} color={TEAL}>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE, mb: 1.25, lineHeight: 1.5 }}>
                                Based on your actual spending pattern this month, here's how well each rule fits you:
                            </Typography>
                            {ruleFitScores.map(({ rule, score }, i) => (
                                <Box
                                    key={rule.id}
                                    onClick={() => { setNextMonthRuleId(rule.id); setTweaked(false); }}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, mb: 0.75,
                                        borderRadius: '8px', cursor: 'pointer',
                                        border: `1px solid ${nextMonthRuleId === rule.id ? rule.color : alpha('#000', 0.07)}`,
                                        bgcolor: nextMonthRuleId === rule.id ? alpha(rule.color, 0.06) : alpha('#000', 0.01),
                                        '&:hover': { borderColor: rule.color, bgcolor: alpha(rule.color, 0.04) },
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    {i === 0 && (
                                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: alpha(GREEN, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <CheckCircle2 size={11} color={GREEN} />
                                        </Box>
                                    )}
                                    {i > 0 && (
                                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: alpha(rule.color, 0.12), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: rule.color }}>{i + 1}</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: NAVY }}>{rule.shortName}</Typography>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: score >= 70 ? GREEN : score >= 45 ? AMBER : RED }}>
                                                {score.toFixed(0)}% fit
                                            </Typography>
                                        </Box>
                                        <Box sx={{ height: 3, borderRadius: 2, bgcolor: alpha(rule.color, 0.1) }}>
                                            <Box sx={{ height: '100%', width: `${score}%`, borderRadius: 2, bgcolor: score >= 70 ? GREEN : score >= 45 ? AMBER : RED, transition: 'width 0.5s ease' }} />
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                            {bestFitRule.rule.id !== currentRuleId && (
                                <Box sx={{ mt: 1, p: 1.25, borderRadius: '8px', bgcolor: alpha(GREEN, 0.05), border: `1px solid ${alpha(GREEN, 0.2)}` }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: GREEN, fontWeight: 700, lineHeight: 1.5 }}>
                                        💡 <strong>{bestFitRule.rule.shortName}</strong> matches your actual spending pattern better than your current rule. Consider switching next month.
                                    </Typography>
                                </Box>
                            )}
                        </Section>

                        <Divider sx={{ my: 1.5, borderColor: alpha('#000', 0.06) }} />

                        {/* Next month income */}
                        <Section title="Next month income" icon={<CircleDollarSign size={13} />} color={MAROON}>
                            <TextField
                                size="small" fullWidth type="number"
                                value={nextMonthIncome}
                                onChange={e => { setNextMonthIncome(Math.max(0, Number(e.target.value))); setTweaked(false); }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ color: SLATE, fontSize: '0.88rem', fontWeight: 700 }}>$</Typography></InputAdornment> }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontWeight: 700 } }}
                            />
                        </Section>

                        <Divider sx={{ my: 1.5, borderColor: alpha('#000', 0.06) }} />

                        {/* Suggested budget table */}
                        <Section title="Suggested budget" icon={<CalendarDays size={13} />} color={TEAL}>
                            <Box sx={{ mb: 1.25, p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.04), border: `1px solid ${alpha(TEAL, 0.15)}` }}>
                                <Typography sx={{ fontSize: '0.68rem', color: SLATE, lineHeight: 1.5 }}>
                                    Based on <strong style={{ color: selectedRule.color }}>{selectedRule.shortName}</strong> applied to ${nextMonthIncome.toLocaleString()}/mo income. Tweak any amount below.
                                </Typography>
                            </Box>

                            {CATEGORIES.map(cat => {
                                const suggested = suggestedBudget[cat];
                                const current   = tweaked ? nextMonthBudget[cat] : suggested;
                                const pct       = nextMonthIncome > 0 ? ((current / nextMonthIncome) * 100).toFixed(1) : '0';
                                const thisMonthActual = ['week1','week2','week3','week4'].reduce((s, wk) => s + budgetData[wk as keyof BudgetData][cat].estimated, 0);
                                const delta = current - thisMonthActual;

                                return (
                                    <Box key={cat} sx={{ mb: 1.75 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: CAT_COLORS[cat] }} />
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
                                                <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>({pct}%)</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.62rem', color: delta > 0 ? GREEN : delta < 0 ? RED : SLATE }}>
                                                    {delta > 0 ? '+' : ''}{fmtShort(delta)} vs this month
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                size="small" type="number"
                                                value={tweaked ? nextMonthBudget[cat] : suggested}
                                                onChange={e => {
                                                    setTweaked(true);
                                                    setNextMonthBudget(prev => ({ ...prev, [cat]: Math.max(0, Number(e.target.value)) }));
                                                }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: SLATE }}>$</Typography></InputAdornment> }}
                                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '7px', fontSize: '0.82rem', fontWeight: 700, borderColor: tweaked ? alpha(CAT_COLORS[cat], 0.4) : undefined } }}
                                            />
                                            {tweaked && nextMonthBudget[cat] !== suggested && (
                                                <Box
                                                    onClick={() => setNextMonthBudget(prev => ({ ...prev, [cat]: suggested }))}
                                                    sx={{ fontSize: '0.6rem', color: SLATE, cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { color: MAROON } }}
                                                >
                                                    reset
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}

                            {/* Next month summary */}
                            {(() => {
                                const totalNext = CATEGORIES.reduce((s, c) => s + (tweaked ? nextMonthBudget[c] : suggestedBudget[c]), 0);
                                const impliedSavings = nextMonthIncome - totalNext;
                                const savingsPct = nextMonthIncome > 0 ? ((impliedSavings / nextMonthIncome) * 100).toFixed(1) : '0';
                                return (
                                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '10px', bgcolor: alpha(MAROON, 0.04), border: `1px solid ${alpha(MAROON, 0.12)}` }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                            <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>Total budgeted</Typography>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>${fmt(totalNext)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                            <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>Unallocated / savings</Typography>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: impliedSavings >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
                                                ${fmt(impliedSavings)} ({savingsPct}%)
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: alpha('#000', 0.06), my: 0.75 }} />
                                        <Button
                                            fullWidth variant="contained" size="small"
                                            endIcon={<ArrowRight size={13} />}
                                            sx={{ bgcolor: MAROON, color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.75, '&:hover': { bgcolor: MAROON_DARK } }}
                                        >
                                            Apply as next month's template
                                        </Button>
                                    </Box>
                                );
                            })()}
                        </Section>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default BudgetPlannerPanel;