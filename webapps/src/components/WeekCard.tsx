// ── WeekCard.tsx ──────────────────────────────────────────────────────────────
// One week of the month. Two faces the user flips between:
//   KPIs   — recurring payments + bucket summary (List) or category donut vs budget (Categories)
//   Bucket — that week's spending bucket: items, add, edit, limit, roll leftover
import React, { useState } from 'react';
import { Box, ButtonBase, Checkbox, CircularProgress, IconButton, InputBase, Typography } from '@mui/material';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import SegmentedToggle from './SegmentedToggle';
import { T, FONT_MONO, money, colorForCategory, eyebrowSx } from '../budgetTheme';
import type { WeekRange, CategoryAmount } from '../utils/BudgetWeeks';
import { sumSpending } from '../utils/BudgetWeeks';
import type { SpendingBucket, BucketItem, BucketItemPatch, RecurringPayment } from '../utils/BudgetPageTypes';
import { format } from 'date-fns';

export type WeekFace = 'kpi' | 'bucket';
export type KpiView = 'list' | 'chart';

interface Props {
    week: WeekRange;
    isCurrent: boolean;
    face: WeekFace;
    onFaceChange: (face: WeekFace) => void;
    kpiView: KpiView;
    payments: RecurringPayment[];   // recurring-category payments dated in this week
    spending: CategoryAmount[];
    budgets: Record<string, number>;
    weekBudget?: number;
    weekSpentOnRange?: number;
    bucket?: SpendingBucket;
    defaultBucketLimit: number;
    onCreateBucket: (week: WeekRange, limit: number) => Promise<void>;
    onAddItem: (bucket: SpendingBucket, name: string, amount: number) => Promise<void>;
    onUpdateItem: (item: BucketItem, patch: BucketItemPatch) => Promise<void>;
    onDeleteItem: (item: BucketItem) => Promise<void>;
    onUpdateLimit: (bucket: SpendingBucket, limit: number) => Promise<void>;
    onRollLeftover: (bucket: SpendingBucket) => Promise<void>;
}

