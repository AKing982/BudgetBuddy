// ── AnalyticsView.tsx ─────────────────────────────────────────────────────────
// Standalone analytics mode. Four tabs:
//   1. Trends      — income vs expenses line chart over all periods
//   2. Categories  — per-category bar chart, average, outliers
//   3. Budget rules — compliance check against 50/30/20 and other rules
//   4. What-if     — forecast with adjustable income and savings targets
import React, { useMemo, useState } from 'react';
import {
    Box, Typography, Grid, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Slider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ReferenceLine, Legend, PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import {
    MAROON, NAVY, SLATE, GREEN, RED, TEAL, AMBER, BLUE, CHART_COLORS,
    fmt, fmtS, fmtC,
    GROUP_ORDER, CAT_COLORS, CAT_PCTS,
    deriveGroupTotals, derivePeriodSummary, buildForecastData,
} from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, PeriodFilter } from '../domain/SpreadsheetTypes';
import { MaroonCardHeader } from './SharedBudgetUI';

type AnalyticsTab = 'trends' | 'categories' | 'rules' | 'whatif';

interface Props {
    template:      SpreadsheetTemplate;
    periodFilter:  PeriodFilter;
}

// ── Tab pill ──────────────────────────────────────────────────────────────────
const TABS: { key: AnalyticsTab; label: string }[] = [
    { key:'trends',     label:'Trends'       },
    { key:'categories', label:'Categories'   },
    { key:'rules',      label:'Budget rules' },
    { key:'whatif',     label:'What-if'      },
];

const RULE_DEFS: Record<string, Record<string, number>> = {
    '50/30/20': { Housing:30, Food:15, Transportation:10, Entertainment:5, Other:20, Savings:20 },
    '70/20/10': { Housing:35, Food:20, Transportation:10, Entertainment:5, Other:0,  Savings:20 },
    '80/20':    { Housing:40, Food:20, Transportation:10, Entertainment:10,Other:0,  Savings:20 },
};

// ── Shared tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ p:1.25, bgcolor:'#fff', borderRadius:'7px', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', border:`1px solid ${alpha('#000',0.08)}` }}>
            <Typography sx={{ fontSize:'0.7rem', fontWeight:600, color:NAVY, mb:0.5 }}>{label}</Typography>
            {payload.map((p: any, i: number) => (
                <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                    <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:p.color }}/>
                    <Typography sx={{ fontSize:'0.7rem', color:NAVY }}>{p.name}: <strong>{fmtC(p.value)}</strong></Typography>
                </Box>
            ))}
        </Box>
    );
};

// ── Trends tab ────────────────────────────────────────────────────────────────
const TrendsTab: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const summary = useMemo(() => derivePeriodSummary(template), [template]);
    const chartData = summary.map(s => ({
        period:   s.period,
        Income:   s.income,
        Expenses: s.expenses,
        Savings:  s.savings,
        Balance:  s.balance,
    }));

    const avgIncome   = summary.reduce((a, s) => a + s.income,   0) / (summary.length || 1);
    const avgExpenses = summary.reduce((a, s) => a + s.expenses, 0) / (summary.length || 1);
    const avgSavings  = summary.reduce((a, s) => a + s.savings,  0) / (summary.length || 1);
    const avgSavPct   = summary.reduce((a, s) => a + s.savingsPct, 0) / (summary.length || 1);

    const kpis = [
        { label:'Avg income',   val:fmtC(avgIncome),   color:NAVY   },
        { label:'Avg expenses', val:fmtC(avgExpenses), color:MAROON },
        { label:'Avg savings',  val:fmtC(avgSavings),  color:GREEN  },
        { label:'Avg save rate',val:`${avgSavPct.toFixed(1)}%`, color: avgSavPct >= 20 ? GREEN : AMBER },
    ];

    return (
        <Box>
            <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', mb:3 }}>
                {kpis.map(({ label, val, color }) => (
                    <Box key={label} sx={{ p:'12px 14px', borderRadius:'9px', bgcolor:alpha(color,0.05), border:`1px solid ${alpha(color,0.15)}` }}>
                        <Typography sx={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.07em', color:alpha(color,0.7), fontWeight:600, mb:0.75 }}>{label}</Typography>
                        <Typography sx={{ fontSize:'1.25rem', fontWeight:700, color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{val}</Typography>
                    </Box>
                ))}
            </Box>

            <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:SLATE, mb:1.5 }}>Income vs expenses per period</Typography>
            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top:4, right:8, left:0, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)} vertical={false}/>
                    <XAxis dataKey="period" tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={36}/>
                    <YAxis tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} width={52} tickFormatter={(v:number) => v>=1000 ? `${(v/1000).toFixed(0)}k` : String(v)}/>
                    <RTooltip content={<ChartTooltip/>}/>
                    <Line type="monotone" dataKey="Income"   stroke={NAVY}   strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }}/>
                    <Line type="monotone" dataKey="Expenses" stroke={MAROON} strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }}/>
                    <Line type="monotone" dataKey="Savings"  stroke={GREEN}  strokeWidth={2} strokeDasharray="4 3" dot={{ r:3 }} activeDot={{ r:5 }}/>
                    <ReferenceLine y={0} stroke={alpha(RED,0.4)} strokeDasharray="4 3"/>
                    <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize:'0.72rem' }}/>
                </LineChart>
            </ResponsiveContainer>

            <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:SLATE, mb:1.5, mt:3 }}>Running balance over time</Typography>
            <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top:4, right:8, left:0, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)} vertical={false}/>
                    <XAxis dataKey="period" tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={36}/>
                    <YAxis tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} width={52} tickFormatter={(v:number) => v>=1000||v<=-1000 ? `${(v/1000).toFixed(0)}k` : String(v)}/>
                    <RTooltip content={<ChartTooltip/>}/>
                    <ReferenceLine y={0} stroke={alpha(RED,0.4)} strokeDasharray="4 3"/>
                    <Line type="monotone" dataKey="Balance" stroke={TEAL} strokeWidth={2.5} dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return <circle key={`bal-${payload.period}`} cx={cx} cy={cy} r={3.5} fill={payload.Balance >= 0 ? TEAL : RED} stroke="#fff" strokeWidth={1.5}/>;
                    }} activeDot={{ r:5 }}/>
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

