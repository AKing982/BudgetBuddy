import React, { useMemo, useState } from 'react';
import { alpha, Box, IconButton, Typography } from '@mui/material';
import {
    LayoutGrid, PieChart, Wallet, CreditCard, ShieldCheck, PiggyBank, Target,
} from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { ENVELOPE_COLORS, ENVELOPE_TYPE_LABELS, MAROON } from '../config/Constants';
import { fmt } from '../config/Helpers';

type Period = 'weekly' | 'biweekly' | 'monthly';
type ViewMode = 'cards' | 'chart';

/**
 * Local icon-per-type map, same defensive pattern used in LinkedEnvelopeGroupCard's colorFor/
 * iconFor — kept local rather than pulled from Constants.TYPE_ICONS, which stores mixed/
 * rendered values that don't type-check as React.ElementType.
 */
const TYPE_ICON_MAP: Record<string, React.ElementType> = {
    SAVINGS:   Wallet,
    PAYOFF:    CreditCard,
    PURCHASE:  Target,
    EMERGENCY: ShieldCheck,
    FUND:      PiggyBank,
};
const iconFor  = (type: string): React.ElementType => TYPE_ICON_MAP[type] ?? Target;
const colorFor = (type: string) => ENVELOPE_COLORS[type as keyof typeof ENVELOPE_COLORS] ?? '#6b1a1a';
const labelFor = (type: string) => ENVELOPE_TYPE_LABELS?.[type as keyof typeof ENVELOPE_TYPE_LABELS] ?? type;

const BORDER   = '1px solid #ecd9d9';
const PANEL_BG = '#fdf7f7';
const SECTION_LABEL_SX = {
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c', mb: 1,
};

/**
 * Rolling windows anchored on "today" rather than the app's month navigator — weekly/biweekly
 * don't map onto a navigable calendar month the way the rest of the app's monthStart/monthEnd
 * does, so this panel keeps its own period logic rather than taking month props. "Monthly"
 * here means the current calendar month specifically, to stay a recognizable unit next to
 * "weekly"/"biweekly" rather than an arbitrary trailing-30-days window.
 */
function getPeriodRange(period: Period, today: Date): { start: Date; end: Date; label: string } {
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    if (period === 'weekly') {
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end, label: 'this week' };
    }
    if (period === 'biweekly') {
        const start = new Date(end);
        start.setDate(start.getDate() - 13);
        start.setHours(0, 0, 0, 0);
        return { start, end, label: 'these 2 weeks' };
    }
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    return { start, end: monthEnd, label: `in ${today.toLocaleDateString('en-US', { month: 'long' })}` };
}

interface CategoryTotal {
    type:  string;
    label: string;
    color: string;
    total: number;
    count: number;
}

interface EnvelopeSpendingSummaryProps {
    envelopes:     BudgetEnvelope[];
    contributions: EnvelopeContribution[];
    /** Optional reference date, mainly for testing/storybook — defaults to now. */
    today?: Date;
    /** Called when a category card or legend row is clicked, e.g. to filter the envelope list above. */
    onSelectCategory?: (envelopeType: string) => void;
}

