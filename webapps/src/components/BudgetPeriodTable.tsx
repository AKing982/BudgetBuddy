import React, {useEffect, useMemo, useState} from "react";
import {
    addDays, differenceInDays, endOfMonth, format,
    isSameDay, isValid, isWithinInterval, startOfMonth
} from 'date-fns';
import {
    Box, Button, ButtonGroup, IconButton, Paper, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, ToggleButtonGroup, ToggleButton, alpha, useTheme,
    Card, Grid, LinearProgress, Chip
} from '@mui/material';
import {styled} from "@mui/material/styles";
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend, Sector
} from 'recharts';
import {BudgetRunnerResult} from "../services/BudgetRunnerService";
import {BudgetPeriodCategory, SubBudget} from "../utils/Items";
import BudgetPeriodService from "../services/BudgetPeriodService";
import {Period} from '../config/Types';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Table as TableIcon, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { Stack } from '@mui/material';

import BudgetCategoryCard from './BudgetCategoryCard';
import { parseISO } from 'date-fns';

// ── Tokens ────────────────────────────────────────────────────────────────────
const MAROON = '#6b1a1a';
const TEAL   = '#0d9488';
const SLATE  = '#64748b';

// A rich categorical palette that works well together
const CHART_PALETTE = [
    '#6b1a1a', '#0d9488', '#2563eb', '#d97706', '#7c3aed',
    '#059669', '#dc2626', '#0891b2', '#9333ea', '#ca8a04',
    '#16a34a', '#e11d48', '#0284c7', '#7e22ce', '#b45309',
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface BudgetCategory { name: string; monthlyBudget: number; monthlyActual: number; }
interface BudgetPeriodTableProps { isLoading: boolean; data: BudgetRunnerResult[]; }
type BudgetPeriod  = 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly' | 'Custom';
type ViewType      = 'visual' | 'numeric' | 'chart';
type CustomFilter  = 'dates' | 'income';
interface ProcessedRow { name: string; budgeted: number; actual: number; remaining: number; startRange: Date; endRange: Date; }

const PERIOD_MAPPING: Record<Exclude<BudgetPeriod,'Custom'>, Period> = {
    'Daily': Period.DAILY, 'Weekly': Period.WEEKLY,
    'BiWeekly': Period.BIWEEKLY, 'Monthly': Period.MONTHLY,
};

// ── Custom active pie shape ───────────────────────────────────────────────────
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 14} textAnchor="middle" fill="#111" style={{ fontSize: 13, fontWeight: 800 }}>
                {payload.name.length > 16 ? payload.name.slice(0,15)+'…' : payload.name}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" fill={fill} style={{ fontSize: 18, fontWeight: 800 }}>
                ${value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
            </text>
            <text x={cx} y={cy + 28} textAnchor="middle" fill={SLATE} style={{ fontSize: 11, fontWeight: 600 }}>
                {(percent * 100).toFixed(1)}% of spending
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
                    startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15}
                    startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

