// ── PeriodDetailCard.tsx ──────────────────────────────────────────────────────
// Enhanced with:
//  • Per-category fixed/variable toggle — click the lock icon to switch
//  • Edit mode button in the header (pencil icon)
//  • In edit mode: each row shows a Fixed / Variable pill toggle
//  • Save button persists the category type overrides
//  • All existing layout/styling preserved exactly
import React, { useMemo, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Lock, LockOpen, Edit, Save, CheckCircleOutline } from '@mui/icons-material';

import {
    MAROON, NAVY, SLATE, GREEN, RED, fmt, fmtS,
} from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';

// ── Local tokens ──────────────────────────────────────────────────────────────
const MAROON_DARK = '#4a1010';
const AMBER       = '#d97706';
const BLUE        = '#1d6fb8';

// ── Category dot colors ───────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
    Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
    Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
    Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
    Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
    'Order out': '#D4537E', 'Dining out': '#D4537E', 'Other Stuff': '#888780',
    'Coffee Supplies': '#ba7517', 'Phone Insurance': '#0ea5e9',
    'Trip Cost': '#d97706', Golf: '#639922',
};

// ── Default fixed categories ───────────────────────────────────────────────────
const DEFAULT_FIXED = new Set(['Rent', 'Payments', 'Insurance', 'Subscriptions']);

// ── Types ─────────────────────────────────────────────────────────────────────
type CategoryTargets  = Record<string, number>;
type CategoryTypeMap  = Record<string, 'fixed' | 'variable'>; // user overrides

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
function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PeriodDetailCardProps {
    template:        SpreadsheetTemplate;
    periodIndex:     number;
    mode:            'manual' | 'auto';
    targets:         CategoryTargets;
    onSetTarget:     (pi: number, label: string, val: number | null) => void;
    /** Optional: persist category type overrides externally */
    categoryTypes?:  CategoryTypeMap;
    onSaveTypes?:    (types: CategoryTypeMap) => void;
}

// ── Fixed/Variable pill toggle ────────────────────────────────────────────────
const TypePill: React.FC<{
    isFixed:  boolean;
    onChange: (fixed: boolean) => void;
}> = ({ isFixed, onChange }) => (
    <Box sx={{
        display: 'flex',
        border: `1px solid ${alpha('#000', 0.13)}`,
        borderRadius: '5px', overflow: 'hidden', flexShrink: 0,
    }}>
        {[
            { label: 'Fixed',    value: true,  activeColor: MAROON },
            { label: 'Variable', value: false, activeColor: BLUE   },
        ].map(opt => (
            <Box
                key={opt.label}
                onClick={() => onChange(opt.value)}
                sx={{
                    px: 0.875, py: 0.3,
                    fontSize: '0.63rem', fontWeight: 700,
                    cursor: 'pointer', userSelect: 'none',
                    bgcolor: isFixed === opt.value ? opt.activeColor : '#fff',
                    color:   isFixed === opt.value ? '#fff' : SLATE,
                    borderRight: opt.value ? `1px solid ${alpha('#000', 0.1)}` : 'none',
                    transition: 'all .12s',
                    '&:hover': isFixed !== opt.value ? { bgcolor: alpha(opt.activeColor, 0.07), color: opt.activeColor } : {},
                }}
            >
                {opt.label}
            </Box>
        ))}
    </Box>
);

