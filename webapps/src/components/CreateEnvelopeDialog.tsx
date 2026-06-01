import React, { useCallback, useMemo, useState } from 'react';
import {
    alpha, Box, Button, Chip, Dialog, DialogContent,
    Divider, Grid, IconButton, InputAdornment,
    LinearProgress, Slide, Stack, TextField,
    ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
    X, PiggyBank, Wallet, Flame, XCircle,
    ChevronLeft, ChevronRight, CheckCircle,
    Calendar, Target, Zap, Info, TrendingUp,
    AlertTriangle, Link, Layers, Plus, Trash2,
} from 'lucide-react';

// ── Design tokens ────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';

const ENVELOPE_COLORS: Record<string, string> = {
    SAVINGS:   '#0284c7',
    PAYOFF:    '#dc2626',
    PURCHASE:  '#7c3aed',
    EMERGENCY: '#d97706',
};

const ENVELOPE_ICONS: Record<string, React.ReactNode> = {
    SAVINGS:   <PiggyBank  size={22} />,
    PAYOFF:    <XCircle    size={22} />,
    PURCHASE:  <Wallet     size={22} />,
    EMERGENCY: <Flame      size={22} />,
};

const ENVELOPE_DESCRIPTIONS: Record<string, string> = {
    SAVINGS:   'Set aside money toward a future goal — vacation, education, big life moment.',
    PAYOFF:    'Eliminate a specific debt or purchase balance before interest kicks in.',
    PURCHASE:  'Save up for a specific item you plan to buy — laptop, appliance, gear.',
    EMERGENCY: 'Build a cushion for unexpected costs — car repair, medical, home fix.',
};

const FREQUENCY_LABELS: Record<string, string> = {
    WEEKLY:   'Weekly',
    BIWEEKLY: 'Bi-weekly',
    MONTHLY:  'Monthly',
};

// ── Types ────────────────────────────────────────────────────────────────────
export interface NewEnvelopeForm {
    envelopeType:          'SAVINGS' | 'PAYOFF' | 'PURCHASE' | 'EMERGENCY' | '';
    envelopeName:          string;
    targetAmount:          number | '';
    startingAmount:        number | '';
    targetDate:            string;
    contributionMode:      'manual' | 'auto' | '';
    monthlyContribution:   number | '';
    contributionFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    description:           string;
}

export interface CreateEnvelopeDialogProps {
    open:     boolean;
    onClose:  () => void;
    onSubmit: (data: NewEnvelopeForm | NewEnvelopeForm[], isLinked: boolean) => Promise<void>;
}

const BLANK_FORM = (): NewEnvelopeForm => ({
    envelopeType:          '',
    envelopeName:          '',
    targetAmount:          '',
    startingAmount:        '',
    targetDate:            '',
    contributionMode:      '',
    monthlyContribution:   '',
    contributionFrequency: 'MONTHLY',
    description:           '',
});

