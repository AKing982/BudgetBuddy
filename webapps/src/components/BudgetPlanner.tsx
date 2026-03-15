import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Card, Grid, Container, alpha, Grow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Chip, LinearProgress,
    Divider, Tab, Tabs, IconButton, Paper, Stack,
} from '@mui/material';
import { Add, Edit, EditOff, Save } from '@mui/icons-material';
import {
    Wallet, Target, Sparkles, CheckCircle2, PiggyBank, ShoppingBag, Zap,
    TableIcon, TrendingUp, TrendingDown, BarChart2, AlertTriangle, Award,
    ArrowUpRight, ArrowDownRight, Calendar, PieChart,
} from 'lucide-react';
import {
    PieChart as RePieChart, Pie, Cell, Tooltip as RTooltip, Legend,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, ReferenceLine,
} from 'recharts';
import Sidebar from './Sidebar';
import ManualTemplateWizard from "./ManualTemplateWizard";

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';
const BG          = '#f0f2f5';

const CAT_COLORS: Record<string, string> = {
    Housing:        '#1D9E75',
    Food:           '#6b1a1a',
    Transportation: '#BA7517',
    Entertainment:  '#378ADD',
    Other:          '#D4537E',
};
const CHART_COLORS = ['#1D9E75','#6b1a1a','#BA7517','#378ADD','#D4537E','#7c3aed','#0ea5e9'];

const CATEGORY_GROUPS: Record<string, string> = {
    Rent:'Housing', Utilities:'Housing', Electric:'Housing', 'Gas Bill':'Housing',
    Groceries:'Food', 'Order out':'Food', 'Coffee Supplies':'Food',
    Gas:'Transportation',
    Golf:'Entertainment', Subscriptions:'Entertainment', 'Trip Cost':'Entertainment', Haircut:'Entertainment',
    Insurance:'Other', 'Phone Insurance':'Other', Payments:'Other', 'Other Stuff':'Other', Savings:'Other',
};
const GROUP_ORDER = ['Housing','Food','Transportation','Entertainment','Other'];

type PeriodType = 'Weekly' | 'Biweekly' | 'Monthly' | '2-Monthly' | '3-Monthly';
const PERIOD_TYPES: PeriodType[] = ['Weekly','Biweekly','Monthly','2-Monthly','3-Monthly'];
type TopViewMode = 'current-month' | 'classic';
type PeriodFilter = 'Weekly' | 'Biweekly' | 'Monthly';

interface SpreadsheetRow {
    label: string;
    rowType: 'expense' | 'salary' | 'expenses' | 'balance' | 'extra';
    values: (number | null)[];
}
interface MonthGroup { name: string; cols: number[]; }
interface SpreadsheetTemplate {
    id: string; name: string; periodType: PeriodType | 'standard';
    months: MonthGroup[]; periods: string[]; rows: SpreadsheetRow[];
}
interface BudgetRule {
    id: string; name: string; shortName: string; description: string;
    tagline: string; icon: React.ReactNode; color: string;
    allocations: Record<string, number>; bestFor: string;
}

