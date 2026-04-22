// ── BudgetCriteriaPanel.tsx ───────────────────────────────────────────────────
// Collapsible side-panel (or inline panel) for setting monthly budget goals,
// per-category targets, mini-goals, and auto-generate toggle.
// Used in both CurrentMonthView and PlanningView.
import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Divider,
    Switch, FormControlLabel, IconButton, Tooltip, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Delete, AutoAwesome, CheckCircle } from '@mui/icons-material';
import { Target, PiggyBank } from 'lucide-react';
import {
    MAROON, MAROON_DARK, TEAL, GREEN, AMBER, NAVY, SLATE, RED,
    GROUP_ORDER, CAT_COLORS, CAT_PCTS,
    generateUUID, fmtS,
} from '../domain/SpreadsheetTypes';
import type { BudgetCriteria, MiniGoal, BudgetRule } from '../domain/SpreadsheetTypes';

// ── Default budget rules (kept local — no React node icons needed here) ───────
const RULE_ALLOCATIONS: Record<string, Record<string, number>> = {
    '50-30-20': { Housing:35, Food:15, Transportation:10, Entertainment:10, Savings:20, Other:10 },
    '70-20-10': { Housing:35, Food:20, Transportation:10, Entertainment:5,  Savings:20, Other:10 },
    '80-20':    { Housing:40, Food:20, Transportation:10, Entertainment:10, Savings:20, Other:0  },
    '60-20-20': { Housing:35, Food:15, Transportation:10, Entertainment:20, Savings:20, Other:0  },
    'custom':   { Housing:30, Food:15, Transportation:10, Entertainment:10, Savings:15, Other:20 },
};

interface Props {
    criteria:     BudgetCriteria;
    onChange:     (updated: BudgetCriteria) => void;
    /** If true, shows an "Auto-generate from history" toggle */
    showAutoGen?: boolean;
    collapsed?:   boolean;
}

