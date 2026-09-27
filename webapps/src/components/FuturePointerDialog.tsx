// ── FuturePointerDialog.tsx ───────────────────────────────────────────────────
// Three-step flow:
//   1. Horizon — how many weeks/months ahead is the user willing to look?
//   2. Pick date range(s) — a checklist of the template's OWN future period
//      columns (template.periodDates / template.periods) that fall within that
//      horizon. These are real, already-defined columns, not newly invented ones.
//   3. Mode — AUTO (backend predicts each selected range) or MANUAL (user enters
//      one shared set of planned/actual/budgeted figures, applied to every
//      range they selected in step 2 — see the note on that assumption below).
//
// This still doesn't call the backend directly — it builds a
// SetFuturePointerRequest and hands it to onSubmit, same as before.
import React, { useMemo, useState } from 'react';
import {
    Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Table, TableBody, TableCell, TableHead, TableRow,
    Checkbox, MenuItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MAROON, NAVY, SLATE } from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate } from '../domain/SpreadsheetTypes';

const MAROON_DARK = '#4a1010';

export type FuturePointerMode = 'AUTO' | 'MANUAL';
export type HorizonUnit = 'weeks' | 'months';

export interface FutureCategoryInput {
    name: string;
    plannedAmount: number | null;
    actual: number | null;
    budgeted: number | null;
}

export interface SetFuturePointerRequest {
    templateDetailId: number;
    // One or more of the template's own existing future periods, picked in step 2.
    dateRanges: { startDate: string; endDate: string }[];
    mode: FuturePointerMode;
    // MANUAL only — applied identically to every range in dateRanges above.
    categories?: FutureCategoryInput[];
}

