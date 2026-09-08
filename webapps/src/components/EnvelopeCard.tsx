import React from 'react';
import { alpha, Box, Button, Chip, Divider, Grow, LinearProgress, Typography } from '@mui/material';
import {
    Plus, PiggyBank, XCircle, Wallet, Flame, Landmark,
    Calendar, Clock, CheckCircle,
} from 'lucide-react';
import { RefreshCcw } from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { ENVELOPE_COLORS, STATUS_META } from '../config/Constants';
import { fmt, daysUntil, progressPct, requiredMonthly } from '../config/Helpers';
import NotificationToggle, { NotificationPrefs } from './NotificationToggle';

interface EnvelopeCardProps {
    envelope:              BudgetEnvelope;
    animateIn:             boolean;
    timeout:               number;
    onClick:               () => void;
    onAddManual:           (id: number) => void;
    contributions:         EnvelopeContribution[];
    monthContributed:      number;
    notificationPrefs:     NotificationPrefs;
    onToggleNotification:  (channel: 'system' | 'email') => void;
    /** Opens the combined notification settings/history dialog for this envelope */
    onOpenNotificationSettings?: (channel: 'system' | 'email') => void;
}

/**
 * A single envelope: the clickable, animated card (icon, chips, progress,
 * stats, footer, notification toggle) used both in the main envelopes grid
 * and — once wired up — for members inside a linked group.
 */
