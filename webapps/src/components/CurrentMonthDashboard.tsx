// ── CurrentMonthDashboard.tsx ─────────────────────────────────────────────────
// Visual dashboard for the current month view.
// Shows KPI cards, category spending bars vs targets, savings gauge,
// mini-goal progress, and a period breakdown grid.
import React, { useMemo } from 'react';
import {Box, Typography, Grid, LinearProgress, Stack} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    PieChart as RePieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
    MAROON, NAVY, SLATE, GREEN, RED, TEAL, AMBER, BLUE,
    fmt, fmtS, fmtC,
    GROUP_ORDER, CAT_COLORS,
    deriveGroupTotals,
} from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, BudgetCriteria } from '../domain/SpreadsheetTypes';

interface Props {
    template:     SpreadsheetTemplate;
    criteria:     BudgetCriteria;
    currentMonth: Date;
}

const CurrentMonthDashboard: React.FC<Props> = ({ template, criteria, currentMonth }) => {
    const sal    = template.rows.find(r => r.label === 'Salary')?.values    ?? [];
    const expRow = template.rows.find(r => r.rowType === 'expenses');
    const balRow = template.rows.find(r => r.rowType === 'balance');

    const totalIncome   = sal.reduce((a: number, v) => a + (v ?? 0), 0);
    const totalExpenses = (expRow?.values ?? []).reduce((a: number, v) => a + (v ?? 0), 0);
    const finalBalance  = balRow?.values.filter((v): v is number => v !== null).slice(-1)[0] ?? 0;
    const totalSaved    = totalIncome - totalExpenses;
    const savingsRate   = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
    const savingsTarget = criteria.income > 0 ? criteria.income * criteria.savingsTargetPct / 100 : totalIncome * 0.2;
    const savingsGoalPct = savingsTarget > 0 ? Math.min((totalSaved / savingsTarget) * 100, 100) : 0;

    const groupTotals = useMemo(() => deriveGroupTotals(template), [template]);

    const pieData = GROUP_ORDER
        .map(g => ({ name: g, value: groupTotals[g].reduce((a, v) => a + v, 0), color: CAT_COLORS[g] }))
        .filter(d => d.value > 0);

    const monthLabel = currentMonth.toLocaleString('default', { month:'long', year:'numeric' });

    const kpis = [
        { label:'Income',      val:`$${fmtS(totalIncome)}`,   color:NAVY,    border:NAVY    },
        { label:'Spent',       val:`$${fmtS(totalExpenses)}`, color:MAROON,  border:MAROON  },
        { label:'Remaining',   val:fmtC(totalIncome - totalExpenses), color: totalIncome - totalExpenses >= 0 ? GREEN : RED, border: totalIncome - totalExpenses >= 0 ? GREEN : RED },
        { label:'Savings rate', val:`${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? GREEN : AMBER, border: savingsRate >= 20 ? GREEN : AMBER },
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <Box sx={{ p:1.25, bgcolor:'#fff', borderRadius:'7px', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', border:`1px solid ${alpha('#000',0.08)}` }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                    <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:payload[0].payload.color }}/>
                    <Typography sx={{ fontSize:'0.72rem', color:NAVY }}>
                        {payload[0].name}: <strong>{fmtC(payload[0].value)}</strong>
                    </Typography>
                </Box>
            </Box>
        );
    };

    return (
        <Box>
            {/* KPI strip */}
            <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', mb:2.5 }}>
                {kpis.map(({ label, val, color, border }) => (
                    <Box key={label} sx={{
                        p:'12px 14px', borderRadius:'9px',
                        bgcolor:'var(--color-background-secondary, #f8f9fa)',
                        borderTop:`3px solid ${border}`,
                        border:`1px solid ${alpha(border, 0.15)}`,
                    }}>
                        <Typography sx={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.07em', color:alpha(color,0.65), fontWeight:600, mb:0.75 }}>
                            {label}
                        </Typography>
                        <Typography sx={{ fontSize:'1.3rem', fontWeight:700, color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                            {val}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Grid container spacing={2.5}>
                {/* Left: spending donut + legend */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ p:2, border:`1px solid ${alpha('#000',0.07)}`, borderRadius:'10px' }}>
                        <Typography sx={{ fontSize:'0.68rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.06em', mb:1.5 }}>
                            Spending breakdown
                        </Typography>
                        <Box sx={{ position:'relative', mb:1.5 }}>
                            <ResponsiveContainer width="100%" height={150}>
                                <RePieChart>
                                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2}>
                                        {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none"/>)}
                                    </Pie>
                                    <RTooltip content={<CustomTooltip/>}/>
                                </RePieChart>
                            </ResponsiveContainer>
                            <Box sx={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                                <Typography sx={{ fontSize:'0.82rem', fontWeight:700, color:NAVY }}>{fmtC(totalExpenses)}</Typography>
                                <Typography sx={{ fontSize:'0.62rem', color:SLATE }}>spent</Typography>
                            </Box>
                        </Box>
                        {pieData.map(d => (
                            <Box key={d.name} sx={{ display:'flex', alignItems:'center', gap:0.75, mb:0.6 }}>
                                <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:d.color, flexShrink:0 }}/>
                                <Typography sx={{ fontSize:'0.72rem', color:NAVY, flex:1 }}>{d.name}</Typography>
                                <Typography sx={{ fontSize:'0.72rem', color:SLATE }}>
                                    {totalExpenses ? Math.round(d.value / totalExpenses * 100) : 0}%
                                </Typography>
                                <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color:NAVY, minWidth:52, textAlign:'right' }}>
                                    {fmtC(d.value)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Grid>

                {/* Middle: category bars vs targets */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ p:2, border:`1px solid ${alpha('#000',0.07)}`, borderRadius:'10px', height:'100%' }}>
                        <Typography sx={{ fontSize:'0.68rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.06em', mb:1.5 }}>
                            vs category targets
                        </Typography>
                        {GROUP_ORDER.map(grp => {
                            const actual  = groupTotals[grp].reduce((a, v) => a + v, 0);
                            const target  = criteria.categoryTargets[grp] ?? 0;
                            const pct     = target > 0 ? Math.min((actual / target) * 100, 120) : 0;
                            const over    = target > 0 && actual > target;
                            return (
                                <Box key={grp} sx={{ mb:1.5 }}>
                                    <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.4 }}>
                                        <Box sx={{ display:'flex', alignItems:'center', gap:0.625 }}>
                                            <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:CAT_COLORS[grp], flexShrink:0 }}/>
                                            <Typography sx={{ fontSize:'0.76rem', color:NAVY }}>{grp}</Typography>
                                        </Box>
                                        <Typography sx={{ fontSize:'0.74rem', fontWeight:600, color: over ? RED : NAVY }}>
                                            {fmtC(actual)}
                                            {target > 0 && <Box component="span" sx={{ fontWeight:400, color:SLATE, fontSize:'0.68rem' }}> / {fmtC(target)}</Box>}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ height:6, bgcolor:alpha('#000',0.06), borderRadius:'3px', overflow:'hidden' }}>
                                        <Box sx={{
                                            height:'100%', width:`${Math.min(pct, 100)}%`,
                                            bgcolor: over ? RED : CAT_COLORS[grp],
                                            borderRadius:'3px', transition:'width 0.4s',
                                        }}/>
                                    </Box>
                                    {over && (
                                        <Typography sx={{ fontSize:'0.65rem', color:RED, mt:0.25 }}>
                                            Over by {fmtC(actual - target)}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Grid>

                {/* Right: savings gauge + period breakdown + mini goals */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={2}>
                        {/* Savings gauge */}
                        <Box sx={{ p:2, border:`1px solid ${alpha('#000',0.07)}`, borderRadius:'10px' }}>
                            <Typography sx={{ fontSize:'0.68rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.06em', mb:1.5 }}>
                                Savings progress
                            </Typography>
                            <Box sx={{ textAlign:'center', mb:1.5 }}>
                                <Typography sx={{ fontSize:'2rem', fontWeight:700, color: savingsGoalPct >= 100 ? GREEN : AMBER, lineHeight:1 }}>
                                    {savingsRate.toFixed(1)}%
                                </Typography>
                                <Typography sx={{ fontSize:'0.7rem', color:SLATE, mt:0.5 }}>
                                    Target: {criteria.savingsTargetPct}% · {fmtC(totalSaved)} saved
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(savingsGoalPct, 100)}
                                sx={{
                                    height:8, borderRadius:4,
                                    bgcolor:alpha('#000',0.06),
                                    '& .MuiLinearProgress-bar':{ bgcolor: savingsGoalPct >= 100 ? GREEN : AMBER, borderRadius:4 },
                                }}
                            />
                            <Typography sx={{ fontSize:'0.67rem', color:SLATE, mt:0.75, textAlign:'center' }}>
                                {Math.round(savingsGoalPct)}% of {fmtC(savingsTarget)} goal
                            </Typography>
                        </Box>

                        {/* Period breakdown */}
                        <Box sx={{ p:2, border:`1px solid ${alpha('#000',0.07)}`, borderRadius:'10px' }}>
                            <Typography sx={{ fontSize:'0.68rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.06em', mb:1.25 }}>
                                Per pay period
                            </Typography>
                            <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(template.periods.length, 2)}, 1fr)`, gap:'8px' }}>
                                {template.periods.map((p, ci) => {
                                    const inc  = sal[ci] ?? 0;
                                    const exp  = expRow?.values[ci] ?? 0;
                                    const sav  = inc - exp;
                                    const met  = inc > 0 && sav >= inc * 0.2;
                                    return (
                                        <Box key={ci} sx={{ p:1, bgcolor:alpha('#000',0.02), borderRadius:'7px', border:`1px solid ${alpha('#000',0.06)}` }}>
                                            <Typography sx={{ fontSize:'0.67rem', color:SLATE, mb:0.4 }}>{p}</Typography>
                                            <Typography sx={{ fontSize:'0.82rem', fontWeight:600, color:NAVY }}>{fmtC(exp)}</Typography>
                                            <Typography sx={{ fontSize:'0.67rem', color: met ? GREEN : RED, mt:0.2 }}>
                                                {met ? '✓' : '✗'} saved {fmtC(sav)}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Mini goals */}
                        {criteria.miniGoals.length > 0 && (
                            <Box sx={{ p:2, border:`1px solid ${alpha('#000',0.07)}`, borderRadius:'10px' }}>
                                <Typography sx={{ fontSize:'0.68rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.06em', mb:1.25 }}>
                                    Mini goals
                                </Typography>
                                {criteria.miniGoals.map(goal => (
                                    <Box key={goal.id} sx={{
                                        display:'flex', alignItems:'center', gap:0.75, mb:0.75,
                                        p:0.75, borderRadius:'6px',
                                        bgcolor: goal.met ? alpha(GREEN,0.06) : alpha('#000',0.02),
                                    }}>
                                        <Box sx={{ width:10, height:10, borderRadius:'50%', bgcolor: goal.met ? GREEN : alpha('#000',0.2), flexShrink:0 }}/>
                                        <Typography sx={{ flex:1, fontSize:'0.74rem', color: goal.met ? alpha(NAVY,0.5) : NAVY, textDecoration: goal.met ? 'line-through' : 'none' }}>
                                            {goal.label}
                                        </Typography>
                                        <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color: goal.met ? GREEN : NAVY }}>
                                            {fmtC(goal.targetAmount)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CurrentMonthDashboard;