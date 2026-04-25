// ── PlanningView.tsx ──────────────────────────────────────────────────────────
// Three sub-views in the maroon header:
//   Classic  — existing ClassicSpreadsheet
//   Dashboard — timeline + period detail + sidebar cards
//   What-if  — scenario explorer with live sliders, smooth SVG curve chart,
//               goal impact bars, period-by-period comparison table
// ── PlanningView.tsx ──────────────────────────────────────────────────────────
// Three sub-views in the maroon header:
//   Classic  — existing ClassicSpreadsheet
//   Dashboard — timeline + period detail + sidebar cards
//   What-if  — scenario explorer with live sliders, smooth SVG curve chart,
//               goal impact bars, period-by-period comparison table
import React, { useMemo, useState, useCallback } from 'react';
import {
    Box, Typography, Grid, Stack, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Save, Add } from '@mui/icons-material';
import { TableIcon, LayoutDashboard, Award, TrendingUp, BarChart2, GitBranch } from 'lucide-react';
import {
    MAROON, NAVY, SLATE, GREEN, RED, TEAL, BLUE, fmt, fmtS,
    GROUP_ORDER, CAT_PCTS, deriveGroupTotals,
} from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, SpreadsheetRow, PeriodFilter } from '../domain/SpreadsheetTypes';
import { MaroonCardHeader } from './SharedBudgetUI';
import ClassicSpreadsheet from './ClassicSpreadsheet';
import PeriodDetailCard from './PeriodDetailCard';
import FuturePeriodDialog from './FuturePeriodDialog';

// ── Local tokens ──────────────────────────────────────────────────────────────
const AMBER       = '#d97706';
const MAROON_DARK = '#4a1010';
const PURPLE      = '#7c3aed';

// ── Category dot colors ───────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
    Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
    Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
    Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
    Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
    'Order out': '#D4537E', 'Other Stuff': '#888780', 'Coffee Supplies': '#ba7517',
    'Phone Insurance': '#0ea5e9', 'Trip Cost': '#d97706', Golf: '#639922',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type SubViewMode     = 'classic' | 'dashboard' | 'scenario';
type CategoryTargets = Record<string, number>;

// ── Month-level goal / plan item types ────────────────────────────────────────
type ItemStatus = 'on-track' | 'at-risk' | 'pending' | 'paid' | 'overdue';
type PlanType   = 'payment' | 'subscription' | 'savings' | 'bill' | 'custom';

interface MonthGoalItem {
    id:     string;
    kind:   'goal';
    label:  string;
    amount: number;
    color:  string;
    status: ItemStatus;
}
interface MonthPlanItem {
    id:     string;
    kind:   'plan';
    label:  string;
    amount: number;
    type:   PlanType;
    due:    string | null;
    status: ItemStatus;
}
type MonthItem    = MonthGoalItem | MonthPlanItem;
type MonthItemMap = Record<string, MonthItem[]>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtC = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return '—';
    return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
};

function isPeriodFuture(template: SpreadsheetTemplate, pi: number): boolean {
    const pd = (template as any).periodDates?.[pi];
    return pd ? (pd.start as Date) > new Date() : false;
}
function isPeriodPresent(template: SpreadsheetTemplate, pi: number): boolean {
    const pd = (template as any).periodDates?.[pi];
    if (!pd) return false;
    const now = new Date();
    return (pd.start as Date) <= now && (pd.end as Date) >= now;
}
function getPeriodType(template: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future-manual' | 'future-auto' {
    if (isPeriodPresent(template, pi))  return 'present';
    if (isPeriodFuture(template, pi))   return 'future-manual';
    return 'past';
}

// ── Smooth cubic-bezier SVG path ──────────────────────────────────────────────
function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpX  = (prev.x + curr.x) / 2;
        d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
}

// ── SubViewToggle ─────────────────────────────────────────────────────────────
const SubViewToggle: React.FC<{ active: SubViewMode; onChange: (v: SubViewMode) => void }> = ({ active, onChange }) => (
    <Box sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', overflow: 'hidden' }}>
        {([
            ['classic',   'Classic',   <TableIcon       size={11} />],
            ['dashboard', 'Dashboard', <LayoutDashboard size={11} />],
            ['scenario',  'What-if',   <GitBranch       size={11} />],
        ] as [SubViewMode, string, React.ReactNode][]).map(([key, label, icon]) => (
            <Box key={key} onClick={() => onChange(key)} sx={{
                px: 1.25, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5,
                cursor: 'pointer',
                bgcolor: active === key ? 'rgba(255,255,255,0.22)' : 'transparent',
                color: '#fff', fontSize: '0.72rem', fontWeight: 600,
                borderRight: '1px solid rgba(255,255,255,0.2)',
                transition: 'all .15s',
                '&:last-child': { borderRight: 'none' },
                '&:hover': active !== key ? { bgcolor: 'rgba(255,255,255,0.12)' } : {},
                userSelect: 'none',
            }}>
                {icon}{label}
            </Box>
        ))}
    </Box>
);

// ── ModeToggle ────────────────────────────────────────────────────────────────
const ModeToggle: React.FC<{ active: 'manual' | 'auto'; onChange: (v: 'manual' | 'auto') => void }> = ({ active, onChange }) => (
    <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', overflow: 'hidden', bgcolor: '#fff' }}>
        {(['manual', 'auto-plan'] as const).map(key => {
            const k = key === 'auto-plan' ? 'auto' : 'manual';
            return (
                <Box key={key} onClick={() => onChange(k)} sx={{
                    px: 1.5, py: 0.5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    bgcolor: active === k ? MAROON : '#fff',
                    color: active === k ? '#fff' : '#555',
                    transition: 'all .15s',
                    '&:hover': active !== k ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
                    userSelect: 'none',
                }}>
                    {key === 'auto-plan' ? 'Auto-plan' : 'Manual'}
                </Box>
            );
        })}
    </Box>
);

// ── MonthChip ─────────────────────────────────────────────────────────────────
const MonthChip: React.FC<{
    name: string; type: 'past' | 'present' | 'future-manual' | 'future-auto';
    sub: string; selected?: boolean; onClick?: () => void;
    items?: MonthItem[]; onAdd?: () => void;
}> = ({ name, type, sub, selected, onClick, items = [], onAdd }) => {
    const [addHover, setAddHover] = useState(false);
    const BG     = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
    const BORDER = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.4), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
    const COLOR  = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
    const TAG    = { present: { label: 'now', bg: MAROON, fg: '#fff' }, 'future-manual': { label: 'planned', bg: '#85B7EB', fg: '#042C53' }, 'future-auto': { label: 'predicted', bg: '#97C459', fg: '#173404' } } as any;
    const tag    = TAG[type];

    const goals    = items.filter(it => it.kind === 'goal')  as MonthGoalItem[];
    const plans    = items.filter(it => it.kind === 'plan')  as MonthPlanItem[];
    const atRisk   = items.some(it => it.status === 'at-risk' || it.status === 'overdue');
    const hasItems = items.length > 0;

    return (
        <Box onClick={onClick} sx={{
            flex: 1, position: 'relative', pt: tag ? 1.5 : 0.75, pb: 0.625, px: 0.5,
            borderRadius: '6px', cursor: onClick ? 'pointer' : 'default', textAlign: 'center',
            bgcolor: BG[type], border: `1px solid ${selected ? MAROON : BORDER[type]}`,
            outline: selected ? `2px solid ${MAROON}` : 'none', outlineOffset: '1px',
            transition: 'outline .1s, box-shadow .12s',
            boxShadow: selected ? `0 2px 10px ${alpha(MAROON, 0.14)}` : 'none',
            '&:hover': onClick ? { outline: `2px solid ${alpha(MAROON, 0.35)}`, outlineOffset: '1px' } : {},
        }}>
            {tag && (
                <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 700, px: 0.75, py: 0.1, borderRadius: '3px', whiteSpace: 'nowrap', bgcolor: tag.bg, color: tag.fg }}>
                    {tag.label}
                </Box>
            )}
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLOR[type] }}>{name}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: alpha(COLOR[type], 0.7), mt: 0.2 }}>{sub}</Typography>
            {hasItems && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.375, mt: 0.5, flexWrap: 'wrap' }}>
                    {goals.slice(0, 3).map(g => (
                        <Box key={g.id} title={g.label} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: g.color, flexShrink: 0, border: '1.5px solid white', boxShadow: g.status === 'at-risk' ? `0 0 0 1.5px ${AMBER}` : 'none' }} />
                    ))}
                    {plans.length > 0 && (
                        <Box sx={{ fontSize: '0.57rem', fontWeight: 700, px: 0.5, py: '1px', borderRadius: '3px', bgcolor: alpha(PURPLE, 0.1), color: PURPLE, lineHeight: 1.4 }}>
                            {plans.length}p
                        </Box>
                    )}
                    {atRisk && <Typography sx={{ fontSize: '0.6rem', color: AMBER, lineHeight: 1 }}>⚠</Typography>}
                </Box>
            )}
            {onAdd && (
                <Box
                    onMouseEnter={() => setAddHover(true)}
                    onMouseLeave={() => setAddHover(false)}
                    onClick={e => { e.stopPropagation(); onAdd(); }}
                    sx={{ mt: 0.5, py: '2px', borderRadius: '3px', cursor: 'pointer', bgcolor: addHover ? alpha(MAROON, 0.08) : 'transparent', color: addHover ? MAROON : alpha(SLATE, 0.35), fontSize: '0.6rem', fontWeight: 700, transition: 'all .12s', userSelect: 'none' }}
                >+ add</Box>
            )}
        </Box>
    );
};

// ── AddItemModal ──────────────────────────────────────────────────────────────
const PLAN_TYPES: { value: PlanType; label: string; color: string }[] = [
    { value: 'payment',      label: 'Payment',      color: PURPLE },
    { value: 'subscription', label: 'Subscription', color: BLUE   },
    { value: 'savings',      label: 'Savings goal', color: GREEN  },
    { value: 'bill',         label: 'Bill',         color: AMBER  },
    { value: 'custom',       label: 'Custom',       color: SLATE  },
];
const GOAL_COLORS = [GREEN, BLUE, AMBER, TEAL, PURPLE, RED];

const STATUS_STYLES: Record<ItemStatus, { bg: string; color: string; label: string }> = {
    'on-track': { bg: alpha(GREEN, 0.1),  color: GREEN,  label: 'On track' },
    'at-risk':  { bg: alpha(AMBER, 0.1),  color: AMBER,  label: 'At risk'  },
    'paid':     { bg: alpha(GREEN, 0.08), color: GREEN,  label: 'Paid'     },
    'pending':  { bg: alpha(NAVY, 0.07),  color: SLATE,  label: 'Pending'  },
    'overdue':  { bg: alpha(RED, 0.1),    color: RED,    label: 'Overdue'  },
};

