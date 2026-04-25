// ── FuturePeriodDialog.tsx ────────────────────────────────────────────────────
// Single-screen dialog. User picks a future date range from a dropdown, then
// adds only the categories they want to plan. Each added category has a
// "planned spending" field and an optional "budgeted" field.
// No pre-populated rows — the user builds the list themselves.
import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { MAROON, NAVY, SLATE, GREEN, RED } from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
import BudgetPlannerService from "../services/BudgetPlannerService";

// ── Local tokens ──────────────────────────────────────────────────────────────
const MAROON_DARK = '#4a1010';
const AMBER       = '#d97706';

// ── Category colours ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
    Rent:              '#1D9E75',
    Groceries:         '#6b1a1a',
    Gas:               '#BA7517',
    Payments:          '#7c3aed',
    Other:             '#888780',
    Insurance:         '#0ea5e9',
    Utilities:         '#f59e0b',
    Electric:          '#6366f1',
    'Gas Bill':        '#ef4444',
    Subscriptions:     '#8b5cf6',
    Haircut:           '#14b8a6',
    Savings:           '#059669',
    'Order out':       '#D4537E',
    'Other Stuff':     '#888780',
    'Coffee Supplies': '#ba7517',
    'Phone Insurance': '#0ea5e9',
    'Trip Cost':       '#d97706',
    Golf:              '#639922',
    Salary:            MAROON,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface CategoryEntry {
    label:    string;
    rowType:  'salary' | 'expense';
    planned:  string; // actual/planned spend
    budgeted: string; // optional budget cap
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPeriodDates(template: SpreadsheetTemplate, pi: number): { start: Date; end: Date } | null {
    return (template as any).periodDates?.[pi] ?? null;
}

function isPeriodPresent(template: SpreadsheetTemplate, pi: number): boolean {
    const pd = getPeriodDates(template, pi);
    if (!pd) return false;
    const now = new Date();
    return pd.start <= now && pd.end >= now;
}

function isFutureOnly(template: SpreadsheetTemplate, pi: number): boolean {
    const pd = getPeriodDates(template, pi);
    return pd ? pd.start > new Date() : false;
}

function rowHistoricalAvg(template: SpreadsheetTemplate, rowLabel: string): number {
    const row = template.rows.find(r => r.label === rowLabel);
    if (!row) return 0;
    const past = row.values.filter(
        (v, i): v is number =>
            v !== null && v > 0 && !isFutureOnly(template, i) && !isPeriodPresent(template, i),
    );
    return past.length ? Math.round(past.reduce((a, b) => a + b, 0) / past.length) : 0;
}

function formatDateRange(pd: { start: Date; end: Date }): string {
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(pd.start)} – ${fmt(pd.end)}`;
}

// ── AmountInput — small controlled $ input ────────────────────────────────────
const AmountInput: React.FC<{
    value:       string;
    placeholder?: string;
    onChange:    (v: string) => void;
    highlight?:  'over' | 'under' | 'none';
}> = ({ value, placeholder, onChange, highlight = 'none' }) => (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ position: 'absolute', left: 9, fontSize: '0.79rem', color: SLATE, pointerEvents: 'none' }}>$</Typography>
        <Box
            component="input"
            type="number"
            value={value}
            placeholder={placeholder ?? '0'}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            sx={{
                border: `1px solid ${highlight === 'over' ? alpha(RED, 0.5) : highlight === 'under' ? alpha(GREEN, 0.5) : alpha('#000', 0.15)}`,
                borderRadius: '6px', pl: 2.5, pr: 0.875, py: 0.5,
                fontSize: '0.79rem', width: 96, textAlign: 'right',
                fontFamily: 'inherit', color: NAVY,
                bgcolor: highlight === 'over' ? alpha(RED, 0.04) : highlight === 'under' ? alpha(GREEN, 0.04) : '#fff',
                '&:focus': { outline: `1.5px solid ${MAROON}`, outlineOffset: '1px' },
            }}
        />
    </Box>
);

// ── Props ─────────────────────────────────────────────────────────────────────
export interface FuturePeriodDialogProps {
    template: SpreadsheetTemplate;
    onClose:  () => void;
    onApply:  (periodIndex: number, values: Record<string, number | null>) => void;
}

// ── FuturePeriodDialog ────────────────────────────────────────────────────────
const FuturePeriodDialog: React.FC<FuturePeriodDialogProps> = ({ template, onClose, onApply }) => {
    const futurePeriods = useMemo(
        () => template.periods.map((_, pi) => pi).filter(pi => isFutureOnly(template, pi)),
        [template],
    );

    const [selectedPi,    setSelectedPi]    = useState<number>(futurePeriods[0] ?? -1);
    const [entries,       setEntries]       = useState<CategoryEntry[]>([]);
    const [pickerOpen,    setPickerOpen]    = useState(false);
    const [pickerSearch,  setPickerSearch]  = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    const avgMap = useMemo<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        template.rows.forEach(r => { map[r.label] = rowHistoricalAvg(template, r.label); });
        return map;
    }, [template]);

    // All addable rows = salary + expense rows not yet added
    const availableRows = useMemo(() => {
        const addedLabels = new Set(entries.map(e => e.label));
        return template.rows
            .filter(r => (r.rowType === 'salary' || r.rowType === 'expense') && !addedLabels.has(r.label))
            .filter(r => pickerSearch === '' || r.label.toLowerCase().includes(pickerSearch.toLowerCase()));
    }, [template.rows, entries, pickerSearch]);

    const handlePeriodChange = (pi: number) => {
        setSelectedPi(pi);
        // Re-seed existing entries with values from the new column
        setEntries(prev => prev.map(e => {
            const row = template.rows.find(r => r.label === e.label);
            const v   = row?.values[pi];
            return { ...e, planned: v !== null && v !== undefined ? String(v) : '' };
        }));
    };

    const addCategory = (label: string, rowType: 'salary' | 'expense') => {
        const existing = selectedPi !== -1 ? template.rows.find(r => r.label === label)?.values[selectedPi] : null;
        setEntries(prev => [...prev, {
            label,
            rowType,
            planned:  existing !== null && existing !== undefined ? String(existing) : '',
            budgeted: '',
        }]);
        setPickerOpen(false);
        setPickerSearch('');
    };

    const removeEntry = (label: string) =>
        setEntries(prev => prev.filter(e => e.label !== label));

    const updateEntry = (label: string, field: 'planned' | 'budgeted', value: string) =>
        setEntries(prev => prev.map(e => e.label === label ? { ...e, [field]: value } : e));

    // Balance preview: salary planned - sum of expense planned (fallback to 0 if blank)
    const previewBalance = useMemo(() => {
        const sal   = entries.find(e => e.rowType === 'salary');
        const salV  = sal ? Number(sal.planned || 0) : 0;
        const spent = entries.filter(e => e.rowType === 'expense').reduce((s, e) => s + Number(e.planned || 0), 0);
        return salV - spent;
    }, [entries]);

    const handleApply = async () => {
        if (selectedPi === -1 || entries.length === 0) return;
        const pd = getPeriodDates(template, selectedPi);
        if (!pd) return;

        const dateRange = {
            startDate: pd.start.toISOString().split('T')[0],
            endDate:   pd.end.toISOString().split('T')[0],
        };
        const categories = entries.map(e => ({
            category: e.label,
            planned:  e.planned  !== '' ? Number(e.planned)  : 0,
            budgeted: e.budgeted !== '' ? Number(e.budgeted) : 0,
        }));

        const userId = Number(sessionStorage.getItem('userId'));
        const service = BudgetPlannerService.getInstance();
        await service.updateCategoryAmounts(Number(template.id), userId, dateRange, categories);

        // also update local spreadsheet state
        const out: Record<string, number | null> = {};
        entries.forEach(e => { out[e.label] = e.planned !== '' ? Number(e.planned) : null; });
        onApply(selectedPi, out);
        onClose();
    };

    const selectedPd = selectedPi !== -1 ? getPeriodDates(template, selectedPi) : null;
    const incomeEntries  = entries.filter(e => e.rowType === 'salary');
    const expenseEntries = entries.filter(e => e.rowType === 'expense');

    // ── No future periods guard ───────────────────────────────────────────────
    if (futurePeriods.length === 0) {
        return (
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 1400, bgcolor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
                <Box sx={{ bgcolor: '#fff', borderRadius: '12px', width: 420, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
                    <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, px: 2.25, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Custom amounts</Typography>
                        <Box onClick={onClose} sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1, px: 0.5, '&:hover': { color: '#fff' } }}>✕</Box>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: SLATE, lineHeight: 1.6 }}>No future periods exist yet. Add more periods to plan ahead.</Typography>
                        <Box onClick={onClose} sx={{ mt: 2, px: 1.75, py: 0.75, borderRadius: '7px', border: `1px solid ${alpha('#000', 0.14)}`, color: SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-block', '&:hover': { bgcolor: alpha('#000', 0.04) } }}>Close</Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <Box
            sx={{ position: 'fixed', inset: 0, zIndex: 1400, bgcolor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <Box sx={{ bgcolor: '#fff', borderRadius: '12px', width: 720, height: '71vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

                {/* ── Header ── */}
                <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 60%, #5a1515 100%)`, px: 2.25, py: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Custom amounts</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.25 }}>
                            Pick a future date range, then add only the categories you want to plan
                        </Typography>
                    </Box>
                    <Box onClick={onClose} sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1, px: 0.5, '&:hover': { color: '#fff' } }}>✕</Box>
                </Box>

                {/* ── Date range selector ── */}
                <Box sx={{ px: 2.25, py: 1.375, borderBottom: `0.5px solid ${alpha('#000', 0.08)}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.625 }}>Date range</Typography>
                        <Box
                            component="select"
                            value={selectedPi}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePeriodChange(Number(e.target.value))}
                            sx={{ width: '100%', border: `1.5px solid ${alpha(MAROON, 0.35)}`, borderRadius: '7px', px: 1.125, py: 0.75, fontSize: '0.82rem', fontWeight: 600, color: NAVY, bgcolor: '#fff', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23475569' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', pr: 3, '&:focus': { outline: `2px solid ${MAROON}`, outlineOffset: '1px' } }}
                        >
                            {futurePeriods.map(pi => {
                                const pd = getPeriodDates(template, pi);
                                return (
                                    <option key={pi} value={pi}>
                                        {template.periods[pi]}{pd ? `  ·  ${formatDateRange(pd)}` : ''}
                                    </option>
                                );
                            })}
                        </Box>
                    </Box>
                    {selectedPd && (
                        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>
                                {selectedPd.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                <Box component="span" sx={{ mx: 0.5, color: alpha(SLATE, 0.4) }}>→</Box>
                                {selectedPd.end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* ── Category rows ── */}
                <Box sx={{ overflowY: 'auto', flex: 1, px: 2.25, py: 1.5 }}>

                    {entries.length === 0 ? (
                        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: SLATE }}>No categories added yet.</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: alpha(SLATE, 0.6), textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
                                Use the button below to add only the income or expense categories you want to plan for this period.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Column headers */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px 20px', gap: 1, alignItems: 'center', mb: 0.75, px: 0.25 }}>
                                <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</Typography>
                                <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Planned</Typography>
                                <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: alpha(SLATE, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Budgeted <Box component="span" sx={{ fontSize: '0.6rem', fontWeight: 400 }}>(opt)</Box></Typography>
                                <Box />
                            </Box>

                            {/* Income entries */}
                            {incomeEntries.length > 0 && (
                                <>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.07em', mt: 0.5, mb: 0.75 }}>Income</Typography>
                                    {incomeEntries.map(e => {
                                        const avg = avgMap[e.label];
                                        const pNum = e.planned !== '' ? Number(e.planned) : null;
                                        const highlight = pNum !== null && avg > 0
                                            ? pNum > avg * 1.15 ? 'over' : pNum < avg * 0.85 ? 'under' : 'none'
                                            : 'none' as const;
                                        return (
                                            <Box key={e.label} sx={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px 20px', gap: 1, alignItems: 'center', py: 0.75, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <Box sx={{ width: 3, height: 14, borderRadius: '1.5px', bgcolor: MAROON, flexShrink: 0 }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: NAVY }}>{e.label}</Typography>
                                                        {avg > 0 && <Typography sx={{ fontSize: '0.65rem', color: alpha(SLATE, 0.7) }}>avg ${avg.toLocaleString()}</Typography>}
                                                    </Box>
                                                </Box>
                                                <AmountInput value={e.planned} placeholder={avg > 0 ? String(avg) : '0'} onChange={v => updateEntry(e.label, 'planned', v)} highlight={highlight} />
                                                <AmountInput value={e.budgeted} placeholder="—" onChange={v => updateEntry(e.label, 'budgeted', v)} />
                                                <Box onClick={() => removeEntry(e.label)} sx={{ cursor: 'pointer', color: alpha(SLATE, 0.35), fontSize: '0.75rem', lineHeight: 1, textAlign: 'center', '&:hover': { color: RED } }}>✕</Box>
                                            </Box>
                                        );
                                    })}
                                </>
                            )}

                            {/* Expense entries */}
                            {expenseEntries.length > 0 && (
                                <>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mt: 1.25, mb: 0.75 }}>Expenses</Typography>
                                    {expenseEntries.map(e => {
                                        const avg      = avgMap[e.label];
                                        const catColor = CAT_COLORS[e.label] ?? SLATE;
                                        const pNum     = e.planned !== '' ? Number(e.planned) : null;
                                        const bNum     = e.budgeted !== '' ? Number(e.budgeted) : null;
                                        const overBudget = bNum !== null && pNum !== null && pNum > bNum;
                                        const highlight  = pNum !== null && avg > 0
                                            ? pNum > avg * 1.15 ? 'over' : pNum < avg * 0.85 ? 'under' : 'none'
                                            : 'none' as const;
                                        return (
                                            <Box key={e.label} sx={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px 20px', gap: 1, alignItems: 'center', py: 0.75, borderBottom: `0.5px solid ${alpha('#000', 0.05)}` }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                    <Box sx={{ width: 3, height: 14, borderRadius: '1.5px', bgcolor: catColor, flexShrink: 0 }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.8rem', color: NAVY }}>{e.label}</Typography>
                                                        {avg > 0 && <Typography sx={{ fontSize: '0.65rem', color: alpha(SLATE, 0.7) }}>avg ${avg.toLocaleString()}</Typography>}
                                                    </Box>
                                                </Box>
                                                <AmountInput value={e.planned} placeholder={avg > 0 ? String(avg) : ''} onChange={v => updateEntry(e.label, 'planned', v)} highlight={highlight} />
                                                <Box sx={{ position: 'relative' }}>
                                                    <AmountInput value={e.budgeted} placeholder="—" onChange={v => updateEntry(e.label, 'budgeted', v)} highlight={overBudget ? 'over' : 'none'} />
                                                    {overBudget && (
                                                        <Typography sx={{ position: 'absolute', right: 0, top: '100%', fontSize: '0.6rem', color: RED, fontWeight: 600, whiteSpace: 'nowrap', mt: '2px' }}>
                                                            over budget
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box onClick={() => removeEntry(e.label)} sx={{ cursor: 'pointer', color: alpha(SLATE, 0.35), fontSize: '0.75rem', lineHeight: 1, textAlign: 'center', '&:hover': { color: RED } }}>✕</Box>
                                            </Box>
                                        );
                                    })}
                                </>
                            )}
                        </>
                    )}

                    {/* ── Add category picker ── */}
                    <Box sx={{ mt: entries.length === 0 ? 0 : 1.5, position: 'relative' }} ref={pickerRef}>
                        <Box
                            onClick={() => { setPickerOpen(v => !v); setPickerSearch(''); }}
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.625, px: 1.25, py: 0.625, borderRadius: '6px', border: `1px dashed ${alpha(MAROON, 0.35)}`, color: MAROON, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', bgcolor: pickerOpen ? alpha(MAROON, 0.04) : 'transparent', transition: 'all .12s', '&:hover': { bgcolor: alpha(MAROON, 0.04), borderColor: MAROON } }}
                        >
                            <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1, mt: '-1px' }}>+</Box>
                            Add category
                        </Box>

                        {pickerOpen && (
                            <Box sx={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 10, bgcolor: '#fff', borderRadius: '8px', border: `1px solid ${alpha('#000', 0.12)}`, boxShadow: `0 8px 24px ${alpha('#000', 0.12)}`, width: 260, overflow: 'hidden' }}>
                                {/* Search */}
                                <Box sx={{ px: 1.125, py: 0.875, borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
                                    <Box
                                        component="input"
                                        autoFocus
                                        value={pickerSearch}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickerSearch(e.target.value)}
                                        placeholder="Search categories…"
                                        sx={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.79rem', color: NAVY, fontFamily: 'inherit', bgcolor: 'transparent' }}
                                    />
                                </Box>

                                {/* Category list */}
                                <Box sx={{ overflowY: 'auto' }}>
                                    {availableRows.length === 0 ? (
                                        <Box sx={{ px: 1.5, py: 1.25 }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>
                                                {pickerSearch ? 'No matches.' : 'All categories added.'}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            {/* Income group */}
                                            {availableRows.filter(r => r.rowType === 'salary').length > 0 && (
                                                <Box sx={{ px: 1.25, pt: 0.875, pb: 0.25 }}>
                                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Income</Typography>
                                                </Box>
                                            )}
                                            {availableRows.filter(r => r.rowType === 'salary').map(r => (
                                                <Box key={r.label} onClick={() => addCategory(r.label, 'salary')} sx={{ display: 'flex', alignItems: 'center', gap: 0.875, px: 1.25, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.04) } }}>
                                                    <Box sx={{ width: 3, height: 13, borderRadius: '1.5px', bgcolor: MAROON, flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: '0.79rem', color: NAVY }}>{r.label}</Typography>
                                                    {avgMap[r.label] > 0 && <Typography sx={{ fontSize: '0.65rem', color: SLATE, ml: 'auto' }}>avg ${avgMap[r.label].toLocaleString()}</Typography>}
                                                </Box>
                                            ))}

                                            {/* Expense group */}
                                            {availableRows.filter(r => r.rowType === 'expense').length > 0 && (
                                                <Box sx={{ px: 1.25, pt: 0.875, pb: 0.25 }}>
                                                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Expenses</Typography>
                                                </Box>
                                            )}
                                            {availableRows.filter(r => r.rowType === 'expense').map(r => {
                                                const catColor = CAT_COLORS[r.label] ?? SLATE;
                                                return (
                                                    <Box key={r.label} onClick={() => addCategory(r.label, 'expense')} sx={{ display: 'flex', alignItems: 'center', gap: 0.875, px: 1.25, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: alpha(MAROON, 0.04) } }}>
                                                        <Box sx={{ width: 3, height: 13, borderRadius: '1.5px', bgcolor: catColor, flexShrink: 0 }} />
                                                        <Typography sx={{ fontSize: '0.79rem', color: NAVY }}>{r.label}</Typography>
                                                        {avgMap[r.label] > 0 && <Typography sx={{ fontSize: '0.65rem', color: SLATE, ml: 'auto' }}>avg ${avgMap[r.label].toLocaleString()}</Typography>}
                                                    </Box>
                                                );
                                            })}
                                        </>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* ── Footer ── */}
                <Box sx={{ px: 2.25, py: 1.25, borderTop: `0.5px solid ${alpha('#000', 0.08)}`, bgcolor: alpha('#000', 0.02), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.625 }}>
                        {entries.length > 0 ? (
                            <>
                                <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Balance preview:</Typography>
                                <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: previewBalance >= 0 ? GREEN : RED }}>
                                    {previewBalance >= 0 ? '+' : '-'}${Math.abs(previewBalance).toLocaleString()}
                                </Typography>
                            </>
                        ) : (
                            <Typography sx={{ fontSize: '0.72rem', color: alpha(SLATE, 0.6) }}>
                                {futurePeriods.length} future period{futurePeriods.length !== 1 ? 's' : ''} available
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box onClick={onClose} sx={{ px: 1.75, py: 0.75, borderRadius: '7px', border: `1px solid ${alpha('#000', 0.14)}`, color: SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: alpha('#000', 0.04) } }}>
                            Cancel
                        </Box>
                        <Box
                            onClick={entries.length > 0 ? handleApply : undefined}
                            sx={{ px: 1.75, py: 0.75, borderRadius: '7px', bgcolor: entries.length > 0 ? MAROON : alpha('#000', 0.08), color: entries.length > 0 ? '#fff' : SLATE, fontSize: '0.78rem', fontWeight: 600, cursor: entries.length > 0 ? 'pointer' : 'default', transition: 'background .15s', '&:hover': entries.length > 0 ? { bgcolor: MAROON_DARK } : {} }}
                        >
                            Apply amounts
                        </Box>
                    </Box>
                </Box>

            </Box>
        </Box>
    );
};

export default FuturePeriodDialog;