import React, { useEffect, useMemo, useState } from 'react';
import {
    alpha, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
    IconButton, InputBase, Stack, Typography,
} from '@mui/material';
import { Minus, Plus, X as XIcon, CalendarClock, Check, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { ScheduledContribution } from '../config/Types';
import { MAROON, MAROON_DARK } from '../config/Constants';
import { fmt } from '../config/Helpers';

interface ScheduleUpdate {
    id:     number;
    amount: number;
}

interface BulkScheduleUpdateDialogProps {
    open:                   boolean;
    onClose:                () => void;
    envelopeId:             number | null;
    envelopeName?:          string;
    scheduledContributions: ScheduledContribution[];
    /** Accent color, typically the envelope's ENVELOPE_COLORS entry */
    color?:                 string;
    /**
     * Rows to pre-select when the dialog opens. Pass a single id to open the
     * dialog targeted at one scheduled contribution (single update) — the user
     * can still select more rows to turn it into a bulk update. Omit or pass
     * an empty array to open with nothing pre-selected (pure bulk update).
     */
    initialSelectedIds?:    number[];
    onSubmit:               (envelopeId: number, updates: ScheduleUpdate[]) => Promise<void> | void;
}

/** Falls back to a sane range if the record doesn't carry explicit bounds yet. */
const getScheduleBounds = (sc: ScheduledContribution): { min: number; max: number } => {
    const anySc = sc as ScheduledContribution & { minAmount?: number; maxAmount?: number };
    const min = anySc.minAmount ?? Math.max(0, Math.round(sc.amount * 0.5));
    const max = anySc.maxAmount ?? Math.round(sc.amount * 1.5);
    return { min, max };
};

/**
 * Lets the user pick several upcoming (SCHEDULED, non-paid/missed) contributions
 * for an envelope and adjust each one's amount, then save all changes in one call
 * to `onSubmit` — the same shape EnvelopeDetailPanel's inline row editor already
 * sends to `onUpdateSchedule`.
 */
const BulkScheduleUpdateDialog: React.FC<BulkScheduleUpdateDialogProps> = ({
                                                                               open, onClose, envelopeId, envelopeName, scheduledContributions, color = MAROON,
                                                                               initialSelectedIds, onSubmit,
                                                                           }) => {
    const editableRows = scheduledContributions.filter(sc => sc.status !== 'PAID' && sc.status !== 'MISSED');
    const isSingleTarget = (initialSelectedIds?.length ?? 0) === 1;

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    /** 'asc' = soonest first, 'desc' = furthest out first */
    const [sortOrder, setSortOrder]     = useState<'asc' | 'desc'>('asc');
    /** What's shown in each row's amount field, keyed by row id. This is the single source of
     *  truth for the field — nothing else silently rewrites it while the user is editing, so
     *  whatever they type stays exactly as typed. Range clamping is applied only when the value
     *  is actually used (stepper clicks, the "Edited" indicator, and the final save payload). */
    const [amountText, setAmountText]   = useState<Record<number, string>>({});
    /** Text typed into the "set the same amount for all/selected rows" field, above the list. */
    const [bulkAmountText, setBulkAmountText] = useState('');
    const [saving, setSaving]           = useState(false);

    // Reset local state whenever the dialog opens (or the target row(s) it should start on changes) —
    // seeding from initialSelectedIds covers both "edit this one row" and "start a fresh bulk edit".
    useEffect(() => {
        if (open) {
            setSelectedIds(new Set(initialSelectedIds ?? []));
            setAmountText(Object.fromEntries(editableRows.map(sc => [sc.id, String(sc.amount)])));
            setBulkAmountText('');
            setSaving(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, envelopeId, initialSelectedIds?.join(',')]);

    const toggleSelected = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const clampToBounds = (sc: ScheduledContribution, value: number): number => {
        const { min, max } = getScheduleBounds(sc);
        return Math.min(max, Math.max(min, Math.round(value)));
    };

    /** The number currently sitting in the field, unclamped — exactly what the user typed. */
    const getRawAmount = (sc: ScheduledContribution): number => {
        const text = amountText[sc.id];
        const parsed = text !== undefined && text !== '' ? Number(text) : sc.amount;
        return Number.isFinite(parsed) ? parsed : sc.amount;
    };

    const adjustAmount = (sc: ScheduledContribution, delta: number) => {
        const next = clampToBounds(sc, getRawAmount(sc) + delta);
        setAmountText(prev => ({ ...prev, [sc.id]: String(next) }));
        // Adjusting a row's amount implicitly selects it for the save
        setSelectedIds(prev => (prev.has(sc.id) ? prev : new Set(prev).add(sc.id)));
    };

    /** Every keystroke just writes straight into amountText — nothing clamps or reverts it. */
    const handleAmountInputChange = (sc: ScheduledContribution, value: string) => {
        // Only allow digits (and an empty string, while the user is still typing/deleting)
        if (value !== '' && !/^\d*$/.test(value)) return;
        setAmountText(prev => ({ ...prev, [sc.id]: value }));
        setSelectedIds(prev => (prev.has(sc.id) ? prev : new Set(prev).add(sc.id)));
    };

    const selectedCount = selectedIds.size;
    const totalDelta = Array.from(selectedIds).reduce((s, id) => {
        const sc = editableRows.find(r => r.id === id);
        if (!sc) return s;
        return s + (clampToBounds(sc, getRawAmount(sc)) - sc.amount);
    }, 0);

    const handleSelectAll = () => {
        setSelectedIds(prev =>
            prev.size === editableRows.length ? new Set() : new Set(editableRows.map(sc => sc.id))
        );
    };

    /**
     * Writes `bulkAmountText` into every targeted row's amount field at once. If some rows are
     * already checked, only those are updated (so a subset can be batch-set); otherwise every
     * row gets the amount and gets selected, since applying to nothing selected clearly means
     * "set them all".
     */
    const handleApplyBulkAmount = () => {
        if (bulkAmountText === '') return;
        const targetIds = selectedIds.size > 0 ? Array.from(selectedIds) : editableRows.map(sc => sc.id);
        setAmountText(prev => {
            const next = { ...prev };
            targetIds.forEach(id => { next[id] = bulkAmountText; });
            return next;
        });
        if (selectedIds.size === 0) {
            setSelectedIds(new Set(targetIds));
        }
        setBulkAmountText('');
    };

    const sortedRows = useMemo(() => {
        const sorted = [...editableRows].sort(
            (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        return sortOrder === 'asc' ? sorted : sorted.reverse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduledContributions, sortOrder]);

    const handleSave = async () => {
        if (envelopeId === null || selectedCount === 0) return;
        const updates: ScheduleUpdate[] = Array.from(selectedIds).map(id => {
            const sc = editableRows.find(r => r.id === id)!;
            return { id, amount: clampToBounds(sc, getRawAmount(sc)) };
        });
        setSaving(true);
        try {
            await onSubmit(envelopeId, updates);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <Box sx={{ px: 3, py: 2.25, background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CalendarClock size={16} color="#fff" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>
                            {isSingleTarget ? 'Update scheduled payment' : 'Update scheduled payments'}
                        </Typography>
                        {envelopeName && <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>{envelopeName}</Typography>}
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.14)' } }}>
                    <XIcon size={16} />
                </IconButton>
            </Box>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <DialogContent sx={{ p: 0, bgcolor: '#fdf7f7' }}>
                {editableRows.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>No upcoming scheduled payments to update.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a35c5c' }}>
                                {editableRows.length} upcoming payment{editableRows.length > 1 ? 's' : ''}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Button size="small" onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
                                        startIcon={sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', color: '#7a4a4a', minWidth: 0, '&:hover': { color: MAROON } }}>
                                    Date
                                </Button>
                                <Button size="small" onClick={handleSelectAll}
                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', color: MAROON, minWidth: 0 }}>
                                    {selectedIds.size === editableRows.length ? 'Deselect all' : 'Select all'}
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, borderRadius: '8px', bgcolor: '#f5e5e5' }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#7a4a4a', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                Set same amount for
                            </Typography>
                            <InputBase
                                type="text"
                                inputMode="numeric"
                                placeholder="Amount"
                                aria-label="Amount to apply to all or selected rows"
                                value={bulkAmountText}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '' || /^\d*$/.test(v)) setBulkAmountText(v);
                                }}
                                inputProps={{ style: { fontSize: '0.75rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' } }}
                                sx={{ flex: 1, bgcolor: '#fff', borderRadius: '6px', px: 1, height: 28, border: '1px solid #ecd9d9' }}
                            />
                            <Button size="small" disabled={bulkAmountText === ''} onClick={handleApplyBulkAmount}
                                    startIcon={<Copy size={12} />}
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', color: MAROON, minWidth: 0, flexShrink: 0, whiteSpace: 'nowrap',
                                        '&.Mui-disabled': { color: '#c9adad' } }}>
                                {selectedCount > 0 ? `${selectedCount} selected` : `all ${editableRows.length}`}
                            </Button>
                        </Box>

                        <Stack spacing={0.75} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
                            {sortedRows.map(sc => {
                                const { min, max } = getScheduleBounds(sc);
                                const isSelected  = selectedIds.has(sc.id);
                                const rawAmount   = getRawAmount(sc); // exactly what's typed, unclamped
                                const isDue       = new Date(sc.scheduledDate) <= new Date();
                                const changed     = rawAmount !== sc.amount;
                                const outOfRange  = rawAmount < min || rawAmount > max;

                                return (
                                    <Box key={sc.id}
                                         sx={{ p: 1.25, borderRadius: '8px', border: `1px solid ${isSelected ? alpha(color, 0.35) : '#ecd9d9'}`, bgcolor: isSelected ? alpha(color, 0.04) : '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox size="small" checked={isSelected} onChange={() => toggleSelected(sc.id)}
                                                  sx={{ p: 0.5, color: '#ccc', '&.Mui-checked': { color } }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#111' }}>
                                                {new Date(sc.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                <Typography sx={{ fontSize: '0.65rem', color: outOfRange ? '#dc2626' : '#999' }}>{sc.frequency} · {fmt(min)}–{fmt(max)}</Typography>
                                                {isDue && <Chip size="small" label="Due" sx={{ height: 14, fontSize: '0.55rem', fontWeight: 600, bgcolor: alpha('#d97706', 0.12), color: '#d97706' }} />}
                                                {changed && !outOfRange && <Chip size="small" label="Edited" sx={{ height: 14, fontSize: '0.55rem', fontWeight: 600, bgcolor: alpha(color, 0.12), color }} />}
                                                {outOfRange && <Chip size="small" label="Will round to range" sx={{ height: 14, fontSize: '0.55rem', fontWeight: 600, bgcolor: alpha('#dc2626', 0.12), color: '#dc2626' }} />}
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${outOfRange ? '#f3b8b8' : '#ddd'}`, borderRadius: '7px', overflow: 'hidden', flexShrink: 0 }}>
                                            <IconButton size="small" aria-label="Decrease amount"
                                                        onClick={() => adjustAmount(sc, -10)}
                                                        sx={{ width: 24, height: 24, borderRadius: 0, borderRight: '1px solid #ddd' }}>
                                                <Minus size={11} />
                                            </IconButton>
                                            <InputBase
                                                type="text"
                                                inputMode="numeric"
                                                aria-label="Scheduled amount"
                                                value={amountText[sc.id] ?? String(sc.amount)}
                                                onChange={(e) => handleAmountInputChange(sc, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                inputProps={{
                                                    style: { textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', padding: 0, color: outOfRange ? '#dc2626' : undefined },
                                                }}
                                                sx={{ width: 58, height: 24 }}
                                            />
                                            <IconButton size="small" aria-label="Increase amount"
                                                        onClick={() => adjustAmount(sc, 10)}
                                                        sx={{ width: 24, height: 24, borderRadius: 0, borderLeft: '1px solid #ddd' }}>
                                                <Plus size={11} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <DialogActions sx={{ px: 2.5, py: 1.75, borderTop: '1px solid #ecd9d9', bgcolor: '#fdf7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                    {selectedCount > 0
                        ? `${selectedCount} selected${totalDelta !== 0 ? ` · ${totalDelta > 0 ? '+' : ''}${fmt(totalDelta)} net change` : ''}`
                        : 'Select payments to update'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: '#999' }}>
                        Cancel
                    </Button>
                    <Button variant="contained" disableElevation disabled={selectedCount === 0 || saving} onClick={handleSave}
                            startIcon={<Check size={14} />}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) } }}>
                        {saving ? 'Saving…' : `Save ${selectedCount > 0 ? selectedCount + ' ' : ''}change${selectedCount === 1 ? '' : 's'}`}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default BulkScheduleUpdateDialog;