// ── Slide transition ─────────────────────────────────────────────────────────
const SlideUp = React.forwardRef(function SlideUp(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function monthsToReach(target: number, current: number, monthly: number): number | null {
    const remaining = target - current;
    if (monthly <= 0 || remaining <= 0) return null;
    return Math.ceil(remaining / monthly);
}

function addMonths(months: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
}

function dateFromStr(s: string): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function monthsBetween(from: Date, to: Date): number {
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function autoMonthly(target: number, current: number, targetDate: string): number {
    const d = dateFromStr(targetDate);
    if (!d) return 0;
    const months = monthsBetween(new Date(), d);
    if (months <= 0) return target - current;
    return Math.ceil((target - (current || 0)) / months);
}

function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function fmt(n: number) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
    { id: 'mode',         label: 'Envelope Mode', icon: <Layers     size={14} /> },
    { id: 'type',         label: 'Goal Type',     icon: <Target     size={14} /> },
    { id: 'name',         label: 'Details',       icon: <Wallet     size={14} /> },
    { id: 'amount',       label: 'Amounts',       icon: <PiggyBank  size={14} /> },
    { id: 'timeline',     label: 'Timeline',      icon: <Calendar   size={14} /> },
    { id: 'contribution', label: 'Contributions', icon: <TrendingUp size={14} /> },
    { id: 'review',       label: 'Review',        icon: <CheckCircle size={14} /> },
];
//
// // ── Step 0: Mode selection ───────────────────────────────────────────────────
// const StepMode: React.FC<{
//     isLinked:  boolean;
//     onChange:  (v: boolean) => void;
// }> = ({ isLinked, onChange }) => (
//     <Box>
//         <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//             How many envelopes would you like to create?
//         </Typography>
//         <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//             Create a single dedicated envelope, or link multiple envelopes together that share a common goal or budget.
//         </Typography>
//
//         <Grid container spacing={2}>
//             {/* Single */}
//             <Grid item xs={12} sm={6}>
//                 <Box
//                     onClick={() => onChange(false)}
//                     sx={{
//                         p: 2.5, borderRadius: '14px', cursor: 'pointer',
//                         border: `2px solid ${!isLinked ? MAROON : alpha('#000', 0.1)}`,
//                         bgcolor: !isLinked ? alpha(MAROON, 0.05) : '#fafafa',
//                         transition: 'all 0.18s',
//                         '&:hover': { border: `2px solid ${MAROON}`, bgcolor: alpha(MAROON, 0.04) },
//                     }}
//                 >
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
//                         <Box sx={{
//                             width: 44, height: 44, borderRadius: '11px',
//                             bgcolor: !isLinked ? alpha(MAROON, 0.12) : alpha('#000', 0.06),
//                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                             color: !isLinked ? MAROON : '#888', transition: 'all 0.18s',
//                         }}>
//                             <Wallet size={22} />
//                         </Box>
//                         <Box>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: !isLinked ? MAROON : '#111' }}>
//                                 Single Envelope
//                             </Typography>
//                             {!isLinked && (
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
//                                     <CheckCircle size={11} color={MAROON} />
//                                     <Typography sx={{ fontSize: '0.6rem', color: MAROON, fontWeight: 700 }}>Selected</Typography>
//                                 </Box>
//                             )}
//                         </Box>
//                     </Box>
//                     <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.55 }}>
//                         One focused envelope for a single goal. Best for most use cases — a vacation fund, a debt payoff, or an emergency buffer.
//                     </Typography>
//                     <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
//                         {['Simple setup', 'One goal', 'Full control'].map(t => (
//                             <Chip key={t} label={t} size="small"
//                                   sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
//                                       bgcolor: !isLinked ? alpha(MAROON, 0.1) : alpha('#000', 0.05),
//                                       color: !isLinked ? MAROON : '#888' }} />
//                         ))}
//                     </Box>
//                 </Box>
//             </Grid>
//
//             {/* Linked */}
//             <Grid item xs={12} sm={6}>
//                 <Box
//                     onClick={() => onChange(true)}
//                     sx={{
//                         p: 2.5, borderRadius: '14px', cursor: 'pointer',
//                         border: `2px solid ${isLinked ? '#7c3aed' : alpha('#000', 0.1)}`,
//                         bgcolor: isLinked ? alpha('#7c3aed', 0.05) : '#fafafa',
//                         transition: 'all 0.18s',
//                         '&:hover': { border: `2px solid #7c3aed`, bgcolor: alpha('#7c3aed', 0.04) },
//                     }}
//                 >
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
//                         <Box sx={{
//                             width: 44, height: 44, borderRadius: '11px',
//                             bgcolor: isLinked ? alpha('#7c3aed', 0.12) : alpha('#000', 0.06),
//                             display: 'flex', alignItems: 'center', justifyContent: 'center',
//                             color: isLinked ? '#7c3aed' : '#888', transition: 'all 0.18s',
//                         }}>
//                             <Link size={22} />
//                         </Box>
//                         <Box>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isLinked ? '#7c3aed' : '#111' }}>
//                                 Linked Envelopes
//                             </Typography>
//                             {isLinked && (
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
//                                     <CheckCircle size={11} color="#7c3aed" />
//                                     <Typography sx={{ fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700 }}>Selected</Typography>
//                                 </Box>
//                             )}
//                         </Box>
//                     </Box>
//                     <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.55 }}>
//                         Two or more envelopes tied together under a shared goal or budget. Great for splitting a large purchase across categories or tracking related debts.
//                     </Typography>
//                     <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
//                         {['Multiple goals', 'Shared budget', 'Group tracking'].map(t => (
//                             <Chip key={t} label={t} size="small"
//                                   sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
//                                       bgcolor: isLinked ? alpha('#7c3aed', 0.1) : alpha('#000', 0.05),
//                                       color: isLinked ? '#7c3aed' : '#888' }} />
//                         ))}
//                     </Box>
//                 </Box>
//             </Grid>
//         </Grid>
//
//         {isLinked && (
//             <Box sx={{ mt: 2.5, p: 2, borderRadius: '10px', bgcolor: alpha('#7c3aed', 0.06), border: `1px solid ${alpha('#7c3aed', 0.2)}`, display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
//                 <Info size={14} color="#7c3aed" style={{ marginTop: 2, flexShrink: 0 }} />
//                 <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.55 }}>
//                     You'll configure each envelope individually in the next steps. After filling in the first one, you can add more before submitting. All linked envelopes are submitted together.
//                 </Typography>
//             </Box>
//         )}
//     </Box>
// );

const StepMode: React.FC<{
    isLinked:  boolean;
    linkCount: number;
    onChange:  (isLinked: boolean, count: number) => void;
}> = ({ isLinked, linkCount, onChange }) => (

    <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
            How many envelopes would you like to create?
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
            Create a single dedicated envelope, or link multiple envelopes together
            that share a common goal or budget.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Single */}
            <Grid item xs={12} sm={6}>
                <Box onClick={() => onChange(false, 1)} sx={{
                    p: 2.5, borderRadius: '14px', cursor: 'pointer',
                    border: `2px solid ${!isLinked ? MAROON : alpha('#000', 0.1)}`,
                    bgcolor: !isLinked ? alpha(MAROON, 0.05) : '#fafafa',
                    transition: 'all 0.18s',
                    '&:hover': { border: `2px solid ${MAROON}`, bgcolor: alpha(MAROON, 0.04) },
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: '11px',
                            bgcolor: !isLinked ? alpha(MAROON, 0.12) : alpha('#000', 0.06),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: !isLinked ? MAROON : '#888', transition: 'all 0.18s',
                        }}>
                            <Wallet size={22} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: !isLinked ? MAROON : '#111' }}>
                                Single Envelope
                            </Typography>
                            {!isLinked && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <CheckCircle size={11} color={MAROON} />
                                    <Typography sx={{ fontSize: '0.6rem', color: MAROON, fontWeight: 700 }}>Selected</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.55 }}>
                        One focused envelope for a single goal. Best for most use cases —
                        a vacation fund, a debt payoff, or an emergency buffer.
                    </Typography>
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {['Simple setup', 'One goal', 'Full control'].map(t => (
                            <Chip key={t} label={t} size="small" sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: !isLinked ? alpha(MAROON, 0.1) : alpha('#000', 0.05),
                                color: !isLinked ? MAROON : '#888',
                            }} />
                        ))}
                    </Box>
                </Box>
            </Grid>

            {/* Linked */}
            <Grid item xs={12} sm={6}>
                <Box onClick={() => onChange(true, linkCount < 2 ? 2 : linkCount)} sx={{
                    p: 2.5, borderRadius: '14px', cursor: 'pointer',
                    border: `2px solid ${isLinked ? '#7c3aed' : alpha('#000', 0.1)}`,
                    bgcolor: isLinked ? alpha('#7c3aed', 0.05) : '#fafafa',
                    transition: 'all 0.18s',
                    '&:hover': { border: `2px solid #7c3aed`, bgcolor: alpha('#7c3aed', 0.04) },
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: '11px',
                            bgcolor: isLinked ? alpha('#7c3aed', 0.12) : alpha('#000', 0.06),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isLinked ? '#7c3aed' : '#888', transition: 'all 0.18s',
                        }}>
                            <Link size={22} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: isLinked ? '#7c3aed' : '#111' }}>
                                Linked Envelopes
                            </Typography>
                            {isLinked && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <CheckCircle size={11} color="#7c3aed" />
                                    <Typography sx={{ fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700 }}>Selected</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.55 }}>
                        Two to five envelopes tied together under a shared goal or budget.
                        Great for splitting a large purchase or tracking related debts.
                    </Typography>
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {['2–5 envelopes', 'Shared budget', 'Group tracking'].map(t => (
                            <Chip key={t} label={t} size="small" sx={{
                                height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: isLinked ? alpha('#7c3aed', 0.1) : alpha('#000', 0.05),
                                color: isLinked ? '#7c3aed' : '#888',
                            }} />
                        ))}
                    </Box>
                </Box>
            </Grid>
        </Grid>

        {/* Count picker — only shown when linked is selected */}
        {isLinked && (
            <Box sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${alpha('#7c3aed', 0.25)}`, bgcolor: alpha('#7c3aed', 0.04) }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', mb: 1.5 }}>
                    How many envelopes do you want to link?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {[2, 3, 4, 5].map(n => (
                        <Box key={n} onClick={() => onChange(true, n)} sx={{
                            flex: 1, py: 1.25, borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                            border: `2px solid ${linkCount === n ? '#7c3aed' : alpha('#000', 0.1)}`,
                            bgcolor: linkCount === n ? alpha('#7c3aed', 0.1) : '#fff',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#7c3aed', bgcolor: alpha('#7c3aed', 0.06) },
                        }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: linkCount === n ? '#7c3aed' : '#555' }}>
                                {n}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: linkCount === n ? '#7c3aed' : '#aaa', fontWeight: 600 }}>
                                envelope{n !== 1 ? 's' : ''}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Typography sx={{ fontSize: '0.68rem', color: '#888', mt: 1.5, lineHeight: 1.5 }}>
                    You'll configure each envelope one at a time in the following steps.
                    All {linkCount} will be submitted together as a linked group.
                </Typography>
            </Box>
        )}
    </Box>
);

// ── Linked envelope manager (shown on Review step when isLinked) ─────────────
const LinkedEnvelopeManager: React.FC<{
    forms:     NewEnvelopeForm[];
    activeIdx: number;
    onSelect:  (i: number) => void;
    onAdd:     () => void;
    onRemove:  (i: number) => void;
}> = ({ forms, activeIdx, onSelect, onAdd, onRemove }) => (
    <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
            <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed' }}>
                Linked group — {forms.length} envelope{forms.length !== 1 ? 's' : ''}
            </Typography>
            <Button size="small" startIcon={<Plus size={12} />} onClick={onAdd}
                    sx={{ borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.7rem',
                        bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed',
                        '&:hover': { bgcolor: alpha('#7c3aed', 0.18) } }}>
                Add envelope
            </Button>
        </Box>
        <Stack spacing={0.75}>
            {forms.map((f, i) => {
                const c = f.envelopeType ? ENVELOPE_COLORS[f.envelopeType] : '#94a3b8';
                return (
                    <Box key={i}
                         onClick={() => onSelect(i)}
                         sx={{
                             display: 'flex', alignItems: 'center', gap: 1.25,
                             p: 1.25, borderRadius: '9px', cursor: 'pointer',
                             border: `1.5px solid ${i === activeIdx ? c : alpha('#000', 0.08)}`,
                             bgcolor: i === activeIdx ? alpha(c, 0.05) : '#fafafa',
                             transition: 'all 0.15s',
                             '&:hover': { borderColor: c, bgcolor: alpha(c, 0.04) },
                         }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(c, 0.12),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
                            {f.envelopeType ? ENVELOPE_ICONS[f.envelopeType] : <Wallet size={14} />}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.envelopeName || `Envelope ${i + 1}`}
                            </Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                                {f.targetAmount !== '' ? fmt(Number(f.targetAmount)) : 'No amount set'}
                                {f.envelopeType ? ` · ${f.envelopeType.charAt(0) + f.envelopeType.slice(1).toLowerCase()}` : ''}
                            </Typography>
                        </Box>
                        {i === activeIdx && (
                            <Chip size="small" label="Editing"
                                  sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700,
                                      bgcolor: alpha(c, 0.12), color: c }} />
                        )}
                        {forms.length > 2 && (
                            <IconButton size="small"
                                        onClick={e => { e.stopPropagation(); onRemove(i); }}
                                        sx={{ p: 0.4, color: '#ccc', '&:hover': { color: '#dc2626', bgcolor: alpha('#dc2626', 0.08) } }}>
                                <Trash2 size={12} />
                            </IconButton>
                        )}
                    </Box>
                );
            })}
        </Stack>
    </Box>
);

// ── Step components (unchanged from original) ────────────────────────────────
const StepType: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => (
    <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
            What kind of envelope is this?
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
            Choose the type that best describes your goal — this shapes how we track and report it.
        </Typography>
        <Grid container spacing={2}>
            {(['SAVINGS', 'PAYOFF', 'PURCHASE', 'EMERGENCY'] as const).map(type => {
                const color  = ENVELOPE_COLORS[type];
                const active = form.envelopeType === type;
                return (
                    <Grid item xs={12} sm={6} key={type}>
                        <Box onClick={() => update('envelopeType', type)} sx={{
                            p: 2.5, borderRadius: '12px', cursor: 'pointer',
                            border: `2px solid ${active ? color : alpha('#000', 0.1)}`,
                            bgcolor: active ? alpha(color, 0.06) : '#fafafa',
                            transition: 'all 0.18s',
                            '&:hover': { border: `2px solid ${color}`, bgcolor: alpha(color, 0.04) },
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: '10px',
                                    bgcolor: active ? alpha(color, 0.15) : alpha('#000', 0.06),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: active ? color : '#888', transition: 'all 0.18s',
                                }}>
                                    {ENVELOPE_ICONS[type]}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: active ? color : '#111' }}>
                                        {type.charAt(0) + type.slice(1).toLowerCase()}
                                    </Typography>
                                    {active && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                            <CheckCircle size={11} color={color} />
                                            <Typography sx={{ fontSize: '0.6rem', color, fontWeight: 700 }}>Selected</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.5 }}>
                                {ENVELOPE_DESCRIPTIONS[type]}
                            </Typography>
                        </Box>
                    </Grid>
                );
            })}
        </Grid>
    </Box>
);

const StepName: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>Name your envelope</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Give it a clear, memorable name so you always know what you're saving for.
            </Typography>
            <Stack spacing={2.5}>
                <TextField label="Envelope Name"
                           placeholder='e.g. "Car Repair Fund", "Pay Off TV", "Hawaii Trip"'
                           value={form.envelopeName}
                           onChange={e => update('envelopeName', e.target.value)}
                           fullWidth inputProps={{ maxLength: 60 }}
                           helperText={`${form.envelopeName.length}/60`}
                           sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                <TextField label="Description (optional)"
                           placeholder="A short note about this goal…"
                           value={form.description}
                           onChange={e => update('description', e.target.value)}
                           fullWidth multiline rows={2}
                           inputProps={{ maxLength: 120 }}
                           helperText={`${form.description.length}/120`}
                           sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                <Box>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
                        Quick suggestions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {({
                            SAVINGS:   ['Vacation Fund', 'Wedding Fund', 'Home Down Payment', 'Education Fund'],
                            PAYOFF:    ['Pay Off Credit Card', 'Pay Off Laptop', 'Pay Off TV', 'Pay Off Medical Bill'],
                            PURCHASE:  ['New Laptop', 'New Car', 'New Phone', 'Home Appliance'],
                            EMERGENCY: ['Car Repair Fund', 'Home Repair Fund', 'Medical Emergency', 'Job Loss Buffer'],
                        } as Record<string, string[]>)[form.envelopeType || 'SAVINGS']?.map(s => (
                            <Chip key={s} label={s} size="small" onClick={() => update('envelopeName', s)}
                                  sx={{
                                      fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                                      bgcolor: form.envelopeName === s ? alpha(color, 0.12) : alpha('#000', 0.05),
                                      color:   form.envelopeName === s ? color : '#555',
                                      border:  `1px solid ${form.envelopeName === s ? alpha(color, 0.3) : 'transparent'}`,
                                      '&:hover': { bgcolor: alpha(color, 0.08), color },
                                  }} />
                        ))}
                    </Box>
                </Box>
            </Stack>
        </Box>
    );
};

const StepAmount: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>How much do you need?</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Set your total target and optionally kick things off with money you already have.
            </Typography>
            <Stack spacing={3}>
                <TextField label="Total Target Amount" placeholder="0.00"
                           value={form.targetAmount}
                           onChange={e => { const v = e.target.value; update('targetAmount', v === '' ? '' : parseFloat(v) || ''); }}
                           fullWidth type="number" required
                           InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                           inputProps={{ min: 0, step: 0.01 }}
                           sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                {form.targetAmount !== '' && Number(form.targetAmount) > 0 && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>Target</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(form.targetAmount))}</Typography>
                        </Box>
                        <LinearProgress variant="determinate"
                                        value={form.startingAmount !== '' && Number(form.startingAmount) > 0 ? Math.min((Number(form.startingAmount) / Number(form.targetAmount)) * 100, 100) : 0}
                                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mt: 0.5 }}>
                            {form.startingAmount !== '' && Number(form.startingAmount) > 0
                                ? `Starting with ${fmt(Number(form.startingAmount))} — ${((Number(form.startingAmount) / Number(form.targetAmount)) * 100).toFixed(0)}% already covered`
                                : 'Starting from $0'}
                        </Typography>
                    </Box>
                )}
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', mb: 0.4 }}>
                        Starting Amount <Typography component="span" sx={{ color: '#aaa', fontWeight: 400 }}>(optional)</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mb: 1.25 }}>Do you already have some money set aside for this goal?</Typography>
                    <TextField placeholder="0.00" value={form.startingAmount}
                               onChange={e => { const v = e.target.value; update('startingAmount', v === '' ? '' : parseFloat(v) || ''); }}
                               fullWidth type="number"
                               InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                               inputProps={{ min: 0, step: 0.01, max: form.targetAmount || undefined }}
                               sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                </Box>
            </Stack>
        </Box>
    );
};

const StepTimeline: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const quickOptions = [
        { label: '3 months',  months: 3  },
        { label: '6 months',  months: 6  },
        { label: '1 year',    months: 12 },
        { label: '18 months', months: 18 },
        { label: '2 years',   months: 24 },
    ];
    const setQuick = (months: number) => {
        const d = addMonths(months);
        update('targetDate', d.toISOString().split('T')[0]);
    };
    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>When do you want to reach this goal?</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Optional — but setting a deadline helps us calculate a realistic contribution amount.
            </Typography>
            <Stack spacing={3}>
                <Box>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Quick select</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {quickOptions.map(({ label, months }) => {
                            const d        = addMonths(months).toISOString().split('T')[0];
                            const selected = form.targetDate === d;
                            return (
                                <Chip key={label} label={label} onClick={() => setQuick(months)}
                                      sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                                          bgcolor: selected ? alpha(color, 0.12) : alpha('#000', 0.05),
                                          color:   selected ? color : '#555',
                                          border:  `1px solid ${selected ? alpha(color, 0.3) : 'transparent'}`,
                                          '&:hover': { bgcolor: alpha(color, 0.08), color } }} />
                            );
                        })}
                    </Box>
                </Box>
                <TextField label="Target Date (optional)" type="date" value={form.targetDate}
                           onChange={e => update('targetDate', e.target.value)}
                           fullWidth InputLabelProps={{ shrink: true }}
                           inputProps={{ min: new Date().toISOString().split('T')[0] }}
                           sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                {form.targetDate && form.targetAmount !== '' && Number(form.targetAmount) > 0 && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Calendar size={14} color={color} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color }}>{fmtDate(dateFromStr(form.targetDate)!)}</Typography>
                        </Box>
                        {(() => {
                            const months = monthsBetween(new Date(), dateFromStr(form.targetDate)!);
                            const needed = autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
                            return (
                                <Typography sx={{ fontSize: '0.72rem', color: '#666' }}>
                                    {months > 0
                                        ? `${months} month${months !== 1 ? 's' : ''} away — requires roughly ${fmt(needed)}/month`
                                        : 'Target date is in the past — please choose a future date.'}
                                </Typography>
                            );
                        })()}
                    </Box>
                )}
                {!form.targetDate && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha('#94a3b8', 0.07), border: `1px solid ${alpha('#94a3b8', 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Info size={14} color="#94a3b8" />
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                No deadline set — you can let the app calculate a projected completion date based on your contributions instead.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

const StepContribution: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const autoAmt = useMemo(() => {
        if (!form.targetDate || form.targetAmount === '') return null;
        return autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
    }, [form.targetDate, form.targetAmount, form.startingAmount]);

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>How do you want to contribute?</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Tell us how much you'll put in, or let us figure out the right amount for you.
            </Typography>
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {[
                        { mode: 'auto',   icon: <Zap size={16} />,       label: 'Auto-calculate',    sub: 'We figure out the amount' },
                        { mode: 'manual', icon: <TrendingUp size={16} />, label: 'Set my own amount', sub: 'You choose how much'       },
                    ].map(({ mode, icon, label, sub }) => {
                        const active = form.contributionMode === mode;
                        return (
                            <Box key={mode} onClick={() => update('contributionMode', mode)} sx={{
                                flex: 1, p: 2, borderRadius: '10px', cursor: 'pointer',
                                border: `2px solid ${active ? color : alpha('#000', 0.1)}`,
                                bgcolor: active ? alpha(color, 0.06) : '#fafafa',
                                transition: 'all 0.15s',
                                '&:hover': { border: `2px solid ${color}`, bgcolor: alpha(color, 0.04) },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: active ? color : '#888' }}>
                                    {icon}
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: active ? color : '#333' }}>{label}</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.68rem', color: '#aaa' }}>{sub}</Typography>
                            </Box>
                        );
                    })}
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', mb: 1 }}>Contribution Frequency</Typography>
                    <ToggleButtonGroup value={form.contributionFrequency} exclusive
                                       onChange={(_, v) => v && update('contributionFrequency', v)} size="small"
                                       sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px !important', mx: 0.25 } }}>
                        {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                            <ToggleButton key={k} value={k}
                                          sx={{ '&.Mui-selected': { bgcolor: alpha(color, 0.12), color, borderColor: `${alpha(color, 0.3)} !important` }, '&:hover': { bgcolor: alpha(color, 0.06) } }}>
                                {v}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
                {form.contributionMode === 'auto' && (
                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Zap size={14} color={color} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color }}>
                                {autoAmt !== null ? `Suggested: ${fmt(autoAmt)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}` : 'Set a target date on the previous step for a suggestion'}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                            {autoAmt !== null
                                ? `Based on your target of ${fmt(Number(form.targetAmount))} by ${fmtDate(dateFromStr(form.targetDate)!)}, we suggest contributing ${fmt(autoAmt)} every ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}.`
                                : "Once you set a target date, we'll calculate the exact amount needed."}
                        </Typography>
                    </Box>
                )}
                {form.contributionMode === 'manual' && (
                    <TextField label={`${FREQUENCY_LABELS[form.contributionFrequency]} Contribution`} placeholder="0.00"
                               value={form.monthlyContribution}
                               onChange={e => { const v = e.target.value; update('monthlyContribution', v === '' ? '' : parseFloat(v) || ''); }}
                               fullWidth type="number"
                               InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment> }}
                               inputProps={{ min: 0, step: 0.01 }}
                               sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
                )}
                {(() => {
                    const contrib    = form.contributionMode === 'auto' ? (autoAmt ?? 0) : (Number(form.monthlyContribution) || 0);
                    const freqFactor = form.contributionFrequency === 'WEEKLY' ? 4.33 : form.contributionFrequency === 'BIWEEKLY' ? 2.17 : 1;
                    const monthlyEq  = contrib * freqFactor;
                    const months     = monthsToReach(Number(form.targetAmount) || 0, Number(form.startingAmount) || 0, monthlyEq);
                    if (!months || contrib === 0 || form.targetAmount === '') return null;
                    const projDate = addMonths(months);
                    const userDate = dateFromStr(form.targetDate);
                    const isOnTime = userDate ? projDate <= userDate : true;
                    return (
                        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(isOnTime ? '#16a34a' : '#d97706', 0.06), border: `1px solid ${alpha(isOnTime ? '#16a34a' : '#d97706', 0.2)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                                {isOnTime ? <CheckCircle size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#d97706" />}
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: isOnTime ? '#16a34a' : '#d97706' }}>
                                    {isOnTime ? 'On track!' : 'Heads up'}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                                At {fmt(contrib)}/{FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()} you'll reach your goal by{' '}
                                <strong>{fmtDate(projDate)}</strong>
                                {userDate && !isOnTime && ` — that's after your target of ${fmtDate(userDate)}. Consider increasing contributions.`}
                                {userDate &&  isOnTime && ` — right on schedule!`}
                            </Typography>
                        </Box>
                    );
                })()}
            </Stack>
        </Box>
    );
};

