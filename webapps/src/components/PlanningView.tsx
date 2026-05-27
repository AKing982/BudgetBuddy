// ── PlanningView.tsx ──────────────────────────────────────────────────────────
// Two sub-views: Classic | Dashboard
// Forecast panel is ALWAYS visible on the right — fully dynamic flex layout.
// Both columns resize fluidly; panel collapses to a slim strip.
import React, { useMemo, useState, useCallback } from 'react';
import {
    Box, Typography, Grid, Stack, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Add } from '@mui/icons-material';
import InsightsIcon from '@mui/icons-material/Insights';
import { TableIcon, LayoutDashboard, Award, ChevronRight } from 'lucide-react';
import {
    MAROON, NAVY, SLATE, GREEN, RED, TEAL, BLUE, fmt, fmtS,
    GROUP_ORDER, CAT_PCTS, deriveGroupTotals,
} from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, SpreadsheetRow, PeriodFilter } from '../domain/SpreadsheetTypes';
import { MaroonCardHeader } from './SharedBudgetUI';
import ClassicSpreadsheet from './ClassicSpreadsheet';
import PeriodDetailCard from './PeriodDetailCard';
import FuturePeriodDialog from './FuturePeriodDialog';
import ForecastPanel from "./ForecastPanel";

// ── Tokens ────────────────────────────────────────────────────────────────────
const AMBER       = '#d97706';
const MAROON_DARK = '#4a1010';
const PURPLE      = '#7c3aed';
const PROJ        = '#85B7EB';
const PAST_C      = '#B4B2A9';

const CAT_COLORS: Record<string, string> = {
    Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
    Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
    Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
    Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
    'Order out': '#D4537E', 'Other Stuff': '#888780', 'Coffee Supplies': '#ba7517',
    'Phone Insurance': '#0ea5e9', 'Trip Cost': '#d97706', Golf: '#639922',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type SubViewMode     = 'classic' | 'dashboard';
type CategoryTargets = Record<string, number>;
type ItemStatus      = 'on-track' | 'at-risk' | 'pending' | 'paid' | 'overdue';
type PlanType        = 'payment' | 'subscription' | 'savings' | 'bill' | 'custom';

interface MonthGoalItem { id: string; kind: 'goal'; label: string; amount: number; color: string; status: ItemStatus; }
interface MonthPlanItem { id: string; kind: 'plan'; label: string; amount: number; type: PlanType; due: string | null; status: ItemStatus; }
type MonthItem    = MonthGoalItem | MonthPlanItem;
type MonthItemMap = Record<string, MonthItem[]>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtC = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return '—';
    return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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
function getPeriodType(t: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future-manual' | 'future-auto' {
    if (isPeriodPresent(t, pi)) return 'present';
    if (isPeriodFuture(t, pi))  return 'future-manual';
    return 'past';
}
function periodKind(t: SpreadsheetTemplate, pi: number): 'past' | 'present' | 'future' {
    const pd = (t as any).periodDates?.[pi];
    if (!pd) return pi < Math.floor(t.periods.length / 2) ? 'past' : 'future';
    const now = new Date();
    if ((pd.end   as Date) < now) return 'past';
    if ((pd.start as Date) > now) return 'future';
    return 'present';
}
const isFutureK  = (t: SpreadsheetTemplate, pi: number) => periodKind(t, pi) === 'future';
const isPastK    = (t: SpreadsheetTemplate, pi: number) => periodKind(t, pi) === 'past';
const isPresentK = (t: SpreadsheetTemplate, pi: number) => periodKind(t, pi) === 'present';

function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1]; const curr = pts[i];
        const cpX  = (prev.x + curr.x) / 2;
        d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
}