const EnvelopeSpendingSummary: React.FC<EnvelopeSpendingSummaryProps> = ({
                                                                             envelopes, contributions, today = new Date(), onSelectCategory,
                                                                         }) => {
    const [period,   setPeriod]   = useState<Period>('monthly');
    const [viewMode, setViewMode] = useState<ViewMode>('cards');

    const { start, end, label: rangeLabel } = useMemo(() => getPeriodRange(period, today), [period, today]);

    const categories: CategoryTotal[] = useMemo(() => {
        const envById = new Map(envelopes.map(e => [e.id, e]));
        const totals = new Map<string, { total: number; count: number }>();

        contributions.forEach(c => {
            const contributedAt = new Date(c.contributedAt);
            if (contributedAt < start || contributedAt > end) return;
            const env = envById.get(c.envelopeId);
            if (!env) return;
            const current = totals.get(env.envelopeType) ?? { total: 0, count: 0 };
            current.total += c.amount;
            current.count += 1;
            totals.set(env.envelopeType, current);
        });

        return Array.from(totals.entries())
            .map(([type, { total, count }]) => ({ type, label: labelFor(type), color: colorFor(type), total, count }))
            .sort((a, b) => b.total - a.total);
    }, [envelopes, contributions, start, end]);

    const grandTotal = categories.reduce((s, c) => s + c.total, 0);

    // ── Donut chart geometry ────────────────────────────────────────────────
    const size = 96, strokeWidth = 18;
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    let cumulative = 0;
    const arcs = categories.map(c => {
        const fraction = grandTotal > 0 ? c.total / grandTotal : 0;
        const arc = { ...c, dash: fraction * circumference, offset: -cumulative * circumference };
        cumulative += fraction;
        return arc;
    });

    const periodOptions: { key: Period; label: string }[] = [
        { key: 'weekly',   label: 'Weekly' },
        { key: 'biweekly', label: 'Biweekly' },
        { key: 'monthly',  label: 'Monthly' },
    ];

    return (
        <Box sx={{ borderRadius: '12px', border: BORDER, bgcolor: PANEL_BG, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={SECTION_LABEL_SX} style={{ marginBottom: 0 }}>Spending by category</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, p: '3px', borderRadius: '8px', bgcolor: '#f5e5e5' }}>
                        {periodOptions.map(({ key, label: pLabel }) => (
                            <Box key={key} onClick={() => setPeriod(key)}
                                 sx={{ px: 1.25, py: 0.4, borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 500,
                                     ...(period === key
                                         ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                                         : { color: '#a35c5c' }) }}>
                                {pLabel}
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', border: BORDER, borderRadius: '6px', overflow: 'hidden' }}>
                        <IconButton size="small" aria-label="Card view" onClick={() => setViewMode('cards')}
                                    sx={{ borderRadius: 0, width: 28, height: 28,
                                        bgcolor: viewMode === 'cards' ? MAROON : '#fff',
                                        color: viewMode === 'cards' ? '#fff' : '#a35c5c',
                                        '&:hover': { bgcolor: viewMode === 'cards' ? MAROON : '#fbf1f1' } }}>
                            <LayoutGrid size={14} />
                        </IconButton>
                        <IconButton size="small" aria-label="Chart view" onClick={() => setViewMode('chart')}
                                    sx={{ borderRadius: 0, width: 28, height: 28,
                                        bgcolor: viewMode === 'chart' ? MAROON : '#fff',
                                        color: viewMode === 'chart' ? '#fff' : '#a35c5c',
                                        '&:hover': { bgcolor: viewMode === 'chart' ? MAROON : '#fbf1f1' } }}>
                            <PieChart size={14} />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {categories.length === 0 ? (
                <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 3 }}>
                    No contributions {rangeLabel}
                </Typography>
            ) : (
                <>
                    <Typography sx={{ fontSize: '0.72rem', color: '#999', mb: 1.5 }}>
                        {fmt(grandTotal)} total across {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} {rangeLabel}
                    </Typography>

                    {viewMode === 'cards' ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                            {categories.map(cat => {
                                const Icon = iconFor(cat.type);
                                return (
                                    <Box key={cat.type} onClick={() => onSelectCategory?.(cat.type)}
                                         sx={{ border: BORDER, borderRadius: '10px', p: 1.25, bgcolor: '#fff', cursor: onSelectCategory ? 'pointer' : 'default',
                                             '&:hover': onSelectCategory ? { borderColor: cat.color } : undefined }}>
                                        <Icon size={14} color={cat.color} />
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#111', mt: 0.6 }}>{fmt(cat.total)}</Typography>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#999', mt: 0.1 }}>
                                            {cat.label} · {cat.count} transaction{cat.count !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0dede" strokeWidth={strokeWidth} />
                                {arcs.map(arc => (
                                    <circle key={arc.type} cx={size / 2} cy={size / 2} r={r} fill="none"
                                            stroke={arc.color} strokeWidth={strokeWidth}
                                            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                                            strokeDashoffset={arc.offset}
                                            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
                                ))}
                                <text x={size / 2} y={size / 2 - 3} textAnchor="middle" fontSize="13" fontWeight={500} fill="#1a1a1a">
                                    {fmt(grandTotal)}
                                </text>
                                <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="9" fill="#999">total</text>
                            </svg>

                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {categories.map(cat => (
                                    <Box key={cat.type} onClick={() => onSelectCategory?.(cat.type)}
                                         sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: onSelectCategory ? 'pointer' : 'default' }}>
                                        <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: cat.color, flexShrink: 0 }} />
                                        <Typography sx={{ flex: 1, fontSize: '0.72rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {cat.label}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#1a1a1a' }}>{fmt(cat.total)}</Typography>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#999', width: 30, textAlign: 'right', flexShrink: 0 }}>
                                            {grandTotal > 0 ? `${((cat.total / grandTotal) * 100).toFixed(0)}%` : '0%'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default EnvelopeSpendingSummary;