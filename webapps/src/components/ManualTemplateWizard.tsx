import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Dialog, DialogContent, alpha,
    TextField, Button, Grid, LinearProgress, Select, MenuItem, FormControl,
} from '@mui/material';
import {
    CheckCircle2, PenLine, Calendar, DollarSign, LayoutGrid,
    ClipboardList, Sparkles, SlidersHorizontal, List, Layers,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';

const CAT_PALETTE = [
    '#1D9E75','#6b1a1a','#BA7517','#378ADD',
    '#D4537E','#7c3aed','#0ea5e9','#059669',
    '#f59e0b','#6366f1','#ec4899','#14b8a6',
];

const PRESET_CATS = [
    { name: 'Housing',        color: '#1D9E75' },
    { name: 'Food',           color: '#6b1a1a' },
    { name: 'Transportation', color: '#BA7517' },
    { name: 'Entertainment',  color: '#378ADD' },
    { name: 'Other',          color: '#D4537E' },
    { name: 'Savings',        color: '#7c3aed' },
    { name: 'Healthcare',     color: '#0ea5e9' },
    { name: 'Clothing',       color: '#059669' },
];

const FORMATS = [
    { id: 'Weekly',    label: 'Weekly',    desc: 'Every 7 days',         abbr: 'W'  },
    { id: 'Biweekly',  label: 'Biweekly',  desc: 'Every 2 weeks',        abbr: 'BW' },
    { id: 'Monthly',   label: 'Monthly',   desc: 'One column per month', abbr: 'M'  },
    { id: '2-Monthly', label: '2-Month',   desc: 'Every two months',     abbr: '2M' },
    { id: '3-Monthly', label: 'Quarterly', desc: 'Every three months',   abbr: '3M' },
];

const DEFAULT_ALLOC: Record<string, number> = {
    Housing: 0.35, Food: 0.20, Transportation: 0.10,
    Entertainment: 0.10, Savings: 0.10, Healthcare: 0.05,
    Clothing: 0.05, Other: 0.10,
};

// ── Predefined template presets ───────────────────────────────────────────────
interface TemplatePreset {
    name: string;
    group: string;
    description: string;
    suggestedFormat: string;
    suggestedCategories: string[];
    badge: string;
    badgeColor: string;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
    {
        name: 'Standard Rolling Monthly Template',
        group: 'Rolling',
        description: 'Tracks cumulative spending month-over-month with a running balance',
        suggestedFormat: 'Monthly',
        suggestedCategories: ['Housing','Food','Transportation','Entertainment','Other'],
        badge: 'Popular',
        badgeColor: TEAL,
    },
    {
        name: 'Standard Planned/Actual Template',
        group: 'Planned vs Actual',
        description: 'Compare your planned budget against real spending each period',
        suggestedFormat: 'Monthly',
        suggestedCategories: ['Housing','Food','Transportation','Entertainment','Other','Savings'],
        badge: 'Recommended',
        badgeColor: MAROON,
    },
    {
        name: 'Standard Rolling Income Template',
        group: 'Rolling',
        description: 'Focus on income tracking across variable pay periods',
        suggestedFormat: 'Biweekly',
        suggestedCategories: ['Housing','Food','Transportation','Other','Savings'],
        badge: 'Biweekly',
        badgeColor: '#378ADD',
    },
    {
        name: 'Standard Savings Focused Template',
        group: 'Savings',
        description: 'Prioritize savings goals with dedicated savings category tracking',
        suggestedFormat: 'Monthly',
        suggestedCategories: ['Housing','Food','Transportation','Savings','Other'],
        badge: 'Goal-driven',
        badgeColor: '#7c3aed',
    },
    {
        name: 'Standard Weekly Expense Template',
        group: 'Weekly',
        description: 'Granular week-by-week expense tracking for tight budget control',
        suggestedFormat: 'Weekly',
        suggestedCategories: ['Food','Transportation','Entertainment','Other'],
        badge: 'Weekly',
        badgeColor: AMBER,
    },
    {
        name: 'Standard Quarterly Budget Template',
        group: 'Quarterly',
        description: 'High-level quarterly view for planning large or irregular expenses',
        suggestedFormat: '3-Monthly',
        suggestedCategories: ['Housing','Food','Transportation','Entertainment','Healthcare','Other'],
        badge: 'Quarterly',
        badgeColor: '#BA7517',
    },
    {
        name: 'Standard Full Expense Template',
        group: 'Comprehensive',
        description: 'All categories tracked across monthly periods — nothing left out',
        suggestedFormat: 'Monthly',
        suggestedCategories: ['Housing','Food','Transportation','Entertainment','Healthcare','Clothing','Savings','Other'],
        badge: 'All categories',
        badgeColor: GREEN,
    },
    {
        name: 'Custom Template',
        group: 'Custom',
        description: 'Start from scratch with your own name, categories, and format',
        suggestedFormat: '',
        suggestedCategories: [],
        badge: 'Custom',
        badgeColor: SLATE,
    },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface WizardCategory { name: string; color: string; }

interface WizardState {
    templateName: string;
    format: string;
    categories: WizardCategory[];
    startMonth: string;
    endMonth: string;
    income: string;
    allocs: Record<string, string>;
    newCatName: string;
    groupByCategory: boolean;
}

type CreationMode = 'auto' | 'manual' | null;
type PeriodType   = 'Weekly' | 'Biweekly' | 'Monthly' | '2-Monthly' | '3-Monthly';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcNumPeriods(format: string, startMonth: string, endMonth: string): number {
    if (!startMonth || !endMonth) return 0;
    const s = new Date(startMonth + '-01');
    const e = new Date(endMonth   + '-01');
    if (e < s) return 0;
    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
    if (format === 'Monthly')   return months;
    if (format === '2-Monthly') return Math.ceil(months / 2);
    if (format === '3-Monthly') return Math.ceil(months / 3);
    const days = Math.round((new Date(endMonth + '-28').getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (format === 'Weekly')   return Math.round(days / 7);
    if (format === 'Biweekly') return Math.round(days / 14);
    return months;
}

function catFromName(name: string): WizardCategory {
    return PRESET_CATS.find(p => p.name === name)
        ?? { name, color: CAT_PALETTE[Math.floor(Math.random() * CAT_PALETTE.length)] };
}

// ── Step indicators ───────────────────────────────────────────────────────────
const MANUAL_STEPS = [
    { label: 'Format',      icon: <LayoutGrid    size={13} /> },
    { label: 'Categories',  icon: <ClipboardList size={13} /> },
    { label: 'Period',      icon: <Calendar      size={13} /> },
    { label: 'Allocations', icon: <DollarSign    size={13} /> },
    { label: 'Review',      icon: <PenLine       size={13} /> },
];

const AUTO_STEPS = [
    { label: 'Template',  icon: <Sparkles   size={13} /> },
    { label: 'Period',    icon: <Calendar   size={13} /> },
    { label: 'Income',    icon: <DollarSign size={13} /> },
    { label: 'Review',    icon: <PenLine    size={13} /> },
];

const StepIndicator: React.FC<{ current: number; steps: { label: string; icon: React.ReactNode }[] }> = ({ current, steps }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {steps.map((s, i) => (
            <React.Fragment key={s.label}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                        width: 32, height: 32, borderRadius: '8px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        bgcolor: i < current ? TEAL : i === current ? MAROON : alpha('#000', 0.06),
                        color: (i <= current) ? '#fff' : SLATE,
                        border: `1.5px solid ${i < current ? TEAL : i === current ? MAROON : alpha('#000', 0.1)}`,
                    }}>
                        {i < current ? <CheckCircle2 size={14} /> : s.icon}
                    </Box>
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: i === current ? 700 : 500, color: i === current ? MAROON : i < current ? TEAL : SLATE, whiteSpace: 'nowrap' }}>
                        {s.label}
                    </Typography>
                </Box>
                {i < steps.length - 1 && (
                    <Box sx={{ flex: 1, height: '1.5px', mx: 0.5, mb: 2, bgcolor: i < current ? TEAL : alpha('#000', 0.1), transition: 'background-color 0.3s' }} />
                )}
            </React.Fragment>
        ))}
    </Box>
);

// ── Wizard header ─────────────────────────────────────────────────────────────
const WizardHeader: React.FC<{ title: string; sub: string; stepLabel: string }> = ({ title, sub, stepLabel }) => (
    <Box sx={{ background: 'linear-gradient(135deg,#4a1010 0%,#6b1a1a 55%,#5a1515 100%)', px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -22, right: 55, width: 55, height: 55, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PenLine size={15} color="white" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.15 }}>{sub}</Typography>
            </Box>
            {stepLabel && (
                <Box sx={{ px: 1.25, py: 0.35, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{stepLabel}</Typography>
                </Box>
            )}
        </Box>
    </Box>
);

// ── Nav row ───────────────────────────────────────────────────────────────────
const NavRow: React.FC<{
    showBack: boolean; canNext: boolean;
    onBack: () => void; onNext: () => void;
    nextLabel?: string; isLast?: boolean;
}> = ({ showBack, canNext, onBack, onNext, nextLabel, isLast }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: `0.5px solid ${alpha('#000', 0.08)}` }}>
        {showBack
            ? <Button onClick={onBack} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px', border: `0.5px solid ${alpha('#000', 0.12)}`, px: 1.75, py: 0.75, '&:hover': { bgcolor: alpha('#000', 0.04) } }}>← Back</Button>
            : <Box />
        }
        <Button onClick={onNext} disabled={!canNext} variant="contained" sx={{
            bgcolor: isLast ? GREEN : MAROON, color: '#fff', textTransform: 'none',
            fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', px: 2.25, py: 0.8, boxShadow: 'none',
            '&:hover': { bgcolor: isLast ? '#047857' : MAROON_DARK, boxShadow: 'none' },
            '&:disabled': { bgcolor: alpha('#000', 0.1), color: alpha('#000', 0.3) },
        }}>
            {nextLabel ?? 'Continue →'}
        </Button>
    </Box>
);

// ── ── MODE SELECTOR ── ───────────────────────────────────────────────────────
const ModeSelector: React.FC<{ onSelect: (m: CreationMode) => void }> = ({ onSelect }) => (
    <Box sx={{ px: 3, pb: 3, pt: 2 }}>
        <Typography sx={{ fontSize: '0.82rem', color: SLATE, mb: 2.5, lineHeight: 1.65 }}>
            Choose how you'd like to set up your new budget template.
        </Typography>
        <Grid container spacing={1.75}>
            <Grid item xs={12} sm={6}>
                <Box onClick={() => onSelect('auto')} sx={{
                    p: 2.25, borderRadius: '12px', cursor: 'pointer', height: '100%',
                    border: `1.5px solid ${alpha(TEAL, 0.35)}`, bgcolor: alpha(TEAL, 0.03),
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: TEAL, bgcolor: alpha(TEAL, 0.07), transform: 'translateY(-1px)', boxShadow: `0 4px 16px ${alpha(TEAL, 0.14)}` },
                }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: alpha(TEAL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                        <Sparkles size={18} color={TEAL} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: NAVY, mb: 0.5 }}>Auto-generate</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, lineHeight: 1.55, mb: 1.5 }}>
                        Pick a predefined template style and we'll configure categories, format, and allocations automatically.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {['Rolling','Planned/Actual','Savings'].map(t => (
                            <Box key={t} sx={{ px: 0.875, py: 0.3, borderRadius: '4px', bgcolor: alpha(TEAL, 0.1), fontSize: '0.65rem', fontWeight: 700, color: '#0f766e' }}>{t}</Box>
                        ))}
                    </Box>
                </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Box onClick={() => onSelect('manual')} sx={{
                    p: 2.25, borderRadius: '12px', cursor: 'pointer', height: '100%',
                    border: `1.5px solid ${alpha(MAROON, 0.3)}`, bgcolor: alpha(MAROON, 0.02),
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.05), transform: 'translateY(-1px)', boxShadow: `0 4px 16px ${alpha(MAROON, 0.12)}` },
                }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                        <SlidersHorizontal size={18} color={MAROON} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: NAVY, mb: 0.5 }}>Build manually</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, lineHeight: 1.55, mb: 1.5 }}>
                        Walk through a step-by-step wizard to choose your own categories, period range, and exact budget amounts.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {['Custom categories','Your amounts','Full control'].map(t => (
                            <Box key={t} sx={{ px: 0.875, py: 0.3, borderRadius: '4px', bgcolor: alpha(MAROON, 0.08), fontSize: '0.65rem', fontWeight: 700, color: MAROON }}>{t}</Box>
                        ))}
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </Box>
);