const parseAmount = (s: string): number | null => {
    const n = parseFloat(s.replace(/[$,\s]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
};

const inputSx = {
    height: 36, px: 1, border: `1px solid ${T.inputBorder}`, borderRadius: '7px', fontSize: 13, color: T.text, fontFamily: 'inherit',
    '&.Mui-focused': { outline: `2px solid ${T.accent}`, outlineOffset: -1 },
} as const;

const linkBtnSx = { height: 32, px: 0.5, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: T.accent, borderRadius: '6px' } as const;

const Bar: React.FC<{ value: number; max: number; color: string; height?: number }> = ({ value, max, color, height = 6 }) => (
    <Box sx={{ height, borderRadius: height / 2, bgcolor: T.track }}>
        <Box sx={{ height, borderRadius: height / 2, width: `${max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0}%`, bgcolor: color }} />
    </Box>
);

const WeekCard: React.FC<Props> = (props) => {
    const { week, isCurrent, face, onFaceChange, kpiView, payments, spending, budgets, weekBudget, weekSpentOnRange, bucket, defaultBucketLimit } = props;

    const [busy, setBusy] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editingLimit, setEditingLimit] = useState(false);
    const [limitValue, setLimitValue] = useState('');

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try { await fn(); } finally { setBusy(false); }
    };

    const planned = bucket ? bucket.items.reduce((t: number, i: BucketItem) => t + i.amount, 0) : 0;
    const bought = bucket ? bucket.items.filter((i: BucketItem) => i.purchased).length : 0;
    const left = bucket ? bucket.limitAmount - planned : null;

    // const spent = sumSpending(spending);
    // const budgetTotal = Object.entries(budgets)
    //     .filter(([cat]) => spending.some(s => s.category === cat))
    //     .reduce((t, [, v]) => t + v, 0);
    const categorySpent = sumSpending(spending);
    const spent = Math.max(categorySpent, weekSpentOnRange ?? 0);
    const budgetTotal = weekBudget ?? Object.entries(budgets)
        .filter(([cat]) => spending.some(s => s.category === cat))
        .reduce((t, [, v]) => t + v, 0);
    const unboughtPlanned = bucket ? bucket.items.filter((i: BucketItem) => !i.purchased).reduce((t: number, i: BucketItem) => t + i.amount, 0) : 0;
    const safeToSpend: number | null = weekBudget != null ? weekBudget - spent - unboughtPlanned : left;
    const variance = budgetTotal - spent;

    let acc = 0;
    const stops = spending.map(s => {
        const from = (acc / (categorySpent || 1)) * 100; acc += s.amount;
        return `${colorForCategory(s.category)} ${from.toFixed(2)}% ${((acc / (spent || 1)) * 100).toFixed(2)}%`;
    });

    const billsTotal = payments.reduce((t, b) => t + b.amount, 0);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const addItem = () => {
        const amount = parseAmount(newAmount);
        if (!bucket || !newName.trim() || amount === null) return;
        run(async () => { await props.onAddItem(bucket, newName.trim(), amount); setNewName(''); setNewAmount(''); });
    };
    const startEdit = (item: BucketItem) => { setEditingId(item.id); setEditName(item.name); setEditAmount(String(item.amount)); };
    const saveEdit = (item: BucketItem) => {
        const amount = parseAmount(editAmount);
        if (!editName.trim() || amount === null) return;
        run(async () => { await props.onUpdateItem(item, { name: editName.trim(), amount }); setEditingId(null); });
    };
    const saveLimit = () => {
        const limit = parseAmount(limitValue);
        if (!bucket || limit === null) return;
        run(async () => { await props.onUpdateLimit(bucket, limit); setEditingLimit(false); });
    };

    return (
        <Box component="article" aria-label={`${week.title}, ${week.rangeLabel}`} sx={{
            bgcolor: T.surface, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0,
            border: isCurrent ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
        }}>
            {/* Header */}
            <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: `1px solid ${T.borderSoft}` }}>
                <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{week.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: T.muted }}>{week.rangeLabel}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {isCurrent && (
                        <Box sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: T.accentSoft, color: T.accent, fontSize: 12, fontWeight: 600 }}>This week</Box>
                    )}
                    <SegmentedToggle<WeekFace> size="sm" label={`${week.title} view`} value={face} onChange={onFaceChange}
                                               options={[{ value: 'kpi', label: 'KPIs' }, { value: 'bucket', label: 'Bucket' }]} />
                </Box>
            </Box>

            {/* KPIs · List */}
            {face === 'kpi' && kpiView === 'list' && (
                <>
                    <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Typography sx={eyebrowSx}>Recurring paid</Typography>
                        {payments.length === 0 ? (
                            <Typography sx={{ fontSize: 13, color: T.muted, minHeight: 30, display: 'flex', alignItems: 'center' }}>No recurring payments this week</Typography>
                        ) : payments.map(p => (
                            <Box key={p.category} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minHeight: 30 }}>
                                <Box aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: T.success }} />
                                <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                                    {p.category}{p.date && <Box component="span" sx={{ color: T.muted, fontSize: 12 }}> · {format(p.date, 'MMM d')}</Box>}
                                </Typography>
                                <Typography sx={{ fontFamily: FONT_MONO, fontSize: 13 }}>{money(p.amount)}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ mx: 2, mt: 1, pt: 1.5, borderTop: `1px dashed #DDD5D2`, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <Typography sx={eyebrowSx}>Spending bucket</Typography>
                            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: T.ink2 }}>
                                {bucket ? `${money(planned)} / ${money(bucket.limitAmount)}` : 'Not set up'}
                            </Typography>
                        </Box>
                        {bucket && <Bar value={planned} max={bucket.limitAmount} color={left !== null && left < 0 ? T.danger : T.accent} />}
                        <Typography sx={{ fontSize: 12, color: T.muted }}>
                            {bucket ? `${bucket.items.length} items · ${bought} bought` : 'Flip to Bucket to plan purchases'}
                        </Typography>
                    </Box>
                </>
            )}

            {/* KPIs · Categories */}
            {face === 'kpi' && kpiView === 'chart' && (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    {spending.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: T.muted, py: 4 }}>No spending recorded for this week yet.</Typography>
                    ) : (
                        <>
                            <Box role="img"
                                 aria-label={`${week.title} spending by category: ${spending.map(s => `${s.category} ${money(s.amount)}`).join(', ')}`}
                                 sx={{ position: 'relative', width: 132, height: 132, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${stops.join(', ')})` }}>
                                <Box sx={{ position: 'absolute', inset: '22px', borderRadius: '50%', bgcolor: T.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography sx={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 600 }}>{money(spent)}</Typography>
                                    <Typography sx={{ fontSize: 11, color: T.muted }}>of {money(budgetTotal)} budget</Typography>
                                </Box>
                            </Box>
                            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {spending.map(s => {
                                    const bud = budgets[s.category];
                                    const has = bud != null && bud > 0;
                                    const over = has && s.amount > bud;
                                    const color = colorForCategory(s.category);
                                    return (
                                        <Box component="li" key={s.category} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, minHeight: 22 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '3px', flexShrink: 0, bgcolor: color }} />
                                                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.category}</Box>
                                                <Box sx={{ fontFamily: FONT_MONO }}>{money(s.amount)}</Box>
                                                <Box sx={{ width: 76, textAlign: 'right', fontSize: 12, color: has ? T.muted : T.warnText }}>
                                                    {has ? `/ ${money(bud)}` : 'no budget'}
                                                </Box>
                                            </Box>
                                            <Box sx={{ ml: '18px' }}>
                                                <Bar value={has ? s.amount : 1} max={has ? bud : 1} height={4} color={!has ? T.warn : over ? T.danger : color} />
                                            </Box>
                                            {(over || !has) && (
                                                <Typography sx={{ ml: '18px', fontSize: 11, fontWeight: 600, color: has ? T.dangerText : T.warnText }}>
                                                    {has ? `${money(s.amount - bud)} over` : 'Unbudgeted — add a weekly limit'}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                            <Box sx={{
                                width: '100%', boxSizing: 'border-box', p: '8px 10px', borderRadius: '8px', fontSize: 13, fontWeight: 600,
                                bgcolor: variance >= 0 ? T.successBg : T.dangerBg, color: variance >= 0 ? '#1A5E3A' : T.dangerText,
                            }}>
                                {variance >= 0 ? `${money(variance)} under budget this week` : `${money(-variance)} over budget this week`}
                            </Box>
                        </>
                    )}
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.ink2, pt: 1, borderTop: `1px solid ${T.borderSoft}` }}>
                        <span>Recurring paid this week</span><Box component="span" sx={{ fontFamily: FONT_MONO }}>{money(billsTotal)}</Box>
                    </Box>
                </Box>
            )}

            {/* Bucket */}
            {face === 'bucket' && (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {!bucket ? (
                        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 13, color: T.muted }}>No spending bucket for {week.rangeLabel} yet.</Typography>
                            <ButtonBase disabled={busy} onClick={() => run(() => props.onCreateBucket(week, defaultBucketLimit))}
                                        sx={{ height: 36, px: 1.75, borderRadius: '8px', bgcolor: T.accent, color: '#FFF', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                                {busy ? <CircularProgress size={14} sx={{ color: '#FFF' }} /> : `Create bucket · ${money(defaultBucketLimit)} limit`}
                            </ButtonBase>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                <Typography sx={eyebrowSx}>Spending bucket</Typography>
                                {editingLimit ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <InputBase autoFocus value={limitValue} onChange={e => setLimitValue(e.target.value)}
                                                   inputProps={{ 'aria-label': 'Bucket limit', inputMode: 'decimal' }} sx={{ ...inputSx, width: 80, height: 30 }} />
                                        <IconButton size="small" aria-label="Save limit" onClick={saveLimit} sx={{ color: T.successText }}><Check size={15} /></IconButton>
                                        <IconButton size="small" aria-label="Cancel" onClick={() => setEditingLimit(false)} sx={{ color: T.muted }}><X size={15} /></IconButton>
                                    </Box>
                                ) : (
                                    <Typography sx={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600 }}>
                                        {money(planned)} <Box component="span" sx={{ color: T.muted, fontWeight: 500 }}>/ {money(bucket.limitAmount)}</Box>
                                    </Typography>
                                )}
                            </Box>
                            <Bar value={planned} max={bucket.limitAmount} height={8} color={left !== null && left < 0 ? T.danger : T.accent} />
                            <Typography sx={{ fontSize: 12, color: T.muted }}>
                                {left !== null && left >= 0 ? `${money(left)} left to plan this week` : `${money(-(left ?? 0))} over this week’s limit`}
                            </Typography>

                            {bucket.items.length > 0 && (
                                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, border: `1px solid ${T.borderSoft}`, borderRadius: '10px' }}>
                                    {bucket.items.map((item: BucketItem) => (
                                        <Box component="li" key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderBottom: `1px solid ${T.subtle}`, '&:last-of-type': { borderBottom: 0 } }}>
                                            {editingId === item.id ? (
                                                <>
                                                    <InputBase autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                                                               inputProps={{ 'aria-label': 'Item name' }} sx={{ ...inputSx, flex: 1, minWidth: 0, height: 32 }} />
                                                    <InputBase value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                                               inputProps={{ 'aria-label': 'Item amount', inputMode: 'decimal' }} sx={{ ...inputSx, width: 64, height: 32 }} />
                                                    <IconButton size="small" aria-label="Save item" disabled={busy} onClick={() => saveEdit(item)} sx={{ color: T.successText }}><Check size={15} /></IconButton>
                                                    <IconButton size="small" aria-label="Cancel" onClick={() => setEditingId(null)} sx={{ color: T.muted }}><X size={15} /></IconButton>
                                                </>
                                            ) : (
                                                <>
                                                    <Checkbox size="small" checked={item.purchased} disabled={busy}
                                                              onChange={() => run(() => props.onUpdateItem(item, { purchased: !item.purchased }))}
                                                              inputProps={{ 'aria-label': `Bought ${item.name}` }}
                                                              sx={{ p: 0.5, color: T.mutedSoft, '&.Mui-checked': { color: T.accent } }} />
                                                    <Typography sx={{
                                                        flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        color: item.purchased ? T.muted : T.text, textDecoration: item.purchased ? 'line-through' : 'none',
                                                    }}>{item.name}</Typography>
                                                    <Typography sx={{ fontFamily: FONT_MONO, fontSize: 13 }}>{money(item.amount)}</Typography>
                                                    <IconButton size="small" aria-label={`Edit ${item.name}`} onClick={() => startEdit(item)} sx={{ color: T.muted }}><Pencil size={14} /></IconButton>
                                                    <IconButton size="small" aria-label={`Delete ${item.name}`} disabled={busy}
                                                                onClick={() => run(() => props.onDeleteItem(item))} sx={{ color: T.muted }}><Trash2 size={14} /></IconButton>
                                                </>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            <Box component="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); addItem(); }}
                                 sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 70px auto', gap: 0.75, alignItems: 'end' }}>
                                <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, fontSize: 11, fontWeight: 600, color: T.ink2 }}>
                                    Item
                                    <InputBase value={newName} onChange={e => setNewName(e.target.value)} placeholder="What are you buying?" sx={inputSx} />
                                </Box>
                                <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, fontSize: 11, fontWeight: 600, color: T.ink2 }}>
                                    Amount
                                    <InputBase value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="$0" inputProps={{ inputMode: 'decimal' }} sx={inputSx} />
                                </Box>
                                <ButtonBase type="submit" disabled={busy || !newName.trim() || parseAmount(newAmount) === null}
                                            sx={{ height: 36, px: 1.5, borderRadius: '7px', bgcolor: T.accent, color: '#FFF', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                                                '&.Mui-disabled': { bgcolor: '#C9BCB7' } }}>
                                    Add
                                </ButtonBase>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.75 }}>
                                <ButtonBase onClick={() => { setLimitValue(String(bucket.limitAmount)); setEditingLimit(true); }} sx={linkBtnSx}>Edit limit</ButtonBase>
                                <ButtonBase disabled={busy || left === null || left <= 0} onClick={() => run(() => props.onRollLeftover(bucket))}
                                            sx={{ ...linkBtnSx, '&.Mui-disabled': { color: T.mutedSoft } }}>
                                    Roll leftover forward
                                </ButtonBase>
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {/* Footer */}
            <Box sx={{ mt: 'auto', px: 2, py: 1.5, bgcolor: T.footer, borderTop: `1px solid ${T.borderSoft}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <Box component="span" sx={{ color: T.ink2 }}>Safe to spend</Box>
                <Box component="span" sx={{ fontFamily: FONT_MONO, fontWeight: 600, color: safeToSpend === null ? T.muted : safeToSpend < 0 ? T.dangerText : T.successText }}>
                    {safeToSpend === null ? '—' : safeToSpend < 0 ? `${money(-safeToSpend)} over` : money(safeToSpend)}
                </Box>
            </Box>
        </Box>
    );
};

export default WeekCard;