// ── Chart view ────────────────────────────────────────────────────────────────
const ChartView: React.FC<{ categories: BudgetPeriodCategory[]; rangeLabel: string }> = ({ categories, rangeLabel }) => {
    const [activeIdx, setActiveIdx] = useState(0);

    console.log('ChartView categories:', categories);
    const spenders = categories
        .filter(c => (c.actual || 0) > 0)
        .sort((a, b) => (b.actual || 0) - (a.actual || 0));

    const totalActual   = spenders.reduce((s, c) => s + (c.actual   || 0), 0);
    const totalBudgeted = spenders.reduce((s, c) => s + (c.budgeted || 0), 0);
    const totalRemaining = totalBudgeted - totalActual;
    const overallPct    = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
    const overallColor  = overallPct < 70 ? TEAL : overallPct < 90 ? '#d97706' : '#dc2626';

    const pieData = spenders.map((c, i) => ({
        name:     c.category,
        value:    c.actual || 0,
        budgeted: c.budgeted || 0,
        remaining:c.remaining || 0,
        color:    CHART_PALETTE[i % CHART_PALETTE.length],
    }));

    if (!spenders.length) return (
        <Box sx={{ p: 4, textAlign: 'center', color: SLATE }}>
            <Typography variant="body2">No spending data for this period.</Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 2.5 }}>
            {/* ── Period summary strip ── */}
            <Box sx={{
                display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap',
            }}>
                {[
                    { label: 'Total Budgeted', value: `$${totalBudgeted.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, color: MAROON },
                    { label: 'Total Spent',    value: `$${totalActual.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,   color: overallColor },
                    { label: totalRemaining >= 0 ? 'Remaining' : 'Over Budget',
                        value: `$${Math.abs(totalRemaining).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,
                        color: totalRemaining >= 0 ? '#059669' : '#dc2626' },
                    { label: 'Categories',     value: `${spenders.length}`,   color: SLATE },
                ].map(({ label, value, color }) => (
                    <Box key={label} sx={{
                        flex: '1 1 120px', p: 1.5, borderRadius: '10px',
                        bgcolor: alpha(color, 0.06),
                        border: `1px solid ${alpha(color, 0.18)}`,
                    }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.4 }}>
                            {label}
                        </Typography>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Pie + legend ── */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* Pie chart */}
                <Box sx={{ flexShrink: 0, width: 280, height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                activeIndex={activeIdx}
                                activeShape={renderActiveShape}
                                data={pieData}
                                cx="50%" cy="50%"
                                innerRadius={72} outerRadius={108}
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={(_, idx) => setActiveIdx(idx)}
                            >
                                {pieData.map((e, i) => (
                                    <Cell key={i} fill={e.color} stroke="white" strokeWidth={1.5} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </Box>

                {/* Legend / category list */}
                <Box sx={{ flex: 1, minWidth: 220, maxHeight: 280, overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.25), borderRadius: 3 },
                }}>
                    <Stack spacing={0.75}>
                        {pieData.map((entry, i) => {
                            const isActive = i === activeIdx;
                            const pct = totalActual > 0 ? (entry.value / totalActual) * 100 : 0;
                            const catPct = entry.budgeted > 0 ? (entry.value / entry.budgeted) * 100 : 0;
                            const catColor = catPct < 70 ? TEAL : catPct < 90 ? '#d97706' : '#dc2626';
                            return (
                                <Box
                                    key={i}
                                    onMouseEnter={() => setActiveIdx(i)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.25,
                                        p: 1.25, borderRadius: '8px', cursor: 'pointer',
                                        border: `1px solid ${isActive ? alpha(entry.color, 0.35) : 'transparent'}`,
                                        bgcolor: isActive ? alpha(entry.color, 0.07) : 'transparent',
                                        transition: 'all 0.15s ease',
                                        '&:hover': { bgcolor: alpha(entry.color, 0.06) },
                                    }}
                                >
                                    {/* Color dot */}
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />

                                    {/* Name + bar */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                            <Typography sx={{ fontSize: '0.73rem', fontWeight: isActive ? 800 : 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                                                {entry.name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: entry.color, fontVariantNumeric: 'tabular-nums', flexShrink: 0, ml: 0.5 }}>
                                                ${entry.value.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}
                                            </Typography>
                                        </Box>
                                        {/* Mini progress bar */}
                                        <Box sx={{ height: 3, borderRadius: 99, bgcolor: alpha(catColor, 0.12), overflow: 'hidden' }}>
                                            <Box sx={{ height: '100%', width: `${Math.min(catPct,100)}%`, bgcolor: catColor, borderRadius: 99, transition: 'width 0.4s' }} />
                                        </Box>
                                    </Box>

                                    {/* Share % */}
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
                                        {pct.toFixed(0)}%
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

// ── Need Stack for the legend ─────────────────────────────────────────────────

// ── Main component ────────────────────────────────────────────────────────────
const BudgetPeriodTable: React.FC<BudgetPeriodTableProps> = ({isLoading, data}) => {
    const theme = useTheme();
    const [budgetPeriod,    setBudgetPeriod]    = useState<BudgetPeriod>('Monthly');
    const [selectedDate,    setSelectedDate]    = useState<Date | null>(new Date());
    const [periodData,      setPeriodData]      = useState<BudgetPeriodCategory[]>([]);
    const [isLoadingData,   setIsLoadingData]   = useState(false);
    const [expandedRanges,  setExpandedRanges]  = useState<Set<string>>(new Set());
    const [viewType,        setViewType]        = useState<ViewType>('chart');
    const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
    const [customEndDate,   setCustomEndDate]   = useState<Date | null>(null);
    const [customFilterType,setCustomFilterType]= useState<CustomFilter>('dates');

    const budgetPeriodService = BudgetPeriodService.getInstance();

    const toggleRangeExpansion = (key: string) => {
        setExpandedRanges(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const getBudgetPeriodData = async (period: Period, userId: number, start: string, end: string, single: string): Promise<BudgetPeriodCategory[]> => {
        switch (period) {
            case Period.WEEKLY:   return (await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, start, end)).budgetPeriodCategories;
            case Period.BIWEEKLY: return (await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, start, end)).budgetPeriodCategories;
            case Period.MONTHLY:  return (await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, start, end)).budgetPeriodCategories;
            case Period.DAILY:    return (await budgetPeriodService.getDailyBudgetPeriodCategories(userId, single)).budgetPeriodCategories;
            default: throw new Error('Invalid Period');
        }
    };

    const fetchBudgetPeriodData = async (period: BudgetPeriod, subBudget: SubBudget) => {
        if (!selectedDate || !subBudget) return;
        setIsLoadingData(true);
        try {
            if (period === 'Custom') { setIsLoadingData(false); return; }
            const userId = Number(sessionStorage.getItem('userId'));
            const s = parseISO(subBudget.startDate as unknown as string);
            const e = parseISO(subBudget.endDate as unknown as string);
            console.log('Start Date: {}{},{}', s.getDate(), s.getMonth()+1, s.getFullYear());
            console.log('End Date: {}{},{}', e.getDate(), e.getMonth()+1, e.getFullYear());
            const result = await getBudgetPeriodData(
                PERIOD_MAPPING[period], userId,
                format(s,'yyyy-MM-dd'), format(e,'yyyy-MM-dd'),
                period === 'Daily' ? format(selectedDate,'yyyy-MM-dd') : ''
            );
            setPeriodData(dedupeCategories(result));
        } catch (err) {
            console.error('Error fetching period data:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (data?.[0]?.subBudget) fetchBudgetPeriodData(budgetPeriod, data[0].subBudget);
    }, [budgetPeriod, selectedDate, data?.[0]?.subBudget, customStartDate, customEndDate]);

    const dedupeCategories = (cats: BudgetPeriodCategory[]): BudgetPeriodCategory[] => {
        const byName = new Map<string, BudgetPeriodCategory>();

        cats.forEach(cat => {
            const key = cat.category?.trim().toLowerCase();
            if (!key) return;

            const existing = byName.get(key);
            if (!existing) {
                byName.set(key, cat);
                return;
            }

            // Keep whichever record has the more complete/non-zero budgeted amount.
            // If both are non-zero and disagree, log it — that's not a simple duplicate.
            if (existing.budgeted !== cat.budgeted && existing.budgeted > 0 && cat.budgeted > 0) {
                console.warn(
                    `Duplicate category "${cat.category}" with conflicting budgeted amounts (${existing.budgeted} vs ${cat.budgeted}) — keeping the larger one.`,
                    existing, cat
                );
            }

            const keep = (cat.budgeted || 0) > (existing.budgeted || 0) ? cat : existing;
            byName.set(key, keep);
        });

        return Array.from(byName.values());
    };

    // ── Date range extraction ──────────────────────────────────────────────────
    const getDateRanges = (subBudget: SubBudget) => {
        if (!periodData?.length || !selectedDate || !subBudget) return [];
        const sub_s = parseISO(subBudget.startDate as unknown as string);
        const sub_e = parseISO(subBudget.endDate as unknown as string);
        const uniqueRanges = new Map<string, [Date,Date]>();
        periodData.forEach(cat => {
            try {
                if (budgetPeriod === 'BiWeekly' && cat.biWeekRanges?.length) {
                    cat.biWeekRanges.forEach(r => {
                        const s = parseISO(r.startDate as unknown as string);
                        const e = parseISO(r.endDate as unknown as string);
                        if (isWithinInterval(s,{start:sub_s,end:sub_e}) && isWithinInterval(e,{start:sub_s,end:sub_e})) {
                            const k = `${format(s,'yyyy-MM-dd')}-${format(e,'yyyy-MM-dd')}`;
                            if (!uniqueRanges.has(k)) uniqueRanges.set(k,[s,e]);
                        }
                    });
                } else if (cat.dateRange?.startDate && cat.dateRange?.endDate) {
                    const s = parseISO(cat.dateRange.startDate as unknown as string);
                    const e = parseISO(cat.dateRange.endDate as unknown as string);
                    const k = `${format(s,'yyyy-MM-dd')}-${format(e,'yyyy-MM-dd')}`;
                    if (!uniqueRanges.has(k)) uniqueRanges.set(k,[s,e]);
                }
            } catch (err) { console.error(err, cat); }
        });

        return Array.from(uniqueRanges.values())
            .sort((a,b) => a[0].getTime()-b[0].getTime())
            .filter(([s]) => {
                switch (budgetPeriod) {
                    case 'Daily':    return isSameDay(s, selectedDate!);
                    case 'Weekly':   return isWithinInterval(s,{start:sub_s,end:sub_e});
                    case 'BiWeekly': return isWithinInterval(s,{start:sub_s,end:sub_e});
                    case 'Monthly':  return isWithinInterval(s,{start:sub_s,end:sub_e});
                    default: return true;
                }
            });
    };

    const getCategoriesForRange = (start: Date, end: Date) =>
        periodData.filter(cat => {
            if (budgetPeriod === 'BiWeekly' && cat.biWeekRanges?.length) {
                return cat.biWeekRanges.some(r => {
                    const s = parseISO(r.startDate as unknown as string);
                    const e = parseISO(r.endDate as unknown as string);
                    return isSameDay(s, start) && isSameDay(e, end);
                });
            }
            if (cat.dateRange?.startDate && cat.dateRange?.endDate) {
                const s = parseISO(cat.dateRange.startDate as unknown as string);
                const e = parseISO(cat.dateRange.endDate as unknown as string);
                return isSameDay(s, start) && isSameDay(e, end);
            }
            return false;
        });

    // const getCategoriesForRange = (start: Date, end: Date) =>
    //     periodData.filter(cat => {
    //         if (budgetPeriod === 'BiWeekly' && cat.biWeekRanges?.length) {
    //             return cat.biWeekRanges.some(r => {
    //                 const sa = (r.startDate as unknown) as number[];
    //                 const ea = (r.endDate   as unknown) as number[];
    //                 return isSameDay(new Date(+sa[0],+sa[1]-1,+sa[2]), start)
    //                     && isSameDay(new Date(+ea[0],+ea[1]-1,+ea[2]), end);
    //             });
    //         }
    //         if (cat.dateRange?.startDate && cat.dateRange?.endDate) {
    //             const sa = (cat.dateRange.startDate as unknown) as number[];
    //             const ea = (cat.dateRange.endDate   as unknown) as number[];
    //             return isSameDay(new Date(+sa[0],+sa[1]-1,+sa[2]), start)
    //                 && isSameDay(new Date(+ea[0],+ea[1]-1,+ea[2]), end);
    //         }
    //         return false;
    //     });

    // ── Styled components ──────────────────────────────────────────────────────
    const StyledButton = styled(Button)(() => ({
        textTransform: 'none', fontWeight: 600, padding: '6px 14px',
        borderRadius: '6px', fontSize: '0.78rem',
        color: MAROON, borderColor: alpha(MAROON, 0.35),
        '&:hover': { backgroundColor: alpha(MAROON, 0.04), borderColor: MAROON },
        '&.MuiButton-contained': {
            backgroundColor: MAROON, color: 'white',
            '&:hover': { backgroundColor: '#4a1010' },
        },
    }));
    const StyledButtonGroup = styled(ButtonGroup)(() => ({
        '& .MuiButtonGroup-grouped': {
            border: `1px solid ${alpha(MAROON, 0.35)}`,
            '&:not(:last-of-type)': { borderRight: `1px solid ${alpha(MAROON, 0.35)}` },
        },
    }));

    // ── Render visual (cards) ──────────────────────────────────────────────────
    const renderVisualView = (cats: BudgetPeriodCategory[]) => {
        if (!cats?.length) return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">No budget categories found</Typography>
            </Box>
        );
        return (
            <Box sx={{ p: 2 }}>
                <Grid container spacing={1.5}>
                    {cats.map((cat, i) => (
                        <Grid item xs={12} sm={6} md={4} key={`${cat.category}-${i}`}>
                            <BudgetCategoryCard
                                categoryName={cat.category}
                                budgeted={cat.budgeted || 0}
                                actual={cat.actual || 0}
                                remaining={cat.remaining || 0}
                                compact
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (isLoading) return (
        <Box>
            <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                {/* ── Header row ── */}
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2.5 }}>
                    <Typography sx={{ fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color: alpha(MAROON,0.6) }}>
                        Budget Period Overview
                    </Typography>

                    {/* 3-way view toggle */}
                    <ToggleButtonGroup
                        value={viewType} exclusive
                        onChange={(_, v) => v && setViewType(v)}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                py: 0.45, px: 1.4, fontSize: '0.68rem', fontWeight: 700,
                                textTransform: 'none',
                                border: `1px solid ${alpha(MAROON, 0.28)}`,
                                color: MAROON,
                                '&.Mui-selected': { bgcolor: alpha(MAROON, 0.10), color: MAROON },
                                '&:hover': { bgcolor: alpha(MAROON, 0.05) },
                            }
                        }}
                    >
                        <ToggleButton value="visual">
                            <BarChart3 size={13} style={{ marginRight: 5 }} /> Cards
                        </ToggleButton>
                        <ToggleButton value="chart">
                            <PieIcon size={13} style={{ marginRight: 5 }} /> Chart
                        </ToggleButton>
                        <ToggleButton value="numeric">
                            <TableIcon size={13} style={{ marginRight: 5 }} /> Table
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* ── Period selector ── */}
                <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <StyledButtonGroup variant="outlined">
                            {(['Daily','Weekly','BiWeekly','Monthly','Custom'] as BudgetPeriod[]).map(p => (
                                <StyledButton key={p} onClick={() => setBudgetPeriod(p)}
                                              variant={budgetPeriod === p ? 'contained' : 'outlined'}>
                                    {p === 'BiWeekly' ? 'Bi-Weekly' : p}
                                </StyledButton>
                            ))}
                        </StyledButtonGroup>
                        <DatePicker label="Select Date" value={selectedDate}
                                    onChange={v => setSelectedDate(v)} disabled={budgetPeriod !== 'Daily'} />
                    </Box>

                    {budgetPeriod === 'Custom' && (
                        <Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight:600, mr:1 }}>Filter by:</Typography>
                            {(['dates','income'] as CustomFilter[]).map(f => (
                                <Chip key={f} label={f==='dates'?'Custom Dates':'By Income'}
                                      onClick={() => setCustomFilterType(f)}
                                      variant={customFilterType===f?'filled':'outlined'}
                                      sx={{ fontWeight:600, fontSize:'0.75rem',
                                          ...(customFilterType===f && { bgcolor:alpha(MAROON,0.1), color:MAROON, borderColor:alpha(MAROON,0.4) }) }} />
                            ))}
                        </Box>
                    )}
                    {budgetPeriod === 'Custom' && customFilterType === 'dates' && (
                        <Box sx={{ display:'flex', gap:2 }}>
                            <DatePicker label="Start Date" value={customStartDate} onChange={v => setCustomStartDate(v)} />
                            <DatePicker label="End Date"   value={customEndDate}   onChange={v => setCustomEndDate(v)} minDate={customStartDate||undefined} />
                        </Box>
                    )}
                </Box>

                {/* ── Content panel ── */}
                <Paper elevation={0} sx={{
                    borderRadius: '14px', overflow: 'hidden',
                    border: `1px solid ${alpha(MAROON, 0.12)}`,
                    boxShadow: `0 2px 12px rgba(0,0,0,0.07)`,
                }}>
                    {/* Numeric header row — only in table view */}
                    {viewType === 'numeric' && (
                        <Table sx={{ tableLayout:'fixed' }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(MAROON, 0.04) }}>
                                    {['Category','Budgeted','Actual','Remaining'].map((h, i) => (
                                        <TableCell key={h} align={i===0?'left':'right'} sx={{
                                            fontWeight:800, color:MAROON, fontSize:'0.78rem',
                                            width: i===0?'40%':'20%',
                                            py: 1.25, borderBottom: `2px solid ${alpha(MAROON,0.15)}`,
                                        }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                        </Table>
                    )}

                    {/* Body */}
                    {isLoadingData ? (
                        <Box sx={{ p: 3 }}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                        </Box>
                    ) : !data?.[0]?.subBudget ? (
                        <Box sx={{ p: 4, textAlign:'center', color:SLATE, fontStyle:'italic' }}>
                            <Typography variant="body2">No budget data available.</Typography>
                        </Box>
                    ) : (() => {
                        const subBudget   = data[0].subBudget!;
                        const dateRanges  = getDateRanges(subBudget);

                        if (!dateRanges.length) return (
                            <Box sx={{ p: 4, textAlign:'center', color:SLATE }}>
                                <Typography variant="body2">No date ranges available for this period.</Typography>
                            </Box>
                        );

                        return dateRanges.map(([start, end], ri) => {
                            const rangeKey    = `${format(start,'yyyy-MM-dd')}-${format(end,'yyyy-MM-dd')}`;
                            const isExpanded  = expandedRanges.has(rangeKey);
                            const isLast      = ri === dateRanges.length - 1;
                            console.log(`Retrieving categories for start ${start} and end ${end}`)
                            const cats        = getCategoriesForRange(start, end);
                            const rangeLabel  = `${format(start,'MMM dd')} – ${format(end,'MMM dd, yyyy')}`;

                            return (
                                <Box key={rangeKey} sx={{ borderBottom: isLast ? 'none' : `1px solid ${alpha(MAROON,0.07)}` }}>
                                    {/* ── Range header ── */}
                                    <Box onClick={() => toggleRangeExpansion(rangeKey)} sx={{
                                        display:'flex', alignItems:'center', justifyContent:'space-between',
                                        px: 2.5, py: 1.5, cursor:'pointer',
                                        borderLeft: `4px solid ${MAROON}`,
                                        bgcolor: isExpanded ? alpha(MAROON, 0.03) : '#fff',
                                        transition: 'background 0.15s',
                                        '&:hover': { bgcolor: alpha(MAROON, 0.04) },
                                    }}>
                                        <Box sx={{ display:'flex', alignItems:'center', gap: 1.25 }}>
                                            <IconButton size="small" sx={{ color:MAROON, bgcolor:alpha(MAROON,0.06), '&:hover':{ bgcolor:alpha(MAROON,0.12) } }}>
                                                {isExpanded ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small"/>}
                                            </IconButton>
                                            <Typography sx={{ fontWeight:700, fontSize:'0.85rem', color:MAROON }}>
                                                {rangeLabel}
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            px: 1.25, py: 0.3, borderRadius:'20px',
                                            bgcolor: alpha(MAROON, 0.08),
                                            border: `1px solid ${alpha(MAROON,0.2)}`,
                                        }}>
                                            <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:MAROON }}>
                                                {cats.length} {cats.length === 1 ? 'category' : 'categories'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* ── Expanded content ── */}
                                    {isExpanded && (
                                        <>
                                            {viewType === 'chart' && (
                                                <ChartView categories={cats} rangeLabel={rangeLabel} />
                                            )}
                                            {viewType === 'visual' && renderVisualView(cats)}
                                            {viewType === 'numeric' && (
                                                <Box sx={{
                                                    maxHeight: 330, overflowY:'auto',
                                                    '&::-webkit-scrollbar':{ width:6 },
                                                    '&::-webkit-scrollbar-thumb':{ bgcolor:alpha(MAROON,0.3), borderRadius:3 },
                                                }}>
                                                    <Table sx={{ tableLayout:'fixed' }}>
                                                        <TableBody>
                                                            {cats.length > 0 ? cats.map((cat, ci) => {
                                                                const over = (cat.remaining||0) < 0;
                                                                return (
                                                                    <TableRow key={`${rangeKey}-${cat.category}-${ci}`} sx={{
                                                                        '&:hover':{ bgcolor:alpha(MAROON,0.03) },
                                                                        borderLeft: `3px solid ${over?'#dc2626':TEAL}`,
                                                                    }}>
                                                                        <TableCell sx={{ width:'40%', fontWeight:600, fontSize:'0.82rem' }}>
                                                                            {cat.category}
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ width:'20%', fontSize:'0.8rem', fontVariantNumeric:'tabular-nums' }}>
                                                                            ${(cat.budgeted||0).toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ width:'20%', fontSize:'0.8rem', fontVariantNumeric:'tabular-nums', fontWeight:700 }}>
                                                                            ${Math.abs(cat.actual||0).toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ width:'20%', fontSize:'0.8rem', fontWeight:800, fontVariantNumeric:'tabular-nums', color:over?'#dc2626':'#059669' }}>
                                                                            ${Math.abs(cat.remaining||0).toFixed(2)}
                                                                            <Typography component="span" sx={{ fontSize:'0.6rem', ml:0.4, fontWeight:600, opacity:0.8 }}>
                                                                                {over?'over':'left'}
                                                                            </Typography>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            }) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} align="center" sx={{ color:SLATE, fontStyle:'italic', py:3 }}>
                                                                        No categories for this range.
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            );
                        });
                    })()}
                </Paper>
            </Box>
        </LocalizationProvider>
    );
};

export default BudgetPeriodTable;


// import React, {useEffect, useMemo, useState} from "react";
// import {
//     addDays,
//     differenceInDays,
//     endOfMonth,
//     format,
//     isSameDay,
//     isValid,
//     isWithinInterval,
//     startOfMonth
// } from 'date-fns';
// import {
//     Box,
//     Button,
//     ButtonGroup,
//     IconButton,
//     Paper,
//     Skeleton,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Typography,
//     ToggleButtonGroup,
//     ToggleButton,
//     alpha,
//     useTheme,
//     Card,
//     Grid,
//     LinearProgress,
//     Chip
// } from '@mui/material';
// import {styled} from "@mui/material/styles";
// import {DatePicker} from '@mui/x-date-pickers/DatePicker';
// import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
// import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
// import {BudgetRunnerResult} from "../services/BudgetRunnerService";
// import {BudgetPeriodCategory, SubBudget} from "../utils/Items";
// import BudgetPeriodService from "../services/BudgetPeriodService";
// import {Period} from '../config/Types';
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import { Table as TableIcon, BarChart3 } from 'lucide-react';


// import BudgetCategoryCard from './BudgetCategoryCard';
//
//
// interface BudgetCategory {
//     name: string;
//     monthlyBudget: number;
//     monthlyActual: number;
// }
//
// interface Category {
//     dateRange: {
//         startDate: Array<number>;
//         endDate: Array<number>;
//     };
// }
//
// interface BudgetPeriodTableProps {
//     isLoading: boolean;
//     data: BudgetRunnerResult[];
// }
//
// type BudgetPeriod = 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly' | 'Custom';
// type CustomFilterType = 'dates' | 'income';
//
// interface ProcessedRow {
//     name: string;
//     budgeted: number;
//     actual: number;
//     remaining: number;
//     startRange: Date;
//     endRange: Date;
// }
//
// const dummyData: BudgetCategory[] = [
//     { name: 'Housing', monthlyBudget: 1500, monthlyActual: 1450 },
//     { name: 'Food', monthlyBudget: 500, monthlyActual: 480 },
//     { name: 'Transportation', monthlyBudget: 300, monthlyActual: 310 },
//     { name: 'Utilities', monthlyBudget: 200, monthlyActual: 190 },
//     { name: 'Entertainment', monthlyBudget: 150, monthlyActual: 200 },
// ];
//
// const PERIOD_MAPPING: Record<Exclude<BudgetPeriod, 'Custom'>, Period> = {
//     'Daily': Period.DAILY,
//     'Weekly': Period.WEEKLY,
//     'BiWeekly': Period.BIWEEKLY,
//     'Monthly': Period.MONTHLY
// };
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// const BudgetPeriodTable: React.FC<BudgetPeriodTableProps> = ({isLoading, data}) => {
//     const theme = useTheme();
//     const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('Monthly');
//     const [startDate, setStartDate] = useState(new Date());
//     const [isClicked, setIsClicked] = useState(false);
//     const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
//     const [periodData, setPeriodData] = useState<BudgetPeriodCategory[]>([]);
//     const [isLoadingData, setIsLoadingData] = useState(false);
//     const budgetPeriodService = BudgetPeriodService.getInstance();
//     const [expandedRanges, setExpandedRanges] = useState<Set<String>>(new Set());
//
//     // NEW: Visual/Numeric toggle
//     const [viewType, setViewType] = useState<'visual' | 'numeric'>('visual');
//
//     // NEW: Custom date range
//     const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
//     const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
//
//     // NEW: Custom filter type (dates or income)
//     const [customFilterType, setCustomFilterType] = useState<CustomFilterType>('dates');
//
//     const toggleRangeExpansion = (rangeKey: string) => {
//         setExpandedRanges(prev => {
//             const newSet = new Set(prev);
//             if (newSet.has(rangeKey)) {
//                 newSet.delete(rangeKey);
//             } else {
//                 newSet.add(rangeKey);
//             }
//             return newSet;
//         });
//     };
//
//     const handleClick = () => {
//         setIsClicked(true);
//         setTimeout(() => setIsClicked(false), 300);
//     };
//
//     const fetchBudgetPeriodData = async (period: BudgetPeriod, subBudget: SubBudget) => {
//         if (!selectedDate || !subBudget) return;
//
//         setIsLoadingData(true);
//         try {
//             const userId : number = Number(sessionStorage.getItem('userId'));
//             const currentDate = selectedDate;
//
//             // Handle Custom period with different filter types
//             if (period === 'Custom') {
//                 if (customFilterType === 'dates') {
//                     if (!customStartDate || !customEndDate) {
//                         setIsLoadingData(false);
//                         return;
//                     }
//                     // TODO: Add custom range backend call when API is ready
//                     setIsLoadingData(false);
//                     return;
//                 } else if (customFilterType === 'income') {
//                     // TODO: Add income period backend call when API is ready
//                     setIsLoadingData(false);
//                     return;
//                 }
//             }
//
//             // Type guard to ensure period is mappable
//             if (period === 'Custom') {
//                 setIsLoadingData(false);
//                 return;
//             }
//
//             const mappedPeriod = PERIOD_MAPPING[period];
//
//             const subBudgetStartDate = new Date(
//                 subBudget.startDate[0],
//                 subBudget.startDate[1] - 1,
//                 subBudget.startDate[2]
//             );
//
//             const subBudgetEndDate = new Date(
//                 subBudget.endDate[0],
//                 subBudget.endDate[1] - 1,
//                 subBudget.endDate[2]
//             );
//
//             const monthStartDate = format(subBudgetStartDate, 'yyyy-MM-dd');
//             const monthEndDate = format(subBudgetEndDate, 'yyyy-MM-dd');
//
//             switch (period) {
//                 case 'Daily':
//                     const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');
//                     const dailyData = await getBudgetPeriodDataByPeriodSelection(
//                         mappedPeriod,
//                         userId,
//                         monthStartDate,
//                         monthEndDate,
//                         selectedDateFormatted
//                     );
//                     setPeriodData(dailyData);
//                     break;
//
//                 case 'Weekly':
//                     const weeklyData = await getBudgetPeriodDataByPeriodSelection(
//                         mappedPeriod,
//                         userId,
//                         monthStartDate,
//                         monthEndDate,
//                         ''
//                     );
//                     setPeriodData(weeklyData);
//                     break;
//
//                 case 'BiWeekly':
//                     const biWeeklyData = await getBudgetPeriodDataByPeriodSelection(
//                         mappedPeriod,
//                         userId,
//                         monthStartDate,
//                         monthEndDate,
//                         ''
//                     );
//                     setPeriodData(biWeeklyData);
//                     break;
//
//                 case 'Monthly':
//                     const monthlyData = await getBudgetPeriodDataByPeriodSelection(
//                         mappedPeriod,
//                         userId,
//                         monthStartDate,
//                         monthEndDate,
//                         ''
//                     );
//                     setPeriodData(monthlyData);
//                     break;
//             }
//         } catch (error) {
//             console.error('Error fetching budget period data:', error);
//         } finally {
//             setIsLoadingData(false);
//         }
//     };
//
//     useEffect(() => {
//         if(data?.[0]?.subBudget){
//             fetchBudgetPeriodData(budgetPeriod, data[0].subBudget);
//         }
//     }, [budgetPeriod, selectedDate, data?.[0]?.subBudget, customStartDate, customEndDate, customFilterType]);
//
//     const handlePeriodChange = (newPeriod: BudgetPeriod) => {
//         setBudgetPeriod(newPeriod);
//     }
//
//     const getBudgetPeriodDataByPeriodSelection = async (period: Period, userId: number, startDate: string, endDate: string, singleDate: string): Promise<BudgetPeriodCategory[]> => {
//         switch (period) {
//             case Period.WEEKLY:
//                 const weeklyBudgetPeriodCategories = await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, startDate, endDate);
//                 return weeklyBudgetPeriodCategories.budgetPeriodCategories;
//             case Period.BIWEEKLY:
//                 console.log(`Getting BiWeekly budget period data for startdate: ${startDate} and endDate: ${endDate}`);
//                 const biWeeklyBudgetPeriodCategories = await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, startDate, endDate);
//                 console.log('BiWeekly Budget Period Categories: ', biWeeklyBudgetPeriodCategories.budgetPeriodCategories);
//                 return biWeeklyBudgetPeriodCategories.budgetPeriodCategories;
//             case Period.MONTHLY:
//                 const monthlyBudgetPeriodCategories = await budgetPeriodService.getBudgetPeriodsByPeriod(userId, period, startDate, endDate);
//                 return monthlyBudgetPeriodCategories.budgetPeriodCategories;
//             case Period.DAILY:
//                 const dateBudgetCategories = await budgetPeriodService.getDailyBudgetPeriodCategories(userId, singleDate);
//                 return dateBudgetCategories.budgetPeriodCategories;
//             default:
//                 throw new Error('Invalid Period found');
//         }
//     }
//
//     const processedData = useMemo(() => {
//         if (!data?.length) return [];
//
//         return data.flatMap((budgetResult) => {
//             const categories = budgetResult.budgetCategoryStats?.budgetPeriodCategories || [];
//             console.log("Categories: ", categories);
//
//             return categories.map((category: BudgetPeriodCategory) => {
//                 const startDateArr = (category.dateRange.startDate as unknown) as number[];
//                 const endDateArr = (category.dateRange.endDate as unknown) as number[];
//                 const startDate = new Date(
//                     Number(startDateArr[0]),
//                     Number(startDateArr[1]) - 1,
//                     Number(startDateArr[2])
//                 );
//                 console.log('Start Date: ', startDate);
//
//                 const endDate = new Date(
//                     Number(endDateArr[0]),
//                     Number(endDateArr[1]) - 1,
//                     Number(endDateArr[2])
//                 );
//                 console.log('End Date: ', endDate);
//
//                 console.log("Processing category:", {
//                     name: category.category,
//                     startDate: format(startDate, 'yyyy-MM-dd'),
//                     endDate: format(endDate, 'yyyy-MM-dd'),
//                     budgeted: category.budgeted,
//                     actual: category.actual,
//                     remaining: category.remaining
//                 });
//
//                 return {
//                     name: category.category,
//                     budgeted: category.budgeted || 0,
//                     actual: category.actual || 0,
//                     remaining: category.remaining || 0,
//                     startRange: startDate,
//                     endRange: endDate
//                 };
//             });
//         });
//     }, [data]);
//
//     useEffect(() => {
//         console.log("Final Processed Data:", processedData);
//     }, [processedData]);
//
//     const StyledButton = styled(Button)(({ theme }) => ({
//         textTransform: 'none',
//         fontWeight: 600,
//         padding: '8px 16px',
//         borderRadius: '8px',
//         transition: 'all 0.3s ease',
//         color: maroonColor,
//         borderColor: maroonColor,
//         '&:hover': {
//             backgroundColor: 'rgba(128, 0, 0, 0.04)',
//             borderColor: maroonColor,
//         },
//         '&.Mui-selected, &.MuiButton-contained': {
//             backgroundColor: maroonColor,
//             color: 'white',
//             '&:hover': {
//                 backgroundColor: '#600000',
//             },
//         },
//     }));
//
//     const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
//         '& .MuiButtonGroup-grouped': {
//             border: `1px solid ${maroonColor}`,
//             '&:not(:last-of-type)': {
//                 borderRight: `1px solid ${maroonColor}`,
//             },
//         },
//     }));
//
//     // NEW: Helper functions for visual view
//     const getProgressColor = (actual: number, budgeted: number) => {
//         if (budgeted === 0) return tealColor;
//         const percentage = (actual / budgeted) * 100;
//         if (percentage < 70) return tealColor;
//         if (percentage < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//     const formatCurrency = (amount: number) => {
//         return `$${Math.abs(amount).toFixed(2)}`;
//     };
//
//     // NEW: Render visual view with compact cards
//     const renderVisualView = (categoriesForRange: BudgetPeriodCategory[], start?: Date, end?: Date) => {
//         if (!categoriesForRange || categoriesForRange.length === 0) {
//             return (
//                 <Box sx={{
//                     textAlign: 'center',
//                     py: 4,
//                     px: 2,
//                     background: alpha(theme.palette.divider, 0.02),
//                     borderRadius: 2,
//                     border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
//                 }}>
//                     <Typography variant="caption" color="text.secondary" fontWeight={500}>
//                         No budget categories found
//                     </Typography>
//                 </Box>
//             );
//         }
//
//         return (
//             <Box sx={{ p: 1.5 }}>
//                 <Grid container spacing={1.5}>
//                     {categoriesForRange.map((category, index) => (
//                         <Grid item xs={12} sm={6} md={4} key={`${category.category}-${index}`}>
//                             <BudgetCategoryCard
//                                 categoryName={category.category}
//                                 budgeted={category.budgeted || 0}
//                                 actual={category.actual || 0}
//                                 remaining={category.remaining || 0}
//                                 compact={true}
//                             />
//                         </Grid>
//                     ))}
//                 </Grid>
//             </Box>
//         );
//     };
//
//     const getDateRanges = (subBudget: SubBudget) => {
//         if (!periodData?.length || !selectedDate || !subBudget) return [];
//
//         const uniqueRanges = new Map();
//
//         const subBudgetStartDate = new Date(
//             subBudget.startDate[0],
//             subBudget.startDate[1] - 1,
//             subBudget.startDate[2]
//         );
//
//         const subBudgetEndDate = new Date(
//             subBudget.endDate[0],
//             subBudget.endDate[1] - 1,
//             subBudget.endDate[2]
//         );
//
//         console.log('periodData {}', periodData);
//         periodData.forEach(category => {
//             try {
//                 if (budgetPeriod === 'BiWeekly') {
//                     if (!category?.biWeekRanges?.length) {
//                         console.warn("No BiWeekly ranges found for category:", category);
//                         return;
//                     }
//
//                     category.biWeekRanges.forEach(range => {
//                         const startArr = (range.startDate as unknown) as number[];
//                         const endArr = (range.endDate as unknown) as number[];
//
//                         const startDate = new Date(
//                             Number(startArr[0]),
//                             Number(startArr[1]) - 1,
//                             Number(startArr[2])
//                         );
//
//                         const endDate = new Date(
//                             Number(endArr[0]),
//                             Number(endArr[1]) - 1,
//                             Number(endArr[2])
//                         );
//
//                         if (isWithinInterval(startDate, { start: subBudgetStartDate, end: subBudgetEndDate }) &&
//                             isWithinInterval(endDate, { start: subBudgetStartDate, end: subBudgetEndDate })) {
//
//                             const rangeKey = `${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
//                             if (!uniqueRanges.has(rangeKey)) {
//                                 uniqueRanges.set(rangeKey, [startDate, endDate]);
//                             }
//                         }
//                     });
//                 } else {
//                     if (!category?.dateRange?.startDate || !category?.dateRange?.endDate) {
//                         console.warn("Invalid Date Range found: ", category);
//                         return;
//                     }
//
//                     const startArr = (category.dateRange.startDate as unknown) as number[];
//                     const endArr = (category.dateRange.endDate as unknown) as number[];
//
//                     const startDate = new Date(
//                         Number(startArr[0]),
//                         Number(startArr[1]) - 1,
//                         Number(startArr[2])
//                     );
//
//                     const endDate = new Date(
//                         Number(endArr[0]),
//                         Number(endArr[1]) - 1,
//                         Number(endArr[2])
//                     );
//
//                     const rangeKey = `${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}`;
//                     if (!uniqueRanges.has(rangeKey)) {
//                         uniqueRanges.set(rangeKey, [startDate, endDate]);
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error processing date range: ', error, category);
//             }
//         });
//
//         const ranges = Array.from(uniqueRanges.values()).sort((a, b) => {
//             return a[0].getTime() - b[0].getTime();
//         });
//
//         console.log('Ranges before filtering:', ranges.map(([start, end]) => ({
//             start: format(start, 'yyyy-MM-dd'),
//             end: format(end, 'yyyy-MM-dd'),
//             daysDiff: differenceInDays(end, start)
//         })));
//
//         const filteredRanges = ranges.filter(([start, end]) => {
//             switch (budgetPeriod) {
//                 case 'Daily':
//                     return isSameDay(start, selectedDate);
//                 case 'Weekly':
//                     return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
//                 case 'BiWeekly':
//                     return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
//                 case 'Monthly':
//                     return isWithinInterval(start, { start: subBudgetStartDate, end: subBudgetEndDate });
//                 case 'Custom':
//                     return true;
//                 default:
//                     return true;
//             }
//         });
//
//         console.log('Filtered ranges for', budgetPeriod, ':', filteredRanges.map(([start, end]) => ({
//             start: format(start, 'yyyy-MM-dd'),
//             end: format(end, 'yyyy-MM-dd'),
//             daysDiff: differenceInDays(end, start)
//         })));
//
//         return filteredRanges;
//     };
//
//     const isProcessedRow = (row: any): row is ProcessedRow => {
//         return row
//             && typeof row.name === 'string'
//             && typeof row.budgeted === 'number'
//             && typeof row.actual === 'number'
//             && typeof row.remaining === 'number'
//             && row.startRange instanceof Date
//             && row.endRange instanceof Date;
//     };
//
//     if (isLoading) {
//         return (
//             <Box>
//                 <Typography variant="h5" component="h2" gutterBottom>
//                     Budget Period Overview
//                 </Typography>
//                 <Box sx={{ mb: 2 }}>
//                     <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
//                 </Box>
//                 <Skeleton variant="rectangular" height={400} />
//             </Box>
//         );
//     }
//
//     return (
//         <LocalizationProvider dateAdapter={AdapterDateFns}>
//             <Box>
//                 {/* NEW: Header with Visual/Numeric Toggle */}
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                     <Typography variant="h5" component="h2" sx={{
//                         fontWeight: 'bold',
//                         fontSize: '0.875rem',
//                         color: 'text.secondary'
//                     }}>
//                         Budget Period Overview
//                     </Typography>
//
//                     <ToggleButtonGroup
//                         value={viewType}
//                         exclusive
//                         onChange={(e, newView) => newView && setViewType(newView)}
//                         size="small"
//                         sx={{
//                             '& .MuiToggleButton-root': {
//                                 py: 0.5,
//                                 px: 2,
//                                 fontSize: '0.75rem',
//                                 fontWeight: 600,
//                                 textTransform: 'none',
//                                 border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
//                                 '&.Mui-selected': {
//                                     bgcolor: alpha(maroonColor, 0.1),
//                                     color: maroonColor,
//                                     borderColor: alpha(maroonColor, 0.4),
//                                     '&:hover': {
//                                         bgcolor: alpha(maroonColor, 0.15)
//                                     }
//                                 }
//                             }
//                         }}
//                     >
//                         <ToggleButton value="visual">
//                             <BarChart3 size={14} style={{ marginRight: 6 }} /> Visual
//                         </ToggleButton>
//                         <ToggleButton value="numeric">
//                             <TableIcon size={14} style={{ marginRight: 6 }} /> Numeric
//                         </ToggleButton>
//                     </ToggleButtonGroup>
//                 </Box>
//
//                 {/* Period Selection - Custom shows chip options below */}
//                 <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <StyledButtonGroup variant="outlined" aria-label="budget period toggle">
//                             {['Daily', 'Weekly', 'BiWeekly', 'Monthly', 'Custom'].map((period) => (
//                                 <StyledButton
//                                     key={period}
//                                     onClick={() => setBudgetPeriod(period as BudgetPeriod)}
//                                     variant={budgetPeriod === period ? 'contained' : 'outlined'}
//                                 >
//                                     {period === 'BiWeekly' ? 'Bi-Weekly' : period}
//                                 </StyledButton>
//                             ))}
//                         </StyledButtonGroup>
//
//                         <DatePicker
//                             label="Select Date"
//                             value={selectedDate}
//                             onChange={(newValue: Date | null) => setSelectedDate(newValue)}
//                             disabled={budgetPeriod !== 'Daily'}
//                         />
//                     </Box>
//
//                     {/* NEW: Custom Filter Type Chips - Only show when Custom is selected */}
//                     {budgetPeriod === 'Custom' && (
//                         <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//                             <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 1 }}>
//                                 Filter by:
//                             </Typography>
//                             <Chip
//                                 label="Custom Dates"
//                                 onClick={() => setCustomFilterType('dates')}
//                                 variant={customFilterType === 'dates' ? 'filled' : 'outlined'}
//                                 sx={{
//                                     fontWeight: 600,
//                                     fontSize: '0.75rem',
//                                     ...(customFilterType === 'dates' && {
//                                         bgcolor: alpha(maroonColor, 0.1),
//                                         color: maroonColor,
//                                         borderColor: alpha(maroonColor, 0.4),
//                                         '&:hover': {
//                                             bgcolor: alpha(maroonColor, 0.15)
//                                         }
//                                     })
//                                 }}
//                             />
//                             <Chip
//                                 label="By Income"
//                                 onClick={() => setCustomFilterType('income')}
//                                 variant={customFilterType === 'income' ? 'filled' : 'outlined'}
//                                 sx={{
//                                     fontWeight: 600,
//                                     fontSize: '0.75rem',
//                                     ...(customFilterType === 'income' && {
//                                         bgcolor: alpha(maroonColor, 0.1),
//                                         color: maroonColor,
//                                         borderColor: alpha(maroonColor, 0.4),
//                                         '&:hover': {
//                                             bgcolor: alpha(maroonColor, 0.15)
//                                         }
//                                     })
//                                 }}
//                             />
//                         </Box>
//                     )}
//
//                     {/* NEW: Custom Date Range Pickers - Only show when Custom + dates filter is selected */}
//                     {budgetPeriod === 'Custom' && customFilterType === 'dates' && (
//                         <Box sx={{ display: 'flex', gap: 2 }}>
//                             <DatePicker
//                                 label="Start Date"
//                                 value={customStartDate}
//                                 onChange={(newValue) => setCustomStartDate(newValue)}
//                             />
//                             <DatePicker
//                                 label="End Date"
//                                 value={customEndDate}
//                                 onChange={(newValue) => setCustomEndDate(newValue)}
//                                 minDate={customStartDate || undefined}
//                             />
//                         </Box>
//                     )}
//                 </Box>
//
//                 <Paper sx={{
//                     boxShadow: 3,
//                     borderRadius: 4,
//                     overflow: 'hidden',
//                     transition: 'box-shadow 0.3s ease-in-out',
//                     '&:hover': {
//                         boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//                     }
//                 }}>
//                     {/* Fixed Header Table - Only show in numeric view */}
//                     {viewType === 'numeric' && (
//                         <Table sx={{ tableLayout: 'fixed' }}>
//                             <TableHead>
//                                 <TableRow sx={{ backgroundColor: 'background.paper' }}>
//                                     <TableCell sx={{
//                                         fontWeight: 'bold',
//                                         color: maroonColor,
//                                         fontSize: '0.95rem',
//                                         width: '40%'
//                                     }}>
//                                         Category
//                                     </TableCell>
//                                     <TableCell align="right" sx={{
//                                         fontWeight: 'bold',
//                                         color: maroonColor,
//                                         fontSize: '0.95rem',
//                                         width: '20%'
//                                     }}>
//                                         Budgeted
//                                     </TableCell>
//                                     <TableCell align="right" sx={{
//                                         fontWeight: 'bold',
//                                         color: maroonColor,
//                                         fontSize: '0.95rem',
//                                         width: '20%'
//                                     }}>
//                                         Actual
//                                     </TableCell>
//                                     <TableCell align="right" sx={{
//                                         fontWeight: 'bold',
//                                         color: maroonColor,
//                                         fontSize: '0.95rem',
//                                         width: '20%'
//                                     }}>
//                                         Remaining
//                                     </TableCell>
//                                 </TableRow>
//                             </TableHead>
//                         </Table>
//                     )}
//
//                     {/* Content Area */}
//                     <Box>
//                         {isLoadingData ? (
//                             <Box sx={{ p: 2 }}>
//                                 <Skeleton variant="rectangular" height={100} />
//                             </Box>
//                         ) : !data?.[0]?.subBudget ? (
//                             <Box sx={{ p: 4, textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>
//                                 No budget data available.
//                             </Box>
//                         ) : (
//                             (() => {
//                                 const subBudget = data[0].subBudget;
//                                 if (!subBudget) return null;
//
//                                 const dateRanges = getDateRanges(subBudget);
//
//                                 if (!dateRanges.length) {
//                                     return (
//                                         <Box sx={{ p: 4, textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>
//                                             No date ranges available for this period.
//                                         </Box>
//                                     );
//                                 }
//
//                                 return dateRanges.map(([start, end], rangeIndex) => {
//                                     const rangeKey = `${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}`;
//                                     const isExpanded = expandedRanges.has(rangeKey);
//                                     const isLastRange = rangeIndex === dateRanges.length - 1;
//
//                                     const categoriesForRange = periodData.filter(category => {
//                                         if (budgetPeriod === 'BiWeekly' && category.biWeekRanges?.length) {
//                                             return category.biWeekRanges.some(range => {
//                                                 const startArr = (range.startDate as unknown) as number[];
//                                                 const endArr = (range.endDate as unknown) as number[];
//
//                                                 const categoryStart = new Date(
//                                                     Number(startArr[0]),
//                                                     Number(startArr[1]) - 1,
//                                                     Number(startArr[2])
//                                                 );
//                                                 const categoryEnd = new Date(
//                                                     Number(endArr[0]),
//                                                     Number(endArr[1]) - 1,
//                                                     Number(endArr[2])
//                                                 );
//                                                 return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);
//                                             });
//                                         } else if (category.dateRange?.startDate && category.dateRange?.endDate) {
//                                             const startArr = (category.dateRange.startDate as unknown) as number[];
//                                             const endArr = (category.dateRange.endDate as unknown) as number[];
//
//                                             const categoryStart = new Date(
//                                                 Number(startArr[0]),
//                                                 Number(startArr[1]) - 1,
//                                                 Number(startArr[2])
//                                             );
//                                             const categoryEnd = new Date(
//                                                 Number(endArr[0]),
//                                                 Number(endArr[1]) - 1,
//                                                 Number(endArr[2])
//                                             );
//                                             return isSameDay(categoryStart, start) && isSameDay(categoryEnd, end);
//                                         }
//                                         return false;
//                                     });
//
//                                     return (
//                                         <Box key={`range-${rangeIndex}`} sx={{ mb: 0.5 }}>
//                                             {/* Date Range Header */}
//                                             <Box
//                                                 onClick={() => toggleRangeExpansion(rangeKey)}
//                                                 sx={{
//                                                     cursor: 'pointer',
//                                                     backgroundColor: 'white',
//                                                     boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//                                                     p: 2,
//                                                     borderLeft: `4px solid ${maroonColor}`,
//                                                     ...(isLastRange && !isExpanded && {
//                                                         borderBottomLeftRadius: '16px',
//                                                         borderBottomRightRadius: '16px',
//                                                     }),
//                                                     '&:hover': {
//                                                         boxShadow: '0 2px 6px rgba(128, 0, 0, 0.15)',
//                                                     }
//                                                 }}
//                                             >
//                                                 <Box sx={{
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     justifyContent: 'space-between'
//                                                 }}>
//                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                         <IconButton
//                                                             size="small"
//                                                             sx={{
//                                                                 color: maroonColor,
//                                                                 backgroundColor: 'rgba(128, 0, 0, 0.05)',
//                                                                 '&:hover': {
//                                                                     backgroundColor: 'rgba(128, 0, 0, 0.1)',
//                                                                 }
//                                                             }}
//                                                         >
//                                                             {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
//                                                         </IconButton>
//                                                         <Typography sx={{
//                                                             color: maroonColor,
//                                                             fontWeight: 600,
//                                                             fontSize: '0.9rem'
//                                                         }}>
//                                                             {format(start, 'MMM dd')} - {format(end, 'MMM dd, yyyy')}
//                                                         </Typography>
//                                                     </Box>
//                                                     <Typography variant="caption" sx={{
//                                                         color: 'text.secondary',
//                                                         backgroundColor: 'rgba(0,0,0,0.05)',
//                                                         px: 1.5,
//                                                         py: 0.5,
//                                                         borderRadius: 1,
//                                                         fontSize: '0.75rem'
//                                                     }}>
//                                                         {categoriesForRange.length}
//                                                     </Typography>
//                                                 </Box>
//                                             </Box>
//
//                                             {/* Categories Section - Visual or Numeric based on toggle */}
//                                             {isExpanded && (
//                                                 viewType === 'numeric' ? (
//                                                     <Box sx={{
//                                                         maxHeight: '330px',
//                                                         overflowY: 'auto',
//                                                         ...(isLastRange && {
//                                                             borderBottomLeftRadius: '16px',
//                                                             borderBottomRightRadius: '16px',
//                                                         }),
//                                                         '&::-webkit-scrollbar': {
//                                                             width: '8px',
//                                                         },
//                                                         '&::-webkit-scrollbar-track': {
//                                                             backgroundColor: 'rgba(0,0,0,0.05)',
//                                                         },
//                                                         '&::-webkit-scrollbar-thumb': {
//                                                             backgroundColor: maroonColor,
//                                                             borderRadius: '4px',
//                                                             '&:hover': {
//                                                                 backgroundColor: '#600000',
//                                                             },
//                                                         },
//                                                     }}>
//                                                         <Table sx={{ tableLayout: 'fixed' }}>
//                                                             <TableBody>
//                                                                 {categoriesForRange.length > 0 ? (
//                                                                     categoriesForRange.map((category, categoryIndex) => (
//                                                                         <TableRow
//                                                                             key={`${rangeKey}-${category.category}-${categoryIndex}`}
//                                                                             sx={{
//                                                                                 '&:hover': {
//                                                                                     backgroundColor: 'rgba(128, 0, 0, 0.04)',
//                                                                                 }
//                                                                             }}
//                                                                         >
//                                                                             <TableCell component="th" scope="row" sx={{ width: '40%' }}>
//                                                                                 {category.category}
//                                                                             </TableCell>
//                                                                             <TableCell align="right" sx={{ width: '20%' }}>
//                                                                                 ${(category.budgeted || 0).toFixed(2)}
//                                                                             </TableCell>
//                                                                             <TableCell align="right" sx={{ width: '20%' }}>
//                                                                                 ${(Math.abs(category.actual) || 0).toFixed(2)}
//                                                                             </TableCell>
//                                                                             <TableCell
//                                                                                 align="right"
//                                                                                 sx={{
//                                                                                     width: '20%',
//                                                                                     color: (category.remaining || 0) >= 0 ? 'green' : 'red',
//                                                                                     fontWeight: 'bold'
//                                                                                 }}
//                                                                             >
//                                                                                 ${Math.abs(category.remaining || 0).toFixed(2)}
//                                                                                 {(category.remaining || 0) >= 0 ? ' under' : ' over'}
//                                                                             </TableCell>
//                                                                         </TableRow>
//                                                                     ))
//                                                                 ) : (
//                                                                     <TableRow>
//                                                                         <TableCell
//                                                                             colSpan={4}
//                                                                             align="center"
//                                                                             sx={{ color: 'gray', fontStyle: 'italic', py: 2 }}
//                                                                         >
//                                                                             No categories available for this range.
//                                                                         </TableCell>
//                                                                     </TableRow>
//                                                                 )}
//                                                             </TableBody>
//                                                         </Table>
//                                                     </Box>
//                                                 ) : (
//                                                     renderVisualView(categoriesForRange, start, end)
//                                                 )
//                                             )}
//                                         </Box>
//                                     );
//                                 });
//                             })()
//                         )}
//                     </Box>
//                 </Paper>
//             </Box>
//         </LocalizationProvider>
//     );
// }
//
// export default BudgetPeriodTable;