const BUDGET_RULES: BudgetRule[] = [
    { id:'50-30-20', name:'50/30/20 Rule', shortName:'50/30/20', description:'Needs 50% · Wants 30% · Savings 20%', tagline:'The classic balanced approach', icon:<Target size={18}/>, color:TEAL, allocations:{Housing:35,Food:15,Transportation:10,Entertainment:10,Savings:20,Other:10}, bestFor:'Most income levels' },
    { id:'70-20-10', name:'70/20/10 Rule', shortName:'70/20/10', description:'Living 70% · Savings 20% · Giving 10%', tagline:'For the generous saver', icon:<PiggyBank size={18}/>, color:'#7c3aed', allocations:{Housing:35,Food:20,Transportation:10,Entertainment:5,Savings:20,Other:10}, bestFor:'Wealth-building focus' },
    { id:'80-20', name:'80/20 Rule', shortName:'80/20', description:'Living 80% · Savings 20%', tagline:'Simplified minimalism', icon:<Zap size={18}/>, color:AMBER, allocations:{Housing:40,Food:20,Transportation:10,Entertainment:10,Savings:20,Other:0}, bestFor:'Beginners' },
    { id:'60-20-20', name:'60/20/20 Rule', shortName:'60/20/20', description:'Committed 60% · Savings 20% · Fun 20%', tagline:'Strict essentials', icon:<ShoppingBag size={18}/>, color:MAROON, allocations:{Housing:35,Food:15,Transportation:10,Entertainment:20,Savings:20,Other:0}, bestFor:'High earners' },
    { id:'custom', name:'Custom Rule', shortName:'Custom', description:'Your own allocation mix', tagline:'Full control', icon:<Sparkles size={18}/>, color:'#0ea5e9', allocations:{Housing:30,Food:15,Transportation:10,Entertainment:10,Savings:15,Other:20}, bestFor:'Experienced budgeters' },
];

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);});
const fmt  = (n: number) => n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtS = (n: number) => n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
function addDays(d: Date, n: number){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function fmtDate(d: Date){return `${d.getMonth()+1}/${d.getDate()}`;}

function generatePeriods(type: PeriodType, start: Date, end: Date):{periods:string[];months:MonthGroup[]} {
    const periods:string[]=[], mm=new Map<string,number[]>();
    if(['Monthly','2-Monthly','3-Monthly'].includes(type)){
        const step=type==='Monthly'?1:type==='2-Monthly'?2:3;
        let cur=new Date(start.getFullYear(),start.getMonth(),1),idx=0;
        while(cur<=end){
            periods.push(cur.toLocaleString('default',{month:'short',year:'2-digit'}));
            const g=step===1?cur.toLocaleString('default',{month:'long'}):`${cur.toLocaleString('default',{month:'short'})}–${new Date(cur.getFullYear(),cur.getMonth()+step-1,1).toLocaleString('default',{month:'short',year:'2-digit'})}`;
            if(!mm.has(g))mm.set(g,[]);mm.get(g)!.push(idx++);
            cur=new Date(cur.getFullYear(),cur.getMonth()+step,1);
        }
    } else {
        const step=type==='Weekly'?7:14;
        let cur=new Date(start),idx=0;
        while(cur<=end){
            periods.push(`${fmtDate(cur)}–${fmtDate(addDays(cur,step-1))}`);
            const g=cur.toLocaleString('default',{month:'long'});
            if(!mm.has(g))mm.set(g,[]);mm.get(g)!.push(idx++);
            cur=addDays(cur,step);
        }
    }
    return{periods,months:Array.from(mm.entries()).map(([name,cols])=>({name,cols}))};
}

const DEFAULT_LABELS = ['Rent','Gas','Groceries','Insurance','Phone Insurance','Payments','Utilities','Electric','Gas Bill','Golf','Order out','Subscriptions','Trip Cost','Haircut','Other Stuff','Coffee Supplies','Savings'];
function makeBlankRows(n:number):SpreadsheetRow[]{
    const b=()=>Array(n).fill(null) as null[];
    return[...DEFAULT_LABELS.map(l=>({label:l,rowType:'expense' as const,values:b()})),{label:'Salary',rowType:'salary' as const,values:b()},{label:'Expenses',rowType:'expenses' as const,values:b()},{label:'Extra',rowType:'extra' as const,values:b()},{label:'Remaining Balance',rowType:'balance' as const,values:b()}];
}

// ── Presets ───────────────────────────────────────────────────────────────────
const SHARED_ROWS: SpreadsheetRow[] = [
    {label:'Rent',           rowType:'expense',  values:[1927.03,null,1927,null,707,1220,707,1220,707,1220,null,1917,null,1917,null]},
    {label:'Gas',            rowType:'expense',  values:[35.37,51.68,39.40,46.38,46,38.86,42,35.06,40.75,34,null,38,38,38,38]},
    {label:'Groceries',      rowType:'expense',  values:[240.09,262.72,336.99,441.57,131.87,431.20,230,374.56,362.01,175,84.84,235,278,278,278]},
    {label:'Insurance',      rowType:'expense',  values:[null,80.07,null,null,77.29,null,74.52,null,67.14,null,70.10,null,null,null,null]},
    {label:'Phone Insurance',rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Payments',       rowType:'expense',  values:[29.24,290.21,173.26,505.74,435.27,343,187.18,448.34,256,293.56,56,null,160,null,null]},
    {label:'Utilities',      rowType:'expense',  values:[null,129.93,null,123.60,null,127.71,null,null,134.30,130.78,null,127,null,null,null]},
    {label:'Electric',       rowType:'expense',  values:[120.95,null,61.77,null,null,63.89,null,52.77,null,53,null,52,null,null,null]},
    {label:'Gas Bill',       rowType:'expense',  values:[null,16.50,null,20.75,null,35.11,null,52.75,null,null,35,30,null,null,null]},
    {label:'Golf',           rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Order out',      rowType:'expense',  values:[60.06,129.37,171,110.62,100.51,96.10,null,81.64,106.44,43.21,51.32,null,null,null,null]},
    {label:'Subscriptions',  rowType:'expense',  values:[39.63,82.83,12.79,140.86,43.68,84.94,null,122.33,80.48,17.14,null,null,null,null,null]},
    {label:'Trip Cost',      rowType:'expense',  values:[null,null,null,null,30,null,null,null,null,null,null,null,null,null,null]},
    {label:'Haircut',        rowType:'expense',  values:[null,26,26,26,26,27,null,null,null,27,null,null,null,null,null]},
    {label:'Other Stuff',    rowType:'expense',  values:[9,416.05,470,424,419.14,144,417,16.20,74.14,null,null,null,null,null,null]},
    {label:'Coffee Supplies',rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Savings',        rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Salary',         rowType:'salary',   values:[2548.23,2257.57,2530.93,1991.95,2171,2272.52,1941,2028,1970,1966,1988,1988,1988,1988,1988]},
    {label:'Expenses',       rowType:'expenses', values:[2461.37,1485.36,3218.21,1839.52,2016.76,2611.81,1657.70,2403.65,1828.26,1993.69,297.26,2399,476,2233,316]},
    {label:'Extra',          rowType:'extra',    values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Remaining Balance',rowType:'balance',values:[86.86,859.07,171.79,324.22,478.46,139.17,422.47,46.82,188.56,160.87,1851.61,1440.61,2952.61,2707.61,4379.61]},
];

const SHARED_MONTHS: MonthGroup[] = [{name:'November',cols:[0,1]},{name:'December',cols:[2,3,4]},{name:'January',cols:[5,6]},{name:'February',cols:[7,8]},{name:'March',cols:[9,10,11]},{name:'April',cols:[12,13,14]}];

const NOV_MAY: SpreadsheetTemplate = {
    id:'preset-biweekly', name:'Nov 2024 – May 2025', periodType:'Biweekly',
    months:SHARED_MONTHS,
    periods:['10/23–11/5','11/6–11/19','11/20–12/3','12/4–12/17','12/18–12/31','1/1–1/14','1/15–1/28','1/29–2/11','2/12–2/25','2/26–3/11','3/12–3/25','3/26–4/8','4/8–4/22','4/23–5/6','5/7–5/20'],
    rows: SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
};

const ROLLING_TEMPLATE: SpreadsheetTemplate = {
    id:'preset-rolling', name:'Nov 2024 – May 2025 (Rolling)', periodType:'Biweekly',
    months:SHARED_MONTHS,
    periods:['10/23','11/6','11/20','12/4','12/18','1/1','1/15','1/29','2/12','2/26','3/12','3/26','4/8','4/23','5/7'],
    rows: SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
};

// ── Derived helpers ───────────────────────────────────────────────────────────
function deriveGroupTotals(t: SpreadsheetTemplate): Record<string, number[]> {
    const g: Record<string,number[]> = {};
    GROUP_ORDER.forEach(k=>{g[k]=Array(t.periods.length).fill(0);});
    t.rows.filter(r=>r.rowType==='expense').forEach(row=>{
        const grp=CATEGORY_GROUPS[row.label]??'Other';
        row.values.forEach((v,i)=>{if(v!==null)g[grp][i]+=v;});
    });
    return g;
}
function derivePeriodSummary(t: SpreadsheetTemplate) {
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const exp=t.rows.find(r=>r.label==='Expenses')?.values??[];
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    return t.periods.map((_,i)=>({
        period:t.periods[i], income:sal[i]??0, expenses:exp[i]??0, balance:bal[i]??0,
        savings:(sal[i]??0)-(exp[i]??0),
        savingsPct:sal[i]?((sal[i]!-(exp[i]??0))/sal[i]!)*100:0,
        spendPct:sal[i]?((exp[i]??0)/sal[i]!)*100:0,
    }));
}

// ── Period filter: aggregate biweekly cols into monthly ───────────────────────
function filterByPeriod(t: SpreadsheetTemplate, pf: PeriodFilter): SpreadsheetTemplate {
    if (pf !== 'Monthly') return t; // Weekly/Biweekly → show as-is
    const newPeriods = t.months.map(m => m.name);
    const newMonths: MonthGroup[] = t.months.map((m,mi) => ({name:m.name,cols:[mi]}));
    const newRows: SpreadsheetRow[] = t.rows.map(row => ({
        ...row,
        values: t.months.map(m => {
            const sum = m.cols.reduce((a,ci) => a+(row.values[ci]??0), 0);
            return sum===0 && m.cols.every(ci=>row.values[ci]===null) ? null : sum;
        }),
    }));
    // Recalc expenses & balance
    const expIdx=newRows.findIndex(r=>r.rowType==='expenses');
    const balIdx=newRows.findIndex(r=>r.rowType==='balance');
    const salIdx=newRows.findIndex(r=>r.rowType==='salary');
    if(expIdx>=0){const er=newRows.filter(r=>r.rowType==='expense');newRows[expIdx]={...newRows[expIdx],values:newRows[expIdx].values.map((_,ci)=>er.reduce((s,r)=>s+(r.values[ci]??0),0))};}
    if(balIdx>=0&&salIdx>=0){let run=0;newRows[balIdx]={...newRows[balIdx],values:newRows[balIdx].values.map((_,ci)=>{const s=newRows[salIdx].values[ci]??0;const e=expIdx>=0?newRows[expIdx].values[ci]??0:0;run=run+s-e;return run;})};}
    return{...t,periods:newPeriods,months:newMonths,rows:newRows};
}

// ── Period filter pills ───────────────────────────────────────────────────────
const PeriodPills:React.FC<{active:PeriodFilter;onChange:(p:PeriodFilter)=>void}> = ({active,onChange}) => (
    <Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:2}}>
        {(['Weekly','Biweekly','Monthly'] as PeriodFilter[]).map(p=>(
            <Box key={p} onClick={()=>onChange(p)} sx={{
                px:1.5,py:0.45,borderRadius:'20px',cursor:'pointer',
                fontSize:'0.74rem',fontWeight:700,transition:'all 0.15s',
                border:`1.5px solid ${active===p?MAROON:alpha('#000',0.1)}`,
                bgcolor:active===p?MAROON:'#fff',
                color:active===p?'#fff':SLATE,
                '&:hover':{borderColor:MAROON,color:active===p?'#fff':MAROON},
                userSelect:'none',
            }}>{p}</Box>
        ))}
    </Box>
);

// ── Table helpers ─────────────────────────────────────────────────────────────
const thSx=(extra?:object)=>({fontWeight:700,fontSize:'0.72rem',textTransform:'uppercase' as const,letterSpacing:'0.07em',color:MAROON,py:1.25,whiteSpace:'nowrap',bgcolor:alpha(MAROON,0.04),borderBottom:`2px solid ${alpha(MAROON,0.18)}`,...extra});
const tdSx=(extra?:object)=>({fontSize:'0.8rem',py:0.9,whiteSpace:'nowrap',...extra});

const Badge:React.FC<{val:number;ok:boolean}> = ({val,ok}) => (
    <Box sx={{display:'inline-flex',alignItems:'center',gap:0.3,px:0.75,py:0.2,borderRadius:'4px',bgcolor:ok?alpha(GREEN,0.1):alpha(RED,0.1),fontSize:'0.68rem',fontWeight:700,color:ok?GREEN:RED}}>
        {ok?<ArrowDownRight size={11}/>:<ArrowUpRight size={11}/>}{Math.abs(val).toFixed(1)}%
    </Box>
);

const EditCell:React.FC<{value:number|null;onChange:(v:number|null)=>void}> = ({value,onChange}) => {
    const [active,setActive]=useState(false);
    const [local,setLocal]=useState('');
    const inputRef=useRef<HTMLInputElement>(null);
    const activate=()=>{setLocal(value===null?'':String(value));setActive(true);setTimeout(()=>{if(inputRef.current){inputRef.current.focus();inputRef.current.setSelectionRange(inputRef.current.value.length,inputRef.current.value.length);}},0);};
    const commit=()=>{const n=parseFloat(local);onChange(local===''?null:isNaN(n)?null:n);setActive(false);};
    if(!active)return<Box onClick={activate} sx={{cursor:'cell',textAlign:'right',px:0.5,borderRadius:'3px',minWidth:70,'&:hover':{bgcolor:alpha(MAROON,0.06)}}}>{value!==null?`$${fmt(value)}`:''}</Box>;
    return<Box component="input" ref={inputRef} value={local} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setLocal(e.target.value)} onBlur={commit} onKeyDown={(e:React.KeyboardEvent)=>{if(e.key==='Enter'||e.key==='Tab')commit();if(e.key==='Escape')setActive(false);}} sx={{width:'100%',minWidth:70,border:`1.5px solid ${MAROON}`,borderRadius:'3px',px:0.75,py:0.25,fontSize:'0.78rem',textAlign:'right',bgcolor:'#fff',outline:'none',fontFamily:'inherit'}}/>;
};

// ── Classic Spreadsheet — fixed sticky overlap ────────────────────────────────
const ClassicSpreadsheet:React.FC<{
    template:SpreadsheetTemplate;editMode:boolean;
    onCellChange:(ri:number,ci:number,v:number|null)=>void;
    periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
}> = ({template,editMode,onCellChange,periodFilter,onPeriodFilter}) => {
    const t = useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const {months,periods,rows}=t;
    const isMonthStart=(ci:number)=>months.some(m=>m.cols[0]===ci);

    const getValColor=(row:SpreadsheetRow,val:number|null,ci:number):string=>{
        if(val===null)return'transparent';
        if(row.rowType==='balance')return val>=0?GREEN:RED;
        if(row.rowType==='expenses'){const sal=rows.find(r=>r.label==='Salary')?.values[ci];return sal&&val>sal?RED:NAVY;}
        return NAVY;
    };

    // SOLID bg colours — critical for sticky to paint over scrolled cells
    const solidBg=(rt:SpreadsheetRow['rowType'],ri:number):string=>{
        if(rt==='salary')return '#fdf4f4';
        if(rt==='balance')return '#edfaf8';
        if(rt==='expenses')return '#f8f8f8';
        return ri%2===0?'#ffffff':'#f7f8f9';
    };

    return (
        <Box>
            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
            {/* borderCollapse:separate is required so sticky cells paint cleanly */}
            <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1.5px solid ${alpha(MAROON,0.18)}`,boxShadow:`0 4px 16px ${alpha(MAROON,0.08)}`}}>
                <TableContainer sx={{overflowX:'auto'}}>
                    <Table size="small" sx={{
                        minWidth:'max-content',
                        borderCollapse:'separate',
                        borderSpacing:0,
                        '& .MuiTableCell-root':{border:'none'},
                    }}>
                        <TableHead>
                            {/* Month row */}
                            <TableRow>
                                <TableCell rowSpan={2} sx={{
                                    position:'sticky',left:0,zIndex:6,
                                    minWidth:165,
                                    // Solid gradient bg — no alpha
                                    background:'#f3ecec',
                                    borderRight:`2px solid ${alpha(MAROON,0.3)}`,
                                    borderBottom:`2px solid ${alpha(MAROON,0.18)}`,
                                    boxShadow:`3px 0 10px -2px rgba(0,0,0,0.14)`,
                                    fontWeight:800,fontSize:'0.72rem',
                                    textTransform:'uppercase',letterSpacing:'0.08em',
                                    color:MAROON,verticalAlign:'middle',px:2,
                                }}>
                                    Category
                                </TableCell>
                                {months.map(m=>(
                                    <TableCell key={m.name} colSpan={m.cols.length} align="center" sx={{
                                        fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',
                                        letterSpacing:'0.07em',color:MAROON,py:1,
                                        bgcolor:alpha(MAROON,0.05),
                                        borderLeft:`1.5px solid ${alpha(MAROON,0.2)}`,
                                        borderBottom:`1px solid ${alpha(MAROON,0.1)}`,
                                    }}>{m.name}</TableCell>
                                ))}
                                <TableCell align="right" sx={{
                                    fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',
                                    letterSpacing:'0.07em',color:NAVY,py:1,
                                    bgcolor:alpha(NAVY,0.05),
                                    borderLeft:`2px solid ${alpha(NAVY,0.2)}`,
                                    borderBottom:`1px solid ${alpha(NAVY,0.1)}`,
                                    minWidth:90,
                                }}>Total</TableCell>
                            </TableRow>
                            {/* Period sub-row */}
                            <TableRow>
                                {periods.map((p,i)=>(
                                    <TableCell key={i} align="center" sx={{
                                        fontWeight:600,fontSize:'0.69rem',color:SLATE,
                                        py:0.875,minWidth:90,
                                        bgcolor:alpha(MAROON,0.02),
                                        borderLeft:isMonthStart(i)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.05)}`,
                                        borderBottom:`2px solid ${alpha(MAROON,0.15)}`,
                                    }}>{p}</TableCell>
                                ))}
                                <TableCell sx={{
                                    bgcolor:alpha(NAVY,0.03),
                                    borderLeft:`2px solid ${alpha(NAVY,0.15)}`,
                                    borderBottom:`2px solid ${alpha(MAROON,0.15)}`,
                                }}/>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.map((row,ri)=>{
                                const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);
                                const isSection=row.rowType==='salary';
                                const isSummary=row.rowType==='expenses'||row.rowType==='balance';
                                const bg=solidBg(row.rowType,ri);
                                const canEdit=editMode&&row.rowType!=='balance'&&row.rowType!=='expenses';

                                return (
                                    <TableRow key={row.label}>
                                        {/* STICKY label cell — solid bg, high z-index, strong shadow */}
                                        <TableCell sx={{
                                            position:'sticky',left:0,zIndex:4,
                                            bgcolor:bg,
                                            borderRight:`2px solid ${alpha(MAROON,0.22)}`,
                                            borderTop:isSection?`2px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
                                            // Drop shadow facing right so data cells scroll under it
                                            boxShadow:`4px 0 10px -3px rgba(0,0,0,0.15)`,
                                            fontWeight:isSection?700:isSummary?600:400,
                                            color:row.rowType==='salary'?MAROON:row.rowType==='balance'?'#0f766e':NAVY,
                                            whiteSpace:'nowrap',fontSize:'0.8rem',px:2,
                                        }}>
                                            <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
                                                {row.rowType==='expense'&&CATEGORY_GROUPS[row.label]&&(
                                                    <Box sx={{width:3,height:14,borderRadius:'2px',bgcolor:CAT_COLORS[CATEGORY_GROUPS[row.label]]??SLATE,flexShrink:0}}/>
                                                )}
                                                {row.label}
                                            </Box>
                                        </TableCell>

                                        {/* Data cells — zIndex:1 so sticky label always paints on top */}
                                        {row.values.map((val,ci)=>(
                                            <TableCell key={ci} align="right" sx={{
                                                zIndex:1,
                                                color:getValColor(row,val,ci),
                                                bgcolor:canEdit?alpha(MAROON,0.015):bg,
                                                fontWeight:isSummary||isSection?600:400,
                                                fontSize:isSummary?'0.82rem':'0.8rem',
                                                borderLeft:isMonthStart(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
                                                borderTop:isSection?`2px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
                                                p:canEdit?0.25:undefined,
                                                fontVariantNumeric:'tabular-nums',
                                            }}>
                                                {canEdit
                                                    ?<EditCell value={val} onChange={v=>onCellChange(ri,ci,v)}/>
                                                    :val!==null?`$${fmt(val)}`:''
                                                }
                                            </TableCell>
                                        ))}

                                        {/* Row total */}
                                        <TableCell align="right" sx={{
                                            zIndex:1,
                                            fontWeight:700,
                                            fontSize:isSummary?'0.82rem':'0.8rem',
                                            color:row.rowType==='balance'?(rowTotal>=0?GREEN:RED):NAVY,
                                            bgcolor:bg,
                                            borderLeft:`2px solid ${alpha(NAVY,0.15)}`,
                                            borderTop:isSection?`2px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
                                            fontVariantNumeric:'tabular-nums',
                                        }}>
                                            {rowTotal!==0||row.values.some(v=>v!==null)?`$${fmt(rowTotal)}`:''}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

// ── Monthly Budget View ───────────────────────────────────────────────────────
const MonthlyBudgetView:React.FC<{
    template:SpreadsheetTemplate;editMode:boolean;
    onCellChange:(ri:number,ci:number,v:number|null)=>void;
    periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
}> = ({template,editMode,onCellChange,periodFilter,onPeriodFilter}) => {
    const filtered=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const [expandedPeriods,setExpandedPeriods]=useState<Set<number>>(new Set([0]));
    const [expandView,setExpandView]=useState<Record<number,'table'|'chart'>>({});
    const groupTotals=deriveGroupTotals(filtered);
    const periods=derivePeriodSummary(filtered);
    const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
    const togglePeriod=(i:number)=>setExpandedPeriods(prev=>{const s=new Set(prev);s.has(i)?s.delete(i):s.add(i);return s;});
    const toggleView=(i:number,v:'table'|'chart')=>setExpandView(prev=>({...prev,[i]:v}));
    const TTBox=({active,payload}:any)=>{if(!active||!payload?.length)return null;return<Box sx={{p:1.5,bgcolor:'#fff',borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>{payload.map((p:any,i:number)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:1,mb:0.5}}><Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:p.fill||p.stroke}}/><Typography sx={{fontSize:'0.75rem',color:NAVY}}>{p.name}: <strong>${fmtS(p.value)}</strong></Typography></Box>)}</Box>;};

    return (
        <Box>
            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
            <Box sx={{borderRadius:'12px',border:`1px solid ${alpha('#000',0.08)}`,overflow:'hidden'}}>
                <Table sx={{minWidth:650}}>
                    <TableHead>
                        <TableRow sx={{bgcolor:alpha(MAROON,0.04)}}>
                            {['Period','Category','Planned','Actual','Spend %','Save %','Savings'].map((h,i)=>(
                                <TableCell key={h} align={i>=2?'right':'left'} sx={{fontWeight:800,color:MAROON,fontSize:'0.78rem',textTransform:'uppercase',letterSpacing:'0.06em',py:1.75,px:2,whiteSpace:'nowrap'}}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                </Table>
                {periods.map((p,i)=>{
                    const isExp=expandedPeriods.has(i),isOver=p.expenses>p.income,ev=expandView[i]??'table',wSavings=p.income-p.expenses;
                    const expRows=filtered.rows.filter(r=>r.rowType==='expense');
                    return(
                        <Box key={i} sx={{borderTop:`2px solid ${alpha(MAROON,0.1)}`}}>
                            <Table sx={{minWidth:650}}><TableBody>
                                <TableRow onClick={()=>togglePeriod(i)} sx={{cursor:'pointer',bgcolor:alpha(MAROON,0.02),'&:hover':{bgcolor:alpha(MAROON,0.05)}}}>
                                    <TableCell sx={{py:1.75,px:2,width:'22%'}}>
                                        <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
                                            <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:MAROON,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.8rem'}}>{isExp?'▲':'▼'}</Box>
                                            <Typography sx={{fontWeight:800,color:MAROON,fontSize:'0.82rem'}}>{p.period}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{py:1.75,px:2}}><Typography sx={{fontSize:'0.75rem',color:SLATE,fontStyle:'italic'}}>{isExp?'Click to collapse':'Expand to see details'}</Typography></TableCell>
                                    <TableCell align="right" sx={{fontWeight:800,fontSize:'0.88rem',py:1.75,px:2,color:NAVY}}>${fmtS(p.income)}</TableCell>
                                    <TableCell align="right" sx={{fontWeight:800,fontSize:'0.88rem',py:1.75,px:2,color:isOver?RED:NAVY}}>${fmtS(p.expenses)}</TableCell>
                                    <TableCell align="right" sx={{py:1.75,px:2}}><Box sx={{px:1,py:0.35,borderRadius:'20px',bgcolor:alpha(SLATE,0.08),display:'inline-block'}}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY}}>{p.spendPct.toFixed(1)}%</Typography></Box></TableCell>
                                    <TableCell align="right" sx={{py:1.75,px:2}}><Box sx={{px:1,py:0.35,borderRadius:'20px',bgcolor:alpha(p.savingsPct>=0?GREEN:RED,0.1),display:'inline-block'}}><Typography sx={{fontSize:'0.78rem',fontWeight:800,color:p.savingsPct>=0?GREEN:RED}}>{p.savingsPct>=0?'+':''}{p.savingsPct.toFixed(1)}%</Typography></Box></TableCell>
                                    <TableCell align="right" sx={{fontWeight:800,fontSize:'0.82rem',color:wSavings>=0?GREEN:RED,py:1.75,px:2}}>${fmtS(Math.abs(wSavings))} {wSavings>=0?'under':'over'}</TableCell>
                                </TableRow>
                            </TableBody></Table>
                            {isExp&&(
                                <Box sx={{bgcolor:alpha(MAROON,0.01)}}>
                                    <Box sx={{display:'flex',alignItems:'center',justifyContent:'flex-end',px:2,py:1,borderBottom:`1px solid ${alpha('#000',0.06)}`,bgcolor:'#fff',gap:1}}>
                                        <Typography sx={{fontSize:'0.68rem',color:SLATE,mr:0.5}}>View as:</Typography>
                                        {(['table','chart'] as const).map(v=><Box key={v} onClick={()=>toggleView(i,v)} sx={{px:1.5,py:0.4,borderRadius:'7px',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,border:`1px solid ${ev===v?MAROON:alpha('#000',0.1)}`,bgcolor:ev===v?alpha(MAROON,0.08):'#fff',color:ev===v?MAROON:SLATE,transition:'all 0.15s','&:hover':{borderColor:MAROON,color:MAROON}}}>{v.charAt(0).toUpperCase()+v.slice(1)}</Box>)}
                                    </Box>
                                    {ev==='table'&&(
                                        <Table><TableBody>
                                            {GROUP_ORDER.map(grp=>{const val=groupTotals[grp][i],catPlan=Math.round(p.income*catPcts[grp]),over=val>catPlan;return(
                                                <TableRow key={grp} sx={{'&:hover':{bgcolor:alpha(CAT_COLORS[grp],0.04)},borderLeft:`3px solid ${over?RED:CAT_COLORS[grp]}`}}>
                                                    <TableCell sx={{py:1.75,px:2,width:'22%'}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:10,height:10,borderRadius:'50%',bgcolor:CAT_COLORS[grp],flexShrink:0}}/><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{grp}</Typography>{over&&<Box sx={{px:0.6,py:0.1,borderRadius:'4px',bgcolor:alpha(RED,0.1)}}><Typography sx={{fontSize:'0.6rem',fontWeight:800,color:RED}}>OVER</Typography></Box>}</Box></TableCell>
                                                    <TableCell sx={{py:1.75,px:2}}/>
                                                    <TableCell align="right" sx={{fontSize:'0.82rem',py:1.75,px:2,color:SLATE,fontVariantNumeric:'tabular-nums'}}>${fmtS(catPlan)}</TableCell>
                                                    <TableCell align="right" sx={{fontSize:'0.82rem',py:1.75,px:2,color:over?RED:NAVY,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{val>0?`$${fmtS(val)}`:'—'}</TableCell>
                                                    <TableCell align="right" sx={{fontSize:'0.82rem',py:1.75,px:2,color:SLATE}}>{catPlan>0&&val>0?(val/catPlan*100).toFixed(1)+'%':'—'}</TableCell>
                                                    <TableCell colSpan={2}/>
                                                </TableRow>
                                            );})}
                                            {editMode&&expRows.map(row=>{const val=row.values[i];return(<TableRow key={row.label} sx={{bgcolor:'#fafafa'}}><TableCell sx={{py:1,px:2,pl:5,color:SLATE,fontSize:'0.75rem'}}>{row.label}</TableCell><TableCell colSpan={6} sx={{py:0.5,px:2}}><EditCell value={val} onChange={v=>onCellChange(filtered.rows.findIndex(r=>r.label===row.label),i,v)}/></TableCell></TableRow>);})}
                                            <TableRow sx={{bgcolor:alpha(TEAL,0.03),borderTop:`1px solid ${alpha(TEAL,0.12)}`}}>
                                                <TableCell sx={{py:1.5,px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Wallet size={14} color={TEAL}/><Typography sx={{fontWeight:800,color:TEAL,fontSize:'0.78rem'}}>Account Balance</Typography></Box></TableCell>
                                                <TableCell colSpan={6} align="right" sx={{fontWeight:800,fontSize:'0.9rem',color:p.balance>=0?TEAL:RED,py:1.5,px:2,fontVariantNumeric:'tabular-nums'}}>${fmtS(p.balance)}</TableCell>
                                            </TableRow>
                                        </TableBody></Table>
                                    )}
                                    {ev==='chart'&&(
                                        <Box sx={{p:3}}><Grid container spacing={3}>
                                            <Grid item xs={12} md={5}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY,mb:1.5}}>Spending by Category</Typography><Box sx={{height:220}}><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={GROUP_ORDER.map(g=>({name:g,value:groupTotals[g][i]})).filter(d=>d.value>0)} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>{GROUP_ORDER.filter(g=>groupTotals[g][i]>0).map((g,idx)=><Cell key={idx} fill={CAT_COLORS[g]??CHART_COLORS[idx]}/>)}</Pie><RTooltip content={<TTBox/>}/></RePieChart></ResponsiveContainer></Box></Grid>
                                            <Grid item xs={12} md={7}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY,mb:1.5}}>Category Breakdown vs Budget</Typography><Box sx={{height:220}}><ResponsiveContainer width="100%" height="100%"><BarChart data={GROUP_ORDER.map(g=>({name:g,Budget:Math.round(p.income*catPcts[g]),Actual:groupTotals[g][i]}))}><CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)}/><XAxis dataKey="name" tick={{fontSize:9,fill:SLATE}}/><YAxis tick={{fontSize:9,fill:SLATE}} tickFormatter={v=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} width={40}/><RTooltip content={<TTBox/>}/><Bar dataKey="Budget" fill={alpha(TEAL,0.6)} radius={[2,2,0,0]}/><Bar dataKey="Actual" fill={MAROON} radius={[2,2,0,0]}/><Legend formatter={v=><span style={{fontSize:10,color:SLATE,fontWeight:600}}>{v}</span>}/></BarChart></ResponsiveContainer></Box></Grid>
                                        </Grid></Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

// ── Rolling Category View ─────────────────────────────────────────────────────
type RollingViewBy='category'|'period';
const RollingCategoryView:React.FC<{
    template:SpreadsheetTemplate;defaultViewBy?:RollingViewBy;
    periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
}> = ({template,defaultViewBy='category',periodFilter,onPeriodFilter}) => {
    const [viewBy,setViewBy]=useState<RollingViewBy>(defaultViewBy);
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const [expandedCats,setExpandedCats]=useState<Set<string>>(new Set());
    const [expandedPeriods,setExpandedPeriods]=useState<Set<number>>(new Set());
    const groupTotals=deriveGroupTotals(t);
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
    const toggleCat=(c:string)=>setExpandedCats(prev=>{const s=new Set(prev);s.has(c)?s.delete(c):s.add(c);return s;});
    const togglePer=(i:number)=>setExpandedPeriods(prev=>{const s=new Set(prev);s.has(i)?s.delete(i):s.add(i);return s;});
    const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);
    const CatBadge=({grp}:{grp:string})=><Box sx={{width:22,height:22,borderRadius:'5px',bgcolor:CAT_COLORS[grp],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.85)'}}/></Box>;

    // Shared sticky label sx — solid bg, strong right shadow, zIndex above data cells
    const stickyLabelSx=(bg:string,extraBorder?:string):object=>({
        position:'sticky',left:0,zIndex:4,
        bgcolor:bg,
        borderRight:`2px solid ${alpha(MAROON,0.15)}`,
        boxShadow:`4px 0 10px -3px rgba(0,0,0,0.13)`,
        borderTop:extraBorder??`1px solid ${alpha('#000',0.04)}`,
    });

    return (
        <Box>
            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:2.5}}>
                <Typography sx={{fontSize:'0.78rem',color:SLATE,fontWeight:600}}>View by:</Typography>
                {(['period','category'] as RollingViewBy[]).map(v=>(
                    <Box key={v} onClick={()=>setViewBy(v)} sx={{px:1.75,py:0.6,borderRadius:'8px',cursor:'pointer',border:`1.5px solid ${viewBy===v?NAVY:alpha('#000',0.1)}`,bgcolor:viewBy===v?'#fff':'transparent',color:viewBy===v?NAVY:SLATE,fontSize:'0.78rem',fontWeight:700,transition:'all 0.15s','&:hover':{borderColor:NAVY,color:NAVY},boxShadow:viewBy===v?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
                        {v.charAt(0).toUpperCase()+v.slice(1)}
                    </Box>
                ))}
            </Box>

            <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha('#000',0.08)}`}}>
                <TableContainer sx={{overflowX:'auto'}}>
                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>

                        {viewBy==='category'&&(<>
                            <TableHead><TableRow>
                                <TableCell sx={{...thSx(),position:'sticky',left:0,zIndex:6,minWidth:165,bgcolor:'#f3ecec',borderRight:`2px solid ${alpha(MAROON,0.25)}`,boxShadow:`4px 0 10px -3px rgba(0,0,0,0.14)`,verticalAlign:'middle',px:2}}>Category</TableCell>
                                {t.periods.map((p,i)=><TableCell key={i} align="right" sx={{...thSx({minWidth:72,fontWeight:600,color:SLATE,bgcolor:alpha(MAROON,0.02),borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`})}}>{p}</TableCell>)}
                                <TableCell align="right" sx={{...thSx({borderLeft:`2px solid ${alpha(NAVY,0.15)}`,color:NAVY,bgcolor:alpha(NAVY,0.04),minWidth:80})}}>Total</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                                {GROUP_ORDER.map(grp=>{
                                    const vals=groupTotals[grp],total=vals.reduce((a,v)=>a+v,0),isExp=expandedCats.has(grp),color=CAT_COLORS[grp];
                                    const subRows=t.rows.filter(r=>r.rowType==='expense'&&(CATEGORY_GROUPS[r.label]??'Other')===grp);
                                    return(<React.Fragment key={grp}>
                                        <TableRow hover onClick={()=>toggleCat(grp)} sx={{cursor:'pointer',bgcolor:isExp?alpha(color,0.04):'#fff'}}>
                                            <TableCell sx={{...stickyLabelSx(isExp?alpha(color,0.04):'#fff'),px:2}}>
                                                <Box sx={{display:'flex',alignItems:'center',gap:1}}><CatBadge grp={grp}/><Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:color,flexShrink:0}}/><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{grp}</Typography></Box>
                                            </TableCell>
                                            {vals.map((v,i)=>{const planned=Math.round((sal[i]??0)*catPcts[grp]),over=v>planned&&planned>0;return<TableCell key={i} align="right" sx={{...tdSx({color:over?RED:v>0?NAVY:alpha('#000',0.2),fontWeight:over?700:400,zIndex:1,bgcolor:isExp?alpha(color,0.04):'#fff',borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{v>0?`$${fmtS(v)}`:'—'}</TableCell>;})}
                                            <TableCell align="right" sx={{...tdSx({fontWeight:700,color:NAVY,zIndex:1,bgcolor:isExp?alpha(color,0.04):'#fff',borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>${fmtS(total)}</TableCell>
                                        </TableRow>
                                        {isExp&&subRows.map(row=>{const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);return(
                                            <TableRow key={row.label} sx={{bgcolor:'#fafafa'}}>
                                                <TableCell sx={{...stickyLabelSx('#fafafa'),pl:5,color:SLATE,fontSize:'0.75rem',px:2}}>{row.label}</TableCell>
                                                {row.values.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({color:v!==null?NAVY:alpha('#000',0.15),fontSize:'0.75rem',zIndex:1,bgcolor:'#fafafa',borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
                                                <TableCell align="right" sx={{...tdSx({fontWeight:600,color:NAVY,fontSize:'0.75rem',zIndex:1,bgcolor:'#fafafa',borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{rowTotal>0?`$${fmtS(rowTotal)}`:''}</TableCell>
                                            </TableRow>
                                        );})}
                                    </React.Fragment>);
                                })}
                                <TableRow sx={{'& .MuiTableCell-root':{borderTop:`2px solid ${alpha(NAVY,0.12)}`}}}>
                                    <TableCell sx={{...stickyLabelSx('#fff',`2px solid ${alpha(NAVY,0.12)}`),fontWeight:600,color:NAVY,px:2}}>Income (salary)</TableCell>
                                    {sal.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({fontWeight:500,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
                                    <TableCell align="right" sx={{...tdSx({fontWeight:700,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:`2px solid ${alpha(NAVY,0.15)}`})}}>${fmtS(sal.reduce((a:number,v)=>a+(v??0),0))}</TableCell>
                                </TableRow>
                                <TableRow sx={{bgcolor:alpha(TEAL,0.05)}}>
                                    <TableCell sx={{...stickyLabelSx(alpha(TEAL,0.05)),fontWeight:700,color:'#0f766e',px:2}}>Balance</TableCell>
                                    {bal.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({fontWeight:600,color:v!==null&&v>=0?'#0f766e':RED,zIndex:1,bgcolor:alpha(TEAL,0.05),borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
                                    <TableCell sx={{zIndex:1,bgcolor:alpha(TEAL,0.05),borderLeft:`2px solid ${alpha(NAVY,0.15)}`}}/>
                                </TableRow>
                            </TableBody>
                        </>)}

                        {viewBy==='period'&&(<>
                            <TableHead><TableRow>
                                <TableCell sx={{...thSx(),position:'sticky',left:0,zIndex:6,minWidth:150,bgcolor:'#f3ecec',borderRight:`2px solid ${alpha(MAROON,0.25)}`,boxShadow:`4px 0 10px -3px rgba(0,0,0,0.14)`,px:2}}>Period</TableCell>
                                {['Income','Actual','Spend %','Save %','Savings','Balance'].map(h=><TableCell key={h} align="right" sx={{...thSx({minWidth:88})}}>{h}</TableCell>)}
                            </TableRow></TableHead>
                            <TableBody>
                                {t.periods.map((period,i)=>{
                                    const income=sal[i]??0,expRow=t.rows.find(r=>r.rowType==='expenses'),expenses=expRow?.values[i]??0,balance=bal[i]??0,savings=income-expenses,savingsPct=income>0?(savings/income)*100:0,spendPct=income>0?(expenses/income)*100:0,isOver=expenses>income,isExp=expandedPeriods.has(i);
                                    return(<React.Fragment key={i}>
                                        <TableRow hover onClick={()=>togglePer(i)} sx={{cursor:'pointer',bgcolor:isExp?alpha(MAROON,0.03):'#fff'}}>
                                            <TableCell sx={{...stickyLabelSx(isExp?alpha(MAROON,0.03):'#fff'),px:2}}>
                                                <Box sx={{display:'flex',alignItems:'center',gap:1}}><Box sx={{width:20,height:20,borderRadius:'4px',bgcolor:MAROON,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',flexShrink:0}}>{isExp?'▲':'▼'}</Box><Typography sx={{fontSize:'0.82rem',fontWeight:600,color:NAVY}}>{period}</Typography></Box>
                                            </TableCell>
                                            <TableCell align="right" sx={tdSx({color:NAVY,fontWeight:500,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{income>0?`$${fmtS(income)}`:'—'}</TableCell>
                                            <TableCell align="right" sx={tdSx({color:isOver?RED:NAVY,fontWeight:isOver?700:500,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{expenses>0?`$${fmtS(expenses)}`:'—'}</TableCell>
                                            <TableCell align="right" sx={tdSx({color:SLATE,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{income>0?`${spendPct.toFixed(1)}%`:'—'}</TableCell>
                                            <TableCell align="right" sx={{zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`}}><Badge val={savingsPct} ok={savingsPct>=0}/></TableCell>
                                            <TableCell align="right" sx={tdSx({color:savings>=0?GREEN:RED,fontWeight:600,fontSize:'0.75rem',zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{income>0?(savings>=0?`$${fmtS(savings)} under`:`$${fmtS(-savings)} over`):'—'}</TableCell>
                                            <TableCell align="right" sx={tdSx({color:balance>=0?'#0f766e':RED,fontWeight:700,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{balance!==0?`$${fmtS(balance)}`:'—'}</TableCell>
                                        </TableRow>
                                        {isExp&&GROUP_ORDER.map(grp=>{const val=groupTotals[grp][i],catPlan=Math.round(income*catPcts[grp]),over=val>catPlan;return(
                                            <TableRow key={grp} sx={{bgcolor:'#fafafa'}}>
                                                <TableCell sx={{...stickyLabelSx('#fafafa'),pl:5,px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:8,height:8,borderRadius:'2px',bgcolor:CAT_COLORS[grp],flexShrink:0}}/><Typography sx={{fontSize:'0.75rem',color:SLATE}}>{grp}</Typography>{over&&<Box sx={{px:0.5,py:0.1,borderRadius:'3px',bgcolor:alpha(RED,0.1),fontSize:'0.6rem',fontWeight:800,color:RED}}>OVER</Box>}</Box></TableCell>
                                                <TableCell colSpan={2} align="right" sx={tdSx({color:SLATE,fontSize:'0.72rem',zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`})}>${fmtS(catPlan)}</TableCell>
                                                <TableCell align="right" sx={tdSx({color:over?RED:NAVY,fontWeight:over?600:400,zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{val>0?`$${fmtS(val)}`:'—'}</TableCell>
                                                <TableCell align="right" sx={tdSx({color:SLATE,fontSize:'0.72rem',zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{catPlan>0&&val>0?(val/catPlan*100).toFixed(1)+'%':'—'}</TableCell>
                                                <TableCell colSpan={2} sx={{zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`}}/>
                                            </TableRow>
                                        );})}
                                        {isExp&&<TableRow sx={{bgcolor:alpha(TEAL,0.04)}}><TableCell sx={{...stickyLabelSx(alpha(TEAL,0.04)),pl:5,fontWeight:600,color:'#0f766e',fontSize:'0.75rem',px:2}}>Account balance</TableCell><TableCell colSpan={6} align="right" sx={tdSx({fontWeight:700,color:'#0f766e',zIndex:1,bgcolor:alpha(TEAL,0.04)})}>${fmtS(balance)}</TableCell></TableRow>}
                                    </React.Fragment>);
                                })}
                            </TableBody>
                        </>)}
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

// ── Visual Analytics ──────────────────────────────────────────────────────────
const VisualView:React.FC<{template:SpreadsheetTemplate}> = ({template}) => {
    const [tab,setTab]=useState(0);
    const gt=deriveGroupTotals(template),ps=derivePeriodSummary(template);
    const ti=template.rows.find(r=>r.label==='Salary')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const te=template.rows.find(r=>r.label==='Expenses')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const fb=template.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null).slice(-1)[0]??0;
    const sr=ti>0?((ti-te)/ti)*100:0,ai=ti/(template.periods.length||1),ae=te/(template.periods.length||1),bu=ti>0?(te/ti)*100:0,pc=bu>100?RED:bu>85?AMBER:TEAL;
    const pie=GROUP_ORDER.map(g=>({name:g,value:Object.values(gt[g]).reduce((a,b)=>a+b,0)})).filter(d=>d.value>0);
    const bar=ps.map(p=>({name:p.period.split('–')[0],Income:Math.round(p.income),Expenses:Math.round(p.expenses)}));
    const trend=ps.map(p=>({name:p.period.split('–')[0],Balance:Math.round(p.balance)}));
    const top=template.rows.filter(r=>r.rowType==='expense').map(r=>({name:r.label,total:r.values.reduce((a:number,v)=>a+(v??0),0)})).sort((a,b)=>b.total-a.total).filter(c=>c.total>0).slice(0,6);
    const tt=top.reduce((a,c)=>a+c.total,0);
    const over=ps.filter(p=>p.expenses>p.income);
    const best=ps.reduce((a,b)=>b.savingsPct>a.savingsPct?b:a,ps[0]);
    const worst=ps.reduce((a,b)=>b.savingsPct<a.savingsPct?b:a,ps[0]);
    const TTB=({active,payload}:any)=>{if(!active||!payload?.length)return null;return<Box sx={{p:1.5,bgcolor:'#fff',borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>{payload.map((p:any,i:number)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:1,mb:0.5}}><Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:p.fill||p.stroke}}/><Typography sx={{fontSize:'0.75rem',color:NAVY}}>{p.name}: <strong>${fmtS(p.value)}</strong></Typography></Box>)}</Box>;};
    const kpi=[{l:'Avg Income / Period',v:`$${fmtS(ai)}`,c:NAVY,b:'#f0f4ff'},{l:'Avg Expenses / Period',v:`$${fmtS(ae)}`,c:MAROON,b:'#fff1f2'},{l:'Cumulative Balance',v:`$${fmtS(fb)}`,c:fb>=0?GREEN:RED,b:fb>=0?'#f0fdf4':'#fff1f2'},{l:'Avg Savings Rate',v:`${sr>=0?'+':''}${sr.toFixed(1)}%`,c:sr>=0?GREEN:RED,b:sr>=0?'#f0f9ff':'#fff1f2'}];
    return(
        <Box>
            <Grid container spacing={2} sx={{mb:3}}>{kpi.map(({l,v,c,b})=><Grid item xs={12} sm={6} md={3} key={l}><Box sx={{background:b,borderRadius:'10px',borderTop:`3px solid ${c}`,boxShadow:'0 2px 12px rgba(0,0,0,0.10)',p:2.5,transition:'box-shadow 0.2s','&:hover':{boxShadow:'0 6px 20px rgba(0,0,0,0.14)'}}}><Typography sx={{fontSize:'0.67rem',textTransform:'uppercase',letterSpacing:'0.1em',color:alpha(c,0.7),fontWeight:700,mb:1}}>{l}</Typography><Typography sx={{fontSize:'1.65rem',fontWeight:800,color:c,fontVariantNumeric:'tabular-nums',lineHeight:1,mb:0.5}}>{v}</Typography><LinearProgress variant="determinate" value={100} sx={{my:1,height:4,borderRadius:2,bgcolor:alpha(c,0.15),'& .MuiLinearProgress-bar':{bgcolor:c,borderRadius:2}}}/></Box></Grid>)}</Grid>
            <Box sx={{mb:3,p:2,borderRadius:'10px',bgcolor:'#fff',border:`1px solid ${alpha('#000',0.07)}`}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.75}}><Typography sx={{fontSize:'0.78rem',fontWeight:600,color:SLATE}}>Budget utilization across all periods</Typography><Typography sx={{fontSize:'0.78rem',fontWeight:800,color:pc}}>{bu.toFixed(1)}%</Typography></Box><LinearProgress variant="determinate" value={Math.min(bu,100)} sx={{height:6,borderRadius:3,bgcolor:alpha(pc,0.15),'& .MuiLinearProgress-bar':{bgcolor:pc,borderRadius:3}}}/></Box>
            <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}`}}>
                <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)`,px:3,py:2,position:'relative',overflow:'hidden'}}><Box sx={{position:'absolute',top:-16,right:-16,width:80,height:80,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)'}}/><Box sx={{display:'flex',alignItems:'center',gap:1.25,position:'relative'}}><Box sx={{width:30,height:30,borderRadius:'8px',bgcolor:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><BarChart2 size={15} color="white"/></Box><Box><Typography sx={{fontWeight:800,fontSize:'0.92rem',color:'#fff'}}>Budget Analytics</Typography><Typography sx={{fontSize:'0.67rem',color:'rgba(255,255,255,0.7)'}}>Deep insights for {template.name}</Typography></Box></Box></Box>
                <Box sx={{bgcolor:'#fff',borderBottom:`1px solid ${alpha('#000',0.07)}`}}><Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{'& .MuiTab-root':{minWidth:0,flex:1,fontSize:'0.75rem',fontWeight:700,textTransform:'none',py:1.25,color:SLATE},'& .Mui-selected':{color:MAROON},'& .MuiTabs-indicator':{bgcolor:MAROON}}}><Tab label="Overview"/><Tab label="Spending"/><Tab label="Trends"/><Tab label="Insights"/></Tabs></Box>
                <Box sx={{bgcolor:'#fff',p:3}}>
                    {tab===0&&<Box>{over.length>0&&<Box sx={{p:2,borderRadius:'10px',bgcolor:alpha(RED,0.05),border:`1px solid ${alpha(RED,0.15)}`,mb:2.5}}><Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:1}}><AlertTriangle size={14} color={RED}/><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:RED}}>{over.length} period{over.length>1?'s':''} over budget</Typography></Box>{over.slice(0,3).map(p=><Box key={p.period} sx={{display:'flex',justifyContent:'space-between',mb:0.5}}><Typography sx={{fontSize:'0.72rem',color:SLATE}}>{p.period}</Typography><Typography sx={{fontSize:'0.72rem',fontWeight:700,color:RED}}>+${fmtS(p.expenses-p.income)} over</Typography></Box>)}</Box>}<Grid container spacing={2}>{best&&<Grid item xs={6}><Box sx={{p:1.5,borderRadius:'10px',bgcolor:alpha(GREEN,0.06),border:`1px solid ${alpha(GREEN,0.15)}`}}><Typography sx={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:GREEN,mb:0.4}}>Best Period</Typography><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{best.period}</Typography><Typography sx={{fontSize:'0.75rem',color:GREEN,fontWeight:600}}>+{best.savingsPct.toFixed(1)}% saved</Typography></Box></Grid>}{worst&&<Grid item xs={6}><Box sx={{p:1.5,borderRadius:'10px',bgcolor:alpha(RED,0.06),border:`1px solid ${alpha(RED,0.15)}`}}><Typography sx={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:RED,mb:0.4}}>Toughest Period</Typography><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{worst.period}</Typography><Typography sx={{fontSize:'0.75rem',color:RED,fontWeight:600}}>{worst.savingsPct.toFixed(1)}% saved</Typography></Box></Grid>}</Grid></Box>}
                    {tab===1&&<Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:2}}>Spending by category group</Typography><Box sx={{height:220,mb:3}}><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={pie} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} labelLine={false} label={({percent})=>`${(percent*100).toFixed(0)}%`}>{pie.map((d,i)=><Cell key={i} fill={CAT_COLORS[d.name]??CHART_COLORS[i]}/>)}</Pie><RTooltip content={<TTB/>}/></RePieChart></ResponsiveContainer></Box>{pie.map((d,i)=>{const ta=pie.reduce((a,x)=>a+x.value,0),p2=ta>0?d.value/ta*100:0,col=CAT_COLORS[d.name]??CHART_COLORS[i];return<Box key={d.name} sx={{mb:1.5}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.5}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:8,height:8,borderRadius:'2px',bgcolor:col}}/><Typography sx={{fontSize:'0.78rem',color:NAVY}}>{d.name}</Typography></Box><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY}}>${fmtS(d.value)}</Typography></Box><Box sx={{height:4,borderRadius:2,bgcolor:alpha(col,0.15)}}><Box sx={{height:'100%',borderRadius:2,bgcolor:col,width:`${p2}%`}}/></Box></Box>;})} <Divider sx={{my:2.5}}/><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Top individual expenses</Typography>{top.map((c,i)=>{const p2=tt>0?c.total/tt*100:0;return<Box key={c.name} sx={{display:'flex',alignItems:'center',gap:1.5,mb:1.25}}><Typography sx={{fontSize:'0.72rem',color:SLATE,minWidth:16,textAlign:'right'}}>{i+1}</Typography><Box sx={{flex:1}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.4}}><Typography sx={{fontSize:'0.75rem',color:NAVY,fontWeight:600}}>{c.name}</Typography><Typography sx={{fontSize:'0.75rem',fontWeight:700,color:NAVY}}>${fmtS(c.total)}</Typography></Box><LinearProgress variant="determinate" value={p2} sx={{height:3,borderRadius:2,bgcolor:alpha(MAROON,0.12),'& .MuiLinearProgress-bar':{bgcolor:MAROON,borderRadius:2}}}/></Box></Box>;})}</Box>}
                    {tab===2&&<Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Income vs Expenses by period</Typography><Box sx={{height:200,mb:3}}><ResponsiveContainer width="100%" height="100%"><BarChart data={bar} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)}/><XAxis dataKey="name" tick={{fontSize:9,fill:SLATE}} interval={Math.floor(bar.length/6)}/><YAxis tick={{fontSize:9,fill:SLATE}} tickFormatter={v=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} width={40}/><RTooltip content={<TTB/>}/><Bar dataKey="Income" fill={alpha(TEAL,0.7)} radius={[2,2,0,0]}/><Bar dataKey="Expenses" fill={MAROON} radius={[2,2,0,0]}/><Legend formatter={v=><span style={{fontSize:10,color:SLATE,fontWeight:600}}>{v}</span>}/></BarChart></ResponsiveContainer></Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Running balance trend</Typography><Box sx={{height:180}}><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)}/><XAxis dataKey="name" tick={{fontSize:9,fill:SLATE}} interval={Math.floor(trend.length/6)}/><YAxis tick={{fontSize:9,fill:SLATE}} tickFormatter={v=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} width={40}/><RTooltip content={<TTB/>}/><ReferenceLine y={0} stroke={RED} strokeDasharray="4 2" strokeWidth={1}/><Line type="monotone" dataKey="Balance" stroke={TEAL} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></Box></Box>}
                    {tab===3&&<Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Period-by-period summary</Typography>{ps.map((p,i)=><Box key={i} sx={{mb:1.5,p:1.75,borderRadius:'10px',bgcolor:'#fff',border:`1px solid ${alpha('#000',0.07)}`}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{p.period}</Typography><Badge val={p.savingsPct} ok={p.savingsPct>=0}/></Box><Box sx={{display:'flex',gap:1.5}}>{[{l:'Income',v:`$${fmtS(p.income)}`,c:NAVY},{l:'Spent',v:`$${fmtS(p.expenses)}`,c:p.expenses>p.income?RED:MAROON},{l:'Saved',v:`$${fmtS(Math.max(0,p.savings))}`,c:GREEN}].map(({l,v,c})=><Box key={l} sx={{flex:1}}><Typography sx={{fontSize:'0.62rem',color:SLATE,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>{l}</Typography><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:c,fontVariantNumeric:'tabular-nums'}}>{v}</Typography></Box>)}</Box><LinearProgress variant="determinate" value={Math.min(p.spendPct,100)} sx={{mt:1,height:3,borderRadius:2,bgcolor:alpha(p.expenses>p.income?RED:TEAL,0.15),'& .MuiLinearProgress-bar':{bgcolor:p.expenses>p.income?RED:TEAL,borderRadius:2}}}/></Box>)}</Box>}
                </Box>
            </Box>
        </Box>
    );
};

