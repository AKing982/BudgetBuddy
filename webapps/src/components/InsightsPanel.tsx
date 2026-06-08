import React from 'react';
import { alpha, Box, Chip, Grid, Typography } from '@mui/material';
import { AlertTriangle, CheckCircle, Flame, TrendingUp } from 'lucide-react';
import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { fmt, velocityDays, requiredMonthly } from '../config/Helpers';

interface InsightsPanelProps {
    envelopes:     BudgetEnvelope[];
    contributions: EnvelopeContribution[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ envelopes, contributions }) => {
    const active = envelopes.filter(e => e.status === 'ACTIVE');
    const insights: { color: string; bg: string; icon: React.ReactNode; title: string; sub: string }[] = [];

    // Payoff deadlines at risk
    active.filter(e => e.envelopeType === 'PAYOFF' && e.targetDate).forEach(env => {
        const req  = requiredMonthly(env);
        const diff = req !== null ? req - env.allocatedAmount : 0;
        if (diff > 0) {
            insights.push({
                color: '#dc2626', bg: alpha('#dc2626', 0.06), icon: <AlertTriangle size={13} color="#dc2626" />,
                title: `${env.envelopeName} needs $${Math.ceil(diff)} more per month`,
                sub: `At $${env.allocatedAmount}/mo you'll miss the deadline. Increase to $${Math.ceil(req!.valueOf())}/mo to clear on time.`,
            });
        }
    });

    // Near-completion envelopes
    active.filter(e => e.remainingAmount > 0 && e.remainingAmount <= e.allocatedAmount * 2).forEach(env => {
        insights.push({
            color: '#16a34a', bg: alpha('#16a34a', 0.06), icon: <CheckCircle size={13} color="#16a34a" />,
            title: `${env.envelopeName} completes next month`,
            sub: `Only ${fmt(env.remainingAmount)} left. One more contribution and ${fmt(env.allocatedAmount)}/mo frees up for reallocation.`,
        });
    });

    // Best streak
    const bestStreak = [...active].sort((a, b) => (b.streakMonths ?? 0) - (a.streakMonths ?? 0))[0];
    if (bestStreak?.streakMonths && bestStreak.streakMonths >= 3) {
        insights.push({
            color: '#7c3aed', bg: alpha('#7c3aed', 0.06), icon: <Flame size={13} color="#7c3aed" />,
            title: `${bestStreak.streakMonths}-month streak on ${bestStreak.envelopeName}`,
            sub: `Your longest active streak. Consistent monthly contributions are your strongest habit.`,
        });
    }

    // Ahead of pace
    active.forEach(env => {
        const vel = velocityDays(env);
        if (vel !== null && vel >= 20) {
            insights.push({
                color: '#0284c7', bg: alpha('#0284c7', 0.06), icon: <TrendingUp size={13} color="#0284c7" />,
                title: `${env.envelopeName} is ${vel} days ahead of pace`,
                sub: `You could reduce contributions by $${Math.max(Math.round(env.allocatedAmount * 0.15), 20)}/mo and still meet the target date.`,
            });
        }
    });

    if (!insights.length) return null;

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '2px', bgcolor: '#d97706' }} />
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706' }}>
                    Insights
                </Typography>
                <Chip size="small" label={insights.length}
                      sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha('#d97706', 0.1), color: '#d97706' }} />
            </Box>
            <Grid container spacing={1.5}>
                {insights.slice(0, 3).map((ins, i) => (
                    <Grid item xs={12} sm={4} key={i}>
                        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: ins.bg, border: `1px solid ${ins.color}22`, height: '100%' }}>
                            <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, alignItems: 'flex-start' }}>
                                {ins.icon}
                                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#111', lineHeight: 1.3 }}>{ins.title}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.68rem', color: '#555', lineHeight: 1.5 }}>{ins.sub}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default InsightsPanel;