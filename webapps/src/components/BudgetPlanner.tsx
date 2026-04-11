import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Card, Grid, Container, alpha, Grow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Chip, LinearProgress,
    Divider, IconButton, Stack,
} from '@mui/material';
import { Add, Edit, EditOff, Save } from '@mui/icons-material';
import {
    Wallet, Target, Sparkles, CheckCircle2, PiggyBank, ShoppingBag, Zap,
    TableIcon, BarChart2, Award,
    ArrowUpRight, ArrowDownRight, Calendar, TrendingUp,
} from 'lucide-react';
import {
    PieChart as RePieChart, Pie, Cell, Tooltip as RTooltip,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, ReferenceLine,
} from 'recharts';
import Sidebar from './Sidebar';
import ManualTemplateWizard from './ManualTemplateWizard';
import BudgetOptimizerPanel from './BudgetOptimizerPanel';
import BudgetTemplateWizard from "./BudgetTemplateWizard";

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
const BLUE        = '#378ADD';

const CAT_COLORS: Record<string,string> = {
    Housing:'#1D9E75', Food:'#6b1a1a', Transportation:'#BA7517', Entertainment:'#378ADD', Other:'#D4537E',
};
const CHART_COLORS = ['#1D9E75','#6b1a1a','#BA7517','#378ADD','#D4537E','#7c3aed','#0ea5e9'];

const CATEGORY_GROUPS: Record<string,string> = {
    Rent:'Housing', Utilities:'Housing', Electric:'Housing', 'Gas Bill':'Housing',
    Groceries:'Food', 'Order out':'Food', 'Coffee Supplies':'Food',
    Gas:'Transportation',
    Golf:'Entertainment', Subscriptions:'Entertainment', 'Trip Cost':'Entertainment', Haircut:'Entertainment',
    Insurance:'Other', 'Phone Insurance':'Other', Payments:'Other', 'Other Stuff':'Other', Savings:'Other',
};
const GROUP_ORDER = ['Housing','Food','Transportation','Entertainment','Other'];
const CAT_PCTS: Record<string,number> = {Housing:.44,Food:.22,Transportation:.09,Entertainment:.16,Other:.09};

type PeriodType = 'Weekly'|'Biweekly'|'Monthly'|'2-Monthly'|'3-Monthly';
// Two top-level modes: current month tracker vs full planning spreadsheet
type TopViewMode = 'current-month'|'planning';
// Planning sub-view: classic spreadsheet or rolling grouped
type PlanningSubView = 'classic'|'rolling';
type PeriodFilter = 'Weekly'|'Biweekly'|'Monthly';

interface SpreadsheetRow {
    label: string;
    rowType: 'expense'|'salary'|'expenses'|'balance'|'extra';
    values: (number|null)[];
}
interface MonthGroup { name: string; cols: number[]; }
interface SpreadsheetTemplate {
    id: string; name: string; periodType: PeriodType|'standard';
    months: MonthGroup[]; periods: string[]; rows: SpreadsheetRow[];
    viewOverride?: 'rolling-balance'|'rolling-planned-actual'|'forecast-classic'|'forecast-visual';
}
interface BudgetRule {
    id: string; name: string; shortName: string; description: string;
    tagline: string; icon: React.ReactNode; color: string;
    allocations: Record<string,number>; bestFor: string;
}

