// ── CsvImportDialog.tsx ───────────────────────────────────────────────────────
// Step 1: pick a CSV + choose "Import as-is" or "Configure template settings".
// Step 2 (configure only): name, periods, header/label column, columns, row types.
import React, { useMemo, useRef, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Chip, Switch,
    FormControlLabel, Alert, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { UploadFile, InsertDriveFile, Bolt, Tune } from '@mui/icons-material';

import { MAROON, MAROON_DARK, NAVY, SLATE, TEAL } from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, PeriodType } from '../domain/SpreadsheetTypes';
import {
    parseCsv, gridWidth, initialConfig, deriveStructure, buildTemplate,
} from '../utils/CsvImport';
import type { ImportConfig, ImportRowType } from '../utils/CsvImport';

type Mode = 'asIs' | 'configure';
type Step = 'choose' | 'configure';

const PERIOD_TYPES: PeriodType[] = ['Weekly', 'Biweekly', 'Monthly', '2-Monthly', '3-Monthly'];
const ROW_TYPE_OPTIONS: { value: ImportRowType; label: string }[] = [
    { value: 'expense',  label: 'Expense category' },
    { value: 'salary',   label: 'Income / salary' },
    { value: 'expenses', label: 'Expenses total' },
    { value: 'balance',  label: 'Remaining balance' },
    { value: 'skip',     label: "Don't import" },
];
const MAX_BYTES = 5 * 1024 * 1024;

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '7px', fontSize: '0.84rem' } };
const labelSx = { fontSize: '0.72rem', fontWeight: 700, color: SLATE, mb: 0.75 };

// ── Choice card ───────────────────────────────────────────────────────────────
const ChoiceCard: React.FC<{
    selected: boolean; onSelect: () => void;
    icon: React.ReactNode; title: string; body: string;
}> = ({ selected, onSelect, icon, title, body }) => (
    <Box
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
        sx={{
            flex: 1, p: 1.75, borderRadius: '10px', cursor: 'pointer',
            border: '1.5px solid', borderColor: selected ? MAROON : alpha('#000', 0.12),
            bgcolor: selected ? alpha(MAROON, 0.04) : '#fff',
            transition: 'border-color .15s, background-color .15s',
            '&:hover': { borderColor: selected ? MAROON : alpha(MAROON, 0.45) },
            '&:focus-visible': { outline: `2px solid ${alpha(MAROON, 0.5)}`, outlineOffset: 2 },
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Box sx={{ color: selected ? MAROON : SLATE, display: 'flex' }}>{icon}</Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: NAVY }}>{title}</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.78rem', color: SLATE, lineHeight: 1.5 }}>{body}</Typography>
    </Box>
);

// ── Dialog ────────────────────────────────────────────────────────────────────
export interface CsvImportDialogProps {
    open: boolean;
    onClose: () => void;
    onImport: (template: SpreadsheetTemplate) => void;
}

