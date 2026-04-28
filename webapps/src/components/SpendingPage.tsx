import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    Box, Button, Grid, Typography, Card, IconButton, alpha, Container,
    Grow, Stack, Snackbar, Alert, LinearProgress, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tabs, Tab, Chip, TextField, InputAdornment,
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Calendar, Upload, Receipt, TrendingUp,
    TrendingDown, ShoppingCart, Coffee, Utensils, Car, Home, Zap,
    ShoppingBag, Minus, BarChart2, FileText, X, PiggyBank, Camera,
    List, Wallet, Brain, Target, Activity, DollarSign, Layers,
    ArrowRight, Store, Tag,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
    ReferenceLine, ComposedChart, Legend,
} from 'recharts';
import { addMonths, format, subMonths } from 'date-fns';
import Sidebar from './Sidebar';

// ── Design tokens (identical to BudgetPage / SpendingPage) ───────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#0C447C';
const SLATE       = '#64748b';
const BLUE        = '#1d6fb8';
const PURPLE      = '#7c3aed';
const PINK        = '#d4537e';

// ── Card themes (identical to BudgetPage) ────────────────────────────────────
const CARD_THEMES = {
    budget:      { base:'#f0f4ff', border:MAROON,    valueColor:'#1e1e2e', barColor:MAROON,    chipBg:'rgba(128,0,0,0.10)',   chipColor:MAROON,    labelColor:'#5a5a7a' },
    spent_ok:    { base:'#f0fdf4', border:'#16a34a', valueColor:'#14532d', barColor:'#16a34a', chipBg:'rgba(22,163,74,0.12)', chipColor:'#15803d', labelColor:'#4a7060' },
    spent_warn:  { base:'#fffbeb', border:AMBER,     valueColor:'#78350f', barColor:AMBER,     chipBg:'rgba(217,119,6,0.12)', chipColor:'#92400e', labelColor:'#7a6030' },
    spent_over:  { base:'#fff1f2', border:RED,       valueColor:'#7f1d1d', barColor:RED,       chipBg:'rgba(220,38,38,0.12)', chipColor:'#991b1b', labelColor:'#7a3030' },
    saved_good:  { base:'#f0f9ff', border:'#0284c7', valueColor:'#0c4a6e', barColor:'#0284c7', chipBg:'rgba(2,132,199,0.12)', chipColor:'#075985', labelColor:'#3a6070' },
    saved_low:   { base:'#fafafa', border:'#94a3b8', valueColor:'#334155', barColor:'#94a3b8', chipBg:'rgba(148,163,184,0.15)',chipColor:'#475569', labelColor:'#64748b' },
};

// ── Category config ───────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
    Groceries:'#16a34a', Dining:AMBER, Transport:'#0284c7', Housing:'#7c3aed',
    Utilities:'#db2777', Shopping:'#ea580c', Entertainment:'#0891b2',
    Coffee:'#92400e', Other:SLATE,
};
const CAT_ICONS: Record<string, React.ReactNode> = {
    Groceries:<ShoppingCart size={13}/>, Dining:<Utensils size={13}/>,
    Transport:<Car size={13}/>, Housing:<Home size={13}/>,
    Utilities:<Zap size={13}/>, Shopping:<ShoppingBag size={13}/>,
    Entertainment:<BarChart2 size={13}/>, Coffee:<Coffee size={13}/>,
    Other:<Minus size={13}/>,
};
const PALETTE = [MAROON,TEAL,NAVY,AMBER,GREEN,PURPLE,PINK,BLUE,'#639922','#ba7517'];

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode   = 'general' | 'grocery';
type PeriodKey  = 'daily' | 'weekly' | 'biweekly' | 'monthly';
type BreakMode  = 'category' | 'merchant' | 'week' | 'date';
type RightPane  = 'overview' | 'category' | 'savings' | 'forecast';

interface SpendRow {
    date:string; label:string; total:number;
    Groceries:number; Dining:number; Transport:number; Housing:number;
    Utilities:number; Shopping:number; Entertainment:number; Coffee:number; Other:number;
}
interface ReceiptItem { id:string; name:string; amount:number; category:string; date:string; merchant:string }
interface Envelope    { name:string; budget:number; color:string }

// ── Mock data generators ──────────────────────────────────────────────────────
function makeDailyData(days: number): SpendRow[] {
    const arr: SpendRow[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        arr.push({
            date: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { month:'short', day:'numeric' }),
            total: Math.round((isWeekend ? 80 : 45) + Math.random() * 60),
            Groceries:     Math.round(Math.random() * 35),
            Dining:        Math.round((isWeekend ? 20 : 5) + Math.random() * 30),
            Transport:     Math.round(Math.random() * 20),
            Housing:       i === days - 1 ? 1200 : 0,
            Utilities:     i === 3 ? 120 : 0,
            Shopping:      Math.round(Math.random() * 40),
            Entertainment: Math.round((isWeekend ? 10 : 0) + Math.random() * 25),
            Coffee:        Math.round(Math.random() * 12),
            Other:         Math.round(Math.random() * 15),
        });
    }
    return arr;
}

const ALL_DAILY = makeDailyData(90);

const WEEKLY_HIST = [
    { period:'Jan', general:1820, grocery:540, budget:2200 },
    { period:'Feb', general:1650, grocery:490, budget:2200 },
    { period:'Mar', general:2100, grocery:620, budget:2200 },
    { period:'Apr', general:1940, grocery:570, budget:2200 },
    { period:'May W1', general:448, grocery:214, budget:550 },
    { period:'May W2', general:382, grocery:187, budget:550 },
    { period:'May W3', general:621, grocery:339, budget:550 },
    { period:'May W4', general:312, grocery:168, budget:550 },
];

const ENVELOPES: Envelope[] = [
    { name:'Groceries',     budget:500,  color:TEAL   },
    { name:'Dining',        budget:200,  color:PINK   },
    { name:'Transport',     budget:150,  color:AMBER  },
    { name:'Shopping',      budget:300,  color:PURPLE },
    { name:'Utilities',     budget:200,  color:SLATE  },
    { name:'Entertainment', budget:100,  color:NAVY   },
    { name:'Coffee',        budget:60,   color:'#92400e'},
];

