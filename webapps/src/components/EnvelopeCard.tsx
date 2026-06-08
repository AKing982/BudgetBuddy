import React from 'react';
import { alpha, Box, Button, Chip, Divider, Grow, LinearProgress, Typography } from '@mui/material';
import {
    Plus, PiggyBank, XCircle, Wallet, Flame,
    Calendar, Clock, CheckCircle,
} from 'lucide-react';
import { RefreshCcw } from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { ENVELOPE_COLORS, ENVELOPE_TYPE_LABELS, STATUS_META } from '../config/Constants';
import { VelocityChip } from './Shared';
import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly } from '../config/Helpers';

interface EnvelopeCardProps {
    envelope:         BudgetEnvelope;
    animateIn:        boolean;
    timeout:          number;
    onClick:          () => void;
    onAddManual:      (id: number) => void;
    contributions:    EnvelopeContribution[];
    monthContributed: number;
}

const EnvelopeCard: React.FC<EnvelopeCardProps> = ({
                                                       envelope, animateIn, timeout, onClick, onAddManual, contributions, monthContributed,
                                                   }) => {
    const pct      = progressPct(envelope.currentAmount, envelope.targetAmount);
    const color    = ENVELOPE_COLORS[envelope.envelopeType] ?? '#6b1a1a';
    const status   = STATUS_META[envelope.status];
    const days     = daysUntil(envelope.targetDate);
    const isUrgent = days !== null && days <= 60 && envelope.status === 'ACTIVE';
    const vel      = velocityDays(envelope);
    const req      = requiredMonthly(envelope);

    const expectedPct = (() => {
        if (!envelope.targetDate) return null;
        const start   = new Date(envelope.startDate).getTime();
        const end     = new Date(envelope.targetDate).getTime();
        const elapsed = Date.now() - start;
        return Math.min(Math.max((elapsed / (end - start)) * 100, 0), 100);
    })();

    return (
        <Grow in={animateIn} timeout={timeout}>
            <Box
                onClick={onClick}
                sx={{
                    background: '#fff', borderRadius: '12px',
                    border: `1px solid ${alpha(color, 0.2)}`, borderTop: `3px solid ${color}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', p: 2.5, cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                    '&:hover': { boxShadow: `0 6px 24px ${alpha(color, 0.18)}`, transform: 'translateY(-2px)' },
                    position: 'relative', overflow: 'hidden',
                    minHeight: 260,
                }}
            >
                {envelope.status === 'COMPLETED' && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', bgcolor: alpha('#16a34a', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={16} color="#16a34a" />
                    </Box>
                )}
                {envelope.contributionMode === 'AUTO' && envelope.status === 'ACTIVE' && (
                    <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 0.4, px: 0.75, py: 0.25, borderRadius: '20px', bgcolor: alpha('#0284c7', 0.1), border: `1px solid ${alpha('#0284c7', 0.2)}` }}>
                        <RefreshCcw size={9} color="#0284c7" />
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#0284c7' }}>Auto</Typography>
                    </Box>
                )}

                {/* Title row */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {envelope.envelopeType === 'SAVINGS'   && <PiggyBank size={16} color={color} />}
                            {envelope.envelopeType === 'PAYOFF'    && <XCircle   size={16} color={color} />}
                            {envelope.envelopeType === 'PURCHASE'  && <Wallet    size={16} color={color} />}
                            {envelope.envelopeType === 'EMERGENCY' && <Flame     size={16} color={color} />}
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111', lineHeight: 1.2 }}>{envelope.envelopeName}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#888', mt: 0.1 }}>{envelope.description}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Chips */}
                <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                    <Chip size="small" label={ENVELOPE_TYPE_LABELS[envelope.envelopeType]} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color }} />
                    <Chip size="small"
                          icon={<Box sx={{ display: 'flex', alignItems: 'center', color: status.color, ml: 0.5 }}>{status.icon}</Box>}
                          label={status.label}
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(status.color, 0.1), color: status.color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                    {isUrgent && (
                        <Chip size="small" label={`${days}d left`} icon={<Clock size={9} />}
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '4px', mr: '-2px', color: '#d97706' } }} />
                    )}
                    {envelope.status === 'ACTIVE' && <VelocityChip days={vel} />}
                    {envelope.streakMonths && envelope.streakMonths >= 3 && (
                        <Chip size="small" label={`${envelope.streakMonths}mo streak`}
                              icon={<Box sx={{ display: 'flex', alignItems: 'center', color: '#7c3aed', ml: 0.5 }}><Flame size={9} /></Box>}
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed', '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                    )}
                </Box>

                {/* Progress */}
                <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>{fmt(envelope.currentAmount)} saved</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#555', fontWeight: 700 }}>{pct.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                    {expectedPct !== null && envelope.status === 'ACTIVE' && (
                        <Box sx={{ mt: 0.5, position: 'relative' }}>
                            <LinearProgress variant="determinate" value={pct}
                                            sx={{ height: 3, borderRadius: 2, bgcolor: alpha(color, 0.08), '& .MuiLinearProgress-bar': { bgcolor: pct >= expectedPct ? '#16a34a' : '#dc2626', borderRadius: 2 } }} />
                            <Box sx={{ position: 'absolute', top: -1, left: `${Math.min(expectedPct, 98)}%`, width: 2, height: 5, bgcolor: alpha('#000', 0.25), borderRadius: '1px' }} />
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(envelope.targetAmount)}</Typography>
                        {envelope.remainingAmount > 0
                            ? <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 700 }}>{fmt(envelope.remainingAmount)} to go</Typography>
                            : <Typography sx={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 700 }}>Goal reached! 🎉</Typography>}
                    </Box>
                </Box>

                {/* Stats row */}
                {envelope.status === 'ACTIVE' && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75, mb: 1.25 }}>
                        {[
                            { label: 'Need/mo',    value: req !== null ? fmt(req) : '—', accent: req !== null && req > envelope.allocatedAmount ? '#dc2626' : undefined },
                            { label: 'This month', value: monthContributed > 0 ? fmt(monthContributed) : '—', accent: monthContributed >= envelope.allocatedAmount ? '#16a34a' : undefined },
                            { label: 'Streak',     value: envelope.streakMonths ? `${envelope.streakMonths}mo` : '—' },
                        ].map(({ label, value, accent }) => (
                            <Box key={label} sx={{ p: 0.75, borderRadius: '6px', bgcolor: '#f8f8f8', border: '1px solid #eee' }}>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbb', mb: 0.15 }}>{label}</Typography>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: accent ?? '#111', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                <Divider sx={{ mb: 1.25, borderColor: alpha(color, 0.1) }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={11} color="#aaa" />
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                            {envelope.contributionFrequency
                                ? `${envelope.contributionFrequency.charAt(0) + envelope.contributionFrequency.slice(1).toLowerCase()} · ${fmt(envelope.allocatedAmount)}`
                                : fmt(envelope.allocatedAmount)}
                        </Typography>
                    </Box>
                    {envelope.contributionMode === 'MANUAL' && envelope.status === 'ACTIVE' ? (
                        <Button size="small" variant="outlined" startIcon={<Plus size={11} />}
                                onClick={e => { e.stopPropagation(); onAddManual(envelope.id); }}
                                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.62rem', borderColor: alpha(color, 0.4), color, py: 0.25, px: 0.9, minHeight: 0, '&:hover': { borderColor: color, bgcolor: alpha(color, 0.05) } }}>
                            Add
                        </Button>
                    ) : (
                        envelope.targetDate && (
                            <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>
                                Target: {new Date(envelope.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </Typography>
                        )
                    )}
                </Box>
            </Box>
        </Grow>
    );
};

export default EnvelopeCard;