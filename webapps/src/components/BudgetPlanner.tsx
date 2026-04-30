// ── BudgetPlanner.tsx ─────────────────────────────────────────────────────────
// ForecastPanel removed — forecast functionality lives inside PlanningView's
// "Forecast" tab. Layout is a single full-width PlanningView, no side panel.
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
    Box, Typography, Container, Grow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Chip, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add, Save } from '@mui/icons-material';

import Sidebar from './Sidebar';
import ManualTemplateWizard from './ManualTemplateWizard';
import BudgetPlannerService from '../services/BudgetPlannerService';
import type { BPTemplate, BudgetPlannerRequest, Period } from '../config/Types';

import PlanningView from './PlanningView';
// ForecastPanel intentionally removed — forecast now lives in PlanningView's Forecast tab

import {
    MAROON, MAROON_DARK, NAVY, SLATE, GREEN, RED, TEAL, AMBER, BLUE, BG,
    generateUUID, fmt, fmtS, monthKey,
    generatePeriods, makeBlankRows, recalcSummaryRows,
} from '../domain/SpreadsheetTypes';
import type {
    SpreadsheetTemplate, SpreadsheetRow, MonthGroup,
    PeriodType, PeriodFilter,
} from '../domain/SpreadsheetTypes';

// ── Backend mapping helpers ───────────────────────────────────────────────────
function resolveRowType(bpType: string, category: string): SpreadsheetRow['rowType'] {
    if (!bpType) return 'expense';
    const t = bpType.toUpperCase();
    if (t === 'INCOME')  return 'salary';
    if (t === 'BALANCE') return 'balance';
    if (category?.toLowerCase().includes('expense')) return 'expenses';
    return 'expense';
}

function mapPeriodToType(period: string): PeriodType {
    const map: Record<string, PeriodType> = {
        WEEKLY:'Weekly', BIWEEKLY:'Biweekly', MONTHLY:'Monthly',
        BIMONTHLY:'2-Monthly', QUARTERLY:'3-Monthly',
    };
    return map[period?.toUpperCase()] ?? 'Monthly';
}

function mapFormatToPeriod(format: string): Period {
    const { Period } = require('../config/Types');
    const map: Record<string, typeof Period[keyof typeof Period]> = {
        Weekly:'WEEKLY', Biweekly:'BIWEEKLY', '2-Monthly':'BIMONTHLY',
        '3-Monthly':'QUARTERLY', Monthly:'MONTHLY',
    };
    return (map[format] ?? 'MONTHLY') as Period;
}

const parseDateField = (d: any): { month: number; day: number; year: number } | null => {
    if (!d) return null;
    if (Array.isArray(d))   return { year: d[0], month: d[1], day: d[2] };
    if (typeof d === 'string') {
        const parts = d.split('-');
        if (parts.length < 3) return null;
        return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
    }
    return null;
};

const dateKey = (d: any): string => {
    const p = parseDateField(d);
    return p ? `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}` : '';
};

