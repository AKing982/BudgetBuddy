// ── RecurringSection.tsx ──────────────────────────────────────────────────────
// Recurring categories at the bottom of the page: Table (Layout A) or Grid (Layout B).
// Data: BudgetRunnerService budgetPeriodCategories where isRecurring is true.
import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import SegmentedToggle from './SegmentedToggle';
import { T, FONT_MONO, cardSx, money } from '../budgetTheme';
import type { RecurringCategory } from '../Types';

export type RecurringView = 'table' | 'grid';

interface Props {
    categories: RecurringCategory[];
    view: RecurringView;
    onViewChange: (v: RecurringView) => void;
    isLoading: boolean;
}

type Status = { label: string; bg: string; fg: string };

function statusOf(c: RecurringCategory): Status {
    if (c.budgeted > 0 && c.actual > c.budgeted * 1.05) return { label: 'Over budget', bg: T.dangerBg, fg: T.dangerText };
    if (c.budgeted > 0 && c.actual >= c.budgeted * 0.95) return { label: 'Paid', bg: T.successBg, fg: '#1A5E3A' };
    if (c.actual > 0) return { label: 'Partly paid', bg: T.warnBg, fg: T.warnText };
    return { label: 'Not paid yet', bg: T.subtle, fg: T.ink2 };
}

const Pill: React.FC<{ s: Status }> = ({ s }) => (
    <Box component="span" sx={{ display: 'inline-block', px: 1.25, py: 0.5, borderRadius: 999, fontSize: 12, fontWeight: 600, bgcolor: s.bg, color: s.fg }}>{s.label}</Box>
);

const RecurringSection: React.FC<Props> = ({ categories, view, onViewChange, isLoading }) => {
    const total = categories.reduce((t, c) => t + c.budgeted, 0);
    const paidCount = categories.filter(c => c.budgeted > 0 && c.actual >= c.budgeted * 0.95).length;
    const stillDue = categories.reduce((t, c) => t + Math.max(0, c.remaining), 0);

    return (
        <Box component="section" aria-labelledby="rec-h" sx={cardSx}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${T.borderSoft}` }}>
                <Box>
                    <Typography id="rec-h" component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>Recurring bills &amp; subscriptions</Typography>
                    <Typography sx={{ fontSize: 13, color: T.muted }}>
                        {categories.length} recurring · {money(total)} budgeted · {paidCount} paid, {money(stillDue)} still due
                    </Typography>
                </Box>
                <SegmentedToggle<RecurringView> label="Recurring layout" value={view} onChange={onViewChange}
                                                options={[{ value: 'table', label: 'Table' }, { value: 'grid', label: 'Grid' }]} />
            </Box>

            {isLoading ? (
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[0, 1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={40} />)}
                </Box>
            ) : categories.length === 0 ? (
                <Typography sx={{ p: 3, fontSize: 14, color: T.muted, textAlign: 'center' }}>No recurring categories for this month.</Typography>
            ) : view === 'table' ? (
                <Box sx={{ overflowX: 'auto' }}>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
                        <thead>
                        <Box component="tr" sx={{ textAlign: 'left', color: T.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <Box component="th" sx={{ px: 2.5, py: 1.25, fontWeight: 600 }}>Category</Box>
                            <Box component="th" sx={{ px: 1.5, py: 1.25, fontWeight: 600, textAlign: 'right' }}>Budgeted</Box>
                            <Box component="th" sx={{ px: 1.5, py: 1.25, fontWeight: 600, textAlign: 'right' }}>Paid so far</Box>
                            <Box component="th" sx={{ px: 1.5, py: 1.25, fontWeight: 600, textAlign: 'right' }}>Remaining</Box>
                            <Box component="th" sx={{ px: 2.5, py: 1.25, fontWeight: 600, textAlign: 'right' }}>Status</Box>
                        </Box>
                        </thead>
                        <tbody>
                        {categories.map(c => (
                            <Box component="tr" key={c.name} sx={{ borderTop: `1px solid ${T.subtle}` }}>
                                <Box component="td" sx={{ px: 2.5, py: 1.5, fontWeight: 600 }}>{c.name}</Box>
                                <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: 'right', fontFamily: FONT_MONO }}>{money(c.budgeted, 2)}</Box>
                                <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: 'right', fontFamily: FONT_MONO }}>{money(c.actual, 2)}</Box>
                                <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: 'right', fontFamily: FONT_MONO, color: c.remaining < 0 ? T.dangerText : T.text }}>
                                    {money(c.remaining, 2)}
                                </Box>
                                <Box component="td" sx={{ px: 2.5, py: 1.5, textAlign: 'right' }}><Pill s={statusOf(c)} /></Box>
                            </Box>
                        ))}
                        </tbody>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                    {categories.map(c => (
                        <Box key={c.name} sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${T.subtle}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box aria-hidden="true" sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: T.ground, color: T.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                                {c.name.charAt(0)}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{c.name}</Typography>
                                <Typography sx={{ fontSize: 12, color: T.muted }}>{statusOf(c).label} · {money(c.actual)} of {money(c.budgeted)}</Typography>
                            </Box>
                            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 13 }}>{money(c.budgeted)}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default RecurringSection;