// ── Component ─────────────────────────────────────────────────────────────────
const PeriodDetailCard: React.FC<PeriodDetailCardProps> = ({
                                                               template, periodIndex, mode, targets, onSetTarget,
                                                               categoryTypes: externalTypes, onSaveTypes,
                                                           }) => {
    const period    = template.periods[periodIndex] ?? '';
    const type      = getPeriodType(template, periodIndex);

    // ── Edit mode state ────────────────────────────────────────────────────────
    const [editMode,   setEditMode]   = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);

    // Local draft of category type overrides — starts from external or defaults
    const [draftTypes, setDraftTypes] = useState<CategoryTypeMap>(() =>
        externalTypes ?? {}
    );

    // Resolve effective type for a label
    const getEffectiveType = useCallback((label: string): 'fixed' | 'variable' => {
        if (draftTypes[label]) return draftTypes[label];
        return DEFAULT_FIXED.has(label) ? 'fixed' : 'variable';
    }, [draftTypes]);

    const handleToggle = (label: string, isFixed: boolean) => {
        setDraftTypes(prev => ({ ...prev, [label]: isFixed ? 'fixed' : 'variable' }));
    };

    const handleSave = () => {
        onSaveTypes?.(draftTypes);
        setEditMode(false);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
    };

    const handleCancel = () => {
        setDraftTypes(externalTypes ?? {});
        setEditMode(false);
    };

    // Date range
    const dateRange = useMemo(() => {
        const pd = (template as any).periodDates?.[periodIndex];
        if (pd?.start && pd?.end) return `${fmtDate(pd.start)} – ${fmtDate(pd.end)}`;
        return period;
    }, [template, periodIndex, period]);

    // Split rows
    const allExpenseRows = template.rows.filter(r =>
        r.rowType === 'expense' || r.rowType === 'fixed-expense'
    );
    const fixedRows    = allExpenseRows.filter(r => getEffectiveType(r.label) === 'fixed');
    const variableRows = allExpenseRows.filter(r => getEffectiveType(r.label) === 'variable');

    const salaryRow  = template.rows.find(r => r.rowType === 'salary');
    const income     = salaryRow?.values[periodIndex] ?? null;
    const fixedTotal = fixedRows.reduce((s, r)    => s + (r.values[periodIndex] ?? 0), 0);
    const varActual  = variableRows.reduce((s, r) => s + (r.values[periodIndex] ?? 0), 0);
    const varBudget  = variableRows.reduce((s, r) => s + (targets[`${periodIndex}-${r.label}`] ?? 0), 0);
    const totalSpend = fixedTotal + varActual;
    const balance    = income !== null ? income - totalSpend : null;
    const varOver    = varBudget > 0 && varActual > varBudget;

    const TYPE_LABELS = { past: 'past period', present: 'current period', 'future-manual': 'planned period', 'future-auto': 'predicted period' } as Record<string, string>;
    const TYPE_TAG_BG = { past: '#888780', present: '#8b1a1a', 'future-manual': '#85B7EB', 'future-auto': '#97C459' } as Record<string, string>;
    const TYPE_TAG_FG = { past: '#fff', present: '#fff', 'future-manual': '#042C53', 'future-auto': '#173404' } as Record<string, string>;

    return (
        <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.18)}`, mt: 1.5 }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <Box sx={{
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 70%, #5a1515 100%)`,
                px: 1.75, py: 1.125,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{dateRange}</Typography>
                    {income !== null && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>{fmtC(income)} Income</Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Save flash */}
                    {savedFlash && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: '5px', bgcolor: 'rgba(5,150,105,0.25)', border: '1px solid rgba(5,150,105,0.5)' }}>
                            <CheckCircleOutline sx={{ fontSize: '0.8rem', color: '#4ade80' }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#4ade80' }}>Saved</Typography>
                        </Box>
                    )}

                    {/* Edit / Save / Cancel buttons */}
                    {!editMode ? (
                        <Box
                            onClick={() => setEditMode(true)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.28)', bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.69rem', fontWeight: 600, transition: 'all .15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }, userSelect: 'none' }}
                        >
                            <Edit sx={{ fontSize: '0.8rem' }} /> Edit categories
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 0.625 }}>
                            <Box onClick={handleCancel} sx={{ px: 1, py: 0.35, borderRadius: '5px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: '0.69rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, userSelect: 'none' }}>
                                Cancel
                            </Box>
                            <Box onClick={handleSave} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: '5px', cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.45)', color: '#fff', fontSize: '0.69rem', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' }, userSelect: 'none' }}>
                                <Save sx={{ fontSize: '0.8rem' }} /> Save changes
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.875, py: 0.3, borderRadius: '4px', bgcolor: TYPE_TAG_BG[type], color: TYPE_TAG_FG[type], whiteSpace: 'nowrap' }}>
                        {TYPE_LABELS[type]}
                    </Box>
                    <Typography sx={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', letterSpacing: '2px', lineHeight: 1, '&:hover': { color: '#fff' } }}>···</Typography>
                </Box>
            </Box>

            {/* ── Edit mode banner ───────────────────────────────────────── */}
            {editMode && (
                <Box sx={{ px: 1.75, py: 1, bgcolor: alpha(BLUE, 0.06), borderBottom: `1px solid ${alpha(BLUE, 0.18)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: BLUE, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#0c3b6b', lineHeight: 1.5 }}>
                        <strong>Category edit mode</strong> — toggle each row between Fixed and Variable. Fixed rows are locked; variable rows accept a target amount.
                    </Typography>
                </Box>
            )}

            {/* ── KPI strip ──────────────────────────────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `0.5px solid ${alpha('#000', 0.08)}` }}>
                {[
                    { label: 'Fixed committed', val: fmtC(fixedTotal),                                            color: NAVY   },
                    { label: 'Variable budget',  val: varBudget > 0 ? fmtC(varBudget) : '—',                     color: MAROON },
                    { label: 'Variable actual',  val: fmtC(varActual), color: varOver ? RED : varBudget > 0 ? '#059669' : NAVY },
                ].map((kpi, i) => (
                    <Box key={i} sx={{ px: 1.75, py: 1.125, borderRight: i < 2 ? `0.5px solid ${alpha('#000', 0.08)}` : 'none' }}>
                        <Typography sx={{ fontSize: '0.67rem', color: SLATE, mb: 0.2 }}>{kpi.label}</Typography>
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                            {kpi.val}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Scrollable body ────────────────────────────────────────── */}
            <Box sx={{
                maxHeight: 420, overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 5 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: '3px' },
                '&::-webkit-scrollbar-thumb:hover': { bgcolor: alpha(MAROON, 0.38) },
            }}>

                {/* ── FIXED EXPENSES ─────────────────────────────────────── */}
                {fixedRows.length > 0 && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 0.75, bgcolor: '#fafaf9', borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fixed expenses</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ fontSize: '0.63rem', fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#e8e8e6', color: '#5f5e5a' }}>locked</Box>
                                <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(fixedTotal)}</Typography>
                            </Box>
                        </Box>

                        {fixedRows.map(row => {
                            const actual   = row.values[periodIndex] ?? null;
                            const catColor = CAT_COLORS[row.label] ?? SLATE;
                            const subtext  = DEFAULT_FIXED.has(row.label) && row.label === 'Rent'
                                ? 'Fixed · matches committed amount'
                                : 'Fixed · recurring subscription';

                            return (
                                <Box key={row.label} sx={{ px: 1.75, py: editMode ? 0.875 : 1, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, display: 'flex', alignItems: 'center', gap: 1, bgcolor: editMode ? alpha(MAROON, 0.015) : 'transparent', transition: 'background .12s', '&:hover': { bgcolor: alpha(MAROON, 0.025) } }}>
                                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY }}>{row.label}</Typography>
                                        {!editMode && <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{subtext}</Typography>}
                                    </Box>

                                    {/* Edit mode: type toggle */}
                                    {editMode ? (
                                        <TypePill
                                            isFixed={getEffectiveType(row.label) === 'fixed'}
                                            onChange={isFixed => handleToggle(row.label, isFixed)}
                                        />
                                    ) : (
                                        <Lock sx={{ fontSize: '0.8rem', color: alpha(SLATE, 0.45), flexShrink: 0 }} />
                                    )}

                                    <Box sx={{ textAlign: 'right', minWidth: 72 }}>
                                        <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                            {actual !== null ? `$${fmt(actual)}` : '—'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, bgcolor: alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>—</Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </>
                )}

                {/* ── VARIABLE EXPENSES ──────────────────────────────────── */}
                {variableRows.length > 0 && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 0.75, bgcolor: '#fafaf9', borderBottom: `0.5px solid ${alpha('#000', 0.07)}` }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Variable expenses</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ fontSize: '0.63rem', fontWeight: 600, px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: '#deeeff', color: '#185fa5' }}>adjustable</Box>
                                {varBudget > 0 && (
                                    <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: varOver ? RED : '#059669', fontVariantNumeric: 'tabular-nums' }}>
                                        {fmtC(varActual)} of {fmtC(varBudget)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {variableRows.map(row => {
                            const actual   = row.values[periodIndex] ?? null;
                            const target   = targets[`${periodIndex}-${row.label}`] ?? null;
                            const catColor = CAT_COLORS[row.label] ?? SLATE;

                            const avg = (() => {
                                const vals = row.values.map((v, i) => ({ v, i })).filter(({ v, i }) => v !== null && v > 0 && !isPeriodFuture(template, i)).map(({ v }) => v as number);
                                return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
                            })();

                            if (actual === null && target === null && avg === null) return null;

                            const hasTarget = target !== null;
                            const hasActual = actual !== null;
                            const over      = hasTarget && hasActual && actual > target;
                            const under     = hasTarget && hasActual && actual < target;
                            const onTrack   = hasTarget && hasActual && actual <= target;
                            const saved     = hasTarget && hasActual ? target - actual : null;
                            const reference = target ?? avg ?? 0;
                            const barPct    = reference > 0 && hasActual ? Math.min(120, Math.round((actual / reference) * 100)) : 0;
                            const barColor  = over ? RED : onTrack ? '#059669' : catColor;

                            const feedback = (() => {
                                if (over && saved !== null)    return { text: `+$${Math.abs(Math.round(saved))} over target ▲`, color: RED };
                                if (under && saved !== null)   return { text: `−$${Math.round(saved)} under target`, color: '#059669' };
                                if (onTrack)                   return { text: 'on target', color: '#059669' };
                                if (!hasTarget && avg !== null && hasActual)
                                    return actual > avg * 1.15
                                        ? { text: `▲ $${Math.round(actual - avg)} above avg`, color: AMBER }
                                        : actual < avg * 0.85
                                            ? { text: `▼ $${Math.round(avg - actual)} below avg`, color: '#0f766e' }
                                            : { text: 'near avg', color: SLATE };
                                return null;
                            })();

                            return (
                                <Box key={row.label} sx={{ px: 1.75, pt: editMode ? 0.875 : 1, pb: 0.875, borderBottom: `0.5px solid ${alpha('#000', 0.05)}`, bgcolor: over ? 'rgba(226,75,74,0.038)' : onTrack ? 'rgba(5,150,105,0.018)' : 'transparent', '&:hover': { bgcolor: over ? 'rgba(226,75,74,0.055)' : alpha(MAROON, 0.018) }, transition: 'background .12s' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: NAVY, flex: 1, lineHeight: 1.2 }}>{row.label}</Typography>

                                        {/* Edit mode: type toggle */}
                                        {editMode && (
                                            <TypePill
                                                isFixed={getEffectiveType(row.label) === 'fixed'}
                                                onChange={isFixed => handleToggle(row.label, isFixed)}
                                            />
                                        )}

                                        {/* Target input — hidden in edit mode */}
                                        {!editMode && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>target</Typography>
                                                <Box
                                                    component="input" type="number"
                                                    value={target ?? ''}
                                                    placeholder={avg !== null ? String(avg) : '—'}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const v = parseFloat(e.target.value);
                                                        onSetTarget(periodIndex, row.label, isNaN(v) ? null : v);
                                                    }}
                                                    sx={{
                                                        width: 84, textAlign: 'right', fontSize: '0.82rem', fontWeight: 500,
                                                        color: hasTarget ? NAVY : SLATE,
                                                        border: `0.5px solid ${over ? alpha(RED, 0.4) : hasTarget ? alpha(MAROON, 0.3) : alpha('#000', 0.13)}`,
                                                        borderRadius: '5px', px: 0.875, py: 0.375,
                                                        bgcolor: over ? alpha(RED, 0.04) : hasTarget ? alpha(MAROON, 0.04) : alpha('#000', 0.02),
                                                        fontFamily: 'inherit',
                                                        '&:focus': { outline: `1.5px solid ${over ? RED : MAROON}`, borderColor: 'transparent' },
                                                        '&::placeholder': { color: alpha(SLATE, 0.4), fontStyle: 'italic', fontSize: '0.75rem' },
                                                        '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { opacity: 0 },
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        {/* Actual */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 68 }}>
                                            <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>actual</Typography>
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: over ? RED : onTrack ? '#059669' : NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                                {hasActual ? `$${fmt(actual)}` : '—'}
                                            </Typography>
                                        </Box>

                                        {/* Status badge — hidden in edit mode */}
                                        {!editMode && (
                                            <Box sx={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, bgcolor: over ? alpha(RED, 0.12) : onTrack ? alpha('#059669', 0.13) : alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography sx={{ fontSize: '0.7rem', lineHeight: 1, color: over ? RED : onTrack ? '#059669' : SLATE }}>
                                                    {over ? '▲' : onTrack ? '✓' : '–'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Progress bar + feedback — hidden in edit mode */}
                                    {!editMode && (hasActual || hasTarget) && (
                                        <Box sx={{ mt: 0.75, ml: '17px' }}>
                                            <Box sx={{ position: 'relative', height: 5, bgcolor: alpha('#000', 0.07), borderRadius: '3px', overflow: 'hidden', mb: 0.4 }}>
                                                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(barPct, 100)}%`, bgcolor: barColor, borderRadius: '3px', transition: 'width .25s' }} />
                                                {over && barPct > 100 && (
                                                    <Box sx={{ position: 'absolute', left: '100%', top: 0, bottom: 0, width: `${barPct - 100}%`, bgcolor: alpha(RED, 0.45), borderRadius: '0 3px 3px 0' }} />
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                {feedback && <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: feedback.color }}>{feedback.text}</Typography>}
                                                {avg !== null && <Typography sx={{ fontSize: '0.64rem', color: alpha(SLATE, 0.6), ml: 'auto' }}>avg ${fmtS(avg)}</Typography>}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </>
                )}
            </Box>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.75, py: 1, borderTop: `1px solid ${alpha(MAROON, 0.1)}` }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Income</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(income)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.75, py: 0.875, borderTop: `0.5px solid ${alpha('#000', 0.06)}` }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Total committed</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmtC(fixedTotal + varActual)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.75, py: 1, borderTop: `0.5px solid ${alpha(MAROON, 0.12)}`, bgcolor: '#fdfafa' }}>
                <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Period balance</Typography>
                    {varBudget > 0 && (
                        <Typography sx={{ fontSize: '0.67rem', color: SLATE, mt: 0.15 }}>
                            {varOver
                                ? `$${Math.abs(Math.round(varActual - varBudget))} over variable budget`
                                : `$${Math.abs(Math.round(varBudget - varActual))} under variable budget`}
                        </Typography>
                    )}
                </Box>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: balance !== null ? (balance >= 0 ? '#059669' : RED) : SLATE, fontVariantNumeric: 'tabular-nums' }}>
                    {balance !== null ? (balance >= 0 ? '+' : '') + `$${fmt(balance)}` : '—'}
                </Typography>
            </Box>
        </Box>
    );
};

