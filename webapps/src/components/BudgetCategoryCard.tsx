import React, { useState } from 'react';
import { Card, Box, Typography, alpha, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface BudgetCategoryCardProps {
    categoryName: string;
    budgeted: number;
    actual: number;
    remaining: number;
    compact?: boolean;
}

const tealColor = '#0d9488';

// ── Status config ─────────────────────────────────────────────────────────────
function getStatus(actual: number, budgeted: number) {
    if (budgeted === 0) return { key: 'healthy', color: tealColor,   label: 'On Track',    message: 'Spending is healthy — keep it up!', pulse: false };
    const pct = (actual / budgeted) * 100;
    if (pct < 70)  return { key: 'healthy', color: tealColor,   label: 'On Track',    message: 'Spending is healthy — keep it up!',         pulse: false };
    if (pct < 90)  return { key: 'warning', color: '#f59e0b',   label: 'Heads Up',    message: 'Getting close to your limit.',               pulse: false };
    if (pct < 100) return { key: 'danger',  color: '#ef4444',   label: 'Almost Full', message: 'Almost at your budget ceiling.',             pulse: true  };
    return             { key: 'over',    color: '#dc2626',   label: 'Over Budget', message: "You've exceeded this month's budget.",       pulse: true  };
}

// ── Gauge bar ─────────────────────────────────────────────────────────────────
interface GaugeBarProps {
    actual: number;
    budgeted: number;
    color: string;
    compact: boolean;
}

const GaugeBar: React.FC<GaugeBarProps> = ({ actual, budgeted, color, compact }) => {
    const pct = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;
    const isOver = actual > budgeted;
    const height = compact ? 6 : 8;

    return (
        <Box>
            {/* Labels */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: compact ? '0.62rem' : '0.68rem', color: 'text.disabled' }}>
                    $0
                </Typography>
                <Typography variant="caption" sx={{ fontSize: compact ? '0.62rem' : '0.68rem', color: 'text.secondary' }}>
                    Budget: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>${budgeted.toFixed(0)}</Box>
                </Typography>
            </Box>

            {/* Track */}
            <Box sx={{ position: 'relative', height, borderRadius: 99, bgcolor: alpha(color, 0.12), overflow: 'hidden' }}>
                {/* Actual fill */}
                <Box sx={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${pct}%`,
                    background: isOver
                        ? `repeating-linear-gradient(45deg, ${color}, ${color} 4px, ${alpha(color, 0.55)} 4px, ${alpha(color, 0.55)} 8px)`
                        : color,
                    borderRadius: 99,
                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }} />
                {/* Budget end marker */}
                <Box sx={{
                    position: 'absolute', top: 0, right: 0, width: '2px', height: '100%',
                    bgcolor: alpha(color, 0.45),
                }} />
            </Box>

            {/* Floating actual $ label */}
            <Box sx={{
                position: 'relative', mt: 0.5,
                pl: `${Math.min(Math.max(pct - 4, 0), 88)}%`,
                transition: 'padding-left 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}>
                <Typography sx={{
                    fontSize: compact ? '0.6rem' : '0.65rem',
                    fontWeight: 700, color,
                    bgcolor: alpha(color, 0.1),
                    borderRadius: '4px',
                    px: '4px', py: '1px',
                    whiteSpace: 'nowrap', display: 'inline-block',
                }}>
                    ${actual.toFixed(0)}
                </Typography>
            </Box>
        </Box>
    );
};

// ── Status badge ──────────────────────────────────────────────────────────────
interface StatusBadgeProps {
    statusKey: string;
    color: string;
    label: string;
    message: string;
    compact: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ statusKey, color, label, message, compact }) => {
    const icon = statusKey === 'healthy' ? '✓' : statusKey === 'warning' ? '⚠' : '🔔';
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1, py: compact ? 0.5 : 0.75,
            borderRadius: 2,
            bgcolor: alpha(color, 0.07),
            border: `1px solid ${alpha(color, 0.2)}`,
            mt: compact ? 0.75 : 1,
        }}>
            <Typography sx={{ fontSize: compact ? 11 : 13, lineHeight: 1 }}>{icon}</Typography>
            <Typography sx={{ fontSize: compact ? '0.62rem' : '0.7rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: compact ? '0.6rem' : '0.68rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                — {message}
            </Typography>
        </Box>
    );
};

// ── Bell ──────────────────────────────────────────────────────────────────────
interface BellProps {
    color: string;
    pulse: boolean;
    onDismiss: () => void;
}

const Bell: React.FC<BellProps> = ({ color, pulse, onDismiss }) => (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
        {pulse && (
            <Box sx={{
                position: 'absolute', inset: -3, borderRadius: '50%',
                bgcolor: alpha(color, 0.3),
                '@keyframes ping': {
                    '0%':   { transform: 'scale(1)',   opacity: 0.7 },
                    '70%':  { transform: 'scale(1.9)', opacity: 0   },
                    '100%': { transform: 'scale(1.9)', opacity: 0   },
                },
                animation: 'ping 1.4s ease-out infinite',
            }} />
        )}
        <Box
            component="button"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDismiss(); }}
            title="Dismiss alert"
            sx={{
                position: 'relative', width: 26, height: 26,
                border: `1.5px solid ${alpha(color, 0.4)}`,
                borderRadius: '50%', bgcolor: alpha(color, 0.1),
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: alpha(color, 0.2), transform: 'scale(1.1)' },
            }}
        >
            🔔
        </Box>
    </Box>
);

// ── Main component ────────────────────────────────────────────────────────────
const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
                                                                   categoryName,
                                                                   budgeted,
                                                                   actual,
                                                                   remaining,
                                                                   compact = true,
                                                               }) => {
    const [bellDismissed, setBellDismissed] = useState(false);
    const status = getStatus(actual, budgeted);
    const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    const isOverBudget = remaining < 0;
    const showBell = (status.key === 'danger' || status.key === 'over') && !bellDismissed;

    const formatCurrency = (amount: number) => `$${Math.abs(amount).toFixed(2)}`;

    const pieData = isOverBudget
        ? [
            { value: budgeted,         color: alpha(status.color, 0.25) },
            { value: actual - budgeted, color: status.color },
        ]
        : [
            { value: actual,                       color: status.color },
            { value: Math.max(remaining, 0),       color: alpha(status.color, 0.15) },
        ];

    if (compact) {
        return (
            <Card sx={{
                p: 1.5,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${alpha(status.color, 0.08)} 0%, ${alpha(status.color, 0.03)} 100%)`,
                border: `1.5px solid ${alpha(status.color, 0.18)}`,
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 14px ${alpha(status.color, 0.15)}`,
                    borderColor: alpha(status.color, 0.35),
                },
            }}>
                {/* Corner accent */}
                <Box sx={{
                    position: 'absolute', top: 0, right: 0, width: 55, height: 55,
                    background: `radial-gradient(circle at top right, ${alpha(status.color, 0.12)}, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                {/* Row 1: pie + name/amounts + bell */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {/* Mini pie */}
                    <Box sx={{ width: 44, height: 44, flexShrink: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={11} outerRadius={20}
                                     paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: status.color, lineHeight: 1 }}>
                                {Math.min(percentage, 999).toFixed(0)}%
                            </Typography>
                        </Box>
                    </Box>

                    {/* Name + actual / budgeted */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                            {categoryName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            {isOverBudget
                                ? <TrendingDown size={11} color="#dc2626" />
                                : <TrendingUp   size={11} color="#059669" />
                            }
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: status.color }}>${actual.toFixed(0)}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>/</Typography>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary' }}>${budgeted.toFixed(0)}</Typography>
                        </Box>
                    </Box>

                    {/* Bell or status icon */}
                    {showBell
                        ? <Bell color={status.color} pulse={status.pulse} onDismiss={() => setBellDismissed(true)} />
                        : <Typography sx={{ fontSize: 14, opacity: 0.55 }}>{status.key === 'healthy' ? '✓' : '⚠'}</Typography>
                    }
                </Box>

                {/* Gauge bar */}
                <GaugeBar actual={actual} budgeted={budgeted} color={status.color} compact />

                {/* Status badge */}
                <StatusBadge
                    statusKey={status.key}
                    color={status.color}
                    label={status.label}
                    message={status.message}
                    compact
                />
            </Card>
        );
    }

    // ── Non-compact ───────────────────────────────────────────────────────────
    return (
        <Card sx={{
            p: 2.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(status.color, 0.09)} 0%, ${alpha(status.color, 0.03)} 100%)`,
            border: `1.5px solid ${alpha(status.color, 0.22)}`,
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${alpha(status.color, 0.15)}`,
            },
        }}>
            {/* Corner accent */}
            <Box sx={{
                position: 'absolute', top: 0, right: 0, width: 100, height: 100,
                background: `radial-gradient(circle at top right, ${alpha(status.color, 0.14)}, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* Header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                        {categoryName}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color={status.color} sx={{ lineHeight: 1 }}>
                        {formatCurrency(actual)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        of {formatCurrency(budgeted)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    {/* Larger pie */}
                    <Box sx={{ width: 70, height: 70, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={19} outerRadius={34}
                                     paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: status.color, lineHeight: 1 }}>
                                {Math.min(percentage, 999).toFixed(0)}%
                            </Typography>
                        </Box>
                    </Box>

                    {showBell && (
                        <Bell color={status.color} pulse={status.pulse} onDismiss={() => setBellDismissed(true)} />
                    )}
                </Box>
            </Box>

            {/* Gauge bar */}
            <GaugeBar actual={actual} budgeted={budgeted} color={status.color} compact={false} />

            {/* Status badge */}
            <StatusBadge
                statusKey={status.key}
                color={status.color}
                label={status.label}
                message={status.message}
                compact={false}
            />
        </Card>
    );
};

export default BudgetCategoryCard;

// import React from 'react';
// import { Card, Box, Typography, LinearProgress, alpha, useTheme } from '@mui/material';
// import { TrendingUp, TrendingDown } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
//
// interface BudgetCategoryCardProps {
//     categoryName: string;
//     budgeted: number;
//     actual: number;
//     remaining: number;
//     compact?: boolean;
// }
//
// const tealColor = '#0d9488';
//
// const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
//                                                                    categoryName,
//                                                                    budgeted,
//                                                                    actual,
//                                                                    remaining,
//                                                                    compact = true
//                                                                }) => {
//     const theme = useTheme();
//
//     const getProgressColor = (actual: number, budgeted: number) => {
//         if (budgeted === 0) return tealColor;
//         const percentage = (actual / budgeted) * 100;
//         if (percentage < 70) return tealColor;
//         if (percentage < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//     const formatCurrency = (amount: number) => {
//         return `$${Math.abs(amount).toFixed(2)}`;
//     };
//
//     const percentage = (actual / budgeted) * 100;
//     const progressColor = getProgressColor(actual, budgeted);
//     const isOverBudget = remaining < 0;
//
//     // Pie chart data
//     const pieData = [
//         {
//             name: 'Spent',
//             value: actual > budgeted ? budgeted : actual,
//             color: progressColor
//         },
//         {
//             name: 'Remaining',
//             value: remaining > 0 ? remaining : 0,
//             color: alpha(progressColor, 0.2)
//         }
//     ];
//
//     // If over budget, show different pie
//     const overBudgetPieData = [
//         { name: 'Budget', value: budgeted, color: alpha(progressColor, 0.3) },
//         { name: 'Overspent', value: actual - budgeted, color: progressColor }
//     ];
//
//     const chartData = isOverBudget ? overBudgetPieData : pieData;
//
//     if (compact) {
//         return (
//             <Card sx={{
//                 p: 1.5,
//                 borderRadius: 1.5,
//                 background: `linear-gradient(135deg, ${alpha(progressColor, 0.08)} 0%, ${alpha(progressColor, 0.03)} 100%)`,
//                 border: `1px solid ${alpha(progressColor, 0.15)}`,
//                 transition: 'all 0.15s ease-in-out',
//                 '&:hover': {
//                     transform: 'translateY(-1px)',
//                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
//                     borderColor: alpha(progressColor, 0.3)
//                 }
//             }}>
//                 {/* Header Row with Pie Chart */}
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                     <Box sx={{ flex: 1, pr: 1 }}>
//                         <Typography variant="caption" sx={{
//                             fontWeight: 600,
//                             fontSize: '0.75rem',
//                             color: 'text.primary',
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis',
//                             whiteSpace: 'nowrap',
//                             display: 'block',
//                             mb: 0.5
//                         }}>
//                             {categoryName}
//                         </Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                             {isOverBudget ? (
//                                 <TrendingDown size={11} color="#dc2626" />
//                             ) : (
//                                 <TrendingUp size={11} color="#059669" />
//                             )}
//                             <Typography variant="caption" sx={{
//                                 fontWeight: 700,
//                                 fontSize: '0.7rem',
//                                 color: progressColor
//                             }}>
//                                 {formatCurrency(actual)}
//                             </Typography>
//                         </Box>
//                     </Box>
//
//                     {/* Mini Pie Chart with Center Label */}
//                     <Box sx={{ width: 40, height: 40, flexShrink: 0, position: 'relative' }}>
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={chartData}
//                                     cx="50%"
//                                     cy="50%"
//                                     innerRadius={10}
//                                     outerRadius={18}
//                                     paddingAngle={2}
//                                     dataKey="value"
//                                 >
//                                     {chartData.map((entry, index) => (
//                                         <Cell key={`cell-${index}`} fill={entry.color} />
//                                     ))}
//                                 </Pie>
//                             </PieChart>
//                         </ResponsiveContainer>
//                         {/* Percentage Label in Center */}
//                         <Box sx={{
//                             position: 'absolute',
//                             top: '50%',
//                             left: '50%',
//                             transform: 'translate(-50%, -50%)',
//                             pointerEvents: 'none'
//                         }}>
//                             <Typography sx={{
//                                 fontSize: '0.6rem',
//                                 fontWeight: 700,
//                                 color: progressColor,
//                                 lineHeight: 1,
//                                 textAlign: 'center'
//                             }}>
//                                 {Math.min(percentage, 100).toFixed(0)}%
//                             </Typography>
//                         </Box>
//                     </Box>
//                 </Box>
//
//                 {/* Progress Bar - Shows spending progress towards budget */}
//                 <Box sx={{ mb: 0.75 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                         <Typography variant="caption" sx={{
//                             fontSize: '0.65rem',
//                             color: 'text.secondary'
//                         }}>
//                             Progress
//                         </Typography>
//                         <Typography variant="caption" sx={{
//                             fontSize: '0.65rem',
//                             fontWeight: 600,
//                             color: progressColor
//                         }}>
//                             {Math.min(percentage, 100).toFixed(0)}%
//                         </Typography>
//                     </Box>
//                     <LinearProgress
//                         variant="determinate"
//                         value={Math.min(percentage, 100)}
//                         sx={{
//                             height: 6,
//                             borderRadius: 3,
//                             bgcolor: `${progressColor}15`,
//                             '& .MuiLinearProgress-bar': {
//                                 bgcolor: progressColor,
//                                 borderRadius: 3
//                             }
//                         }}
//                     />
//                 </Box>
//
//                 {/* Footer Row */}
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Typography variant="caption" sx={{
//                         fontSize: '0.65rem',
//                         color: 'text.secondary'
//                     }}>
//                         of {formatCurrency(budgeted)}
//                     </Typography>
//                     <Typography variant="caption" sx={{
//                         fontSize: '0.65rem',
//                         fontWeight: 600,
//                         color: isOverBudget ? '#dc2626' : '#059669'
//                     }}>
//                         {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remaining))}
//                     </Typography>
//                 </Box>
//             </Card>
//         );
//     }
//
//     // Non-compact version (original design with larger pie chart)
//     return (
//         <Card sx={{
//             p: 2.5,
//             borderRadius: 2,
//             background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
//             border: `1px solid ${alpha(progressColor, 0.2)}`,
//             transition: 'all 0.2s ease-in-out',
//             '&:hover': {
//                 transform: 'translateY(-2px)',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
//             }
//         }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
//                 <Box>
//                     <Typography variant="caption" color="text.secondary" sx={{
//                         fontWeight: 600,
//                         textTransform: 'uppercase',
//                         letterSpacing: 0.5,
//                         display: 'block',
//                         mb: 0.5
//                     }}>
//                         {categoryName}
//                     </Typography>
//                     <Typography variant="h6" fontWeight={700} color={progressColor}>
//                         {formatCurrency(actual)}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary">
//                         of {formatCurrency(budgeted)}
//                     </Typography>
//                 </Box>
//
//                 {/* Larger Pie Chart for non-compact with Center Label */}
//                 <Box sx={{ width: 70, height: 70, position: 'relative' }}>
//                     <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                             <Pie
//                                 data={chartData}
//                                 cx="50%"
//                                 cy="50%"
//                                 innerRadius={18}
//                                 outerRadius={32}
//                                 paddingAngle={3}
//                                 dataKey="value"
//                             >
//                                 {chartData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={entry.color} />
//                                 ))}
//                             </Pie>
//                         </PieChart>
//                     </ResponsiveContainer>
//                     {/* Percentage Label in Center */}
//                     <Box sx={{
//                         position: 'absolute',
//                         top: '50%',
//                         left: '50%',
//                         transform: 'translate(-50%, -50%)',
//                         pointerEvents: 'none'
//                     }}>
//                         <Typography sx={{
//                             fontSize: '0.9rem',
//                             fontWeight: 700,
//                             color: progressColor,
//                             lineHeight: 1,
//                             textAlign: 'center'
//                         }}>
//                             {Math.min(percentage, 100).toFixed(0)}%
//                         </Typography>
//                     </Box>
//                 </Box>
//             </Box>
//
//             <Box sx={{ mb: 1.5 }}>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                     <Typography variant="caption" color="text.secondary">
//                         Spending Progress
//                     </Typography>
//                     <Typography variant="caption" fontWeight={600} color={progressColor}>
//                         {Math.min(percentage, 100).toFixed(0)}%
//                     </Typography>
//                 </Box>
//                 <LinearProgress
//                     variant="determinate"
//                     value={Math.min(percentage, 100)}
//                     sx={{
//                         height: 8,
//                         borderRadius: 4,
//                         bgcolor: `${progressColor}20`,
//                         '& .MuiLinearProgress-bar': {
//                             bgcolor: progressColor,
//                             borderRadius: 4
//                         }
//                     }}
//                 />
//             </Box>
//
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <Typography variant="caption" color="text.secondary">
//                     {remaining >= 0 ? 'Remaining' : 'Over Budget'}
//                 </Typography>
//                 <Typography variant="caption" fontWeight={700} color={isOverBudget ? '#dc2626' : '#059669'}>
//                     {formatCurrency(Math.abs(remaining))}
//                 </Typography>
//             </Box>
//         </Card>
//     );
// };
//
// export default BudgetCategoryCard;