// ── ── AUTO STEPS ── ──────────────────────────────────────────────────────────

const PresetDropdown: React.FC<{
    selected: TemplatePreset | null;
    onSelect: (p: TemplatePreset) => void;
}> = ({ selected, onSelect }) => (
    <FormControl fullWidth size="small" sx={{ mb: 1.75 }}>
        <Select
            value={selected?.name ?? ''}
            onChange={e => { const p = TEMPLATE_PRESETS.find(t => t.name === e.target.value); if (p) onSelect(p); }}
            displayEmpty
            renderValue={v => v ? <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600 }}>{v as string}</Typography> : <Typography sx={{ fontSize: '0.85rem', color: alpha(SLATE, 0.7) }}>Choose a template style…</Typography>}
            sx={{ borderRadius: '8px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.15) }, '& .MuiSelect-select': { py: '10px' } }}
        >
            {TEMPLATE_PRESETS.map(p => (
                <MenuItem key={p.name} value={p.name} sx={{ py: 1.25, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                        <Box sx={{ mt: 0.25, px: 0.75, py: 0.3, borderRadius: '4px', bgcolor: alpha(p.badgeColor, 0.12), fontSize: '0.6rem', fontWeight: 800, color: p.badgeColor, flexShrink: 0, minWidth: 54, textAlign: 'center' }}>{p.badge}</Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, mb: 0.2 }}>{p.name}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: SLATE, lineHeight: 1.4 }}>{p.description}</Typography>
                        </Box>
                    </Box>
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

const AutoStepTemplate: React.FC<{
    selectedPreset: TemplatePreset | null;
    customName: string;
    onSelectPreset: (p: TemplatePreset) => void;
    onCustomName: (n: string) => void;
}> = ({ selectedPreset, customName, onSelectPreset, onCustomName }) => {
    const isCustom = selectedPreset?.group === 'Custom';
    return (
        <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Select a template type</Typography>
            <PresetDropdown selected={selectedPreset} onSelect={onSelectPreset} />

            {isCustom && (
                <Box sx={{ mb: 1.75 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Custom template name</Typography>
                    <TextField fullWidth size="small" placeholder="e.g. My 2025 Budget Plan" value={customName} onChange={e => onCustomName(e.target.value)}
                               sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.88rem' } }} />
                </Box>
            )}

            {selectedPreset && !isCustom && (
                <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha(selectedPreset.badgeColor, 0.04), border: `1px solid ${alpha(selectedPreset.badgeColor, 0.2)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ px: 0.875, py: 0.3, borderRadius: '5px', bgcolor: alpha(selectedPreset.badgeColor, 0.12), fontSize: '0.65rem', fontWeight: 800, color: selectedPreset.badgeColor }}>{selectedPreset.badge}</Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{selectedPreset.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: SLATE, mb: 1.25, lineHeight: 1.5 }}>{selectedPreset.description}</Typography>
                    <Grid container spacing={2}>
                        {selectedPreset.suggestedFormat && (
                            <Grid item>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.4 }}>Default format</Typography>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{selectedPreset.suggestedFormat}</Typography>
                            </Grid>
                        )}
                        {selectedPreset.suggestedCategories.length > 0 && (
                            <Grid item xs>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.4 }}>Categories included</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                                    {selectedPreset.suggestedCategories.map(c => {
                                        const col = PRESET_CATS.find(p => p.name === c)?.color ?? SLATE;
                                        return <Box key={c} sx={{ px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: alpha(col, 0.12), fontSize: '0.65rem', fontWeight: 700, color: col }}>{c}</Box>;
                                    })}
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

const AutoStepPeriod: React.FC<{
    format: string; startMonth: string; endMonth: string;
    onFormat: (f: string) => void; onStart: (s: string) => void; onEnd: (e: string) => void;
}> = ({ format, startMonth, endMonth, onFormat, onStart, onEnd }) => {
    const np = calcNumPeriods(format, startMonth, endMonth);
    return (
        <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Period format</Typography>
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {FORMATS.map(f => (
                    <Grid item xs={6} sm={4} key={f.id}>
                        <Box onClick={() => onFormat(f.id)} sx={{
                            p: 1.25, borderRadius: '8px', cursor: 'pointer',
                            border: `1.5px solid ${format === f.id ? MAROON : alpha('#000', 0.1)}`,
                            bgcolor: format === f.id ? alpha(MAROON, 0.04) : '#fff',
                            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 1,
                            '&:hover': { borderColor: MAROON },
                        }}>
                            <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: format === f.id ? alpha(MAROON, 0.1) : alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: format === f.id ? MAROON : SLATE }}>{f.abbr}</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY, lineHeight: 1 }}>{f.label}</Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: SLATE }}>{f.desc}</Typography>
                            </Box>
                            {format === f.id && <CheckCircle2 size={13} color={MAROON} style={{ flexShrink: 0 }} />}
                        </Box>
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Start month</Typography>
                    <TextField fullWidth size="small" type="month" value={startMonth} onChange={e => onStart(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
                </Grid>
                <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>End month</Typography>
                    <TextField fullWidth size="small" type="month" value={endMonth} onChange={e => onEnd(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
                </Grid>
            </Grid>
            {np > 0 && <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.2)}`, fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>{np} {format.toLowerCase()} period{np !== 1 ? 's' : ''} will be generated</Box>}
            {startMonth && endMonth && new Date(endMonth + '-01') < new Date(startMonth + '-01') && (
                <Box sx={{ mt: 1, p: 1, borderRadius: '8px', bgcolor: alpha(RED, 0.06), border: `0.5px solid ${alpha(RED, 0.2)}`, fontSize: '0.75rem', color: RED }}>End month must be after start month.</Box>
            )}
        </Box>
    );
};

const AutoStepIncome: React.FC<{ income: string; format: string; onChange: (v: string) => void }> = ({ income, format, onChange }) => {
    const inc = parseFloat(income) || 0;
    const periodLabel = format === 'Biweekly' ? 'biweekly period' : format === 'Weekly' ? 'week' : format === '2-Monthly' ? '2-month period' : format === '3-Monthly' ? 'quarter' : 'month';
    return (
        <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Take-home income per {periodLabel}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 260, mb: 2.5 }}>
                <Box sx={{ px: 1.25, py: 0.875, border: `0.5px solid ${alpha('#000', 0.18)}`, borderRight: 'none', borderRadius: '8px 0 0 8px', bgcolor: alpha('#000', 0.03), color: SLATE, fontSize: '0.85rem', fontWeight: 600 }}>$</Box>
                <TextField size="small" type="number" placeholder="0.00" value={income} onChange={e => onChange(e.target.value)} inputProps={{ min: 0, step: 0.01 }}
                           sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '0 8px 8px 0', fontSize: '0.88rem', fontWeight: 700 } }} />
            </Box>
            {inc > 0 && (
                <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha(NAVY, 0.03), border: `0.5px solid ${alpha('#000', 0.08)}` }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Auto-allocation preview (50/30/20 baseline)</Typography>
                    {[
                        { label: 'Essentials (50%)', val: inc * 0.50, color: TEAL   },
                        { label: 'Wants (30%)',      val: inc * 0.30, color: MAROON },
                        { label: 'Savings (20%)',    val: inc * 0.20, color: GREEN  },
                    ].map(({ label, val, color }) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: SLATE, minWidth: 130 }}>{label}</Typography>
                            <Box sx={{ flex: 1, height: 5, borderRadius: 2, bgcolor: alpha(color, 0.12) }}>
                                <Box sx={{ height: '100%', borderRadius: 2, bgcolor: color, width: `${(val / inc) * 100}%` }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, minWidth: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${fmtMoney(val)}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

const AutoStepReview: React.FC<{ preset: TemplatePreset; format: string; startMonth: string; endMonth: string; income: string; customName: string }> = ({ preset, format, startMonth, endMonth, income, customName }) => {
    const np  = calcNumPeriods(format, startMonth, endMonth);
    const inc = parseFloat(income) || 0;
    const displayName = preset.group === 'Custom' ? (customName || 'Custom Template') : preset.name;
    return (
        <Box>
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {[
                    { label: 'Template',      value: displayName },
                    { label: 'Format',        value: format },
                    { label: 'Period range',  value: `${startMonth} → ${endMonth}` },
                    { label: 'Periods',       value: `${np} period${np !== 1 ? 's' : ''}` },
                    { label: 'Income/period', value: `$${fmtMoney(inc)}` },
                    { label: 'Total income',  value: `$${fmtMoney(inc * np)}` },
                ].map(f => (
                    <Grid item xs={6} key={f.label}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha('#000', 0.025), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.3 }}>{f.label}</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: NAVY }}>{f.value}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
            {preset.suggestedCategories.length > 0 && (
                <>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.875 }}>Categories ({preset.suggestedCategories.length})</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.75 }}>
                        {preset.suggestedCategories.map(c => {
                            const col = PRESET_CATS.find(p => p.name === c)?.color ?? SLATE;
                            return (
                                <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '20px', bgcolor: col, fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.55)' }} />{c}
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}
            <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.2)}`, fontSize: '0.75rem', color: '#0f766e' }}>
                Category rows will be created from the preset. Income will be pre-filled — all other cells start blank for you to enter actuals.
            </Box>
        </Box>
    );
};

// ── ── MANUAL STEPS ── ────────────────────────────────────────────────────────

// ── Layout style option data ──────────────────────────────────────────────────
const LAYOUT_OPTIONS = [
    {
        val: false,
        icon: <List size={16} />,
        label: 'Flat list',
        desc: 'All categories shown as individual rows — simple and fast to scan.',
        tags: ['Simple', 'No grouping'],
    },
    {
        val: true,
        icon: <Layers size={16} />,
        label: 'Group by category header',
        desc: 'Categories organized under labeled section headers — useful when tracking many related items.',
        tags: ['Sections', 'Organized'],
    },
];

const StepFormat: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
    const selectedPreset = TEMPLATE_PRESETS.find(p => p.name === state.templateName) ?? null;
    const isCustomTyped  = !!state.templateName && !selectedPreset;

    const handlePresetSelect = (p: TemplatePreset) => {
        update({ templateName: p.name, format: p.suggestedFormat || state.format });
    };

    return (
        <Box>
            {/* ── Template name ── */}
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Template name</Typography>
            <PresetDropdown selected={selectedPreset} onSelect={handlePresetSelect} />
            <TextField
                fullWidth size="small"
                placeholder="Or type a custom name…"
                value={isCustomTyped ? state.templateName : ''}
                onChange={e => update({ templateName: e.target.value })}
                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }}
                helperText="Type here to override the dropdown with a custom name"
            />

            {/* ── Period format ── */}
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Period format</Typography>
            <Grid container spacing={1.25} sx={{ mb: 2.75 }}>
                {FORMATS.map(f => (
                    <Grid item xs={12} sm={4} key={f.id}>
                        <Box onClick={() => update({ format: f.id })} sx={{
                            p: 1.5, borderRadius: '10px', cursor: 'pointer',
                            border: `1.5px solid ${state.format === f.id ? MAROON : alpha('#000', 0.1)}`,
                            bgcolor: state.format === f.id ? alpha(MAROON, 0.04) : '#fff',
                            transition: 'all 0.15s', position: 'relative',
                            '&:hover': { borderColor: MAROON },
                        }}>
                            {state.format === f.id && <Box sx={{ position: 'absolute', top: 8, right: 8, color: MAROON }}><CheckCircle2 size={14} /></Box>}
                            <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: state.format === f.id ? alpha(MAROON, 0.1) : alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.875 }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: state.format === f.id ? MAROON : SLATE }}>{f.abbr}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, mb: 0.2 }}>{f.label}</Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{f.desc}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            {/* ── Layout style ── */}
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Layout style</Typography>
            <Grid container spacing={1.25}>
                {LAYOUT_OPTIONS.map(opt => {
                    const isSelected = state.groupByCategory === opt.val;
                    return (
                        <Grid item xs={12} sm={6} key={String(opt.val)}>
                            <Box
                                onClick={() => update({ groupByCategory: opt.val })}
                                sx={{
                                    p: 1.75, borderRadius: '10px', cursor: 'pointer', height: '100%',
                                    border: `1.5px solid ${isSelected ? MAROON : alpha('#000', 0.1)}`,
                                    bgcolor: isSelected ? alpha(MAROON, 0.04) : '#fff',
                                    transition: 'all 0.15s', position: 'relative',
                                    '&:hover': { borderColor: MAROON },
                                }}
                            >
                                {isSelected && (
                                    <Box sx={{ position: 'absolute', top: 8, right: 8, color: MAROON }}>
                                        <CheckCircle2 size={14} />
                                    </Box>
                                )}
                                <Box sx={{
                                    width: 30, height: 30, borderRadius: '7px', mb: 1,
                                    bgcolor: isSelected ? alpha(MAROON, 0.1) : alpha('#000', 0.05),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isSelected ? MAROON : SLATE,
                                }}>
                                    {opt.icon}
                                </Box>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, mb: 0.35, pr: 2 }}>
                                    {opt.label}
                                </Typography>
                                <Typography sx={{ fontSize: '0.70rem', color: SLATE, lineHeight: 1.55, mb: 1 }}>
                                    {opt.desc}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {opt.tags.map(tag => (
                                        <Box key={tag} sx={{
                                            px: 0.75, py: 0.25, borderRadius: '4px',
                                            bgcolor: isSelected ? alpha(MAROON, 0.08) : alpha('#000', 0.05),
                                            fontSize: '0.62rem', fontWeight: 700,
                                            color: isSelected ? MAROON : SLATE,
                                        }}>
                                            {tag}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

const StepCategories: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
    const [newCat, setNewCat] = useState('');

    const togglePreset = (p: typeof PRESET_CATS[0]) => {
        const exists = state.categories.find(c => c.name === p.name);
        if (exists) {
            const cats = state.categories.filter(c => c.name !== p.name);
            const allocs = { ...state.allocs }; delete allocs[p.name];
            update({ categories: cats, allocs });
        } else {
            update({ categories: [...state.categories, { name: p.name, color: p.color }] });
        }
    };

    const addCustom = () => {
        const name = newCat.trim();
        if (!name || state.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) { setNewCat(''); return; }
        update({ categories: [...state.categories, { name, color: CAT_PALETTE[state.categories.length % CAT_PALETTE.length] }] });
        setNewCat('');
    };

    const removeCustom = (name: string) => {
        const cats = state.categories.filter(c => c.name !== name);
        const allocs = { ...state.allocs }; delete allocs[name];
        update({ categories: cats, allocs });
    };

    const customCats = state.categories.filter(c => !PRESET_CATS.find(p => p.name === c.name));

    return (
        <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Preset categories</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                {PRESET_CATS.map(p => {
                    const on = !!state.categories.find(c => c.name === p.name);
                    return (
                        <Box key={p.name} onClick={() => togglePreset(p)} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.5, borderRadius: '20px', cursor: 'pointer', border: `1.5px solid ${on ? p.color : alpha('#000', 0.1)}`, bgcolor: on ? p.color : '#fff', color: on ? '#fff' : SLATE, fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s', '&:hover': { borderColor: p.color } }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: on ? 'rgba(255,255,255,0.7)' : p.color, flexShrink: 0 }} />
                            {p.name}{on && <Box component="span" sx={{ ml: 0.3, opacity: 0.75, fontSize: '0.65rem' }}>✕</Box>}
                        </Box>
                    );
                })}
            </Box>
            {customCats.length > 0 && (
                <>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Custom</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                        {customCats.map(c => (
                            <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.5, borderRadius: '20px', border: `1.5px solid ${c.color}`, bgcolor: c.color, color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
                                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                {c.name}
                                <Box component="span" onClick={() => removeCustom(c.name)} sx={{ ml: 0.3, opacity: 0.75, fontSize: '0.65rem', cursor: 'pointer', '&:hover': { opacity: 1 } }}>✕</Box>
                            </Box>
                        ))}
                    </Box>
                </>
            )}
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Add custom</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" placeholder="Category name…" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
                           sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} />
                <Button onClick={addCustom} sx={{ borderRadius: '8px', border: `1px solid ${alpha(MAROON, 0.25)}`, bgcolor: alpha(MAROON, 0.06), color: MAROON, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, '&:hover': { bgcolor: alpha(MAROON, 0.12) }, whiteSpace: 'nowrap' }}>+ Add</Button>
            </Box>
            {state.categories.length === 0 && <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(AMBER, 0.07), border: `0.5px solid ${alpha(AMBER, 0.3)}`, fontSize: '0.75rem', color: '#92400e' }}>Select at least one category to continue.</Box>}
        </Box>
    );
};

const StepPeriod: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
    const np  = calcNumPeriods(state.format, state.startMonth, state.endMonth);
    const inc = parseFloat(state.income) || 0;
    const periodLabel = state.format === 'Biweekly' ? 'biweekly period' : state.format === 'Weekly' ? 'week' : state.format === '2-Monthly' ? '2-month period' : state.format === '3-Monthly' ? 'quarter' : 'month';
    return (
        <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Start month</Typography>
                    <TextField fullWidth size="small" type="month" value={state.startMonth} onChange={e => update({ startMonth: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
                </Grid>
                <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>End month</Typography>
                    <TextField fullWidth size="small" type="month" value={state.endMonth} onChange={e => update({ endMonth: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
                </Grid>
            </Grid>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Take-home income per {periodLabel}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 240, mb: 2 }}>
                <Box sx={{ px: 1.25, py: 0.875, border: `0.5px solid ${alpha('#000', 0.18)}`, borderRight: 'none', borderRadius: '8px 0 0 8px', bgcolor: alpha('#000', 0.03), color: SLATE, fontSize: '0.85rem', fontWeight: 600 }}>$</Box>
                <TextField size="small" type="number" placeholder="0.00" value={state.income} onChange={e => update({ income: e.target.value })} inputProps={{ min: 0, step: 0.01 }}
                           sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '0 8px 8px 0', fontSize: '0.85rem' } }} />
            </Box>
            {np > 0 && inc > 0 && (
                <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.25)}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: TEAL }}>{np} {state.format.toLowerCase()} period{np !== 1 ? 's' : ''} generated</Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>Total: ${fmtMoney(np * inc)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={100} sx={{ height: 3, borderRadius: 2, bgcolor: alpha(TEAL, 0.15), '& .MuiLinearProgress-bar': { bgcolor: TEAL } }} />
                </Box>
            )}
            {state.startMonth && state.endMonth && new Date(state.endMonth + '-01') < new Date(state.startMonth + '-01') && (
                <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(RED, 0.06), border: `0.5px solid ${alpha(RED, 0.2)}`, fontSize: '0.75rem', color: RED }}>End month must be after start month.</Box>
            )}
        </Box>
    );
};

const StepAllocations: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
    const inc = parseFloat(state.income) || 0;
    const np  = calcNumPeriods(state.format, state.startMonth, state.endMonth);
    const totalAlloc = state.categories.reduce((s, c) => s + (parseFloat(state.allocs[c.name] || '0') || 0), 0);
    const remaining  = inc - totalAlloc;
    const utilPct    = inc > 0 ? Math.min((totalAlloc / inc) * 100, 100) : 0;
    const overBudget = remaining < -0.001;
    const nearLimit  = remaining >= 0 && remaining < inc * 0.05;
    const barColor   = overBudget ? RED : nearLimit ? AMBER : TEAL;

    const autoFill = () => {
        const allocs = { ...state.allocs };
        state.categories.forEach(c => { if (!allocs[c.name] || allocs[c.name] === '0') { allocs[c.name] = (inc * (DEFAULT_ALLOC[c.name] ?? 0.08)).toFixed(2); } });
        update({ allocs });
    };

    return (
        <Box>
            {inc > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Income per period: <strong style={{ color: NAVY }}>${fmtMoney(inc)}</strong></Typography>
                    <Button onClick={autoFill} size="small" sx={{ fontSize: '0.72rem', fontWeight: 700, color: TEAL, textTransform: 'none', border: `0.5px solid ${alpha(TEAL, 0.3)}`, borderRadius: '6px', px: 1, py: 0.4, '&:hover': { bgcolor: alpha(TEAL, 0.06) } }}>Auto-fill suggestions</Button>
                </Box>
            )}
            <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `0.5px solid ${alpha('#000', 0.1)}`, mb: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 70px 100px', bgcolor: alpha(MAROON, 0.04), borderBottom: `1.5px solid ${alpha(MAROON, 0.14)}` }}>
                    {['Category','Per period','% income',`Total (${np}p)`].map((h, i) => (
                        <Box key={h} sx={{ px: 1.5, py: 1, fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: MAROON, textAlign: i > 0 ? 'right' : 'left' }}>{h}</Box>
                    ))}
                </Box>
                {state.categories.map((cat, ri) => {
                    const val    = state.allocs[cat.name] || '';
                    const numVal = parseFloat(val) || 0;
                    const pct    = inc > 0 && numVal > 0 ? ((numVal / inc) * 100).toFixed(1) + '%' : '—';
                    const total  = numVal > 0 && np > 0 ? '$' + fmtMoney(numVal * np) : '—';
                    return (
                        <Box key={cat.name} sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 70px 100px', alignItems: 'center', bgcolor: ri % 2 === 0 ? '#fff' : alpha('#000', 0.015), borderBottom: ri < state.categories.length - 1 ? `0.5px solid ${alpha('#000', 0.06)}` : 'none' }}>
                            <Box sx={{ px: 1.5, py: 0.875, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{ width: 3, height: 14, borderRadius: '2px', bgcolor: cat.color, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.8rem', color: NAVY, fontWeight: 500 }}>{cat.name}</Typography>
                            </Box>
                            <Box sx={{ px: 1, py: 0.625, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Box sx={{ px: 0.875, py: 0.4, border: `0.5px solid ${alpha('#000', 0.15)}`, borderRight: 'none', borderRadius: '6px 0 0 6px', bgcolor: alpha('#000', 0.025), color: SLATE, fontSize: '0.75rem' }}>$</Box>
                                <Box component="input" type="number" min={0} step={0.01} value={val}
                                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ allocs: { ...state.allocs, [cat.name]: e.target.value } })}
                                     placeholder="0.00"
                                     sx={{ width: 90, px: 0.875, py: 0.4, border: `0.5px solid ${alpha('#000', 0.15)}`, borderRadius: '0 6px 6px 0', fontSize: '0.8rem', textAlign: 'right', bgcolor: 'transparent', color: NAVY, outline: 'none', fontFamily: 'inherit', '&:focus': { borderColor: MAROON } }}
                                />
                            </Box>
                            <Box sx={{ px: 1.5, py: 0.875, textAlign: 'right' }}><Typography sx={{ fontSize: '0.75rem', color: SLATE }}>{pct}</Typography></Box>
                            <Box sx={{ px: 1.5, py: 0.875, textAlign: 'right' }}><Typography sx={{ fontSize: '0.75rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>{total}</Typography></Box>
                        </Box>
                    );
                })}
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha(barColor, 0.05), border: `0.5px solid ${alpha(barColor, 0.25)}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.875 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: barColor }}>${fmtMoney(totalAlloc)} allocated of ${fmtMoney(inc)}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: overBudget ? RED : GREEN }}>{overBudget ? `$${fmtMoney(-remaining)} over` : `$${fmtMoney(remaining)} remaining`}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={utilPct} sx={{ height: 5, borderRadius: 2, bgcolor: alpha(barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: barColor } }} />
            </Box>
        </Box>
    );
};

