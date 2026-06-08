import React, { useState } from 'react';
import {
    alpha, Box, Chip, Collapse, Divider, Grid, IconButton,
    LinearProgress, Stack, Typography,
} from '@mui/material';
import { ChevronDown, ChevronUp, Layers, RefreshCcw, PiggyBank, XCircle, Wallet, Flame, CheckCircle, TrendingUp, PauseCircle } from 'lucide-react';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { ENVELOPE_COLORS, MAROON } from '../config/Constants';
import { fmt, progressPct, velocityDays, daysUntil, requiredMonthly } from '../config/Helpers';
import { VelocityChip } from './Shared';
import { BudgetEnvelope } from '../config/Types';

interface LinkedEnvelopeGroupCardProps {
    group:            LinkedEnvelopeGroup;
    onSelectEnvelope: (id: number) => void;
    selectedId:       number | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    SAVINGS:   <PiggyBank size={13} />,
    PAYOFF:    <XCircle   size={13} />,
    PURCHASE:  <Wallet    size={13} />,
    EMERGENCY: <Flame     size={13} />,
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    ACTIVE:    <TrendingUp  size={10} />,
    COMPLETED: <CheckCircle size={10} />,
    PAUSED:    <PauseCircle size={10} />,
};

const MemberCard: React.FC<{ env: BudgetEnvelope; isSelected: boolean; onClick: () => void }> = ({ env, isSelected, onClick }) => {
    const c    = ENVELOPE_COLORS[env.envelopeType];
    const pct  = progressPct(env.currentAmount, env.targetAmount);
    const vel  = velocityDays(env);
    const req  = requiredMonthly(env);
    const days = daysUntil(env.targetDate);

    return (
        <Box onClick={onClick} sx={{
            borderRadius: '10px',
            border: `1px solid ${isSelected ? c : alpha(c, 0.2)}`,
            borderTop: `3px solid ${c}`,
            bgcolor: isSelected ? alpha(c, 0.04) : '#fff',
            p: 1.25,
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': { boxShadow: `0 4px 14px ${alpha(c, 0.15)}`, transform: 'translateY(-1px)' },
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* type icon + name */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: '7px', bgcolor: alpha(c, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, flexShrink: 0 }}>
                    {TYPE_ICONS[env.envelopeType]}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {env.envelopeName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
                        <Box sx={{ color: env.status === 'ACTIVE' ? '#16a34a' : env.status === 'COMPLETED' ? '#0284c7' : '#d97706' }}>
                            {STATUS_ICON[env.status]}
                        </Box>
                        <Typography sx={{ fontSize: '0.58rem', color: '#888' }}>{env.status.toLowerCase()}</Typography>
                        {env.contributionMode === 'AUTO' && <RefreshCcw size={8} color="#0284c7" />}
                    </Box>
                </Box>
            </Box>

            {/* amount */}
            <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.25 }}>
                {fmt(env.currentAmount)}
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', color: '#aaa', mb: 0.75 }}>of {fmt(env.targetAmount)}</Typography>

            {/* progress bar */}
            <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 5, borderRadius: 3, bgcolor: alpha(c, 0.12), mb: 0.75, '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 3 } }} />

            {/* mini stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mb: 0.75 }}>
                <Box sx={{ p: 0.5, borderRadius: '5px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccc', mb: 0.1 }}>Need/mo</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: req !== null && req > env.allocatedAmount ? '#dc2626' : '#111', fontVariantNumeric: 'tabular-nums' }}>
                        {req !== null ? fmt(req) : '—'}
                    </Typography>
                </Box>
                <Box sx={{ p: 0.5, borderRadius: '5px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccc', mb: 0.1 }}>Remaining</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(env.remainingAmount)}
                    </Typography>
                </Box>
            </Box>

            {/* footer: deadline + velocity */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {days !== null
                    ? <Chip size="small" label={`${days}d left`}
                            sx={{ height: 15, fontSize: '0.55rem', fontWeight: 700, bgcolor: days <= 60 ? alpha('#d97706', 0.1) : alpha('#16a34a', 0.1), color: days <= 60 ? '#d97706' : '#16a34a' }} />
                    : <Box />}
                <VelocityChip days={vel} />
            </Box>
        </Box>
    );
};

const LinkedEnvelopeGroupCard: React.FC<LinkedEnvelopeGroupCardProps> = ({
                                                                             group, onSelectEnvelope, selectedId,
                                                                         }) => {
    const [expanded, setExpanded] = useState(false);

    const totalSaved     = group.envelopes.reduce((s, e) => s + e.currentAmount,  0);
    const totalTarget    = group.envelopes.reduce((s, e) => s + e.targetAmount,   0);
    const totalRemaining = group.envelopes.reduce((s, e) => s + e.remainingAmount, 0);
    const overallPct     = progressPct(totalSaved, totalTarget);
    const activeCount    = group.envelopes.filter(e => e.status === 'ACTIVE').length;

    return (
        <Box sx={{
            borderRadius: '12px',
            border: `1px solid ${alpha(MAROON, 0.25)}`,
            borderTop: `3px solid ${MAROON}`,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: `0 4px 18px ${alpha(MAROON, 0.12)}` },
        }}>
            {/* ── Group header ───────────────────────────────────────────── */}
            <Box sx={{ p: 2, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.25 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={15} color={MAROON} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {group.linkName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.63rem', color: '#888', mt: 0.2 }}>
                            {group.envelopes.length} envelopes · {activeCount} active
                        </Typography>
                    </Box>
                    <Chip size="small" label="Linked"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(MAROON, 0.1), color: MAROON, flexShrink: 0 }} />
                </Box>

                {/* Combined progress */}
                <Box sx={{ mb: 1.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(totalSaved)} combined</Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: MAROON }}>{overallPct.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={overallPct}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(MAROON, 0.1), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 3 } }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(totalTarget)}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: MAROON, fontWeight: 700 }}>{fmt(totalRemaining)} to go</Typography>
                    </Box>
                </Box>

                {/* Summary stats */}
                <Grid container spacing={0.75} sx={{ mb: 1.25 }}>
                    {[
                        { label: 'Shared budget', value: `${fmt(group.sharedBudget)}/mo` },
                        { label: 'Total spent',   value: fmt(group.totalSpent) },
                        { label: 'Score',         value: group.score.toFixed(1) },
                    ].map(({ label, value }) => (
                        <Grid item xs={4} key={label}>
                            <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.2 }}>{label}</Typography>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Expand toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                     onClick={() => setExpanded(p => !p)}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: MAROON }}>
                        {expanded ? 'Hide envelopes' : `View ${group.envelopes.length} envelopes`}
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.25, color: MAROON }}>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </IconButton>
                </Box>
            </Box>

            {/* ── Member envelope cards (expanded) ───────────────────────── */}
            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ bgcolor: '#f9f9f9', p: 1.5 }}>
                    <Grid container spacing={1.25}>
                        {group.envelopes.map(env => (
                            <Grid item xs={12} sm={6} key={env.id}>
                                <MemberCard
                                    env={env}
                                    isSelected={env.id === selectedId}
                                    onClick={() => onSelectEnvelope(env.id)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    );
};

export default LinkedEnvelopeGroupCard;