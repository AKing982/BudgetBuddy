// // ── CurrentMonthView.tsx ──────────────────────────────────────────────────────
// // Top-level view for the "Current Month" mode.
// // • Filters template to current month's columns only
// // • Sub-view toggle: Classic spreadsheet ↔ Visual dashboard
// // • Budget criteria panel (goals, targets, mini-goals, auto-generate)
// // • Edit + save available in Classic mode
// import React, { useMemo, useState, useCallback } from 'react';
// import {
//     Box, Typography, Grid, Stack, Button, Table,
//     TableBody, TableCell, TableContainer, TableHead,
//     TableRow,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Edit, EditOff, Save } from '@mui/icons-material';
// import { TableIcon, LayoutDashboard, Award } from 'lucide-react';
// import {
//     MAROON, MAROON_DARK, NAVY, SLATE, GREEN, RED, TEAL, AMBER, fmt, fmtS, fmtC,
//     filterToCurrentMonth, autoGenerateCriteria, recalcSummaryRows,
//     generateUUID, monthKey, GROUP_ORDER, CAT_COLORS, CAT_PCTS,
//     deriveGroupTotals,
// } from '../domain/SpreadsheetTypes';
// import type {
//     SpreadsheetTemplate, SpreadsheetRow, PeriodFilter,
//     SubViewMode, BudgetCriteria,
// } from '../domain/SpreadsheetTypes';
// import { MaroonCardHeader, PeriodPills } from './SharedBudgetUI';
// import SubViewToggle from './SubViewToggle';
// import ClassicSpreadsheet from './ClassicSpreadsheet';
// import BudgetCriteriaPanel from './BudgetCriteriaPanel';
// import CurrentMonthDashboard from './CurrentMonthDashboard';
//
// interface Props {
//     template:        SpreadsheetTemplate;
//     currentMonth:    Date;
//     periodFilter:    PeriodFilter;
//     onPeriodFilter:  (p: PeriodFilter) => void;
//     onCellChange:    (rowIndex: number, colIndex: number, value: number | null) => void;
//     onSaveTemplate?: () => void;
// }
//
// const DEFAULT_CRITERIA = (mk: string): BudgetCriteria => ({
//     monthKey:         mk,
//     income:           0,
//     categoryTargets:  Object.fromEntries(GROUP_ORDER.map(g => [g, 0])),
//     miniGoals:        [],
//     autoGenerate:     true,
//     budgetRuleId:     '50-30-20',
//     savingsTargetPct: 20,
// });
//
// const CurrentMonthView: React.FC<Props> = ({
//                                                template, currentMonth, periodFilter, onPeriodFilter,
//                                                onCellChange, onSaveTemplate,
//                                            }) => {
//     const [subView,  setSubView]  = useState<SubViewMode>('classic');
//     const [editMode, setEditMode] = useState(false);
//
//     const mk = monthKey(currentMonth);
//
//     // Criteria keyed by month so switching months keeps settings
//     const [criteriaMap, setCriteriaMap] = useState<Record<string, BudgetCriteria>>({});
//     const criteria: BudgetCriteria = useMemo(() => {
//         if (criteriaMap[mk]) return criteriaMap[mk];
//         // Auto-generate from historical data on first visit to a month
//         const generated = autoGenerateCriteria(template, mk, '50-30-20');
//         return { ...DEFAULT_CRITERIA(mk), ...generated };
//     }, [mk, criteriaMap, template]);
//
//     const setCriteria = useCallback((updated: BudgetCriteria) => {
//         setCriteriaMap(prev => ({ ...prev, [mk]: updated }));
//     }, [mk]);
//
//     // Filter template to only the current month's columns
//     const monthTemplate = useMemo(
//         () => filterToCurrentMonth(template, mk),
//         [template, mk],
//     );
//
//     const totalSalary   = monthTemplate.rows.find(r => r.label === 'Salary')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const totalExpenses = monthTemplate.rows.find(r => r.rowType === 'expenses')?.values.reduce((a: number, v) => a + (v ?? 0), 0) ?? 0;
//     const finalBalance  = monthTemplate.rows.find(r => r.rowType === 'balance')?.values.filter((v): v is number => v !== null).slice(-1)[0] ?? 0;
//     const savingsRate   = totalSalary > 0 ? ((totalSalary - totalExpenses) / totalSalary) * 100 : 0;
//
//     // Cell changes in current month view map back to the full template column index
//     const handleCellChange = useCallback((ri: number, ci: number, value: number | null) => {
//         if (!template.periodDates || !monthTemplate.periodDates) return;
//         // Find which column in the full template this month-scoped ci maps to
//         const targetDate = monthTemplate.periodDates[ci];
//         if (!targetDate) return;
//         const fullCi = template.periodDates.findIndex(pd =>
//             pd.start.getTime() === targetDate.start.getTime()
//         );
//         if (fullCi >= 0) onCellChange(ri, fullCi, value);
//     }, [template, monthTemplate, onCellChange]);
//
//     const monthLabel = currentMonth.toLocaleString('default', { month:'long', year:'numeric' });
//
//     return (
//         <Grid container spacing={3} alignItems="flex-start">
//             {/* ── Main content area ─────────────────────────────────── */}
//             <Grid item xs={12} xl={9}>
//                 <Stack spacing={3}>
//                     <Box sx={{
//                         borderRadius:'12px', overflow:'hidden',
//                         border:`1px solid ${alpha(MAROON,0.14)}`,
//                         boxShadow:`0 4px 20px ${alpha(MAROON,0.07)}`,
//                     }}>
//                         <MaroonCardHeader
//                             icon={subView === 'classic' ? <TableIcon size={14} color="white"/> : <LayoutDashboard size={14} color="white"/>}
//                             title={`${monthLabel} budget`}
//                             subtitle={
//                                 subView === 'classic'
//                                     ? `${monthTemplate.periodType} · ${monthTemplate.periods.length} period(s) · Current month only${editMode ? ' · editing' : ''}`
//                                     : 'Visual breakdown · KPIs · category progress'
//                             }
//                             right={
//                                 <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
//                                     {subView === 'classic' && (
//                                         <Button
//                                             size="small"
//                                             onClick={() => setEditMode(v => !v)}
//                                             sx={{
//                                                 borderRadius:'6px', textTransform:'none', fontWeight:600,
//                                                 fontSize:'0.72rem', gap:0.5, px:1.25, py:0.4,
//                                                 border:`1px solid ${editMode ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}`,
//                                                 color:'#fff',
//                                                 bgcolor: editMode ? 'rgba(255,255,255,0.18)' : 'transparent',
//                                                 '&:hover':{ bgcolor:'rgba(255,255,255,0.15)' },
//                                             }}
//                                         >
//                                             {editMode ? <EditOff sx={{ fontSize:'0.8rem' }}/> : <Edit sx={{ fontSize:'0.8rem' }}/>}
//                                             {editMode ? 'Stop' : 'Edit'}
//                                         </Button>
//                                     )}
//                                     {editMode && onSaveTemplate && (
//                                         <Button
//                                             size="small"
//                                             onClick={onSaveTemplate}
//                                             sx={{
//                                                 borderRadius:'6px', textTransform:'none', fontWeight:600,
//                                                 fontSize:'0.72rem', gap:0.5, px:1.25, py:0.4,
//                                                 bgcolor:'rgba(255,255,255,0.18)', color:'#fff',
//                                                 border:'1px solid rgba(255,255,255,0.35)',
//                                                 '&:hover':{ bgcolor:'rgba(255,255,255,0.28)' },
//                                             }}
//                                         >
//                                             <Save sx={{ fontSize:'0.8rem' }}/> Save
//                                         </Button>
//                                     )}
//                                     <SubViewToggle
//                                         active={subView}
//                                         onChange={setSubView}
//                                         options={['classic', 'dashboard']}
//                                     />
//                                 </Box>
//                             }
//                         />
//                         <Box sx={{ bgcolor:'#fff', p:2.5 }}>
//                             {subView === 'classic' && (
//                                 <ClassicSpreadsheet
//                                     template={monthTemplate}
//                                     editMode={editMode}
//                                     onCellChange={handleCellChange}
//                                     periodFilter={periodFilter}
//                                     onPeriodFilter={onPeriodFilter}
//                                     showSavingsRows
//                                 />
//                             )}
//                             {subView === 'dashboard' && (
//                                 <CurrentMonthDashboard
//                                     template={monthTemplate}
//                                     criteria={criteria}
//                                     currentMonth={currentMonth}
//                                 />
//                             )}
//                         </Box>
//                     </Box>
//
//                     {/* Overall summary footer */}
//                     <Box sx={{
//                         borderRadius:'12px', overflow:'hidden',
//                         border:`1px solid ${alpha(MAROON,0.14)}`,
//                         boxShadow:`0 4px 20px ${alpha(MAROON,0.07)}`,
//                     }}>
//                         <MaroonCardHeader
//                             icon={<Award size={14} color="white"/>}
//                             title="Month summary"
//                             subtitle={`${monthLabel} · ${monthTemplate.periods.length} pay period(s)`}
//                         />
//                         <Box sx={{ bgcolor:'#fff', p:0 }}>
//                             <TableContainer>
//                                 <Table size="small">
//                                     <TableHead>
//                                         <TableRow sx={{ bgcolor:'#fdf8f8' }}>
//                                             {['Income','Expenses','Balance','Savings rate','vs 20% goal'].map(h => (
//                                                 <TableCell key={h} sx={{
//                                                     fontWeight:600, color:MAROON, fontSize:'0.68rem',
//                                                     textTransform:'uppercase' as const, letterSpacing:'0.07em',
//                                                     py:1.25, px:2, borderBottom:`1.5px solid ${alpha(MAROON,.12)}`,
//                                                 }}>
//                                                     {h}
//                                                 </TableCell>
//                                             ))}
//                                         </TableRow>
//                                     </TableHead>
//                                     <TableBody>
//                                         <TableRow>
//                                             {(() => {
//                                                 const goal = totalSalary * (criteria.savingsTargetPct / 100);
//                                                 const saved = totalSalary - totalExpenses;
//                                                 const vsGoal = saved - goal;
//                                                 return [
//                                                     { v: `$${fmt(totalSalary)}`,                         c: NAVY  },
//                                                     { v: `$${fmt(totalExpenses)}`,                       c: MAROON },
//                                                     { v: fmtC(finalBalance),                             c: finalBalance >= 0 ? GREEN : RED },
//                                                     { v: `${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(1)}%`, c: savingsRate >= 0 ? GREEN : RED },
//                                                     { v: `${vsGoal >= 0 ? '+' : ''}$${fmtS(Math.abs(vsGoal))}`,     c: vsGoal >= 0 ? GREEN : RED },
//                                                 ].map(({ v, c }, i) => (
//                                                     <TableCell key={i} sx={{ fontWeight:600, fontSize:'0.84rem', color:c, py:1.5, px:2, fontVariantNumeric:'tabular-nums' }}>
//                                                         {v}
//                                                     </TableCell>
//                                                 ));
//                                             })()}
//                                         </TableRow>
//                                     </TableBody>
//                                 </Table>
//                             </TableContainer>
//                         </Box>
//                     </Box>
//                 </Stack>
//             </Grid>
//
//             {/* ── Budget criteria sidebar ───────────────────────────── */}
//             <Grid item xs={12} xl={3}>
//                 <Box sx={{ position:'sticky', top:24 }}>
//                     <BudgetCriteriaPanel
//                         criteria={criteria}
//                         onChange={setCriteria}
//                         showAutoGen
//                     />
//                 </Box>
//             </Grid>
//         </Grid>
//     );
// };
//
// export default CurrentMonthView;