function mapBPTemplateToSpreadsheet(template: BPTemplate): SpreadsheetTemplate {
    const detail     = template.bpTemplateDetail;
    const layoutGrid = detail?.layoutGrid;

    if (!layoutGrid) {
        return {
            id:         String(template.id ?? generateUUID()),
            name:       template.templateType ?? 'New Template',
            periodType: mapPeriodToType(template.period),
            months: [], periods: [], rows: [],
        };
    }

    const columns  = layoutGrid.columns ?? [];
    const gridRows = layoutGrid.rows    ?? [];
    const dataCols = columns.filter((c: any) => !c.isHeader);
    const now = new Date();

    const periods: string[] = dataCols.map((c: any) => {
        const s = parseDateField(c.dateRange?.startDate);
        const e = parseDateField(c.dateRange?.endDate);
        if (!s || !e) return `Period ${c.columnIndex ?? '?'}`;
        return `${s.month}/${s.day}–${e.month}/${e.day}`;
    });

    const periodDates = dataCols.map((c: any) => {
        const s = parseDateField(c.dateRange?.startDate);
        const e = parseDateField(c.dateRange?.endDate);
        if (!s || !e) return { start: new Date(), end: new Date() };
        return { start: new Date(s.year, s.month - 1, s.day), end: new Date(e.year, e.month - 1, e.day) };
    });

    const monthMap = new Map<string, number[]>();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    dataCols.forEach((col: any, idx: number) => {
        const s     = parseDateField(col.dateRange?.startDate);
        const label = s ? `${monthNames[s.month - 1]} ${s.year}` : `Period ${idx + 1}`;
        if (!monthMap.has(label)) monthMap.set(label, []);
        monthMap.get(label)!.push(idx);
    });
    const months: MonthGroup[] = Array.from(monthMap.entries()).map(([name, cols]) => ({ name, cols }));

    const CATEGORY_ORDER = [
        'Rent','Gas','Groceries','Insurance','Phone Insurance','Payments','Payment',
        'Utilities','Electric','Gas Bill','Golf','Order out','Order Out','Subscriptions',
        'Subscription','Trip Cost','Haircut','Other Stuff','Other','Coffee Supplies',
        'Savings','To Go','Salary','Expenses','Extra','Remaining Balance','Balance',
    ];
    const catOrder = (label: string) => {
        const idx = CATEGORY_ORDER.findIndex(c => c.toLowerCase() === label.toLowerCase());
        return idx === -1 ? CATEGORY_ORDER.length : idx;
    };

    const spreadsheetRows: SpreadsheetRow[] = gridRows.map((row: any) => {
        const rowType = resolveRowType(row.type, row.category);
        const values: (number | null)[] = dataCols.map((col: any) => {
            const s = parseDateField(col.dateRange?.startDate);
            const e = parseDateField(col.dateRange?.endDate);
            const colStart = s ? new Date(s.year, s.month - 1, s.day) : null;
            const colEnd   = e ? new Date(e.year, e.month - 1, e.day) : null;
            const isFutureCol  = colStart !== null && colStart > now;
            const isPresentCol = colStart !== null && colEnd !== null && colStart <= now && colEnd >= now;
            const isPastCol    = colEnd   !== null && colEnd < now;
            const cell = row.cells?.find((c: any) =>
                dateKey(c.dateRange?.startDate) === dateKey(col.dateRange?.startDate) &&
                dateKey(c.dateRange?.endDate)   === dateKey(col.dateRange?.endDate)
            );
            if (!cell) return null;
            if (rowType === 'balance') return null;
            const actual        = cell.actual        != null ? Number(cell.actual)        : null;
            const budgeted      = cell.budgeted      != null ? Number(cell.budgeted)      : null;
            const plannedAmount = cell.plannedAmount != null ? Number(cell.plannedAmount) : null;
            if (rowType === 'salary' || rowType === 'expenses') {
                if (isPastCol || isPresentCol) return actual !== null && actual !== 0 ? actual : null;
                if (isFutureCol) return plannedAmount !== null && plannedAmount !== 0 ? plannedAmount : null;
                return null;
            }
            if (isPastCol || isPresentCol) {
                if (actual   !== null && actual   !== 0) return actual;
                if (budgeted !== null && budgeted !== 0) return budgeted;
                return null;
            }
            if (isFutureCol) {
                if (plannedAmount !== null && plannedAmount !== 0) return plannedAmount;
                if (budgeted      !== null && budgeted      !== 0) return budgeted;
                return null;
            }
            return null;
        });
        return { label: row.category, rowType, values };
    });

    const blank = () => Array(dataCols.length).fill(null) as null[];
    if (!spreadsheetRows.some((r: SpreadsheetRow) => r.rowType === 'salary'))   spreadsheetRows.push({ label: 'Salary',            rowType: 'salary',   values: blank() });
    if (!spreadsheetRows.some((r: SpreadsheetRow) => r.rowType === 'expenses')) spreadsheetRows.push({ label: 'Expenses',          rowType: 'expenses', values: blank() });
    if (!spreadsheetRows.some((r: SpreadsheetRow) => r.rowType === 'balance'))  spreadsheetRows.push({ label: 'Remaining Balance', rowType: 'balance',  values: blank() });
    spreadsheetRows.sort((a: SpreadsheetRow, b: SpreadsheetRow) => catOrder(a.label) - catOrder(b.label));
    const finalRows = recalcSummaryRows(spreadsheetRows, dataCols.length);

    return {
        id:         String(template.id ?? generateUUID()),
        name:       template.templateType ?? 'New Template',
        periodType: mapPeriodToType(template.period),
        months, periods, periodDates,
        rows: finalRows,
    };
}

