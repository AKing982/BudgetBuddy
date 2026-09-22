import React, { useMemo } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { GitBranch } from 'lucide-react';
import { MAROON, InvestmentAccount, Portfolio, portfolioMonthlyDollarContribution, fmt } from './InvestmentUtils';

interface MoneyFlowSummaryProps {
    monthlyIncome: number;
    monthlyFixedSpend: number;
    portfolios: Portfolio[];
    accounts: InvestmentAccount[];
}

// A small fixed palette, cycled if there are more portfolios than colors.
const PORTFOLIO_COLORS = ['#6b1a1a', '#B8935A', '#0284c7', '#7a8f5e', '#8b5e8b'];

const MoneyFlowSummary: React.FC<MoneyFlowSummaryProps> = ({ monthlyIncome, monthlyFixedSpend, portfolios, accounts }) => {
    const segments = useMemo(() => {
        const portfolioSegs = portfolios.map((p, i) => ({
            label: p.name,
            value: portfolioMonthlyDollarContribution(p, monthlyIncome),
            color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length],
        }));
        const totalPortfolios = portfolioSegs.reduce((s, seg) => s + seg.value, 0);
        const leftover = Math.max(0, monthlyIncome - monthlyFixedSpend - totalPortfolios);
        return {
            fixed: { label: 'Fixed bills', value: monthlyFixedSpend, color: '#4a1010' },
            portfolios: portfolioSegs,
            leftover: { label: 'Unallocated', value: leftover, color: '#ddd' },
        };
    }, [monthlyIncome, monthlyFixedSpend, portfolios]);

    const total = monthlyIncome || 1;
    const pct = (v: number) => Math.max(0, (v / total) * 100);

    return (
        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}`, mb: 3 }}>
            <Box sx={{ background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`, px: 3, py: 1.75, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <GitBranch size={15} color="white" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>Money flow</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
                            Where this month's income goes — fixed bills, each portfolio, and what's left
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ bgcolor: '#fff', p: 3 }}>
                <Box sx={{ display: 'flex', height: 42, borderRadius: '10px', overflow: 'hidden', mb: 2 }}>
                    <Box sx={{
                        width: `${pct(segments.fixed.value)}%`, bgcolor: segments.fixed.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden',
                    }}>
                        {pct(segments.fixed.value) > 8 ? `${segments.fixed.label} ${fmt(segments.fixed.value)}` : ''}
                    </Box>
                    {segments.portfolios.map((seg, i) => (
                        <Box key={i} sx={{
                            width: `${pct(seg.value)}%`, bgcolor: seg.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                            fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden',
                        }}>
                            {pct(seg.value) > 8 ? `${seg.label} ${fmt(seg.value)}` : ''}
                        </Box>
                    ))}
                    <Box sx={{
                        width: `${pct(segments.leftover.value)}%`, bgcolor: segments.leftover.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666',
                        fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden',
                    }}>
                        {pct(segments.leftover.value) > 8 ? `${segments.leftover.label} ${fmt(segments.leftover.value)}` : ''}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
                    <LegendItem color={segments.fixed.color} label={segments.fixed.label} value={segments.fixed.value} />
                    {segments.portfolios.map((seg, i) => (
                        <LegendItem key={i} color={seg.color} label={seg.label} value={seg.value} />
                    ))}
                    <LegendItem color={segments.leftover.color} label={segments.leftover.label} value={segments.leftover.value} textColor="#666" />
                </Box>
            </Box>
        </Box>
    );
};

const LegendItem: React.FC<{ color: string; label: string; value: number; textColor?: string }> = ({ color, label, value, textColor }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.78rem', color: '#444' }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '3px', bgcolor: color, flexShrink: 0 }} />
        {label} <Box component="span" sx={{ fontWeight: 700, color: textColor ?? '#222' }}>{fmt(value)}</Box>
    </Box>
);

export default MoneyFlowSummary;