const BudgetCriteriaPanel: React.FC<Props> = ({ criteria, onChange, showAutoGen = true, collapsed: initCollapsed = false }) => {
    const [collapsed, setCollapsed] = useState(initCollapsed);
    const [newGoalLabel, setNewGoalLabel] = useState('');
    const [newGoalAmt,   setNewGoalAmt]   = useState('');
    const [newGoalCat,   setNewGoalCat]   = useState('');

    const set = (patch: Partial<BudgetCriteria>) => onChange({ ...criteria, ...patch });

    const applyRule = (ruleId: string) => {
        const allocs = RULE_ALLOCATIONS[ruleId] ?? RULE_ALLOCATIONS['50-30-20'];
        const targets: Record<string, number> = {};
        GROUP_ORDER.forEach(grp => {
            targets[grp] = Math.round(criteria.income * (allocs[grp] ?? 0) / 100);
        });
        set({ budgetRuleId: ruleId, categoryTargets: targets });
    };

    const addMiniGoal = () => {
        const amt = parseFloat(newGoalAmt);
        if (!newGoalLabel || isNaN(amt)) return;
        const goal: MiniGoal = { id: generateUUID(), label: newGoalLabel, targetAmount: amt, category: newGoalCat || undefined };
        set({ miniGoals: [...criteria.miniGoals, goal] });
        setNewGoalLabel(''); setNewGoalAmt(''); setNewGoalCat('');
    };

    const removeMiniGoal = (id: string) =>
        set({ miniGoals: criteria.miniGoals.filter(g => g.id !== id) });

    const toggleGoalMet = (id: string) =>
        set({ miniGoals: criteria.miniGoals.map(g => g.id === id ? { ...g, met: !g.met } : g) });

    const updateCatTarget = (grp: string, val: string) => {
        const n = parseFloat(val);
        set({ categoryTargets: { ...criteria.categoryTargets, [grp]: isNaN(n) ? 0 : n } });
    };

    const totalAllocated = GROUP_ORDER.reduce((a, g) => a + (criteria.categoryTargets[g] ?? 0), 0);
    const unallocated    = criteria.income - totalAllocated;

    return (
        <Box sx={{
            borderRadius: '12px', overflow: 'hidden',
            border: `1px solid ${alpha(MAROON, 0.15)}`,
            boxShadow: `0 2px 12px ${alpha(MAROON, 0.06)}`,
        }}>
            {/* Header */}
            <Box
                onClick={() => setCollapsed(v => !v)}
                sx={{
                    background: 'linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)',
                    px: 2.5, py: 1.5, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                    <Box sx={{ width:26, height:26, borderRadius:'7px', bgcolor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Target size={13} color="white" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight:700, fontSize:'0.87rem', color:'#fff' }}>Budget criteria</Typography>
                        <Typography sx={{ fontSize:'0.63rem', color:'rgba(255,255,255,0.6)' }}>
                            {criteria.income > 0 ? `$${fmtS(criteria.income)} income · ${GROUP_ORDER.length} categories` : 'Set income and targets'}
                        </Typography>
                    </Box>
                </Box>
                <Typography sx={{ color:'rgba(255,255,255,0.7)', fontSize:'0.8rem' }}>{collapsed ? '▼' : '▲'}</Typography>
            </Box>

            {!collapsed && (
                <Box sx={{ bgcolor:'#fff', p:2 }}>

                    {/* Income + auto-generate */}
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2 }}>
                        <TextField
                            label="Monthly income"
                            size="small"
                            type="number"
                            value={criteria.income || ''}
                            onChange={e => set({ income: parseFloat(e.target.value) || 0 })}
                            InputProps={{ startAdornment: <Typography sx={{ mr:0.5, color:SLATE, fontSize:'0.82rem' }}>$</Typography> }}
                            sx={{ flex:1, '& .MuiOutlinedInput-root':{ borderRadius:'7px' } }}
                        />
                        {showAutoGen && (
                            <Tooltip title="Auto-fill from historical averages">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={criteria.autoGenerate}
                                            onChange={e => set({ autoGenerate: e.target.checked })}
                                            sx={{ '& .MuiSwitch-thumb':{ bgcolor: criteria.autoGenerate ? TEAL : undefined } }}
                                        />
                                    }
                                    label={<Typography sx={{ fontSize:'0.71rem', color:SLATE, whiteSpace:'nowrap' }}>Auto-gen</Typography>}
                                    sx={{ m:0 }}
                                />
                            </Tooltip>
                        )}
                    </Box>

                    {/* Budget rule pills */}
                    <Typography sx={{ fontSize:'0.67rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.07em', mb:0.875 }}>
                        Budget rule
                    </Typography>
                    <Box sx={{ display:'flex', gap:0.75, flexWrap:'wrap', mb:2 }}>
                        {Object.keys(RULE_ALLOCATIONS).map(rId => (
                            <Chip
                                key={rId}
                                label={rId.toUpperCase()}
                                size="small"
                                onClick={() => applyRule(rId)}
                                sx={{
                                    height: 22, fontSize:'0.65rem', fontWeight:600, cursor:'pointer',
                                    bgcolor: criteria.budgetRuleId === rId ? MAROON : alpha(MAROON, 0.07),
                                    color:   criteria.budgetRuleId === rId ? '#fff' : MAROON,
                                    border: `1px solid ${criteria.budgetRuleId === rId ? MAROON : alpha(MAROON, 0.2)}`,
                                    '&:hover':{ bgcolor: criteria.budgetRuleId === rId ? MAROON : alpha(MAROON, 0.14) },
                                }}
                            />
                        ))}
                    </Box>

                    {/* Category targets */}
                    <Typography sx={{ fontSize:'0.67rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.07em', mb:1 }}>
                        Category targets
                    </Typography>
                    {GROUP_ORDER.map(grp => {
                        const target  = criteria.categoryTargets[grp] ?? 0;
                        const pct     = criteria.income > 0 ? Math.round(target / criteria.income * 100) : 0;
                        const rulePct = RULE_ALLOCATIONS[criteria.budgetRuleId]?.[grp] ?? Math.round(CAT_PCTS[grp] * 100);
                        return (
                            <Box key={grp} sx={{ mb:1.25 }}>
                                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.4 }}>
                                    <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                        <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:CAT_COLORS[grp], flexShrink:0 }}/>
                                        <Typography sx={{ fontSize:'0.78rem', color:NAVY }}>{grp}</Typography>
                                        <Typography sx={{ fontSize:'0.67rem', color:SLATE }}>({pct}%)</Typography>
                                    </Box>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={target || ''}
                                        placeholder={`~${rulePct}%`}
                                        onChange={e => updateCatTarget(grp, e.target.value)}
                                        InputProps={{ startAdornment: <Typography sx={{ mr:0.3, color:SLATE, fontSize:'0.75rem' }}>$</Typography> }}
                                        sx={{ width:100, '& .MuiInputBase-root':{ borderRadius:'6px' }, '& input':{ py:'4px', fontSize:'0.78rem' } }}
                                    />
                                </Box>
                                <Box sx={{ height:3, bgcolor:alpha('#000',0.06), borderRadius:'2px', overflow:'hidden' }}>
                                    <Box sx={{ height:'100%', width:`${Math.min(pct / rulePct * 100, 100)}%`, bgcolor: pct > rulePct ? RED : CAT_COLORS[grp], borderRadius:'2px', transition:'width 0.3s' }}/>
                                </Box>
                            </Box>
                        );
                    })}

                    {/* Unallocated */}
                    <Box sx={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        p:1, borderRadius:'7px', mt:0.5, mb:2,
                        bgcolor: unallocated >= 0 ? alpha(GREEN, 0.07) : alpha(RED, 0.07),
                        border: `1px solid ${unallocated >= 0 ? alpha(GREEN, 0.2) : alpha(RED, 0.2)}`,
                    }}>
                        <Typography sx={{ fontSize:'0.74rem', color:SLATE }}>
                            {unallocated >= 0 ? 'Available to allocate / save' : 'Over-allocated by'}
                        </Typography>
                        <Typography sx={{ fontSize:'0.78rem', fontWeight:600, color: unallocated >= 0 ? GREEN : RED }}>
                            ${fmtS(Math.abs(unallocated))}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb:2, borderColor:alpha('#000',0.07) }} />

                    {/* Mini goals */}
                    <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.25 }}>
                        <PiggyBank size={13} color={TEAL} />
                        <Typography sx={{ fontSize:'0.67rem', fontWeight:600, color:SLATE, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                            Mini goals
                        </Typography>
                    </Box>

                    {criteria.miniGoals.map(goal => (
                        <Box key={goal.id} sx={{
                            display:'flex', alignItems:'center', gap:0.75, mb:0.75,
                            p:0.875, borderRadius:'7px',
                            bgcolor: goal.met ? alpha(GREEN, 0.06) : alpha('#000', 0.02),
                            border: `1px solid ${goal.met ? alpha(GREEN, 0.2) : alpha('#000', 0.07)}`,
                        }}>
                            <Box onClick={() => toggleGoalMet(goal.id)} sx={{ cursor:'pointer', color: goal.met ? GREEN : alpha(NAVY, 0.3), flexShrink:0 }}>
                                <CheckCircle sx={{ fontSize:'1rem' }} />
                            </Box>
                            <Box sx={{ flex:1, minWidth:0 }}>
                                <Typography sx={{ fontSize:'0.77rem', color: goal.met ? alpha(NAVY,0.5) : NAVY, textDecoration: goal.met ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {goal.label}
                                </Typography>
                                {goal.category && (
                                    <Typography sx={{ fontSize:'0.65rem', color:SLATE }}>{goal.category}</Typography>
                                )}
                            </Box>
                            <Typography sx={{ fontSize:'0.75rem', fontWeight:600, color: goal.met ? GREEN : NAVY, flexShrink:0 }}>
                                ${fmtS(goal.targetAmount)}
                            </Typography>
                            <IconButton size="small" onClick={() => removeMiniGoal(goal.id)} sx={{ p:0.25, color:alpha(RED,0.5), '&:hover':{ color:RED } }}>
                                <Delete sx={{ fontSize:'0.85rem' }} />
                            </IconButton>
                        </Box>
                    ))}

                    {/* Add mini goal */}
                    <Box sx={{ display:'flex', gap:0.75, mt:1, flexWrap:'wrap' }}>
                        <TextField
                            size="small" placeholder="Goal label"
                            value={newGoalLabel} onChange={e => setNewGoalLabel(e.target.value)}
                            sx={{ flex:'2 1 100px', '& .MuiInputBase-root':{ borderRadius:'6px' }, '& input':{ py:'5px', fontSize:'0.76rem' } }}
                        />
                        <TextField
                            size="small" placeholder="$amount" type="number"
                            value={newGoalAmt} onChange={e => setNewGoalAmt(e.target.value)}
                            sx={{ flex:'1 1 70px', '& .MuiInputBase-root':{ borderRadius:'6px' }, '& input':{ py:'5px', fontSize:'0.76rem' } }}
                        />
                        <TextField
                            size="small" placeholder="Category (opt)"
                            value={newGoalCat} onChange={e => setNewGoalCat(e.target.value)}
                            sx={{ flex:'2 1 90px', '& .MuiInputBase-root':{ borderRadius:'6px' }, '& input':{ py:'5px', fontSize:'0.76rem' } }}
                        />
                        <Button
                            size="small" variant="contained" onClick={addMiniGoal}
                            disabled={!newGoalLabel || !newGoalAmt}
                            startIcon={<Add sx={{ fontSize:'0.85rem !important' }} />}
                            sx={{ bgcolor:TEAL, color:'#fff', borderRadius:'6px', textTransform:'none', fontWeight:600, fontSize:'0.74rem', px:1.5, '&:hover':{ bgcolor:'#0f766e' }, whiteSpace:'nowrap' }}
                        >
                            Add
                        </Button>
                    </Box>

                    {/* Savings target % */}
                    <Box sx={{ mt:2, p:1.25, borderRadius:'8px', bgcolor:alpha(TEAL,0.05), border:`1px solid ${alpha(TEAL,0.15)}` }}>
                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.5 }}>
                            <Typography sx={{ fontSize:'0.74rem', color:NAVY, fontWeight:500 }}>Savings target</Typography>
                            <TextField
                                size="small" type="number"
                                value={criteria.savingsTargetPct}
                                onChange={e => set({ savingsTargetPct: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                                InputProps={{ endAdornment: <Typography sx={{ ml:0.3, color:SLATE, fontSize:'0.78rem' }}>%</Typography> }}
                                sx={{ width:72, '& .MuiInputBase-root':{ borderRadius:'6px' }, '& input':{ py:'4px', fontSize:'0.78rem', textAlign:'right' } }}
                            />
                        </Box>
                        <Typography sx={{ fontSize:'0.68rem', color:SLATE }}>
                            = ${fmtS(Math.round(criteria.income * criteria.savingsTargetPct / 100))} / month at current income
                        </Typography>
                    </Box>

                </Box>
            )}
        </Box>
    );
};

export default BudgetCriteriaPanel;