const StepReview: React.FC<{
    form:      NewEnvelopeForm;
    isLinked:  boolean;
    allForms:  NewEnvelopeForm[];
    activeIdx: number;
    onSelect:  (i: number) => void;
    onAdd:     () => void;
    onRemove:  (i: number) => void;
}> = ({ form, isLinked, allForms, activeIdx, onSelect, onAdd, onRemove }) => {
    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const contrib = useMemo(() => {
        if (form.contributionMode === 'auto' && form.targetDate && form.targetAmount !== '') {
            return autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
        }
        return Number(form.monthlyContribution) || 0;
    }, [form]);

    const freqFactor  = form.contributionFrequency === 'WEEKLY' ? 4.33 : form.contributionFrequency === 'BIWEEKLY' ? 2.17 : 1;
    const monthlyEq   = contrib * freqFactor;
    const months      = monthsToReach(Number(form.targetAmount) || 0, Number(form.startingAmount) || 0, monthlyEq);
    const projDate    = months ? addMonths(months) : null;
    const userDate    = dateFromStr(form.targetDate);
    const isRealistic = !userDate || !projDate || projDate <= userDate;
    const startPct    = form.targetAmount !== '' && Number(form.targetAmount) > 0
        ? Math.min((Number(form.startingAmount || 0) / Number(form.targetAmount)) * 100, 100) : 0;

    const rows = [
        { label: 'Envelope Type',   value: form.envelopeType ? form.envelopeType.charAt(0) + form.envelopeType.slice(1).toLowerCase() : '—' },
        { label: 'Name',            value: form.envelopeName || '—' },
        { label: 'Target Amount',   value: form.targetAmount !== '' ? fmt(Number(form.targetAmount)) : '—' },
        { label: 'Starting Amount', value: form.startingAmount !== '' && Number(form.startingAmount) > 0 ? fmt(Number(form.startingAmount)) : 'None' },
        { label: 'Target Date',     value: userDate ? fmtDate(userDate) : 'Not set' },
        { label: 'Contribution',    value: contrib > 0 ? `${fmt(contrib)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}` : 'Not set' },
        { label: 'Mode',            value: form.contributionMode === 'auto' ? 'Auto-calculated' : 'Manual' },
    ];

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>Review your envelope</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
                Here's everything at a glance — and what the app predicts for your goal.
            </Typography>

            {/* Linked group manager */}
            {isLinked && (
                <LinkedEnvelopeManager
                    forms={allForms} activeIdx={activeIdx}
                    onSelect={onSelect} onAdd={onAdd} onRemove={onRemove}
                />
            )}

            {/* Visual summary of current form */}
            <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: alpha(color, 0.06), border: `2px solid ${alpha(color, 0.2)}`, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: '11px', bgcolor: alpha(color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                        {form.envelopeType ? ENVELOPE_ICONS[form.envelopeType] : <Wallet size={22} />}
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#111' }}>{form.envelopeName || 'Unnamed Envelope'}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>{form.description || 'No description'}</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>Progress preview</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color }}>{startPct.toFixed(0)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={startPct}
                                sx={{ height: 7, borderRadius: 3.5, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3.5 } }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
                    <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Starting: {fmt(Number(form.startingAmount) || 0)}</Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {form.targetAmount !== '' ? fmt(Number(form.targetAmount)) : '—'}</Typography>
                </Box>
            </Box>

            {/* Prediction */}
            <Box sx={{ p: 2, borderRadius: '12px', mb: 3,
                bgcolor: alpha(isRealistic ? '#16a34a' : '#d97706', 0.06),
                border: `1px solid ${alpha(isRealistic ? '#16a34a' : '#d97706', 0.22)}` }}>
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: isRealistic ? '#16a34a' : '#d97706', mb: 1 }}>
                    App Prediction
                </Typography>
                <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.3 }}>Projected Completion</Typography>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111' }}>{projDate ? fmtDate(projDate) : months === null ? 'Set contributions' : '—'}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.3 }}>Your Target Date</Typography>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111' }}>{userDate ? fmtDate(userDate) : 'Not set'}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
                            {isRealistic ? <CheckCircle size={15} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} /> : <AlertTriangle size={15} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />}
                            <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.5 }}>
                                {!projDate ? "Add a contribution amount to see when you'll reach your goal."
                                    : !userDate ? `At your current contribution rate you'll reach ${fmt(Number(form.targetAmount))} by ${fmtDate(projDate)} — about ${months} month${months !== 1 ? 's' : ''} from now.`
                                        : isRealistic ? `Your target date of ${fmtDate(userDate)} is achievable! You're projected to finish ${months ? `in ${months} month${months !== 1 ? 's' : ''}` : 'on time'}.`
                                            : `Your target date of ${fmtDate(userDate)} may be tight. At ${fmt(contrib)}/${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()} you'll finish by ${fmtDate(projDate)} — consider increasing contributions or adjusting the date.`}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Detail rows */}
            <Box sx={{ borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
                {rows.map(({ label, value }, i) => (
                    <Box key={label} sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 2, py: 1.25,
                        bgcolor: i % 2 === 0 ? '#fafafa' : '#fff',
                        borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#888' }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Linked summary totals */}
            {isLinked && allForms.length > 1 && (
                <Box sx={{ mt: 2, p: 1.75, borderRadius: '10px', bgcolor: alpha('#7c3aed', 0.05), border: `1px solid ${alpha('#7c3aed', 0.18)}` }}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7c3aed', mb: 1 }}>
                        Group total
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#555' }}>Combined target</Typography>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(allForms.reduce((s, f) => s + (f.targetAmount !== '' ? Number(f.targetAmount) : 0), 0))}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// ── Main dialog ──────────────────────────────────────────────────────────────
const CreateEnvelopeDialog: React.FC<CreateEnvelopeDialogProps> = ({ open, onClose, onSubmit }) => {
    const [step,       setStep]       = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [isLinked,   setIsLinked]   = useState(false);
    const [linkCount,  setLinkCount]  = useState(2);        // ← add here

    // For linked mode: array of forms + which one is being edited
    const [forms,      setForms]      = useState<NewEnvelopeForm[]>([BLANK_FORM()]);
    const [activeIdx,  setActiveIdx]  = useState(0);

    const form   = forms[activeIdx];
    const update = useCallback((k: keyof NewEnvelopeForm, v: any) => {
        setForms(prev => prev.map((f, i) => i === activeIdx ? { ...f, [k]: v } : f));
    }, [activeIdx]);

    const reset = () => {
        setStep(0);
        setIsLinked(false);
        setForms([BLANK_FORM()]);
        setActiveIdx(0);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleAddEnvelope = () => {
        setForms(prev => [...prev, BLANK_FORM()]);
        setActiveIdx(forms.length); // point to the new blank one
        setStep(1);                 // jump back to Goal Type for the new envelope
    };

    const handleRemoveEnvelope = (i: number) => {
        if (forms.length <= 2) return; // keep minimum 2 for linked
        setForms(prev => prev.filter((_, idx) => idx !== i));
        setActiveIdx(Math.min(activeIdx, forms.length - 2));
    };

    const handleSelectEnvelope = (i: number) => {
        setActiveIdx(i);
    };

    const canAdvance = useMemo(() => {
        switch (step) {
            case 0: return true;                                                              // mode always valid
            case 1: return !!form.envelopeType;
            case 2: return form.envelopeName.trim().length >= 2;
            case 3: return form.targetAmount !== '' && Number(form.targetAmount) > 0;
            case 4: return true;                                                              // timeline optional
            case 5: return !!form.contributionMode;
            case 6: return true;                                                              // review
            default: return false;
        }
    }, [step, form]);

    const handleNext = () => { if (step < STEPS.length - 1) setStep(s => s + 1); };
    const handleBack = () => { if (step > 0) setStep(s => s - 1); };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (isLinked) {
                await onSubmit(forms, true);
            } else {
                await onSubmit(forms[0], false);
            }
            reset();
            onClose();
        } catch { /* let parent handle */ }
        finally { setSubmitting(false); }
    };

    const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
    const pct   = ((step + 1) / STEPS.length) * 100;

    return (
        <Dialog open={open} onClose={handleClose} TransitionComponent={SlideUp}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden', maxHeight: '92vh' } }}>

            {/* Header */}
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, pt: 2.5, pb: 2, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ position: 'absolute', bottom: -25, right: 60, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                Create New Envelope
                            </Typography>
                            {isLinked && (
                                <Chip size="small" label="Linked" icon={<Link size={9} />}
                                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
                                          bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                                          '& .MuiChip-icon': { color: '#fff', ml: '5px' } }} />
                            )}
                        </Box>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', mt: 0.1 }}>
                            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
                            {isLinked && forms.length > 1 && ` · Envelope ${activeIdx + 1} of ${forms.length}`}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}
                                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}>
                        <X size={18} />
                    </IconButton>
                </Box>

                {/* Step pills */}
                <Box sx={{ display: 'flex', gap: 0.75, mb: 1.75, flexWrap: 'wrap' }}>
                    {STEPS.map((s, i) => (
                        <Box key={s.id} onClick={() => i < step && setStep(i)}
                             sx={{
                                 display: 'flex', alignItems: 'center', gap: 0.5,
                                 px: 1, py: 0.35, borderRadius: '20px',
                                 bgcolor: i === step ? 'rgba(255,255,255,0.22)' : i < step ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                                 cursor: i < step ? 'pointer' : 'default',
                                 transition: 'all 0.15s',
                                 '&:hover': i < step ? { bgcolor: 'rgba(255,255,255,0.2)' } : {},
                             }}>
                            <Box sx={{ color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex' }}>
                                {i < step ? <CheckCircle size={10} /> : s.icon}
                            </Box>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: i === step ? 800 : 600, color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                {s.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <LinearProgress variant="determinate" value={pct}
                                sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 2 } }} />
            </Box>

            {/* Step content */}
            <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>
                {step === 0 && (                    // ← replace this entire block
                    <StepMode
                        isLinked={isLinked}
                        linkCount={linkCount}
                        onChange={(linked, count) => {
                            setIsLinked(linked);
                            setLinkCount(count);
                            if (linked) {
                                setForms(Array.from({ length: count }, () => BLANK_FORM()));
                            } else {
                                setForms([forms[0] ?? BLANK_FORM()]);
                            }
                            setActiveIdx(0);
                        }}
                    />
                )}
                {step === 1 && <StepType         form={form} update={update} />}
                {step === 2 && <StepName         form={form} update={update} />}
                {step === 3 && <StepAmount       form={form} update={update} />}
                {step === 4 && <StepTimeline     form={form} update={update} />}
                {step === 5 && <StepContribution form={form} update={update} />}
                {step === 6 && (
                    <StepReview
                        form={form} isLinked={isLinked}
                        allForms={forms} activeIdx={activeIdx}
                        onSelect={handleSelectEnvelope}
                        onAdd={handleAddEnvelope}
                        onRemove={handleRemoveEnvelope}
                    />
                )}
            </DialogContent>

            {/* Footer */}
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Button onClick={handleBack} disabled={step === 0} startIcon={<ChevronLeft size={16} />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#666',
                            '&:hover': { bgcolor: alpha('#000', 0.05) }, '&.Mui-disabled': { color: '#ccc' } }}>
                    Back
                </Button>

                <Typography sx={{ fontSize: '0.65rem', color: '#bbb', fontWeight: 600 }}>
                    {step + 1} / {STEPS.length}
                </Typography>

                {step < STEPS.length - 1 ? (
                    <Button onClick={handleNext} disabled={!canAdvance} endIcon={<ChevronRight size={16} />}
                            variant="contained"
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                                bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) },
                                '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' } }}>
                        Continue
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={submitting} variant="contained"
                            startIcon={submitting ? undefined : <CheckCircle size={15} />}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 2.5,
                                bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>
                        {submitting ? 'Creating…' : isLinked ? `Create ${forms.length} Envelopes` : 'Create Envelope'}
                    </Button>
                )}
            </Box>
        </Dialog>
    );
};

