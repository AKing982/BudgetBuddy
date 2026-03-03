import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    Grid,
    Skeleton,
    Container,
    useTheme,
    alpha,
    Grow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    LinearProgress,
    Divider,
    Tooltip,
    Collapse,
    Stack,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    AccountBalance,
    CalendarToday,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import {
    PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    Wallet, Target, TrendingUp, Sparkles, Info, CheckCircle2,
    PiggyBank, ShoppingBag, Zap, ChevronDown,
} from 'lucide-react';
import Sidebar from './Sidebar';
import BudgetPlannerSidePanel from './BudgetPlannerPanel';

// ── Design tokens matching GroceryTracker / BudgetPage ────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';
const BG          = '#f8f9fc';

// ── Budget Rule Definitions ───────────────────────────────────────────────────
interface BudgetRule {
    id: string;
    name: string;
    shortName: string;
    description: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    allocations: {
        Housing: number;
        Food: number;
        Transportation: number;
        Entertainment: number;
        Savings: number;
        Other?: number;
    };
    pros: string[];
    bestFor: string;
}

const BUDGET_RULES: BudgetRule[] = [
    {
        id: '50-30-20',
        name: '50 / 30 / 20 Rule',
        shortName: '50/30/20',
        description: 'Needs 50% · Wants 30% · Savings 20%',
        tagline: 'The classic balanced approach',
        icon: <Target size={18} />,
        color: TEAL,
        allocations: { Housing: 35, Food: 15, Transportation: 10, Entertainment: 10, Savings: 20, Other: 10 },
        pros: ['Easy to follow', 'Balanced lifestyle', 'Popular & proven'],
        bestFor: 'Most income levels',
    },
    {
        id: '70-20-10',
        name: '70 / 20 / 10 Rule',
        shortName: '70/20/10',
        description: 'Living 70% · Savings 20% · Giving 10%',
        tagline: 'For the generous saver',
        icon: <PiggyBank size={18} />,
        color: '#7c3aed',
        allocations: { Housing: 35, Food: 20, Transportation: 10, Entertainment: 5, Savings: 20, Other: 10 },
        pros: ['Aggressive savings', 'Charitable giving', 'Long-term wealth'],
        bestFor: 'Wealth-building focus',
    },
    {
        id: '80-20',
        name: '80 / 20 Rule',
        shortName: '80/20',
        description: 'Living 80% · Savings 20%',
        tagline: 'Simplified minimalism',
        icon: <Zap size={18} />,
        color: AMBER,
        allocations: { Housing: 40, Food: 20, Transportation: 10, Entertainment: 10, Savings: 20, Other: 0 },
        pros: ['Simple to track', 'Maximum freedom', 'No category stress'],
        bestFor: 'Beginners & simplicity lovers',
    },
    {
        id: '60-20-20',
        name: '60 / 20 / 20 Rule',
        shortName: '60/20/20',
        description: 'Committed 60% · Savings 20% · Fun 20%',
        tagline: 'Strict essentials, free spending',
        icon: <ShoppingBag size={18} />,
        color: MAROON,
        allocations: { Housing: 35, Food: 15, Transportation: 10, Entertainment: 20, Savings: 20, Other: 0 },
        pros: ['High savings rate', 'Generous fun money', 'Clear boundaries'],
        bestFor: 'High earners & disciplined spenders',
    },
    {
        id: 'custom',
        name: 'Custom Rule',
        shortName: 'Custom',
        description: 'Your own allocation mix',
        tagline: 'Full control',
        icon: <Sparkles size={18} />,
        color: '#0ea5e9',
        allocations: { Housing: 30, Food: 15, Transportation: 10, Entertainment: 10, Savings: 15, Other: 20 },
        pros: ['Fully personalized', 'No restrictions', 'Adapts to your life'],
        bestFor: 'Experienced budgeters',
    },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface BudgetItem { planned: number; estimated: number; remaining: number; }
interface WeekData { Housing: BudgetItem; Food: BudgetItem; Transportation: BudgetItem; Entertainment: BudgetItem; }
interface BudgetData { week1: WeekData; week2: WeekData; week3: WeekData; week4: WeekData; }
interface MonthlyTotals { budgetGoal: number; totalPlanned: number; totalSpent: number; percentageSaved: number; spentOverBudgetPercentage: number; }
interface BPTemplate { id: string; name: string; type: string; budgetData: BudgetData; weekAccountBalances: { week1: number; week2: number; week3: number; week4: number }; weekDateRanges: string[]; monthlyTotals: MonthlyTotals; ruleId?: string; monthlyIncome?: number; }
type CategoryKey = keyof WeekData;
type ViewMode = 'template' | 'statistics';

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const calcPctSaved = (planned: number, estimated: number) => planned === 0 ? 0 : ((planned - estimated) / planned) * 100;
const calcActualPct = (planned: number, estimated: number) => planned === 0 ? 0 : (estimated / planned) * 100;
const calcSavingsContrib = (remaining: number) => Math.max(0, remaining);

const CATEGORIES: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
const CHART_COLORS = [TEAL, MAROON, AMBER, '#7c3aed', GREEN];

// ── Rule Card ──────────────────────────────────────────────────────────────────
const RuleCard: React.FC<{
    rule: BudgetRule; selected: boolean; onSelect: () => void;
}> = ({ rule, selected, onSelect }) => (
    <Box
        onClick={onSelect}
        sx={{
            p: 2, borderRadius: '12px', cursor: 'pointer',
            border: `2px solid ${selected ? rule.color : alpha('#000', 0.07)}`,
            bgcolor: selected ? alpha(rule.color, 0.05) : '#fff',
            transition: 'all 0.18s',
            '&:hover': { borderColor: rule.color, bgcolor: alpha(rule.color, 0.04) },
            position: 'relative', overflow: 'hidden',
        }}
    >
        {selected && (
            <Box sx={{ position: 'absolute', top: 8, right: 8, color: rule.color }}>
                <CheckCircle2 size={16} />
            </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                bgcolor: alpha(rule.color, 0.12), color: rule.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                {rule.icon}
            </Box>
            <Box>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: NAVY, lineHeight: 1 }}>{rule.shortName}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>{rule.tagline}</Typography>
            </Box>
        </Box>
        <Typography sx={{ fontSize: '0.7rem', color: SLATE, mb: 1 }}>{rule.description}</Typography>
        {/* Allocation mini bar */}
        <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: '1px', mb: 1 }}>
            {Object.entries(rule.allocations).filter(([, v]) => v > 0).map(([k, v], i) => (
                <Box key={k} sx={{ flex: v, bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
            ))}
        </Box>
        <Typography sx={{ fontSize: '0.65rem', color: alpha(rule.color, 0.9), fontWeight: 700 }}>
            Best for: {rule.bestFor}
        </Typography>
    </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const BudgetPlanner: React.FC = () => {
    const theme = useTheme();
    const [currentMonth, setCurrentMonth] = useState('June 2025');
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('template');
    const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
    const [weekExpandedView, setWeekExpandedView] = useState<Record<number, 'table' | 'chart'>>({});
    const [animateIn, setAnimateIn] = useState(false);
    const [bpTemplates, setBPTemplates] = useState<BPTemplate[]>([]);
    const [selectedTemplateType, setSelectedTemplateType] = useState<string>('Monthly');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateType, setNewTemplateType] = useState('Monthly');
    // Rule selector state
    const [showRuleSelector, setShowRuleSelector] = useState(false);
    const [selectedRuleId, setSelectedRuleId] = useState<string>('50-30-20');
    const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
    const [rulePreviewOpen, setRulePreviewOpen] = useState(false);

    useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

    const buildBudgetFromRule = (rule: BudgetRule, income: number): BudgetData => {
        const makeCategoryWeek = (cat: CategoryKey): BudgetItem => {
            const pct = (rule.allocations[cat] ?? 0) / 100;
            const weeklyAmount = (income * pct) / 4;
            const variance = (Math.random() * 0.1 - 0.05); // ±5% realistic variance
            const estimated = Math.round(weeklyAmount * (1 + variance));
            return { planned: Math.round(weeklyAmount), estimated, remaining: Math.round(weeklyAmount) - estimated };
        };
        return {
            week1: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
            week2: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
            week3: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
            week4: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
        };
    };

    const calcMonthlyTotals = (data: BudgetData): MonthlyTotals => {
        let totalPlanned = 0, totalSpent = 0;
        (['week1','week2','week3','week4'] as const).forEach(wk => {
            CATEGORIES.forEach(cat => { totalPlanned += data[wk][cat].planned; totalSpent += data[wk][cat].estimated; });
        });
        return {
            budgetGoal: totalPlanned, totalPlanned, totalSpent,
            percentageSaved: calcPctSaved(totalPlanned, totalSpent),
            spentOverBudgetPercentage: totalPlanned === 0 ? 0 : ((totalSpent - totalPlanned) / totalPlanned) * 100,
        };
    };

    const initialBudgetData: BudgetData = {
        week1: { Housing: { planned: 500, estimated: 480, remaining: 20 }, Food: { planned: 200, estimated: 185, remaining: 15 }, Transportation: { planned: 150, estimated: 145, remaining: 5 }, Entertainment: { planned: 100, estimated: 120, remaining: -20 } },
        week2: { Housing: { planned: 500, estimated: 500, remaining: 0 }, Food: { planned: 200, estimated: 195, remaining: 5 }, Transportation: { planned: 150, estimated: 140, remaining: 10 }, Entertainment: { planned: 100, estimated: 85, remaining: 15 } },
        week3: { Housing: { planned: 500, estimated: 485, remaining: 15 }, Food: { planned: 200, estimated: 210, remaining: -10 }, Transportation: { planned: 150, estimated: 155, remaining: -5 }, Entertainment: { planned: 100, estimated: 95, remaining: 5 } },
        week4: { Housing: { planned: 500, estimated: 475, remaining: 25 }, Food: { planned: 200, estimated: 190, remaining: 10 }, Transportation: { planned: 150, estimated: 148, remaining: 2 }, Entertainment: { planned: 100, estimated: 110, remaining: -10 } },
    };

    const initialWAB = { week1: 5020, week2: 5050, week3: 5055, week4: 5082 };
    const initialWDR = ['06/01/25 - 06/07/25', '06/08/25 - 06/14/25', '06/15/25 - 06/21/25', '06/22/25 - 06/28/25'];

    useEffect(() => {
        const totals = calcMonthlyTotals(initialBudgetData);
        const defaults: BPTemplate[] = [
            { id: generateUUID(), name: 'Default June 2025', type: 'Monthly', budgetData: initialBudgetData, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: totals },
            ...BUDGET_RULES.filter(r => r.id !== 'custom').map(rule => {
                const bd = buildBudgetFromRule(rule, 5000);
                return { id: generateUUID(), name: `${rule.shortName} — June 2025`, type: 'Monthly', budgetData: bd, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: calcMonthlyTotals(bd), ruleId: rule.id, monthlyIncome: 5000 };
            }),
        ];
        setBPTemplates(defaults);
        setSelectedTemplateId(defaults[0].id);
    }, []);

    const currentTemplate = bpTemplates.find(t => t.id === selectedTemplateId) || { budgetData: initialBudgetData, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: calcMonthlyTotals(initialBudgetData) };
    const { budgetData, weekAccountBalances, weekDateRanges } = currentTemplate;
    const { budgetGoal, totalPlanned, totalSpent, percentageSaved, spentOverBudgetPercentage } = currentTemplate.monthlyTotals || calcMonthlyTotals(budgetData);

    const activeRule = BUDGET_RULES.find(r => r.id === ((currentTemplate as BPTemplate).ruleId || '')) || null;

    const handleMonthChange = (dir: 'prev' | 'next') => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    };

    const toggleWeek = (idx: number) => setCollapsedWeeks(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

    const handleApplyRule = () => {
        const rule = BUDGET_RULES.find(r => r.id === selectedRuleId)!;
        const bd = buildBudgetFromRule(rule, monthlyIncome);
        const totals = calcMonthlyTotals(bd);
        const newT: BPTemplate = { id: generateUUID(), name: `${rule.shortName} — ${currentMonth}`, type: selectedTemplateType, budgetData: bd, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: totals, ruleId: rule.id, monthlyIncome };
        setBPTemplates(prev => [...prev, newT]);
        setSelectedTemplateId(newT.id);
        setShowRuleSelector(false);
        setRulePreviewOpen(false);
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName) return;
        const newT: BPTemplate = { id: generateUUID(), name: newTemplateName, type: newTemplateType, budgetData, weekAccountBalances, weekDateRanges, monthlyTotals: calcMonthlyTotals(budgetData) };
        setBPTemplates(prev => [...prev, newT]);
        setOpenDialog(false);
        setNewTemplateName('');
    };

    // Chart data
    const pieData = CATEGORIES.map(cat => ({
        name: cat,
        planned: ['week1','week2','week3','week4'].reduce((s, wk) => s + budgetData[wk as keyof BudgetData][cat].planned, 0),
        estimated: ['week1','week2','week3','wek4' as any].reduce((s, wk) => s + (budgetData[wk as keyof BudgetData]?.[cat]?.estimated ?? 0), 0),
    }));
    const barData = ['week1','week2','week3','week4'].map((wk, i) => {
        const w = budgetData[wk as keyof BudgetData];
        return { name: `Wk ${i+1}`, Planned: CATEGORIES.reduce((s, c) => s + w[c].planned, 0), Actual: CATEGORIES.reduce((s, c) => s + w[c].estimated, 0) };
    });

    const budgetUsedPct = totalPlanned === 0 ? 0 : (totalSpent / totalPlanned) * 100;
    const progressColor = budgetUsedPct > 100 ? RED : budgetUsedPct > 85 ? AMBER : TEAL;

    // ── Rule selector panel ────────────────────────────────────────────────────
    const RuleSelectorPanel = () => (
        <Box sx={{ p: 3, borderRadius: '16px', border: `1px solid ${alpha(TEAL, 0.2)}`, bgcolor: '#fff', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha(TEAL, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={17} color={TEAL} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: NAVY }}>Apply a Budget Rule</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>Auto-generate your monthly plan from a proven strategy</Typography>
                    </Box>
                </Box>
                <Button size="small" onClick={() => setShowRuleSelector(false)} sx={{ color: SLATE, textTransform: 'none' }}>Dismiss</Button>
            </Box>

            {/* Monthly income input */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5, p: 2, borderRadius: '10px', bgcolor: alpha(TEAL, 0.04), border: `1px solid ${alpha(TEAL, 0.12)}` }}>
                <Wallet size={18} color={TEAL} />
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, mb: 0.5 }}>Monthly Take-Home Income</Typography>
                    <TextField
                        size="small"
                        type="number"
                        value={monthlyIncome}
                        onChange={e => setMonthlyIncome(Number(e.target.value))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: SLATE, fontSize: '0.85rem' }}>$</Typography> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }, maxWidth: 180 }}
                    />
                </Box>
                <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>We'll split this across categories</Typography>
            </Box>

            {/* Rule grid */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {BUDGET_RULES.map(rule => (
                    <Grid item xs={12} sm={6} md={4} key={rule.id}>
                        <RuleCard rule={rule} selected={selectedRuleId === rule.id} onSelect={() => setSelectedRuleId(rule.id)} />
                    </Grid>
                ))}
            </Grid>

            {/* Selected rule detail */}
            {selectedRuleId && (() => {
                const rule = BUDGET_RULES.find(r => r.id === selectedRuleId)!;
                return (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(rule.color, 0.05), border: `1px solid ${alpha(rule.color, 0.2)}`, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY }}>{rule.name} Breakdown</Typography>
                            <Chip label={`$${monthlyIncome.toLocaleString()} / mo`} size="small" sx={{ bgcolor: alpha(rule.color, 0.12), color: rule.color, fontWeight: 700, fontSize: '0.72rem' }} />
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(rule.allocations).filter(([, v]) => v > 0).map(([cat, pct], i) => (
                                <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6, borderRadius: '20px', bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.1) }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>{pct}% · ${((monthlyIncome * pct) / 100).toFixed(0)}/mo</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                );
            })()}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                    variant="contained"
                    onClick={handleApplyRule}
                    sx={{ bgcolor: MAROON, color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: MAROON_DARK } }}
                >
                    Apply & Generate Template
                </Button>
                <Button onClick={() => setShowRuleSelector(false)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            </Box>
        </Box>
    );

    // ── Per-week donut panel ────────────────────────────────────────────────────
    const WeekDonutPanel: React.FC<{ wData: WeekData; wPlanned: number; wEstimated: number; weekIdx: number }> =
        ({ wData, wPlanned, wEstimated, weekIdx }) => {
            const [chartMode, setChartMode] = React.useState<'actual' | 'planned'>('actual');

            const slices = CATEGORIES.map((cat, i) => ({
                name: cat,
                value: chartMode === 'actual' ? wData[cat].estimated : wData[cat].planned,
                color: CHART_COLORS[i],
            }));
            const total   = slices.reduce((s, sl) => s + sl.value, 0);
            const pctUsed = wPlanned === 0 ? 0 : (wEstimated / wPlanned) * 100;
            const statusColor = pctUsed > 100 ? RED : pctUsed > 88 ? AMBER : GREEN;
            const statusLabel = pctUsed > 100 ? 'Over budget' : pctUsed > 88 ? 'Near limit' : 'On track';

            const DonutTooltip = ({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.13)', border: `1px solid ${alpha(p.payload.color, 0.25)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.payload.color }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: NAVY }}>{p.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: p.payload.color, fontVariantNumeric: 'tabular-nums' }}>
                            ${fmt(p.value)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
                            {total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}% of {chartMode}
                        </Typography>
                    </Box>
                );
            };

            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header: title + toggle */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: SLATE }}>
                                Week {weekIdx + 1} · Spending
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor }} />
                                <Typography sx={{ fontSize: '0.65rem', color: statusColor, fontWeight: 700 }}>{statusLabel}</Typography>
                            </Box>
                        </Box>
                        {/* Planned / Actual toggle */}
                        <Box sx={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.1)}` }}>
                            {(['actual', 'planned'] as const).map(mode => (
                                <Box
                                    key={mode}
                                    onClick={() => setChartMode(mode)}
                                    sx={{
                                        px: 1.1, py: 0.4, cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700,
                                        textTransform: 'capitalize',
                                        bgcolor: chartMode === mode ? MAROON : '#fff',
                                        color: chartMode === mode ? '#fff' : SLATE,
                                        transition: 'all 0.15s',
                                        '&:hover': chartMode !== mode ? { bgcolor: alpha(MAROON, 0.06) } : {},
                                    }}
                                >
                                    {mode}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Donut chart */}
                    <Box sx={{ position: 'relative', height: 190, flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={slices}
                                    dataKey="value"
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={80}
                                    paddingAngle={3}
                                    strokeWidth={0}
                                    animationBegin={0}
                                    animationDuration={500}
                                >
                                    {slices.map((s, i) => (
                                        <Cell key={i} fill={s.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip content={<DonutTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center content */}
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center', pointerEvents: 'none', width: 88,
                        }}>
                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: statusColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                                {pctUsed.toFixed(0)}%
                            </Typography>
                            <Typography sx={{ fontSize: '0.55rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', mt: 0.25 }}>
                                of budget
                            </Typography>
                            <Divider sx={{ my: 0.5, borderColor: alpha('#000', 0.08) }} />
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                ${fmt(wEstimated)}
                            </Typography>
                            <Typography sx={{ fontSize: '0.55rem', color: SLATE }}>spent</Typography>
                        </Box>
                    </Box>

                    {/* Category breakdown list */}
                    <Box sx={{ flex: 1, mt: 1 }}>
                        {CATEGORIES.map((cat, i) => {
                            const planned = wData[cat].planned;
                            const actual  = wData[cat].estimated;
                            const pct     = planned === 0 ? 0 : (actual / planned) * 100;
                            const isOver  = actual > planned;
                            const barColor = isOver ? RED : pct > 88 ? AMBER : CHART_COLORS[i];

                            return (
                                <Box key={cat} sx={{ mb: 1.25 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                            <Box sx={{ width: 9, height: 9, borderRadius: '3px', bgcolor: CHART_COLORS[i] }} />
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
                                            {isOver && (
                                                <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: RED, bgcolor: alpha(RED, 0.09), px: 0.5, py: 0.1, borderRadius: '3px' }}>
                                                    +${fmt(actual - planned)}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography sx={{ fontSize: '0.68rem', color: barColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                            {pct.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                    <Box sx={{ position: 'relative', height: 5, borderRadius: 3, bgcolor: alpha(barColor, 0.12) }}>
                                        <Box sx={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0,
                                            width: `${Math.min(pct, 100)}%`,
                                            bgcolor: barColor, borderRadius: 3,
                                            transition: 'width 0.4s ease',
                                        }} />
                                        {/* Planned marker line at 100% */}
                                        <Box sx={{
                                            position: 'absolute', right: 0, top: -2, bottom: -2,
                                            width: 2, bgcolor: alpha('#000', 0.15), borderRadius: 1,
                                        }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
                                        <Typography sx={{ fontSize: '0.6rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>
                                            ${fmt(actual)} actual
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.7), fontVariantNumeric: 'tabular-nums' }}>
                                            ${fmt(planned)} planned
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        };

    // ── Table renderer ─────────────────────────────────────────────────────────
    const renderTable = () => (
        <Box sx={{ borderRadius: '12px', border: `1px solid ${alpha('#000', 0.07)}`, overflow: 'hidden', '&:hover': { boxShadow: `0 4px 24px ${alpha('#000', 0.08)}` }, transition: 'box-shadow 0.25s' }}>
            {/* Shared table header */}
            <Table sx={{ minWidth: 650 }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: alpha(MAROON, 0.04) }}>
                        {['Week Period', 'Category', 'Planned', 'Actual', 'Spending %', 'Savings %', 'Savings Contribution'].map((h, i) => (
                            <TableCell key={h} align={i >= 2 ? 'right' : 'left'} sx={{ fontWeight: 800, color: MAROON, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.75, px: 2, whiteSpace: 'nowrap' }}>
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
            </Table>

            {isLoading ? (
                <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /></Box>
            ) : (
                weekDateRanges.map((weekRange, weekIdx) => {
                    const weekKey    = `week${weekIdx + 1}` as keyof BudgetData;
                    const wData      = budgetData[weekKey];
                    const isCollapsed = collapsedWeeks.has(weekIdx);
                    const acctBal    = weekAccountBalances[weekKey];
                    const wPlanned   = CATEGORIES.reduce((s, c) => s + wData[c].planned, 0);
                    const wEstimated = CATEGORIES.reduce((s, c) => s + wData[c].estimated, 0);
                    const wSavings   = CATEGORIES.reduce((s, c) => s + calcSavingsContrib(wData[c].remaining), 0);
                    const wPctSaved  = calcPctSaved(wPlanned, wEstimated);
                    const wActualPct = calcActualPct(wPlanned, wEstimated);

                    return (
                        <Box key={weekRange} sx={{ borderTop: `2px solid ${alpha(MAROON, 0.1)}` }}>
                            {/* ── Week header row (always visible) ── */}
                            <Table sx={{ minWidth: 650 }}>
                                <TableBody>
                                    <TableRow
                                        onClick={() => toggleWeek(weekIdx)}
                                        sx={{ cursor: 'pointer', bgcolor: alpha(MAROON, 0.02), '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}
                                    >
                                        <TableCell sx={{ py: 1.75, px: 2, width: '22%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: MAROON, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {isCollapsed ? <ExpandMore sx={{ fontSize: '1rem' }} /> : <ExpandLess sx={{ fontSize: '1rem' }} />}
                                                </Box>
                                                <Typography sx={{ fontWeight: 800, color: MAROON, fontSize: '0.82rem' }}>{weekRange}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.75, px: 2 }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: SLATE, fontStyle: 'italic' }}>
                                                {isCollapsed ? 'Expand to see details' : 'Click to collapse'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.88rem', py: 1.75, px: 2 }}>${fmt(wPlanned)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.88rem', py: 1.75, px: 2 }}>${fmt(wEstimated)}</TableCell>
                                        <TableCell align="right" sx={{ py: 1.75, px: 2 }}>
                                            <Box sx={{ px: 1, py: 0.35, borderRadius: '20px', bgcolor: alpha(SLATE, 0.08), display: 'inline-block' }}>
                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{wActualPct.toFixed(1)}%</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.75, px: 2 }}>
                                            <Box sx={{ px: 1, py: 0.35, borderRadius: '20px', bgcolor: alpha(wPctSaved >= 0 ? GREEN : RED, 0.1), display: 'inline-block' }}>
                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: wPctSaved >= 0 ? GREEN : RED }}>
                                                    {wPctSaved >= 0 ? '+' : ''}{wPctSaved.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.82rem', color: wSavings >= 0 ? GREEN : RED, py: 1.75, px: 2 }}>
                                            ${fmt(Math.abs(wSavings))} {wSavings >= 0 ? 'under' : 'over'}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* ── Expanded content ── */}
                            {!isCollapsed && (() => {
                                const expandView = weekExpandedView[weekIdx] ?? 'table';
                                const toggleExpandView = (v: 'table' | 'chart') =>
                                    setWeekExpandedView(prev => ({ ...prev, [weekIdx]: v }));

                                return (
                                    <Box sx={{ bgcolor: alpha(MAROON, 0.01) }}>
                                        {/* Sub-header: view toggle */}
                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                            px: 2, py: 1, borderBottom: `1px solid ${alpha('#000', 0.06)}`,
                                            bgcolor: '#fff', gap: 1,
                                        }}>
                                            <Typography sx={{ fontSize: '0.68rem', color: SLATE, mr: 0.5 }}>View as:</Typography>
                                            {([
                                                { v: 'table' as const, label: 'Table' },
                                                { v: 'chart' as const, label: 'Chart' },
                                            ]).map(({ v, label }) => (
                                                <Box
                                                    key={v}
                                                    onClick={() => toggleExpandView(v)}
                                                    sx={{
                                                        px: 1.5, py: 0.4, borderRadius: '7px', cursor: 'pointer',
                                                        fontSize: '0.72rem', fontWeight: 700,
                                                        border: `1px solid ${expandView === v ? MAROON : alpha('#000', 0.1)}`,
                                                        bgcolor: expandView === v ? alpha(MAROON, 0.08) : '#fff',
                                                        color: expandView === v ? MAROON : SLATE,
                                                        transition: 'all 0.15s',
                                                        '&:hover': { borderColor: MAROON, color: MAROON },
                                                    }}
                                                >
                                                    {label}
                                                </Box>
                                            ))}
                                        </Box>

                                        {/* Table view */}
                                        {expandView === 'table' && (
                                            <Table>
                                                <TableBody>
                                                    {CATEGORIES.map((cat, catIdx) => {
                                                        const d          = wData[cat];
                                                        const pctSaved   = calcPctSaved(d.planned, d.estimated);
                                                        const savingsC   = calcSavingsContrib(d.remaining);
                                                        const actualPct  = calcActualPct(d.planned, d.estimated);
                                                        const overBudget = d.estimated > d.planned;
                                                        return (
                                                            <TableRow
                                                                key={`${weekRange}-${cat}`}
                                                                sx={{
                                                                    '&:hover': { bgcolor: alpha(CHART_COLORS[catIdx], 0.04) },
                                                                    borderLeft: `3px solid ${overBudget ? RED : CHART_COLORS[catIdx]}`,
                                                                }}
                                                            >
                                                                <TableCell sx={{ py: 1.75, px: 2, width: '22%' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_COLORS[catIdx], flexShrink: 0 }} />
                                                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
                                                                        {overBudget && (
                                                                            <Box sx={{ px: 0.6, py: 0.1, borderRadius: '4px', bgcolor: alpha(RED, 0.1) }}>
                                                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: RED }}>OVER</Typography>
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontSize: '0.82rem', py: 1.75, px: 2, color: SLATE, fontVariantNumeric: 'tabular-nums' }}>${fmt(d.planned)}</TableCell>
                                                                <TableCell align="right" sx={{ fontSize: '0.82rem', py: 1.75, px: 2, color: overBudget ? RED : NAVY, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${fmt(d.estimated)}</TableCell>
                                                                <TableCell align="right" sx={{ fontSize: '0.82rem', py: 1.75, px: 2, color: SLATE }}>{actualPct.toFixed(1)}%</TableCell>
                                                                <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700, py: 1.75, px: 2, color: pctSaved >= 0 ? GREEN : RED }}>
                                                                    {pctSaved >= 0 ? '+' : ''}{pctSaved.toFixed(1)}%
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 600, py: 1.75, px: 2, color: savingsC >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
                                                                    ${fmt(Math.abs(savingsC))} {savingsC >= 0 ? 'under' : 'over'}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                    {/* Account balance row */}
                                                    <TableRow sx={{ bgcolor: alpha(TEAL, 0.03), borderTop: `1px solid ${alpha(TEAL, 0.12)}` }}>
                                                        <TableCell sx={{ py: 1.5, px: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                <AccountBalance sx={{ fontSize: '0.95rem', color: TEAL }} />
                                                                <Typography sx={{ fontWeight: 800, color: TEAL, fontSize: '0.78rem' }}>Account Balance</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell colSpan={5} align="right" sx={{ fontWeight: 800, fontSize: '0.9rem', color: TEAL, py: 1.5, px: 2, fontVariantNumeric: 'tabular-nums' }}>
                                                            ${fmt(acctBal)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        )}

                                        {/* Chart view */}
                                        {expandView === 'chart' && (
                                            <Box sx={{ p: 3, maxWidth: 420, mx: 'auto' }}>
                                                <WeekDonutPanel wData={wData} wPlanned={wPlanned} wEstimated={wEstimated} weekIdx={weekIdx} />
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })()}
                        </Box>
                    );
                })
            )}
        </Box>
    );

    // ── Statistics view ────────────────────────────────────────────────────────
    const renderStatistics = () => (
        <Grid container spacing={3}>
            {/* Bar chart: planned vs actual by week */}
            <Grid item xs={12} md={7}>
                <Card sx={{ p: 2.5, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.07)}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY, mb: 2 }}>Weekly: Planned vs Actual</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: SLATE }} />
                            <YAxis tick={{ fontSize: 11, fill: SLATE }} tickFormatter={v => `$${v}`} />
                            <RechartsTooltip formatter={(v: any) => [`$${fmt(v)}`, '']} contentStyle={{ borderRadius: 8, border: `1px solid ${alpha(MAROON, 0.15)}` }} />
                            <Bar dataKey="Planned" fill={alpha(TEAL, 0.6)} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Actual" fill={MAROON} radius={[4, 4, 0, 0]} />
                            <Legend formatter={v => <span style={{ fontSize: 11, color: SLATE, fontWeight: 600 }}>{v}</span>} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>

            {/* Pie: category breakdown */}
            <Grid item xs={12} md={5}>
                <Card sx={{ p: 2.5, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.07)}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY, mb: 2 }}>Spending by Category</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} dataKey="estimated" cx="50%" cy="45%" outerRadius={72} labelLine={false}
                                 label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Legend formatter={v => <span style={{ fontSize: 11, color: SLATE, fontWeight: 600 }}>{v}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>

            {/* Monthly summary card */}
            <Grid item xs={12}>
                <Card sx={{ p: 2.5, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.07)}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY, mb: 2 }}>Monthly Summary</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Budget Goal', value: `$${fmt(budgetGoal)}`, color: SLATE },
                            { label: 'Total Planned', value: `$${fmt(totalPlanned)}`, color: NAVY },
                            { label: 'Total Spent', value: `$${fmt(totalSpent)}`, color: MAROON },
                            { label: 'Savings %', value: `${percentageSaved >= 0 ? '+' : ''}${percentageSaved.toFixed(1)}%`, color: percentageSaved >= 0 ? GREEN : RED },
                            { label: 'Over Budget', value: `${spentOverBudgetPercentage > 0 ? '+' : ''}${spentOverBudgetPercentage.toFixed(1)}%`, color: spentOverBudgetPercentage > 0 ? RED : GREEN },
                        ].map(({ label, value, color }) => (
                            <Grid item xs={6} sm={4} md key={label}>
                                <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.14)}` }}>
                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.5 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Card>
            </Grid>
        </Grid>
    );

    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', bgcolor: BG }}>
            <Sidebar />
            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Page header ── */}
                <Grow in={animateIn} timeout={600}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: NAVY, letterSpacing: '-0.025em', lineHeight: 1 }}>
                                Budget Planner
                            </Typography>
                            <Typography sx={{ color: SLATE, mt: 0.75, fontSize: '0.9rem' }}>
                                Track weekly spending · Apply proven budget rules
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {[
                                { dir: 'prev', Icon: ChevronLeft },
                                { dir: 'next', Icon: ChevronRight },
                            ].map(({ dir, Icon }, i) => (
                                <React.Fragment key={dir}>
                                    {i === 1 && (
                                        <Card sx={{ px: 2, py: 0.85, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '10px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.09)}` }}>
                                            <CalendarToday sx={{ fontSize: 16, color: SLATE }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: NAVY }}>{currentMonth}</Typography>
                                        </Card>
                                    )}
                                    <IconButton
                                        onClick={() => handleMonthChange(dir as 'prev' | 'next')}
                                        sx={{ bgcolor: '#fff', border: `1px solid ${alpha('#000', 0.09)}`, borderRadius: '9px', width: 40, height: 40, '&:hover': { bgcolor: MAROON, color: '#fff', borderColor: MAROON } }}
                                    >
                                        <Icon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </React.Fragment>
                            ))}
                        </Box>
                    </Box>
                </Grow>

                {/* ── Toolbar row ── */}
                <Grow in={animateIn} timeout={700}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
                        {/* Template type pills */}
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                            {['Monthly', 'Biweekly', '2-Monthly', '3-Monthly'].map(type => (
                                <Box
                                    key={type}
                                    onClick={() => { setSelectedTemplateType(type); const t = bpTemplates.find(b => b.type === type); if (t) setSelectedTemplateId(t.id); }}
                                    sx={{
                                        px: 1.5, py: 0.6, borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                                        border: `1px solid ${selectedTemplateType === type ? MAROON : alpha('#000', 0.1)}`,
                                        bgcolor: selectedTemplateType === type ? alpha(MAROON, 0.08) : '#fff',
                                        color: selectedTemplateType === type ? MAROON : SLATE,
                                        '&:hover': { borderColor: MAROON, color: MAROON },
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {type}
                                </Box>
                            ))}
                        </Box>

                        {/* Template selector */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel sx={{ fontSize: '0.82rem', color: SLATE }}>Template</InputLabel>
                            <Select
                                value={selectedTemplateId || ''}
                                label="Template"
                                onChange={e => setSelectedTemplateId(e.target.value)}
                                sx={{ bgcolor: '#fff', borderRadius: '8px', fontSize: '0.82rem',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.12) },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: MAROON } }}
                            >
                                {bpTemplates.filter(t => t.type === selectedTemplateType).map(t => (
                                    <MenuItem key={t.id} value={t.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {t.ruleId && (() => { const r = BUDGET_RULES.find(x => x.id === t.ruleId); return r ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} /> : null; })()}
                                            <Typography sx={{ fontSize: '0.82rem' }}>{t.name}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ flex: 1 }} />

                        {/* Apply Rule button */}
                        <Button
                            variant="outlined"
                            startIcon={<Sparkles size={15} />}
                            onClick={() => setShowRuleSelector(v => !v)}
                            sx={{
                                borderColor: TEAL, color: TEAL, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                                '&:hover': { bgcolor: alpha(TEAL, 0.06), borderColor: TEAL },
                            }}
                        >
                            Apply Budget Rule
                        </Button>

                        {/* Save template */}
                        <Button
                            variant="contained"
                            onClick={() => setOpenDialog(true)}
                            sx={{ bgcolor: MAROON, color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', '&:hover': { bgcolor: MAROON_DARK } }}
                        >
                            Save as Template
                        </Button>
                    </Box>
                </Grow>

                {/* ── Active rule banner ── */}
                {activeRule && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 2.5, borderRadius: '10px', bgcolor: alpha(activeRule.color, 0.06), border: `1px solid ${alpha(activeRule.color, 0.2)}` }}>
                        <Box sx={{ color: activeRule.color, display: 'flex' }}>{activeRule.icon}</Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>
                            Using: <span style={{ color: activeRule.color }}>{activeRule.name}</span> —&nbsp;
                            <span style={{ color: SLATE, fontWeight: 400 }}>{activeRule.description}</span>
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Chip label={`Based on $${(currentTemplate as BPTemplate).monthlyIncome?.toLocaleString() ?? '—'}/mo`} size="small" sx={{ bgcolor: alpha(activeRule.color, 0.1), color: activeRule.color, fontWeight: 700, fontSize: '0.68rem' }} />
                    </Box>
                )}

                {/* ── Rule selector panel ── */}
                {showRuleSelector && <RuleSelectorPanel />}

                {/* ── Two-column layout: main content + side panel ── */}
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

                    {/* ── Main card ── */}
                    <Grow in={animateIn} timeout={800}>
                        <Card sx={{ flex: 1, minWidth: 0, p: 3, borderRadius: '16px', boxShadow: `0 4px 24px ${alpha('#000', 0.07)}`, border: `1px solid ${alpha('#000', 0.06)}` }}>

                            {/* Card header with summary stats */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: NAVY, mb: 0.25 }}>Monthly Breakdown</Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>Week-by-week category spending</Typography>
                                </Box>

                                {/* Mini stat pills */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Planned', val: `$${fmt(totalPlanned)}`, color: SLATE },
                                        { label: 'Spent', val: `$${fmt(totalSpent)}`, color: MAROON },
                                        { label: budgetUsedPct > 100 ? 'Over' : 'Used', val: `${budgetUsedPct.toFixed(1)}%`, color: progressColor },
                                    ].map(({ label, val, color }) => (
                                        <Box key={label} sx={{ px: 1.5, py: 0.6, borderRadius: '8px', bgcolor: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.18)}` }}>
                                            <Typography sx={{ fontSize: '0.65rem', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</Typography>
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{val}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Budget bar */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Budget utilization</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: progressColor }}>{budgetUsedPct.toFixed(1)}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={Math.min(budgetUsedPct, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(progressColor, 0.12), '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 } }} />
                            </Box>

                            {/* View toggle */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => { if (v) setViewMode(v); }} size="small"
                                                   sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 2, py: 0.75, color: SLATE, border: `1px solid ${alpha('#000', 0.1)}`, '&.Mui-selected': { bgcolor: MAROON, color: '#fff', borderColor: MAROON } } }}>
                                    <ToggleButton value="template">Table View</ToggleButton>
                                    <ToggleButton value="statistics">Statistics</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {viewMode === 'template' ? renderTable() : renderStatistics()}

                            {/* Monthly totals strip */}
                            <Box sx={{ mt: 3, p: 2.5, borderRadius: '12px', bgcolor: alpha(MAROON, 0.03), border: `1px solid ${alpha(MAROON, 0.1)}` }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY }}>Monthly Totals</Typography>
                                    <Button size="small" variant="outlined" onClick={() => setOpenDialog(true)} sx={{ borderColor: alpha(MAROON, 0.3), color: MAROON, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: '7px', '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                                        Save as Template
                                    </Button>
                                </Box>
                                <TableContainer sx={{ borderRadius: '8px', border: `1px solid ${alpha('#000', 0.07)}` }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(MAROON, 0.04) }}>
                                                {['Budget Goal', 'Total Planned', 'Total Spent', 'Savings %', 'Over Budget %'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 800, color: MAROON, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.25 }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                {[
                                                    { val: `$${fmt(budgetGoal)}`, color: NAVY },
                                                    { val: `$${fmt(totalPlanned)}`, color: NAVY },
                                                    { val: `$${fmt(totalSpent)}`, color: MAROON },
                                                    { val: `${percentageSaved >= 0 ? '+' : ''}${percentageSaved.toFixed(1)}%`, color: percentageSaved >= 0 ? GREEN : RED },
                                                    { val: `${spentOverBudgetPercentage > 0 ? '+' : ''}${spentOverBudgetPercentage.toFixed(1)}%`, color: spentOverBudgetPercentage > 0 ? RED : GREEN },
                                                ].map(({ val, color }, i) => (
                                                    <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.88rem', color, py: 1.5, fontVariantNumeric: 'tabular-nums' }}>{val}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Card>
                    </Grow>

                    {/* ── Side panel ── */}
                    <Grow in={animateIn} timeout={900}>
                        <Box sx={{ width: 320, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)' }}>
                            <BudgetPlannerSidePanel
                                budgetData={budgetData}
                                totalPlanned={totalPlanned}
                                totalSpent={totalSpent}
                                monthlyIncome={(currentTemplate as BPTemplate).monthlyIncome ?? 5000}
                                currentRuleId={(currentTemplate as BPTemplate).ruleId}
                                currentMonth={currentMonth}
                            />
                        </Box>
                    </Grow>

                </Box>{/* end two-column */}
            </Container>

            {/* ── Save template dialog ── */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 400 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>Save as Template</DialogTitle>
                <DialogContent>
                    <TextField label="Template Name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} fullWidth margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Template Type</InputLabel>
                        <Select value={newTemplateType} onChange={e => setNewTemplateType(e.target.value)} label="Template Type" sx={{ borderRadius: '8px' }}>
                            {['Monthly', 'Biweekly', '2-Monthly', '3-Monthly'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={handleSaveTemplate} variant="contained" disabled={!newTemplateName} sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: MAROON_DARK } }}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BudgetPlanner;

// import React, { useState, useEffect } from 'react';
// import {
//     Box,
//     Typography,
//     IconButton,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Paper,
//     Card,
//     CardContent,
//     Drawer,
//     List,
//     ListItem,
//     ListItemIcon,
//     ListItemText,
//     Grid,
//     Skeleton,
//     Container,
//     useTheme,
//     alpha,
//     Grow,
//     Button,
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     TextField,
//     ToggleButton,
//     ToggleButtonGroup,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     ButtonGroup,
// } from '@mui/material';
// import {
//     ChevronLeft,
//     ChevronRight,
//     Dashboard,
//     AccountBalance,
//     TrendingUp,
//     Category,
//     CalendarToday,
//     ExpandMore,
//     ExpandLess,
// } from '@mui/icons-material';
// import { styled } from '@mui/material/styles';
// import {
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     PieChart,
//     Pie,
//     Cell,
//     Legend,
//     ResponsiveContainer,
// } from 'recharts';
// import Sidebar from "./Sidebar";
//
// // Type definitions
// interface BudgetItem {
//     planned: number;
//     estimated: number;
//     remaining: number;
// }
//
// interface WeekData {
//     Housing: BudgetItem;
//     Food: BudgetItem;
//     Transportation: BudgetItem;
//     Entertainment: BudgetItem;
// }
//
// interface BudgetData {
//     week1: WeekData;
//     week2: WeekData;
//     week3: WeekData;
//     week4: WeekData;
// }
//
// interface MonthlyTotals {
//     budgetGoal: number;
//     totalPlanned: number;
//     totalSpent: number;
//     percentageSaved: number;
//     spentOverBudgetPercentage: number;
// }
//
// interface BPTemplate {
//     id: string;
//     name: string;
//     type: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly';
//     budgetData: BudgetData;
//     weekAccountBalances: { week1: number; week2: number; week3: number; week4: number };
//     weekDateRanges: string[];
//     monthlyTotals: MonthlyTotals;
// }
//
// type CategoryKey = keyof WeekData;
// type Direction = 'prev' | 'next';
// type ViewMode = 'template' | 'statistics';
//
// // Colors to match TopExpenseCategory
// const maroonColor = '#800000';
// const primaryBlue = '#1976d2';
// const lightGray = '#f9fafc';
//
// // Styled components to match TopExpenseCategory
// const StyledTableContainer = styled(TableContainer)({
//     borderRadius: 4,
//     overflow: 'hidden',
//     transition: 'box-shadow 0.3s ease-in-out',
//     '&:hover': {
//         boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
//     },
// });
//
// const StyledTableRow = styled(TableRow)({
//     backgroundColor: 'white',
// });
//
// const StyledTableHeadRow = styled(TableRow)({
//     backgroundColor: 'background.paper',
// });
//
// const StyledButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
//     '& .MuiButtonBase-root': {
//         border: `1px solid ${maroonColor}`,
//         color: maroonColor,
//         textTransform: 'none',
//         fontWeight: 600,
//         padding: '8px 16px',
//         transition: 'all 0.3s ease',
//         '&:hover': {
//             backgroundColor: 'rgba(128, 0, 0, 0.04)',
//         },
//         '&.Mui-selected': {
//             backgroundColor: primaryBlue,
//             color: 'white',
//             '&:hover': {
//                 backgroundColor: '#1565c0',
//             },
//         },
//         '&:not(:last-of-type)': {
//             borderRight: `1px solid ${maroonColor}`,
//         },
//     },
// }));
//
// const StyledButton = styled(Button)(({ theme }) => ({
//     textTransform: 'none',
//     fontWeight: 600,
//     padding: '8px 16px',
//     borderRadius: '8px',
//     transition: 'all 0.3s ease',
//     color: maroonColor,
//     borderColor: maroonColor,
//     '&:hover': {
//         backgroundColor: 'rgba(128, 0, 0, 0.04)',
//         borderColor: maroonColor,
//     },
//     '&.Mui-selected, &.MuiButton-contained': {
//         backgroundColor: maroonColor,
//         color: 'white',
//         '&:hover': {
//             backgroundColor: '#600000',
//         },
//     },
// }));
//
// // Simple UUID generator
// const generateUUID = (): string => {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
//         const r = Math.random() * 16 | 0;
//         const v = c === 'x' ? r : (r & 0x3 | 0x8);
//         return v.toString(16);
//     });
// };
//
// const BudgetPlanner: React.FC = () => {
//     const [currentMonth, setCurrentMonth] = useState<string>('June 2025');
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [viewMode, setViewMode] = useState<ViewMode>('template');
//     const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
//     const [animateIn, setAnimateIn] = useState(false);
//     const [bpTemplates, setBPTemplates] = useState<BPTemplate[]>([]);
//     const [selectedTemplateType, setSelectedTemplateType] = useState<
//         'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
//     >('Monthly');
//     const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
//     const [openDialog, setOpenDialog] = useState(false);
//     const [newTemplateName, setNewTemplateName] = useState('');
//     const [newTemplateType, setNewTemplateType] = useState<
//         'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
//     >('Monthly');
//     const theme = useTheme();
//
//     // Trigger animation after component mounts
//     useEffect(() => {
//         setTimeout(() => setAnimateIn(true), 100);
//     }, []);
//
//     // Initial budget data
//     const initialBudgetData: BudgetData = {
//         week1: {
//             Housing: { planned: 500, estimated: 480, remaining: 20 },
//             Food: { planned: 200, estimated: 185, remaining: 15 },
//             Transportation: { planned: 150, estimated: 145, remaining: 5 },
//             Entertainment: { planned: 100, estimated: 120, remaining: -20 },
//         },
//         week2: {
//             Housing: { planned: 500, estimated: 500, remaining: 0 },
//             Food: { planned: 200, estimated: 195, remaining: 5 },
//             Transportation: { planned: 150, estimated: 140, remaining: 10 },
//             Entertainment: { planned: 100, estimated: 85, remaining: 15 },
//         },
//         week3: {
//             Housing: { planned: 500, estimated: 485, remaining: 15 },
//             Food: { planned: 200, estimated: 210, remaining: -10 },
//             Transportation: { planned: 150, estimated: 155, remaining: -5 },
//             Entertainment: { planned: 100, estimated: 95, remaining: 5 },
//         },
//         week4: {
//             Housing: { planned: 500, estimated: 475, remaining: 25 },
//             Food: { planned: 200, estimated: 190, remaining: 10 },
//             Transportation: { planned: 150, estimated: 148, remaining: 2 },
//             Entertainment: { planned: 100, estimated: 110, remaining: -10 },
//         },
//     };
//
//     const initialWeekAccountBalances = {
//         week1: 5020,
//         week2: 5050,
//         week3: 5055,
//         week4: 5082,
//     };
//
//     const initialWeekDateRanges = [
//         '06/01/25 - 06/07/25',
//         '06/08/25 - 06/14/25',
//         '06/15/25 - 06/21/25',
//         '06/22/25 - 06/28/25',
//     ];
//
//     // Initialize with default template
//     useEffect(() => {
//         const initialTotals = calculateMonthlyTotals(initialBudgetData);
//         const defaultTemplate: BPTemplate = {
//             id: generateUUID(),
//             name: 'Default June 2025',
//             type: 'Monthly',
//             budgetData: initialBudgetData,
//             weekAccountBalances: initialWeekAccountBalances,
//             weekDateRanges: initialWeekDateRanges,
//             monthlyTotals: initialTotals,
//         };
//         setBPTemplates([defaultTemplate]);
//         setSelectedTemplateId(defaultTemplate.id);
//     }, []);
//
//     // Helper functions for calculations
//     const calculatePercentageSaved = (planned: number, estimated: number): number => {
//         if (planned === 0) return 0;
//         const savings = planned - estimated;
//         return (savings / planned) * 100;
//     };
//
//     const calculateSpentOverBudgetPercentage = (planned: number, spent: number): number => {
//         if (planned === 0) return 0;
//         const difference = spent - planned;
//         return (difference / planned) * 100;
//     };
//
//     const calculateActualOverPlannedPercentage = (planned: number, estimated: number): number => {
//         if (planned === 0) return 0;
//         return (estimated / planned) * 100;
//     };
//
//     const calculateSavingsContributed = (remaining: number): number => {
//         return Math.max(0, remaining);
//     };
//
//     // Calculate monthly totals
//     const calculateMonthlyTotals = (data: BudgetData): MonthlyTotals => {
//         let totalPlanned = 0;
//         let totalSpent = 0;
//         const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
//         const weeks = ['week1', 'week2', 'week3', 'week4'] as const;
//
//         weeks.forEach((weekKey) => {
//             const weekData = data[weekKey];
//             categories.forEach((category) => {
//                 totalPlanned += weekData[category].planned;
//                 totalSpent += weekData[category].estimated;
//             });
//         });
//
//         const percentageSaved = calculatePercentageSaved(totalPlanned, totalSpent);
//         const spentOverBudgetPercentage = calculateSpentOverBudgetPercentage(totalPlanned, totalSpent);
//         const budgetGoal = totalPlanned;
//
//         return {
//             budgetGoal,
//             totalPlanned,
//             totalSpent,
//             percentageSaved,
//             spentOverBudgetPercentage,
//         };
//     };
//
//     // Get current template data
//     const currentTemplate = bpTemplates.find((t) => t.id === selectedTemplateId) || {
//         budgetData: initialBudgetData,
//         weekAccountBalances: initialWeekAccountBalances,
//         weekDateRanges: initialWeekDateRanges,
//         monthlyTotals: calculateMonthlyTotals(initialBudgetData),
//     };
//
//     const { budgetData, weekAccountBalances, weekDateRanges } = currentTemplate;
//     const { budgetGoal, totalPlanned, totalSpent, percentageSaved, spentOverBudgetPercentage } =
//     currentTemplate.monthlyTotals || calculateMonthlyTotals(budgetData);
//
//     const handleMonthChange = (direction: Direction): void => {
//         setIsLoading(true);
//         setTimeout(() => {
//             console.log(`Changing month ${direction}`);
//             setIsLoading(false);
//         }, 500);
//     };
//
//     const toggleWeekCollapse = (weekIndex: number): void => {
//         setCollapsedWeeks((prev) => {
//             const newSet = new Set(prev);
//             if (newSet.has(weekIndex)) {
//                 newSet.delete(weekIndex);
//             } else {
//                 newSet.add(weekIndex);
//             }
//             return newSet;
//         });
//     };
//
//     const handleSaveTemplate = () => {
//         if (!newTemplateName) return;
//         const newTemplate: BPTemplate = {
//             id: generateUUID(),
//             name: newTemplateName,
//             type: newTemplateType,
//             budgetData,
//             weekAccountBalances,
//             weekDateRanges,
//             monthlyTotals: calculateMonthlyTotals(budgetData),
//         };
//         setBPTemplates((prev) => [...prev, newTemplate]);
//         setOpenDialog(false);
//         setNewTemplateName('');
//         setNewTemplateType('Monthly');
//     };
//
//     const handleTemplateTypeChange = (
//         event: React.MouseEvent<HTMLElement>,
//         newType: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly' | null
//     ) => {
//         if (newType) {
//             setSelectedTemplateType(newType);
//             const availableTemplates = bpTemplates.filter((t) => t.type === newType);
//             setSelectedTemplateId(availableTemplates[0]?.id || null);
//         }
//     };
//
//     const handleTemplateSelect = (event: any) => {
//         setSelectedTemplateId(event.target.value as string);
//     };
//
//     const handleViewModeChange = (
//         event: React.MouseEvent<HTMLElement>,
//         newViewMode: ViewMode | null
//     ) => {
//         if (newViewMode) {
//             setViewMode(newViewMode);
//         }
//     };
//
//     // Prepare data for Pie Charts in Statistics View
//     const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
//     const pieChartData = categories.map((category, index) => {
//         const totalPlanned = ['week1', 'week2', 'week3', 'week4'].reduce(
//             (sum, weekKey) => sum + budgetData[weekKey as keyof BudgetData][category].planned,
//             0
//         );
//         const totalEstimated = ['week1', 'week2', 'week3', 'week4'].reduce(
//             (sum, weekKey) => sum + budgetData[weekKey as keyof BudgetData][category].estimated,
//             0
//         );
//         return {
//             id: index,
//             label: category,
//             planned: totalPlanned,
//             estimated: totalEstimated,
//         };
//     });
//
//     const renderTemplateView = () => (
//         <>
//             <StyledTableContainer>
//                 <Table sx={{ minWidth: 650 }}>
//                     <TableHead>
//                         <StyledTableHeadRow>
//                             <TableCell
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                     width: '200px',
//                                 }}
//                             >
//                                 Week Period
//                             </TableCell>
//                             <TableCell
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                 }}
//                             >
//                                 Category
//                             </TableCell>
//                             <TableCell
//                                 align="right"
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                 }}
//                             >
//                                 Planned
//                             </TableCell>
//                             <TableCell
//                                 align="right"
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                 }}
//                             >
//                                 Actual
//                             </TableCell>
//                             <TableCell
//                                 align="right"
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                 }}
//                             >
//                                 Spending %
//                             </TableCell>
//                             <TableCell
//                                 align="right"
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                 }}
//                             >
//                                 Savings %
//                             </TableCell>
//                             <TableCell
//                                 align="right"
//                                 sx={{
//                                     fontWeight: 'bold',
//                                     color: maroonColor,
//                                     fontSize: '0.95rem',
//                                     padding: '20px 16px',
//                                 }}
//                             >
//                                 Savings Contribution
//                             </TableCell>
//                         </StyledTableHeadRow>
//                     </TableHead>
//                     <TableBody>
//                         {isLoading ? (
//                             <StyledTableRow>
//                                 <TableCell colSpan={7}>
//                                     <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
//                                 </TableCell>
//                             </StyledTableRow>
//                         ) : (
//                             ((): JSX.Element[] => {
//                                 const rows: JSX.Element[] = [];
//
//                                 weekDateRanges.forEach((weekRange, weekIndex) => {
//                                     const weekKey = `week${weekIndex + 1}` as keyof BudgetData;
//                                     const weekData = budgetData[weekKey];
//                                     const isCollapsed = collapsedWeeks.has(weekIndex);
//                                     const accountBalance = weekAccountBalances[weekKey];
//
//                                     // Calculate week totals
//                                     const weekTotalPlanned = categories.reduce(
//                                         (sum, category) => sum + weekData[category].planned,
//                                         0
//                                     );
//                                     const weekTotalEstimated = categories.reduce(
//                                         (sum, category) => sum + weekData[category].estimated,
//                                         0
//                                     );
//                                     const weekTotalSavingsContributed = categories.reduce(
//                                         (sum, category) => sum + calculateSavingsContributed(weekData[category].remaining),
//                                         0
//                                     );
//                                     const weekPercentageSaved = calculatePercentageSaved(
//                                         weekTotalPlanned,
//                                         weekTotalEstimated
//                                     );
//                                     const weekActualOverPlanned = calculateActualOverPlannedPercentage(
//                                         weekTotalPlanned,
//                                         weekTotalEstimated
//                                     );
//
//                                     // Week header row with collapse/expand functionality
//                                     rows.push(
//                                         <StyledTableRow
//                                             key={`${weekRange}-header`}
//                                             onClick={() => toggleWeekCollapse(weekIndex)}
//                                         >
//                                             <TableCell
//                                                 sx={{
//                                                     fontWeight: 'bold',
//                                                     color: maroonColor,
//                                                     fontSize: '0.95rem',
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     gap: 1.5,
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 <Box
//                                                     sx={{
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         p: 0.5,
//                                                         borderRadius: '50%',
//                                                         backgroundColor: primaryBlue,
//                                                         color: 'white',
//                                                     }}
//                                                 >
//                                                     {isCollapsed ? (
//                                                         <ExpandMore sx={{ fontSize: '1.2rem' }} />
//                                                     ) : (
//                                                         <ExpandLess sx={{ fontSize: '1.2rem' }} />
//                                                     )}
//                                                 </Box>
//                                                 {weekRange}
//                                             </TableCell>
//                                             <TableCell
//                                                 sx={{
//                                                     fontWeight: 500,
//                                                     color: 'text.secondary',
//                                                     fontSize: '0.875rem',
//                                                     fontStyle: 'italic',
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 {isCollapsed ? 'Click to expand' : 'Click to collapse'}
//                                             </TableCell>
//                                             <TableCell
//                                                 align="right"
//                                                 sx={{
//                                                     fontWeight: 'bold',
//                                                     fontSize: '0.95rem',
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 ${weekTotalPlanned.toLocaleString('en-US', {
//                                                 minimumFractionDigits: 2,
//                                                 maximumFractionDigits: 2,
//                                             })}
//                                             </TableCell>
//                                             <TableCell
//                                                 align="right"
//                                                 sx={{
//                                                     fontWeight: 'bold',
//                                                     fontSize: '0.95rem',
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 ${weekTotalEstimated.toLocaleString('en-US', {
//                                                 minimumFractionDigits: 2,
//                                                 maximumFractionDigits: 2,
//                                             })}
//                                             </TableCell>
//                                             <TableCell
//                                                 align="right"
//                                                 sx={{
//                                                     fontWeight: 'bold',
//                                                     fontSize: '0.95rem',
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 {weekActualOverPlanned.toFixed(1)}%
//                                             </TableCell>
//                                             <TableCell
//                                                 align="right"
//                                                 sx={{
//                                                     color: weekPercentageSaved >= 0 ? 'green' : 'red',
//                                                     fontWeight: 'bold',
//                                                     fontSize: '0.95rem',
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 {weekPercentageSaved >= 0 ? '+' : ''}{weekPercentageSaved.toFixed(1)}%
//                                             </TableCell>
//                                             <TableCell
//                                                 align="right"
//                                                 sx={{
//                                                     color: weekTotalSavingsContributed >= 0 ? 'green' : 'red',
//                                                     fontWeight: 'bold',
//                                                     fontSize: '0.95rem',
//                                                     padding: '20px 16px',
//                                                 }}
//                                             >
//                                                 ${Math.abs(weekTotalSavingsContributed).toLocaleString('en-US', {
//                                                 minimumFractionDigits: 2,
//                                                 maximumFractionDigits: 2,
//                                             })}
//                                                 {weekTotalSavingsContributed >= 0 ? ' under' : ' over'}
//                                             </TableCell>
//                                         </StyledTableRow>
//                                     );
//
//                                     // Category rows (only show if not collapsed)
//                                     if (!isCollapsed) {
//                                         categories.forEach((category) => {
//                                             const data = weekData[category];
//                                             const percentageSaved = calculatePercentageSaved(data.planned, data.estimated);
//                                             const savingsContributed = calculateSavingsContributed(data.remaining);
//                                             const actualOverPlanned = calculateActualOverPlannedPercentage(
//                                                 data.planned,
//                                                 data.estimated
//                                             );
//
//                                             rows.push(
//                                                 <StyledTableRow key={`${weekRange}-${category}`}>
//                                                     <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
//                                                     <TableCell
//                                                         component="th"
//                                                         scope="row"
//                                                         sx={{
//                                                             fontWeight: 500,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         {category}
//                                                     </TableCell>
//                                                     <TableCell
//                                                         align="right"
//                                                         sx={{
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         ${data.planned.toLocaleString('en-US', {
//                                                         minimumFractionDigits: 2,
//                                                         maximumFractionDigits: 2,
//                                                     })}
//                                                     </TableCell>
//                                                     <TableCell
//                                                         align="right"
//                                                         sx={{
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         ${data.estimated.toLocaleString('en-US', {
//                                                         minimumFractionDigits: 2,
//                                                         maximumFractionDigits: 2,
//                                                     })}
//                                                     </TableCell>
//                                                     <TableCell
//                                                         align="right"
//                                                         sx={{
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         {actualOverPlanned.toFixed(1)}%
//                                                     </TableCell>
//                                                     <TableCell
//                                                         align="right"
//                                                         sx={{
//                                                             color: percentageSaved >= 0 ? 'green' : 'red',
//                                                             fontWeight: 'bold',
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
//                                                     </TableCell>
//                                                     <TableCell
//                                                         align="right"
//                                                         sx={{
//                                                             color: savingsContributed >= 0 ? 'green' : 'red',
//                                                             fontWeight: 'bold',
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         ${Math.abs(savingsContributed).toLocaleString('en-US', {
//                                                         minimumFractionDigits: 2,
//                                                         maximumFractionDigits: 2,
//                                                     })}
//                                                         {savingsContributed >= 0 ? ' under' : ' over'}
//                                                     </TableCell>
//                                                 </StyledTableRow>
//                                             );
//                                         });
//
//                                         // Account balance row
//                                         rows.push(
//                                             <StyledTableRow key={`${weekRange}-balance`}>
//                                                 <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
//                                                 <TableCell
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         color: maroonColor,
//                                                         fontSize: '0.95rem',
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         gap: 1,
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     <AccountBalance sx={{ fontSize: '1.1rem' }} />
//                                                     Account Balance
//                                                 </TableCell>
//                                                 <TableCell
//                                                     colSpan={5}
//                                                     align="right"
//                                                     sx={{
//                                                         fontWeight: 'bold',
//                                                         fontSize: '0.95rem',
//                                                         padding: '20px 16px',
//                                                     }}
//                                                 >
//                                                     ${accountBalance.toLocaleString('en-US', {
//                                                     minimumFractionDigits: 2,
//                                                     maximumFractionDigits: 2,
//                                                 })}
//                                                 </TableCell>
//                                             </StyledTableRow>
//                                         );
//                                     }
//                                 });
//
//                                 return rows;
//                             })()
//                         )}
//                     </TableBody>
//                 </Table>
//             </StyledTableContainer>
//         </>
//     );
//
//     // Transform pieChartData for Recharts
//     const plannedPieData = pieChartData.map((item) => ({
//         name: item.label,
//         value: item.planned,
//     }));
//     const estimatedPieData = pieChartData.map((item) => ({
//         name: item.label,
//         value: item.estimated,
//     }));
//
// // Define colors for pie slices
//     const COLORS = [primaryBlue, '#1565c0', maroonColor, '#600000'];
//
//     const renderStatisticsView = () => (
//         <Grid container spacing={4}>
//             <Grid item xs={12} md={6}>
//                 <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
//                     <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: maroonColor }}>
//                         Planned Spending by Category
//                     </Typography>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                             <Pie
//                                 data={plannedPieData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 cx="50%"
//                                 cy="50%"
//                                 innerRadius={30}
//                                 outerRadius={80}
//                                 paddingAngle={2}
//                             >
//                                 {plannedPieData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                             </Pie>
//                             <Tooltip
//                                 contentStyle={{
//                                     backgroundColor: 'white',
//                                     border: `1px solid ${maroonColor}`,
//                                     borderRadius: '4px',
//                                 }}
//                             />
//                             <Legend
//                                 layout="horizontal"
//                                 verticalAlign="bottom"
//                                 align="center"
//                                 wrapperStyle={{ paddingTop: '10px' }}
//                             />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </Card>
//             </Grid>
//             <Grid item xs={12} md={6}>
//                 <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
//                     <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: maroonColor }}>
//                         Actual Spending by Category
//                     </Typography>
//                     <ResponsiveContainer width="100%" height={300}>
//                     <PieChart>
//                         <Pie
//                             data={estimatedPieData}
//                             dataKey="value"
//                             nameKey="name"
//                             cx="50%"
//                             cy="50%"
//                             innerRadius={30}
//                             outerRadius={80}
//                             paddingAngle={2}
//                         >
//                             {estimatedPieData.map((entry, index) => (
//                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                             ))}
//                         </Pie>
//                         <Tooltip
//                             contentStyle={{
//                                 backgroundColor: 'white',
//                                 border: `1px solid ${maroonColor}`,
//                                 borderRadius: '4px',
//                             }}
//                         />
//                         <Legend
//                             layout="horizontal"
//                             verticalAlign="bottom"
//                             align="center"
//                             wrapperStyle={{ paddingTop: '10px' }}
//                         />
//                     </PieChart>
//                     </ResponsiveContainer>
//                 </Card>
//             </Grid>
//             <Grid item xs={12}>
//                 <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
//                     <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: maroonColor }}>
//                         Monthly Summary
//                     </Typography>
//                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//                         <Typography>
//                             <strong>Budget Goal:</strong> ${budgetGoal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                         </Typography>
//                         <Typography>
//                             <strong>Total Planned:</strong> ${totalPlanned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                         </Typography>
//                         <Typography>
//                             <strong>Total Spent:</strong> ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                         </Typography>
//                         <Typography sx={{ color: percentageSaved >= 0 ? 'green' : 'red' }}>
//                             <strong>Savings %:</strong> {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
//                         </Typography>
//                         <Typography sx={{ color: spentOverBudgetPercentage > 0 ? 'red' : 'green' }}>
//                             <strong>Spent Over Budget %:</strong> {spentOverBudgetPercentage > 0 ? '+' : ''}{spentOverBudgetPercentage.toFixed(1)}%
//                         </Typography>
//                     </Box>
//                 </Card>
//             </Grid>
//         </Grid>
//     );
//
//     return (
//         <Box
//             sx={{
//                 maxWidth: 'calc(100% - 240px)',
//                 ml: '240px',
//                 minHeight: '100vh',
//                 background: lightGray,
//                 backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
//                 backgroundSize: '40px 40px',
//             }}
//         >
//             <Sidebar />
//             <Container maxWidth="lg" sx={{ py: 4 }}>
//                 <Grow in={animateIn} timeout={600}>
//                     <Box
//                         sx={{
//                             display: 'flex',
//                             justifyContent: 'space-between',
//                             alignItems: 'center',
//                             mb: 4,
//                             flexDirection: { xs: 'column', sm: 'row' },
//                             textAlign: { xs: 'center', sm: 'left' },
//                             gap: 2,
//                         }}
//                     >
//                         <Box>
//                             <Typography
//                                 variant="h4"
//                                 component="h1"
//                                 sx={{
//                                     fontWeight: 800,
//                                     color: theme.palette.text.primary,
//                                     letterSpacing: '-0.025em',
//                                 }}
//                             >
//                                 John Smith's Budget Planner
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
//                                 Track your weekly spending and savings progress
//                             </Typography>
//                         </Box>
//                         <Box
//                             sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: 1,
//                             }}
//                         >
//                             <IconButton
//                                 sx={{
//                                     backgroundColor: 'white',
//                                     border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
//                                     borderRadius: '8px',
//                                     width: '48px',
//                                     height: '48px',
//                                     transition: 'all 0.3s ease',
//                                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
//                                     '&:hover': {
//                                         backgroundColor: primaryBlue,
//                                         color: 'white',
//                                         transform: 'translateY(-1px)',
//                                         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//                                         borderColor: primaryBlue,
//                                     },
//                                 }}
//                                 onClick={() => handleMonthChange('prev')}
//                             >
//                                 <ChevronLeft />
//                             </IconButton>
//                             <Card
//                                 sx={{
//                                     px: 2.5,
//                                     py: 1,
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     borderRadius: 2,
//                                     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
//                                 }}
//                             >
//                                 <CalendarToday style={{ marginRight: 8, color: theme.palette.text.secondary, fontSize: 18 }} />
//                                 <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                                     {currentMonth}
//                                 </Typography>
//                             </Card>
//                             <IconButton
//                                 sx={{
//                                     backgroundColor: 'white',
//                                     border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
//                                     borderRadius: '8px',
//                                     width: '48px',
//                                     height: '48px',
//                                     transition: 'all 0.3s ease',
//                                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
//                                     '&:hover': {
//                                         backgroundColor: primaryBlue,
//                                         color: 'white',
//                                         transform: 'translateY(-1px)',
//                                         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//                                         borderColor: primaryBlue,
//                                     },
//                                 }}
//                                 onClick={() => handleMonthChange('next')}
//                             >
//                                 <ChevronRight />
//                             </IconButton>
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
//                     <StyledButtonGroup
//                         value={selectedTemplateType}
//                         exclusive
//                         onChange={handleTemplateTypeChange}
//                         sx={{ backgroundColor: 'white', borderRadius: '8px' }}
//                     >
//                         <StyledButton
//                             value="Monthly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             Monthly
//                         </StyledButton>
//                         <StyledButton
//                             value="Biweekly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             Biweekly
//                         </StyledButton>
//                         <StyledButton
//                             value="2-Monthly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             2-Monthly
//                         </StyledButton>
//                         <StyledButton
//                             value="3-Monthly"
//                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
//                         >
//                             3-Monthly
//                         </StyledButton>
//                     </StyledButtonGroup>
//                     <FormControl sx={{ minWidth: 200 }}>
//                         <InputLabel sx={{ color: maroonColor }}>Select Template</InputLabel>
//                         <Select
//                             value={selectedTemplateId || ''}
//                             label="Select Template"
//                             onChange={handleTemplateSelect}
//                             sx={{ backgroundColor: 'white', borderRadius: '8px' }}
//                         >
//                             {bpTemplates
//                                 .filter((t) => t.type === selectedTemplateType)
//                                 .map((t) => (
//                                     <MenuItem key={t.id} value={t.id}>
//                                         {t.name}
//                                     </MenuItem>
//                                 ))}
//                         </Select>
//                     </FormControl>
//                     <Button
//                         variant="contained"
//                         sx={{
//                             backgroundColor: primaryBlue,
//                             color: 'white',
//                             borderRadius: '8px',
//                             '&:hover': { backgroundColor: '#1565c0' },
//                         }}
//                         onClick={() => setOpenDialog(true)}
//                     >
//                         Save as Template
//                     </Button>
//                 </Box>
//
//                 <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//                     <DialogTitle sx={{ color: maroonColor }}>Save Budget Plan Template</DialogTitle>
//                     <DialogContent>
//                         <TextField
//                             label="Template Name"
//                             value={newTemplateName}
//                             onChange={(e) => setNewTemplateName(e.target.value)}
//                             fullWidth
//                             margin="normal"
//                             sx={{ backgroundColor: 'white' }}
//                         />
//                         <FormControl sx={{ minWidth: '100%' }} variant="outlined" margin="normal">
//                             <InputLabel sx={{ color: maroonColor }}>Template Type</InputLabel>
//                             <Select
//                                 value={newTemplateType}
//                                 onChange={(e) =>
//                                     setNewTemplateType(e.target.value as 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly')
//                                 }
//                                 label="Template Type"
//                                 sx={{ backgroundColor: 'white' }}
//                             >
//                                 <MenuItem value="Monthly">Monthly</MenuItem>
//                                 <MenuItem value="Biweekly">Biweekly</MenuItem>
//                                 <MenuItem value="2-Monthly">2-Monthly</MenuItem>
//                                 <MenuItem value="3-Monthly">3-Monthly</MenuItem>
//                             </Select>
//                         </FormControl>
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={() => setOpenDialog(false)} sx={{ color: maroonColor }}>
//                             Cancel
//                         </Button>
//                         <Button
//                             onClick={handleSaveTemplate}
//                             variant="contained"
//                             sx={{ backgroundColor: primaryBlue, color: 'white' }}
//                             disabled={!newTemplateName}
//                         >
//                             Save
//                         </Button>
//                     </DialogActions>
//                 </Dialog>
//
//                 <Grid container spacing={4}>
//                     <Grid item xs={12}>
//                         <Grow in={animateIn} timeout={800}>
//                             <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                                     <StyledButtonGroup
//                                         value={viewMode}
//                                         exclusive
//                                         onChange={handleViewModeChange}
//                                         sx={{ backgroundColor: 'white', borderRadius: '8px' }}
//                                     >
//                                         <ToggleButton value="template">Template View</ToggleButton>
//                                         <ToggleButton value="statistics">Statistics View</ToggleButton>
//                                     </StyledButtonGroup>
//                                 </Box>
//                                 <Typography
//                                     variant="h5"
//                                     component="h2"
//                                     sx={{
//                                         fontWeight: 'bold',
//                                         mb: 2,
//                                         textAlign: 'left',
//                                         color: 'text.primary',
//                                     }}
//                                 >
//                                     Monthly Breakdown by Week & Category
//                                 </Typography>
//                                 {viewMode === 'template' ? renderTemplateView() : renderStatisticsView()}
//                                 <Box sx={{ mt: 4 }}>
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                                         <Typography
//                                             variant="h5"
//                                             component="h2"
//                                             sx={{
//                                                 fontWeight: 'bold',
//                                                 textAlign: 'left',
//                                                 color: 'text.primary',
//                                             }}
//                                         >
//                                             Monthly Totals
//                                         </Typography>
//                                         <Button
//                                             variant="contained"
//                                             sx={{
//                                                 backgroundColor: primaryBlue,
//                                                 color: 'white',
//                                                 borderRadius: '8px',
//                                                 '&:hover': { backgroundColor: '#1565c0' },
//                                             }}
//                                             onClick={() => setOpenDialog(true)}
//                                         >
//                                             Save as Template
//                                         </Button>
//                                     </Box>
//                                     <StyledTableContainer>
//                                         <Table sx={{ minWidth: 650 }}>
//                                             <TableHead>
//                                                 <StyledTableHeadRow>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Budget Goal
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Total Planned
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Total Spent
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Savings %
//                                                     </TableCell>
//                                                     <TableCell
//                                                         sx={{
//                                                             fontWeight: 'bold',
//                                                             color: maroonColor,
//                                                             fontSize: '0.95rem',
//                                                             padding: '20px 16px',
//                                                         }}
//                                                     >
//                                                         Spent Over Budget %
//                                                     </TableCell>
//                                                 </StyledTableHeadRow>
//                                             </TableHead>
//                                             <TableBody>
//                                                 {isLoading ? (
//                                                     <StyledTableRow>
//                                                         <TableCell colSpan={5}>
//                                                             <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
//                                                         </TableCell>
//                                                     </StyledTableRow>
//                                                 ) : (
//                                                     <StyledTableRow>
//                                                         <TableCell
//                                                             sx={{
//                                                                 fontWeight: 500,
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             ${budgetGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 fontWeight: 500,
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             ${totalPlanned.toLocaleString('en-US', {
//                                                             minimumFractionDigits: 2,
//                                                             maximumFractionDigits: 2,
//                                                         })}
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 fontWeight: 500,
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 color: percentageSaved >= 0 ? 'green' : 'red',
//                                                                 fontWeight: 'bold',
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
//                                                         </TableCell>
//                                                         <TableCell
//                                                             sx={{
//                                                                 color: spentOverBudgetPercentage > 0 ? 'red' : 'green',
//                                                                 fontWeight: 'bold',
//                                                                 fontSize: '0.95rem',
//                                                                 padding: '20px 16px',
//                                                             }}
//                                                         >
//                                                             {spentOverBudgetPercentage > 0 ? '+' : ''}{spentOverBudgetPercentage.toFixed(1)}%
//                                                         </TableCell>
//                                                     </StyledTableRow>
//                                                 )}
//                                             </TableBody>
//                                         </Table>
//                                     </StyledTableContainer>
//                                 </Box>
//                             </Card>
//                         </Grow>
//                     </Grid>
//                 </Grid>
//             </Container>
//         </Box>
//     );
// };
//
// export default BudgetPlanner;
//
// // import React, { useState, useEffect } from 'react';
// // import {
// //     Box,
// //     Typography,
// //     IconButton,
// //     Table,
// //     TableBody,
// //     TableCell,
// //     TableContainer,
// //     TableHead,
// //     TableRow,
// //     Paper,
// //     Card,
// //     CardContent,
// //     Drawer,
// //     List,
// //     ListItem,
// //     ListItemIcon,
// //     ListItemText,
// //     Grid,
// //     Skeleton,
// //     Container,
// //     useTheme,
// //     alpha,
// //     Grow,
// //     Button,
// //     Dialog,
// //     DialogTitle,
// //     DialogContent,
// //     DialogActions,
// //     TextField,
// //     ToggleButton,
// //     ToggleButtonGroup,
// //     Select,
// //     MenuItem,
// //     FormControl,
// //     InputLabel,
// //     ButtonGroup,
// // } from '@mui/material';
// // import {
// //     ChevronLeft,
// //     ChevronRight,
// //     Dashboard,
// //     AccountBalance,
// //     TrendingUp,
// //     Category,
// //     CalendarToday,
// //     ExpandMore,
// //     ExpandLess,
// // } from '@mui/icons-material';
// // import { styled } from '@mui/material/styles';
// // import Sidebar from "./Sidebar";
// //
// // // Type definitions
// // interface BudgetItem {
// //     planned: number;
// //     estimated: number;
// //     remaining: number;
// // }
// //
// // interface WeekData {
// //     Housing: BudgetItem;
// //     Food: BudgetItem;
// //     Transportation: BudgetItem;
// //     Entertainment: BudgetItem;
// // }
// //
// // interface BudgetData {
// //     week1: WeekData;
// //     week2: WeekData;
// //     week3: WeekData;
// //     week4: WeekData;
// // }
// //
// // interface MonthlyTotals {
// //     budgetGoal: number;
// //     totalPlanned: number;
// //     totalSpent: number;
// //     percentageSaved: number;
// //     spentOverBudgetPercentage: number;
// // }
// //
// // interface BPTemplate {
// //     id: string;
// //     name: string;
// //     type: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly';
// //     budgetData: BudgetData;
// //     weekAccountBalances: { week1: number; week2: number; week3: number; week4: number };
// //     weekDateRanges: string[];
// //     monthlyTotals: MonthlyTotals;
// // }
// //
// // type CategoryKey = keyof WeekData;
// // type Direction = 'prev' | 'next';
// // type ViewMode = 'table' | 'statistics';
// //
// // // Colors to match TopExpenseCategory
// // const maroonColor = '#800000';
// // const primaryBlue = '#1976d2';
// // const lightGray = '#f9fafc';
// //
// // // Styled components to match TopExpenseCategory
// // const StyledTableContainer = styled(TableContainer)({
// //     borderRadius: 4,
// //     overflow: 'hidden',
// //     transition: 'box-shadow 0.3s ease-in-out',
// //     '&:hover': {
// //         boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
// //     },
// // });
// //
// // const StyledTableRow = styled(TableRow)({
// //     backgroundColor: 'white',
// // });
// //
// // const StyledTableHeadRow = styled(TableRow)({
// //     backgroundColor: 'background.paper',
// // });
// //
// // const StyledButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
// //     '& .MuiToggleButtonGroup-grouped': {
// //         border: `1px solid ${maroonColor}`,
// //         '&:not(:last-of-type)': {
// //             borderRight: `1px solid ${maroonColor}`,
// //         },
// //     },
// // }));
// //
// // const StyledButton = styled(Button)(({ theme }) => ({
// //     textTransform: 'none',
// //     fontWeight: 600,
// //     padding: '8px 16px',
// //     borderRadius: '8px',
// //     transition: 'all 0.3s ease',
// //     color: maroonColor,
// //     borderColor: maroonColor,
// //     '&:hover': {
// //         backgroundColor: 'rgba(128, 0, 0, 0.04)', // Light maroon background on hover
// //         borderColor: maroonColor,
// //     },
// //     '&.Mui-selected, &.MuiButton-contained': {
// //         backgroundColor: maroonColor,
// //         color: 'white',
// //         '&:hover': {
// //             backgroundColor: '#600000', // Darker maroon on hover for selected state
// //         },
// //     },
// // }));
// //
// //
// // // Simple UUID generator
// // const generateUUID = (): string => {
// //     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
// //         const r = Math.random() * 16 | 0;
// //         const v = c === 'x' ? r : (r & 0x3 | 0x8);
// //         return v.toString(16);
// //     });
// // };
// //
// // const BudgetPlanner: React.FC = () => {
// //     const [currentMonth, setCurrentMonth] = useState<string>('June 2025');
// //     const [isLoading, setIsLoading] = useState<boolean>(false);
// //     const [viewMode, setViewMode] = useState<ViewMode>('table');
// //     const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
// //     const [animateIn, setAnimateIn] = useState(false);
// //     const [bpTemplates, setBPTemplates] = useState<BPTemplate[]>([]);
// //     const [selectedTemplateType, setSelectedTemplateType] = useState<
// //         'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
// //     >('Monthly');
// //     const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
// //     const [openDialog, setOpenDialog] = useState(false);
// //     const [newTemplateName, setNewTemplateName] = useState('');
// //     const [newTemplateType, setNewTemplateType] = useState<
// //         'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly'
// //     >('Monthly');
// //     const theme = useTheme();
// //
// //     // Trigger animation after component mounts
// //     useEffect(() => {
// //         setTimeout(() => setAnimateIn(true), 100);
// //     }, []);
// //
// //     // Initial budget data
// //     const initialBudgetData: BudgetData = {
// //         week1: {
// //             Housing: { planned: 500, estimated: 480, remaining: 20 },
// //             Food: { planned: 200, estimated: 185, remaining: 15 },
// //             Transportation: { planned: 150, estimated: 145, remaining: 5 },
// //             Entertainment: { planned: 100, estimated: 120, remaining: -20 },
// //         },
// //         week2: {
// //             Housing: { planned: 500, estimated: 500, remaining: 0 },
// //             Food: { planned: 200, estimated: 195, remaining: 5 },
// //             Transportation: { planned: 150, estimated: 140, remaining: 10 },
// //             Entertainment: { planned: 100, estimated: 85, remaining: 15 },
// //         },
// //         week3: {
// //             Housing: { planned: 500, estimated: 485, remaining: 15 },
// //             Food: { planned: 200, estimated: 210, remaining: -10 },
// //             Transportation: { planned: 150, estimated: 155, remaining: -5 },
// //             Entertainment: { planned: 100, estimated: 95, remaining: 5 },
// //         },
// //         week4: {
// //             Housing: { planned: 500, estimated: 475, remaining: 25 },
// //             Food: { planned: 200, estimated: 190, remaining: 10 },
// //             Transportation: { planned: 150, estimated: 148, remaining: 2 },
// //             Entertainment: { planned: 100, estimated: 110, remaining: -10 },
// //         },
// //     };
// //
// //     const initialWeekAccountBalances = {
// //         week1: 5020,
// //         week2: 5050,
// //         week3: 5055,
// //         week4: 5082,
// //     };
// //
// //     const initialWeekDateRanges = [
// //         '06/01/25 - 06/07/25',
// //         '06/08/25 - 06/14/25',
// //         '06/15/25 - 06/21/25',
// //         '06/22/25 - 06/28/25',
// //     ];
// //
// //     // Initialize with default template
// //     useEffect(() => {
// //         const initialTotals = calculateMonthlyTotals(initialBudgetData);
// //         const defaultTemplate: BPTemplate = {
// //             id: generateUUID(),
// //             name: 'Default June 2025',
// //             type: 'Monthly',
// //             budgetData: initialBudgetData,
// //             weekAccountBalances: initialWeekAccountBalances,
// //             weekDateRanges: initialWeekDateRanges,
// //             monthlyTotals: initialTotals,
// //         };
// //         setBPTemplates([defaultTemplate]);
// //         setSelectedTemplateId(defaultTemplate.id);
// //     }, []);
// //
// //     // Helper functions for calculations
// //     const calculatePercentageSaved = (planned: number, estimated: number): number => {
// //         if (planned === 0) return 0;
// //         const savings = planned - estimated;
// //         return (savings / planned) * 100;
// //     };
// //
// //     const calculateSpentOverBudgetPercentage = (planned: number, spent: number): number => {
// //         if (planned === 0) return 0;
// //         const difference = spent - planned;
// //         return (difference / planned) * 100;
// //     };
// //
// //     const calculateActualOverPlannedPercentage = (planned: number, estimated: number): number => {
// //         if (planned === 0) return 0;
// //         return (estimated / planned) * 100;
// //     };
// //
// //     const calculateSavingsContributed = (remaining: number): number => {
// //         return Math.max(0, remaining);
// //     };
// //
// //     // Calculate monthly totals
// //     const calculateMonthlyTotals = (data: BudgetData): MonthlyTotals => {
// //         let totalPlanned = 0;
// //         let totalSpent = 0;
// //         const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
// //         const weeks = ['week1', 'week2', 'week3', 'week4'] as const;
// //
// //         weeks.forEach((weekKey) => {
// //             const weekData = data[weekKey];
// //             categories.forEach((category) => {
// //                 totalPlanned += weekData[category].planned;
// //                 totalSpent += weekData[category].estimated;
// //             });
// //         });
// //
// //         const percentageSaved = calculatePercentageSaved(totalPlanned, totalSpent);
// //         const spentOverBudgetPercentage = calculateSpentOverBudgetPercentage(totalPlanned, totalSpent);
// //         const budgetGoal = totalPlanned; // Assuming budget goal is the total planned amount
// //
// //         return {
// //             budgetGoal,
// //             totalPlanned,
// //             totalSpent,
// //             percentageSaved,
// //             spentOverBudgetPercentage,
// //         };
// //     };
// //
// //     // Get current template data
// //     const currentTemplate = bpTemplates.find((t) => t.id === selectedTemplateId) || {
// //         budgetData: initialBudgetData,
// //         weekAccountBalances: initialWeekAccountBalances,
// //         weekDateRanges: initialWeekDateRanges,
// //         monthlyTotals: calculateMonthlyTotals(initialBudgetData),
// //     };
// //
// //     const { budgetData, weekAccountBalances, weekDateRanges } = currentTemplate;
// //     const { budgetGoal, totalPlanned, totalSpent, percentageSaved, spentOverBudgetPercentage } =
// //     currentTemplate.monthlyTotals || calculateMonthlyTotals(budgetData);
// //
// //     const sidebarItems = [
// //         { text: 'Dashboard', icon: <Dashboard /> },
// //         { text: 'Budget Overview', icon: <AccountBalance /> },
// //         { text: 'Categories', icon: <Category /> },
// //         { text: 'Analytics', icon: <TrendingUp /> },
// //         { text: 'Calendar View', icon: <CalendarToday /> },
// //     ];
// //
// //     const handleMonthChange = (direction: Direction): void => {
// //         setIsLoading(true);
// //         setTimeout(() => {
// //             console.log(`Changing month ${direction}`);
// //             setIsLoading(false);
// //         }, 500);
// //     };
// //
// //     const toggleWeekCollapse = (weekIndex: number): void => {
// //         setCollapsedWeeks((prev) => {
// //             const newSet = new Set(prev);
// //             if (newSet.has(weekIndex)) {
// //                 newSet.delete(weekIndex);
// //             } else {
// //                 newSet.add(weekIndex);
// //             }
// //             return newSet;
// //         });
// //     };
// //
// //     const handleSaveTemplate = () => {
// //         if (!newTemplateName) return;
// //         const newTemplate: BPTemplate = {
// //             id: generateUUID(),
// //             name: newTemplateName,
// //             type: newTemplateType,
// //             budgetData,
// //             weekAccountBalances,
// //             weekDateRanges,
// //             monthlyTotals: calculateMonthlyTotals(budgetData),
// //         };
// //         setBPTemplates((prev) => [...prev, newTemplate]);
// //         setOpenDialog(false);
// //         setNewTemplateName('');
// //         setNewTemplateType('Monthly');
// //     };
// //
// //     const handleTemplateTypeChange = (
// //         event: React.MouseEvent<HTMLElement>,
// //         newType: 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly' | null
// //     ) => {
// //         if (newType) {
// //             setSelectedTemplateType(newType);
// //             const availableTemplates = bpTemplates.filter((t) => t.type === newType);
// //             setSelectedTemplateId(availableTemplates[0]?.id || null);
// //         }
// //     };
// //
// //     const handleTemplateSelect = (event: any) => {
// //         setSelectedTemplateId(event.target.value as string);
// //     };
// //
// //     return (
// //         <Box
// //             sx={{
// //                 maxWidth: 'calc(100% - 240px)',
// //                 ml: '240px',
// //                 minHeight: '100vh',
// //                 background: lightGray,
// //                 backgroundImage: 'radial-gradient(rgba(0, 0, 120, 0.01) 2px, transparent 2px)',
// //                 backgroundSize: '40px 40px',
// //             }}
// //         >
// //             {/* Sidebar */}
// //            <Sidebar />
// //             <Container maxWidth="lg" sx={{ py: 4 }}>
// //                 {/* Header with title and month navigation */}
// //                 <Grow in={animateIn} timeout={600}>
// //                     <Box
// //                         sx={{
// //                             display: 'flex',
// //                             justifyContent: 'space-between',
// //                             alignItems: 'center',
// //                             mb: 4,
// //                             flexDirection: { xs: 'column', sm: 'row' },
// //                             textAlign: { xs: 'center', sm: 'left' },
// //                             gap: 2,
// //                         }}
// //                     >
// //                         <Box>
// //                             <Typography
// //                                 variant="h4"
// //                                 component="h1"
// //                                 sx={{
// //                                     fontWeight: 800,
// //                                     color: theme.palette.text.primary,
// //                                     letterSpacing: '-0.025em',
// //                                 }}
// //                             >
// //                                 John Smith's Budget Planner
// //                             </Typography>
// //                             <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
// //                                 Track your weekly spending and savings progress
// //                             </Typography>
// //                         </Box>
// //                         <Box
// //                             sx={{
// //                                 display: 'flex',
// //                                 alignItems: 'center',
// //                                 gap: 1,
// //                             }}
// //                         >
// //                             <IconButton
// //                                 sx={{
// //                                     backgroundColor: 'white',
// //                                     border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
// //                                     borderRadius: '8px',
// //                                     width: '48px',
// //                                     height: '48px',
// //                                     transition: 'all 0.3s ease',
// //                                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
// //                                     '&:hover': {
// //                                         backgroundColor: primaryBlue,
// //                                         color: 'white',
// //                                         transform: 'translateY(-1px)',
// //                                         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
// //                                         borderColor: primaryBlue,
// //                                     },
// //                                 }}
// //                                 onClick={() => handleMonthChange('prev')}
// //                             >
// //                                 <ChevronLeft />
// //                             </IconButton>
// //                             <Card
// //                                 sx={{
// //                                     px: 2.5,
// //                                     py: 1,
// //                                     display: 'flex',
// //                                     alignItems: 'center',
// //                                     borderRadius: 2,
// //                                     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
// //                                 }}
// //                             >
// //                                 <CalendarToday style={{ marginRight: 8, color: theme.palette.text.secondary, fontSize: 18 }} />
// //                                 <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //                                     {currentMonth}
// //                                 </Typography>
// //                             </Card>
// //                             <IconButton
// //                                 sx={{
// //                                     backgroundColor: 'white',
// //                                     border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
// //                                     borderRadius: '8px',
// //                                     width: '48px',
// //                                     height: '48px',
// //                                     transition: 'all 0.3s ease',
// //                                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
// //                                     '&:hover': {
// //                                         backgroundColor: primaryBlue,
// //                                         color: 'white',
// //                                         transform: 'translateY(-1px)',
// //                                         boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
// //                                         borderColor: primaryBlue,
// //                                     },
// //                                 }}
// //                                 onClick={() => handleMonthChange('next')}
// //                             >
// //                                 <ChevronRight />
// //                             </IconButton>
// //                         </Box>
// //                     </Box>
// //                 </Grow>
// //
// //                 {/* Template Controls */}
// //                 <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
// //                     <StyledButtonGroup
// //                         value={selectedTemplateType}
// //                         exclusive
// //                         onChange={handleTemplateTypeChange}
// //                         sx={{ backgroundColor: 'white', borderRadius: '8px' }}
// //                     >
// //                         <StyledButton
// //                             value="Monthly"
// //                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
// //                         >
// //                             Monthly
// //                         </StyledButton>
// //                         <StyledButton
// //                             value="Biweekly"
// //                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
// //                         >
// //                             Biweekly
// //                         </StyledButton>
// //                         <StyledButton
// //                             value="2-Monthly"
// //                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
// //                         >
// //                             2-Monthly
// //                         </StyledButton>
// //                         <StyledButton
// //                             value="3-Monthly"
// //                             sx={{ color: maroonColor, '&.Mui-selected': { backgroundColor: primaryBlue, color: 'white' } }}
// //                         >
// //                             3-Monthly
// //                         </StyledButton>
// //                     </StyledButtonGroup>
// //                     <FormControl sx={{ minWidth: 200 }}>
// //                         <InputLabel sx={{ color: maroonColor }}>Select Template</InputLabel>
// //                         <Select
// //                             value={selectedTemplateId || ''}
// //                             label="Select Template"
// //                             onChange={handleTemplateSelect}
// //                             sx={{ backgroundColor: 'white', borderRadius: '8px' }}
// //                         >
// //                             {bpTemplates
// //                                 .filter((t) => t.type === selectedTemplateType)
// //                                 .map((t) => (
// //                                     <MenuItem key={t.id} value={t.id}>
// //                                         {t.name}
// //                                     </MenuItem>
// //                                 ))}
// //                         </Select>
// //                     </FormControl>
// //                     <Button
// //                         variant="contained"
// //                         sx={{
// //                             backgroundColor: primaryBlue,
// //                             color: 'white',
// //                             borderRadius: '8px',
// //                             '&:hover': { backgroundColor: '#1565c0' },
// //                         }}
// //                         onClick={() => setOpenDialog(true)}
// //                     >
// //                         Save as Template
// //                     </Button>
// //                 </Box>
// //
// //                 {/* Save Template Dialog */}
// //                 <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
// //                     <DialogTitle sx={{ color: maroonColor }}>Save Budget Plan Template</DialogTitle>
// //                     <DialogContent>
// //                         <TextField
// //                             label="Template Name"
// //                             value={newTemplateName}
// //                             onChange={(e) => setNewTemplateName(e.target.value)}
// //                             fullWidth
// //                             margin="normal"
// //                             sx={{ backgroundColor: 'white' }}
// //                         />
// //                         <FormControl sx={{ minWidth: '100%' }} variant="outlined" margin="normal">
// //                             <InputLabel sx={{ color: maroonColor }}>Template Type</InputLabel>
// //                             <Select
// //                                 value={newTemplateType}
// //                                 onChange={(e) =>
// //                                     setNewTemplateType(e.target.value as 'Monthly' | 'Biweekly' | '2-Monthly' | '3-Monthly')
// //                                 }
// //                                 label="Template Type"
// //                                 sx={{ backgroundColor: 'white' }}
// //                             >
// //                                 <MenuItem value="Monthly">Monthly</MenuItem>
// //                                 <MenuItem value="Biweekly">Biweekly</MenuItem>
// //                                 <MenuItem value="2-Monthly">2-Monthly</MenuItem>
// //                                 <MenuItem value="3-Monthly">3-Monthly</MenuItem>
// //                             </Select>
// //                         </FormControl>
// //                     </DialogContent>
// //                     <DialogActions>
// //                         <Button onClick={() => setOpenDialog(false)} sx={{ color: maroonColor }}>
// //                             Cancel
// //                         </Button>
// //                         <Button
// //                             onClick={handleSaveTemplate}
// //                             variant="contained"
// //                             sx={{ backgroundColor: primaryBlue, color: 'white' }}
// //                             disabled={!newTemplateName}
// //                         >
// //                             Save
// //                         </Button>
// //                     </DialogActions>
// //                 </Dialog>
// //
// //                 <Grid container spacing={4}>
// //                     <Grid item xs={12}>
// //                         <Grow in={animateIn} timeout={800}>
// //                             <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
// //                                 <Typography
// //                                     variant="h5"
// //                                     component="h2"
// //                                     sx={{
// //                                         fontWeight: 'bold',
// //                                         mb: 2,
// //                                         textAlign: 'left',
// //                                         color: 'text.primary',
// //                                     }}
// //                                 >
// //                                     Monthly Breakdown by Week & Category
// //                                 </Typography>
// //                                 <StyledTableContainer>
// //                                     <Table sx={{ minWidth: 650 }}>
// //                                         <TableHead>
// //                                             <StyledTableHeadRow>
// //                                                 <TableCell
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                         width: '200px',
// //                                                     }}
// //                                                 >
// //                                                     Week Period
// //                                                 </TableCell>
// //                                                 <TableCell
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                     }}
// //                                                 >
// //                                                     Category
// //                                                 </TableCell>
// //                                                 <TableCell
// //                                                     align="right"
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                     }}
// //                                                 >
// //                                                     Planned
// //                                                 </TableCell>
// //                                                 <TableCell
// //                                                     align="right"
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                     }}
// //                                                 >
// //                                                     Actual
// //                                                 </TableCell>
// //                                                 <TableCell
// //                                                     align="right"
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                     }}
// //                                                 >
// //                                                     Spending %
// //                                                 </TableCell>
// //                                                 <TableCell
// //                                                     align="right"
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                     }}
// //                                                 >
// //                                                     Savings %
// //                                                 </TableCell>
// //                                                 <TableCell
// //                                                     align="right"
// //                                                     sx={{
// //                                                         fontWeight: 'bold',
// //                                                         color: maroonColor,
// //                                                         fontSize: '0.95rem',
// //                                                         padding: '20px 16px',
// //                                                     }}
// //                                                 >
// //                                                     Savings Contribution
// //                                                 </TableCell>
// //                                             </StyledTableHeadRow>
// //                                         </TableHead>
// //                                         <TableBody>
// //                                             {isLoading ? (
// //                                                 <StyledTableRow>
// //                                                     <TableCell colSpan={7}>
// //                                                         <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
// //                                                     </TableCell>
// //                                                 </StyledTableRow>
// //                                             ) : (
// //                                                 ((): JSX.Element[] => {
// //                                                     const categories: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
// //                                                     const rows: JSX.Element[] = [];
// //
// //                                                     weekDateRanges.forEach((weekRange, weekIndex) => {
// //                                                         const weekKey = `week${weekIndex + 1}` as keyof BudgetData;
// //                                                         const weekData = budgetData[weekKey];
// //                                                         const isCollapsed = collapsedWeeks.has(weekIndex);
// //                                                         const accountBalance = weekAccountBalances[weekKey];
// //
// //                                                         // Calculate week totals
// //                                                         const weekTotalPlanned = categories.reduce(
// //                                                             (sum, category) => sum + weekData[category].planned,
// //                                                             0
// //                                                         );
// //                                                         const weekTotalEstimated = categories.reduce(
// //                                                             (sum, category) => sum + weekData[category].estimated,
// //                                                             0
// //                                                         );
// //                                                         const weekTotalSavingsContributed = categories.reduce(
// //                                                             (sum, category) => sum + calculateSavingsContributed(weekData[category].remaining),
// //                                                             0
// //                                                         );
// //                                                         const weekPercentageSaved = calculatePercentageSaved(
// //                                                             weekTotalPlanned,
// //                                                             weekTotalEstimated
// //                                                         );
// //                                                         const weekActualOverPlanned = calculateActualOverPlannedPercentage(
// //                                                             weekTotalPlanned,
// //                                                             weekTotalEstimated
// //                                                         );
// //
// //                                                         // Week header row with collapse/expand functionality
// //                                                         rows.push(
// //                                                             <StyledTableRow
// //                                                                 key={`${weekRange}-header`}
// //                                                                 onClick={() => toggleWeekCollapse(weekIndex)}
// //                                                             >
// //                                                                 <TableCell
// //                                                                     sx={{
// //                                                                         fontWeight: 'bold',
// //                                                                         color: maroonColor,
// //                                                                         fontSize: '0.95rem',
// //                                                                         display: 'flex',
// //                                                                         alignItems: 'center',
// //                                                                         gap: 1.5,
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     <Box
// //                                                                         sx={{
// //                                                                             display: 'flex',
// //                                                                             alignItems: 'center',
// //                                                                             p: 0.5,
// //                                                                             borderRadius: '50%',
// //                                                                             backgroundColor: primaryBlue,
// //                                                                             color: 'white',
// //                                                                         }}
// //                                                                     >
// //                                                                         {isCollapsed ? (
// //                                                                             <ExpandMore sx={{ fontSize: '1.2rem' }} />
// //                                                                         ) : (
// //                                                                             <ExpandLess sx={{ fontSize: '1.2rem' }} />
// //                                                                         )}
// //                                                                     </Box>
// //                                                                     {weekRange}
// //                                                                 </TableCell>
// //                                                                 <TableCell
// //                                                                     sx={{
// //                                                                         fontWeight: 500,
// //                                                                         color: 'text.secondary',
// //                                                                         fontSize: '0.875rem',
// //                                                                         fontStyle: 'italic',
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     {isCollapsed ? 'Click to expand' : 'Click to collapse'}
// //                                                                 </TableCell>
// //                                                                 <TableCell
// //                                                                     align="right"
// //                                                                     sx={{
// //                                                                         fontWeight: 'bold',
// //                                                                         fontSize: '0.95rem',
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     ${weekTotalPlanned.toLocaleString('en-US', {
// //                                                                     minimumFractionDigits: 2,
// //                                                                     maximumFractionDigits: 2,
// //                                                                 })}
// //                                                                 </TableCell>
// //                                                                 <TableCell
// //                                                                     align="right"
// //                                                                     sx={{
// //                                                                         fontWeight: 'bold',
// //                                                                         fontSize: '0.95rem',
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     ${weekTotalEstimated.toLocaleString('en-US', {
// //                                                                     minimumFractionDigits: 2,
// //                                                                     maximumFractionDigits: 2,
// //                                                                 })}
// //                                                                 </TableCell>
// //                                                                 <TableCell
// //                                                                     align="right"
// //                                                                     sx={{
// //                                                                         fontWeight: 'bold',
// //                                                                         fontSize: '0.95rem',
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     {weekActualOverPlanned.toFixed(1)}%
// //                                                                 </TableCell>
// //                                                                 <TableCell
// //                                                                     align="right"
// //                                                                     sx={{
// //                                                                         color: weekPercentageSaved >= 0 ? 'green' : 'red',
// //                                                                         fontWeight: 'bold',
// //                                                                         fontSize: '0.95rem',
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     {weekPercentageSaved >= 0 ? '+' : ''}{weekPercentageSaved.toFixed(1)}%
// //                                                                 </TableCell>
// //                                                                 <TableCell
// //                                                                     align="right"
// //                                                                     sx={{
// //                                                                         color: weekTotalSavingsContributed >= 0 ? 'green' : 'red',
// //                                                                         fontWeight: 'bold',
// //                                                                         fontSize: '0.95rem',
// //                                                                         padding: '20px 16px',
// //                                                                     }}
// //                                                                 >
// //                                                                     ${Math.abs(weekTotalSavingsContributed).toLocaleString('en-US', {
// //                                                                     minimumFractionDigits: 2,
// //                                                                     maximumFractionDigits: 2,
// //                                                                 })}
// //                                                                     {weekTotalSavingsContributed >= 0 ? ' under' : ' over'}
// //                                                                 </TableCell>
// //                                                             </StyledTableRow>
// //                                                         );
// //
// //                                                         // Category rows (only show if not collapsed)
// //                                                         if (!isCollapsed) {
// //                                                             categories.forEach((category) => {
// //                                                                 const data = weekData[category];
// //                                                                 const percentageSaved = calculatePercentageSaved(data.planned, data.estimated);
// //                                                                 const savingsContributed = calculateSavingsContributed(data.remaining);
// //                                                                 const actualOverPlanned = calculateActualOverPlannedPercentage(
// //                                                                     data.planned,
// //                                                                     data.estimated
// //                                                                 );
// //
// //                                                                 rows.push(
// //                                                                     <StyledTableRow key={`${weekRange}-${category}`}>
// //                                                                         <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
// //                                                                         <TableCell
// //                                                                             component="th"
// //                                                                             scope="row"
// //                                                                             sx={{
// //                                                                                 fontWeight: 500,
// //                                                                                 fontSize: '0.95rem',
// //                                                                                 padding: '20px 16px',
// //                                                                             }}
// //                                                                         >
// //                                                                             {category}
// //                                                                         </TableCell>
// //                                                                         <TableCell
// //                                                                             align="right"
// //                                                                             sx={{
// //                                                                                 fontSize: '0.95rem',
// //                                                                                 padding: '20px 16px',
// //                                                                             }}
// //                                                                         >
// //                                                                             ${data.planned.toLocaleString('en-US', {
// //                                                                             minimumFractionDigits: 2,
// //                                                                             maximumFractionDigits: 2,
// //                                                                         })}
// //                                                                         </TableCell>
// //                                                                         <TableCell
// //                                                                             align="right"
// //                                                                             sx={{
// //                                                                                 fontSize: '0.95rem',
// //                                                                                 padding: '20px 16px',
// //                                                                             }}
// //                                                                         >
// //                                                                             ${data.estimated.toLocaleString('en-US', {
// //                                                                             minimumFractionDigits: 2,
// //                                                                             maximumFractionDigits: 2,
// //                                                                         })}
// //                                                                         </TableCell>
// //                                                                         <TableCell
// //                                                                             align="right"
// //                                                                             sx={{
// //                                                                                 fontSize: '0.95rem',
// //                                                                                 padding: '20px 16px',
// //                                                                             }}
// //                                                                         >
// //                                                                             {actualOverPlanned.toFixed(1)}%
// //                                                                         </TableCell>
// //                                                                         <TableCell
// //                                                                             align="right"
// //                                                                             sx={{
// //                                                                                 color: percentageSaved >= 0 ? 'green' : 'red',
// //                                                                                 fontWeight: 'bold',
// //                                                                                 fontSize: '0.95rem',
// //                                                                                 padding: '20px 16px',
// //                                                                             }}
// //                                                                         >
// //                                                                             {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
// //                                                                         </TableCell>
// //                                                                         <TableCell
// //                                                                             align="right"
// //                                                                             sx={{
// //                                                                                 color: savingsContributed >= 0 ? 'green' : 'red',
// //                                                                                 fontWeight: 'bold',
// //                                                                                 fontSize: '0.95rem',
// //                                                                                 padding: '20px 16px',
// //                                                                             }}
// //                                                                         >
// //                                                                             ${Math.abs(savingsContributed).toLocaleString('en-US', {
// //                                                                             minimumFractionDigits: 2,
// //                                                                             maximumFractionDigits: 2,
// //                                                                         })}
// //                                                                             {savingsContributed >= 0 ? ' under' : ' over'}
// //                                                                         </TableCell>
// //                                                                     </StyledTableRow>
// //                                                                 );
// //                                                             });
// //
// //                                                             // Account balance row
// //                                                             rows.push(
// //                                                                 <StyledTableRow key={`${weekRange}-balance`}>
// //                                                                     <TableCell sx={{ pl: 6, padding: '20px 16px' }} />
// //                                                                     <TableCell
// //                                                                         sx={{
// //                                                                             fontWeight: 'bold',
// //                                                                             color: maroonColor,
// //                                                                             fontSize: '0.95rem',
// //                                                                             display: 'flex',
// //                                                                             alignItems: 'center',
// //                                                                             gap: 1,
// //                                                                             padding: '20px 16px',
// //                                                                         }}
// //                                                                     >
// //                                                                         <AccountBalance sx={{ fontSize: '1.1rem' }} />
// //                                                                         Account Balance
// //                                                                     </TableCell>
// //                                                                     <TableCell
// //                                                                         colSpan={5}
// //                                                                         align="right"
// //                                                                         sx={{
// //                                                                             fontWeight: 'bold',
// //                                                                             fontSize: '0.95rem',
// //                                                                             padding: '20px 16px',
// //                                                                         }}
// //                                                                     >
// //                                                                         ${accountBalance.toLocaleString('en-US', {
// //                                                                         minimumFractionDigits: 2,
// //                                                                         maximumFractionDigits: 2,
// //                                                                     })}
// //                                                                     </TableCell>
// //                                                                 </StyledTableRow>
// //                                                             );
// //                                                         }
// //                                                     });
// //
// //                                                     return rows;
// //                                                 })()
// //                                             )}
// //                                         </TableBody>
// //                                     </Table>
// //                                 </StyledTableContainer>
// //
// //                                 {/* Monthly Totals Section */}
// //                                 <Box sx={{ mt: 4 }}>
// //                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
// //                                         <Typography
// //                                             variant="h5"
// //                                             component="h2"
// //                                             sx={{
// //                                                 fontWeight: 'bold',
// //                                                 textAlign: 'left',
// //                                                 color: 'text.primary',
// //                                             }}
// //                                         >
// //                                             Monthly Totals
// //                                         </Typography>
// //                                         <Button
// //                                             variant="contained"
// //                                             sx={{
// //                                                 backgroundColor: primaryBlue,
// //                                                 color: 'white',
// //                                                 borderRadius: '8px',
// //                                                 '&:hover': { backgroundColor: '#1565c0' },
// //                                             }}
// //                                             onClick={() => setOpenDialog(true)}
// //                                         >
// //                                             Save as Template
// //                                         </Button>
// //                                     </Box>
// //                                     <StyledTableContainer>
// //                                         <Table sx={{ minWidth: 650 }}>
// //                                             <TableHead>
// //                                                 <StyledTableHeadRow>
// //                                                     <TableCell
// //                                                         sx={{
// //                                                             fontWeight: 'bold',
// //                                                             color: maroonColor,
// //                                                             fontSize: '0.95rem',
// //                                                             padding: '20px 16px',
// //                                                         }}
// //                                                     >
// //                                                         Budget Goal
// //                                                     </TableCell>
// //                                                     <TableCell
// //                                                         sx={{
// //                                                             fontWeight: 'bold',
// //                                                             color: maroonColor,
// //                                                             fontSize: '0.95rem',
// //                                                             padding: '20px 16px',
// //                                                         }}
// //                                                     >
// //                                                         Total Planned
// //                                                     </TableCell>
// //                                                     <TableCell
// //                                                         sx={{
// //                                                             fontWeight: 'bold',
// //                                                             color: maroonColor,
// //                                                             fontSize: '0.95rem',
// //                                                             padding: '20px 16px',
// //                                                         }}
// //                                                     >
// //                                                         Total Spent
// //                                                     </TableCell>
// //                                                     <TableCell
// //                                                         sx={{
// //                                                             fontWeight: 'bold',
// //                                                             color: maroonColor,
// //                                                             fontSize: '0.95rem',
// //                                                             padding: '20px 16px',
// //                                                         }}
// //                                                     >
// //                                                         Savings %
// //                                                     </TableCell>
// //                                                     <TableCell
// //                                                         sx={{
// //                                                             fontWeight: 'bold',
// //                                                             color: maroonColor,
// //                                                             fontSize: '0.95rem',
// //                                                             padding: '20px 16px',
// //                                                         }}
// //                                                     >
// //                                                         Spent Over Budget %
// //                                                     </TableCell>
// //                                                 </StyledTableHeadRow>
// //                                             </TableHead>
// //                                             <TableBody>
// //                                                 {isLoading ? (
// //                                                     <StyledTableRow>
// //                                                         <TableCell colSpan={5}>
// //                                                             <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
// //                                                         </TableCell>
// //                                                     </StyledTableRow>
// //                                                 ) : (
// //                                                     <StyledTableRow>
// //                                                         <TableCell
// //                                                             sx={{
// //                                                                 fontWeight: 500,
// //                                                                 fontSize: '0.95rem',
// //                                                                 padding: '20px 16px',
// //                                                             }}
// //                                                         >
// //                                                             ${budgetGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
// //                                                         </TableCell>
// //                                                         <TableCell
// //                                                             sx={{
// //                                                                 fontWeight: 500,
// //                                                                 fontSize: '0.95rem',
// //                                                                 padding: '20px 16px',
// //                                                             }}
// //                                                         >
// //                                                             ${totalPlanned.toLocaleString('en-US', {
// //                                                             minimumFractionDigits: 2,
// //                                                             maximumFractionDigits: 2,
// //                                                         })}
// //                                                         </TableCell>
// //                                                         <TableCell
// //                                                             sx={{
// //                                                                 fontWeight: 500,
// //                                                                 fontSize: '0.95rem',
// //                                                                 padding: '20px 16px',
// //                                                             }}
// //                                                         >
// //                                                             ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
// //                                                         </TableCell>
// //                                                         <TableCell
// //                                                             sx={{
// //                                                                 color: percentageSaved >= 0 ? 'green' : 'red',
// //                                                                 fontWeight: 'bold',
// //                                                                 fontSize: '0.95rem',
// //                                                                 padding: '20px 16px',
// //                                                             }}
// //                                                         >
// //                                                             {percentageSaved >= 0 ? '+' : ''}{percentageSaved.toFixed(1)}%
// //                                                         </TableCell>
// //                                                         <TableCell
// //                                                             sx={{
// //                                                                 color: spentOverBudgetPercentage > 0 ? 'red' : 'green',
// //                                                                 fontWeight: 'bold',
// //                                                                 fontSize: '0.95rem',
// //                                                                 padding: '20px 16px',
// //                                                             }}
// //                                                         >
// //                                                             {spentOverBudgetPercentage > 0 ? '+' : ''}{spentOverBudgetPercentage.toFixed(1)}%
// //                                                         </TableCell>
// //                                                     </StyledTableRow>
// //                                                 )}
// //                                             </TableBody>
// //                                         </Table>
// //                                     </StyledTableContainer>
// //                                 </Box>
// //                             </Card>
// //                         </Grow>
// //                     </Grid>
// //                 </Grid>
// //             </Container>
// //         </Box>
// //     );
// // };
// //
// // export default BudgetPlanner;