// ── Categories tab ────────────────────────────────────────────────────────────
const CategoriesTab: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const groupTotals = useMemo(() => deriveGroupTotals(template), [template]);
    const sal = template.rows.find(r => r.label === 'Salary')?.values ?? [];
    const n = template.periods.length;

    const catData = GROUP_ORDER.map(grp => {
        const totals = groupTotals[grp];
        const nonZero = totals.filter(v => v > 0);
        const avg     = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
        const max     = Math.max(...totals, 0);
        const min     = Math.min(...nonZero, 0);
        const total   = totals.reduce((a, b) => a + b, 0);
        return { grp, totals, avg, max, min, total };
    });

    const chartData = template.periods.map((p, i) => {
        const entry: Record<string, any> = { period: p };
        GROUP_ORDER.forEach(g => { entry[g] = groupTotals[g][i] ?? 0; });
        return entry;
    });

    return (
        <Box>
            <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:SLATE, mb:1.5 }}>Spending per category per period</Typography>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top:4, right:8, left:0, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)} vertical={false}/>
                    <XAxis dataKey="period" tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={36}/>
                    <YAxis tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} width={52} tickFormatter={(v:number) => v>=1000 ? `${(v/1000).toFixed(0)}k` : String(v)}/>
                    <RTooltip content={<ChartTooltip/>}/>
                    <Legend iconSize={10} wrapperStyle={{ fontSize:'0.72rem' }}/>
                    {GROUP_ORDER.map(g => <Bar key={g} dataKey={g} stackId="a" fill={CAT_COLORS[g]} radius={[0,0,0,0]}/>)}
                </BarChart>
            </ResponsiveContainer>

            <Box sx={{ mt:3 }}>
                <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:SLATE, mb:1.5 }}>Category averages and outliers</Typography>
                <TableContainer sx={{ borderRadius:'8px', border:`1px solid ${alpha(MAROON,0.12)}` }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor:'#fdf8f8' }}>
                                {['Category','Total','Avg / period','Highest','% of income','Outlier?'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight:600, color:MAROON, fontSize:'0.67rem', textTransform:'uppercase' as const, letterSpacing:'0.07em', py:1, px:1.5, borderBottom:`1.5px solid ${alpha(MAROON,.12)}` }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {catData.map(({ grp, avg, max, total }) => {
                                const totalIncome = sal.reduce((a: number, v) => a + (v ?? 0), 0);
                                const pctIncome   = totalIncome > 0 ? total / totalIncome * 100 : 0;
                                const expected    = CAT_PCTS[grp] * 100;
                                const isOutlier   = Math.abs(pctIncome - expected) > 8;
                                return (
                                    <TableRow key={grp} hover>
                                        <TableCell sx={{ px:1.5, py:0.875 }}>
                                            <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                                <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:CAT_COLORS[grp] }}/>
                                                <Typography sx={{ fontSize:'0.78rem', color:NAVY }}>{grp}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ px:1.5, fontVariantNumeric:'tabular-nums', fontSize:'0.78rem', color:NAVY }}>{fmtC(total)}</TableCell>
                                        <TableCell sx={{ px:1.5, fontVariantNumeric:'tabular-nums', fontSize:'0.78rem', color:SLATE }}>{fmtC(avg)}</TableCell>
                                        <TableCell sx={{ px:1.5, fontVariantNumeric:'tabular-nums', fontSize:'0.78rem', color:MAROON }}>{fmtC(max)}</TableCell>
                                        <TableCell sx={{ px:1.5, fontVariantNumeric:'tabular-nums', fontSize:'0.78rem', color: pctIncome > expected + 5 ? RED : GREEN }}>
                                            {pctIncome.toFixed(1)}% <Box component="span" sx={{ color:SLATE }}>(exp: {expected}%)</Box>
                                        </TableCell>
                                        <TableCell sx={{ px:1.5 }}>
                                            {isOutlier && (
                                                <Box sx={{ display:'inline-block', px:0.75, py:0.2, borderRadius:'4px', bgcolor: pctIncome > expected ? alpha(RED,0.1) : alpha(GREEN,0.1), fontSize:'0.67rem', fontWeight:600, color: pctIncome > expected ? RED : GREEN }}>
                                                    {pctIncome > expected ? '▲ High' : '▼ Low'}
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

// ── Budget rules tab ──────────────────────────────────────────────────────────
const BudgetRulesTab: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const groupTotals   = useMemo(() => deriveGroupTotals(template), [template]);
    const sal           = template.rows.find(r => r.label === 'Salary')?.values ?? [];
    const totalIncome   = sal.reduce((a: number, v) => a + (v ?? 0), 0);

    const actualPcts: Record<string, number> = {};
    GROUP_ORDER.forEach(grp => {
        const total = groupTotals[grp].reduce((a, v) => a + v, 0);
        actualPcts[grp] = totalIncome > 0 ? total / totalIncome * 100 : 0;
    });

    return (
        <Box>
            <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:SLATE, mb:2 }}>
                How your actual spending compares to common budget rules
            </Typography>

            {Object.entries(RULE_DEFS).map(([ruleName, rulePcts]) => {
                const groups   = [...GROUP_ORDER, 'Savings'];
                const overCount = groups.filter(g => (actualPcts[g] ?? 0) > (rulePcts[g] ?? 0) + 5).length;
                const score     = Math.max(0, 100 - overCount * 20);

                return (
                    <Box key={ruleName} sx={{ mb:3, p:2.25, border:`1px solid ${alpha(MAROON,0.12)}`, borderRadius:'10px', bgcolor:'#fff' }}>
                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.75 }}>
                            <Box>
                                <Typography sx={{ fontWeight:700, fontSize:'0.9rem', color:NAVY }}>{ruleName} rule</Typography>
                                <Typography sx={{ fontSize:'0.7rem', color:SLATE, mt:0.25 }}>
                                    {overCount === 0 ? 'On track — all categories within target' : `${overCount} categor${overCount === 1 ? 'y' : 'ies'} over target`}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign:'right' }}>
                                <Typography sx={{ fontSize:'1.5rem', fontWeight:700, color: score >= 80 ? GREEN : score >= 50 ? AMBER : RED, lineHeight:1 }}>{score}</Typography>
                                <Typography sx={{ fontSize:'0.65rem', color:SLATE }}>/ 100</Typography>
                            </Box>
                        </Box>
                        {GROUP_ORDER.filter(g => rulePcts[g] != null).map(grp => {
                            const actual   = actualPcts[grp] ?? 0;
                            const target   = rulePcts[grp] ?? 0;
                            const over     = actual > target + 5;
                            const under    = actual < target - 5;
                            return (
                                <Box key={grp} sx={{ mb:1.25 }}>
                                    <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.4 }}>
                                        <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                            <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:CAT_COLORS[grp] }}/>
                                            <Typography sx={{ fontSize:'0.76rem', color:NAVY }}>{grp}</Typography>
                                        </Box>
                                        <Typography sx={{ fontSize:'0.74rem', fontWeight:600, color: over ? RED : under ? TEAL : GREEN }}>
                                            {actual.toFixed(1)}% <Box component="span" sx={{ fontWeight:400, color:SLATE, fontSize:'0.68rem' }}>target: {target}%</Box>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ height:6, bgcolor:alpha('#000',0.06), borderRadius:'3px', overflow:'hidden', position:'relative' }}>
                                        <Box sx={{ height:'100%', width:`${Math.min(actual / Math.max(target, 1) * 100, 120)}%`, bgcolor: over ? RED : CAT_COLORS[grp], borderRadius:'3px', transition:'width 0.4s' }}/>
                                        {/* Target marker */}
                                        <Box sx={{ position:'absolute', top:0, bottom:0, left:`${Math.min(target / 60 * 100, 99)}%`, width:'2px', bgcolor:alpha('#000',0.3) }}/>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                );
            })}
        </Box>
    );
};