export default PeriodDetailCard;

// // ── PeriodDetailCard.tsx ──────────────────────────────────────────────────────
// // Drop-in replacement for the PeriodDetailCard component inside PlanningView.tsx
// // Matches the screenshot exactly:
// //  • Maroon header: date range + income + period badge + ··· menu
// //  • 3-cell KPI strip: Fixed committed / Variable budget / Variable actual
// //  • FIXED EXPENSES section (locked badge, no target input, lock icon + subtext)
// //  • VARIABLE EXPENSES section (adjustable badge, over/under total)
// //  • Redesigned category rows: large target input + big actual + bar + feedback
// //  • Footer: Income / Total committed / Period balance (with sub-label)
// import React, { useMemo } from 'react';
// import { Box, Typography } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Lock } from '@mui/icons-material';
//
// // ── Re-use these from your shared constants ───────────────────────────────────
// import {
//     MAROON, NAVY, SLATE, GREEN, RED, fmt, fmtS,
// } from '../domain/SpreadsheetTypes';
// import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
//
// // ── Local tokens ─────────────────────────────────────────────────────────────
// const MAROON_DARK = '#4a1010';
// const AMBER       = '#d97706';
//
// // ── Category dot colors ───────────────────────────────────────────────────────
// const CAT_COLORS: Record<string, string> = {
//     Rent: '#1D9E75', Groceries: '#6b1a1a', Gas: '#BA7517',
//     Payments: '#7c3aed', Other: '#888780', Insurance: '#0ea5e9',
//     Utilities: '#f59e0b', Electric: '#6366f1', 'Gas Bill': '#ef4444',
//     Subscriptions: '#8b5cf6', Haircut: '#14b8a6', Savings: '#059669',
//     'Order out': '#D4537E', 'Dining out': '#D4537E', 'Other Stuff': '#888780',
//     'Coffee Supplies': '#ba7517', 'Phone Insurance': '#0ea5e9',
//     'Trip Cost': '#d97706', Golf: '#639922',
// };
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// type CategoryTargets = Record<string, number>;
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
// /** Format a Date as "Jan 15" */
// function fmtDate(d: Date): string {
//     return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
// }
//
// // ── Props ─────────────────────────────────────────────────────────────────────
// interface PeriodDetailCardProps {
//     template:    SpreadsheetTemplate;
//     periodIndex: number;
//     mode:        'manual' | 'auto';
//     targets:     CategoryTargets;
//     onSetTarget: (pi: number, label: string, val: number | null) => void;
// }
//
// // ── Component ─────────────────────────────────────────────────────────────────
// const PeriodDetailCard: React.FC<PeriodDetailCardProps> = ({
//                                                                template, periodIndex, mode, targets, onSetTarget,
//                                                            }) => {
//     const period  = template.periods[periodIndex] ?? '';
//     const type    = getPeriodType(template, periodIndex);
//
//     // Date range label from periodDates if available, fallback to period label
//     const dateRange = useMemo(() => {
//         const pd = (template as any).periodDates?.[periodIndex];
//         if (pd?.start && pd?.end) return `${fmtDate(pd.start)} – ${fmtDate(pd.end)}`;
//         return period;
//     }, [template, periodIndex, period]);
//
//     // Row splits
//     const allExpenseRows = template.rows.filter(r =>
//         r.rowType === 'expense' || r.rowType === 'fixed-expense'
//     );
//     // Fixed = rows tagged fixed-expense OR whose label matches known fixed categories
//     const FIXED_LABELS = new Set(['Rent', 'Payments', 'Insurance', 'Subscriptions']);
//     const fixedRows    = allExpenseRows.filter(r =>
//         r.rowType === 'fixed-expense' || FIXED_LABELS.has(r.label)
//     );
//     const variableRows = allExpenseRows.filter(r => !fixedRows.includes(r));
//
//     const salaryRow   = template.rows.find(r => r.rowType === 'salary');
//     const income      = salaryRow?.values[periodIndex] ?? null;
//
//     const fixedTotal  = fixedRows.reduce((s, r)    => s + (r.values[periodIndex] ?? 0), 0);
//     const varActual   = variableRows.reduce((s, r) => s + (r.values[periodIndex] ?? 0), 0);
//     const varBudget   = variableRows.reduce((s, r) => {
//         return s + (targets[`${periodIndex}-${r.label}`] ?? 0);
//     }, 0);
//     const totalSpend  = fixedTotal + varActual;
//     const balance     = income !== null ? income - totalSpend : null;
//     const varOver     = varBudget > 0 && varActual > varBudget;
//
//     // Period type labels / colors
//     const TYPE_LABELS = {
//         past: 'past period', present: 'current period',
//         'future-manual': 'planned period', 'future-auto': 'predicted period',
//     } as Record<string, string>;
//     const TYPE_TAG_BG = {
//         past: '#888780', present: '#8b1a1a',
//         'future-manual': '#85B7EB', 'future-auto': '#97C459',
//     } as Record<string, string>;
//     const TYPE_TAG_FG = {
//         past: '#fff', present: '#fff',
//         'future-manual': '#042C53', 'future-auto': '#173404',
//     } as Record<string, string>;
//
//     return (
//         <Box sx={{
//             borderRadius: '10px', overflow: 'hidden',
//             border: `1px solid ${alpha(MAROON, 0.18)}`, mt: 1.5,
//         }}>
//
//             {/* ── Header ───────────────────────────────────────────────────── */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 70%, #5a1515 100%)`,
//                 px: 1.75, py: 1.125,
//                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//             }}>
//                 <Box>
//                     <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
//                         {dateRange}
//                     </Typography>
//                     {income !== null && (
//                         <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>
//                             {fmtC(income)} Income
//                         </Typography>
//                     )}
//                 </Box>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                     <Box sx={{
//                         fontSize: '0.65rem', fontWeight: 700,
//                         px: 0.875, py: 0.3, borderRadius: '4px',
//                         bgcolor: TYPE_TAG_BG[type], color: TYPE_TAG_FG[type],
//                         whiteSpace: 'nowrap',
//                     }}>
//                         {TYPE_LABELS[type]}
//                     </Box>
//                     <Typography sx={{
//                         fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)',
//                         cursor: 'pointer', letterSpacing: '2px', lineHeight: 1,
//                         '&:hover': { color: '#fff' },
//                     }}>
//                         ···
//                     </Typography>
//                 </Box>
//             </Box>
//
//             {/* ── KPI strip ────────────────────────────────────────────────── */}
//             <Box sx={{
//                 display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
//                 borderBottom: `0.5px solid ${alpha('#000', 0.08)}`,
//             }}>
//                 {[
//                     { label: 'Fixed committed', val: fmtC(fixedTotal),  color: NAVY   },
//                     { label: 'Variable budget',  val: varBudget > 0 ? fmtC(varBudget) : '—', color: MAROON },
//                     { label: 'Variable actual',  val: fmtC(varActual),  color: varOver ? RED : varBudget > 0 ? '#059669' : NAVY },
//                 ].map((kpi, i) => (
//                     <Box key={i} sx={{
//                         px: 1.75, py: 1.125,
//                         borderRight: i < 2 ? `0.5px solid ${alpha('#000', 0.08)}` : 'none',
//                     }}>
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE, mb: 0.2 }}>{kpi.label}</Typography>
//                         <Typography sx={{
//                             fontSize: '1.2rem', fontWeight: 700,
//                             color: kpi.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
//                         }}>
//                             {kpi.val}
//                         </Typography>
//                     </Box>
//                 ))}
//             </Box>
//
//             {/* ── Scrollable body ───────────────────────────────────────────── */}
//             <Box sx={{
//                 maxHeight: 420, overflowY: 'auto',
//                 '&::-webkit-scrollbar': { width: 5 },
//                 '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
//                 '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: '3px' },
//                 '&::-webkit-scrollbar-thumb:hover': { bgcolor: alpha(MAROON, 0.38) },
//             }}>
//
//                 {/* ── FIXED EXPENSES section ───────────────────────────────── */}
//                 {fixedRows.length > 0 && (
//                     <>
//                         <Box sx={{
//                             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                             px: 1.75, py: 0.75,
//                             bgcolor: '#fafaf9',
//                             borderBottom: `0.5px solid ${alpha('#000', 0.07)}`,
//                         }}>
//                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
//                                 Fixed expenses
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Box sx={{
//                                     fontSize: '0.63rem', fontWeight: 600,
//                                     px: 0.75, py: 0.2, borderRadius: '4px',
//                                     bgcolor: '#e8e8e6', color: '#5f5e5a',
//                                 }}>
//                                     locked
//                                 </Box>
//                                 <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                     {fmtC(fixedTotal)}
//                                 </Typography>
//                             </Box>
//                         </Box>
//
//                         {fixedRows.map(row => {
//                             const actual   = row.values[periodIndex] ?? null;
//                             const catColor = CAT_COLORS[row.label] ?? SLATE;
//                             const subtext  = row.label === 'Rent' ? 'Fixed · matches committed amount' : 'Fixed · recurring subscription';
//
//                             return (
//                                 <Box key={row.label} sx={{
//                                     px: 1.75, py: 1,
//                                     borderBottom: `0.5px solid ${alpha('#000', 0.05)}`,
//                                     display: 'flex', alignItems: 'center', gap: 1,
//                                     '&:hover': { bgcolor: alpha(MAROON, 0.015) },
//                                 }}>
//                                     <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
//                                     <Box sx={{ flex: 1 }}>
//                                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY }}>
//                                             {row.label}
//                                         </Typography>
//                                         <Typography sx={{ fontSize: '0.67rem', color: SLATE }}>{subtext}</Typography>
//                                     </Box>
//                                     {/* Lock icon */}
//                                     <Lock sx={{ fontSize: '0.8rem', color: alpha(SLATE, 0.45), flexShrink: 0 }} />
//                                     {/* Actual */}
//                                     <Box sx={{ textAlign: 'right', minWidth: 72 }}>
//                                         <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                             {actual !== null ? `$${fmt(actual)}` : '—'}
//                                         </Typography>
//                                     </Box>
//                                     {/* Neutral status circle */}
//                                     <Box sx={{
//                                         width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
//                                         bgcolor: alpha('#000', 0.05),
//                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                     }}>
//                                         <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>—</Typography>
//                                     </Box>
//                                 </Box>
//                             );
//                         })}
//                     </>
//                 )}
//
//                 {/* ── VARIABLE EXPENSES section ─────────────────────────────── */}
//                 {variableRows.length > 0 && (
//                     <>
//                         <Box sx={{
//                             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                             px: 1.75, py: 0.75,
//                             bgcolor: '#fafaf9',
//                             borderBottom: `0.5px solid ${alpha('#000', 0.07)}`,
//                         }}>
//                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
//                                 Variable expenses
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Box sx={{
//                                     fontSize: '0.63rem', fontWeight: 600,
//                                     px: 0.75, py: 0.2, borderRadius: '4px',
//                                     bgcolor: '#deeeff', color: '#185fa5',
//                                 }}>
//                                     adjustable
//                                 </Box>
//                                 {varBudget > 0 && (
//                                     <Typography sx={{
//                                         fontSize: '0.79rem', fontWeight: 700,
//                                         color: varOver ? RED : '#059669',
//                                         fontVariantNumeric: 'tabular-nums',
//                                     }}>
//                                         {fmtC(varActual)} of {fmtC(varBudget)}
//                                     </Typography>
//                                 )}
//                             </Box>
//                         </Box>
//
//                         {variableRows.map(row => {
//                             const actual    = row.values[periodIndex] ?? null;
//                             const target    = targets[`${periodIndex}-${row.label}`] ?? null;
//                             const catColor  = CAT_COLORS[row.label] ?? SLATE;
//
//                             // Historical average (past non-future periods, excluding current)
//                             const avg = (() => {
//                                 const vals = row.values
//                                     .map((v, i) => ({ v, i }))
//                                     .filter(({ v, i }) => v !== null && v > 0 && !isPeriodFuture(template, i))
//                                     .map(({ v }) => v as number);
//                                 return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
//                             })();
//
//                             if (actual === null && target === null && avg === null) return null;
//
//                             const hasTarget = target !== null;
//                             const hasActual = actual !== null;
//                             const over      = hasTarget && hasActual && actual > target;
//                             const under     = hasTarget && hasActual && actual < target;
//                             const onTrack   = hasTarget && hasActual && actual <= target;
//                             const saved     = hasTarget && hasActual ? target - actual : null;
//
//                             // Progress bar
//                             const reference = target ?? avg ?? 0;
//                             const barPct    = reference > 0 && hasActual
//                                 ? Math.min(120, Math.round((actual / reference) * 100))
//                                 : 0;
//                             const barColor  = over ? RED : onTrack ? '#059669' : catColor;
//
//                             // Feedback text
//                             const feedback = (() => {
//                                 if (over && saved !== null)
//                                     return { text: `+$${Math.abs(Math.round(saved))} over target ▲`, color: RED };
//                                 if (under && saved !== null)
//                                     return { text: `−$${Math.round(saved)} under target`, color: '#059669' };
//                                 if (onTrack)
//                                     return { text: 'on target', color: '#059669' };
//                                 if (!hasTarget && avg !== null && hasActual)
//                                     return actual > avg * 1.15
//                                         ? { text: `▲ $${Math.round(actual - avg)} above avg`, color: AMBER }
//                                         : actual < avg * 0.85
//                                             ? { text: `▼ $${Math.round(avg - actual)} below avg`, color: '#0f766e' }
//                                             : { text: 'near avg', color: SLATE };
//                                 return null;
//                             })();
//
//                             const rowBg = over
//                                 ? 'rgba(226,75,74,0.038)'
//                                 : onTrack ? 'rgba(5,150,105,0.018)' : 'transparent';
//
//                             return (
//                                 <Box key={row.label} sx={{
//                                     px: 1.75, pt: 1, pb: 0.875,
//                                     borderBottom: `0.5px solid ${alpha('#000', 0.05)}`,
//                                     bgcolor: rowBg,
//                                     '&:hover': { bgcolor: over ? 'rgba(226,75,74,0.055)' : alpha(MAROON, 0.018) },
//                                     transition: 'background .12s',
//                                 }}>
//                                     {/* Top row */}
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                         {/* Dot */}
//                                         <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
//
//                                         {/* Name */}
//                                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: NAVY, flex: 1, lineHeight: 1.2 }}>
//                                             {row.label}
//                                         </Typography>
//
//                                         {/* Target input */}
//                                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 0.5 }}>
//                                             <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
//                                                 target
//                                             </Typography>
//                                             <Box
//                                                 component="input"
//                                                 type="number"
//                                                 value={target ?? ''}
//                                                 placeholder={avg !== null ? String(avg) : '—'}
//                                                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                                                     const v = parseFloat(e.target.value);
//                                                     onSetTarget(periodIndex, row.label, isNaN(v) ? null : v);
//                                                 }}
//                                                 sx={{
//                                                     width: 84, textAlign: 'right',
//                                                     fontSize: '0.82rem', fontWeight: 500,
//                                                     color: hasTarget ? NAVY : SLATE,
//                                                     border: `0.5px solid ${over ? alpha(RED, 0.4) : hasTarget ? alpha(MAROON, 0.3) : alpha('#000', 0.13)}`,
//                                                     borderRadius: '5px',
//                                                     px: 0.875, py: 0.375,
//                                                     bgcolor: over
//                                                         ? alpha(RED, 0.04)
//                                                         : hasTarget ? alpha(MAROON, 0.04) : alpha('#000', 0.02),
//                                                     fontFamily: 'inherit',
//                                                     '&:focus': { outline: `1.5px solid ${over ? RED : MAROON}`, borderColor: 'transparent' },
//                                                     '&::placeholder': { color: alpha(SLATE, 0.4), fontStyle: 'italic', fontSize: '0.75rem' },
//                                                     '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { opacity: 0 },
//                                                 }}
//                                             />
//                                         </Box>
//
//                                         {/* Actual */}
//                                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 68 }}>
//                                             <Typography sx={{ fontSize: '0.58rem', color: SLATE, mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
//                                                 actual
//                                             </Typography>
//                                             <Typography sx={{
//                                                 fontSize: '0.88rem', fontWeight: 700,
//                                                 color: over ? RED : onTrack ? '#059669' : NAVY,
//                                                 fontVariantNumeric: 'tabular-nums',
//                                             }}>
//                                                 {hasActual ? `$${fmt(actual)}` : '—'}
//                                             </Typography>
//                                         </Box>
//
//                                         {/* Status badge */}
//                                         <Box sx={{
//                                             width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
//                                             bgcolor: over ? alpha(RED, 0.12) : onTrack ? alpha('#059669', 0.13) : alpha('#000', 0.05),
//                                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                         }}>
//                                             <Typography sx={{ fontSize: '0.7rem', lineHeight: 1, color: over ? RED : onTrack ? '#059669' : SLATE }}>
//                                                 {over ? '▲' : onTrack ? '✓' : '–'}
//                                             </Typography>
//                                         </Box>
//                                     </Box>
//
//                                     {/* Progress bar + feedback */}
//                                     {(hasActual || hasTarget) && (
//                                         <Box sx={{ mt: 0.75, ml: '17px' }}>
//                                             <Box sx={{
//                                                 position: 'relative', height: 5,
//                                                 bgcolor: alpha('#000', 0.07), borderRadius: '3px',
//                                                 overflow: 'hidden', mb: 0.4,
//                                             }}>
//                                                 {/* Actual fill */}
//                                                 <Box sx={{
//                                                     position: 'absolute', left: 0, top: 0, bottom: 0,
//                                                     width: `${Math.min(barPct, 100)}%`,
//                                                     bgcolor: barColor, borderRadius: '3px',
//                                                     transition: 'width .25s',
//                                                 }} />
//                                                 {/* Overflow when over target */}
//                                                 {over && barPct > 100 && (
//                                                     <Box sx={{
//                                                         position: 'absolute', left: '100%', top: 0, bottom: 0,
//                                                         width: `${barPct - 100}%`,
//                                                         bgcolor: alpha(RED, 0.45),
//                                                         borderRadius: '0 3px 3px 0',
//                                                     }} />
//                                                 )}
//                                             </Box>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                                 {feedback && (
//                                                     <Typography sx={{ fontSize: '0.68rem', fontWeight: 500, color: feedback.color }}>
//                                                         {feedback.text}
//                                                     </Typography>
//                                                 )}
//                                                 {avg !== null && (
//                                                     <Typography sx={{ fontSize: '0.64rem', color: alpha(SLATE, 0.6), ml: 'auto' }}>
//                                                         avg ${fmtS(avg)}
//                                                     </Typography>
//                                                 )}
//                                             </Box>
//                                         </Box>
//                                     )}
//                                 </Box>
//                             );
//                         })}
//                     </>
//                 )}
//             </Box>
//
//             {/* ── Footer ───────────────────────────────────────────────────── */}
//             {/* Income */}
//             <Box sx={{
//                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                 px: 1.75, py: 1,
//                 borderTop: `1px solid ${alpha(MAROON, 0.1)}`,
//             }}>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Income</Typography>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                     {fmtC(income)}
//                 </Typography>
//             </Box>
//
//             {/* Total committed */}
//             <Box sx={{
//                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                 px: 1.75, py: 0.875,
//                 borderTop: `0.5px solid ${alpha('#000', 0.06)}`,
//             }}>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Total committed</Typography>
//                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                     {fmtC(fixedTotal + varActual)}
//                 </Typography>
//             </Box>
//
//             {/* Period balance */}
//             <Box sx={{
//                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                 px: 1.75, py: 1,
//                 borderTop: `0.5px solid ${alpha(MAROON, 0.12)}`,
//                 bgcolor: '#fdfafa',
//             }}>
//                 <Box>
//                     <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>Period balance</Typography>
//                     {varBudget > 0 && (
//                         <Typography sx={{ fontSize: '0.67rem', color: SLATE, mt: 0.15 }}>
//                             {varOver
//                                 ? `$${Math.abs(Math.round(varActual - varBudget))} over variable budget`
//                                 : `$${Math.abs(Math.round(varBudget - varActual))} under variable budget`}
//                         </Typography>
//                     )}
//                 </Box>
//                 <Typography sx={{
//                     fontSize: '1.05rem', fontWeight: 700,
//                     color: balance !== null ? (balance >= 0 ? '#059669' : RED) : SLATE,
//                     fontVariantNumeric: 'tabular-nums',
//                 }}>
//                     {balance !== null
//                         ? (balance >= 0 ? '+' : '') + `$${fmt(balance)}`
//                         : '—'}
//                 </Typography>
//             </Box>
//         </Box>
//     );
// };
//
// export default PeriodDetailCard;