const EnvelopeCard: React.FC<EnvelopeCardProps> = ({
                                                       envelope, animateIn, timeout, onClick, onAddManual, contributions, monthContributed,
                                                       notificationPrefs, onToggleNotification, onOpenNotificationSettings,
                                                   }) => {
    const pct      = progressPct(envelope.currentAmount, envelope.targetAmount);
    const color    = ENVELOPE_COLORS[envelope.envelopeType] ?? '#6b1a1a';
    const status   = STATUS_META[envelope.status];
    const days     = daysUntil(envelope.targetDate);
    const isUrgent = days !== null && days <= 60 && envelope.status === 'ACTIVE';
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
                    background: '#fff', borderRadius: '14px',
                    border: `1px solid ${alpha(color, 0.2)}`, borderTop: `3px solid ${color}`,
                    boxShadow: '0 2px 12px rgba(122,31,43,0.07)', p: 2.5, cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                    '&:hover': { boxShadow: `0 6px 20px ${alpha(color, 0.16)}`, transform: 'translateY(-1.5px)' },
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
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#0284c7' }}>Auto</Typography>
                    </Box>
                )}

                {/* Header row — icon + name on the left, notification toggle on the right.
                    Consolidating what used to be two separate rows into one. */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {envelope.envelopeType === 'SAVINGS'   && <PiggyBank size={15} color={color} />}
                            {envelope.envelopeType === 'PAYOFF'    && <XCircle   size={15} color={color} />}
                            {envelope.envelopeType === 'PURCHASE'  && <Wallet    size={15} color={color} />}
                            {envelope.envelopeType === 'EMERGENCY' && <Flame     size={15} color={color} />}
                            {envelope.envelopeType === 'FUND'      && <Landmark  size={15} color={color} />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{envelope.envelopeName}</Typography>
                            <Typography sx={{ fontSize: '0.63rem', color: '#999', mt: 0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{envelope.description}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                        <NotificationToggle prefs={notificationPrefs} onToggle={onToggleNotification} onOpenSettings={onOpenNotificationSettings} />
                    </Box>
                </Box>

                {/* Chips — only exceptions get a badge now. Type and "Active" status are already
                    communicated by the icon/top-border color, so they no longer get a chip of
                    their own; only PAUSED/CANCELLED, urgency, velocity, and streaks do. */}
                {(envelope.status !== 'ACTIVE' || isUrgent || (envelope.streakMonths && envelope.streakMonths >= 3)) && (
                    <Box sx={{ display: 'flex', gap: 0.6, mb: 1.25, flexWrap: 'wrap' }}>
                        {envelope.status !== 'ACTIVE' && envelope.status !== 'COMPLETED' && (
                            <Chip size="small"
                                  icon={<Box sx={{ display: 'flex', alignItems: 'center', color: status.color, ml: 0.5 }}>{status.icon}</Box>}
                                  label={status.label}
                                  sx={{ height: 18, fontSize: '0.58rem', fontWeight: 500, bgcolor: alpha(status.color, 0.1), color: status.color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                        )}
                        {isUrgent && (
                            <Chip size="small" label={`${days}d left`} icon={<Clock size={9} />}
                                  sx={{ height: 18, fontSize: '0.58rem', fontWeight: 500, bgcolor: alpha('#d97706', 0.1), color: '#d97706', '& .MuiChip-icon': { ml: '4px', mr: '-2px', color: '#d97706' } }} />
                        )}
                        {envelope.streakMonths && envelope.streakMonths >= 3 && (
                            <Chip size="small" label={`${envelope.streakMonths}mo streak`}
                                  icon={<Box sx={{ display: 'flex', alignItems: 'center', color: '#7c3aed', ml: 0.5 }}><Flame size={9} /></Box>}
                                  sx={{ height: 18, fontSize: '0.58rem', fontWeight: 500, bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed', '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }} />
                        )}
                    </Box>
                )}

                {/* Progress — pace tick now overlays the single main bar instead of a duplicate
                    second bar underneath it. */}
                <Box sx={{ mb: 1.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: '#666', fontWeight: 500 }}>{fmt(envelope.currentAmount)} saved</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{pct.toFixed(0)}%</Typography>
                    </Box>
                    <Box sx={{ position: 'relative' }}>
                        <LinearProgress variant="determinate" value={pct}
                                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                        {expectedPct !== null && envelope.status === 'ACTIVE' && (
                            <Box sx={{
                                position: 'absolute', top: -1.5, bottom: -1.5, width: '2px',
                                left: `${Math.min(expectedPct, 98)}%`,
                                bgcolor: pct >= expectedPct ? alpha('#16a34a', 0.7) : alpha('#dc2626', 0.7),
                                borderRadius: '1px',
                            }} />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.62rem', color: '#aaa' }}>Goal: {fmt(envelope.targetAmount)}</Typography>
                        {envelope.remainingAmount > 0
                            ? <Typography sx={{ fontSize: '0.62rem', color, fontWeight: 500 }}>{fmt(envelope.remainingAmount)} to go</Typography>
                            : <Typography sx={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 500 }}>Goal reached! 🎉</Typography>}
                    </Box>
                </Box>

                {/* Stats — a single plain-text line instead of three bordered boxes; much
                    lighter visually while keeping the same three numbers. */}
                {envelope.status === 'ACTIVE' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25, flexWrap: 'wrap' }}>
                        {req !== null && (
                            <Typography sx={{ fontSize: '0.66rem', color: '#999' }}>
                                Need <Box component="span" sx={{ fontWeight: 600, color: req > envelope.allocatedAmount ? '#dc2626' : '#555' }}>{fmt(req)}/mo</Box>
                            </Typography>
                        )}
                        {monthContributed > 0 && (
                            <>
                                <Box sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: '#ddd' }} />
                                <Typography sx={{ fontSize: '0.66rem', color: '#999' }}>
                                    This month <Box component="span" sx={{ fontWeight: 600, color: monthContributed >= envelope.allocatedAmount ? '#16a34a' : '#555' }}>{fmt(monthContributed)}</Box>
                                </Typography>
                            </>
                        )}
                        {envelope.streakMonths ? (
                            <>
                                <Box sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: '#ddd' }} />
                                <Typography sx={{ fontSize: '0.66rem', color: '#999' }}>
                                    <Box component="span" sx={{ fontWeight: 600, color: '#555' }}>{envelope.streakMonths}mo</Box> streak
                                </Typography>
                            </>
                        ) : null}
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
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.62rem', borderColor: alpha(color, 0.4), color, py: 0.25, px: 0.9, minHeight: 0, '&:hover': { borderColor: color, bgcolor: alpha(color, 0.05) } }}>
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