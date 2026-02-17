import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Stack,
    alpha,
    useTheme,
    Card,
    LinearProgress,
    Chip,
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    IconButton,
    Button,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend,
    Tooltip as RechartsTooltip, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, ReferenceLine, Area, AreaChart, ComposedChart
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PieChartIcon from '@mui/icons-material/PieChart';
import RepeatIcon from '@mui/icons-material/Repeat';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import SavingsIcon from '@mui/icons-material/Savings';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { BudgetStats } from '../utils/Items';

const maroonColor = '#800000';
const tealColor = '#0d9488';

interface CategoryData {
    categoryName: string;
    budgetedAmount: number;
    actualAmount: number;
    remainingAmount: number;
    isRecurring?: boolean;
    isCustom?: boolean;
}

interface OverviewCategory {
    category: string;
    budgetedExpenses: number;
    actualExpenses: number;
    remainingExpenses: number;
}

// NEW: Historical month data for a single category
export interface CategoryMonthHistory {
    month: string;        // e.g. "Jan 2025"
    year: number;
    monthIndex: number;   // 0-11
    budgeted: number;
    actual: number;
    saved: number;        // budgeted - actual (positive = saved, negative = overspent)
}

// NEW: Map of categoryName -> array of monthly history
export type CategoryHistoricalData = Record<string, CategoryMonthHistory[]>;

interface DynamicBudgetPanelProps {
    isLoading: boolean;
    topSpendingCategories: CategoryData[];
    overviewCategories: OverviewCategory[];
    recurringCategories: CategoryData[];
    budgetStats: BudgetStats;
    allCategories: CategoryData[];
    onUpdateBudgetAmount?: (categoryName: string, newAmount: number) => Promise<void>;
    onOptimizeBudget?: (categoryName: string) => Promise<number>;
    // NEW prop
    categoryHistoricalData?: CategoryHistoricalData;
}

type ViewType = 'stats' | 'recurring' | 'category' | 'goals';
type CategoryDetailTab = 'overview' | 'history' | 'prediction';

const CHART_COLORS = [tealColor, maroonColor, '#f59e0b', '#8b5cf6', '#ec4899'];

// ─── Linear regression helper ────────────────────────────────────────────────
// Returns { slope, intercept, r2 } fitted to (x, y) pairs
function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } {
    const n = xs.length;
    if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0, ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - meanX) * (ys[i] - meanY);
        den += (xs[i] - meanX) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    for (let i = 0; i < n; i++) {
        const predicted = slope * xs[i] + intercept;
        ssRes += (ys[i] - predicted) ** 2;
        ssTot += (ys[i] - meanY) ** 2;
    }
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
    return { slope, intercept, r2 };
}

// Build next N month labels beyond the last known month
function nextMonthLabels(lastYear: number, lastMonthIndex: number, count: number): string[] {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels: string[] = [];
    let y = lastYear, m = lastMonthIndex;
    for (let i = 0; i < count; i++) {
        m++;
        if (m > 11) { m = 0; y++; }
        labels.push(`${names[m]} ${y}`);
    }
    return labels;
}