// ── Template selector ─────────────────────────────────────────────────────────
const TemplateSelector: React.FC<{
    templates: SpreadsheetTemplate[];
    selectedId: string;
    onChange: (id: string) => void;
}> = ({ templates, selectedId, onChange }) => (
    <FormControl size="small" sx={{ minWidth: 270 }}>
        <InputLabel sx={{ fontSize: '0.82rem', color: SLATE }}>Template</InputLabel>
        <Select
            value={selectedId || ''}
            label="Template"
            onChange={e => onChange(e.target.value)}
            sx={{ bgcolor: '#fff', borderRadius: '8px', fontSize: '0.82rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.12) }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: MAROON } }}
        >
            {templates.map(t => (
                <MenuItem key={t.id} value={t.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={t.viewOverride ? t.viewOverride.split('-')[0] : String(t.periodType)} size="small" sx={{ height: 17, fontSize: '0.6rem', fontWeight: 600, bgcolor: alpha(TEAL, 0.1), color: TEAL }} />
                        <Typography sx={{ fontSize: '0.82rem' }}>{t.name}</Typography>
                    </Box>
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

// ── Main component ────────────────────────────────────────────────────────────
const BudgetPlanner: React.FC = () => {
    const [animateIn,      setAnimateIn]      = useState(false);
    const [templates,      setTemplates]      = useState<SpreadsheetTemplate[]>([]);
    const [selectedId,     setSelectedId]     = useState<string>('');
    const [periodFilter,   setPeriodFilter]   = useState<PeriodFilter>('Biweekly');
    const [openWizard,     setOpenWizard]     = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [saveName,       setSaveName]       = useState('');
    const [syncing,        setSyncing]        = useState(false);

    const service = BudgetPlannerService.getInstance();

    useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const userId = Number(sessionStorage.getItem('userId'));
            if (!userId) return;
            try {
                const bpTemplates = await service.fetchUserTemplates(userId);
                if (cancelled) return;
                if (!bpTemplates?.length) {
                    const def = await service.createDefaultTemplate(userId);
                    if (cancelled) return;
                    const mapped = mapBPTemplateToSpreadsheet(def);
                    setTemplates([mapped]); setSelectedId(mapped.id);
                } else {
                    const mapped = bpTemplates.map(mapBPTemplateToSpreadsheet);
                    setTemplates(mapped); setSelectedId(mapped[0].id);
                }
            } catch (err) { console.error('Failed to load templates:', err); }
        })();
        return () => { cancelled = true; };
    }, []);

    const syncedIds = useRef<Set<string>>(new Set());
    useEffect(() => {
        const userId = Number(sessionStorage.getItem('userId'));
        if (!userId || !selectedId) return;
        if (syncedIds.current.has(selectedId)) return;
        const templateId = Number(selectedId);
        if (isNaN(templateId)) return;
        let cancelled = false;
        setSyncing(true);
        syncedIds.current.add(selectedId);
        (async () => {
            try {
                const updated: BPTemplate = await service.resyncTemplate(templateId, userId);
                if (cancelled) return;
                const mapped = mapBPTemplateToSpreadsheet(updated);
                setTemplates(prev => prev.map(t => t.id === selectedId ? mapped : t));
            } catch (err) {
                syncedIds.current.delete(selectedId);
                console.error('Sync failed:', err);
            } finally { if (!cancelled) setSyncing(false); }
        })();
        return () => { cancelled = true; setSyncing(false); };
    }, [selectedId]);

    const currentTemplate = templates.find(t => t.id === selectedId) ?? templates[0];

    const handleCellChange = useCallback((ri: number, ci: number, value: number | null) => {
        setTemplates(prev => prev.map(t => {
            if (t.id !== selectedId) return t;
            const rows = t.rows.map((r, i) => i === ri ? { ...r, values: r.values.map((v, j) => j === ci ? value : v) } : r);
            return { ...t, rows: recalcSummaryRows(rows, t.periods.length) };
        }));
    }, [selectedId]);

    const handleWizardCreate = useCallback(async (config: {
        name: string; periodType: PeriodType; startMonth: string; endMonth: string;
        income: number; categories: { name: string; color: string }[]; allocs: Record<string, number>;
    }) => {
        const userId = Number(sessionStorage.getItem('userId'));
        try {
            const req: BudgetPlannerRequest = {
                userId, templateType: config.name as any,
                period: mapFormatToPeriod(config.periodType),
                dateRanges: [{ startDate: `${config.startMonth}-01`, endDate: `${config.endMonth}-01` }],
            };
            const bpTemplate = await service.createBudgetTemplate(req);
            const nt = mapBPTemplateToSpreadsheet(bpTemplate);
            setTemplates(prev => [...prev, nt]); setSelectedId(nt.id);
        } catch {
            const start = new Date(`${config.startMonth}-01`);
            const end   = new Date(`${config.endMonth}-01`);
            end.setMonth(end.getMonth() + 1); end.setDate(0);
            const { periods, months, periodDates } = generatePeriods(config.periodType, start, end);
            const rows = makeBlankRows(periods.length);
            const si = rows.findIndex(r => r.label === 'Salary');
            if (si >= 0 && config.income > 0) rows[si] = { ...rows[si], values: rows[si].values.map(() => config.income) };
            const nt: SpreadsheetTemplate = { id: generateUUID(), name: config.name, periodType: config.periodType, months, periods, periodDates, rows };
            setTemplates(prev => [...prev, nt]); setSelectedId(nt.id);
        }
    }, [service]);

    const handleSaveCopy = () => {
        if (!saveName || !currentTemplate) return;
        const copy: SpreadsheetTemplate = {
            ...currentTemplate, id: generateUUID(), name: saveName,
            rows: currentTemplate.rows.map(r => ({ ...r, values: [...r.values] })),
        };
        setTemplates(prev => [...prev, copy]); setSelectedId(copy.id);
        setOpenSaveDialog(false); setSaveName('');
    };

    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: BG }}>
            <Sidebar />
            <Container maxWidth={false} sx={{ py: 4 }}>

                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                            <Box>
                                <Box sx={{ width: 24, height: 2.5, background: MAROON, borderRadius: '2px', mb: 0.875 }} />
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>Budget Planner</Typography>
                                <Typography variant="subtitle1" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '0.88rem' }}>
                                    Plan across periods · historical actuals · future projections
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, flexShrink: 0, flexWrap: 'wrap' }}>
                                <Button variant="outlined" size="small" onClick={() => setOpenWizard(true)} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.76rem', borderColor: alpha('#000', 0.15), color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                                    <Add sx={{ fontSize: '0.85rem', mr: 0.25 }} /> New
                                </Button>
                                {currentTemplate && (
                                    <Button variant="outlined" size="small" onClick={() => setOpenSaveDialog(true)} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.76rem', borderColor: alpha('#000', 0.15), color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                                        <Save sx={{ fontSize: '0.8rem', mr: 0.25 }} /> Save copy
                                    </Button>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <TemplateSelector templates={templates} selectedId={selectedId} onChange={setSelectedId} />
                        </Box>
                    </Box>
                </Grow>

                {/* Full-width PlanningView — ForecastPanel removed, use Forecast tab instead */}
                {currentTemplate && (
                    <Grow in={animateIn} timeout={600}>
                        <Box sx={{ position: 'relative' }}>
                            {syncing && (
                                <Box sx={{
                                    position: 'absolute', inset: 0, zIndex: 10, borderRadius: '12px',
                                    bgcolor: alpha('#fff', 0.55), backdropFilter: 'blur(3px)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                                    pointerEvents: 'all',
                                }}>
                                    <CircularProgress size={36} thickness={3.5} sx={{ color: MAROON }} />
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: MAROON, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        Syncing categories…
                                    </Typography>
                                </Box>
                            )}
                            <Box sx={{ pointerEvents: syncing ? 'none' : 'auto' }}>
                                <PlanningView
                                    template={currentTemplate}
                                    periodFilter={periodFilter}
                                    onPeriodFilter={setPeriodFilter}
                                    onCellChange={handleCellChange}
                                    onSaveTemplate={() => setOpenSaveDialog(true)}
                                />
                            </Box>
                        </Box>
                    </Grow>
                )}
            </Container>

            <ManualTemplateWizard open={openWizard} onClose={() => setOpenWizard(false)} onCreateTemplate={handleWizardCreate} />

            <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} PaperProps={{ sx: { borderRadius: '12px', p: 1, minWidth: 360 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: NAVY, pb: 1 }}>Save a copy</DialogTitle>
                <DialogContent>
                    <TextField label="New template name" value={saveName} onChange={e => setSaveName(e.target.value)} fullWidth margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '7px' } }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenSaveDialog(false)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={handleSaveCopy} variant="contained" disabled={!saveName} sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 600, borderRadius: '7px', '&:hover': { bgcolor: MAROON_DARK } }}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BudgetPlanner;

