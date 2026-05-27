import {
    addDays,
    addMonths,
    endOfMonth,
    format,
    getDaysInMonth,
    isBefore,
    isSameMonth,
    startOfMonth,
    subMonths,
} from 'date-fns';
import {
    Alert,
    alpha,
    Box,
    Button,
    Card,
    Container,
    Divider,
    FormControl,
    Grid,
    Grow,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Skeleton,
    Snackbar,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart2,
    Bell,
    BellOff,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Delete,
    Edit2,
    Eye,
    Minus,
    PiggyBank,
    Plus,
    Search,
    Shield,
    SlidersHorizontal,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';

// ── Types ─────────────────────────────────────────────────────────────────────
type PageMode    = 'tracker' | 'forecaster';
type ViewPeriod  = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type ChartType   = 'line' | 'bar';
type PlanFreq    = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
type PlanCat     = 'debt' | 'subscription' | 'savings' | 'large-purchase' | 'other';

interface BalanceAlert {
    id: string;
    threshold: number;        // dollar amount
    direction: 'below' | 'at-or-below';
    label: string;
    enabled: boolean;
    triggered: boolean;       // true when current/projected balance hits threshold
}

interface FuturePlan {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    frequency: PlanFreq;
    category: PlanCat;
    isIncome: boolean;
    note?: string;
}

interface SavingsGoal {
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    monthlyContribution: number;
    color: string;
}

// Represents one data point in the chart
interface ChartPoint {
    label: string;            // x-axis label
    sublabel?: string;        // e.g. "Mon–Sun" for weekly bucket
    date: Date;               // representative date for this point
    balance: number;
    isProjected: boolean;
    overdraft: boolean;
    belowBuffer: boolean;     // below the user's buffer threshold
    weekDays?: { day: number; label: string; balance: number }[]; // for weekly drill-in
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const FREQ_LABELS: Record<PlanFreq, string> = {
    'one-time': 'One-time', weekly: 'Weekly', 'bi-weekly': 'Bi-weekly', monthly: 'Monthly',
};
const CAT_LABELS: Record<PlanCat, string> = {
    debt: 'Debt / Loan', subscription: 'Subscription',
    savings: 'Savings transfer', 'large-purchase': 'Large purchase', other: 'Other',
};

function planHitsInMonth(plan: FuturePlan, year: number, month: number): number {
    const days = getDaysInMonth(new Date(year, month, 1));
    if (plan.frequency === 'one-time' || plan.frequency === 'monthly') return 1;
    if (plan.frequency === 'weekly')    return Math.floor((days - plan.dueDay) / 7) + 1;
    if (plan.frequency === 'bi-weekly') return Math.floor((days - plan.dueDay) / 14) + 1;
    return 1;
}

function buildDailyBalances(
    opening: number,
    year: number,
    month: number,
    committedIncome: number,
    committedExpenses: number,
    plans: FuturePlan[],
): number[] {
    const days     = getDaysInMonth(new Date(year, month, 1));
    const dailyExp = committedExpenses / days;
    const result: number[] = [];

    for (let d = 1; d <= days; d++) {
        const prev = d === 1 ? opening : result[d - 2];
        let val    = prev - dailyExp;
        if (d === 1 || d === 15) val += committedIncome / 2;
        plans.forEach(plan => {
            let hits: number[] = [];
            if (plan.frequency === 'one-time' || plan.frequency === 'monthly') {
                hits = [Math.min(plan.dueDay, days)];
            } else if (plan.frequency === 'weekly') {
                for (let dd = plan.dueDay; dd <= days; dd += 7) hits.push(dd);
            } else if (plan.frequency === 'bi-weekly') {
                for (let dd = plan.dueDay; dd <= days; dd += 14) hits.push(dd);
            }
            if (hits.includes(d)) val += plan.isIncome ? plan.amount : -plan.amount;
        });
        result.push(Math.round(val));
    }
    return result;
}

/**
 * Build chart points from daily data.
 *
 * - daily   → one point per day
 * - weekly  → one point per week; each point also carries day-level detail
 * - biweekly→ one point per 2-week block
 * - monthly → one point per week of the month (showing weekly subtotals in one "monthly overview")
 */
function buildChartPoints(
    daily: number[],
    period: ViewPeriod,
    year: number,
    month: number,
    bufferThreshold: number,
): ChartPoint[] {
    const today     = new Date();
    const startDate = startOfMonth(new Date(year, month, 1));
    const mkPt = (i: number): Omit<ChartPoint, 'label' | 'sublabel' | 'weekDays'> => ({
        date:        addDays(startDate, i),
        balance:     daily[i],
        isProjected: isBefore(today, addDays(startDate, i)),
        overdraft:   daily[i] < 0,
        belowBuffer: bufferThreshold > 0 && daily[i] < bufferThreshold && daily[i] >= 0,
    });

    if (period === 'daily') {
        return daily.map((_, i) => ({
            ...mkPt(i),
            label: format(addDays(startDate, i), 'd'),
        }));
    }

    // For weekly and monthly: group into 7-day blocks
    if (period === 'weekly' || period === 'monthly') {
        const pts: ChartPoint[] = [];
        const blockSize = 7;
        for (let start = 0; start < daily.length; start += blockSize) {
            const end     = Math.min(start + blockSize - 1, daily.length - 1);
            const endDate = addDays(startDate, end);
            const endBal  = daily[end];
            const weekNum = Math.floor(start / blockSize) + 1;

            // collect day-level detail for this week
            const weekDays = [];
            for (let d = start; d <= end; d++) {
                weekDays.push({
                    day:     d + 1,
                    label:   format(addDays(startDate, d), 'EEE d'),
                    balance: daily[d],
                });
            }

            pts.push({
                ...mkPt(end),
                label:    period === 'monthly' ? `Wk ${weekNum}` : `Week ${weekNum}`,
                sublabel: `${format(addDays(startDate, start), 'MMM d')}–${format(endDate, 'd')}`,
                weekDays,
            });
        }
        return pts;
    }

    // biweekly → 14-day blocks
    if (period === 'biweekly') {
        const pts: ChartPoint[] = [];
        const blockSize = 14;
        for (let start = 0; start < daily.length; start += blockSize) {
            const end     = Math.min(start + blockSize - 1, daily.length - 1);
            const endDate = addDays(startDate, end);
            const endBal  = daily[end];
            const blkNum  = Math.floor(start / blockSize) + 1;
            pts.push({
                ...mkPt(end),
                label:    `Period ${blkNum}`,
                sublabel: `${format(addDays(startDate, start), 'MMM d')}–${format(endDate, 'MMM d')}`,
            });
        }
        return pts;
    }

    return [];
}

// ── Card themes ───────────────────────────────────────────────────────────────
const TH = {
    maroon: { base: '#f0f4ff', border: MAROON,   value: '#1e1e2e', bar: MAROON,   chipBg: 'rgba(107,26,26,0.10)', chipColor: MAROON,   label: '#5a5a7a' },
    green:  { base: '#f0fdf4', border: '#16a34a', value: '#14532d', bar: '#16a34a', chipBg: 'rgba(22,163,74,0.12)', chipColor: '#15803d', label: '#4a7060' },
    amber:  { base: '#fffbeb', border: '#d97706', value: '#78350f', bar: '#d97706', chipBg: 'rgba(217,119,6,0.12)', chipColor: '#92400e', label: '#7a6030' },
    blue:   { base: '#f0f9ff', border: '#0284c7', value: '#0c4a6e', bar: '#0284c7', chipBg: 'rgba(2,132,199,0.12)', chipColor: '#075985', label: '#3a6070' },
    red:    { base: '#fff1f2', border: '#dc2626', value: '#7f1d1d', bar: '#dc2626', chipBg: 'rgba(220,38,38,0.12)', chipColor: '#991b1b', label: '#7a3030' },
} as const;

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
    icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
    <Box sx={{
        background: 'linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)',
        px: 3, py: 2, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 50,  width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative' }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{subtitle}</Typography>
            </Box>
        </Box>
        {action && <Box sx={{ position: 'relative', zIndex: 1 }}>{action}</Box>}
    </Box>
);

// ── Smooth cubic-bezier path builder ─────────────────────────────────────────
function smoothCurve(coords: [number, number][]): string {
    if (coords.length < 2) return '';
    let d = `M ${coords[0][0].toFixed(2)} ${coords[0][1].toFixed(2)}`;
    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cp1x = (prev[0] + curr[0]) / 2;
        const cp2x = (prev[0] + curr[0]) / 2;
        d += ` C ${cp1x.toFixed(2)} ${prev[1].toFixed(2)}, ${cp2x.toFixed(2)} ${curr[1].toFixed(2)}, ${curr[0].toFixed(2)} ${curr[1].toFixed(2)}`;
    }
    return d;
}

function smoothArea(coords: [number, number][], zeroY: number): string {
    if (coords.length < 2) return '';
    const line = smoothCurve(coords);
    const last  = coords[coords.length - 1];
    const first = coords[0];
    return `${line} L ${last[0].toFixed(2)} ${zeroY.toFixed(2)} L ${first[0].toFixed(2)} ${zeroY.toFixed(2)} Z`;
}

// ── Fintech-grade Balance Chart ───────────────────────────────────────────────
const BalanceChart: React.FC<{
    points: ChartPoint[];
    chartType: ChartType;
    bufferThreshold: number;
    alerts: BalanceAlert[];
    period: ViewPeriod;
    selectedDate: Date | null;
    onSelectPoint: (pt: ChartPoint) => void;
    isLoading: boolean;
}> = ({ points, chartType, bufferThreshold, alerts, period, selectedDate, onSelectPoint, isLoading }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    if (isLoading) return (
        <Box sx={{ height: 260, borderRadius: '10px', overflow: 'hidden' }}>
            <Skeleton variant="rectangular" height={260} animation="wave" sx={{ bgcolor: '#f5f5f5' }} />
        </Box>
    );
    if (!points.length) return null;

    // ── Layout constants ──────────────────────────────────────────────────────
    const W = 620; const H = 240;
    const pL = 64; const pR = 20; const pT = 24; const pB = 40;
    const iW = W - pL - pR; const iH = H - pT - pB;

    // ── Scale ─────────────────────────────────────────────────────────────────
    const vals   = points.map(p => p.balance);
    const allRef = [...vals, 0];
    if (bufferThreshold > 0) allRef.push(bufferThreshold);
    alerts.filter(a => a.enabled).forEach(a => allRef.push(a.threshold));

    const dataMin = Math.min(...allRef);
    const dataMax = Math.max(...allRef);
    const dataRng = dataMax - dataMin || 1;
    const bMin    = dataMin - dataRng * 0.08;
    const bMax    = dataMax + dataRng * 0.14;
    const bRng    = bMax - bMin;

    const toX   = (i: number) => pL + (i / Math.max(points.length - 1, 1)) * iW;
    const toY   = (v: number) => pT + iH - ((v - bMin) / bRng) * iH;
    const zeroY = Math.min(Math.max(toY(0), pT), pT + iH);

    // ── Tick values: 5 clean round numbers ───────────────────────────────────
    const rawStep  = dataRng / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep  = Math.ceil(rawStep / magnitude) * magnitude;
    const tickStart = Math.floor(dataMin / niceStep) * niceStep;
    const yTicks    = Array.from({ length: 6 }, (_, i) => tickStart + i * niceStep).filter(v => v >= bMin && v <= bMax);

    const fmtY = (v: number) => {
        if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
        return `$${Math.round(v)}`;
    };
    const fmtTip = (v: number) => {
        if (Math.abs(v) >= 1000) return `$${(Math.abs(v) / 1000).toFixed(1)}k`;
        return `$${Math.abs(Math.round(v)).toLocaleString()}`;
    };

    // ── Split actual vs projected ─────────────────────────────────────────────
    const splitIdx  = points.findIndex(p => p.isProjected);
    const actualPts = splitIdx > 0 ? points.slice(0, splitIdx + 1) : (points[0]?.isProjected ? [] : [...points]);
    const projPts   = splitIdx >= 0 ? points.slice(splitIdx) : (points[0]?.isProjected ? [...points] : []);

    const coords     = (pts: typeof points, off = 0): [number, number][] => pts.map((p, i) => [toX(i + off), toY(p.balance)]);
    const actualC    = coords(actualPts, 0);
    const projC      = coords(projPts, splitIdx >= 0 ? splitIdx : 0);
    const allC       = coords(points, 0);

    // bar width — proportional, with generous gap
    const barGap = points.length > 10 ? 2 : points.length > 5 ? 4 : 8;
    const barW   = Math.max(6, (iW / points.length) - barGap);

    // hovered / selected
    const activeIdx = hoveredIdx ?? -1;
    const selIdx    = selectedDate
        ? points.findIndex(p => format(p.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
        : -1;
    const tipIdx    = activeIdx >= 0 ? activeIdx : selIdx;
    const tipPt     = tipIdx >= 0 ? points[tipIdx] : null;

    const ptColor = (pt: ChartPoint) =>
        pt.overdraft ? '#ef4444' : pt.belowBuffer ? '#f59e0b' : pt.isProjected ? '#3b82f6' : MAROON;

    return (
        <Box
            sx={{ position: 'relative', userSelect: 'none' }}
            onMouseLeave={() => setHoveredIdx(null)}
        >
            <svg
                width="100%" viewBox={`0 0 ${W} ${H}`}
                style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
                onClick={e => {
                    const svg  = (e.target as SVGElement).closest('svg')!;
                    const rect = svg.getBoundingClientRect();
                    const relX = ((e.clientX - rect.left) / rect.width) * W;
                    const idx  = Math.round(((relX - pL) / iW) * (points.length - 1));
                    const pt   = points[Math.max(0, Math.min(idx, points.length - 1))];
                    if (pt) onSelectPoint(pt);
                }}
                onMouseMove={e => {
                    const svg  = (e.target as SVGElement).closest('svg')!;
                    const rect = svg.getBoundingClientRect();
                    const relX = ((e.clientX - rect.left) / rect.width) * W;
                    const idx  = Math.round(((relX - pL) / iW) * (points.length - 1));
                    setHoveredIdx(Math.max(0, Math.min(idx, points.length - 1)));
                }}
            >
                <defs>
                    {/* Actual gradient */}
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={MAROON} stopOpacity="0.22" />
                        <stop offset="60%"  stopColor={MAROON} stopOpacity="0.06" />
                        <stop offset="100%" stopColor={MAROON} stopOpacity="0.00" />
                    </linearGradient>
                    {/* Projected gradient */}
                    <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                    </linearGradient>
                    {/* Overdraft gradient */}
                    <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.00" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.18" />
                    </linearGradient>
                    {/* Bar actual */}
                    <linearGradient id="gradBarAct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={MAROON} stopOpacity="1"   />
                        <stop offset="100%" stopColor={MAROON} stopOpacity="0.7" />
                    </linearGradient>
                    {/* Bar projected */}
                    <linearGradient id="gradBarProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.50" />
                    </linearGradient>
                    {/* Bar overdraft */}
                    <linearGradient id="gradBarNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
                    </linearGradient>
                    {/* Hover column */}
                    <linearGradient id="gradHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#1e293b" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#1e293b" stopOpacity="0.02" />
                    </linearGradient>
                    <clipPath id="clipAbove2">
                        <rect x={pL} y={pT} width={iW} height={Math.max(zeroY - pT, 0)} />
                    </clipPath>
                    <clipPath id="clipBelow2">
                        <rect x={pL} y={zeroY} width={iW} height={Math.max(pT + iH - zeroY, 0)} />
                    </clipPath>
                    <clipPath id="clipChart">
                        <rect x={pL} y={pT} width={iW} height={iH} />
                    </clipPath>
                    {/* Drop shadow filter for tooltip */}
                    <filter id="tipShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.18" />
                    </filter>
                </defs>

                {/* ── Plot area background ── */}
                <rect x={pL} y={pT} width={iW} height={iH} fill="#fafafa" rx="2" />

                {/* ── Y-axis grid lines ── */}
                {yTicks.map((v, i) => {
                    const y      = toY(v);
                    const isZero = Math.abs(v) < 1;
                    if (y < pT - 2 || y > pT + iH + 2) return null;
                    return (
                        <g key={i}>
                            <line
                                x1={pL} x2={W - pR} y1={y} y2={y}
                                stroke={isZero ? '#f87171' : '#e2e8f0'}
                                strokeWidth={isZero ? 1.5 : 0.75}
                                strokeDasharray={isZero ? '5,4' : undefined}
                            />
                            <text
                                x={pL - 8} y={y + 4}
                                textAnchor="end" fontSize="10" fontFamily="system-ui, sans-serif"
                                fill={isZero ? '#ef4444' : '#94a3b8'} fontWeight={isZero ? '600' : '400'}
                            >
                                {fmtY(v)}
                            </text>
                        </g>
                    );
                })}

                {/* ── Buffer threshold band ── */}
                {bufferThreshold > 0 && toY(bufferThreshold) < pT + iH && toY(bufferThreshold) > pT && (
                    <>
                        {/* Amber shaded zone from buffer down to $0 */}
                        <rect
                            x={pL} y={toY(bufferThreshold)} width={iW}
                            height={Math.max(zeroY - toY(bufferThreshold), 0)}
                            fill="#fef3c7" opacity="0.5" clipPath="url(#clipChart)"
                        />
                        <line
                            x1={pL} x2={W - pR}
                            y1={toY(bufferThreshold)} y2={toY(bufferThreshold)}
                            stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8,4"
                        />
                        {/* Buffer pill label */}
                        <rect
                            x={pL + 6} y={toY(bufferThreshold) - 11}
                            width={72} height={14} rx="4"
                            fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.75"
                        />
                        <text
                            x={pL + 42} y={toY(bufferThreshold) - 1.5}
                            textAnchor="middle" fontSize="9" fontFamily="system-ui, sans-serif"
                            fill="#92400e" fontWeight="700"
                        >
                            Buffer {fmtY(bufferThreshold)}
                        </text>
                    </>
                )}

                {/* ── Alert threshold lines ── */}
                {alerts.filter(a => a.enabled).map(a => {
                    const ay = toY(a.threshold);
                    if (ay < pT || ay > pT + iH) return null;
                    return (
                        <g key={a.id}>
                            <line
                                x1={pL} x2={W - pR} y1={ay} y2={ay}
                                stroke={a.triggered ? '#ef4444' : '#fb923c'}
                                strokeWidth="1" strokeDasharray="5,3" opacity="0.8"
                            />
                            <rect x={pL + 6} y={ay - 10} width={Math.min(a.label.length * 5.5 + 20, 120)} height={12} rx="3" fill={a.triggered ? '#fee2e2' : '#fff7ed'} stroke={a.triggered ? '#ef4444' : '#fb923c'} strokeWidth="0.5" />
                            <text x={pL + 10} y={ay - 2} fontSize="8.5" fontFamily="system-ui, sans-serif" fill={a.triggered ? '#b91c1c' : '#c2410c'} fontWeight="600">
                                ⚠ {a.label}
                            </text>
                        </g>
                    );
                })}

                {/* ── Hover column highlight ── */}
                {activeIdx >= 0 && (
                    <rect
                        x={toX(activeIdx) - iW / points.length / 2}
                        y={pT} width={iW / points.length} height={iH}
                        fill="url(#gradHover)" style={{ pointerEvents: 'none' }}
                    />
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* ── BAR CHART ─────────────────────────────────────────────── */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {chartType === 'bar' && points.map((pt, i) => {
                    const cx      = toX(i);
                    const bx      = cx - barW / 2;
                    const yTop    = toY(Math.max(pt.balance, 0));
                    const yBot    = toY(Math.min(pt.balance, 0));
                    const bh      = Math.max(yBot - yTop, 2);
                    const isHov   = hoveredIdx === i;
                    const isSel   = selIdx === i;
                    const isActive = isHov || isSel;

                    const fillId  = pt.overdraft ? 'gradBarNeg' : pt.isProjected ? 'gradBarProj' : 'gradBarAct';
                    const lineClr = pt.overdraft ? '#ef4444' : pt.isProjected ? '#3b82f6' : MAROON;

                    return (
                        <g key={i} onClick={() => onSelectPoint(pt)} style={{ cursor: 'pointer' }}>
                            {/* Main bar */}
                            <rect
                                x={bx} y={yTop} width={barW} height={bh}
                                fill={`url(#${fillId})`}
                                rx={Math.min(3, barW / 4)}
                                opacity={pt.isProjected && !isActive ? 0.6 : 1}
                            />
                            {/* Selected ring */}
                            {isActive && (
                                <rect
                                    x={bx - 1.5} y={yTop - 1.5}
                                    width={barW + 3} height={bh + 3}
                                    fill="none" stroke={lineClr} strokeWidth="1.5"
                                    rx={Math.min(4, barW / 4 + 1)} opacity="0.7"
                                />
                            )}
                            {/* Top value callout on hover */}
                            {isActive && (
                                <>
                                    <rect
                                        x={cx - 24} y={yTop - 18}
                                        width={48} height={15} rx="4"
                                        fill={lineClr}
                                    />
                                    <text
                                        x={cx} y={yTop - 7.5}
                                        textAnchor="middle" fontSize="9" fontFamily="system-ui, sans-serif"
                                        fill="#fff" fontWeight="700"
                                    >
                                        {fmtTip(pt.balance)}
                                    </text>
                                </>
                            )}
                        </g>
                    );
                })}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* ── LINE CHART ────────────────────────────────────────────── */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {chartType === 'line' && (
                    <>
                        {/* Overdraft fill below zero */}
                        {vals.some(v => v < 0) && allC.length > 1 && (
                            <path
                                d={smoothArea(allC, zeroY)}
                                fill="url(#gradNeg)"
                                clipPath="url(#clipBelow2)"
                            />
                        )}

                        {/* Actual area fill */}
                        {actualC.length > 1 && (
                            <path
                                d={smoothArea(actualC, zeroY)}
                                fill="url(#gradActual)"
                                clipPath="url(#clipAbove2)"
                            />
                        )}

                        {/* Projected area fill */}
                        {projC.length > 1 && (
                            <path
                                d={smoothArea(projC, zeroY)}
                                fill="url(#gradProj)"
                                clipPath="url(#clipAbove2)"
                            />
                        )}

                        {/* Full fallback (all same type) */}
                        {actualC.length <= 1 && projC.length <= 1 && allC.length > 1 && (
                            <path
                                d={smoothArea(allC, zeroY)}
                                fill={points[0]?.isProjected ? 'url(#gradProj)' : 'url(#gradActual)'}
                                clipPath="url(#clipAbove2)"
                            />
                        )}

                        {/* ── Lines ── */}
                        {/* Actual solid line */}
                        {actualC.length > 1 && (
                            <path
                                d={smoothCurve(actualC)}
                                fill="none" stroke={MAROON} strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round"
                            />
                        )}

                        {/* Projected dashed line */}
                        {projC.length > 1 && (
                            <path
                                d={smoothCurve(projC)}
                                fill="none" stroke="#3b82f6" strokeWidth="2"
                                strokeDasharray="6,4" strokeLinecap="round"
                            />
                        )}

                        {/* Fallback line */}
                        {actualC.length <= 1 && projC.length <= 1 && allC.length > 1 && (
                            <path
                                d={smoothCurve(allC)}
                                fill="none"
                                stroke={points[0]?.isProjected ? '#3b82f6' : MAROON}
                                strokeWidth="2.5" strokeLinecap="round"
                                strokeDasharray={points[0]?.isProjected ? '6,4' : undefined}
                            />
                        )}

                        {/* ── Hover crosshair ── */}
                        {activeIdx >= 0 && (
                            <line
                                x1={toX(activeIdx)} x2={toX(activeIdx)}
                                y1={pT} y2={pT + iH}
                                stroke="#94a3b8" strokeWidth="1"
                                strokeDasharray="3,3"
                                style={{ pointerEvents: 'none' }}
                            />
                        )}

                        {/* ── Dots: only at fewer points or on hover ── */}
                        {points.length <= 15
                            ? points.map((pt, i) => {
                                const isActive = hoveredIdx === i || selIdx === i;
                                const clr      = ptColor(pt);
                                return (
                                    <circle
                                        key={i}
                                        cx={toX(i)} cy={toY(pt.balance)}
                                        r={isActive ? 5.5 : 3}
                                        fill={isActive ? '#fff' : clr}
                                        stroke={clr}
                                        strokeWidth={isActive ? 2.5 : 1.5}
                                        style={{ transition: 'r 0.1s' }}
                                    />
                                );
                            })
                            : /* For dense daily charts, only show hovered/selected dot */
                            [hoveredIdx, selIdx].filter(idx => idx !== null && idx >= 0).map(idx => {
                                const pt  = points[idx!];
                                const clr = ptColor(pt);
                                return (
                                    <circle
                                        key={idx}
                                        cx={toX(idx!)} cy={toY(pt.balance)}
                                        r={5.5} fill="#fff" stroke={clr} strokeWidth="2.5"
                                    />
                                );
                            })
                        }
                    </>
                )}

                {/* ── Today marker ── */}
                {splitIdx >= 0 && splitIdx < points.length && (
                    <g>
                        <line
                            x1={toX(splitIdx)} x2={toX(splitIdx)}
                            y1={pT} y2={pT + iH}
                            stroke="#64748b" strokeWidth="1" strokeDasharray="4,3"
                        />
                        {/* "Today" pill */}
                        <rect
                            x={toX(splitIdx) - 16} y={pT - 1}
                            width={32} height={13} rx="4"
                            fill="#64748b"
                        />
                        <text
                            x={toX(splitIdx)} y={pT + 9}
                            textAnchor="middle" fontSize="8" fontFamily="system-ui, sans-serif"
                            fill="#fff" fontWeight="600"
                        >
                            Today
                        </text>
                    </g>
                )}

                {/* ── X-axis labels ── */}
                {points.map((pt, i) => {
                    const n    = points.length;
                    const step = n <= 7 ? 1 : n <= 14 ? 2 : n <= 31 ? Math.ceil(n / 7) : Math.ceil(n / 6);
                    if (i % step !== 0 && i !== n - 1) return null;
                    const isAct = activeIdx === i || selIdx === i;
                    return (
                        <text
                            key={i}
                            x={toX(i)} y={H - 8}
                            textAnchor="middle"
                            fontSize={n > 20 ? '8' : '9.5'}
                            fontFamily="system-ui, sans-serif"
                            fill={isAct ? MAROON : '#94a3b8'}
                            fontWeight={isAct ? '700' : '400'}
                        >
                            {pt.label}
                        </text>
                    );
                })}

                {/* ── Y-axis line ── */}
                <line x1={pL} x2={pL} y1={pT} y2={pT + iH} stroke="#e2e8f0" strokeWidth="1" />

                {/* ── X-axis line ── */}
                <line x1={pL} x2={W - pR} y1={pT + iH} y2={pT + iH} stroke="#e2e8f0" strokeWidth="1" />

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* ── TOOLTIP ─────────────────────────────────────────────── */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {tipPt && tipIdx >= 0 && (() => {
                    const TW   = 110; const TH2 = 52;
                    const rawX = toX(tipIdx);
                    const tx   = Math.min(Math.max(rawX - TW / 2, pL), W - pR - TW);
                    const ty   = Math.max(pT + 4, toY(tipPt.balance) - TH2 - 10);
                    const clr  = ptColor(tipPt);
                    const neg  = tipPt.balance < 0;

                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            {/* Arrow connector from tooltip to point */}
                            <line
                                x1={rawX} y1={ty + TH2}
                                x2={rawX} y2={toY(tipPt.balance) - (chartType === 'line' ? 7 : 0)}
                                stroke={clr} strokeWidth="1" strokeDasharray="2,2" opacity="0.4"
                            />
                            {/* Card shadow */}
                            <rect x={tx} y={ty} width={TW} height={TH2} rx="8" fill="#1e293b" filter="url(#tipShadow)" opacity="0.06" />
                            {/* Card body */}
                            <rect x={tx} y={ty} width={TW} height={TH2} rx="8" fill="#0f172a" />
                            {/* Accent left bar */}
                            <rect x={tx} y={ty} width={3} height={TH2} rx="2" fill={clr} />
                            {/* Date label */}
                            <text x={tx + 10} y={ty + 15} fontSize="9" fontFamily="system-ui, sans-serif" fill="rgba(255,255,255,0.55)" fontWeight="500">
                                {tipPt.sublabel || tipPt.label}
                            </text>
                            {/* Balance value */}
                            <text x={tx + 10} y={ty + 32} fontSize="13.5" fontFamily="system-ui, sans-serif" fill="#fff" fontWeight="700">
                                {neg ? '−' : ''}{fmtTip(tipPt.balance)}
                            </text>
                            {/* Status badge */}
                            <rect x={tx + 10} y={ty + 37} width={tipPt.overdraft ? 52 : tipPt.belowBuffer ? 62 : tipPt.isProjected ? 52 : 42} height={10} rx="3" fill={clr} opacity="0.2" />
                            <text x={tx + 13} y={ty + 45} fontSize="7.5" fontFamily="system-ui, sans-serif" fill={clr} fontWeight="700">
                                {tipPt.overdraft ? 'OVERDRAWN' : tipPt.belowBuffer ? 'BELOW BUFFER' : tipPt.isProjected ? 'PROJECTED' : 'ACTUAL'}
                            </text>
                        </g>
                    );
                })()}
            </svg>
        </Box>
    );
};

// ── Weekly drill-down table (shown below chart in weekly/monthly period) ──────
const WeekDrillDown: React.FC<{
    point: ChartPoint;
    bufferThreshold: number;
}> = ({ point, bufferThreshold }) => {
    if (!point.weekDays?.length) return null;
    return (
        <Box sx={{ mt: 2, p: 1.75, borderRadius: '10px', bgcolor: '#fafafa', border: '0.5px solid #f0f0f0' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.25 }}>
                {point.sublabel ?? point.label} — Day-by-day
            </Typography>
            <Stack spacing={0.5}>
                {point.weekDays.map(d => {
                    const negative    = d.balance < 0;
                    const belowBuf    = bufferThreshold > 0 && d.balance < bufferThreshold && d.balance >= 0;
                    const clr         = negative ? '#dc2626' : belowBuf ? '#d97706' : '#16a34a';
                    const maxBal      = Math.max(...point.weekDays!.map(x => x.balance), 1);
                    const barPct      = Math.max(Math.min((d.balance / maxBal) * 100, 100), 0);
                    return (
                        <Box key={d.day} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: '#888', minWidth: 52, fontWeight: 500 }}>{d.label}</Typography>
                            <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#eeeeee', overflow: 'hidden' }}>
                                <Box sx={{ height: '100%', width: `${barPct}%`, bgcolor: clr, borderRadius: 3, opacity: negative ? 0.7 : belowBuf ? 0.8 : 0.65, transition: 'width 0.4s' }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: clr, fontVariantNumeric: 'tabular-nums', minWidth: 58, textAlign: 'right' }}>
                                {negative ? '-' : ''}${Math.abs(d.balance).toLocaleString()}
                            </Typography>
                            {belowBuf && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d97706', flexShrink: 0 }} />}
                            {negative && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#dc2626', flexShrink: 0 }} />}
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
};

// ── Mode toggle ───────────────────────────────────────────────────────────────
const ModeToggle: React.FC<{ mode: PageMode; onChange: (m: PageMode) => void }> = ({ mode, onChange }) => (
    <Box sx={{ display: 'flex', p: '3px', borderRadius: '10px', bgcolor: '#ece8e8', gap: '2px' }}>
        {([
            { val: 'tracker'    as PageMode, label: 'Tracker',    icon: <BarChart2 size={13} /> },
            { val: 'forecaster' as PageMode, label: 'Forecaster', icon: <Search    size={13} /> },
        ]).map(opt => (
            <Box key={opt.val} onClick={() => onChange(opt.val)} sx={{
                display: 'flex', alignItems: 'center', gap: 0.6,
                px: 1.5, py: 0.65, borderRadius: '7px', cursor: 'pointer',
                bgcolor: mode === opt.val ? '#fff' : 'transparent',
                boxShadow: mode === opt.val ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                color: mode === opt.val ? MAROON : '#888',
                transition: 'all 0.18s', userSelect: 'none',
            }}>
                {opt.icon}
                <Typography sx={{ fontSize: '0.76rem', fontWeight: mode === opt.val ? 700 : 500, color: 'inherit', lineHeight: 1, ml: 0.5 }}>{opt.label}</Typography>
            </Box>
        ))}
    </Box>
);

// ── Segmented pill control (neutral palette — no maroon) ─────────────────────
function SegmentedPill<T extends string>({
                                             options, value, onChange, small,
                                         }: {
    options: { val: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    small?: boolean;
}) {
    return (
        <Box sx={{
            display: 'inline-flex',
            bgcolor: 'rgba(0,0,0,0.06)',
            borderRadius: '8px',
            p: '2px',
            gap: '1px',
        }}>
            {options.map(opt => {
                const active = opt.val === value;
                return (
                    <Box
                        key={opt.val}
                        onClick={() => onChange(opt.val)}
                        sx={{
                            px: small ? 1.1 : 1.4,
                            py: small ? 0.35 : 0.5,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            bgcolor: active ? '#fff' : 'transparent',
                            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            color: active ? '#1e293b' : '#64748b',
                            fontWeight: active ? 600 : 400,
                            fontSize: small ? '0.7rem' : '0.72rem',
                            lineHeight: 1,
                            fontFamily: 'system-ui, sans-serif',
                            letterSpacing: active ? '-0.01em' : 0,
                            transition: 'all 0.15s',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {opt.label}
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Chart controls row ────────────────────────────────────────────────────────
const ChartControls: React.FC<{
    period: ViewPeriod; onPeriod: (v: ViewPeriod) => void;
    chartType: ChartType; onChartType: (t: ChartType) => void;
}> = ({ period, onPeriod, chartType, onChartType }) => (
    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
        <SegmentedPill<ViewPeriod>
            small
            options={[
                { val: 'daily',    label: 'Daily'    },
                { val: 'weekly',   label: 'Weekly'   },
                { val: 'biweekly', label: 'Bi-wk'    },
                { val: 'monthly',  label: 'Monthly'  },
            ]}
            value={period}
            onChange={onPeriod}
        />
        <Box sx={{ width: 1, height: 18, bgcolor: 'rgba(255,255,255,0.3)' }} />
        <SegmentedPill<ChartType>
            small
            options={[
                { val: 'line', label: '∿ Line' },
                { val: 'bar',  label: '▐ Bar'  },
            ]}
            value={chartType}
            onChange={onChartType}
        />
    </Box>
);

// ── Buffer + Alerts panel (inside optimizer drawer) ───────────────────────────
const EMPTY_ALERT: Omit<BalanceAlert, 'id' | 'triggered'> = {
    threshold: 500, direction: 'at-or-below', label: 'Low balance', enabled: true,
};

const BufferAlertsSection: React.FC<{
    bufferThreshold: number;
    onBufferChange: (v: number) => void;
    alerts: BalanceAlert[];
    onAddAlert: (a: Omit<BalanceAlert, 'id' | 'triggered'>) => void;
    onToggleAlert: (id: string) => void;
    onDeleteAlert: (id: string) => void;
    lowestBalance: number;
}> = ({ bufferThreshold, onBufferChange, alerts, onAddAlert, onToggleAlert, onDeleteAlert, lowestBalance }) => {
    const [showAddAlert, setShowAddAlert] = useState(false);
    const [alertForm, setAlertForm]       = useState<Omit<BalanceAlert, 'id' | 'triggered'>>(EMPTY_ALERT);
    const fmt = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    return (
        <Box sx={{ mb: 3 }}>
            {/* Buffer threshold */}
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                    Balance Buffer
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#888', mb: 1.25 }}>
                    Set a minimum comfortable balance. The chart will highlight days you fall below it with an amber warning line.
                </Typography>
                <TextField
                    size="small" fullWidth label="Buffer threshold ($)"
                    type="number"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    value={bufferThreshold || ''}
                    onChange={e => onBufferChange(Math.max(0, +e.target.value))}
                />
                {bufferThreshold > 0 && lowestBalance < bufferThreshold && lowestBalance >= 0 && (
                    <Box sx={{ mt: 1, p: 1, borderRadius: '7px', bgcolor: 'rgba(217,119,6,0.07)', border: '0.5px solid rgba(217,119,6,0.25)' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 600 }}>
                            ⚠ Lowest projected balance ({fmt(lowestBalance)}) falls below your buffer ({fmt(bufferThreshold)})
                        </Typography>
                    </Box>
                )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Alerts */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Balance Alerts
                </Typography>
                <Button size="small" startIcon={<Plus size={12} />} onClick={() => setShowAddAlert(v => !v)}
                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', bgcolor: alpha(MAROON, 0.07), color: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.13) } }}>
                    Add alert
                </Button>
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: '#888', mb: 1.25 }}>
                Get flagged when your projected or current balance approaches a threshold.
            </Typography>

            {showAddAlert && (
                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8f8f8', border: '1px solid #eee', mb: 1.5 }}>
                    <Stack spacing={1.25}>
                        <TextField size="small" fullWidth label="Alert label" value={alertForm.label}
                                   onChange={e => setAlertForm(p => ({ ...p, label: e.target.value }))} />
                        <TextField size="small" fullWidth label="Threshold ($)" type="number"
                                   InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                   value={alertForm.threshold || ''} onChange={e => setAlertForm(p => ({ ...p, threshold: Math.max(0, +e.target.value) }))} />
                        <FormControl size="small" fullWidth>
                            <InputLabel>Trigger when balance is</InputLabel>
                            <Select label="Trigger when balance is" value={alertForm.direction}
                                    onChange={e => setAlertForm(p => ({ ...p, direction: e.target.value as BalanceAlert['direction'] }))}>
                                <MenuItem value="at-or-below">At or below threshold</MenuItem>
                                <MenuItem value="below">Strictly below threshold</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button fullWidth size="small" variant="outlined" onClick={() => setShowAddAlert(false)}
                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, borderColor: '#d5d5d5', color: '#666' }}>Cancel</Button>
                            <Button fullWidth size="small" variant="contained" disabled={!alertForm.label || !alertForm.threshold}
                                    onClick={() => { onAddAlert(alertForm); setAlertForm(EMPTY_ALERT); setShowAddAlert(false); }}
                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>
                                Add
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            )}

            {alerts.length === 0 && !showAddAlert && (
                <Box sx={{ py: 2, textAlign: 'center', borderRadius: '8px', border: '1px dashed #e0e0e0' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#ccc' }}>No alerts set</Typography>
                </Box>
            )}

            <Stack spacing={0.75}>
                {alerts.map(a => (
                    <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.85, borderRadius: '8px', bgcolor: a.triggered ? 'rgba(220,38,38,0.05)' : '#fafafa', border: `0.5px solid ${a.triggered ? 'rgba(220,38,38,0.2)' : '#f0f0f0'}` }}>
                        <Box sx={{ color: a.triggered ? '#dc2626' : a.enabled ? '#d97706' : '#ccc' }}>
                            {a.triggered ? <AlertTriangle size={14} /> : a.enabled ? <Bell size={14} /> : <BellOff size={14} />}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.77rem', fontWeight: 700, color: a.triggered ? '#7f1d1d' : '#333' }}>{a.label}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>
                                {a.direction === 'at-or-below' ? '≤' : '<'} ${a.threshold.toLocaleString()}
                                {a.triggered ? ' · TRIGGERED' : ''}
                            </Typography>
                        </Box>
                        <Switch size="small" checked={a.enabled} onChange={() => onToggleAlert(a.id)}
                                sx={{ '& .MuiSwitch-thumb': { bgcolor: a.enabled ? MAROON : '#ccc' }, '& .MuiSwitch-track': { bgcolor: a.enabled ? alpha(MAROON, 0.4) : '#e0e0e0' } }} />
                        <IconButton size="small" onClick={() => onDeleteAlert(a.id)} sx={{ p: 0.35, color: '#ddd', '&:hover': { color: '#dc2626' } }}>
                            <Delete size={12} />
                        </IconButton>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

// ── Optimizer drawer (plans + goals + buffer + alerts) ────────────────────────
const EMPTY_PLAN: Omit<FuturePlan, 'id'> = { name: '', amount: 0, dueDay: 1, frequency: 'monthly', category: 'other', isIncome: false, note: '' };

const OptimizerPanel: React.FC<{
    open: boolean; onClose: () => void;
    plans: FuturePlan[]; goals: SavingsGoal[];
    year: number; month: number;
    bufferThreshold: number; onBufferChange: (v: number) => void;
    alerts: BalanceAlert[]; onAddAlert: (a: Omit<BalanceAlert, 'id' | 'triggered'>) => void;
    onToggleAlert: (id: string) => void; onDeleteAlert: (id: string) => void;
    lowestBalance: number;
    onAddPlan: (p: Omit<FuturePlan, 'id'>) => void;
    onEditPlan: (id: string, p: Omit<FuturePlan, 'id'>) => void;
    onDeletePlan: (id: string) => void;
}> = ({ open, onClose, plans, goals, year, month, bufferThreshold, onBufferChange, alerts, onAddAlert, onToggleAlert, onDeleteAlert, lowestBalance, onAddPlan, onEditPlan, onDeletePlan }) => {
    const [addOpen, setAddOpen]       = useState(false);
    const [editTarget, setEditTarget] = useState<FuturePlan | null>(null);
    const [form, setForm]             = useState<Omit<FuturePlan, 'id'>>(EMPTY_PLAN);
    const [section, setSection]       = useState<'buffer' | 'plans' | 'goals'>('buffer');

    const planExpenses = plans.filter(p => !p.isIncome).reduce((s, p) => s + p.amount * planHitsInMonth(p, year, month), 0);
    const planIncome   = plans.filter(p =>  p.isIncome).reduce((s, p) => s + p.amount * planHitsInMonth(p, year, month), 0);
    const fmt          = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const openAdd  = () => { setForm(EMPTY_PLAN); setEditTarget(null); setAddOpen(true); };
    const openEdit = (p: FuturePlan) => { setForm({ name: p.name, amount: p.amount, dueDay: p.dueDay, frequency: p.frequency, category: p.category, isIncome: p.isIncome, note: p.note }); setEditTarget(p); setAddOpen(true); };
    const savePlan = () => { if (editTarget) onEditPlan(editTarget.id, form); else onAddPlan(form); setAddOpen(false); setEditTarget(null); };

    if (!open) return null;

    const activeAlerts = alerts.filter(a => a.enabled && a.triggered).length;

    return (
        <Box sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, bgcolor: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,0.14)', zIndex: 1300, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)', px: 3, py: 2.5, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SlidersHorizontal size={15} color="white" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>Balance Optimizer</Typography>
                            <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)' }}>Buffer, alerts, plans &amp; goals</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}>✕</IconButton>
                </Box>

                {/* Section tabs */}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
                    {([
                        { key: 'buffer', label: 'Buffer & Alerts', badge: activeAlerts },
                        { key: 'plans',  label: `Plans (${plans.length})`,   badge: 0 },
                        { key: 'goals',  label: 'Goals',            badge: 0 },
                    ] as { key: typeof section; label: string; badge: number }[]).map(tab => (
                        <Box key={tab.key} onClick={() => setSection(tab.key)} sx={{
                            flex: 1, py: 0.6, borderRadius: '6px', textAlign: 'center', cursor: 'pointer',
                            bgcolor: section === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                            transition: 'background 0.15s',
                            position: 'relative',
                        }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: section === tab.key ? '#fff' : 'rgba(255,255,255,0.6)' }}>{tab.label}</Typography>
                            {tab.badge > 0 && (
                                <Box sx={{ position: 'absolute', top: -4, right: 4, width: 14, height: 14, borderRadius: '50%', bgcolor: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#fff', fontWeight: 700 }}>{tab.badge}</Typography>
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
                {/* Buffer & Alerts */}
                {section === 'buffer' && (
                    <BufferAlertsSection
                        bufferThreshold={bufferThreshold}
                        onBufferChange={onBufferChange}
                        alerts={alerts}
                        onAddAlert={onAddAlert}
                        onToggleAlert={onToggleAlert}
                        onDeleteAlert={onDeleteAlert}
                        lowestBalance={lowestBalance}
                    />
                )}

                {/* Payment Plans */}
                {section === 'plans' && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment &amp; Spending Plans</Typography>
                            <Button size="small" startIcon={<Plus size={12} />} onClick={openAdd}
                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', bgcolor: alpha(MAROON, 0.07), color: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.13) } }}>
                                Add plan
                            </Button>
                        </Box>
                        {plans.length === 0 ? (
                            <Box sx={{ py: 3, textAlign: 'center', borderRadius: '8px', border: '1px dashed #e0e0e0' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#bbb' }}>No plans — add one to see its balance impact</Typography>
                            </Box>
                        ) : (
                            <Stack spacing={0.75}>
                                {plans.map(plan => {
                                    const hits  = planHitsInMonth(plan, year, month);
                                    const total = plan.amount * hits;
                                    const clr   = plan.isIncome ? '#16a34a' : '#dc2626';
                                    return (
                                        <Box key={plan.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1, borderRadius: '8px', bgcolor: '#fafafa', border: '0.5px solid #f0f0f0' }}>
                                            <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: alpha(clr, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: clr, flexShrink: 0 }}>
                                                {plan.isIncome ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: '#1e1e2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.name}</Typography>
                                                <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>{FREQ_LABELS[plan.frequency]} · day {plan.dueDay}{hits > 1 ? ` · ${hits}×` : ''}</Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: clr, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                                {plan.isIncome ? '+' : '−'}${total.toLocaleString()}
                                            </Typography>
                                            <Box sx={{ display: 'flex' }}>
                                                <IconButton size="small" onClick={() => openEdit(plan)} sx={{ p: 0.35, color: '#ccc', '&:hover': { color: MAROON } }}><Edit2 size={12} /></IconButton>
                                                <IconButton size="small" onClick={() => onDeletePlan(plan.id)} sx={{ p: 0.35, color: '#ccc', '&:hover': { color: '#dc2626' } }}><Delete size={12} /></IconButton>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, px: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>+{fmt(planIncome)} in</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>−{fmt(planExpenses)} out</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: planIncome - planExpenses >= 0 ? '#16a34a' : '#dc2626' }}>
                                        = {planIncome - planExpenses >= 0 ? '+' : '−'}{fmt(Math.abs(planIncome - planExpenses))} net
                                    </Typography>
                                </Box>
                            </Stack>
                        )}

                        {/* Add/edit plan form */}
                        {addOpen && (
                            <Box sx={{ mt: 2, p: 1.75, borderRadius: '10px', bgcolor: '#fafafa', border: '1px solid #eee' }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', mb: 1.25 }}>{editTarget ? 'Edit plan' : 'New plan'}</Typography>
                                <Stack spacing={1.25}>
                                    <TextField size="small" fullWidth label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}><TextField size="small" fullWidth label="Amount ($)" type="number" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Math.abs(+e.target.value) }))} /></Grid>
                                        <Grid item xs={6}><TextField size="small" fullWidth label="Due day" type="number" inputProps={{ min: 1, max: 31 }} value={form.dueDay} onChange={e => setForm(p => ({ ...p, dueDay: Math.min(31, Math.max(1, +e.target.value)) }))} /></Grid>
                                    </Grid>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Frequency</InputLabel>
                                                <Select label="Frequency" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value as PlanFreq }))}>
                                                    {(Object.entries(FREQ_LABELS) as [PlanFreq, string][]).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Category</InputLabel>
                                                <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as PlanCat }))}>
                                                    {(Object.entries(CAT_LABELS) as [PlanCat, string][]).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                                        {[{ val: false, label: '− Expense', c: '#dc2626' }, { val: true, label: '+ Income', c: '#16a34a' }].map(opt => (
                                            <Box key={String(opt.val)} onClick={() => setForm(p => ({ ...p, isIncome: opt.val }))}
                                                 sx={{ flex: 1, py: 0.75, borderRadius: '7px', border: '1.5px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', borderColor: form.isIncome === opt.val ? opt.c : '#e5e7eb', bgcolor: form.isIncome === opt.val ? alpha(opt.c, 0.06) : 'transparent' }}>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: form.isIncome === opt.val ? opt.c : '#aaa' }}>{opt.label}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button fullWidth size="small" variant="outlined" onClick={() => { setAddOpen(false); setEditTarget(null); }} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, borderColor: '#d5d5d5', color: '#666' }}>Cancel</Button>
                                        <Button fullWidth size="small" variant="contained" disabled={!form.name.trim() || !form.amount} onClick={savePlan} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }}>{editTarget ? 'Save' : 'Add'}</Button>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Savings Goals */}
                {section === 'goals' && (
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>Savings Goals Impact</Typography>
                        <Stack spacing={1}>
                            {goals.map(goal => {
                                const pct        = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                                const monthsLeft = Math.max(Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)), 0);
                                const onTrack    = goal.monthlyContribution * monthsLeft >= (goal.targetAmount - goal.currentAmount);
                                return (
                                    <Box key={goal.id} sx={{ p: 1.5, borderRadius: '8px', border: '0.5px solid', borderColor: alpha(goal.color, 0.3), bgcolor: alpha(goal.color, 0.03) }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.79rem', fontWeight: 700, color: '#1e1e2e' }}>{goal.name}</Typography>
                                                <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>−${goal.monthlyContribution}/mo · {monthsLeft}mo left</Typography>
                                            </Box>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, px: 0.75, py: 0.2, borderRadius: '20px', bgcolor: onTrack ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)', color: onTrack ? '#15803d' : '#92400e', fontSize: '0.62rem', fontWeight: 700, height: 'fit-content' }}>
                                                {onTrack ? <CheckCircle size={9} /> : <AlertCircle size={9} />}{onTrack ? 'On track' : 'Behind'}
                                            </Box>
                                        </Box>
                                        <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 3, bgcolor: alpha(goal.color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: goal.color, borderRadius: 3 } }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</Typography>
                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: goal.color }}>{pct.toFixed(0)}%</Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

// ── Mock service stubs ────────────────────────────────────────────────────────
function mockMonthData(year: number, month: number) {
    const today = new Date();
    const isActual = year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth());
    return { openingBalance: 16_080, committedIncome: 5_800, committedExpenses: 4_920, isActual };
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const BalanceSavingsPage: React.FC = () => {
    const todayDate = new Date();

    const [mode, setMode]                 = useState<PageMode>('tracker');
    const [currentMonth, setCurrentMonth] = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    const [viewPeriod, setViewPeriod]     = useState<ViewPeriod>('daily');
    const [chartType, setChartType]       = useState<ChartType>('line');
    const [optimizerOpen, setOptimizerOpen] = useState(false);

    // Buffer + alerts
    const [bufferThreshold, setBufferThreshold] = useState(0);
    const [alerts, setAlerts]                   = useState<BalanceAlert[]>([]);

    // Plans
    const [plans, setPlans] = useState<FuturePlan[]>([
        { id: uid(), name: 'Car loan',         amount: 320, dueDay: 5,  frequency: 'monthly', category: 'debt',         isIncome: false },
        { id: uid(), name: 'Netflix',          amount: 18,  dueDay: 12, frequency: 'monthly', category: 'subscription', isIncome: false },
        { id: uid(), name: 'Freelance income', amount: 800, dueDay: 20, frequency: 'monthly', category: 'other',        isIncome: true  },
    ]);

    // Forecaster
    const [selectedPt, setSelectedPt] = useState<ChartPoint | null>(null);

    const [snackOpen, setSnackOpen]   = useState(false);
    const [snackMsg, setSnackMsg]     = useState('');
    const [snackSev, setSnackSev]     = useState<'success'|'info'|'warning'|'error'>('info');
    const [animateIn, setAnimateIn]   = useState(false);
    const [isLoading]                 = useState(false);

    const notify = (msg: string, sev: typeof snackSev = 'info') => { setSnackMsg(msg); setSnackSev(sev); setSnackOpen(true); };

    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthData = useMemo(() => mockMonthData(year, month), [year, month]);

    const savingsGoals: SavingsGoal[] = useMemo(() => [
        { id: 1, name: 'Emergency Fund',    targetAmount: 15_000, currentAmount: 11_850, targetDate: new Date(2025, 11, 1), monthlyContribution: 500, color: '#16a34a' },
        { id: 2, name: 'Vacation — Europe', targetAmount: 3_000,  currentAmount: 1_620,  targetDate: new Date(2025,  7, 1), monthlyContribution: 300, color: '#0284c7' },
        { id: 3, name: 'New Laptop',        targetAmount: 1_500,  currentAmount: 450,    targetDate: new Date(2025,  9, 1), monthlyContribution: 150, color: '#d97706' },
        { id: 4, name: 'Down Payment',      targetAmount: 50_000, currentAmount: 12_000, targetDate: new Date(2027,  5, 1), monthlyContribution: 800, color: '#7c3aed' },
    ], []);

    const planExpenses = useMemo(() => plans.filter(p => !p.isIncome).reduce((s, p) => s + p.amount * planHitsInMonth(p, year, month), 0), [plans, year, month]);
    const planIncome   = useMemo(() => plans.filter(p =>  p.isIncome).reduce((s, p) => s + p.amount * planHitsInMonth(p, year, month), 0), [plans, year, month]);

    const daily = useMemo(() =>
            buildDailyBalances(monthData.openingBalance, year, month, monthData.committedIncome + planIncome, monthData.committedExpenses + planExpenses, []),
        [monthData, year, month, planIncome, planExpenses]);

    const chartPoints = useMemo(() => buildChartPoints(daily, viewPeriod, year, month, bufferThreshold), [daily, viewPeriod, year, month, bufferThreshold]);

    // Derived stats
    const projectedClosing  = daily[daily.length - 1] ?? monthData.openingBalance;
    const lowestBalance     = Math.min(...daily);
    const overdraftDayIdx   = daily.findIndex(v => v < 0);
    const overdraftDay      = overdraftDayIdx >= 0 ? overdraftDayIdx + 1 : null;
    const overdraftAmt      = overdraftDayIdx >= 0 ? daily[overdraftDayIdx] : null;
    const monthNet          = projectedClosing - monthData.openingBalance;
    const daysInMonth       = getDaysInMonth(currentMonth);
    const isCurrentMonth    = isSameMonth(currentMonth, todayDate);
    const todayIdx          = isCurrentMonth ? todayDate.getDate() - 1 : -1;
    const todayBalance      = todayIdx >= 0 ? daily[todayIdx] : null;
    const avgBalance        = daily.reduce((s, v) => s + v, 0) / daily.length;

    // Compute alert triggers based on daily balance
    const computedAlerts = useMemo(() => alerts.map(a => ({
        ...a,
        triggered: a.enabled && daily.some(v =>
            a.direction === 'at-or-below' ? v <= a.threshold : v < a.threshold
        ),
    })), [alerts, daily]);

    // Active alert count for badge
    const triggeredCount = computedAlerts.filter(a => a.triggered && a.enabled).length;

    // Savings windows
    const savingsWindowDays = daily
        .map((v, i) => ({ day: i + 1, val: v }))
        .filter(d => d.val > avgBalance * 1.05);
    const bestSavingsDay = savingsWindowDays.length
        ? savingsWindowDays.reduce((a, b) => a.val > b.val ? a : b)
        : null;

    // Forecaster: selected date tips
    const selectedTips = useMemo((): string[] => {
        if (!selectedPt) return [];
        const tips: string[] = [];
        const saveable = selectedPt.balance - (monthData.openingBalance * 0.15);
        if (saveable > 0) tips.push(`You could transfer ~$${Math.round(saveable).toLocaleString()} while keeping a 15% buffer.`);
        if (selectedPt.balance > avgBalance) tips.push(`Balance on this date is above the monthly average ($${Math.round(avgBalance).toLocaleString()}).`);
        if (bufferThreshold > 0 && selectedPt.balance < bufferThreshold) tips.push(`Balance is below your buffer of $${bufferThreshold.toLocaleString()} — avoid transfers.`);
        const upcoming = plans.filter(p => !p.isIncome && p.dueDay > selectedPt.date.getDate());
        if (upcoming.length) tips.push(`${upcoming.length} expense plan(s) still due after this date.`);
        if (!tips.length) tips.push('No immediate savings opportunity flagged for this date.');
        return tips;
    }, [selectedPt, avgBalance, bufferThreshold, plans, monthData]);

    const fmt     = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const fmtFull = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const sign    = (n: number) => n >= 0 ? '+' : '−';

    useEffect(() => {
        document.title = 'Balance & Savings';
        setTimeout(() => setAnimateIn(true), 100);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    useEffect(() => { if (mode === 'tracker') setSelectedPt(null); }, [mode]);

    // Fire snack when alerts are triggered
    useEffect(() => {
        const triggered = computedAlerts.filter(a => a.triggered && a.enabled);
        if (triggered.length) {
            notify(`⚠ ${triggered.length} balance alert${triggered.length > 1 ? 's' : ''} triggered for ${format(currentMonth, 'MMMM')}`, 'warning');
        }
    }, [computedAlerts.map(a => a.triggered).join(',')]);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            {optimizerOpen && <Box onClick={() => setOptimizerOpen(false)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.22)', zIndex: 1299 }} />}
            <OptimizerPanel
                open={optimizerOpen} onClose={() => setOptimizerOpen(false)}
                plans={plans} goals={savingsGoals} year={year} month={month}
                bufferThreshold={bufferThreshold} onBufferChange={setBufferThreshold}
                alerts={computedAlerts}
                onAddAlert={a => setAlerts(prev => [...prev, { ...a, id: uid(), triggered: false }])}
                onToggleAlert={id => setAlerts(prev => prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x))}
                onDeleteAlert={id => setAlerts(prev => prev.filter(x => x.id !== id))}
                lowestBalance={lowestBalance}
                onAddPlan={p    => { setPlans(prev => [...prev, { ...p, id: uid() }]); notify('Plan added — chart updated', 'success'); }}
                onEditPlan={(id, p) => { setPlans(prev => prev.map(x => x.id === id ? { ...p, id } : x)); notify('Plan updated', 'success'); }}
                onDeletePlan={id => { setPlans(prev => prev.filter(x => x.id !== id)); notify('Plan removed', 'info'); }}
            />

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Header ────────────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                Balance & Savings Tracker
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                {mode === 'tracker'
                                    ? `${format(currentMonth, 'MMMM yyyy')} — balance snapshot with period views`
                                    : `Forecaster — click any chart point to inspect balance on that date`}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                            <ModeToggle mode={mode} onChange={m => { setMode(m); setSelectedPt(null); }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <IconButton onClick={() => setCurrentMonth(p => subMonths(p, 1))}
                                            sx={{ width: 30, height: 30, borderRadius: '6px', background: MAROON, color: '#fff', '&:hover': { background: MAROON_DARK } }}>
                                    <ChevronLeft size={15} />
                                </IconButton>
                                <Card elevation={0} sx={{ px: 1.75, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.75, borderRadius: '8px', border: '1px solid #e0e0e0', background: '#f9f9f9' }}>
                                    <Calendar size={13} color="#888" />
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#222' }}>{format(currentMonth, 'MMMM yyyy')}</Typography>
                                    {!monthData.isActual && <Box sx={{ px: 0.6, py: 0.1, borderRadius: '4px', bgcolor: 'rgba(2,132,199,0.12)', color: '#075985', fontSize: '0.58rem', fontWeight: 700 }}>PROJ</Box>}
                                </Card>
                                <IconButton onClick={() => setCurrentMonth(p => addMonths(p, 1))}
                                            sx={{ width: 30, height: 30, borderRadius: '6px', background: MAROON, color: '#fff', '&:hover': { background: MAROON_DARK } }}>
                                    <ChevronRight size={15} />
                                </IconButton>
                            </Box>

                            <Button variant="outlined" size="small"
                                    startIcon={triggeredCount > 0 ? <AlertTriangle size={13} /> : bufferThreshold > 0 ? <Shield size={13} /> : <SlidersHorizontal size={13} />}
                                    onClick={() => setOptimizerOpen(true)}
                                    sx={{
                                        borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.78rem',
                                        borderColor: triggeredCount > 0 ? '#dc2626' : MAROON,
                                        color: triggeredCount > 0 ? '#dc2626' : MAROON,
                                        bgcolor: triggeredCount > 0 ? alpha('#dc2626', 0.05) : alpha(MAROON, 0.03),
                                        '&:hover': { bgcolor: triggeredCount > 0 ? alpha('#dc2626', 0.1) : alpha(MAROON, 0.08) },
                                        position: 'relative',
                                    }}>
                                Optimize
                                {triggeredCount > 0 && (
                                    <Box sx={{ ml: 0.5, px: 0.6, py: 0.1, borderRadius: '4px', bgcolor: '#dc2626', color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>
                                        {triggeredCount} alert{triggeredCount > 1 ? 's' : ''}
                                    </Box>
                                )}
                            </Button>
                        </Box>
                    </Box>
                </Grow>

                {/* ── Alert banners (triggered) ─────────────────────────────── */}
                {computedAlerts.filter(a => a.triggered && a.enabled).map(a => (
                    <Grow key={a.id} in timeout={300}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, mb: 1.5, borderRadius: '10px', bgcolor: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)' }}>
                            <AlertTriangle size={16} color="#dc2626" />
                            <Typography sx={{ fontSize: '0.78rem', color: '#7f1d1d', fontWeight: 600, flex: 1 }}>
                                Alert: <strong>{a.label}</strong> — balance projected to go {a.direction === 'at-or-below' ? 'at or below' : 'below'} ${a.threshold.toLocaleString()} in {format(currentMonth, 'MMMM')}.
                            </Typography>
                            <Button size="small" onClick={() => setOptimizerOpen(true)}
                                    sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.06) } }}>
                                Review →
                            </Button>
                        </Box>
                    </Grow>
                ))}

                {/* Overdraft banner */}
                {overdraftDay && overdraftAmt !== null && (
                    <Grow in timeout={300}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, mb: 3, borderRadius: '10px', bgcolor: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)' }}>
                            <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={14} color="#dc2626" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#7f1d1d', mb: 0.25 }}>
                                    Projected overdraft on {format(new Date(year, month, overdraftDay), 'MMMM d, yyyy')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.73rem', color: '#991b1b' }}>
                                    Balance drops to −${Math.abs(overdraftAmt).toLocaleString()} on day {overdraftDay}.
                                    Open <strong>Optimize</strong> to adjust plan dates or add an inflow.
                                </Typography>
                            </Box>
                        </Box>
                    </Grow>
                )}

                {/* ── Summary cards ─────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>

                        {/* Opening balance */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ background: TH.maroon.base, borderRadius: '10px', borderTop: `3px solid ${TH.maroon.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: TH.maroon.label, fontWeight: 700, mb: 1 }}>Opening Balance</Typography>
                                {isLoading ? <Skeleton width="70%" height={42} /> : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: TH.maroon.value, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>{fmt(monthData.openingBalance)}</Typography>}
                                <LinearProgress variant="determinate" value={100} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(MAROON, 0.12), '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 2 } }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: TH.maroon.label }}>Carried from prior month</Typography>
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: TH.maroon.chipBg, color: TH.maroon.chipColor, fontSize: '0.65rem', fontWeight: 700 }}><Minus size={11} /> Start</Box>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Today / selected-date balance */}
                        {(() => {
                            const val = mode === 'forecaster' && selectedPt ? selectedPt.balance : todayBalance ?? monthData.openingBalance;
                            const th  = val < 0 ? TH.red : (bufferThreshold > 0 && val < bufferThreshold) ? TH.amber : TH.green;
                            const lbl = mode === 'forecaster' && selectedPt ? `Balance on ${format(selectedPt.date, 'MMM d')}` : isCurrentMonth ? "Today's Balance" : 'Month Start';
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ background: th.base, borderRadius: '10px', borderTop: `3px solid ${th.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: th.label, fontWeight: 700, mb: 1 }}>{lbl}</Typography>
                                        {isLoading ? <Skeleton width="70%" height={42} /> : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: val < 0 ? '#991b1b' : th.value, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>{val < 0 ? '-' : ''}{fmt(val)}</Typography>}
                                        <LinearProgress variant="determinate" value={Math.min((val / Math.max(monthData.openingBalance, 1)) * 100, 100)} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(th.bar, 0.15), '& .MuiLinearProgress-bar': { bgcolor: th.bar, borderRadius: 2 } }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: th.label }}>
                                                {mode === 'forecaster' && selectedPt ? format(selectedPt.date, 'EEEE') : isCurrentMonth ? `Day ${todayDate.getDate()} of ${daysInMonth}` : 'Start of month'}
                                            </Typography>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: th.chipBg, color: th.chipColor, fontSize: '0.65rem', fontWeight: 700 }}>
                                                {val < 0 ? <TrendingDown size={11} /> : bufferThreshold > 0 && val < bufferThreshold ? <AlertCircle size={11} /> : <TrendingUp size={11} />}
                                                {val < 0 ? 'Overdrawn' : bufferThreshold > 0 && val < bufferThreshold ? 'Below buffer' : 'Healthy'}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}

                        {/* Projected month-end */}
                        {(() => {
                            const th = overdraftDay ? TH.red : monthNet >= 0 ? TH.blue : TH.amber;
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ background: th.base, borderRadius: '10px', borderTop: `3px solid ${th.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: th.label, fontWeight: 700, mb: 1 }}>Projected Month-End</Typography>
                                        {isLoading ? <Skeleton width="70%" height={42} /> : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: th.value, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>{fmt(projectedClosing)}</Typography>}
                                        <LinearProgress variant="determinate" value={Math.min(Math.abs(monthNet) / Math.max(monthData.openingBalance, 1) * 100 * 3, 100)} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(th.bar, 0.15), '& .MuiLinearProgress-bar': { bgcolor: th.bar, borderRadius: 2 } }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: th.label }}>{format(endOfMonth(currentMonth), 'MMM d, yyyy')}</Typography>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: th.chipBg, color: th.chipColor, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {monthNet >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                                {sign(monthNet)}{fmt(Math.abs(monthNet))} net
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}

                        {/* Buffer / lowest balance */}
                        {(() => {
                            const showBuf = bufferThreshold > 0;
                            const val     = showBuf ? lowestBalance : lowestBalance;
                            const th      = val < 0 ? TH.red : showBuf && val < bufferThreshold ? TH.amber : val < 500 ? TH.amber : TH.green;
                            return (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ background: th.base, borderRadius: '10px', borderTop: `3px solid ${th.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                        <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: th.label, fontWeight: 700, mb: 1 }}>
                                            {showBuf ? 'Buffer Status' : 'Lowest Balance'}
                                        </Typography>
                                        {isLoading ? <Skeleton width="70%" height={42} /> : (
                                            <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: th.value, fontVariantNumeric: 'tabular-nums', lineHeight: 1, mb: 0.5 }}>
                                                {val < 0 ? '-' : ''}{fmt(Math.abs(val))}
                                            </Typography>
                                        )}
                                        {showBuf && (
                                            <Box sx={{ my: 0.75 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>Lowest day</Typography>
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>Buffer: ${bufferThreshold.toLocaleString()}</Typography>
                                                </Box>
                                                <LinearProgress variant="determinate" value={Math.min((Math.max(val, 0) / bufferThreshold) * 100, 100)} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(th.bar, 0.15), '& .MuiLinearProgress-bar': { bgcolor: th.bar, borderRadius: 2 } }} />
                                            </Box>
                                        )}
                                        {!showBuf && <LinearProgress variant="determinate" value={val < 0 ? 100 : Math.min((val / Math.max(monthData.openingBalance, 1)) * 100, 100)} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(th.bar, 0.15), '& .MuiLinearProgress-bar': { bgcolor: th.bar, borderRadius: 2 } }} />}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: th.label }}>
                                                {showBuf ? (val >= bufferThreshold ? `${fmt(val - bufferThreshold)} above buffer` : `${fmt(bufferThreshold - val)} below buffer`) : (val < 0 ? 'Overdraft risk' : 'Monthly low point')}
                                            </Typography>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: th.chipBg, color: th.chipColor, fontSize: '0.65rem', fontWeight: 700 }}>
                                                {val < 0 ? <AlertTriangle size={11} /> : showBuf && val < bufferThreshold ? <Shield size={11} /> : <CheckCircle size={11} />}
                                                {val < 0 ? 'Overdrawn' : showBuf && val < bufferThreshold ? 'Under buffer' : 'OK'}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })()}
                    </Grid>
                </Grow>

                {/* ── Main content ──────────────────────────────────────────── */}
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={mode === 'forecaster' ? 8 : 12}>
                        <Stack spacing={3}>

                            {/* Chart panel */}
                            <Grow in={animateIn} timeout={700}>
                                <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
                                    <SectionHeader
                                        icon={<BarChart2 size={15} color="white" />}
                                        title={mode === 'tracker' ? 'Balance Projection' : 'Balance Forecast — Click to Inspect'}
                                        subtitle={
                                            mode === 'tracker'
                                                ? `${format(currentMonth, 'MMMM yyyy')} · ${viewPeriod === 'monthly' ? 'weekly buckets within the month' : viewPeriod === 'weekly' ? 'daily detail per week' : viewPeriod}`
                                                : 'Select any date to see balance and savings opportunities'
                                        }
                                        action={<ChartControls period={viewPeriod} onPeriod={setViewPeriod} chartType={chartType} onChartType={setChartType} />}
                                    />
                                    <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                        {mode === 'forecaster' && !selectedPt && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, mb: 2, borderRadius: '8px', bgcolor: alpha('#0284c7', 0.06), border: `1px solid ${alpha('#0284c7', 0.18)}` }}>
                                                <Search size={14} color="#0284c7" />
                                                <Typography sx={{ fontSize: '0.75rem', color: '#075985', fontWeight: 600 }}>Click any point to inspect the balance and savings opportunity for that date</Typography>
                                            </Box>
                                        )}

                                        <BalanceChart
                                            points={chartPoints}
                                            chartType={chartType}
                                            bufferThreshold={bufferThreshold}
                                            alerts={computedAlerts}
                                            period={viewPeriod}
                                            selectedDate={selectedPt?.date ?? null}
                                            onSelectPoint={pt => {
                                                setSelectedPt(pt);
                                                if (mode === 'tracker' && pt.weekDays?.length) {
                                                    // drill-in shown below chart automatically
                                                }
                                            }}
                                            isLoading={isLoading}
                                        />

                                        {/* Chart legend */}
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 18, height: 2.5, bgcolor: MAROON, borderRadius: 1 }} />
                                                <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>Actual</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 18, height: 2.5, bgcolor: '#3b82f6', borderRadius: 1, opacity: 0.75 }} />
                                                <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>Projected</Typography>
                                            </Box>
                                            {bufferThreshold > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Box sx={{ width: 18, height: 2, bgcolor: '#d97706', borderRadius: 1 }} />
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600 }}>Buffer ${bufferThreshold.toLocaleString()}</Typography>
                                                </Box>
                                            )}
                                            {lowestBalance < 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626' }} />
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>Overdraft</Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ ml: 'auto' }}>
                                                <Typography sx={{ fontSize: '0.67rem', color: '#ccc' }}>
                                                    {viewPeriod === 'daily' ? `${daysInMonth} days` : viewPeriod === 'weekly' || viewPeriod === 'monthly' ? `${chartPoints.length} week${chartPoints.length !== 1 ? 's' : ''}` : `${chartPoints.length} periods`}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Weekly/monthly drill-down: show day-level detail for selected/hovered week */}
                                        {(viewPeriod === 'weekly' || viewPeriod === 'monthly') && selectedPt?.weekDays && (
                                            <WeekDrillDown point={selectedPt} bufferThreshold={bufferThreshold} />
                                        )}

                                        {/* Tracker mode: month summary strip */}
                                        {mode === 'tracker' && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                                                    {[
                                                        { label: 'Opening',       value: fmt(monthData.openingBalance),                          color: '#555'    },
                                                        { label: '+ Income',      value: fmt(monthData.committedIncome + planIncome),             color: '#16a34a' },
                                                        { label: '− Expenses',    value: fmt(monthData.committedExpenses + planExpenses),         color: '#dc2626' },
                                                        { label: 'Net',           value: `${sign(monthNet)}${fmt(Math.abs(monthNet))}`,          color: monthNet >= 0 ? '#16a34a' : '#dc2626' },
                                                        { label: 'EOM closing',   value: fmt(projectedClosing),                                   color: monthNet >= 0 ? '#0284c7' : '#dc2626' },
                                                        ...(bufferThreshold > 0 ? [{ label: 'Buffer', value: `$${bufferThreshold.toLocaleString()}`, color: '#d97706' }] : []),
                                                    ].map(item => (
                                                        <Box key={item.label} sx={{ px: 1.25, py: 0.9, borderRadius: '8px', bgcolor: '#fafafa', border: '0.5px solid #eee', flex: '1 1 70px' }}>
                                                            <Typography sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#bbb', fontWeight: 700 }}>{item.label}</Typography>
                                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Grow>

                            {/* Tracker: savings opportunities */}
                            {mode === 'tracker' && (
                                <Grow in={animateIn} timeout={800}>
                                    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
                                        <SectionHeader icon={<PiggyBank size={15} color="white" />} title="Savings Opportunities" subtitle="Days with balance above monthly average — ideal windows to transfer to savings" />
                                        <Box sx={{ bgcolor: '#fff', p: 3 }}>
                                            {bestSavingsDay ? (
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <Box sx={{ p: 2, borderRadius: '10px', border: `1px solid ${alpha('#16a34a', 0.25)}`, bgcolor: alpha('#16a34a', 0.04) }}>
                                                            <Typography sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4a7060', fontWeight: 700, mb: 0.5 }}>Best Transfer Window</Typography>
                                                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#14532d' }}>{format(new Date(year, month, bestSavingsDay.day), 'MMMM d')}</Typography>
                                                            <Typography sx={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>Balance: {fmt(bestSavingsDay.val)} · +{fmt(bestSavingsDay.val - avgBalance)} vs avg</Typography>
                                                            <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.5 }}>
                                                                {bufferThreshold > 0
                                                                    ? `After keeping your ${fmt(bufferThreshold)} buffer, you could transfer ~${fmt(Math.max(bestSavingsDay.val - bufferThreshold, 0))}.`
                                                                    : `Consider transferring $${Math.round(bestSavingsDay.val * 0.1).toLocaleString()}–$${Math.round(bestSavingsDay.val * 0.2).toLocaleString()} on this date.`}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
                                                            Top surplus days ({savingsWindowDays.length} total)
                                                        </Typography>
                                                        <Stack spacing={0.5}>
                                                            {savingsWindowDays.slice(0, 5).map(d => (
                                                                <Box key={d.day} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.25, py: 0.75, borderRadius: '6px', bgcolor: '#fafafa', border: '0.5px solid #f0f0f0' }}>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#555', fontWeight: 600 }}>{format(new Date(year, month, d.day), 'MMM d')}</Typography>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.val)}</Typography>
                                                                        <Typography sx={{ fontSize: '0.65rem', color: '#aaa' }}>+{fmt(d.val - avgBalance)}</Typography>
                                                                        {bufferThreshold > 0 && d.val < bufferThreshold && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#d97706' }} />}
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            ) : (
                                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                                    <Typography sx={{ fontSize: '0.85rem', color: '#bbb' }}>No significant savings windows detected this month.</Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#ccc', mt: 0.5 }}>Open Optimize to add plans or adjust spending to create surplus days.</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Grow>
                            )}
                        </Stack>
                    </Grid>

                    {/* ── Forecaster right panel ─────────────────────────────── */}
                    {mode === 'forecaster' && (
                        <Grid item xs={12} lg={4}>
                            <Grow in timeout={600}>
                                <Box sx={{ position: 'sticky', top: 24 }}>
                                    <Stack spacing={3}>

                                        {/* Date inspector */}
                                        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
                                            <SectionHeader icon={<Eye size={15} color="white" />} title="Date Inspector" subtitle="Click a chart point to inspect any date" />
                                            <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                                                {selectedPt ? (
                                                    <Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                            <Box>
                                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e1e2e' }}>{selectedPt.sublabel ? `${selectedPt.label} · ${selectedPt.sublabel}` : format(selectedPt.date, 'EEEE, MMMM d')}</Typography>
                                                                <Typography sx={{ fontSize: '0.7rem', color: '#aaa', mt: 0.25 }}>{selectedPt.isProjected ? 'Projected' : 'Actual'} balance</Typography>
                                                            </Box>
                                                            <Box sx={{ textAlign: 'right' }}>
                                                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: selectedPt.overdraft ? '#7f1d1d' : '#14532d', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {selectedPt.overdraft ? '-' : ''}{fmt(selectedPt.balance)}
                                                                </Typography>
                                                                {bufferThreshold > 0 && (
                                                                    <Typography sx={{ fontSize: '0.65rem', color: selectedPt.balance < bufferThreshold ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                                                                        {selectedPt.balance >= bufferThreshold ? `${fmt(selectedPt.balance - bufferThreshold)} above buffer` : `${fmt(bufferThreshold - selectedPt.balance)} below buffer`}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* Status chips */}
                                                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                                                            {selectedPt.overdraft && <Box sx={{ px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: 'rgba(220,38,38,0.1)', color: '#991b1b', fontSize: '0.65rem', fontWeight: 700 }}>⚠ Overdraft</Box>}
                                                            {selectedPt.belowBuffer && !selectedPt.overdraft && <Box sx={{ px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: 'rgba(217,119,6,0.1)', color: '#92400e', fontSize: '0.65rem', fontWeight: 700 }}>↓ Below buffer</Box>}
                                                            {!selectedPt.overdraft && !selectedPt.belowBuffer && <Box sx={{ px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d', fontSize: '0.65rem', fontWeight: 700 }}>✓ Healthy</Box>}
                                                        </Box>

                                                        <Divider sx={{ mb: 1.25 }} />
                                                        <Stack spacing={0.6}>
                                                            {selectedTips.map((tip, i) => (
                                                                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                                                                    <Box sx={{ mt: 0.5, width: 4, height: 4, borderRadius: '50%', bgcolor: '#16a34a', flexShrink: 0 }} />
                                                                    <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>{tip}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Stack>

                                                        {/* Weekly drill-down in forecaster */}
                                                        {selectedPt.weekDays && (
                                                            <WeekDrillDown point={selectedPt} bufferThreshold={bufferThreshold} />
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ py: 3, textAlign: 'center', borderRadius: '8px', bgcolor: '#fafafa', border: '1px dashed #e0e0e0' }}>
                                                        <Search size={22} color="#ddd" style={{ marginBottom: 8 }} />
                                                        <Typography sx={{ fontSize: '0.82rem', color: '#bbb', mb: 0.5 }}>No date selected</Typography>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#ccc' }}>Click any point on the balance chart</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Best savings dates */}
                                        <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.10)}` }}>
                                            <SectionHeader icon={<PiggyBank size={15} color="white" />} title="Best Savings Dates" subtitle="Highest-balance days — click to inspect" />
                                            <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                                                <Stack spacing={0.75}>
                                                    {savingsWindowDays.slice(0, 6).map(d => {
                                                        const date  = new Date(year, month, d.day);
                                                        const below = bufferThreshold > 0 && d.val < bufferThreshold;
                                                        // find the matching chart point
                                                        const matchPt = chartPoints.find(p =>
                                                            p.weekDays
                                                                ? p.weekDays.some(wd => wd.day === d.day)
                                                                : p.date.getDate() === d.day
                                                        ) ?? chartPoints.find(p => p.date.getDate() === d.day) ?? null;
                                                        const isSel = selectedPt && selectedPt.date.getDate() === d.day && selectedPt.date.getMonth() === month;
                                                        return (
                                                            <Box key={d.day}
                                                                 onClick={() => matchPt && setSelectedPt(matchPt)}
                                                                 sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.25, py: 0.9, borderRadius: '7px', cursor: 'pointer', bgcolor: isSel ? alpha(MAROON, 0.07) : '#fafafa', border: isSel ? `1px solid ${alpha(MAROON, 0.2)}` : '0.5px solid #f0f0f0', '&:hover': { bgcolor: alpha(MAROON, 0.05) }, transition: 'all 0.15s' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Calendar size={12} color={isSel ? MAROON : '#aaa'} />
                                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: isSel ? 700 : 500, color: isSel ? MAROON : '#555' }}>
                                                                        {format(date, 'EEE, MMM d')}
                                                                    </Typography>
                                                                    {below && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#d97706' }} />}
                                                                </Box>
                                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: below ? '#d97706' : '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {fmt(d.val)}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                    {savingsWindowDays.length === 0 && (
                                                        <Typography sx={{ fontSize: '0.78rem', color: '#bbb', textAlign: 'center', py: 2 }}>
                                                            No surplus days. Try reducing expenses via Optimize.
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Grow>
                        </Grid>
                    )}
                </Grid>
            </Container>

            <Snackbar open={snackOpen} autoHideDuration={5000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BalanceSavingsPage;