const BPCsvImportDialog: React.FC<CsvImportDialogProps> = ({ open, onClose, onImport }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [step, setStep]         = useState<Step>('choose');
    const [mode, setMode]         = useState<Mode>('asIs');
    const [fileName, setFileName] = useState('');
    const [config, setConfig]     = useState<ImportConfig | null>(null);
    const [error, setError]       = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const reset = () => {
        setStep('choose'); setMode('asIs'); setFileName('');
        setConfig(null); setError(null); setDragOver(false);
    };
    const handleClose = () => { reset(); onClose(); };

    const loadFile = async (file: File) => {
        setError(null);
        if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
            setError('That file isn’t a CSV. Choose a file ending in .csv.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setError('That file is larger than 5 MB. Split it into smaller files and import them separately.');
            return;
        }
        try {
            const grid = parseCsv(await file.text());
            if (!grid.length || gridWidth(grid) < 2) {
                throw new Error('The file needs a category column and at least one amount column.');
            }
            const cfg = initialConfig(grid, file.name);
            if (!cfg.valueCols.length) throw new Error('No columns with amounts were found in this file.');
            setFileName(file.name);
            setConfig(cfg);
        } catch (e: any) {
            setFileName(''); setConfig(null);
            setError(e?.message ?? 'The file couldn’t be read. Check that it’s a valid CSV and try again.');
        }
    };

    const update = (patch: Partial<ImportConfig>) => setConfig(c => (c ? { ...c, ...patch } : c));
    const setStructure = (hasHeader: boolean, labelCol: number) =>
        setConfig(c => (c ? { ...c, hasHeader, labelCol, ...deriveStructure(c.grid, hasHeader, labelCol) } : c));

    const preview = useMemo(() => {
        if (!config) return null;
        try { return buildTemplate(config); } catch { return null; }
    }, [config]);

    const width    = config ? gridWidth(config.grid) : 0;
    const dataRows = config ? (config.hasHeader ? config.grid.slice(1) : config.grid) : [];
    const colName  = (i: number) => (config?.hasHeader && config.grid[0][i]?.trim()) || `Column ${i + 1}`;

    const summary = useMemo(() => {
        if (!preview) return null;
        const cats = preview.rows.filter(r => r.rowType === 'expense').length;
        const n = preview.periods.length;
        const pd = preview.periodDates;
        const range = pd?.length
            ? `, ${pd[0].start.toLocaleDateString()} to ${pd[pd.length - 1].end.toLocaleDateString()}`
            : '';
        return `${cats} categor${cats === 1 ? 'y' : 'ies'} and ${n} ${String(preview.periodType).toLowerCase()} period${n === 1 ? '' : 's'}${range}`;
    }, [preview]);

    const canImport = !!preview && preview.periods.length > 0 && !!config?.name.trim();

    const handleImport = () => {
        if (!config) return;
        try {
            onImport(buildTemplate(config));
            handleClose();
        } catch (e: any) {
            setError(e?.message ?? 'The template couldn’t be created from this file.');
        }
    };

    // ── Step 1 ────────────────────────────────────────────────────────────────
    const renderChoose = () => (
        <>
            <Typography sx={{ fontSize: '0.82rem', color: SLATE, mb: 2 }}>
                Choose a CSV with one row per category and one column per period.
            </Typography>

            <input
                ref={inputRef} type="file" accept=".csv,text/csv" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }}
            />
            <Box
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 2, cursor: 'pointer',
                    borderRadius: '10px', border: '1.5px dashed',
                    borderColor: dragOver ? MAROON : alpha('#000', 0.18),
                    bgcolor: dragOver ? alpha(MAROON, 0.04) : alpha('#000', 0.015),
                    transition: 'border-color .15s, background-color .15s',
                    '&:hover': { borderColor: alpha(MAROON, 0.5) },
                }}
            >
                {config ? <InsertDriveFile sx={{ color: TEAL }} /> : <UploadFile sx={{ color: SLATE }} />}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontSize: '0.86rem', fontWeight: 600, color: NAVY }}>
                        {config ? fileName : 'Drop a CSV here or click to browse'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.74rem', color: SLATE }}>
                        {config ? `${config.grid.length} rows, ${width} columns` : 'Up to 5 MB'}
                    </Typography>
                </Box>
                {config && <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: MAROON }}>Replace</Typography>}
            </Box>

            {config && (
                <Box sx={{ mb: 2.5, border: `1px solid ${alpha('#000', 0.08)}`, borderRadius: '8px', overflow: 'auto', maxHeight: 180 }}>
                    <Table size="small">
                        <TableBody>
                            {config.grid.slice(0, 6).map((r, ri) => (
                                <TableRow key={ri} sx={ri === 0 && config.hasHeader ? { bgcolor: alpha(NAVY, 0.04) } : undefined}>
                                    {r.slice(0, 7).map((c, ci) => (
                                        <TableCell key={ci} sx={{
                                            fontSize: '0.74rem', py: 0.5, whiteSpace: 'nowrap', maxWidth: 140,
                                            overflow: 'hidden', textOverflow: 'ellipsis',
                                            fontWeight: ri === 0 && config.hasHeader ? 700 : 400,
                                            color: ri === 0 && config.hasHeader ? NAVY : '#333',
                                        }}>{c}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}

            <Typography sx={labelSx}>How do you want to import it?</Typography>
            <Box role="radiogroup" sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                <ChoiceCard
                    selected={mode === 'asIs'} onSelect={() => setMode('asIs')}
                    icon={<Bolt fontSize="small" />} title="Import as-is"
                    body="Use the file's layout directly. The first row becomes periods, the category column becomes rows, and dates and income rows are detected automatically."
                />
                <ChoiceCard
                    selected={mode === 'configure'} onSelect={() => setMode('configure')}
                    icon={<Tune fontSize="small" />} title="Configure template settings"
                    body="Set the template name, period type and start date, and choose which columns and rows to bring in."
                />
            </Box>

            {mode === 'asIs' && summary && (
                <Typography sx={{ fontSize: '0.78rem', color: SLATE, mt: 2 }}>
                    This will create a template with {summary}.
                </Typography>
            )}
            {mode === 'asIs' && preview && !preview.periodDates && (
                <Alert severity="info" sx={{ mt: 1.5, fontSize: '0.78rem', borderRadius: '8px' }}>
                    The column headers weren’t recognized as dates, so periods will use the header text without dates.
                    Choose “Configure template settings” to set a start date.
                </Alert>
            )}
        </>
    );

    // ── Step 2 ────────────────────────────────────────────────────────────────
    const renderConfigure = () => config && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: 1 }}>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' } }}>
                <TextField
                    label="Template name" size="small" value={config.name} sx={fieldSx}
                    onChange={e => update({ name: e.target.value })}
                    error={!config.name.trim()} helperText={!config.name.trim() ? 'Enter a name' : ' '}
                />
                <FormControl size="small" sx={fieldSx}>
                    <InputLabel>Period type</InputLabel>
                    <Select label="Period type" value={config.periodType} onChange={e => update({ periodType: e.target.value as PeriodType })}>
                        {PERIOD_TYPES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <FormControl size="small" sx={fieldSx}>
                    <InputLabel>Period dates</InputLabel>
                    <Select
                        label="Period dates" value={config.periodSource}
                        onChange={e => update({ periodSource: e.target.value as ImportConfig['periodSource'] })}
                    >
                        <MenuItem value="headers" disabled={!config.hasHeader}>Use the CSV column headers</MenuItem>
                        <MenuItem value="generated">Generate from a start date</MenuItem>
                    </Select>
                </FormControl>
                {config.periodSource === 'generated' && (
                    <TextField
                        label="First period starts" type="date" size="small" sx={fieldSx}
                        value={config.startDate} InputLabelProps={{ shrink: true }}
                        onChange={e => update({ startDate: e.target.value })}
                    />
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControlLabel
                    control={
                        <Switch
                            size="small" checked={config.hasHeader}
                            onChange={e => {
                                setStructure(e.target.checked, config.labelCol);
                                if (!e.target.checked) update({ periodSource: 'generated' });
                            }}
                            sx={{ '& .Mui-checked': { color: MAROON }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: MAROON } }}
                        />
                    }
                    label={<Typography sx={{ fontSize: '0.82rem' }}>First row is a header</Typography>}
                />
                <FormControl size="small" sx={{ ...fieldSx, minWidth: 200 }}>
                    <InputLabel>Category column</InputLabel>
                    <Select label="Category column" value={config.labelCol} onChange={e => setStructure(config.hasHeader, Number(e.target.value))}>
                        {Array.from({ length: width }, (_, i) => <MenuItem key={i} value={i}>{colName(i)}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            <Box>
                <Typography sx={labelSx}>Columns to import as periods</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {Array.from({ length: width }, (_, i) => i).filter(i => i !== config.labelCol).map(i => {
                        const on = config.valueCols.includes(i);
                        return (
                            <Chip
                                key={i} label={colName(i)} size="small" clickable
                                onClick={() => update({
                                    valueCols: on ? config.valueCols.filter(c => c !== i) : [...config.valueCols, i].sort((a, b) => a - b),
                                })}
                                sx={{
                                    fontSize: '0.72rem', fontWeight: 600,
                                    bgcolor: on ? alpha(TEAL, 0.12) : 'transparent',
                                    color: on ? TEAL : SLATE,
                                    border: `1px solid ${on ? alpha(TEAL, 0.35) : alpha('#000', 0.12)}`,
                                }}
                            />
                        );
                    })}
                </Box>
            </Box>

            <Box>
                <Typography sx={labelSx}>Rows</Typography>
                <Box sx={{ border: `1px solid ${alpha('#000', 0.08)}`, borderRadius: '8px', maxHeight: 240, overflow: 'auto' }}>
                    {dataRows.map((r, i) => {
                        const type = config.rowTypes[i] ?? 'skip';
                        return (
                            <Box key={i} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75,
                                borderTop: i ? `1px solid ${alpha('#000', 0.05)}` : 'none',
                                opacity: type === 'skip' ? 0.5 : 1,
                            }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, color: NAVY }}>
                                        {r[config.labelCol]?.trim() || `Row ${i + 1}`}
                                    </Typography>
                                    <Typography noWrap sx={{ fontSize: '0.72rem', color: SLATE }}>
                                        {config.valueCols.slice(0, 4).map(c => r[c]?.trim() || '–').join(', ')}
                                        {config.valueCols.length > 4 ? ', …' : ''}
                                    </Typography>
                                </Box>
                                <Select
                                    size="small" value={type}
                                    onChange={e => update({ rowTypes: config.rowTypes.map((t, j) => (j === i ? e.target.value as ImportRowType : t)) })}
                                    sx={{ minWidth: 170, fontSize: '0.78rem', borderRadius: '7px' }}
                                >
                                    {ROW_TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.8rem' }}>{o.label}</MenuItem>)}
                                </Select>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {summary && (
                <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>
                    This will create a template with {summary}.
                </Typography>
            )}
        </Box>
    );

    const primarySx = {
        bgcolor: MAROON, textTransform: 'none', fontWeight: 600, borderRadius: '7px',
        '&:hover': { bgcolor: MAROON_DARK },
    } as const;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}>
            <DialogTitle sx={{ fontWeight: 700, color: NAVY, pb: 1 }}>
                {step === 'choose' ? 'Import from CSV' : 'Configure template settings'}
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem', borderRadius: '8px' }}>{error}</Alert>}
                {step === 'choose' ? renderChoose() : renderConfigure()}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {step === 'configure' ? (
                    <Button onClick={() => { setStep('choose'); setError(null); }} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600, mr: 'auto' }}>
                        Back
                    </Button>
                ) : null}
                <Button onClick={handleClose} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                {step === 'choose' && mode === 'configure' ? (
                    <Button variant="contained" disabled={!config} onClick={() => setStep('configure')} sx={primarySx}>
                        Next
                    </Button>
                ) : (
                    <Button variant="contained" disabled={!canImport} onClick={handleImport} sx={primarySx}>
                        Import
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default BPCsvImportDialog;