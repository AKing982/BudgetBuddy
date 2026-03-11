import React, { useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEAL  = '#0d9488';
const AMBER = '#d97706';
const RED   = '#dc2626';
const GREEN = '#059669';
const SLATE = '#64748b';

function getStatus(actual: number, budgeted: number) {
    const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    if (pct < 70)  return { key: 'healthy', color: TEAL,  label: 'On Track',    pulse: false };
    if (pct < 90)  return { key: 'warning', color: AMBER, label: 'Heads Up',    pulse: false };
    if (pct < 100) return { key: 'danger',  color: RED,   label: 'Almost Full', pulse: true  };
    return             { key: 'over',    color: RED,   label: 'Over Budget', pulse: true  };
}

const isIncomeCategory = (name: string) =>
    name.trim().toLowerCase() === 'income';

// ── Pulse dot ─────────────────────────────────────────────────────────────────
const PulseDot: React.FC<{ color: string }> = ({ color }) => (
    <Box sx={{
        width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0,
        position: 'relative',
        '&::after': {
            content: '""', position: 'absolute', inset: -3, borderRadius: '50%',
            bgcolor: alpha(color, 0.3),
            '@keyframes ping': {
                '0%':   { transform: 'scale(1)',   opacity: 0.8 },
                '70%':  { transform: 'scale(2.2)', opacity: 0   },
                '100%': { transform: 'scale(2.2)', opacity: 0   },
            },
            animation: 'ping 1.6s ease-out infinite',
        },
    }} />
);

// ── Props ─────────────────────────────────────────────────────────────────────
export interface BudgetCategoryCardProps {
    categoryName: string;
    budgeted:     number;
    actual:       number;
    remaining:    number;
    compact?:     boolean;
}

// ── Income Card ───────────────────────────────────────────────────────────────
const IncomeCategoryCard: React.FC<BudgetCategoryCardProps> = ({
                                                                   categoryName, actual, compact = true,
                                                               }) => {
    const fmt = (n: number) =>
        `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
        <Box sx={{
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#fff',
            border: `1px solid ${alpha(GREEN, 0.22)}`,
            borderLeft: `4px solid ${GREEN}`,
            boxShadow: `0 1px 6px rgba(0,0,0,0.06)`,
            transition: 'all 0.18s ease',
            '&:hover': {
                boxShadow: `0 4px 16px ${alpha(GREEN, 0.13)}`,
                transform: 'translateY(-1px)',
            },
        }}>
            <Box sx={{ p: compact ? 1.5 : 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Icon circle */}
                <Box sx={{
                    width: compact ? 36 : 44,
                    height: compact ? 36 : 44,
                    borderRadius: '50%',
                    bgcolor: alpha(GREEN, 0.1),
                    border: `1.5px solid ${alpha(GREEN, 0.25)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <TrendingUp size={compact ? 16 : 20} color={GREEN} />
                </Box>

                {/* Text */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                        fontWeight: 800,
                        fontSize: compact ? '0.8rem' : '0.88rem',
                        color: '#111',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        mb: 0.3,
                    }}>
                        {categoryName}
                    </Typography>
                    <Typography sx={{
                        fontSize: compact ? '1.05rem' : '1.2rem',
                        fontWeight: 800,
                        color: GREEN,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1,
                    }}>
                        {fmt(actual)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: SLATE, mt: 0.25 }}>
                        Total income this month
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
                                                                   categoryName, budgeted, actual, remaining, compact = true,
                                                               }) => {
    const [dismissed, setDismissed] = useState(false);

    // Delegate to income card if applicable
    if (isIncomeCategory(categoryName)) {
        return (
            <IncomeCategoryCard
                categoryName={categoryName}
                budgeted={budgeted}
                actual={actual}
                remaining={remaining}
                compact={compact}
            />
        );
    }
    const status  = getStatus(actual, budgeted);
    const pct     = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    const isOver  = remaining < 0;
    const showAlert = status.pulse && !dismissed;

    const fmt = (n: number) =>
        `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const pieData = isOver
        ? [
            { value: budgeted,          color: alpha(status.color, 0.2) },
            { value: actual - budgeted, color: status.color             },
        ]
        : [
            { value: actual,               color: status.color            },
            { value: Math.max(remaining,0), color: alpha(status.color, 0.15) },
        ];

    const pieSize  = compact ? 40 : 64;
    const innerR   = compact ? 10 : 16;
    const outerR   = compact ? 18 : 30;

    return (
        <Box sx={{
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#fff',
            border: `1px solid ${alpha(status.color, 0.22)}`,
            borderLeft: `4px solid ${status.color}`,
            boxShadow: `0 1px 6px rgba(0,0,0,0.06)`,
            transition: 'all 0.18s ease',
            '&:hover': {
                boxShadow: `0 4px 16px ${alpha(status.color, 0.13)}`,
                transform: 'translateY(-1px)',
            },
        }}>
            <Box sx={{ p: compact ? 1.5 : 2 }}>

                {/* ── Row 1: name + status pill + pie ── */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: compact ? 1.25 : 1.5 }}>

                    {/* Left: name + spent/budget */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                            fontWeight: 800,
                            fontSize: compact ? '0.8rem' : '0.88rem',
                            color: '#111',
                            letterSpacing: '-0.01em',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            mb: 0.4,
                        }}>
                            {categoryName}
                        </Typography>

                        {/* Spent / budgeted */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {isOver
                                ? <TrendingDown size={11} color={RED}  />
                                : <TrendingUp   size={11} color={TEAL} />
                            }
                            <Typography sx={{ fontSize: compact ? '0.78rem' : '0.88rem', fontWeight: 800, color: status.color, fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(actual)}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
                                / {fmt(budgeted)}
                            </Typography>
                        </Box>

                        {/* Status pill */}
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            mt: 0.75, px: 0.8, py: 0.3,
                            borderRadius: '20px',
                            bgcolor: alpha(status.color, 0.08),
                            border: `1px solid ${alpha(status.color, 0.22)}`,
                        }}>
                            {showAlert && <PulseDot color={status.color} />}
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: status.color }}>
                                {status.label}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Right: mini pie */}
                    <Box sx={{ width: pieSize, height: pieSize, flexShrink: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%"
                                     innerRadius={innerR} outerRadius={outerR}
                                     paddingAngle={2} dataKey="value"
                                     startAngle={90} endAngle={-270}>
                                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* % label */}
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            pointerEvents: 'none', textAlign: 'center',
                        }}>
                            <Typography sx={{
                                fontSize: compact ? '0.58rem' : '0.72rem',
                                fontWeight: 800, color: status.color, lineHeight: 1,
                            }}>
                                {Math.min(pct, 999).toFixed(0)}%
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ── Progress bar ── */}
                <Box sx={{ mb: compact ? 1 : 1.25 }}>
                    <Box sx={{
                        height: compact ? 5 : 7,
                        borderRadius: 99,
                        bgcolor: alpha(status.color, 0.10),
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            position: 'absolute', left: 0, top: 0, height: '100%',
                            width: `${Math.min(pct, 100)}%`,
                            bgcolor: status.color,
                            borderRadius: 99,
                            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                    </Box>
                </Box>

                {/* ── Footer: remaining ── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
                        {isOver ? 'Over by' : 'Remaining'}
                    </Typography>
                    <Typography sx={{
                        fontSize: compact ? '0.72rem' : '0.78rem',
                        fontWeight: 800,
                        color: isOver ? RED : GREEN,
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {fmt(Math.abs(remaining))}
                    </Typography>
                </Box>

            </Box>

            {/* ── Alert footer strip (danger/over only, dismissable) ── */}
            {showAlert && (
                <Box sx={{
                    px: 1.5, py: 0.75,
                    bgcolor: alpha(status.color, 0.05),
                    borderTop: `1px solid ${alpha(status.color, 0.15)}`,
                    display: 'flex', alignItems: 'center', gap: 1,
                }}>
                    <PulseDot color={status.color} />
                    <Typography sx={{ flex: 1, fontSize: '0.65rem', fontWeight: 600, color: status.color }}>
                        {status.key === 'over' ? "You've exceeded this month's limit" : 'Near your budget ceiling'}
                    </Typography>
                    <Box component="button" onClick={() => setDismissed(true)} sx={{
                        border: 'none', bgcolor: 'transparent', cursor: 'pointer',
                        fontSize: '0.62rem', color: SLATE, fontWeight: 600,
                        px: 0.75, py: 0.25, borderRadius: '4px',
                        '&:hover': { bgcolor: alpha(RED, 0.07) },
                    }}>
                        Dismiss
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default BudgetCategoryCard;

// import React, { useState } from 'react';
// import { Box, Typography, alpha } from '@mui/material';
// import { TrendingUp, TrendingDown } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
//
// // ── Tokens ────────────────────────────────────────────────────────────────────
// const TEAL  = '#0d9488';
// const AMBER = '#d97706';
// const RED   = '#dc2626';
// const GREEN = '#059669';
// const SLATE = '#64748b';
//
// function getStatus(actual: number, budgeted: number) {
//     const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
//     if (pct < 70)  return { key: 'healthy', color: TEAL,  label: 'On Track',    pulse: false };
//     if (pct < 90)  return { key: 'warning', color: AMBER, label: 'Heads Up',    pulse: false };
//     if (pct < 100) return { key: 'danger',  color: RED,   label: 'Almost Full', pulse: true  };
//     return             { key: 'over',    color: RED,   label: 'Over Budget', pulse: true  };
// }
//
// // ── Pulse dot ─────────────────────────────────────────────────────────────────
// const PulseDot: React.FC<{ color: string }> = ({ color }) => (
//     <Box sx={{
//         width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0,
//         position: 'relative',
//         '&::after': {
//             content: '""', position: 'absolute', inset: -3, borderRadius: '50%',
//             bgcolor: alpha(color, 0.3),
//             '@keyframes ping': {
//                 '0%':   { transform: 'scale(1)',   opacity: 0.8 },
//                 '70%':  { transform: 'scale(2.2)', opacity: 0   },
//                 '100%': { transform: 'scale(2.2)', opacity: 0   },
//             },
//             animation: 'ping 1.6s ease-out infinite',
//         },
//     }} />
// );
//
// // ── Props ─────────────────────────────────────────────────────────────────────
// export interface BudgetCategoryCardProps {
//     categoryName: string;
//     budgeted:     number;
//     actual:       number;
//     remaining:    number;
//     compact?:     boolean;
// }
//
// // ── Component ─────────────────────────────────────────────────────────────────
// const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
//                                                                    categoryName, budgeted, actual, remaining, compact = true,
//                                                                }) => {
//     const [dismissed, setDismissed] = useState(false);
//     const status  = getStatus(actual, budgeted);
//     const pct     = budgeted > 0 ? (actual / budgeted) * 100 : 0;
//     const isOver  = remaining < 0;
//     const showAlert = status.pulse && !dismissed;
//
//     const fmt = (n: number) =>
//         `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//
//     const pieData = isOver
//         ? [
//             { value: budgeted,          color: alpha(status.color, 0.2) },
//             { value: actual - budgeted, color: status.color             },
//         ]
//         : [
//             { value: actual,               color: status.color            },
//             { value: Math.max(remaining,0), color: alpha(status.color, 0.15) },
//         ];
//
//     const pieSize  = compact ? 40 : 64;
//     const innerR   = compact ? 10 : 16;
//     const outerR   = compact ? 18 : 30;
//
//     return (
//         <Box sx={{
//             borderRadius: '10px',
//             overflow: 'hidden',
//             background: '#fff',
//             border: `1px solid ${alpha(status.color, 0.22)}`,
//             borderLeft: `4px solid ${status.color}`,
//             boxShadow: `0 1px 6px rgba(0,0,0,0.06)`,
//             transition: 'all 0.18s ease',
//             '&:hover': {
//                 boxShadow: `0 4px 16px ${alpha(status.color, 0.13)}`,
//                 transform: 'translateY(-1px)',
//             },
//         }}>
//             <Box sx={{ p: compact ? 1.5 : 2 }}>
//
//                 {/* ── Row 1: name + status pill + pie ── */}
//                 <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: compact ? 1.25 : 1.5 }}>
//
//                     {/* Left: name + spent/budget */}
//                     <Box sx={{ flex: 1, minWidth: 0 }}>
//                         <Typography sx={{
//                             fontWeight: 800,
//                             fontSize: compact ? '0.8rem' : '0.88rem',
//                             color: '#111',
//                             letterSpacing: '-0.01em',
//                             overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                             mb: 0.4,
//                         }}>
//                             {categoryName}
//                         </Typography>
//
//                         {/* Spent / budgeted */}
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                             {isOver
//                                 ? <TrendingDown size={11} color={RED}  />
//                                 : <TrendingUp   size={11} color={TEAL} />
//                             }
//                             <Typography sx={{ fontSize: compact ? '0.78rem' : '0.88rem', fontWeight: 800, color: status.color, fontVariantNumeric: 'tabular-nums' }}>
//                                 {fmt(actual)}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
//                                 / {fmt(budgeted)}
//                             </Typography>
//                         </Box>
//
//                         {/* Status pill */}
//                         <Box sx={{
//                             display: 'inline-flex', alignItems: 'center', gap: 0.5,
//                             mt: 0.75, px: 0.8, py: 0.3,
//                             borderRadius: '20px',
//                             bgcolor: alpha(status.color, 0.08),
//                             border: `1px solid ${alpha(status.color, 0.22)}`,
//                         }}>
//                             {showAlert && <PulseDot color={status.color} />}
//                             <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: status.color }}>
//                                 {status.label}
//                             </Typography>
//                         </Box>
//                     </Box>
//
//                     {/* Right: mini pie */}
//                     <Box sx={{ width: pieSize, height: pieSize, flexShrink: 0, position: 'relative' }}>
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie data={pieData} cx="50%" cy="50%"
//                                      innerRadius={innerR} outerRadius={outerR}
//                                      paddingAngle={2} dataKey="value"
//                                      startAngle={90} endAngle={-270}>
//                                     {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
//                                 </Pie>
//                             </PieChart>
//                         </ResponsiveContainer>
//                         {/* % label */}
//                         <Box sx={{
//                             position: 'absolute', top: '50%', left: '50%',
//                             transform: 'translate(-50%,-50%)',
//                             pointerEvents: 'none', textAlign: 'center',
//                         }}>
//                             <Typography sx={{
//                                 fontSize: compact ? '0.58rem' : '0.72rem',
//                                 fontWeight: 800, color: status.color, lineHeight: 1,
//                             }}>
//                                 {Math.min(pct, 999).toFixed(0)}%
//                             </Typography>
//                         </Box>
//                     </Box>
//                 </Box>
//
//                 {/* ── Progress bar ── */}
//                 <Box sx={{ mb: compact ? 1 : 1.25 }}>
//                     <Box sx={{
//                         height: compact ? 5 : 7,
//                         borderRadius: 99,
//                         bgcolor: alpha(status.color, 0.10),
//                         position: 'relative',
//                         overflow: 'hidden',
//                     }}>
//                         <Box sx={{
//                             position: 'absolute', left: 0, top: 0, height: '100%',
//                             width: `${Math.min(pct, 100)}%`,
//                             bgcolor: status.color,
//                             borderRadius: 99,
//                             transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
//                         }} />
//                     </Box>
//                 </Box>
//
//                 {/* ── Footer: remaining ── */}
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
//                         {isOver ? 'Over by' : 'Remaining'}
//                     </Typography>
//                     <Typography sx={{
//                         fontSize: compact ? '0.72rem' : '0.78rem',
//                         fontWeight: 800,
//                         color: isOver ? RED : GREEN,
//                         fontVariantNumeric: 'tabular-nums',
//                     }}>
//                         {fmt(Math.abs(remaining))}
//                     </Typography>
//                 </Box>
//
//             </Box>
//
//             {/* ── Alert footer strip (danger/over only, dismissable) ── */}
//             {showAlert && (
//                 <Box sx={{
//                     px: 1.5, py: 0.75,
//                     bgcolor: alpha(status.color, 0.05),
//                     borderTop: `1px solid ${alpha(status.color, 0.15)}`,
//                     display: 'flex', alignItems: 'center', gap: 1,
//                 }}>
//                     <PulseDot color={status.color} />
//                     <Typography sx={{ flex: 1, fontSize: '0.65rem', fontWeight: 600, color: status.color }}>
//                         {status.key === 'over' ? "You've exceeded this month's limit" : 'Near your budget ceiling'}
//                     </Typography>
//                     <Box component="button" onClick={() => setDismissed(true)} sx={{
//                         border: 'none', bgcolor: 'transparent', cursor: 'pointer',
//                         fontSize: '0.62rem', color: SLATE, fontWeight: 600,
//                         px: 0.75, py: 0.25, borderRadius: '4px',
//                         '&:hover': { bgcolor: alpha(RED, 0.07) },
//                     }}>
//                         Dismiss
//                     </Box>
//                 </Box>
//             )}
//         </Box>
//     );
// };
//
// export default BudgetCategoryCard;