const BUDGET_RULES: BudgetRule[] = [
    {id:'50-30-20',name:'50/30/20 Rule',shortName:'50/30/20',description:'Needs 50% · Wants 30% · Savings 20%',tagline:'The classic balanced approach',icon:<Target size={18}/>,color:TEAL,allocations:{Housing:35,Food:15,Transportation:10,Entertainment:10,Savings:20,Other:10},bestFor:'Most income levels'},
    {id:'70-20-10',name:'70/20/10 Rule',shortName:'70/20/10',description:'Living 70% · Savings 20% · Giving 10%',tagline:'For the generous saver',icon:<PiggyBank size={18}/>,color:'#7c3aed',allocations:{Housing:35,Food:20,Transportation:10,Entertainment:5,Savings:20,Other:10},bestFor:'Wealth-building focus'},
    {id:'80-20',name:'80/20 Rule',shortName:'80/20',description:'Living 80% · Savings 20%',tagline:'Simplified minimalism',icon:<Zap size={18}/>,color:AMBER,allocations:{Housing:40,Food:20,Transportation:10,Entertainment:10,Savings:20,Other:0},bestFor:'Beginners'},
    {id:'60-20-20',name:'60/20/20 Rule',shortName:'60/20/20',description:'Committed 60% · Savings 20% · Fun 20%',tagline:'Strict essentials',icon:<ShoppingBag size={18}/>,color:MAROON,allocations:{Housing:35,Food:15,Transportation:10,Entertainment:20,Savings:20,Other:0},bestFor:'High earners'},
    {id:'custom',name:'Custom Rule',shortName:'Custom',description:'Your own allocation mix',tagline:'Full control',icon:<Sparkles size={18}/>,color:'#0ea5e9',allocations:{Housing:30,Food:15,Transportation:10,Entertainment:10,Savings:15,Other:20},bestFor:'Experienced budgeters'},
];

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);});
const fmt  = (n:number) => n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtS = (n:number) => n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
function addDays(d:Date,n:number){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function fmtDate(d:Date){return `${d.getMonth()+1}/${d.getDate()}`;}

function generatePeriods(type:PeriodType,start:Date,end:Date):{periods:string[];months:MonthGroup[]} {
    const periods:string[]=[],mm=new Map<string,number[]>();
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

const DEFAULT_LABELS=['Rent','Gas','Groceries','Insurance','Phone Insurance','Payments','Utilities','Electric','Gas Bill','Golf','Order out','Subscriptions','Trip Cost','Haircut','Other Stuff','Coffee Supplies','Savings'];
function makeBlankRows(n:number):SpreadsheetRow[]{
    const b=()=>Array(n).fill(null) as null[];
    return[...DEFAULT_LABELS.map(l=>({label:l,rowType:'expense' as const,values:b()})),{label:'Salary',rowType:'salary' as const,values:b()},{label:'Expenses',rowType:'expenses' as const,values:b()},{label:'Extra',rowType:'extra' as const,values:b()},{label:'Remaining Balance',rowType:'balance' as const,values:b()}];
}

// ── Shared preset data ────────────────────────────────────────────────────────
const SHARED_ROWS: SpreadsheetRow[] = [
    {label:'Rent',rowType:'expense',values:[1927.03,null,1927,null,707,1220,707,1220,707,1220,null,1917,null,1917,null]},
    {label:'Gas',rowType:'expense',values:[35.37,51.68,39.40,46.38,46,38.86,42,35.06,40.75,34,null,38,38,38,38]},
    {label:'Groceries',rowType:'expense',values:[240.09,262.72,336.99,441.57,131.87,431.20,230,374.56,362.01,175,84.84,235,278,278,278]},
    {label:'Insurance',rowType:'expense',values:[null,80.07,null,null,77.29,null,74.52,null,67.14,null,70.10,null,null,null,null]},
    {label:'Phone Insurance',rowType:'expense',values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Payments',rowType:'expense',values:[29.24,290.21,173.26,505.74,435.27,343,187.18,448.34,256,293.56,56,null,160,null,null]},
    {label:'Utilities',rowType:'expense',values:[null,129.93,null,123.60,null,127.71,null,null,134.30,130.78,null,127,null,null,null]},
    {label:'Electric',rowType:'expense',values:[120.95,null,61.77,null,null,63.89,null,52.77,null,53,null,52,null,null,null]},
    {label:'Gas Bill',rowType:'expense',values:[null,16.50,null,20.75,null,35.11,null,52.75,null,null,35,30,null,null,null]},
    {label:'Golf',rowType:'expense',values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Order out',rowType:'expense',values:[60.06,129.37,171,110.62,100.51,96.10,null,81.64,106.44,43.21,51.32,null,null,null,null]},
    {label:'Subscriptions',rowType:'expense',values:[39.63,82.83,12.79,140.86,43.68,84.94,null,122.33,80.48,17.14,null,null,null,null,null]},
    {label:'Trip Cost',rowType:'expense',values:[null,null,null,null,30,null,null,null,null,null,null,null,null,null,null]},
    {label:'Haircut',rowType:'expense',values:[null,26,26,26,26,27,null,null,null,27,null,null,null,null,null]},
    {label:'Other Stuff',rowType:'expense',values:[9,416.05,470,424,419.14,144,417,16.20,74.14,null,null,null,null,null,null]},
    {label:'Coffee Supplies',rowType:'expense',values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Savings',rowType:'expense',values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Salary',rowType:'salary',values:[2548.23,2257.57,2530.93,1991.95,2171,2272.52,1941,2028,1970,1966,1988,1988,1988,1988,1988]},
    {label:'Expenses',rowType:'expenses',values:[2461.37,1485.36,3218.21,1839.52,2016.76,2611.81,1657.70,2403.65,1828.26,1993.69,297.26,2399,476,2233,316]},
    {label:'Extra',rowType:'extra',values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    {label:'Remaining Balance',rowType:'balance',values:[86.86,859.07,171.79,324.22,478.46,139.17,422.47,46.82,188.56,160.87,1851.61,1440.61,2952.61,2707.61,4379.61]},
];
const SHARED_MONTHS: MonthGroup[] = [
    {name:'November',cols:[0,1]},{name:'December',cols:[2,3,4]},{name:'January',cols:[5,6]},
    {name:'February',cols:[7,8]},{name:'March',cols:[9,10,11]},{name:'April',cols:[12,13,14]},
];

const BIWEEKLY_PERIODS = ['10/23–11/5','11/6–11/19','11/20–12/3','12/4–12/17','12/18–12/31','1/1–1/14','1/15–1/28','1/29–2/11','2/12–2/25','2/26–3/11','3/12–3/25','3/26–4/8','4/8–4/22','4/23–5/6','5/7–5/20'];
const ROLLING_PERIODS  = ['10/23','11/6','11/20','12/4','12/18','1/1','1/15','1/29','2/12','2/26','3/12','3/26','4/8','4/23','5/7'];

// ── All 6 preset templates ────────────────────────────────────────────────────
const NOV_MAY: SpreadsheetTemplate = {
    id:'preset-biweekly', name:'Nov 2024 – May 2025', periodType:'Biweekly',
    months:SHARED_MONTHS, periods:BIWEEKLY_PERIODS,
    rows:SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
};
const ROLLING_TEMPLATE: SpreadsheetTemplate = {
    id:'preset-rolling', name:'Nov 2024 – May 2025 (Rolling)', periodType:'Biweekly',
    months:SHARED_MONTHS, periods:ROLLING_PERIODS,
    rows:SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
};
const ROLLING_BALANCE_TEMPLATE: SpreadsheetTemplate = {
    id:'preset-rolling-balance', name:'Rolling Monthly Balance', periodType:'Biweekly',
    months:SHARED_MONTHS, periods:ROLLING_PERIODS,
    rows:SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
    viewOverride:'rolling-balance',
};
const ROLLING_PLANNED_ACTUAL_TEMPLATE: SpreadsheetTemplate = {
    id:'preset-rolling-planned-actual', name:'Rolling Monthly Planned/Actual', periodType:'Biweekly',
    months:SHARED_MONTHS, periods:ROLLING_PERIODS,
    rows:SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
    viewOverride:'rolling-planned-actual',
};
const FORECAST_CLASSIC_TEMPLATE: SpreadsheetTemplate = {
    id:'preset-forecast-classic', name:'Balance Forecast — Classic', periodType:'Biweekly',
    months:SHARED_MONTHS, periods:ROLLING_PERIODS,
    rows:SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
    viewOverride:'forecast-classic',
};
const FORECAST_VISUAL_TEMPLATE: SpreadsheetTemplate = {
    id:'preset-forecast-visual', name:'Balance Forecast — Visual', periodType:'Biweekly',
    months:SHARED_MONTHS, periods:ROLLING_PERIODS,
    rows:SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
    viewOverride:'forecast-visual',
};

// ── Derived helpers ───────────────────────────────────────────────────────────
function deriveGroupTotals(t:SpreadsheetTemplate):Record<string,number[]>{
    const g:Record<string,number[]>={};
    GROUP_ORDER.forEach(k=>{g[k]=Array(t.periods.length).fill(0);});
    t.rows.filter(r=>r.rowType==='expense').forEach(row=>{
        const grp=CATEGORY_GROUPS[row.label]??'Other';
        row.values.forEach((v,i)=>{if(v!==null)g[grp][i]+=v;});
    });
    return g;
}
function derivePeriodSummary(t:SpreadsheetTemplate){
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const exp=t.rows.find(r=>r.label==='Expenses')?.values??[];
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    return t.periods.map((_,i)=>({
        period:t.periods[i],income:sal[i]??0,expenses:exp[i]??0,balance:bal[i]??0,
        savings:(sal[i]??0)-(exp[i]??0),
        savingsPct:sal[i]?((sal[i]!-(exp[i]??0))/sal[i]!)*100:0,
        spendPct:sal[i]?((exp[i]??0)/sal[i]!)*100:0,
    }));
}
function filterByPeriod(t:SpreadsheetTemplate,pf:PeriodFilter):SpreadsheetTemplate{
    if(pf!=='Monthly')return t;
    const newPeriods=t.months.map(m=>m.name);
    const newMonths:MonthGroup[]=t.months.map((m,mi)=>({name:m.name,cols:[mi]}));
    const newRows:SpreadsheetRow[]=t.rows.map(row=>({
        ...row,
        values:t.months.map(m=>{
            const sum=m.cols.reduce((a,ci)=>a+(row.values[ci]??0),0);
            return sum===0&&m.cols.every(ci=>row.values[ci]===null)?null:sum;
        }),
    }));
    const expIdx=newRows.findIndex(r=>r.rowType==='expenses');
    const balIdx=newRows.findIndex(r=>r.rowType==='balance');
    const salIdx=newRows.findIndex(r=>r.rowType==='salary');
    if(expIdx>=0){const er=newRows.filter(r=>r.rowType==='expense');newRows[expIdx]={...newRows[expIdx],values:newRows[expIdx].values.map((_,ci)=>er.reduce((s,r)=>s+(r.values[ci]??0),0))};}
    if(balIdx>=0&&salIdx>=0){let run=0;newRows[balIdx]={...newRows[balIdx],values:newRows[balIdx].values.map((_,ci)=>{const s=newRows[salIdx].values[ci]??0;const e=expIdx>=0?newRows[expIdx].values[ci]??0:0;run=run+s-e;return run;})};}
    return{...t,periods:newPeriods,months:newMonths,rows:newRows};
}

// ── Shared UI components ──────────────────────────────────────────────────────
const MaroonCardHeader:React.FC<{icon:React.ReactNode;title:string;subtitle:string;right?:React.ReactNode}> = ({icon,title,subtitle,right}) => (
    <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)`,px:3,py:2,position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Box sx={{position:'absolute',top:-16,right:-16,width:80,height:80,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)'}}/>
        <Box sx={{position:'absolute',bottom:-20,right:50,width:50,height:50,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.04)'}}/>
        <Box sx={{display:'flex',alignItems:'center',gap:1.25,position:'relative'}}>
            <Box sx={{width:30,height:30,borderRadius:'8px',bgcolor:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</Box>
            <Box>
                <Typography sx={{fontWeight:700,fontSize:'0.92rem',color:'#fff',letterSpacing:'-0.01em'}}>{title}</Typography>
                <Typography sx={{fontSize:'0.67rem',color:'rgba(255,255,255,0.7)',mt:0.1}}>{subtitle}</Typography>
            </Box>
        </Box>
        {right&&<Box sx={{position:'relative'}}>{right}</Box>}
    </Box>
);

const PeriodPills:React.FC<{active:PeriodFilter;onChange:(p:PeriodFilter)=>void}> = ({active,onChange}) => (
    <Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:2}}>
        {(['Weekly','Biweekly','Monthly'] as PeriodFilter[]).map(p=>(
            <Box key={p} onClick={()=>onChange(p)} sx={{px:1.5,py:0.45,borderRadius:'20px',cursor:'pointer',fontSize:'0.74rem',fontWeight:600,transition:'all 0.15s',border:`1px solid ${active===p?MAROON:alpha('#000',0.12)}`,bgcolor:active===p?MAROON:'#fff',color:active===p?'#fff':SLATE,'&:hover':{borderColor:MAROON,color:active===p?'#fff':MAROON},userSelect:'none'}}>{p}</Box>
        ))}
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

const thSx=(extra?:object)=>({fontWeight:600,fontSize:'0.7rem',textTransform:'uppercase' as const,letterSpacing:'0.08em',color:MAROON,py:1.25,whiteSpace:'nowrap',bgcolor:'#fdf8f8',borderBottom:`1.5px solid ${alpha(MAROON,0.15)}`,...extra});
const tdSx=(extra?:object)=>({fontSize:'0.8rem',py:0.9,whiteSpace:'nowrap',...extra});

// ── Classic Spreadsheet ───────────────────────────────────────────────────────
const ClassicSpreadsheet:React.FC<{
    template:SpreadsheetTemplate;editMode:boolean;
    onCellChange:(ri:number,ci:number,v:number|null)=>void;
    periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
}> = ({template,editMode,onCellChange,periodFilter,onPeriodFilter}) => {
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const {months,periods,rows}=t;
    const isMonthStart=(ci:number)=>months.some(m=>m.cols[0]===ci);

    const getValColor=(row:SpreadsheetRow,val:number|null,ci:number):string=>{
        if(val===null)return'transparent';
        if(row.rowType==='balance')return val>=0?GREEN:RED;
        if(row.rowType==='expenses'){const sal=rows.find(r=>r.label==='Salary')?.values[ci];return sal&&val>sal?RED:NAVY;}
        return NAVY;
    };
    const solidBg=(rt:SpreadsheetRow['rowType'],ri:number):string=>{
        if(rt==='salary')return '#fdf8f8';
        if(rt==='balance')return '#f0fdf9';
        if(rt==='expenses')return '#f9fafb';
        return ri%2===0?'#ffffff':'#fafbfc';
    };

    return (
        <Box>
            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
            {editMode&&(
                <Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:1.5,px:0.5}}>
                    <Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:AMBER,flexShrink:0}}/>
                    <Typography sx={{fontSize:'0.72rem',color:SLATE}}>Click any expense cell to edit</Typography>
                </Box>
            )}
            <Box sx={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 2px 12px ${alpha(MAROON,0.06)}`}}>
                <TableContainer sx={{overflowX:'auto'}}>
                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
                        <TableHead>
                            <TableRow>
                                <TableCell rowSpan={2} sx={{position:'sticky',left:0,zIndex:6,minWidth:155,background:'#fdf8f8',borderRight:`1.5px solid ${alpha(MAROON,0.2)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.08em',color:MAROON,verticalAlign:'middle',px:2}}>
                                    Category
                                </TableCell>
                                {months.map(m=>(
                                    <TableCell key={m.name} colSpan={m.cols.length} align="center" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:MAROON,py:0.875,bgcolor:'#fdf8f8',borderLeft:`1px solid ${alpha(MAROON,0.15)}`,borderBottom:`1px solid ${alpha(MAROON,0.08)}`}}>{m.name}</TableCell>
                                ))}
                                <TableCell align="right" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:NAVY,py:0.875,bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.15)}`,borderBottom:`1px solid ${alpha(NAVY,0.08)}`,minWidth:80}}>Total</TableCell>
                            </TableRow>
                            <TableRow>
                                {periods.map((p,i)=>(
                                    <TableCell key={i} align="center" sx={{fontWeight:500,fontSize:'0.68rem',color:SLATE,py:0.75,minWidth:84,bgcolor:'#fdf8f8',borderLeft:isMonthStart(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>{p}</TableCell>
                                ))}
                                <TableCell sx={{bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}/>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row,ri)=>{
                                const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);
                                const isSection=row.rowType==='salary';
                                const isSummary=row.rowType==='expenses'||row.rowType==='balance';
                                const bg=solidBg(row.rowType,ri);
                                const canEdit=editMode&&row.rowType!=='balance'&&row.rowType!=='expenses';
                                return(
                                    <TableRow key={row.label} sx={{'&:hover td':{bgcolor:row.rowType==='expense'?alpha(MAROON,0.025):undefined}}}>
                                        <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:bg,borderRight:`1.5px solid ${alpha(MAROON,0.16)}`,borderTop:isSection?`1.5px solid ${alpha(MAROON,0.15)}`:`1px solid ${alpha('#000',0.04)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.1)`,fontWeight:isSection?600:isSummary?600:400,color:row.rowType==='salary'?MAROON:row.rowType==='balance'?'#0f766e':NAVY,whiteSpace:'nowrap',fontSize:'0.79rem',px:2}}>
                                            <Box sx={{display:'flex',alignItems:'center',gap:0.875}}>
                                                {row.rowType==='expense'&&CATEGORY_GROUPS[row.label]&&(
                                                    <Box sx={{width:3,height:13,borderRadius:'1.5px',bgcolor:CAT_COLORS[CATEGORY_GROUPS[row.label]]??SLATE,flexShrink:0}}/>
                                                )}
                                                {row.label}
                                            </Box>
                                        </TableCell>
                                        {row.values.map((val,ci)=>(
                                            <TableCell key={ci} align="right" sx={{zIndex:1,color:getValColor(row,val,ci),bgcolor:canEdit?alpha(AMBER,0.04):bg,fontWeight:isSummary||isSection?600:400,fontSize:isSummary?'0.8rem':'0.79rem',borderLeft:isMonthStart(ci)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:isSection?`1.5px solid ${alpha(MAROON,0.15)}`:`1px solid ${alpha('#000',0.04)}`,p:canEdit?0.25:undefined,fontVariantNumeric:'tabular-nums'}}>
                                                {canEdit?<EditCell value={val} onChange={v=>onCellChange(ri,ci,v)}/>:val!==null?`$${fmt(val)}`:''}
                                            </TableCell>
                                        ))}
                                        <TableCell align="right" sx={{zIndex:1,fontWeight:600,fontSize:isSummary?'0.8rem':'0.79rem',color:row.rowType==='balance'?(rowTotal>=0?GREEN:RED):NAVY,bgcolor:bg,borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:isSection?`1.5px solid ${alpha(MAROON,0.15)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>
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

// ── Rolling Balance View (grouped categories as rows) ─────────────────────────
const RollingBalanceView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const [expandedCats,setExpandedCats]=useState<Set<string>>(new Set());
    const groupTotals=deriveGroupTotals(t);
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);
    const toggleCat=(c:string)=>setExpandedCats(prev=>{const s=new Set(prev);s.has(c)?s.delete(c):s.add(c);return s;});
    const stickyLabelSx=(bg:string,extraBorder?:string):object=>({position:'sticky',left:0,zIndex:4,bgcolor:bg,borderRight:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.1)`,borderTop:extraBorder??`1px solid ${alpha('#000',0.04)}`});
    const CatBadge=({grp}:{grp:string})=><Box sx={{width:20,height:20,borderRadius:'5px',bgcolor:CAT_COLORS[grp],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.85)'}}/></Box>;

    return(
        <Box>
            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:2}}>
                <Box sx={{px:1.25,py:0.4,borderRadius:'5px',bgcolor:alpha(MAROON,0.06),border:`1px solid ${alpha(MAROON,0.14)}`}}>
                    <Typography sx={{fontSize:'0.71rem',fontWeight:500,color:MAROON}}>Category groups as rows · Periods as columns · Click a row to expand</Typography>
                </Box>
            </Box>
            <Box sx={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 2px 12px ${alpha(MAROON,0.06)}`}}>
                <TableContainer sx={{overflowX:'auto'}}>
                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{position:'sticky',left:0,zIndex:6,minWidth:155,background:'#fdf8f8',borderRight:`1.5px solid ${alpha(MAROON,0.22)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.08em',color:MAROON,verticalAlign:'middle',px:2,rowSpan:2}}>Category</TableCell>
                                {t.months.map(m=><TableCell key={m.name} colSpan={m.cols.length} align="center" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:MAROON,py:0.875,bgcolor:'#fdf8f8',borderLeft:`1px solid ${alpha(MAROON,0.15)}`,borderBottom:`1px solid ${alpha(MAROON,0.08)}`}}>{m.name}</TableCell>)}
                                <TableCell align="right" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:NAVY,py:0.875,bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.15)}`,borderBottom:`1px solid ${alpha(NAVY,0.08)}`,minWidth:80}}>Total</TableCell>
                            </TableRow>
                            <TableRow>
                                {t.periods.map((p,i)=><TableCell key={i} align="center" sx={{fontWeight:500,fontSize:'0.68rem',color:SLATE,py:0.75,minWidth:78,bgcolor:'#fdf8f8',borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>{p}</TableCell>)}
                                <TableCell sx={{bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}/>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {GROUP_ORDER.map(grp=>{
                                const vals=groupTotals[grp],total=vals.reduce((a,v)=>a+v,0),isExp=expandedCats.has(grp),color=CAT_COLORS[grp];
                                const subRows=t.rows.filter(r=>r.rowType==='expense'&&(CATEGORY_GROUPS[r.label]??'Other')===grp&&r.values.some(v=>v!==null&&v>0));
                                return(
                                    <React.Fragment key={grp}>
                                        <TableRow hover onClick={()=>toggleCat(grp)} sx={{cursor:'pointer',bgcolor:isExp?alpha(color,0.035):'#fff','&:hover td':{bgcolor:alpha(color,0.035)}}}>
                                            <TableCell sx={{...stickyLabelSx(isExp?alpha(color,0.035):'#fff'),px:2}}>
                                                <Box sx={{display:'flex',alignItems:'center',gap:1}}><CatBadge grp={grp}/><Typography sx={{fontSize:'0.8rem',fontWeight:600,color:NAVY}}>{grp}</Typography>{subRows.length>0&&<Box sx={{width:14,height:14,borderRadius:'3px',bgcolor:alpha(color,0.15),color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:700,ml:0.5}}>{isExp?'▲':'▼'}</Box>}</Box>
                                            </TableCell>
                                            {vals.map((v,i)=>{const planned=Math.round((sal[i]??0)*CAT_PCTS[grp]),over=v>planned&&planned>0;return<TableCell key={i} align="right" sx={{...tdSx({color:over?RED:v>0?NAVY:alpha('#000',0.18),fontWeight:over?600:400,zIndex:1,bgcolor:isExp?alpha(color,0.035):'#fff',borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{v>0?`$${fmtS(v)}`:'—'}</TableCell>;})}
                                            <TableCell align="right" sx={{...tdSx({fontWeight:600,color:NAVY,zIndex:1,bgcolor:isExp?alpha(color,0.035):'#fff',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>${fmtS(total)}</TableCell>
                                        </TableRow>
                                        {isExp&&subRows.map(row=>{const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);return(
                                            <TableRow key={row.label} sx={{bgcolor:'#fafbfc'}}>
                                                <TableCell sx={{...stickyLabelSx('#fafbfc'),pl:5,color:SLATE,fontSize:'0.74rem',px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:2.5,height:11,borderRadius:'1.5px',bgcolor:color,flexShrink:0}}/>{row.label}</Box></TableCell>
                                                {row.values.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({color:v!==null?NAVY:alpha('#000',0.14),fontSize:'0.74rem',zIndex:1,bgcolor:'#fafbfc',borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
                                                <TableCell align="right" sx={{...tdSx({fontWeight:500,color:NAVY,fontSize:'0.74rem',zIndex:1,bgcolor:'#fafbfc',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{rowTotal>0?`$${fmtS(rowTotal)}`:''}</TableCell>
                                            </TableRow>
                                        );})}
                                    </React.Fragment>
                                );
                            })}
                            <TableRow sx={{'& .MuiTableCell-root':{borderTop:`1.5px solid ${alpha(NAVY,0.1)}`}}}>
                                <TableCell sx={{...stickyLabelSx('#fff',`1.5px solid ${alpha(NAVY,0.1)}`),fontWeight:500,color:NAVY,px:2}}>Income (salary)</TableCell>
                                {sal.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({fontWeight:500,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.05)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
                                <TableCell align="right" sx={{...tdSx({fontWeight:600,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`})}}>${fmtS(sal.reduce((a:number,v)=>a+(v??0),0))}</TableCell>
                            </TableRow>
                            <TableRow sx={{bgcolor:alpha(TEAL,0.04)}}>
                                <TableCell sx={{...stickyLabelSx(alpha(TEAL,0.04)),fontWeight:600,color:'#0f766e',px:2}}>Balance</TableCell>
                                {bal.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({fontWeight:600,color:v!==null&&v>=0?'#0f766e':RED,zIndex:1,bgcolor:alpha(TEAL,0.04),borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.05)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
                                <TableCell sx={{zIndex:1,bgcolor:alpha(TEAL,0.04),borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`}}/>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

// ── Current Month View ────────────────────────────────────────────────────────
const CurrentMonthView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const expRow=t.rows.find(r=>r.rowType==='expenses');
    const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);
    const getValColor=(row:SpreadsheetRow,val:number|null,ci:number):string=>{if(val===null)return'transparent';if(row.rowType==='balance')return val>=0?GREEN:RED;if(row.rowType==='expenses'){const s=sal[ci];return s&&val>s?RED:NAVY;}return NAVY;};
    const solidBg=(rt:SpreadsheetRow['rowType'],ri:number):string=>{if(rt==='salary')return '#fdf8f8';if(rt==='balance')return '#f0fdf9';if(rt==='expenses')return '#f9fafb';return ri%2===0?'#ffffff':'#fafbfc';};

    const OptimizerCol=()=>(
        <Grid item xs={12} xl={3}>
            <Box sx={{position:'sticky',top:24}}>
                <BudgetOptimizerPanel template={template}/>
            </Box>
        </Grid>
    );

    // Templates with a viewOverride — delegate to the correct view, same as PlanningView
    if(template.viewOverride){
        const isForecast=template.viewOverride==='forecast-classic'||template.viewOverride==='forecast-visual';
        const accentColor=isForecast?BLUE:MAROON;
        const icon=template.viewOverride==='forecast-visual'?<TrendingUp size={15} color="white"/>:template.viewOverride==='forecast-classic'?<TableIcon size={15} color="white"/>:template.viewOverride==='rolling-planned-actual'?<BarChart2 size={15} color="white"/>:<TableIcon size={15} color="white"/>;
        const subtitle=template.viewOverride==='forecast-classic'?'Category expenses · account balance · forward projections'
            :template.viewOverride==='forecast-visual'?'Spending donut · balance trajectory · period-by-period forecast'
                :template.viewOverride==='rolling-balance'?'Category groups · rolling period columns · balance tracking'
                    :'Planned vs actual per category group';
        return(
            <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} xl={9}>
                    <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(accentColor,0.2)}`,boxShadow:`0 4px 20px ${alpha(accentColor,0.08)}`}}>
                        <MaroonCardHeader icon={icon} title={template.name} subtitle={subtitle}/>
                        <Box sx={{bgcolor:'#fff',p:2.75}}>
                            {template.viewOverride==='rolling-balance'&&<RollingBalanceView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                            {template.viewOverride==='rolling-planned-actual'&&<RollingPlannedActualView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                            {template.viewOverride==='forecast-classic'&&<ForecastClassicView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                            {template.viewOverride==='forecast-visual'&&<ForecastVisualView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                        </Box>
                    </Box>
                </Grid>
                <OptimizerCol/>
            </Grid>
        );
    }

    // Standard templates — classic spreadsheet + summary + optimizer panel
    return(
        <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} xl={9}>
                <Stack spacing={3}>
                    <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.07)}`}}>
                        <MaroonCardHeader icon={<TableIcon size={14} color="white"/>} title={template.name} subtitle={`${template.periodType} · ${t.periods.length} periods · By category`}/>
                        <Box sx={{bgcolor:'#fff',p:2.5}}>
                            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
                            <Box sx={{borderRadius:'9px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.12)}`}}>
                                <TableContainer sx={{overflowX:'auto'}}>
                                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{position:'sticky',left:0,zIndex:6,minWidth:138,background:'#fdf8f8',borderRight:`1.5px solid ${alpha(MAROON,0.2)}`,boxShadow:`2px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:MAROON,py:1.125,px:1.75,verticalAlign:'middle',borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>Category</TableCell>
                                                {t.periods.map((p,i)=>(
                                                    <TableCell key={i} align="center" sx={{fontWeight:500,fontSize:'0.67rem',color:SLATE,py:0.875,minWidth:78,bgcolor:'#fdf8f8',borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.05)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>{p}</TableCell>
                                                ))}
                                                <TableCell align="right" sx={{fontWeight:600,fontSize:'0.67rem',textTransform:'uppercase',letterSpacing:'0.07em',color:NAVY,py:0.875,bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.13)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`,minWidth:78}}>Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {t.rows.map((row,ri)=>{
                                                const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);
                                                const isSection=row.rowType==='salary',isSummary=row.rowType==='expenses'||row.rowType==='balance',bg=solidBg(row.rowType,ri);
                                                return(
                                                    <TableRow key={row.label} sx={{'&:hover td':{bgcolor:row.rowType==='expense'?alpha(MAROON,.02):undefined}}}>
                                                        <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:bg,borderRight:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:isSection?600:isSummary?600:400,color:row.rowType==='salary'?MAROON:row.rowType==='balance'?'#0f766e':NAVY,whiteSpace:'nowrap',fontSize:'0.77rem',px:1.75,borderTop:isSection?`1.5px solid ${alpha(MAROON,0.14)}`:`1px solid ${alpha('#000',0.04)}`}}>
                                                            <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>{row.rowType==='expense'&&CATEGORY_GROUPS[row.label]&&<Box sx={{width:3,height:12,borderRadius:'1.5px',bgcolor:CAT_COLORS[CATEGORY_GROUPS[row.label]]??SLATE,flexShrink:0}}/>}{row.label}</Box>
                                                        </TableCell>
                                                        {row.values.map((val,ci)=>(
                                                            <TableCell key={ci} align="right" sx={{zIndex:1,color:getValColor(row,val,ci),bgcolor:bg,fontWeight:isSummary||isSection?600:400,fontSize:'0.77rem',borderLeft:isMS(ci)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:isSection?`1.5px solid ${alpha(MAROON,0.14)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>{val!==null?`$${fmt(val)}`:''}</TableCell>
                                                        ))}
                                                        <TableCell align="right" sx={{zIndex:1,fontWeight:600,fontSize:'0.77rem',color:row.rowType==='balance'?(rowTotal>=0?GREEN:RED):NAVY,bgcolor:bg,borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:isSection?`1.5px solid ${alpha(MAROON,0.14)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>{rowTotal!==0||row.values.some(v=>v!==null)?`$${fmt(rowTotal)}`:''}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            <TableRow>
                                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(TEAL,.04),borderRight:`1.5px solid ${alpha(MAROON,.15)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:600,color:TEAL,whiteSpace:'nowrap',fontSize:'0.77rem',px:1.75,borderTop:`1px solid ${alpha(TEAL,.18)}`}}>Savings goal</TableCell>
                                                {t.periods.map((_,ci)=>{const inc=sal[ci]??0,goal=inc>0?Math.round(inc*.226):null;return<TableCell key={ci} align="right" sx={{zIndex:1,color:TEAL,fontWeight:500,fontSize:'0.77rem',bgcolor:alpha(TEAL,.04),borderLeft:isMS(ci)?`1px solid ${alpha(MAROON,.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha(TEAL,.15)}`,fontVariantNumeric:'tabular-nums'}}>{goal!==null?`$${fmtS(goal)}`:''}</TableCell>;})}
                                                <TableCell align="right" sx={{zIndex:1,fontWeight:600,color:TEAL,fontSize:'0.77rem',bgcolor:alpha(TEAL,.04),borderLeft:`1.5px solid ${alpha(NAVY,.12)}`,borderTop:`1px solid ${alpha(TEAL,.15)}`}}/>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(GREEN,.04),borderRight:`1.5px solid ${alpha(MAROON,.15)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:600,color:GREEN,whiteSpace:'nowrap',fontSize:'0.77rem',px:1.75,borderTop:`1px solid ${alpha(GREEN,.14)}`}}>Actual saved</TableCell>
                                                {t.periods.map((_,ci)=>{const inc=sal[ci]??0,exp=expRow?.values[ci]??0,saved=inc-exp,goal=inc>0?Math.round(inc*.226):0,met=saved>=goal&&inc>0;return<TableCell key={ci} align="right" sx={{zIndex:1,color:met?GREEN:RED,fontWeight:600,fontSize:'0.77rem',bgcolor:alpha(GREEN,.04),borderLeft:isMS(ci)?`1px solid ${alpha(MAROON,.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha(GREEN,.12)}`,fontVariantNumeric:'tabular-nums'}}>{inc>0?`$${fmtS(saved)} ${met?'✓':'✗'}`:''}</TableCell>;})}
                                                <TableCell align="right" sx={{zIndex:1,fontWeight:600,color:GREEN,fontSize:'0.77rem',bgcolor:alpha(GREEN,.04),borderLeft:`1.5px solid ${alpha(NAVY,.12)}`,borderTop:`1px solid ${alpha(GREEN,.12)}`}}/>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.07)}`}}>
                        <MaroonCardHeader icon={<Award size={14} color="white"/>} title="Overall summary" subtitle={`Totals across all ${t.periods.length} periods`}/>
                        <Box sx={{bgcolor:'#fff',p:0}}>
                            <TableContainer><Table size="small">
                                <TableHead><TableRow sx={{bgcolor:'#fdf8f8'}}>{['Budget goal','Total planned','Total spent','Savings %','Over budget %'].map(h=><TableCell key={h} sx={{fontWeight:600,color:MAROON,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',py:1.25,px:2,borderBottom:`1.5px solid ${alpha(MAROON,.12)}`}}>{h}</TableCell>)}</TableRow></TableHead>
                                <TableBody><TableRow>{(()=>{const ts=sal.reduce((a:number,v)=>a+(v??0),0),te=(expRow?.values??[]).reduce((a:number,v)=>a+(v??0),0),sr=ts>0?((ts-te)/ts)*100:0,bu=ts>0?(te/ts)*100:0;return[{v:`$${fmt(ts)}`,c:NAVY},{v:`$${fmt(ts)}`,c:NAVY},{v:`$${fmt(te)}`,c:MAROON},{v:`${sr>=0?'+':''}${sr.toFixed(1)}%`,c:sr>=0?GREEN:RED},{v:`${bu>100?'+':'–'}${Math.abs(bu-100).toFixed(1)}%`,c:bu>100?RED:GREEN}].map(({v,c},i)=><TableCell key={i} sx={{fontWeight:600,fontSize:'0.84rem',color:c,py:1.5,px:2,fontVariantNumeric:'tabular-nums'}}>{v}</TableCell>);})()}</TableRow></TableBody>
                            </Table></TableContainer>
                        </Box>
                    </Box>
                </Stack>
            </Grid>
            <OptimizerCol/>
        </Grid>
    );
};

// ── Rolling Planned/Actual View ───────────────────────────────────────────────
const RollingPlannedActualView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
    const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
    const [expandedCats,setExpandedCats]=useState<Set<string>>(new Set());
    const groupTotals=deriveGroupTotals(t);
    const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
    const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
    const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);
    const toggleCat=(c:string)=>setExpandedCats(prev=>{const s=new Set(prev);s.has(c)?s.delete(c):s.add(c);return s;});
    const plannedByGroup=(grp:string,ci:number)=>Math.round((sal[ci]??0)*CAT_PCTS[grp]);
    const stickyLabelSx=(bg:string,extraBorder?:string):object=>({position:'sticky',left:0,zIndex:4,bgcolor:bg,borderRight:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.1)`,borderTop:extraBorder??`1px solid ${alpha('#000',0.04)}`,whiteSpace:'nowrap' as const});
    return(
        <Box>
            <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
            <Box sx={{display:'flex',alignItems:'center',gap:1.5,mb:2,flexWrap:'wrap'}}>
                {[['Planned',alpha(TEAL,0.5)],['Actual',MAROON],['Over budget',alpha(RED,0.7)]].map(([l,c])=><Box key={l} sx={{display:'flex',alignItems:'center',gap:0.6}}><Box sx={{width:10,height:10,borderRadius:'2px',bgcolor:c}}/><Typography sx={{fontSize:'0.71rem',color:SLATE,fontWeight:500}}>{l}</Typography></Box>)}
                <Typography sx={{fontSize:'0.71rem',color:alpha(SLATE,0.7),ml:0.5,fontStyle:'italic'}}>Click a row to expand subcategories</Typography>
            </Box>
            <Box sx={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 2px 12px ${alpha(MAROON,0.06)}`}}>
                <TableContainer sx={{overflowX:'auto'}}>
                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
                        <TableHead>
                            <TableRow>
                                <TableCell rowSpan={2} sx={{position:'sticky',left:0,zIndex:6,minWidth:155,background:'#fdf8f8',borderRight:`1.5px solid ${alpha(MAROON,0.22)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.08em',color:MAROON,verticalAlign:'middle',px:2}}>Category</TableCell>
                                {t.months.map(m=><TableCell key={m.name} colSpan={m.cols.length*2} align="center" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:MAROON,py:0.875,bgcolor:'#fdf8f8',borderLeft:`1px solid ${alpha(MAROON,0.15)}`,borderBottom:`1px solid ${alpha(MAROON,0.08)}`}}>{m.name}</TableCell>)}
                                <TableCell colSpan={2} align="center" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:NAVY,py:0.875,bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.15)}`,borderBottom:`1px solid ${alpha(NAVY,0.08)}`,minWidth:150}}>Total</TableCell>
                            </TableRow>
                            <TableRow>
                                {t.periods.map((p,i)=>(
                                    <React.Fragment key={i}>
                                        <TableCell align="center" sx={{fontWeight:500,fontSize:'0.62rem',color:alpha(TEAL,0.85),py:0.75,minWidth:68,bgcolor:alpha(TEAL,0.03),borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>{p}<br/><Box component="span" sx={{fontSize:'0.56rem',color:alpha(TEAL,0.65)}}>Plan</Box></TableCell>
                                        <TableCell align="center" sx={{fontWeight:500,fontSize:'0.62rem',color:MAROON,py:0.75,minWidth:68,bgcolor:alpha(MAROON,0.02),borderLeft:`1px solid ${alpha('#000',0.04)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>{p}<br/><Box component="span" sx={{fontSize:'0.56rem',color:alpha(MAROON,0.65)}}>Actual</Box></TableCell>
                                    </React.Fragment>
                                ))}
                                <TableCell align="center" sx={{fontWeight:500,fontSize:'0.62rem',color:alpha(TEAL,0.85),py:0.75,minWidth:68,bgcolor:alpha(TEAL,0.03),borderLeft:`1.5px solid ${alpha(NAVY,0.15)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>Total<br/><Box component="span" sx={{fontSize:'0.56rem',color:alpha(TEAL,0.65)}}>Plan</Box></TableCell>
                                <TableCell align="center" sx={{fontWeight:500,fontSize:'0.62rem',color:MAROON,py:0.75,minWidth:68,bgcolor:alpha(MAROON,0.02),borderLeft:`1px solid ${alpha('#000',0.04)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>Total<br/><Box component="span" sx={{fontSize:'0.56rem',color:alpha(MAROON,0.65)}}>Actual</Box></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {GROUP_ORDER.map(grp=>{
                                const vals=groupTotals[grp],isExp=expandedCats.has(grp),color=CAT_COLORS[grp];
                                const subRows=t.rows.filter(r=>r.rowType==='expense'&&(CATEGORY_GROUPS[r.label]??'Other')===grp&&r.values.some(v=>v!==null&&v>0));
                                const totalPlanned=t.periods.reduce((a,_,ci)=>a+plannedByGroup(grp,ci),0);
                                const totalActual=vals.reduce((a,v)=>a+v,0);
                                const totalOver=totalActual>totalPlanned&&totalPlanned>0;
                                return(
                                    <React.Fragment key={grp}>
                                        <TableRow hover onClick={()=>toggleCat(grp)} sx={{cursor:'pointer',bgcolor:isExp?alpha(color,0.035):'#fff','&:hover td':{bgcolor:alpha(color,0.03)}}}>
                                            <TableCell sx={{...stickyLabelSx(isExp?alpha(color,0.035):'#fff'),px:2}}>
                                                <Box sx={{display:'flex',alignItems:'center',gap:1}}><Box sx={{width:20,height:20,borderRadius:'5px',bgcolor:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.85)'}}/></Box><Typography sx={{fontSize:'0.8rem',fontWeight:600,color:NAVY}}>{grp}</Typography>{subRows.length>0&&<Box sx={{width:14,height:14,borderRadius:'3px',bgcolor:alpha(color,0.15),color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:700,ml:0.5}}>{isExp?'▲':'▼'}</Box>}</Box>
                                            </TableCell>
                                            {vals.map((actual,i)=>{const planned=plannedByGroup(grp,i),over=actual>planned&&planned>0,under=planned>0&&actual<planned;return(
                                                <React.Fragment key={i}>
                                                    <TableCell align="right" sx={{fontSize:'0.77rem',py:0.875,color:alpha(TEAL,0.85),zIndex:1,bgcolor:isExp?alpha(color,0.035):alpha(TEAL,0.02),borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{planned>0?`$${fmtS(planned)}`:'—'}</TableCell>
                                                    <TableCell align="right" sx={{fontSize:'0.77rem',py:0.875,color:over?RED:under?GREEN:NAVY,fontWeight:over?600:400,zIndex:1,bgcolor:isExp?alpha(color,0.035):over?alpha(RED,0.03):'#fff',borderLeft:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>
                                                        <Box sx={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:0.5}}>
                                                            {over&&<Box sx={{fontSize:'0.56rem',fontWeight:700,color:RED,bgcolor:alpha(RED,0.1),px:0.4,py:0.1,borderRadius:'3px'}}>▲</Box>}
                                                            {actual>0?`$${fmtS(actual)}`:'—'}
                                                        </Box>
                                                    </TableCell>
                                                </React.Fragment>
                                            );})}
                                            <TableCell align="right" sx={{fontSize:'0.77rem',py:0.875,color:alpha(TEAL,0.85),fontWeight:500,zIndex:1,bgcolor:alpha(TEAL,0.03),borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>${fmtS(totalPlanned)}</TableCell>
                                            <TableCell align="right" sx={{fontSize:'0.77rem',py:0.875,color:totalOver?RED:GREEN,fontWeight:600,zIndex:1,bgcolor:totalOver?alpha(RED,0.03):'#fff',borderLeft:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>${fmtS(totalActual)}</TableCell>
                                        </TableRow>
                                        {isExp&&subRows.map(row=>{const rowTotalActual=row.values.reduce((a:number,v)=>a+(v??0),0);return(
                                            <TableRow key={row.label} sx={{bgcolor:'#fafbfc'}}>
                                                <TableCell sx={{...stickyLabelSx('#fafbfc'),pl:5,color:SLATE,fontSize:'0.73rem',px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:2.5,height:11,borderRadius:'1.5px',bgcolor:color,flexShrink:0}}/>{row.label}</Box></TableCell>
                                                {row.values.map((v,i)=>(<React.Fragment key={i}><TableCell align="right" sx={{fontSize:'0.71rem',py:0.875,color:alpha(TEAL,0.45),zIndex:1,bgcolor:alpha(TEAL,0.01),borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.05)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>—</TableCell><TableCell align="right" sx={{fontSize:'0.71rem',py:0.875,color:v!==null&&v>0?NAVY:alpha('#000',0.14),zIndex:1,bgcolor:'#fafbfc',borderLeft:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{v!==null&&v>0?`$${fmtS(v)}`:'—'}</TableCell></React.Fragment>))}
                                                <TableCell align="right" sx={{fontSize:'0.71rem',py:0.875,color:alpha(TEAL,0.45),zIndex:1,bgcolor:alpha(TEAL,0.01),borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>—</TableCell>
                                                <TableCell align="right" sx={{fontSize:'0.71rem',py:0.875,fontWeight:500,color:rowTotalActual>0?NAVY:alpha('#000',0.14),zIndex:1,bgcolor:'#fafbfc',borderLeft:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{rowTotalActual>0?`$${fmtS(rowTotalActual)}`:'—'}</TableCell>
                                            </TableRow>
                                        );})}
                                    </React.Fragment>
                                );
                            })}
                            <TableRow sx={{'& .MuiTableCell-root':{borderTop:`1.5px solid ${alpha(NAVY,0.1)}`}}}>
                                <TableCell sx={{...stickyLabelSx('#fff',`1.5px solid ${alpha(NAVY,0.1)}`),fontWeight:500,color:NAVY,px:2}}>Income (salary)</TableCell>
                                {sal.map((v,i)=>(<React.Fragment key={i}><TableCell align="right" sx={{fontSize:'0.77rem',py:0.875,color:NAVY,fontWeight:500,zIndex:1,bgcolor:'#fff',borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.05)}`}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell><TableCell sx={{zIndex:1,bgcolor:'#fff',borderLeft:`1px solid ${alpha('#000',0.04)}`}}/></React.Fragment>))}
                                <TableCell align="right" sx={{fontSize:'0.77rem',py:0.875,fontWeight:600,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`}}>${fmtS(sal.reduce((a:number,v)=>a+(v??0),0))}</TableCell>
                                <TableCell sx={{zIndex:1,bgcolor:'#fff',borderLeft:`1px solid ${alpha('#000',0.04)}`}}/>
                            </TableRow>
                            <TableRow sx={{bgcolor:alpha(TEAL,0.04)}}>
                                <TableCell sx={{...stickyLabelSx(alpha(TEAL,0.04)),fontWeight:600,color:'#0f766e',px:2}}>Balance</TableCell>
                                {bal.map((v,i)=>(<React.Fragment key={i}><TableCell sx={{zIndex:1,bgcolor:alpha(TEAL,0.04),borderLeft:isMS(i)?`1px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.05)}`}}/><TableCell align="right" sx={{fontSize:'0.77rem',fontWeight:600,color:v!==null&&v>=0?'#0f766e':RED,zIndex:1,bgcolor:alpha(TEAL,0.04),borderLeft:`1px solid ${alpha('#000',0.04)}`}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell></React.Fragment>))}
                                <TableCell sx={{zIndex:1,bgcolor:alpha(TEAL,0.04),borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`}}/>
                                <TableCell sx={{zIndex:1,bgcolor:alpha(TEAL,0.04),borderLeft:`1px solid ${alpha('#000',0.04)}`}}/>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

// ── Forecast helpers ──────────────────────────────────────────────────────────
interface ForecastPeriod{label:string;isFuture:boolean;income:number;expenses:number;balance:number;catVals:number[];}
function buildForecastData(template:SpreadsheetTemplate,forecastCount:number,startBal:number):ForecastPeriod[]{
    const sal=template.rows.find(r=>r.label==='Salary')?.values??[];
    const expRow=template.rows.find(r=>r.rowType==='expenses');
    const hist=Math.min(template.periods.length,5);
    const total=hist+forecastCount;
    const incomePerPeriod=sal.find(v=>v!=null)??2200;
    let bal=startBal;
    const result:ForecastPeriod[]=[];
    for(let i=0;i<total;i++){
        const fut=i>=hist;
        const inc=fut?incomePerPeriod:(sal[i]??incomePerPeriod);
        const catVals=fut?GROUP_ORDER.map(g=>Math.round(inc*CAT_PCTS[g])):GROUP_ORDER.map(g=>{const gt=deriveGroupTotals(template);return gt[g][i]??Math.round(inc*CAT_PCTS[g]);});
        const exp=fut?catVals.reduce((a,b)=>a+b,0):(expRow?.values[i]??catVals.reduce((a,b)=>a+b,0));
        bal+=inc-exp;
        result.push({label:template.periods[i]??(fut?`F+${i-hist+1}`:String(i)),isFuture:fut,income:inc,expenses:exp,balance:Math.round(bal),catVals});
    }
    return result;
}
const fmtC=(n:number)=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString();

// ── Forecast Classic View ─────────────────────────────────────────────────────
const ForecastClassicView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
    const [forecastCount,setForecastCount]=useState(4);
    const data=useMemo(()=>buildForecastData(template,forecastCount,1240),[template,forecastCount]);
    const hist=data.filter(d=>!d.isFuture).length;
    const kpis=[{label:'Current balance',val:fmtC(data[hist-1]?.balance??0),color:GREEN,top:GREEN},{label:'Forecast balance',val:fmtC(data[data.length-1]?.balance??0),color:BLUE,top:BLUE},{label:'Income / period',val:fmtC(data[0]?.income??0),color:NAVY,top:MAROON},{label:'Avg savings rate',val:(()=>{const s=data.slice(0,hist);const avg=s.reduce((a,p)=>a+(p.income-p.expenses)/p.income*100,0)/s.length;return(avg>=0?'+':'')+Math.round(avg)+'%';})(),color:GREEN,top:TEAL}];
    return(
        <Box>
            <Grid container spacing={1.5} sx={{mb:2.5}}>{kpis.map(({label,val,color,top})=><Grid item xs={6} sm={3} key={label}><Box sx={{bgcolor:'#fff',border:`1px solid ${alpha('#000',0.08)}`,borderRadius:'9px',borderTop:`3px solid ${top}`,p:1.75}}><Typography sx={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.08em',color:alpha(color,0.65),fontWeight:600,mb:0.75}}>{label}</Typography><Typography sx={{fontSize:'1.35rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{val}</Typography></Box></Grid>)}</Grid>
            <Box sx={{display:'flex',alignItems:'center',gap:1.5,mb:2,flexWrap:'wrap'}}>
                <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
                <Box sx={{display:'flex',alignItems:'center',gap:0.75,ml:'auto'}}><Typography sx={{fontSize:'0.72rem',color:SLATE,fontWeight:500}}>Forecast:</Typography>{[2,4,6,8].map(n=><Box key={n} onClick={()=>setForecastCount(n)} sx={{px:1.25,py:0.35,borderRadius:'5px',cursor:'pointer',fontSize:'0.72rem',fontWeight:600,border:`1px solid ${forecastCount===n?BLUE:alpha('#000',0.12)}`,bgcolor:forecastCount===n?BLUE:'#fff',color:forecastCount===n?'#fff':SLATE,transition:'all .15s','&:hover':{borderColor:BLUE},userSelect:'none'}}>+{n}</Box>)}</Box>
            </Box>
            <Box sx={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 2px 12px ${alpha(MAROON,0.06)}`}}>
                <TableContainer sx={{overflowX:'auto'}}>
                    <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
                        <TableHead><TableRow>
                            <TableCell sx={{position:'sticky',left:0,zIndex:6,minWidth:145,background:'#fdf8f8',borderRight:`1.5px solid ${alpha(MAROON,0.2)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.15)}`,boxShadow:`2px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.08em',color:MAROON,py:1.25,px:2}}>Category</TableCell>
                            {data.map((d,i)=><TableCell key={i} align="center" sx={{fontWeight:d.isFuture?500:600,fontSize:'0.69rem',color:d.isFuture?BLUE:SLATE,py:1,minWidth:84,bgcolor:d.isFuture?alpha(BLUE,0.04):'#fdf8f8',borderLeft:i===hist?`2px dashed ${alpha(BLUE,0.4)}`:`1px solid ${alpha('#000',0.05)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`}}>{d.label}{d.isFuture&&<Box component="span" sx={{display:'block',fontSize:'0.58rem',color:alpha(BLUE,0.75),fontWeight:500}}>est</Box>}</TableCell>)}
                            <TableCell align="right" sx={{fontWeight:600,fontSize:'0.68rem',textTransform:'uppercase',color:NAVY,py:1,bgcolor:'#f8fafc',borderLeft:`1.5px solid ${alpha(NAVY,0.14)}`,borderBottom:`1.5px solid ${alpha(MAROON,0.12)}`,minWidth:80}}>Total</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                            {GROUP_ORDER.map((grp,gi)=>{const rowTotal=data.reduce((a,d)=>a+d.catVals[gi],0),color=CAT_COLORS[grp];return(
                                <TableRow key={grp} sx={{'&:hover td':{bgcolor:alpha(color,0.025)}}}>
                                    <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:'#fff',borderRight:`1.5px solid ${alpha(MAROON,0.14)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,borderTop:`1px solid ${alpha('#000',0.04)}`,color:NAVY,fontSize:'0.79rem',px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.875}}><Box sx={{width:3,height:13,borderRadius:'1.5px',bgcolor:color,flexShrink:0}}/>{grp}</Box></TableCell>
                                    {data.map((d,ci)=><TableCell key={ci} align="right" sx={{fontSize:'0.79rem',py:0.875,color:d.isFuture?alpha(BLUE,0.75):NAVY,zIndex:1,bgcolor:d.isFuture?alpha(BLUE,0.025):'#fff',borderLeft:ci===hist?`2px dashed ${alpha(BLUE,0.35)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{fmtC(d.catVals[gi])}</TableCell>)}
                                    <TableCell align="right" sx={{fontWeight:500,fontSize:'0.79rem',color:SLATE,borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{fmtC(rowTotal)}</TableCell>
                                </TableRow>
                            );})}
                            <TableRow sx={{'& .MuiTableCell-root':{borderTop:`1.5px solid ${alpha(MAROON,0.12)}`}}}>
                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:'#fdf8f8',borderRight:`1.5px solid ${alpha(MAROON,0.18)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:600,color:MAROON,fontSize:'0.79rem',px:2}}>Income</TableCell>
                                {data.map((d,ci)=><TableCell key={ci} align="right" sx={{fontSize:'0.79rem',fontWeight:600,color:MAROON,zIndex:1,bgcolor:d.isFuture?alpha(BLUE,0.04):'#fdf8f8',borderLeft:ci===hist?`2px dashed ${alpha(BLUE,0.35)}`:`1px solid ${alpha('#000',0.04)}`}}>{fmtC(d.income)}</TableCell>)}
                                <TableCell align="right" sx={{fontWeight:600,color:MAROON,fontSize:'0.79rem',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`}}>{fmtC(data.reduce((a,d)=>a+d.income,0))}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:'#f9fafb',borderRight:`1.5px solid ${alpha(MAROON,0.14)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:600,color:NAVY,fontSize:'0.79rem',px:2,borderTop:`1px solid ${alpha('#000',0.04)}`}}>Total expenses</TableCell>
                                {data.map((d,ci)=><TableCell key={ci} align="right" sx={{fontSize:'0.79rem',fontWeight:600,color:d.expenses>d.income?RED:NAVY,zIndex:1,bgcolor:d.isFuture?alpha(BLUE,0.025):'#f9fafb',borderLeft:ci===hist?`2px dashed ${alpha(BLUE,0.35)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{fmtC(d.expenses)}</TableCell>)}
                                <TableCell align="right" sx={{fontWeight:600,color:NAVY,fontSize:'0.79rem',borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha('#000',0.04)}`}}>{fmtC(data.reduce((a,d)=>a+d.expenses,0))}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(TEAL,0.05),borderRight:`1.5px solid ${alpha(TEAL,0.25)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:700,color:'#0f766e',fontSize:'0.82rem',px:2,borderTop:`2px solid ${alpha(TEAL,0.2)}`}}>Account balance</TableCell>
                                {data.map((d,ci)=><TableCell key={ci} align="right" sx={{fontSize:'0.82rem',fontWeight:700,color:d.isFuture?BLUE:d.balance>=0?'#0f766e':RED,zIndex:1,bgcolor:d.isFuture?alpha(BLUE,0.06):alpha(TEAL,0.04),borderLeft:ci===hist?`2px dashed ${alpha(BLUE,0.4)}`:`1px solid ${alpha(TEAL,0.1)}`,borderTop:`2px solid ${d.isFuture?alpha(BLUE,0.2):alpha(TEAL,0.18)}`}}>{fmtC(d.balance)}</TableCell>)}
                                <TableCell sx={{bgcolor:alpha(TEAL,0.04),borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`2px solid ${alpha(TEAL,0.18)}`}}/>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(GREEN,0.04),borderRight:`1.5px solid ${alpha(GREEN,0.2)}`,boxShadow:`2px 0 8px -3px rgba(0,0,0,0.08)`,fontWeight:600,color:GREEN,fontSize:'0.79rem',px:2,borderTop:`1px solid ${alpha(GREEN,0.15)}`}}>Saved this period</TableCell>
                                {data.map((d,ci)=>{const sav=d.income-d.expenses;return<TableCell key={ci} align="right" sx={{fontSize:'0.79rem',fontWeight:600,color:sav>=0?GREEN:RED,zIndex:1,bgcolor:d.isFuture?alpha(BLUE,0.025):alpha(GREEN,0.03),borderLeft:ci===hist?`2px dashed ${alpha(BLUE,0.35)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha(GREEN,0.12)}`}}>{fmtC(sav)}</TableCell>;})}
                                <TableCell sx={{bgcolor:alpha(GREEN,0.03),borderLeft:`1.5px solid ${alpha(NAVY,0.12)}`,borderTop:`1px solid ${alpha(GREEN,0.12)}`}}/>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

// ── Forecast Visual View ──────────────────────────────────────────────────────
const ForecastVisualView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
    const [forecastCount,setForecastCount]=useState(4);
    const [selIdx,setSelIdx]=useState<number|null>(null);
    const data=useMemo(()=>buildForecastData(template,forecastCount,1240),[template,forecastCount]);
    const hist=data.filter(d=>!d.isFuture).length;
    const activePeriod=data[selIdx??hist-1]??data[hist-1];
    const spendData=GROUP_ORDER.map((g,i)=>({name:g,value:activePeriod.catVals[i],color:CAT_COLORS[g]})).filter(d=>d.value>0);
    const totalSpend=spendData.reduce((a,d)=>a+d.value,0);
    const savedAmt=Math.max(0,activePeriod.income-activePeriod.expenses);
    const savePct=activePeriod.income>0?Math.round(savedAmt/activePeriod.income*100):0;
    const ivsTwoData=[{name:'Spent',value:activePeriod.expenses,color:alpha(MAROON,0.75)},{name:'Saved',value:savedAmt,color:GREEN}];
    const TTip=({active,payload}:any)=>{if(!active||!payload?.length)return null;return<Box sx={{p:1.25,bgcolor:'#fff',borderRadius:'7px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>{payload.map((p:any,i:number)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:p.payload?.color??p.fill??p.stroke}}/><Typography sx={{fontSize:'0.72rem',color:NAVY}}>{p.name}: <strong>{fmtC(p.value)}</strong></Typography></Box>)}</Box>;};
    const kpis=[{label:'Current balance',val:fmtC(data[hist-1]?.balance??0),color:GREEN,top:GREEN},{label:'Forecast balance',val:fmtC(data[data.length-1]?.balance??0),color:BLUE,top:BLUE},{label:'Income / period',val:fmtC(data[0]?.income??0),color:NAVY,top:MAROON},{label:'Avg savings rate',val:(()=>{const s=data.slice(0,hist);const avg=s.reduce((a,p)=>a+(p.income-p.expenses)/p.income*100,0)/s.length;return(avg>=0?'+':'')+Math.round(avg)+'%';})(),color:GREEN,top:TEAL}];
    return(
        <Box>
            <Grid container spacing={1.5} sx={{mb:2.5}}>{kpis.map(({label,val,color,top})=><Grid item xs={6} sm={3} key={label}><Box sx={{bgcolor:'#fff',border:`1px solid ${alpha('#000',0.08)}`,borderRadius:'9px',borderTop:`3px solid ${top}`,p:1.75}}><Typography sx={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.08em',color:alpha(color,0.65),fontWeight:600,mb:0.75}}>{label}</Typography><Typography sx={{fontSize:'1.35rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{val}</Typography></Box></Grid>)}</Grid>
            <Box sx={{display:'flex',alignItems:'center',gap:1.5,mb:2,flexWrap:'wrap'}}>
                <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
                <Box sx={{display:'flex',alignItems:'center',gap:0.75,ml:'auto'}}><Typography sx={{fontSize:'0.72rem',color:SLATE,fontWeight:500}}>Forecast:</Typography>{[2,4,6,8].map(n=><Box key={n} onClick={()=>setForecastCount(n)} sx={{px:1.25,py:0.35,borderRadius:'5px',cursor:'pointer',fontSize:'0.72rem',fontWeight:600,border:`1px solid ${forecastCount===n?BLUE:alpha('#000',0.12)}`,bgcolor:forecastCount===n?BLUE:'#fff',color:forecastCount===n?'#fff':SLATE,transition:'all .15s',userSelect:'none'}}>+{n}</Box>)}</Box>
            </Box>
            <Box sx={{border:`1px solid ${alpha(MAROON,0.15)}`,borderRadius:'12px',overflow:'hidden',boxShadow:`0 4px 20px ${alpha(MAROON,0.08)}`}}>
                <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 55%,#5a1515 100%)`,px:3,py:1.75,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <Box sx={{display:'flex',alignItems:'center',gap:1.25}}><Box sx={{width:28,height:28,borderRadius:'7px',bgcolor:'rgba(255,255,255,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><TrendingUp size={14} color="white"/></Box><Box><Typography sx={{fontWeight:600,fontSize:'0.9rem',color:'#fff'}}>Budget &amp; balance forecast</Typography><Typography sx={{fontSize:'0.65rem',color:'rgba(255,255,255,0.6)',mt:0.1}}>{hist} actual · {forecastCount} forecast · viewing {activePeriod.label}{activePeriod.isFuture?' (estimated)':''}</Typography></Box></Box>
                    <Box sx={{display:'flex',alignItems:'center',gap:5}}>
                        <Box onClick={()=>setSelIdx(Math.max(0,(selIdx??hist-1)-1))} sx={{width:24,height:24,borderRadius:'5px',bgcolor:'rgba(255,255,255,.12)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'14px'}}>‹</Box>
                        <Typography sx={{fontSize:'0.82rem',fontWeight:600,color:'#fff',minWidth:44,textAlign:'center'}}>{activePeriod.label}</Typography>
                        <Box onClick={()=>setSelIdx(Math.min(data.length-1,(selIdx??hist-1)+1))} sx={{width:24,height:24,borderRadius:'5px',bgcolor:'rgba(255,255,255,.12)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'14px'}}>›</Box>
                    </Box>
                </Box>
                <Box sx={{display:'grid',gridTemplateColumns:'190px 1fr 190px',bgcolor:'#fff'}}>
                    <Box sx={{borderRight:`1px solid ${alpha('#000',0.07)}`,p:2}}>
                        <Typography sx={{fontSize:'0.67rem',fontWeight:600,color:SLATE,textTransform:'uppercase',letterSpacing:'0.06em',mb:1.5}}>Spending breakdown</Typography>
                        <Box sx={{position:'relative',mb:1.5}}>
                            <ResponsiveContainer width="100%" height={130}><RePieChart><Pie data={spendData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={2}>{spendData.map((d,i)=><Cell key={i} fill={d.color} stroke="none"/>)}</Pie><RTooltip content={<TTip/>}/></RePieChart></ResponsiveContainer>
                            <Box sx={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY}}>{fmtC(totalSpend)}</Typography><Typography sx={{fontSize:'0.6rem',color:SLATE}}>spent</Typography></Box>
                        </Box>
                        {spendData.map((d,i)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:0.75,mb:0.6}}><Box sx={{width:8,height:8,borderRadius:'2px',bgcolor:d.color,flexShrink:0}}/><Typography sx={{fontSize:'0.71rem',color:NAVY,flex:1}}>{d.name}</Typography><Typography sx={{fontSize:'0.71rem',color:SLATE}}>{totalSpend?Math.round(d.value/totalSpend*100):0}%</Typography></Box>)}
                    </Box>
                    <Box sx={{borderRight:`1px solid ${alpha('#000',0.07)}`,p:2,display:'flex',flexDirection:'column'}}>
                        <Typography sx={{fontSize:'0.67rem',fontWeight:600,color:SLATE,textTransform:'uppercase',letterSpacing:'0.06em',mb:0.5}}>Balance trajectory</Typography>
                        <Typography sx={{fontSize:'0.62rem',color:alpha(SLATE,0.7),mb:1.25}}>Click a point to select period</Typography>
                        {/* Line chart */}
                        <Box sx={{flex:1,minHeight:0}}>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={data.map((d,i)=>({...d,idx:i}))} margin={{top:8,right:8,left:0,bottom:4}}
                                           onClick={(e:any)=>{if(e?.activePayload?.[0]?.payload?.idx!=null)setSelIdx(e.activePayload[0].payload.idx);}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)} vertical={false}/>
                                    <XAxis dataKey="label" tick={{fontSize:9,fill:SLATE}} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={38}/>
                                    <YAxis tick={{fontSize:9,fill:SLATE}} tickLine={false} axisLine={false} width={48} tickFormatter={(v:number)=>v>=1000||v<=-1000?`${(v/1000).toFixed(0)}k`:String(v)}/>
                                    <RTooltip
                                        content={({active,payload,label}:any)=>{
                                            if(!active||!payload?.length)return null;
                                            const d=payload[0].payload;
                                            const color=d.isFuture?BLUE:d.balance>=0?GREEN:RED;
                                            return(
                                                <Box sx={{p:1.25,bgcolor:'#fff',borderRadius:'7px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>
                                                    <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:NAVY,mb:0.5}}>{label}{d.isFuture&&<Box component="span" sx={{fontSize:'0.62rem',color:BLUE,ml:0.5}}>est</Box>}</Typography>
                                                    <Typography sx={{fontSize:'0.72rem',fontWeight:700,color}}>{fmtC(d.balance)}</Typography>
                                                    <Typography sx={{fontSize:'0.66rem',color:SLATE,mt:0.25}}>Income: {fmtC(d.income)}</Typography>
                                                    <Typography sx={{fontSize:'0.66rem',color:SLATE}}>Expenses: {fmtC(d.expenses)}</Typography>
                                                </Box>
                                            );
                                        }}
                                    />
                                    {/* Zero reference line */}
                                    <ReferenceLine y={0} stroke={alpha(RED,0.35)} strokeDasharray="4 3" strokeWidth={1}/>
                                    {/* Dashed vertical divider between actual & forecast */}
                                    {data[hist]&&<ReferenceLine x={data[hist].label} stroke={alpha(BLUE,0.4)} strokeDasharray="4 3" strokeWidth={1.5} label={{value:'forecast →',position:'insideTopRight',fontSize:9,fill:alpha(BLUE,0.7)}}/>}
                                    {/* Actual segment */}
                                    <Line
                                        data={data.filter(d=>!d.isFuture).map((d,i)=>({...d,idx:i}))}
                                        type="monotone" dataKey="balance"
                                        stroke={GREEN} strokeWidth={2.5} dot={(props:any)=>{
                                        const{cx,cy,payload}=props;
                                        const isActive=(selIdx??hist-1)===payload.idx;
                                        return<circle key={payload.idx} cx={cx} cy={cy} r={isActive?5:3.5} fill={payload.balance>=0?GREEN:RED} stroke="#fff" strokeWidth={1.5} style={{cursor:'pointer'}} onClick={()=>setSelIdx(payload.idx)}/>;
                                    }} activeDot={{r:6,stroke:GREEN,strokeWidth:2}} connectNulls/>
                                    {/* Forecast segment — dashed blue */}
                                    <Line
                                        data={[data[hist-1],...data.filter(d=>d.isFuture)].map((d,i)=>({...d,idx:hist-1+i}))}
                                        type="monotone" dataKey="balance"
                                        stroke={BLUE} strokeWidth={2} strokeDasharray="5 3"
                                        dot={(props:any)=>{
                                            const{cx,cy,payload}=props;
                                            if(!payload.isFuture)return<g key="join"/>;
                                            const isActive=(selIdx??hist-1)===payload.idx;
                                            return<circle key={payload.idx} cx={cx} cy={cy} r={isActive?5:3.5} fill={BLUE} stroke="#fff" strokeWidth={1.5} style={{cursor:'pointer'}} onClick={()=>setSelIdx(payload.idx)}/>;
                                        }} activeDot={{r:6,stroke:BLUE,strokeWidth:2}} connectNulls/>
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                        {/* Legend */}
                        <Box sx={{display:'flex',gap:2,mt:0.5,pl:0.5}}>
                            {[{color:GREEN,label:'Actual'},{color:BLUE,label:'Forecast',dashed:true},{color:alpha(RED,0.45),label:'Zero line',dashed:true}].map(({color,label,dashed})=>(
                                <Box key={label} sx={{display:'flex',alignItems:'center',gap:0.6}}>
                                    <Box sx={{width:16,height:2,bgcolor:color,borderRadius:'1px',borderTop:dashed?`2px dashed ${color}`:'none',background:dashed?'none':color}}/>
                                    <Typography sx={{fontSize:'0.63rem',color:SLATE}}>{label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <Box sx={{p:2,display:'flex',flexDirection:'column',gap:2}}>
                        <Box>
                            <Typography sx={{fontSize:'0.67rem',fontWeight:600,color:SLATE,textTransform:'uppercase',letterSpacing:'0.06em',mb:1}}>Income vs spend</Typography>
                            <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                                <Box sx={{position:'relative',flexShrink:0}}>
                                    <ResponsiveContainer width={72} height={72}><RePieChart><Pie data={ivsTwoData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={34} paddingAngle={2}>{ivsTwoData.map((d,i)=><Cell key={i} fill={d.color} stroke="none"/>)}</Pie></RePieChart></ResponsiveContainer>
                                    <Box sx={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}><Typography sx={{fontSize:'0.62rem',fontWeight:700,color:savePct>=0?GREEN:RED}}>{savePct>=0?'+':''}{savePct}%</Typography></Box>
                                </Box>
                                <Box sx={{flex:1}}>{[{l:'Income',v:fmtC(activePeriod.income),c:MAROON},{l:'Spent',v:fmtC(activePeriod.expenses),c:NAVY},{l:'Saved',v:fmtC(savedAmt),c:GREEN},{l:'Balance',v:fmtC(activePeriod.balance),c:activePeriod.isFuture?BLUE:activePeriod.balance>=0?GREEN:RED}].map(({l,v,c})=><Box key={l} sx={{display:'flex',justifyContent:'space-between',mb:0.3}}><Typography sx={{fontSize:'0.68rem',color:SLATE}}>{l}</Typography><Typography sx={{fontSize:'0.68rem',fontWeight:600,color:c}}>{v}</Typography></Box>)}</Box>
                            </Box>
                        </Box>
                        <Divider sx={{borderColor:alpha('#000',.07)}}/>
                        <Box sx={{flex:1}}>
                            <Typography sx={{fontSize:'0.67rem',fontWeight:600,color:SLATE,textTransform:'uppercase',letterSpacing:'0.06em',mb:1}}>Forecast summary</Typography>
                            {data.map((d,i)=>{const prev=i>0?data[i-1].balance:1240,delta=d.balance-prev,balColor=d.isFuture?BLUE:d.balance>=0?GREEN:RED,savColor=delta>=0?GREEN:RED,isActive=(selIdx??hist-1)===i;return(
                                <Box key={i} onClick={()=>setSelIdx(i)} sx={{display:'flex',alignItems:'center',justifyContent:'space-between',py:0.5,borderBottom:`0.5px solid ${alpha('#000',.05)}`,cursor:'pointer',borderRadius:'3px',px:0.25,bgcolor:isActive?alpha(balColor,.05):'transparent','&:hover':{bgcolor:alpha(balColor,.04)}}}>
                                    <Box sx={{display:'flex',alignItems:'center',gap:0.6}}><Box sx={{width:5,height:5,borderRadius:'50%',bgcolor:d.isFuture?BLUE:alpha('#000',.18),flexShrink:0}}/><Typography sx={{fontSize:'0.69rem',color:SLATE}}>{d.label}{d.isFuture&&<Box component="span" sx={{fontSize:'0.57rem',color:BLUE,ml:0.4}}>est</Box>}</Typography></Box>
                                    <Box sx={{display:'flex',alignItems:'center',gap:0.5}}>
                                        <Box sx={{px:0.6,py:0.15,borderRadius:'3px',bgcolor:savColor===GREEN?alpha(GREEN,.08):alpha(RED,.08)}}><Typography sx={{fontSize:'0.62rem',fontWeight:600,color:savColor}}>{delta>=0?'+':''}{fmtC(delta)}</Typography></Box>
                                        <Typography sx={{fontSize:'0.66rem',color:alpha(SLATE,0.55),mx:0.25}}>→</Typography>
                                        <Typography sx={{fontSize:'0.69rem',fontWeight:600,color:balColor,minWidth:44,textAlign:'right'}}>{fmtC(d.balance)}</Typography>
                                    </Box>
                                </Box>
                            );})}
                            <Box sx={{mt:0.75,pt:0.75,borderTop:`0.5px solid ${alpha('#000',.07)}`,display:'flex',justifyContent:'space-between'}}>
                                <Typography sx={{fontSize:'0.62rem',color:alpha(SLATE,0.55)}}>saved → balance</Typography>
                            </Box>                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// ── SubView toggle pill — rendered inside card header ─────────────────────────
const SubViewToggle:React.FC<{active:PlanningSubView;onChange:(v:PlanningSubView)=>void}> = ({active,onChange}) => (
    <Box sx={{display:'flex',border:`1px solid rgba(255,255,255,0.25)`,borderRadius:'6px',overflow:'hidden'}}>
        {([['classic','Classic',<TableIcon size={11}/>],['rolling','Rolling',<BarChart2 size={11}/>]] as [PlanningSubView,string,React.ReactNode][]).map(([key,label,icon])=>(
            <Box key={key} onClick={()=>onChange(key)} sx={{px:1.25,py:0.5,display:'flex',alignItems:'center',gap:0.5,cursor:'pointer',bgcolor:active===key?'rgba(255,255,255,0.22)':'transparent',color:'#fff',fontSize:'0.72rem',fontWeight:600,borderRight:`1px solid rgba(255,255,255,0.2)`,transition:'all .15s','&:last-child':{borderRight:'none'},'&:hover':active!==key?{bgcolor:'rgba(255,255,255,0.12)'}:{},userSelect:'none'}}>
                {icon}{label}
            </Box>
        ))}
    </Box>
);

// ── Planning View ─────────────────────────────────────────────────────────────
const PlanningView:React.FC<{
    template:SpreadsheetTemplate;editMode:boolean;
    onCellChange:(ri:number,ci:number,v:number|null)=>void;
    periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
    subView:PlanningSubView;onSubView:(v:PlanningSubView)=>void;
}> = ({template,editMode,onCellChange,periodFilter,onPeriodFilter,subView,onSubView}) => {
    const totalSalary=template.rows.find(r=>r.label==='Salary')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const totalExpenses=template.rows.find(r=>r.label==='Expenses')?.values.reduce((a:number,v)=>a+(v??0),0)??0;

    const OptimizerCol=()=>(
        <Grid item xs={12} xl={3}>
            <Box sx={{position:'sticky',top:24}}>
                <BudgetOptimizerPanel template={template}/>
            </Box>
        </Grid>
    );

    // Templates with a viewOverride render their own dedicated view — no sub-toggle needed
    if(template.viewOverride){
        const isForecast=template.viewOverride==='forecast-classic'||template.viewOverride==='forecast-visual';
        const accentColor=isForecast?BLUE:MAROON;
        const icon=template.viewOverride==='forecast-visual'?<TrendingUp size={15} color="white"/>:template.viewOverride==='forecast-classic'?<TableIcon size={15} color="white"/>:template.viewOverride==='rolling-planned-actual'?<BarChart2 size={15} color="white"/>:<TableIcon size={15} color="white"/>;
        const subtitle=template.viewOverride==='forecast-classic'?'Category expenses · account balance · forward projections'
            :template.viewOverride==='forecast-visual'?'Spending donut · balance trajectory · period-by-period forecast'
                :template.viewOverride==='rolling-balance'?'Category groups · rolling period columns · balance tracking'
                    :'Planned vs actual per category group';
        return(
            <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} xl={9}>
                    <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(accentColor,0.2)}`,boxShadow:`0 4px 20px ${alpha(accentColor,0.08)}`}}>
                        <MaroonCardHeader icon={icon} title={template.name} subtitle={subtitle}/>
                        <Box sx={{bgcolor:'#fff',p:2.75}}>
                            {template.viewOverride==='rolling-balance'&&<RollingBalanceView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                            {template.viewOverride==='rolling-planned-actual'&&<RollingPlannedActualView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                            {template.viewOverride==='forecast-classic'&&<ForecastClassicView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                            {template.viewOverride==='forecast-visual'&&<ForecastVisualView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>}
                        </Box>
                    </Box>
                </Grid>
                <OptimizerCol/>
            </Grid>
        );
    }

    // Standard templates — Classic / Rolling toggle lives IN the card header
    return(
        <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} xl={9}>
                <Stack spacing={3}>
                    {subView==='classic'&&(
                        <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.08)}`}}>
                            <MaroonCardHeader
                                icon={<TableIcon size={15} color="white"/>}
                                title={template.name}
                                subtitle={`${template.periodType} · ${template.periods.length} periods${editMode?' · editing':''}`}
                                right={<SubViewToggle active={subView} onChange={onSubView}/>}
                            />
                            <Box sx={{bgcolor:'#fff',p:2.75}}>
                                <ClassicSpreadsheet template={template} editMode={editMode} onCellChange={onCellChange} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>
                            </Box>
                        </Box>
                    )}
                    {subView==='rolling'&&(
                        <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.08)}`}}>
                            <MaroonCardHeader
                                icon={<BarChart2 size={15} color="white"/>}
                                title={template.name}
                                subtitle={`${template.periodType} · ${template.periods.length} periods · Category groups as rows`}
                                right={<SubViewToggle active={subView} onChange={onSubView}/>}
                            />
                            <Box sx={{bgcolor:'#fff',p:2.75}}>
                                <RollingBalanceView template={template} periodFilter={periodFilter} onPeriodFilter={onPeriodFilter}/>
                            </Box>
                        </Box>
                    )}
                    {/* Summary footer */}
                    <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.08)}`}}>
                        <MaroonCardHeader icon={<Award size={15} color="white"/>} title="Overall Summary" subtitle={`Totals across all ${template.periods.length} periods`}/>
                        <Box sx={{bgcolor:'#fff',p:0}}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead><TableRow sx={{bgcolor:'#fdf8f8'}}>{['Budget Goal','Total Planned','Total Spent','Savings %','Over Budget %'].map(h=><TableCell key={h} sx={{fontWeight:600,color:MAROON,fontSize:'0.69rem',textTransform:'uppercase',letterSpacing:'0.07em',py:1.25,px:2,borderBottom:`1.5px solid ${alpha(MAROON,.12)}`}}>{h}</TableCell>)}</TableRow></TableHead>
                                    <TableBody><TableRow>{(()=>{const sr=totalSalary>0?((totalSalary-totalExpenses)/totalSalary)*100:0,bu=totalSalary>0?(totalExpenses/totalSalary)*100:0;return[{v:`$${fmt(totalSalary)}`,c:NAVY},{v:`$${fmt(totalSalary)}`,c:NAVY},{v:`$${fmt(totalExpenses)}`,c:MAROON},{v:`${sr>=0?'+':''}${sr.toFixed(1)}%`,c:sr>=0?GREEN:RED},{v:`${bu>100?'+':'–'}${Math.abs(bu-100).toFixed(1)}%`,c:bu>100?RED:GREEN}].map(({v,c},i)=><TableCell key={i} sx={{fontWeight:600,fontSize:'0.86rem',color:c,py:1.5,px:2,fontVariantNumeric:'tabular-nums'}}>{v}</TableCell>);})()}</TableRow></TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                </Stack>
            </Grid>
            <OptimizerCol/>
        </Grid>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const BudgetPlanner: React.FC = () => {
    const [animateIn,setAnimateIn]=useState(false);
    const [templates,setTemplates]=useState<SpreadsheetTemplate[]>([]);
    const [selectedId,setSelectedId]=useState<string>('preset-rolling');
    // Two persistent top-level modes
    const [topViewMode,setTopViewMode]=useState<TopViewMode>('current-month');
    // Planning sub-view (Classic or Rolling)
    const [planningSubView,setPlanningSubView]=useState<PlanningSubView>('classic');
    const [editMode,setEditMode]=useState(false);
    const [showRuleSelector,setShowRuleSelector]=useState(false);
    const [selectedRuleId,setSelectedRuleId]=useState('50-30-20');
    const [monthlyIncome,setMonthlyIncome]=useState(5000);
    const [openSaveDialog,setOpenSaveDialog]=useState(false);
    const [saveName,setSaveName]=useState('');
    const [currentMonth,setCurrentMonth]=useState(new Date());
    const [periodFilter,setPeriodFilter]=useState<PeriodFilter>('Biweekly');
    const [openWizard,setOpenWizard]=useState(false);

    const monthLabel=currentMonth.toLocaleString('default',{month:'long',year:'numeric'});

    useEffect(()=>{setTimeout(()=>setAnimateIn(true),100);},[]);
    useEffect(()=>{setTemplates([ROLLING_TEMPLATE,NOV_MAY,ROLLING_BALANCE_TEMPLATE,ROLLING_PLANNED_ACTUAL_TEMPLATE,FORECAST_CLASSIC_TEMPLATE,FORECAST_VISUAL_TEMPLATE]);},[]);

    const currentTemplate=templates.find(t=>t.id===selectedId)??templates[0];

    const totalSalary=currentTemplate?.rows.find(r=>r.label==='Salary')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const totalExpenses=currentTemplate?.rows.find(r=>r.label==='Expenses')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
    const finalBalance=currentTemplate?.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null).slice(-1)[0]??0;
    const savingsRate=totalSalary>0?((totalSalary-totalExpenses)/totalSalary)*100:0;
    const avgIncome=totalSalary/(currentTemplate?.periods.length||1);
    const avgExpenses=totalExpenses/(currentTemplate?.periods.length||1);

    const handleCellChange=(ri:number,ci:number,value:number|null)=>{
        setTemplates(prev=>prev.map(t=>{
            if(t.id!==selectedId)return t;
            const rows=t.rows.map((r,i)=>i===ri?{...r,values:r.values.map((v,j)=>j===ci?value:v)}:r);
            const ei=rows.findIndex(r=>r.rowType==='expenses'),bi=rows.findIndex(r=>r.rowType==='balance'),si=rows.findIndex(r=>r.rowType==='salary');
            if(ei>=0){const er=rows.filter(r=>r.rowType==='expense');rows[ei]={...rows[ei],values:rows[ei].values.map((_,j)=>er.reduce((s,r)=>s+(r.values[j]??0),0))};}
            if(bi>=0&&si>=0){let run=0;rows[bi]={...rows[bi],values:rows[bi].values.map((_,j)=>{const s=rows[si].values[j]??0,e=ei>=0?rows[ei].values[j]??0:0;run=run+s-e;return run;})};}
            return{...t,rows};
        }));
    };

    const handleWizardCreate=(config:{name:string;periodType:PeriodType;startMonth:string;endMonth:string;income:number;categories:{name:string;color:string}[];allocs:Record<string,number>})=>{
        const start=new Date(config.startMonth+'-01'),end=new Date(config.endMonth+'-01');
        end.setMonth(end.getMonth()+1);end.setDate(0);
        const{periods,months}=generatePeriods(config.periodType,start,end);
        const rows=makeBlankRows(periods.length);
        const salaryIdx=rows.findIndex(r=>r.label==='Salary');
        if(salaryIdx>=0&&config.income>0)rows[salaryIdx]={...rows[salaryIdx],values:rows[salaryIdx].values.map(()=>config.income)};
        config.categories.forEach(cat=>{const amount=config.allocs[cat.name]??0;if(amount<=0)return;const rowIdx=rows.findIndex(r=>r.label===cat.name);if(rowIdx>=0)rows[rowIdx]={...rows[rowIdx],values:rows[rowIdx].values.map(()=>amount)};});
        const expIdx=rows.findIndex(r=>r.rowType==='expenses'),salIdx=rows.findIndex(r=>r.rowType==='salary');
        if(expIdx>=0){const expenseRows=rows.filter(r=>r.rowType==='expense');rows[expIdx]={...rows[expIdx],values:rows[expIdx].values.map((_,ci)=>expenseRows.reduce((s,r)=>s+(r.values[ci]??0),0))};}
        const balIdx=rows.findIndex(r=>r.rowType==='balance');
        if(balIdx>=0&&salIdx>=0){let running=0;rows[balIdx]={...rows[balIdx],values:rows[balIdx].values.map((_,ci)=>{const sal=rows[salIdx].values[ci]??0,exp=expIdx>=0?rows[expIdx].values[ci]??0:0;running=running+sal-exp;return running;})};}
        const newTemplate:SpreadsheetTemplate={id:generateUUID(),name:config.name,periodType:config.periodType,months,periods,rows};
        setTemplates(prev=>[...prev,newTemplate]);setSelectedId(newTemplate.id);
    };

    const handleSaveCopy=()=>{
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

    const RuleCard:React.FC<{rule:BudgetRule;selected:boolean;onSelect:()=>void}>=({rule,selected,onSelect})=>(
        <Box onClick={onSelect} sx={{p:1.5,borderRadius:'9px',cursor:'pointer',border:`1.5px solid ${selected?rule.color:alpha('#000',0.07)}`,bgcolor:selected?alpha(rule.color,0.04):'#fff',transition:'all 0.18s','&:hover':{borderColor:rule.color},position:'relative'}}>
            {selected&&<Box sx={{position:'absolute',top:7,right:7,color:rule.color}}><CheckCircle2 size={13}/></Box>}
            <Box sx={{display:'flex',alignItems:'center',gap:1,mb:0.625}}><Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:alpha(rule.color,0.1),color:rule.color,display:'flex',alignItems:'center',justifyContent:'center'}}>{rule.icon}</Box><Box><Typography sx={{fontSize:'0.8rem',fontWeight:700,color:NAVY,lineHeight:1}}>{rule.shortName}</Typography><Typography sx={{fontSize:'0.6rem',color:SLATE}}>{rule.tagline}</Typography></Box></Box>
            <Box sx={{display:'flex',height:4,borderRadius:2,overflow:'hidden',gap:'1px'}}>{Object.entries(rule.allocations).filter(([,v])=>v>0).map(([k,v],i)=><Box key={k} sx={{flex:v,bgcolor:CHART_COLORS[i%CHART_COLORS.length]}}/>)}</Box>
        </Box>
    );

    // ── Template dropdown — grouped ────────────────────────────────────────────
    const STANDARD_IDS = ['preset-biweekly','preset-rolling'];
    const ROLLING_IDS  = ['preset-rolling-balance','preset-rolling-planned-actual'];
    const FORECAST_IDS = ['preset-forecast-classic','preset-forecast-visual'];
    const chipFor=(t:SpreadsheetTemplate)=>{
        if(FORECAST_IDS.includes(t.id))return{label:'Forecast',bg:alpha(BLUE,0.1),color:BLUE};
        if(ROLLING_IDS.includes(t.id)){
            if(t.viewOverride==='rolling-balance')return{label:'Balance',bg:alpha(MAROON,0.1),color:MAROON};
            return{label:'Plan/Actual',bg:alpha(MAROON,0.1),color:MAROON};
        }
        if(!t.viewOverride)return{label:String(t.periodType),bg:alpha(TEAL,0.1),color:TEAL};
        return{label:String(t.periodType),bg:alpha(TEAL,0.1),color:TEAL};
    };
    const Divider2=()=><MenuItem disabled sx={{py:0.2,opacity:1,minHeight:'auto'}}><Box sx={{width:'100%',height:'1px',bgcolor:alpha('#000',0.09)}}/></MenuItem>;
    const standardTs=templates.filter(t=>STANDARD_IDS.includes(t.id)||(!ROLLING_IDS.includes(t.id)&&!FORECAST_IDS.includes(t.id)&&!t.viewOverride));
    const rollingTs=templates.filter(t=>ROLLING_IDS.includes(t.id));
    const forecastTs=templates.filter(t=>FORECAST_IDS.includes(t.id));
    const userTs=templates.filter(t=>![...STANDARD_IDS,...ROLLING_IDS,...FORECAST_IDS].includes(t.id)&&!!t.viewOverride===false&&!STANDARD_IDS.includes(t.id));

    const TemplateSelector=()=>(
        <FormControl size="small" sx={{minWidth:270}}>
            <InputLabel sx={{fontSize:'0.82rem',color:SLATE}}>Template</InputLabel>
            <Select value={selectedId||''} label="Template" onChange={e=>setSelectedId(e.target.value)}
                    sx={{bgcolor:'#fff',borderRadius:'8px',fontSize:'0.82rem','& .MuiOutlinedInput-notchedOutline':{borderColor:alpha('#000',0.12)},'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:MAROON}}}>
                {standardTs.map(t=>{const c=chipFor(t);return(
                    <MenuItem key={t.id} value={t.id}>
                        <Box sx={{display:'flex',alignItems:'center',gap:1}}><Chip label={c.label} size="small" sx={{height:17,fontSize:'0.6rem',fontWeight:600,bgcolor:c.bg,color:c.color}}/><Typography sx={{fontSize:'0.82rem'}}>{t.name}</Typography></Box>
                    </MenuItem>
                );})}
                {rollingTs.length>0&&<Divider2/>}
                {rollingTs.map(t=>{const c=chipFor(t);return(
                    <MenuItem key={t.id} value={t.id}>
                        <Box sx={{display:'flex',alignItems:'center',gap:1}}><Chip label={c.label} size="small" sx={{height:17,fontSize:'0.6rem',fontWeight:600,bgcolor:c.bg,color:c.color}}/><Typography sx={{fontSize:'0.82rem'}}>{t.name}</Typography></Box>
                    </MenuItem>
                );})}
                {forecastTs.length>0&&<Divider2/>}
                {forecastTs.map(t=>{const c=chipFor(t);return(
                    <MenuItem key={t.id} value={t.id}>
                        <Box sx={{display:'flex',alignItems:'center',gap:1}}><Chip label={c.label} size="small" sx={{height:17,fontSize:'0.6rem',fontWeight:600,bgcolor:c.bg,color:c.color}}/><Typography sx={{fontSize:'0.82rem'}}>{t.name}</Typography></Box>
                    </MenuItem>
                );})}
            </Select>
        </FormControl>
    );

    // ── Top-level mode toggle ──────────────────────────────────────────────────
    const TopModeToggle=()=>(
        <Box sx={{display:'flex',border:`1.5px solid ${alpha(MAROON,0.25)}`,borderRadius:'9px',overflow:'hidden',boxShadow:`0 1px 4px ${alpha(MAROON,0.08)}`}}>
            {([
                ['current-month','Current Month',<Calendar size={13}/>],
                ['planning','Planning View',<TrendingUp size={13}/>],
            ] as [TopViewMode,string,React.ReactNode][]).map(([key,label,icon])=>(
                <Box key={key} onClick={()=>setTopViewMode(key)} sx={{
                    px:2,py:0.875,display:'flex',alignItems:'center',gap:0.625,
                    cursor:'pointer',
                    bgcolor:topViewMode===key?MAROON:'#fff',
                    color:topViewMode===key?'#fff':SLATE,
                    fontSize:'0.79rem',fontWeight:600,
                    borderRight:`1px solid ${alpha(MAROON,0.18)}`,
                    transition:'all .18s',
                    '&:last-child':{borderRight:'none'},
                    '&:hover':topViewMode!==key?{bgcolor:alpha(MAROON,0.04),color:MAROON}:{},
                }}>
                    {icon}{label}
                </Box>
            ))}
        </Box>
    );

    return(
        <Box sx={{maxWidth:'calc(100% - 240px)',ml:'240px',minHeight:'100vh',background:BG}}>
            <Sidebar/>
            <Container maxWidth="xl" sx={{py:4}}>

                <Grow in={animateIn} timeout={400}>
                    <Box sx={{mb:4}}>
                        {/* Row 1: Title + action buttons */}
                        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',mb:2.5,flexDirection:{xs:'column',sm:'row'},gap:2}}>
                            <Box>
                                <Box sx={{width:24,height:2.5,background:MAROON,borderRadius:'2px',mb:0.875}}/>
                                <Typography variant="h4" component="h1" sx={{fontWeight:700,color:'#111',letterSpacing:'-0.02em'}}>
                                    {topViewMode==='current-month'?`${monthLabel} Budget Planner`:'Budget Planning'}
                                </Typography>
                                <Typography variant="subtitle1" sx={{color:'#94a3b8',mt:0.5,fontSize:'0.88rem'}}>
                                    {topViewMode==='current-month'
                                        ?'Track your progress and stay within spending limits'
                                        :'Plan budgets across periods · Classic or rolling view'}
                                </Typography>
                            </Box>
                            <Box sx={{display:'flex',alignItems:'center',gap:0.875,flexShrink:0,flexWrap:'wrap'}}>
                                {/* Month nav — only in Current Month mode */}
                                {topViewMode==='current-month'&&<>
                                    <IconButton onClick={()=>setCurrentMonth(prev=>{const d=new Date(prev);d.setMonth(d.getMonth()-1);return d;})} sx={{width:30,height:30,borderRadius:'6px',background:MAROON,color:'#fff','&:hover':{background:MAROON_DARK}}}><Box component="span" sx={{fontSize:'1rem',lineHeight:1}}>‹</Box></IconButton>
                                    <Card elevation={0} sx={{px:1.5,py:0.5,display:'flex',alignItems:'center',gap:0.625,borderRadius:'7px',border:`1px solid ${alpha('#000',0.1)}`,background:'#f9f9f9'}}>
                                        <Calendar size={12} color="#94a3b8"/>
                                        <Typography sx={{fontSize:'0.78rem',fontWeight:600,color:'#333',whiteSpace:'nowrap'}}>{monthLabel}</Typography>
                                    </Card>
                                    <IconButton onClick={()=>setCurrentMonth(prev=>{const d=new Date(prev);d.setMonth(d.getMonth()+1);return d;})} sx={{width:30,height:30,borderRadius:'6px',background:MAROON,color:'#fff','&:hover':{background:MAROON_DARK}}}><Box component="span" sx={{fontSize:'1rem',lineHeight:1}}>›</Box></IconButton>
                                    <Box sx={{width:'1px',height:22,bgcolor:alpha('#000',0.1),mx:0.25}}/>
                                </>}
                                {/* Edit (Planning mode only) */}
                                {topViewMode==='planning'&&(
                                    <Button variant="outlined" size="small" onClick={()=>setEditMode(v=>!v)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.76rem',gap:0.5,borderColor:editMode?TEAL:alpha('#000',0.15),color:editMode?'#fff':'#555',bgcolor:editMode?TEAL:'#fff','&:hover':{borderColor:TEAL,color:editMode?'#fff':TEAL,bgcolor:editMode?'#0f766e':alpha(TEAL,0.04)}}}>
                                        {editMode?<EditOff sx={{fontSize:'0.8rem'}}/>:<Edit sx={{fontSize:'0.8rem'}}/>}{editMode?'Stop':'Edit'}
                                    </Button>
                                )}
                                <Button variant="outlined" size="small" onClick={()=>setOpenWizard(true)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.76rem',borderColor:alpha('#000',0.15),color:'#555',bgcolor:'#fff','&:hover':{borderColor:MAROON,color:MAROON,bgcolor:alpha(MAROON,0.04)}}}>
                                    <Add sx={{fontSize:'0.85rem',mr:0.25}}/> New
                                </Button>
                                <Button variant="outlined" size="small" onClick={()=>setShowRuleSelector(v=>!v)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.76rem',gap:0.5,borderColor:showRuleSelector?MAROON:alpha('#000',0.15),color:showRuleSelector?'#fff':'#555',bgcolor:showRuleSelector?MAROON:'#fff','&:hover':{borderColor:MAROON,color:showRuleSelector?'#fff':MAROON}}}>
                                    <Sparkles size={12}/> Rule
                                </Button>
                                {currentTemplate&&(
                                    <Button variant="outlined" size="small" onClick={()=>setOpenSaveDialog(true)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.76rem',gap:0.5,borderColor:alpha('#000',0.15),color:'#555',bgcolor:'#fff','&:hover':{borderColor:MAROON,color:MAROON,bgcolor:alpha(MAROON,0.04)}}}>
                                        <Save sx={{fontSize:'0.8rem'}}/> Save
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {/* Row 2: Template dropdown + top-mode toggle — always visible */}
                        <Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}>
                            <TemplateSelector/>
                            <TopModeToggle/>
                        </Box>
                    </Box>
                </Grow>

                {/* KPI cards */}
                {currentTemplate&&(
                    <Grow in={animateIn} timeout={600}>
                        <Grid container spacing={2} sx={{mb:3.5}}>
                            {kpiCards.map(({label,val,color,base,sub})=>(
                                <Grid item xs={12} sm={6} md={3} key={label}>
                                    <Box sx={{background:base,borderRadius:'9px',borderTop:`2.5px solid ${color}`,boxShadow:`0 1px 8px ${alpha(color,0.12)}`,p:2.25,height:'100%',transition:'box-shadow 0.2s','&:hover':{boxShadow:`0 4px 16px ${alpha(color,0.18)}`}}}>
                                        <Typography sx={{fontSize:'0.66rem',textTransform:'uppercase',letterSpacing:'0.1em',color:alpha(color,0.65),fontWeight:600,mb:0.875}}>{label}</Typography>
                                        <Typography sx={{fontSize:'1.5rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums',lineHeight:1,mb:0.5}}>{val}</Typography>
                                        <Typography sx={{fontSize:'0.7rem',color:alpha(color,0.55),mt:0.75}}>{sub}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grow>
                )}

                {/* Rule selector */}
                {showRuleSelector&&(
                    <Grow in timeout={200}>
                        <Box sx={{p:2.75,borderRadius:'12px',border:`1px solid ${alpha(TEAL,0.18)}`,bgcolor:'#fff',mb:3,boxShadow:`0 4px 20px ${alpha('#000',0.06)}`}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:2}}>
                                <Box sx={{display:'flex',alignItems:'center',gap:1.25}}><Box sx={{width:30,height:30,borderRadius:'7px',bgcolor:alpha(TEAL,0.1),display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={15} color={TEAL}/></Box><Box><Typography sx={{fontWeight:700,fontSize:'0.92rem',color:NAVY}}>Apply a Budget Rule</Typography><Typography sx={{fontSize:'0.71rem',color:SLATE}}>Auto-distribute salary into category budgets</Typography></Box></Box>
                                <Button size="small" onClick={()=>setShowRuleSelector(false)} sx={{color:SLATE,textTransform:'none'}}>Dismiss</Button>
                            </Box>
                            <Box sx={{display:'flex',gap:2,alignItems:'center',mb:2,p:1.75,borderRadius:'8px',bgcolor:alpha(TEAL,0.04),border:`1px solid ${alpha(TEAL,0.12)}`}}>
                                <Wallet size={15} color={TEAL}/>
                                <Box sx={{flex:1}}><Typography sx={{fontSize:'0.69rem',fontWeight:600,color:SLATE,mb:0.5}}>Monthly Income</Typography><TextField size="small" type="number" value={monthlyIncome} onChange={e=>setMonthlyIncome(Number(e.target.value))} InputProps={{startAdornment:<Typography sx={{mr:0.5,color:SLATE}}>$</Typography>}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'7px',fontWeight:600},maxWidth:150}}/></Box>
                            </Box>
                            <Grid container spacing={1} sx={{mb:2}}>{BUDGET_RULES.map(rule=><Grid item xs={12} sm={6} md={4} lg={2.4} key={rule.id}><RuleCard rule={rule} selected={selectedRuleId===rule.id} onSelect={()=>setSelectedRuleId(rule.id)}/></Grid>)}</Grid>
                            <Button variant="contained" onClick={()=>setShowRuleSelector(false)} sx={{bgcolor:MAROON,color:'#fff',borderRadius:'7px',textTransform:'none',fontWeight:600,'&:hover':{bgcolor:MAROON_DARK}}}>Apply Rule</Button>
                        </Box>
                    </Grow>
                )}

                {/* Main content — both modes always available */}
                {currentTemplate&&(
                    <Grow in={animateIn} timeout={700}>
                        <Box>
                            {topViewMode==='current-month'&&(
                                <CurrentMonthView
                                    template={currentTemplate}
                                    periodFilter={periodFilter}
                                    onPeriodFilter={setPeriodFilter}
                                />
                            )}
                            {topViewMode==='planning'&&(
                                <PlanningView
                                    template={currentTemplate}
                                    editMode={editMode}
                                    onCellChange={handleCellChange}
                                    periodFilter={periodFilter}
                                    onPeriodFilter={setPeriodFilter}
                                    subView={planningSubView}
                                    onSubView={setPlanningSubView}
                                />
                            )}
                        </Box>
                    </Grow>
                )}
            </Container>

            <ManualTemplateWizard
                open={openWizard}
                onClose={() => setOpenWizard(false)}
                onCreateTemplate={handleWizardCreate}
            />

            <Dialog open={openSaveDialog} onClose={()=>setOpenSaveDialog(false)} PaperProps={{sx:{borderRadius:'12px',p:1,minWidth:360}}}>
                <DialogTitle sx={{fontWeight:700,color:NAVY,pb:1}}>Save a Copy</DialogTitle>
                <DialogContent><TextField label="New Template Name" value={saveName} onChange={e=>setSaveName(e.target.value)} fullWidth margin="normal" sx={{'& .MuiOutlinedInput-root':{borderRadius:'7px'}}}/></DialogContent>
                <DialogActions sx={{px:3,pb:2}}>
                    <Button onClick={()=>setOpenSaveDialog(false)} sx={{color:SLATE,textTransform:'none',fontWeight:600}}>Cancel</Button>
                    <Button onClick={handleSaveCopy} variant="contained" disabled={!saveName} sx={{bgcolor:MAROON,textTransform:'none',fontWeight:600,borderRadius:'7px','&:hover':{bgcolor:MAROON_DARK}}}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BudgetPlanner;
// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import {
//     Box, Typography, Table, TableBody, TableCell, TableContainer,
//     TableHead, TableRow, Card, Grid, Container, alpha, Grow, Button,
//     Dialog, DialogTitle, DialogContent, DialogActions, TextField,
//     Select, MenuItem, FormControl, InputLabel, Chip, LinearProgress,
//     Divider, Tab, Tabs, IconButton, Paper, Stack,
// } from '@mui/material';
// import { Add, Edit, EditOff, Save } from '@mui/icons-material';
// import {
//     Wallet, Target, Sparkles, CheckCircle2, PiggyBank, ShoppingBag, Zap,
//     TableIcon, TrendingUp, TrendingDown, BarChart2, AlertTriangle, Award,
//     ArrowUpRight, ArrowDownRight, Calendar, PieChart,
// } from 'lucide-react';
// import {
//     PieChart as RePieChart, Pie, Cell, Tooltip as RTooltip, Legend,
//     ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
//     LineChart, Line, ReferenceLine,
// } from 'recharts';
// import Sidebar from './Sidebar';
// import ManualTemplateWizard from "./ManualTemplateWizard";
//
// // ── Design tokens ─────────────────────────────────────────────────────────────
// const MAROON      = '#6b1a1a';
// const MAROON_DARK = '#4a1010';
// const TEAL        = '#0d9488';
// const GREEN       = '#059669';
// const AMBER       = '#d97706';
// const RED         = '#dc2626';
// const NAVY        = '#1e293b';
// const SLATE       = '#64748b';
// const BG          = '#f0f2f5';
//
// const CAT_COLORS: Record<string, string> = {
//     Housing:        '#1D9E75',
//     Food:           '#6b1a1a',
//     Transportation: '#BA7517',
//     Entertainment:  '#378ADD',
//     Other:          '#D4537E',
// };
// const CHART_COLORS = ['#1D9E75','#6b1a1a','#BA7517','#378ADD','#D4537E','#7c3aed','#0ea5e9'];
//
// const CATEGORY_GROUPS: Record<string, string> = {
//     Rent:'Housing', Utilities:'Housing', Electric:'Housing', 'Gas Bill':'Housing',
//     Groceries:'Food', 'Order out':'Food', 'Coffee Supplies':'Food',
//     Gas:'Transportation',
//     Golf:'Entertainment', Subscriptions:'Entertainment', 'Trip Cost':'Entertainment', Haircut:'Entertainment',
//     Insurance:'Other', 'Phone Insurance':'Other', Payments:'Other', 'Other Stuff':'Other', Savings:'Other',
// };
// const GROUP_ORDER = ['Housing','Food','Transportation','Entertainment','Other'];
//
// type PeriodType = 'Weekly' | 'Biweekly' | 'Monthly' | '2-Monthly' | '3-Monthly';
// const PERIOD_TYPES: PeriodType[] = ['Weekly','Biweekly','Monthly','2-Monthly','3-Monthly'];
// type TopViewMode = 'current-month' | 'classic';
// type PeriodFilter = 'Weekly' | 'Biweekly' | 'Monthly';
//
// interface SpreadsheetRow {
//     label: string;
//     rowType: 'expense' | 'salary' | 'expenses' | 'balance' | 'extra';
//     values: (number | null)[];
// }
// interface MonthGroup { name: string; cols: number[]; }
// interface SpreadsheetTemplate {
//     id: string; name: string; periodType: PeriodType | 'standard';
//     months: MonthGroup[]; periods: string[]; rows: SpreadsheetRow[];
// }
// interface BudgetRule {
//     id: string; name: string; shortName: string; description: string;
//     tagline: string; icon: React.ReactNode; color: string;
//     allocations: Record<string, number>; bestFor: string;
// }
//
// const BUDGET_RULES: BudgetRule[] = [
//     { id:'50-30-20', name:'50/30/20 Rule', shortName:'50/30/20', description:'Needs 50% · Wants 30% · Savings 20%', tagline:'The classic balanced approach', icon:<Target size={18}/>, color:TEAL, allocations:{Housing:35,Food:15,Transportation:10,Entertainment:10,Savings:20,Other:10}, bestFor:'Most income levels' },
//     { id:'70-20-10', name:'70/20/10 Rule', shortName:'70/20/10', description:'Living 70% · Savings 20% · Giving 10%', tagline:'For the generous saver', icon:<PiggyBank size={18}/>, color:'#7c3aed', allocations:{Housing:35,Food:20,Transportation:10,Entertainment:5,Savings:20,Other:10}, bestFor:'Wealth-building focus' },
//     { id:'80-20', name:'80/20 Rule', shortName:'80/20', description:'Living 80% · Savings 20%', tagline:'Simplified minimalism', icon:<Zap size={18}/>, color:AMBER, allocations:{Housing:40,Food:20,Transportation:10,Entertainment:10,Savings:20,Other:0}, bestFor:'Beginners' },
//     { id:'60-20-20', name:'60/20/20 Rule', shortName:'60/20/20', description:'Committed 60% · Savings 20% · Fun 20%', tagline:'Strict essentials', icon:<ShoppingBag size={18}/>, color:MAROON, allocations:{Housing:35,Food:15,Transportation:10,Entertainment:20,Savings:20,Other:0}, bestFor:'High earners' },
//     { id:'custom', name:'Custom Rule', shortName:'Custom', description:'Your own allocation mix', tagline:'Full control', icon:<Sparkles size={18}/>, color:'#0ea5e9', allocations:{Housing:30,Food:15,Transportation:10,Entertainment:10,Savings:15,Other:20}, bestFor:'Experienced budgeters' },
// ];
//
// const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16);});
// const fmt  = (n: number) => n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
// const fmtS = (n: number) => n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
// function addDays(d: Date, n: number){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
// function fmtDate(d: Date){return `${d.getMonth()+1}/${d.getDate()}`;}
//
// function generatePeriods(type: PeriodType, start: Date, end: Date):{periods:string[];months:MonthGroup[]} {
//     const periods:string[]=[], mm=new Map<string,number[]>();
//     if(['Monthly','2-Monthly','3-Monthly'].includes(type)){
//         const step=type==='Monthly'?1:type==='2-Monthly'?2:3;
//         let cur=new Date(start.getFullYear(),start.getMonth(),1),idx=0;
//         while(cur<=end){
//             periods.push(cur.toLocaleString('default',{month:'short',year:'2-digit'}));
//             const g=step===1?cur.toLocaleString('default',{month:'long'}):`${cur.toLocaleString('default',{month:'short'})}–${new Date(cur.getFullYear(),cur.getMonth()+step-1,1).toLocaleString('default',{month:'short',year:'2-digit'})}`;
//             if(!mm.has(g))mm.set(g,[]);mm.get(g)!.push(idx++);
//             cur=new Date(cur.getFullYear(),cur.getMonth()+step,1);
//         }
//     } else {
//         const step=type==='Weekly'?7:14;
//         let cur=new Date(start),idx=0;
//         while(cur<=end){
//             periods.push(`${fmtDate(cur)}–${fmtDate(addDays(cur,step-1))}`);
//             const g=cur.toLocaleString('default',{month:'long'});
//             if(!mm.has(g))mm.set(g,[]);mm.get(g)!.push(idx++);
//             cur=addDays(cur,step);
//         }
//     }
//     return{periods,months:Array.from(mm.entries()).map(([name,cols])=>({name,cols}))};
// }
//
// const DEFAULT_LABELS = ['Rent','Gas','Groceries','Insurance','Phone Insurance','Payments','Utilities','Electric','Gas Bill','Golf','Order out','Subscriptions','Trip Cost','Haircut','Other Stuff','Coffee Supplies','Savings'];
// function makeBlankRows(n:number):SpreadsheetRow[]{
//     const b=()=>Array(n).fill(null) as null[];
//     return[...DEFAULT_LABELS.map(l=>({label:l,rowType:'expense' as const,values:b()})),{label:'Salary',rowType:'salary' as const,values:b()},{label:'Expenses',rowType:'expenses' as const,values:b()},{label:'Extra',rowType:'extra' as const,values:b()},{label:'Remaining Balance',rowType:'balance' as const,values:b()}];
// }
//
// // ── Presets ───────────────────────────────────────────────────────────────────
// const SHARED_ROWS: SpreadsheetRow[] = [
//     {label:'Rent',           rowType:'expense',  values:[1927.03,null,1927,null,707,1220,707,1220,707,1220,null,1917,null,1917,null]},
//     {label:'Gas',            rowType:'expense',  values:[35.37,51.68,39.40,46.38,46,38.86,42,35.06,40.75,34,null,38,38,38,38]},
//     {label:'Groceries',      rowType:'expense',  values:[240.09,262.72,336.99,441.57,131.87,431.20,230,374.56,362.01,175,84.84,235,278,278,278]},
//     {label:'Insurance',      rowType:'expense',  values:[null,80.07,null,null,77.29,null,74.52,null,67.14,null,70.10,null,null,null,null]},
//     {label:'Phone Insurance',rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
//     {label:'Payments',       rowType:'expense',  values:[29.24,290.21,173.26,505.74,435.27,343,187.18,448.34,256,293.56,56,null,160,null,null]},
//     {label:'Utilities',      rowType:'expense',  values:[null,129.93,null,123.60,null,127.71,null,null,134.30,130.78,null,127,null,null,null]},
//     {label:'Electric',       rowType:'expense',  values:[120.95,null,61.77,null,null,63.89,null,52.77,null,53,null,52,null,null,null]},
//     {label:'Gas Bill',       rowType:'expense',  values:[null,16.50,null,20.75,null,35.11,null,52.75,null,null,35,30,null,null,null]},
//     {label:'Golf',           rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
//     {label:'Order out',      rowType:'expense',  values:[60.06,129.37,171,110.62,100.51,96.10,null,81.64,106.44,43.21,51.32,null,null,null,null]},
//     {label:'Subscriptions',  rowType:'expense',  values:[39.63,82.83,12.79,140.86,43.68,84.94,null,122.33,80.48,17.14,null,null,null,null,null]},
//     {label:'Trip Cost',      rowType:'expense',  values:[null,null,null,null,30,null,null,null,null,null,null,null,null,null,null]},
//     {label:'Haircut',        rowType:'expense',  values:[null,26,26,26,26,27,null,null,null,27,null,null,null,null,null]},
//     {label:'Other Stuff',    rowType:'expense',  values:[9,416.05,470,424,419.14,144,417,16.20,74.14,null,null,null,null,null,null]},
//     {label:'Coffee Supplies',rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
//     {label:'Savings',        rowType:'expense',  values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
//     {label:'Salary',         rowType:'salary',   values:[2548.23,2257.57,2530.93,1991.95,2171,2272.52,1941,2028,1970,1966,1988,1988,1988,1988,1988]},
//     {label:'Expenses',       rowType:'expenses', values:[2461.37,1485.36,3218.21,1839.52,2016.76,2611.81,1657.70,2403.65,1828.26,1993.69,297.26,2399,476,2233,316]},
//     {label:'Extra',          rowType:'extra',    values:[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
//     {label:'Remaining Balance',rowType:'balance',values:[86.86,859.07,171.79,324.22,478.46,139.17,422.47,46.82,188.56,160.87,1851.61,1440.61,2952.61,2707.61,4379.61]},
// ];
//
// const SHARED_MONTHS: MonthGroup[] = [{name:'November',cols:[0,1]},{name:'December',cols:[2,3,4]},{name:'January',cols:[5,6]},{name:'February',cols:[7,8]},{name:'March',cols:[9,10,11]},{name:'April',cols:[12,13,14]}];
//
// const NOV_MAY: SpreadsheetTemplate = {
//     id:'preset-biweekly', name:'Nov 2024 – May 2025', periodType:'Biweekly',
//     months:SHARED_MONTHS,
//     periods:['10/23–11/5','11/6–11/19','11/20–12/3','12/4–12/17','12/18–12/31','1/1–1/14','1/15–1/28','1/29–2/11','2/12–2/25','2/26–3/11','3/12–3/25','3/26–4/8','4/8–4/22','4/23–5/6','5/7–5/20'],
//     rows: SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
// };
//
// const ROLLING_TEMPLATE: SpreadsheetTemplate = {
//     id:'preset-rolling', name:'Nov 2024 – May 2025 (Rolling)', periodType:'Biweekly',
//     months:SHARED_MONTHS,
//     periods:['10/23','11/6','11/20','12/4','12/18','1/1','1/15','1/29','2/12','2/26','3/12','3/26','4/8','4/23','5/7'],
//     rows: SHARED_ROWS.map(r=>({...r,values:[...r.values]})),
// };
//
// // ── Derived helpers ───────────────────────────────────────────────────────────
// function deriveGroupTotals(t: SpreadsheetTemplate): Record<string, number[]> {
//     const g: Record<string,number[]> = {};
//     GROUP_ORDER.forEach(k=>{g[k]=Array(t.periods.length).fill(0);});
//     t.rows.filter(r=>r.rowType==='expense').forEach(row=>{
//         const grp=CATEGORY_GROUPS[row.label]??'Other';
//         row.values.forEach((v,i)=>{if(v!==null)g[grp][i]+=v;});
//     });
//     return g;
// }
// function derivePeriodSummary(t: SpreadsheetTemplate) {
//     const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
//     const exp=t.rows.find(r=>r.label==='Expenses')?.values??[];
//     const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
//     return t.periods.map((_,i)=>({
//         period:t.periods[i], income:sal[i]??0, expenses:exp[i]??0, balance:bal[i]??0,
//         savings:(sal[i]??0)-(exp[i]??0),
//         savingsPct:sal[i]?((sal[i]!-(exp[i]??0))/sal[i]!)*100:0,
//         spendPct:sal[i]?((exp[i]??0)/sal[i]!)*100:0,
//     }));
// }
//
// // ── Period filter: aggregate biweekly cols into monthly ───────────────────────
// function filterByPeriod(t: SpreadsheetTemplate, pf: PeriodFilter): SpreadsheetTemplate {
//     if (pf !== 'Monthly') return t; // Weekly/Biweekly → show as-is
//     const newPeriods = t.months.map(m => m.name);
//     const newMonths: MonthGroup[] = t.months.map((m,mi) => ({name:m.name,cols:[mi]}));
//     const newRows: SpreadsheetRow[] = t.rows.map(row => ({
//         ...row,
//         values: t.months.map(m => {
//             const sum = m.cols.reduce((a,ci) => a+(row.values[ci]??0), 0);
//             return sum===0 && m.cols.every(ci=>row.values[ci]===null) ? null : sum;
//         }),
//     }));
//     // Recalc expenses & balance
//     const expIdx=newRows.findIndex(r=>r.rowType==='expenses');
//     const balIdx=newRows.findIndex(r=>r.rowType==='balance');
//     const salIdx=newRows.findIndex(r=>r.rowType==='salary');
//     if(expIdx>=0){const er=newRows.filter(r=>r.rowType==='expense');newRows[expIdx]={...newRows[expIdx],values:newRows[expIdx].values.map((_,ci)=>er.reduce((s,r)=>s+(r.values[ci]??0),0))};}
//     if(balIdx>=0&&salIdx>=0){let run=0;newRows[balIdx]={...newRows[balIdx],values:newRows[balIdx].values.map((_,ci)=>{const s=newRows[salIdx].values[ci]??0;const e=expIdx>=0?newRows[expIdx].values[ci]??0:0;run=run+s-e;return run;})};}
//     return{...t,periods:newPeriods,months:newMonths,rows:newRows};
// }
//
// // ── Period filter pills ───────────────────────────────────────────────────────
// const PeriodPills:React.FC<{active:PeriodFilter;onChange:(p:PeriodFilter)=>void}> = ({active,onChange}) => (
//     <Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:2}}>
//         {(['Weekly','Biweekly','Monthly'] as PeriodFilter[]).map(p=>(
//             <Box key={p} onClick={()=>onChange(p)} sx={{
//                 px:1.5,py:0.45,borderRadius:'20px',cursor:'pointer',
//                 fontSize:'0.74rem',fontWeight:700,transition:'all 0.15s',
//                 border:`1.5px solid ${active===p?MAROON:alpha('#000',0.1)}`,
//                 bgcolor:active===p?MAROON:'#fff',
//                 color:active===p?'#fff':SLATE,
//                 '&:hover':{borderColor:MAROON,color:active===p?'#fff':MAROON},
//                 userSelect:'none',
//             }}>{p}</Box>
//         ))}
//     </Box>
// );
//
// // ── Table helpers ─────────────────────────────────────────────────────────────
// const thSx=(extra?:object)=>({fontWeight:700,fontSize:'0.72rem',textTransform:'uppercase' as const,letterSpacing:'0.07em',color:MAROON,py:1.25,whiteSpace:'nowrap',bgcolor:alpha(MAROON,0.04),borderBottom:`2px solid ${alpha(MAROON,0.18)}`,...extra});
// const tdSx=(extra?:object)=>({fontSize:'0.8rem',py:0.9,whiteSpace:'nowrap',...extra});
//
// const Badge:React.FC<{val:number;ok:boolean}> = ({val,ok}) => (
//     <Box sx={{display:'inline-flex',alignItems:'center',gap:0.3,px:0.75,py:0.2,borderRadius:'4px',bgcolor:ok?alpha(GREEN,0.1):alpha(RED,0.1),fontSize:'0.68rem',fontWeight:700,color:ok?GREEN:RED}}>
//         {ok?<ArrowDownRight size={11}/>:<ArrowUpRight size={11}/>}{Math.abs(val).toFixed(1)}%
//     </Box>
// );
//
// const EditCell:React.FC<{value:number|null;onChange:(v:number|null)=>void}> = ({value,onChange}) => {
//     const [active,setActive]=useState(false);
//     const [local,setLocal]=useState('');
//     const inputRef=useRef<HTMLInputElement>(null);
//     const activate=()=>{setLocal(value===null?'':String(value));setActive(true);setTimeout(()=>{if(inputRef.current){inputRef.current.focus();inputRef.current.setSelectionRange(inputRef.current.value.length,inputRef.current.value.length);}},0);};
//     const commit=()=>{const n=parseFloat(local);onChange(local===''?null:isNaN(n)?null:n);setActive(false);};
//     if(!active)return<Box onClick={activate} sx={{cursor:'cell',textAlign:'right',px:0.5,borderRadius:'3px',minWidth:70,'&:hover':{bgcolor:alpha(MAROON,0.06)}}}>{value!==null?`$${fmt(value)}`:''}</Box>;
//     return<Box component="input" ref={inputRef} value={local} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setLocal(e.target.value)} onBlur={commit} onKeyDown={(e:React.KeyboardEvent)=>{if(e.key==='Enter'||e.key==='Tab')commit();if(e.key==='Escape')setActive(false);}} sx={{width:'100%',minWidth:70,border:`1.5px solid ${MAROON}`,borderRadius:'3px',px:0.75,py:0.25,fontSize:'0.78rem',textAlign:'right',bgcolor:'#fff',outline:'none',fontFamily:'inherit'}}/>;
// };
//
// // ── Classic Spreadsheet — fixed sticky overlap ────────────────────────────────
// const ClassicSpreadsheet:React.FC<{
//     template:SpreadsheetTemplate;editMode:boolean;
//     onCellChange:(ri:number,ci:number,v:number|null)=>void;
//     periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
// }> = ({template,editMode,onCellChange,periodFilter,onPeriodFilter}) => {
//     const t = useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
//     const {months,periods,rows}=t;
//     const isMonthStart=(ci:number)=>months.some(m=>m.cols[0]===ci);
//
//     const getValColor=(row:SpreadsheetRow,val:number|null,ci:number):string=>{
//         if(val===null)return'transparent';
//         if(row.rowType==='balance')return val>=0?GREEN:RED;
//         if(row.rowType==='expenses'){const sal=rows.find(r=>r.label==='Salary')?.values[ci];return sal&&val>sal?RED:NAVY;}
//         return NAVY;
//     };
//
//     // SOLID bg colours — critical for sticky to paint over scrolled cells
//     const solidBg=(rt:SpreadsheetRow['rowType'],ri:number):string=>{
//         if(rt==='salary')return '#fdf4f4';
//         if(rt==='balance')return '#edfaf8';
//         if(rt==='expenses')return '#f8f8f8';
//         return ri%2===0?'#ffffff':'#f7f8f9';
//     };
//
//     return (
//         <Box>
//             <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
//             {/* borderCollapse:separate is required so sticky cells paint cleanly */}
//             <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1.5px solid ${alpha(MAROON,0.18)}`,boxShadow:`0 4px 16px ${alpha(MAROON,0.08)}`}}>
//                 <TableContainer sx={{overflowX:'auto'}}>
//                     <Table size="small" sx={{
//                         minWidth:'max-content',
//                         borderCollapse:'separate',
//                         borderSpacing:0,
//                         '& .MuiTableCell-root':{border:'none'},
//                     }}>
//                         <TableHead>
//                             {/* Month row */}
//                             <TableRow>
//                                 <TableCell rowSpan={2} sx={{
//                                     position:'sticky',left:0,zIndex:6,
//                                     minWidth:165,
//                                     // Solid gradient bg — no alpha
//                                     background:'#f3ecec',
//                                     borderRight:`2px solid ${alpha(MAROON,0.3)}`,
//                                     borderBottom:`2px solid ${alpha(MAROON,0.18)}`,
//                                     boxShadow:`3px 0 10px -2px rgba(0,0,0,0.14)`,
//                                     fontWeight:800,fontSize:'0.72rem',
//                                     textTransform:'uppercase',letterSpacing:'0.08em',
//                                     color:MAROON,verticalAlign:'middle',px:2,
//                                 }}>
//                                     Category
//                                 </TableCell>
//                                 {months.map(m=>(
//                                     <TableCell key={m.name} colSpan={m.cols.length} align="center" sx={{
//                                         fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',
//                                         letterSpacing:'0.07em',color:MAROON,py:1,
//                                         bgcolor:alpha(MAROON,0.05),
//                                         borderLeft:`1.5px solid ${alpha(MAROON,0.2)}`,
//                                         borderBottom:`1px solid ${alpha(MAROON,0.1)}`,
//                                     }}>{m.name}</TableCell>
//                                 ))}
//                                 <TableCell align="right" sx={{
//                                     fontWeight:700,fontSize:'0.7rem',textTransform:'uppercase',
//                                     letterSpacing:'0.07em',color:NAVY,py:1,
//                                     bgcolor:alpha(NAVY,0.05),
//                                     borderLeft:`2px solid ${alpha(NAVY,0.2)}`,
//                                     borderBottom:`1px solid ${alpha(NAVY,0.1)}`,
//                                     minWidth:90,
//                                 }}>Total</TableCell>
//                             </TableRow>
//                             {/* Period sub-row */}
//                             <TableRow>
//                                 {periods.map((p,i)=>(
//                                     <TableCell key={i} align="center" sx={{
//                                         fontWeight:600,fontSize:'0.69rem',color:SLATE,
//                                         py:0.875,minWidth:90,
//                                         bgcolor:alpha(MAROON,0.02),
//                                         borderLeft:isMonthStart(i)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.05)}`,
//                                         borderBottom:`2px solid ${alpha(MAROON,0.15)}`,
//                                     }}>{p}</TableCell>
//                                 ))}
//                                 <TableCell sx={{
//                                     bgcolor:alpha(NAVY,0.03),
//                                     borderLeft:`2px solid ${alpha(NAVY,0.15)}`,
//                                     borderBottom:`2px solid ${alpha(MAROON,0.15)}`,
//                                 }}/>
//                             </TableRow>
//                         </TableHead>
//
//                         <TableBody>
//                             {rows.map((row,ri)=>{
//                                 const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);
//                                 const isSection=row.rowType==='salary';
//                                 const isSummary=row.rowType==='expenses'||row.rowType==='balance';
//                                 const bg=solidBg(row.rowType,ri);
//                                 const canEdit=editMode&&row.rowType!=='balance'&&row.rowType!=='expenses';
//
//                                 return (
//                                     <TableRow key={row.label}>
//                                         {/* STICKY label cell — solid bg, high z-index, strong shadow */}
//                                         <TableCell sx={{
//                                             position:'sticky',left:0,zIndex:4,
//                                             bgcolor:bg,
//                                             borderRight:`2px solid ${alpha(MAROON,0.22)}`,
//                                             borderTop:isSection?`2px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
//                                             // Drop shadow facing right so data cells scroll under it
//                                             boxShadow:`4px 0 10px -3px rgba(0,0,0,0.15)`,
//                                             fontWeight:isSection?700:isSummary?600:400,
//                                             color:row.rowType==='salary'?MAROON:row.rowType==='balance'?'#0f766e':NAVY,
//                                             whiteSpace:'nowrap',fontSize:'0.8rem',px:2,
//                                         }}>
//                                             <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
//                                                 {row.rowType==='expense'&&CATEGORY_GROUPS[row.label]&&(
//                                                     <Box sx={{width:3,height:14,borderRadius:'2px',bgcolor:CAT_COLORS[CATEGORY_GROUPS[row.label]]??SLATE,flexShrink:0}}/>
//                                                 )}
//                                                 {row.label}
//                                             </Box>
//                                         </TableCell>
//
//                                         {/* Data cells — zIndex:1 so sticky label always paints on top */}
//                                         {row.values.map((val,ci)=>(
//                                             <TableCell key={ci} align="right" sx={{
//                                                 zIndex:1,
//                                                 color:getValColor(row,val,ci),
//                                                 bgcolor:canEdit?alpha(MAROON,0.015):bg,
//                                                 fontWeight:isSummary||isSection?600:400,
//                                                 fontSize:isSummary?'0.82rem':'0.8rem',
//                                                 borderLeft:isMonthStart(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
//                                                 borderTop:isSection?`2px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
//                                                 p:canEdit?0.25:undefined,
//                                                 fontVariantNumeric:'tabular-nums',
//                                             }}>
//                                                 {canEdit
//                                                     ?<EditCell value={val} onChange={v=>onCellChange(ri,ci,v)}/>
//                                                     :val!==null?`$${fmt(val)}`:''
//                                                 }
//                                             </TableCell>
//                                         ))}
//
//                                         {/* Row total */}
//                                         <TableCell align="right" sx={{
//                                             zIndex:1,
//                                             fontWeight:700,
//                                             fontSize:isSummary?'0.82rem':'0.8rem',
//                                             color:row.rowType==='balance'?(rowTotal>=0?GREEN:RED):NAVY,
//                                             bgcolor:bg,
//                                             borderLeft:`2px solid ${alpha(NAVY,0.15)}`,
//                                             borderTop:isSection?`2px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,
//                                             fontVariantNumeric:'tabular-nums',
//                                         }}>
//                                             {rowTotal!==0||row.values.some(v=>v!==null)?`$${fmt(rowTotal)}`:''}
//                                         </TableCell>
//                                     </TableRow>
//                                 );
//                             })}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Monthly Budget View ───────────────────────────────────────────────────────
// const MonthlyBudgetView:React.FC<{
//     template:SpreadsheetTemplate;editMode:boolean;
//     onCellChange:(ri:number,ci:number,v:number|null)=>void;
//     periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
// }> = ({template,editMode,onCellChange,periodFilter,onPeriodFilter}) => {
//     const filtered=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
//     const [expandedPeriods,setExpandedPeriods]=useState<Set<number>>(new Set([0]));
//     const [expandView,setExpandView]=useState<Record<number,'table'|'chart'>>({});
//     const groupTotals=deriveGroupTotals(filtered);
//     const periods=derivePeriodSummary(filtered);
//     const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
//     const togglePeriod=(i:number)=>setExpandedPeriods(prev=>{const s=new Set(prev);s.has(i)?s.delete(i):s.add(i);return s;});
//     const toggleView=(i:number,v:'table'|'chart')=>setExpandView(prev=>({...prev,[i]:v}));
//     const TTBox=({active,payload}:any)=>{if(!active||!payload?.length)return null;return<Box sx={{p:1.5,bgcolor:'#fff',borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>{payload.map((p:any,i:number)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:1,mb:0.5}}><Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:p.fill||p.stroke}}/><Typography sx={{fontSize:'0.75rem',color:NAVY}}>{p.name}: <strong>${fmtS(p.value)}</strong></Typography></Box>)}</Box>;};
//
//     return (
//         <Box>
//             <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
//             <Box sx={{borderRadius:'12px',border:`1px solid ${alpha('#000',0.08)}`,overflow:'hidden'}}>
//                 <Table sx={{minWidth:650}}>
//                     <TableHead>
//                         <TableRow sx={{bgcolor:alpha(MAROON,0.04)}}>
//                             {['Period','Category','Planned','Actual','Spend %','Save %','Savings'].map((h,i)=>(
//                                 <TableCell key={h} align={i>=2?'right':'left'} sx={{fontWeight:800,color:MAROON,fontSize:'0.78rem',textTransform:'uppercase',letterSpacing:'0.06em',py:1.75,px:2,whiteSpace:'nowrap'}}>{h}</TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>
//                 </Table>
//                 {periods.map((p,i)=>{
//                     const isExp=expandedPeriods.has(i),isOver=p.expenses>p.income,ev=expandView[i]??'table',wSavings=p.income-p.expenses;
//                     const expRows=filtered.rows.filter(r=>r.rowType==='expense');
//                     return(
//                         <Box key={i} sx={{borderTop:`2px solid ${alpha(MAROON,0.1)}`}}>
//                             <Table sx={{minWidth:650}}><TableBody>
//                                 <TableRow onClick={()=>togglePeriod(i)} sx={{cursor:'pointer',bgcolor:alpha(MAROON,0.02),'&:hover':{bgcolor:alpha(MAROON,0.05)}}}>
//                                     <TableCell sx={{py:1.75,px:2,width:'22%'}}>
//                                         <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
//                                             <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:MAROON,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.8rem'}}>{isExp?'▲':'▼'}</Box>
//                                             <Typography sx={{fontWeight:800,color:MAROON,fontSize:'0.82rem'}}>{p.period}</Typography>
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell sx={{py:1.75,px:2}}><Typography sx={{fontSize:'0.75rem',color:SLATE,fontStyle:'italic'}}>{isExp?'Click to collapse':'Expand to see details'}</Typography></TableCell>
//                                     <TableCell align="right" sx={{fontWeight:800,fontSize:'0.88rem',py:1.75,px:2,color:NAVY}}>${fmtS(p.income)}</TableCell>
//                                     <TableCell align="right" sx={{fontWeight:800,fontSize:'0.88rem',py:1.75,px:2,color:isOver?RED:NAVY}}>${fmtS(p.expenses)}</TableCell>
//                                     <TableCell align="right" sx={{py:1.75,px:2}}><Box sx={{px:1,py:0.35,borderRadius:'20px',bgcolor:alpha(SLATE,0.08),display:'inline-block'}}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY}}>{p.spendPct.toFixed(1)}%</Typography></Box></TableCell>
//                                     <TableCell align="right" sx={{py:1.75,px:2}}><Box sx={{px:1,py:0.35,borderRadius:'20px',bgcolor:alpha(p.savingsPct>=0?GREEN:RED,0.1),display:'inline-block'}}><Typography sx={{fontSize:'0.78rem',fontWeight:800,color:p.savingsPct>=0?GREEN:RED}}>{p.savingsPct>=0?'+':''}{p.savingsPct.toFixed(1)}%</Typography></Box></TableCell>
//                                     <TableCell align="right" sx={{fontWeight:800,fontSize:'0.82rem',color:wSavings>=0?GREEN:RED,py:1.75,px:2}}>${fmtS(Math.abs(wSavings))} {wSavings>=0?'under':'over'}</TableCell>
//                                 </TableRow>
//                             </TableBody></Table>
//                             {isExp&&(
//                                 <Box sx={{bgcolor:alpha(MAROON,0.01)}}>
//                                     <Box sx={{display:'flex',alignItems:'center',justifyContent:'flex-end',px:2,py:1,borderBottom:`1px solid ${alpha('#000',0.06)}`,bgcolor:'#fff',gap:1}}>
//                                         <Typography sx={{fontSize:'0.68rem',color:SLATE,mr:0.5}}>View as:</Typography>
//                                         {(['table','chart'] as const).map(v=><Box key={v} onClick={()=>toggleView(i,v)} sx={{px:1.5,py:0.4,borderRadius:'7px',cursor:'pointer',fontSize:'0.72rem',fontWeight:700,border:`1px solid ${ev===v?MAROON:alpha('#000',0.1)}`,bgcolor:ev===v?alpha(MAROON,0.08):'#fff',color:ev===v?MAROON:SLATE,transition:'all 0.15s','&:hover':{borderColor:MAROON,color:MAROON}}}>{v.charAt(0).toUpperCase()+v.slice(1)}</Box>)}
//                                     </Box>
//                                     {ev==='table'&&(
//                                         <Table><TableBody>
//                                             {GROUP_ORDER.map(grp=>{const val=groupTotals[grp][i],catPlan=Math.round(p.income*catPcts[grp]),over=val>catPlan;return(
//                                                 <TableRow key={grp} sx={{'&:hover':{bgcolor:alpha(CAT_COLORS[grp],0.04)},borderLeft:`3px solid ${over?RED:CAT_COLORS[grp]}`}}>
//                                                     <TableCell sx={{py:1.75,px:2,width:'22%'}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:10,height:10,borderRadius:'50%',bgcolor:CAT_COLORS[grp],flexShrink:0}}/><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{grp}</Typography>{over&&<Box sx={{px:0.6,py:0.1,borderRadius:'4px',bgcolor:alpha(RED,0.1)}}><Typography sx={{fontSize:'0.6rem',fontWeight:800,color:RED}}>OVER</Typography></Box>}</Box></TableCell>
//                                                     <TableCell sx={{py:1.75,px:2}}/>
//                                                     <TableCell align="right" sx={{fontSize:'0.82rem',py:1.75,px:2,color:SLATE,fontVariantNumeric:'tabular-nums'}}>${fmtS(catPlan)}</TableCell>
//                                                     <TableCell align="right" sx={{fontSize:'0.82rem',py:1.75,px:2,color:over?RED:NAVY,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{val>0?`$${fmtS(val)}`:'—'}</TableCell>
//                                                     <TableCell align="right" sx={{fontSize:'0.82rem',py:1.75,px:2,color:SLATE}}>{catPlan>0&&val>0?(val/catPlan*100).toFixed(1)+'%':'—'}</TableCell>
//                                                     <TableCell colSpan={2}/>
//                                                 </TableRow>
//                                             );})}
//                                             {editMode&&expRows.map(row=>{const val=row.values[i];return(<TableRow key={row.label} sx={{bgcolor:'#fafafa'}}><TableCell sx={{py:1,px:2,pl:5,color:SLATE,fontSize:'0.75rem'}}>{row.label}</TableCell><TableCell colSpan={6} sx={{py:0.5,px:2}}><EditCell value={val} onChange={v=>onCellChange(filtered.rows.findIndex(r=>r.label===row.label),i,v)}/></TableCell></TableRow>);})}
//                                             <TableRow sx={{bgcolor:alpha(TEAL,0.03),borderTop:`1px solid ${alpha(TEAL,0.12)}`}}>
//                                                 <TableCell sx={{py:1.5,px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Wallet size={14} color={TEAL}/><Typography sx={{fontWeight:800,color:TEAL,fontSize:'0.78rem'}}>Account Balance</Typography></Box></TableCell>
//                                                 <TableCell colSpan={6} align="right" sx={{fontWeight:800,fontSize:'0.9rem',color:p.balance>=0?TEAL:RED,py:1.5,px:2,fontVariantNumeric:'tabular-nums'}}>${fmtS(p.balance)}</TableCell>
//                                             </TableRow>
//                                         </TableBody></Table>
//                                     )}
//                                     {ev==='chart'&&(
//                                         <Box sx={{p:3}}><Grid container spacing={3}>
//                                             <Grid item xs={12} md={5}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY,mb:1.5}}>Spending by Category</Typography><Box sx={{height:220}}><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={GROUP_ORDER.map(g=>({name:g,value:groupTotals[g][i]})).filter(d=>d.value>0)} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>{GROUP_ORDER.filter(g=>groupTotals[g][i]>0).map((g,idx)=><Cell key={idx} fill={CAT_COLORS[g]??CHART_COLORS[idx]}/>)}</Pie><RTooltip content={<TTBox/>}/></RePieChart></ResponsiveContainer></Box></Grid>
//                                             <Grid item xs={12} md={7}><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY,mb:1.5}}>Category Breakdown vs Budget</Typography><Box sx={{height:220}}><ResponsiveContainer width="100%" height="100%"><BarChart data={GROUP_ORDER.map(g=>({name:g,Budget:Math.round(p.income*catPcts[g]),Actual:groupTotals[g][i]}))}><CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)}/><XAxis dataKey="name" tick={{fontSize:9,fill:SLATE}}/><YAxis tick={{fontSize:9,fill:SLATE}} tickFormatter={v=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} width={40}/><RTooltip content={<TTBox/>}/><Bar dataKey="Budget" fill={alpha(TEAL,0.6)} radius={[2,2,0,0]}/><Bar dataKey="Actual" fill={MAROON} radius={[2,2,0,0]}/><Legend formatter={v=><span style={{fontSize:10,color:SLATE,fontWeight:600}}>{v}</span>}/></BarChart></ResponsiveContainer></Box></Grid>
//                                         </Grid></Box>
//                                     )}
//                                 </Box>
//                             )}
//                         </Box>
//                     );
//                 })}
//             </Box>
//         </Box>
//     );
// };
//
// // ── Rolling Category View ─────────────────────────────────────────────────────
// type RollingViewBy='category'|'period';
// const RollingCategoryView:React.FC<{
//     template:SpreadsheetTemplate;defaultViewBy?:RollingViewBy;
//     periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void;
// }> = ({template,defaultViewBy='category',periodFilter,onPeriodFilter}) => {
//     const [viewBy,setViewBy]=useState<RollingViewBy>(defaultViewBy);
//     const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
//     const [expandedCats,setExpandedCats]=useState<Set<string>>(new Set());
//     const [expandedPeriods,setExpandedPeriods]=useState<Set<number>>(new Set());
//     const groupTotals=deriveGroupTotals(t);
//     const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
//     const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
//     const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
//     const toggleCat=(c:string)=>setExpandedCats(prev=>{const s=new Set(prev);s.has(c)?s.delete(c):s.add(c);return s;});
//     const togglePer=(i:number)=>setExpandedPeriods(prev=>{const s=new Set(prev);s.has(i)?s.delete(i):s.add(i);return s;});
//     const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);
//     const CatBadge=({grp}:{grp:string})=><Box sx={{width:22,height:22,borderRadius:'5px',bgcolor:CAT_COLORS[grp],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.85)'}}/></Box>;
//
//     // Shared sticky label sx — solid bg, strong right shadow, zIndex above data cells
//     const stickyLabelSx=(bg:string,extraBorder?:string):object=>({
//         position:'sticky',left:0,zIndex:4,
//         bgcolor:bg,
//         borderRight:`2px solid ${alpha(MAROON,0.15)}`,
//         boxShadow:`4px 0 10px -3px rgba(0,0,0,0.13)`,
//         borderTop:extraBorder??`1px solid ${alpha('#000',0.04)}`,
//     });
//
//     return (
//         <Box>
//             <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
//             <Box sx={{display:'flex',alignItems:'center',gap:1,mb:2.5}}>
//                 <Typography sx={{fontSize:'0.78rem',color:SLATE,fontWeight:600}}>View by:</Typography>
//                 {(['period','category'] as RollingViewBy[]).map(v=>(
//                     <Box key={v} onClick={()=>setViewBy(v)} sx={{px:1.75,py:0.6,borderRadius:'8px',cursor:'pointer',border:`1.5px solid ${viewBy===v?NAVY:alpha('#000',0.1)}`,bgcolor:viewBy===v?'#fff':'transparent',color:viewBy===v?NAVY:SLATE,fontSize:'0.78rem',fontWeight:700,transition:'all 0.15s','&:hover':{borderColor:NAVY,color:NAVY},boxShadow:viewBy===v?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
//                         {v.charAt(0).toUpperCase()+v.slice(1)}
//                     </Box>
//                 ))}
//             </Box>
//
//             <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha('#000',0.08)}`}}>
//                 <TableContainer sx={{overflowX:'auto'}}>
//                     <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
//
//                         {viewBy==='category'&&(<>
//                             <TableHead><TableRow>
//                                 <TableCell sx={{...thSx(),position:'sticky',left:0,zIndex:6,minWidth:165,bgcolor:'#f3ecec',borderRight:`2px solid ${alpha(MAROON,0.25)}`,boxShadow:`4px 0 10px -3px rgba(0,0,0,0.14)`,verticalAlign:'middle',px:2}}>Category</TableCell>
//                                 {t.periods.map((p,i)=><TableCell key={i} align="right" sx={{...thSx({minWidth:72,fontWeight:600,color:SLATE,bgcolor:alpha(MAROON,0.02),borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`})}}>{p}</TableCell>)}
//                                 <TableCell align="right" sx={{...thSx({borderLeft:`2px solid ${alpha(NAVY,0.15)}`,color:NAVY,bgcolor:alpha(NAVY,0.04),minWidth:80})}}>Total</TableCell>
//                             </TableRow></TableHead>
//                             <TableBody>
//                                 {GROUP_ORDER.map(grp=>{
//                                     const vals=groupTotals[grp],total=vals.reduce((a,v)=>a+v,0),isExp=expandedCats.has(grp),color=CAT_COLORS[grp];
//                                     const subRows=t.rows.filter(r=>r.rowType==='expense'&&(CATEGORY_GROUPS[r.label]??'Other')===grp);
//                                     return(<React.Fragment key={grp}>
//                                         <TableRow hover onClick={()=>toggleCat(grp)} sx={{cursor:'pointer',bgcolor:isExp?alpha(color,0.04):'#fff'}}>
//                                             <TableCell sx={{...stickyLabelSx(isExp?alpha(color,0.04):'#fff'),px:2}}>
//                                                 <Box sx={{display:'flex',alignItems:'center',gap:1}}><CatBadge grp={grp}/><Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:color,flexShrink:0}}/><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{grp}</Typography></Box>
//                                             </TableCell>
//                                             {vals.map((v,i)=>{const planned=Math.round((sal[i]??0)*catPcts[grp]),over=v>planned&&planned>0;return<TableCell key={i} align="right" sx={{...tdSx({color:over?RED:v>0?NAVY:alpha('#000',0.2),fontWeight:over?700:400,zIndex:1,bgcolor:isExp?alpha(color,0.04):'#fff',borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{v>0?`$${fmtS(v)}`:'—'}</TableCell>;})}
//                                             <TableCell align="right" sx={{...tdSx({fontWeight:700,color:NAVY,zIndex:1,bgcolor:isExp?alpha(color,0.04):'#fff',borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>${fmtS(total)}</TableCell>
//                                         </TableRow>
//                                         {isExp&&subRows.map(row=>{const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);return(
//                                             <TableRow key={row.label} sx={{bgcolor:'#fafafa'}}>
//                                                 <TableCell sx={{...stickyLabelSx('#fafafa'),pl:5,color:SLATE,fontSize:'0.75rem',px:2}}>{row.label}</TableCell>
//                                                 {row.values.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({color:v!==null?NAVY:alpha('#000',0.15),fontSize:'0.75rem',zIndex:1,bgcolor:'#fafafa',borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
//                                                 <TableCell align="right" sx={{...tdSx({fontWeight:600,color:NAVY,fontSize:'0.75rem',zIndex:1,bgcolor:'#fafafa',borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1px solid ${alpha('#000',0.04)}`})}}>{rowTotal>0?`$${fmtS(rowTotal)}`:''}</TableCell>
//                                             </TableRow>
//                                         );})}
//                                     </React.Fragment>);
//                                 })}
//                                 <TableRow sx={{'& .MuiTableCell-root':{borderTop:`2px solid ${alpha(NAVY,0.12)}`}}}>
//                                     <TableCell sx={{...stickyLabelSx('#fff',`2px solid ${alpha(NAVY,0.12)}`),fontWeight:600,color:NAVY,px:2}}>Income (salary)</TableCell>
//                                     {sal.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({fontWeight:500,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
//                                     <TableCell align="right" sx={{...tdSx({fontWeight:700,color:NAVY,zIndex:1,bgcolor:'#fff',borderLeft:`2px solid ${alpha(NAVY,0.15)}`})}}>${fmtS(sal.reduce((a:number,v)=>a+(v??0),0))}</TableCell>
//                                 </TableRow>
//                                 <TableRow sx={{bgcolor:alpha(TEAL,0.05)}}>
//                                     <TableCell sx={{...stickyLabelSx(alpha(TEAL,0.05)),fontWeight:700,color:'#0f766e',px:2}}>Balance</TableCell>
//                                     {bal.map((v,i)=><TableCell key={i} align="right" sx={{...tdSx({fontWeight:600,color:v!==null&&v>=0?'#0f766e':RED,zIndex:1,bgcolor:alpha(TEAL,0.05),borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.25)}`:`1px solid ${alpha('#000',0.05)}`})}}>{v!==null?`$${fmtS(v)}`:'—'}</TableCell>)}
//                                     <TableCell sx={{zIndex:1,bgcolor:alpha(TEAL,0.05),borderLeft:`2px solid ${alpha(NAVY,0.15)}`}}/>
//                                 </TableRow>
//                             </TableBody>
//                         </>)}
//
//                         {viewBy==='period'&&(<>
//                             <TableHead><TableRow>
//                                 <TableCell sx={{...thSx(),position:'sticky',left:0,zIndex:6,minWidth:150,bgcolor:'#f3ecec',borderRight:`2px solid ${alpha(MAROON,0.25)}`,boxShadow:`4px 0 10px -3px rgba(0,0,0,0.14)`,px:2}}>Period</TableCell>
//                                 {['Income','Actual','Spend %','Save %','Savings','Balance'].map(h=><TableCell key={h} align="right" sx={{...thSx({minWidth:88})}}>{h}</TableCell>)}
//                             </TableRow></TableHead>
//                             <TableBody>
//                                 {t.periods.map((period,i)=>{
//                                     const income=sal[i]??0,expRow=t.rows.find(r=>r.rowType==='expenses'),expenses=expRow?.values[i]??0,balance=bal[i]??0,savings=income-expenses,savingsPct=income>0?(savings/income)*100:0,spendPct=income>0?(expenses/income)*100:0,isOver=expenses>income,isExp=expandedPeriods.has(i);
//                                     return(<React.Fragment key={i}>
//                                         <TableRow hover onClick={()=>togglePer(i)} sx={{cursor:'pointer',bgcolor:isExp?alpha(MAROON,0.03):'#fff'}}>
//                                             <TableCell sx={{...stickyLabelSx(isExp?alpha(MAROON,0.03):'#fff'),px:2}}>
//                                                 <Box sx={{display:'flex',alignItems:'center',gap:1}}><Box sx={{width:20,height:20,borderRadius:'4px',bgcolor:MAROON,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',flexShrink:0}}>{isExp?'▲':'▼'}</Box><Typography sx={{fontSize:'0.82rem',fontWeight:600,color:NAVY}}>{period}</Typography></Box>
//                                             </TableCell>
//                                             <TableCell align="right" sx={tdSx({color:NAVY,fontWeight:500,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{income>0?`$${fmtS(income)}`:'—'}</TableCell>
//                                             <TableCell align="right" sx={tdSx({color:isOver?RED:NAVY,fontWeight:isOver?700:500,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{expenses>0?`$${fmtS(expenses)}`:'—'}</TableCell>
//                                             <TableCell align="right" sx={tdSx({color:SLATE,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{income>0?`${spendPct.toFixed(1)}%`:'—'}</TableCell>
//                                             <TableCell align="right" sx={{zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`}}><Badge val={savingsPct} ok={savingsPct>=0}/></TableCell>
//                                             <TableCell align="right" sx={tdSx({color:savings>=0?GREEN:RED,fontWeight:600,fontSize:'0.75rem',zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{income>0?(savings>=0?`$${fmtS(savings)} under`:`$${fmtS(-savings)} over`):'—'}</TableCell>
//                                             <TableCell align="right" sx={tdSx({color:balance>=0?'#0f766e':RED,fontWeight:700,zIndex:1,bgcolor:isExp?alpha(MAROON,0.03):'#fff',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{balance!==0?`$${fmtS(balance)}`:'—'}</TableCell>
//                                         </TableRow>
//                                         {isExp&&GROUP_ORDER.map(grp=>{const val=groupTotals[grp][i],catPlan=Math.round(income*catPcts[grp]),over=val>catPlan;return(
//                                             <TableRow key={grp} sx={{bgcolor:'#fafafa'}}>
//                                                 <TableCell sx={{...stickyLabelSx('#fafafa'),pl:5,px:2}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:8,height:8,borderRadius:'2px',bgcolor:CAT_COLORS[grp],flexShrink:0}}/><Typography sx={{fontSize:'0.75rem',color:SLATE}}>{grp}</Typography>{over&&<Box sx={{px:0.5,py:0.1,borderRadius:'3px',bgcolor:alpha(RED,0.1),fontSize:'0.6rem',fontWeight:800,color:RED}}>OVER</Box>}</Box></TableCell>
//                                                 <TableCell colSpan={2} align="right" sx={tdSx({color:SLATE,fontSize:'0.72rem',zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`})}>${fmtS(catPlan)}</TableCell>
//                                                 <TableCell align="right" sx={tdSx({color:over?RED:NAVY,fontWeight:over?600:400,zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{val>0?`$${fmtS(val)}`:'—'}</TableCell>
//                                                 <TableCell align="right" sx={tdSx({color:SLATE,fontSize:'0.72rem',zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`})}>{catPlan>0&&val>0?(val/catPlan*100).toFixed(1)+'%':'—'}</TableCell>
//                                                 <TableCell colSpan={2} sx={{zIndex:1,bgcolor:'#fafafa',borderTop:`1px solid ${alpha('#000',0.04)}`}}/>
//                                             </TableRow>
//                                         );})}
//                                         {isExp&&<TableRow sx={{bgcolor:alpha(TEAL,0.04)}}><TableCell sx={{...stickyLabelSx(alpha(TEAL,0.04)),pl:5,fontWeight:600,color:'#0f766e',fontSize:'0.75rem',px:2}}>Account balance</TableCell><TableCell colSpan={6} align="right" sx={tdSx({fontWeight:700,color:'#0f766e',zIndex:1,bgcolor:alpha(TEAL,0.04)})}>${fmtS(balance)}</TableCell></TableRow>}
//                                     </React.Fragment>);
//                                 })}
//                             </TableBody>
//                         </>)}
//                     </Table>
//                 </TableContainer>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Visual Analytics ──────────────────────────────────────────────────────────
// const VisualView:React.FC<{template:SpreadsheetTemplate}> = ({template}) => {
//     const [tab,setTab]=useState(0);
//     const gt=deriveGroupTotals(template),ps=derivePeriodSummary(template);
//     const ti=template.rows.find(r=>r.label==='Salary')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
//     const te=template.rows.find(r=>r.label==='Expenses')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
//     const fb=template.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null).slice(-1)[0]??0;
//     const sr=ti>0?((ti-te)/ti)*100:0,ai=ti/(template.periods.length||1),ae=te/(template.periods.length||1),bu=ti>0?(te/ti)*100:0,pc=bu>100?RED:bu>85?AMBER:TEAL;
//     const pie=GROUP_ORDER.map(g=>({name:g,value:Object.values(gt[g]).reduce((a,b)=>a+b,0)})).filter(d=>d.value>0);
//     const bar=ps.map(p=>({name:p.period.split('–')[0],Income:Math.round(p.income),Expenses:Math.round(p.expenses)}));
//     const trend=ps.map(p=>({name:p.period.split('–')[0],Balance:Math.round(p.balance)}));
//     const top=template.rows.filter(r=>r.rowType==='expense').map(r=>({name:r.label,total:r.values.reduce((a:number,v)=>a+(v??0),0)})).sort((a,b)=>b.total-a.total).filter(c=>c.total>0).slice(0,6);
//     const tt=top.reduce((a,c)=>a+c.total,0);
//     const over=ps.filter(p=>p.expenses>p.income);
//     const best=ps.reduce((a,b)=>b.savingsPct>a.savingsPct?b:a,ps[0]);
//     const worst=ps.reduce((a,b)=>b.savingsPct<a.savingsPct?b:a,ps[0]);
//     const TTB=({active,payload}:any)=>{if(!active||!payload?.length)return null;return<Box sx={{p:1.5,bgcolor:'#fff',borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>{payload.map((p:any,i:number)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:1,mb:0.5}}><Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:p.fill||p.stroke}}/><Typography sx={{fontSize:'0.75rem',color:NAVY}}>{p.name}: <strong>${fmtS(p.value)}</strong></Typography></Box>)}</Box>;};
//     const kpi=[{l:'Avg Income / Period',v:`$${fmtS(ai)}`,c:NAVY,b:'#f0f4ff'},{l:'Avg Expenses / Period',v:`$${fmtS(ae)}`,c:MAROON,b:'#fff1f2'},{l:'Cumulative Balance',v:`$${fmtS(fb)}`,c:fb>=0?GREEN:RED,b:fb>=0?'#f0fdf4':'#fff1f2'},{l:'Avg Savings Rate',v:`${sr>=0?'+':''}${sr.toFixed(1)}%`,c:sr>=0?GREEN:RED,b:sr>=0?'#f0f9ff':'#fff1f2'}];
//     return(
//         <Box>
//             <Grid container spacing={2} sx={{mb:3}}>{kpi.map(({l,v,c,b})=><Grid item xs={12} sm={6} md={3} key={l}><Box sx={{background:b,borderRadius:'10px',borderTop:`3px solid ${c}`,boxShadow:'0 2px 12px rgba(0,0,0,0.10)',p:2.5,transition:'box-shadow 0.2s','&:hover':{boxShadow:'0 6px 20px rgba(0,0,0,0.14)'}}}><Typography sx={{fontSize:'0.67rem',textTransform:'uppercase',letterSpacing:'0.1em',color:alpha(c,0.7),fontWeight:700,mb:1}}>{l}</Typography><Typography sx={{fontSize:'1.65rem',fontWeight:800,color:c,fontVariantNumeric:'tabular-nums',lineHeight:1,mb:0.5}}>{v}</Typography><LinearProgress variant="determinate" value={100} sx={{my:1,height:4,borderRadius:2,bgcolor:alpha(c,0.15),'& .MuiLinearProgress-bar':{bgcolor:c,borderRadius:2}}}/></Box></Grid>)}</Grid>
//             <Box sx={{mb:3,p:2,borderRadius:'10px',bgcolor:'#fff',border:`1px solid ${alpha('#000',0.07)}`}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.75}}><Typography sx={{fontSize:'0.78rem',fontWeight:600,color:SLATE}}>Budget utilization across all periods</Typography><Typography sx={{fontSize:'0.78rem',fontWeight:800,color:pc}}>{bu.toFixed(1)}%</Typography></Box><LinearProgress variant="determinate" value={Math.min(bu,100)} sx={{height:6,borderRadius:3,bgcolor:alpha(pc,0.15),'& .MuiLinearProgress-bar':{bgcolor:pc,borderRadius:3}}}/></Box>
//             <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}`}}>
//                 <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)`,px:3,py:2,position:'relative',overflow:'hidden'}}><Box sx={{position:'absolute',top:-16,right:-16,width:80,height:80,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)'}}/><Box sx={{display:'flex',alignItems:'center',gap:1.25,position:'relative'}}><Box sx={{width:30,height:30,borderRadius:'8px',bgcolor:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><BarChart2 size={15} color="white"/></Box><Box><Typography sx={{fontWeight:800,fontSize:'0.92rem',color:'#fff'}}>Budget Analytics</Typography><Typography sx={{fontSize:'0.67rem',color:'rgba(255,255,255,0.7)'}}>Deep insights for {template.name}</Typography></Box></Box></Box>
//                 <Box sx={{bgcolor:'#fff',borderBottom:`1px solid ${alpha('#000',0.07)}`}}><Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{'& .MuiTab-root':{minWidth:0,flex:1,fontSize:'0.75rem',fontWeight:700,textTransform:'none',py:1.25,color:SLATE},'& .Mui-selected':{color:MAROON},'& .MuiTabs-indicator':{bgcolor:MAROON}}}><Tab label="Overview"/><Tab label="Spending"/><Tab label="Trends"/><Tab label="Insights"/></Tabs></Box>
//                 <Box sx={{bgcolor:'#fff',p:3}}>
//                     {tab===0&&<Box>{over.length>0&&<Box sx={{p:2,borderRadius:'10px',bgcolor:alpha(RED,0.05),border:`1px solid ${alpha(RED,0.15)}`,mb:2.5}}><Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:1}}><AlertTriangle size={14} color={RED}/><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:RED}}>{over.length} period{over.length>1?'s':''} over budget</Typography></Box>{over.slice(0,3).map(p=><Box key={p.period} sx={{display:'flex',justifyContent:'space-between',mb:0.5}}><Typography sx={{fontSize:'0.72rem',color:SLATE}}>{p.period}</Typography><Typography sx={{fontSize:'0.72rem',fontWeight:700,color:RED}}>+${fmtS(p.expenses-p.income)} over</Typography></Box>)}</Box>}<Grid container spacing={2}>{best&&<Grid item xs={6}><Box sx={{p:1.5,borderRadius:'10px',bgcolor:alpha(GREEN,0.06),border:`1px solid ${alpha(GREEN,0.15)}`}}><Typography sx={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:GREEN,mb:0.4}}>Best Period</Typography><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{best.period}</Typography><Typography sx={{fontSize:'0.75rem',color:GREEN,fontWeight:600}}>+{best.savingsPct.toFixed(1)}% saved</Typography></Box></Grid>}{worst&&<Grid item xs={6}><Box sx={{p:1.5,borderRadius:'10px',bgcolor:alpha(RED,0.06),border:`1px solid ${alpha(RED,0.15)}`}}><Typography sx={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',color:RED,mb:0.4}}>Toughest Period</Typography><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{worst.period}</Typography><Typography sx={{fontSize:'0.75rem',color:RED,fontWeight:600}}>{worst.savingsPct.toFixed(1)}% saved</Typography></Box></Grid>}</Grid></Box>}
//                     {tab===1&&<Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:2}}>Spending by category group</Typography><Box sx={{height:220,mb:3}}><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={pie} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} labelLine={false} label={({percent})=>`${(percent*100).toFixed(0)}%`}>{pie.map((d,i)=><Cell key={i} fill={CAT_COLORS[d.name]??CHART_COLORS[i]}/>)}</Pie><RTooltip content={<TTB/>}/></RePieChart></ResponsiveContainer></Box>{pie.map((d,i)=>{const ta=pie.reduce((a,x)=>a+x.value,0),p2=ta>0?d.value/ta*100:0,col=CAT_COLORS[d.name]??CHART_COLORS[i];return<Box key={d.name} sx={{mb:1.5}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.5}}><Box sx={{display:'flex',alignItems:'center',gap:0.75}}><Box sx={{width:8,height:8,borderRadius:'2px',bgcolor:col}}/><Typography sx={{fontSize:'0.78rem',color:NAVY}}>{d.name}</Typography></Box><Typography sx={{fontSize:'0.78rem',fontWeight:700,color:NAVY}}>${fmtS(d.value)}</Typography></Box><Box sx={{height:4,borderRadius:2,bgcolor:alpha(col,0.15)}}><Box sx={{height:'100%',borderRadius:2,bgcolor:col,width:`${p2}%`}}/></Box></Box>;})} <Divider sx={{my:2.5}}/><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Top individual expenses</Typography>{top.map((c,i)=>{const p2=tt>0?c.total/tt*100:0;return<Box key={c.name} sx={{display:'flex',alignItems:'center',gap:1.5,mb:1.25}}><Typography sx={{fontSize:'0.72rem',color:SLATE,minWidth:16,textAlign:'right'}}>{i+1}</Typography><Box sx={{flex:1}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.4}}><Typography sx={{fontSize:'0.75rem',color:NAVY,fontWeight:600}}>{c.name}</Typography><Typography sx={{fontSize:'0.75rem',fontWeight:700,color:NAVY}}>${fmtS(c.total)}</Typography></Box><LinearProgress variant="determinate" value={p2} sx={{height:3,borderRadius:2,bgcolor:alpha(MAROON,0.12),'& .MuiLinearProgress-bar':{bgcolor:MAROON,borderRadius:2}}}/></Box></Box>;})}</Box>}
//                     {tab===2&&<Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Income vs Expenses by period</Typography><Box sx={{height:200,mb:3}}><ResponsiveContainer width="100%" height="100%"><BarChart data={bar} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)}/><XAxis dataKey="name" tick={{fontSize:9,fill:SLATE}} interval={Math.floor(bar.length/6)}/><YAxis tick={{fontSize:9,fill:SLATE}} tickFormatter={v=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} width={40}/><RTooltip content={<TTB/>}/><Bar dataKey="Income" fill={alpha(TEAL,0.7)} radius={[2,2,0,0]}/><Bar dataKey="Expenses" fill={MAROON} radius={[2,2,0,0]}/><Legend formatter={v=><span style={{fontSize:10,color:SLATE,fontWeight:600}}>{v}</span>}/></BarChart></ResponsiveContainer></Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Running balance trend</Typography><Box sx={{height:180}}><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.06)}/><XAxis dataKey="name" tick={{fontSize:9,fill:SLATE}} interval={Math.floor(trend.length/6)}/><YAxis tick={{fontSize:9,fill:SLATE}} tickFormatter={v=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} width={40}/><RTooltip content={<TTB/>}/><ReferenceLine y={0} stroke={RED} strokeDasharray="4 2" strokeWidth={1}/><Line type="monotone" dataKey="Balance" stroke={TEAL} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></Box></Box>}
//                     {tab===3&&<Box><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY,mb:1.5}}>Period-by-period summary</Typography>{ps.map((p,i)=><Box key={i} sx={{mb:1.5,p:1.75,borderRadius:'10px',bgcolor:'#fff',border:`1px solid ${alpha('#000',0.07)}`}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:NAVY}}>{p.period}</Typography><Badge val={p.savingsPct} ok={p.savingsPct>=0}/></Box><Box sx={{display:'flex',gap:1.5}}>{[{l:'Income',v:`$${fmtS(p.income)}`,c:NAVY},{l:'Spent',v:`$${fmtS(p.expenses)}`,c:p.expenses>p.income?RED:MAROON},{l:'Saved',v:`$${fmtS(Math.max(0,p.savings))}`,c:GREEN}].map(({l,v,c})=><Box key={l} sx={{flex:1}}><Typography sx={{fontSize:'0.62rem',color:SLATE,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>{l}</Typography><Typography sx={{fontSize:'0.82rem',fontWeight:700,color:c,fontVariantNumeric:'tabular-nums'}}>{v}</Typography></Box>)}</Box><LinearProgress variant="determinate" value={Math.min(p.spendPct,100)} sx={{mt:1,height:3,borderRadius:2,bgcolor:alpha(p.expenses>p.income?RED:TEAL,0.15),'& .MuiLinearProgress-bar':{bgcolor:p.expenses>p.income?RED:TEAL,borderRadius:2}}}/></Box>)}</Box>}
//                 </Box>
//             </Box>
//         </Box>
//     );
// };
//
// // ── Savings Side Panel (tabbed: Weekly tracker / Improve / Breakdown) ─────────
// const SavingsSidePanel:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter}> = ({template,periodFilter}) => {
//     const [tab,setTab]=useState<'tracker'|'improve'|'breakdown'>('tracker');
//     const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
//     const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
//     const expRow=t.rows.find(r=>r.rowType==='expenses');
//     const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
//     const gt=deriveGroupTotals(t);
//     const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
//
//     // Per-period savings
//     const periods=t.periods.map((_,i)=>{
//         const income=sal[i]??0;
//         const expenses=expRow?.values[i]??0;
//         const saved=income-expenses;
//         const goalPct=0.226; // 22.6% target
//         const goal=Math.round(income*goalPct);
//         const met=saved>=goal;
//         const pct=goal>0?Math.min((saved/goal)*100,120):0;
//         return{period:t.periods[i],income,expenses,saved,goal,met,pct,surplus:saved-goal};
//     }).filter(p=>p.income>0);
//
//     const totalSaved=periods.reduce((a,p)=>a+Math.max(0,p.saved),0);
//     const totalGoal=periods.reduce((a,p)=>a+p.goal,0);
//     const monthlyPct=totalGoal>0?(totalSaved/totalGoal)*100:0;
//     const metCount=periods.filter(p=>p.met).length;
//
//     // Breakdown
//     const totalIncome=sal.reduce((a:number,v)=>a+(v??0),0);
//     const catTotals=GROUP_ORDER.map(g=>({name:g,val:Object.values(gt[g]).reduce((a,b)=>a+b,0),color:CAT_COLORS[g]}));
//     const totalSpent=catTotals.reduce((a,c)=>a+c.val,0);
//     const totalSpentAll=(expRow?.values??[]).reduce((a:number,v)=>a+(v??0),0);
//     const optimized=totalSpentAll*0.96;
//
//     const tabs:Array<{key:'tracker'|'improve'|'breakdown';label:string}> = [
//         {key:'tracker',label:'Weekly tracker'},
//         {key:'improve',label:'Improve'},
//         {key:'breakdown',label:'Breakdown'},
//     ];
//
//     const improvItems=[
//         {icon:'↑',cls:'danger',title:'Dining out over target',desc:'Order out exceeded $40 target in some periods. Cap at $45/period to protect savings.',amt:'-$42',color:RED},
//         {icon:'!',cls:'warn',title:'Groceries over budget',desc:'Food spending above optimized target. Meal planning could recover ~$50/month.',amt:'-$50',color:AMBER},
//         {icon:'↗',cls:'info',title:'Surplus reallocation',desc:'Periods that beat goal generated surplus. Route to emergency fund or investments.',amt:'+$491',color:GREEN},
//         {icon:'~',cls:'warn',title:'Untracked "Other" spend',desc:'Breaking out miscellaneous spend could reveal $30–60 of cuttable expenses.',amt:'review',color:SLATE},
//         {icon:'★',cls:'info',title:'Raise savings goal to 25%',desc:`You're at ${((totalSaved/totalIncome)*100).toFixed(1)}% — just a little more to hit the recommended 25%.`,amt:'+$51/wk',color:GREEN},
//     ];
//
//     return (
//         <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}`,display:'flex',flexDirection:'column'}}>
//             {/* Maroon header with tabs */}
//             <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 60%,#5a1515 100%)`,position:'relative',overflow:'hidden'}}>
//                 <Box sx={{position:'absolute',top:-18,right:-18,width:70,height:70,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.05)'}}/>
//                 <Box sx={{display:'flex',alignItems:'center',gap:1.25,px:3,pt:2,pb:0,position:'relative'}}>
//                     <Box sx={{width:26,height:26,borderRadius:'7px',bgcolor:'rgba(255,255,255,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
//                         <Award size={13} color="white"/>
//                     </Box>
//                     <Box>
//                         <Typography sx={{fontWeight:700,fontSize:'0.88rem',color:'#fff'}}>Savings tracker &amp; insights</Typography>
//                         <Typography sx={{fontSize:'0.65rem',color:'rgba(255,255,255,0.6)',mt:0.25}}>Weekly goals · monthly target · tips</Typography>
//                     </Box>
//                 </Box>
//                 {/* Tabs */}
//                 <Box sx={{display:'flex',px:2,mt:1.25,position:'relative',zIndex:1}}>
//                     {tabs.map(({key,label})=>(
//                         <Box key={key} onClick={()=>setTab(key)} sx={{
//                             px:1.5,py:0.875,fontSize:'0.75rem',fontWeight:600,cursor:'pointer',
//                             color:tab===key?'#fff':'rgba(255,255,255,0.5)',
//                             borderBottom:`2px solid ${tab===key?'#fff':'transparent'}`,
//                             transition:'all 0.15s',whiteSpace:'nowrap',
//                             '&:hover':{color:'rgba(255,255,255,0.85)'},
//                         }}>{label}</Box>
//                     ))}
//                 </Box>
//             </Box>
//
//             {/* Tab body */}
//             <Box sx={{bgcolor:'#fff',p:2.5,flex:1}}>
//
//                 {/* ── Weekly tracker tab ── */}
//                 {tab==='tracker'&&(
//                     <Box>
//                         <Box sx={{display:'flex',flexDirection:'column',gap:1.25,mb:2}}>
//                             {periods.map((p,i)=>(
//                                 <Box key={i} sx={{border:`0.5px solid ${alpha('#000',0.08)}`,borderRadius:'8px',borderLeft:`3px solid ${p.met?GREEN:RED}`,p:1.5}}>
//                                     <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.875}}>
//                                         <Typography sx={{fontSize:'0.78rem',fontWeight:600,color:NAVY}}>{p.period}</Typography>
//                                         <Box sx={{px:0.75,py:0.2,borderRadius:'4px',bgcolor:p.met?alpha(GREEN,0.1):alpha(RED,0.1),fontSize:'0.65rem',fontWeight:700,color:p.met?GREEN:RED}}>
//                                             {p.met?'Goal met ✓':'Goal missed ✗'}
//                                         </Box>
//                                     </Box>
//                                     <Box sx={{height:4,borderRadius:2,bgcolor:alpha('#000',0.06),mb:0.875,overflow:'hidden'}}>
//                                         <Box sx={{height:'100%',borderRadius:2,bgcolor:p.met?GREEN:RED,width:`${Math.min(p.pct,100)}%`,transition:'width 0.3s'}}/>
//                                     </Box>
//                                     <Box sx={{display:'flex',gap:1.5,fontSize:'0.7rem',color:SLATE}}>
//                                         <span><strong style={{color:NAVY}}>${fmtS(p.saved)}</strong> saved</span>
//                                         <span>Goal <strong style={{color:NAVY}}>${fmtS(p.goal)}</strong></span>
//                                         <span style={{color:p.surplus>=0?GREEN:RED,fontWeight:600}}>{p.surplus>=0?'+':''}{fmtS(p.surplus)}</span>
//                                     </Box>
//                                 </Box>
//                             ))}
//                         </Box>
//                         {/* Monthly goal box */}
//                         <Box sx={{border:`0.5px solid ${alpha(TEAL,0.35)}`,borderRadius:'10px',p:1.75,bgcolor:alpha(TEAL,0.04)}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}>
//                                 <Typography sx={{fontSize:'0.78rem',fontWeight:600,color:TEAL}}>Monthly savings goal</Typography>
//                                 <Box sx={{px:0.75,py:0.2,borderRadius:'4px',bgcolor:alpha(GREEN,0.1),fontSize:'0.65rem',fontWeight:700,color:GREEN}}>
//                                     {metCount}/{periods.length} weeks met
//                                 </Box>
//                             </Box>
//                             <Box sx={{height:7,borderRadius:4,bgcolor:alpha(TEAL,0.15),mb:1,overflow:'hidden'}}>
//                                 <Box sx={{height:'100%',borderRadius:4,bgcolor:TEAL,width:`${Math.min(monthlyPct,100)}%`}}/>
//                             </Box>
//                             <Box sx={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:SLATE}}>
//                                 <span>Saved <strong style={{color:TEAL}}>${fmtS(totalSaved)}</strong></span>
//                                 <span>Goal <strong style={{color:TEAL}}>${fmtS(totalGoal)}</strong></span>
//                                 <span>{monthlyPct.toFixed(1)}%</span>
//                             </Box>
//                         </Box>
//                     </Box>
//                 )}
//
//                 {/* ── Improve tab ── */}
//                 {tab==='improve'&&(
//                     <Box sx={{display:'flex',flexDirection:'column',gap:1}}>
//                         {improvItems.map((item,i)=>(
//                             <Box key={i} sx={{display:'flex',alignItems:'flex-start',gap:1.25,p:1.25,borderRadius:'8px',bgcolor:alpha('#000',0.02),border:`0.5px solid ${alpha('#000',0.07)}`}}>
//                                 <Box sx={{
//                                     width:22,height:22,borderRadius:'5px',
//                                     display:'flex',alignItems:'center',justifyContent:'center',
//                                     flexShrink:0,fontSize:'11px',fontWeight:700,
//                                     bgcolor:item.cls==='danger'?alpha(RED,0.1):item.cls==='info'?alpha(GREEN,0.1):alpha(AMBER,0.12),
//                                     color:item.cls==='danger'?RED:item.cls==='info'?GREEN:AMBER,
//                                 }}>{item.icon}</Box>
//                                 <Box sx={{flex:1,minWidth:0}}>
//                                     <Typography sx={{fontSize:'0.75rem',fontWeight:600,color:NAVY,mb:0.3}}>{item.title}</Typography>
//                                     <Typography sx={{fontSize:'0.68rem',color:SLATE,lineHeight:1.45}}>{item.desc}</Typography>
//                                 </Box>
//                                 <Typography sx={{fontSize:'0.73rem',fontWeight:600,color:item.color,whiteSpace:'nowrap',flexShrink:0}}>{item.amt}</Typography>
//                             </Box>
//                         ))}
//                     </Box>
//                 )}
//
//                 {/* ── Breakdown tab ── */}
//                 {tab==='breakdown'&&(
//                     <Box>
//                         <Typography sx={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:SLATE,mb:1.25,fontWeight:600}}>Monthly spend by category</Typography>
//                         <Box sx={{display:'flex',flexDirection:'column',gap:1,mb:2}}>
//                             {catTotals.map(({name,val,color})=>{
//                                 const pct=totalIncome>0?(val/totalIncome)*100:0;
//                                 const barPct=totalIncome>0?Math.min((val/totalIncome)*100*4,100):0;
//                                 return(
//                                     <Box key={name} sx={{display:'flex',alignItems:'center',gap:1.25}}>
//                                         <Box sx={{fontSize:'0.72rem',color:NAVY,fontWeight:500,minWidth:88}}>{name}</Box>
//                                         <Box sx={{flex:1,height:6,borderRadius:3,bgcolor:alpha('#000',0.06),overflow:'hidden'}}>
//                                             <Box sx={{height:'100%',borderRadius:3,bgcolor:color,width:`${barPct}%`}}/>
//                                         </Box>
//                                         <Typography sx={{fontSize:'0.72rem',color:NAVY,fontVariantNumeric:'tabular-nums',minWidth:40,textAlign:'right'}}>${fmtS(val)}</Typography>
//                                         <Typography sx={{fontSize:'0.68rem',color:SLATE,minWidth:34,textAlign:'right'}}>{pct.toFixed(1)}%</Typography>
//                                     </Box>
//                                 );
//                             })}
//                             <Box sx={{display:'flex',alignItems:'center',gap:1.25}}>
//                                 <Box sx={{fontSize:'0.72rem',color:GREEN,fontWeight:600,minWidth:88}}>Saved</Box>
//                                 <Box sx={{flex:1,height:6,borderRadius:3,bgcolor:alpha('#000',0.06),overflow:'hidden'}}>
//                                     <Box sx={{height:'100%',borderRadius:3,bgcolor:GREEN,width:`${Math.min((totalSaved/totalIncome)*100*4,100)}%`}}/>
//                                 </Box>
//                                 <Typography sx={{fontSize:'0.72rem',color:GREEN,fontWeight:600,fontVariantNumeric:'tabular-nums',minWidth:40,textAlign:'right'}}>${fmtS(totalSaved)}</Typography>
//                                 <Typography sx={{fontSize:'0.68rem',color:GREEN,minWidth:34,textAlign:'right'}}>{totalIncome>0?((totalSaved/totalIncome)*100).toFixed(1):0}%</Typography>
//                             </Box>
//                         </Box>
//                         <Box sx={{height:'0.5px',bgcolor:alpha('#000',0.08),mb:1.75}}/>
//                         <Typography sx={{fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:SLATE,mb:1.25,fontWeight:600}}>Optimized vs actual</Typography>
//                         <Box sx={{display:'flex',flexDirection:'column',gap:0.875,mb:1.5}}>
//                             {[
//                                 {label:'Optimized budget',val:optimized,color:TEAL},
//                                 {label:'Actual spend',val:totalSpentAll,color:MAROON},
//                             ].map(({label,val,color})=>(
//                                 <Box key={label} sx={{display:'flex',alignItems:'center',gap:1.25}}>
//                                     <Typography sx={{fontSize:'0.7rem',color:SLATE,minWidth:100}}>{label}</Typography>
//                                     <Box sx={{flex:1,height:6,borderRadius:3,bgcolor:alpha('#000',0.06),overflow:'hidden'}}>
//                                         <Box sx={{height:'100%',borderRadius:3,bgcolor:color,width:`${Math.min((val/totalIncome)*100*4,100)}%`}}/>
//                                     </Box>
//                                     <Typography sx={{fontSize:'0.72rem',fontWeight:600,color,fontVariantNumeric:'tabular-nums',minWidth:52,textAlign:'right'}}>${fmtS(val)}</Typography>
//                                 </Box>
//                             ))}
//                         </Box>
//                         {totalSpentAll>optimized&&(
//                             <Box sx={{p:1.25,borderRadius:'8px',bgcolor:alpha(RED,0.05),border:`0.5px solid ${alpha(RED,0.2)}`,fontSize:'0.7rem',color:RED}}>
//                                 Actual exceeded optimized by <strong>${fmtS(totalSpentAll-optimized)}</strong> — primarily from food &amp; dining.
//                             </Box>
//                         )}
//                     </Box>
//                 )}
//
//             </Box>
//         </Box>
//     );
// };
//
// // ── Current Month View — two-column layout ────────────────────────────────────
// const CurrentMonthView:React.FC<{template:SpreadsheetTemplate;periodFilter:PeriodFilter;onPeriodFilter:(p:PeriodFilter)=>void}> = ({template,periodFilter,onPeriodFilter}) => {
//     const t=useMemo(()=>filterByPeriod(template,periodFilter),[template,periodFilter]);
//     const gt=deriveGroupTotals(t);
//     const sal=t.rows.find(r=>r.label==='Salary')?.values??[];
//     const expRow=t.rows.find(r=>r.rowType==='expenses');
//     const bal=t.rows.find(r=>r.rowType==='balance')?.values??[];
//     const catPcts:Record<string,number>={Housing:0.44,Food:0.22,Transportation:0.09,Entertainment:0.16,Other:0.09};
//     const isMS=(ci:number)=>t.months.some(m=>m.cols[0]===ci);
//
//     const getValColor=(row:SpreadsheetRow,val:number|null,ci:number):string=>{
//         if(val===null)return'transparent';
//         if(row.rowType==='balance')return val>=0?GREEN:RED;
//         if(row.rowType==='expenses'){const s=sal[ci];return s&&val>s?RED:NAVY;}
//         return NAVY;
//     };
//
//     const solidBg=(rt:SpreadsheetRow['rowType'],ri:number):string=>{
//         if(rt==='salary')return '#fdf4f4';
//         if(rt==='balance')return '#edfaf8';
//         if(rt==='expenses')return '#f8f8f8';
//         return ri%2===0?'#ffffff':'#f7f8f9';
//     };
//
//     return (
//         <Grid container spacing={3} alignItems="flex-start">
//             {/* Left: spending table + summary footer */}
//             <Grid item xs={12} lg={8}>
//                 <Stack spacing={3}>
//                     {/* Spending table */}
//                     <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}`}}>
//                         <MaroonCardHeader
//                             icon={<TableIcon size={14} color="white"/>}
//                             title={template.name}
//                             subtitle={`${template.periodType} · ${t.periods.length} periods · By category`}
//                         />
//                         <Box sx={{bgcolor:'#fff',p:2.5}}>
//                             <PeriodPills active={periodFilter} onChange={onPeriodFilter}/>
//                             <Box sx={{borderRadius:'10px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.14)}`}}>
//                                 <TableContainer sx={{overflowX:'auto'}}>
//                                     <Table size="small" sx={{minWidth:'max-content',borderCollapse:'separate',borderSpacing:0,'& .MuiTableCell-root':{border:'none'}}}>
//                                         <TableHead>
//                                             <TableRow>
//                                                 <TableCell sx={{position:'sticky',left:0,zIndex:6,minWidth:145,background:'#f3ecec',borderRight:`2px solid ${alpha(MAROON,0.25)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.12)`,fontWeight:700,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:MAROON,py:1.125,px:1.75,verticalAlign:'middle',borderBottom:`2px solid ${alpha(MAROON,0.15)}`}}>
//                                                     Category
//                                                 </TableCell>
//                                                 {t.periods.map((p,i)=>(
//                                                     <TableCell key={i} align="center" sx={{fontWeight:600,fontSize:'0.68rem',color:SLATE,py:1,minWidth:80,bgcolor:alpha(MAROON,0.02),borderLeft:isMS(i)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.05)}`,borderBottom:`2px solid ${alpha(MAROON,0.15)}`}}>
//                                                         {p}
//                                                     </TableCell>
//                                                 ))}
//                                                 <TableCell align="right" sx={{fontWeight:700,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.07em',color:NAVY,py:1,bgcolor:alpha(NAVY,0.04),borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderBottom:`2px solid ${alpha(MAROON,0.15)}`,minWidth:80}}>Total</TableCell>
//                                             </TableRow>
//                                         </TableHead>
//                                         <TableBody>
//                                             {t.rows.map((row,ri)=>{
//                                                 const rowTotal=row.values.reduce((a:number,v)=>a+(v??0),0);
//                                                 const isSection=row.rowType==='salary';
//                                                 const isSummary=row.rowType==='expenses'||row.rowType==='balance';
//                                                 const bg=solidBg(row.rowType,ri);
//                                                 // Inline savings goal & actual saved rows after salary
//                                                 return(
//                                                     <TableRow key={row.label}>
//                                                         <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:bg,borderRight:`2px solid ${alpha(MAROON,0.18)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:isSection?700:isSummary?600:400,color:row.rowType==='salary'?MAROON:row.rowType==='balance'?'#0f766e':NAVY,whiteSpace:'nowrap',fontSize:'0.78rem',px:1.75,borderTop:isSection?`2px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`}}>
//                                                             <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
//                                                                 {row.rowType==='expense'&&CATEGORY_GROUPS[row.label]&&(
//                                                                     <Box sx={{width:3,height:13,borderRadius:'1px',bgcolor:CAT_COLORS[CATEGORY_GROUPS[row.label]]??SLATE,flexShrink:0}}/>
//                                                                 )}
//                                                                 {row.label}
//                                                             </Box>
//                                                         </TableCell>
//                                                         {row.values.map((val,ci)=>(
//                                                             <TableCell key={ci} align="right" sx={{zIndex:1,color:getValColor(row,val,ci),bgcolor:bg,fontWeight:isSummary||isSection?600:400,fontSize:'0.78rem',borderLeft:isMS(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:isSection?`2px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>
//                                                                 {val!==null?`$${fmt(val)}`:''}
//                                                             </TableCell>
//                                                         ))}
//                                                         <TableCell align="right" sx={{zIndex:1,fontWeight:700,fontSize:'0.78rem',color:row.rowType==='balance'?(rowTotal>=0?GREEN:RED):NAVY,bgcolor:bg,borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:isSection?`2px solid ${alpha(MAROON,0.18)}`:`1px solid ${alpha('#000',0.04)}`,fontVariantNumeric:'tabular-nums'}}>
//                                                             {rowTotal!==0||row.values.some(v=>v!==null)?`$${fmt(rowTotal)}`:''}
//                                                         </TableCell>
//                                                     </TableRow>
//                                                 );
//                                             })}
//                                             {/* Savings goal row */}
//                                             <TableRow>
//                                                 <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(TEAL,0.04),borderRight:`2px solid ${alpha(MAROON,0.18)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,color:TEAL,whiteSpace:'nowrap',fontSize:'0.78rem',px:1.75,borderTop:`1.5px solid ${alpha(TEAL,0.2)}`}}>
//                                                     Savings goal
//                                                 </TableCell>
//                                                 {t.periods.map((_,ci)=>{
//                                                     const inc=sal[ci]??0;
//                                                     const goal=inc>0?Math.round(inc*0.226):null;
//                                                     return<TableCell key={ci} align="right" sx={{zIndex:1,color:TEAL,fontWeight:500,fontSize:'0.78rem',bgcolor:alpha(TEAL,0.04),borderLeft:isMS(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1.5px solid ${alpha(TEAL,0.2)}`,fontVariantNumeric:'tabular-nums'}}>{goal!==null?`$${fmtS(goal)}`:''}</TableCell>;
//                                                 })}
//                                                 <TableCell align="right" sx={{zIndex:1,fontWeight:700,color:TEAL,fontSize:'0.78rem',bgcolor:alpha(TEAL,0.04),borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1.5px solid ${alpha(TEAL,0.2)}`}}/>
//                                             </TableRow>
//                                             {/* Actual saved row */}
//                                             <TableRow>
//                                                 <TableCell sx={{position:'sticky',left:0,zIndex:4,bgcolor:alpha(GREEN,0.04),borderRight:`2px solid ${alpha(MAROON,0.18)}`,boxShadow:`3px 0 8px -2px rgba(0,0,0,0.1)`,fontWeight:600,color:GREEN,whiteSpace:'nowrap',fontSize:'0.78rem',px:1.75,borderTop:`1px solid ${alpha(GREEN,0.15)}`}}>
//                                                     Actual saved
//                                                 </TableCell>
//                                                 {t.periods.map((_,ci)=>{
//                                                     const inc=sal[ci]??0;
//                                                     const exp=expRow?.values[ci]??0;
//                                                     const saved=inc-exp;
//                                                     const goal=inc>0?Math.round(inc*0.226):0;
//                                                     const met=saved>=goal&&inc>0;
//                                                     return<TableCell key={ci} align="right" sx={{zIndex:1,color:met?GREEN:RED,fontWeight:600,fontSize:'0.78rem',bgcolor:alpha(GREEN,0.04),borderLeft:isMS(ci)?`1.5px solid ${alpha(MAROON,0.2)}`:`1px solid ${alpha('#000',0.04)}`,borderTop:`1px solid ${alpha(GREEN,0.15)}`,fontVariantNumeric:'tabular-nums'}}>{inc>0?`$${fmtS(saved)} ${met?'✓':'✗'}`:''}</TableCell>;
//                                                 })}
//                                                 <TableCell align="right" sx={{zIndex:1,fontWeight:700,color:GREEN,fontSize:'0.78rem',bgcolor:alpha(GREEN,0.04),borderLeft:`2px solid ${alpha(NAVY,0.15)}`,borderTop:`1px solid ${alpha(GREEN,0.15)}`}}/>
//                                             </TableRow>
//                                         </TableBody>
//                                     </Table>
//                                 </TableContainer>
//                             </Box>
//                         </Box>
//                     </Box>
//
//                     {/* Overall summary */}
//                     <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.08)}`}}>
//                         <MaroonCardHeader icon={<Award size={14} color="white"/>} title="Overall summary" subtitle={`Totals across all ${t.periods.length} periods`}/>
//                         <Box sx={{bgcolor:'#fff',p:0}}>
//                             <TableContainer>
//                                 <Table size="small">
//                                     <TableHead><TableRow sx={{bgcolor:alpha(MAROON,0.04)}}>{['Budget goal','Total planned','Total spent','Savings %','Over budget %'].map(h=><TableCell key={h} sx={{fontWeight:700,color:MAROON,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.06em',py:1.25,px:2}}>{h}</TableCell>)}</TableRow></TableHead>
//                                     <TableBody>
//                                         <TableRow>{(()=>{
//                                             const ts=sal.reduce((a:number,v)=>a+(v??0),0);
//                                             const te=(expRow?.values??[]).reduce((a:number,v)=>a+(v??0),0);
//                                             const sr=ts>0?((ts-te)/ts)*100:0;
//                                             const bu=ts>0?(te/ts)*100:0;
//                                             return[{v:`$${fmt(ts)}`,c:NAVY},{v:`$${fmt(ts)}`,c:NAVY},{v:`$${fmt(te)}`,c:MAROON},{v:`${sr>=0?'+':''}${sr.toFixed(1)}%`,c:sr>=0?GREEN:RED},{v:`${bu>100?'+':'–'}${Math.abs(bu-100).toFixed(1)}%`,c:bu>100?RED:GREEN}].map(({v,c},i)=><TableCell key={i} sx={{fontWeight:700,fontSize:'0.85rem',color:c,py:1.5,px:2,fontVariantNumeric:'tabular-nums'}}>{v}</TableCell>);
//                                         })()}</TableRow>
//                                     </TableBody>
//                                 </Table>
//                             </TableContainer>
//                         </Box>
//                     </Box>
//                 </Stack>
//             </Grid>
//
//             {/* Right: tabbed savings panel */}
//             <Grid item xs={12} lg={4}>
//                 <Box sx={{position:'sticky',top:24}}>
//                     <SavingsSidePanel template={template} periodFilter={periodFilter}/>
//                 </Box>
//             </Grid>
//         </Grid>
//     );
// };
//
// // ── Maroon card header ────────────────────────────────────────────────────────
// const MaroonCardHeader:React.FC<{icon:React.ReactNode;title:string;subtitle:string}> = ({icon,title,subtitle}) => (
//     <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)`,px:3,py:2,position:'relative',overflow:'hidden'}}>
//         <Box sx={{position:'absolute',top:-16,right:-16,width:80,height:80,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.06)'}}/>
//         <Box sx={{position:'absolute',bottom:-20,right:50,width:50,height:50,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.04)'}}/>
//         <Box sx={{display:'flex',alignItems:'center',gap:1.25,position:'relative'}}>
//             <Box sx={{width:30,height:30,borderRadius:'8px',bgcolor:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</Box>
//             <Box><Typography sx={{fontWeight:800,fontSize:'0.92rem',color:'#fff',letterSpacing:'-0.01em'}}>{title}</Typography><Typography sx={{fontSize:'0.67rem',color:'rgba(255,255,255,0.7)',mt:0.1}}>{subtitle}</Typography></Box>
//         </Box>
//     </Box>
// );
//
// // ── Main Component ─────────────────────────────────────────────────────────────
// const BudgetPlanner: React.FC = () => {
//     const [animateIn,setAnimateIn]   = useState(false);
//     const [templates,setTemplates]   = useState<SpreadsheetTemplate[]>([]);
//     const [selectedId,setSelectedId] = useState<string>('preset-rolling');
//     const [topViewMode,setTopViewMode] = useState<TopViewMode>('current-month');
//     const [editMode,setEditMode]     = useState(false);
//     const [showRuleSelector,setShowRuleSelector] = useState(false);
//     const [selectedRuleId,setSelectedRuleId] = useState('50-30-20');
//     const [monthlyIncome,setMonthlyIncome] = useState(5000);
//     const [openSaveDialog,setOpenSaveDialog] = useState(false);
//     const [saveName,setSaveName]     = useState('');
//     const [currentMonth,setCurrentMonth] = useState(new Date());
//     const [periodFilter,setPeriodFilter] = useState<PeriodFilter>('Biweekly');
//     const [openWizard, setOpenWizard] = useState(false);
//
//     const monthLabel = currentMonth.toLocaleString('default',{month:'long',year:'numeric'});
//
//     useEffect(()=>{setTimeout(()=>setAnimateIn(true),100);},[]);
//     useEffect(()=>{setTemplates([ROLLING_TEMPLATE,NOV_MAY]);},[]);
//
//     const currentTemplate = templates.find(t=>t.id===selectedId)??templates[0];
//     const totalSalary   = currentTemplate?.rows.find(r=>r.label==='Salary')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
//     const totalExpenses = currentTemplate?.rows.find(r=>r.label==='Expenses')?.values.reduce((a:number,v)=>a+(v??0),0)??0;
//     const finalBalance  = currentTemplate?.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null).slice(-1)[0]??0;
//     const savingsRate   = totalSalary>0?((totalSalary-totalExpenses)/totalSalary)*100:0;
//     const avgIncome     = totalSalary/(currentTemplate?.periods.length||1);
//     const avgExpenses   = totalExpenses/(currentTemplate?.periods.length||1);
//     const budgetUtil    = totalSalary>0?(totalExpenses/totalSalary)*100:0;
//     const utilColor     = budgetUtil>100?RED:budgetUtil>85?AMBER:TEAL;
//
//     const handleCellChange = (ri:number,ci:number,value:number|null) => {
//         setTemplates(prev=>prev.map(t=>{
//             if(t.id!==selectedId)return t;
//             const rows=t.rows.map((r,i)=>i===ri?{...r,values:r.values.map((v,j)=>j===ci?value:v)}:r);
//             const ei=rows.findIndex(r=>r.rowType==='expenses'),bi=rows.findIndex(r=>r.rowType==='balance'),si=rows.findIndex(r=>r.rowType==='salary');
//             if(ei>=0){const er=rows.filter(r=>r.rowType==='expense');rows[ei]={...rows[ei],values:rows[ei].values.map((_,j)=>er.reduce((s,r)=>s+(r.values[j]??0),0))};}
//             if(bi>=0&&si>=0){let run=0;rows[bi]={...rows[bi],values:rows[bi].values.map((_,j)=>{const s=rows[si].values[j]??0,e=ei>=0?rows[ei].values[j]??0:0;run=run+s-e;return run;})};}
//             return{...t,rows};
//         }));
//     };
//
//     const handleWizardCreate = (config: {
//         name: string;
//         periodType: PeriodType;
//         startMonth: string;
//         endMonth: string;
//         income: number;
//         categories: { name: string; color: string }[];
//         allocs: Record<string, number>;
//     }) => {
//         const start = new Date(config.startMonth + '-01');
//         const end   = new Date(config.endMonth + '-01');
//         end.setMonth(end.getMonth() + 1);
//         end.setDate(0);
//
//         const { periods, months } = generatePeriods(config.periodType, start, end);
//         const rows = makeBlankRows(periods.length);
//
//         // Pre-fill salary row with the income the user entered
//         const salaryIdx = rows.findIndex(r => r.label === 'Salary');
//         if (salaryIdx >= 0 && config.income > 0) {
//             rows[salaryIdx] = {
//                 ...rows[salaryIdx],
//                 values: rows[salaryIdx].values.map(() => config.income),
//             };
//         }
//
//         // Pre-fill first period values for each category allocation
//         config.categories.forEach(cat => {
//             const amount = config.allocs[cat.name] ?? 0;
//             if (amount <= 0) return;
//             // Find a row whose label matches the category name, or the first Other row
//             const rowIdx = rows.findIndex(r => r.label === cat.name);
//             if (rowIdx >= 0) {
//                 rows[rowIdx] = {
//                     ...rows[rowIdx],
//                     values: rows[rowIdx].values.map(() => amount),
//                 };
//             }
//         });
//
//         // Recompute Expenses row
//         const expIdx = rows.findIndex(r => r.rowType === 'expenses');
//         const salIdx = rows.findIndex(r => r.rowType === 'salary');
//         if (expIdx >= 0) {
//             const expenseRows = rows.filter(r => r.rowType === 'expense');
//             rows[expIdx] = {
//                 ...rows[expIdx],
//                 values: rows[expIdx].values.map((_, ci) =>
//                     expenseRows.reduce((s, r) => s + (r.values[ci] ?? 0), 0)
//                 ),
//             };
//         }
//
//         // Recompute running balance
//         const balIdx = rows.findIndex(r => r.rowType === 'balance');
//         if (balIdx >= 0 && salIdx >= 0) {
//             let running = 0;
//             rows[balIdx] = {
//                 ...rows[balIdx],
//                 values: rows[balIdx].values.map((_, ci) => {
//                     const sal = rows[salIdx].values[ci] ?? 0;
//                     const exp = expIdx >= 0 ? rows[expIdx].values[ci] ?? 0 : 0;
//                     running = running + sal - exp;
//                     return running;
//                 }),
//             };
//         }
//
//         const newTemplate: SpreadsheetTemplate = {
//             id: generateUUID(),
//             name: config.name,
//             periodType: config.periodType,
//             months,
//             periods,
//             rows,
//         };
//
//         setTemplates(prev => [...prev, newTemplate]);
//         setSelectedId(newTemplate.id);
//     };
//
//     const handleSaveCopy = () => {
//         if(!saveName||!currentTemplate)return;
//         const copy={...currentTemplate,id:generateUUID(),name:saveName,rows:currentTemplate.rows.map(r=>({...r,values:[...r.values]}))};
//         setTemplates(prev=>[...prev,copy]);setSelectedId(copy.id);setOpenSaveDialog(false);setSaveName('');
//     };
//
//     const kpiCards=[
//         {label:'Avg Income / Period',val:`$${fmtS(avgIncome)}`,color:NAVY,base:'#f0f4ff',sub:currentTemplate?.name??''},
//         {label:'Avg Expenses / Period',val:`$${fmtS(avgExpenses)}`,color:MAROON,base:'#fff1f2',sub:'per period avg'},
//         {label:'Cumulative Balance',val:`$${fmtS(finalBalance)}`,color:finalBalance>=0?GREEN:RED,base:finalBalance>=0?'#f0fdf4':'#fff1f2',sub:'running total'},
//         {label:'Avg Savings Rate',val:`${savingsRate>=0?'+':''}${savingsRate.toFixed(1)}%`,color:savingsRate>=0?GREEN:RED,base:savingsRate>=0?'#f0f9ff':'#fff1f2',sub:'of income'},
//     ];
//
//     const RuleCard:React.FC<{rule:BudgetRule;selected:boolean;onSelect:()=>void}> = ({rule,selected,onSelect}) => (
//         <Box onClick={onSelect} sx={{p:1.75,borderRadius:'10px',cursor:'pointer',border:`2px solid ${selected?rule.color:alpha('#000',0.07)}`,bgcolor:selected?alpha(rule.color,0.05):'#fff',transition:'all 0.18s','&:hover':{borderColor:rule.color},position:'relative'}}>
//             {selected&&<Box sx={{position:'absolute',top:7,right:7,color:rule.color}}><CheckCircle2 size={14}/></Box>}
//             <Box sx={{display:'flex',alignItems:'center',gap:1.25,mb:0.75}}><Box sx={{width:28,height:28,borderRadius:'7px',bgcolor:alpha(rule.color,0.12),color:rule.color,display:'flex',alignItems:'center',justifyContent:'center'}}>{rule.icon}</Box><Box><Typography sx={{fontSize:'0.82rem',fontWeight:800,color:NAVY,lineHeight:1}}>{rule.shortName}</Typography><Typography sx={{fontSize:'0.62rem',color:SLATE}}>{rule.tagline}</Typography></Box></Box>
//             <Box sx={{display:'flex',height:5,borderRadius:2,overflow:'hidden',gap:'1px'}}>{Object.entries(rule.allocations).filter(([,v])=>v>0).map(([k,v],i)=><Box key={k} sx={{flex:v,bgcolor:CHART_COLORS[i%CHART_COLORS.length]}}/>)}</Box>
//         </Box>
//     );
//
//     // Two view modes only
//     const viewModes=[
//         {key:'current-month' as TopViewMode, label:'Month View',  icon:<Calendar size={12}/>},
//         {key:'classic'       as TopViewMode, label:'Spreadsheet', icon:<TableIcon size={12}/>},
//     ];
//
//     // Template dropdown used in ALL modes
//     const TemplateSelector = () => (
//         <FormControl size="small" sx={{minWidth:220}}>
//             <InputLabel sx={{fontSize:'0.82rem',color:SLATE}}>Template</InputLabel>
//             <Select value={selectedId||''} label="Template" onChange={e=>setSelectedId(e.target.value)}
//                     sx={{bgcolor:'#fff',borderRadius:'8px',fontSize:'0.82rem','& .MuiOutlinedInput-notchedOutline':{borderColor:alpha('#000',0.12)},'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:MAROON}}}>
//                 {templates.map(t=>(
//                     <MenuItem key={t.id} value={t.id}>
//                         <Box sx={{display:'flex',alignItems:'center',gap:1}}>
//                             <Chip label={t.periodType} size="small" sx={{height:18,fontSize:'0.62rem',fontWeight:700,bgcolor:alpha(TEAL,0.1),color:TEAL}}/>
//                             <Typography sx={{fontSize:'0.82rem'}}>{t.name}</Typography>
//                         </Box>
//                     </MenuItem>
//                 ))}
//             </Select>
//         </FormControl>
//     );
//
//     return (
//         <Box sx={{maxWidth:'calc(100% - 240px)',ml:'240px',minHeight:'100vh',background:BG}}>
//             <Sidebar/>
//             <Container maxWidth="xl" sx={{py:4}}>
//
//                 {/* ── Header ── */}
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{mb:4}}>
//                         {/* Row 1: Title left | month nav + action buttons right */}
//                         <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',mb:2.5,flexDirection:{xs:'column',sm:'row'},gap:2}}>
//                             <Box>
//                                 <Box sx={{width:28,height:3,background:MAROON,borderRadius:'2px',mb:0.75}}/>
//                                 {topViewMode==='current-month'
//                                     ?<><Typography variant="h4" component="h1" sx={{fontWeight:800,color:'#111',letterSpacing:'-0.025em'}}>{monthLabel} Budget Planner</Typography><Typography variant="subtitle1" sx={{color:'#888',mt:0.5}}>Track your progress and stay within your spending limits</Typography></>
//                                     :<><Typography variant="h4" component="h1" sx={{fontWeight:800,color:'#111',letterSpacing:'-0.025em'}}>Budget Planner</Typography><Typography variant="subtitle1" sx={{color:'#888',mt:0.5}}>Plan · track · analyze spending across any period</Typography></>
//                                 }
//                             </Box>
//                             {/* Right: month nav (always) + action buttons */}
//                             <Box sx={{display:'flex',alignItems:'center',gap:1,flexShrink:0}}>
//                                 {/* Month chevrons — always visible, left of Edit */}
//                                 <IconButton onClick={()=>setCurrentMonth(prev=>{const d=new Date(prev);d.setMonth(d.getMonth()-1);return d;})} sx={{width:32,height:32,borderRadius:'6px',background:MAROON,color:'#fff','&:hover':{background:MAROON_DARK}}}>
//                                     <Box component="span" sx={{fontSize:'1.1rem',lineHeight:1}}>‹</Box>
//                                 </IconButton>
//                                 <Card elevation={0} sx={{px:1.75,py:0.625,display:'flex',alignItems:'center',gap:0.75,borderRadius:'8px',border:'1px solid #e0e0e0',background:'#f9f9f9'}}>
//                                     <Calendar size={13} color="#888"/>
//                                     <Typography sx={{fontSize:'0.8rem',fontWeight:600,color:'#222',whiteSpace:'nowrap'}}>{monthLabel}</Typography>
//                                 </Card>
//                                 <IconButton onClick={()=>setCurrentMonth(prev=>{const d=new Date(prev);d.setMonth(d.getMonth()+1);return d;})} sx={{width:32,height:32,borderRadius:'6px',background:MAROON,color:'#fff','&:hover':{background:MAROON_DARK}}}>
//                                     <Box component="span" sx={{fontSize:'1.1rem',lineHeight:1}}>›</Box>
//                                 </IconButton>
//                                 <Box sx={{width:'1px',height:24,bgcolor:alpha('#000',0.1),mx:0.5}}/>
//                                 <Button variant="outlined" size="small" onClick={()=>setEditMode(v=>!v)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',gap:0.5,borderColor:editMode?TEAL:'#d5d5d5',color:editMode?'#fff':'#555',bgcolor:editMode?TEAL:'#fff','&:hover':{borderColor:TEAL,color:editMode?'#fff':TEAL,bgcolor:editMode?'#0f766e':alpha(TEAL,0.04)}}}>
//                                     {editMode?<EditOff sx={{fontSize:'0.85rem'}}/>:<Edit sx={{fontSize:'0.85rem'}}/>}{editMode?'Stop Editing':'Edit'}
//                                 </Button>
//                                 <Button variant="outlined" size="small" onClick={()=>setOpenWizard(true)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',borderColor:'#d5d5d5',color:'#555',bgcolor:'#fff','&:hover':{borderColor:MAROON,color:MAROON,bgcolor:alpha(MAROON,0.04)}}}>
//                                     <Add sx={{fontSize:'0.9rem',mr:0.3}}/> New
//                                 </Button>
//                                 <Button variant="outlined" size="small" onClick={()=>setShowRuleSelector(v=>!v)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',gap:0.5,borderColor:showRuleSelector?MAROON:'#d5d5d5',color:showRuleSelector?'#fff':'#555',bgcolor:showRuleSelector?MAROON:'#fff','&:hover':{borderColor:MAROON,color:showRuleSelector?'#fff':MAROON,bgcolor:showRuleSelector?MAROON_DARK:alpha(MAROON,0.04)}}}>
//                                     <Sparkles size={13}/> Rule
//                                 </Button>
//                                 {currentTemplate&&(
//                                     <Button variant="outlined" size="small" onClick={()=>setOpenSaveDialog(true)} sx={{borderRadius:'6px',textTransform:'none',fontWeight:600,fontSize:'0.78rem',gap:0.5,borderColor:'#d5d5d5',color:'#555',bgcolor:'#fff','&:hover':{borderColor:MAROON,color:MAROON,bgcolor:alpha(MAROON,0.04)}}}>
//                                         <Save sx={{fontSize:'0.85rem'}}/> Save
//                                     </Button>
//                                 )}
//                             </Box>
//                         </Box>
//
//                         {/* Row 2: Template dropdown + view toggle (right of dropdown) */}
//                         <Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}>
//                             <TemplateSelector/>
//                             {/* Two-option view toggle — right of template dropdown */}
//                             <Box sx={{display:'flex',border:`1px solid ${alpha('#000',0.12)}`,borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
//                                 {viewModes.map(({key,label,icon})=>(
//                                     <Box key={key} onClick={()=>setTopViewMode(key)} sx={{
//                                         px:1.75,py:0.75,
//                                         display:'flex',alignItems:'center',gap:0.6,
//                                         cursor:'pointer',
//                                         bgcolor:topViewMode===key?MAROON:'#fff',
//                                         color:topViewMode===key?'#fff':'#555',
//                                         fontSize:'0.78rem',fontWeight:600,
//                                         borderRight:`1px solid ${alpha('#000',0.08)}`,
//                                         transition:'all 0.15s',
//                                         '&:last-child':{borderRight:'none'},
//                                         '&:hover':topViewMode!==key?{bgcolor:alpha(MAROON,0.05),color:MAROON}:{},
//                                     }}>
//                                         {icon}{label}
//                                     </Box>
//                                 ))}
//                             </Box>
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* ── KPI cards ── */}
//                 {currentTemplate&&(
//                     <Grow in={animateIn} timeout={600}>
//                         <Grid container spacing={2.5} sx={{mb:4}}>
//                             {kpiCards.map(({label,val,color,base,sub})=>(
//                                 <Grid item xs={12} sm={6} md={3} key={label}>
//                                     <Box sx={{background:base,borderRadius:'10px',borderTop:`3px solid ${color}`,boxShadow:'0 2px 12px rgba(0,0,0,0.10)',p:2.5,height:'100%',transition:'box-shadow 0.2s','&:hover':{boxShadow:'0 6px 20px rgba(0,0,0,0.14)'}}}>
//                                         <Typography sx={{fontSize:'0.67rem',textTransform:'uppercase',letterSpacing:'0.1em',color:alpha(color,0.7),fontWeight:700,mb:1}}>{label}</Typography>
//                                         <Typography sx={{fontSize:'1.65rem',fontWeight:800,color,fontVariantNumeric:'tabular-nums',lineHeight:1,mb:0.5}}>{val}</Typography>
//                                         <LinearProgress variant="determinate" value={label==='Avg Expenses / Period'?Math.min(budgetUtil,100):100} sx={{my:1,height:4,borderRadius:2,bgcolor:alpha(color,0.15),'& .MuiLinearProgress-bar':{bgcolor:color,borderRadius:2}}}/>
//                                         <Typography sx={{fontSize:'0.72rem',color:alpha(color,0.6)}}>{sub}</Typography>
//                                     </Box>
//                                 </Grid>
//                             ))}
//                         </Grid>
//                     </Grow>
//                 )}
//
//                 {/* ── Utilization bar ── */}
//                 {currentTemplate&&(
//                     <Grow in={animateIn} timeout={650}>
//                         <Box sx={{mb:3,pb:3,borderBottom:`1px solid ${alpha('#000',0.07)}`}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',mb:0.75}}>
//                                 <Typography sx={{fontSize:'0.72rem',color:SLATE}}>Budget utilization (avg across all periods)</Typography>
//                                 <Typography sx={{fontSize:'0.72rem',fontWeight:700,color:utilColor}}>{budgetUtil.toFixed(1)}%</Typography>
//                             </Box>
//                             <LinearProgress variant="determinate" value={Math.min(budgetUtil,100)} sx={{height:5,borderRadius:3,bgcolor:alpha(utilColor,0.15),'& .MuiLinearProgress-bar':{bgcolor:utilColor,borderRadius:3}}}/>
//                         </Box>
//                     </Grow>
//                 )}
//
//                 {/* ── Rule selector ── */}
//                 {showRuleSelector&&(
//                     <Grow in timeout={200}>
//                         <Box sx={{p:3,borderRadius:'16px',border:`1px solid ${alpha(TEAL,0.2)}`,bgcolor:'#fff',mb:3,boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:2}}>
//                                 <Box sx={{display:'flex',alignItems:'center',gap:1.5}}><Box sx={{width:32,height:32,borderRadius:'8px',bgcolor:alpha(TEAL,0.1),display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={16} color={TEAL}/></Box><Box><Typography sx={{fontWeight:800,fontSize:'0.95rem',color:NAVY}}>Apply a Budget Rule</Typography><Typography sx={{fontSize:'0.72rem',color:SLATE}}>Auto-distribute salary into category budgets</Typography></Box></Box>
//                                 <Button size="small" onClick={()=>setShowRuleSelector(false)} sx={{color:SLATE,textTransform:'none'}}>Dismiss</Button>
//                             </Box>
//                             <Box sx={{display:'flex',gap:2,alignItems:'center',mb:2,p:2,borderRadius:'10px',bgcolor:alpha(TEAL,0.04),border:`1px solid ${alpha(TEAL,0.12)}`}}>
//                                 <Wallet size={16} color={TEAL}/>
//                                 <Box sx={{flex:1}}><Typography sx={{fontSize:'0.7rem',fontWeight:700,color:SLATE,mb:0.5}}>Monthly Income</Typography><TextField size="small" type="number" value={monthlyIncome} onChange={e=>setMonthlyIncome(Number(e.target.value))} InputProps={{startAdornment:<Typography sx={{mr:0.5,color:SLATE}}>$</Typography>}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'8px',fontWeight:700},maxWidth:160}}/></Box>
//                             </Box>
//                             <Grid container spacing={1.25} sx={{mb:2}}>{BUDGET_RULES.map(rule=><Grid item xs={12} sm={6} md={4} lg={2.4} key={rule.id}><RuleCard rule={rule} selected={selectedRuleId===rule.id} onSelect={()=>setSelectedRuleId(rule.id)}/></Grid>)}</Grid>
//                             <Button variant="contained" onClick={()=>setShowRuleSelector(false)} sx={{bgcolor:MAROON,color:'#fff',borderRadius:'8px',textTransform:'none',fontWeight:700,'&:hover':{bgcolor:MAROON_DARK}}}>Apply Rule</Button>
//                         </Box>
//                     </Grow>
//                 )}
//
//                 {/* ── Main content ── */}
//                 {currentTemplate&&(
//                     <Grow in={animateIn} timeout={700}>
//                         <Stack spacing={3}>
//
//                             {/* Month View — two-column layout with tabbed savings panel */}
//                             {topViewMode==='current-month'&&(
//                                 <CurrentMonthView template={currentTemplate} periodFilter={periodFilter} onPeriodFilter={setPeriodFilter}/>
//                             )}
//
//                             {/* Spreadsheet View */}
//                             {topViewMode==='classic'&&(
//                                 <Stack spacing={3}>
//                                     <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}`}}>
//                                         <MaroonCardHeader icon={<TableIcon size={15} color="white"/>} title={currentTemplate.name} subtitle={`${currentTemplate.periodType} · ${currentTemplate.periods.length} periods · Classic spreadsheet${editMode?' · editing':''}`}/>
//                                         <Box sx={{bgcolor:'#fff',p:3}}><ClassicSpreadsheet template={currentTemplate} editMode={editMode} onCellChange={handleCellChange} periodFilter={periodFilter} onPeriodFilter={setPeriodFilter}/></Box>
//                                     </Box>
//                                     {/* Summary footer */}
//                                     <Box sx={{borderRadius:'16px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 24px ${alpha(MAROON,0.10)}`}}>
//                                         <MaroonCardHeader icon={<Award size={15} color="white"/>} title="Overall Summary" subtitle={`Totals across all ${currentTemplate.periods.length} periods`}/>
//                                         <Box sx={{bgcolor:'#fff',p:3}}>
//                                             <Box sx={{display:'flex',justifyContent:'flex-end',mb:2}}><Button size="small" variant="outlined" onClick={()=>setOpenSaveDialog(true)} sx={{borderColor:alpha(MAROON,0.3),color:MAROON,textTransform:'none',fontWeight:700,fontSize:'0.75rem',borderRadius:'7px','&:hover':{borderColor:MAROON,bgcolor:alpha(MAROON,0.04)}}}>Save as template</Button></Box>
//                                             <TableContainer sx={{borderRadius:'8px',border:`1px solid ${alpha('#000',0.07)}`}}>
//                                                 <Table size="small">
//                                                     <TableHead><TableRow sx={{bgcolor:alpha(MAROON,0.04)}}>{['Budget Goal','Total Planned','Total Spent','Savings %','Over Budget %'].map(h=><TableCell key={h} sx={{fontWeight:800,color:MAROON,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',py:1.25}}>{h}</TableCell>)}</TableRow></TableHead>
//                                                     <TableBody><TableRow>{[{v:`$${fmt(totalSalary)}`,c:NAVY},{v:`$${fmt(totalSalary)}`,c:NAVY},{v:`$${fmt(totalExpenses)}`,c:MAROON},{v:`${savingsRate>=0?'+':''}${savingsRate.toFixed(1)}%`,c:savingsRate>=0?GREEN:RED},{v:`${budgetUtil>100?'+':'–'}${Math.abs(budgetUtil-100).toFixed(1)}%`,c:budgetUtil>100?RED:GREEN}].map(({v,c},i)=><TableCell key={i} sx={{fontWeight:700,fontSize:'0.88rem',color:c,py:1.5,fontVariantNumeric:'tabular-nums'}}>{v}</TableCell>)}</TableRow></TableBody>
//                                                 </Table>
//                                             </TableContainer>
//                                         </Box>
//                                     </Box>
//                                 </Stack>
//                             )}
//
//                         </Stack>
//                     </Grow>
//                 )}
//             </Container>
//
//             {/* Dialogs */}
//             <ManualTemplateWizard
//                 open={openWizard}
//                 onClose={() => setOpenWizard(false)}
//                 onCreateTemplate={handleWizardCreate}
//             />
//
//             <Dialog open={openSaveDialog} onClose={()=>setOpenSaveDialog(false)} PaperProps={{sx:{borderRadius:'16px',p:1,minWidth:380}}}>
//                 <DialogTitle sx={{fontWeight:800,color:NAVY,pb:1}}>Save a Copy</DialogTitle>
//                 <DialogContent><TextField label="New Template Name" value={saveName} onChange={e=>setSaveName(e.target.value)} fullWidth margin="normal" sx={{'& .MuiOutlinedInput-root':{borderRadius:'8px'}}}/></DialogContent>
//                 <DialogActions sx={{px:3,pb:2}}><Button onClick={()=>setOpenSaveDialog(false)} sx={{color:SLATE,textTransform:'none',fontWeight:600}}>Cancel</Button><Button onClick={handleSaveCopy} variant="contained" disabled={!saveName} sx={{bgcolor:MAROON,textTransform:'none',fontWeight:700,borderRadius:'8px','&:hover':{bgcolor:MAROON_DARK}}}>Save</Button></DialogActions>
//             </Dialog>
//         </Box>
//     );
// };
//
// export default BudgetPlanner;