const AddItemModal: React.FC<{
    monthName: string;
    onClose:   () => void;
    onAdd:     (item: MonthItem) => void;
}> = ({ monthName, onClose, onAdd }) => {
    const [tab,    setTab]    = useState<'plan' | 'goal'>('plan');
    const [label,  setLabel]  = useState('');
    const [amount, setAmount] = useState('');
    const [due,    setDue]    = useState('');
    const [type,   setType]   = useState<PlanType>('payment');
    const [color,  setColor]  = useState(GREEN);
    const [status, setStatus] = useState<ItemStatus>('pending');
    const valid = label.trim() && amount;

    const submit = () => {
        if (!valid) return;
        const base = { id: Math.random().toString(36).slice(2), label: label.trim(), amount: Number(amount) };
        if (tab === 'goal') {
            onAdd({ ...base, kind: 'goal', color, status: status === 'pending' ? 'on-track' : status as ItemStatus });
        } else {
            onAdd({ ...base, kind: 'plan', type, due: due || null, status });
        }
        onClose();
    };

    return (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(0,0,0,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '12px', width: 420, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, px: 2.25, py: 1.375, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Add to {monthName}</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>Attach a goal or payment plan to this month</Typography>
                    </Box>
                    <Box onClick={onClose} sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1, px: 0.5 }}>✕</Box>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: `1px solid ${alpha('#000', 0.08)}` }}>
                    {([['plan', 'Payment / Plan'], ['goal', 'Budget Goal']] as const).map(([t, l]) => (
                        <Box key={t} onClick={() => setTab(t)} sx={{ flex: 1, py: 1.125, textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: tab === t ? MAROON : SLATE, borderBottom: tab === t ? `2px solid ${MAROON}` : '2px solid transparent', transition: 'all .15s' }}>
                            {l}
                        </Box>
                    ))}
                </Box>
                <Box sx={{ px: 2.25, py: 1.75 }}>
                    {tab === 'plan' ? (
                        <>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Type</Typography>
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                    {PLAN_TYPES.map(pt => (
                                        <Box key={pt.value} onClick={() => setType(pt.value)} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1.5px solid ${type === pt.value ? pt.color : alpha('#000', 0.12)}`, bgcolor: type === pt.value ? alpha(pt.color, 0.08) : 'white', color: type === pt.value ? pt.color : SLATE, fontSize: '0.71rem', fontWeight: 600, transition: 'all .12s' }}>
                                            {pt.label}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            <Box sx={{ mb: 1.25 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Label</Typography>
                                <Box component="input" value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} placeholder="e.g. Car payment, Annual renewal..." sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.125, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.25 }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Amount</Typography>
                                    <Box sx={{ position: 'relative' }}>
                                        <Typography sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.82rem' }}>$</Typography>
                                        <Box component="input" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="0" sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', pl: 2.5, pr: 1, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Due date</Typography>
                                    <Box component="input" value={due} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDue(e.target.value)} placeholder={`e.g. ${monthName} 15`} sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.125, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                                </Box>
                            </Box>
                            <Box sx={{ mb: 1.75 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Status</Typography>
                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                    {(['pending', 'paid', 'overdue'] as ItemStatus[]).map(s => (
                                        <Box key={s} onClick={() => setStatus(s)} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1.5px solid ${status === s ? STATUS_STYLES[s].color : alpha('#000', 0.12)}`, bgcolor: status === s ? STATUS_STYLES[s].bg : 'white', color: status === s ? STATUS_STYLES[s].color : SLATE, fontSize: '0.71rem', fontWeight: 600, textTransform: 'capitalize', transition: 'all .12s' }}>
                                            {s}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box sx={{ mb: 1.25 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Goal name</Typography>
                                <Box component="input" value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} placeholder="e.g. Emergency fund, Trip deposit..." sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.125, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                            </Box>
                            <Box sx={{ mb: 1.25 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Target amount</Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <Typography sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.82rem' }}>$</Typography>
                                    <Box component="input" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="0" sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', pl: 2.5, pr: 1, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                                </Box>
                            </Box>
                            <Box sx={{ mb: 1.25 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Color</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {GOAL_COLORS.map(c => (
                                        <Box key={c} onClick={() => setColor(c)} sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: color === c ? `2.5px solid ${NAVY}` : '2px solid transparent', boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : 'none', transition: 'all .12s' }} />
                                    ))}
                                </Box>
                            </Box>
                            <Box sx={{ mb: 1.75 }}>
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Status</Typography>
                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                    {(['on-track', 'at-risk'] as ItemStatus[]).map(s => (
                                        <Box key={s} onClick={() => setStatus(s)} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1.5px solid ${status === s ? STATUS_STYLES[s].color : alpha('#000', 0.12)}`, bgcolor: status === s ? STATUS_STYLES[s].bg : 'white', color: status === s ? STATUS_STYLES[s].color : SLATE, fontSize: '0.71rem', fontWeight: 600, transition: 'all .12s' }}>
                                            {STATUS_STYLES[s].label}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Box onClick={onClose} sx={{ px: 2, py: 0.75, borderRadius: '7px', border: `1px solid ${alpha('#000', 0.14)}`, color: SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</Box>
                        <Box onClick={submit} sx={{ px: 2, py: 0.75, borderRadius: '7px', bgcolor: valid ? MAROON : alpha('#000', 0.1), color: valid ? '#fff' : SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: valid ? 'pointer' : 'default', transition: 'all .15s' }}>
                            Add to {monthName}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// ── MonthDetailPanel ──────────────────────────────────────────────────────────
const MonthDetailPanel: React.FC<{
    monthName:    string;
    items:        MonthItem[];
    onAddItem:    () => void;
    onUpdateItem: (id: string, status: ItemStatus) => void;
}> = ({ monthName, items, onAddItem, onUpdateItem }) => {
    const goals       = items.filter(it => it.kind === 'goal') as MonthGoalItem[];
    const plans       = items.filter(it => it.kind === 'plan') as MonthPlanItem[];
    const atRiskCount = items.filter(it => it.status === 'at-risk' || it.status === 'overdue').length;

    return (
        <Box sx={{ borderRadius: '9px', border: `1px solid ${alpha(MAROON, 0.13)}`, overflow: 'hidden', bgcolor: '#fff', mt: 1.25, mb: 0.5 }}>
            <Box sx={{ px: 1.75, py: 1, background: `linear-gradient(90deg, ${alpha(MAROON, 0.05)} 0%, transparent 100%)`, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {monthName} — goals &amp; plans
                    </Typography>
                    {atRiskCount > 0 && (
                        <Box sx={{ fontSize: '0.61rem', fontWeight: 700, px: 0.75, py: '1px', borderRadius: '10px', bgcolor: alpha(AMBER, 0.12), color: AMBER }}>
                            ⚠ {atRiskCount} at risk
                        </Box>
                    )}
                </Box>
                <Box onClick={onAddItem} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1px solid ${alpha(MAROON, 0.2)}`, bgcolor: alpha(MAROON, 0.04), color: MAROON, fontSize: '0.71rem', fontWeight: 600, transition: 'all .12s', '&:hover': { bgcolor: alpha(MAROON, 0.08) } }}>
                    + Add goal or plan
                </Box>
            </Box>
            {items.length === 0 ? (
                <Box sx={{ px: 1.75, py: 1.75, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.77rem', color: SLATE }}>No goals or plans attached to {monthName} yet.</Typography>
                    <Box onClick={onAddItem} sx={{ mt: 0.25, px: 1.5, py: 0.625, borderRadius: '6px', cursor: 'pointer', border: `0.5px dashed ${alpha('#000', 0.2)}`, color: SLATE, fontSize: '0.73rem', fontWeight: 500, transition: 'all .12s', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
                        + Attach something to this month
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <Box sx={{ px: 1.75, py: 1.125, borderRight: `0.5px solid ${alpha('#000', 0.07)}` }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.875 }}>
                            Budget goals{goals.length > 0 ? ` (${goals.length})` : ''}
                        </Typography>
                        {goals.length === 0
                            ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>None attached.</Typography>
                            : goals.map(g => {
                                const ss = STATUS_STYLES[g.status];
                                return (
                                    <Box key={g.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.125, py: 0.75, mb: 0.625, borderRadius: '7px', border: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: g.status === 'at-risk' ? alpha(AMBER, 0.04) : '#fafbfc', '&:last-child': { mb: 0 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: g.color, flexShrink: 0 }} />
                                            <Box>
                                                <Typography sx={{ fontSize: '0.76rem', fontWeight: 500, color: NAVY }}>{g.label}</Typography>
                                                <Typography sx={{ fontSize: '0.64rem', color: SLATE }}>target: ${g.amount.toLocaleString()}</Typography>
                                            </Box>
                                        </Box>
                                        <Box onClick={() => onUpdateItem(g.id, g.status === 'on-track' ? 'at-risk' : 'on-track')} sx={{ fontSize: '0.61rem', fontWeight: 700, px: 0.75, py: '2px', borderRadius: '4px', bgcolor: ss.bg, color: ss.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .12s' }}>
                                            {ss.label}
                                        </Box>
                                    </Box>
                                );
                            })
                        }
                    </Box>
                    <Box sx={{ px: 1.75, py: 1.125 }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.875 }}>
                            Payment plans{plans.length > 0 ? ` (${plans.length})` : ''}
                        </Typography>
                        {plans.length === 0
                            ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>None attached.</Typography>
                            : plans.map(p => {
                                const ss = STATUS_STYLES[p.status];
                                const tc = PLAN_TYPES.find(pt => pt.value === p.type)?.color ?? SLATE;
                                return (
                                    <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.125, py: 0.75, mb: 0.625, borderRadius: '7px', border: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: p.status === 'overdue' ? alpha(RED, 0.04) : '#fafbfc', '&:last-child': { mb: 0 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: tc, flexShrink: 0 }} />
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.76rem', fontWeight: 500, color: NAVY }}>{p.label}</Typography>
                                                    <Box sx={{ fontSize: '0.57rem', fontWeight: 700, px: 0.5, py: '1px', borderRadius: '3px', bgcolor: alpha(tc, 0.1), color: tc, textTransform: 'capitalize' }}>{p.type}</Box>
                                                </Box>
                                                <Typography sx={{ fontSize: '0.64rem', color: SLATE }}>${p.amount.toLocaleString()}{p.due ? ` · due ${p.due}` : ''}</Typography>
                                            </Box>
                                        </Box>
                                        <Box onClick={() => onUpdateItem(p.id, p.status === 'paid' ? 'pending' : 'paid')} sx={{ fontSize: '0.61rem', fontWeight: 700, px: 0.75, py: '2px', borderRadius: '4px', bgcolor: ss.bg, color: ss.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .12s' }}>
                                            {ss.label}
                                        </Box>
                                    </Box>
                                );
                            })
                        }
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// ── PeriodBars ────────────────────────────────────────────────────────────────
const PeriodBars: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const BAR_COLORS = { past: '#B4B2A9', present: MAROON, 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
    return (
        <Box sx={{ display: 'flex', gap: '2px', my: 0.75 }}>
            {template.periods.map((_, pi) => {
                const type    = getPeriodType(template, pi);
                const opacity = type === 'future-auto' ? Math.max(0.2, 0.5 + (0.5 - pi * 0.03)) : 1;
                return <Box key={pi} sx={{ flex: 1, height: 5, borderRadius: '2px', bgcolor: BAR_COLORS[type], opacity }} />;
            })}
        </Box>
    );
};

// ── BudgetGoalsCard ───────────────────────────────────────────────────────────
const BudgetGoalsCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const salaryRow       = template.rows.find(r => r.rowType === 'salary');
    const expRow          = template.rows.find(r => r.rowType === 'expenses');
    const totalInc        = salaryRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const totalExp        = expRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const savingsFloorPct = totalInc > 0 ? Math.min(100, Math.round(((totalInc - totalExp) / totalInc) * 100 * 5)) : 0;
    const goals = [
        { name: 'Savings floor',   detail: `$500/period · ${Math.min(100, savingsFloorPct + 30)}% there`, dot: '#059669', pct: Math.min(100, savingsFloorPct + 30), ok: true },
        { name: 'Car repair fund', detail: '$1,200 by Apr · 100% funded',                                 dot: '#378ADD', pct: 100,                                 ok: true },
        { name: 'Trip deposit',    detail: '$800 by May · 100% funded',                                   dot: '#d97706', pct: 100,                                 ok: true },
    ];
    return (
        <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
            <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget goals</Typography>
            </Box>
            <Box sx={{ p: 1.5 }}>
                {goals.map(g => (
                    <Box key={g.name} sx={{ mb: 1.25, '&:last-child': { mb: 0 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.dot, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: NAVY }}>{g.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE, ml: 2, mb: 0.5 }}>{g.detail}</Typography>
                        <Box sx={{ ml: 2, height: 4, bgcolor: alpha('#000', 0.07), borderRadius: '2px', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${g.pct}%`, bgcolor: g.dot, borderRadius: '2px' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.67rem', color: g.ok ? GREEN : AMBER, ml: 2, mt: 0.3, fontWeight: 500 }}>
                            {g.ok ? 'On track' : 'At risk'}
                        </Typography>
                    </Box>
                ))}
                <Box sx={{ mt: 1.25, pt: 1, borderTop: `0.5px solid ${alpha('#000', 0.07)}` }}>
                    <Box sx={{ width: '100%', py: 0.625, borderRadius: '6px', border: `0.5px dashed ${alpha('#000', 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
                        <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>+ Add goal</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// ── BalanceTrajectoryCard ─────────────────────────────────────────────────────
const BalanceTrajectoryCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const trajectory = useMemo(() => {
        const salRow = template.rows.find(r => r.rowType === 'salary');
        const expRow = template.rows.find(r => r.rowType === 'expenses');
        let running  = 0;
        return template.periods.map((label, pi) => {
            running += (salRow?.values[pi] ?? 0) - (expRow?.values[pi] ?? 0);
            return { label, bal: Math.round(running), type: getPeriodType(template, pi) };
        });
    }, [template]);

    const pastRows   = trajectory.filter(t => t.type === 'past').slice(-2);
    const futureRows = trajectory.filter(t => t.type !== 'past').slice(0, 4);
    const rows       = [...pastRows, ...futureRows];
    const endBal     = trajectory[trajectory.length - 1];

    return (
        <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
            <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance trajectory</Typography>
            </Box>
            <Box sx={{ p: 1.5 }}>
                {rows.length === 0
                    ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>No period data yet.</Typography>
                    : rows.map(t => (
                        <Box key={t.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: t.type === 'past' ? SLATE : NAVY }}>{t.label}</Typography>
                                {t.type === 'future-auto' && <Typography sx={{ fontSize: '0.62rem', color: '#639922', fontWeight: 500 }}>pred</Typography>}
                                {t.type === 'past' && <Typography sx={{ fontSize: '0.62rem', color: SLATE, opacity: 0.6 }}>actual</Typography>}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: t.bal >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>{fmtC(t.bal)}</Typography>
                                <Typography sx={{ fontSize: '0.67rem', color: SLATE, minWidth: 55, textAlign: 'right' }}>
                                    {t.type === 'past' ? 'actual' : t.type === 'future-auto' ? 'est' : 'projected'}
                                </Typography>
                            </Box>
                        </Box>
                    ))
                }
                {endBal && rows.length > 0 && endBal.label !== rows[rows.length - 1]?.label && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.875, mt: 0.25 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY }}>End of plan</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: endBal.bal >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>{fmtC(endBal.bal)}</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: SLATE, minWidth: 55, textAlign: 'right' }}>end of plan</Typography>
                        </Box>
                    </Box>
                )}
                <Box sx={{ mt: 1.25, py: 0.625, borderRadius: '6px', border: `0.5px solid ${alpha('#000', 0.15)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
                    <Typography sx={{ fontSize: '0.75rem', color: NAVY }}>Run a scenario ↗</Typography>
                </Box>
            </Box>
        </Box>
    );
};

// ── SpendingSignalsCard ───────────────────────────────────────────────────────
const SpendingSignalsCard: React.FC<{ template: SpreadsheetTemplate; selectedPi: number }> = ({ template, selectedPi }) => {
    const signals = useMemo(() => {
        const out: { label: string; msg: string }[] = [];
        template.rows.filter(r => r.rowType === 'expense').forEach(row => {
            const actual = row.values[selectedPi] ?? null;
            if (!actual) return;
            const pastVals = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && !isPeriodFuture(template, i) && i !== selectedPi).map(({ v }) => v as number);
            if (!pastVals.length) return;
            const avg = pastVals.reduce((a, b) => a + b, 0) / pastVals.length;
            if (actual > avg * 1.15) out.push({ label: row.label, msg: `is $${Math.round(actual - avg * 1.15)} over the avg +15% cap of $${Math.round(avg * 1.15)}.` });
        });
        return out.slice(0, 4);
    }, [template, selectedPi]);

    if (!signals.length) return null;
    return (
        <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
            <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Spending signals</Typography>
            </Box>
            <Box sx={{ p: 1.5 }}>
                {signals.map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none', pb: 0 } }}>
                        <Box sx={{ width: 18, height: 18, borderRadius: '3px', bgcolor: alpha(RED, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
                            <Typography sx={{ fontSize: '0.62rem', color: RED, fontWeight: 700 }}>▲</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: NAVY, lineHeight: 1.4 }}><strong>{s.label}</strong> {s.msg}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// ── WhatIfScenario ────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════

interface ScenarioCut { label: string; color: string; base: number; min: number; max: number }

const WhatIfScenario: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const expenseRows = template.rows.filter(r => r.rowType === 'expense');
    const salaryRow   = template.rows.find(r => r.rowType === 'salary');

    const baselineIncome: number[] = template.periods.map((_, pi) => salaryRow?.values[pi] ?? 0);
    const baselineExp:    number[] = template.periods.map((_, pi) =>
        expenseRows.reduce((s, r) => s + (r.values[pi] ?? 0), 0)
    );

    const baselineBals: number[] = useMemo(() => {
        let run = 0;
        return template.periods.map((_, pi) => { run += baselineIncome[pi] - baselineExp[pi]; return run; });
    }, [template]);

    const categories: ScenarioCut[] = useMemo(() =>
            expenseRows.map(row => {
                const vals  = row.values.filter((v): v is number => v !== null && v > 0);
                const avg   = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                const color = CAT_COLORS[row.label] ?? SLATE;
                return { label: row.label, color, base: avg, min: 0, max: Math.round(avg * 1.6) };
            }).filter(c => c.base > 0),
        [expenseRows]);

    const [cuts, setCuts] = useState<Record<string, number>>(() =>
        Object.fromEntries(categories.map(c => [c.label, c.base]))
    );
    const [applyFrom, setApplyFrom] = useState<number>(() => {
        const pi = template.periods.findIndex((_, i) => isPeriodPresent(template, i));
        return pi >= 0 ? pi : 0;
    });
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const PRESETS = [
        { id: 'aggressive', label: 'Aggressive cuts', factor: 0.65 },
        { id: 'moderate',   label: 'Moderate cuts',   factor: 0.80 },
        { id: 'goal',       label: 'Goal-focused',    factor: 0.90 },
    ];
    const applyPreset = (factor: number, id: string) => {
        setActivePreset(id);
        setCuts(Object.fromEntries(categories.map(c => [c.label, Math.round(c.base * factor)])));
    };
    const resetAll = () => {
        setActivePreset(null);
        setCuts(Object.fromEntries(categories.map(c => [c.label, c.base])));
    };

    const { scenarioBals, savedPerPeriod, cumulativeExtra } = useMemo(() => {
        const spp = categories.reduce((sum, c) => sum + (c.base - (cuts[c.label] ?? c.base)), 0);
        let run   = 0;
        const bals = template.periods.map((_, pi) => {
            const extra = pi >= applyFrom ? spp : 0;
            run += baselineIncome[pi] - baselineExp[pi] + extra;
            return run;
        });
        const cum = spp * Math.max(0, template.periods.length - applyFrom);
        return { scenarioBals: bals, savedPerPeriod: spp, cumulativeExtra: cum };
    }, [cuts, applyFrom, categories, baselineIncome, baselineExp, template.periods.length]);

    const totalInc   = baselineIncome.reduce((a, b) => a + b, 0);
    const baseRate   = totalInc > 0 ? ((totalInc - baselineExp.reduce((a, b) => a + b, 0)) / totalInc) * 100 : 0;
    const scenRate   = totalInc > 0 ? baseRate + (savedPerPeriod / totalInc) * template.periods.length * 100 : 0;
    const endBal     = baselineBals[baselineBals.length - 1] ?? 0;
    const endScenBal = scenarioBals[scenarioBals.length - 1] ?? 0;

    const W = 560, H = 180;
    const PAD = { t: 16, r: 16, b: 32, l: 52 };
    const CW  = W - PAD.l - PAD.r;
    const CH  = H - PAD.t - PAD.b;
    const n   = template.periods.length;

    const allVals = [...baselineBals, ...scenarioBals];
    const minV    = Math.min(...allVals, 0);
    const maxV    = Math.max(...allVals, 1);
    const range   = maxV - minV || 1;

    const px = (i: number) => PAD.l + (i / Math.max(n - 1, 1)) * CW;
    const py = (v: number) => PAD.t + CH - ((v - minV) / range) * CH;

    const basePts = baselineBals.map((v, i) => ({ x: px(i), y: py(v) }));
    const scenPts = scenarioBals.map((v, i) => ({ x: px(i), y: py(v) }));

    const areaD = scenPts.length >= 2
        ? `${smoothPath(scenPts)} L ${scenPts[scenPts.length - 1].x},${py(minV)} L ${scenPts[0].x},${py(minV)} Z`
        : '';

    const tickStep = range > 3000 ? 1000 : range > 1000 ? 500 : range > 400 ? 200 : 100;
    const ticks: number[] = [];
    for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV; v += tickStep) ticks.push(v);

    const goalsData = useMemo(() => {
        const salTotal     = baselineIncome.reduce((a, b) => a + b, 0);
        const expTotal     = baselineExp.reduce((a, b) => a + b, 0);
        const baseNetSaved = salTotal - expTotal;
        return [
            { label: 'Savings floor — $500/period',    dot: GREEN, basePct: Math.min(100, Math.round((baseNetSaved / Math.max(template.periods.length, 1) / 500) * 100)), scenPct: Math.min(100, Math.round(((baseNetSaved + cumulativeExtra) / Math.max(template.periods.length, 1) / 500) * 100)) },
            { label: 'Car repair fund — $1,200 by Apr', dot: BLUE,  basePct: 30,  scenPct: Math.min(100, 30  + Math.round(cumulativeExtra * 0.025)) },
            { label: 'Trip deposit — $800 by May',      dot: AMBER, basePct: 10,  scenPct: Math.min(100, 10  + Math.round(cumulativeExtra * 0.015)) },
        ];
    }, [baselineIncome, baselineExp, cumulativeExtra, template.periods.length]);

    return (
        <Box>
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, borderRadius: '8px', px: 2, py: 1.375, mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>What-if scenario explorer</Typography>
                    <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>Drag sliders to cut category spending · see live impact on balance and goals</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {PRESETS.map(p => (
                        <Box key={p.id} onClick={() => applyPreset(p.factor, p.id)} sx={{ px: 1.25, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1px solid ${activePreset === p.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)'}`, bgcolor: activePreset === p.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.71rem', fontWeight: 600, transition: 'all .15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, userSelect: 'none' }}>
                            {p.label}
                        </Box>
                    ))}
                    <Box onClick={resetAll} sx={{ px: 1.25, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: '0.71rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, userSelect: 'none' }}>Reset</Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.25, mb: 2.5 }}>
                {[
                    { label: 'End balance — baseline', baseline: fmtC(endBal),     val: fmtC(endScenBal),                                       color: endScenBal >= 0 ? GREEN : RED,                             sub: savedPerPeriod === 0 ? 'no change yet' : `vs ${fmtC(endBal)} baseline` },
                    { label: 'Extra saved total',       baseline: '$0',              val: cumulativeExtra > 0 ? `+${fmtC(cumulativeExtra)}` : '$0', color: cumulativeExtra > 0 ? GREEN : NAVY,                        sub: `across ${template.periods.length - applyFrom} periods` },
                    { label: 'Savings rate',            baseline: `${baseRate.toFixed(1)}%`, val: `${scenRate.toFixed(1)}%`,                      color: scenRate >= 10 ? GREEN : scenRate >= 0 ? AMBER : RED,      sub: scenRate >= 10 ? 'on target' : 'below 10% target' },
                    { label: 'Goals unlocked',          baseline: `${goalsData.filter(g => g.basePct >= 90).length} of 3`, val: `${goalsData.filter(g => g.scenPct >= 90).length} of 3`, color: goalsData.filter(g => g.scenPct >= 90).length === 3 ? GREEN : RED, sub: goalsData.filter(g => g.scenPct >= 90).length < 3 ? 'car fund at risk' : 'all goals funded' },
                ].map((k, i) => (
                    <Box key={i} sx={{ bgcolor: '#fff', borderRadius: '8px', px: 1.5, py: 1.125, border: `0.5px solid ${alpha('#000', 0.09)}`, boxShadow: `0 1px 6px ${alpha('#000', 0.04)}` }}>
                        <Typography sx={{ fontSize: '0.67rem', color: SLATE, mb: 0.25 }}>{k.label}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.55), textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{k.baseline}</Typography>
                        <Typography sx={{ fontSize: '1.28rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, transition: 'color .25s' }}>{k.val}</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: SLATE, mt: 0.2 }}>{k.sub}</Typography>
                    </Box>
                ))}
            </Box>

            <Grid container spacing={2.5} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, overflow: 'hidden' }}>
                        <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Spending cuts per period</Typography>
                        </Box>
                        <Box sx={{ px: 1.75, pt: 1.375, pb: 0.875, borderBottom: `0.5px solid ${alpha('#000', 0.06)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: SLATE, whiteSpace: 'nowrap' }}>Apply from:</Typography>
                            <Box component="select" value={applyFrom} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setApplyFrom(Number(e.target.value))} sx={{ flex: 1, border: `1px solid ${alpha('#000', 0.14)}`, borderRadius: '5px', px: 0.875, py: 0.375, fontSize: '0.75rem', color: NAVY, bgcolor: '#fff', cursor: 'pointer', fontFamily: 'inherit', '&:focus': { outline: `1.5px solid ${MAROON}`, outlineOffset: '1px' } }}>
                                {template.periods.map((p, i) => <option key={i} value={i}>{p}</option>)}
                            </Box>
                        </Box>
                        <Box sx={{ px: 1.75, py: 1.25, maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                            {categories.map(cat => {
                                const val     = cuts[cat.label] ?? cat.base;
                                const delta   = val - cat.base;
                                const pctFill = ((val - cat.min) / Math.max(cat.max - cat.min, 1)) * 100;
                                return (
                                    <Box key={cat.label} sx={{ mb: 1.75, '&:last-child': { mb: 0 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: cat.color, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.79rem', fontWeight: 500, color: NAVY }}>{cat.label}</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: delta < 0 ? GREEN : delta > 0 ? RED : NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                                    ${fmtS(val)}<Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 400, color: SLATE }}> / period</Typography>
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.67rem', color: delta < 0 ? GREEN : delta > 0 ? RED : SLATE, fontWeight: delta !== 0 ? 600 : 400 }}>
                                                    {delta !== 0 ? `${delta > 0 ? '+' : '-'}$${fmtS(Math.abs(delta))} vs baseline` : 'no change'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.08) }} />
                                            <Box sx={{ position: 'absolute', left: 0, width: `${pctFill}%`, height: 4, borderRadius: 2, bgcolor: delta < 0 ? GREEN : delta > 0 ? RED : alpha(NAVY, 0.3), transition: 'width .1s, background-color .2s' }} />
                                            <Box sx={{ position: 'absolute', left: `${((cat.base - cat.min) / Math.max(cat.max - cat.min, 1)) * 100}%`, width: 2, height: 10, bgcolor: alpha(NAVY, 0.25), borderRadius: 1, transform: 'translateX(-50%)' }} />
                                            <Box component="input" type="range" min={cat.min} max={cat.max} step={5} value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setActivePreset(null); setCuts(p => ({ ...p, [cat.label]: Number(e.target.value) })); }} sx={{ position: 'absolute', left: 0, right: 0, width: '100%', m: 0, appearance: 'none', bgcolor: 'transparent', cursor: 'pointer', zIndex: 1, height: 20, '&::-webkit-slider-thumb': { appearance: 'none', width: 16, height: 16, borderRadius: '50%', bgcolor: MAROON, border: '2.5px solid #fff', boxShadow: `0 1px 5px ${alpha(MAROON, 0.4)}`, cursor: 'pointer', mt: '-6px' }, '&::-webkit-slider-runnable-track': { height: 4, background: 'transparent' }, '&:focus': { outline: 'none' } }} />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
                                            <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>${fmtS(cat.min)}</Typography>
                                            <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>${fmtS(cat.max)}</Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                        <Box sx={{ px: 1.75, py: 1.125, borderTop: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: savedPerPeriod > 0 ? alpha(GREEN, 0.04) : alpha('#000', 0.02) }}>
                            {[
                                { label: 'Total saved per period', val: savedPerPeriod > 0 ? `+$${fmtS(savedPerPeriod)}` : '$0', color: savedPerPeriod > 0 ? GREEN : NAVY },
                                { label: `Cumulative extra by ${template.periods[template.periods.length - 1] ?? 'end'}`, val: cumulativeExtra > 0 ? `+$${fmtS(cumulativeExtra)}` : '$0', color: cumulativeExtra > 0 ? GREEN : NAVY },
                            ].map(row => (
                                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
                                    <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>{row.label}</Typography>
                                    <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums', transition: 'color .25s' }}>{row.val}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Stack spacing={2}>
                        <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, overflow: 'hidden' }}>
                            <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance trajectory</Typography>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    {[{ stroke: alpha('#000', 0.25), dash: '', label: 'Baseline' }, { stroke: GREEN, dash: '', label: 'Scenario' }, { stroke: alpha(AMBER, 0.6), dash: '4 3', label: 'Balance floor' }].map(l => (
                                        <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box component="svg" width={18} height={8}><line x1="0" y1="4" x2="18" y2="4" stroke={l.stroke} strokeWidth="2" strokeDasharray={l.dash} strokeLinecap="round" /></Box>
                                            <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>{l.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            <Box sx={{ px: 1.5, py: 1.5 }}>
                                <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                                    <defs>
                                        <linearGradient id="scen-fill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={GREEN} stopOpacity="0.15" />
                                            <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
                                        </linearGradient>
                                    </defs>
                                    {ticks.map(v => <line key={v} x1={PAD.l} y1={py(v)} x2={PAD.l + CW} y2={py(v)} stroke={alpha('#000', 0.05)} strokeWidth="1" />)}
                                    {ticks.map(v => <text key={v} x={PAD.l - 6} y={py(v) + 4} textAnchor="end" fontSize="10" fill={SLATE}>{v < 0 ? `-$${fmtS(Math.abs(v))}` : `$${fmtS(v)}`}</text>)}
                                    {template.periods.map((p, i) => <text key={i} x={px(i)} y={PAD.t + CH + 18} textAnchor="middle" fontSize="10" fill={isPeriodPresent(template, i) ? MAROON : SLATE} fontWeight={isPeriodPresent(template, i) ? '700' : '400'}>{p}</text>)}
                                    {minV < 0 && maxV > 0 && <line x1={PAD.l} y1={py(0)} x2={PAD.l + CW} y2={py(0)} stroke={alpha('#000', 0.12)} strokeWidth="1" strokeDasharray="3 3" />}
                                    {py(500) > PAD.t && py(500) < PAD.t + CH && <line x1={PAD.l} y1={py(500)} x2={PAD.l + CW} y2={py(500)} stroke={alpha(AMBER, 0.55)} strokeWidth="1.5" strokeDasharray="5 3" />}
                                    {areaD && <path d={areaD} fill="url(#scen-fill)" />}
                                    <path d={smoothPath(basePts)} fill="none" stroke={alpha('#000', 0.22)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d={smoothPath(scenPts)} fill="none" stroke={GREEN} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                                    {scenarioBals.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="3.5" fill={v >= 0 ? GREEN : RED} stroke="#fff" strokeWidth="1.5" />)}
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, overflow: 'hidden' }}>
                            <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Goal impact</Typography>
                            </Box>
                            <Box sx={{ px: 1.75, py: 1.375 }}>
                                {goalsData.map(g => {
                                    const improved = g.scenPct > g.basePct;
                                    const barColor = g.scenPct >= 90 ? GREEN : improved ? BLUE : AMBER;
                                    const needMore = g.scenPct < 100 && cumulativeExtra > 0;
                                    return (
                                        <Box key={g.label} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.625 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.dot, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.77rem', fontWeight: 600, color: NAVY }}>{g.label}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                                                <Typography sx={{ fontSize: '0.65rem', color: SLATE, minWidth: 52 }}>Baseline</Typography>
                                                <Box sx={{ flex: 1, height: 6, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                                                    <Box sx={{ width: `${g.basePct}%`, height: '100%', bgcolor: alpha('#000', 0.2), borderRadius: '3px' }} />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.65rem', color: SLATE, minWidth: 28, textAlign: 'right' }}>{g.basePct}%</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: needMore ? 0.625 : 0 }}>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: NAVY, minWidth: 52 }}>Scenario</Typography>
                                                <Box sx={{ flex: 1, height: 6, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                                                    <Box sx={{ width: `${g.scenPct}%`, height: '100%', bgcolor: barColor, borderRadius: '3px', transition: 'width 0.3s ease, background-color 0.25s' }} />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: barColor, minWidth: 28, textAlign: 'right', transition: 'color .25s' }}>{Math.round(g.scenPct)}%</Typography>
                                            </Box>
                                            {needMore && (
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.875, py: '2px', borderRadius: '4px', bgcolor: alpha(AMBER, 0.1), border: `1px solid ${alpha(AMBER, 0.28)}` }}>
                                                    <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: AMBER }}>Need ${fmtS(Math.round((100 - g.scenPct) * 12))} more</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                                {savedPerPeriod === 0 ? (
                                    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '7px', bgcolor: '#fdf8f8', border: `1px solid ${alpha(MAROON, 0.1)}` }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY, mb: 0.375 }}>Move the sliders to explore your scenario</Typography>
                                        <Typography sx={{ fontSize: '0.71rem', color: SLATE, lineHeight: 1.5 }}>No cuts applied yet. Adjust any category to see live impact on goals and balance.</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '7px', bgcolor: alpha(GREEN, 0.05), border: `1px solid ${alpha(GREEN, 0.18)}` }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: GREEN, mb: 0.375 }}>Saving +${fmtS(savedPerPeriod)}/period from {template.periods[applyFrom]}</Typography>
                                        <Typography sx={{ fontSize: '0.71rem', color: SLATE, lineHeight: 1.5 }}>
                                            {goalsData.filter(g => g.scenPct >= 90).length === 3
                                                ? '✓ All 3 goals fully covered with this scenario.'
                                                : `${goalsData.filter(g => g.scenPct >= 90).length} of 3 goals covered — cut a bit more to unlock the rest.`}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Period-by-period comparison</Typography>
                <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.12)}`, boxShadow: `0 1px 8px ${alpha(MAROON, 0.05)}` }}>
                    <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none' } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fdf8f8' }}>
                                {['Period', 'Baseline bal', '', 'Scenario bal', 'Gain'].map((h, i) => (
                                    <TableCell key={i} align={i === 0 ? 'left' : 'right'} sx={{ fontWeight: 600, color: MAROON, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.125, px: 1.75, borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}` }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {template.periods.map((p, i) => {
                                const bb   = baselineBals[i] ?? 0;
                                const sb   = scenarioBals[i] ?? 0;
                                const gain = sb - bb;
                                const isP  = isPeriodPresent(template, i);
                                return (
                                    <TableRow key={i} sx={{ bgcolor: isP ? alpha(MAROON, 0.02) : i % 2 === 0 ? '#fff' : '#fafbfc', '&:hover': { bgcolor: alpha(MAROON, 0.025) } }}>
                                        <TableCell sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', color: isP ? MAROON : NAVY, fontWeight: isP ? 700 : 400, borderBottom: `0.5px solid ${alpha('#000', 0.04)}` }}>
                                            {p}{isP && <Box component="span" sx={{ ml: 0.75, fontSize: '0.6rem', px: 0.625, py: 0.1, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), color: MAROON, fontWeight: 700 }}>now</Box>}
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', color: bb >= 0 ? NAVY : RED, fontVariantNumeric: 'tabular-nums', borderBottom: `0.5px solid ${alpha('#000', 0.04)}` }}>{fmtC(bb)}</TableCell>
                                        <TableCell align="right" sx={{ py: 0.875, px: 0.5, fontSize: '0.65rem', color: gain > 0 ? GREEN : SLATE, borderBottom: `0.5px solid ${alpha('#000', 0.04)}` }}>{gain > 0 ? '▶' : ''}</TableCell>
                                        <TableCell align="right" sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', fontWeight: gain !== 0 ? 600 : 400, color: sb >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums', borderBottom: `0.5px solid ${alpha('#000', 0.04)}`, transition: 'color .2s' }}>{fmtC(sb)}</TableCell>
                                        <TableCell align="right" sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', fontWeight: 600, color: gain > 0 ? GREEN : gain < 0 ? RED : alpha(SLATE, 0.4), fontVariantNumeric: 'tabular-nums', borderBottom: `0.5px solid ${alpha('#000', 0.04)}`, transition: 'color .2s' }}>{gain > 0 ? `+${fmtC(gain)}` : gain < 0 ? fmtC(gain) : '—'}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            </Box>
        </Box>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// ── PlanningView ──────────────────────────────────────════════════════════════
// ════════════════════════════════════════════════════════════════════════════════

interface Props {
    template:        SpreadsheetTemplate;
    periodFilter:    PeriodFilter;
    onPeriodFilter:  (p: PeriodFilter) => void;
    onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
    onSaveTemplate?: () => void;
}

const PlanningView: React.FC<Props> = ({ template, periodFilter, onPeriodFilter, onCellChange, onSaveTemplate }) => {
    const [subView,           setSubView]           = useState<SubViewMode>('dashboard');
    const [mode,              setMode]              = useState<'manual' | 'auto'>('auto');
    const [categoryTargets,   setCategoryTargets]   = useState<CategoryTargets>({});
    const [monthItems,        setMonthItems]        = useState<MonthItemMap>({});
    const [addTarget,         setAddTarget]         = useState<string | null>(null);
    const [futurePeriodOpen,  setFuturePeriodOpen]  = useState(false);

    const defaultPeriod = useMemo(() => {
        const pi = template.periods.findIndex((_, pi) => isPeriodPresent(template, pi));
        if (pi >= 0) return pi;
        return template.periods.reduce((last, _, pi) => !isPeriodFuture(template, pi) ? pi : last, 0);
    }, [template]);

    const [selectedPeriod, setSelectedPeriod] = useState<number>(defaultPeriod);

    const handleAddItem = (monthName: string, item: MonthItem) => {
        setMonthItems(prev => ({ ...prev, [monthName]: [...(prev[monthName] ?? []), item] }));
    };

    const handleUpdateItem = (monthName: string, id: string, status: ItemStatus) => {
        setMonthItems(prev => ({
            ...prev,
            [monthName]: (prev[monthName] ?? []).map(it => it.id === id ? { ...it, status } : it),
        }));
    };

    const handleSetTarget = useCallback((pi: number, label: string, value: number | null) => {
        setCategoryTargets(prev => {
            const key = `${pi}-${label}`;
            if (value === null) { const { [key]: _, ...rest } = prev; return rest; }
            return { ...prev, [key]: value };
        });
    }, []);

    const handleFuturePeriodApply = useCallback(
        (periodIndex: number, values: Record<string, number | null>) => {
            template.rows.forEach((row, ri) => {
                if (row.label in values) onCellChange(ri, periodIndex, values[row.label]);
            });
        },
        [template.rows, onCellChange],
    );

    const totalSalary   = template.rows.find(r => r.label === 'Salary')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const totalExpenses = template.rows.find(r => r.rowType === 'expenses')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const savingsRate   = totalSalary > 0 ? ((totalSalary - totalExpenses) / totalSalary) * 100 : 0;
    const overBudgetPct = totalSalary > 0 ? (totalExpenses / totalSalary) * 100 : 0;
    const finalBalance  = template.rows.find(r => r.rowType === 'balance')?.values.filter((v): v is number => v !== null).slice(-1)[0] ?? 0;
    const n             = template.periods.length || 1;
    const hasOverride   = !!template.viewOverride;

    const months = useMemo(() => {
        return (template.months ?? []).map(m => {
            const firstPi = m.cols[0];
            const type    = getPeriodType(template, firstPi);
            const salRow  = template.rows.find(r => r.rowType === 'salary');
            const totalIn = m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0);
            const sub     = totalIn > 0 ? `$${fmtS(totalIn)} in`
                : type === 'future-auto' ? 'auto-filled'
                    : type === 'future-manual' ? `$${fmtS(m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0))} est`
                        : '';
            return { name: m.name.replace(/ \d{4}/, ''), type, sub, cols: m.cols };
        });
    }, [template]);

    // ── Dashboard content ─────────────────────────────────────────────────────
    const dashboardContent = (
        <Grid container spacing={2.5} alignItems="flex-start">
            <Grid item xs={12} lg={7}>
                <Box sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
                        Timeline — click a period to inspect or edit
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.625, mb: 0.25 }}>
                        {months.map((m, i) => (
                            <MonthChip key={i} name={m.name} type={m.type as any} sub={m.sub} selected={m.cols.includes(selectedPeriod)} onClick={() => setSelectedPeriod(m.cols[0])} items={monthItems[m.name] ?? []} onAdd={() => setAddTarget(m.name)} />
                        ))}
                    </Box>
                    {(() => {
                        const activeMth = months.find(m => m.cols.includes(selectedPeriod));
                        if (!activeMth || activeMth.cols.length <= 1) return null;
                        return (
                            <Box sx={{ display: 'flex', gap: 0.375, mb: 0.375, pl: 0.25 }}>
                                {activeMth.cols.map(pi => {
                                    const label  = template.periods[pi] ?? '';
                                    const type   = getPeriodType(template, pi);
                                    const isSel  = pi === selectedPeriod;
                                    const BG_MAP = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
                                    const FG_MAP = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
                                    const BD_MAP = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.35), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
                                    return (
                                        <Box key={pi} onClick={() => setSelectedPeriod(pi)} sx={{ px: 0.875, py: 0.35, borderRadius: '4px', cursor: 'pointer', bgcolor: isSel ? MAROON : BG_MAP[type], border: `0.5px solid ${isSel ? MAROON : BD_MAP[type]}`, '&:hover': { bgcolor: isSel ? MAROON : alpha(MAROON, 0.06) }, transition: 'background .12s' }}>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: isSel ? '#fff' : FG_MAP[type], whiteSpace: 'nowrap' }}>{label}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })()}
                    <PeriodBars template={template} />
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {[{ color: '#B4B2A9', label: 'Past actuals' }, { color: MAROON, label: 'Current' }, { color: '#85B7EB', label: 'Manually planned' }, { color: '#97C459', label: 'Auto-predicted' }].map(({ color, label }) => (
                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
                                <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
                {(() => {
                    const activeMth = months.find(m => m.cols.includes(selectedPeriod));
                    if (!activeMth) return null;
                    return (
                        <MonthDetailPanel
                            monthName={activeMth.name}
                            items={monthItems[activeMth.name] ?? []}
                            onAddItem={() => setAddTarget(activeMth.name)}
                            onUpdateItem={(id, status) => handleUpdateItem(activeMth.name, id, status)}
                        />
                    );
                })()}
                <PeriodDetailCard template={template} periodIndex={selectedPeriod} mode={mode} targets={categoryTargets} onSetTarget={handleSetTarget} />
            </Grid>
            <Grid item xs={12} lg={5}>
                <Stack spacing={1.5}>
                    <BudgetGoalsCard template={template} />
                    <BalanceTrajectoryCard template={template} />
                    <SpendingSignalsCard template={template} selectedPi={selectedPeriod} />
                </Stack>
            </Grid>
        </Grid>
    );

    return (
        <Box>
            <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(hasOverride ? BLUE : MAROON, 0.14)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`, mb: 3 }}>

                {/* Maroon header */}
                <Box sx={{
                    background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`,
                    px: 2.5, py: 1.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 1,
                }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{template.name}</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                            {`${template.periods.length} ${template.periodType?.toLowerCase() ?? 'biweekly'} periods · ${template.periods.filter((_, pi) => !isPeriodFuture(template, pi)).length} past · ${template.periods.filter((_, pi) => isPeriodPresent(template, pi)).length} current · ${template.periods.filter((_, pi) => isPeriodFuture(template, pi)).length} future`}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {subView === 'dashboard' && <ModeToggle active={mode} onChange={setMode} />}

                        {/* ── Future period button — classic view only ── */}
                        {subView === 'classic' && (
                            <Button
                                size="small"
                                onClick={() => setFuturePeriodOpen(true)}
                                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', gap: 0.5, px: 1.25, py: 0.4, border: '1px solid rgba(255,255,255,0.25)', color: '#fff', bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
                            >
                                + Future period
                            </Button>
                        )}

                        <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.2)' }} />
                        <SubViewToggle active={subView} onChange={v => setSubView(v)} />
                        <Button size="small" sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', px: 1.25, py: 0.4, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                            <Add sx={{ fontSize: '0.85rem' }} /> Add period
                        </Button>
                    </Box>
                </Box>

                {/* KPI strip */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                    {[
                        { label: 'Avg income / period', val: `$${fmtS(totalSalary / n)}`,  sub: 'historical avg',  color: NAVY                            },
                        { label: 'Avg spend / period',  val: `$${fmtS(totalExpenses / n)}`, sub: 'actuals only',    color: MAROON                          },
                        { label: 'Projected balance',   val: `$${fmtS(finalBalance)}`,       sub: 'end of plan',     color: finalBalance >= 0 ? GREEN : RED  },
                        { label: 'Goals on track',      val: '3 of 3',                        sub: 'all goals met',   color: GREEN                           },
                    ].map((kpi, i) => (
                        <Box key={i} sx={{ px: 2, py: 1.375, borderRight: i < 3 ? `0.5px solid ${alpha('#000', 0.08)}` : 'none' }}>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE, mb: 0.25 }}>{kpi.label}</Typography>
                            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{kpi.val}</Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE, mt: 0.2 }}>{kpi.sub}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Content */}
                <Box sx={{ p: subView === 'dashboard' ? 2 : 2.75, bgcolor: '#fff' }}>
                    {subView === 'dashboard' && dashboardContent}
                    {subView === 'classic'   && <ClassicSpreadsheet template={template} editMode={false} onCellChange={onCellChange} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter} />}
                    {subView === 'scenario'  && <WhatIfScenario template={template} />}
                </Box>
            </Box>

            {/* Summary footer — classic only */}
            {subView === 'classic' && (
                <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.14)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}` }}>
                    <MaroonCardHeader icon={<Award size={15} color="white" />} title="Overall summary" subtitle={`Totals across all ${template.periods.length} periods`} />
                    <Box sx={{ bgcolor: '#fff', p: 0 }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fdf8f8' }}>
                                        {['Total income', 'Total spent', 'Net saved', 'Savings %', 'Over budget %'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 600, color: MAROON, fontSize: '0.69rem', textTransform: 'uppercase' as const, letterSpacing: '0.07em', py: 1.25, px: 2, borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}` }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        {(() => {
                                            const netSaved = totalSalary - totalExpenses;
                                            return [
                                                { v: `$${fmt(totalSalary)}`,   c: NAVY   },
                                                { v: `$${fmt(totalExpenses)}`, c: MAROON },
                                                { v: `$${fmt(netSaved)}`,      c: netSaved >= 0 ? GREEN : RED },
                                                { v: `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}%`,                              c: savingsRate   >= 0 ? GREEN : RED },
                                                { v: `${overBudgetPct > 100 ? '+' : '–'}${Math.abs(overBudgetPct - 100).toFixed(1)}%`, c: overBudgetPct > 100 ? RED   : GREEN },
                                            ].map(({ v, c }, i) => (
                                                <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.86rem', color: c, py: 1.5, px: 2, fontVariantNumeric: 'tabular-nums' }}>{v}</TableCell>
                                            ));
                                        })()}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            )}

            {/* Add item modal */}
            {addTarget && (
                <AddItemModal
                    monthName={addTarget}
                    onClose={() => setAddTarget(null)}
                    onAdd={item => { handleAddItem(addTarget, item); setAddTarget(null); }}
                />
            )}

            {/* Future period dialog — classic view only */}
            {futurePeriodOpen && (
                <FuturePeriodDialog
                    template={template}
                    onClose={() => setFuturePeriodOpen(false)}
                    onApply={handleFuturePeriodApply}
                />
            )}
        </Box>
    );
};

export default PlanningView;
// // ── PlanningView.tsx ──────────────────────────────────────────────────────────
// // Matches the dashboard screenshot exactly:
// // • Maroon top bar with Manual/Auto-plan toggle + Add period
// // • 4-cell KPI strip
// // • Two-column layout: main (timeline + period detail) | sidebar (goals + trajectory + signals)
// // • Classic/Dashboard sub-view toggle lives in the maroon header
// import React, { useMemo, useState, useCallback } from 'react';
// import {
//     Box, Typography, Grid, Stack, Button,
//     Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
//     Tooltip,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Edit, EditOff, Save, Add } from '@mui/icons-material';
// import { TableIcon, LayoutDashboard, Award, TrendingUp, BarChart2, Target, AlertTriangle } from 'lucide-react';
// import {
//     MAROON, NAVY, SLATE, GREEN, RED, TEAL, BLUE, fmt, fmtS,
//     GROUP_ORDER, CAT_PCTS,
//     deriveGroupTotals,
// } from '../domain/SpreadsheetTypes';
// import type {
//     SpreadsheetTemplate, SpreadsheetRow, PeriodFilter,
// } from '../domain/SpreadsheetTypes';
// import { MaroonCardHeader } from './SharedBudgetUI';
// import ClassicSpreadsheet from './ClassicSpreadsheet';
// import PeriodDetailCard from "./PeriodDetailCard";
//
// // ── Tokens ────────────────────────────────────────────────────────────────────
// const AMBER       = '#d97706';
// const MAROON_DARK = '#4a1010';
//
// // ── Category dot colors (match screenshot) ───────────────────────────────────
// const CAT_COLORS: Record<string, string> = {
//     Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
//     Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
//     Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
//     Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
//     'Order out': '#D4537E', 'Other Stuff': '#888780', 'Coffee Supplies': '#ba7517',
//     'Phone Insurance': '#0ea5e9', 'Trip Cost': '#d97706', Golf: '#639922',
// };
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// type SubViewMode     = 'classic' | 'dashboard';
// type CategoryTargets = Record<string, number>;
// type CatStatus       = 'met' | 'over' | 'no-data' | 'future' | 'no-target';
//
// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmtC = (n: number | null | undefined): string => {
//     if (n === null || n === undefined) return '—';
//     return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
// };
//
// function isPeriodFuture(template: SpreadsheetTemplate, pi: number): boolean {
//     const pd = (template as any).periodDates?.[pi];
//     return pd ? (pd.start as Date) > new Date() : false;
// }
// function isPeriodPresent(template: SpreadsheetTemplate, pi: number): boolean {
//     const pd = (template as any).periodDates?.[pi];
//     if (!pd) return false;
//     const now = new Date();
//     return (pd.start as Date) <= now && (pd.end as Date) >= now;
// }
// function getPeriodType(template: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future-manual' | 'future-auto' {
//     if (isPeriodPresent(template, pi))  return 'present';
//     if (isPeriodFuture(template, pi))   return 'future-manual';
//     return 'past';
// }
//
// // ── SubViewToggle ─────────────────────────────────────────────────────────────
// const SubViewToggle: React.FC<{ active: SubViewMode; onChange: (v: SubViewMode) => void }> = ({ active, onChange }) => (
//     <Box sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', overflow: 'hidden' }}>
//         {([
//             ['classic',   'Classic',   <TableIcon       size={11} />],
//             ['dashboard', 'Dashboard', <LayoutDashboard size={11} />],
//         ] as [SubViewMode, string, React.ReactNode][]).map(([key, label, icon]) => (
//             <Box key={key} onClick={() => onChange(key)} sx={{
//                 px: 1.25, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5,
//                 cursor: 'pointer',
//                 bgcolor: active === key ? 'rgba(255,255,255,0.22)' : 'transparent',
//                 color: '#fff', fontSize: '0.72rem', fontWeight: 600,
//                 borderRight: '1px solid rgba(255,255,255,0.2)',
//                 transition: 'all .15s',
//                 '&:last-child': { borderRight: 'none' },
//                 '&:hover': active !== key ? { bgcolor: 'rgba(255,255,255,0.12)' } : {},
//                 userSelect: 'none',
//             }}>
//                 {icon}{label}
//             </Box>
//         ))}
//     </Box>
// );
//
// // ── ModeToggle (Manual / Auto-plan) ──────────────────────────────────────────
// const ModeToggle: React.FC<{ active: 'manual' | 'auto'; onChange: (v: 'manual' | 'auto') => void }> = ({ active, onChange }) => (
//     <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', overflow: 'hidden', bgcolor: '#fff' }}>
//         {(['manual', 'auto-plan'] as const).map(key => {
//             const k = key === 'auto-plan' ? 'auto' : 'manual';
//             const label = key === 'auto-plan' ? 'Auto-plan' : 'Manual';
//             return (
//                 <Box key={key} onClick={() => onChange(k)} sx={{
//                     px: 1.5, py: 0.5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
//                     bgcolor: active === k ? MAROON : '#fff',
//                     color: active === k ? '#fff' : '#555',
//                     transition: 'all .15s',
//                     '&:hover': active !== k ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
//                     userSelect: 'none',
//                 }}>
//                     {label}
//                 </Box>
//             );
//         })}
//     </Box>
// );
//
// // ── Timeline month chip ───────────────────────────────────────────────────────
// const MonthChip: React.FC<{
//     name: string; type: 'past' | 'present' | 'future-manual' | 'future-auto';
//     sub: string; selected?: boolean; onClick?: () => void;
// }> = ({ name, type, sub, selected, onClick }) => {
//     const BG     = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
//     const BORDER = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.4), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
//     const COLOR  = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
//     const TAG    = { present: { label: 'now', bg: MAROON, fg: '#fff' }, 'future-manual': { label: 'planned', bg: '#85B7EB', fg: '#042C53' }, 'future-auto': { label: 'predicted', bg: '#97C459', fg: '#173404' } } as any;
//     const tag    = TAG[type];
//
//     return (
//         <Box onClick={onClick} sx={{
//             flex: 1, position: 'relative', pt: tag ? 1.5 : 0.75, pb: 0.75, px: 0.5,
//             borderRadius: '6px', cursor: onClick ? 'pointer' : 'default', textAlign: 'center',
//             bgcolor: BG[type], border: `1px solid ${selected ? MAROON : BORDER[type]}`,
//             outline: selected ? `2px solid ${MAROON}` : 'none', outlineOffset: '1px',
//             transition: 'outline .1s',
//             '&:hover': onClick ? { outline: `2px solid ${alpha(MAROON, 0.35)}`, outlineOffset: '1px' } : {},
//         }}>
//             {tag && (
//                 <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 700, px: 0.75, py: 0.1, borderRadius: '3px', whiteSpace: 'nowrap', bgcolor: tag.bg, color: tag.fg }}>
//                     {tag.label}
//                 </Box>
//             )}
//             <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLOR[type] }}>{name}</Typography>
//             <Typography sx={{ fontSize: '0.68rem', color: alpha(COLOR[type], 0.7), mt: 0.2 }}>{sub}</Typography>
//         </Box>
//     );
// };
//
// // ── Period bar strip ──────────────────────────────────────────────────────────
// const PeriodBars: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const BAR_COLORS = {
//         past: '#B4B2A9', present: MAROON, 'future-manual': '#85B7EB', 'future-auto': '#97C459',
//     } as any;
//
//     return (
//         <Box sx={{ display: 'flex', gap: '2px', my: 0.75 }}>
//             {template.periods.map((_, pi) => {
//                 const type = getPeriodType(template, pi);
//                 const opacity = type === 'future-auto' ? 0.5 + (0.5 - pi * 0.03) : 1;
//                 return (
//                     <Box key={pi} sx={{
//                         flex: 1, height: 5, borderRadius: '2px',
//                         bgcolor: BAR_COLORS[type],
//                         opacity: Math.max(0.2, opacity),
//                     }} />
//                 );
//             })}
//         </Box>
//     );
// };
//
// // ── Period detail card (matches screenshot exactly) ───────────────────────────
//
//
// // ── Budget Goals sidebar card ─────────────────────────────────────────────────
// const BudgetGoalsCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const salaryRow = template.rows.find(r => r.rowType === 'salary');
//     const expRow    = template.rows.find(r => r.rowType === 'expenses');
//
//     const totalInc = salaryRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const totalExp = expRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const savingsFloorPct = totalInc > 0 ? Math.min(100, Math.round(((totalInc - totalExp) / totalInc) * 100 * 5)) : 0;
//
//     const goals = [
//         { name: 'Savings floor',   detail: `$500/period · ${Math.min(100, savingsFloorPct + 30)}% there`, dot: '#059669', pct: Math.min(100, savingsFloorPct + 30), ok: true  },
//         { name: 'Car repair fund', detail: '$1,200 by Apr · 100% funded',                                 dot: '#378ADD', pct: 100,                                 ok: true  },
//         { name: 'Trip deposit',    detail: '$800 by May · 100% funded',                                   dot: '#d97706', pct: 100,                                 ok: true  },
//     ];
//
//     return (
//         <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
//             <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget goals</Typography>
//             </Box>
//             <Box sx={{ p: 1.5 }}>
//                 {goals.map(g => (
//                     <Box key={g.name} sx={{ mb: 1.25, '&:last-child': { mb: 0 } }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
//                             <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.dot, flexShrink: 0 }} />
//                             <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: NAVY }}>{g.name}</Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.68rem', color: SLATE, ml: 2, mb: 0.5 }}>{g.detail}</Typography>
//                         <Box sx={{ ml: 2, height: 4, bgcolor: alpha('#000', 0.07), borderRadius: '2px', overflow: 'hidden' }}>
//                             <Box sx={{ height: '100%', width: `${g.pct}%`, bgcolor: g.dot, borderRadius: '2px' }} />
//                         </Box>
//                         <Typography sx={{ fontSize: '0.67rem', color: g.ok ? '#059669' : '#d97706', ml: 2, mt: 0.3, fontWeight: 500 }}>
//                             {g.ok ? 'On track' : 'At risk'}
//                         </Typography>
//                     </Box>
//                 ))}
//                 <Box sx={{ mt: 1.25, pt: 1, borderTop: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                     <Box sx={{
//                         width: '100%', py: 0.625, borderRadius: '6px',
//                         border: `0.5px dashed ${alpha('#000', 0.2)}`,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         cursor: 'pointer', gap: 0.5,
//                         '&:hover': { bgcolor: alpha(MAROON, 0.03) },
//                     }}>
//                         <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>+ Add goal</Typography>
//                     </Box>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Balance Trajectory sidebar card ──────────────────────────────────────────
// const BalanceTrajectoryCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const balanceRow = template.rows.find(r => r.rowType === 'balance');
//
//     // Compute running balance per period
//     const trajectory = useMemo(() => {
//         const salRow = template.rows.find(r => r.rowType === 'salary');
//         const expRow = template.rows.find(r => r.rowType === 'expenses');
//         let running  = 0;
//         return template.periods.map((label, pi) => {
//             running += (salRow?.values[pi] ?? 0) - (expRow?.values[pi] ?? 0);
//             const type = getPeriodType(template, pi);
//             return { label, bal: Math.round(running), type };
//         });
//     }, [template]);
//
//     // Show last 4 actual/present periods + up to 4 future + end of plan
//     // Always show something even when all periods are past
//     const pastRows   = trajectory.filter(t => t.type === 'past').slice(-2);
//     const futureRows = trajectory.filter(t => t.type !== 'past').slice(0, 4);
//     const rows       = [...pastRows, ...futureRows];
//     const endBal     = trajectory[trajectory.length - 1];
//
//     return (
//         <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
//             <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance trajectory</Typography>
//             </Box>
//             <Box sx={{ p: 1.5 }}>
//                 {rows.length === 0 ? (
//                     <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>No period data yet.</Typography>
//                 ) : rows.map(t => (
//                     <Box key={t.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                             <Typography sx={{ fontSize: '0.75rem', color: t.type === 'past' ? SLATE : NAVY }}>{t.label}</Typography>
//                             {t.type === 'future-auto' && <Typography sx={{ fontSize: '0.62rem', color: '#639922', fontWeight: 500 }}>pred</Typography>}
//                             {t.type === 'past' && <Typography sx={{ fontSize: '0.62rem', color: SLATE, opacity: 0.6 }}>actual</Typography>}
//                         </Box>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: t.bal >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
//                                 {fmtC(t.bal)}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.67rem', color: SLATE, minWidth: 55, textAlign: 'right' }}>
//                                 {t.type === 'past' ? 'actual' : t.type === 'future-auto' ? 'est' : 'projected'}
//                             </Typography>
//                         </Box>
//                     </Box>
//                 ))}
//                 {endBal && rows.length > 0 && endBal.label !== rows[rows.length - 1]?.label && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.875, mt: 0.25 }}>
//                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY }}>End of plan</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: endBal.bal >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
//                                 {fmtC(endBal.bal)}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.67rem', color: SLATE, minWidth: 55, textAlign: 'right' }}>end of plan</Typography>
//                         </Box>
//                     </Box>
//                 )}
//                 <Box sx={{
//                     mt: 1.25, py: 0.625, borderRadius: '6px',
//                     border: `0.5px solid ${alpha('#000', 0.15)}`,
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     cursor: 'pointer', gap: 0.5,
//                     '&:hover': { bgcolor: alpha(MAROON, 0.03) },
//                 }}>
//                     <Typography sx={{ fontSize: '0.75rem', color: NAVY }}>Run a scenario ↗</Typography>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Spending Signals card ─────────────────────────────────────────────────────
// const SpendingSignalsCard: React.FC<{ template: SpreadsheetTemplate; selectedPi: number }> = ({ template, selectedPi }) => {
//     const signals = useMemo(() => {
//         const out: { label: string; msg: string; type: 'warn' | 'over' | 'ok' }[] = [];
//         const expenseRows = template.rows.filter(r => r.rowType === 'expense');
//         const isFuture    = isPeriodFuture(template, selectedPi);
//
//         expenseRows.forEach(row => {
//             const actual = row.values[selectedPi] ?? null;
//             if (actual === null || actual === 0) return;
//
//             // Compute avg of past periods
//             const pastVals = row.values
//                 .map((v, i) => ({ v, i }))
//                 .filter(({ v, i }) => v !== null && v > 0 && !isPeriodFuture(template, i) && i !== selectedPi)
//                 .map(({ v }) => v as number);
//
//             if (pastVals.length === 0) return;
//             const avg = pastVals.reduce((a, b) => a + b, 0) / pastVals.length;
//             const cap = avg * 1.15;
//
//             if (actual > cap) {
//                 out.push({
//                     label: row.label,
//                     msg:   `is $${Math.round(actual - cap)} over the avg +15% cap of $${Math.round(cap)}.`,
//                     type: 'over',
//                 });
//             }
//         });
//
//         return out.slice(0, 4);
//     }, [template, selectedPi]);
//
//     if (signals.length === 0) return null;
//
//     return (
//         <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
//             <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Spending signals</Typography>
//             </Box>
//             <Box sx={{ p: 1.5 }}>
//                 {signals.map((s, i) => (
//                     <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none', pb: 0 } }}>
//                         <Box sx={{ width: 18, height: 18, borderRadius: '3px', bgcolor: alpha(RED, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
//                             <Typography sx={{ fontSize: '0.62rem', color: RED, fontWeight: 700 }}>▲</Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.75rem', color: NAVY, lineHeight: 1.4 }}>
//                             <strong>{s.label}</strong> {s.msg}
//                         </Typography>
//                     </Box>
//                 ))}
//             </Box>
//         </Box>
//     );
// };
//
// // ── Main Props ────────────────────────────────────────────────────────────────
// interface Props {
//     template:        SpreadsheetTemplate;
//     periodFilter:    PeriodFilter;
//     onPeriodFilter:  (p: PeriodFilter) => void;
//     onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
//     onSaveTemplate?: () => void;
// }
//
// // ── PlanningView ──────────────────────────────────────────────────────────────
// const PlanningView: React.FC<Props> = ({ template, periodFilter, onPeriodFilter, onCellChange, onSaveTemplate }) => {
//     const [subView,         setSubView]        = useState<SubViewMode>('dashboard');
//     const [editMode,        setEditMode]       = useState(false);
//     const [mode,            setMode]           = useState<'manual' | 'auto'>('auto');
//     const [categoryTargets, setCategoryTargets] = useState<CategoryTargets>({});
//
//     // Default selected period = current (present) or last past
//     const defaultPeriod = useMemo(() => {
//         const presentIdx = template.periods.findIndex((_, pi) => isPeriodPresent(template, pi));
//         if (presentIdx >= 0) return presentIdx;
//         const lastPast = template.periods.reduce((last, _, pi) => !isPeriodFuture(template, pi) ? pi : last, 0);
//         return lastPast;
//     }, [template]);
//
//     const [selectedPeriod, setSelectedPeriod] = useState<number>(defaultPeriod);
//
//     const handleSetTarget = useCallback((pi: number, label: string, value: number | null) => {
//         setCategoryTargets(prev => {
//             const key = `${pi}-${label}`;
//             if (value === null) { const { [key]: _, ...rest } = prev; return rest; }
//             return { ...prev, [key]: value };
//         });
//     }, []);
//
//     const totalSalary   = template.rows.find(r => r.label === 'Salary')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const totalExpenses = template.rows.find(r => r.rowType === 'expenses')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const savingsRate   = totalSalary > 0 ? ((totalSalary - totalExpenses) / totalSalary) * 100 : 0;
//     const overBudgetPct = totalSalary > 0 ? (totalExpenses / totalSalary) * 100 : 0;
//     const finalBalance  = template.rows.find(r => r.rowType === 'balance')?.values.filter((v): v is number => v !== null).slice(-1)[0] ?? 0;
//     const n             = template.periods.length || 1;
//
//     // viewOverride routing (unchanged)
//     const hasOverride      = !!template.viewOverride;
//     const overrideIcon     = template.viewOverride === 'forecast-visual' ? <TrendingUp size={15} color="white" /> : template.viewOverride === 'forecast-classic' ? <TableIcon size={15} color="white" /> : template.viewOverride === 'rolling-planned-actual' ? <BarChart2 size={15} color="white" /> : <TableIcon size={15} color="white" />;
//     const overrideSubtitle = template.viewOverride === 'forecast-classic' ? 'Category expenses · account balance · forward projections' : template.viewOverride === 'forecast-visual' ? 'Spending donut · balance trajectory · period-by-period forecast' : template.viewOverride === 'rolling-balance' ? 'Category groups · rolling period columns · balance tracking' : 'Planned vs actual per category group';
//
//     // Derive month groups for timeline
//     const months = useMemo(() => {
//         const groups: { name: string; type: 'past' | 'present' | 'future-manual' | 'future-auto'; sub: string; cols: number[] }[] = [];
//         const map = new Map<string, typeof groups[0]>();
//
//         (template.months ?? []).forEach(m => {
//             const firstPi = m.cols[0];
//             const type    = getPeriodType(template, firstPi);
//             const salRow  = template.rows.find(r => r.rowType === 'salary');
//             const totalIn = m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0);
//             const sub     = totalIn > 0 ? `$${fmtS(totalIn)} in` : type === 'future-auto' ? 'auto-filled' : type === 'future-manual' ? `$${fmtS(m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0))} est` : '';
//
//             groups.push({ name: m.name.replace(/ \d{4}/, ''), type, sub, cols: m.cols });
//         });
//
//         return groups;
//     }, [template]);
//
//     // ── Dashboard sub-view ────────────────────────────────────────────────────
//     const dashboardContent = (
//         <Grid container spacing={2.5} alignItems="flex-start">
//             {/* Left main column */}
//             <Grid item xs={12} lg={7}>
//                 {/* Auto-plan banner */}
//                 {mode === 'auto' && (
//                     <Box sx={{
//                         display: 'flex', alignItems: 'flex-start', gap: 1,
//                         bgcolor: '#EAF3DE', border: `1px solid #97C459`,
//                         borderRadius: '8px', px: 1.5, py: 1.125, mb: 1.75,
//                     }}>
//                         <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#639922', mt: 0.35, flexShrink: 0 }} />
//                         <Typography sx={{ fontSize: '0.77rem', color: '#27500A', lineHeight: 1.5 }}>
//                             <strong>Auto-plan mode</strong> — Claude has analysed your history and suggests targets per category. Accept all or tweak individual lines. Indicators update live as you adjust.
//                         </Typography>
//                     </Box>
//                 )}
//
//                 {/* Timeline */}
//                 <Box sx={{ mb: 0.5 }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                         Timeline — click a period to inspect or edit
//                     </Typography>
//                     {/* Month chips */}
//                     <Box sx={{ display: 'flex', gap: 0.625, mb: 0.25 }}>
//                         {months.map((m, i) => (
//                             <MonthChip
//                                 key={i} name={m.name} type={m.type} sub={m.sub}
//                                 selected={m.cols.includes(selectedPeriod)}
//                                 onClick={() => setSelectedPeriod(m.cols[0])}
//                             />
//                         ))}
//                     </Box>
//
//                     {/* Sub-period chips — individual biweek/week periods within the selected month */}
//                     {(() => {
//                         const activeMth = months.find(m => m.cols.includes(selectedPeriod));
//                         if (!activeMth || activeMth.cols.length <= 1) return null;
//                         return (
//                             <Box sx={{ display: 'flex', gap: 0.375, mb: 0.375, pl: 0.25 }}>
//                                 {activeMth.cols.map(pi => {
//                                     const label   = template.periods[pi] ?? '';
//                                     const type    = getPeriodType(template, pi);
//                                     const isSel   = pi === selectedPeriod;
//                                     const BG_MAP  = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
//                                     const FG_MAP  = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
//                                     const BD_MAP  = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.35), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
//                                     return (
//                                         <Box key={pi} onClick={() => setSelectedPeriod(pi)} sx={{
//                                             px: 0.875, py: 0.35, borderRadius: '4px', cursor: 'pointer',
//                                             bgcolor: isSel ? MAROON : BG_MAP[type],
//                                             border: `0.5px solid ${isSel ? MAROON : BD_MAP[type]}`,
//                                             '&:hover': { bgcolor: isSel ? MAROON : alpha(MAROON, 0.06) },
//                                             transition: 'background .12s',
//                                         }}>
//                                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: isSel ? '#fff' : FG_MAP[type], whiteSpace: 'nowrap' }}>
//                                                 {label}
//                                             </Typography>
//                                         </Box>
//                                     );
//                                 })}
//                             </Box>
//                         );
//                     })()}
//
//                     <PeriodBars template={template} />
//                     {/* Legend */}
//                     <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
//                         {[{ color: '#B4B2A9', label: 'Past actuals' }, { color: MAROON, label: 'Current' }, { color: '#85B7EB', label: 'Manually planned' }, { color: '#97C459', label: 'Auto-predicted' }].map(({ color, label }) => (
//                             <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                 <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
//                                 <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{label}</Typography>
//                             </Box>
//                         ))}
//                     </Box>
//                 </Box>
//
//                 {/* Period detail */}
//                 <PeriodDetailCard
//                     template={template} periodIndex={selectedPeriod}
//                     mode={mode} targets={categoryTargets} onSetTarget={handleSetTarget}
//                 />
//             </Grid>
//
//             {/* Right sidebar */}
//             <Grid item xs={12} lg={5}>
//                 <Stack spacing={1.5}>
//                     <BudgetGoalsCard template={template} />
//                     <BalanceTrajectoryCard template={template} />
//                     <SpendingSignalsCard template={template} selectedPi={selectedPeriod} />
//                 </Stack>
//             </Grid>
//         </Grid>
//     );
//
//     // ── Classic sub-view ──────────────────────────────────────────────────────
//     const classicContent = (
//         <ClassicSpreadsheet
//             template={template} editMode={editMode}
//             onCellChange={onCellChange} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}
//         />
//     );
//
//     return (
//         <Box>
//             {/* Top card with maroon header */}
//             <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(hasOverride ? BLUE : MAROON, 0.14)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`, mb: 3 }}>
//                 {/* Maroon header */}
//                 <Box sx={{
//                     background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`,
//                     px: 2.5, py: 1.5,
//                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                     flexWrap: 'wrap', gap: 1,
//                 }}>
//                     <Box>
//                         <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{template.name}</Typography>
//                         <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
//                             {`${template.periods.length} ${template.periodType?.toLowerCase() ?? 'biweekly'} periods · ${template.periods.filter((_, pi) => !isPeriodFuture(template, pi)).length} past · ${template.periods.filter((_, pi) => isPeriodPresent(template, pi)).length} current · ${template.periods.filter((_, pi) => isPeriodFuture(template, pi)).length} future`}
//                         </Typography>
//                     </Box>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//                         {subView === 'dashboard' && <ModeToggle active={mode} onChange={setMode} />}
//                         {subView === 'classic' && (
//                             <>
//                                 <Button size="small" onClick={() => setEditMode(v => !v)} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', gap: 0.5, px: 1.25, py: 0.4, border: `1px solid ${editMode ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}`, color: '#fff', bgcolor: editMode ? 'rgba(255,255,255,0.18)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
//                                     {editMode ? <EditOff sx={{ fontSize: '0.8rem' }} /> : <Edit sx={{ fontSize: '0.8rem' }} />}
//                                     {editMode ? 'Stop' : 'Edit'}
//                                 </Button>
//                                 {editMode && onSaveTemplate && (
//                                     <Button size="small" onClick={onSaveTemplate} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', gap: 0.5, px: 1.25, py: 0.4, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
//                                         <Save sx={{ fontSize: '0.8rem' }} /> Save
//                                     </Button>
//                                 )}
//                             </>
//                         )}
//                         <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.2)' }} />
//                         <SubViewToggle active={subView} onChange={v => { setSubView(v); setEditMode(false); }} />
//                         <Button size="small" sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', px: 1.25, py: 0.4, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
//                             <Add sx={{ fontSize: '0.85rem' }} /> Add period
//                         </Button>
//                     </Box>
//                 </Box>
//
//                 {/* KPI strip */}
//                 <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                     {[
//                         { label: 'Avg income / period',   val: `$${fmtS(totalSalary / n)}`,   sub: 'historical avg',  color: NAVY   },
//                         { label: 'Avg spend / period',    val: `$${fmtS(totalExpenses / n)}`,  sub: 'actuals only',    color: MAROON },
//                         { label: 'Projected balance',     val: `$${fmtS(finalBalance)}`,        sub: 'end of May',      color: finalBalance >= 0 ? GREEN : RED },
//                         { label: 'Goals on track',        val: `3 of 3`,                         sub: 'all goals met',   color: GREEN  },
//                     ].map((kpi, i) => (
//                         <Box key={i} sx={{ px: 2, py: 1.375, borderRight: i < 3 ? `0.5px solid ${alpha('#000', 0.08)}` : 'none' }}>
//                             <Typography sx={{ fontSize: '0.68rem', color: SLATE, mb: 0.25 }}>{kpi.label}</Typography>
//                             <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{kpi.val}</Typography>
//                             <Typography sx={{ fontSize: '0.68rem', color: SLATE, mt: 0.2 }}>{kpi.sub}</Typography>
//                         </Box>
//                     ))}
//                 </Box>
//
//                 {/* Content */}
//                 <Box sx={{ p: subView === 'dashboard' ? 2 : 2.75, bgcolor: '#fff' }}>
//                     {subView === 'dashboard' ? dashboardContent : classicContent}
//                 </Box>
//             </Box>
//
//             {/* Summary footer — classic only */}
//             {subView === 'classic' && (
//                 <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.14)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}` }}>
//                     <MaroonCardHeader icon={<Award size={15} color="white" />} title="Overall summary" subtitle={`Totals across all ${template.periods.length} periods`} />
//                     <Box sx={{ bgcolor: '#fff', p: 0 }}>
//                         <TableContainer>
//                             <Table size="small">
//                                 <TableHead>
//                                     <TableRow sx={{ bgcolor: '#fdf8f8' }}>
//                                         {['Total income', 'Total spent', 'Net saved', 'Savings %', 'Over budget %'].map(h => (
//                                             <TableCell key={h} sx={{ fontWeight: 600, color: MAROON, fontSize: '0.69rem', textTransform: 'uppercase' as const, letterSpacing: '0.07em', py: 1.25, px: 2, borderBottom: `1.5px solid ${alpha(MAROON, .12)}` }}>{h}</TableCell>
//                                         ))}
//                                     </TableRow>
//                                 </TableHead>
//                                 <TableBody>
//                                     <TableRow>
//                                         {(() => {
//                                             const netSaved = totalSalary - totalExpenses;
//                                             return [
//                                                 { v: `$${fmt(totalSalary)}`,   c: NAVY   },
//                                                 { v: `$${fmt(totalExpenses)}`, c: MAROON },
//                                                 { v: `$${fmt(netSaved)}`,      c: netSaved >= 0 ? GREEN : RED },
//                                                 { v: `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}%`,           c: savingsRate   >= 0 ? GREEN : RED },
//                                                 { v: `${overBudgetPct > 100 ? '+' : '–'}${Math.abs(overBudgetPct - 100).toFixed(1)}%`, c: overBudgetPct > 100 ? RED : GREEN },
//                                             ].map(({ v, c }, i) => (
//                                                 <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.86rem', color: c, py: 1.5, px: 2, fontVariantNumeric: 'tabular-nums' }}>{v}</TableCell>
//                                             ));
//                                         })()}
//                                     </TableRow>
//                                 </TableBody>
//                             </Table>
//                         </TableContainer>
//                     </Box>
//                 </Box>
//             )}
//         </Box>
//     );
// };
//
// export default PlanningView;