const DynamicBudgetPanel: React.FC<DynamicBudgetPanelProps> = ({
                                                                   isLoading,
                                                                   topSpendingCategories,
                                                                   overviewCategories,
                                                                   recurringCategories,
                                                                   budgetStats,
                                                                   allCategories,
                                                                   onUpdateBudgetAmount,
                                                                   onOptimizeBudget,
                                                                   categoryHistoricalData = {},
                                                               }) => {
    const theme = useTheme();
    const [selectedView, setSelectedView] = useState<ViewType>('stats');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoryDetailTab, setCategoryDetailTab] = useState<CategoryDetailTab>('overview');
    const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [editedBudgetAmount, setEditedBudgetAmount] = useState<string>('');
    const [isSavingBudget, setIsSavingBudget] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [predictionMonths, setPredictionMonths] = useState<3 | 6>(3);

    const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
        if (newView !== null) {
            setSelectedView(newView);
            setSelectedCategory(null);
        }
    };

    const today = new Date();
    const monthStart = budgetStats.dateRange.startDate;
    const monthEnd = budgetStats.dateRange.endDate;
    const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.min(Math.ceil((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)), daysInMonth);
    const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);
    const dailyBudget = budgetStats.totalBudget / daysInMonth;
    const actualDailySpending = budgetStats.totalSpent / (daysElapsed || 1);
    const monthlyGoal = budgetStats.totalSaved;
    const currentSavings = budgetStats.totalSaved;
    const goalProgress = (currentSavings / (monthlyGoal || 1)) * 100;
    const projectedSavings = (currentSavings / (daysElapsed || 1)) * daysInMonth;
    const onTrack = projectedSavings >= monthlyGoal;

    const getProgressColor = (percent: number) => {
        if (percent < 70) return tealColor;
        if (percent < 90) return '#f59e0b';
        return '#dc2626';
    };

    const formatCurrency = (amount: number) => `$${Math.abs(amount).toFixed(2)}`;

    const pieChartData = [
        { name: 'Spent',     value: budgetStats.totalSpent,  color: '#dc2626' },
        { name: 'Saved',     value: budgetStats.totalSaved,  color: '#f59e0b' },
        { name: 'Remaining', value: budgetStats.remaining,   color: '#10b981' },
    ];

    // ─── Savings prediction for a category ───────────────────────────────────
    const buildPrediction = (history: CategoryMonthHistory[], months: number) => {
        if (history.length < 2) return null;

        const sorted = [...history].sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex);
        const xs = sorted.map((_, i) => i);
        const actualYs = sorted.map(h => h.actual);
        const savedYs  = sorted.map(h => h.saved);

        const actualReg = linearRegression(xs, actualYs);
        const savedReg  = linearRegression(xs, savedYs);

        const lastEntry = sorted[sorted.length - 1];
        const futureLabels = nextMonthLabels(lastEntry.year, lastEntry.monthIndex, months);

        const futurePoints = futureLabels.map((label, i) => {
            const x = sorted.length + i;
            return {
                month: label,
                predictedActual: Math.max(0, actualReg.slope * x + actualReg.intercept),
                predictedSaved:  savedReg.slope * x + savedReg.intercept,
                isPrediction: true,
            };
        });

        // Historical points formatted for chart
        const historicalPoints = sorted.map((h, i) => ({
            month: h.month,
            actual: h.actual,
            saved: h.saved,
            budgeted: h.budgeted,
            isPrediction: false,
        }));

        // Trend description
        const savingsTrend = savedReg.slope;
        const avgSaved     = savedYs.reduce((a, b) => a + b, 0) / savedYs.length;
        const predictedAvgSaved = futurePoints.reduce((a, b) => a + b.predictedSaved, 0) / futurePoints.length;
        const confidence = Math.min(100, Math.max(0, Math.round(savedReg.r2 * 100)));

        return {
            historicalPoints,
            futurePoints,
            savingsTrend,
            avgSaved,
            predictedAvgSaved,
            confidence,
            r2: savedReg.r2,
            slopeActual: actualReg.slope,
        };
    };

    // ─── Render helpers ───────────────────────────────────────────────────────

    const renderStatsView = () => (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Overall Progress
            </Typography>
            <Card sx={{
                p: 2.5, mb: 3,
                background: `linear-gradient(135deg, ${alpha(maroonColor, 0.1)} 0%, ${alpha(maroonColor, 0.05)} 100%)`,
                border: `1px solid ${alpha(maroonColor, 0.2)}`
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Total Spending</Typography>
                    <Typography variant="h5" fontWeight={700} color={maroonColor}>
                        {((budgetStats.totalSpent / budgetStats.totalBudget) * 100).toFixed(0)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={Math.min((budgetStats.totalSpent / budgetStats.totalBudget) * 100, 100)}
                    sx={{
                        height: 10, borderRadius: 5, backgroundColor: `${maroonColor}20`,
                        '& .MuiLinearProgress-bar': { backgroundColor: maroonColor, borderRadius: 5 }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">${budgetStats.totalSpent.toFixed(2)} spent</Typography>
                    <Typography variant="caption" color="text.secondary">${budgetStats.totalBudget.toFixed(2)} total</Typography>
                </Box>
            </Card>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Budget Distribution
            </Typography>
            <Box sx={{ height: 250, mb: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                            {pieChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Budget Stats
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[
                    { label: 'Total Budget', value: budgetStats.totalBudget, color: '#2563eb' },
                    { label: 'Total Spent',  value: budgetStats.totalSpent,  color: '#dc2626' },
                    { label: 'Total Saved',  value: budgetStats.totalSaved,  color: '#059669' },
                    { label: 'Remaining',    value: budgetStats.remaining,   color: tealColor  },
                ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ p: 2, backgroundColor: alpha(color, 0.05), borderRadius: 2, border: `1px solid ${alpha(color, 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
                        <Typography variant="h6" fontWeight={600} color={color}>${value.toFixed(2)}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    const renderRecurringView = () => (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Recurring Categories ({recurringCategories.length})
            </Typography>
            <Stack spacing={2}>
                {recurringCategories.length > 0 ? recurringCategories.map((category, index) => {
                    const percentage = category.budgetedAmount > 0 ? (category.actualAmount / category.budgetedAmount) * 100 : 0;
                    const progressColor = getProgressColor(percentage);
                    return (
                        <Card key={index} sx={{
                            p: 2,
                            background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
                            border: `1px solid ${alpha(progressColor, 0.2)}`
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>{category.categoryName}</Typography>
                                    <Chip label="Recurring" size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', bgcolor: alpha(maroonColor, 0.1), color: maroonColor }} />
                                </Box>
                                <Typography variant="h6" fontWeight={700} color={progressColor}>${category.actualAmount.toFixed(2)}</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={Math.min(percentage, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: `${progressColor}20`, '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 } }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">Budgeted: ${category.budgetedAmount.toFixed(2)}</Typography>
                                <Typography variant="caption" fontWeight={600} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
                                    {formatCurrency(Math.abs(category.remainingAmount))}
                                </Typography>
                            </Box>
                        </Card>
                    );
                }) : (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 2 }}>
                        <RepeatIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography variant="body2">No recurring categories found</Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );

    // ── Category detail: History tab ────────────────────────────────────────
    const renderHistoryTab = (category: CategoryData) => {
        const history = categoryHistoricalData[category.categoryName];

        if (!history || history.length === 0) {
            return (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <HistoryIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.35 }} />
                    <Typography variant="body2" fontWeight={500}>No historical data available</Typography>
                    <Typography variant="caption">Historical data will appear here once it's been provided via the <code>categoryHistoricalData</code> prop.</Typography>
                </Box>
            );
        }

        const sorted = [...history].sort((a, b) => a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex);
        const avgActual  = sorted.reduce((s, h) => s + h.actual, 0) / sorted.length;
        const avgBudgeted = sorted.reduce((s, h) => s + h.budgeted, 0) / sorted.length;
        const avgSaved   = sorted.reduce((s, h) => s + h.saved, 0) / sorted.length;
        const bestMonth  = sorted.reduce((best, h) => h.saved > best.saved ? h : best, sorted[0]);
        const worstMonth = sorted.reduce((worst, h) => h.saved < worst.saved ? h : worst, sorted[0]);

        return (
            <Box>
                {/* Summary chips */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    <Chip
                        icon={<ShowChartIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={`Avg spend: $${avgActual.toFixed(0)}/mo`}
                        size="small"
                        sx={{ bgcolor: alpha('#dc2626', 0.08), color: '#dc2626', fontWeight: 600 }}
                    />
                    <Chip
                        icon={<SavingsIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={`Avg saved: ${avgSaved >= 0 ? '+' : ''}$${avgSaved.toFixed(0)}/mo`}
                        size="small"
                        sx={{ bgcolor: alpha(avgSaved >= 0 ? '#059669' : '#dc2626', 0.08), color: avgSaved >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}
                    />
                </Box>

                {/* Stacked bar chart: budgeted vs actual */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    Monthly Budgeted vs Actual
                </Typography>
                <Box sx={{ height: 220, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sorted} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} />
                            <YAxis tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} tickFormatter={v => `$${v}`} />
                            <RechartsTooltip
                                formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'actual' ? 'Spent' : 'Budgeted']}
                                contentStyle={{ backgroundColor: alpha(theme.palette.background.paper, 0.97), border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 8 }}
                            />
                            <Legend formatter={(v: string) => v === 'actual' ? 'Spent' : 'Budgeted'} />
                            <Bar dataKey="budgeted" fill={alpha(tealColor, 0.35)} name="budgeted" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="actual"   fill={maroonColor}             name="actual"   radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>

                {/* Saved / overspent line chart */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    Monthly Savings (+ saved / − overspent)
                </Typography>
                <Box sx={{ height: 180, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sorted}>
                            <defs>
                                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#059669" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0}    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} />
                            <YAxis tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} tickFormatter={v => `$${v}`} />
                            <RechartsTooltip
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Saved']}
                                contentStyle={{ backgroundColor: alpha(theme.palette.background.paper, 0.97), border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 8 }}
                            />
                            <ReferenceLine y={0} stroke={alpha('#dc2626', 0.5)} strokeDasharray="4 4" />
                            <Area type="monotone" dataKey="saved" stroke="#059669" strokeWidth={2} fill="url(#savingsGrad)" dot={{ fill: '#059669', r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>

                {/* Best / worst month callouts */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box sx={{ p: 2, bgcolor: alpha('#059669', 0.06), borderRadius: 2, border: `1px solid ${alpha('#059669', 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Best Month</Typography>
                        <Typography variant="body2" fontWeight={700} color="#059669">{bestMonth.month}</Typography>
                        <Typography variant="caption" color="#059669">+${bestMonth.saved.toFixed(2)} saved</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: alpha('#dc2626', 0.06), borderRadius: 2, border: `1px solid ${alpha('#dc2626', 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Worst Month</Typography>
                        <Typography variant="body2" fontWeight={700} color="#dc2626">{worstMonth.month}</Typography>
                        <Typography variant="caption" color="#dc2626">{worstMonth.saved >= 0 ? '+' : ''}${worstMonth.saved.toFixed(2)} saved</Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    // ── Category detail: Prediction tab ────────────────────────────────────
    const renderPredictionTab = (category: CategoryData) => {
        const history = categoryHistoricalData[category.categoryName];

        if (!history || history.length < 2) {
            return (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <InsightsIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.35 }} />
                    <Typography variant="body2" fontWeight={500}>Not enough data to predict</Typography>
                    <Typography variant="caption">At least 2 months of history are needed to generate a savings prediction.</Typography>
                </Box>
            );
        }

        const prediction = buildPrediction(history, predictionMonths);
        if (!prediction) return null;

        const {
            historicalPoints, futurePoints,
            savingsTrend, avgSaved, predictedAvgSaved,
            confidence, slopeActual,
        } = prediction;

        // Combined chart data: history then future
        const chartData = [
            ...historicalPoints.map(p => ({
                month: p.month,
                actual: p.actual,
                saved: p.saved,
                budgeted: p.budgeted,
            })),
            ...futurePoints.map(p => ({
                month: p.month,
                predictedActual: p.predictedActual,
                predictedSaved: p.predictedSaved,
            })),
        ];

        // Projected total savings over the prediction window
        const projectedWindowSavings = futurePoints.reduce((s, p) => s + p.predictedSaved, 0);
        const trendLabel = savingsTrend > 1 ? 'Improving' : savingsTrend < -1 ? 'Declining' : 'Stable';
        const trendColor = savingsTrend > 1 ? '#059669' : savingsTrend < -1 ? '#dc2626' : '#f59e0b';
        const spendTrendLabel = slopeActual > 1 ? 'Increasing' : slopeActual < -1 ? 'Decreasing' : 'Stable';
        const spendTrendColor = slopeActual > 1 ? '#dc2626' : slopeActual < -1 ? '#059669' : '#f59e0b';

        return (
            <Box>
                {/* Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                        Savings Forecast
                    </Typography>
                    <ToggleButtonGroup
                        value={predictionMonths}
                        exclusive
                        onChange={(_, v) => v && setPredictionMonths(v)}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                py: 0.4, px: 1.2, fontSize: '0.68rem', fontWeight: 600, textTransform: 'none',
                                border: `1px solid ${alpha(maroonColor, 0.3)}`, color: maroonColor,
                                '&.Mui-selected': { bgcolor: alpha(maroonColor, 0.1), color: maroonColor },
                            }
                        }}
                    >
                        <ToggleButton value={3}>3 mo</ToggleButton>
                        <ToggleButton value={6}>6 mo</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Key prediction callouts */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
                    <Box sx={{ p: 2, bgcolor: alpha(projectedWindowSavings >= 0 ? '#059669' : '#dc2626', 0.07), borderRadius: 2, border: `1px solid ${alpha(projectedWindowSavings >= 0 ? '#059669' : '#dc2626', 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Projected Savings ({predictionMonths} mo)
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color={projectedWindowSavings >= 0 ? '#059669' : '#dc2626'}>
                            {projectedWindowSavings >= 0 ? '+' : ''}${projectedWindowSavings.toFixed(2)}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: alpha(trendColor, 0.07), borderRadius: 2, border: `1px solid ${alpha(trendColor, 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Savings Trend</Typography>
                        <Typography variant="h6" fontWeight={700} color={trendColor}>{trendLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {savingsTrend >= 0 ? '+' : ''}${savingsTrend.toFixed(2)}/mo
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: alpha(spendTrendColor, 0.07), borderRadius: 2, border: `1px solid ${alpha(spendTrendColor, 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Spend Trend</Typography>
                        <Typography variant="h6" fontWeight={700} color={spendTrendColor}>{spendTrendLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {slopeActual >= 0 ? '+' : ''}${slopeActual.toFixed(2)}/mo
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: alpha(tealColor, 0.07), borderRadius: 2, border: `1px solid ${alpha(tealColor, 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Model Confidence</Typography>
                        <Typography variant="h6" fontWeight={700} color={tealColor}>{confidence}%</Typography>
                        <Typography variant="caption" color="text.secondary">R² = {prediction.r2.toFixed(2)}</Typography>
                    </Box>
                </Box>

                {/* Combined historical + forecast chart */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    Spend History + Forecast
                </Typography>
                <Box sx={{ height: 220, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                            <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke={theme.palette.text.secondary} />
                            <YAxis tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} tickFormatter={v => `$${v}`} />
                            <RechartsTooltip
                                formatter={(value: number, name: string) => {
                                    const labels: Record<'actual' | 'predictedActual' | 'saved' | 'predictedSaved', string> = { actual: 'Actual Spend', predictedActual: 'Predicted Spend', saved: 'Actual Saved', predictedSaved: 'Predicted Saved' };
                                    return [`$${value.toFixed(2)}`, labels[name as keyof typeof labels] ?? name];
                                }}
                                contentStyle={{ backgroundColor: alpha(theme.palette.background.paper, 0.97), border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 8 }}
                            />
                            <Legend formatter={(name: string) => {
                                const labels: Record<'actual' | 'predictedActual' | 'saved' | 'predictedSaved', string> = { actual: 'Actual Spend', predictedActual: 'Predicted Spend', saved: 'Actual Saved', predictedSaved: 'Predicted Saved' };
                                return labels[name as keyof typeof labels] ?? name;
                            }} />
                            {/* Solid historical */}
                            <Bar   dataKey="actual"          fill={maroonColor}             name="actual"          radius={[3, 3, 0, 0]} />
                            <Line  dataKey="saved"           stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} name="saved" />
                            {/* Dashed predictions */}
                            <Bar   dataKey="predictedActual" fill={alpha(maroonColor, 0.35)} name="predictedActual" radius={[3, 3, 0, 0]} />
                            <Line  dataKey="predictedSaved"  stroke="#059669" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#059669', r: 3 }} name="predictedSaved" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Box>

                {/* Prediction table */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    Month-by-Month Forecast
                </Typography>
                <Stack spacing={1}>
                    {futurePoints.map((fp, i) => (
                        <Box key={i} sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            p: 1.5, borderRadius: 2,
                            bgcolor: alpha(fp.predictedSaved >= 0 ? '#059669' : '#dc2626', 0.05),
                            border: `1px solid ${alpha(fp.predictedSaved >= 0 ? '#059669' : '#dc2626', 0.15)}`
                        }}>
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 72 }}>{fp.month}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Est. spend: <strong>${fp.predictedActual.toFixed(2)}</strong>
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color={fp.predictedSaved >= 0 ? '#059669' : '#dc2626'}>
                                {fp.predictedSaved >= 0 ? '+' : ''}${fp.predictedSaved.toFixed(2)} saved
                            </Typography>
                        </Box>
                    ))}
                </Stack>

                <Box sx={{ mt: 2.5, p: 2, bgcolor: alpha(tealColor, 0.05), borderRadius: 2, border: `1px dashed ${alpha(tealColor, 0.3)}` }}>
                    <Typography variant="caption" color="text.secondary">
                        <strong>Methodology:</strong> Predictions use ordinary least-squares linear regression on your last {history.length} months of data. Confidence reflects how well your past spending fits a linear trend (R²). Results are estimates — actual savings may vary.
                    </Typography>
                </Box>
            </Box>
        );
    };

    // ── Category view (list + detail) ───────────────────────────────────────
    const renderCategoryView = () => {
        const fixedCategories = ['Rent', 'Utilities', 'Electric', 'Gas', 'Income', 'Insurance'];

        const categorizedBudgets = {
            fixed:    allCategories.filter(cat =>  fixedCategories.some(f => cat.categoryName.toLowerCase().includes(f.toLowerCase()))),
            variable: allCategories.filter(cat => !fixedCategories.some(f => cat.categoryName.toLowerCase().includes(f.toLowerCase()))),
        };

        if (!selectedCategory) {
            const renderCategoryRow = (category: CategoryData, index: number) => {
                const percentage = category.budgetedAmount > 0 ? (category.actualAmount / category.budgetedAmount) * 100 : 0;
                const progressColor = getProgressColor(percentage);
                const hasHistory = !!categoryHistoricalData[category.categoryName]?.length;

                return (
                    <Box
                        key={index}
                        onClick={() => { setSelectedCategory(category.categoryName); setCategoryDetailTab('overview'); }}
                        sx={{
                            p: 1.5, borderRadius: 2,
                            bgcolor: alpha(progressColor, 0.05),
                            border: `1px solid ${alpha(progressColor, 0.2)}`,
                            cursor: 'pointer', transition: 'all 0.2s',
                            '&:hover': { bgcolor: alpha(maroonColor, 0.1), borderColor: alpha(maroonColor, 0.4), transform: 'translateX(4px)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Typography variant="body2" fontWeight={600}>{category.categoryName}</Typography>
                                {hasHistory && (
                                    <Tooltip title="Historical data available">
                                        <HistoryIcon sx={{ fontSize: 14, color: tealColor, opacity: 0.7 }} />
                                    </Tooltip>
                                )}
                            </Box>
                            <Chip label={`${percentage.toFixed(0)}%`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(progressColor, 0.2), color: progressColor, fontWeight: 600 }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">${category.actualAmount.toFixed(2)} / ${category.budgetedAmount.toFixed(2)}</Typography>
                            <Typography variant="caption" fontWeight={600} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
                                {category.remainingAmount >= 0 ? '' : '+'}{formatCurrency(Math.abs(category.remainingAmount))}
                            </Typography>
                        </Box>
                    </Box>
                );
            };

            return (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Select a Category
                    </Typography>
                    {categorizedBudgets.fixed.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Fixed Budget Categories ({categorizedBudgets.fixed.length})
                            </Typography>
                            <Stack spacing={1}>{categorizedBudgets.fixed.map(renderCategoryRow)}</Stack>
                        </Box>
                    )}
                    {categorizedBudgets.variable.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Variable Budget Categories ({categorizedBudgets.variable.length})
                            </Typography>
                            <Stack spacing={1}>{categorizedBudgets.variable.map(renderCategoryRow)}</Stack>
                        </Box>
                    )}
                </Box>
            );
        }

        // ── Detail view ────────────────────────────────────────────────────
        const category = allCategories.find(c => c.categoryName === selectedCategory);
        if (!category) return null;

        const percentage = category.budgetedAmount > 0 ? (category.actualAmount / category.budgetedAmount) * 100 : 0;
        const progressColor = getProgressColor(percentage);
        const isVariableCategory = !fixedCategories.some(f => category.categoryName.toLowerCase().includes(f.toLowerCase()));
        const hasHistory = !!categoryHistoricalData[category.categoryName]?.length;
        const categorySaved = category.budgetedAmount - category.actualAmount;
        const savedAmount = Math.max(categorySaved, 0);

        const pieData = [
            { name: 'Spent',     value: category.actualAmount,               color: '#dc2626' },
            { name: 'Saved',     value: savedAmount,                          color: '#f59e0b' },
            { name: 'Remaining', value: Math.max(category.remainingAmount, 0), color: '#10b981' },
        ];

        const generateDailySpendingData = () => {
            const avgDailySpend = category.actualAmount / daysElapsed;
            return Array.from({ length: Math.min(daysElapsed, daysInMonth) + 1 }, (_, i) => {
                const date = new Date(monthStart);
                date.setDate(date.getDate() + i);
                const variance = (Math.random() - 0.5) * avgDailySpend * 0.4;
                return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), spending: Math.max(0, avgDailySpend * i + variance), day: i };
            });
        };

        const generateWeekComparisonData = () => {
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const avg = category.actualAmount / daysElapsed;
            return daysOfWeek.map(day => ({
                day,
                currentWeek: Math.max(0, avg + (Math.random() - 0.3) * avg * 0.5),
                lastWeek:    Math.max(0, avg * 0.9 + (Math.random() - 0.5) * avg * 0.5),
            }));
        };

        const dailySpendingData   = isVariableCategory ? generateDailySpendingData() : [];
        const weekComparisonData  = isVariableCategory ? generateWeekComparisonData() : [];

        return (
            <Box>
                {/* Back + Optimize header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Chip
                        label="← Back"
                        onClick={() => { setSelectedCategory(null); setIsEditingBudget(false); setEditedBudgetAmount(''); }}
                        sx={{ cursor: 'pointer', bgcolor: alpha(maroonColor, 0.1), color: maroonColor, fontWeight: 600, '&:hover': { bgcolor: alpha(maroonColor, 0.2) } }}
                    />
                    <Tooltip title="Use AI to optimize this budget category">
                        <Button
                            variant="outlined" size="small"
                            startIcon={isOptimizing ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                            onClick={async () => {
                                if (onOptimizeBudget && selectedCategory) {
                                    setIsOptimizing(true);
                                    try {
                                        const optimizedAmount = await onOptimizeBudget(selectedCategory);
                                        setEditedBudgetAmount(optimizedAmount.toString());
                                        setIsEditingBudget(true);
                                    } catch { alert('Failed to optimize budget. Please try again.'); }
                                    finally { setIsOptimizing(false); }
                                }
                            }}
                            disabled={isOptimizing}
                            sx={{ borderColor: alpha(maroonColor, 0.3), color: maroonColor, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', '&:hover': { borderColor: maroonColor, bgcolor: alpha(maroonColor, 0.05) } }}
                        >
                            {isOptimizing ? 'Optimizing...' : 'Optimize'}
                        </Button>
                    </Tooltip>
                </Box>

                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{category.categoryName}</Typography>

                {/* Sub-tab navigation: Overview / History / Prediction */}
                <Box sx={{
                    display: 'flex', gap: 0.75, mb: 3, p: 0.5,
                    bgcolor: alpha(theme.palette.divider, 0.08),
                    borderRadius: 2.5,
                }}>
                    {([
                        { key: 'overview'   as const, label: 'Overview',   icon: <PieChartIcon sx={{ fontSize: 14 }} />, disabled: false          },
                        { key: 'history'    as const, label: 'History',    icon: <HistoryIcon  sx={{ fontSize: 14 }} />, disabled: !hasHistory    },
                        { key: 'prediction' as const, label: 'Prediction', icon: <InsightsIcon sx={{ fontSize: 14 }} />, disabled: !hasHistory    },
                    ]).map(({ key, label, icon, disabled }) => (
                        <Box
                            key={key}
                            onClick={() => !disabled && setCategoryDetailTab(key)}
                            sx={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                                py: 0.75, borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer',
                                fontWeight: 600, fontSize: '0.72rem', transition: 'all 0.15s',
                                bgcolor:   categoryDetailTab === key ? 'background.paper' : 'transparent',
                                color:     disabled ? alpha(theme.palette.text.secondary, 0.4) : categoryDetailTab === key ? maroonColor : 'text.secondary',
                                boxShadow: categoryDetailTab === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                                '&:hover': !disabled ? { color: maroonColor } : {},
                            }}
                        >
                            {icon}
                            <span>{label}</span>
                            {disabled && (
                                <Tooltip title="No historical data available"><span style={{ fontSize: 10, opacity: 0.5 }}>ⓘ</span></Tooltip>
                            )}
                        </Box>
                    ))}
                </Box>

                {/* Overview tab (original detail content) */}
                {categoryDetailTab === 'overview' && (
                    <Box>
                        {/* Editable budget summary card */}
                        <Card sx={{ p: 2.5, mb: 3, background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`, border: `1px solid ${alpha(progressColor, 0.2)}` }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Budgeted</Typography>
                                    {isEditingBudget ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <TextField
                                                value={editedBudgetAmount}
                                                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setEditedBudgetAmount(v); }}
                                                size="small" placeholder="0.00"
                                                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
                                                sx={{ width: '140px', '& .MuiOutlinedInput-root': { fontSize: '1.25rem', fontWeight: 700, '& input': { padding: '4px 8px' } } }}
                                                autoFocus
                                            />
                                            <IconButton size="small" disabled={isSavingBudget}
                                                        onClick={async () => {
                                                            const newAmount = parseFloat(editedBudgetAmount);
                                                            if (!isNaN(newAmount) && newAmount > 0 && onUpdateBudgetAmount && selectedCategory) {
                                                                setIsSavingBudget(true);
                                                                try { await onUpdateBudgetAmount(selectedCategory, newAmount); setIsEditingBudget(false); setEditedBudgetAmount(''); }
                                                                catch { alert('Failed to save. Please try again.'); }
                                                                finally { setIsSavingBudget(false); }
                                                            }
                                                        }}
                                                        sx={{ bgcolor: alpha('#059669', 0.1), color: '#059669', '&:hover': { bgcolor: alpha('#059669', 0.2) } }}
                                            >
                                                {isSavingBudget ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                                            </IconButton>
                                            <IconButton size="small" onClick={() => { setIsEditingBudget(false); setEditedBudgetAmount(''); }} sx={{ bgcolor: alpha('#dc2626', 0.1), color: '#dc2626', '&:hover': { bgcolor: alpha('#dc2626', 0.2) } }}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h5" fontWeight={700}>${category.budgetedAmount.toFixed(2)}</Typography>
                                            <Tooltip title="Edit budgeted amount">
                                                <IconButton size="small" onClick={() => { setIsEditingBudget(true); setEditedBudgetAmount(category.budgetedAmount.toString()); }} sx={{ color: maroonColor, opacity: 0.6, '&:hover': { opacity: 1, bgcolor: alpha(maroonColor, 0.1) } }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">Spent</Typography>
                                    <Typography variant="h5" fontWeight={700} color={progressColor}>${category.actualAmount.toFixed(2)}</Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={Math.min(percentage, 100)} sx={{ height: 10, borderRadius: 5, bgcolor: `${progressColor}20`, '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 5 } }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" fontWeight={600} color={progressColor}>{percentage.toFixed(0)}% Used</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatCurrency(Math.abs(category.remainingAmount))} {category.remainingAmount >= 0 ? 'remaining' : 'over budget'}
                                </Typography>
                            </Box>
                        </Card>

                        <Divider sx={{ my: 3 }} />

                        {/* Pie */}
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Budget Breakdown</Typography>
                        <Box sx={{ height: 200, mb: 3 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>

                        {/* Line / bar charts for variable */}
                        {isVariableCategory && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Spending Trend</Typography>
                                    <ToggleButtonGroup value={chartView} exclusive onChange={(e, v) => v && setChartView(v)} size="small" sx={{ '& .MuiToggleButton-root': { py: 0.5, px: 1.5, fontSize: '0.7rem', fontWeight: 600, textTransform: 'none', border: `1px solid ${alpha(maroonColor, 0.3)}`, color: maroonColor, '&.Mui-selected': { bgcolor: alpha(maroonColor, 0.1), color: maroonColor }, '&:hover': { bgcolor: alpha(maroonColor, 0.05) } } }}>
                                        <ToggleButton value="monthly">Monthly</ToggleButton>
                                        <ToggleButton value="weekly">Week Compare</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                                {chartView === 'monthly' ? (
                                    <Box sx={{ height: 250, mb: 3 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={dailySpendingData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} />
                                                <YAxis tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} tickFormatter={v => `$${v.toFixed(0)}`} />
                                                <RechartsTooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cumulative Spending']} contentStyle={{ backgroundColor: alpha(theme.palette.background.paper, 0.95), border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 8 }} />
                                                <Line type="monotone" dataKey="spending" stroke={progressColor} strokeWidth={2} dot={{ fill: progressColor, r: 3 }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ) : (
                                    <Box sx={{ height: 250, mb: 3 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weekComparisonData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} />
                                                <YAxis tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} tickFormatter={v => `$${v.toFixed(0)}`} />
                                                <RechartsTooltip formatter={(v: number) => `$${v.toFixed(2)}`} contentStyle={{ backgroundColor: alpha(theme.palette.background.paper, 0.95), border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 8 }} />
                                                <Legend />
                                                <Bar dataKey="currentWeek" fill={progressColor}              name="Current Week" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="lastWeek"    fill={alpha(progressColor, 0.5)} name="Last Week"    radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                )}
                            </>
                        )}

                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Category Stats</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            {[
                                { label: 'Budgeted',    value: `$${category.budgetedAmount.toFixed(2)}`,                                               color: '#2563eb' },
                                { label: 'Actual Spent', value: `$${category.actualAmount.toFixed(2)}`,                                                color: progressColor },
                                { label: 'Remaining',   value: `${category.remainingAmount >= 0 ? '' : '-'}$${Math.abs(category.remainingAmount).toFixed(2)}`, color: category.remainingAmount >= 0 ? '#059669' : '#dc2626' },
                                { label: 'Usage',       value: `${percentage.toFixed(1)}%`,                                                            color: maroonColor },
                            ].map(({ label, value, color }) => (
                                <Box key={label} sx={{ p: 2, backgroundColor: alpha(color, 0.05), borderRadius: 2, border: `1px solid ${alpha(color, 0.2)}` }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
                                    <Typography variant="h6" fontWeight={600} color={color}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {categoryDetailTab === 'history'    && renderHistoryTab(category)}
                {categoryDetailTab === 'prediction' && renderPredictionTab(category)}
            </Box>
        );
    };

    const renderGoalsView = () => {
        const goalColor = goalProgress < 70 ? '#dc2626' : goalProgress < 90 ? '#f59e0b' : tealColor;

        return (
            <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Savings Goal Progress</Typography>
                <Card sx={{ p: 2.5, mb: 3, background: `linear-gradient(135deg, ${alpha(goalColor, 0.1)} 0%, ${alpha(goalColor, 0.05)} 100%)`, border: `1px solid ${alpha(goalColor, 0.2)}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Current Savings</Typography>
                            <Typography variant="h4" fontWeight={700} color={maroonColor}>${currentSavings.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">Monthly Goal</Typography>
                            <Typography variant="h5" fontWeight={600}>${monthlyGoal.toFixed(2)}</Typography>
                        </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(goalProgress, 100)} sx={{ height: 10, borderRadius: 5, backgroundColor: `${goalColor}20`, '& .MuiLinearProgress-bar': { backgroundColor: goalColor, borderRadius: 5 } }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" fontWeight={600} color={goalColor}>{goalProgress.toFixed(0)}% Complete</Typography>
                        <Typography variant="caption" color="text.secondary">${Math.max(monthlyGoal - currentSavings, 0).toFixed(2)} to go</Typography>
                    </Box>
                </Card>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Month Progress</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mb: 3, backgroundColor: alpha(tealColor, 0.05), borderRadius: 2, border: `1px solid ${alpha(tealColor, 0.2)}` }}>
                    <Box><Typography variant="caption" color="text.secondary">Days Elapsed</Typography><Typography variant="h6" fontWeight={600} color={maroonColor}>{daysElapsed}</Typography></Box>
                    <Box sx={{ textAlign: 'center' }}><Typography variant="caption" color="text.secondary">Progress</Typography><Typography variant="h6" fontWeight={600}>{((daysElapsed / daysInMonth) * 100).toFixed(0)}%</Typography></Box>
                    <Box sx={{ textAlign: 'right' }}><Typography variant="caption" color="text.secondary">Days Remaining</Typography><Typography variant="h6" fontWeight={600} color={maroonColor}>{daysRemaining}</Typography></Box>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Spending Analysis</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 2, backgroundColor: alpha(maroonColor, 0.05), borderRadius: 2, border: `1px solid ${alpha(maroonColor, 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Daily Budget</Typography>
                        <Typography variant="h6" fontWeight={600} color={maroonColor}>${dailyBudget.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ p: 2, backgroundColor: alpha(actualDailySpending > dailyBudget ? '#dc2626' : '#059669', 0.05), borderRadius: 2, border: `1px solid ${alpha(actualDailySpending > dailyBudget ? '#dc2626' : '#059669', 0.2)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Actual Daily</Typography>
                        <Typography variant="h6" fontWeight={600} color={actualDailySpending > dailyBudget ? '#dc2626' : '#059669'}>${actualDailySpending.toFixed(2)}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>End of Month Projection</Typography>
                <Card sx={{ p: 2.5, mb: 3, background: onTrack ? 'linear-gradient(135deg, rgba(5,150,105,0.05) 0%, rgba(5,150,105,0.02) 100%)' : 'linear-gradient(135deg, rgba(220,38,38,0.05) 0%, rgba(220,38,38,0.02) 100%)', border: `1px solid ${alpha(onTrack ? '#059669' : '#dc2626', 0.2)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {onTrack ? <TrendingUpIcon sx={{ color: '#059669' }} /> : <TrendingDownIcon sx={{ color: '#dc2626' }} />}
                        <Typography variant="body1" fontWeight={600}>Projected Savings: ${projectedSavings.toFixed(2)}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        At current spending rate, projected to end month with{' '}
                        <Typography component="span" fontWeight={600} color={onTrack ? '#059669' : '#dc2626'}>${Math.abs(projectedSavings - monthlyGoal).toFixed(2)}</Typography>
                        {' '}{onTrack ? 'above' : 'below'} your goal
                    </Typography>
                </Card>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Key Insights</Typography>
                <Stack spacing={1.5}>
                    {[
                        onTrack && { color: '#059669', icon: '✓', title: 'On track to meet monthly goal',     sub: `Continue current spending habits to reach your $${monthlyGoal.toFixed(2)} savings target` },
                        !onTrack && { color: '#dc2626', icon: '⚠', title: 'May not meet monthly goal',       sub: 'Need to reduce daily spending to meet goal' },
                        actualDailySpending > dailyBudget && { color: '#f59e0b', icon: '↑', title: 'Spending above daily budget', sub: `Averaging $${(actualDailySpending - dailyBudget).toFixed(2)} over daily budget` },
                        actualDailySpending <= dailyBudget && { color: '#059669', icon: '✓', title: 'Staying within daily budget', sub: `Averaging $${(dailyBudget - actualDailySpending).toFixed(2)} under daily budget` },
                        daysRemaining <= 7 && goalProgress < 100 && { color: '#f59e0b', icon: '!', title: 'Final week — goal not reached', sub: `Need to save $${((monthlyGoal - currentSavings) / daysRemaining).toFixed(2)}/day to reach goal` },
                    ].filter(Boolean).map((insight: any, i) => (
                        <Box key={i} sx={{ p: 2, backgroundColor: alpha(insight.color, 0.05), borderRadius: 2, borderLeft: `4px solid ${insight.color}` }}>
                            <Typography variant="body2" fontWeight={500} color={insight.color}>{insight.icon} {insight.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{insight.sub}</Typography>
                        </Box>
                    ))}
                </Stack>
            </Box>
        );
    };

    return (
        <Paper sx={{ borderRadius: 4, boxShadow: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`, color: 'white', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PieChartIcon />
                        <Typography variant="h6" fontWeight={600}>Budget Analysis</Typography>
                    </Box>
                    <ToggleButtonGroup value={selectedView} exclusive onChange={handleViewChange} size="small" sx={{ '& .MuiToggleButton-root': { color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', py: 0.5, px: 1.5, fontSize: '0.7rem', fontWeight: 600, textTransform: 'none', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } } }}>
                        <ToggleButton value="stats">Stats</ToggleButton>
                        <ToggleButton value="recurring">Recurring</ToggleButton>
                        <ToggleButton value="category">Category</ToggleButton>
                        <ToggleButton value="goals">Goals</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {budgetStats.dateRange.startDate && `${budgetStats.dateRange.startDate.toLocaleDateString()} - ${budgetStats.dateRange.endDate.toLocaleDateString()}`}
                </Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, maxHeight: 'calc(100vh - 300px)', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)' }, '&::-webkit-scrollbar-thumb': { backgroundColor: tealColor, borderRadius: '4px', '&:hover': { backgroundColor: '#0f766e' } } }}>
                {isLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}><Typography variant="body2" color="text.secondary">Loading...</Typography></Box>
                ) : (
                    <>
                        {selectedView === 'stats'     && renderStatsView()}
                        {selectedView === 'recurring' && renderRecurringView()}
                        {selectedView === 'category'  && renderCategoryView()}
                        {selectedView === 'goals'     && renderGoalsView()}
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default DynamicBudgetPanel;
// import React, { useState } from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     Divider,
//     Stack,
//     alpha,
//     useTheme,
//     Card,
//     LinearProgress,
//     Chip,
//     ToggleButtonGroup,
//     ToggleButton,
//     TextField,
//     IconButton,
//     Button,
//     Tooltip,
//     CircularProgress
// } from '@mui/material';
// import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
// import PieChartIcon from '@mui/icons-material/PieChart';
// import RepeatIcon from '@mui/icons-material/Repeat';
// import EditIcon from '@mui/icons-material/Edit';
// import SaveIcon from '@mui/icons-material/Save';
// import CloseIcon from '@mui/icons-material/Close';
// import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
// import { BudgetStats } from '../utils/Items';
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// interface CategoryData {
//     categoryName: string;
//     budgetedAmount: number;
//     actualAmount: number;
//     remainingAmount: number;
//     isRecurring?: boolean;
//     isCustom?: boolean;
// }
//
// interface OverviewCategory {
//     category: string;
//     budgetedExpenses: number;
//     actualExpenses: number;
//     remainingExpenses: number;
// }
//
// interface DynamicBudgetPanelProps {
//     isLoading: boolean;
//     topSpendingCategories: CategoryData[];
//     overviewCategories: OverviewCategory[];
//     recurringCategories: CategoryData[];
//     budgetStats: BudgetStats;
//     allCategories: CategoryData[];
//     onUpdateBudgetAmount?: (categoryName: string, newAmount: number) => Promise<void>;
//     onOptimizeBudget?: (categoryName: string) => Promise<number>;
// }
//
// type ViewType = 'stats' | 'recurring' | 'category' | 'goals';
//
// const CHART_COLORS = [tealColor, maroonColor, '#f59e0b', '#8b5cf6', '#ec4899'];
//
// const DynamicBudgetPanel: React.FC<DynamicBudgetPanelProps> = ({
//                                                                    isLoading,
//                                                                    topSpendingCategories,
//                                                                    overviewCategories,
//                                                                    recurringCategories,
//                                                                    budgetStats,
//                                                                    allCategories,
//                                                                    onUpdateBudgetAmount,
//                                                                    onOptimizeBudget
//                                                                }) => {
//     const theme = useTheme();
//     const [selectedView, setSelectedView] = useState<ViewType>('stats');
//     const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
//     const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
//     const [isEditingBudget, setIsEditingBudget] = useState(false);
//     const [editedBudgetAmount, setEditedBudgetAmount] = useState<string>('');
//     const [isSavingBudget, setIsSavingBudget] = useState(false);
//     const [isOptimizing, setIsOptimizing] = useState(false);
//
//     const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
//         if (newView !== null) {
//             setSelectedView(newView);
//             setSelectedCategory(null);
//         }
//     };
//
//     // Calculate metrics for Budget Goals tab
//     const today = new Date();
//     const monthStart = budgetStats.dateRange.startDate;
//     const monthEnd = budgetStats.dateRange.endDate;
//
//     const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
//     const daysElapsed = Math.min(Math.ceil((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)), daysInMonth);
//     const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);
//
//     const dailyBudget = budgetStats.totalBudget / daysInMonth;
//     const actualDailySpending = budgetStats.totalSpent / (daysElapsed || 1);
//     const projectedEndOfMonthSpend = actualDailySpending * daysInMonth;
//
//     // Monthly goal is total saved
//     const monthlyGoal = budgetStats.totalSaved;
//     const currentSavings = budgetStats.totalSaved;
//     const goalProgress = (currentSavings / (monthlyGoal || 1)) * 100;
//     const projectedSavings = (currentSavings / (daysElapsed || 1)) * daysInMonth;
//     const onTrack = projectedSavings >= monthlyGoal;
//
//     const getProgressColor = (percent: number) => {
//         if (percent < 70) return tealColor;
//         if (percent < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//     const formatCurrency = (amount: number) => {
//         return `$${Math.abs(amount).toFixed(2)}`;
//     };
//
//     // Prepare pie chart data for Stats view - 3 slices with consistent colors
//     const pieChartData = [
//         {
//             name: 'Spent',
//             value: budgetStats.totalSpent,
//             color: '#dc2626' // Red for spent
//         },
//         {
//             name: 'Saved',
//             value: budgetStats.totalSaved,
//             color: '#f59e0b' // Goldish yellow for saved
//         },
//         {
//             name: 'Remaining',
//             value: budgetStats.remaining,
//             color: '#10b981' // Aqua green for remaining
//         }
//     ];
//
//     const renderStatsView = () => (
//         <Box>
//             {/* Overall Progress */}
//             <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                 Overall Progress
//             </Typography>
//
//             <Card sx={{
//                 p: 2.5,
//                 mb: 3,
//                 background: `linear-gradient(135deg, ${alpha(maroonColor, 0.1)} 0%, ${alpha(maroonColor, 0.05)} 100%)`,
//                 border: `1px solid ${alpha(maroonColor, 0.2)}`
//             }}>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
//                     <Typography variant="body2" color="text.secondary">
//                         Total Spending
//                     </Typography>
//                     <Typography variant="h5" fontWeight={700} color={maroonColor}>
//                         {((budgetStats.totalSpent / budgetStats.totalBudget) * 100).toFixed(0)}%
//                     </Typography>
//                 </Box>
//                 <LinearProgress
//                     variant="determinate"
//                     value={Math.min((budgetStats.totalSpent / budgetStats.totalBudget) * 100, 100)}
//                     sx={{
//                         height: 10,
//                         borderRadius: 5,
//                         backgroundColor: `${maroonColor}20`,
//                         '& .MuiLinearProgress-bar': {
//                             backgroundColor: maroonColor,
//                             borderRadius: 5
//                         }
//                     }}
//                 />
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
//                     <Typography variant="caption" color="text.secondary">
//                         ${budgetStats.totalSpent.toFixed(2)} spent
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary">
//                         ${budgetStats.totalBudget.toFixed(2)} total
//                     </Typography>
//                 </Box>
//             </Card>
//
//             <Divider sx={{ my: 3 }} />
//
//             {/* Budget Distribution Pie Chart */}
//             <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                 Budget Distribution
//             </Typography>
//
//             <Box sx={{ height: 250, mb: 3 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                         <Pie
//                             data={pieChartData}
//                             cx="50%"
//                             cy="50%"
//                             innerRadius={60}
//                             outerRadius={90}
//                             paddingAngle={2}
//                             dataKey="value"
//                         >
//                             {pieChartData.map((entry, index) => (
//                                 <Cell key={`cell-${index}`} fill={entry.color} />
//                             ))}
//                         </Pie>
//                         <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
//                         <Legend />
//                     </PieChart>
//                 </ResponsiveContainer>
//             </Box>
//
//             <Divider sx={{ my: 3 }} />
//
//             {/* Budget Stats Grid */}
//             <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                 Budget Stats
//             </Typography>
//
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//                 <Box sx={{
//                     p: 2,
//                     backgroundColor: alpha('#2563eb', 0.05),
//                     borderRadius: 2,
//                     border: `1px solid ${alpha('#2563eb', 0.2)}`
//                 }}>
//                     <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                         Total Budget
//                     </Typography>
//                     <Typography variant="h6" fontWeight={600} color="#2563eb">
//                         ${budgetStats.totalBudget.toFixed(2)}
//                     </Typography>
//                 </Box>
//                 <Box sx={{
//                     p: 2,
//                     backgroundColor: alpha('#dc2626', 0.05),
//                     borderRadius: 2,
//                     border: `1px solid ${alpha('#dc2626', 0.2)}`
//                 }}>
//                     <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                         Total Spent
//                     </Typography>
//                     <Typography variant="h6" fontWeight={600} color="#dc2626">
//                         ${budgetStats.totalSpent.toFixed(2)}
//                     </Typography>
//                 </Box>
//                 <Box sx={{
//                     p: 2,
//                     backgroundColor: alpha('#059669', 0.05),
//                     borderRadius: 2,
//                     border: `1px solid ${alpha('#059669', 0.2)}`
//                 }}>
//                     <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                         Total Saved
//                     </Typography>
//                     <Typography variant="h6" fontWeight={600} color="#059669">
//                         ${budgetStats.totalSaved.toFixed(2)}
//                     </Typography>
//                 </Box>
//                 <Box sx={{
//                     p: 2,
//                     backgroundColor: alpha(tealColor, 0.05),
//                     borderRadius: 2,
//                     border: `1px solid ${alpha(tealColor, 0.2)}`
//                 }}>
//                     <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                         Remaining
//                     </Typography>
//                     <Typography variant="h6" fontWeight={600} color={tealColor}>
//                         ${budgetStats.remaining.toFixed(2)}
//                     </Typography>
//                 </Box>
//             </Box>
//         </Box>
//     );
//
//     const renderRecurringView = () => (
//         <Box>
//             <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                 Recurring Categories ({recurringCategories.length})
//             </Typography>
//
//             <Stack spacing={2}>
//                 {recurringCategories.length > 0 ? (
//                     recurringCategories.map((category, index) => {
//                         const percentage = category.budgetedAmount > 0
//                             ? (category.actualAmount / category.budgetedAmount) * 100
//                             : 0;
//                         const progressColor = getProgressColor(percentage);
//
//                         return (
//                             <Card key={index} sx={{
//                                 p: 2,
//                                 background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
//                                 border: `1px solid ${alpha(progressColor, 0.2)}`
//                             }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
//                                     <Box>
//                                         <Typography variant="body2" fontWeight={600}>
//                                             {category.categoryName}
//                                         </Typography>
//                                         <Chip
//                                             label="Recurring"
//                                             size="small"
//                                             sx={{
//                                                 mt: 0.5,
//                                                 height: 20,
//                                                 fontSize: '0.65rem',
//                                                 bgcolor: alpha(maroonColor, 0.1),
//                                                 color: maroonColor
//                                             }}
//                                         />
//                                     </Box>
//                                     <Typography variant="h6" fontWeight={700} color={progressColor}>
//                                         ${category.actualAmount.toFixed(2)}
//                                     </Typography>
//                                 </Box>
//                                 <LinearProgress
//                                     variant="determinate"
//                                     value={Math.min(percentage, 100)}
//                                     sx={{
//                                         height: 6,
//                                         borderRadius: 3,
//                                         bgcolor: `${progressColor}20`,
//                                         '& .MuiLinearProgress-bar': {
//                                             bgcolor: progressColor,
//                                             borderRadius: 3
//                                         }
//                                     }}
//                                 />
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
//                                     <Typography variant="caption" color="text.secondary">
//                                         Budgeted: ${category.budgetedAmount.toFixed(2)}
//                                     </Typography>
//                                     <Typography variant="caption" fontWeight={600} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
//                                         {category.remainingAmount >= 0 ? '' : '+'}{formatCurrency(Math.abs(category.remainingAmount))}
//                                     </Typography>
//                                 </Box>
//                             </Card>
//                         );
//                     })
//                 ) : (
//                     <Box sx={{
//                         p: 3,
//                         textAlign: 'center',
//                         color: 'text.secondary',
//                         bgcolor: alpha(theme.palette.divider, 0.05),
//                         borderRadius: 2
//                     }}>
//                         <RepeatIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
//                         <Typography variant="body2">
//                             No recurring categories found
//                         </Typography>
//                     </Box>
//                 )}
//             </Stack>
//         </Box>
//     );
//
//     const renderCategoryView = () => {
//         // Fixed categories list
//         const fixedCategories = ['Rent', 'Utilities', 'Electric', 'Gas', 'Income', 'Insurance'];
//
//         // Split categories into fixed and variable
//         const categorizedBudgets = {
//             fixed: allCategories.filter(cat =>
//                 fixedCategories.some(fixed =>
//                     cat.categoryName.toLowerCase().includes(fixed.toLowerCase())
//                 )
//             ),
//             variable: allCategories.filter(cat =>
//                 !fixedCategories.some(fixed =>
//                     cat.categoryName.toLowerCase().includes(fixed.toLowerCase())
//                 )
//             )
//         };
//
//         if (!selectedCategory) {
//             return (
//                 <Box>
//                     <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                         Select a Category
//                     </Typography>
//
//                     {/* Fixed Categories Section */}
//                     {categorizedBudgets.fixed.length > 0 && (
//                         <Box sx={{ mb: 3 }}>
//                             <Typography variant="caption" color="text.secondary" sx={{
//                                 display: 'block',
//                                 mb: 1.5,
//                                 fontWeight: 600,
//                                 textTransform: 'uppercase',
//                                 letterSpacing: 0.5
//                             }}>
//                                 Fixed Budget Categories ({categorizedBudgets.fixed.length})
//                             </Typography>
//                             <Stack spacing={1}>
//                                 {categorizedBudgets.fixed.map((category, index) => {
//                                     const percentage = category.budgetedAmount > 0
//                                         ? (category.actualAmount / category.budgetedAmount) * 100
//                                         : 0;
//                                     const progressColor = getProgressColor(percentage);
//
//                                     return (
//                                         <Box
//                                             key={index}
//                                             onClick={() => setSelectedCategory(category.categoryName)}
//                                             sx={{
//                                                 p: 1.5,
//                                                 borderRadius: 2,
//                                                 bgcolor: alpha(progressColor, 0.05),
//                                                 border: `1px solid ${alpha(progressColor, 0.2)}`,
//                                                 cursor: 'pointer',
//                                                 transition: 'all 0.2s',
//                                                 '&:hover': {
//                                                     bgcolor: alpha(maroonColor, 0.1),
//                                                     borderColor: alpha(maroonColor, 0.4),
//                                                     transform: 'translateX(4px)'
//                                                 }
//                                             }}
//                                         >
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                                                 <Typography variant="body2" fontWeight={600}>
//                                                     {category.categoryName}
//                                                 </Typography>
//                                                 <Chip
//                                                     label={`${percentage.toFixed(0)}%`}
//                                                     size="small"
//                                                     sx={{
//                                                         height: 20,
//                                                         fontSize: '0.65rem',
//                                                         bgcolor: alpha(progressColor, 0.2),
//                                                         color: progressColor,
//                                                         fontWeight: 600
//                                                     }}
//                                                 />
//                                             </Box>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                 <Typography variant="caption" color="text.secondary">
//                                                     ${category.actualAmount.toFixed(2)} / ${category.budgetedAmount.toFixed(2)}
//                                                 </Typography>
//                                                 <Typography variant="caption" fontWeight={600} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
//                                                     {category.remainingAmount >= 0 ? '' : '+'}{formatCurrency(Math.abs(category.remainingAmount))}
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                     );
//                                 })}
//                             </Stack>
//                         </Box>
//                     )}
//
//                     {/* Variable Categories Section */}
//                     {categorizedBudgets.variable.length > 0 && (
//                         <Box>
//                             <Typography variant="caption" color="text.secondary" sx={{
//                                 display: 'block',
//                                 mb: 1.5,
//                                 fontWeight: 600,
//                                 textTransform: 'uppercase',
//                                 letterSpacing: 0.5
//                             }}>
//                                 Variable Budget Categories ({categorizedBudgets.variable.length})
//                             </Typography>
//                             <Stack spacing={1}>
//                                 {categorizedBudgets.variable.map((category, index) => {
//                                     const percentage = category.budgetedAmount > 0
//                                         ? (category.actualAmount / category.budgetedAmount) * 100
//                                         : 0;
//                                     const progressColor = getProgressColor(percentage);
//
//                                     return (
//                                         <Box
//                                             key={index}
//                                             onClick={() => setSelectedCategory(category.categoryName)}
//                                             sx={{
//                                                 p: 1.5,
//                                                 borderRadius: 2,
//                                                 bgcolor: alpha(progressColor, 0.05),
//                                                 border: `1px solid ${alpha(progressColor, 0.2)}`,
//                                                 cursor: 'pointer',
//                                                 transition: 'all 0.2s',
//                                                 '&:hover': {
//                                                     bgcolor: alpha(maroonColor, 0.1),
//                                                     borderColor: alpha(maroonColor, 0.4),
//                                                     transform: 'translateX(4px)'
//                                                 }
//                                             }}
//                                         >
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                                                 <Typography variant="body2" fontWeight={600}>
//                                                     {category.categoryName}
//                                                 </Typography>
//                                                 <Chip
//                                                     label={`${percentage.toFixed(0)}%`}
//                                                     size="small"
//                                                     sx={{
//                                                         height: 20,
//                                                         fontSize: '0.65rem',
//                                                         bgcolor: alpha(progressColor, 0.2),
//                                                         color: progressColor,
//                                                         fontWeight: 600
//                                                     }}
//                                                 />
//                                             </Box>
//                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                                 <Typography variant="caption" color="text.secondary">
//                                                     ${category.actualAmount.toFixed(2)} / ${category.budgetedAmount.toFixed(2)}
//                                                 </Typography>
//                                                 <Typography variant="caption" fontWeight={600} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
//                                                     {category.remainingAmount >= 0 ? '' : '+'}{formatCurrency(Math.abs(category.remainingAmount))}
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                     );
//                                 })}
//                             </Stack>
//                         </Box>
//                     )}
//                 </Box>
//             );
//         }
//
//         // Category detail view - COMPLETE WITH CHARTS
//         const category = allCategories.find(c => c.categoryName === selectedCategory);
//         if (!category) return null;
//
//         const percentage = category.budgetedAmount > 0
//             ? (category.actualAmount / category.budgetedAmount) * 100
//             : 0;
//         const progressColor = getProgressColor(percentage);
//
//         // Check if this is a variable category
//         const isVariableCategory = !fixedCategories.some(fixed =>
//             category.categoryName.toLowerCase().includes(fixed.toLowerCase())
//         );
//
//         // Calculate saved amount for this category
//         const categorySaved = category.budgetedAmount - category.actualAmount;
//         const savedAmount = Math.max(categorySaved, 0);
//
//         // Prepare data for pie chart - 3 slices: red, goldish yellow, aqua green
//         const pieData = [
//             { name: 'Spent', value: category.actualAmount, color: '#dc2626' }, // Red
//             { name: 'Saved', value: savedAmount, color: '#f59e0b' }, // Goldish yellow
//             { name: 'Remaining', value: Math.max(category.remainingAmount, 0), color: '#10b981' } // Aqua green
//         ];
//
//         // Generate mock daily spending data for line chart (replace with actual data from backend)
//         const generateDailySpendingData = () => {
//             const dailyData = [];
//             const avgDailySpend = category.actualAmount / daysElapsed;
//
//             for (let i = 0; i <= Math.min(daysElapsed, daysInMonth); i++) {
//                 const date = new Date(monthStart);
//                 date.setDate(date.getDate() + i);
//
//                 // Add some variance to make it realistic (replace with actual backend data)
//                 const variance = (Math.random() - 0.5) * avgDailySpend * 0.4;
//                 const cumulativeSpending = (avgDailySpend * i) + variance;
//
//                 dailyData.push({
//                     date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//                     spending: Math.max(0, cumulativeSpending),
//                     day: i
//                 });
//             }
//             return dailyData;
//         };
//
//         // Generate week comparison data (current week vs last week)
//         const generateWeekComparisonData = () => {
//             const weekData = [];
//             const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//             const avgDailySpend = category.actualAmount / daysElapsed;
//
//             for (let i = 0; i < 7; i++) {
//                 // Add variance for current and last week (replace with actual backend data)
//                 const currentWeekVariance = (Math.random() - 0.3) * avgDailySpend * 0.5;
//                 const lastWeekVariance = (Math.random() - 0.5) * avgDailySpend * 0.5;
//
//                 weekData.push({
//                     day: daysOfWeek[i],
//                     currentWeek: Math.max(0, avgDailySpend + currentWeekVariance),
//                     lastWeek: Math.max(0, avgDailySpend * 0.9 + lastWeekVariance)
//                 });
//             }
//             return weekData;
//         };
//
//         const dailySpendingData = isVariableCategory ? generateDailySpendingData() : [];
//         const weekComparisonData = isVariableCategory ? generateWeekComparisonData() : [];
//
//         return (
//             <Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                     <Chip
//                         label="← Back to Categories"
//                         onClick={() => {
//                             setSelectedCategory(null);
//                             setIsEditingBudget(false);
//                             setEditedBudgetAmount('');
//                         }}
//                         sx={{
//                             cursor: 'pointer',
//                             bgcolor: alpha(maroonColor, 0.1),
//                             color: maroonColor,
//                             fontWeight: 600,
//                             '&:hover': {
//                                 bgcolor: alpha(maroonColor, 0.2)
//                             }
//                         }}
//                     />
//
//                     {/* Optimize Button */}
//                     <Tooltip title="Use AI to optimize this budget category based on your spending patterns">
//                         <Button
//                             variant="outlined"
//                             size="small"
//                             startIcon={isOptimizing ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
//                             onClick={async () => {
//                                 if (onOptimizeBudget && selectedCategory) {
//                                     setIsOptimizing(true);
//                                     try {
//                                         const optimizedAmount = await onOptimizeBudget(selectedCategory);
//                                         setEditedBudgetAmount(optimizedAmount.toString());
//                                         setIsEditingBudget(true);
//                                     } catch (error) {
//                                         console.error('Error optimizing budget:', error);
//                                         alert('Failed to optimize budget. Please try again.');
//                                     } finally {
//                                         setIsOptimizing(false);
//                                     }
//                                 } else {
//                                     alert('Optimize feature not configured. Please provide onOptimizeBudget callback.');
//                                 }
//                             }}
//                             disabled={isOptimizing}
//                             sx={{
//                                 borderColor: alpha(maroonColor, 0.3),
//                                 color: maroonColor,
//                                 textTransform: 'none',
//                                 fontWeight: 600,
//                                 fontSize: '0.75rem',
//                                 '&:hover': {
//                                     borderColor: maroonColor,
//                                     bgcolor: alpha(maroonColor, 0.05)
//                                 }
//                             }}
//                         >
//                             {isOptimizing ? 'Optimizing...' : 'Optimize'}
//                         </Button>
//                     </Tooltip>
//                 </Box>
//
//                 <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
//                     {category.categoryName}
//                 </Typography>
//
//                 {/* Summary Card with Editable Budget */}
//                 <Card sx={{
//                     p: 2.5,
//                     mb: 3,
//                     background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
//                     border: `1px solid ${alpha(progressColor, 0.2)}`
//                 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//                         <Box>
//                             <Typography variant="caption" color="text.secondary">
//                                 Budgeted
//                             </Typography>
//                             {isEditingBudget ? (
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
//                                     <TextField
//                                         value={editedBudgetAmount}
//                                         onChange={(e) => {
//                                             // Only allow numbers and decimal point
//                                             const value = e.target.value;
//                                             if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
//                                                 setEditedBudgetAmount(value);
//                                             }
//                                         }}
//                                         size="small"
//                                         placeholder="0.00"
//                                         InputProps={{
//                                             startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
//                                         }}
//                                         sx={{
//                                             width: '140px',
//                                             '& .MuiOutlinedInput-root': {
//                                                 fontSize: '1.25rem',
//                                                 fontWeight: 700,
//                                                 '& input': {
//                                                     padding: '4px 8px'
//                                                 }
//                                             }
//                                         }}
//                                         autoFocus
//                                     />
//                                     <IconButton
//                                         size="small"
//                                         onClick={async () => {
//                                             const newAmount = parseFloat(editedBudgetAmount);
//                                             if (!isNaN(newAmount) && newAmount > 0) {
//                                                 if (onUpdateBudgetAmount && selectedCategory) {
//                                                     setIsSavingBudget(true);
//                                                     try {
//                                                         await onUpdateBudgetAmount(selectedCategory, newAmount);
//                                                         setIsEditingBudget(false);
//                                                         setEditedBudgetAmount('');
//                                                         // The parent component should refresh the data after saving
//                                                     } catch (error) {
//                                                         console.error('Error saving budget amount:', error);
//                                                         alert('Failed to save budget amount. Please try again.');
//                                                     } finally {
//                                                         setIsSavingBudget(false);
//                                                     }
//                                                 } else {
//                                                     alert('Save feature not configured. Please provide onUpdateBudgetAmount callback.');
//                                                 }
//                                             } else {
//                                                 alert('Please enter a valid amount greater than 0');
//                                             }
//                                         }}
//                                         disabled={isSavingBudget}
//                                         sx={{
//                                             bgcolor: alpha('#059669', 0.1),
//                                             color: '#059669',
//                                             '&:hover': {
//                                                 bgcolor: alpha('#059669', 0.2)
//                                             }
//                                         }}
//                                     >
//                                         {isSavingBudget ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
//                                     </IconButton>
//                                     <IconButton
//                                         size="small"
//                                         onClick={() => {
//                                             setIsEditingBudget(false);
//                                             setEditedBudgetAmount('');
//                                         }}
//                                         sx={{
//                                             bgcolor: alpha('#dc2626', 0.1),
//                                             color: '#dc2626',
//                                             '&:hover': {
//                                                 bgcolor: alpha('#dc2626', 0.2)
//                                             }
//                                         }}
//                                     >
//                                         <CloseIcon fontSize="small" />
//                                     </IconButton>
//                                 </Box>
//                             ) : (
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                     <Typography variant="h5" fontWeight={700}>
//                                         ${category.budgetedAmount.toFixed(2)}
//                                     </Typography>
//                                     <Tooltip title="Edit budgeted amount">
//                                         <IconButton
//                                             size="small"
//                                             onClick={() => {
//                                                 setIsEditingBudget(true);
//                                                 setEditedBudgetAmount(category.budgetedAmount.toString());
//                                             }}
//                                             sx={{
//                                                 color: maroonColor,
//                                                 opacity: 0.6,
//                                                 '&:hover': {
//                                                     opacity: 1,
//                                                     bgcolor: alpha(maroonColor, 0.1)
//                                                 }
//                                             }}
//                                         >
//                                             <EditIcon fontSize="small" />
//                                         </IconButton>
//                                     </Tooltip>
//                                 </Box>
//                             )}
//                         </Box>
//                         <Box sx={{ textAlign: 'right' }}>
//                             <Typography variant="caption" color="text.secondary">
//                                 Spent
//                             </Typography>
//                             <Typography variant="h5" fontWeight={700} color={progressColor}>
//                                 ${category.actualAmount.toFixed(2)}
//                             </Typography>
//                         </Box>
//                     </Box>
//                     <LinearProgress
//                         variant="determinate"
//                         value={Math.min(percentage, 100)}
//                         sx={{
//                             height: 10,
//                             borderRadius: 5,
//                             bgcolor: `${progressColor}20`,
//                             '& .MuiLinearProgress-bar': {
//                                 bgcolor: progressColor,
//                                 borderRadius: 5
//                             }
//                         }}
//                     />
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
//                         <Typography variant="caption" fontWeight={600} color={progressColor}>
//                             {percentage.toFixed(0)}% Used
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                             {formatCurrency(Math.abs(category.remainingAmount))} {category.remainingAmount >= 0 ? 'remaining' : 'over budget'}
//                         </Typography>
//                     </Box>
//                 </Card>
//
//                 <Divider sx={{ my: 3 }} />
//
//                 {/* Pie Chart */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Budget Breakdown
//                 </Typography>
//
//                 <Box sx={{ height: 200, mb: 3 }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                             <Pie
//                                 data={pieData}
//                                 cx="50%"
//                                 cy="50%"
//                                 innerRadius={50}
//                                 outerRadius={80}
//                                 paddingAngle={2}
//                                 dataKey="value"
//                             >
//                                 {pieData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={entry.color} />
//                                 ))}
//                             </Pie>
//                             <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
//                             <Legend />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </Box>
//
//                 {/* Line Chart for Variable Categories Only */}
//                 {isVariableCategory && (
//                     <>
//                         <Divider sx={{ my: 3 }} />
//
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                             <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                                 Spending Trend
//                             </Typography>
//
//                             {/* Chart View Toggle */}
//                             <ToggleButtonGroup
//                                 value={chartView}
//                                 exclusive
//                                 onChange={(e, newView) => newView && setChartView(newView)}
//                                 size="small"
//                                 sx={{
//                                     '& .MuiToggleButton-root': {
//                                         py: 0.5,
//                                         px: 1.5,
//                                         fontSize: '0.7rem',
//                                         fontWeight: 600,
//                                         textTransform: 'none',
//                                         border: `1px solid ${alpha(maroonColor, 0.3)}`,
//                                         color: maroonColor,
//                                         '&.Mui-selected': {
//                                             bgcolor: alpha(maroonColor, 0.1),
//                                             color: maroonColor,
//                                             '&:hover': {
//                                                 bgcolor: alpha(maroonColor, 0.15)
//                                             }
//                                         },
//                                         '&:hover': {
//                                             bgcolor: alpha(maroonColor, 0.05)
//                                         }
//                                     }
//                                 }}
//                             >
//                                 <ToggleButton value="monthly">Monthly</ToggleButton>
//                                 <ToggleButton value="weekly">Week Compare</ToggleButton>
//                             </ToggleButtonGroup>
//                         </Box>
//
//                         {chartView === 'monthly' ? (
//                             <Box sx={{ height: 250, mb: 3 }}>
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <LineChart data={dailySpendingData}>
//                                         <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
//                                         <XAxis
//                                             dataKey="date"
//                                             tick={{ fontSize: 10 }}
//                                             stroke={theme.palette.text.secondary}
//                                         />
//                                         <YAxis
//                                             tick={{ fontSize: 10 }}
//                                             stroke={theme.palette.text.secondary}
//                                             tickFormatter={(value) => `$${value.toFixed(0)}`}
//                                         />
//                                         <RechartsTooltip
//                                             formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative Spending']}
//                                             contentStyle={{
//                                                 backgroundColor: alpha(theme.palette.background.paper, 0.95),
//                                                 border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
//                                                 borderRadius: 8
//                                             }}
//                                         />
//                                         <Line
//                                             type="monotone"
//                                             dataKey="spending"
//                                             stroke={progressColor}
//                                             strokeWidth={2}
//                                             dot={{ fill: progressColor, r: 3 }}
//                                             activeDot={{ r: 5 }}
//                                         />
//                                     </LineChart>
//                                 </ResponsiveContainer>
//                             </Box>
//                         ) : (
//                             <Box sx={{ height: 250, mb: 3 }}>
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={weekComparisonData}>
//                                         <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
//                                         <XAxis
//                                             dataKey="day"
//                                             tick={{ fontSize: 10 }}
//                                             stroke={theme.palette.text.secondary}
//                                         />
//                                         <YAxis
//                                             tick={{ fontSize: 10 }}
//                                             stroke={theme.palette.text.secondary}
//                                             tickFormatter={(value) => `$${value.toFixed(0)}`}
//                                         />
//                                         <RechartsTooltip
//                                             formatter={(value: number) => `$${value.toFixed(2)}`}
//                                             contentStyle={{
//                                                 backgroundColor: alpha(theme.palette.background.paper, 0.95),
//                                                 border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
//                                                 borderRadius: 8
//                                             }}
//                                         />
//                                         <Legend />
//                                         <Bar dataKey="currentWeek" fill={progressColor} name="Current Week" radius={[4, 4, 0, 0]} />
//                                         <Bar dataKey="lastWeek" fill={alpha(progressColor, 0.5)} name="Last Week" radius={[4, 4, 0, 0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </Box>
//                         )}
//                     </>
//                 )}
//
//                 <Divider sx={{ my: 3 }} />
//
//                 {/* Stats Grid */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Category Stats
//                 </Typography>
//
//                 <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//                     <Box sx={{
//                         p: 2,
//                         backgroundColor: alpha('#2563eb', 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha('#2563eb', 0.2)}`
//                     }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                             Budgeted
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color="#2563eb">
//                             ${category.budgetedAmount.toFixed(2)}
//                         </Typography>
//                     </Box>
//                     <Box sx={{
//                         p: 2,
//                         backgroundColor: alpha(progressColor, 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha(progressColor, 0.2)}`
//                     }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                             Actual Spent
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color={progressColor}>
//                             ${category.actualAmount.toFixed(2)}
//                         </Typography>
//                     </Box>
//                     <Box sx={{
//                         p: 2,
//                         backgroundColor: alpha(category.remainingAmount >= 0 ? '#059669' : '#dc2626', 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha(category.remainingAmount >= 0 ? '#059669' : '#dc2626', 0.2)}`
//                     }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                             Remaining
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color={category.remainingAmount >= 0 ? '#059669' : '#dc2626'}>
//                             {category.remainingAmount >= 0 ? '' : '-'}${Math.abs(category.remainingAmount).toFixed(2)}
//                         </Typography>
//                     </Box>
//                     <Box sx={{
//                         p: 2,
//                         backgroundColor: alpha(maroonColor, 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha(maroonColor, 0.2)}`
//                     }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                             Usage
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                             {percentage.toFixed(1)}%
//                         </Typography>
//                     </Box>
//                 </Box>
//             </Box>
//         );
//     };
//
//     const renderGoalsView = () => {
//         const goalColor = goalProgress < 70 ? '#dc2626' : goalProgress < 90 ? '#f59e0b' : tealColor;
//
//         return (
//             <Box>
//                 {/* Savings Goal Progress */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Savings Goal Progress
//                 </Typography>
//
//                 <Card sx={{
//                     p: 2.5,
//                     mb: 3,
//                     background: `linear-gradient(135deg, ${alpha(goalColor, 0.1)} 0%, ${alpha(goalColor, 0.05)} 100%)`,
//                     border: `1px solid ${alpha(goalColor, 0.2)}`
//                 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
//                         <Box>
//                             <Typography variant="caption" color="text.secondary">
//                                 Current Savings
//                             </Typography>
//                             <Typography variant="h4" fontWeight={700} color={maroonColor}>
//                                 ${currentSavings.toFixed(2)}
//                             </Typography>
//                         </Box>
//                         <Box sx={{ textAlign: 'right' }}>
//                             <Typography variant="caption" color="text.secondary">
//                                 Monthly Goal
//                             </Typography>
//                             <Typography variant="h5" fontWeight={600}>
//                                 ${monthlyGoal.toFixed(2)}
//                             </Typography>
//                         </Box>
//                     </Box>
//                     <LinearProgress
//                         variant="determinate"
//                         value={Math.min(goalProgress, 100)}
//                         sx={{
//                             height: 10,
//                             borderRadius: 5,
//                             backgroundColor: `${goalColor}20`,
//                             '& .MuiLinearProgress-bar': {
//                                 backgroundColor: goalColor,
//                                 borderRadius: 5
//                             }
//                         }}
//                     />
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
//                         <Typography variant="caption" fontWeight={600} color={goalColor}>
//                             {goalProgress.toFixed(0)}% Complete
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                             ${Math.max(monthlyGoal - currentSavings, 0).toFixed(2)} to go
//                         </Typography>
//                     </Box>
//                 </Card>
//
//                 <Divider sx={{ my: 3 }} />
//
//                 {/* Month Progress */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Month Progress
//                 </Typography>
//
//                 <Box sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     p: 2,
//                     mb: 3,
//                     backgroundColor: alpha(tealColor, 0.05),
//                     borderRadius: 2,
//                     border: `1px solid ${alpha(tealColor, 0.2)}`
//                 }}>
//                     <Box>
//                         <Typography variant="caption" color="text.secondary">
//                             Days Elapsed
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                             {daysElapsed}
//                         </Typography>
//                     </Box>
//                     <Box sx={{ textAlign: 'center' }}>
//                         <Typography variant="caption" color="text.secondary">
//                             Progress
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600}>
//                             {((daysElapsed / daysInMonth) * 100).toFixed(0)}%
//                         </Typography>
//                     </Box>
//                     <Box sx={{ textAlign: 'right' }}>
//                         <Typography variant="caption" color="text.secondary">
//                             Days Remaining
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                             {daysRemaining}
//                         </Typography>
//                     </Box>
//                 </Box>
//
//                 <Divider sx={{ my: 3 }} />
//
//                 {/* Spending Analysis */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Spending Analysis
//                 </Typography>
//
//                 <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
//                     <Box sx={{
//                         p: 2,
//                         backgroundColor: alpha(maroonColor, 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha(maroonColor, 0.2)}`
//                     }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                             Daily Budget
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                             ${dailyBudget.toFixed(2)}
//                         </Typography>
//                     </Box>
//                     <Box sx={{
//                         p: 2,
//                         backgroundColor: actualDailySpending > dailyBudget
//                             ? alpha('#dc2626', 0.05)
//                             : alpha('#059669', 0.05),
//                         borderRadius: 2,
//                         border: `1px solid ${alpha(actualDailySpending > dailyBudget ? '#dc2626' : '#059669', 0.2)}`
//                     }}>
//                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
//                             Actual Daily
//                         </Typography>
//                         <Typography variant="h6" fontWeight={600}
//                                     color={actualDailySpending > dailyBudget ? '#dc2626' : '#059669'}>
//                             ${actualDailySpending.toFixed(2)}
//                         </Typography>
//                     </Box>
//                 </Box>
//
//                 <Divider sx={{ my: 3 }} />
//
//                 {/* Projection */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     End of Month Projection
//                 </Typography>
//
//                 <Card sx={{
//                     p: 2.5,
//                     mb: 3,
//                     background: onTrack
//                         ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
//                         : 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
//                     border: `1px solid ${alpha(onTrack ? '#059669' : '#dc2626', 0.2)}`
//                 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                         {onTrack ? (
//                             <TrendingUpIcon sx={{ color: '#059669' }} />
//                         ) : (
//                             <TrendingDownIcon sx={{ color: '#dc2626' }} />
//                         )}
//                         <Typography variant="body1" fontWeight={600}>
//                             Projected Savings: ${projectedSavings.toFixed(2)}
//                         </Typography>
//                     </Box>
//                     <Typography variant="body2" color="text.secondary">
//                         At current spending rate, projected to end month with{' '}
//                         <Typography component="span" fontWeight={600} color={onTrack ? '#059669' : '#dc2626'}>
//                             ${Math.abs(projectedSavings - monthlyGoal).toFixed(2)}
//                         </Typography>
//                         {' '}{onTrack ? 'above' : 'below'} your goal
//                     </Typography>
//                 </Card>
//
//                 {/* Key Insights */}
//                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Key Insights
//                 </Typography>
//
//                 <Stack spacing={1.5}>
//                     {onTrack && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#059669', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #059669`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#059669">
//                                 ✓ On track to meet monthly goal
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Continue current spending habits to reach your ${monthlyGoal.toFixed(2)} savings target
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {!onTrack && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#dc2626', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #dc2626`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#dc2626">
//                                 ⚠ May not meet monthly goal
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Need to reduce daily spending to meet goal
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {actualDailySpending > dailyBudget && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#f59e0b', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #f59e0b`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#f59e0b">
//                                 Spending above daily budget
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Averaging ${(actualDailySpending - dailyBudget).toFixed(2)} over daily budget
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {actualDailySpending <= dailyBudget && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#059669', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #059669`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#059669">
//                                 Staying within daily budget
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Averaging ${(dailyBudget - actualDailySpending).toFixed(2)} under daily budget
//                             </Typography>
//                         </Box>
//                     )}
//
//                     {daysRemaining <= 7 && goalProgress < 100 && (
//                         <Box sx={{
//                             p: 2,
//                             backgroundColor: alpha('#f59e0b', 0.05),
//                             borderRadius: 2,
//                             borderLeft: `4px solid #f59e0b`
//                         }}>
//                             <Typography variant="body2" fontWeight={500} color="#f59e0b">
//                                 Final week - goal not reached
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Need to save ${((monthlyGoal - currentSavings) / daysRemaining).toFixed(2)} per day to reach goal
//                             </Typography>
//                         </Box>
//                     )}
//                 </Stack>
//             </Box>
//         );
//     };
//
//     return (
//         <Paper sx={{
//             borderRadius: 4,
//             boxShadow: 3,
//             overflow: 'hidden',
//             display: 'flex',
//             flexDirection: 'column'
//         }}>
//             {/* Maroon Gradient Header */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                 color: 'white',
//                 p: 3
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <PieChartIcon />
//                         <Typography variant="h6" fontWeight={600}>
//                             Budget Analysis
//                         </Typography>
//                     </Box>
//
//                     {/* View Toggle */}
//                     <ToggleButtonGroup
//                         value={selectedView}
//                         exclusive
//                         onChange={handleViewChange}
//                         size="small"
//                         sx={{
//                             '& .MuiToggleButton-root': {
//                                 color: 'rgba(255, 255, 255, 0.7)',
//                                 border: '1px solid rgba(255, 255, 255, 0.3)',
//                                 py: 0.5,
//                                 px: 1.5,
//                                 fontSize: '0.7rem',
//                                 fontWeight: 600,
//                                 textTransform: 'none',
//                                 '&.Mui-selected': {
//                                     bgcolor: 'rgba(255, 255, 255, 0.2)',
//                                     color: 'white',
//                                     '&:hover': {
//                                         bgcolor: 'rgba(255, 255, 255, 0.25)'
//                                     }
//                                 },
//                                 '&:hover': {
//                                     bgcolor: 'rgba(255, 255, 255, 0.1)'
//                                 }
//                             }
//                         }}
//                     >
//                         <ToggleButton value="stats">Stats</ToggleButton>
//                         <ToggleButton value="recurring">Recurring</ToggleButton>
//                         <ToggleButton value="category">Category</ToggleButton>
//                         <ToggleButton value="goals">Goals</ToggleButton>
//                     </ToggleButtonGroup>
//                 </Box>
//                 <Typography variant="caption" sx={{ opacity: 0.9 }}>
//                     {budgetStats.dateRange.startDate &&
//                         `${budgetStats.dateRange.startDate.toLocaleDateString()} - ${budgetStats.dateRange.endDate.toLocaleDateString()}`
//                     }
//                 </Typography>
//             </Box>
//
//             {/* Content Area with Scrollbar */}
//             <Box sx={{
//                 flex: 1,
//                 overflowY: 'auto',
//                 p: 3,
//                 maxHeight: 'calc(100vh - 300px)',
//                 '&::-webkit-scrollbar': {
//                     width: '8px',
//                 },
//                 '&::-webkit-scrollbar-track': {
//                     backgroundColor: 'rgba(0,0,0,0.05)',
//                 },
//                 '&::-webkit-scrollbar-thumb': {
//                     backgroundColor: tealColor,
//                     borderRadius: '4px',
//                     '&:hover': {
//                         backgroundColor: '#0f766e',
//                     },
//                 },
//             }}>
//                 {isLoading ? (
//                     <Box sx={{ textAlign: 'center', py: 4 }}>
//                         <Typography variant="body2" color="text.secondary">
//                             Loading...
//                         </Typography>
//                     </Box>
//                 ) : (
//                     <>
//                         {selectedView === 'stats' && renderStatsView()}
//                         {selectedView === 'recurring' && renderRecurringView()}
//                         {selectedView === 'category' && renderCategoryView()}
//                         {selectedView === 'goals' && renderGoalsView()}
//                     </>
//                 )}
//             </Box>
//         </Paper>
//     );
// };
//
// export default DynamicBudgetPanel;