const StepReview: React.FC<{ state: WizardState }> = ({ state }) => {
    const np  = calcNumPeriods(state.format, state.startMonth, state.endMonth);
    const inc = parseFloat(state.income) || 0;
    const totalAlloc = state.categories.reduce((s, c) => s + (parseFloat(state.allocs[c.name] || '0') || 0), 0);
    const over = totalAlloc > inc;
    return (
        <Box>
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {[
                    { label: 'Template name',   value: state.templateName },
                    { label: 'Format',          value: state.format },
                    { label: 'Period range',    value: `${state.startMonth} → ${state.endMonth}` },
                    { label: 'Periods',         value: `${np} period${np !== 1 ? 's' : ''}` },
                    { label: 'Income/period',   value: `$${fmtMoney(inc)}` },
                    { label: 'Total allocated', value: `$${fmtMoney(totalAlloc)} / $${fmtMoney(inc)}`, color: over ? RED : GREEN },
                    { label: 'Layout style',    value: state.groupByCategory ? 'Group by category header' : 'Flat list' },
                ].map(f => (
                    <Grid item xs={6} key={f.label}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha('#000', 0.025), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.3 }}>{f.label}</Typography>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: (f as any).color ?? NAVY }}>{f.value}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Categories ({state.categories.length})</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.625, mb: 1.5 }}>
                {state.categories.map(c => (
                    <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.125, py: 0.45, borderRadius: '20px', bgcolor: c.color, fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.55)' }} />
                        {c.name} · ${fmtMoney(parseFloat(state.allocs[c.name] || '0') || 0)}
                    </Box>
                ))}
            </Box>
            {over && <Box sx={{ p: 1.125, borderRadius: '8px', bgcolor: alpha(AMBER, 0.07), border: `0.5px solid ${alpha(AMBER, 0.3)}`, fontSize: '0.75rem', color: '#92400e', mb: 1 }}>Allocations exceed income — you can adjust values afterwards.</Box>}
            <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.2)}`, fontSize: '0.75rem', color: '#0f766e' }}>
                Category allocations will pre-fill every period row — you can edit any cell afterwards.
            </Box>
        </Box>
    );
};

// ── ── MAIN COMPONENT ── ──────────────────────────────────────────────────────

interface ManualTemplateWizardProps {
    open: boolean;
    onClose: () => void;
    onCreateTemplate: (template: {
        name: string;
        periodType: PeriodType;
        startMonth: string;
        endMonth: string;
        income: number;
        categories: WizardCategory[];
        allocs: Record<string, number>;
        groupByCategory: boolean;
    }) => void;
}

const BLANK_WS: WizardState = {
    templateName: '',
    format: '',
    categories: [],
    startMonth: '',
    endMonth: '',
    income: '',
    allocs: {},
    newCatName: '',
    groupByCategory: false,
};

export const ManualTemplateWizard: React.FC<ManualTemplateWizardProps> = ({ open, onClose, onCreateTemplate }) => {
    const [mode, setMode] = useState<CreationMode>(null);
    const [step, setStep] = useState(0);

    // Manual state
    const [ws,  setWs]  = useState<WizardState>(BLANK_WS);
    const update = (p: Partial<WizardState>) => setWs(prev => ({ ...prev, ...p }));

    // Auto state
    const [autoPreset,     setAutoPreset]     = useState<TemplatePreset | null>(null);
    const [autoCustomName, setAutoCustomName] = useState('');
    const [autoFormat,     setAutoFormat]     = useState('');
    const [autoStart,      setAutoStart]      = useState('');
    const [autoEnd,        setAutoEnd]        = useState('');
    const [autoIncome,     setAutoIncome]     = useState('');

    const reset = () => {
        setMode(null); setStep(0); setWs(BLANK_WS);
        setAutoPreset(null); setAutoCustomName(''); setAutoFormat('');
        setAutoStart(''); setAutoEnd(''); setAutoIncome('');
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSelectPreset = (p: TemplatePreset) => {
        setAutoPreset(p);
        if (p.suggestedFormat) setAutoFormat(p.suggestedFormat);
    };

    const autoNp   = useMemo(() => calcNumPeriods(autoFormat, autoStart, autoEnd), [autoFormat, autoStart, autoEnd]);
    const manualNp = useMemo(() => calcNumPeriods(ws.format, ws.startMonth, ws.endMonth), [ws.format, ws.startMonth, ws.endMonth]);

    // ── Header meta ───────────────────────────────────────────────────────────
    const headerInfo = useMemo(() => {
        if (!mode) return { title: 'New Budget Template', sub: 'Choose how to set up your template', label: '' };
        if (mode === 'auto') {
            const t = [
                ['Select a Template Style',  'Choose from predefined template types'],
                ['Set Period Range',          'Define your tracking window'],
                ['Enter Your Income',         "We'll allocate it automatically"],
                ['Review & Create',           'Confirm before generating'],
            ][step] ?? ['Review & Create',''];
            return { title: t[0], sub: t[1], label: `Step ${step + 1} of ${AUTO_STEPS.length}` };
        }
        const t = [
            ['Choose Format & Name',   'Pick a template name, period type, and layout style'],
            ['Select Categories',      'What spending areas to track'],
            ['Period & Income',        'Date range and per-period income'],
            ['Set Allocations',        'How much per category per period'],
            ['Review & Create',        'Confirm everything before creating'],
        ][step] ?? ['Review & Create',''];
        return { title: t[0], sub: t[1], label: `Step ${step + 1} of ${MANUAL_STEPS.length}` };
    }, [mode, step]);

    // ── Validation ────────────────────────────────────────────────────────────
    const canNext = useMemo(() => {
        if (!mode) return false;
        if (mode === 'auto') {
            if (step === 0) return !!autoPreset && (autoPreset.group !== 'Custom' || autoCustomName.trim().length > 0);
            if (step === 1) {
                const ok  = !!autoFormat && !!autoStart && !!autoEnd && autoNp > 0;
                const ord = autoStart && autoEnd && new Date(autoEnd + '-01') >= new Date(autoStart + '-01');
                return !!(ok && ord);
            }
            if (step === 2) return !!autoIncome && parseFloat(autoIncome) > 0;
            return true;
        }
        if (mode === 'manual') {
            if (step === 0) return !!ws.format && ws.templateName.trim().length > 0;
            if (step === 1) return ws.categories.length > 0;
            if (step === 2) {
                const ok  = !!ws.startMonth && !!ws.endMonth && !!ws.income && manualNp > 0;
                const ord = ws.startMonth && ws.endMonth && new Date(ws.endMonth + '-01') >= new Date(ws.startMonth + '-01');
                return !!(ok && ord);
            }
            if (step === 3) return ws.categories.length > 0;
            return true;
        }
        return false;
    }, [mode, step, autoPreset, autoCustomName, autoFormat, autoStart, autoEnd, autoNp, autoIncome, ws, manualNp]);

    const maxStep = mode === 'auto' ? AUTO_STEPS.length - 1 : MANUAL_STEPS.length - 1;

    const handleNext = () => {
        if (step < maxStep) { setStep(s => s + 1); return; }
        // Emit template
        if (mode === 'auto' && autoPreset) {
            const name = autoPreset.group === 'Custom' ? (autoCustomName.trim() || 'Custom Template') : autoPreset.name;
            const cats = autoPreset.suggestedCategories.map(catFromName);
            const inc  = parseFloat(autoIncome) || 0;
            const defaultPcts: Record<string, number> = { Housing:0.35, Food:0.20, Transportation:0.10, Entertainment:0.10, Savings:0.15, Healthcare:0.05, Clothing:0.05, Other:0.10 };
            const allocs: Record<string, number> = {};
            cats.forEach(c => { allocs[c.name] = Math.round((defaultPcts[c.name] ?? 0.08) * inc * 100) / 100; });
            onCreateTemplate({ name, periodType: autoFormat as PeriodType, startMonth: autoStart, endMonth: autoEnd, income: inc, categories: cats, allocs, groupByCategory: false });
        } else if (mode === 'manual') {
            onCreateTemplate({
                name: ws.templateName, periodType: ws.format as PeriodType,
                startMonth: ws.startMonth, endMonth: ws.endMonth,
                income: parseFloat(ws.income) || 0, categories: ws.categories,
                allocs: Object.fromEntries(Object.entries(ws.allocs).map(([k, v]) => [k, parseFloat(v) || 0])),
                groupByCategory: ws.groupByCategory,
            });
        }
        reset(); onClose();
    };

    const handleBack = () => {
        if (step === 0) { setMode(null); return; }
        setStep(s => Math.max(0, s - 1));
    };

    const steps = mode === 'auto' ? AUTO_STEPS : MANUAL_STEPS;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', m: 2 } }}>
            <WizardHeader title={headerInfo.title} sub={headerInfo.sub} stepLabel={headerInfo.label} />
            <DialogContent sx={{ p: 0 }}>

                {/* ── Mode selector ── */}
                {!mode && (
                    <>
                        <ModeSelector onSelect={m => { setMode(m); setStep(0); }} />
                        <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', borderTop: `0.5px solid ${alpha('#000', 0.08)}`, mx: 3, pt: 2 }}>
                            <Button
                                onClick={handleClose}
                                variant="outlined"
                                sx={{
                                    color: SLATE,
                                    borderColor: alpha('#000', 0.18),
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    borderRadius: '8px',
                                    px: 2,
                                    py: 0.75,
                                    '&:hover': { bgcolor: alpha('#000', 0.04), borderColor: alpha('#000', 0.3) },
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </>
                )}

                {/* ── Step flow ── */}
                {!!mode && (
                    <>
                        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                            <StepIndicator current={step} steps={steps} />
                        </Box>
                        <Box sx={{ px: 3, pb: 3 }}>

                            {/* AUTO */}
                            {mode === 'auto' && step === 0 && <AutoStepTemplate selectedPreset={autoPreset} customName={autoCustomName} onSelectPreset={handleSelectPreset} onCustomName={setAutoCustomName} />}
                            {mode === 'auto' && step === 1 && <AutoStepPeriod format={autoFormat} startMonth={autoStart} endMonth={autoEnd} onFormat={setAutoFormat} onStart={setAutoStart} onEnd={setAutoEnd} />}
                            {mode === 'auto' && step === 2 && <AutoStepIncome income={autoIncome} format={autoFormat} onChange={setAutoIncome} />}
                            {mode === 'auto' && step === 3 && autoPreset && <AutoStepReview preset={autoPreset} format={autoFormat} startMonth={autoStart} endMonth={autoEnd} income={autoIncome} customName={autoCustomName} />}

                            {/* MANUAL */}
                            {mode === 'manual' && step === 0 && <StepFormat state={ws} update={update} />}
                            {mode === 'manual' && step === 1 && <StepCategories state={ws} update={update} />}
                            {mode === 'manual' && step === 2 && <StepPeriod state={ws} update={update} />}
                            {mode === 'manual' && step === 3 && <StepAllocations state={ws} update={update} />}
                            {mode === 'manual' && step === 4 && <StepReview state={ws} />}

                            <NavRow
                                showBack={true}
                                canNext={canNext}
                                onBack={handleBack}
                                onNext={handleNext}
                                nextLabel={step === maxStep ? '✓ Create Template' : 'Continue →'}
                                isLast={step === maxStep}
                            />
                        </Box>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ManualTemplateWizard;

// import React, { useState, useMemo } from 'react';
// import {
//     Box, Typography, Dialog, DialogContent, alpha,
//     TextField, Button, Grid, LinearProgress, Select, MenuItem, FormControl,
// } from '@mui/material';
// import {
//     CheckCircle2, PenLine, Calendar, DollarSign, LayoutGrid,
//     ClipboardList, Sparkles, SlidersHorizontal,
// } from 'lucide-react';
//
// // ── Design tokens ─────────────────────────────────────────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
// const TEAL        = '#0d9488';
// const GREEN       = '#059669';
// const AMBER       = '#d97706';
// const RED         = '#dc2626';
// const NAVY        = '#1e293b';
// const SLATE       = '#64748b';
//
// const CAT_PALETTE = [
//     '#1D9E75','#6b1a1a','#BA7517','#378ADD',
//     '#D4537E','#7c3aed','#0ea5e9','#059669',
//     '#f59e0b','#6366f1','#ec4899','#14b8a6',
// ];
//
// const PRESET_CATS = [
//     { name: 'Housing',        color: '#1D9E75' },
//     { name: 'Food',           color: '#6b1a1a' },
//     { name: 'Transportation', color: '#BA7517' },
//     { name: 'Entertainment',  color: '#378ADD' },
//     { name: 'Other',          color: '#D4537E' },
//     { name: 'Savings',        color: '#7c3aed' },
//     { name: 'Healthcare',     color: '#0ea5e9' },
//     { name: 'Clothing',       color: '#059669' },
// ];
//
// const FORMATS = [
//     { id: 'Weekly',    label: 'Weekly',    desc: 'Every 7 days',         abbr: 'W'  },
//     { id: 'Biweekly',  label: 'Biweekly',  desc: 'Every 2 weeks',        abbr: 'BW' },
//     { id: 'Monthly',   label: 'Monthly',   desc: 'One column per month', abbr: 'M'  },
//     { id: '2-Monthly', label: '2-Month',   desc: 'Every two months',     abbr: '2M' },
//     { id: '3-Monthly', label: 'Quarterly', desc: 'Every three months',   abbr: '3M' },
// ];
//
// const DEFAULT_ALLOC: Record<string, number> = {
//     Housing: 0.35, Food: 0.20, Transportation: 0.10,
//     Entertainment: 0.10, Savings: 0.10, Healthcare: 0.05,
//     Clothing: 0.05, Other: 0.10,
// };
//
// // ── Predefined template presets ───────────────────────────────────────────────
// interface TemplatePreset {
//     name: string;
//     group: string;
//     description: string;
//     suggestedFormat: string;
//     suggestedCategories: string[];
//     badge: string;
//     badgeColor: string;
// }
//
// const TEMPLATE_PRESETS: TemplatePreset[] = [
//     {
//         name: 'Standard Rolling Monthly Template',
//         group: 'Rolling',
//         description: 'Tracks cumulative spending month-over-month with a running balance',
//         suggestedFormat: 'Monthly',
//         suggestedCategories: ['Housing','Food','Transportation','Entertainment','Other'],
//         badge: 'Popular',
//         badgeColor: TEAL,
//     },
//     {
//         name: 'Standard Planned/Actual Template',
//         group: 'Planned vs Actual',
//         description: 'Compare your planned budget against real spending each period',
//         suggestedFormat: 'Monthly',
//         suggestedCategories: ['Housing','Food','Transportation','Entertainment','Other','Savings'],
//         badge: 'Recommended',
//         badgeColor: MAROON,
//     },
//     {
//         name: 'Standard Rolling Income Template',
//         group: 'Rolling',
//         description: 'Focus on income tracking across variable pay periods',
//         suggestedFormat: 'Biweekly',
//         suggestedCategories: ['Housing','Food','Transportation','Other','Savings'],
//         badge: 'Biweekly',
//         badgeColor: '#378ADD',
//     },
//     {
//         name: 'Standard Savings Focused Template',
//         group: 'Savings',
//         description: 'Prioritize savings goals with dedicated savings category tracking',
//         suggestedFormat: 'Monthly',
//         suggestedCategories: ['Housing','Food','Transportation','Savings','Other'],
//         badge: 'Goal-driven',
//         badgeColor: '#7c3aed',
//     },
//     {
//         name: 'Standard Weekly Expense Template',
//         group: 'Weekly',
//         description: 'Granular week-by-week expense tracking for tight budget control',
//         suggestedFormat: 'Weekly',
//         suggestedCategories: ['Food','Transportation','Entertainment','Other'],
//         badge: 'Weekly',
//         badgeColor: AMBER,
//     },
//     {
//         name: 'Standard Quarterly Budget Template',
//         group: 'Quarterly',
//         description: 'High-level quarterly view for planning large or irregular expenses',
//         suggestedFormat: '3-Monthly',
//         suggestedCategories: ['Housing','Food','Transportation','Entertainment','Healthcare','Other'],
//         badge: 'Quarterly',
//         badgeColor: '#BA7517',
//     },
//     {
//         name: 'Standard Full Expense Template',
//         group: 'Comprehensive',
//         description: 'All categories tracked across monthly periods — nothing left out',
//         suggestedFormat: 'Monthly',
//         suggestedCategories: ['Housing','Food','Transportation','Entertainment','Healthcare','Clothing','Savings','Other'],
//         badge: 'All categories',
//         badgeColor: GREEN,
//     },
//     {
//         name: 'Custom Template',
//         group: 'Custom',
//         description: 'Start from scratch with your own name, categories, and format',
//         suggestedFormat: '',
//         suggestedCategories: [],
//         badge: 'Custom',
//         badgeColor: SLATE,
//     },
// ];
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// interface WizardCategory { name: string; color: string; }
//
// interface WizardState {
//     templateName: string;
//     format: string;
//     categories: WizardCategory[];
//     startMonth: string;
//     endMonth: string;
//     income: string;
//     allocs: Record<string, string>;
//     newCatName: string;
// }
//
// type CreationMode = 'auto' | 'manual' | null;
// type PeriodType   = 'Weekly' | 'Biweekly' | 'Monthly' | '2-Monthly' | '3-Monthly';
//
// // ── Helpers ───────────────────────────────────────────────────────────────────
// function fmtMoney(n: number) {
//     return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// }
//
// function calcNumPeriods(format: string, startMonth: string, endMonth: string): number {
//     if (!startMonth || !endMonth) return 0;
//     const s = new Date(startMonth + '-01');
//     const e = new Date(endMonth   + '-01');
//     if (e < s) return 0;
//     const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
//     if (format === 'Monthly')   return months;
//     if (format === '2-Monthly') return Math.ceil(months / 2);
//     if (format === '3-Monthly') return Math.ceil(months / 3);
//     const days = Math.round((new Date(endMonth + '-28').getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
//     if (format === 'Weekly')   return Math.round(days / 7);
//     if (format === 'Biweekly') return Math.round(days / 14);
//     return months;
// }
//
// function catFromName(name: string): WizardCategory {
//     return PRESET_CATS.find(p => p.name === name)
//         ?? { name, color: CAT_PALETTE[Math.floor(Math.random() * CAT_PALETTE.length)] };
// }
//
// // ── Step indicators ───────────────────────────────────────────────────────────
// const MANUAL_STEPS = [
//     { label: 'Format',      icon: <LayoutGrid    size={13} /> },
//     { label: 'Categories',  icon: <ClipboardList size={13} /> },
//     { label: 'Period',      icon: <Calendar      size={13} /> },
//     { label: 'Allocations', icon: <DollarSign    size={13} /> },
//     { label: 'Review',      icon: <PenLine       size={13} /> },
// ];
//
// const AUTO_STEPS = [
//     { label: 'Template',  icon: <Sparkles   size={13} /> },
//     { label: 'Period',    icon: <Calendar   size={13} /> },
//     { label: 'Income',    icon: <DollarSign size={13} /> },
//     { label: 'Review',    icon: <PenLine    size={13} /> },
// ];
//
// const StepIndicator: React.FC<{ current: number; steps: { label: string; icon: React.ReactNode }[] }> = ({ current, steps }) => (
//     <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
//         {steps.map((s, i) => (
//             <React.Fragment key={s.label}>
//                 <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
//                     <Box sx={{
//                         width: 32, height: 32, borderRadius: '8px', display: 'flex',
//                         alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
//                         bgcolor: i < current ? TEAL : i === current ? MAROON : alpha('#000', 0.06),
//                         color: (i <= current) ? '#fff' : SLATE,
//                         border: `1.5px solid ${i < current ? TEAL : i === current ? MAROON : alpha('#000', 0.1)}`,
//                     }}>
//                         {i < current ? <CheckCircle2 size={14} /> : s.icon}
//                     </Box>
//                     <Typography sx={{ fontSize: '0.62rem', fontWeight: i === current ? 700 : 500, color: i === current ? MAROON : i < current ? TEAL : SLATE, whiteSpace: 'nowrap' }}>
//                         {s.label}
//                     </Typography>
//                 </Box>
//                 {i < steps.length - 1 && (
//                     <Box sx={{ flex: 1, height: '1.5px', mx: 0.5, mb: 2, bgcolor: i < current ? TEAL : alpha('#000', 0.1), transition: 'background-color 0.3s' }} />
//                 )}
//             </React.Fragment>
//         ))}
//     </Box>
// );
//
// // ── Wizard header ─────────────────────────────────────────────────────────────
// const WizardHeader: React.FC<{ title: string; sub: string; stepLabel: string }> = ({ title, sub, stepLabel }) => (
//     <Box sx={{ background: 'linear-gradient(135deg,#4a1010 0%,#6b1a1a 55%,#5a1515 100%)', px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
//         <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//         <Box sx={{ position: 'absolute', bottom: -22, right: 55, width: 55, height: 55, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
//             <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                 <PenLine size={15} color="white" />
//             </Box>
//             <Box sx={{ flex: 1, minWidth: 0 }}>
//                 <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
//                 <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.65)', mt: 0.15 }}>{sub}</Typography>
//             </Box>
//             {stepLabel && (
//                 <Box sx={{ px: 1.25, py: 0.35, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>
//                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{stepLabel}</Typography>
//                 </Box>
//             )}
//         </Box>
//     </Box>
// );
//
// // ── Nav row ───────────────────────────────────────────────────────────────────
// const NavRow: React.FC<{
//     showBack: boolean; canNext: boolean;
//     onBack: () => void; onNext: () => void;
//     nextLabel?: string; isLast?: boolean;
// }> = ({ showBack, canNext, onBack, onNext, nextLabel, isLast }) => (
//     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: `0.5px solid ${alpha('#000', 0.08)}` }}>
//         {showBack
//             ? <Button onClick={onBack} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px', border: `0.5px solid ${alpha('#000', 0.12)}`, px: 1.75, py: 0.75, '&:hover': { bgcolor: alpha('#000', 0.04) } }}>← Back</Button>
//             : <Box />
//         }
//         <Button onClick={onNext} disabled={!canNext} variant="contained" sx={{
//             bgcolor: isLast ? GREEN : MAROON, color: '#fff', textTransform: 'none',
//             fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', px: 2.25, py: 0.8, boxShadow: 'none',
//             '&:hover': { bgcolor: isLast ? '#047857' : MAROON_DARK, boxShadow: 'none' },
//             '&:disabled': { bgcolor: alpha('#000', 0.1), color: alpha('#000', 0.3) },
//         }}>
//             {nextLabel ?? 'Continue →'}
//         </Button>
//     </Box>
// );
//
// // ── ── MODE SELECTOR ── ───────────────────────────────────────────────────────
// const ModeSelector: React.FC<{ onSelect: (m: CreationMode) => void }> = ({ onSelect }) => (
//     <Box sx={{ px: 3, pb: 3, pt: 2 }}>
//         <Typography sx={{ fontSize: '0.82rem', color: SLATE, mb: 2.5, lineHeight: 1.65 }}>
//             Choose how you'd like to set up your new budget template.
//         </Typography>
//         <Grid container spacing={1.75}>
//             <Grid item xs={12} sm={6}>
//                 <Box onClick={() => onSelect('auto')} sx={{
//                     p: 2.25, borderRadius: '12px', cursor: 'pointer', height: '100%',
//                     border: `1.5px solid ${alpha(TEAL, 0.35)}`, bgcolor: alpha(TEAL, 0.03),
//                     transition: 'all 0.18s',
//                     '&:hover': { borderColor: TEAL, bgcolor: alpha(TEAL, 0.07), transform: 'translateY(-1px)', boxShadow: `0 4px 16px ${alpha(TEAL, 0.14)}` },
//                 }}>
//                     <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: alpha(TEAL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
//                         <Sparkles size={18} color={TEAL} />
//                     </Box>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: NAVY, mb: 0.5 }}>Auto-generate</Typography>
//                     <Typography sx={{ fontSize: '0.75rem', color: SLATE, lineHeight: 1.55, mb: 1.5 }}>
//                         Pick a predefined template style and we'll configure categories, format, and allocations automatically.
//                     </Typography>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                         {['Rolling','Planned/Actual','Savings'].map(t => (
//                             <Box key={t} sx={{ px: 0.875, py: 0.3, borderRadius: '4px', bgcolor: alpha(TEAL, 0.1), fontSize: '0.65rem', fontWeight: 700, color: '#0f766e' }}>{t}</Box>
//                         ))}
//                     </Box>
//                 </Box>
//             </Grid>
//             <Grid item xs={12} sm={6}>
//                 <Box onClick={() => onSelect('manual')} sx={{
//                     p: 2.25, borderRadius: '12px', cursor: 'pointer', height: '100%',
//                     border: `1.5px solid ${alpha(MAROON, 0.3)}`, bgcolor: alpha(MAROON, 0.02),
//                     transition: 'all 0.18s',
//                     '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.05), transform: 'translateY(-1px)', boxShadow: `0 4px 16px ${alpha(MAROON, 0.12)}` },
//                 }}>
//                     <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
//                         <SlidersHorizontal size={18} color={MAROON} />
//                     </Box>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: NAVY, mb: 0.5 }}>Build manually</Typography>
//                     <Typography sx={{ fontSize: '0.75rem', color: SLATE, lineHeight: 1.55, mb: 1.5 }}>
//                         Walk through a step-by-step wizard to choose your own categories, period range, and exact budget amounts.
//                     </Typography>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                         {['Custom categories','Your amounts','Full control'].map(t => (
//                             <Box key={t} sx={{ px: 0.875, py: 0.3, borderRadius: '4px', bgcolor: alpha(MAROON, 0.08), fontSize: '0.65rem', fontWeight: 700, color: MAROON }}>{t}</Box>
//                         ))}
//                     </Box>
//                 </Box>
//             </Grid>
//         </Grid>
//     </Box>
// );
//
// // ── ── AUTO STEPS ── ──────────────────────────────────────────────────────────
//
// // Shared preset dropdown used in both auto step 0 and manual step 0
// const PresetDropdown: React.FC<{
//     selected: TemplatePreset | null;
//     onSelect: (p: TemplatePreset) => void;
// }> = ({ selected, onSelect }) => (
//     <FormControl fullWidth size="small" sx={{ mb: 1.75 }}>
//         <Select
//             value={selected?.name ?? ''}
//             onChange={e => { const p = TEMPLATE_PRESETS.find(t => t.name === e.target.value); if (p) onSelect(p); }}
//             displayEmpty
//             renderValue={v => v ? <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600 }}>{v as string}</Typography> : <Typography sx={{ fontSize: '0.85rem', color: alpha(SLATE, 0.7) }}>Choose a template style…</Typography>}
//             sx={{ borderRadius: '8px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.15) }, '& .MuiSelect-select': { py: '10px' } }}
//         >
//             {TEMPLATE_PRESETS.map(p => (
//                 <MenuItem key={p.name} value={p.name} sx={{ py: 1.25, px: 2 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
//                         <Box sx={{ mt: 0.25, px: 0.75, py: 0.3, borderRadius: '4px', bgcolor: alpha(p.badgeColor, 0.12), fontSize: '0.6rem', fontWeight: 800, color: p.badgeColor, flexShrink: 0, minWidth: 54, textAlign: 'center' }}>{p.badge}</Box>
//                         <Box sx={{ flex: 1, minWidth: 0 }}>
//                             <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, mb: 0.2 }}>{p.name}</Typography>
//                             <Typography sx={{ fontSize: '0.7rem', color: SLATE, lineHeight: 1.4 }}>{p.description}</Typography>
//                         </Box>
//                     </Box>
//                 </MenuItem>
//             ))}
//         </Select>
//     </FormControl>
// );
//
// const AutoStepTemplate: React.FC<{
//     selectedPreset: TemplatePreset | null;
//     customName: string;
//     onSelectPreset: (p: TemplatePreset) => void;
//     onCustomName: (n: string) => void;
// }> = ({ selectedPreset, customName, onSelectPreset, onCustomName }) => {
//     const isCustom = selectedPreset?.group === 'Custom';
//     return (
//         <Box>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Select a template type</Typography>
//             <PresetDropdown selected={selectedPreset} onSelect={onSelectPreset} />
//
//             {isCustom && (
//                 <Box sx={{ mb: 1.75 }}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Custom template name</Typography>
//                     <TextField fullWidth size="small" placeholder="e.g. My 2025 Budget Plan" value={customName} onChange={e => onCustomName(e.target.value)}
//                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.88rem' } }} />
//                 </Box>
//             )}
//
//             {selectedPreset && !isCustom && (
//                 <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha(selectedPreset.badgeColor, 0.04), border: `1px solid ${alpha(selectedPreset.badgeColor, 0.2)}` }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                         <Box sx={{ px: 0.875, py: 0.3, borderRadius: '5px', bgcolor: alpha(selectedPreset.badgeColor, 0.12), fontSize: '0.65rem', fontWeight: 800, color: selectedPreset.badgeColor }}>{selectedPreset.badge}</Box>
//                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{selectedPreset.name}</Typography>
//                     </Box>
//                     <Typography sx={{ fontSize: '0.75rem', color: SLATE, mb: 1.25, lineHeight: 1.5 }}>{selectedPreset.description}</Typography>
//                     <Grid container spacing={2}>
//                         {selectedPreset.suggestedFormat && (
//                             <Grid item>
//                                 <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.4 }}>Default format</Typography>
//                                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{selectedPreset.suggestedFormat}</Typography>
//                             </Grid>
//                         )}
//                         {selectedPreset.suggestedCategories.length > 0 && (
//                             <Grid item xs>
//                                 <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.4 }}>Categories included</Typography>
//                                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
//                                     {selectedPreset.suggestedCategories.map(c => {
//                                         const col = PRESET_CATS.find(p => p.name === c)?.color ?? SLATE;
//                                         return <Box key={c} sx={{ px: 0.75, py: 0.2, borderRadius: '4px', bgcolor: alpha(col, 0.12), fontSize: '0.65rem', fontWeight: 700, color: col }}>{c}</Box>;
//                                     })}
//                                 </Box>
//                             </Grid>
//                         )}
//                     </Grid>
//                 </Box>
//             )}
//         </Box>
//     );
// };
//
// const AutoStepPeriod: React.FC<{
//     format: string; startMonth: string; endMonth: string;
//     onFormat: (f: string) => void; onStart: (s: string) => void; onEnd: (e: string) => void;
// }> = ({ format, startMonth, endMonth, onFormat, onStart, onEnd }) => {
//     const np = calcNumPeriods(format, startMonth, endMonth);
//     return (
//         <Box>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Period format</Typography>
//             <Grid container spacing={1} sx={{ mb: 2 }}>
//                 {FORMATS.map(f => (
//                     <Grid item xs={6} sm={4} key={f.id}>
//                         <Box onClick={() => onFormat(f.id)} sx={{
//                             p: 1.25, borderRadius: '8px', cursor: 'pointer',
//                             border: `1.5px solid ${format === f.id ? MAROON : alpha('#000', 0.1)}`,
//                             bgcolor: format === f.id ? alpha(MAROON, 0.04) : '#fff',
//                             transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 1,
//                             '&:hover': { borderColor: MAROON },
//                         }}>
//                             <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: format === f.id ? alpha(MAROON, 0.1) : alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                 <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: format === f.id ? MAROON : SLATE }}>{f.abbr}</Typography>
//                             </Box>
//                             <Box sx={{ flex: 1, minWidth: 0 }}>
//                                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY, lineHeight: 1 }}>{f.label}</Typography>
//                                 <Typography sx={{ fontSize: '0.62rem', color: SLATE }}>{f.desc}</Typography>
//                             </Box>
//                             {format === f.id && <CheckCircle2 size={13} color={MAROON} style={{ flexShrink: 0 }} />}
//                         </Box>
//                     </Grid>
//                 ))}
//             </Grid>
//             <Grid container spacing={2} sx={{ mb: 2 }}>
//                 <Grid item xs={6}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Start month</Typography>
//                     <TextField fullWidth size="small" type="month" value={startMonth} onChange={e => onStart(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
//                 </Grid>
//                 <Grid item xs={6}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>End month</Typography>
//                     <TextField fullWidth size="small" type="month" value={endMonth} onChange={e => onEnd(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
//                 </Grid>
//             </Grid>
//             {np > 0 && <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.2)}`, fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>{np} {format.toLowerCase()} period{np !== 1 ? 's' : ''} will be generated</Box>}
//             {startMonth && endMonth && new Date(endMonth + '-01') < new Date(startMonth + '-01') && (
//                 <Box sx={{ mt: 1, p: 1, borderRadius: '8px', bgcolor: alpha(RED, 0.06), border: `0.5px solid ${alpha(RED, 0.2)}`, fontSize: '0.75rem', color: RED }}>End month must be after start month.</Box>
//             )}
//         </Box>
//     );
// };
//
// const AutoStepIncome: React.FC<{ income: string; format: string; onChange: (v: string) => void }> = ({ income, format, onChange }) => {
//     const inc = parseFloat(income) || 0;
//     const periodLabel = format === 'Biweekly' ? 'biweekly period' : format === 'Weekly' ? 'week' : format === '2-Monthly' ? '2-month period' : format === '3-Monthly' ? 'quarter' : 'month';
//     return (
//         <Box>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Take-home income per {periodLabel}</Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 260, mb: 2.5 }}>
//                 <Box sx={{ px: 1.25, py: 0.875, border: `0.5px solid ${alpha('#000', 0.18)}`, borderRight: 'none', borderRadius: '8px 0 0 8px', bgcolor: alpha('#000', 0.03), color: SLATE, fontSize: '0.85rem', fontWeight: 600 }}>$</Box>
//                 <TextField size="small" type="number" placeholder="0.00" value={income} onChange={e => onChange(e.target.value)} inputProps={{ min: 0, step: 0.01 }}
//                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '0 8px 8px 0', fontSize: '0.88rem', fontWeight: 700 } }} />
//             </Box>
//             {inc > 0 && (
//                 <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha(NAVY, 0.03), border: `0.5px solid ${alpha('#000', 0.08)}` }}>
//                     <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Auto-allocation preview (50/30/20 baseline)</Typography>
//                     {[
//                         { label: 'Essentials (50%)', val: inc * 0.50, color: TEAL   },
//                         { label: 'Wants (30%)',      val: inc * 0.30, color: MAROON },
//                         { label: 'Savings (20%)',    val: inc * 0.20, color: GREEN  },
//                     ].map(({ label, val, color }) => (
//                         <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
//                             <Typography sx={{ fontSize: '0.72rem', color: SLATE, minWidth: 130 }}>{label}</Typography>
//                             <Box sx={{ flex: 1, height: 5, borderRadius: 2, bgcolor: alpha(color, 0.12) }}>
//                                 <Box sx={{ height: '100%', borderRadius: 2, bgcolor: color, width: `${(val / inc) * 100}%` }} />
//                             </Box>
//                             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, minWidth: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${fmtMoney(val)}</Typography>
//                         </Box>
//                     ))}
//                 </Box>
//             )}
//         </Box>
//     );
// };
//
// const AutoStepReview: React.FC<{ preset: TemplatePreset; format: string; startMonth: string; endMonth: string; income: string; customName: string }> = ({ preset, format, startMonth, endMonth, income, customName }) => {
//     const np  = calcNumPeriods(format, startMonth, endMonth);
//     const inc = parseFloat(income) || 0;
//     const displayName = preset.group === 'Custom' ? (customName || 'Custom Template') : preset.name;
//     return (
//         <Box>
//             <Grid container spacing={1} sx={{ mb: 2 }}>
//                 {[
//                     { label: 'Template',      value: displayName },
//                     { label: 'Format',        value: format },
//                     { label: 'Period range',  value: `${startMonth} → ${endMonth}` },
//                     { label: 'Periods',       value: `${np} period${np !== 1 ? 's' : ''}` },
//                     { label: 'Income/period', value: `$${fmtMoney(inc)}` },
//                     { label: 'Total income',  value: `$${fmtMoney(inc * np)}` },
//                 ].map(f => (
//                     <Grid item xs={6} key={f.label}>
//                         <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha('#000', 0.025), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                             <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.3 }}>{f.label}</Typography>
//                             <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: NAVY }}>{f.value}</Typography>
//                         </Box>
//                     </Grid>
//                 ))}
//             </Grid>
//             {preset.suggestedCategories.length > 0 && (
//                 <>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.875 }}>Categories ({preset.suggestedCategories.length})</Typography>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.75 }}>
//                         {preset.suggestedCategories.map(c => {
//                             const col = PRESET_CATS.find(p => p.name === c)?.color ?? SLATE;
//                             return (
//                                 <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: '20px', bgcolor: col, fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>
//                                     <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.55)' }} />{c}
//                                 </Box>
//                             );
//                         })}
//                     </Box>
//                 </>
//             )}
//             <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.2)}`, fontSize: '0.75rem', color: '#0f766e' }}>
//                 Category rows will be created from the preset. Income will be pre-filled — all other cells start blank for you to enter actuals.
//             </Box>
//         </Box>
//     );
// };
//
// // ── ── MANUAL STEPS ── ────────────────────────────────────────────────────────
//
// const StepFormat: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
//     const selectedPreset = TEMPLATE_PRESETS.find(p => p.name === state.templateName) ?? null;
//     const isCustomTyped  = !!state.templateName && !selectedPreset;
//
//     const handlePresetSelect = (p: TemplatePreset) => {
//         update({ templateName: p.name, format: p.suggestedFormat || state.format });
//     };
//
//     return (
//         <Box>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Template name</Typography>
//             <PresetDropdown selected={selectedPreset} onSelect={handlePresetSelect} />
//             <TextField
//                 fullWidth size="small"
//                 placeholder="Or type a custom name…"
//                 value={isCustomTyped ? state.templateName : ''}
//                 onChange={e => update({ templateName: e.target.value })}
//                 sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }}
//                 helperText="Type here to override the dropdown with a custom name"
//             />
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Period format</Typography>
//             <Grid container spacing={1.25}>
//                 {FORMATS.map(f => (
//                     <Grid item xs={12} sm={4} key={f.id}>
//                         <Box onClick={() => update({ format: f.id })} sx={{
//                             p: 1.5, borderRadius: '10px', cursor: 'pointer',
//                             border: `1.5px solid ${state.format === f.id ? MAROON : alpha('#000', 0.1)}`,
//                             bgcolor: state.format === f.id ? alpha(MAROON, 0.04) : '#fff',
//                             transition: 'all 0.15s', position: 'relative',
//                             '&:hover': { borderColor: MAROON },
//                         }}>
//                             {state.format === f.id && <Box sx={{ position: 'absolute', top: 8, right: 8, color: MAROON }}><CheckCircle2 size={14} /></Box>}
//                             <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: state.format === f.id ? alpha(MAROON, 0.1) : alpha('#000', 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.875 }}>
//                                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: state.format === f.id ? MAROON : SLATE }}>{f.abbr}</Typography>
//                             </Box>
//                             <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, mb: 0.2 }}>{f.label}</Typography>
//                             <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{f.desc}</Typography>
//                         </Box>
//                     </Grid>
//                 ))}
//             </Grid>
//         </Box>
//     );
// };
//
// const StepCategories: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
//     const [newCat, setNewCat] = useState('');
//
//     const togglePreset = (p: typeof PRESET_CATS[0]) => {
//         const exists = state.categories.find(c => c.name === p.name);
//         if (exists) {
//             const cats = state.categories.filter(c => c.name !== p.name);
//             const allocs = { ...state.allocs }; delete allocs[p.name];
//             update({ categories: cats, allocs });
//         } else {
//             update({ categories: [...state.categories, { name: p.name, color: p.color }] });
//         }
//     };
//
//     const addCustom = () => {
//         const name = newCat.trim();
//         if (!name || state.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) { setNewCat(''); return; }
//         update({ categories: [...state.categories, { name, color: CAT_PALETTE[state.categories.length % CAT_PALETTE.length] }] });
//         setNewCat('');
//     };
//
//     const removeCustom = (name: string) => {
//         const cats = state.categories.filter(c => c.name !== name);
//         const allocs = { ...state.allocs }; delete allocs[name];
//         update({ categories: cats, allocs });
//     };
//
//     const customCats = state.categories.filter(c => !PRESET_CATS.find(p => p.name === c.name));
//
//     return (
//         <Box>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>Preset categories</Typography>
//             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
//                 {PRESET_CATS.map(p => {
//                     const on = !!state.categories.find(c => c.name === p.name);
//                     return (
//                         <Box key={p.name} onClick={() => togglePreset(p)} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.5, borderRadius: '20px', cursor: 'pointer', border: `1.5px solid ${on ? p.color : alpha('#000', 0.1)}`, bgcolor: on ? p.color : '#fff', color: on ? '#fff' : SLATE, fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s', '&:hover': { borderColor: p.color } }}>
//                             <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: on ? 'rgba(255,255,255,0.7)' : p.color, flexShrink: 0 }} />
//                             {p.name}{on && <Box component="span" sx={{ ml: 0.3, opacity: 0.75, fontSize: '0.65rem' }}>✕</Box>}
//                         </Box>
//                     );
//                 })}
//             </Box>
//             {customCats.length > 0 && (
//                 <>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Custom</Typography>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
//                         {customCats.map(c => (
//                             <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.5, borderRadius: '20px', border: `1.5px solid ${c.color}`, bgcolor: c.color, color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
//                                 <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
//                                 {c.name}
//                                 <Box component="span" onClick={() => removeCustom(c.name)} sx={{ ml: 0.3, opacity: 0.75, fontSize: '0.65rem', cursor: 'pointer', '&:hover': { opacity: 1 } }}>✕</Box>
//                             </Box>
//                         ))}
//                     </Box>
//                 </>
//             )}
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Add custom</Typography>
//             <Box sx={{ display: 'flex', gap: 1 }}>
//                 <TextField size="small" placeholder="Category name…" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
//                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} />
//                 <Button onClick={addCustom} sx={{ borderRadius: '8px', border: `1px solid ${alpha(MAROON, 0.25)}`, bgcolor: alpha(MAROON, 0.06), color: MAROON, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, '&:hover': { bgcolor: alpha(MAROON, 0.12) }, whiteSpace: 'nowrap' }}>+ Add</Button>
//             </Box>
//             {state.categories.length === 0 && <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(AMBER, 0.07), border: `0.5px solid ${alpha(AMBER, 0.3)}`, fontSize: '0.75rem', color: '#92400e' }}>Select at least one category to continue.</Box>}
//         </Box>
//     );
// };
//
// const StepPeriod: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
//     const np  = calcNumPeriods(state.format, state.startMonth, state.endMonth);
//     const inc = parseFloat(state.income) || 0;
//     const periodLabel = state.format === 'Biweekly' ? 'biweekly period' : state.format === 'Weekly' ? 'week' : state.format === '2-Monthly' ? '2-month period' : state.format === '3-Monthly' ? 'quarter' : 'month';
//     return (
//         <Box>
//             <Grid container spacing={2} sx={{ mb: 2 }}>
//                 <Grid item xs={6}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Start month</Typography>
//                     <TextField fullWidth size="small" type="month" value={state.startMonth} onChange={e => update({ startMonth: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
//                 </Grid>
//                 <Grid item xs={6}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>End month</Typography>
//                     <TextField fullWidth size="small" type="month" value={state.endMonth} onChange={e => update({ endMonth: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' } }} />
//                 </Grid>
//             </Grid>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>Take-home income per {periodLabel}</Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 240, mb: 2 }}>
//                 <Box sx={{ px: 1.25, py: 0.875, border: `0.5px solid ${alpha('#000', 0.18)}`, borderRight: 'none', borderRadius: '8px 0 0 8px', bgcolor: alpha('#000', 0.03), color: SLATE, fontSize: '0.85rem', fontWeight: 600 }}>$</Box>
//                 <TextField size="small" type="number" placeholder="0.00" value={state.income} onChange={e => update({ income: e.target.value })} inputProps={{ min: 0, step: 0.01 }}
//                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '0 8px 8px 0', fontSize: '0.85rem' } }} />
//             </Box>
//             {np > 0 && inc > 0 && (
//                 <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.25)}` }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: TEAL }}>{np} {state.format.toLowerCase()} period{np !== 1 ? 's' : ''} generated</Typography>
//                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>Total: ${fmtMoney(np * inc)}</Typography>
//                     </Box>
//                     <LinearProgress variant="determinate" value={100} sx={{ height: 3, borderRadius: 2, bgcolor: alpha(TEAL, 0.15), '& .MuiLinearProgress-bar': { bgcolor: TEAL } }} />
//                 </Box>
//             )}
//             {state.startMonth && state.endMonth && new Date(state.endMonth + '-01') < new Date(state.startMonth + '-01') && (
//                 <Box sx={{ mt: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(RED, 0.06), border: `0.5px solid ${alpha(RED, 0.2)}`, fontSize: '0.75rem', color: RED }}>End month must be after start month.</Box>
//             )}
//         </Box>
//     );
// };
//
// const StepAllocations: React.FC<{ state: WizardState; update: (p: Partial<WizardState>) => void }> = ({ state, update }) => {
//     const inc = parseFloat(state.income) || 0;
//     const np  = calcNumPeriods(state.format, state.startMonth, state.endMonth);
//     const totalAlloc = state.categories.reduce((s, c) => s + (parseFloat(state.allocs[c.name] || '0') || 0), 0);
//     const remaining  = inc - totalAlloc;
//     const utilPct    = inc > 0 ? Math.min((totalAlloc / inc) * 100, 100) : 0;
//     const overBudget = remaining < -0.001;
//     const nearLimit  = remaining >= 0 && remaining < inc * 0.05;
//     const barColor   = overBudget ? RED : nearLimit ? AMBER : TEAL;
//
//     const autoFill = () => {
//         const allocs = { ...state.allocs };
//         state.categories.forEach(c => { if (!allocs[c.name] || allocs[c.name] === '0') { allocs[c.name] = (inc * (DEFAULT_ALLOC[c.name] ?? 0.08)).toFixed(2); } });
//         update({ allocs });
//     };
//
//     return (
//         <Box>
//             {inc > 0 && (
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
//                     <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Income per period: <strong style={{ color: NAVY }}>${fmtMoney(inc)}</strong></Typography>
//                     <Button onClick={autoFill} size="small" sx={{ fontSize: '0.72rem', fontWeight: 700, color: TEAL, textTransform: 'none', border: `0.5px solid ${alpha(TEAL, 0.3)}`, borderRadius: '6px', px: 1, py: 0.4, '&:hover': { bgcolor: alpha(TEAL, 0.06) } }}>Auto-fill suggestions</Button>
//                 </Box>
//             )}
//             <Box sx={{ borderRadius: '10px', overflow: 'hidden', border: `0.5px solid ${alpha('#000', 0.1)}`, mb: 1.5 }}>
//                 <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 70px 100px', bgcolor: alpha(MAROON, 0.04), borderBottom: `1.5px solid ${alpha(MAROON, 0.14)}` }}>
//                     {['Category','Per period','% income',`Total (${np}p)`].map((h, i) => (
//                         <Box key={h} sx={{ px: 1.5, py: 1, fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: MAROON, textAlign: i > 0 ? 'right' : 'left' }}>{h}</Box>
//                     ))}
//                 </Box>
//                 {state.categories.map((cat, ri) => {
//                     const val    = state.allocs[cat.name] || '';
//                     const numVal = parseFloat(val) || 0;
//                     const pct    = inc > 0 && numVal > 0 ? ((numVal / inc) * 100).toFixed(1) + '%' : '—';
//                     const total  = numVal > 0 && np > 0 ? '$' + fmtMoney(numVal * np) : '—';
//                     return (
//                         <Box key={cat.name} sx={{ display: 'grid', gridTemplateColumns: '1fr 150px 70px 100px', alignItems: 'center', bgcolor: ri % 2 === 0 ? '#fff' : alpha('#000', 0.015), borderBottom: ri < state.categories.length - 1 ? `0.5px solid ${alpha('#000', 0.06)}` : 'none' }}>
//                             <Box sx={{ px: 1.5, py: 0.875, display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                 <Box sx={{ width: 3, height: 14, borderRadius: '2px', bgcolor: cat.color, flexShrink: 0 }} />
//                                 <Typography sx={{ fontSize: '0.8rem', color: NAVY, fontWeight: 500 }}>{cat.name}</Typography>
//                             </Box>
//                             <Box sx={{ px: 1, py: 0.625, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
//                                 <Box sx={{ px: 0.875, py: 0.4, border: `0.5px solid ${alpha('#000', 0.15)}`, borderRight: 'none', borderRadius: '6px 0 0 6px', bgcolor: alpha('#000', 0.025), color: SLATE, fontSize: '0.75rem' }}>$</Box>
//                                 <Box component="input" type="number" min={0} step={0.01} value={val}
//                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ allocs: { ...state.allocs, [cat.name]: e.target.value } })}
//                                      placeholder="0.00"
//                                      sx={{ width: 90, px: 0.875, py: 0.4, border: `0.5px solid ${alpha('#000', 0.15)}`, borderRadius: '0 6px 6px 0', fontSize: '0.8rem', textAlign: 'right', bgcolor: 'transparent', color: NAVY, outline: 'none', fontFamily: 'inherit', '&:focus': { borderColor: MAROON } }}
//                                 />
//                             </Box>
//                             <Box sx={{ px: 1.5, py: 0.875, textAlign: 'right' }}><Typography sx={{ fontSize: '0.75rem', color: SLATE }}>{pct}</Typography></Box>
//                             <Box sx={{ px: 1.5, py: 0.875, textAlign: 'right' }}><Typography sx={{ fontSize: '0.75rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>{total}</Typography></Box>
//                         </Box>
//                     );
//                 })}
//             </Box>
//             <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha(barColor, 0.05), border: `0.5px solid ${alpha(barColor, 0.25)}` }}>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.875 }}>
//                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: barColor }}>${fmtMoney(totalAlloc)} allocated of ${fmtMoney(inc)}</Typography>
//                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: overBudget ? RED : GREEN }}>{overBudget ? `$${fmtMoney(-remaining)} over` : `$${fmtMoney(remaining)} remaining`}</Typography>
//                 </Box>
//                 <LinearProgress variant="determinate" value={utilPct} sx={{ height: 5, borderRadius: 2, bgcolor: alpha(barColor, 0.15), '& .MuiLinearProgress-bar': { bgcolor: barColor } }} />
//             </Box>
//         </Box>
//     );
// };
//
// const StepReview: React.FC<{ state: WizardState }> = ({ state }) => {
//     const np  = calcNumPeriods(state.format, state.startMonth, state.endMonth);
//     const inc = parseFloat(state.income) || 0;
//     const totalAlloc = state.categories.reduce((s, c) => s + (parseFloat(state.allocs[c.name] || '0') || 0), 0);
//     const over = totalAlloc > inc;
//     return (
//         <Box>
//             <Grid container spacing={1} sx={{ mb: 2 }}>
//                 {[
//                     { label: 'Template name',   value: state.templateName },
//                     { label: 'Format',          value: state.format },
//                     { label: 'Period range',    value: `${state.startMonth} → ${state.endMonth}` },
//                     { label: 'Periods',         value: `${np} period${np !== 1 ? 's' : ''}` },
//                     { label: 'Income/period',   value: `$${fmtMoney(inc)}` },
//                     { label: 'Total allocated', value: `$${fmtMoney(totalAlloc)} / $${fmtMoney(inc)}`, color: over ? RED : GREEN },
//                 ].map(f => (
//                     <Grid item xs={6} key={f.label}>
//                         <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha('#000', 0.025), border: `0.5px solid ${alpha('#000', 0.07)}` }}>
//                             <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.3 }}>{f.label}</Typography>
//                             <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: (f as any).color ?? NAVY }}>{f.value}</Typography>
//                         </Box>
//                     </Grid>
//                 ))}
//             </Grid>
//             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Categories ({state.categories.length})</Typography>
//             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.625, mb: 1.5 }}>
//                 {state.categories.map(c => (
//                     <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.125, py: 0.45, borderRadius: '20px', bgcolor: c.color, fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
//                         <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.55)' }} />
//                         {c.name} · ${fmtMoney(parseFloat(state.allocs[c.name] || '0') || 0)}
//                     </Box>
//                 ))}
//             </Box>
//             {over && <Box sx={{ p: 1.125, borderRadius: '8px', bgcolor: alpha(AMBER, 0.07), border: `0.5px solid ${alpha(AMBER, 0.3)}`, fontSize: '0.75rem', color: '#92400e', mb: 1 }}>Allocations exceed income — you can adjust values afterwards.</Box>}
//             <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: alpha(TEAL, 0.05), border: `0.5px solid ${alpha(TEAL, 0.2)}`, fontSize: '0.75rem', color: '#0f766e' }}>
//                 Category allocations will pre-fill every period row — you can edit any cell afterwards.
//             </Box>
//         </Box>
//     );
// };
//
// // ── ── MAIN COMPONENT ── ──────────────────────────────────────────────────────
//
// interface ManualTemplateWizardProps {
//     open: boolean;
//     onClose: () => void;
//     onCreateTemplate: (template: {
//         name: string;
//         periodType: PeriodType;
//         startMonth: string;
//         endMonth: string;
//         income: number;
//         categories: WizardCategory[];
//         allocs: Record<string, number>;
//     }) => void;
// }
//
// const BLANK_WS: WizardState = { templateName: '', format: '', categories: [], startMonth: '', endMonth: '', income: '', allocs: {}, newCatName: '' };
//
// export const ManualTemplateWizard: React.FC<ManualTemplateWizardProps> = ({ open, onClose, onCreateTemplate }) => {
//     const [mode, setMode] = useState<CreationMode>(null);
//     const [step, setStep] = useState(0);
//
//     // Manual state
//     const [ws,  setWs]  = useState<WizardState>(BLANK_WS);
//     const update = (p: Partial<WizardState>) => setWs(prev => ({ ...prev, ...p }));
//
//     // Auto state
//     const [autoPreset,     setAutoPreset]     = useState<TemplatePreset | null>(null);
//     const [autoCustomName, setAutoCustomName] = useState('');
//     const [autoFormat,     setAutoFormat]     = useState('');
//     const [autoStart,      setAutoStart]      = useState('');
//     const [autoEnd,        setAutoEnd]        = useState('');
//     const [autoIncome,     setAutoIncome]     = useState('');
//
//     const reset = () => {
//         setMode(null); setStep(0); setWs(BLANK_WS);
//         setAutoPreset(null); setAutoCustomName(''); setAutoFormat('');
//         setAutoStart(''); setAutoEnd(''); setAutoIncome('');
//     };
//
//     const handleClose = () => { reset(); onClose(); };
//
//     const handleSelectPreset = (p: TemplatePreset) => {
//         setAutoPreset(p);
//         if (p.suggestedFormat) setAutoFormat(p.suggestedFormat);
//     };
//
//     const autoNp   = useMemo(() => calcNumPeriods(autoFormat, autoStart, autoEnd), [autoFormat, autoStart, autoEnd]);
//     const manualNp = useMemo(() => calcNumPeriods(ws.format, ws.startMonth, ws.endMonth), [ws.format, ws.startMonth, ws.endMonth]);
//
//     // ── Header meta ───────────────────────────────────────────────────────────
//     const headerInfo = useMemo(() => {
//         if (!mode) return { title: 'New Budget Template', sub: 'Choose how to set up your template', label: '' };
//         if (mode === 'auto') {
//             const t = [
//                 ['Select a Template Style',  'Choose from predefined template types'],
//                 ['Set Period Range',          'Define your tracking window'],
//                 ['Enter Your Income',         "We'll allocate it automatically"],
//                 ['Review & Create',           'Confirm before generating'],
//             ][step] ?? ['Review & Create',''];
//             return { title: t[0], sub: t[1], label: `Step ${step + 1} of ${AUTO_STEPS.length}` };
//         }
//         const t = [
//             ['Choose Format & Name',   'Pick a template name and period type'],
//             ['Select Categories',      'What spending areas to track'],
//             ['Period & Income',        'Date range and per-period income'],
//             ['Set Allocations',        'How much per category per period'],
//             ['Review & Create',        'Confirm everything before creating'],
//         ][step] ?? ['Review & Create',''];
//         return { title: t[0], sub: t[1], label: `Step ${step + 1} of ${MANUAL_STEPS.length}` };
//     }, [mode, step]);
//
//     // ── Validation ────────────────────────────────────────────────────────────
//     const canNext = useMemo(() => {
//         if (!mode) return false;
//         if (mode === 'auto') {
//             if (step === 0) return !!autoPreset && (autoPreset.group !== 'Custom' || autoCustomName.trim().length > 0);
//             if (step === 1) {
//                 const ok  = !!autoFormat && !!autoStart && !!autoEnd && autoNp > 0;
//                 const ord = autoStart && autoEnd && new Date(autoEnd + '-01') >= new Date(autoStart + '-01');
//                 return !!(ok && ord);
//             }
//             if (step === 2) return !!autoIncome && parseFloat(autoIncome) > 0;
//             return true;
//         }
//         if (mode === 'manual') {
//             if (step === 0) return !!ws.format && ws.templateName.trim().length > 0;
//             if (step === 1) return ws.categories.length > 0;
//             if (step === 2) {
//                 const ok  = !!ws.startMonth && !!ws.endMonth && !!ws.income && manualNp > 0;
//                 const ord = ws.startMonth && ws.endMonth && new Date(ws.endMonth + '-01') >= new Date(ws.startMonth + '-01');
//                 return !!(ok && ord);
//             }
//             if (step === 3) return ws.categories.length > 0;
//             return true;
//         }
//         return false;
//     }, [mode, step, autoPreset, autoCustomName, autoFormat, autoStart, autoEnd, autoNp, autoIncome, ws, manualNp]);
//
//     const maxStep = mode === 'auto' ? AUTO_STEPS.length - 1 : MANUAL_STEPS.length - 1;
//
//     const handleNext = () => {
//         if (step < maxStep) { setStep(s => s + 1); return; }
//         // Emit template
//         if (mode === 'auto' && autoPreset) {
//             const name = autoPreset.group === 'Custom' ? (autoCustomName.trim() || 'Custom Template') : autoPreset.name;
//             const cats = autoPreset.suggestedCategories.map(catFromName);
//             const inc  = parseFloat(autoIncome) || 0;
//             const defaultPcts: Record<string, number> = { Housing:0.35, Food:0.20, Transportation:0.10, Entertainment:0.10, Savings:0.15, Healthcare:0.05, Clothing:0.05, Other:0.10 };
//             const allocs: Record<string, number> = {};
//             cats.forEach(c => { allocs[c.name] = Math.round((defaultPcts[c.name] ?? 0.08) * inc * 100) / 100; });
//             onCreateTemplate({ name, periodType: autoFormat as PeriodType, startMonth: autoStart, endMonth: autoEnd, income: inc, categories: cats, allocs });
//         } else if (mode === 'manual') {
//             onCreateTemplate({
//                 name: ws.templateName, periodType: ws.format as PeriodType,
//                 startMonth: ws.startMonth, endMonth: ws.endMonth,
//                 income: parseFloat(ws.income) || 0, categories: ws.categories,
//                 allocs: Object.fromEntries(Object.entries(ws.allocs).map(([k, v]) => [k, parseFloat(v) || 0])),
//             });
//         }
//         reset(); onClose();
//     };
//
//     const handleBack = () => {
//         if (step === 0) { setMode(null); return; }
//         setStep(s => Math.max(0, s - 1));
//     };
//
//     const steps = mode === 'auto' ? AUTO_STEPS : MANUAL_STEPS;
//
//     return (
//         <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', m: 2 } }}>
//             <WizardHeader title={headerInfo.title} sub={headerInfo.sub} stepLabel={headerInfo.label} />
//             <DialogContent sx={{ p: 0 }}>
//
//                 {/* ── Mode selector ── */}
//                 {!mode && (
//                     <>
//                         <ModeSelector onSelect={m => { setMode(m); setStep(0); }} />
//                         <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', borderTop: `0.5px solid ${alpha('#000', 0.08)}`, mx: 3, pt:2}}>
//                             <Button
//                                 onClick={handleClose}
//                                 variant="outlined"
//                                 sx={{
//                                     color: SLATE,
//                                     borderColor: alpha('#000', 0.18),
//                                     textTransform: 'none',
//                                     fontWeight: 600,
//                                     fontSize: '0.82rem',
//                                     borderRadius: '8px',
//                                     px: 2,
//                                     py: 0.75,
//                                     '&:hover': { bgcolor: alpha('#000', 0.04), borderColor: alpha('#000', 0.3) },
//                                 }}
//                             >
//                                 Cancel
//                             </Button>
//                         </Box>
//                     </>
//                 )}
//
//                 {/* ── Step flow ── */}
//                 {!!mode && (
//                     <>
//                         <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
//                             <StepIndicator current={step} steps={steps} />
//                         </Box>
//                         <Box sx={{ px: 3, pb: 3 }}>
//
//                             {/* AUTO */}
//                             {mode === 'auto' && step === 0 && <AutoStepTemplate selectedPreset={autoPreset} customName={autoCustomName} onSelectPreset={handleSelectPreset} onCustomName={setAutoCustomName} />}
//                             {mode === 'auto' && step === 1 && <AutoStepPeriod format={autoFormat} startMonth={autoStart} endMonth={autoEnd} onFormat={setAutoFormat} onStart={setAutoStart} onEnd={setAutoEnd} />}
//                             {mode === 'auto' && step === 2 && <AutoStepIncome income={autoIncome} format={autoFormat} onChange={setAutoIncome} />}
//                             {mode === 'auto' && step === 3 && autoPreset && <AutoStepReview preset={autoPreset} format={autoFormat} startMonth={autoStart} endMonth={autoEnd} income={autoIncome} customName={autoCustomName} />}
//
//                             {/* MANUAL */}
//                             {mode === 'manual' && step === 0 && <StepFormat state={ws} update={update} />}
//                             {mode === 'manual' && step === 1 && <StepCategories state={ws} update={update} />}
//                             {mode === 'manual' && step === 2 && <StepPeriod state={ws} update={update} />}
//                             {mode === 'manual' && step === 3 && <StepAllocations state={ws} update={update} />}
//                             {mode === 'manual' && step === 4 && <StepReview state={ws} />}
//
//                             <NavRow
//                                 showBack={true}
//                                 canNext={canNext}
//                                 onBack={handleBack}
//                                 onNext={handleNext}
//                                 nextLabel={step === maxStep ? '✓ Create Template' : 'Continue →'}
//                                 isLast={step === maxStep}
//                             />
//                         </Box>
//                     </>
//                 )}
//             </DialogContent>
//         </Dialog>
//     );
// };
//
// export default ManualTemplateWizard;