// ── Savings Side Panel (tabbed: Weekly tracker / Improve / Breakdown) ─────────
const SavingsSidePanel:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter}> = ({template,periodFilter}) => {
    const [tab,setTab]=useState<'tracker'|'improve'|'breakdown'>('tracker');
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const expRow=t.rows.find(r=>r.rowType==='expenses');
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    const gt=deriveGroupTotals(t);
    const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};

    // Per-period savings
    const periods=t.periods.map((_,i)=>{
        const income=sal[i]??0;
        const expenses=expRow?.values[i]??0;
        const saved=income-expenses;
        const goalPct=0.226; // 22.6% target
        const goal=Math.round(income*goalPct);
        const met=saved>=goal;
        const pct=goal>0?Math.min((saved/goal)*100,120):0;
        return{period:t.periods[i],income,expenses,saved,goal,met,pct,surplus:saved-goal};
    }).filter(p=>p.income>0);

    const totalSaved=periods.reduce((a,p)=>a+Math.max(0,p.saved),0);
    const totalGoal=periods.reduce((a,p)=>a+p.goal,0);
    const monthlyPct=totalGoal>0?(totalSaved/totalGoal)*100:0;
    const metCount=periods.filter(p=>p.met).length;

    // Breakdown
    const totalIncome=sal.reduce((a:number,v)=>a+(v??0),0);
    const catTotals=GROUP_ORDER.map(g=>({name:g,val:Object.values(gt[g]).reduce((a,b)=>a+b,0),color:CAT_COLORS[g]}));
    const totalSpent=catTotals.reduce((a,c)=>a+c.val,0);
    const totalSpentAll=(expRow?.values??[]).reduce((a:number,v)=>a+(v??0),0);
    const optimized=totalSpentAll*0.96;

    const tabs:Array<{key:'tracker'|'improve'|'breakdown';label:string}> = [
        {key:'tracker',label:'Weekly tracker'},
        {key:'improve',label:'Improve'},
        {key:'breakdown',label:'Breakdown'},
    ];

    const improvItems=[
        {icon:'↑',cls:'danger',title:'Dining out over target',desc:'Order out exceeded $40 target in some periods. Cap at $45/period to protect savings.',amt:'-$42',color:RED},
        {icon:'!',cls:'warn',title:'Groceries over budget',desc:'Food spending above optimized target. Meal planning could recover ~$50/month.',amt:'-$50',color:AMBER},
        {icon:'↗',cls:'info',title:'Surplus reallocation',desc:'Periods that beat goal generated surplus. Route to emergency fund or investments.',amt:'+$491',color:GREEN},
        {icon:'~',cls:'warn',title:'Untracked "Other" spend',desc:'Breaking out miscellaneous spend could reveal $30–60 of cuttable expenses.',amt:'review',color:SLATE},
        {icon:'★',cls:'info',title:'Raise savings goal to 25%',desc:`You're at ${((totalSaved/totalIncome)*100).toFixed(1)}% — just a little more to hit the recommended 25%.`,amt:'+$51/wk',color:GREEN},
    ];

    return (
        <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}`,display:'flex',flexDirection:'column'}}>
            {/* Maroon header with tabs */}
            <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 60%,#5a1515 100%)`,position:'relative',overflow:'hidden'}}>
                <Box sx={{position:'absolute',top:-18,right:-18,width:70,height:70,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.05)'}}/>
                <Box sx={{display:'flex',alignItems:'center',gap:1.25,px:3,pt:2,pb:0,position:'relative'}}>
                    <Box sx={{width:26,height:26,borderRadius:'7px',bgcolor:'rgba(255,255,255,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Award size={13} color="white"/>
                    </Box>
                    <Box>
                        <Typography sx={{fontWeight:700,fontSize:'0.88rem',color:'#fff'}}>Savings tracker &amp; insights</Typography>
                        <Typography sx={{fontSize:'0.65rem',color:'rgba(255,255,255,0.6)',mt:0.25}}>Weekly goals · monthly target · tips</Typography>
                    </Box>
                </Box>
                {/* Tabs */}
                <Box sx={{display:'flex',px:2,mt:1.25,position:'relative',zIndex:1}}>
                    {tabs.map(({key,label})=>(
                        <Box key={key} onClick={()=>setTab(key)} sx={{
                            px:1.5,py:0.875,fontSize:'0.75rem',fontWeight:600,cursor:'pointer',
                            color:tab===key?'#fff':'rgba(255,255,255,0.5)',
                            borderBottom:`2px solid ${tab===key?'#fff':'transparent'}`,
                            transition:'all 0.15s',whiteSpace:'nowrap',
                            '&:hover':{color:'rgba(255,255,255,0.85)'},
                        }}>{label}</Box>
                    ))}
                </Box>
            </Box>

            {/* Tab body */}
            <Box sx={{bgcolor:'#fff',p:2.5,flex:1}}>

                {/* ── Weekly tracker tab ── */}
                {tab==='tracker'&&(
                    <Box>
                        <Box sx={{display:'flex',flexDirection:'column',gap:1.25,mb:2}}>
                            {periods.map((p,i)=>(
                                <Box key={i} sx={{border:`0.5px solid ${alpha('#000',0.08)}`,borderRadius:'8px',borderLeft:`3px solid ${p.met?GREEN:RED}`,p:1.5}}>
                                    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.875}}>
                                        <Typography sx={{fontSize:'0.78rem',fontWeight:600,color:NAVY}}>{p.period}</Typography>
                                        <Box sx={{px:0.75,py:0.2,borderRadius:'4px',bgcolor:p.met?alpha(GREEN,0.1):alpha(RED,0.1),fontSize:'0.65rem',fontWeight:700,color:p.met?GREEN:RED}}>
                                            {p.met?'Goal met ✓':'Goal missed ✗'}
                                        </Box>
                                    </Box>
                                    <Box sx={{height:4,borderRadius:2,bgcolor:alpha('#000',0.06),mb:0.875,overflow:'hidden'}}>
                                        <Box sx={{height:'100%',borderRadius:2,bgcolor:p.met?GREEN:RED,width:`${Math.min(p.pct,100)}%`,transition:'width 0.3s'}}/>
                                    </Box>
                                    <Box sx={{display:'flex',gap:1.5,fontSize:'0.7rem',color:SLATE}}>
                                        <span><strong style={{color:NAVY}}>${fmtS(p.saved)}</strong> saved</span>
                                        <span>Goal <strong style={{color:NAVY}}>${fmtS(p.goal)}</strong></span>
                                        <span style={{color:p.surplus>=0?GREEN:RED,fontWeight:600}}>{p.surplus>=0?'+':''}{fmtS(p.surplus)}</span>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                        {/* Monthly goal box */}
                        <Box sx={{border:`0.5px solid ${alpha(TEAL,0.35)}`,borderRadius:'10px',p:1.75,bgcolor:alpha(TEAL,0.04)}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}>
                                <Typography sx={{fontSize:'0.78rem',fontWeight:600,color:TEAL}}>Monthly savings goal</Typography>
                                <Box sx={{px:0.75,py:0.2,borderRadius:'4px',bgcolor:alpha(GREEN,0.1),fontSize:'0.65rem',fontWeight:700,color:GREEN}}>
                                    {metCount}/{periods.length} weeks met
                                </Box>
                            </Box>
                            <Box sx={{height:7,borderRadius:4,bgcolor:alpha(TEAL,0.15),mb:1,overflow:'hidden'}}>
                                <Box sx={{height:'100%',borderRadius:4,bgcolor:TEAL,width:`${Math.min(monthlyPct,100)}%`}}/>
                            </Box>
                            <Box sx={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:SLATE}}>
                                <span>Saved <strong style={{color:TEAL}}>${fmtS(totalSaved)}</strong></span>
                                <span>Goal <strong style={{color:TEAL}}>${fmtS(totalGoal)}</strong></span>
                                <span>{monthlyPct.toFixed(1)}%</span>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* ── Improve tab ── */}
                {tab==='improve'&&(
                    <Box sx={{display:'flex',flexDirection:'column',gap:1}}>
                        {improvItems.map((item,i)=>(
                            <Box key={i} sx={{display:'flex',alignItems:'flex-start',gap:1.25,p:1.25,borderRadius:'8px',bgcolor:alpha('#000',0.02),border:`0.5px solid ${alpha('#000',0.07)}`}}>
                                <Box sx={{
                                    width:22,height:22,borderRadius:'5px',
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    flexShrink:0,fontSize:'11px',fontWeight:700,
                                    bgcolor:item.cls==='danger'?alpha(RED,0.1):item.cls==='info'?alpha(GREEN,0.1):alpha(AMBER,0.12),
                                    color:item.cls==='danger'?RED:item.cls==='info'?GREEN:AMBER,
                                }}>{item.icon}</Box>
                                <Box sx={{flex:1,minWidth:0}}>
                                    <Typography sx={{fontSize:'0.75rem',fontWeight:600,color:NAVY,mb:0.3}}>{item.title}</Typography>
                                    <Typography sx={{fontSize:'0.68rem',color:SLATE,lineHeight:1.45}}>{item.desc}</Typography>
                                </Box>
                                <Typography sx={{fontSize:'0.73rem',fontWeight:600,color:item.color,whiteSpace:'nowrap',flexShrink:0}}>{item.amt}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* ── Breakdown tab ── */}
                {tab==='breakdown'&&(
                    <Box>
                        <Typography sx={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:SLATE,mb:1.25,fontWeight:600}}>Monthly spend by category</Typography>
                        <Box sx={{display:'flex',flexDirection:'column',gap:1,mb:2}}>
                            {catTotals.map(({name,val,color})=>{
                                const pct=totalIncome>0?(val/totalIncome)*100:0;
                                const barPct=totalIncome>0?Math.min((val/totalIncome)*100*4,100):0;
                                return(
                                    <Box key={name} sx={{display:'flex',alignItems:'center',gap:1.25}}>
                                        <Box sx={{fontSize:'0.72rem',color:NAVY,fontWeight:500,minWidth:88}}>{name}</Box>
                                        <Box sx={{flex:1,height:6,borderRadius:3,bgcolor:alpha('#000',0.06),overflow:'hidden'}}>
                                            <Box sx={{height:'100%',borderRadius:3,bgcolor:color,width:`${barPct}%`}}/>
                                        </Box>
                                        <Typography sx={{fontSize:'0.72rem',color:NAVY,fontVariantNumeric:'tabular-nums',minWidth:40,textAlign:'right'}}>${fmtS(val)}</Typography>
                                        <Typography sx={{fontSize:'0.68rem',color:SLATE,minWidth:34,textAlign:'right'}}>{pct.toFixed(1)}%</Typography>
                                    </Box>
                                );
                            })}
                            <Box sx={{display:'flex',alignItems:'center',gap:1.25}}>
                                <Box sx={{fontSize:'0.72rem',color:GREEN,fontWeight:600,minWidth:88}}>Saved</Box>
                                <Box sx={{flex:1,height:6,borderRadius:3,bgcolor:alpha('#000',0.06),overflow:'hidden'}}>
                                    <Box sx={{height:'100%',borderRadius:3,bgcolor:GREEN,width:`${Math.min((totalSaved/totalIncome)*100*4,100)}%`}}/>
                                </Box>
                                <Typography sx={{fontSize:'0.72rem',color:GREEN,fontWeight:600,fontVariantNumeric:'tabular-nums',minWidth:40,textAlign:'right'}}>${fmtS(totalSaved)}</Typography>
                                <Typography sx={{fontSize:'0.68rem',color:GREEN,minWidth:34,textAlign:'right'}}>{totalIncome>0?((totalSaved/totalIncome)*100).toFixed(1):0}%</Typography>
                            </Box>
                        </Box>
                        <Box sx={{height:'0.5px',bgcolor:alpha('#000',0.08),mb:1.75}}/>
                        <Typography sx={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:SLATE,mb:1.25,fontWeight:600}}>Optimized vs actual</Typography>
                        <Box sx={{display:'flex',flexDirection:'column',gap:0.875,mb:1.5}}>
                            {[
                                {label:'Optimized budget',val:optimized,color:TEAL},
                                {label:'Actual spend',val:totalSpentAll,color:MAROON},
                            ].map(({label,val,color})=>(
                                <Box key={label} sx={{display:'flex',alignItems:'center',gap:1.25}}>
                                    <Typography sx={{fontSize:'0.7rem',color:SLATE,minWidth:100}}>{label}</Typography>
                                    <Box sx={{flex:1,height:6,borderRadius:3,bgcolor:alpha('#000',0.06),overflow:'hidden'}}>
                                        <Box sx={{height:'100%',borderRadius:3,bgcolor:color,width:`${Math.min((val/totalIncome)*100*4,100)}%`}}/>
                                    </Box>
                                    <Typography sx={{fontSize:'0.72rem',fontWeight:600,color,fontVariantNumeric:'tabular-nums',minWidth:52,textAlign:'right'}}>${fmtS(val)}</Typography>
                                </Box>
                            ))}
                        </Box>
                        {totalSpentAll>optimized&&(
                            <Box sx={{p:1.25,borderRadius:'8px',bgcolor:alpha(RED,0.05),border:`0.5px solid ${alpha(RED,0.2)}`,fontSize:'0.7rem',color:RED}}>
                                Actual exceeded optimized by <strong>${fmtS(totalSpentAll-optimized)}</strong> — primarily from food &amp; dining.
                            </Box>
                        )}
                    </Box>
                )}

            </Box>
        </Box>
    );
};

// ── Current Month View — two-column layout ────────────────────────────────────
const CurrentMonthView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const gt=deriveGroupTotals(t);
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const expRow=t.rows.find(r=>r.rowType==='expenses');
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
    const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);

    const getValColor=(row:SpreadsheetRow,val:number|null,ci:number):string=>{
        if(val===null)return'transparent';
        if(row.rowType==='balance')return val>=0?GREEN:RED;
        if(row.rowType==='expenses'){const s=sal[ci];return s&&val>s?RED:NAVY;}
        return NAVY;
    };

    const solidBg=(rt:SpreadsheetRow['rowType'],ri:number):string=>{
        if(rt==='salary')return '#fdf4f4';
        if(rt==='balance')return '#edfaf8';
        if(rt==='expenses')return '#f8f8f8';
        return ri%2===0?'#ffffff':'#f7f8f9';
    };

    return (
        <Grid container spacing={3} alignItems="flex-start">
            {/* Left: spending table + summary footer */}
            <Grid item xs={12} lg={8}>
                <Stack spacing={3}>
                    {/* Spending table */}
                    <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}`}}>
                        <MaroonCardHeader
                            icon={<TableIcon size={14} color="white"/>}
                            title={template.name}
                            subtitle={`${template.periodType} · ${t.periods.length} periods · By category`}
                        />
                        <Box sx={{bgcolor:'#fff',p:2.5}}>
                            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
                            <Box sx={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`}}>
                                <TableContainer sx={{overflowX:'auto'}}>
                                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{position:'sticky',left:0,zIndex:6,minWidth:145,background:'#f3ecec',borderRight:`2px solid ${alpha(MAROON,0.25)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.12)`,fontWeight:700,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:MAROON,py:1.125,px:1.75,verticalAlign:'middle',borderBottom:`2px solid ${alpha(MAROON,0.15)}`}}>
                                                    Category
                                                </TableCell>
                                                {t.periods.map((p,i)=>(
                                                    <TableCell key={i} align="center" sx={{fontWeight:600,fontSize:'0.68rem',color:SLATE,py:1,minWidth:80,bgcolor:alpha(MAROON,0.02),borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.05)}`,borderBottom:`2px solid ${alpha(MAROON,0.15)}`}}>
                                                        {p}
                                                    </TableCell>
                                                ))}
                                                <TableCell align="right" sx={{fontWeight:700,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:NAVY,py:1,bgcolor:alpha(NAVY,0.04),borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderBottom:`2px solid ${alpha(MAROON,0.15)}`,minWidth:80}}>Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {t.rows.map((row,ri)=>{
                                                const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);
                                                const isSection=row.rowType==='salary';
                                                const isSummary=row.rowType==='expenses'||row.rowType==='balance';
                                                const bg=solidBg(row.rowType,ri);
                                                // Inline savings goal & actual saved rows after salary
                                                return(
                                                    <TableRow key={row.label}>
                                                        <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:bg,borderRight:`2px solid ${alpha(MAROON,0.18)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:isSection?700:isSummary?600:400,color:row.rowType==='salary'?MAROON:row.rowType==='balance'?'#0f766e':NAVY,whiteSpace:'nowrap',fontSize:'0.78rem',px:1.75,borderTop:isSection?`2px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`}}>
                                                            <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
                                                                {row.rowType==='expense'&&CATEGORY_GROUPS[row.label]&&(
                                                                    <Box sx={{width:3,height:13,borderRadius:'1px',bgcolor:CAT_COLORS[CATEGORY_GROUPS[row.label]]??SLATE,flexShrink:0}}/>
                                                                )}
                                                                {row.label}
                                                            </Box>
                                                        </TableCell>
                                                        {row.values.map((val,ci)=>(
                                                            <TableCell key={ci} align="right" sx={{zIndex:1,color:getValColor(row,val,ci),bgcolor:bg,fontWeight:isSummary||isSection?600:400,fontSize:'0.78rem',borderLeft:isMS(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:isSection?`2px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>
                                                                {val!==null?`$${fmt(val)}`:''}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell align="right" sx={{zIndex:1,fontWeight:700,fontSize:'0.78rem',color:row.rowType==='balance'?(rowTotal>=0?GREEN:RED):NAVY,bgcolor:bg,borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:isSection?`2px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>
                                                            {rowTotal!==0||row.values.some(v=>v!==null)?`$${fmt(rowTotal)}`:''}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {/* Savings goal row */}
                                            <TableRow>
                                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(TEAL,0.04),borderRight:`2px solid ${alpha(MAROON,0.18)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,color:TEAL,whiteSpace:'nowrap',fontSize:'0.78rem',px:1.75,borderTop:`1.5px solid ${alpha(TEAL,0.2)}`}}>
                                                    Savings goal
                                                </TableCell>
                                                {t.periods.map((_,ci)=>{
                                                    const inc=sal[ci]??0;
                                                    const goal=inc>0?Math.round(inc*0.226):null;
                                                    return<TableCell key={ci} align="right" sx={{zIndex:1,color:TEAL,fontWeight:500,fontSize:'0.78rem',bgcolor:alpha(TEAL,0.04),borderLeft:isMS(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1.5px solid ${alpha(TEAL,0.2)}`,fontVariantNumeric:'tabular-nums'}}>{goal!==null?`$${fmtS(goal)}`:''}</TableCell>;
                                                })}
                                                <TableCell align="right" sx={{zIndex:1,fontWeight:700,color:TEAL,fontSize:'0.78rem',bgcolor:alpha(TEAL,0.04),borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1.5px solid ${alpha(TEAL,0.2)}`}}/>
                                            </TableRow>
                                            {/* Actual saved row */}
                                            <TableRow>
                                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(GREEN,0.04),borderRight:`2px solid ${alpha(MAROON,0.18)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,color:GREEN,whiteSpace:'nowrap',fontSize:'0.78rem',px:1.75,borderTop:`1px solid ${alpha(GREEN,0.15)}`}}>
                                                    Actual saved
                                                </TableCell>
                                                {t.periods.map((_,ci)=>{
                                                    const inc=sal[ci]??0;
                                                    const exp=expRow?.values[ci]??0;
                                                    const saved=inc-exp;
                                                    const goal=inc>0?Math.round(inc*0.226):0;
                                                    const met=saved>=goal&&inc>0;
                                                    return<TableCell key={ci} align="right" sx={{zIndex:1,color:met?GREEN:RED,fontWeight:600,fontSize:'0.78rem',bgcolor:alpha(GREEN,0.04),borderLeft:isMS(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha(GREEN,0.15)}`,fontVariantNumeric:'tabular-nums'}}>{inc>0?`$${fmtS(saved)} ${met?'✓':'✗'}`:''}</TableCell>;
                                                })}
                                                <TableCell align="right" sx={{zIndex:1,fontWeight:700,color:GREEN,fontSize:'0.78rem',bgcolor:alpha(GREEN,0.04),borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1px solid ${alpha(GREEN,0.15)}`}}/>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    </Box>

                    {/* Overall summary */}
                    <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}`}}>
                        <MaroonCardHeader icon={<Award size={14} color="white"/>} title="Overall summary" subtitle={`Totals across all ${t.periods.length} periods`}/>
                        <Box sx={{bgcolor:'#fff',p:0}}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead><TableRow sx={{bgcolor:alpha(MAROON,0.04)}}>{['Budget goal','Total planned','Total spent','Savings %','Over budget %'].map(h=><TableCell key={h} sx={{fontWeight:700,color:MAROON,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.06em',py:1.25,px:2}}>{h}</TableCell>)}</TableRow></TableHead>
                                    <TableBody>
                                        <TableRow>{(()=>{
                                            const ts=sal.reduce((a:number,v)=>a+(v??0),0);
                                            const te=(expRow?.values??[]).reduce((a:number,v)=>a+(v??0),0);
                                            const sr=ts>0?((ts-te)/ts)*100:0;
                                            const bu=ts>0?(te/ts)*100:0;
                                            return[{v:`$${fmt(ts)}`,c:NAVY},{v:`$${fmt(ts)}`,c:NAVY},{v:`$${fmt(te)}`,c:MAROON},{v:`${sr>=0?'+':''}${sr.toFixed(1)}%`,c:sr>=0?GREEN:RED},{v:`${bu>100?'+':'–'}${Math.abs(bu-100).toFixed(1)}%`,c:bu>100?RED:GREEN}].map(({v,c},i)=><TableCell key={i} sx={{fontWeight:700,fontSize:'0.85rem',color:c,py:1.5,px:2,fontVariantNumeric:'tabular-nums'}}>{v}</TableCell>);
                                        })()}</TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                </Stack>
            </Grid>

            {/* Right: tabbed savings panel */}
            <Grid item xs={12} lg={4}>
                <Box sx={{position:'sticky',top:24}}>
                    <SavingsSidePanel template={template} periodFilter={periodFilter}/>
                </Box>
            </Grid>
        </Grid>
    );
};

// ── Maroon card header ────────────────────────────────────────────────────────
const MaroonCardHeader:React.FC<{icon:React.ReactNode;title:string;subtitle:string}> = ({icon,title,subtitle}) => (
    <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)`,px:3,py:2,position:'relative',overflow:'hidden'}}>
        <Box sx={{position:'absolute',top:-16,right:-16,width:80,height:80,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)'}}/>
        <Box sx={{position:'absolute',bottom:-20,right:50,width:50,height:50,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.04)'}}/>
        <Box sx={{display:'flex',alignItems:'center',gap:1.25,position:'relative'}}>
            <Box sx={{width:30,height:30,borderRadius:'8px',bgcolor:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</Box>
            <Box><Typography sx={{fontWeight:800,fontSize:'0.92rem',color:'#fff',letterSpacing:'-0.01em'}}>{title}</Typography><Typography sx={{fontSize:'0.67rem',color:'rgba(255,255,255,0.7)',mt:0.1}}>{subtitle}</Typography></Box>
        </Box>
    </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const BudgetPlanner: React.FC = () => {
    const [animateIn,setAnimateIn]   = useState(false);
    const [templates,setTemplates]   = useState<SpreadsheetTemplate[]>([]);
    const [selectedId,setSelectedId] = useState<string>('preset-rolling');
    const [topViewMode,setTopViewMode] = useState<TopViewMode>('current-month');
    const [editMode,setEditMode]     = useState(false);
    const [showRuleSelector,setShowRuleSelector] = useState(false);
    const [selectedRuleId,setSelectedRuleId] = useState('50-30-20');
    const [monthlyIncome,setMonthlyIncome] = useState(5000);
    const [openSaveDialog,setOpenSaveDialog] = useState(false);
    const [saveName,setSaveName]     = useState('');
    const [currentMonth,setCurrentMonth] = useState(new Date());
    const [periodFilter,setPeriodFilter] = useState<PeriodFilter>('Biweekly');
    const [openWizard, setOpenWizard] = useState(false);

    const monthLabel = currentMonth.toLocaleString('default',{month:'long',year:'numeric'});

    useEffect(()=>{setTimeout(()=>setAnimateIn(true),100);},[]);
    useEffect(()=>{setTemplates([ROLLING_TEMPLATE,NOV_MAY]);},[]);

    const currentTemplate = templates.find(t=>t.id===selectedId)??templates[0];
    const totalSalary   = currentTemplate?.rows.find(r=>r.label==='Salary')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const totalExpenses = currentTemplate?.rows.find(r=>r.label==='Expenses')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const finalBalance  = currentTemplate?.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null).slice(-1)[0]??0;
    const savingsRate   = totalSalary>0?((totalSalary-totalExpenses)/totalSalary)*100:0;
    const avgIncome     = totalSalary/(currentTemplate?.periods.length||1);
    const avgExpenses   = totalExpenses/(currentTemplate?.periods.length||1);
    const budgetUtil    = totalSalary>0?(totalExpenses/totalSalary)*100:0;
    const utilColor     = budgetUtil>100?RED:budgetUtil>85?AMBER:TEAL;

    const handleCellChange = (ri:number,ci:number,value:number|null) => {
        setTemplates(prev=>prev.map(t=>{
            if(t.id!==selectedId)return t;
            const rows=t.rows.map((r,i)=>i===ri?{...r,values:r.values.map((v,j)=>j===ci?value:v)}:r);
            const ei=rows.findIndex(r=>r.rowType==='expenses'),bi=rows.findIndex(r=>r.rowType==='balance'),si=rows.findIndex(r=>r.rowType==='salary');
            if(ei>=0){const er=rows.filter(r=>r.rowType==='expense');rows[ei]={...rows[ei],values:rows[ei].values.map((_,j)=>er.reduce((s,r)=>s+(r.values[j]??0),0))};}
            if(bi>=0&&si>=0){let run=0;rows[bi]={...rows[bi],values:rows[bi].values.map((_,j)=>{const s=rows[si].values[j]??0,e=ei>=0?rows[ei].values[j]??0:0;run=run+s-e;return run;})};}
            return{...t,rows};
        }));
    };

    const handleWizardCreate = (config: {
        name: string;
        periodType: PeriodType;
        startMonth: string;
        endMonth: string;
        income: number;
        categories: { name: string; color: string }[];
        allocs: Record<string, number>;
    }) => {
        const start = new Date(config.startMonth + '-01');
        const end   = new Date(config.endMonth + '-01');
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);

        const { periods, months } = generatePeriods(config.periodType, start, end);
        const rows = makeBlankRows(periods.length);

        // Pre-fill salary row with the income the user entered
        const salaryIdx = rows.findIndex(r => r.label === 'Salary');
        if (salaryIdx >= 0 && config.income > 0) {
            rows[salaryIdx] = {
                ...rows[salaryIdx],
                values: rows[salaryIdx].values.map(() => config.income),
            };
        }

        // Pre-fill first period values for each category allocation
        config.categories.forEach(cat => {
            const amount = config.allocs[cat.name] ?? 0;
            if (amount <= 0) return;
            // Find a row whose label matches the category name, or the first Other row
            const rowIdx = rows.findIndex(r => r.label === cat.name);
            if (rowIdx >= 0) {
                rows[rowIdx] = {
                    ...rows[rowIdx],
                    values: rows[rowIdx].values.map(() => amount),
                };
            }
        });

        // Recompute Expenses row
        const expIdx = rows.findIndex(r => r.rowType === 'expenses');
        const salIdx = rows.findIndex(r => r.rowType === 'salary');
        if (expIdx >= 0) {
            const expenseRows = rows.filter(r => r.rowType === 'expense');
            rows[expIdx] = {
                ...rows[expIdx],
                values: rows[expIdx].values.map((_, ci) =>
                    expenseRows.reduce((s, r) => s + (r.values[ci] ?? 0), 0)
                ),
            };
        }

        // Recompute running balance
        const balIdx = rows.findIndex(r => r.rowType === 'balance');
        if (balIdx >= 0 && salIdx >= 0) {
            let running = 0;
            rows[balIdx] = {
                ...rows[balIdx],
                values: rows[balIdx].values.map((_, ci) => {
                    const sal = rows[salIdx].values[ci] ?? 0;
                    const exp = expIdx >= 0 ? rows[expIdx].values[ci] ?? 0 : 0;
                    running = running + sal - exp;
                    return running;
                }),
            };
        }

        const newTemplate: SpreadsheetTemplate = {
            id: generateUUID(),
            name: config.name,
            periodType: config.periodType,
            months,
            periods,
            rows,
        };

        setTemplates(prev => [...prev, newTemplate]);
        setSelectedId(newTemplate.id);
    };

    const handleSaveCopy = () => {
        if(!saveName||!currentTemplate)return;
        const copy={...currentTemplate,id:generateUUID(),name:saveName,rows:currentTemplate.rows.map(r=>({...r,values:[...r.values]}))};
        setTemplates(prev=>[...prev,copy]);setSelectedId(copy.id);setOpenSaveDialog(false);setSaveName('');
    };

    const kpiCards=[
        {label:'Avg Income / Period',val:`$${fmtS(avgIncome)}`,color:NAVY,base:'#f0f4ff',sub:currentTemplate?.name??''},
        {label:'Avg Expenses / Period',val:`$${fmtS(avgExpenses)}`,color:MAROON,base:'#fff1f2',sub:'per period avg'},
        {label:'Cumulative Balance',val:`$${fmtS(finalBalance)}`,color:finalBalance>=0?GREEN:RED,base:finalBalance>=0?'#f0fdf4':'#fff1f2',sub:'running total'},
        {label:'Avg Savings Rate',val:`${savingsRate>=0?'+':''}${savingsRate.toFixed(1)}%`,color:savingsRate>=0?GREEN:RED,base:savingsRate>=0?'#f0f9ff':'#fff1f2',sub:'of income'},
    ];

    const RuleCard:React.FC<{rule:BudgetRule;selected:boolean;onSelect:()=>void}> = ({rule,selected,onSelect}) => (
        <Box onClick={onSelect} sx={{p:1.75,borderRadius:'10px',cursor:'pointer',border:`2px solid ${selected?rule.color:alpha('#000',0.07)}`,bgcolor:selected?alpha(rule.color,0.05):'#fff',transition:'all 0.18s','&:hover':{borderColor:rule.color},position:'relative'}}>
            {selected&&<Box sx={{position:'absolute',top:7,right:7,color:rule.color}}><CheckCircle2 size={14}/></Box>}
            <Box sx={{display:'flex',alignItems:'center',gap:1.25,mb:0.75}}><Box sx={{width:28,height:28,borderRadius:'7px',bgcolor:alpha(rule.color,0.12),color:rule.color,display:'flex',alignItems:'center',justifyContent:'center'}}>{rule.icon}</Box><Box><Typography sx={{fontSize:'0.82rem',fontWeight:800,color:NAVY,lineHeight:1}}>{rule.shortName}</Typography><Typography sx={{fontSize:'0.62rem',color:SLATE}}>{rule.tagline}</Typography></Box></Box>
            <Box sx={{display:'flex',height:5,borderRadius:2,overflow:'hidden',gap:'1px'}}>{Object.entries(rule.allocations).filter(([,v])=>v>0).map(([k,v],i)=><Box key={k} sx={{flex:v,bgcolor:CHART_COLORS[i%CHART_COLORS.length]}}/>)}</Box>
        </Box>
    );

    // Two view modes only
    const viewModes=[
        {key:'current-month' as TopViewMode, label:'Month View',  icon:<Calendar size={12}/>},
        {key:'classic'       as TopViewMode, label:'Spreadsheet', icon:<TableIcon size={12}/>},
    ];

    // Template dropdown used in ALL modes
    const TemplateSelector = () => (
        <FormControl size="small" sx={{minWidth:220}}>
            <InputLabel sx={{fontSize:'0.82rem',color:SLATE}}>Template</InputLabel>
            <Select value={selectedId||''} label="Template" onChange={e=>setSelectedId(e.target.value)}
                    sx={{bgcolor:'#fff',borderRadius:'8px',fontSize:'0.82rem','& .MuiOutlinedInput-notchedOutline':{borderColor:alpha('#000',0.12)},'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:MAROON}}}>
                {templates.map(t=>(
                    <MenuItem key={t.id} value={t.id}>
                        <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                            <Chip label={t.periodType} size="small" sx={{height:18,fontSize:'0.62rem',fontWeight:700,bgcolor:alpha(TEAL,0.1),color:TEAL}}/>
                            <Typography sx={{fontSize:'0.82rem'}}>{t.name}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <Box sx={{maxWidth:'calc(100% - 240px)',ml:'240px',minHeight:'100vh',background:BG}}>
            <Sidebar/>
            <Container maxWidth="xl" sx={{py:4}}>

                {/* ── Header ── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{mb:4}}>
                        {/* Row 1: Title left | month nav + action buttons right */}
                        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',mb:2.5,flexDirection:{xs:'column',sm:'row'},gap:2}}>
                            <Box>
                                <Box sx={{width:28,height:3,background:MAROON,borderRadius:'2px',mb:0.75}}/>
                                {topViewMode==='current-month'
                                    ?<><Typography variant="h4" component="h1" sx={{fontWeight:800,color:'#111',letterSpacing:'-0.025em'}}>{monthLabel} Budget Planner</Typography><Typography variant="subtitle1" sx={{color:'#888',mt:0.5}}>Track your progress and stay within your spending limits</Typography></>
                                    :<><Typography variant="h4" component="h1" sx={{fontWeight:800,color:'#111',letterSpacing:'-0.025em'}}>Budget Planner</Typography><Typography variant="subtitle1" sx={{color:'#888',mt:0.5}}>Plan · track · analyze spending across any period</Typography></>
                                }
                            </Box>
                            {/* Right: month nav (always) + action buttons */}
                            <Box sx={{display:'flex',alignItems:'center',gap:1,flexShrink:0}}>
                                {/* Month chevrons — always visible, left of Edit */}
                                <IconButton onClick={()=>setCurrentMonth(prev=>{const d=new Date(prev);d.setMonth(d.getMonth()-1);return d;})} sx={{width:32,height:32,borderRadius:'6px',background:MAROON,color:'#fff','&:hover':{background:MAROON_DARK}}}>
                                    <Box component="span" sx={{fontSize:'1.1rem',lineHeight:1}}>‹</Box>
                                </IconButton>
                                <Card elevation={0} sx={{px:1.75,py:0.625,display:'flex',alignItems:'center',gap:0.75,borderRadius:'8px',border:'1px solid #e0e0e0',background:'#f9f9f9'}}>
                                    <Calendar size={13} color="#888"/>
                                    <Typography sx={{fontSize:'0.8rem',fontWeight:600,color:'#222',whiteSpace:'nowrap'}}>{monthLabel}</Typography>
                                </Card>
                                <IconButton onClick={()=>setCurrentMonth(prev=>{const d=new Date(prev);d.setMonth(d.getMonth()+1);return d;})} sx={{width:32,height:32,borderRadius:'6px',background:MAROON,color:'#fff','&:hover':{background:MAROON_DARK}}}>
                                    <Box component="span" sx={{fontSize:'1.1rem',lineHeight:1}}>›</Box>
                                </IconButton>
                                <Box sx={{width:'1px',height:24,bgcolor:alpha('#000',0.1),mx:0.5}}/>
                                <Button variant="outlined" size="small" onClick={()=>setEditMode(v=>!v)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',gap:0.5,borderColor:editMode?TEAL:'#d5d5d5',color:editMode?'#fff':'#555',bgcolor:editMode?TEAL:'#fff','&:hover':{borderColor:TEAL,color:editMode?'#fff':TEAL,bgcolor:editMode?'#0f766e':alpha(TEAL,0.04)}}}>
                                    {editMode?<EditOff sx={{fontSize:'0.85rem'}}/>:<Edit sx={{fontSize:'0.85rem'}}/>}{editMode?'Stop Editing':'Edit'}
                                </Button>
                                <Button variant="outlined" size="small" onClick={()=>setOpenWizard(true)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',borderColor:'#d5d5d5',color:'#555',bgcolor:'#fff','&:hover':{borderColor:MAROON,color:MAROON,bgcolor:alpha(MAROON,0.04)}}}>
                                    <Add sx={{fontSize:'0.9rem',mr:0.3}}/> New
                                </Button>
                                <Button variant="outlined" size="small" onClick={()=>setShowRuleSelector(v=>!v)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',gap:0.5,borderColor:showRuleSelector?MAROON:'#d5d5d5',color:showRuleSelector?'#fff':'#555',bgcolor:showRuleSelector?MAROON:'#fff','&:hover':{borderColor:MAROON,color:showRuleSelector?'#fff':MAROON,bgcolor:showRuleSelector?MAROON_DARK:alpha(MAROON,0.04)}}}>
                                    <Sparkles size={13}/> Rule
                                </Button>
                                {currentTemplate&&(
                                    <Button variant="outlined" size="small" onClick={()=>setOpenSaveDialog(true)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',gap:0.5,borderColor:'#d5d5d5',color:'#555',bgcolor:'#fff','&:hover':{borderColor:MAROON,color:MAROON,bgcolor:alpha(MAROON,0.04)}}}>
                                        <Save sx={{fontSize:'0.85rem'}}/> Save
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {/* Row 2: Template dropdown + view toggle (right of dropdown) */}
                        <Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}>
                            <TemplateSelector/>
                            {/* Two-option view toggle — right of template dropdown */}
                            <Box sx={{display:'flex',border:`1px solid ${alpha('#000',0.12)}`,borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                                {viewModes.map(({key,label,icon})=>(
                                    <Box key={key} onClick={()=>setTopViewMode(key)} sx={{
                                        px:1.75,py:0.75,
                                        display:'flex',alignItems:'center',gap:0.6,
                                        cursor:'pointer',
                                        bgcolor:topViewMode===key?MAROON:'#fff',
                                        color:topViewMode===key?'#fff':'#555',
                                        fontSize:'0.78rem',fontWeight:600,
                                        borderRight:`1px solid ${alpha('#000',0.08)}`,
                                        transition:'all 0.15s',
                                        '&:last-child':{borderRight:'none'},
                                        '&:hover':topViewMode!==key?{bgcolor:alpha(MAROON,0.05),color:MAROON}:{},
                                    }}>
                                        {icon}{label}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Grow>

                {/* ── KPI cards ── */}
                {currentTemplate&&(
                    <Grow in={animateIn} timeout={600}>
                        <Grid container spacing={2.5} sx={{mb:4}}>
                            {kpiCards.map(({label,val,color,base,sub})=>(
                                <Grid item xs={12} sm={6} md={3} key={label}>
                                    <Box sx={{background:base,borderRadius:'10px',borderTop:`3px solid ${color}`,boxShadow:'0 2px 12px rgba(0,0,0,0.10)',p:2.5,height:'100%',transition:'box-shadow 0.2s','&:hover':{boxShadow:'0 6px 20px rgba(0,0,0,0.14)'}}}>
                                        <Typography sx={{fontSize:'0.67rem',textTransform:'uppercase',letterSpacing:'0.1em',color:alpha(color,0.7),fontWeight:700,mb:1}}>{label}</Typography>
                                        <Typography sx={{fontSize:'1.65rem',fontWeight:800,color,fontVariantNumeric:'tabular-nums',lineHeight:1,mb:0.5}}>{val}</Typography>
                                        <LinearProgress variant="determinate" value={label==='Avg Expenses / Period'?Math.min(budgetUtil,100):100} sx={{my:1,height:4,borderRadius:2,bgcolor:alpha(color,0.15),'& .MuiLinearProgress-bar':{bgcolor:color,borderRadius:2}}}/>
                                        <Typography sx={{fontSize:'0.72rem',color:alpha(color,0.6)}}>{sub}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grow>
                )}

                {/* ── Utilization bar ── */}
                {currentTemplate&&(
                    <Grow in={animateIn} timeout={650}>
                        <Box sx={{mb:3,pb:3,borderBottom:`1px solid ${alpha('#000',0.07)}`}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',mb:0.75}}>
                                <Typography sx={{fontSize:'0.72rem',color:SLATE}}>Budget utilization (avg across all periods)</Typography>
                                <Typography sx={{fontSize:'0.72rem',fontWeight:700,color:utilColor}}>{budgetUtil.toFixed(1)}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={Math.min(budgetUtil,100)} sx={{height:5,borderRadius:3,bgcolor:alpha(utilColor,0.15),'& .MuiLinearProgress-bar':{bgcolor:utilColor,borderRadius:3}}}/>
                        </Box>
                    </Grow>
                )}

                {/* ── Rule selector ── */}
                {showRuleSelector&&(
                    <Grow in timeout={200}>
                        <Box sx={{p:3,borderRadius:'16px',border:`1px solid ${alpha(TEAL,0.2)}`,bgcolor:'#fff',mb:3,boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:2}}>
                                <Box sx={{display:'flex',alignItems:'center',gap:1.5}}><Box sx={{width:32,height:32,borderRadius:'8px',bgcolor:alpha(TEAL,0.1),display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={16} color={TEAL}/></Box><Box><Typography sx={{fontWeight:800,fontSize:'0.95rem',color:NAVY}}>Apply a Budget Rule</Typography><Typography sx={{fontSize:'0.72rem',color:SLATE}}>Auto-distribute salary into category budgets</Typography></Box></Box>
                                <Button size="small" onClick={()=>setShowRuleSelector(false)} sx={{color:SLATE,textTransform:'none'}}>Dismiss</Button>
                            </Box>
                            <Box sx={{display:'flex',gap:2,alignItems:'center',mb:2,p:2,borderRadius:'10px',bgcolor:alpha(TEAL,0.04),border:`1px solid ${alpha(TEAL,0.12)}`}}>
                                <Wallet size={16} color={TEAL}/>
                                <Box sx={{flex:1}}><Typography sx={{fontSize:'0.7rem',fontWeight:700,color:SLATE,mb:0.5}}>Monthly Income</Typography><TextField size="small" type="number" value={monthlyIncome} onChange={e=>setMonthlyIncome(Number(e.target.value))} InputProps={{startAdornment:<Typography sx={{mr:0.5,color:SLATE}}>$</Typography>}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'8px',fontWeight:700},maxWidth:160}}/></Box>
                            </Box>
                            <Grid container spacing={1.25} sx={{mb:2}}>{BUDGET_RULES.map(rule=><Grid item xs={12} sm={6} md={4} lg={2.4} key={rule.id}><RuleCard rule={rule} selected={selectedRuleId===rule.id} onSelect={()=>setSelectedRuleId(rule.id)}/></Grid>)}</Grid>
                            <Button variant="contained" onClick={()=>setShowRuleSelector(false)} sx={{bgcolor:MAROON,color:'#fff',borderRadius:'8px',textTransform:'none',fontWeight:700,'&:hover':{bgcolor:MAROON_DARK}}}>Apply Rule</Button>
                        </Box>
                    </Grow>
                )}

                {/* ── Main content ── */}
                {currentTemplate&&(
                    <Grow in={animateIn} timeout={700}>
                        <Stack spacing={3}>

                            {/* Month View — two-column layout with tabbed savings panel */}
                            {topViewMode==='current-month'&&(
                                <CurrentMonthView template={currentTemplate} periodFilter={periodFilter} onPeriodFilter={setPeriodFilter}/>
                            )}

                            {/* Spreadsheet View */}
                            {topViewMode==='classic'&&(
                                <Stack spacing={3}>
                                    <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}`}}>
                                        <MaroonCardHeader icon={<TableIcon size={15} color="white"/>} title={currentTemplate.name} subtitle={`${currentTemplate.periodType} · ${currentTemplate.periods.length} periods · Classic spreadsheet${editMode?' · editing':''}`}/>
                                        <Box sx={{bgcolor:'#fff',p:3}}><ClassicSpreadsheet template={currentTemplate} editMode={editMode} onCellChange={handleCellChange} periodFilter={periodFilter} onPeriodFilter={setPeriodFilter}/></Box>
                                    </Box>
                                    {/* Summary footer */}
                                    <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}`}}>
                                        <MaroonCardHeader icon={<Award size={15} color="white"/>} title="Overall Summary" subtitle={`Totals across all ${currentTemplate.periods.length} periods`}/>
                                        <Box sx={{bgcolor:'#fff',p:3}}>
                                            <Box sx={{display:'flex',justifyContent:'flex-end',mb:2}}><Button size="small" variant="outlined" onClick={()=>setOpenSaveDialog(true)} sx={{borderColor:alpha(MAROON,0.3),color:MAROON,textTransform:'none',fontWeight:700,fontSize:'0.75rem',borderRadius:'7px','&:hover':{borderColor:MAROON,bgcolor:alpha(MAROON,0.04)}}}>Save as template</Button></Box>
                                            <TableContainer sx={{borderRadius:'8px',border:`1px solid ${alpha('#000',0.07)}`}}>
                                                <Table size="small">
                                                    <TableHead><TableRow sx={{bgcolor:alpha(MAROON,0.04)}}>{['Budget Goal','Total Planned','Total Spent','Savings %','Over Budget %'].map(h=><TableCell key={h} sx={{fontWeight:800,color:MAROON,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',py:1.25}}>{h}</TableCell>)}</TableRow></TableHead>
                                                    <TableBody><TableRow>{[{v:`$${fmt(totalSalary)}`,c:NAVY},{v:`$${fmt(totalSalary)}`,c:NAVY},{v:`$${fmt(totalExpenses)}`,c:MAROON},{v:`${savingsRate>=0?'+':''}${savingsRate.toFixed(1)}%`,c:savingsRate>=0?GREEN:RED},{v:`${budgetUtil>100?'+':'–'}${Math.abs(budgetUtil-100).toFixed(1)}%`,c:budgetUtil>100?RED:GREEN}].map(({v,c},i)=><TableCell key={i} sx={{fontWeight:700,fontSize:'0.88rem',color:c,py:1.5,fontVariantNumeric:'tabular-nums'}}>{v}</TableCell>)}</TableRow></TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    </Box>
                                </Stack>
                            )}

                        </Stack>
                    </Grow>
                )}
            </Container>

            {/* Dialogs */}
            <ManualTemplateWizard
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                onCreateTemplate={handleWizardCreate}
            />

            <Dialog open={openSaveDialog} onClose={()=>setOpenSaveDialog(false)} PaperProps={{sx:{borderRadius:'16px',p:1,minWidth:380}}}>
                <DialogTitle sx={{fontWeight:800,color:NAVY,pb:1}}>Save a Copy</DialogTitle>
                <DialogContent><TextField label="New Template Name" value={saveName} onChange={e=>setSaveName(e.target.value)} fullWidth margin="normal" sx={{'& .MuiOutlinedInput-root':{borderRadius:'8px'}}}/></DialogContent>
                <DialogActions sx={{px:3,pb:2}}><Button onClick={()=>setOpenSaveDialog(false)} sx={{color:SLATE,textTransform:'none',fontWeight:600}}>Cancel</Button><Button onClick={handleSaveCopy} variant="contained" disabled={!saveName} sx={{bgcolor:MAROON,textTransform:'none',fontWeight:700,borderRadius:'8px','&:hover':{bgcolor:MAROON_DARK}}}>Save</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default BudgetPlanner;
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//     Box,
//     Typography,
//     IconButton,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Card,
//     Grid,
//     Skeleton,
//     Container,
//     useTheme,
//     alpha,
//     Grow,
//     Button,
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     TextField,
//     ToggleButton,
//     ToggleButtonGroup,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     Chip,
//     LinearProgress,
//     Divider,
//     Tooltip,
//     Collapse,
//     Stack,
// } from '@mui/material';
// import {
//     ChevronLeft,
//     ChevronRight,
//     AccountBalance,
//     CalendarToday,
//     ExpandMore,
//     ExpandLess,
// } from '@mui/icons-material';
// import {
//     PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip,
//     ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
// } from 'recharts';
// import {
//     Wallet, Target, TrendingUp, Sparkles, Info, CheckCircle2,
//     PiggyBank, ShoppingBag, Zap, ChevronDown,
// } from 'lucide-react';
// import Sidebar from './Sidebar';
// import BudgetPlannerSidePanel from './BudgetPlannerPanel';
//
// // ── Design tokens matching GroceryTracker / BudgetPage ────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
// const TEAL        = '#0d9488';
// const GREEN       = '#059669';
// const AMBER       = '#d97706';
// const RED         = '#dc2626';
// const NAVY        = '#1e293b';
// const SLATE       = '#64748b';
// const BG          = '#f8f9fc';
//
// // ── Budget Rule Definitions ───────────────────────────────────────────────────
// interface BudgetRule {
//     id: string;
//     name: string;
//     shortName: string;
//     description: string;
//     tagline: string;
//     icon: React.ReactNode;
//     color: string;
//     allocations: {
//         Housing: number;
//         Food: number;
//         Transportation: number;
//         Entertainment: number;
//         Savings: number;
//         Other?: number;
//     };
//     pros: string[];
//     bestFor: string;
// }
//
// const BUDGET_RULES: BudgetRule[] = [
//     {
//         id: '50-30-20',
//         name: '50 / 30 / 20 Rule',
//         shortName: '50/30/20',
//         description: 'Needs 50% · Wants 30% · Savings 20%',
//         tagline: 'The classic balanced approach',
//         icon: <Target size={18} />,
//         color: TEAL,
//         allocations: { Housing: 35, Food: 15, Transportation: 10, Entertainment: 10, Savings: 20, Other: 10 },
//         pros: ['Easy to follow', 'Balanced lifestyle', 'Popular & proven'],
//         bestFor: 'Most income levels',
//     },
//     {
//         id: '70-20-10',
//         name: '70 / 20 / 10 Rule',
//         shortName: '70/20/10',
//         description: 'Living 70% · Savings 20% · Giving 10%',
//         tagline: 'For the generous saver',
//         icon: <PiggyBank size={18} />,
//         color: '#7c3aed',
//         allocations: { Housing: 35, Food: 20, Transportation: 10, Entertainment: 5, Savings: 20, Other: 10 },
//         pros: ['Aggressive savings', 'Charitable giving', 'Long-term wealth'],
//         bestFor: 'Wealth-building focus',
//     },
//     {
//         id: '80-20',
//         name: '80 / 20 Rule',
//         shortName: '80/20',
//         description: 'Living 80% · Savings 20%',
//         tagline: 'Simplified minimalism',
//         icon: <Zap size={18} />,
//         color: AMBER,
//         allocations: { Housing: 40, Food: 20, Transportation: 10, Entertainment: 10, Savings: 20, Other: 0 },
//         pros: ['Simple to track', 'Maximum freedom', 'No category stress'],
//         bestFor: 'Beginners & simplicity lovers',
//     },
//     {
//         id: '60-20-20',
//         name: '60 / 20 / 20 Rule',
//         shortName: '60/20/20',
//         description: 'Committed 60% · Savings 20% · Fun 20%',
//         tagline: 'Strict essentials, free spending',
//         icon: <ShoppingBag size={18} />,
//         color: MAROON,
//         allocations: { Housing: 35, Food: 15, Transportation: 10, Entertainment: 20, Savings: 20, Other: 0 },
//         pros: ['High savings rate', 'Generous fun money', 'Clear boundaries'],
//         bestFor: 'High earners & disciplined spenders',
//     },
//     {
//         id: 'custom',
//         name: 'Custom Rule',
//         shortName: 'Custom',
//         description: 'Your own allocation mix',
//         tagline: 'Full control',
//         icon: <Sparkles size={18} />,
//         color: '#0ea5e9',
//         allocations: { Housing: 30, Food: 15, Transportation: 10, Entertainment: 10, Savings: 15, Other: 20 },
//         pros: ['Fully personalized', 'No restrictions', 'Adapts to your life'],
//         bestFor: 'Experienced budgeters',
//     },
// ];
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// interface BudgetItem { planned: number; estimated: number; remaining: number; }
// interface WeekData { Housing: BudgetItem; Food: BudgetItem; Transportation: BudgetItem; Entertainment: BudgetItem; }
// interface BudgetData { week1: WeekData; week2: WeekData; week3: WeekData; week4: WeekData; }
// interface MonthlyTotals { budgetGoal: number; totalPlanned: number; totalSpent: number; percentageSaved: number; spentOverBudgetPercentage: number; }
// interface BPTemplate { id: string; name: string; type: string; budgetData: BudgetData; weekAccountBalances: { week1: number; week2: number; week3: number; week4: number }; weekDateRanges: string[]; monthlyTotals: MonthlyTotals; ruleId?: string; monthlyIncome?: number; }
// type CategoryKey = keyof WeekData;
// type ViewMode = 'template' | 'statistics';
//
// const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
//
// // ── Helpers ────────────────────────────────────────────────────────────────────
// const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// const calcPctSaved = (planned: number, estimated: number) => planned === 0 ? 0 : ((planned - estimated) / planned) * 100;
// const calcActualPct = (planned: number, estimated: number) => planned === 0 ? 0 : (estimated / planned) * 100;
// const calcSavingsContrib = (remaining: number) => Math.max(0, remaining);
//
// const CATEGORIES: CategoryKey[] = ['Housing', 'Food', 'Transportation', 'Entertainment'];
// const CHART_COLORS = [TEAL, MAROON, AMBER, '#7c3aed', GREEN];
//
// // ── Rule Card ──────────────────────────────────────────────────────────────────
// const RuleCard: React.FC<{
//     rule: BudgetRule; selected: boolean; onSelect: () => void;
// }> = ({ rule, selected, onSelect }) => (
//     <Box
//         onClick={onSelect}
//         sx={{
//             p: 2, borderRadius: '12px', cursor: 'pointer',
//             border: `2px solid ${selected ? rule.color : alpha('#000', 0.07)}`,
//             bgcolor: selected ? alpha(rule.color, 0.05) : '#fff',
//             transition: 'all 0.18s',
//             '&:hover': { borderColor: rule.color, bgcolor: alpha(rule.color, 0.04) },
//             position: 'relative', overflow: 'hidden',
//         }}
//     >
//         {selected && (
//             <Box sx={{ position: 'absolute', top: 8, right: 8, color: rule.color }}>
//                 <CheckCircle2 size={16} />
//             </Box>
//         )}
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
//             <Box sx={{
//                 width: 32, height: 32, borderRadius: '8px',
//                 bgcolor: alpha(rule.color, 0.12), color: rule.color,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//             }}>
//                 {rule.icon}
//             </Box>
//             <Box>
//                 <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: NAVY, lineHeight: 1 }}>{rule.shortName}</Typography>
//                 <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>{rule.tagline}</Typography>
//             </Box>
//         </Box>
//         <Typography sx={{ fontSize: '0.7rem', color: SLATE, mb: 1 }}>{rule.description}</Typography>
//         {/* Allocation mini bar */}
//         <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: '1px', mb: 1 }}>
//             {Object.entries(rule.allocations).filter(([, v]) => v > 0).map(([k, v], i) => (
//                 <Box key={k} sx={{ flex: v, bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
//             ))}
//         </Box>
//         <Typography sx={{ fontSize: '0.65rem', color: alpha(rule.color, 0.9), fontWeight: 700 }}>
//             Best for: {rule.bestFor}
//         </Typography>
//     </Box>
// );
//
// // ── Main Component ─────────────────────────────────────────────────────────────
// const BudgetPlanner: React.FC = () => {
//     const theme = useTheme();
//     const [currentMonth, setCurrentMonth] = useState('June 2025');
//     const [isLoading, setIsLoading] = useState(false);
//     const [viewMode, setViewMode] = useState<ViewMode>('template');
//     const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
//     const [weekExpandedView, setWeekExpandedView] = useState<Record<number, 'table' | 'chart'>>({});
//     const [animateIn, setAnimateIn] = useState(false);
//     const [bpTemplates, setBPTemplates] = useState<BPTemplate[]>([]);
//     const [selectedTemplateType, setSelectedTemplateType] = useState<string>('Monthly');
//     const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
//     const [openDialog, setOpenDialog] = useState(false);
//     const [newTemplateName, setNewTemplateName] = useState('');
//     const [newTemplateType, setNewTemplateType] = useState('Monthly');
//     // Rule selector state
//     const [showRuleSelector, setShowRuleSelector] = useState(false);
//     const [selectedRuleId, setSelectedRuleId] = useState<string>('50-30-20');
//     const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
//     const [rulePreviewOpen, setRulePreviewOpen] = useState(false);
//
//     useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);
//
//     const buildBudgetFromRule = (rule: BudgetRule, income: number): BudgetData => {
//         const makeCategoryWeek = (cat: CategoryKey): BudgetItem => {
//             const pct = (rule.allocations[cat] ?? 0) / 100;
//             const weeklyAmount = (income * pct) / 4;
//             const variance = (Math.random() * 0.1 - 0.05); // ±5% realistic variance
//             const estimated = Math.round(weeklyAmount * (1 + variance));
//             return { planned: Math.round(weeklyAmount), estimated, remaining: Math.round(weeklyAmount) - estimated };
//         };
//         return {
//             week1: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
//             week2: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
//             week3: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
//             week4: { Housing: makeCategoryWeek('Housing'), Food: makeCategoryWeek('Food'), Transportation: makeCategoryWeek('Transportation'), Entertainment: makeCategoryWeek('Entertainment') },
//         };
//     };
//
//     const calcMonthlyTotals = (data: BudgetData): MonthlyTotals => {
//         let totalPlanned = 0, totalSpent = 0;
//         (['week1','week2','week3','week4'] as const).forEach(wk => {
//             CATEGORIES.forEach(cat => { totalPlanned += data[wk][cat].planned; totalSpent += data[wk][cat].estimated; });
//         });
//         return {
//             budgetGoal: totalPlanned, totalPlanned, totalSpent,
//             percentageSaved: calcPctSaved(totalPlanned, totalSpent),
//             spentOverBudgetPercentage: totalPlanned === 0 ? 0 : ((totalSpent - totalPlanned) / totalPlanned) * 100,
//         };
//     };
//
//     const initialBudgetData: BudgetData = {
//         week1: { Housing: { planned: 500, estimated: 480, remaining: 20 }, Food: { planned: 200, estimated: 185, remaining: 15 }, Transportation: { planned: 150, estimated: 145, remaining: 5 }, Entertainment: { planned: 100, estimated: 120, remaining: -20 } },
//         week2: { Housing: { planned: 500, estimated: 500, remaining: 0 }, Food: { planned: 200, estimated: 195, remaining: 5 }, Transportation: { planned: 150, estimated: 140, remaining: 10 }, Entertainment: { planned: 100, estimated: 85, remaining: 15 } },
//         week3: { Housing: { planned: 500, estimated: 485, remaining: 15 }, Food: { planned: 200, estimated: 210, remaining: -10 }, Transportation: { planned: 150, estimated: 155, remaining: -5 }, Entertainment: { planned: 100, estimated: 95, remaining: 5 } },
//         week4: { Housing: { planned: 500, estimated: 475, remaining: 25 }, Food: { planned: 200, estimated: 190, remaining: 10 }, Transportation: { planned: 150, estimated: 148, remaining: 2 }, Entertainment: { planned: 100, estimated: 110, remaining: -10 } },
//     };
//
//     const initialWAB = { week1: 5020, week2: 5050, week3: 5055, week4: 5082 };
//     const initialWDR = ['06/01/25 - 06/07/25', '06/08/25 - 06/14/25', '06/15/25 - 06/21/25', '06/22/25 - 06/28/25'];
//
//     useEffect(() => {
//         const totals = calcMonthlyTotals(initialBudgetData);
//         const defaults: BPTemplate[] = [
//             { id: generateUUID(), name: 'Default June 2025', type: 'Monthly', budgetData: initialBudgetData, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: totals },
//             ...BUDGET_RULES.filter(r => r.id !== 'custom').map(rule => {
//                 const bd = buildBudgetFromRule(rule, 5000);
//                 return { id: generateUUID(), name: `${rule.shortName} — June 2025`, type: 'Monthly', budgetData: bd, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: calcMonthlyTotals(bd), ruleId: rule.id, monthlyIncome: 5000 };
//             }),
//         ];
//         setBPTemplates(defaults);
//         setSelectedTemplateId(defaults[0].id);
//     }, []);
//
//     const currentTemplate = bpTemplates.find(t => t.id === selectedTemplateId) || { budgetData: initialBudgetData, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: calcMonthlyTotals(initialBudgetData) };
//     const { budgetData, weekAccountBalances, weekDateRanges } = currentTemplate;
//     const { budgetGoal, totalPlanned, totalSpent, percentageSaved, spentOverBudgetPercentage } = currentTemplate.monthlyTotals || calcMonthlyTotals(budgetData);
//
//     const activeRule = BUDGET_RULES.find(r => r.id === ((currentTemplate as BPTemplate).ruleId || '')) || null;
//
//     const handleMonthChange = (dir: 'prev' | 'next') => {
//         setIsLoading(true);
//         setTimeout(() => setIsLoading(false), 500);
//     };
//
//     const toggleWeek = (idx: number) => setCollapsedWeeks(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });
//
//     const handleApplyRule = () => {
//         const rule = BUDGET_RULES.find(r => r.id === selectedRuleId)!;
//         const bd = buildBudgetFromRule(rule, monthlyIncome);
//         const totals = calcMonthlyTotals(bd);
//         const newT: BPTemplate = { id: generateUUID(), name: `${rule.shortName} — ${currentMonth}`, type: selectedTemplateType, budgetData: bd, weekAccountBalances: initialWAB, weekDateRanges: initialWDR, monthlyTotals: totals, ruleId: rule.id, monthlyIncome };
//         setBPTemplates(prev => [...prev, newT]);
//         setSelectedTemplateId(newT.id);
//         setShowRuleSelector(false);
//         setRulePreviewOpen(false);
//     };
//
//     const handleSaveTemplate = () => {
//         if (!newTemplateName) return;
//         const newT: BPTemplate = { id: generateUUID(), name: newTemplateName, type: newTemplateType, budgetData, weekAccountBalances, weekDateRanges, monthlyTotals: calcMonthlyTotals(budgetData) };
//         setBPTemplates(prev => [...prev, newT]);
//         setOpenDialog(false);
//         setNewTemplateName('');
//     };
//
//     // Chart data
//     const pieData = CATEGORIES.map(cat => ({
//         name: cat,
//         planned: ['week1','week2','week3','week4'].reduce((s, wk) => s + budgetData[wk as keyof BudgetData][cat].planned, 0),
//         estimated: ['week1','week2','week3','wek4' as any].reduce((s, wk) => s + (budgetData[wk as keyof BudgetData]?.[cat]?.estimated ?? 0), 0),
//     }));
//     const barData = ['week1','week2','week3','week4'].map((wk, i) => {
//         const w = budgetData[wk as keyof BudgetData];
//         return { name: `Wk ${i+1}`, Planned: CATEGORIES.reduce((s, c) => s + w[c].planned, 0), Actual: CATEGORIES.reduce((s, c) => s + w[c].estimated, 0) };
//     });
//
//     const budgetUsedPct = totalPlanned === 0 ? 0 : (totalSpent / totalPlanned) * 100;
//     const progressColor = budgetUsedPct > 100 ? RED : budgetUsedPct > 85 ? AMBER : TEAL;
//
//     // ── Rule selector panel ────────────────────────────────────────────────────
//     const RuleSelectorPanel = () => (
//         <Box sx={{ p: 3, borderRadius: '16px', border: `1px solid ${alpha(TEAL, 0.2)}`, bgcolor: '#fff', mb: 3 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                     <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha(TEAL, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <Sparkles size={17} color={TEAL} />
//                     </Box>
//                     <Box>
//                         <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: NAVY }}>Apply a Budget Rule</Typography>
//                         <Typography sx={{ fontSize: '0.75rem', color: SLATE }}>Auto-generate your monthly plan from a proven strategy</Typography>
//                     </Box>
//                 </Box>
//                 <Button size="small" onClick={() => setShowRuleSelector(false)} sx={{ color: SLATE, textTransform: 'none' }}>Dismiss</Button>
//             </Box>
//
//             {/* Monthly income input */}
//             <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5, p: 2, borderRadius: '10px', bgcolor: alpha(TEAL, 0.04), border: `1px solid ${alpha(TEAL, 0.12)}` }}>
//                 <Wallet size={18} color={TEAL} />
//                 <Box sx={{ flex: 1 }}>
//                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: SLATE, mb: 0.5 }}>Monthly Take-Home Income</Typography>
//                     <TextField
//                         size="small"
//                         type="number"
//                         value={monthlyIncome}
//                         onChange={e => setMonthlyIncome(Number(e.target.value))}
//                         InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: SLATE, fontSize: '0.85rem' }}>$</Typography> }}
//                         sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }, maxWidth: 180 }}
//                     />
//                 </Box>
//                 <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>We'll split this across categories</Typography>
//             </Box>
//
//             {/* Rule grid */}
//             <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
//                 {BUDGET_RULES.map(rule => (
//                     <Grid item xs={12} sm={6} md={4} key={rule.id}>
//                         <RuleCard rule={rule} selected={selectedRuleId === rule.id} onSelect={() => setSelectedRuleId(rule.id)} />
//                     </Grid>
//                 ))}
//             </Grid>
//
//             {/* Selected rule detail */}
//             {selectedRuleId && (() => {
//                 const rule = BUDGET_RULES.find(r => r.id === selectedRuleId)!;
//                 return (
//                     <Box sx={{ p: 2, borderRadius: '10px', bgcolor: alpha(rule.color, 0.05), border: `1px solid ${alpha(rule.color, 0.2)}`, mb: 2 }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
//                             <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY }}>{rule.name} Breakdown</Typography>
//                             <Chip label={`$${monthlyIncome.toLocaleString()} / mo`} size="small" sx={{ bgcolor: alpha(rule.color, 0.12), color: rule.color, fontWeight: 700, fontSize: '0.72rem' }} />
//                         </Box>
//                         <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//                             {Object.entries(rule.allocations).filter(([, v]) => v > 0).map(([cat, pct], i) => (
//                                 <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6, borderRadius: '20px', bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.1) }}>
//                                     <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
//                                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
//                                     <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>{pct}% · ${((monthlyIncome * pct) / 100).toFixed(0)}/mo</Typography>
//                                 </Box>
//                             ))}
//                         </Box>
//                     </Box>
//                 );
//             })()}
//
//             <Box sx={{ display: 'flex', gap: 1.5 }}>
//                 <Button
//                     variant="contained"
//                     onClick={handleApplyRule}
//                     sx={{ bgcolor: MAROON, color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: MAROON_DARK } }}
//                 >
//                     Apply & Generate Template
//                 </Button>
//                 <Button onClick={() => setShowRuleSelector(false)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
//             </Box>
//         </Box>
//     );
//
//     // ── Per-week donut panel ────────────────────────────────────────────────────
//     const WeekDonutPanel: React.FC<{ wData: WeekData; wPlanned: number; wEstimated: number; weekIdx: number }> =
//         ({ wData, wPlanned, wEstimated, weekIdx }) => {
//             const [chartMode, setChartMode] = React.useState<'actual' | 'planned'>('actual');
//
//             const slices = CATEGORIES.map((cat, i) => ({
//                 name: cat,
//                 value: chartMode === 'actual' ? wData[cat].estimated : wData[cat].planned,
//                 color: CHART_COLORS[i],
//             }));
//             const total   = slices.reduce((s, sl) => s + sl.value, 0);
//             const pctUsed = wPlanned === 0 ? 0 : (wEstimated / wPlanned) * 100;
//             const statusColor = pctUsed > 100 ? RED : pctUsed > 88 ? AMBER : GREEN;
//             const statusLabel = pctUsed > 100 ? 'Over budget' : pctUsed > 88 ? 'Near limit' : 'On track';
//
//             const DonutTooltip = ({ active, payload }: any) => {
//                 if (!active || !payload?.length) return null;
//                 const p = payload[0];
//                 return (
//                     <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.13)', border: `1px solid ${alpha(p.payload.color, 0.25)}` }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
//                             <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.payload.color }} />
//                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: NAVY }}>{p.name}</Typography>
//                         </Box>
//                         <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: p.payload.color, fontVariantNumeric: 'tabular-nums' }}>
//                             ${fmt(p.value)}
//                         </Typography>
//                         <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
//                             {total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}% of {chartMode}
//                         </Typography>
//                     </Box>
//                 );
//             };
//
//             return (
//                 <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
//                     {/* Header: title + toggle */}
//                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
//                         <Box>
//                             <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: SLATE }}>
//                                 Week {weekIdx + 1} · Spending
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
//                                 <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor }} />
//                                 <Typography sx={{ fontSize: '0.65rem', color: statusColor, fontWeight: 700 }}>{statusLabel}</Typography>
//                             </Box>
//                         </Box>
//                         {/* Planned / Actual toggle */}
//                         <Box sx={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.1)}` }}>
//                             {(['actual', 'planned'] as const).map(mode => (
//                                 <Box
//                                     key={mode}
//                                     onClick={() => setChartMode(mode)}
//                                     sx={{
//                                         px: 1.1, py: 0.4, cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700,
//                                         textTransform: 'capitalize',
//                                         bgcolor: chartMode === mode ? MAROON : '#fff',
//                                         color: chartMode === mode ? '#fff' : SLATE,
//                                         transition: 'all 0.15s',
//                                         '&:hover': chartMode !== mode ? { bgcolor: alpha(MAROON, 0.06) } : {},
//                                     }}
//                                 >
//                                     {mode}
//                                 </Box>
//                             ))}
//                         </Box>
//                     </Box>
//
//                     {/* Donut chart */}
//                     <Box sx={{ position: 'relative', height: 190, flexShrink: 0 }}>
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={slices}
//                                     dataKey="value"
//                                     cx="50%" cy="50%"
//                                     innerRadius={55} outerRadius={80}
//                                     paddingAngle={3}
//                                     strokeWidth={0}
//                                     animationBegin={0}
//                                     animationDuration={500}
//                                 >
//                                     {slices.map((s, i) => (
//                                         <Cell key={i} fill={s.color} />
//                                     ))}
//                                 </Pie>
//                                 <RechartsTooltip content={<DonutTooltip />} />
//                             </PieChart>
//                         </ResponsiveContainer>
//
//                         {/* Center content */}
//                         <Box sx={{
//                             position: 'absolute', top: '50%', left: '50%',
//                             transform: 'translate(-50%, -50%)',
//                             textAlign: 'center', pointerEvents: 'none', width: 88,
//                         }}>
//                             <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: statusColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
//                                 {pctUsed.toFixed(0)}%
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.55rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', mt: 0.25 }}>
//                                 of budget
//                             </Typography>
//                             <Divider sx={{ my: 0.5, borderColor: alpha('#000', 0.08) }} />
//                             <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
//                                 ${fmt(wEstimated)}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.55rem', color: SLATE }}>spent</Typography>
//                         </Box>
//                     </Box>
//
//                     {/* Category breakdown list */}
//                     <Box sx={{ flex: 1, mt: 1 }}>
//                         {CATEGORIES.map((cat, i) => {
//                             const planned = wData[cat].planned;
//                             const actual  = wData[cat].estimated;
//                             const pct     = planned === 0 ? 0 : (actual / planned) * 100;
//                             const isOver  = actual > planned;
//                             const barColor = isOver ? RED : pct > 88 ? AMBER : CHART_COLORS[i];
//
//                             return (
//                                 <Box key={cat} sx={{ mb: 1.25 }}>
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
//                                             <Box sx={{ width: 9, height: 9, borderRadius: '3px', bgcolor: CHART_COLORS[i] }} />
//                                             <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
//                                             {isOver && (
//                                                 <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: RED, bgcolor: alpha(RED, 0.09), px: 0.5, py: 0.1, borderRadius: '3px' }}>
//                                                     +${fmt(actual - planned)}
//                                                 </Typography>
//                                             )}
//                                         </Box>
//                                         <Typography sx={{ fontSize: '0.68rem', color: barColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
//                                             {pct.toFixed(0)}%
//                                         </Typography>
//                                     </Box>
//                                     <Box sx={{ position: 'relative', height: 5, borderRadius: 3, bgcolor: alpha(barColor, 0.12) }}>
//                                         <Box sx={{
//                                             position: 'absolute', left: 0, top: 0, bottom: 0,
//                                             width: `${Math.min(pct, 100)}%`,
//                                             bgcolor: barColor, borderRadius: 3,
//                                             transition: 'width 0.4s ease',
//                                         }} />
//                                         {/* Planned marker line at 100% */}
//                                         <Box sx={{
//                                             position: 'absolute', right: 0, top: -2, bottom: -2,
//                                             width: 2, bgcolor: alpha('#000', 0.15), borderRadius: 1,
//                                         }} />
//                                     </Box>
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
//                                         <Typography sx={{ fontSize: '0.6rem', color: SLATE, fontVariantNumeric: 'tabular-nums' }}>
//                                             ${fmt(actual)} actual
//                                         </Typography>
//                                         <Typography sx={{ fontSize: '0.6rem', color: alpha(SLATE, 0.7), fontVariantNumeric: 'tabular-nums' }}>
//                                             ${fmt(planned)} planned
//                                         </Typography>
//                                     </Box>
//                                 </Box>
//                             );
//                         })}
//                     </Box>
//                 </Box>
//             );
//         };
//
//     // ── Table renderer ─────────────────────────────────────────────────────────
//     const renderTable = () => (
//         <Box sx={{ borderRadius: '12px', border: `1px solid ${alpha('#000', 0.07)}`, overflow: 'hidden', '&:hover': { boxShadow: `0 4px 24px ${alpha('#000', 0.08)}` }, transition: 'box-shadow 0.25s' }}>
//             {/* Shared table header */}
//             <Table sx={{ minWidth: 650 }}>
//                 <TableHead>
//                     <TableRow sx={{ bgcolor: alpha(MAROON, 0.04) }}>
//                         {['Week Period', 'Category', 'Planned', 'Actual', 'Spending %', 'Savings %', 'Savings Contribution'].map((h, i) => (
//                             <TableCell key={h} align={i >= 2 ? 'right' : 'left'} sx={{ fontWeight: 800, color: MAROON, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.75, px: 2, whiteSpace: 'nowrap' }}>
//                                 {h}
//                             </TableCell>
//                         ))}
//                     </TableRow>
//                 </TableHead>
//             </Table>
//
//             {isLoading ? (
//                 <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /></Box>
//             ) : (
//                 weekDateRanges.map((weekRange, weekIdx) => {
//                     const weekKey    = `week${weekIdx + 1}` as keyof BudgetData;
//                     const wData      = budgetData[weekKey];
//                     const isCollapsed = collapsedWeeks.has(weekIdx);
//                     const acctBal    = weekAccountBalances[weekKey];
//                     const wPlanned   = CATEGORIES.reduce((s, c) => s + wData[c].planned, 0);
//                     const wEstimated = CATEGORIES.reduce((s, c) => s + wData[c].estimated, 0);
//                     const wSavings   = CATEGORIES.reduce((s, c) => s + calcSavingsContrib(wData[c].remaining), 0);
//                     const wPctSaved  = calcPctSaved(wPlanned, wEstimated);
//                     const wActualPct = calcActualPct(wPlanned, wEstimated);
//
//                     return (
//                         <Box key={weekRange} sx={{ borderTop: `2px solid ${alpha(MAROON, 0.1)}` }}>
//                             {/* ── Week header row (always visible) ── */}
//                             <Table sx={{ minWidth: 650 }}>
//                                 <TableBody>
//                                     <TableRow
//                                         onClick={() => toggleWeek(weekIdx)}
//                                         sx={{ cursor: 'pointer', bgcolor: alpha(MAROON, 0.02), '&:hover': { bgcolor: alpha(MAROON, 0.05) } }}
//                                     >
//                                         <TableCell sx={{ py: 1.75, px: 2, width: '22%' }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                                 <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: MAROON, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                     {isCollapsed ? <ExpandMore sx={{ fontSize: '1rem' }} /> : <ExpandLess sx={{ fontSize: '1rem' }} />}
//                                                 </Box>
//                                                 <Typography sx={{ fontWeight: 800, color: MAROON, fontSize: '0.82rem' }}>{weekRange}</Typography>
//                                             </Box>
//                                         </TableCell>
//                                         <TableCell sx={{ py: 1.75, px: 2 }}>
//                                             <Typography sx={{ fontSize: '0.75rem', color: SLATE, fontStyle: 'italic' }}>
//                                                 {isCollapsed ? 'Expand to see details' : 'Click to collapse'}
//                                             </Typography>
//                                         </TableCell>
//                                         <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.88rem', py: 1.75, px: 2 }}>${fmt(wPlanned)}</TableCell>
//                                         <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.88rem', py: 1.75, px: 2 }}>${fmt(wEstimated)}</TableCell>
//                                         <TableCell align="right" sx={{ py: 1.75, px: 2 }}>
//                                             <Box sx={{ px: 1, py: 0.35, borderRadius: '20px', bgcolor: alpha(SLATE, 0.08), display: 'inline-block' }}>
//                                                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{wActualPct.toFixed(1)}%</Typography>
//                                             </Box>
//                                         </TableCell>
//                                         <TableCell align="right" sx={{ py: 1.75, px: 2 }}>
//                                             <Box sx={{ px: 1, py: 0.35, borderRadius: '20px', bgcolor: alpha(wPctSaved >= 0 ? GREEN : RED, 0.1), display: 'inline-block' }}>
//                                                 <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: wPctSaved >= 0 ? GREEN : RED }}>
//                                                     {wPctSaved >= 0 ? '+' : ''}{wPctSaved.toFixed(1)}%
//                                                 </Typography>
//                                             </Box>
//                                         </TableCell>
//                                         <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.82rem', color: wSavings >= 0 ? GREEN : RED, py: 1.75, px: 2 }}>
//                                             ${fmt(Math.abs(wSavings))} {wSavings >= 0 ? 'under' : 'over'}
//                                         </TableCell>
//                                     </TableRow>
//                                 </TableBody>
//                             </Table>
//
//                             {/* ── Expanded content ── */}
//                             {!isCollapsed && (() => {
//                                 const expandView = weekExpandedView[weekIdx] ?? 'table';
//                                 const toggleExpandView = (v: 'table' | 'chart') =>
//                                     setWeekExpandedView(prev => ({ ...prev, [weekIdx]: v }));
//
//                                 return (
//                                     <Box sx={{ bgcolor: alpha(MAROON, 0.01) }}>
//                                         {/* Sub-header: view toggle */}
//                                         <Box sx={{
//                                             display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
//                                             px: 2, py: 1, borderBottom: `1px solid ${alpha('#000', 0.06)}`,
//                                             bgcolor: '#fff', gap: 1,
//                                         }}>
//                                             <Typography sx={{ fontSize: '0.68rem', color: SLATE, mr: 0.5 }}>View as:</Typography>
//                                             {([
//                                                 { v: 'table' as const, label: 'Table' },
//                                                 { v: 'chart' as const, label: 'Chart' },
//                                             ]).map(({ v, label }) => (
//                                                 <Box
//                                                     key={v}
//                                                     onClick={() => toggleExpandView(v)}
//                                                     sx={{
//                                                         px: 1.5, py: 0.4, borderRadius: '7px', cursor: 'pointer',
//                                                         fontSize: '0.72rem', fontWeight: 700,
//                                                         border: `1px solid ${expandView === v ? MAROON : alpha('#000', 0.1)}`,
//                                                         bgcolor: expandView === v ? alpha(MAROON, 0.08) : '#fff',
//                                                         color: expandView === v ? MAROON : SLATE,
//                                                         transition: 'all 0.15s',
//                                                         '&:hover': { borderColor: MAROON, color: MAROON },
//                                                     }}
//                                                 >
//                                                     {label}
//                                                 </Box>
//                                             ))}
//                                         </Box>
//
//                                         {/* Table view */}
//                                         {expandView === 'table' && (
//                                             <Table>
//                                                 <TableBody>
//                                                     {CATEGORIES.map((cat, catIdx) => {
//                                                         const d          = wData[cat];
//                                                         const pctSaved   = calcPctSaved(d.planned, d.estimated);
//                                                         const savingsC   = calcSavingsContrib(d.remaining);
//                                                         const actualPct  = calcActualPct(d.planned, d.estimated);
//                                                         const overBudget = d.estimated > d.planned;
//                                                         return (
//                                                             <TableRow
//                                                                 key={`${weekRange}-${cat}`}
//                                                                 sx={{
//                                                                     '&:hover': { bgcolor: alpha(CHART_COLORS[catIdx], 0.04) },
//                                                                     borderLeft: `3px solid ${overBudget ? RED : CHART_COLORS[catIdx]}`,
//                                                                 }}
//                                                             >
//                                                                 <TableCell sx={{ py: 1.75, px: 2, width: '22%' }}>
//                                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                                         <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_COLORS[catIdx], flexShrink: 0 }} />
//                                                                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{cat}</Typography>
//                                                                         {overBudget && (
//                                                                             <Box sx={{ px: 0.6, py: 0.1, borderRadius: '4px', bgcolor: alpha(RED, 0.1) }}>
//                                                                                 <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: RED }}>OVER</Typography>
//                                                                             </Box>
//                                                                         )}
//                                                                     </Box>
//                                                                 </TableCell>
//                                                                 <TableCell align="right" sx={{ fontSize: '0.82rem', py: 1.75, px: 2, color: SLATE, fontVariantNumeric: 'tabular-nums' }}>${fmt(d.planned)}</TableCell>
//                                                                 <TableCell align="right" sx={{ fontSize: '0.82rem', py: 1.75, px: 2, color: overBudget ? RED : NAVY, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${fmt(d.estimated)}</TableCell>
//                                                                 <TableCell align="right" sx={{ fontSize: '0.82rem', py: 1.75, px: 2, color: SLATE }}>{actualPct.toFixed(1)}%</TableCell>
//                                                                 <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700, py: 1.75, px: 2, color: pctSaved >= 0 ? GREEN : RED }}>
//                                                                     {pctSaved >= 0 ? '+' : ''}{pctSaved.toFixed(1)}%
//                                                                 </TableCell>
//                                                                 <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 600, py: 1.75, px: 2, color: savingsC >= 0 ? GREEN : RED, fontVariantNumeric: 'tabular-nums' }}>
//                                                                     ${fmt(Math.abs(savingsC))} {savingsC >= 0 ? 'under' : 'over'}
//                                                                 </TableCell>
//                                                             </TableRow>
//                                                         );
//                                                     })}
//                                                     {/* Account balance row */}
//                                                     <TableRow sx={{ bgcolor: alpha(TEAL, 0.03), borderTop: `1px solid ${alpha(TEAL, 0.12)}` }}>
//                                                         <TableCell sx={{ py: 1.5, px: 2 }}>
//                                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                                                                 <AccountBalance sx={{ fontSize: '0.95rem', color: TEAL }} />
//                                                                 <Typography sx={{ fontWeight: 800, color: TEAL, fontSize: '0.78rem' }}>Account Balance</Typography>
//                                                             </Box>
//                                                         </TableCell>
//                                                         <TableCell colSpan={5} align="right" sx={{ fontWeight: 800, fontSize: '0.9rem', color: TEAL, py: 1.5, px: 2, fontVariantNumeric: 'tabular-nums' }}>
//                                                             ${fmt(acctBal)}
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 </TableBody>
//                                             </Table>
//                                         )}
//
//                                         {/* Chart view */}
//                                         {expandView === 'chart' && (
//                                             <Box sx={{ p: 3, maxWidth: 420, mx: 'auto' }}>
//                                                 <WeekDonutPanel wData={wData} wPlanned={wPlanned} wEstimated={wEstimated} weekIdx={weekIdx} />
//                                             </Box>
//                                         )}
//                                     </Box>
//                                 );
//                             })()}
//                         </Box>
//                     );
//                 })
//             )}
//         </Box>
//     );
//
//     // ── Statistics view ────────────────────────────────────────────────────────
//     const renderStatistics = () => (
//         <Grid container spacing={3}>
//             {/* Bar chart: planned vs actual by week */}
//             <Grid item xs={12} md={7}>
//                 <Card sx={{ p: 2.5, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.07)}` }}>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY, mb: 2 }}>Weekly: Planned vs Actual</Typography>
//                     <ResponsiveContainer width="100%" height={220}>
//                         <BarChart data={barData} barGap={4}>
//                             <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
//                             <XAxis dataKey="name" tick={{ fontSize: 11, fill: SLATE }} />
//                             <YAxis tick={{ fontSize: 11, fill: SLATE }} tickFormatter={v => `$${v}`} />
//                             <RechartsTooltip formatter={(v: any) => [`$${fmt(v)}`, '']} contentStyle={{ borderRadius: 8, border: `1px solid ${alpha(MAROON, 0.15)}` }} />
//                             <Bar dataKey="Planned" fill={alpha(TEAL, 0.6)} radius={[4, 4, 0, 0]} />
//                             <Bar dataKey="Actual" fill={MAROON} radius={[4, 4, 0, 0]} />
//                             <Legend formatter={v => <span style={{ fontSize: 11, color: SLATE, fontWeight: 600 }}>{v}</span>} />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </Card>
//             </Grid>
//
//             {/* Pie: category breakdown */}
//             <Grid item xs={12} md={5}>
//                 <Card sx={{ p: 2.5, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.07)}` }}>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY, mb: 2 }}>Spending by Category</Typography>
//                     <ResponsiveContainer width="100%" height={220}>
//                         <PieChart>
//                             <Pie data={pieData} dataKey="estimated" cx="50%" cy="45%" outerRadius={72} labelLine={false}
//                                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
//                                 {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
//                             </Pie>
//                             <Legend formatter={v => <span style={{ fontSize: 11, color: SLATE, fontWeight: 600 }}>{v}</span>} />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </Card>
//             </Grid>
//
//             {/* Monthly summary card */}
//             <Grid item xs={12}>
//                 <Card sx={{ p: 2.5, borderRadius: '12px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.07)}` }}>
//                     <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY, mb: 2 }}>Monthly Summary</Typography>
//                     <Grid container spacing={2}>
//                         {[
//                             { label: 'Budget Goal', value: `$${fmt(budgetGoal)}`, color: SLATE },
//                             { label: 'Total Planned', value: `$${fmt(totalPlanned)}`, color: NAVY },
//                             { label: 'Total Spent', value: `$${fmt(totalSpent)}`, color: MAROON },
//                             { label: 'Savings %', value: `${percentageSaved >= 0 ? '+' : ''}${percentageSaved.toFixed(1)}%`, color: percentageSaved >= 0 ? GREEN : RED },
//                             { label: 'Over Budget', value: `${spentOverBudgetPercentage > 0 ? '+' : ''}${spentOverBudgetPercentage.toFixed(1)}%`, color: spentOverBudgetPercentage > 0 ? RED : GREEN },
//                         ].map(({ label, value, color }) => (
//                             <Grid item xs={6} sm={4} md key={label}>
//                                 <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.14)}` }}>
//                                     <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.5 }}>{label}</Typography>
//                                     <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
//                                 </Box>
//                             </Grid>
//                         ))}
//                     </Grid>
//                 </Card>
//             </Grid>
//         </Grid>
//     );
//
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', bgcolor: BG }}>
//             <Sidebar />
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//
//                 {/* ── Page header ── */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
//                         <Box>
//                             <Typography variant="h4" sx={{ fontWeight: 900, color: NAVY, letterSpacing: '-0.025em', lineHeight: 1 }}>
//                                 Budget Planner
//                             </Typography>
//                             <Typography sx={{ color: SLATE, mt: 0.75, fontSize: '0.9rem' }}>
//                                 Track weekly spending · Apply proven budget rules
//                             </Typography>
//                         </Box>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             {[
//                                 { dir: 'prev', Icon: ChevronLeft },
//                                 { dir: 'next', Icon: ChevronRight },
//                             ].map(({ dir, Icon }, i) => (
//                                 <React.Fragment key={dir}>
//                                     {i === 1 && (
//                                         <Card sx={{ px: 2, py: 0.85, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '10px', boxShadow: 'none', border: `1px solid ${alpha('#000', 0.09)}` }}>
//                                             <CalendarToday sx={{ fontSize: 16, color: SLATE }} />
//                                             <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: NAVY }}>{currentMonth}</Typography>
//                                         </Card>
//                                     )}
//                                     <IconButton
//                                         onClick={() => handleMonthChange(dir as 'prev' | 'next')}
//                                         sx={{ bgcolor: '#fff', border: `1px solid ${alpha('#000', 0.09)}`, borderRadius: '9px', width: 40, height: 40, '&:hover': { bgcolor: MAROON, color: '#fff', borderColor: MAROON } }}
//                                     >
//                                         <Icon sx={{ fontSize: 18 }} />
//                                     </IconButton>
//                                 </React.Fragment>
//                             ))}
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* ── Toolbar row ── */}
//                 <Grow in={animateIn} timeout={700}>
//                     <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
//                         {/* Template type pills */}
//                         <Box sx={{ display: 'flex', gap: 0.75 }}>
//                             {['Monthly', 'Biweekly', '2-Monthly', '3-Monthly'].map(type => (
//                                 <Box
//                                     key={type}
//                                     onClick={() => { setSelectedTemplateType(type); const t = bpTemplates.find(b => b.type === type); if (t) setSelectedTemplateId(t.id); }}
//                                     sx={{
//                                         px: 1.5, py: 0.6, borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
//                                         border: `1px solid ${selectedTemplateType === type ? MAROON : alpha('#000', 0.1)}`,
//                                         bgcolor: selectedTemplateType === type ? alpha(MAROON, 0.08) : '#fff',
//                                         color: selectedTemplateType === type ? MAROON : SLATE,
//                                         '&:hover': { borderColor: MAROON, color: MAROON },
//                                         transition: 'all 0.15s',
//                                     }}
//                                 >
//                                     {type}
//                                 </Box>
//                             ))}
//                         </Box>
//
//                         {/* Template selector */}
//                         <FormControl size="small" sx={{ minWidth: 200 }}>
//                             <InputLabel sx={{ fontSize: '0.82rem', color: SLATE }}>Template</InputLabel>
//                             <Select
//                                 value={selectedTemplateId || ''}
//                                 label="Template"
//                                 onChange={e => setSelectedTemplateId(e.target.value)}
//                                 sx={{ bgcolor: '#fff', borderRadius: '8px', fontSize: '0.82rem',
//                                     '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#000', 0.12) },
//                                     '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: MAROON } }}
//                             >
//                                 {bpTemplates.filter(t => t.type === selectedTemplateType).map(t => (
//                                     <MenuItem key={t.id} value={t.id}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                             {t.ruleId && (() => { const r = BUDGET_RULES.find(x => x.id === t.ruleId); return r ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} /> : null; })()}
//                                             <Typography sx={{ fontSize: '0.82rem' }}>{t.name}</Typography>
//                                         </Box>
//                                     </MenuItem>
//                                 ))}
//                             </Select>
//                         </FormControl>
//
//                         <Box sx={{ flex: 1 }} />
//
//                         {/* Apply Rule button */}
//                         <Button
//                             variant="outlined"
//                             startIcon={<Sparkles size={15} />}
//                             onClick={() => setShowRuleSelector(v => !v)}
//                             sx={{
//                                 borderColor: TEAL, color: TEAL, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
//                                 '&:hover': { bgcolor: alpha(TEAL, 0.06), borderColor: TEAL },
//                             }}
//                         >
//                             Apply Budget Rule
//                         </Button>
//
//                         {/* Save template */}
//                         <Button
//                             variant="contained"
//                             onClick={() => setOpenDialog(true)}
//                             sx={{ bgcolor: MAROON, color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', '&:hover': { bgcolor: MAROON_DARK } }}
//                         >
//                             Save as Template
//                         </Button>
//                     </Box>
//                 </Grow>
//
//                 {/* ── Active rule banner ── */}
//                 {activeRule && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 2.5, borderRadius: '10px', bgcolor: alpha(activeRule.color, 0.06), border: `1px solid ${alpha(activeRule.color, 0.2)}` }}>
//                         <Box sx={{ color: activeRule.color, display: 'flex' }}>{activeRule.icon}</Box>
//                         <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>
//                             Using: <span style={{ color: activeRule.color }}>{activeRule.name}</span> —&nbsp;
//                             <span style={{ color: SLATE, fontWeight: 400 }}>{activeRule.description}</span>
//                         </Typography>
//                         <Box sx={{ flex: 1 }} />
//                         <Chip label={`Based on $${(currentTemplate as BPTemplate).monthlyIncome?.toLocaleString() ?? '—'}/mo`} size="small" sx={{ bgcolor: alpha(activeRule.color, 0.1), color: activeRule.color, fontWeight: 700, fontSize: '0.68rem' }} />
//                     </Box>
//                 )}
//
//                 {/* ── Rule selector panel ── */}
//                 {showRuleSelector && <RuleSelectorPanel />}
//
//                 {/* ── Two-column layout: main content + side panel ── */}
//                 <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
//
//                     {/* ── Main card ── */}
//                     <Grow in={animateIn} timeout={800}>
//                         <Card sx={{ flex: 1, minWidth: 0, p: 3, borderRadius: '16px', boxShadow: `0 4px 24px ${alpha('#000', 0.07)}`, border: `1px solid ${alpha('#000', 0.06)}` }}>
//
//                             {/* Card header with summary stats */}
//                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
//                                 <Box>
//                                     <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: NAVY, mb: 0.25 }}>Monthly Breakdown</Typography>
//                                     <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>Week-by-week category spending</Typography>
//                                 </Box>
//
//                                 {/* Mini stat pills */}
//                                 <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
//                                     {[
//                                         { label: 'Planned', val: `$${fmt(totalPlanned)}`, color: SLATE },
//                                         { label: 'Spent', val: `$${fmt(totalSpent)}`, color: MAROON },
//                                         { label: budgetUsedPct > 100 ? 'Over' : 'Used', val: `${budgetUsedPct.toFixed(1)}%`, color: progressColor },
//                                     ].map(({ label, val, color }) => (
//                                         <Box key={label} sx={{ px: 1.5, py: 0.6, borderRadius: '8px', bgcolor: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.18)}` }}>
//                                             <Typography sx={{ fontSize: '0.65rem', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</Typography>
//                                             <Typography sx={{ fontSize: '0.88rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{val}</Typography>
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//
//                             {/* Budget bar */}
//                             <Box sx={{ mb: 3 }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
//                                     <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>Budget utilization</Typography>
//                                     <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: progressColor }}>{budgetUsedPct.toFixed(1)}%</Typography>
//                                 </Box>
//                                 <LinearProgress variant="determinate" value={Math.min(budgetUsedPct, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(progressColor, 0.12), '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 } }} />
//                             </Box>
//
//                             {/* View toggle */}
//                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                                 <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => { if (v) setViewMode(v); }} size="small"
//                                                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 2, py: 0.75, color: SLATE, border: `1px solid ${alpha('#000', 0.1)}`, '&.Mui-selected': { bgcolor: MAROON, color: '#fff', borderColor: MAROON } } }}>
//                                     <ToggleButton value="template">Table View</ToggleButton>
//                                     <ToggleButton value="statistics">Statistics</ToggleButton>
//                                 </ToggleButtonGroup>
//                             </Box>
//
//                             {viewMode === 'template' ? renderTable() : renderStatistics()}
//
//                             {/* Monthly totals strip */}
//                             <Box sx={{ mt: 3, p: 2.5, borderRadius: '12px', bgcolor: alpha(MAROON, 0.03), border: `1px solid ${alpha(MAROON, 0.1)}` }}>
//                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                                     <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: NAVY }}>Monthly Totals</Typography>
//                                     <Button size="small" variant="outlined" onClick={() => setOpenDialog(true)} sx={{ borderColor: alpha(MAROON, 0.3), color: MAROON, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: '7px', '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
//                                         Save as Template
//                                     </Button>
//                                 </Box>
//                                 <TableContainer sx={{ borderRadius: '8px', border: `1px solid ${alpha('#000', 0.07)}` }}>
//                                     <Table size="small">
//                                         <TableHead>
//                                             <TableRow sx={{ bgcolor: alpha(MAROON, 0.04) }}>
//                                                 {['Budget Goal', 'Total Planned', 'Total Spent', 'Savings %', 'Over Budget %'].map(h => (
//                                                     <TableCell key={h} sx={{ fontWeight: 800, color: MAROON, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.25 }}>{h}</TableCell>
//                                                 ))}
//                                             </TableRow>
//                                         </TableHead>
//                                         <TableBody>
//                                             <TableRow>
//                                                 {[
//                                                     { val: `$${fmt(budgetGoal)}`, color: NAVY },
//                                                     { val: `$${fmt(totalPlanned)}`, color: NAVY },
//                                                     { val: `$${fmt(totalSpent)}`, color: MAROON },
//                                                     { val: `${percentageSaved >= 0 ? '+' : ''}${percentageSaved.toFixed(1)}%`, color: percentageSaved >= 0 ? GREEN : RED },
//                                                     { val: `${spentOverBudgetPercentage > 0 ? '+' : ''}${spentOverBudgetPercentage.toFixed(1)}%`, color: spentOverBudgetPercentage > 0 ? RED : GREEN },
//                                                 ].map(({ val, color }, i) => (
//                                                     <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.88rem', color, py: 1.5, fontVariantNumeric: 'tabular-nums' }}>{val}</TableCell>
//                                                 ))}
//                                             </TableRow>
//                                         </TableBody>
//                                     </Table>
//                                 </TableContainer>
//                             </Box>
//                         </Card>
//                     </Grow>
//
//                     {/* ── Side panel ── */}
//                     <Grow in={animateIn} timeout={900}>
//                         <Box sx={{ width: 320, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)' }}>
//                             <BudgetPlannerSidePanel
//                                 budgetData={budgetData}
//                                 totalPlanned={totalPlanned}
//                                 totalSpent={totalSpent}
//                                 monthlyIncome={(currentTemplate as BPTemplate).monthlyIncome ?? 5000}
//                                 currentRuleId={(currentTemplate as BPTemplate).ruleId}
//                                 currentMonth={currentMonth}
//                             />
//                         </Box>
//                     </Grow>
//
//                 </Box>{/* end two-column */}
//             </Container>
//
//             {/* ── Save template dialog ── */}
//             <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 400 } }}>
//                 <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>Save as Template</DialogTitle>
//                 <DialogContent>
//                     <TextField label="Template Name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} fullWidth margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
//                     <FormControl fullWidth margin="normal">
//                         <InputLabel>Template Type</InputLabel>
//                         <Select value={newTemplateType} onChange={e => setNewTemplateType(e.target.value)} label="Template Type" sx={{ borderRadius: '8px' }}>
//                             {['Monthly', 'Biweekly', '2-Monthly', '3-Monthly'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
//                         </Select>
//                     </FormControl>
//                 </DialogContent>
//                 <DialogActions sx={{ px: 3, pb: 2 }}>
//                     <Button onClick={() => setOpenDialog(false)} sx={{ color: SLATE, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
//                     <Button onClick={handleSaveTemplate} variant="contained" disabled={!newTemplateName} sx={{ bgcolor: MAROON, textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: MAROON_DARK } }}>Save</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// };
//
// export default BudgetPlanner;