const PERIODS: { key:PeriodKey; label:string }[] = [
    { key:'daily',    label:'Daily'     },
    { key:'weekly',   label:'Weekly'    },
    { key:'biweekly', label:'Bi-Weekly' },
    { key:'monthly',  label:'Monthly'   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const f$    = (n:number) => `$${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fR    = (n:number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;
const clamp = (v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v));

function aggregateByPeriod(data:SpendRow[], period:PeriodKey): SpendRow[] {
    if (period === 'daily') return data.slice(-30);
    const size = period === 'weekly' ? 7 : period === 'biweekly' ? 14 : 30;
    const out: SpendRow[] = [];
    for (let i = 0; i < data.length; i += size) {
        const sl = data.slice(i, i + size);
        if (!sl.length) break;
        const sum = (k: keyof SpendRow) => sl.reduce((s,r)=>s+((r[k] as number)??0),0);
        out.push({
            date: sl[0].date,
            label: sl.length === 1 ? sl[0].label : `${sl[0].label}–${sl[sl.length-1].label}`,
            total:        sum('total'),        Groceries: sum('Groceries'),
            Dining:       sum('Dining'),       Transport: sum('Transport'),
            Housing:      sum('Housing'),      Utilities: sum('Utilities'),
            Shopping:     sum('Shopping'),     Entertainment: sum('Entertainment'),
            Coffee:       sum('Coffee'),       Other: sum('Other'),
        });
    }
    return out;
}

function guessCategory(name:string): string {
    if (/coffee|latte|starbucks|dunkin/i.test(name)) return 'Coffee';
    if (/restaurant|dining|burger|pizza|taco|café|cafe/i.test(name)) return 'Dining';
    if (/grocery|walmart|costco|kroger|whole foods|trader/i.test(name)) return 'Groceries';
    if (/uber|lyft|gas|fuel|parking|transit/i.test(name)) return 'Transport';
    if (/amazon|target|shop|mall|clothing/i.test(name)) return 'Shopping';
    if (/netflix|spotify|movie|cinema/i.test(name)) return 'Entertainment';
    if (/electric|water|internet|phone|utility/i.test(name)) return 'Utilities';
    return 'Other';
}

function parseReceiptText(text:string, filename:string): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const merchant = filename.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
    const date = new Date().toISOString().split('T')[0];
    text.split('\n').map(l=>l.trim()).filter(Boolean).forEach((line,idx) => {
        const m = line.match(/\$?([\d,]+\.?\d{0,2})/);
        if (!m) return;
        const amount = parseFloat(m[1].replace(',',''));
        if (amount <= 0 || amount > 5000) return;
        const name = line.replace(/\$?([\d,]+\.?\d{0,2})/,'').replace(/[\t|,]+/g,' ').trim() || `Item ${idx+1}`;
        items.push({ id:`${filename}-${idx}`, name, amount, category:guessCategory(name), date, merchant });
    });
    return items;
}

// ── Shared components ─────────────────────────────────────────────────────────
const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', p:1.5, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', minWidth:150 }}>
            <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color:'#333', mb:0.75 }}>{label}</Typography>
            {payload.map((p:any) => (
                <Box key={p.dataKey} sx={{ display:'flex', justifyContent:'space-between', gap:2, mb:0.2 }}>
                    <Typography sx={{ fontSize:'0.7rem', color:p.fill||p.color }}>{p.name||p.dataKey}</Typography>
                    <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#222' }}>
                        ${(p.value??0).toLocaleString(undefined,{maximumFractionDigits:0})}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

// Panel header — identical gradient to BudgetPage panels
const PanelHeader: React.FC<{ icon:React.ReactNode; title:string; subtitle:string; right?:React.ReactNode }> = ({ icon,title,subtitle,right }) => (
    <Box sx={{ background:'linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)', px:3, py:2, position:'relative', overflow:'hidden' }}>
        <Box sx={{ position:'absolute', top:-16, right:-16, width:80, height:80, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position:'absolute', bottom:-20, right:50, width:50, height:50, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.04)' }} />
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
                <Box sx={{ width:30, height:30, borderRadius:'8px', bgcolor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {icon}
                </Box>
                <Box>
                    <Typography sx={{ fontWeight:800, fontSize:'0.92rem', color:'#fff', letterSpacing:'-0.01em' }}>{title}</Typography>
                    <Typography sx={{ fontSize:'0.67rem', color:'rgba(255,255,255,0.7)', mt:0.1 }}>{subtitle}</Typography>
                </Box>
            </Box>
            {right}
        </Box>
    </Box>
);

const Panel: React.FC<{ icon:React.ReactNode; title:string; subtitle:string; right?:React.ReactNode; children:React.ReactNode; animate?:boolean; timeout?:number }> = ({ icon,title,subtitle,right,children,animate=true,timeout=600 }) => (
    <Grow in={animate} timeout={timeout}>
        <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${alpha(MAROON,0.15)}`, boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}` }}>
            <PanelHeader icon={icon} title={title} subtitle={subtitle} right={right} />
            <Box sx={{ bgcolor:'#fff', p:3 }}>{children}</Box>
        </Box>
    </Grow>
);

// Summary card — identical to BudgetPage card design
const SummaryCard: React.FC<{ themeKey:keyof typeof CARD_THEMES; label:string; value:string; sub:string; barValue:number; chipLabel:string; chipIcon:React.ReactNode }> = ({ themeKey,label,value,sub,barValue,chipLabel,chipIcon }) => {
    const t = CARD_THEMES[themeKey];
    return (
        <Box sx={{ background:t.base, borderRadius:'10px', borderTop:`3px solid ${t.border}`, boxShadow:'0 2px 12px rgba(0,0,0,0.10)', p:2.5, height:'100%', transition:'box-shadow 0.2s', '&:hover':{ boxShadow:'0 6px 20px rgba(0,0,0,0.14)' } }}>
            <Typography sx={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:t.labelColor, fontWeight:700, mb:1 }}>{label}</Typography>
            <Typography sx={{ fontSize:'1.65rem', fontWeight:800, color:t.valueColor, fontVariantNumeric:'tabular-nums', lineHeight:1, mb:0.5 }}>{value}</Typography>
            <LinearProgress variant="determinate" value={clamp(barValue,0,100)} sx={{ my:1, height:4, borderRadius:2, bgcolor:alpha(t.barColor,0.15), '& .MuiLinearProgress-bar':{ bgcolor:t.barColor, borderRadius:2 } }} />
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mt:0.5 }}>
                <Typography sx={{ fontSize:'0.72rem', color:t.labelColor }}>{sub}</Typography>
                <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.4, px:0.9, py:0.3, borderRadius:'20px', bgcolor:t.chipBg, color:t.chipColor, fontSize:'0.65rem', fontWeight:700, whiteSpace:'nowrap' }}>
                    {chipIcon} {chipLabel}
                </Box>
            </Box>
        </Box>
    );
};

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════
const SpendingPage: React.FC = () => {

    const [animateIn,       setAnimateIn]       = useState(false);
    const [viewMode,        setViewMode]        = useState<ViewMode>('general');
    const [spendingMonth,   setSpendingMonth]   = useState(new Date());
    const [period,          setPeriod]          = useState<PeriodKey>('weekly');
    const [breakMode,       setBreakMode]       = useState<BreakMode>('category');
    const [rightPane,       setRightPane]       = useState<RightPane>('overview');
    const [chartTab,        setChartTab]        = useState(0);
    const [receiptTab,      setReceiptTab]      = useState(0);
    const [receipts,        setReceipts]        = useState<ReceiptItem[]>([]);
    const [dragOver,        setDragOver]        = useState(false);
    const [selectedCat,     setSelectedCat]     = useState<string|null>(null);
    const [monthlyIncome,   setMonthlyIncome]   = useState(4500);
    const [savingsGoal,     setSavingsGoal]     = useState(500);
    const [forecastModel,   setForecastModel]   = useState<'linear'|'moving'|'seasonal'>('linear');
    const [snackOpen,       setSnackOpen]       = useState(false);
    const [snackMsg,        setSnackMsg]        = useState('');
    const [snackSev,        setSnackSev]        = useState<'success'|'error'>('success');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.title = 'Spending Tracker';
        setTimeout(() => setAnimateIn(true), 100);
        return () => { document.title = 'BudgetBuddy'; };
    }, []);

    // ── Derived data ──────────────────────────────────────────────────────────
    const chartData   = useMemo(() => aggregateByPeriod(ALL_DAILY, period), [period]);
    const totalSpent  = useMemo(() => chartData.reduce((s,r) => s + r.total, 0), [chartData]);
    const avgPeriod   = Math.round(totalSpent / (chartData.length || 1));
    const maxRow      = useMemo(() => chartData.reduce<SpendRow|null>((m,r) => !m||r.total>m.total?r:m, null), [chartData]);
    const minRow      = useMemo(() => chartData.reduce<SpendRow|null>((m,r) => !m||r.total<m.total?r:m, null), [chartData]);
    const BUDGET      = viewMode === 'grocery' ? 800 : 2200;
    const pctUsed     = clamp(Math.round((totalSpent / BUDGET) * 100), 0, 140);
    const budgetColor = pctUsed > 100 ? RED : pctUsed > 85 ? AMBER : GREEN;
    const activePeriodLabel = PERIODS.find(p=>p.key===period)?.label ?? '';

    const pieData = useMemo(() =>
            (Object.keys(CAT_COLORS) as (keyof SpendRow)[])
                .map(cat => ({ name: cat as string, value: chartData.reduce((s,r) => s + ((r[cat] as number)??0), 0) }))
                .filter(d => d.value > 0).sort((a,b) => b.value - a.value),
        [chartData]
    );

    // ── Breakdown data by selected mode ───────────────────────────────────────
    const breakdownData = useMemo(() => {
        if (breakMode === 'category') return pieData.map((d,i) => ({ name:d.name, value:d.value, color:PALETTE[i%PALETTE.length], count:0 }));
        if (breakMode === 'merchant') {
            const MERCHANTS = ['Whole Foods','Shell','Chipotle','Amazon',"Trader Joe's",'Netflix','Costco','Starbucks','Target','Safeway'];
            return MERCHANTS.map((m,i) => ({ name:m, value:Math.round(50+Math.random()*200), color:PALETTE[i%PALETTE.length], count:Math.ceil(Math.random()*5) })).sort((a,b)=>b.value-a.value);
        }
        if (breakMode === 'week') {
            return ['Week 1','Week 2','Week 3','Week 4'].map((w,i) => ({ name:w, value:Math.round(300+Math.random()*400), color:PALETTE[i], count:0 }));
        }
        return chartData.slice(-10).map((r,i) => ({ name:r.label, value:r.total, color:PALETTE[i%PALETTE.length], count:0 }));
    }, [breakMode, pieData, chartData]);

    // ── Weekly this-month breakdown ───────────────────────────────────────────
    const weeklyMonthData = ['Week 1','Week 2','Week 3','Week 4'].map((w,i) => {
        const spend = Math.round(300 + Math.random() * 350);
        const weekBudget = BUDGET / 4;
        return { week:w, spent:spend, budget:Math.round(weekBudget), pct:Math.round((spend/weekBudget)*100) };
    });

    // ── Envelope performance ──────────────────────────────────────────────────
    const envData = useMemo(() => {
        const totals: Record<string,number> = {};
        chartData.forEach(r => { Object.keys(CAT_COLORS).forEach(cat => { totals[cat] = (totals[cat]||0)+((r as any)[cat]||0); }); });
        return ENVELOPES.map(e => {
            const spent = totals[e.name] ?? Math.round(Math.random()*e.budget*1.2);
            return { ...e, spent, pct:clamp(Math.round((spent/e.budget)*100),0,140) };
        });
    }, [chartData]);

    // ── Receipt helpers ───────────────────────────────────────────────────────
    const receiptTotal  = receipts.reduce((s,r) => s+r.amount, 0);
    const receiptByCat  = useMemo(() => {
        const m: Record<string,number> = {};
        receipts.forEach(r => { m[r.category] = (m[r.category]??0)+r.amount; });
        return Object.entries(m).sort((a,b) => b[1]-a[1]);
    }, [receipts]);

    const processFile = useCallback((file:File) => {
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target?.result as string;
            const items = parseReceiptText(text, file.name);
            if (!items.length) { setSnackMsg(`No transactions found in "${file.name}".`); setSnackSev('error'); setSnackOpen(true); return; }
            setReceipts(prev => { const ids = new Set(prev.map(r=>r.id)); return [...prev,...items.filter(i=>!ids.has(i.id))]; });
            setSnackMsg(`Added ${items.length} transaction${items.length>1?'s':''} from "${file.name}"`);
            setSnackSev('success'); setSnackOpen(true);
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e:React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragOver(false);
        Array.from(e.dataTransfer.files).forEach(processFile);
    }, [processFile]);

    // ── Forecast computation ──────────────────────────────────────────────────
    const forecastData = useMemo(() => {
        const hist = chartData.slice(-8);
        const n = hist.length;
        if (forecastModel === 'linear') {
            if (n < 2) return hist.map(d=>({...d, forecast:d.total}));
            const xM = (n-1)/2;
            const yM = hist.reduce((s,d)=>s+d.total,0)/n;
            const slope = hist.reduce((s,d,i)=>s+(i-xM)*(d.total-yM),0)/hist.reduce((s,_,i)=>s+(i-xM)**2,0);
            const intercept = yM - slope*xM;
            const future = Array.from({length:4},(_,i)=>({ label:`+${i+1}`, date:'', total:null as number|null, Groceries:0,Dining:0,Transport:0,Housing:0,Utilities:0,Shopping:0,Entertainment:0,Coffee:0,Other:0, forecast:Math.max(intercept+slope*(n+i),0) }));
            return [...hist.map((d,i)=>({...d,forecast:Math.max(intercept+slope*i,0)})),...future];
        }
        if (forecastModel === 'moving') {
            const win = 3;
            const base = hist.map((d,i) => { if(i<win-1) return {...d,forecast:d.total}; const avg=hist.slice(i-win+1,i+1).reduce((s,r)=>s+r.total,0)/win; return {...d,forecast:avg}; });
            const lastAvg = hist.slice(-win).reduce((s,d)=>s+d.total,0)/win;
            const future = Array.from({length:4},(_,i)=>({ label:`+${i+1}`, date:'', total:null as number|null, Groceries:0,Dining:0,Transport:0,Housing:0,Utilities:0,Shopping:0,Entertainment:0,Coffee:0,Other:0, forecast:lastAvg }));
            return [...base,...future];
        }
        const avgT = hist.reduce((s,d)=>s+d.total,0)/(n||1);
        const trend = n>1?(hist[n-1].total/(hist[0].total||1))**(1/(n-1)):1;
        const future = Array.from({length:4},(_,i)=>({ label:`+${i+1}`, date:'', total:null as number|null, Groceries:0,Dining:0,Transport:0,Housing:0,Utilities:0,Shopping:0,Entertainment:0,Coffee:0,Other:0, forecast:Math.max(avgT*(trend**(i+1)),0) }));
        return [...hist.map(d=>({...d,forecast:d.total})),...future];
    }, [chartData, forecastModel]);

    const futurePoints  = forecastData.filter(d=>d.total===null);
    const projectedAvg  = futurePoints.length ? futurePoints.reduce((s,d)=>s+(d.forecast??0),0)/futurePoints.length : 0;
    const currentAvg    = chartData.slice(-8).reduce((s,d)=>s+d.total,0) / Math.max(chartData.slice(-8).length,1);
    const trendDelta    = projectedAvg - currentAvg;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ maxWidth:'calc(100% - 240px)', ml:'240px', minHeight:'100vh', background:'#f0f2f5' }}>
            <Sidebar />
            <Container maxWidth="xl" sx={{ py:4 }}>

                {/* ══════════════════════════════════════════════════════════════
                    PAGE HEADER — identical structure to BudgetPage
                ══════════════════════════════════════════════════════════════ */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ mb:3 }}>
                        <Box sx={{ width:28, height:3, background:MAROON, borderRadius:'2px', mb:0.75 }} />
                        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:2 }}>
                            <Box>
                                <Typography variant="h4" component="h1" sx={{ fontWeight:800, color:'#111', letterSpacing:'-0.025em' }}>
                                    {format(spendingMonth,'MMMM yyyy')} Spending
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color:'#888', mt:0.5 }}>
                                    Track spending patterns, performance and receipt analytics
                                </Typography>
                            </Box>

                            <Box sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
                                {/* ── Maroon chevron — identical to BudgetPage ── */}
                                <IconButton onClick={() => setSpendingMonth(m=>subMonths(m,1))}
                                            sx={{ width:32, height:32, borderRadius:'6px', background:MAROON, color:'#fff', '&:hover':{ background:MAROON_DARK } }}>
                                    <ChevronLeft size={16} />
                                </IconButton>

                                {/* ── Month card — identical to BudgetPage ── */}
                                <Card elevation={0} sx={{ px:2, py:0.75, display:'flex', alignItems:'center', gap:1, borderRadius:'8px', border:'1px solid #e0e0e0', background:'#f9f9f9' }}>
                                    <Calendar size={14} color="#888" />
                                    <Typography sx={{ fontSize:'0.82rem', fontWeight:600, color:'#222' }}>
                                        {format(spendingMonth,'MMMM yyyy')}
                                    </Typography>
                                </Card>

                                <IconButton onClick={() => setSpendingMonth(m=>addMonths(m,1))}
                                            sx={{ width:32, height:32, borderRadius:'6px', background:MAROON, color:'#fff', '&:hover':{ background:MAROON_DARK } }}>
                                    <ChevronRight size={16} />
                                </IconButton>

                                {/* ── General / Grocery toggle — pill inside card ── */}
                                <Card elevation={0} sx={{ display:'flex', alignItems:'center', gap:0.5, px:0.75, py:0.5, borderRadius:'8px', border:'1px solid #e0e0e0', background:'#f9f9f9', ml:1 }}>
                                    {(['general','grocery'] as ViewMode[]).map(v => (
                                        <Box key={v} onClick={() => setViewMode(v)} sx={{
                                            display:'flex', alignItems:'center', gap:0.5,
                                            px:1.5, py:0.5, borderRadius:'6px', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                                            bgcolor: viewMode===v ? MAROON : 'transparent',
                                            color:   viewMode===v ? '#fff' : '#333',
                                            '&:hover': { bgcolor: viewMode!==v ? alpha(MAROON,0.07) : MAROON_DARK },
                                        }}>
                                            {v==='grocery' && <ShoppingCart size={13} />}
                                            {v.charAt(0).toUpperCase()+v.slice(1)}
                                        </Box>
                                    ))}
                                </Card>

                                {/* ── Period switcher — identical pattern ── */}
                                <Card elevation={0} sx={{ display:'flex', alignItems:'center', gap:0.5, px:0.75, py:0.5, borderRadius:'8px', border:'1px solid #e0e0e0', background:'#f9f9f9' }}>
                                    {PERIODS.map(({ key,label }) => (
                                        <Box key={key} onClick={() => setPeriod(key)} sx={{
                                            px:1.5, py:0.5, borderRadius:'6px', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                                            bgcolor: period===key ? MAROON : 'transparent',
                                            color:   period===key ? '#fff' : '#333',
                                            '&:hover': { bgcolor: period!==key ? alpha(MAROON,0.07) : MAROON_DARK },
                                        }}>{label}</Box>
                                    ))}
                                </Card>

                                {/* ── Action buttons — identical to BudgetPage outlined style ── */}
                                <Button variant="outlined" size="small" startIcon={<Upload size={14}/>}
                                        onClick={() => fileRef.current?.click()}
                                        sx={{ ml:1, borderRadius:'6px', textTransform:'none', fontWeight:600, fontSize:'0.78rem', borderColor:'#d5d5d5', color:'#333', bgcolor:'#fff', '&:hover':{ borderColor:MAROON, color:MAROON, bgcolor:alpha(MAROON,0.04) } }}>
                                    Import Receipt
                                </Button>
                                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" multiple hidden
                                       onChange={e => { Array.from(e.target.files??[]).forEach(processFile); e.target.value=''; }} />
                            </Box>
                        </Box>
                    </Box>
                </Grow>

                {/* ── Summary cards ── */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb:4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard themeKey="budget" label="Total Spent" value={f$(totalSpent)}
                                         sub={`${chartData.length} ${activePeriodLabel.toLowerCase()} period${chartData.length!==1?'s':''}`}
                                         barValue={pctUsed} chipLabel={`${pctUsed}% of budget`} chipIcon={<BarChart2 size={11}/>} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard themeKey={pctUsed>100?'spent_over':pctUsed>85?'spent_warn':'spent_ok'} label="Budget Remaining"
                                         value={fR(Math.max(BUDGET-totalSpent,0))} sub={`${activePeriodLabel} budget: ${fR(BUDGET)}`}
                                         barValue={clamp(100-pctUsed,0,100)} chipLabel={pctUsed>100?'Over budget':`${100-pctUsed}% left`} chipIcon={pctUsed>100?<TrendingUp size={11}/>:<TrendingDown size={11}/>} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard themeKey="saved_good" label="Avg Per Period" value={fR(avgPeriod)}
                                         sub={`${activePeriodLabel} average`} barValue={100}
                                         chipLabel="average" chipIcon={<Minus size={11}/>} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard themeKey="spent_over" label="Peak Period" value={fR(maxRow?.total??0)}
                                         sub={maxRow?.label??'—'} barValue={100}
                                         chipLabel="highest spend" chipIcon={<TrendingUp size={11}/>} />
                        </Grid>
                    </Grid>
                </Grow>

                {/* ── Main two-column layout ── */}
                <Grid container spacing={3}>

                    {/* ── LEFT COLUMN ── */}
                    <Grid item xs={12} lg={8}>
                        <Stack spacing={3}>

                            {/* ── Spending Over Time ── */}
                            <Panel icon={<TrendingUp size={15} color="white"/>} title="Spending Over Time"
                                   subtitle={`${chartData.length} ${activePeriodLabel.toLowerCase()} periods · last 90 days`}
                                   animate={animateIn} timeout={700}
                                   right={
                                       <Box sx={{ display:'flex', gap:0.5 }}>
                                           {['Area','Bar','Stacked'].map((lbl,idx) => (
                                               <Box key={lbl} onClick={()=>setChartTab(idx)} sx={{ px:1.25, py:0.35, borderRadius:'6px', fontSize:'0.68rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s', bgcolor:chartTab===idx?'rgba(255,255,255,0.28)':'rgba(255,255,255,0.08)', color:'#fff', '&:hover':{ bgcolor:'rgba(255,255,255,0.22)' } }}>
                                                   {lbl}
                                               </Box>
                                           ))}
                                       </Box>
                                   }>
                                <ResponsiveContainer width="100%" height={280}>
                                    {chartTab===0 ? (
                                        <AreaChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
                                            <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={MAROON} stopOpacity={0.28}/><stop offset="95%" stopColor={MAROON} stopOpacity={0.02}/></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                            <XAxis dataKey="label" tick={{fontSize:10,fill:'#888'}} tickLine={false}/>
                                            <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:10,fill:'#888'}} tickLine={false} axisLine={false}/>
                                            <RTooltip content={<ChartTooltip/>}/>
                                            <ReferenceLine y={avgPeriod} stroke={AMBER} strokeDasharray="5 3" strokeWidth={1.5}/>
                                            <Area type="monotone" dataKey="total" stroke={MAROON} strokeWidth={2.5} fill="url(#sg)" name="Spend"/>
                                        </AreaChart>
                                    ) : chartTab===1 ? (
                                        <BarChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                            <XAxis dataKey="label" tick={{fontSize:10,fill:'#888'}} tickLine={false}/>
                                            <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:10,fill:'#888'}} tickLine={false} axisLine={false}/>
                                            <RTooltip content={<ChartTooltip/>}/>
                                            <ReferenceLine y={avgPeriod} stroke={AMBER} strokeDasharray="5 3" strokeWidth={1.5}/>
                                            <Bar dataKey="total" fill={MAROON} radius={[4,4,0,0]} name="Spend"/>
                                        </BarChart>
                                    ) : (
                                        <BarChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                            <XAxis dataKey="label" tick={{fontSize:10,fill:'#888'}} tickLine={false}/>
                                            <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:10,fill:'#888'}} tickLine={false} axisLine={false}/>
                                            <RTooltip content={<ChartTooltip/>}/>
                                            {Object.entries(CAT_COLORS).map(([cat,color]) => <Bar key={cat} dataKey={cat} stackId="a" fill={color} name={cat}/>)}
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                                <Box sx={{ display:'flex', gap:2, mt:1, flexWrap:'wrap' }}>
                                    {[{color:MAROON,label:'Actual spend'},{color:AMBER,label:'Period average',dashed:true}].map(l => (
                                        <Box key={l.label} sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                                            {l.dashed ? <Box component="svg" width={14} height={6}><line x1="0" y1="3" x2="14" y2="3" stroke={l.color} strokeWidth="2" strokeDasharray="4 2"/></Box> : <Box sx={{ width:12, height:3, bgcolor:l.color, borderRadius:1 }}/>}
                                            <Typography variant="caption" color="text.secondary">{l.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Panel>

                            {/* ── Week-by-week this month ── */}
                            <Panel icon={<Calendar size={15} color="white"/>} title="This Month — Week by Week"
                                   subtitle={`${format(spendingMonth,'MMMM yyyy')} · weekly budget performance`}
                                   animate={animateIn} timeout={750}>
                                <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1.5, mb:3 }}>
                                    {weeklyMonthData.map((w,i) => {
                                        const col = w.pct>100?RED:w.pct>85?AMBER:MAROON;
                                        return (
                                            <Box key={w.week} sx={{ borderRadius:'12px', border:`0.5px solid ${alpha('#000',0.09)}`, overflow:'hidden' }}>
                                                <Box sx={{ px:1.5, py:1.25, borderBottom:`0.5px solid ${alpha('#000',0.07)}`, bgcolor:alpha(col,0.05) }}>
                                                    <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:col }}>{w.week}</Typography>
                                                    <Typography sx={{ fontSize:'1.15rem', fontWeight:800, fontVariantNumeric:'tabular-nums', color:col, lineHeight:1.2, mt:0.25 }}>${w.spent.toLocaleString()}</Typography>
                                                </Box>
                                                <Box sx={{ px:1.5, py:1 }}>
                                                    <Box sx={{ height:4, borderRadius:2, bgcolor:alpha(col,0.12), overflow:'hidden', mb:0.625 }}>
                                                        <Box sx={{ height:'100%', width:`${clamp(w.pct,0,100)}%`, bgcolor:col, borderRadius:2 }}/>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">{w.pct}% of ${w.budget} weekly budget</Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={weeklyMonthData} barSize={44}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                        <XAxis dataKey="week" tick={{fontSize:10,fill:'#888'}} tickLine={false}/>
                                        <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:10,fill:'#888'}} tickLine={false} axisLine={false}/>
                                        <RTooltip content={<ChartTooltip/>}/>
                                        <ReferenceLine y={BUDGET/4} stroke={AMBER} strokeDasharray="5 3" strokeWidth={1.5}/>
                                        <Bar dataKey="spent" name="Spent" radius={[4,4,0,0]}>
                                            {weeklyMonthData.map((w,i) => <Cell key={i} fill={w.pct>100?RED:w.pct>85?AMBER:MAROON}/>)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Panel>

                            {/* ── Spending Breakdown ── */}
                            <Panel icon={<BarChart2 size={15} color="white"/>} title="Spending Breakdown"
                                   subtitle="Drill down by category, merchant, week or date"
                                   animate={animateIn} timeout={800}
                                   right={
                                       <Box sx={{ display:'flex', gap:0.5 }}>
                                           {(['category','merchant','week','date'] as BreakMode[]).map(m => (
                                               <Box key={m} onClick={()=>setBreakMode(m)} sx={{ px:1.25, py:0.35, borderRadius:'6px', fontSize:'0.68rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s', bgcolor:breakMode===m?'rgba(255,255,255,0.28)':'rgba(255,255,255,0.08)', color:'#fff', '&:hover':{ bgcolor:'rgba(255,255,255,0.22)' } }}>
                                                   {m.charAt(0).toUpperCase()+m.slice(1)}
                                               </Box>
                                           ))}
                                       </Box>
                                   }>
                                <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
                                    {/* Bar chart */}
                                    <Box>
                                        <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#aaa', mb:1.5 }}>By {breakMode.charAt(0).toUpperCase()+breakMode.slice(1)}</Typography>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={breakdownData.slice(0,8)} layout="vertical" margin={{top:0,right:8,left:8,bottom:0}}>
                                                <XAxis type="number" tickFormatter={v=>`$${v}`} tick={{fontSize:9,fill:'#aaa'}} tickLine={false} axisLine={false}/>
                                                <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#555'}} tickLine={false} width={80}/>
                                                <RTooltip formatter={(v:number)=>[f$(v),'Amount']} contentStyle={{borderRadius:8,border:'1px solid #e5e7eb'}}/>
                                                <Bar dataKey="value" radius={[0,4,4,0]} name="Amount">
                                                    {breakdownData.slice(0,8).map((d,i) => <Cell key={i} fill={d.color}/>)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    {/* Table */}
                                    <Box>
                                        <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#aaa', mb:1.5 }}>Category performance</Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ '& th':{ fontSize:'0.65rem', fontWeight:700, color:'#888', borderBottom:'2px solid #f0f0f0', py:0.75, textTransform:'uppercase', letterSpacing:'0.07em' } }}>
                                                        <TableCell>Category</TableCell>
                                                        <TableCell align="right">Total</TableCell>
                                                        <TableCell>Share</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {pieData.map(({ name,value }) => {
                                                        const pct = totalSpent>0?(value/totalSpent)*100:0;
                                                        const color = CAT_COLORS[name]??SLATE;
                                                        return (
                                                            <TableRow key={name} sx={{ '&:hover':{ bgcolor:'#fafafa' } }}>
                                                                <TableCell sx={{ py:1, borderBottom:'1px solid #f5f5f5' }}>
                                                                    <Box sx={{ display:'flex', alignItems:'center', gap:0.875 }}>
                                                                        <Box sx={{ width:22, height:22, borderRadius:'6px', bgcolor:alpha(color,0.12), display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{CAT_ICONS[name]}</Box>
                                                                        <Typography sx={{ fontSize:'0.78rem', fontWeight:600 }}>{name}</Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontSize:'0.78rem', fontWeight:700, py:1, borderBottom:'1px solid #f5f5f5' }}>{f$(value)}</TableCell>
                                                                <TableCell sx={{ py:1, borderBottom:'1px solid #f5f5f5', minWidth:90 }}>
                                                                    <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                                                        <Box sx={{ flex:1, height:5, borderRadius:3, bgcolor:alpha(color,0.15), overflow:'hidden' }}><Box sx={{ width:`${pct}%`, height:'100%', bgcolor:color, borderRadius:3 }}/></Box>
                                                                        <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color, minWidth:32, textAlign:'right' }}>{pct.toFixed(1)}%</Typography>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </Box>
                            </Panel>

                            {/* ── Historical Trend ── */}
                            <Panel icon={<Activity size={15} color="white"/>} title="Historical Spending Trend"
                                   subtitle="Month-over-month general vs grocery vs budget"
                                   animate={animateIn} timeout={850}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <ComposedChart data={WEEKLY_HIST}>
                                        <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={MAROON} stopOpacity={0.18}/><stop offset="95%" stopColor={MAROON} stopOpacity={0.01}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                        <XAxis dataKey="period" tick={{fontSize:10,fill:'#888'}}/>
                                        <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:10,fill:'#888'}} tickLine={false} axisLine={false}/>
                                        <RTooltip content={<ChartTooltip/>}/>
                                        <Area type="monotone" dataKey="general" stroke={MAROON} strokeWidth={2.5} fill="url(#hg)" name="General" dot={{fill:MAROON,r:3}}/>
                                        <Line type="monotone" dataKey="grocery" stroke={TEAL} strokeWidth={2} dot={{fill:TEAL,r:3}} name="Grocery"/>
                                        <Line type="monotone" dataKey="budget" stroke={AMBER} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Budget"/>
                                    </ComposedChart>
                                </ResponsiveContainer>
                                <Box sx={{ display:'flex', gap:2.5, mt:1.5, flexWrap:'wrap' }}>
                                    {[{color:MAROON,label:'General spend'},{color:TEAL,label:'Grocery spend'},{color:AMBER,label:'Budget',dashed:true}].map(l => (
                                        <Box key={l.label} sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                                            {l.dashed ? <Box component="svg" width={14} height={6}><line x1="0" y1="3" x2="14" y2="3" stroke={l.color} strokeWidth="2" strokeDasharray="4 2"/></Box> : <Box sx={{ width:12, height:3, bgcolor:l.color, borderRadius:1 }}/>}
                                            <Typography variant="caption" color="text.secondary">{l.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Panel>

                            {/* ── Envelope Budget Performance ── */}
                            <Panel icon={<Target size={15} color="white"/>} title="Envelope Budget Performance"
                                   subtitle="Planned vs actual for each spending envelope"
                                   animate={animateIn} timeout={900}>
                                <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
                                    <Stack spacing={1.75}>
                                        {envData.map(e => {
                                            const col = e.pct>100?RED:e.pct>85?AMBER:e.color;
                                            return (
                                                <Box key={e.name}>
                                                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:0.6 }}>
                                                        <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                                            <Box sx={{ width:9, height:9, borderRadius:'2px', bgcolor:e.color }}/>
                                                            <Typography sx={{ fontSize:'0.8rem', fontWeight:600 }}>{e.name}</Typography>
                                                        </Box>
                                                        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                                                            <Typography sx={{ fontSize:'0.75rem', color:'text.secondary', fontVariantNumeric:'tabular-nums' }}>${Math.round(e.spent)}/{e.budget}</Typography>
                                                            <Box sx={{ px:0.75, py:'1px', borderRadius:'5px', bgcolor:alpha(col,0.1), fontSize:'0.6rem', fontWeight:700, color:col }}>{e.pct>100?'over':e.pct>85?'near':'ok'}</Box>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ height:6, borderRadius:3, bgcolor:alpha(col,0.12), overflow:'hidden' }}>
                                                        <Box sx={{ height:'100%', width:`${clamp(e.pct,0,100)}%`, bgcolor:col, borderRadius:3 }}/>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={envData} barSize={28}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                            <XAxis dataKey="name" tick={{fontSize:9,fill:'#aaa'}} tickLine={false} angle={-25} textAnchor="end" height={42}/>
                                            <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:9,fill:'#aaa'}} tickLine={false} axisLine={false}/>
                                            <RTooltip content={<ChartTooltip/>}/>
                                            <Bar dataKey="budget" fill={alpha(SLATE,0.25)} radius={[3,3,0,0]} name="Budget"/>
                                            <Bar dataKey="spent" radius={[3,3,0,0]} name="Spent">
                                                {envData.map((e,i) => <Cell key={i} fill={e.pct>100?RED:e.pct>85?AMBER:e.color}/>)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Panel>

                            {/* ── Receipt Transactions (when imported) ── */}
                            {receipts.length > 0 && (
                                <Panel icon={<Receipt size={15} color="white"/>} title="Receipt Transactions"
                                       subtitle={`${receipts.length} item${receipts.length!==1?'s':''} · ${f$(receiptTotal)} total`}
                                       animate timeout={600}
                                       right={<Box sx={{ px:1, py:0.3, borderRadius:'20px', bgcolor:'rgba(255,255,255,0.2)', color:'#fff', fontSize:'0.68rem', fontWeight:700 }}>{receipts.length} items</Box>}>
                                    <Box sx={{ display:'flex', gap:2, mb:2.5 }}>
                                        {[{l:'Total',v:f$(receiptTotal),c:MAROON},{l:'Items',v:`${receipts.length}`,c:'#0284c7'},{l:'Categories',v:`${receiptByCat.length}`,c:GREEN}].map(({ l,v,c }) => (
                                            <Box key={l} sx={{ flex:1, bgcolor:alpha(c,0.06), borderRadius:'8px', p:1.5, textAlign:'center', border:`1px solid ${alpha(c,0.15)}` }}>
                                                <Typography sx={{ fontSize:'0.65rem', color:c, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', mb:0.25 }}>{l}</Typography>
                                                <Typography sx={{ fontSize:'1.1rem', fontWeight:800, color:c }}>{v}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Box sx={{ borderBottom:1, borderColor:'divider', mb:2 }}>
                                        <Tabs value={receiptTab} onChange={(_,v)=>setReceiptTab(v)} sx={{ minHeight:36, '& .MuiTab-root':{ minHeight:36, textTransform:'none', fontWeight:600, fontSize:'0.78rem' }, '& .Mui-selected':{ color:MAROON }, '& .MuiTabs-indicator':{ bgcolor:MAROON } }}>
                                            <Tab label="By Category"/><Tab label="All Items"/>
                                        </Tabs>
                                    </Box>
                                    {receiptTab===0 ? (
                                        <Stack spacing={1}>
                                            {receiptByCat.map(([cat,total]) => {
                                                const color = CAT_COLORS[cat]??SLATE;
                                                const pct = receiptTotal>0?(total/receiptTotal)*100:0;
                                                return (
                                                    <Box key={cat}>
                                                        <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                                                            <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                                                <Box sx={{ width:22, height:22, borderRadius:'6px', bgcolor:alpha(color,0.12), display:'flex', alignItems:'center', justifyContent:'center', color }}>{CAT_ICONS[cat]}</Box>
                                                                <Typography sx={{ fontSize:'0.78rem', fontWeight:600 }}>{cat}</Typography>
                                                            </Box>
                                                            <Typography sx={{ fontSize:'0.78rem', fontWeight:700 }}>{f$(total)}</Typography>
                                                        </Box>
                                                        <Box sx={{ height:5, borderRadius:3, bgcolor:alpha(color,0.12), overflow:'hidden' }}><Box sx={{ width:`${pct}%`, height:'100%', bgcolor:color, borderRadius:3, transition:'width 0.4s' }}/></Box>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    ) : (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead><TableRow>{['Item','Category','Date','Amount',''].map(h=><TableCell key={h} sx={{ fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#888', borderBottom:'2px solid #f0f0f0', py:1 }}>{h}</TableCell>)}</TableRow></TableHead>
                                                <TableBody>
                                                    {receipts.map(item => {
                                                        const color = CAT_COLORS[item.category]??SLATE;
                                                        return (
                                                            <TableRow key={item.id} sx={{ '&:hover':{ bgcolor:'#fafafa' } }}>
                                                                <TableCell sx={{ py:1, borderBottom:'1px solid #f5f5f5', maxWidth:200 }}>
                                                                    <Typography sx={{ fontSize:'0.78rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</Typography>
                                                                    <Typography sx={{ fontSize:'0.65rem', color:'#999' }}>{item.merchant}</Typography>
                                                                </TableCell>
                                                                <TableCell sx={{ py:1, borderBottom:'1px solid #f5f5f5' }}><Box sx={{ display:'inline-flex', alignItems:'center', gap:0.4, px:0.8, py:0.2, borderRadius:'12px', bgcolor:alpha(color,0.1), color, fontSize:'0.68rem', fontWeight:700 }}>{item.category}</Box></TableCell>
                                                                <TableCell sx={{ fontSize:'0.75rem', color:'#666', py:1, borderBottom:'1px solid #f5f5f5' }}>{item.date}</TableCell>
                                                                <TableCell sx={{ fontSize:'0.82rem', fontWeight:700, py:1, borderBottom:'1px solid #f5f5f5' }}>{f$(item.amount)}</TableCell>
                                                                <TableCell sx={{ py:1, borderBottom:'1px solid #f5f5f5', width:32 }}>
                                                                    <IconButton size="small" onClick={()=>setReceipts(prev=>prev.filter(r=>r.id!==item.id))} sx={{ width:22, height:22, color:'#ccc', '&:hover':{ color:RED, bgcolor:alpha(RED,0.06) } }}><X size={12}/></IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                    <Button size="small" variant="outlined" onClick={()=>setReceipts([])} sx={{ mt:2.5, borderRadius:'6px', textTransform:'none', fontWeight:600, fontSize:'0.75rem', borderColor:'#e5e7eb', color:RED, '&:hover':{ borderColor:RED, bgcolor:alpha(RED,0.04) } }}>Clear All</Button>
                                </Panel>
                            )}
                        </Stack>
                    </Grid>

                    {/* ── RIGHT COLUMN — Dynamic Panel ── */}
                    <Grid item xs={12} lg={4}>
                        <Grow in={animateIn} timeout={800}>
                            <Box sx={{ position:'sticky', top:24 }}>

                                {/* Panel selector — identical pill nav to SpendingPage */}
                                <Box sx={{ display:'flex', borderRadius:'12px', p:0.5, bgcolor:'#e8e8e8', gap:0.25, mb:2 }}>
                                    {([
                                        { key:'overview',  label:'Overview',   icon:<Layers size={13}/>  },
                                        { key:'category',  label:'Categories', icon:<BarChart2 size={13}/> },
                                        { key:'savings',   label:'Savings',    icon:<Target size={13}/>  },
                                        { key:'forecast',  label:'Forecast',   icon:<Brain size={13}/>   },
                                    ] as const).map(({ key,label,icon }) => {
                                        const active = rightPane===key;
                                        return (
                                            <Box key={key} onClick={()=>setRightPane(key)} sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.3, py:0.75, borderRadius:'8px', cursor:'pointer', transition:'all 0.15s', bgcolor:active?'#fff':'transparent', color:active?MAROON:'#777', boxShadow:active?'0 1px 4px rgba(0,0,0,0.10)':'none', '&:hover':{ bgcolor:active?'#fff':alpha('#000',0.04) } }}>
                                                {icon}
                                                <Typography sx={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.02em' }}>{label}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>

                                {/* ── OVERVIEW ── */}
                                {rightPane==='overview' && (
                                    <Stack spacing={2.5}>
                                        {/* Spend mix donut */}
                                        <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${alpha(MAROON,0.15)}`, boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}` }}>
                                            <PanelHeader icon={<PiggyBank size={15} color="white"/>} title="Spend Mix" subtitle="Category proportions this period"/>
                                            <Box sx={{ bgcolor:'#fff', p:3 }}>
                                                <ResponsiveContainer width="100%" height={190}>
                                                    <PieChart>
                                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={2} dataKey="value">
                                                            {pieData.map(({ name }) => <Cell key={name} fill={CAT_COLORS[name]??SLATE}/>)}
                                                        </Pie>
                                                        <RTooltip formatter={(v:number) => f$(v)}/>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <Divider sx={{ my:1.5 }}/>
                                                <Stack spacing={0.75}>
                                                    {pieData.slice(0,6).map(({ name,value }) => {
                                                        const pct = totalSpent>0?(value/totalSpent)*100:0;
                                                        const color = CAT_COLORS[name]??SLATE;
                                                        return (
                                                            <Box key={name} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                                <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                                                                    <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:color, flexShrink:0 }}/>
                                                                    <Typography sx={{ fontSize:'0.75rem', color:'#555' }}>{name}</Typography>
                                                                </Box>
                                                                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                                                                    <Typography sx={{ fontSize:'0.7rem', color:'#aaa' }}>{pct.toFixed(1)}%</Typography>
                                                                    <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:'#222', minWidth:52, textAlign:'right' }}>{fR(value)}</Typography>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        </Box>

                                        {/* Receipt upload widget */}
                                        <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${alpha(MAROON,0.15)}`, boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}` }}>
                                            <PanelHeader icon={<Receipt size={15} color="white"/>} title="Receipt Analytics" subtitle="Upload CSV or text receipt files"
                                                         right={receipts.length>0?<Box sx={{ px:1, py:0.3, borderRadius:'20px', bgcolor:'rgba(255,255,255,0.2)', color:'#fff', fontSize:'0.68rem', fontWeight:700 }}>{receipts.length} items</Box>:undefined}/>
                                            <Box sx={{ bgcolor:'#fff', p:3 }}>
                                                <Box onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} onClick={()=>fileRef.current?.click()}
                                                     sx={{ border:`2px dashed ${dragOver?MAROON:alpha(MAROON,0.22)}`, borderRadius:'10px', p:3, textAlign:'center', cursor:'pointer', transition:'all 0.2s', bgcolor:dragOver?alpha(MAROON,0.04):'#fafafa', '&:hover':{ borderColor:MAROON, bgcolor:alpha(MAROON,0.03) } }}>
                                                    <Upload size={22} color={dragOver?MAROON:'#bbb'} style={{ margin:'0 auto 8px', display:'block' }}/>
                                                    <Typography sx={{ fontSize:'0.82rem', fontWeight:600, color:dragOver?MAROON:'#555', mb:0.4 }}>Drop files or click to upload</Typography>
                                                    <Typography sx={{ fontSize:'0.7rem', color:'#aaa' }}>CSV or TXT with dollar amounts</Typography>
                                                </Box>
                                                {receipts.length===0 && (
                                                    <Box sx={{ textAlign:'center', pt:2 }}>
                                                        <FileText size={26} color="#d5d5d5" style={{ margin:'0 auto 6px', display:'block' }}/>
                                                        <Typography sx={{ fontSize:'0.75rem', color:'#bbb' }}>No receipts yet</Typography>
                                                    </Box>
                                                )}
                                                {receipts.length>0 && (
                                                    <Box sx={{ mt:2 }}>
                                                        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
                                                            <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color:MAROON }}>Total: {f$(receiptTotal)}</Typography>
                                                            <Button size="small" variant="outlined" onClick={()=>setReceipts([])} sx={{ borderRadius:'6px', textTransform:'none', fontWeight:600, fontSize:'0.7rem', borderColor:'#e5e7eb', color:RED, py:0.3, '&:hover':{ borderColor:RED, bgcolor:alpha(RED,0.04) } }}>Clear</Button>
                                                        </Box>
                                                        <Stack spacing={0.75}>
                                                            {receiptByCat.slice(0,5).map(([cat,total]) => {
                                                                const color = CAT_COLORS[cat]??SLATE;
                                                                const pct = receiptTotal>0?(total/receiptTotal)*100:0;
                                                                return (
                                                                    <Box key={cat}>
                                                                        <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.35 }}>
                                                                            <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
                                                                                <Box sx={{ width:18, height:18, borderRadius:'5px', bgcolor:alpha(color,0.12), display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{CAT_ICONS[cat]}</Box>
                                                                                <Typography sx={{ fontSize:'0.73rem', fontWeight:600 }}>{cat}</Typography>
                                                                            </Box>
                                                                            <Typography sx={{ fontSize:'0.73rem', fontWeight:700 }}>{fR(total)}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ height:4, borderRadius:2, bgcolor:alpha(color,0.12), overflow:'hidden' }}><Box sx={{ width:`${pct}%`, height:'100%', bgcolor:color, borderRadius:2, transition:'width 0.4s' }}/></Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Stack>
                                )}

                                {/* ── CATEGORY DEEP DIVE ── */}
                                {rightPane==='category' && (() => {
                                    const activeCat = selectedCat ?? (pieData[0]?.name ?? '');
                                    const catTotal  = pieData.find(d=>d.name===activeCat)?.value ?? 0;
                                    const catPct    = totalSpent>0?(catTotal/totalSpent)*100:0;
                                    const catColor  = CAT_COLORS[activeCat]??SLATE;
                                    const catData   = chartData.map(r => ({ label:r.label, value:(r as any)[activeCat]??0 }));
                                    const catAvg    = catData.length>0?catData.reduce((s,r)=>s+r.value,0)/catData.length:0;
                                    return (
                                        <Stack spacing={2.5}>
                                            <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${alpha(MAROON,0.15)}`, boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}` }}>
                                                <PanelHeader icon={<BarChart2 size={15} color="white"/>} title="Category Deep Dive" subtitle="Drill into any spending category"/>
                                                <Box sx={{ bgcolor:'#fff', p:3 }}>
                                                    <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.75, mb:2.5 }}>
                                                        {pieData.map(({ name }) => {
                                                            const c = CAT_COLORS[name]??SLATE;
                                                            const isActive = name===activeCat;
                                                            return (
                                                                <Box key={name} onClick={()=>setSelectedCat(name)} sx={{ display:'inline-flex', alignItems:'center', gap:0.4, px:1.25, py:0.4, borderRadius:'20px', cursor:'pointer', fontSize:'0.72rem', fontWeight:700, transition:'all 0.15s', bgcolor:isActive?alpha(c,0.15):'#f5f5f5', color:isActive?c:'#888', border:`1.5px solid ${isActive?c:'transparent'}`, '&:hover':{ bgcolor:alpha(c,0.1), color:c } }}>
                                                                    {CAT_ICONS[name]}{name}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                    <Box sx={{ display:'flex', gap:1.5, mb:2.5 }}>
                                                        {[{label:'Total',value:f$(catTotal),color:catColor},{label:'Of Spend',value:`${catPct.toFixed(1)}%`,color:NAVY},{label:'Avg / Period',value:fR(catAvg),color:TEAL}].map(({ label,value,color }) => (
                                                            <Box key={label} sx={{ flex:1, textAlign:'center', p:1.25, borderRadius:'8px', bgcolor:alpha(color,0.06), border:`1px solid ${alpha(color,0.12)}` }}>
                                                                <Typography sx={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color, mb:0.3 }}>{label}</Typography>
                                                                <Typography sx={{ fontSize:'1rem', fontWeight:800, color }}>{value}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#aaa', mb:1 }}>Trend over time</Typography>
                                                    <ResponsiveContainer width="100%" height={150}>
                                                        <BarChart data={catData} margin={{top:4,right:4,left:-20,bottom:4}}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                                            <XAxis dataKey="label" tick={{fontSize:9,fill:'#aaa'}} tickLine={false}/>
                                                            <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:9,fill:'#aaa'}} tickLine={false} axisLine={false}/>
                                                            <RTooltip formatter={(v:number)=>[f$(v),activeCat]}/>
                                                            <ReferenceLine y={catAvg} stroke={catColor} strokeDasharray="4 3" strokeWidth={1.5}/>
                                                            <Bar dataKey="value" fill={catColor} radius={[3,3,0,0]}/>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    <Divider sx={{ my:2 }}/>
                                                    <Stack spacing={0.75}>
                                                        {[
                                                            { icon:<Activity size={11}/>, text:`${catPct.toFixed(1)}% of total spend this period`, color:catColor },
                                                            { icon:<TrendingUp size={11}/>, text:`Avg ${fR(catAvg)} per ${activePeriodLabel.toLowerCase()} period`, color:TEAL },
                                                            { icon:<DollarSign size={11}/>, text:`Monthly pace: ~${f$(catAvg*(period==='daily'?30:period==='weekly'?4.33:2.17))}`, color:NAVY },
                                                        ].map(({ icon,text,color },i) => (
                                                            <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.75, p:1, borderRadius:'7px', bgcolor:alpha(color,0.05), border:`1px solid ${alpha(color,0.1)}` }}>
                                                                <Box sx={{ color, flexShrink:0 }}>{icon}</Box>
                                                                <Typography sx={{ fontSize:'0.72rem', color:'#444' }}>{text}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    );
                                })()}

                                {/* ── SAVINGS IMPACT ── */}
                                {rightPane==='savings' && (() => {
                                    const discretionary = (pieData.find(d=>d.name==='Dining')?.value??0)+(pieData.find(d=>d.name==='Entertainment')?.value??0)+(pieData.find(d=>d.name==='Coffee')?.value??0)+(pieData.find(d=>d.name==='Shopping')?.value??0);
                                    const essentials    = totalSpent - discretionary;
                                    const netSaved      = monthlyIncome - totalSpent;
                                    const savingsRate   = monthlyIncome>0?(netSaved/monthlyIncome)*100:0;
                                    const goalPct       = savingsGoal>0?clamp((netSaved/savingsGoal)*100,0,100):0;
                                    const months2Goal   = netSaved>0?Math.ceil(savingsGoal/netSaved):Infinity;
                                    const scenarios     = [
                                        { label:'Current',    savings:Math.max(netSaved,0),           spend:totalSpent },
                                        { label:'−10%',       savings:Math.max(monthlyIncome-totalSpent*0.9,0), spend:totalSpent*0.9 },
                                        { label:'−20%',       savings:Math.max(monthlyIncome-totalSpent*0.8,0), spend:totalSpent*0.8 },
                                        { label:'Essentials', savings:Math.max(monthlyIncome-essentials,0),     spend:essentials },
                                    ];
                                    const rateColor = savingsRate>=20?GREEN:savingsRate>=10?AMBER:RED;
                                    return (
                                        <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${alpha(MAROON,0.15)}`, boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}` }}>
                                            <PanelHeader icon={<Target size={15} color="white"/>} title="Savings Impact" subtitle="How spending affects your savings goals"/>
                                            <Box sx={{ bgcolor:'#fff', p:3 }}>
                                                <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#aaa', mb:1.25 }}>Your Numbers</Typography>
                                                <Stack spacing={1.5} sx={{ mb:2.5 }}>
                                                    <TextField size="small" label="Monthly Income" type="number" value={monthlyIncome} onChange={e=>setMonthlyIncome(Number(e.target.value))}
                                                               InputProps={{ startAdornment:<InputAdornment position="start"><Typography sx={{ fontSize:'0.82rem', color:'#888' }}>$</Typography></InputAdornment> }}
                                                               sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'8px', fontSize:'0.85rem' }, '& .MuiInputLabel-root':{ fontSize:'0.78rem' } }}/>
                                                    <TextField size="small" label="Savings Goal" type="number" value={savingsGoal} onChange={e=>setSavingsGoal(Number(e.target.value))}
                                                               InputProps={{ startAdornment:<InputAdornment position="start"><Typography sx={{ fontSize:'0.82rem', color:'#888' }}>$</Typography></InputAdornment> }}
                                                               sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'8px', fontSize:'0.85rem' }, '& .MuiInputLabel-root':{ fontSize:'0.78rem' } }}/>
                                                </Stack>
                                                <Box sx={{ display:'flex', gap:1.5, mb:2.5 }}>
                                                    {[{l:'Net Saved',v:f$(Math.max(netSaved,0)),c:netSaved>=0?GREEN:RED},{l:'Savings Rate',v:`${Math.max(savingsRate,0).toFixed(1)}%`,c:rateColor},{l:'Discretionary',v:fR(discretionary),c:AMBER}].map(({ l,v,c }) => (
                                                        <Box key={l} sx={{ flex:1, textAlign:'center', p:1.25, borderRadius:'8px', bgcolor:alpha(c,0.06), border:`1px solid ${alpha(c,0.12)}` }}>
                                                            <Typography sx={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:c, mb:0.3 }}>{l}</Typography>
                                                            <Typography sx={{ fontSize:'0.92rem', fontWeight:800, color:c }}>{v}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                                <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#aaa', mb:0.75 }}>Goal Progress</Typography>
                                                <Box sx={{ mb:2 }}>
                                                    <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                                                        <Typography sx={{ fontSize:'0.72rem', color:'#555' }}>{f$(Math.max(netSaved,0))} of {f$(savingsGoal)}</Typography>
                                                        <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color:goalPct>=100?GREEN:MAROON }}>{Math.round(goalPct)}%</Typography>
                                                    </Box>
                                                    <Box sx={{ height:8, borderRadius:4, bgcolor:'#f0f0f0', overflow:'hidden' }}>
                                                        <Box sx={{ width:`${goalPct}%`, height:'100%', borderRadius:4, transition:'width 0.5s', background:goalPct>=100?`linear-gradient(90deg,${GREEN},#34d399)`:`linear-gradient(90deg,${MAROON},#b45454)` }}/>
                                                    </Box>
                                                    {months2Goal!==Infinity && <Typography sx={{ fontSize:'0.7rem', color:'#888', mt:0.5 }}>Goal reached in <strong style={{color:MAROON}}>{months2Goal} month{months2Goal!==1?'s':''}</strong> at this rate</Typography>}
                                                </Box>
                                                <Divider sx={{ my:2 }}/>
                                                <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#aaa', mb:1 }}>Spending Scenarios</Typography>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <BarChart data={scenarios} margin={{top:4,right:4,left:-16,bottom:4}}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false}/>
                                                        <XAxis dataKey="label" tick={{fontSize:9,fill:'#aaa'}} tickLine={false}/>
                                                        <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:9,fill:'#aaa'}} tickLine={false} axisLine={false}/>
                                                        <RTooltip content={<ChartTooltip/>}/>
                                                        <Bar dataKey="spend" name="Spending" fill={alpha(MAROON,0.7)} radius={[3,3,0,0]}/>
                                                        <Bar dataKey="savings" name="Savings" fill={GREEN} radius={[3,3,0,0]}/>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                                <Divider sx={{ my:2 }}/>
                                                <Stack spacing={0.75}>
                                                    {[
                                                        { icon:<ArrowRight size={11}/>, text:`Cut discretionary 10% → save ${f$(discretionary*0.1)} more/mo`, color:GREEN },
                                                        { icon:<ArrowRight size={11}/>, text:`Spending ${totalSpent>0&&monthlyIncome>0?((totalSpent/monthlyIncome)*100).toFixed(0):'—'}% of income`, color:NAVY },
                                                        { icon:<ArrowRight size={11}/>, text:`20% savings target = ${f$(monthlyIncome*0.2)} / mo`, color:TEAL },
                                                    ].map(({ icon,text,color },i) => (
                                                        <Box key={i} sx={{ display:'flex', alignItems:'flex-start', gap:0.75, p:1, borderRadius:'7px', bgcolor:alpha(color,0.05), border:`1px solid ${alpha(color,0.1)}` }}>
                                                            <Box sx={{ color, flexShrink:0, mt:0.1 }}>{icon}</Box>
                                                            <Typography sx={{ fontSize:'0.72rem', color:'#444', lineHeight:1.4 }}>{text}</Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    );
                                })()}

                                {/* ── FORECAST ── */}
                                {rightPane==='forecast' && (
                                    <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${alpha(MAROON,0.15)}`, boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}` }}>
                                        <PanelHeader icon={<Brain size={15} color="white"/>} title="Spending Forecast" subtitle="Predict future patterns with math models"/>
                                        <Box sx={{ bgcolor:'#fff', p:3 }}>
                                            <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#aaa', mb:1 }}>Forecast Model</Typography>
                                            <Box sx={{ display:'flex', gap:0.75, mb:1.5, flexWrap:'wrap' }}>
                                                {([{key:'linear',label:'Linear Regression'},{key:'moving',label:'3-Period Moving Avg'},{key:'seasonal',label:'Trend Projection'}] as const).map(({ key,label }) => (
                                                    <Box key={key} onClick={()=>setForecastModel(key)} sx={{ px:1.5, py:0.5, borderRadius:'6px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s', bgcolor:forecastModel===key?MAROON:'#f0f0f0', color:forecastModel===key?'#fff':'#555', '&:hover':{ bgcolor:forecastModel===key?MAROON_DARK:'#e5e5e5' } }}>
                                                        {label}
                                                    </Box>
                                                ))}
                                            </Box>
                                            <Box sx={{ p:1.25, borderRadius:'8px', bgcolor:alpha(NAVY,0.04), border:`1px solid ${alpha(NAVY,0.08)}`, mb:2.5 }}>
                                                <Typography sx={{ fontSize:'0.71rem', color:'#666', lineHeight:1.5 }}>
                                                    {forecastModel==='linear'?'Fits a straight trend line to your spending history.':forecastModel==='moving'?'Smooths volatility using the last 3 periods.':'Applies compound growth trend from historical data.'}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#aaa', mb:1 }}>Historical + Forecast</Typography>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <LineChart data={forecastData} margin={{top:4,right:4,left:-20,bottom:4}}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                                    <XAxis dataKey="label" tick={{fontSize:9,fill:'#aaa'}} tickLine={false}/>
                                                    <YAxis tickFormatter={v=>`$${v}`} tick={{fontSize:9,fill:'#aaa'}} tickLine={false} axisLine={false}/>
                                                    <RTooltip formatter={(v:number,name:string)=>[f$(v),name==='total'?'Actual':'Forecast']}/>
                                                    <Line type="monotone" dataKey="total" stroke={MAROON} strokeWidth={2.5} dot={{r:3,fill:MAROON}} connectNulls={false} name="Actual"/>
                                                    <Line type="monotone" dataKey="forecast" stroke={TEAL} strokeWidth={2} strokeDasharray="5 4" dot={{r:3,fill:TEAL}} connectNulls name="Forecast"/>
                                                </LineChart>
                                            </ResponsiveContainer>
                                            <Box sx={{ display:'flex', gap:2, justifyContent:'center', mt:0.75, mb:2.5 }}>
                                                {[{color:MAROON,label:'Actual'},{color:TEAL,label:'Forecast',dash:true}].map(({ color,label,dash }) => (
                                                    <Box key={label} sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                                                        <Box sx={{ width:16, height:2, bgcolor:color, borderRadius:1, ...(dash?{borderTop:`2px dashed ${color}`,borderBottom:'none',bgcolor:'transparent'}:{}) }}/>
                                                        <Typography sx={{ fontSize:'0.65rem', color:'#888' }}>{label}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                            <Divider sx={{ my:2 }}/>
                                            <Box sx={{ display:'flex', gap:1.5, mb:2 }}>
                                                {[{label:'Current Avg',value:fR(currentAvg),color:MAROON},{label:'Projected Avg',value:fR(projectedAvg),color:TEAL},{label:'Trend',value:`${trendDelta>=0?'+':''}${fR(Math.abs(trendDelta))}`,color:trendDelta>0?RED:GREEN}].map(({ label,value,color }) => (
                                                    <Box key={label} sx={{ flex:1, textAlign:'center', p:1.25, borderRadius:'8px', bgcolor:alpha(color,0.06), border:`1px solid ${alpha(color,0.12)}` }}>
                                                        <Typography sx={{ fontSize:'0.58rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color, mb:0.3 }}>{label}</Typography>
                                                        <Typography sx={{ fontSize:'0.92rem', fontWeight:800, color }}>{value}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                            <Stack spacing={0.75}>
                                                {[
                                                    { icon:trendDelta>0?<TrendingUp size={11}/>:<TrendingDown size={11}/>, text:trendDelta>0?`Spending projected to rise by ${fR(trendDelta)} / period`:`Spending projected to fall by ${fR(Math.abs(trendDelta))} / period`, color:trendDelta>0?RED:GREEN },
                                                    { icon:<DollarSign size={11}/>, text:`Projected monthly total: ~${f$(projectedAvg*(period==='daily'?30:period==='weekly'?4.33:2.17))}`, color:NAVY },
                                                    { icon:<Activity size={11}/>, text:`Based on ${chartData.slice(-8).length} ${activePeriodLabel.toLowerCase()} periods of data`, color:TEAL },
                                                ].map(({ icon,text,color },i) => (
                                                    <Box key={i} sx={{ display:'flex', alignItems:'flex-start', gap:0.75, p:1, borderRadius:'7px', bgcolor:alpha(color,0.05), border:`1px solid ${alpha(color,0.1)}` }}>
                                                        <Box sx={{ color, flexShrink:0, mt:0.1 }}>{icon}</Box>
                                                        <Typography sx={{ fontSize:'0.72rem', color:'#444', lineHeight:1.4 }}>{text}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Grow>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar open={snackOpen} autoHideDuration={5000} onClose={()=>setSnackOpen(false)} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
                <Alert onClose={()=>setSnackOpen(false)} severity={snackSev} sx={{ width:'100%', borderRadius:2 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default SpendingPage;