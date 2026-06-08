import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MAROON, MAROON_DARK } from '../config/Constants';
import { ArrowUpRight } from 'lucide-react';
import { EnvelopeContribution } from '../config/Types';
export { default as ManualContributionDialog } from './ManualContributionDialog';
export { default as AffordabilityDialog }      from './AffordabilityDialog';

// ── VelocityChip ───────────────────────────────────────────────────────────────
export const VelocityChip: React.FC<{ days: number | null }> = ({ days }) => {
    if (days === null) return null;
    const isAhead   = days > 0;
    const isOnTrack = Math.abs(days) <= 3;
    const color = isOnTrack ? '#0284c7' : isAhead ? '#16a34a' : '#dc2626';
    const bg    = isOnTrack ? alpha('#0284c7', 0.1) : isAhead ? alpha('#16a34a', 0.1) : alpha('#dc2626', 0.1);
    const label = isOnTrack ? 'On track' : isAhead ? `${days}d ahead` : `${Math.abs(days)}d behind`;
    const Icon  = isAhead ? TrendingUp : TrendingDown;
    return (
        <Chip
            size="small"
            icon={<Box sx={{ display: 'flex', alignItems: 'center', color, ml: 0.5 }}><Icon size={9} /></Box>}
            label={label}
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: bg, color, '& .MuiChip-icon': { ml: '4px', mr: '-2px' } }}
        />
    );
};

// ── PanelHeader ────────────────────────────────────────────────────────────────
export const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 50, width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
            </Box>
        </Box>
    </Box>
);

// ── ContributionRow ────────────────────────────────────────────────────────────


export const ContributionRow: React.FC<{ c: EnvelopeContribution; color: string }> = ({ c, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${alpha('#000', 0.05)}`, '&:last-child': { borderBottom: 'none' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowUpRight size={13} color={color} />
            </Box>
            <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>{c.note || 'Contribution'}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: '#888' }}>
                    {new Date(c.contributedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
            </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color, fontVariantNumeric: 'tabular-nums' }}>
            +${c.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
    </Box>
);