export default CreateEnvelopeDialog;

// import React, { useCallback, useMemo, useState } from 'react';
// import {
//     alpha, Box, Button, Chip, Dialog, DialogContent,
//     Divider, Grid, IconButton, InputAdornment,
//     LinearProgress, Slide, Slider, Stack, TextField,
//     ToggleButton, ToggleButtonGroup, Tooltip, Typography,
// } from '@mui/material';
// import { TransitionProps } from '@mui/material/transitions';
// import {
//     X, PiggyBank, Wallet, Flame, XCircle,
//     ChevronLeft, ChevronRight, CheckCircle,
//     Calendar, Target, Zap, Info, TrendingUp,
//     AlertTriangle, Clock,
// } from 'lucide-react';
//
// // ── Design tokens (matching app) ────────────────────────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
//
// const ENVELOPE_COLORS: Record<string, string> = {
//     SAVINGS:   '#0284c7',
//     PAYOFF:    '#dc2626',
//     PURCHASE:  '#7c3aed',
//     EMERGENCY: '#d97706',
// };
//
// const ENVELOPE_ICONS: Record<string, React.ReactNode> = {
//     SAVINGS:   <PiggyBank  size={22} />,
//     PAYOFF:    <XCircle    size={22} />,
//     PURCHASE:  <Wallet     size={22} />,
//     EMERGENCY: <Flame      size={22} />,
// };
//
// const ENVELOPE_DESCRIPTIONS: Record<string, string> = {
//     SAVINGS:   'Set aside money toward a future goal — vacation, education, big life moment.',
//     PAYOFF:    'Eliminate a specific debt or purchase balance before interest kicks in.',
//     PURCHASE:  'Save up for a specific item you plan to buy — laptop, appliance, gear.',
//     EMERGENCY: 'Build a cushion for unexpected costs — car repair, medical, home fix.',
// };
//
// const FREQUENCY_LABELS: Record<string, string> = {
//     WEEKLY:    'Weekly',
//     BIWEEKLY:  'Bi-weekly',
//     MONTHLY:   'Monthly',
// };
//
// // ── Types ────────────────────────────────────────────────────────────────────
// export interface NewEnvelopeForm {
//     envelopeType:            'SAVINGS' | 'PAYOFF' | 'PURCHASE' | 'EMERGENCY' | '';
//     envelopeName:            string;
//     targetAmount:            number | '';
//     startingAmount:          number | '';
//     targetDate:              string;
//     contributionMode:        'manual' | 'auto' | '';
//     monthlyContribution:     number | '';
//     contributionFrequency:   'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
//     description:             string;
// }
//
// export interface CreateEnvelopeDialogProps {
//     open:     boolean;
//     onClose:  () => void;
//     onSubmit: (data: NewEnvelopeForm) => Promise<void>;
// }
//
// // ── Slide transition ─────────────────────────────────────────────────────────
// const SlideUp = React.forwardRef(function SlideUp(
//     props: TransitionProps & { children: React.ReactElement },
//     ref: React.Ref<unknown>,
// ) {
//     return <Slide direction="up" ref={ref} {...props} />;
// });
//
// // ── Helpers ──────────────────────────────────────────────────────────────────
// function monthsToReach(target: number, current: number, monthly: number): number | null {
//     const remaining = target - current;
//     if (monthly <= 0 || remaining <= 0) return null;
//     return Math.ceil(remaining / monthly);
// }
//
// function addMonths(months: number): Date {
//     const d = new Date();
//     d.setMonth(d.getMonth() + months);
//     return d;
// }
//
// function dateFromStr(s: string): Date | null {
//     if (!s) return null;
//     const d = new Date(s);
//     return isNaN(d.getTime()) ? null : d;
// }
//
// function monthsBetween(from: Date, to: Date): number {
//     return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
// }
//
// function autoMonthly(target: number, current: number, targetDate: string): number {
//     const d = dateFromStr(targetDate);
//     if (!d) return 0;
//     const months = monthsBetween(new Date(), d);
//     if (months <= 0) return target - current;
//     return Math.ceil((target - (current || 0)) / months);
// }
//
// function fmtDate(d: Date): string {
//     return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
// }
//
// function fmt(n: number) {
//     return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }
//
// // ── Step config ──────────────────────────────────────────────────────────────
// const STEPS = [
//     { id: 'type',         label: 'Goal Type',     icon: <Target    size={14} /> },
//     { id: 'name',         label: 'Details',       icon: <Wallet    size={14} /> },
//     { id: 'amount',       label: 'Amounts',       icon: <PiggyBank size={14} /> },
//     { id: 'timeline',     label: 'Timeline',      icon: <Calendar  size={14} /> },
//     { id: 'contribution', label: 'Contributions', icon: <TrendingUp size={14} /> },
//     { id: 'review',       label: 'Review',        icon: <CheckCircle size={14} /> },
// ];
//
// // ── Step components ──────────────────────────────────────────────────────────
//
// const StepType: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => (
//     <Box>
//         <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//             What kind of envelope is this?
//         </Typography>
//         <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//             Choose the type that best describes your goal — this shapes how we track and report it.
//         </Typography>
//         <Grid container spacing={2}>
//             {(['SAVINGS', 'PAYOFF', 'PURCHASE', 'EMERGENCY'] as const).map(type => {
//                 const color   = ENVELOPE_COLORS[type];
//                 const active  = form.envelopeType === type;
//                 return (
//                     <Grid item xs={12} sm={6} key={type}>
//                         <Box
//                             onClick={() => update('envelopeType', type)}
//                             sx={{
//                                 p: 2.5, borderRadius: '12px', cursor: 'pointer',
//                                 border: `2px solid ${active ? color : alpha('#000', 0.1)}`,
//                                 bgcolor: active ? alpha(color, 0.06) : '#fafafa',
//                                 transition: 'all 0.18s',
//                                 '&:hover': { border: `2px solid ${color}`, bgcolor: alpha(color, 0.04) },
//                             }}
//                         >
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
//                                 <Box sx={{
//                                     width: 40, height: 40, borderRadius: '10px',
//                                     bgcolor: active ? alpha(color, 0.15) : alpha('#000', 0.06),
//                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                     color: active ? color : '#888',
//                                     transition: 'all 0.18s',
//                                 }}>
//                                     {ENVELOPE_ICONS[type]}
//                                 </Box>
//                                 <Box>
//                                     <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: active ? color : '#111' }}>
//                                         {type.charAt(0) + type.slice(1).toLowerCase()}
//                                     </Typography>
//                                     {active && (
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
//                                             <CheckCircle size={11} color={color} />
//                                             <Typography sx={{ fontSize: '0.6rem', color, fontWeight: 700 }}>Selected</Typography>
//                                         </Box>
//                                     )}
//                                 </Box>
//                             </Box>
//                             <Typography sx={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.5 }}>
//                                 {ENVELOPE_DESCRIPTIONS[type]}
//                             </Typography>
//                         </Box>
//                     </Grid>
//                 );
//             })}
//         </Grid>
//     </Box>
// );
//
// const StepName: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
//     const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
//     return (
//         <Box>
//             <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//                 Name your envelope
//             </Typography>
//             <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//                 Give it a clear, memorable name so you always know what you're saving for.
//             </Typography>
//             <Stack spacing={2.5}>
//                 <TextField
//                     label="Envelope Name"
//                     placeholder='e.g. "Car Repair Fund", "Pay Off TV", "Hawaii Trip"'
//                     value={form.envelopeName}
//                     onChange={e => update('envelopeName', e.target.value)}
//                     fullWidth
//                     inputProps={{ maxLength: 60 }}
//                     helperText={`${form.envelopeName.length}/60`}
//                     sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                 />
//                 <TextField
//                     label="Description (optional)"
//                     placeholder="A short note about this goal…"
//                     value={form.description}
//                     onChange={e => update('description', e.target.value)}
//                     fullWidth
//                     multiline
//                     rows={2}
//                     inputProps={{ maxLength: 120 }}
//                     helperText={`${form.description.length}/120`}
//                     sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                 />
//                 {/* Quick name suggestions */}
//                 <Box>
//                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                         Quick suggestions
//                     </Typography>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
//                         {({
//                             SAVINGS:   ['Vacation Fund', 'Wedding Fund', 'Home Down Payment', 'Education Fund'],
//                             PAYOFF:    ['Pay Off Credit Card', 'Pay Off Laptop', 'Pay Off TV', 'Pay Off Medical Bill'],
//                             PURCHASE:  ['New Laptop', 'New Car', 'New Phone', 'Home Appliance'],
//                             EMERGENCY: ['Car Repair Fund', 'Home Repair Fund', 'Medical Emergency', 'Job Loss Buffer'],
//                         } as Record<string, string[]>)[form.envelopeType || 'SAVINGS']?.map(s => (
//                             <Chip key={s} label={s} size="small" onClick={() => update('envelopeName', s)}
//                                   sx={{
//                                       fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
//                                       bgcolor: form.envelopeName === s ? alpha(color, 0.12) : alpha('#000', 0.05),
//                                       color:   form.envelopeName === s ? color : '#555',
//                                       border: `1px solid ${form.envelopeName === s ? alpha(color, 0.3) : 'transparent'}`,
//                                       '&:hover': { bgcolor: alpha(color, 0.08), color },
//                                   }} />
//                         ))}
//                     </Box>
//                 </Box>
//             </Stack>
//         </Box>
//     );
// };
//
// const StepAmount: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
//     const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
//     return (
//         <Box>
//             <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//                 How much do you need?
//             </Typography>
//             <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//                 Set your total target and optionally kick things off with money you already have.
//             </Typography>
//             <Stack spacing={3}>
//                 <TextField
//                     label="Total Target Amount"
//                     placeholder="0.00"
//                     value={form.targetAmount}
//                     onChange={e => {
//                         const v = e.target.value;
//                         update('targetAmount', v === '' ? '' : parseFloat(v) || '');
//                     }}
//                     fullWidth
//                     type="number"
//                     required
//                     InputProps={{
//                         startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>,
//                     }}
//                     inputProps={{ min: 0, step: 0.01 }}
//                     sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                 />
//
//                 {/* Visual progress preview */}
//                 {form.targetAmount !== '' && Number(form.targetAmount) > 0 && (
//                     <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}` }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
//                             <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>Target</Typography>
//                             <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
//                                 {fmt(Number(form.targetAmount))}
//                             </Typography>
//                         </Box>
//                         <LinearProgress variant="determinate"
//                                         value={form.startingAmount !== '' && Number(form.startingAmount) > 0
//                                             ? Math.min((Number(form.startingAmount) / Number(form.targetAmount)) * 100, 100)
//                                             : 0}
//                                         sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
//                         <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mt: 0.5 }}>
//                             {form.startingAmount !== '' && Number(form.startingAmount) > 0
//                                 ? `Starting with ${fmt(Number(form.startingAmount))} — ${((Number(form.startingAmount) / Number(form.targetAmount)) * 100).toFixed(0)}% already covered`
//                                 : 'Starting from $0'}
//                         </Typography>
//                     </Box>
//                 )}
//
//                 <Box>
//                     <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', mb: 0.4 }}>
//                         Starting Amount <Typography component="span" sx={{ color: '#aaa', fontWeight: 400 }}>(optional)</Typography>
//                     </Typography>
//                     <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mb: 1.25 }}>
//                         Do you already have some money set aside for this goal?
//                     </Typography>
//                     <TextField
//                         placeholder="0.00"
//                         value={form.startingAmount}
//                         onChange={e => {
//                             const v = e.target.value;
//                             update('startingAmount', v === '' ? '' : parseFloat(v) || '');
//                         }}
//                         fullWidth
//                         type="number"
//                         InputProps={{
//                             startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>,
//                         }}
//                         inputProps={{ min: 0, step: 0.01, max: form.targetAmount || undefined }}
//                         sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                     />
//                 </Box>
//             </Stack>
//         </Box>
//     );
// };
//
// const StepTimeline: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
//     const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
//
//     const quickOptions = [
//         { label: '3 months',  months: 3  },
//         { label: '6 months',  months: 6  },
//         { label: '1 year',    months: 12 },
//         { label: '18 months', months: 18 },
//         { label: '2 years',   months: 24 },
//     ];
//
//     const setQuick = (months: number) => {
//         const d = addMonths(months);
//         update('targetDate', d.toISOString().split('T')[0]);
//     };
//
//     return (
//         <Box>
//             <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//                 When do you want to reach this goal?
//             </Typography>
//             <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//                 Optional — but setting a deadline helps us calculate a realistic contribution amount.
//             </Typography>
//             <Stack spacing={3}>
//                 {/* Quick select */}
//                 <Box>
//                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
//                         Quick select
//                     </Typography>
//                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
//                         {quickOptions.map(({ label, months }) => {
//                             const d        = addMonths(months).toISOString().split('T')[0];
//                             const selected = form.targetDate === d;
//                             return (
//                                 <Chip key={label} label={label} onClick={() => setQuick(months)}
//                                       sx={{
//                                           fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
//                                           bgcolor: selected ? alpha(color, 0.12) : alpha('#000', 0.05),
//                                           color:   selected ? color : '#555',
//                                           border:  `1px solid ${selected ? alpha(color, 0.3) : 'transparent'}`,
//                                           '&:hover': { bgcolor: alpha(color, 0.08), color },
//                                       }} />
//                             );
//                         })}
//                     </Box>
//                 </Box>
//
//                 <TextField
//                     label="Target Date (optional)"
//                     type="date"
//                     value={form.targetDate}
//                     onChange={e => update('targetDate', e.target.value)}
//                     fullWidth
//                     InputLabelProps={{ shrink: true }}
//                     inputProps={{ min: new Date().toISOString().split('T')[0] }}
//                     sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                 />
//
//                 {form.targetDate && form.targetAmount !== '' && Number(form.targetAmount) > 0 && (
//                     <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//                             <Calendar size={14} color={color} />
//                             <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color }}>
//                                 {fmtDate(dateFromStr(form.targetDate)!)}
//                             </Typography>
//                         </Box>
//                         {(() => {
//                             const months = monthsBetween(new Date(), dateFromStr(form.targetDate)!);
//                             const needed = autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
//                             return (
//                                 <Typography sx={{ fontSize: '0.72rem', color: '#666' }}>
//                                     {months > 0
//                                         ? `${months} month${months !== 1 ? 's' : ''} away — requires roughly ${fmt(needed)}/month`
//                                         : 'Target date is in the past — please choose a future date.'}
//                                 </Typography>
//                             );
//                         })()}
//                     </Box>
//                 )}
//
//                 {!form.targetDate && (
//                     <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha('#94a3b8', 0.07), border: `1px solid ${alpha('#94a3b8', 0.18)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <Info size={14} color="#94a3b8" />
//                             <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
//                                 No deadline set — you can let the app calculate a projected completion date based on your contributions instead.
//                             </Typography>
//                         </Box>
//                     </Box>
//                 )}
//             </Stack>
//         </Box>
//     );
// };
//
// const StepContribution: React.FC<{ form: NewEnvelopeForm; update: (k: keyof NewEnvelopeForm, v: any) => void }> = ({ form, update }) => {
//     const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
//     const autoAmt = useMemo(() => {
//         if (!form.targetDate || form.targetAmount === '') return null;
//         return autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
//     }, [form.targetDate, form.targetAmount, form.startingAmount]);
//
//     return (
//         <Box>
//             <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//                 How do you want to contribute?
//             </Typography>
//             <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//                 Tell us how much you'll put in, or let us figure out the right amount for you.
//             </Typography>
//             <Stack spacing={3}>
//
//                 {/* Mode picker */}
//                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                     {[
//                         { mode: 'auto',   icon: <Zap size={16} />,      label: 'Auto-calculate',   sub: 'We figure out the amount' },
//                         { mode: 'manual', icon: <TrendingUp size={16} />, label: 'Set my own amount', sub: 'You choose how much' },
//                     ].map(({ mode, icon, label, sub }) => {
//                         const active = form.contributionMode === mode;
//                         return (
//                             <Box key={mode} onClick={() => update('contributionMode', mode)}
//                                  sx={{
//                                      flex: 1, p: 2, borderRadius: '10px', cursor: 'pointer',
//                                      border: `2px solid ${active ? color : alpha('#000', 0.1)}`,
//                                      bgcolor: active ? alpha(color, 0.06) : '#fafafa',
//                                      transition: 'all 0.15s',
//                                      '&:hover': { border: `2px solid ${color}`, bgcolor: alpha(color, 0.04) },
//                                  }}>
//                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: active ? color : '#888' }}>{icon}
//                                     <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: active ? color : '#333' }}>{label}</Typography>
//                                 </Box>
//                                 <Typography sx={{ fontSize: '0.68rem', color: '#aaa' }}>{sub}</Typography>
//                             </Box>
//                         );
//                     })}
//                 </Box>
//
//                 {/* Frequency */}
//                 <Box>
//                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', mb: 1 }}>Contribution Frequency</Typography>
//                     <ToggleButtonGroup
//                         value={form.contributionFrequency}
//                         exclusive
//                         onChange={(_, v) => v && update('contributionFrequency', v)}
//                         size="small"
//                         sx={{ width: '100%', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px !important', mx: 0.25 } }}
//                     >
//                         {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
//                             <ToggleButton key={k} value={k}
//                                           sx={{
//                                               '&.Mui-selected': { bgcolor: alpha(color, 0.12), color, borderColor: `${alpha(color, 0.3)} !important` },
//                                               '&:hover': { bgcolor: alpha(color, 0.06) },
//                                           }}>
//                                 {v}
//                             </ToggleButton>
//                         ))}
//                     </ToggleButtonGroup>
//                 </Box>
//
//                 {/* Auto mode info */}
//                 {form.contributionMode === 'auto' && (
//                     <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.18)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//                             <Zap size={14} color={color} />
//                             <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color }}>
//                                 {autoAmt !== null
//                                     ? `Suggested: ${fmt(autoAmt)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}`
//                                     : 'Set a target date on the previous step for a suggestion'}
//                             </Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
//                             {autoAmt !== null
//                                 ? `Based on your target of ${fmt(Number(form.targetAmount))} by ${fmtDate(dateFromStr(form.targetDate)!)}, we suggest contributing ${fmt(autoAmt)} every ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}.`
//                                 : 'Once you set a target date, we\'ll calculate the exact amount needed.'}
//                         </Typography>
//                     </Box>
//                 )}
//
//                 {/* Manual input */}
//                 {form.contributionMode === 'manual' && (
//                     <TextField
//                         label={`${FREQUENCY_LABELS[form.contributionFrequency]} Contribution`}
//                         placeholder="0.00"
//                         value={form.monthlyContribution}
//                         onChange={e => {
//                             const v = e.target.value;
//                             update('monthlyContribution', v === '' ? '' : parseFloat(v) || '');
//                         }}
//                         fullWidth
//                         type="number"
//                         InputProps={{
//                             startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: '#aaa' }}>$</Typography></InputAdornment>,
//                         }}
//                         inputProps={{ min: 0, step: 0.01 }}
//                         sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
//                     />
//                 )}
//
//                 {/* Projection preview */}
//                 {(() => {
//                     const contrib = form.contributionMode === 'auto'
//                         ? (autoAmt ?? 0)
//                         : (Number(form.monthlyContribution) || 0);
//                     const freqFactor = form.contributionFrequency === 'WEEKLY' ? 4.33 : form.contributionFrequency === 'BIWEEKLY' ? 2.17 : 1;
//                     const monthlyEq  = contrib * freqFactor;
//                     const months     = monthsToReach(Number(form.targetAmount) || 0, Number(form.startingAmount) || 0, monthlyEq);
//                     if (!months || contrib === 0 || form.targetAmount === '') return null;
//                     const projDate = addMonths(months);
//                     const userDate = dateFromStr(form.targetDate);
//                     const isOnTime = userDate ? projDate <= userDate : true;
//                     return (
//                         <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(isOnTime ? '#16a34a' : '#d97706', 0.06), border: `1px solid ${alpha(isOnTime ? '#16a34a' : '#d97706', 0.2)}` }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
//                                 {isOnTime ? <CheckCircle size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#d97706" />}
//                                 <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: isOnTime ? '#16a34a' : '#d97706' }}>
//                                     {isOnTime ? 'On track!' : 'Heads up'}
//                                 </Typography>
//                             </Box>
//                             <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
//                                 At {fmt(contrib)}/{FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()} you'll reach your goal by{' '}
//                                 <strong>{fmtDate(projDate)}</strong>
//                                 {userDate && !isOnTime && ` — that's after your target of ${fmtDate(userDate)}. Consider increasing contributions.`}
//                                 {userDate &&  isOnTime && ` — right on schedule!`}
//                             </Typography>
//                         </Box>
//                     );
//                 })()}
//             </Stack>
//         </Box>
//     );
// };
//
// const StepReview: React.FC<{ form: NewEnvelopeForm }> = ({ form }) => {
//     const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
//
//     const contrib = useMemo(() => {
//         if (form.contributionMode === 'auto' && form.targetDate && form.targetAmount !== '') {
//             return autoMonthly(Number(form.targetAmount), Number(form.startingAmount) || 0, form.targetDate);
//         }
//         return Number(form.monthlyContribution) || 0;
//     }, [form]);
//
//     const freqFactor   = form.contributionFrequency === 'WEEKLY' ? 4.33 : form.contributionFrequency === 'BIWEEKLY' ? 2.17 : 1;
//     const monthlyEq    = contrib * freqFactor;
//     const months       = monthsToReach(Number(form.targetAmount) || 0, Number(form.startingAmount) || 0, monthlyEq);
//     const projDate     = months ? addMonths(months) : null;
//     const userDate     = dateFromStr(form.targetDate);
//     const isRealistic  = !userDate || !projDate || projDate <= userDate;
//     const startPct     = form.targetAmount !== '' && Number(form.targetAmount) > 0
//         ? Math.min((Number(form.startingAmount || 0) / Number(form.targetAmount)) * 100, 100)
//         : 0;
//
//     const rows = [
//         { label: 'Envelope Type',    value: form.envelopeType ? form.envelopeType.charAt(0) + form.envelopeType.slice(1).toLowerCase() : '—' },
//         { label: 'Name',             value: form.envelopeName || '—' },
//         { label: 'Target Amount',    value: form.targetAmount !== '' ? fmt(Number(form.targetAmount)) : '—' },
//         { label: 'Starting Amount',  value: form.startingAmount !== '' && Number(form.startingAmount) > 0 ? fmt(Number(form.startingAmount)) : 'None' },
//         { label: 'Target Date',      value: userDate ? fmtDate(userDate) : 'Not set' },
//         { label: 'Contribution',     value: contrib > 0 ? `${fmt(contrib)} / ${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()}` : 'Not set' },
//         { label: 'Mode',             value: form.contributionMode === 'auto' ? 'Auto-calculated' : 'Manual' },
//     ];
//
//     return (
//         <Box>
//             <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', mb: 0.5 }}>
//                 Review your envelope
//             </Typography>
//             <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 3 }}>
//                 Here's everything at a glance — and what the app predicts for your goal.
//             </Typography>
//
//             {/* Big visual summary */}
//             <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: alpha(color, 0.06), border: `2px solid ${alpha(color, 0.2)}`, mb: 3 }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
//                     <Box sx={{ width: 42, height: 42, borderRadius: '11px', bgcolor: alpha(color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
//                         {form.envelopeType ? ENVELOPE_ICONS[form.envelopeType] : <Wallet size={22} />}
//                     </Box>
//                     <Box>
//                         <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#111' }}>{form.envelopeName || 'Unnamed Envelope'}</Typography>
//                         <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>{form.description || 'No description'}</Typography>
//                     </Box>
//                 </Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>Progress preview</Typography>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color }}>{startPct.toFixed(0)}%</Typography>
//                 </Box>
//                 <LinearProgress variant="determinate" value={startPct}
//                                 sx={{ height: 7, borderRadius: 3.5, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3.5 } }} />
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.6 }}>
//                     <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
//                         Starting: {fmt(Number(form.startingAmount) || 0)}
//                     </Typography>
//                     <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
//                         Goal: {form.targetAmount !== '' ? fmt(Number(form.targetAmount)) : '—'}
//                     </Typography>
//                 </Box>
//             </Box>
//
//             {/* App prediction */}
//             <Box sx={{ p: 2, borderRadius: '12px', mb: 3,
//                 bgcolor: alpha(isRealistic ? '#16a34a' : '#d97706', 0.06),
//                 border: `1px solid ${alpha(isRealistic ? '#16a34a' : '#d97706', 0.22)}` }}>
//                 <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: isRealistic ? '#16a34a' : '#d97706', mb: 1 }}>
//                     App Prediction
//                 </Typography>
//                 <Grid container spacing={1.5}>
//                     <Grid item xs={6}>
//                         <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
//                             <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.3 }}>Projected Completion</Typography>
//                             <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111' }}>
//                                 {projDate ? fmtDate(projDate) : months === null ? 'Set contributions' : '—'}
//                             </Typography>
//                         </Box>
//                     </Grid>
//                     <Grid item xs={6}>
//                         <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
//                             <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', mb: 0.3 }}>Your Target Date</Typography>
//                             <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#111' }}>
//                                 {userDate ? fmtDate(userDate) : 'Not set'}
//                             </Typography>
//                         </Box>
//                     </Grid>
//                     <Grid item xs={12}>
//                         <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25, borderRadius: '8px', bgcolor: '#fff', border: '1px solid #eee' }}>
//                             {isRealistic
//                                 ? <CheckCircle size={15} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} />
//                                 : <AlertTriangle size={15} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
//                             }
//                             <Typography sx={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.5 }}>
//                                 {!projDate
//                                     ? 'Add a contribution amount to see when you\'ll reach your goal.'
//                                     : !userDate
//                                         ? `At your current contribution rate you'll reach ${fmt(Number(form.targetAmount))} by ${fmtDate(projDate)} — about ${months} month${months !== 1 ? 's' : ''} from now.`
//                                         : isRealistic
//                                             ? `Your target date of ${fmtDate(userDate)} is achievable! You're projected to finish ${months ? `in ${months} month${months !== 1 ? 's' : ''}` : 'on time'}.`
//                                             : `Your target date of ${fmtDate(userDate)} may be tight. At ${fmt(contrib)}/${FREQUENCY_LABELS[form.contributionFrequency].toLowerCase()} you'll finish by ${fmtDate(projDate)} — consider increasing contributions or adjusting the date.`
//                                 }
//                             </Typography>
//                         </Box>
//                     </Grid>
//                 </Grid>
//             </Box>
//
//             {/* Detail rows */}
//             <Box sx={{ borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
//                 {rows.map(({ label, value }, i) => (
//                     <Box key={label} sx={{
//                         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                         px: 2, py: 1.25,
//                         bgcolor: i % 2 === 0 ? '#fafafa' : '#fff',
//                         borderBottom: i < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
//                     }}>
//                         <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#888' }}>{label}</Typography>
//                         <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                     </Box>
//                 ))}
//             </Box>
//         </Box>
//     );
// };
//
// // ── Main dialog ──────────────────────────────────────────────────────────────
// const CreateEnvelopeDialog: React.FC<CreateEnvelopeDialogProps> = ({ open, onClose, onSubmit }) => {
//     const [step,       setStep]       = useState(0);
//     const [submitting, setSubmitting] = useState(false);
//     const [form,       setForm]       = useState<NewEnvelopeForm>({
//         envelopeType:          '',
//         envelopeName:          '',
//         targetAmount:          '',
//         startingAmount:        '',
//         targetDate:            '',
//         contributionMode:      '',
//         monthlyContribution:   '',
//         contributionFrequency: 'MONTHLY',
//         description:           '',
//     });
//
//     const update = useCallback((k: keyof NewEnvelopeForm, v: any) => {
//         setForm(prev => ({ ...prev, [k]: v }));
//     }, []);
//
//     const reset = () => {
//         setStep(0);
//         setForm({
//             envelopeType: '', envelopeName: '', targetAmount: '', startingAmount: '',
//             targetDate: '', contributionMode: '', monthlyContribution: '',
//             contributionFrequency: 'MONTHLY', description: '',
//         });
//     };
//
//     const handleClose = () => { reset(); onClose(); };
//
//     // Per-step validation
//     const canAdvance = useMemo(() => {
//         switch (step) {
//             case 0: return !!form.envelopeType;
//             case 1: return form.envelopeName.trim().length >= 2;
//             case 2: return form.targetAmount !== '' && Number(form.targetAmount) > 0;
//             case 3: return true; // timeline optional
//             case 4: return !!form.contributionMode;
//             case 5: return true; // review
//             default: return false;
//         }
//     }, [step, form]);
//
//     const handleNext = () => {
//         if (step < STEPS.length - 1) setStep(s => s + 1);
//     };
//
//     const handleBack = () => {
//         if (step > 0) setStep(s => s - 1);
//     };
//
//     const handleSubmit = async () => {
//         setSubmitting(true);
//         try {
//             await onSubmit(form);
//             reset();
//             onClose();
//         } catch { /* let parent handle errors */ }
//         finally { setSubmitting(false); }
//     };
//
//     const color = form.envelopeType ? ENVELOPE_COLORS[form.envelopeType] : MAROON;
//     const pct   = ((step + 1) / STEPS.length) * 100;
//
//     return (
//         <Dialog
//             open={open}
//             onClose={handleClose}
//             TransitionComponent={SlideUp}
//             maxWidth="sm"
//             fullWidth
//             PaperProps={{
//                 sx: {
//                     borderRadius: '18px',
//                     overflow: 'hidden',
//                     maxHeight: '92vh',
//                 },
//             }}
//         >
//             {/* ── Dialog header ─────────────────────────────────────── */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`,
//                 px: 3, pt: 2.5, pb: 2, position: 'relative', overflow: 'hidden',
//             }}>
//                 <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                 <Box sx={{ position: 'absolute', bottom: -25, right: 60, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
//
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
//                     <Box>
//                         <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.01em' }}>
//                             Create New Envelope
//                         </Typography>
//                         <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', mt: 0.2 }}>
//                             Step {step + 1} of {STEPS.length} — {STEPS[step].label}
//                         </Typography>
//                     </Box>
//                     <IconButton size="small" onClick={handleClose}
//                                 sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}>
//                         <X size={18} />
//                     </IconButton>
//                 </Box>
//
//                 {/* Step pills */}
//                 <Box sx={{ display: 'flex', gap: 0.75, mb: 1.75, flexWrap: 'wrap' }}>
//                     {STEPS.map((s, i) => (
//                         <Box key={s.id}
//                              onClick={() => i < step && setStep(i)}
//                              sx={{
//                                  display: 'flex', alignItems: 'center', gap: 0.5,
//                                  px: 1, py: 0.35, borderRadius: '20px',
//                                  bgcolor: i === step
//                                      ? 'rgba(255,255,255,0.22)'
//                                      : i < step
//                                          ? 'rgba(255,255,255,0.12)'
//                                          : 'rgba(255,255,255,0.07)',
//                                  cursor: i < step ? 'pointer' : 'default',
//                                  transition: 'all 0.15s',
//                                  '&:hover': i < step ? { bgcolor: 'rgba(255,255,255,0.2)' } : {},
//                              }}>
//                             <Box sx={{ color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex' }}>
//                                 {i < step ? <CheckCircle size={10} /> : s.icon}
//                             </Box>
//                             <Typography sx={{ fontSize: '0.6rem', fontWeight: i === step ? 800 : 600, color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)' }}>
//                                 {s.label}
//                             </Typography>
//                         </Box>
//                     ))}
//                 </Box>
//
//                 {/* Progress bar */}
//                 <LinearProgress variant="determinate" value={pct}
//                                 sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 2 } }} />
//             </Box>
//
//             {/* ── Step content ──────────────────────────────────────── */}
//             <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>
//                 {step === 0 && <StepType         form={form} update={update} />}
//                 {step === 1 && <StepName         form={form} update={update} />}
//                 {step === 2 && <StepAmount       form={form} update={update} />}
//                 {step === 3 && <StepTimeline     form={form} update={update} />}
//                 {step === 4 && <StepContribution form={form} update={update} />}
//                 {step === 5 && <StepReview       form={form} />}
//             </DialogContent>
//
//             {/* ── Footer navigation ─────────────────────────────────── */}
//             <Box sx={{
//                 px: 3, py: 2,
//                 display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                 borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa',
//             }}>
//                 <Button
//                     onClick={handleBack}
//                     disabled={step === 0}
//                     startIcon={<ChevronLeft size={16} />}
//                     sx={{
//                         borderRadius: '8px', textTransform: 'none', fontWeight: 600,
//                         color: '#666', '&:hover': { bgcolor: alpha('#000', 0.05) },
//                         '&.Mui-disabled': { color: '#ccc' },
//                     }}>
//                     Back
//                 </Button>
//
//                 <Typography sx={{ fontSize: '0.65rem', color: '#bbb', fontWeight: 600 }}>
//                     {step + 1} / {STEPS.length}
//                 </Typography>
//
//                 {step < STEPS.length - 1 ? (
//                     <Button
//                         onClick={handleNext}
//                         disabled={!canAdvance}
//                         endIcon={<ChevronRight size={16} />}
//                         variant="contained"
//                         sx={{
//                             borderRadius: '8px', textTransform: 'none', fontWeight: 700,
//                             bgcolor: color, '&:hover': { bgcolor: alpha(color, 0.85) },
//                             '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
//                         }}>
//                         Continue
//                     </Button>
//                 ) : (
//                     <Button
//                         onClick={handleSubmit}
//                         disabled={submitting}
//                         variant="contained"
//                         startIcon={submitting ? undefined : <CheckCircle size={15} />}
//                         sx={{
//                             borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 2.5,
//                             bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK },
//                         }}>
//                         {submitting ? 'Creating…' : 'Create Envelope'}
//                     </Button>
//                 )}
//             </Box>
//         </Dialog>
//     );
// };
//
// export default CreateEnvelopeDialog;