interface Props {
    open: boolean;
    template: SpreadsheetTemplate;
    templateDetailId: number;
    onClose: () => void;
    onSubmit: (request: SetFuturePointerRequest) => void;
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const ModePill: React.FC<{ active: FuturePointerMode; onChange: (m: FuturePointerMode) => void }> = ({ active, onChange }) => (
    <Box sx={{ display: 'flex', border: `1px solid ${alpha('#000', 0.15)}`, borderRadius: '6px', overflow: 'hidden', bgcolor: '#fff' }}>
        {(['AUTO', 'MANUAL'] as FuturePointerMode[]).map(m => (
            <Box key={m} onClick={() => onChange(m)} sx={{
                px: 2, py: 0.75, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                bgcolor: active === m ? MAROON : '#fff', color: active === m ? '#fff' : '#555',
                transition: 'all .15s',
                '&:hover': active !== m ? { bgcolor: alpha(MAROON, 0.06), color: MAROON } : {},
                userSelect: 'none',
            }}>
                {m === 'AUTO' ? 'Auto-predict' : 'Manual entry'}
            </Box>
        ))}
    </Box>
);

const StepDots: React.FC<{ step: 1 | 2 | 3 }> = ({ step }) => (
    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', mb: 2.5 }}>
        {[1, 2, 3].map(n => (
            <Box key={n} sx={{
                width: n === step ? 20 : 7, height: 7, borderRadius: '4px',
                bgcolor: n <= step ? MAROON : alpha('#000', 0.12),
                transition: 'all .18s',
            }} />
        ))}
    </Box>
);

const FuturePointerDialog: React.FC<Props> = ({ open, template, templateDetailId, onClose, onSubmit }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // ── Step 1: horizon ──────────────────────────────────────────────────────
    const [horizonCount, setHorizonCount] = useState('4');
    const [horizonUnit, setHorizonUnit] = useState<HorizonUnit>('weeks');

    // ── Step 2: which of the template's OWN future columns qualify ─────────
    const candidateRanges = useMemo(() => {
        const count = Number(horizonCount);
        if (!count || count <= 0) return [];
        const now = new Date();
        const cutoff = new Date(now);
        if (horizonUnit === 'weeks') cutoff.setDate(cutoff.getDate() + count * 7);
        else cutoff.setMonth(cutoff.getMonth() + count);

        const pd = template.periodDates ?? [];
        return pd
            .map((range, i) => ({ index: i, label: template.periods[i] ?? `Period ${i + 1}`, start: range.start, end: range.end }))
            .filter(r => r.start > now && r.start <= cutoff);
    }, [template, horizonCount, horizonUnit]);

    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const toggleRange = (i: number) => setSelectedIndices(prev => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i); else next.add(i);
        return next;
    });

    // ── Step 3: mode ─────────────────────────────────────────────────────────
    const [mode, setMode] = useState<FuturePointerMode>('AUTO');
    const editableRows = template.rows.filter(r => r.rowType === 'salary' || r.rowType === 'expense');
    const [manualValues, setManualValues] = useState<Record<string, { planned: string; actual: string; budgeted: string }>>(
        () => Object.fromEntries(editableRows.map(r => [r.label, { planned: '', actual: '', budgeted: '' }]))
    );
    const setField = (label: string, field: 'planned' | 'actual' | 'budgeted', value: string) => {
        setManualValues(prev => ({ ...prev, [label]: { ...prev[label], [field]: value } }));
    };
    const parseOrNull = (s: string): number | null => (s === '' ? null : (isNaN(Number(s)) ? null : Number(s)));

    const resetAll = () => {
        setStep(1);
        setHorizonCount('4');
        setHorizonUnit('weeks');
        setSelectedIndices(new Set());
        setMode('AUTO');
        setManualValues(Object.fromEntries(editableRows.map(r => [r.label, { planned: '', actual: '', budgeted: '' }])));
    };
    const handleClose = () => { resetAll(); onClose(); };

    const canProceedStep1 = Number(horizonCount) > 0;
    const canProceedStep2 = selectedIndices.size > 0;
    const canSubmit = mode === 'AUTO'
        ? true
        : editableRows.some(r => {
            const v = manualValues[r.label];
            return v.planned !== '' || v.actual !== '' || v.budgeted !== '';
        });

    const submit = () => {
        if (!canSubmit || selectedIndices.size === 0) return;
        const dateRanges = Array.from(selectedIndices)
            .sort((a, b) => a - b)
            .map(i => candidateRanges.find(r => r.index === i)!)
            .map(r => ({ startDate: toISODate(r.start), endDate: toISODate(r.end) }));

        const request: SetFuturePointerRequest = {
            templateDetailId,
            dateRanges,
            mode,
            ...(mode === 'MANUAL' ? {
                categories: editableRows.map(r => ({
                    name: r.label,
                    plannedAmount: parseOrNull(manualValues[r.label].planned),
                    actual: parseOrNull(manualValues[r.label].actual),
                    budgeted: parseOrNull(manualValues[r.label].budgeted),
                })),
            } : {}),
        };
        onSubmit(request);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 0.5 }}>Manage future pointer</DialogTitle>
            <DialogContent>
                <StepDots step={step} />

                {/* ── Step 1: horizon ── */}
                {step === 1 && (
                    <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: SLATE, mb: 2, lineHeight: 1.5 }}>
                            How far ahead do you want to look? This filters which of your template's existing
                            future periods you'll be able to pick from next.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <TextField
                                label="Ahead" type="number" size="small"
                                value={horizonCount} onChange={e => setHorizonCount(e.target.value)}
                                inputProps={{ min: 1 }}
                                sx={{ width: 120 }}
                            />
                            <TextField
                                label="Unit" select size="small"
                                value={horizonUnit} onChange={e => setHorizonUnit(e.target.value as HorizonUnit)}
                                sx={{ width: 160 }}
                            >
                                <MenuItem value="weeks">Weeks</MenuItem>
                                <MenuItem value="months">Months</MenuItem>
                            </TextField>
                        </Box>
                    </Box>
                )}

                {/* ── Step 2: pick date range(s) ── */}
                {step === 2 && (
                    <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: SLATE, mb: 2, lineHeight: 1.5 }}>
                            {candidateRanges.length === 0
                                ? "No existing future periods fall within that window — go back and widen the horizon, or add more periods to the template first."
                                : `Select one or more of your template's future periods within the next ${horizonCount} ${horizonUnit}.`}
                        </Typography>
                        {candidateRanges.length > 0 && (
                            <Box sx={{ border: `1px solid ${alpha('#000', 0.1)}`, borderRadius: '8px', maxHeight: 280, overflowY: 'auto' }}>
                                <Table size="small">
                                    <TableBody>
                                        {candidateRanges.map(r => (
                                            <TableRow
                                                key={r.index}
                                                hover
                                                onClick={() => toggleRange(r.index)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox size="small" checked={selectedIndices.has(r.index)} />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.label}</TableCell>
                                                <TableCell sx={{ fontSize: '0.76rem', color: SLATE }} align="right">
                                                    {r.start.toLocaleDateString()} – {r.end.toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── Step 3: mode ── */}
                {step === 3 && (
                    <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: SLATE, mb: 2, lineHeight: 1.5 }}>
                            {selectedIndices.size === 1
                                ? '1 period selected.'
                                : `${selectedIndices.size} periods selected.`} How should their categories be filled in?
                        </Typography>
                        <ModePill active={mode} onChange={setMode} />

                        {mode === 'AUTO' ? (
                            <Typography sx={{ fontSize: '0.75rem', color: SLATE, mt: 2, lineHeight: 1.5 }}>
                                The backend will predict BPCategory values for each of the {selectedIndices.size} selected
                                period{selectedIndices.size !== 1 ? 's' : ''} independently, using the same weighted-recent-periods
                                model the Forecast panel already uses.
                            </Typography>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: SLATE, mb: 1.5, lineHeight: 1.5 }}>
                                    These figures are entered once and applied identically to every period you selected —
                                    leave a field blank to omit it for all of them.
                                </Typography>
                                <Box sx={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${alpha('#000', 0.1)}`, borderRadius: '8px' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#fdf8f8' }}>
                                                <TableCell sx={{ fontSize: '0.68rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase' }}>Category</TableCell>
                                                <TableCell sx={{ fontSize: '0.68rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase' }} align="right">Planned</TableCell>
                                                <TableCell sx={{ fontSize: '0.68rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase' }} align="right">Actual</TableCell>
                                                <TableCell sx={{ fontSize: '0.68rem', fontWeight: 700, color: MAROON, textTransform: 'uppercase' }} align="right">Budgeted</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {editableRows.map(r => (
                                                <TableRow key={r.label}>
                                                    <TableCell sx={{ fontSize: '0.78rem', fontWeight: 500 }}>{r.label}</TableCell>
                                                    {(['planned', 'actual', 'budgeted'] as const).map(field => (
                                                        <TableCell key={field} align="right" sx={{ p: 0.5 }}>
                                                            <Box component="input" type="number" placeholder="—"
                                                                 value={manualValues[r.label][field]}
                                                                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField(r.label, field, e.target.value)}
                                                                 sx={{
                                                                     width: 90, textAlign: 'right', border: `1px solid ${alpha('#000', 0.15)}`,
                                                                     borderRadius: '5px', px: 0.75, py: 0.5, fontSize: '0.78rem', fontFamily: 'inherit',
                                                                     '&:focus': { outline: `1.5px solid ${MAROON}` },
                                                                 }} />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                <Button onClick={step === 1 ? handleClose : () => setStep(s => (s - 1) as 1 | 2 | 3)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>
                    {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                {step < 3 ? (
                    <Button
                        onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                        variant="contained"
                        disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                        sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 700, borderRadius: '7px', '&:hover': { bgcolor: MAROON_DARK } }}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        onClick={submit} variant="contained" disabled={!canSubmit}
                        sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 700, borderRadius: '7px', '&:hover': { bgcolor: MAROON_DARK } }}
                    >
                        Set future pointer
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default FuturePointerDialog;