// // ── BudgetPlanner.tsx ─────────────────────────────────────────────────────────
// import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
// import {
//     Box, Typography, Container, Grid, Grow, Button,
//     Dialog, DialogTitle, DialogContent, DialogActions,
//     TextField, FormControl, InputLabel, Select, MenuItem,
//     Chip, Card, CircularProgress,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Add, Save } from '@mui/icons-material';
//
// import Sidebar from './Sidebar';
// import ManualTemplateWizard from './ManualTemplateWizard';
// import BudgetPlannerService from '../services/BudgetPlannerService';
// import type { BPTemplate, BudgetPlannerRequest, Period } from '../config/Types';
//
// import PlanningView from './PlanningView';
//
// import {
//     MAROON, MAROON_DARK, NAVY, SLATE, GREEN, RED, TEAL, AMBER, BLUE, BG,
//     generateUUID, fmt, fmtS, monthKey,
//     generatePeriods, makeBlankRows, recalcSummaryRows,
// } from '../domain/SpreadsheetTypes';
// import type {
//     SpreadsheetTemplate, SpreadsheetRow, MonthGroup,
//     PeriodType, PeriodFilter,
// } from '../domain/SpreadsheetTypes';
// import ForecastPanel from "./ForecastPanel";
//
// // ── Backend mapping helpers ───────────────────────────────────────────────────
// function resolveRowType(bpType: string, category: string): SpreadsheetRow['rowType'] {
//     if (!bpType) return 'expense';
//     const t = bpType.toUpperCase();
//     if (t === 'INCOME')  return 'salary';
//     if (t === 'BALANCE') return 'balance';
//     if (category?.toLowerCase().includes('expense')) return 'expenses';
//     return 'expense';
// }
//
// function mapPeriodToType(period: string): PeriodType {
//     const map: Record<string, PeriodType> = {
//         WEEKLY:'Weekly', BIWEEKLY:'Biweekly', MONTHLY:'Monthly',
//         BIMONTHLY:'2-Monthly', QUARTERLY:'3-Monthly',
//     };
//     return map[period?.toUpperCase()] ?? 'Monthly';
// }
//
// function mapFormatToPeriod(format: string): Period {
//     const { Period } = require('../config/Types');
//     const map: Record<string, typeof Period[keyof typeof Period]> = {
//         Weekly:'WEEKLY', Biweekly:'BIWEEKLY', '2-Monthly':'BIMONTHLY',
//         '3-Monthly':'QUARTERLY', Monthly:'MONTHLY',
//     };
//     return (map[format] ?? 'MONTHLY') as Period;
// }
//
// const parseDateField = (d: any): { month: number; day: number; year: number } | null => {
//     if (!d) return null;
//     if (Array.isArray(d))   return { year: d[0], month: d[1], day: d[2] };
//     if (typeof d === 'string') {
//         const parts = d.split('-');
//         if (parts.length < 3) return null;
//         return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) };
//     }
//     return null;
// };
//
// const dateKey = (d: any): string => {
//     const p = parseDateField(d);
//     return p ? `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}` : '';
// };
//
// function mapBPTemplateToSpreadsheet(template: BPTemplate): SpreadsheetTemplate {
//     const detail     = template.bpTemplateDetail;
//     const layoutGrid = detail?.layoutGrid;
//
//     if (!layoutGrid) {
//         return {
//             id:         String(template.id ?? generateUUID()),
//             name:       template.templateType ?? 'New Template',
//             periodType: mapPeriodToType(template.period),
//             months: [], periods: [], rows: [],
//         };
//     }
//
//     const columns  = layoutGrid.columns ?? [];
//     const gridRows = layoutGrid.rows    ?? [];
//     const dataCols = columns.filter((c: any) => !c.isHeader);
//
//     const now = new Date();
//
//     const periods: string[] = dataCols.map((c: any) => {
//         const s = parseDateField(c.dateRange?.startDate);
//         const e = parseDateField(c.dateRange?.endDate);
//         if (!s || !e) return `Period ${c.columnIndex ?? '?'}`;
//         return `${s.month}/${s.day}–${e.month}/${e.day}`;
//     });
//
//     const periodDates = dataCols.map((c: any) => {
//         const s = parseDateField(c.dateRange?.startDate);
//         const e = parseDateField(c.dateRange?.endDate);
//         if (!s || !e) return { start: new Date(), end: new Date() };
//         return {
//             start: new Date(s.year, s.month - 1, s.day),
//             end:   new Date(e.year, e.month - 1, e.day),
//         };
//     });
//
//     const monthMap = new Map<string, number[]>();
//     const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
//     dataCols.forEach((col: any, idx: number) => {
//         const s     = parseDateField(col.dateRange?.startDate);
//         const label = s ? `${monthNames[s.month - 1]} ${s.year}` : `Period ${idx + 1}`;
//         if (!monthMap.has(label)) monthMap.set(label, []);
//         monthMap.get(label)!.push(idx);
//     });
//     const months: MonthGroup[] = Array.from(monthMap.entries()).map(([name, cols]) => ({ name, cols }));
//
//     const CATEGORY_ORDER = [
//         'Rent','Gas','Groceries','Insurance','Phone Insurance','Payments','Payment',
//         'Utilities','Electric','Gas Bill','Golf','Order out','Order Out','Subscriptions',
//         'Subscription','Trip Cost','Haircut','Other Stuff','Other','Coffee Supplies',
//         'Savings','To Go','Salary','Expenses','Extra','Remaining Balance','Balance',
//     ];
//     const catOrder = (label: string) => {
//         const idx = CATEGORY_ORDER.findIndex(c => c.toLowerCase() === label.toLowerCase());
//         return idx === -1 ? CATEGORY_ORDER.length : idx;
//     };
//     const spreadsheetRows: SpreadsheetRow[] = gridRows.map((row: any) => {
//         const rowType = resolveRowType(row.type, row.category);
//
//         const values: (number | null)[] = dataCols.map((col: any) => {
//             const s = parseDateField(col.dateRange?.startDate);
//             const e = parseDateField(col.dateRange?.endDate);
//
//             const colStart = s ? new Date(s.year, s.month - 1, s.day) : null;
//             const colEnd   = e ? new Date(e.year, e.month - 1, e.day) : null;
//
//             const isFutureCol  = colStart !== null && colStart > now;
//             const isPresentCol = colStart !== null && colEnd !== null && colStart <= now && colEnd >= now;
//             const isPastCol    = colEnd   !== null && colEnd < now;
//
//             const cell = row.cells?.find((c: any) =>
//                 dateKey(c.dateRange?.startDate) === dateKey(col.dateRange?.startDate) &&
//                 dateKey(c.dateRange?.endDate)   === dateKey(col.dateRange?.endDate)
//             );
//             if (!cell) return null;
//             if (rowType === 'balance') return null;
//
//             const actual        = cell.actual        != null ? Number(cell.actual)        : null;
//             const budgeted      = cell.budgeted      != null ? Number(cell.budgeted)      : null;
//             const plannedAmount = cell.plannedAmount != null ? Number(cell.plannedAmount) : null;
//
//             if (rowType === 'salary' || rowType === 'expenses') {
//                 if (isPastCol || isPresentCol)
//                     return actual !== null && actual !== 0 ? actual : null;
//                 if (isFutureCol)
//                     return plannedAmount !== null && plannedAmount !== 0 ? plannedAmount : null;
//                 return null;
//             }
//
//             if (isPastCol || isPresentCol) {
//                 if (actual   !== null && actual   !== 0) return actual;
//                 if (budgeted !== null && budgeted !== 0) return budgeted;
//                 return null;
//             }
//             if (isFutureCol) {
//                 if (plannedAmount !== null && plannedAmount !== 0) return plannedAmount;
//                 if (budgeted      !== null && budgeted      !== 0) return budgeted;
//                 return null;
//             }
//             return null;
//         });
//
//         return { label: row.category, rowType, values };
//     });
//
//     // const spreadsheetRows: SpreadsheetRow[] = gridRows.map((row: any) => {
//     //     const rowType = resolveRowType(row.type, row.category);
//     //     const values: (number | null)[] = dataCols.map((col: any) => {
//     //         const cell = row.cells?.find((c: any) =>
//     //             dateKey(c.dateRange?.startDate) === dateKey(col.dateRange?.startDate) &&
//     //             dateKey(c.dateRange?.endDate)   === dateKey(col.dateRange?.endDate)
//     //         );
//     //         if (!cell) return null;
//     //         if (rowType === 'balance') return null;
//     //         const actual   = cell.actual   != null ? Number(cell.actual)   : null;
//     //         const budgeted = cell.budgeted != null ? Number(cell.budgeted) : null;
//     //         const plannedAmount = cell.plannedAmount != null ? Number(cell.plannedAmount) : null;
//     //         if (rowType === 'salary' || rowType === 'expenses')
//     //             return actual !== null && actual !== 0 ? actual : plannedAmount !== null && plannedAmount !== 0 ? plannedAmount : null;
//     //         if (actual   !== null && actual   !== 0) return actual;
//     //         if (budgeted !== null && budgeted !== 0) return budgeted;
//     //         if (plannedAmount !== null && plannedAmount !== 0) return plannedAmount;
//     //         return null;
//     //     });
//     //     return { label: row.category, rowType, values };
//     // });
//
//     const blank = () => Array(dataCols.length).fill(null) as null[];
//     if (!spreadsheetRows.some((r: SpreadsheetRow) => r.rowType === 'salary'))   spreadsheetRows.push({ label: 'Salary',            rowType: 'salary',   values: blank() });
//     if (!spreadsheetRows.some((r: SpreadsheetRow) => r.rowType === 'expenses')) spreadsheetRows.push({ label: 'Expenses',          rowType: 'expenses', values: blank() });
//     if (!spreadsheetRows.some((r: SpreadsheetRow) => r.rowType === 'balance'))  spreadsheetRows.push({ label: 'Remaining Balance', rowType: 'balance',  values: blank() });
//
//     spreadsheetRows.sort((a: SpreadsheetRow, b: SpreadsheetRow) => catOrder(a.label) - catOrder(b.label));
//
//     const finalRows = recalcSummaryRows(spreadsheetRows, dataCols.length);
//
//     return {
//         id:         String(template.id ?? generateUUID()),
//         name:       template.templateType ?? 'New Template',
//         periodType: mapPeriodToType(template.period),
//         months, periods, periodDates,
//         rows: finalRows,
//     };
// }
//
// // ── Template selector ─────────────────────────────────────────────────────────
// const TemplateSelector: React.FC<{
//     templates: SpreadsheetTemplate[];
//     selectedId: string;
//     onChange: (id: string) => void;
// }> = ({ templates, selectedId, onChange }) => (
//     <FormControl size="small" sx={{ minWidth: 270 }}>
//         <InputLabel sx={{ fontSize: '0.82rem', color: SLATE }}>Template</InputLabel>
//         <Select
//             value={selectedId || ''}
//             label="Template"
//             onChange={e => onChange(e.target.value)}
//             sx={{ bgcolor: '#fff', borderRadius: '8px', fontSize: '0.82rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.12) }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: MAROON } }}
//         >
//             {templates.map(t => (
//                 <MenuItem key={t.id} value={t.id}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <Chip
//                             label={t.viewOverride ? t.viewOverride.split('-')[0] : String(t.periodType)}
//                             size="small"
//                             sx={{ height: 17, fontSize: '0.6rem', fontWeight: 600, bgcolor: alpha(TEAL, 0.1), color: TEAL }}
//                         />
//                         <Typography sx={{ fontSize: '0.82rem' }}>{t.name}</Typography>
//                     </Box>
//                 </MenuItem>
//             ))}
//         </Select>
//     </FormControl>
// );
//
// // ── Main component ────────────────────────────────────────────────────────────
// const BudgetPlanner: React.FC = () => {
//     const [animateIn,      setAnimateIn]      = useState(false);
//     const [templates,      setTemplates]      = useState<SpreadsheetTemplate[]>([]);
//     const [selectedId,     setSelectedId]     = useState<string>('');
//     const [periodFilter,   setPeriodFilter]   = useState<PeriodFilter>('Biweekly');
//     const [openWizard,     setOpenWizard]     = useState(false);
//     const [openSaveDialog, setOpenSaveDialog] = useState(false);
//     const [saveName,       setSaveName]       = useState('');
//     const [syncing,        setSyncing]        = useState(false);
//
//     const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
//     const service = BudgetPlannerService.getInstance();
//
//     useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);
//
//     // ── Load templates ────────────────────────────────────────────────────────
//     useEffect(() => {
//         let cancelled = false;
//         (async () => {
//             const userId = Number(sessionStorage.getItem('userId'));
//             if (!userId) return;
//             try {
//                 const bpTemplates = await service.fetchUserTemplates(userId);
//                 if (cancelled) return;
//                 if (!bpTemplates?.length) {
//                     const def = await service.createDefaultTemplate(userId);
//                     if (cancelled) return;
//                     const mapped = mapBPTemplateToSpreadsheet(def);
//                     setTemplates([mapped]);
//                     setSelectedId(mapped.id);
//                 } else {
//                     const mapped = bpTemplates.map(mapBPTemplateToSpreadsheet);
//                     setTemplates(mapped);
//                     setSelectedId(mapped[0].id);
//                 }
//             } catch (err) {
//                 console.error('Failed to load templates:', err);
//             }
//         })();
//         return () => { cancelled = true; };
//     }, []);
//
//     // ── Sync on template switch ───────────────────────────────────────────────
//     const syncedIds = useRef<Set<string>>(new Set());
//
//     useEffect(() => {
//         const userId = Number(sessionStorage.getItem('userId'));
//         if (!userId || !selectedId) return;
//         if (syncedIds.current.has(selectedId)) return; // already synced this template
//
//         const templateId = Number(selectedId);
//         if (isNaN(templateId)) return;
//
//         let cancelled = false;
//         setSyncing(true);
//         syncedIds.current.add(selectedId);
//
//         (async () => {
//             try
//             {
//                 const updated: BPTemplate = await service.resyncTemplate(
//                     templateId, userId);
//                 if (cancelled) return;
//                 const mapped = mapBPTemplateToSpreadsheet(updated);
//                 setTemplates(prev => prev.map(t => t.id === selectedId ? mapped : t));
//             } catch (err) {
//                 syncedIds.current.delete(selectedId); // allow retry on failure
//                 console.error('Sync failed:', err);
//             } finally {
//                 if (!cancelled) setSyncing(false);
//             }
//         })();
//
//         return () => { cancelled = true; setSyncing(false); };
//     }, [selectedId]);
//     // useEffect(() => {
//     //     const userId = Number(sessionStorage.getItem('userId'));
//     //     if (!userId || !selectedId) return;
//     //
//     //     const templateId = Number(selectedId);
//     //     if (isNaN(templateId)) return;
//     //
//     //     let cancelled = false;
//     //     setSyncing(true);
//     //
//     //     (async () => {
//     //         try {
//     //             const updated: BPTemplate = await service.updateTemplateCategories(templateId, userId);
//     //             console.log('Updated BPTemplate:', updated);
//     //             if (cancelled) return;
//     //             const mapped = mapBPTemplateToSpreadsheet(updated);
//     //             setTemplates(prev => prev.map(t => t.id === selectedId ? mapped : t));
//     //         } catch (err) {
//     //             console.error('Sync failed:', err);
//     //         } finally {
//     //             if (!cancelled) setSyncing(false);
//     //         }
//     //     })();
//     //
//     //     return () => { cancelled = true; setSyncing(false); };
//     // }, [selectedId]);
//
//     const currentTemplate = templates.find(t => t.id === selectedId) ?? templates[0];
//
//     // ── Cell change handler ───────────────────────────────────────────────────
//     const handleCellChange = useCallback((ri: number, ci: number, value: number | null) => {
//         setTemplates(prev => prev.map(t => {
//             if (t.id !== selectedId) return t;
//             const rows = t.rows.map((r, i) =>
//                 i === ri ? { ...r, values: r.values.map((v, j) => j === ci ? value : v) } : r
//             );
//             return { ...t, rows: recalcSummaryRows(rows, t.periods.length) };
//         }));
//     }, [selectedId]);
//
//     // ── Wizard create ─────────────────────────────────────────────────────────
//     const handleWizardCreate = useCallback(async (config: {
//         name: string; periodType: PeriodType; startMonth: string; endMonth: string;
//         income: number; categories: { name: string; color: string }[]; allocs: Record<string, number>;
//     }) => {
//         const userId = Number(sessionStorage.getItem('userId'));
//         try {
//             const req: BudgetPlannerRequest = {
//                 userId, templateType: config.name as any,
//                 period: mapFormatToPeriod(config.periodType),
//                 dateRanges: [{ startDate: `${config.startMonth}-01`, endDate: `${config.endMonth}-01` }],
//             };
//             const bpTemplate = await service.createBudgetTemplate(req);
//             const nt = mapBPTemplateToSpreadsheet(bpTemplate);
//             setTemplates(prev => [...prev, nt]);
//             setSelectedId(nt.id);
//         } catch {
//             const start = new Date(`${config.startMonth}-01`);
//             const end   = new Date(`${config.endMonth}-01`);
//             end.setMonth(end.getMonth() + 1); end.setDate(0);
//             const { periods, months, periodDates } = generatePeriods(config.periodType, start, end);
//             const rows = makeBlankRows(periods.length);
//             const si = rows.findIndex(r => r.label === 'Salary');
//             if (si >= 0 && config.income > 0)
//                 rows[si] = { ...rows[si], values: rows[si].values.map(() => config.income) };
//             const nt: SpreadsheetTemplate = { id: generateUUID(), name: config.name, periodType: config.periodType, months, periods, periodDates, rows };
//             setTemplates(prev => [...prev, nt]);
//             setSelectedId(nt.id);
//         }
//     }, [service]);
//
//     // ── Save copy ─────────────────────────────────────────────────────────────
//     const handleSaveCopy = () => {
//         if (!saveName || !currentTemplate) return;
//         const copy: SpreadsheetTemplate = {
//             ...currentTemplate, id: generateUUID(), name: saveName,
//             rows: currentTemplate.rows.map(r => ({ ...r, values: [...r.values] })),
//         };
//         setTemplates(prev => [...prev, copy]);
//         setSelectedId(copy.id);
//         setOpenSaveDialog(false);
//         setSaveName('');
//     };
//
//     // ── Render ────────────────────────────────────────────────────────────────
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: BG }}>
//             <Sidebar />
//             <Container maxWidth={false} sx={{ py: 4 }}>
//
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{ mb: 4 }}>
//                         {/* Title + actions */}
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
//                             <Box>
//                                 <Box sx={{ width: 24, height: 2.5, background: MAROON, borderRadius: '2px', mb: 0.875 }} />
//                                 <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>
//                                     Budget Planner
//                                 </Typography>
//                                 <Typography variant="subtitle1" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '0.88rem' }}>
//                                     Plan across periods · historical actuals · future projections
//                                 </Typography>
//                             </Box>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, flexShrink: 0, flexWrap: 'wrap' }}>
//                                 <Button
//                                     variant="outlined" size="small"
//                                     onClick={() => setOpenWizard(true)}
//                                     sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.76rem', borderColor: alpha('#000', 0.15), color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}
//                                 >
//                                     <Add sx={{ fontSize: '0.85rem', mr: 0.25 }} /> New
//                                 </Button>
//                                 {currentTemplate && (
//                                     <Button
//                                         variant="outlined" size="small"
//                                         onClick={() => setOpenSaveDialog(true)}
//                                         sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.76rem', borderColor: alpha('#000', 0.15), color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }}
//                                     >
//                                         <Save sx={{ fontSize: '0.8rem', mr: 0.25 }} /> Save copy
//                                     </Button>
//                                 )}
//                             </Box>
//                         </Box>
//
//                         {/* Template selector */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
//                             <TemplateSelector templates={templates} selectedId={selectedId} onChange={setSelectedId} />
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* Planning view */}
//                 {/*{currentTemplate && (*/}
//                 {/*    <Grow in={animateIn} timeout={600}>*/}
//                 {/*        <Box sx={{ position: 'relative' }}>*/}
//                 {/*            {syncing && (*/}
//                 {/*                <Box sx={{*/}
//                 {/*                    position: 'absolute',*/}
//                 {/*                    inset: 0,*/}
//                 {/*                    zIndex: 10,*/}
//                 {/*                    borderRadius: '12px',*/}
//                 {/*                    bgcolor: alpha('#fff', 0.55),*/}
//                 {/*                    backdropFilter: 'blur(3px)',*/}
//                 {/*                    display: 'flex',*/}
//                 {/*                    flexDirection: 'column',*/}
//                 {/*                    alignItems: 'center',*/}
//                 {/*                    justifyContent: 'center',*/}
//                 {/*                    gap: 1.5,*/}
//                 {/*                    pointerEvents: 'all',*/}
//                 {/*                }}>*/}
//                 {/*                    <CircularProgress size={36} thickness={3.5} sx={{ color: MAROON }} />*/}
//                 {/*                    <Typography sx={{*/}
//                 {/*                        fontSize: '0.78rem',*/}
//                 {/*                        fontWeight: 600,*/}
//                 {/*                        color: MAROON,*/}
//                 {/*                        letterSpacing: '0.04em',*/}
//                 {/*                        textTransform: 'uppercase',*/}
//                 {/*                    }}>*/}
//                 {/*                        Syncing categories…*/}
//                 {/*                    </Typography>*/}
//                 {/*                </Box>*/}
//                 {/*            )}*/}
//                 {/*            <Box sx={{ pointerEvents: syncing ? 'none' : 'auto' }}>*/}
//                 {/*                <PlanningView*/}
//                 {/*                    template={currentTemplate}*/}
//                 {/*                    periodFilter={periodFilter}*/}
//                 {/*                    onPeriodFilter={setPeriodFilter}*/}
//                 {/*                    onCellChange={handleCellChange}*/}
//                 {/*                    onSaveTemplate={() => setOpenSaveDialog(true)}*/}
//                 {/*                />*/}
//                 {/*            </Box>*/}
//                 {/*            /!* ForecastPanel pinned to the right *!/*/}
//                 {/*            <ForecastPanel*/}
//                 {/*                template={currentTemplate}*/}
//                 {/*                selectedPeriodIndex={selectedPeriodIndex}*/}
//                 {/*                defaultMode="spending"*/}
//                 {/*            />*/}
//                 {/*        </Box>*/}
//                 {/*    </Grow>*/}
//                 {/*)}*/}
//                 {currentTemplate && (
//                     <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
//
//                         {/* PlanningView owns its own card/border — takes all remaining width */}
//                         <Grow in={animateIn} timeout={600}>
//                             <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
//                                 {syncing && (
//                                     <Box sx={{
//                                         position: 'absolute', inset: 0, zIndex: 10,
//                                         borderRadius: '12px',
//                                         bgcolor: alpha('#fff', 0.55),
//                                         backdropFilter: 'blur(3px)',
//                                         display: 'flex', flexDirection: 'column',
//                                         alignItems: 'center', justifyContent: 'center', gap: 1.5,
//                                         pointerEvents: 'all',
//                                     }}>
//                                         <CircularProgress size={36} thickness={3.5} sx={{ color: MAROON }} />
//                                         <Typography sx={{
//                                             fontSize: '0.78rem', fontWeight: 600, color: MAROON,
//                                             letterSpacing: '0.04em', textTransform: 'uppercase',
//                                         }}>
//                                             Syncing categories…
//                                         </Typography>
//                                     </Box>
//                                 )}
//                                 <Box sx={{ pointerEvents: syncing ? 'none' : 'auto' }}>
//                                     <PlanningView
//                                         template={currentTemplate}
//                                         periodFilter={periodFilter}
//                                         onPeriodFilter={setPeriodFilter}
//                                         onCellChange={handleCellChange}
//                                         onSaveTemplate={() => setOpenSaveDialog(true)}
//                                     />
//                                 </Box>
//                             </Box>
//                         </Grow>
//
//                         {/* ForecastPanel — completely separate, stands beside PlanningView */}
//                         <Grow in={animateIn} timeout={700}>
//                             <Box>
//                                 <ForecastPanel
//                                     template={currentTemplate}
//                                     selectedPeriodIndex={selectedPeriodIndex}
//                                 />
//                             </Box>
//                         </Grow>
//
//                     </Box>
//                 )}
//             </Container>
//
//             <ManualTemplateWizard
//                 open={openWizard}
//                 onClose={() => setOpenWizard(false)}
//                 onCreateTemplate={handleWizardCreate}
//             />
//
//             <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} PaperProps={{ sx: { borderRadius: '12px', p: 1, minWidth: 360 } }}>
//                 <DialogTitle sx={{ fontWeight: 700, color: NAVY, pb: 1 }}>Save a copy</DialogTitle>
//                 <DialogContent>
//                     <TextField
//                         label="New template name" value={saveName}
//                         onChange={e => setSaveName(e.target.value)}
//                         fullWidth margin="normal"
//                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: '7px' } }}
//                     />
//                 </DialogContent>
//                 <DialogActions sx={{ px: 3, pb: 2 }}>
//                     <Button onClick={() => setOpenSaveDialog(false)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
//                     <Button onClick={handleSaveCopy} variant="contained" disabled={!saveName} sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 600, borderRadius: '7px', '&:hover': { bgcolor: MAROON_DARK } }}>Save</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// };
//
// export default BudgetPlanner;