// ── SubViewToggle ─────────────────────────────────────────────────────────────
const SubViewToggle: React.FC<{ active: SubViewMode; onChange: (v: SubViewMode) => void }> = ({ active, onChange }) => (
    <Box sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', overflow: 'hidden' }}>
        {([
            ['classic',   'Classic',   <TableIcon       size={12} />],
            ['dashboard', 'Dashboard', <LayoutDashboard size={12} />],
        ] as [SubViewMode, string, React.ReactNode][]).map(([key, label, icon]) => (
            <Box key={key} onClick={() => onChange(key)} sx={{
                px: 1.5, py: 0.625, display: 'flex', alignItems: 'center', gap: 0.625,
                cursor: 'pointer',
                bgcolor: active === key ? 'rgba(255,255,255,0.22)' : 'transparent',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600,
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

const ModeToggle: React.FC<{ active: 'manual' | 'auto'; onChange: (v: 'manual' | 'auto') => void }> = ({ active, onChange }) => (
    <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', overflow: 'hidden', bgcolor: '#fff' }}>
        {(['manual', 'auto-plan'] as const).map(key => {
            const k = key === 'auto-plan' ? 'auto' : 'manual';
            return (
                <Box key={key} onClick={() => onChange(k)} sx={{
                    px: 1.5, py: 0.5, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    bgcolor: active === k ? MAROON : '#fff', color: active === k ? '#fff' : '#555',
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
    const goals  = items.filter(it => it.kind === 'goal') as MonthGoalItem[];
    const plans  = items.filter(it => it.kind === 'plan') as MonthPlanItem[];
    const atRisk = items.some(it => it.status === 'at-risk' || it.status === 'overdue');
    return (
        <Box onClick={onClick} sx={{
            flex: 1, position: 'relative', pt: tag ? 1.75 : 0.875, pb: 0.75, px: 0.625,
            borderRadius: '6px', cursor: onClick ? 'pointer' : 'default', textAlign: 'center',
            bgcolor: BG[type], border: `1px solid ${selected ? MAROON : BORDER[type]}`,
            outline: selected ? `2px solid ${MAROON}` : 'none', outlineOffset: '1px',
            transition: 'outline .1s, box-shadow .12s',
            boxShadow: selected ? `0 2px 10px ${alpha(MAROON, 0.14)}` : 'none',
            '&:hover': onClick ? { outline: `2px solid ${alpha(MAROON, 0.35)}`, outlineOffset: '1px' } : {},
        }}>
            {tag && <Box sx={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', fontWeight: 700, px: 0.875, py: 0.15, borderRadius: '3px', whiteSpace: 'nowrap', bgcolor: tag.bg, color: tag.fg }}>{tag.label}</Box>}
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: COLOR[type] }}>{name}</Typography>
            <Typography sx={{ fontSize: '0.73rem', color: alpha(COLOR[type], 0.7), mt: 0.2 }}>{sub}</Typography>
            {items.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {goals.slice(0, 3).map(g => <Box key={g.id} title={g.label} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.color, border: '1.5px solid white', boxShadow: g.status === 'at-risk' ? `0 0 0 1.5px ${AMBER}` : 'none' }} />)}
                    {plans.length > 0 && <Box sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.625, py: '1px', borderRadius: '3px', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}>{plans.length}p</Box>}
                    {atRisk && <Typography sx={{ fontSize: '0.68rem', color: AMBER }}>⚠</Typography>}
                </Box>
            )}
            {onAdd && (
                <Box onMouseEnter={() => setAddHover(true)} onMouseLeave={() => setAddHover(false)} onClick={e => { e.stopPropagation(); onAdd(); }}
                     sx={{ mt: 0.5, py: '3px', borderRadius: '3px', cursor: 'pointer', bgcolor: addHover ? alpha(MAROON, 0.08) : 'transparent', color: addHover ? MAROON : alpha(SLATE, 0.4), fontSize: '0.68rem', fontWeight: 700, transition: 'all .12s', userSelect: 'none' }}
                >+ add</Box>
            )}
        </Box>
    );
};

// ── AddItemModal ──────────────────────────────────────────────────────────────
const PLAN_TYPES: { value: PlanType; label: string; color: string }[] = [
    { value: 'payment', label: 'Payment', color: PURPLE },
    { value: 'subscription', label: 'Subscription', color: BLUE },
    { value: 'savings', label: 'Savings goal', color: GREEN },
    { value: 'bill', label: 'Bill', color: AMBER },
    { value: 'custom', label: 'Custom', color: SLATE },
];
const GOAL_COLORS = [GREEN, BLUE, AMBER, TEAL, PURPLE, RED];
const STATUS_STYLES: Record<ItemStatus, { bg: string; color: string; label: string }> = {
    'on-track': { bg: alpha(GREEN, 0.1), color: GREEN, label: 'On track' },
    'at-risk':  { bg: alpha(AMBER, 0.1), color: AMBER, label: 'At risk'  },
    'paid':     { bg: alpha(GREEN, 0.08), color: GREEN, label: 'Paid'    },
    'pending':  { bg: alpha(NAVY, 0.07),  color: SLATE, label: 'Pending' },
    'overdue':  { bg: alpha(RED, 0.1),    color: RED,   label: 'Overdue' },
};

const AddItemModal: React.FC<{ monthName: string; onClose: () => void; onAdd: (item: MonthItem) => void }> = ({ monthName, onClose, onAdd }) => {
    const [tab, setTab] = useState<'plan' | 'goal'>('plan');
    const [label, setLabel] = useState(''); const [amount, setAmount] = useState('');
    const [type, setType] = useState<PlanType>('payment');
    const [color, setColor] = useState(GREEN); const [status, setStatus] = useState<ItemStatus>('pending');
    const valid = label.trim() && amount;
    const submit = () => {
        if (!valid) return;
        const base = { id: Math.random().toString(36).slice(2), label: label.trim(), amount: Number(amount) };
        if (tab === 'goal') onAdd({ ...base, kind: 'goal', color, status: status === 'pending' ? 'on-track' : status as ItemStatus });
        else onAdd({ ...base, kind: 'plan', type, due: null, status });
        onClose();
    };
    return (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(0,0,0,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '12px', width: 440, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box><Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Add to {monthName}</Typography></Box>
                    <Box onClick={onClose} sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20, lineHeight: 1 }}>✕</Box>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: `1px solid ${alpha('#000', 0.08)}` }}>
                    {([['plan', 'Payment / Plan'], ['goal', 'Budget Goal']] as const).map(([t, l]) => (
                        <Box key={t} onClick={() => setTab(t)} sx={{ flex: 1, py: 1.25, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: tab === t ? MAROON : SLATE, borderBottom: tab === t ? `2px solid ${MAROON}` : '2px solid transparent' }}>{l}</Box>
                    ))}
                </Box>
                <Box sx={{ px: 2.5, py: 2 }}>
                    <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Label</Typography>
                        <Box component="input" value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} placeholder="e.g. Car payment, Trip deposit..." sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.25, py: 0.875, fontSize: '0.88rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Amount</Typography>
                        <Box sx={{ position: 'relative' }}>
                            <Typography sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.9rem' }}>$</Typography>
                            <Box component="input" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="0" sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', pl: 3, pr: 1.25, py: 0.875, fontSize: '0.88rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.25, justifyContent: 'flex-end' }}>
                        <Box onClick={onClose} sx={{ px: 2.5, py: 0.875, borderRadius: '7px', border: `1px solid ${alpha('#000', 0.14)}`, color: SLATE, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</Box>
                        <Box onClick={submit} sx={{ px: 2.5, py: 0.875, borderRadius: '7px', bgcolor: valid ? MAROON : alpha('#000', 0.1), color: valid ? '#fff' : SLATE, fontSize: '0.85rem', fontWeight: 600, cursor: valid ? 'pointer' : 'default' }}>Add to {monthName}</Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// ── MonthDetailPanel ──────────────────────────────────────────────────────────
const MonthDetailPanel: React.FC<{
    monthName: string; items: MonthItem[];
    onAddItem: () => void; onUpdateItem: (id: string, status: ItemStatus) => void;
}> = ({ monthName, items, onAddItem, onUpdateItem }) => {
    const goals = items.filter(it => it.kind === 'goal') as MonthGoalItem[];
    const plans = items.filter(it => it.kind === 'plan') as MonthPlanItem[];
    const atRiskCount = items.filter(it => it.status === 'at-risk' || it.status === 'overdue').length;
    return (
        <Box sx={{ borderRadius: '10px', border: `1px solid ${alpha(MAROON, 0.13)}`, overflow: 'hidden', bgcolor: '#fff', mt: 1.5, mb: 0.5 }}>
            <Box sx={{ px: 2, py: 1.125, background: `linear-gradient(90deg, ${alpha(MAROON, 0.05)} 0%, transparent 100%)`, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{monthName} — goals &amp; plans</Typography>
                    {atRiskCount > 0 && <Box sx={{ fontSize: '0.7rem', fontWeight: 700, px: 0.875, py: '2px', borderRadius: '10px', bgcolor: alpha(AMBER, 0.12), color: AMBER }}>⚠ {atRiskCount} at risk</Box>}
                </Box>
                <Box onClick={onAddItem} sx={{ display: 'flex', alignItems: 'center', gap: 0.625, px: 1.25, py: 0.5, borderRadius: '5px', cursor: 'pointer', border: `1px solid ${alpha(MAROON, 0.2)}`, bgcolor: alpha(MAROON, 0.04), color: MAROON, fontSize: '0.78rem', fontWeight: 600, transition: 'all .12s', '&:hover': { bgcolor: alpha(MAROON, 0.08) } }}>+ Add goal or plan</Box>
            </Box>
            {items.length === 0 ? (
                <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: SLATE, mb: 0.75 }}>No goals or plans attached to {monthName} yet.</Typography>
                    <Box onClick={onAddItem} sx={{ display: 'inline-block', px: 2, py: 0.75, borderRadius: '6px', cursor: 'pointer', border: `0.5px dashed ${alpha('#000', 0.2)}`, color: SLATE, fontSize: '0.82rem', fontWeight: 500, '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>+ Attach something to this month</Box>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <Box sx={{ px: 2, py: 1.25, borderRight: `0.5px solid ${alpha('#000', 0.07)}` }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Goals{goals.length > 0 ? ` (${goals.length})` : ''}</Typography>
                        {goals.length === 0 ? <Typography sx={{ fontSize: '0.82rem', color: SLATE }}>None attached.</Typography> : goals.map(g => {
                            const ss = STATUS_STYLES[g.status];
                            return (
                                <Box key={g.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.25, py: 0.875, mb: 0.75, borderRadius: '7px', border: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: g.status === 'at-risk' ? alpha(AMBER, 0.04) : '#fafbfc' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: g.color, flexShrink: 0 }} />
                                        <Box><Typography sx={{ fontSize: '0.84rem', fontWeight: 500, color: NAVY }}>{g.label}</Typography><Typography sx={{ fontSize: '0.72rem', color: SLATE }}>target: ${g.amount.toLocaleString()}</Typography></Box>
                                    </Box>
                                    <Box onClick={() => onUpdateItem(g.id, g.status === 'on-track' ? 'at-risk' : 'on-track')} sx={{ fontSize: '0.7rem', fontWeight: 700, px: 0.875, py: '3px', borderRadius: '4px', bgcolor: ss.bg, color: ss.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{ss.label}</Box>
                                </Box>
                            );
                        })}
                    </Box>
                    <Box sx={{ px: 2, py: 1.25 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Plans{plans.length > 0 ? ` (${plans.length})` : ''}</Typography>
                        {plans.length === 0 ? <Typography sx={{ fontSize: '0.82rem', color: SLATE }}>None attached.</Typography> : plans.map(p => {
                            const ss = STATUS_STYLES[p.status]; const tc = PLAN_TYPES.find(pt => pt.value === p.type)?.color ?? SLATE;
                            return (
                                <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.25, py: 0.875, mb: 0.75, borderRadius: '7px', border: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: p.status === 'overdue' ? alpha(RED, 0.04) : '#fafbfc' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: tc, flexShrink: 0 }} />
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                                                <Typography sx={{ fontSize: '0.84rem', fontWeight: 500, color: NAVY }}>{p.label}</Typography>
                                                <Box sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.625, py: '1px', borderRadius: '3px', bgcolor: alpha(tc, 0.1), color: tc, textTransform: 'capitalize' }}>{p.type}</Box>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>${p.amount.toLocaleString()}{p.due ? ` · due ${p.due}` : ''}</Typography>
                                        </Box>
                                    </Box>
                                    <Box onClick={() => onUpdateItem(p.id, p.status === 'paid' ? 'pending' : 'paid')} sx={{ fontSize: '0.7rem', fontWeight: 700, px: 0.875, py: '3px', borderRadius: '4px', bgcolor: ss.bg, color: ss.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{ss.label}</Box>
                                </Box>
                            );
                        })}
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
        <Box sx={{ display: 'flex', gap: '2px', my: 1 }}>
            {template.periods.map((_, pi) => {
                const type    = getPeriodType(template, pi);
                const opacity = type === 'future-auto' ? Math.max(0.2, 0.5 + (0.5 - pi * 0.03)) : 1;
                return <Box key={pi} sx={{ flex: 1, height: 6, borderRadius: '2px', bgcolor: BAR_COLORS[type], opacity }} />;
            })}
        </Box>
    );
};

// ── Dashboard sidebar cards ───────────────────────────────────────────────────
const BudgetGoalsCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
    const salRow = template.rows.find(r => r.rowType === 'salary');
    const expRow = template.rows.find(r => r.rowType === 'expenses');
    const totalInc = salRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const totalExp = expRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const floorPct = totalInc > 0 ? Math.min(100, Math.round(((totalInc - totalExp) / totalInc) * 100 * 5)) : 0;
    const goals = [
        { name: 'Savings floor',   detail: `$500/period · ${Math.min(100, floorPct + 30)}% there`, dot: '#059669', pct: Math.min(100, floorPct + 30) },
        { name: 'Car repair fund', detail: '$1,200 by Apr · 100% funded',                          dot: '#378ADD', pct: 100 },
        { name: 'Trip deposit',    detail: '$800 by May · 100% funded',                            dot: '#d97706', pct: 100 },
    ];
    return (
        <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.1)}`, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget goals</Typography>
            </Box>
            <Box sx={{ p: 1.75 }}>
                {goals.map(g => (
                    <Box key={g.name} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, mb: 0.375 }}>
                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: g.dot, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: NAVY }}>{g.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: SLATE, ml: 2.25, mb: 0.625 }}>{g.detail}</Typography>
                        <Box sx={{ ml: 2.25, height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '2px', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${g.pct}%`, bgcolor: g.dot, borderRadius: '2px' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.73rem', color: GREEN, ml: 2.25, mt: 0.375, fontWeight: 500 }}>On track</Typography>
                    </Box>
                ))}
                <Box sx={{ mt: 1.5, pt: 1.25, borderTop: `0.5px solid ${alpha('#000', 0.07)}` }}>
                    <Box sx={{ width: '100%', py: 0.75, borderRadius: '6px', border: `0.5px dashed ${alpha('#000', 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
                        <Typography sx={{ fontSize: '0.82rem', color: SLATE }}>+ Add goal</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

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
            <Box sx={{ px: 2, py: 1.25, borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Spending signals</Typography>
            </Box>
            <Box sx={{ p: 1.75 }}>
                {signals.map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.875, py: 0.625, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '4px', bgcolor: alpha(RED, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.7rem', color: RED, fontWeight: 700 }}>▲</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', color: NAVY, lineHeight: 1.4 }}><strong>{s.label}</strong> {s.msg}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── InlineForecastPanel — persistent right column ──────────────────────────────
// Proper font sizes (0.82rem–1rem body, 1.25rem+ headlines).
// Dynamic width: flex 0 0 auto with minWidth 320px, maxWidth clamp to 30vw.
// Collapses to 48px strip.
// ═══════════════════════════════════════════════════════════════════════════════
type ForecastMode = 'review' | 'predict' | 'ripple';

interface DerivedForecast {
    expAll: number[]; predAll: number[]; incAll: number[];
    balTraj: number[]; predBalTraj: number[];
    savTraj: number[]; predSavTraj: number[];
    presentIdx: number; endBal: number; predEndBal: number;
    avgInc: number; avgExp: number; savRate: number; delta: number;
    catFlags: { label: string; color: string; entered: number; avg: number; pct: number; period: number }[];
    catPredictions: { label: string; color: string; weighted: number; variance: number; conf: number; periods: number }[];
    plans: { label: string; target: number; color: string; pct: number; predPct: number; atRisk: boolean; shortfall: number }[];
}

function deriveForecast(template: SpreadsheetTemplate): DerivedForecast {
    const N = template.periods.length || 1;
    const salRow = template.rows.find(r => r.rowType === 'salary');
    const expRows = template.rows.filter(r => r.rowType === 'expense');
    const ciRaw = template.periods.findIndex((_, i) => isPresentK(template, i));
    const ci = ciRaw >= 0 ? ciRaw : Math.floor(N / 2);
    const incAll: number[] = Array.from({ length: N }, (_, i) => salRow?.values[i] ?? 0);
    const predAll: number[] = Array.from({ length: N }, () => {
        const rp = expRows.map(r => {
            const past = r.values.slice(0, ci).filter((v): v is number => v !== null && v > 0);
            if (!past.length) return 0;
            const W = [0.4, 0.3, 0.2, 0.1]; const rc = past.slice(-4);
            const ws = rc.reduce((s, v, wi) => s + v * (W[W.length - rc.length + wi] ?? 0.1), 0);
            const wt = rc.reduce((s, _, wi) => s + (W[W.length - rc.length + wi] ?? 0.1), 0);
            return wt > 0 ? ws / wt : past[past.length - 1];
        });
        return Math.round(rp.reduce((a, b) => a + b, 0));
    });
    const expAll: number[] = Array.from({ length: N }, (_, i) => {
        const total = expRows.reduce((s, r) => s + (r.values[i] ?? 0), 0);
        return total > 0 ? total : predAll[i];
    });
    const netAll = expAll.map((e, i) => incAll[i] - e);
    const predNetAll = predAll.map((p, i) => incAll[i] - p);
    let bal = 0, predBal = 0, sav = 0, predSav = 0;
    const balTraj: number[] = [], predBalTraj: number[] = [], savTraj: number[] = [], predSavTraj: number[] = [];
    for (let i = 0; i < N; i++) {
        bal += netAll[i]; predBal += predNetAll[i];
        sav += Math.max(0, netAll[i]); predSav += Math.max(0, predNetAll[i]);
        balTraj.push(Math.round(bal)); predBalTraj.push(Math.round(predBal));
        savTraj.push(Math.round(sav)); predSavTraj.push(Math.round(predSav));
    }
    const futureEntered = expRows.flatMap(r => r.values.map((v, i) => isFutureK(template, i) && v !== null && v > 0 ? v : null).filter((v): v is number => v !== null));
    const avgFE = futureEntered.length ? Math.round(futureEntered.reduce((a, b) => a + b, 0) / futureEntered.length) : 0;
    const futurePredVals = predAll.filter((_, i) => isFutureK(template, i));
    const avgPF = futurePredVals.length ? Math.round(futurePredVals.reduce((a, b) => a + b, 0) / futurePredVals.length) : 0;
    const delta = avgFE > 0 ? avgFE - avgPF : 0;
    const catFlags: DerivedForecast['catFlags'] = [];
    expRows.forEach(row => {
        const pv = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isPastK(template, i)).map(({ v }) => v as number);
        if (!pv.length) return;
        const avg = Math.round(pv.reduce((a, b) => a + b, 0) / pv.length);
        const fut = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && isFutureK(template, i));
        if (!fut.length) return;
        const worst = fut.reduce((a, b) => Math.abs((b.v as number) - avg) > Math.abs((a.v as number) - avg) ? b : a);
        const pct = avg > 0 ? Math.round(((worst.v as number) - avg) / avg * 100) : 0;
        if (Math.abs(pct) >= 15) catFlags.push({ label: row.label, color: CAT_COLORS[row.label] ?? SLATE, entered: worst.v as number, avg, pct, period: worst.i });
    });
    catFlags.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    const catPredictions = expRows.map(row => {
        const pv = row.values.slice(0, ci).filter((v): v is number => v !== null && v > 0);
        if (!pv.length) return null;
        const W = [0.4, 0.3, 0.2, 0.1]; const rc = pv.slice(-4);
        const weighted = Math.round(rc.reduce((s, v, wi) => s + v * (W[W.length - rc.length + wi] ?? 0.1), 0) / rc.reduce((s, _, wi) => s + (W[W.length - rc.length + wi] ?? 0.1), 0));
        const variance = Math.round(Math.sqrt(pv.reduce((s, v) => s + Math.pow(v - weighted, 2), 0) / pv.length));
        const conf = clamp(100 - Math.round((variance / Math.max(weighted, 1)) * 100), 40, 97);
        return { label: row.label, color: CAT_COLORS[row.label] ?? SLATE, weighted, variance, conf, periods: pv.length };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
    const futureNet = netAll.slice(ci + 1).reduce((a, b) => a + Math.max(0, b), 0);
    const predFutureNet = predNetAll.slice(ci + 1).reduce((a, b) => a + Math.max(0, b), 0);
    const plans = [
        { label: 'Car repair fund', target: 1200, color: NAVY  },
        { label: 'Trip deposit',    target: 800,  color: AMBER },
        { label: 'Emergency fund',  target: 2400, color: GREEN },
    ].map(p => {
        const alloc = clamp(Math.round(futureNet * 0.3), 0, p.target);
        const predAlloc = clamp(Math.round(predFutureNet * 0.3), 0, p.target);
        const pct = clamp(Math.round((alloc / p.target) * 100), 0, 100);
        const predPct = clamp(Math.round((predAlloc / p.target) * 100), 0, 100);
        return { ...p, pct, predPct, atRisk: pct < predPct - 8, shortfall: Math.round(p.target * (1 - pct / 100)) };
    });
    return {
        expAll, predAll, incAll, balTraj, predBalTraj, savTraj, predSavTraj,
        presentIdx: ci, endBal: balTraj[N-1] ?? 0, predEndBal: predBalTraj[N-1] ?? 0,
        avgInc: Math.round(incAll.reduce((a,b)=>a+b,0)/N),
        avgExp: Math.round(expAll.reduce((a,b)=>a+b,0)/N),
        savRate: incAll[ci] > 0 ? Math.round(((incAll[ci] - expAll[ci]) / incAll[ci]) * 100) : 0,
        delta, catFlags, catPredictions, plans,
    };
}

// Compact SVG line chart for the panel
const MiniLineChart: React.FC<{
    series: { data: (number | null)[]; color: string; dashed?: boolean; width?: number }[];
    labels: string[]; height?: number; floorValue?: number; presentIdx?: number;
}> = ({ series, labels, height = 160, floorValue, presentIdx }) => {
    const W = 520; const H = height;
    const PAD = { t: 12, r: 12, b: 28, l: 58 };
    const CW = W - PAD.l - PAD.r; const CH = H - PAD.t - PAD.b; const n = labels.length;
    const allVals = series.flatMap(s => s.data.filter((v): v is number => v !== null));
    if (floorValue !== undefined) allVals.push(floorValue);
    const minV = Math.min(...allVals, 0); const maxV = Math.max(...allVals, 1); const range = maxV - minV || 1;
    const px = (i: number) => PAD.l + (i / Math.max(n - 1, 1)) * CW;
    const py = (v: number) => PAD.t + CH - ((v - minV) / range) * CH;
    const tickStep = range > 3000 ? 1000 : range > 1000 ? 500 : range > 400 ? 200 : 100;
    const ticks: number[] = [];
    for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV; v += tickStep) ticks.push(v);
    return (
        <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {ticks.map(v => <line key={v} x1={PAD.l} y1={py(v)} x2={PAD.l+CW} y2={py(v)} stroke={alpha('#000',0.05)} strokeWidth="1"/>)}
            {ticks.map(v => <text key={v} x={PAD.l-5} y={py(v)+4} textAnchor="end" fontSize="11" fill={SLATE}>{v<0?`-$${fmtS(Math.abs(v))}`:`$${fmtS(v)}`}</text>)}
            {labels.map((p,i) => <text key={i} x={px(i)} y={PAD.t+CH+18} textAnchor="middle" fontSize="11" fill={presentIdx===i?MAROON:SLATE} fontWeight={presentIdx===i?'700':'400'}>{p}</text>)}
            {minV<0&&maxV>0&&<line x1={PAD.l} y1={py(0)} x2={PAD.l+CW} y2={py(0)} stroke={alpha('#000',0.12)} strokeWidth="1" strokeDasharray="3 3"/>}
            {floorValue!==undefined&&py(floorValue)>PAD.t&&py(floorValue)<PAD.t+CH&&<line x1={PAD.l} y1={py(floorValue)} x2={PAD.l+CW} y2={py(floorValue)} stroke={alpha(AMBER,0.6)} strokeWidth="1.5" strokeDasharray="5 3"/>}
            {presentIdx!==undefined&&presentIdx>=0&&<line x1={px(presentIdx)} y1={PAD.t} x2={px(presentIdx)} y2={PAD.t+CH} stroke={alpha(MAROON,0.2)} strokeWidth="1" strokeDasharray="3 2"/>}
            {series.map((s,si) => {
                const segs: {x:number;y:number}[][] = []; let seg: {x:number;y:number}[] = [];
                s.data.forEach((v,i) => { if(v!==null){seg.push({x:px(i),y:py(v)})}else if(seg.length){segs.push(seg);seg=[];} });
                if(seg.length) segs.push(seg);
                return segs.map((sg,gi) => <path key={`${si}-${gi}`} d={smoothPath(sg)} fill="none" stroke={s.color} strokeWidth={s.width??2.5} strokeDasharray={s.dashed?'5 3':undefined} strokeLinecap="round" strokeLinejoin="round"/>);
            })}
            {series.filter(s=>!s.dashed).map((s,si) => s.data.map((v,i) => v!==null?<circle key={`d-${si}-${i}`} cx={px(i)} cy={py(v)} r="3.5" fill={s.color} stroke="#fff" strokeWidth="2"/>:null))}
        </Box>
    );
};

const InlineForecastPanel: React.FC<{ template: SpreadsheetTemplate; collapsed: boolean; onToggle: () => void }> = ({ template, collapsed, onToggle }) => {
    const [mode, setMode] = useState<ForecastMode>('review');
    const [rippleView, setRippleView] = useState<'balance' | 'savings'>('balance');
    const d = useMemo(() => deriveForecast(template), [template]);
    const N = template.periods.length || 1;
    const userColor = d.delta > 50 ? RED : GREEN;

    // ── Collapsed strip ───────────────────────────────────────────────────────
    if (collapsed) {
        return (
            <Box sx={{
                width: 48, flexShrink: 0,
                bgcolor: '#fff',
                border: `1px solid ${alpha(MAROON, 0.15)}`,
                borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                py: 2, gap: 2,
                boxShadow: `0 4px 20px ${alpha(MAROON, 0.07)}`,
                alignSelf: 'flex-start',
                position: 'sticky', top: 16,
                cursor: 'pointer',
            }} onClick={onToggle}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(MAROON, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { bgcolor: alpha(MAROON, 0.15) }, transition: 'all .15s' }}>
                    <InsightsIcon sx={{ fontSize: '1.1rem', color: MAROON }} />
                </Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.1em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    Forecast
                </Typography>
                {/* Status dots */}
                {[d.endBal >= 0 ? GREEN : RED, d.savRate >= 10 ? GREEN : AMBER, d.catFlags.length > 0 ? AMBER : GREEN].map((c, i) => (
                    <Box key={i} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
                ))}
            </Box>
        );
    }

    // ── Expanded panel ────────────────────────────────────────────────────────
    return (
        <Box sx={{
            // Dynamic width: grows between 320px and 420px, uses 28% of available space
            flex: '0 0 auto',
            width: 'clamp(320px, 28%, 420px)',
            border: `1px solid ${alpha(MAROON, 0.15)}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: `0 4px 24px ${alpha(MAROON, 0.09)}`,
            display: 'flex', flexDirection: 'column',
            alignSelf: 'flex-start',
            position: 'sticky', top: 16,
        }}>
            {/* ── Maroon header ── */}
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, px: 2, py: 1.75, flexShrink: 0 }}>
                {/* Title row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <InsightsIcon sx={{ fontSize: '1.2rem', color: '#fff' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Forecast</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', mt: '1px' }}>{N} periods · weighted predictions</Typography>
                        </Box>
                    </Box>
                    <Box onClick={onToggle} sx={{ width: 30, height: 30, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.28)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' }, transition: 'all .15s', flexShrink: 0 }}>
                        <ChevronRight size={15} color="#fff" />
                    </Box>
                </Box>

                {/* KPI strip */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                    {[
                        { label: 'End balance', val: fmtC(d.endBal), color: d.endBal >= 0 ? '#4ade80' : '#f87171' },
                        { label: 'Savings rate', val: `${d.savRate}%`, color: d.savRate >= 10 ? '#4ade80' : '#fbbf24' },
                    ].map((k, i) => (
                        <Box key={i} sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '8px', px: 1.25, py: 0.875 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>{k.label}</Typography>
                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>{k.val}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Mode pills */}
                <Box sx={{ display: 'flex', gap: 0.625 }}>
                    {([
                        { key: 'review'  as ForecastMode, label: 'Review'      },
                        { key: 'predict' as ForecastMode, label: 'Predictions' },
                        { key: 'ripple'  as ForecastMode, label: 'Trajectories'},
                    ]).map(m => (
                        <Box key={m.key} onClick={() => setMode(m.key)} sx={{
                            flex: 1, py: '6px', textAlign: 'center', borderRadius: '18px', border: '1px solid',
                            cursor: 'pointer', userSelect: 'none', fontSize: '0.75rem', fontWeight: 700, transition: 'all .12s',
                            borderColor: mode === m.key ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.25)',
                            bgcolor:     mode === m.key ? 'rgba(255,255,255,.22)' : 'transparent',
                            color:       mode === m.key ? '#fff' : 'rgba(255,255,255,.7)',
                            '&:hover':   mode !== m.key ? { bgcolor: 'rgba(255,255,255,.1)', color: '#fff' } : {},
                        }}>{m.label}</Box>
                    ))}
                </Box>
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{
                overflowY: 'auto', p: 2, bgcolor: '#fff',
                maxHeight: 'calc(100vh - 320px)',
                '&::-webkit-scrollbar': { width: 5 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.22), borderRadius: 3 },
            }}>

                {/* ══ REVIEW ══════════════════════════════════════════════════ */}
                {mode === 'review' && (
                    <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Category flags</Typography>
                        {d.catFlags.length === 0 ? (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: alpha(GREEN, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                                    <Typography sx={{ fontSize: '1.1rem', color: GREEN }}>✓</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.88rem', color: SLATE }}>No deviations detected.</Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: alpha(SLATE, 0.7), mt: 0.375 }}>All future entries within 15% of avg.</Typography>
                            </Box>
                        ) : d.catFlags.slice(0, 5).map(f => {
                            const over = f.pct > 0; const col = Math.abs(f.pct) > 40 ? RED : AMBER;
                            const barPct = clamp(Math.round((f.entered / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
                            const avgPct = clamp(Math.round((f.avg / Math.max(f.avg * 1.6, 1)) * 100), 0, 100);
                            return (
                                <Box key={f.label} sx={{ p: '11px 13px', mb: 0.875, borderRadius: '10px', border: `0.5px solid ${over ? alpha(col, 0.35) : alpha(GREEN, 0.3)}`, bgcolor: over ? alpha(col, 0.04) : alpha(GREEN, 0.03) }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, mb: 0.625 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: f.color, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, flex: 1 }}>{f.label}</Typography>
                                        <Box sx={{ fontSize: '0.75rem', fontWeight: 700, px: 0.875, py: '2px', borderRadius: '5px', bgcolor: alpha(over ? col : GREEN, 0.12), color: over ? col : GREEN }}>{over ? '+' : ''}{f.pct}%</Box>
                                    </Box>
                                    <Box sx={{ position: 'relative', height: 5, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.625 }}>
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${avgPct}%`, bgcolor: PAST_C, borderRadius: 2 }} />
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barPct}%`, bgcolor: over ? col : GREEN, borderRadius: 2 }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.76rem', color: SLATE }}>Entered {fmtC(f.entered)} · avg {fmtC(f.avg)} · period {f.period + 1}</Typography>
                                </Box>
                            );
                        })}

                        <Divider sx={{ my: 2, borderColor: alpha('#000', 0.07) }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Payment plans</Typography>
                        {d.plans.map(p => {
                            const sc = p.pct >= 90 ? GREEN : p.atRisk ? RED : AMBER;
                            return (
                                <Box key={p.label} sx={{ mb: 1.125 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                                            <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: p.color }} />
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: p.atRisk ? RED : NAVY }}>{p.label}</Typography>
                                        </Box>
                                        <Box sx={{ fontSize: '0.72rem', fontWeight: 700, px: 0.875, py: '2px', borderRadius: '5px', bgcolor: alpha(sc, 0.12), color: sc }}>
                                            {p.pct >= 90 ? 'on track' : p.atRisk ? 'at risk' : 'partial'}
                                        </Box>
                                    </Box>
                                    <Box sx={{ position: 'relative', height: 6, borderRadius: 2, bgcolor: alpha('#000', 0.07), mb: 0.5 }}>
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${p.predPct}%`, bgcolor: alpha('#000', 0.18) }} />
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, width: `${p.pct}%`, bgcolor: sc, transition: 'width .4s' }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>baseline {p.predPct}%</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: sc }}>{p.pct}% on your data</Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* ══ PREDICTIONS ═════════════════════════════════════════════ */}
                {mode === 'predict' && (
                    <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Predicted spend per category</Typography>
                        {d.catPredictions.map(c => {
                            const cc = c.conf >= 80 ? GREEN : c.conf >= 60 ? AMBER : RED;
                            return (
                                <Box key={c.label} sx={{ mb: 0.875, p: '11px 13px', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, transition: 'box-shadow .15s', '&:hover': { boxShadow: `0 2px 8px ${alpha('#000', 0.08)}` } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.625 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color }} />
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{c.label}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(c.weighted)}</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>±{fmtC(c.variance)}</Typography>
                                        </Box>
                                    </Box>
                                    <LinearProgress variant="determinate" value={clamp(c.conf, 0, 100)} sx={{ height: 5, borderRadius: 2, bgcolor: alpha(cc, 0.12), '& .MuiLinearProgress-bar': { bgcolor: cc, borderRadius: 2 } }} />
                                    <Typography sx={{ fontSize: '0.76rem', color: SLATE, mt: 0.5 }}>{c.conf}% confidence · {c.periods} period{c.periods !== 1 ? 's' : ''}</Typography>
                                </Box>
                            );
                        })}

                        <Divider sx={{ my: 2, borderColor: alpha('#000', 0.07) }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Model signals</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {[
                                { label: 'Weighted recent periods', on: true },
                                { label: 'Lock manually entered cells', on: true },
                                { label: 'Fixed cost detection', on: true },
                                { label: 'Seasonal patterns', on: false },
                            ].map(s => (
                                <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.625, px: 1, py: 0.5, borderRadius: '6px', bgcolor: s.on ? alpha(GREEN, 0.08) : alpha('#000', 0.04), border: `0.5px solid ${s.on ? alpha(GREEN, 0.28) : alpha('#000', 0.1)}` }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.on ? GREEN : alpha(SLATE, 0.35) }} />
                                    <Typography sx={{ fontSize: '0.78rem', color: s.on ? '#065f46' : SLATE, fontWeight: s.on ? 600 : 400 }}>{s.label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ══ TRAJECTORIES ════════════════════════════════════════════ */}
                {mode === 'ripple' && (
                    <Box>
                        <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
                            {([['balance', 'Balance'], ['savings', 'Savings']] as ['balance' | 'savings', string][]).map(([k, l]) => (
                                <Box key={k} onClick={() => setRippleView(k)} sx={{
                                    flex: 1, py: '7px', textAlign: 'center', borderRadius: '7px', cursor: 'pointer', userSelect: 'none',
                                    fontSize: '0.82rem', fontWeight: 700, transition: 'all .12s',
                                    border: `0.5px solid ${rippleView === k ? alpha(MAROON, 0.35) : alpha('#000', 0.12)}`,
                                    bgcolor: rippleView === k ? alpha(MAROON, 0.07) : 'transparent',
                                    color:   rippleView === k ? MAROON : SLATE,
                                }}>{l}</Box>
                            ))}
                        </Box>

                        {/* Legend */}
                        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 1.25 }}>
                            {[
                                { color: MAROON, label: 'Actual', dashed: false },
                                { color: PROJ, label: 'Predicted', dashed: true },
                                { color: userColor, label: 'Your data', dashed: false },
                                ...(rippleView === 'savings' ? [{ color: AMBER, label: '$500 floor', dashed: true }] : []),
                            ].map(it => (
                                <Box key={it.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {it.dashed
                                        ? <Box component="svg" width={14} height={6}><line x1="0" y1="3" x2="14" y2="3" stroke={it.color} strokeWidth="2" strokeDasharray="4 2"/></Box>
                                        : <Box sx={{ width: 14, height: 3, borderRadius: 1, bgcolor: it.color }} />}
                                    <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>{it.label}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ bgcolor: alpha('#000', 0.015), borderRadius: '9px', p: 1.25, mb: 2 }}>
                            {rippleView === 'balance' && (
                                <MiniLineChart labels={template.periods} height={160} presentIdx={d.presentIdx}
                                               series={[
                                                   { data: d.balTraj.map((v,i) => i <= d.presentIdx ? v : null),     color: MAROON,    width: 2.5 },
                                                   { data: d.predBalTraj.map((v,i) => i >= d.presentIdx ? v : null), color: PROJ,      width: 2, dashed: true },
                                                   { data: d.balTraj.map((v,i) => i >= d.presentIdx ? v : null),     color: userColor, width: 2.5 },
                                               ]}
                                />
                            )}
                            {rippleView === 'savings' && (
                                <MiniLineChart labels={template.periods} height={160} presentIdx={d.presentIdx} floorValue={500}
                                               series={[
                                                   { data: d.savTraj.map((v,i) => i <= d.presentIdx ? v : null),     color: GREEN,     width: 2.5 },
                                                   { data: d.predSavTraj.map((v,i) => i >= d.presentIdx ? v : null), color: PROJ,      width: 2, dashed: true },
                                                   { data: d.savTraj.map((v,i) => i >= d.presentIdx ? v : null),     color: userColor, width: 2.5 },
                                               ]}
                                />
                            )}
                        </Box>

                        {/* End-of-plan cards */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                            {[
                                { label: 'Your end balance',  val: fmtC(d.endBal),    color: d.endBal >= d.predEndBal ? GREEN : RED, sub: `pred. ${fmtC(d.predEndBal)}` },
                                { label: 'Savings rate',      val: `${d.savRate}%`,   color: d.savRate >= 10 ? GREEN : AMBER,        sub: d.savRate >= 10 ? 'on target' : 'below 10% goal' },
                            ].map((k, i) => (
                                <Box key={i} sx={{ bgcolor: '#fff', borderRadius: '9px', px: 1.5, py: 1.125, border: `0.5px solid ${alpha('#000', 0.09)}` }}>
                                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, mb: 0.25 }}>{k.label}</Typography>
                                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{k.val}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, mt: 0.25 }}>{k.sub}</Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Plan cascade */}
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Goal cascade</Typography>
                        {d.plans.map(p => {
                            const sc = p.pct >= 90 ? GREEN : p.atRisk ? RED : AMBER;
                            return (
                                <Box key={p.label} sx={{ mb: 1.25 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.625 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                                            <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: p.color }} />
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: p.atRisk ? RED : NAVY }}>{p.label}</Typography>
                                            <Typography sx={{ fontSize: '0.76rem', color: SLATE }}>· {fmtC(p.target)}</Typography>
                                        </Box>
                                        <Box sx={{ fontSize: '0.72rem', fontWeight: 700, px: 0.875, py: '2px', borderRadius: '5px', bgcolor: alpha(sc, 0.12), color: sc }}>
                                            {p.pct >= 90 ? 'on track' : p.atRisk ? 'at risk' : 'partial'}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, mb: 0.375 }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: SLATE, minWidth: 56 }}>Baseline</Typography>
                                        <Box sx={{ flex: 1, height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                                            <Box sx={{ width: `${p.predPct}%`, height: '100%', bgcolor: alpha('#000', 0.22), borderRadius: '3px' }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.75rem', color: SLATE, minWidth: 30, textAlign: 'right' }}>{p.predPct}%</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY, minWidth: 56 }}>Your data</Typography>
                                        <Box sx={{ flex: 1, height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
                                            <Box sx={{ width: `${p.pct}%`, height: '100%', bgcolor: sc, borderRadius: '3px', transition: 'width .4s' }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: sc, minWidth: 30, textAlign: 'right' }}>{p.pct}%</Typography>
                                    </Box>
                                    {p.shortfall > 0 && (
                                        <Box sx={{ mt: 0.625, display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.875, py: '3px', borderRadius: '5px', bgcolor: alpha(AMBER, 0.1), border: `0.5px solid ${alpha(AMBER, 0.3)}` }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: AMBER }}>Need {fmtC(p.shortfall)} more</Typography>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── PlanningView ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
interface Props {
    template:        SpreadsheetTemplate;
    periodFilter:    PeriodFilter;
    onPeriodFilter:  (p: PeriodFilter) => void;
    onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
    onSaveTemplate?: () => void;
}

const PlanningView: React.FC<Props> = ({ template, periodFilter, onPeriodFilter, onCellChange, onSaveTemplate }) => {
    const [subView,           setSubView]          = useState<SubViewMode>('dashboard');
    const [mode,              setMode]             = useState<'manual' | 'auto'>('auto');
    const [categoryTargets,   setCategoryTargets]  = useState<CategoryTargets>({});
    const [monthItems,        setMonthItems]       = useState<MonthItemMap>({});
    const [addTarget,         setAddTarget]        = useState<string | null>(null);
    const [futurePeriodOpen,  setFuturePeriodOpen] = useState(false);
    const [forecastCollapsed, setForecastCollapsed]= useState(false);

    const defaultPeriod = useMemo(() => {
        const pi = template.periods.findIndex((_, i) => isPeriodPresent(template, i));
        if (pi >= 0) return pi;
        return template.periods.reduce((last, _, pi) => !isPeriodFuture(template, pi) ? pi : last, 0);
    }, [template]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>(defaultPeriod);

    const handleAddItem    = (mn: string, item: MonthItem) => setMonthItems(prev => ({ ...prev, [mn]: [...(prev[mn] ?? []), item] }));
    const handleUpdateItem = (mn: string, id: string, status: ItemStatus) => setMonthItems(prev => ({ ...prev, [mn]: (prev[mn] ?? []).map(it => it.id === id ? { ...it, status } : it) }));
    const handleSetTarget  = useCallback((pi: number, label: string, value: number | null) => {
        setCategoryTargets(prev => {
            const key = `${pi}-${label}`;
            if (value === null) { const { [key]: _, ...rest } = prev; return rest; }
            return { ...prev, [key]: value };
        });
    }, []);
    const handleFuturePeriodApply = useCallback((periodIndex: number, values: Record<string, number | null>) => {
        template.rows.forEach((row, ri) => { if (row.label in values) onCellChange(ri, periodIndex, values[row.label]); });
    }, [template.rows, onCellChange]);

    const totalSalary   = template.rows.find(r => r.label === 'Salary')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const totalExpenses = template.rows.find(r => r.rowType === 'expenses')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
    const savingsRate   = totalSalary > 0 ? ((totalSalary - totalExpenses) / totalSalary) * 100 : 0;
    const overBudgetPct = totalSalary > 0 ? (totalExpenses / totalSalary) * 100 : 0;
    const finalBalance  = template.rows.find(r => r.rowType === 'balance')?.values.filter((v): v is number => v !== null).slice(-1)[0] ?? 0;
    const n             = template.periods.length || 1;
    const hasOverride   = !!template.viewOverride;

    const months = useMemo(() => (template.months ?? []).map(m => {
        const firstPi = m.cols[0]; const type = getPeriodType(template, firstPi);
        const salRow = template.rows.find(r => r.rowType === 'salary');
        const totalIn = m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0);
        const sub = totalIn > 0 ? `$${fmtS(totalIn)} in` : type === 'future-auto' ? 'auto-filled' : type === 'future-manual' ? `$${fmtS(m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0))} est` : '';
        return { name: m.name.replace(/ \d{4}/, ''), type, sub, cols: m.cols };
    }), [template]);

    const dashboardContent = (
        <Grid container spacing={2.5} alignItems="flex-start">
            <Grid item xs={12} lg={7}>
                <Box sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Timeline — click a period to inspect</Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, mb: 0.375 }}>
                        {months.map((m, i) => (
                            <MonthChip key={i} name={m.name} type={m.type as any} sub={m.sub} selected={m.cols.includes(selectedPeriod)} onClick={() => setSelectedPeriod(m.cols[0])} items={monthItems[m.name] ?? []} onAdd={() => setAddTarget(m.name)} />
                        ))}
                    </Box>
                    {(() => {
                        const activeMth = months.find(m => m.cols.includes(selectedPeriod));
                        if (!activeMth || activeMth.cols.length <= 1) return null;
                        return (
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, pl: 0.25 }}>
                                {activeMth.cols.map(pi => {
                                    const label = template.periods[pi] ?? ''; const type = getPeriodType(template, pi); const isSel = pi === selectedPeriod;
                                    const BG_MAP = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
                                    const FG_MAP = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
                                    const BD_MAP = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.35), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
                                    return (
                                        <Box key={pi} onClick={() => setSelectedPeriod(pi)} sx={{ px: 1, py: 0.4, borderRadius: '5px', cursor: 'pointer', bgcolor: isSel ? MAROON : BG_MAP[type], border: `0.5px solid ${isSel ? MAROON : BD_MAP[type]}`, '&:hover': { bgcolor: isSel ? MAROON : alpha(MAROON, 0.06) }, transition: 'background .12s' }}>
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: isSel ? '#fff' : FG_MAP[type], whiteSpace: 'nowrap' }}>{label}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })()}
                    <PeriodBars template={template} />
                    <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap', mt: 0.25 }}>
                        {[{ color: '#B4B2A9', label: 'Past actuals' }, { color: MAROON, label: 'Current' }, { color: '#85B7EB', label: 'Manually planned' }, { color: '#97C459', label: 'Auto-predicted' }].map(({ color, label }) => (
                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                                <Box sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: color }} />
                                <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
                {(() => {
                    const activeMth = months.find(m => m.cols.includes(selectedPeriod));
                    if (!activeMth) return null;
                    return <MonthDetailPanel monthName={activeMth.name} items={monthItems[activeMth.name] ?? []} onAddItem={() => setAddTarget(activeMth.name)} onUpdateItem={(id, status) => handleUpdateItem(activeMth.name, id, status)} />;
                })()}
                <PeriodDetailCard template={template} periodIndex={selectedPeriod} mode={mode} />
            </Grid>
            <Grid item xs={12} lg={5}>
                <Stack spacing={1.75}>
                    <BudgetGoalsCard template={template} />
                    <SpendingSignalsCard template={template} selectedPi={selectedPeriod} />
                </Stack>
            </Grid>
        </Grid>
    );

    return (
        <Box>
            {/* ── Two-column: main (flex: 1 1 0, min-width: 0) + forecast panel ── */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>

                {/* Main planning card — takes all remaining space */}
                <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                    <Box sx={{
                        borderRadius: '12px', overflow: 'hidden',
                        border: `1px solid ${alpha(hasOverride ? BLUE : MAROON, 0.14)}`,
                        boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`,
                        mb: subView === 'classic' ? 3 : 0,
                    }}>
                        {/* Maroon header */}
                        <Box sx={{
                            background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`,
                            px: 2.5, py: 1.625,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: 1,
                        }}>
                            <Box>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{template.name}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                                    {`${template.periods.length} ${template.periodType?.toLowerCase() ?? 'biweekly'} periods · ${template.periods.filter((_, pi) => !isPeriodFuture(template, pi)).length} past · ${template.periods.filter((_, pi) => isPeriodPresent(template, pi)).length} current · ${template.periods.filter((_, pi) => isPeriodFuture(template, pi)).length} future`}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                                {subView === 'dashboard' && <ModeToggle active={mode} onChange={setMode} />}
                                {subView === 'classic' && (
                                    <Button size="small" onClick={() => setFuturePeriodOpen(true)} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', px: 1.5, py: 0.5, border: '1px solid rgba(255,255,255,0.25)', color: '#fff', bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                                        + Future period
                                    </Button>
                                )}
                                <Box sx={{ width: '1px', height: 22, bgcolor: 'rgba(255,255,255,0.2)' }} />
                                <SubViewToggle active={subView} onChange={v => setSubView(v)} />
                                <Button size="small" sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                                    <Add sx={{ fontSize: '0.9rem' }} /> Add period
                                </Button>
                            </Box>
                        </Box>

                        {/* KPI strip */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                            {[
                                { label: 'Avg income / period', val: `$${fmtS(totalSalary / n)}`,   sub: 'historical avg',  color: NAVY                           },
                                { label: 'Avg spend / period',  val: `$${fmtS(totalExpenses / n)}`, sub: 'actuals only',    color: MAROON                         },
                                { label: 'Projected balance',   val: `$${fmtS(finalBalance)}`,       sub: 'end of plan',     color: finalBalance >= 0 ? GREEN : RED },
                                { label: 'Goals on track',      val: '3 of 3',                       sub: 'all goals met',   color: GREEN                          },
                            ].map((kpi, i) => (
                                <Box key={i} sx={{ px: 2.5, py: 1.5, borderRight: i < 3 ? `0.5px solid ${alpha('#000', 0.08)}` : 'none' }}>
                                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, mb: 0.25 }}>{kpi.label}</Typography>
                                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{kpi.val}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, mt: 0.25 }}>{kpi.sub}</Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Content */}
                        <Box sx={{ p: subView === 'dashboard' ? 2.25 : 3, bgcolor: '#fff' }}>
                            {subView === 'dashboard' && dashboardContent}
                            {subView === 'classic' && <ClassicSpreadsheet template={template} editMode={false} onCellChange={onCellChange} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter} />}
                        </Box>
                    </Box>

                    {/* Summary footer — classic only */}
                    {subView === 'classic' && (
                        <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.14)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}` }}>
                            <MaroonCardHeader icon={<Award size={16} color="white" />} title="Overall summary" subtitle={`Totals across all ${template.periods.length} periods`} />
                            <Box sx={{ bgcolor: '#fff', p: 0 }}>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#fdf8f8' }}>
                                                {['Total income', 'Total spent', 'Net saved', 'Savings %', 'Over budget %'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 600, color: MAROON, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.07em', py: 1.5, px: 2.5, borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}` }}>{h}</TableCell>
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
                                                        { v: `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}%`, c: savingsRate >= 0 ? GREEN : RED },
                                                        { v: `${overBudgetPct > 100 ? '+' : '–'}${Math.abs(overBudgetPct - 100).toFixed(1)}%`, c: overBudgetPct > 100 ? RED : GREEN },
                                                    ].map(({ v, c }, i) => (
                                                        <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.95rem', color: c, py: 1.75, px: 2.5, fontVariantNumeric: 'tabular-nums' }}>{v}</TableCell>
                                                    ));
                                                })()}
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Persistent forecast panel — always right, dynamic width */}
                <ForecastPanel

                    template={template}
                />
            </Box>

            {addTarget && (
                <AddItemModal monthName={addTarget} onClose={() => setAddTarget(null)} onAdd={item => { handleAddItem(addTarget, item); setAddTarget(null); }} />
            )}
            {futurePeriodOpen && (
                <FuturePeriodDialog template={template} onClose={() => setFuturePeriodOpen(false)} onApply={handleFuturePeriodApply} />
            )}
        </Box>
    );
};

export default PlanningView;
// // ── PlanningView.tsx ──────────────────────────────────────────────────────────
// // Three sub-views in the maroon header:
// //   Classic  — existing ClassicSpreadsheet
// //   Dashboard — timeline + period detail + sidebar cards
// //   What-if  — scenario explorer with live sliders, smooth SVG curve chart,
// //               goal impact bars, period-by-period comparison table
// // ── PlanningView.tsx ──────────────────────────────────────────────────────────
// // Three sub-views in the maroon header:
// //   Classic  — existing ClassicSpreadsheet
// //   Dashboard — timeline + period detail + sidebar cards
// //   What-if  — scenario explorer with live sliders, smooth SVG curve chart,
// //               goal impact bars, period-by-period comparison table
// import React, { useMemo, useState, useCallback } from 'react';
// import {
//     Box, Typography, Grid, Stack, Button,
//     Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Save, Add } from '@mui/icons-material';
// import { TableIcon, LayoutDashboard, Award, TrendingUp, BarChart2, GitBranch } from 'lucide-react';
// import {
//     MAROON, NAVY, SLATE, GREEN, RED, TEAL, BLUE, fmt, fmtS,
//     GROUP_ORDER, CAT_PCTS, deriveGroupTotals,
// } from '../domain/SpreadsheetTypes';
// import type { SpreadsheetTemplate, SpreadsheetRow, PeriodFilter } from '../domain/SpreadsheetTypes';
// import { MaroonCardHeader } from './SharedBudgetUI';
// import ClassicSpreadsheet from './ClassicSpreadsheet';
// import PeriodDetailCard from './PeriodDetailCard';
// import FuturePeriodDialog from './FuturePeriodDialog';
//
// // ── Local tokens ──────────────────────────────────────────────────────────────
// const AMBER       = '#d97706';
// const MAROON_DARK = '#4a1010';
// const PURPLE      = '#7c3aed';
//
// // ── Category dot colors ───────────────────────────────────────────────────────
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
// type SubViewMode     = 'classic' | 'dashboard' | 'scenario';
// type CategoryTargets = Record<string, number>;
//
// // ── Month-level goal / plan item types ────────────────────────────────────────
// type ItemStatus = 'on-track' | 'at-risk' | 'pending' | 'paid' | 'overdue';
// type PlanType   = 'payment' | 'subscription' | 'savings' | 'bill' | 'custom';
//
// interface MonthGoalItem {
//     id:     string;
//     kind:   'goal';
//     label:  string;
//     amount: number;
//     color:  string;
//     status: ItemStatus;
// }
// interface MonthPlanItem {
//     id:     string;
//     kind:   'plan';
//     label:  string;
//     amount: number;
//     type:   PlanType;
//     due:    string | null;
//     status: ItemStatus;
// }
// type MonthItem    = MonthGoalItem | MonthPlanItem;
// type MonthItemMap = Record<string, MonthItem[]>;
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
// // ── Smooth cubic-bezier SVG path ──────────────────────────────────────────────
// function smoothPath(pts: { x: number; y: number }[]): string {
//     if (pts.length < 2) return '';
//     let d = `M ${pts[0].x},${pts[0].y}`;
//     for (let i = 1; i < pts.length; i++) {
//         const prev = pts[i - 1];
//         const curr = pts[i];
//         const cpX  = (prev.x + curr.x) / 2;
//         d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
//     }
//     return d;
// }
//
// // ── SubViewToggle ─────────────────────────────────────────────────────────────
// const SubViewToggle: React.FC<{ active: SubViewMode; onChange: (v: SubViewMode) => void }> = ({ active, onChange }) => (
//     <Box sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', overflow: 'hidden' }}>
//         {([
//             ['classic',   'Classic',   <TableIcon       size={11} />],
//             ['dashboard', 'Dashboard', <LayoutDashboard size={11} />],
//             ['scenario',  'What-if',   <GitBranch       size={11} />],
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
// // ── ModeToggle ────────────────────────────────────────────────────────────────
// const ModeToggle: React.FC<{ active: 'manual' | 'auto'; onChange: (v: 'manual' | 'auto') => void }> = ({ active, onChange }) => (
//     <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', overflow: 'hidden', bgcolor: '#fff' }}>
//         {(['manual', 'auto-plan'] as const).map(key => {
//             const k = key === 'auto-plan' ? 'auto' : 'manual';
//             return (
//                 <Box key={key} onClick={() => onChange(k)} sx={{
//                     px: 1.5, py: 0.5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
//                     bgcolor: active === k ? MAROON : '#fff',
//                     color: active === k ? '#fff' : '#555',
//                     transition: 'all .15s',
//                     '&:hover': active !== k ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
//                     userSelect: 'none',
//                 }}>
//                     {key === 'auto-plan' ? 'Auto-plan' : 'Manual'}
//                 </Box>
//             );
//         })}
//     </Box>
// );
//
// // ── MonthChip ─────────────────────────────────────────────────────────────────
// const MonthChip: React.FC<{
//     name: string; type: 'past' | 'present' | 'future-manual' | 'future-auto';
//     sub: string; selected?: boolean; onClick?: () => void;
//     items?: MonthItem[]; onAdd?: () => void;
// }> = ({ name, type, sub, selected, onClick, items = [], onAdd }) => {
//     const [addHover, setAddHover] = useState(false);
//     const BG     = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
//     const BORDER = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.4), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
//     const COLOR  = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
//     const TAG    = { present: { label: 'now', bg: MAROON, fg: '#fff' }, 'future-manual': { label: 'planned', bg: '#85B7EB', fg: '#042C53' }, 'future-auto': { label: 'predicted', bg: '#97C459', fg: '#173404' } } as any;
//     const tag    = TAG[type];
//
//     const goals    = items.filter(it => it.kind === 'goal')  as MonthGoalItem[];
//     const plans    = items.filter(it => it.kind === 'plan')  as MonthPlanItem[];
//     const atRisk   = items.some(it => it.status === 'at-risk' || it.status === 'overdue');
//     const hasItems = items.length > 0;
//
//     return (
//         <Box onClick={onClick} sx={{
//             flex: 1, position: 'relative', pt: tag ? 1.5 : 0.75, pb: 0.625, px: 0.5,
//             borderRadius: '6px', cursor: onClick ? 'pointer' : 'default', textAlign: 'center',
//             bgcolor: BG[type], border: `1px solid ${selected ? MAROON : BORDER[type]}`,
//             outline: selected ? `2px solid ${MAROON}` : 'none', outlineOffset: '1px',
//             transition: 'outline .1s, box-shadow .12s',
//             boxShadow: selected ? `0 2px 10px ${alpha(MAROON, 0.14)}` : 'none',
//             '&:hover': onClick ? { outline: `2px solid ${alpha(MAROON, 0.35)}`, outlineOffset: '1px' } : {},
//         }}>
//             {tag && (
//                 <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 700, px: 0.75, py: 0.1, borderRadius: '3px', whiteSpace: 'nowrap', bgcolor: tag.bg, color: tag.fg }}>
//                     {tag.label}
//                 </Box>
//             )}
//             <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLOR[type] }}>{name}</Typography>
//             <Typography sx={{ fontSize: '0.68rem', color: alpha(COLOR[type], 0.7), mt: 0.2 }}>{sub}</Typography>
//             {hasItems && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.375, mt: 0.5, flexWrap: 'wrap' }}>
//                     {goals.slice(0, 3).map(g => (
//                         <Box key={g.id} title={g.label} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: g.color, flexShrink: 0, border: '1.5px solid white', boxShadow: g.status === 'at-risk' ? `0 0 0 1.5px ${AMBER}` : 'none' }} />
//                     ))}
//                     {plans.length > 0 && (
//                         <Box sx={{ fontSize: '0.57rem', fontWeight: 700, px: 0.5, py: '1px', borderRadius: '3px', bgcolor: alpha(PURPLE, 0.1), color: PURPLE, lineHeight: 1.4 }}>
//                             {plans.length}p
//                         </Box>
//                     )}
//                     {atRisk && <Typography sx={{ fontSize: '0.6rem', color: AMBER, lineHeight: 1 }}>⚠</Typography>}
//                 </Box>
//             )}
//             {onAdd && (
//                 <Box
//                     onMouseEnter={() => setAddHover(true)}
//                     onMouseLeave={() => setAddHover(false)}
//                     onClick={e => { e.stopPropagation(); onAdd(); }}
//                     sx={{ mt: 0.5, py: '2px', borderRadius: '3px', cursor: 'pointer', bgcolor: addHover ? alpha(MAROON, 0.08) : 'transparent', color: addHover ? MAROON : alpha(SLATE, 0.35), fontSize: '0.6rem', fontWeight: 700, transition: 'all .12s', userSelect: 'none' }}
//                 >+ add</Box>
//             )}
//         </Box>
//     );
// };
//
// // ── AddItemModal ──────────────────────────────────────────────────────────────
// const PLAN_TYPES: { value: PlanType; label: string; color: string }[] = [
//     { value: 'payment',      label: 'Payment',      color: PURPLE },
//     { value: 'subscription', label: 'Subscription', color: BLUE   },
//     { value: 'savings',      label: 'Savings goal', color: GREEN  },
//     { value: 'bill',         label: 'Bill',         color: AMBER  },
//     { value: 'custom',       label: 'Custom',       color: SLATE  },
// ];
// const GOAL_COLORS = [GREEN, BLUE, AMBER, TEAL, PURPLE, RED];
//
// const STATUS_STYLES: Record<ItemStatus, { bg: string; color: string; label: string }> = {
//     'on-track': { bg: alpha(GREEN, 0.1),  color: GREEN,  label: 'On track' },
//     'at-risk':  { bg: alpha(AMBER, 0.1),  color: AMBER,  label: 'At risk'  },
//     'paid':     { bg: alpha(GREEN, 0.08), color: GREEN,  label: 'Paid'     },
//     'pending':  { bg: alpha(NAVY, 0.07),  color: SLATE,  label: 'Pending'  },
//     'overdue':  { bg: alpha(RED, 0.1),    color: RED,    label: 'Overdue'  },
// };
//
// const AddItemModal: React.FC<{
//     monthName: string;
//     onClose:   () => void;
//     onAdd:     (item: MonthItem) => void;
// }> = ({ monthName, onClose, onAdd }) => {
//     const [tab,    setTab]    = useState<'plan' | 'goal'>('plan');
//     const [label,  setLabel]  = useState('');
//     const [amount, setAmount] = useState('');
//     const [due,    setDue]    = useState('');
//     const [type,   setType]   = useState<PlanType>('payment');
//     const [color,  setColor]  = useState(GREEN);
//     const [status, setStatus] = useState<ItemStatus>('pending');
//     const valid = label.trim() && amount;
//
//     const submit = () => {
//         if (!valid) return;
//         const base = { id: Math.random().toString(36).slice(2), label: label.trim(), amount: Number(amount) };
//         if (tab === 'goal') {
//             onAdd({ ...base, kind: 'goal', color, status: status === 'pending' ? 'on-track' : status as ItemStatus });
//         } else {
//             onAdd({ ...base, kind: 'plan', type, due: due || null, status });
//         }
//         onClose();
//     };
//
//     return (
//         <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(0,0,0,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//             <Box sx={{ bgcolor: '#fff', borderRadius: '12px', width: 420, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
//                 <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, px: 2.25, py: 1.375, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <Box>
//                         <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Add to {monthName}</Typography>
//                         <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>Attach a goal or payment plan to this month</Typography>
//                     </Box>
//                     <Box onClick={onClose} sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1, px: 0.5 }}>✕</Box>
//                 </Box>
//                 <Box sx={{ display: 'flex', borderBottom: `1px solid ${alpha('#000', 0.08)}` }}>
//                     {([['plan', 'Payment / Plan'], ['goal', 'Budget Goal']] as const).map(([t, l]) => (
//                         <Box key={t} onClick={() => setTab(t)} sx={{ flex: 1, py: 1.125, textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: tab === t ? MAROON : SLATE, borderBottom: tab === t ? `2px solid ${MAROON}` : '2px solid transparent', transition: 'all .15s' }}>
//                             {l}
//                         </Box>
//                     ))}
//                 </Box>
//                 <Box sx={{ px: 2.25, py: 1.75 }}>
//                     {tab === 'plan' ? (
//                         <>
//                             <Box sx={{ mb: 1.5 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Type</Typography>
//                                 <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
//                                     {PLAN_TYPES.map(pt => (
//                                         <Box key={pt.value} onClick={() => setType(pt.value)} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1.5px solid ${type === pt.value ? pt.color : alpha('#000', 0.12)}`, bgcolor: type === pt.value ? alpha(pt.color, 0.08) : 'white', color: type === pt.value ? pt.color : SLATE, fontSize: '0.71rem', fontWeight: 600, transition: 'all .12s' }}>
//                                             {pt.label}
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                             <Box sx={{ mb: 1.25 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Label</Typography>
//                                 <Box component="input" value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} placeholder="e.g. Car payment, Annual renewal..." sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.125, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
//                             </Box>
//                             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: 1.25 }}>
//                                 <Box>
//                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Amount</Typography>
//                                     <Box sx={{ position: 'relative' }}>
//                                         <Typography sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.82rem' }}>$</Typography>
//                                         <Box component="input" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="0" sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', pl: 2.5, pr: 1, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
//                                     </Box>
//                                 </Box>
//                                 <Box>
//                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Due date</Typography>
//                                     <Box component="input" value={due} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDue(e.target.value)} placeholder={`e.g. ${monthName} 15`} sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.125, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
//                                 </Box>
//                             </Box>
//                             <Box sx={{ mb: 1.75 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Status</Typography>
//                                 <Box sx={{ display: 'flex', gap: 0.75 }}>
//                                     {(['pending', 'paid', 'overdue'] as ItemStatus[]).map(s => (
//                                         <Box key={s} onClick={() => setStatus(s)} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1.5px solid ${status === s ? STATUS_STYLES[s].color : alpha('#000', 0.12)}`, bgcolor: status === s ? STATUS_STYLES[s].bg : 'white', color: status === s ? STATUS_STYLES[s].color : SLATE, fontSize: '0.71rem', fontWeight: 600, textTransform: 'capitalize', transition: 'all .12s' }}>
//                                             {s}
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                         </>
//                     ) : (
//                         <>
//                             <Box sx={{ mb: 1.25 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Goal name</Typography>
//                                 <Box component="input" value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} placeholder="e.g. Emergency fund, Trip deposit..." sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', px: 1.125, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
//                             </Box>
//                             <Box sx={{ mb: 1.25 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Target amount</Typography>
//                                 <Box sx={{ position: 'relative' }}>
//                                     <Typography sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SLATE, fontSize: '0.82rem' }}>$</Typography>
//                                     <Box component="input" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="0" sx={{ width: '100%', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', pl: 2.5, pr: 1, py: 0.75, fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', '&:focus': { outline: `1.5px solid ${MAROON}` } }} />
//                                 </Box>
//                             </Box>
//                             <Box sx={{ mb: 1.25 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>Color</Typography>
//                                 <Box sx={{ display: 'flex', gap: 1 }}>
//                                     {GOAL_COLORS.map(c => (
//                                         <Box key={c} onClick={() => setColor(c)} sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: color === c ? `2.5px solid ${NAVY}` : '2px solid transparent', boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : 'none', transition: 'all .12s' }} />
//                                     ))}
//                                 </Box>
//                             </Box>
//                             <Box sx={{ mb: 1.75 }}>
//                                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.625 }}>Status</Typography>
//                                 <Box sx={{ display: 'flex', gap: 0.75 }}>
//                                     {(['on-track', 'at-risk'] as ItemStatus[]).map(s => (
//                                         <Box key={s} onClick={() => setStatus(s)} sx={{ px: 1.125, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1.5px solid ${status === s ? STATUS_STYLES[s].color : alpha('#000', 0.12)}`, bgcolor: status === s ? STATUS_STYLES[s].bg : 'white', color: status === s ? STATUS_STYLES[s].color : SLATE, fontSize: '0.71rem', fontWeight: 600, transition: 'all .12s' }}>
//                                             {STATUS_STYLES[s].label}
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                         </>
//                     )}
//                     <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
//                         <Box onClick={onClose} sx={{ px: 2, py: 0.75, borderRadius: '7px', border: `1px solid ${alpha('#000', 0.14)}`, color: SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</Box>
//                         <Box onClick={submit} sx={{ px: 2, py: 0.75, borderRadius: '7px', bgcolor: valid ? MAROON : alpha('#000', 0.1), color: valid ? '#fff' : SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: valid ? 'pointer' : 'default', transition: 'all .15s' }}>
//                             Add to {monthName}
//                         </Box>
//                     </Box>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── MonthDetailPanel ──────────────────────────────────────────────────────────
// const MonthDetailPanel: React.FC<{
//     monthName:    string;
//     items:        MonthItem[];
//     onAddItem:    () => void;
//     onUpdateItem: (id: string, status: ItemStatus) => void;
// }> = ({ monthName, items, onAddItem, onUpdateItem }) => {
//     const goals       = items.filter(it => it.kind === 'goal') as MonthGoalItem[];
//     const plans       = items.filter(it => it.kind === 'plan') as MonthPlanItem[];
//     const atRiskCount = items.filter(it => it.status === 'at-risk' || it.status === 'overdue').length;
//
//     return (
//         <Box sx={{ borderRadius: '9px', border: `1px solid ${alpha(MAROON, 0.13)}`, overflow: 'hidden', bgcolor: '#fff', mt: 1.25, mb: 0.5 }}>
//             <Box sx={{ px: 1.75, py: 1, background: `linear-gradient(90deg, ${alpha(MAROON, 0.05)} 0%, transparent 100%)`, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
//                         {monthName} — goals &amp; plans
//                     </Typography>
//                     {atRiskCount > 0 && (
//                         <Box sx={{ fontSize: '0.61rem', fontWeight: 700, px: 0.75, py: '1px', borderRadius: '10px', bgcolor: alpha(AMBER, 0.12), color: AMBER }}>
//                             ⚠ {atRiskCount} at risk
//                         </Box>
//                     )}
//                 </Box>
//                 <Box onClick={onAddItem} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1px solid ${alpha(MAROON, 0.2)}`, bgcolor: alpha(MAROON, 0.04), color: MAROON, fontSize: '0.71rem', fontWeight: 600, transition: 'all .12s', '&:hover': { bgcolor: alpha(MAROON, 0.08) } }}>
//                     + Add goal or plan
//                 </Box>
//             </Box>
//             {items.length === 0 ? (
//                 <Box sx={{ px: 1.75, py: 1.75, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
//                     <Typography sx={{ fontSize: '0.77rem', color: SLATE }}>No goals or plans attached to {monthName} yet.</Typography>
//                     <Box onClick={onAddItem} sx={{ mt: 0.25, px: 1.5, py: 0.625, borderRadius: '6px', cursor: 'pointer', border: `0.5px dashed ${alpha('#000', 0.2)}`, color: SLATE, fontSize: '0.73rem', fontWeight: 500, transition: 'all .12s', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
//                         + Attach something to this month
//                     </Box>
//                 </Box>
//             ) : (
//                 <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
//                     <Box sx={{ px: 1.75, py: 1.125, borderRight: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                         <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.875 }}>
//                             Budget goals{goals.length > 0 ? ` (${goals.length})` : ''}
//                         </Typography>
//                         {goals.length === 0
//                             ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>None attached.</Typography>
//                             : goals.map(g => {
//                                 const ss = STATUS_STYLES[g.status];
//                                 return (
//                                     <Box key={g.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.125, py: 0.75, mb: 0.625, borderRadius: '7px', border: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: g.status === 'at-risk' ? alpha(AMBER, 0.04) : '#fafbfc', '&:last-child': { mb: 0 } }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                             <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: g.color, flexShrink: 0 }} />
//                                             <Box>
//                                                 <Typography sx={{ fontSize: '0.76rem', fontWeight: 500, color: NAVY }}>{g.label}</Typography>
//                                                 <Typography sx={{ fontSize: '0.64rem', color: SLATE }}>target: ${g.amount.toLocaleString()}</Typography>
//                                             </Box>
//                                         </Box>
//                                         <Box onClick={() => onUpdateItem(g.id, g.status === 'on-track' ? 'at-risk' : 'on-track')} sx={{ fontSize: '0.61rem', fontWeight: 700, px: 0.75, py: '2px', borderRadius: '4px', bgcolor: ss.bg, color: ss.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .12s' }}>
//                                             {ss.label}
//                                         </Box>
//                                     </Box>
//                                 );
//                             })
//                         }
//                     </Box>
//                     <Box sx={{ px: 1.75, py: 1.125 }}>
//                         <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.875 }}>
//                             Payment plans{plans.length > 0 ? ` (${plans.length})` : ''}
//                         </Typography>
//                         {plans.length === 0
//                             ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>None attached.</Typography>
//                             : plans.map(p => {
//                                 const ss = STATUS_STYLES[p.status];
//                                 const tc = PLAN_TYPES.find(pt => pt.value === p.type)?.color ?? SLATE;
//                                 return (
//                                     <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.125, py: 0.75, mb: 0.625, borderRadius: '7px', border: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: p.status === 'overdue' ? alpha(RED, 0.04) : '#fafbfc', '&:last-child': { mb: 0 } }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                             <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: tc, flexShrink: 0 }} />
//                                             <Box>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                                     <Typography sx={{ fontSize: '0.76rem', fontWeight: 500, color: NAVY }}>{p.label}</Typography>
//                                                     <Box sx={{ fontSize: '0.57rem', fontWeight: 700, px: 0.5, py: '1px', borderRadius: '3px', bgcolor: alpha(tc, 0.1), color: tc, textTransform: 'capitalize' }}>{p.type}</Box>
//                                                 </Box>
//                                                 <Typography sx={{ fontSize: '0.64rem', color: SLATE }}>${p.amount.toLocaleString()}{p.due ? ` · due ${p.due}` : ''}</Typography>
//                                             </Box>
//                                         </Box>
//                                         <Box onClick={() => onUpdateItem(p.id, p.status === 'paid' ? 'pending' : 'paid')} sx={{ fontSize: '0.61rem', fontWeight: 700, px: 0.75, py: '2px', borderRadius: '4px', bgcolor: ss.bg, color: ss.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .12s' }}>
//                                             {ss.label}
//                                         </Box>
//                                     </Box>
//                                 );
//                             })
//                         }
//                     </Box>
//                 </Box>
//             )}
//         </Box>
//     );
// };
//
// // ── PeriodBars ────────────────────────────────────────────────────────────────
// const PeriodBars: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const BAR_COLORS = { past: '#B4B2A9', present: MAROON, 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
//     return (
//         <Box sx={{ display: 'flex', gap: '2px', my: 0.75 }}>
//             {template.periods.map((_, pi) => {
//                 const type    = getPeriodType(template, pi);
//                 const opacity = type === 'future-auto' ? Math.max(0.2, 0.5 + (0.5 - pi * 0.03)) : 1;
//                 return <Box key={pi} sx={{ flex: 1, height: 5, borderRadius: '2px', bgcolor: BAR_COLORS[type], opacity }} />;
//             })}
//         </Box>
//     );
// };
//
// // ── BudgetGoalsCard ───────────────────────────────────────────────────────────
// const BudgetGoalsCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const salaryRow       = template.rows.find(r => r.rowType === 'salary');
//     const expRow          = template.rows.find(r => r.rowType === 'expenses');
//     const totalInc        = salaryRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const totalExp        = expRow?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const savingsFloorPct = totalInc > 0 ? Math.min(100, Math.round(((totalInc - totalExp) / totalInc) * 100 * 5)) : 0;
//     const goals = [
//         { name: 'Savings floor',   detail: `$500/period · ${Math.min(100, savingsFloorPct + 30)}% there`, dot: '#059669', pct: Math.min(100, savingsFloorPct + 30), ok: true },
//         { name: 'Car repair fund', detail: '$1,200 by Apr · 100% funded',                                 dot: '#378ADD', pct: 100,                                 ok: true },
//         { name: 'Trip deposit',    detail: '$800 by May · 100% funded',                                   dot: '#d97706', pct: 100,                                 ok: true },
//     ];
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
//                         <Typography sx={{ fontSize: '0.67rem', color: g.ok ? GREEN : AMBER, ml: 2, mt: 0.3, fontWeight: 500 }}>
//                             {g.ok ? 'On track' : 'At risk'}
//                         </Typography>
//                     </Box>
//                 ))}
//                 <Box sx={{ mt: 1.25, pt: 1, borderTop: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                     <Box sx={{ width: '100%', py: 0.625, borderRadius: '6px', border: `0.5px dashed ${alpha('#000', 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
//                         <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>+ Add goal</Typography>
//                     </Box>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── BalanceTrajectoryCard ─────────────────────────────────────────────────────
// const BalanceTrajectoryCard: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const trajectory = useMemo(() => {
//         const salRow = template.rows.find(r => r.rowType === 'salary');
//         const expRow = template.rows.find(r => r.rowType === 'expenses');
//         let running  = 0;
//         return template.periods.map((label, pi) => {
//             running += (salRow?.values[pi] ?? 0) - (expRow?.values[pi] ?? 0);
//             return { label, bal: Math.round(running), type: getPeriodType(template, pi) };
//         });
//     }, [template]);
//
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
//                 {rows.length === 0
//                     ? <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>No period data yet.</Typography>
//                     : rows.map(t => (
//                         <Box key={t.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                 <Typography sx={{ fontSize: '0.75rem', color: t.type === 'past' ? SLATE : NAVY }}>{t.label}</Typography>
//                                 {t.type === 'future-auto' && <Typography sx={{ fontSize: '0.62rem', color: '#639922', fontWeight: 500 }}>pred</Typography>}
//                                 {t.type === 'past' && <Typography sx={{ fontSize: '0.62rem', color: SLATE, opacity: 0.6 }}>actual</Typography>}
//                             </Box>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: t.bal >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>{fmtC(t.bal)}</Typography>
//                                 <Typography sx={{ fontSize: '0.67rem', color: SLATE, minWidth: 55, textAlign: 'right' }}>
//                                     {t.type === 'past' ? 'actual' : t.type === 'future-auto' ? 'est' : 'projected'}
//                                 </Typography>
//                             </Box>
//                         </Box>
//                     ))
//                 }
//                 {endBal && rows.length > 0 && endBal.label !== rows[rows.length - 1]?.label && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.875, mt: 0.25 }}>
//                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY }}>End of plan</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: endBal.bal >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>{fmtC(endBal.bal)}</Typography>
//                             <Typography sx={{ fontSize: '0.67rem', color: SLATE, minWidth: 55, textAlign: 'right' }}>end of plan</Typography>
//                         </Box>
//                     </Box>
//                 )}
//                 <Box sx={{ mt: 1.25, py: 0.625, borderRadius: '6px', border: `0.5px solid ${alpha('#000', 0.15)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.03) } }}>
//                     <Typography sx={{ fontSize: '0.75rem', color: NAVY }}>Run a scenario ↗</Typography>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── SpendingSignalsCard ───────────────────────────────────────────────────────
// const SpendingSignalsCard: React.FC<{ template: SpreadsheetTemplate; selectedPi: number }> = ({ template, selectedPi }) => {
//     const signals = useMemo(() => {
//         const out: { label: string; msg: string }[] = [];
//         template.rows.filter(r => r.rowType === 'expense').forEach(row => {
//             const actual = row.values[selectedPi] ?? null;
//             if (!actual) return;
//             const pastVals = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && !isPeriodFuture(template, i) && i !== selectedPi).map(({ v }) => v as number);
//             if (!pastVals.length) return;
//             const avg = pastVals.reduce((a, b) => a + b, 0) / pastVals.length;
//             if (actual > avg * 1.15) out.push({ label: row.label, msg: `is $${Math.round(actual - avg * 1.15)} over the avg +15% cap of $${Math.round(avg * 1.15)}.` });
//         });
//         return out.slice(0, 4);
//     }, [template, selectedPi]);
//
//     if (!signals.length) return null;
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
//                         <Typography sx={{ fontSize: '0.75rem', color: NAVY, lineHeight: 1.4 }}><strong>{s.label}</strong> {s.msg}</Typography>
//                     </Box>
//                 ))}
//             </Box>
//         </Box>
//     );
// };
//
// // ════════════════════════════════════════════════════════════════════════════════
// // ── WhatIfScenario ────────────────────────────────────────────────────────────
// // ════════════════════════════════════════════════════════════════════════════════
//
// interface ScenarioCut { label: string; color: string; base: number; min: number; max: number }
//
// const WhatIfScenario: React.FC<{ template: SpreadsheetTemplate }> = ({ template }) => {
//     const expenseRows = template.rows.filter(r => r.rowType === 'expense');
//     const salaryRow   = template.rows.find(r => r.rowType === 'salary');
//
//     const baselineIncome: number[] = template.periods.map((_, pi) => salaryRow?.values[pi] ?? 0);
//     const baselineExp:    number[] = template.periods.map((_, pi) =>
//         expenseRows.reduce((s, r) => s + (r.values[pi] ?? 0), 0)
//     );
//
//     const baselineBals: number[] = useMemo(() => {
//         let run = 0;
//         return template.periods.map((_, pi) => { run += baselineIncome[pi] - baselineExp[pi]; return run; });
//     }, [template]);
//
//     const categories: ScenarioCut[] = useMemo(() =>
//             expenseRows.map(row => {
//                 const vals  = row.values.filter((v): v is number => v !== null && v > 0);
//                 const avg   = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
//                 const color = CAT_COLORS[row.label] ?? SLATE;
//                 return { label: row.label, color, base: avg, min: 0, max: Math.round(avg * 1.6) };
//             }).filter(c => c.base > 0),
//         [expenseRows]);
//
//     const [cuts, setCuts] = useState<Record<string, number>>(() =>
//         Object.fromEntries(categories.map(c => [c.label, c.base]))
//     );
//     const [applyFrom, setApplyFrom] = useState<number>(() => {
//         const pi = template.periods.findIndex((_, i) => isPeriodPresent(template, i));
//         return pi >= 0 ? pi : 0;
//     });
//     const [activePreset, setActivePreset] = useState<string | null>(null);
//
//     const PRESETS = [
//         { id: 'aggressive', label: 'Aggressive cuts', factor: 0.65 },
//         { id: 'moderate',   label: 'Moderate cuts',   factor: 0.80 },
//         { id: 'goal',       label: 'Goal-focused',    factor: 0.90 },
//     ];
//     const applyPreset = (factor: number, id: string) => {
//         setActivePreset(id);
//         setCuts(Object.fromEntries(categories.map(c => [c.label, Math.round(c.base * factor)])));
//     };
//     const resetAll = () => {
//         setActivePreset(null);
//         setCuts(Object.fromEntries(categories.map(c => [c.label, c.base])));
//     };
//
//     const { scenarioBals, savedPerPeriod, cumulativeExtra } = useMemo(() => {
//         const spp = categories.reduce((sum, c) => sum + (c.base - (cuts[c.label] ?? c.base)), 0);
//         let run   = 0;
//         const bals = template.periods.map((_, pi) => {
//             const extra = pi >= applyFrom ? spp : 0;
//             run += baselineIncome[pi] - baselineExp[pi] + extra;
//             return run;
//         });
//         const cum = spp * Math.max(0, template.periods.length - applyFrom);
//         return { scenarioBals: bals, savedPerPeriod: spp, cumulativeExtra: cum };
//     }, [cuts, applyFrom, categories, baselineIncome, baselineExp, template.periods.length]);
//
//     const totalInc   = baselineIncome.reduce((a, b) => a + b, 0);
//     const baseRate   = totalInc > 0 ? ((totalInc - baselineExp.reduce((a, b) => a + b, 0)) / totalInc) * 100 : 0;
//     const scenRate   = totalInc > 0 ? baseRate + (savedPerPeriod / totalInc) * template.periods.length * 100 : 0;
//     const endBal     = baselineBals[baselineBals.length - 1] ?? 0;
//     const endScenBal = scenarioBals[scenarioBals.length - 1] ?? 0;
//
//     const W = 560, H = 180;
//     const PAD = { t: 16, r: 16, b: 32, l: 52 };
//     const CW  = W - PAD.l - PAD.r;
//     const CH  = H - PAD.t - PAD.b;
//     const n   = template.periods.length;
//
//     const allVals = [...baselineBals, ...scenarioBals];
//     const minV    = Math.min(...allVals, 0);
//     const maxV    = Math.max(...allVals, 1);
//     const range   = maxV - minV || 1;
//
//     const px = (i: number) => PAD.l + (i / Math.max(n - 1, 1)) * CW;
//     const py = (v: number) => PAD.t + CH - ((v - minV) / range) * CH;
//
//     const basePts = baselineBals.map((v, i) => ({ x: px(i), y: py(v) }));
//     const scenPts = scenarioBals.map((v, i) => ({ x: px(i), y: py(v) }));
//
//     const areaD = scenPts.length >= 2
//         ? `${smoothPath(scenPts)} L ${scenPts[scenPts.length - 1].x},${py(minV)} L ${scenPts[0].x},${py(minV)} Z`
//         : '';
//
//     const tickStep = range > 3000 ? 1000 : range > 1000 ? 500 : range > 400 ? 200 : 100;
//     const ticks: number[] = [];
//     for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV; v += tickStep) ticks.push(v);
//
//     const goalsData = useMemo(() => {
//         const salTotal     = baselineIncome.reduce((a, b) => a + b, 0);
//         const expTotal     = baselineExp.reduce((a, b) => a + b, 0);
//         const baseNetSaved = salTotal - expTotal;
//         return [
//             { label: 'Savings floor — $500/period',    dot: GREEN, basePct: Math.min(100, Math.round((baseNetSaved / Math.max(template.periods.length, 1) / 500) * 100)), scenPct: Math.min(100, Math.round(((baseNetSaved + cumulativeExtra) / Math.max(template.periods.length, 1) / 500) * 100)) },
//             { label: 'Car repair fund — $1,200 by Apr', dot: BLUE,  basePct: 30,  scenPct: Math.min(100, 30  + Math.round(cumulativeExtra * 0.025)) },
//             { label: 'Trip deposit — $800 by May',      dot: AMBER, basePct: 10,  scenPct: Math.min(100, 10  + Math.round(cumulativeExtra * 0.015)) },
//         ];
//     }, [baselineIncome, baselineExp, cumulativeExtra, template.periods.length]);
//
//     return (
//         <Box>
//             <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, borderRadius: '8px', px: 2, py: 1.375, mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
//                 <Box>
//                     <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>What-if scenario explorer</Typography>
//                     <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>Drag sliders to cut category spending · see live impact on balance and goals</Typography>
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
//                     {PRESETS.map(p => (
//                         <Box key={p.id} onClick={() => applyPreset(p.factor, p.id)} sx={{ px: 1.25, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: `1px solid ${activePreset === p.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)'}`, bgcolor: activePreset === p.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.71rem', fontWeight: 600, transition: 'all .15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, userSelect: 'none' }}>
//                             {p.label}
//                         </Box>
//                     ))}
//                     <Box onClick={resetAll} sx={{ px: 1.25, py: 0.4, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: '0.71rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, userSelect: 'none' }}>Reset</Box>
//                 </Box>
//             </Box>
//
//             <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.25, mb: 2.5 }}>
//                 {[
//                     { label: 'End balance — baseline', baseline: fmtC(endBal),     val: fmtC(endScenBal),                                       color: endScenBal >= 0 ? GREEN : RED,                             sub: savedPerPeriod === 0 ? 'no change yet' : `vs ${fmtC(endBal)} baseline` },
//                     { label: 'Extra saved total',       baseline: '$0',              val: cumulativeExtra > 0 ? `+${fmtC(cumulativeExtra)}` : '$0', color: cumulativeExtra > 0 ? GREEN : NAVY,                        sub: `across ${template.periods.length - applyFrom} periods` },
//                     { label: 'Savings rate',            baseline: `${baseRate.toFixed(1)}%`, val: `${scenRate.toFixed(1)}%`,                      color: scenRate >= 10 ? GREEN : scenRate >= 0 ? AMBER : RED,      sub: scenRate >= 10 ? 'on target' : 'below 10% target' },
//                     { label: 'Goals unlocked',          baseline: `${goalsData.filter(g => g.basePct >= 90).length} of 3`, val: `${goalsData.filter(g => g.scenPct >= 90).length} of 3`, color: goalsData.filter(g => g.scenPct >= 90).length === 3 ? GREEN : RED, sub: goalsData.filter(g => g.scenPct >= 90).length < 3 ? 'car fund at risk' : 'all goals funded' },
//                 ].map((k, i) => (
//                     <Box key={i} sx={{ bgcolor: '#fff', borderRadius: '8px', px: 1.5, py: 1.125, border: `0.5px solid ${alpha('#000', 0.09)}`, boxShadow: `0 1px 6px ${alpha('#000', 0.04)}` }}>
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE, mb: 0.25 }}>{k.label}</Typography>
//                         <Typography sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.55), textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{k.baseline}</Typography>
//                         <Typography sx={{ fontSize: '1.28rem', fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, transition: 'color .25s' }}>{k.val}</Typography>
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE, mt: 0.2 }}>{k.sub}</Typography>
//                     </Box>
//                 ))}
//             </Box>
//
//             <Grid container spacing={2.5} alignItems="flex-start">
//                 <Grid item xs={12} md={4}>
//                     <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, overflow: 'hidden' }}>
//                         <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                             <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Spending cuts per period</Typography>
//                         </Box>
//                         <Box sx={{ px: 1.75, pt: 1.375, pb: 0.875, borderBottom: `0.5px solid ${alpha('#000', 0.06)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <Typography sx={{ fontSize: '0.75rem', color: SLATE, whiteSpace: 'nowrap' }}>Apply from:</Typography>
//                             <Box component="select" value={applyFrom} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setApplyFrom(Number(e.target.value))} sx={{ flex: 1, border: `1px solid ${alpha('#000', 0.14)}`, borderRadius: '5px', px: 0.875, py: 0.375, fontSize: '0.75rem', color: NAVY, bgcolor: '#fff', cursor: 'pointer', fontFamily: 'inherit', '&:focus': { outline: `1.5px solid ${MAROON}`, outlineOffset: '1px' } }}>
//                                 {template.periods.map((p, i) => <option key={i} value={i}>{p}</option>)}
//                             </Box>
//                         </Box>
//                         <Box sx={{ px: 1.75, py: 1.25, maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'thin' }}>
//                             {categories.map(cat => {
//                                 const val     = cuts[cat.label] ?? cat.base;
//                                 const delta   = val - cat.base;
//                                 const pctFill = ((val - cat.min) / Math.max(cat.max - cat.min, 1)) * 100;
//                                 return (
//                                     <Box key={cat.label} sx={{ mb: 1.75, '&:last-child': { mb: 0 } }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                 <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: cat.color, flexShrink: 0 }} />
//                                                 <Typography sx={{ fontSize: '0.79rem', fontWeight: 500, color: NAVY }}>{cat.label}</Typography>
//                                             </Box>
//                                             <Box sx={{ textAlign: 'right' }}>
//                                                 <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: delta < 0 ? GREEN : delta > 0 ? RED : NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                                     ${fmtS(val)}<Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 400, color: SLATE }}> / period</Typography>
//                                                 </Typography>
//                                                 <Typography sx={{ fontSize: '0.67rem', color: delta < 0 ? GREEN : delta > 0 ? RED : SLATE, fontWeight: delta !== 0 ? 600 : 400 }}>
//                                                     {delta !== 0 ? `${delta > 0 ? '+' : '-'}$${fmtS(Math.abs(delta))} vs baseline` : 'no change'}
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                         <Box sx={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
//                                             <Box sx={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.08) }} />
//                                             <Box sx={{ position: 'absolute', left: 0, width: `${pctFill}%`, height: 4, borderRadius: 2, bgcolor: delta < 0 ? GREEN : delta > 0 ? RED : alpha(NAVY, 0.3), transition: 'width .1s, background-color .2s' }} />
//                                             <Box sx={{ position: 'absolute', left: `${((cat.base - cat.min) / Math.max(cat.max - cat.min, 1)) * 100}%`, width: 2, height: 10, bgcolor: alpha(NAVY, 0.25), borderRadius: 1, transform: 'translateX(-50%)' }} />
//                                             <Box component="input" type="range" min={cat.min} max={cat.max} step={5} value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setActivePreset(null); setCuts(p => ({ ...p, [cat.label]: Number(e.target.value) })); }} sx={{ position: 'absolute', left: 0, right: 0, width: '100%', m: 0, appearance: 'none', bgcolor: 'transparent', cursor: 'pointer', zIndex: 1, height: 20, '&::-webkit-slider-thumb': { appearance: 'none', width: 16, height: 16, borderRadius: '50%', bgcolor: MAROON, border: '2.5px solid #fff', boxShadow: `0 1px 5px ${alpha(MAROON, 0.4)}`, cursor: 'pointer', mt: '-6px' }, '&::-webkit-slider-runnable-track': { height: 4, background: 'transparent' }, '&:focus': { outline: 'none' } }} />
//                                         </Box>
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
//                                             <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>${fmtS(cat.min)}</Typography>
//                                             <Typography sx={{ fontSize: '0.6rem', color: SLATE }}>${fmtS(cat.max)}</Typography>
//                                         </Box>
//                                     </Box>
//                                 );
//                             })}
//                         </Box>
//                         <Box sx={{ px: 1.75, py: 1.125, borderTop: `0.5px solid ${alpha('#000', 0.07)}`, bgcolor: savedPerPeriod > 0 ? alpha(GREEN, 0.04) : alpha('#000', 0.02) }}>
//                             {[
//                                 { label: 'Total saved per period', val: savedPerPeriod > 0 ? `+$${fmtS(savedPerPeriod)}` : '$0', color: savedPerPeriod > 0 ? GREEN : NAVY },
//                                 { label: `Cumulative extra by ${template.periods[template.periods.length - 1] ?? 'end'}`, val: cumulativeExtra > 0 ? `+$${fmtS(cumulativeExtra)}` : '$0', color: cumulativeExtra > 0 ? GREEN : NAVY },
//                             ].map(row => (
//                                 <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.25 }}>
//                                     <Typography sx={{ fontSize: '0.73rem', color: SLATE }}>{row.label}</Typography>
//                                     <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums', transition: 'color .25s' }}>{row.val}</Typography>
//                                 </Box>
//                             ))}
//                         </Box>
//                     </Box>
//                 </Grid>
//
//                 <Grid item xs={12} md={8}>
//                     <Stack spacing={2}>
//                         <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, overflow: 'hidden' }}>
//                             <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.07)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance trajectory</Typography>
//                                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                                     {[{ stroke: alpha('#000', 0.25), dash: '', label: 'Baseline' }, { stroke: GREEN, dash: '', label: 'Scenario' }, { stroke: alpha(AMBER, 0.6), dash: '4 3', label: 'Balance floor' }].map(l => (
//                                         <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                             <Box component="svg" width={18} height={8}><line x1="0" y1="4" x2="18" y2="4" stroke={l.stroke} strokeWidth="2" strokeDasharray={l.dash} strokeLinecap="round" /></Box>
//                                             <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>{l.label}</Typography>
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                             <Box sx={{ px: 1.5, py: 1.5 }}>
//                                 <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: '100%', height: 'auto', overflow: 'visible' }}>
//                                     <defs>
//                                         <linearGradient id="scen-fill" x1="0" y1="0" x2="0" y2="1">
//                                             <stop offset="0%" stopColor={GREEN} stopOpacity="0.15" />
//                                             <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
//                                         </linearGradient>
//                                     </defs>
//                                     {ticks.map(v => <line key={v} x1={PAD.l} y1={py(v)} x2={PAD.l + CW} y2={py(v)} stroke={alpha('#000', 0.05)} strokeWidth="1" />)}
//                                     {ticks.map(v => <text key={v} x={PAD.l - 6} y={py(v) + 4} textAnchor="end" fontSize="10" fill={SLATE}>{v < 0 ? `-$${fmtS(Math.abs(v))}` : `$${fmtS(v)}`}</text>)}
//                                     {template.periods.map((p, i) => <text key={i} x={px(i)} y={PAD.t + CH + 18} textAnchor="middle" fontSize="10" fill={isPeriodPresent(template, i) ? MAROON : SLATE} fontWeight={isPeriodPresent(template, i) ? '700' : '400'}>{p}</text>)}
//                                     {minV < 0 && maxV > 0 && <line x1={PAD.l} y1={py(0)} x2={PAD.l + CW} y2={py(0)} stroke={alpha('#000', 0.12)} strokeWidth="1" strokeDasharray="3 3" />}
//                                     {py(500) > PAD.t && py(500) < PAD.t + CH && <line x1={PAD.l} y1={py(500)} x2={PAD.l + CW} y2={py(500)} stroke={alpha(AMBER, 0.55)} strokeWidth="1.5" strokeDasharray="5 3" />}
//                                     {areaD && <path d={areaD} fill="url(#scen-fill)" />}
//                                     <path d={smoothPath(basePts)} fill="none" stroke={alpha('#000', 0.22)} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
//                                     <path d={smoothPath(scenPts)} fill="none" stroke={GREEN} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
//                                     {scenarioBals.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="3.5" fill={v >= 0 ? GREEN : RED} stroke="#fff" strokeWidth="1.5" />)}
//                                 </Box>
//                             </Box>
//                         </Box>
//
//                         <Box sx={{ bgcolor: '#fff', borderRadius: '10px', border: `0.5px solid ${alpha('#000', 0.09)}`, overflow: 'hidden' }}>
//                             <Box sx={{ px: 1.75, py: 1.125, borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Goal impact</Typography>
//                             </Box>
//                             <Box sx={{ px: 1.75, py: 1.375 }}>
//                                 {goalsData.map(g => {
//                                     const improved = g.scenPct > g.basePct;
//                                     const barColor = g.scenPct >= 90 ? GREEN : improved ? BLUE : AMBER;
//                                     const needMore = g.scenPct < 100 && cumulativeExtra > 0;
//                                     return (
//                                         <Box key={g.label} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.625 }}>
//                                                 <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.dot, flexShrink: 0 }} />
//                                                 <Typography sx={{ fontSize: '0.77rem', fontWeight: 600, color: NAVY }}>{g.label}</Typography>
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
//                                                 <Typography sx={{ fontSize: '0.65rem', color: SLATE, minWidth: 52 }}>Baseline</Typography>
//                                                 <Box sx={{ flex: 1, height: 6, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
//                                                     <Box sx={{ width: `${g.basePct}%`, height: '100%', bgcolor: alpha('#000', 0.2), borderRadius: '3px' }} />
//                                                 </Box>
//                                                 <Typography sx={{ fontSize: '0.65rem', color: SLATE, minWidth: 28, textAlign: 'right' }}>{g.basePct}%</Typography>
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: needMore ? 0.625 : 0 }}>
//                                                 <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: NAVY, minWidth: 52 }}>Scenario</Typography>
//                                                 <Box sx={{ flex: 1, height: 6, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden' }}>
//                                                     <Box sx={{ width: `${g.scenPct}%`, height: '100%', bgcolor: barColor, borderRadius: '3px', transition: 'width 0.3s ease, background-color 0.25s' }} />
//                                                 </Box>
//                                                 <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: barColor, minWidth: 28, textAlign: 'right', transition: 'color .25s' }}>{Math.round(g.scenPct)}%</Typography>
//                                             </Box>
//                                             {needMore && (
//                                                 <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.875, py: '2px', borderRadius: '4px', bgcolor: alpha(AMBER, 0.1), border: `1px solid ${alpha(AMBER, 0.28)}` }}>
//                                                     <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: AMBER }}>Need ${fmtS(Math.round((100 - g.scenPct) * 12))} more</Typography>
//                                                 </Box>
//                                             )}
//                                         </Box>
//                                     );
//                                 })}
//                                 {savedPerPeriod === 0 ? (
//                                     <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '7px', bgcolor: '#fdf8f8', border: `1px solid ${alpha(MAROON, 0.1)}` }}>
//                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY, mb: 0.375 }}>Move the sliders to explore your scenario</Typography>
//                                         <Typography sx={{ fontSize: '0.71rem', color: SLATE, lineHeight: 1.5 }}>No cuts applied yet. Adjust any category to see live impact on goals and balance.</Typography>
//                                     </Box>
//                                 ) : (
//                                     <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '7px', bgcolor: alpha(GREEN, 0.05), border: `1px solid ${alpha(GREEN, 0.18)}` }}>
//                                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: GREEN, mb: 0.375 }}>Saving +${fmtS(savedPerPeriod)}/period from {template.periods[applyFrom]}</Typography>
//                                         <Typography sx={{ fontSize: '0.71rem', color: SLATE, lineHeight: 1.5 }}>
//                                             {goalsData.filter(g => g.scenPct >= 90).length === 3
//                                                 ? '✓ All 3 goals fully covered with this scenario.'
//                                                 : `${goalsData.filter(g => g.scenPct >= 90).length} of 3 goals covered — cut a bit more to unlock the rest.`}
//                                         </Typography>
//                                     </Box>
//                                 )}
//                             </Box>
//                         </Box>
//                     </Stack>
//                 </Grid>
//             </Grid>
//
//             <Box sx={{ mt: 2.5 }}>
//                 <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Period-by-period comparison</Typography>
//                 <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.12)}`, boxShadow: `0 1px 8px ${alpha(MAROON, 0.05)}` }}>
//                     <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none' } }}>
//                         <TableHead>
//                             <TableRow sx={{ bgcolor: '#fdf8f8' }}>
//                                 {['Period', 'Baseline bal', '', 'Scenario bal', 'Gain'].map((h, i) => (
//                                     <TableCell key={i} align={i === 0 ? 'left' : 'right'} sx={{ fontWeight: 600, color: MAROON, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.125, px: 1.75, borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}` }}>{h}</TableCell>
//                                 ))}
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {template.periods.map((p, i) => {
//                                 const bb   = baselineBals[i] ?? 0;
//                                 const sb   = scenarioBals[i] ?? 0;
//                                 const gain = sb - bb;
//                                 const isP  = isPeriodPresent(template, i);
//                                 return (
//                                     <TableRow key={i} sx={{ bgcolor: isP ? alpha(MAROON, 0.02) : i % 2 === 0 ? '#fff' : '#fafbfc', '&:hover': { bgcolor: alpha(MAROON, 0.025) } }}>
//                                         <TableCell sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', color: isP ? MAROON : NAVY, fontWeight: isP ? 700 : 400, borderBottom: `0.5px solid ${alpha('#000', 0.04)}` }}>
//                                             {p}{isP && <Box component="span" sx={{ ml: 0.75, fontSize: '0.6rem', px: 0.625, py: 0.1, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), color: MAROON, fontWeight: 700 }}>now</Box>}
//                                         </TableCell>
//                                         <TableCell align="right" sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', color: bb >= 0 ? NAVY : RED, fontVariantNumeric: 'tabular-nums', borderBottom: `0.5px solid ${alpha('#000', 0.04)}` }}>{fmtC(bb)}</TableCell>
//                                         <TableCell align="right" sx={{ py: 0.875, px: 0.5, fontSize: '0.65rem', color: gain > 0 ? GREEN : SLATE, borderBottom: `0.5px solid ${alpha('#000', 0.04)}` }}>{gain > 0 ? '▶' : ''}</TableCell>
//                                         <TableCell align="right" sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', fontWeight: gain !== 0 ? 600 : 400, color: sb >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums', borderBottom: `0.5px solid ${alpha('#000', 0.04)}`, transition: 'color .2s' }}>{fmtC(sb)}</TableCell>
//                                         <TableCell align="right" sx={{ py: 0.875, px: 1.75, fontSize: '0.77rem', fontWeight: 600, color: gain > 0 ? GREEN : gain < 0 ? RED : alpha(SLATE, 0.4), fontVariantNumeric: 'tabular-nums', borderBottom: `0.5px solid ${alpha('#000', 0.04)}`, transition: 'color .2s' }}>{gain > 0 ? `+${fmtC(gain)}` : gain < 0 ? fmtC(gain) : '—'}</TableCell>
//                                     </TableRow>
//                                 );
//                             })}
//                         </TableBody>
//                     </Table>
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ════════════════════════════════════════════════════════════════════════════════
// // ── PlanningView ──────────────────────────────────────════════════════════════
// // ════════════════════════════════════════════════════════════════════════════════
//
// interface Props {
//     template:        SpreadsheetTemplate;
//     periodFilter:    PeriodFilter;
//     onPeriodFilter:  (p: PeriodFilter) => void;
//     onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
//     onSaveTemplate?: () => void;
// }
//
// const PlanningView: React.FC<Props> = ({ template, periodFilter, onPeriodFilter, onCellChange, onSaveTemplate }) => {
//     const [subView,           setSubView]           = useState<SubViewMode>('dashboard');
//     const [mode,              setMode]              = useState<'manual' | 'auto'>('auto');
//     const [categoryTargets,   setCategoryTargets]   = useState<CategoryTargets>({});
//     const [monthItems,        setMonthItems]        = useState<MonthItemMap>({});
//     const [addTarget,         setAddTarget]         = useState<string | null>(null);
//     const [futurePeriodOpen,  setFuturePeriodOpen]  = useState(false);
//
//     const defaultPeriod = useMemo(() => {
//         const pi = template.periods.findIndex((_, pi) => isPeriodPresent(template, pi));
//         if (pi >= 0) return pi;
//         return template.periods.reduce((last, _, pi) => !isPeriodFuture(template, pi) ? pi : last, 0);
//     }, [template]);
//
//     const [selectedPeriod, setSelectedPeriod] = useState<number>(defaultPeriod);
//
//     const handleAddItem = (monthName: string, item: MonthItem) => {
//         setMonthItems(prev => ({ ...prev, [monthName]: [...(prev[monthName] ?? []), item] }));
//     };
//
//     const handleUpdateItem = (monthName: string, id: string, status: ItemStatus) => {
//         setMonthItems(prev => ({
//             ...prev,
//             [monthName]: (prev[monthName] ?? []).map(it => it.id === id ? { ...it, status } : it),
//         }));
//     };
//
//     const handleSetTarget = useCallback((pi: number, label: string, value: number | null) => {
//         setCategoryTargets(prev => {
//             const key = `${pi}-${label}`;
//             if (value === null) { const { [key]: _, ...rest } = prev; return rest; }
//             return { ...prev, [key]: value };
//         });
//     }, []);
//
//     const handleFuturePeriodApply = useCallback(
//         (periodIndex: number, values: Record<string, number | null>) => {
//             template.rows.forEach((row, ri) => {
//                 if (row.label in values) onCellChange(ri, periodIndex, values[row.label]);
//             });
//         },
//         [template.rows, onCellChange],
//     );
//
//     const totalSalary   = template.rows.find(r => r.label === 'Salary')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const totalExpenses = template.rows.find(r => r.rowType === 'expenses')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const savingsRate   = totalSalary > 0 ? ((totalSalary - totalExpenses) / totalSalary) * 100 : 0;
//     const overBudgetPct = totalSalary > 0 ? (totalExpenses / totalSalary) * 100 : 0;
//     const finalBalance  = template.rows.find(r => r.rowType === 'balance')?.values.filter((v): v is number => v !== null).slice(-1)[0] ?? 0;
//     const n             = template.periods.length || 1;
//     const hasOverride   = !!template.viewOverride;
//
//     const months = useMemo(() => {
//         return (template.months ?? []).map(m => {
//             const firstPi = m.cols[0];
//             const type    = getPeriodType(template, firstPi);
//             const salRow  = template.rows.find(r => r.rowType === 'salary');
//             const totalIn = m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0);
//             const sub     = totalIn > 0 ? `$${fmtS(totalIn)} in`
//                 : type === 'future-auto' ? 'auto-filled'
//                     : type === 'future-manual' ? `$${fmtS(m.cols.reduce((s, ci) => s + (salRow?.values[ci] ?? 0), 0))} est`
//                         : '';
//             return { name: m.name.replace(/ \d{4}/, ''), type, sub, cols: m.cols };
//         });
//     }, [template]);
//
//     // ── Dashboard content ─────────────────────────────────────────────────────
//     const dashboardContent = (
//         <Grid container spacing={2.5} alignItems="flex-start">
//             <Grid item xs={12} lg={7}>
//                 <Box sx={{ mb: 0.5 }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                         Timeline — click a period to inspect or edit
//                     </Typography>
//                     <Box sx={{ display: 'flex', gap: 0.625, mb: 0.25 }}>
//                         {months.map((m, i) => (
//                             <MonthChip key={i} name={m.name} type={m.type as any} sub={m.sub} selected={m.cols.includes(selectedPeriod)} onClick={() => setSelectedPeriod(m.cols[0])} items={monthItems[m.name] ?? []} onAdd={() => setAddTarget(m.name)} />
//                         ))}
//                     </Box>
//                     {(() => {
//                         const activeMth = months.find(m => m.cols.includes(selectedPeriod));
//                         if (!activeMth || activeMth.cols.length <= 1) return null;
//                         return (
//                             <Box sx={{ display: 'flex', gap: 0.375, mb: 0.375, pl: 0.25 }}>
//                                 {activeMth.cols.map(pi => {
//                                     const label  = template.periods[pi] ?? '';
//                                     const type   = getPeriodType(template, pi);
//                                     const isSel  = pi === selectedPeriod;
//                                     const BG_MAP = { past: '#f0f2f5', present: '#fff1f2', 'future-manual': '#E6F1FB', 'future-auto': '#EAF3DE' } as any;
//                                     const FG_MAP = { past: SLATE, present: MAROON, 'future-manual': '#0C447C', 'future-auto': '#27500A' } as any;
//                                     const BD_MAP = { past: alpha('#000', 0.1), present: alpha(MAROON, 0.35), 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as any;
//                                     return (
//                                         <Box key={pi} onClick={() => setSelectedPeriod(pi)} sx={{ px: 0.875, py: 0.35, borderRadius: '4px', cursor: 'pointer', bgcolor: isSel ? MAROON : BG_MAP[type], border: `0.5px solid ${isSel ? MAROON : BD_MAP[type]}`, '&:hover': { bgcolor: isSel ? MAROON : alpha(MAROON, 0.06) }, transition: 'background .12s' }}>
//                                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: isSel ? '#fff' : FG_MAP[type], whiteSpace: 'nowrap' }}>{label}</Typography>
//                                         </Box>
//                                     );
//                                 })}
//                             </Box>
//                         );
//                     })()}
//                     <PeriodBars template={template} />
//                     <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
//                         {[{ color: '#B4B2A9', label: 'Past actuals' }, { color: MAROON, label: 'Current' }, { color: '#85B7EB', label: 'Manually planned' }, { color: '#97C459', label: 'Auto-predicted' }].map(({ color, label }) => (
//                             <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                 <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
//                                 <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{label}</Typography>
//                             </Box>
//                         ))}
//                     </Box>
//                 </Box>
//                 {(() => {
//                     const activeMth = months.find(m => m.cols.includes(selectedPeriod));
//                     if (!activeMth) return null;
//                     return (
//                         <MonthDetailPanel
//                             monthName={activeMth.name}
//                             items={monthItems[activeMth.name] ?? []}
//                             onAddItem={() => setAddTarget(activeMth.name)}
//                             onUpdateItem={(id, status) => handleUpdateItem(activeMth.name, id, status)}
//                         />
//                     );
//                 })()}
//                 <PeriodDetailCard template={template} periodIndex={selectedPeriod} mode={mode} targets={categoryTargets} onSetTarget={handleSetTarget} />
//             </Grid>
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
//     return (
//         <Box>
//             <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(hasOverride ? BLUE : MAROON, 0.14)}`, boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`, mb: 3 }}>
//
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
//
//                         {/* ── Future period button — classic view only ── */}
//                         {subView === 'classic' && (
//                             <Button
//                                 size="small"
//                                 onClick={() => setFuturePeriodOpen(true)}
//                                 sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', gap: 0.5, px: 1.25, py: 0.4, border: '1px solid rgba(255,255,255,0.25)', color: '#fff', bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
//                             >
//                                 + Future period
//                             </Button>
//                         )}
//
//                         <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.2)' }} />
//                         <SubViewToggle active={subView} onChange={v => setSubView(v)} />
//                         <Button size="small" sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', px: 1.25, py: 0.4, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
//                             <Add sx={{ fontSize: '0.85rem' }} /> Add period
//                         </Button>
//                     </Box>
//                 </Box>
//
//                 {/* KPI strip */}
//                 <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                     {[
//                         { label: 'Avg income / period', val: `$${fmtS(totalSalary / n)}`,  sub: 'historical avg',  color: NAVY                            },
//                         { label: 'Avg spend / period',  val: `$${fmtS(totalExpenses / n)}`, sub: 'actuals only',    color: MAROON                          },
//                         { label: 'Projected balance',   val: `$${fmtS(finalBalance)}`,       sub: 'end of plan',     color: finalBalance >= 0 ? GREEN : RED  },
//                         { label: 'Goals on track',      val: '3 of 3',                        sub: 'all goals met',   color: GREEN                           },
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
//                     {subView === 'dashboard' && dashboardContent}
//                     {subView === 'classic'   && <ClassicSpreadsheet template={template} editMode={false} onCellChange={onCellChange} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter} />}
//                     {subView === 'scenario'  && <WhatIfScenario template={template} />}
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
//                                             <TableCell key={h} sx={{ fontWeight: 600, color: MAROON, fontSize: '0.69rem', textTransform: 'uppercase' as const, letterSpacing: '0.07em', py: 1.25, px: 2, borderBottom: `1.5px solid ${alpha(MAROON, 0.12)}` }}>{h}</TableCell>
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
//                                                 { v: `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}%`,                              c: savingsRate   >= 0 ? GREEN : RED },
//                                                 { v: `${overBudgetPct > 100 ? '+' : '–'}${Math.abs(overBudgetPct - 100).toFixed(1)}%`, c: overBudgetPct > 100 ? RED   : GREEN },
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
//
//             {/* Add item modal */}
//             {addTarget && (
//                 <AddItemModal
//                     monthName={addTarget}
//                     onClose={() => setAddTarget(null)}
//                     onAdd={item => { handleAddItem(addTarget, item); setAddTarget(null); }}
//                 />
//             )}
//
//             {/* Future period dialog — classic view only */}
//             {futurePeriodOpen && (
//                 <FuturePeriodDialog
//                     template={template}
//                     onClose={() => setFuturePeriodOpen(false)}
//                     onApply={handleFuturePeriodApply}
//                 />
//             )}
//         </Box>
//     );
// };
//
// export default PlanningView;