// ── What-if tab ───────────────────────────────────────────────────────────────
const WhatIfTab: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const [forecastCount,    setForecastCount]    = useState(4);
    const [incomeAdjust,     setIncomeAdjust]     = useState(0);     // % change
    const [expenseAdjust,    setExpenseAdjust]    = useState(0);     // % change
    const [savingsTargetPct, setSavingsTargetPct] = useState(20);
    const [startBal,         setStartBal]         = useState(1240);

    const baseData  = useMemo(() => buildForecastData(template, forecastCount, startBal), [template, forecastCount, startBal]);

    const scenarioData = useMemo(() => {
        return baseData.map(d => ({
            ...d,
            income:   Math.round(d.income   * (1 + incomeAdjust  / 100)),
            expenses: Math.round(d.expenses * (1 + expenseAdjust / 100)),
        })).reduce((acc: typeof baseData, d, i) => {
            const prevBal = i === 0 ? startBal : acc[i - 1].balance;
            const balance = Math.round(prevBal + d.income - d.expenses);
            acc.push({ ...d, balance });
            return acc;
        }, []);
    }, [baseData, incomeAdjust, expenseAdjust, startBal]);

    const chartData = scenarioData.map((d, i) => ({
        period:        d.label,
        'Base balance':    baseData[i].balance,
        'Scenario balance': d.balance,
        Income:        d.income,
        Expenses:      d.expenses,
        isFuture:      d.isFuture,
    }));

    const projectedBalance  = scenarioData[scenarioData.length - 1]?.balance ?? 0;
    const savingsGoalAmount = (scenarioData.find(d => !d.isFuture)?.income ?? 0) * savingsTargetPct / 100;
    const totalSaved        = scenarioData.reduce((a, d) => a + Math.max(0, d.income - d.expenses), 0);
    const meetsGoal         = totalSaved >= savingsGoalAmount * forecastCount;

    return (
        <Box>
            <Grid container spacing={2.5} sx={{ mb:3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Typography sx={{ fontSize:'0.71rem', color:SLATE, fontWeight:600, mb:0.75 }}>Starting balance</Typography>
                    <TextField
                        size="small" type="number"
                        value={startBal}
                        onChange={e => setStartBal(parseFloat(e.target.value) || 0)}
                        InputProps={{ startAdornment:<Typography sx={{ mr:0.5, color:SLATE, fontSize:'0.82rem' }}>$</Typography> }}
                        sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'7px' } }}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Typography sx={{ fontSize:'0.71rem', color:SLATE, fontWeight:600, mb:0.75 }}>Forecast periods</Typography>
                    <Box sx={{ display:'flex', gap:0.75 }}>
                        {[2,4,6,8].map(n => (
                            <Box key={n} onClick={() => setForecastCount(n)} sx={{ flex:1, py:0.75, borderRadius:'6px', border:`1px solid ${forecastCount===n?BLUE:alpha('#000',0.12)}`, bgcolor:forecastCount===n?BLUE:'#fff', color:forecastCount===n?'#fff':SLATE, fontSize:'0.75rem', fontWeight:600, textAlign:'center', cursor:'pointer' }}>
                                +{n}
                            </Box>
                        ))}
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Typography sx={{ fontSize:'0.71rem', color:SLATE, fontWeight:600, mb:0.75 }}>Income adjustment: {incomeAdjust > 0 ? '+' : ''}{incomeAdjust}%</Typography>
                    <Slider
                        value={incomeAdjust}
                        onChange={(_, v) => setIncomeAdjust(v as number)}
                        min={-30} max={50} step={1}
                        sx={{ color: incomeAdjust >= 0 ? GREEN : RED, '& .MuiSlider-thumb':{ width:14, height:14 } }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Typography sx={{ fontSize:'0.71rem', color:SLATE, fontWeight:600, mb:0.75 }}>Expense adjustment: {expenseAdjust > 0 ? '+' : ''}{expenseAdjust}%</Typography>
                    <Slider
                        value={expenseAdjust}
                        onChange={(_, v) => setExpenseAdjust(v as number)}
                        min={-30} max={50} step={1}
                        sx={{ color: expenseAdjust <= 0 ? GREEN : RED, '& .MuiSlider-thumb':{ width:14, height:14 } }}
                    />
                </Grid>
            </Grid>

            {/* Scenario KPIs */}
            <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', mb:2.5 }}>
                {[
                    { label:'Projected balance', val:fmtC(projectedBalance), color: projectedBalance >= 0 ? GREEN : RED },
                    { label:'Total saved',        val:fmtC(totalSaved),      color:GREEN },
                    { label:'Savings goal met',   val:meetsGoal ? 'Yes ✓' : 'No ✗',   color:meetsGoal ? GREEN : RED },
                ].map(({ label, val, color }) => (
                    <Box key={label} sx={{ p:'12px 14px', borderRadius:'9px', bgcolor:alpha(color,0.05), border:`1px solid ${alpha(color,0.15)}` }}>
                        <Typography sx={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.07em', color:alpha(color,0.7), fontWeight:600, mb:0.75 }}>{label}</Typography>
                        <Typography sx={{ fontSize:'1.25rem', fontWeight:700, color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{val}</Typography>
                    </Box>
                ))}
            </Box>

            <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color:SLATE, mb:1.5 }}>Balance: base vs scenario</Typography>
            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top:4, right:8, left:0, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)} vertical={false}/>
                    <XAxis dataKey="period" tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={36}/>
                    <YAxis tick={{ fontSize:9, fill:SLATE }} tickLine={false} axisLine={false} width={52} tickFormatter={(v:number) => v>=1000||v<=-1000?`${(v/1000).toFixed(0)}k`:String(v)}/>
                    <RTooltip content={<ChartTooltip/>}/>
                    <ReferenceLine y={0} stroke={alpha(RED,0.4)} strokeDasharray="4 3"/>
                    <Line type="monotone" dataKey="Base balance"     stroke={alpha(SLATE,0.6)} strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
                    <Line type="monotone" dataKey="Scenario balance" stroke={BLUE}             strokeWidth={2.5} dot={{ r:3 }} activeDot={{ r:5 }}/>
                    <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize:'0.72rem' }}/>
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

