// ── FuturePointerDialog.tsx ───────────────────────────────────────────────────
// Moves the template's future pointer.
//   1. Shows where the pointer is now and asks how far ahead (amount + unit) to move it.
//   2. Next → GET /budget-planner/date-range-lookup, with a circular spinner while it runs.
//   3. Ranges found  → shows them; user confirms the move.
//      Nothing found → asks the user to confirm creating ranges up to the new pointer.
//      (Partial coverage is treated the same way: confirm creating the missing ranges.)
import React, { useMemo, useRef, useState } from 'react';
import {
    Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MAROON, NAVY, SLATE } from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';
import type { Period } from '../config/Types';
import BudgetPlannerService from '../services/BudgetPlannerService';

const MAROON_DARK = '#4a1010';
const AMBER = '#b45309';

// ── Types ────────────────────────────────────────────────────────────────────
export type AheadUnit = 'WEEKS' | 'MONTHS';
type BackendDate = string | number[] | Date;   // "2026-10-01", [2026, 10, 1] or Date

export interface FuturePointerLookupRequest {
    ahead: number;
    units: AheadUnit;
    currentDate: Date | string;     // the pointer's current position (today if it isn't set)
    templateDetailId: number;
}

// What GET /budget-planner/date-range-lookup returns.
export interface LookupDateRange { startDate: BackendDate; endDate: BackendDate }
export type FuturePointerLookupResult = LookupDateRange[];

export interface SetFuturePointerRequest extends FuturePointerLookupRequest {
    // true when the lookup found no (or not enough) ranges and the user confirmed creating them
    createRanges: boolean;
}

interface Props {
    open: boolean;
    template: SpreadsheetTemplate;
    templateDetailId?: number;
    period?: Period;                    // unused; kept so existing callers still compile
    currentPointer?: BackendDate | null; // where the pointer is now; defaults to the template's last period end
    onClose: () => void;
    // Optional overrides. When not passed, the dialog calls BudgetPlannerService directly.
    onLookup?: (request: FuturePointerLookupRequest) => Promise<FuturePointerLookupResult>;
    onSubmit?: (request: SetFuturePointerRequest) => Promise<unknown> | void;
}

type Phase = 'form' | 'loading' | 'result' | 'saving';

// ── Helpers ──────────────────────────────────────────────────────────────────
const toDate = (d: BackendDate | null | undefined): Date | null => {
    if (d == null) return null;
    if (d instanceof Date) return d;
    if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
    const [y, m, day] = String(d).slice(0, 10).split('-').map(Number);
    return y && m && day ? new Date(y, m - 1, day) : null;
};
const fmtDate = (d: BackendDate | null | undefined) =>
    toDate(d)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—';
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addAhead = (from: Date, n: number, unit: AheadUnit) => {
    const d = new Date(from);
    if (unit === 'WEEKS') d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    return d;
};
const errorMessage = (err: any, fallback: string): string => {
    const data = err?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    return fallback;
};

const btnSx = { bgcolor: MAROON, textTransform: 'none', fontWeight: 700, borderRadius: '7px', '&:hover': { bgcolor: MAROON_DARK } } as const;

const PointerRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
    <Box sx={{ flex: 1, p: 1.25, borderRadius: '8px', border: `1px solid ${alpha(accent ? MAROON : '#000', accent ? 0.3 : 0.1)}`, bgcolor: accent ? alpha(MAROON, 0.04) : '#fff' }}>
        <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: accent ? MAROON : NAVY, mt: 0.25 }}>{value}</Typography>
    </Box>
);

