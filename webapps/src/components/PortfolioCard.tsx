import React from 'react';
import { Box, ButtonBase, Typography, alpha } from '@mui/material';
import { MAROON, InvestmentAccount, Portfolio, portfolioBalance, fmt } from './InvestmentUtils';

interface PortfolioCardProps {
    portfolio: Portfolio;
    accounts: InvestmentAccount[];
    isSelected: boolean;
    onClick: () => void;
}

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 251.2

const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, accounts, isSelected, onClick }) => {
    const balance = portfolioBalance(portfolio, accounts);

    // Sum of this portfolio's linked accounts' totalContributed — set on each
    // InvestmentAccount by InvestmentsPage.loadInvestmentDataFromDb, from the
    // sum of that account's investment transaction amounts. Not a field on the
    // base InvestmentAccount type yet, hence the cast — see conversation.
    const totalContributed = accounts
        .filter(a => portfolio.accountIds.includes(a.id))
        .reduce((s, a) => s + ((a as any).totalContributed ?? 0), 0);

    const pct = portfolio.targetAmount > 0 ? Math.min(100, (balance / portfolio.targetAmount) * 100) : 0;
    const ringOffset = RING_CIRCUMFERENCE * (1 - pct / 100);
    const targetMonth = new Date(portfolio.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return (
        <ButtonBase
            onClick={onClick}
            focusRipple
            sx={{
                width: '100%', height: '100%', textAlign: 'left', borderRadius: '10px',
                bgcolor: '#f8f9fa', p: 2.25, display: 'flex', alignItems: 'center', gap: 2,
                border: isSelected ? `2px solid ${MAROON}` : '2px solid transparent',
                boxShadow: isSelected ? `0 4px 18px ${alpha(MAROON, 0.25)}` : 'none',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                '&:hover': { boxShadow: `0 4px 16px ${alpha(MAROON, 0.18)}` },
            }}
        >
            {/* ── Left: name, balance, contributed, monthly % ── */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3 }}>{portfolio.name}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#888', mb: 1.75 }}>{portfolio.goal}</Typography>

                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.3rem', color: MAROON }}>
                    {fmt(balance)}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.25 }}>
                    {fmt(totalContributed)} contributed
                </Typography>

                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: MAROON, mt: 1.5 }}>
                    {portfolio.contributionPercentage}%/mo
                </Typography>
            </Box>

            {/* ── Right: progress ring instead of a linear bar ── */}
            <Box sx={{ flexShrink: 0, width: 118, textAlign: 'center' }}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ display: 'block', margin: '0 auto' }}>
                    <circle cx="48" cy="48" r={RING_RADIUS} fill="none" stroke={alpha(MAROON, 0.15)} strokeWidth="10" />
                    <circle
                        cx="48" cy="48" r={RING_RADIUS} fill="none" stroke={MAROON} strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={ringOffset}
                        transform="rotate(-90 48 48)"
                    />
                    <text x="48" y="53" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e1e2e">
                        {pct.toFixed(0)}%
                    </text>
                </svg>
                <Typography sx={{ fontSize: '0.66rem', color: '#888', mt: 0.5 }}>of {fmt(portfolio.targetAmount)}</Typography>
                <Typography sx={{ fontSize: '0.66rem', color: '#888' }}>{targetMonth}</Typography>
            </Box>
        </ButtonBase>
    );
};

export default PortfolioCard;