// ── Root ──────────────────────────────────────────────────────────────────────
const AnalyticsView: React.FC<Props> = ({ template, periodFilter }) => {
    const [tab, setTab] = useState<AnalyticsTab>('trends');

    const tabContent: Record<AnalyticsTab, React.ReactNode> = {
        trends:     <TrendsTab     template={template}/>,
        categories: <CategoriesTab template={template}/>,
        rules:      <BudgetRulesTab template={template}/>,
        whatif:     <WhatIfTab     template={template}/>,
    };

    return (
        <Box sx={{ borderRadius:'12px', overflow:'hidden', border:`1px solid ${alpha('#7c3aed',0.2)}`, boxShadow:`0 4px 20px ${alpha('#7c3aed',0.07)}` }}>
            <MaroonCardHeader
                icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                }
                title="Budget analytics"
                subtitle="Trends · category deep-dive · rule compliance · what-if scenarios"
            />

            {/* Tab bar */}
            <Box sx={{ display:'flex', borderBottom:`1px solid ${alpha('#000',0.08)}`, bgcolor:'#fff' }}>
                {TABS.map(({ key, label }) => (
                    <Box
                        key={key}
                        onClick={() => setTab(key)}
                        sx={{
                            px:2.5, py:1.25, cursor:'pointer', fontSize:'0.8rem', fontWeight:600,
                            color: tab === key ? MAROON : SLATE,
                            borderBottom: tab === key ? `2px solid ${MAROON}` : '2px solid transparent',
                            transition:'all .15s',
                            '&:hover':{ color:MAROON },
                            userSelect:'none',
                        }}
                    >
                        {label}
                    </Box>
                ))}
            </Box>

            <Box sx={{ bgcolor:'#fff', p:2.75 }}>
                {tabContent[tab]}
            </Box>
        </Box>
    );
};

export default AnalyticsView;