// ── Dialog ───────────────────────────────────────────────────────────────────
const FuturePointerDialog: React.FC<Props> = ({
                                                  open, template, templateDetailId: detailIdProp, currentPointer: pointerProp, onClose, onLookup, onSubmit,
                                              }) => {
    const service = BudgetPlannerService.getInstance();
    const templateDetailId: number | undefined = detailIdProp ?? (template as any).templateDetailId;

    // Current pointer: prop wins, otherwise the end of the template's last period.
    const currentPointer = useMemo<Date | null>(() => {
        if (pointerProp !== undefined) return toDate(pointerProp);
        const pd: { start: Date; end: Date }[] = (template as any).periodDates ?? [];
        if (!pd.length) return null;
        return pd.reduce((max, p) => (p.end > max ? p.end : max), pd[0].end);
    }, [pointerProp, template]);

    const [phase, setPhase]   = useState<Phase>('form');
    const [ahead, setAhead]   = useState('1');
    const [unit, setUnit]     = useState<AheadUnit>('MONTHS');
    const [error, setError]   = useState<string | null>(null);
    const [ranges, setRanges] = useState<LookupDateRange[]>([]);
    const requestId = useRef(0);

    const aheadNum  = Math.floor(Number(ahead));
    const baseDate  = startOfDay(currentPointer ?? new Date());
    const target    = aheadNum > 0 ? addAhead(baseDate, aheadNum, unit) : null;
    const unitLabel = `${aheadNum} ${unit === 'WEEKS' ? 'week' : 'month'}${aheadNum === 1 ? '' : 's'}`;

    const lastFoundEnd = ranges.length
        ? ranges.map(r => toDate(r.endDate)).filter((d): d is Date => !!d).reduce((a, b) => (b > a ? b : a))
        : null;
    // Ranges "cover" the target if the last one ends within a day of it.
    const covered   = !!(lastFoundEnd && target && lastFoundEnd.getTime() >= target.getTime() - 86_400_000);
    const mustCreate = !covered;

    const request = (): FuturePointerLookupRequest => ({
        ahead: aheadNum,
        units: unit,
        currentDate: baseDate,
        templateDetailId: templateDetailId!,
    });

    const reset = () => {
        requestId.current++;
        setPhase('form'); setAhead('1'); setUnit('MONTHS'); setError(null); setRanges([]);
    };
    const handleClose = () => { if (phase === 'saving') return; reset(); onClose(); };

    const handleLookup = async () => {
        if (templateDetailId == null) {
            setError('This template has no template detail id yet, so the future pointer can’t be moved.');
            return;
        }
        const id = ++requestId.current;
        setPhase('loading'); setError(null);
        try {
            const req = request();
            const res = onLookup ? await onLookup(req) : await service.lookupFuturePointer(req);
            if (id !== requestId.current) return;
            setRanges(Array.isArray(res) ? res : []);
            setPhase('result');
        } catch (err) {
            if (id !== requestId.current) return;
            setError(errorMessage(err, 'Couldn’t check for date ranges. Try again.'));
            setPhase('form');
        }
    };

    const handleConfirm = async () => {
        setPhase('saving'); setError(null);
        try {
            const req: SetFuturePointerRequest = { ...request(), createRanges: mustCreate };
            if (onSubmit) await onSubmit(req);
            else await service.setFuturePointer(req);
            reset(); onClose();
        } catch (err) {
            setError(errorMessage(err, mustCreate ? 'Couldn’t create the date ranges. Try again.' : 'Couldn’t move the future pointer. Try again.'));
            setPhase('result');
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>Move future pointer</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem', borderRadius: '8px' }}>{error}</Alert>}

                {/* Current → new pointer, visible in every phase */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                    <PointerRow label="Currently set to" value={currentPointer ? fmtDate(currentPointer) : 'Not set yet'} />
                    <Typography sx={{ color: SLATE, fontSize: '1.1rem' }}>→</Typography>
                    <PointerRow label="New pointer" value={target ? fmtDate(target) : '—'} accent />
                </Box>

                {/* ── Form ── */}
                {phase === 'form' && (
                    <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: SLATE, mb: 2, lineHeight: 1.5 }}>
                            How far ahead do you want to move the pointer from {currentPointer ? 'where it is now' : 'today'}?
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TextField
                                label="Ahead" type="number" size="small"
                                value={ahead} onChange={e => setAhead(e.target.value)}
                                inputProps={{ min: 1, step: 1 }} sx={{ width: 120 }}
                                error={ahead !== '' && aheadNum <= 0}
                            />
                            <TextField
                                label="Unit" select size="small"
                                value={unit} onChange={e => setUnit(e.target.value as AheadUnit)} sx={{ width: 160 }}
                            >
                                <MenuItem value="WEEKS">Weeks</MenuItem>
                                <MenuItem value="MONTHS">Months</MenuItem>
                            </TextField>
                        </Box>
                    </Box>
                )}

                {/* ── Loading ── */}
                {phase === 'loading' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 3 }}>
                        <CircularProgress size={36} thickness={3.5} sx={{ color: MAROON }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: MAROON }}>
                            Looking for date ranges up to {target ? fmtDate(target) : 'the new pointer'}…
                        </Typography>
                    </Box>
                )}

                {/* ── Result ── */}
                {(phase === 'result' || phase === 'saving') && (
                    <Box>
                        {covered ? (
                            <Typography sx={{ fontSize: '0.8rem', color: SLATE, mb: 1.5, lineHeight: 1.5 }}>
                                Found {ranges.length} date range{ranges.length === 1 ? '' : 's'} up to {fmtDate(target)}.
                                Move the pointer there?
                            </Typography>
                        ) : (
                            <Box sx={{ p: 1.5, mb: 1.5, borderRadius: '8px', bgcolor: alpha(AMBER, 0.07), border: `1px solid ${alpha(AMBER, 0.25)}` }}>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: AMBER, mb: 0.5 }}>
                                    {ranges.length ? 'Some date ranges are missing' : 'No date ranges found'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: NAVY, lineHeight: 1.5 }}>
                                    {ranges.length
                                        ? `Existing ranges only go up to ${fmtDate(lastFoundEnd)}. `
                                        : `Nothing exists yet for the next ${unitLabel}. `}
                                    Do you want to create {ranges.length ? 'the missing' : 'new'} date ranges up to {fmtDate(target)} and move the pointer there?
                                </Typography>
                            </Box>
                        )}

                        {ranges.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 140, overflowY: 'auto' }}>
                                {ranges.map((r, i) => (
                                    <Box key={i} sx={{ fontSize: '0.72rem', fontWeight: 600, color: NAVY, px: 1, py: 0.25, borderRadius: '5px', bgcolor: alpha(NAVY, 0.06) }}>
                                        {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                <Button
                    disabled={phase === 'saving'}
                    onClick={phase === 'form' ? handleClose : () => { requestId.current++; setPhase('form'); setError(null); }}
                    sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}
                >
                    {phase === 'form' ? 'Cancel' : 'Back'}
                </Button>

                {phase === 'form' && (
                    <Button onClick={handleLookup} variant="contained" disabled={aheadNum <= 0} sx={btnSx}>Next</Button>
                )}
                {(phase === 'result' || phase === 'saving') && (
                    <Button onClick={handleConfirm} variant="contained" disabled={phase === 'saving'} sx={btnSx}
                            startIcon={phase === 'saving' ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : undefined}>
                        {phase === 'saving'
                            ? (mustCreate ? 'Creating…' : 'Moving…')
                            : (mustCreate ? 'Create ranges & move pointer' : 'Move pointer')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default FuturePointerDialog;