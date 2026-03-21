import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Slider, alpha,
} from '@mui/material';
import { TrendingUp } from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip as RTooltip, ReferenceLine,
} from 'recharts';

// ── Design tokens (duplicated so this file is self-contained) ─────────────────
const MAROON = '#6b1a1a';
const TEAL   = '#0d9488';
const GREEN  = '#059669';
const AMBER  = '#d97706';
const RED    = '#dc2626';
const NAVY   = '#1e293b';
const SLATE  = '#64748b';
const BLUE   = '#378ADD';

const CAT_COLORS: Record<string,string> = {
    Housing:'#1D9E75', Food:'#6b1a1a', Transportation:'#BA7517',
    Entertainment:'#378ADD', Other:'#D4537E',
};
const CATEGORY_GROUPS: Record<string,string> = {
    Rent:'Housing', Utilities:'Housing', Electric:'Housing', 'Gas Bill':'Housing',
    Groceries:'Food', 'Order out':'Food', 'Coffee Supplies':'Food',
    Gas:'Transportation',
    Golf:'Entertainment', Subscriptions:'Entertainment', 'Trip Cost':'Entertainment', Haircut:'Entertainment',
    Insurance:'Other', 'Phone Insurance':'Other', Payments:'Other', 'Other Stuff':'Other', Savings:'Other',
};
const GROUP_ORDER = ['Housing','Food','Transportation','Entertainment','Other'];
const CAT_PCTS: Record<string,number> = {Housing:.44,Food:.22,Transportation:.09,Entertainment:.16,Other:.09};

const fmtC = (n:number) => (n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString();

// ── Shared types (must match BudgetPlanner.tsx) ───────────────────────────────
interface SpreadsheetRow {
    label: string;
    rowType: 'expense'|'salary'|'expenses'|'balance'|'extra';
    values: (number|null)[];
}
interface SpreadsheetTemplate {
    id: string; name: string; periodType: string;
    months: {name:string;cols:number[]}[];
    periods: string[];
    rows: SpreadsheetRow[];
    viewOverride?: string;
}

function deriveGroupTotals(t:SpreadsheetTemplate):Record<string,number[]>{
    const g:Record<string,number[]>={};
    GROUP_ORDER.forEach(k=>{g[k]=Array(t.periods.length).fill(0);});
    t.rows.filter(r=>r.rowType==='expense').forEach(row=>{
        const grp=CATEGORY_GROUPS[row.label]??'Other';
        row.values.forEach((v,i)=>{if(v!==null)g[grp][i]+=v;});
    });
    return g;
}

// ── Settings interface ────────────────────────────────────────────────────────
interface OptimizerSettings {
    savingsGoalPct: number;
    cushionAmt: number;
    forecastMonths: number;
    catOverrides: Record<string,number>;
}
const DEFAULT_OPTIMIZER: OptimizerSettings = {
    savingsGoalPct: 20,
    cushionAmt: 500,
    forecastMonths: 6,
    catOverrides: {Housing:44,Food:22,Transportation:9,Entertainment:16,Other:9},
};

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { template: SpreadsheetTemplate; }

const BudgetOptimizerPanel: React.FC<Props> = ({template}) => {
    const [tab,setTab]=useState<'goals'|'allocate'|'forecast'>('goals');
    const [settings,setSettings]=useState<OptimizerSettings>(DEFAULT_OPTIMIZER);

    const avgIncome=useMemo(()=>{
        const sal=template.rows.find(r=>r.label==='Salary')?.values.filter((v):v is number=>v!==null)??[];
        return sal.length>0?Math.round(sal.reduce((a,b)=>a+b,0)/sal.length):2000;
    },[template]);

    const startBal=useMemo(()=>{
        const bal=template.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null)??[];
        return bal.length>0?(bal[bal.length-1]??1240):1240;
    },[template]);

    const catAmounts=useMemo(()=>GROUP_ORDER.map(g=>({
        name:g,
        color:CAT_COLORS[g],
        pct:settings.catOverrides[g]??Math.round(CAT_PCTS[g]*100),
        amt:Math.round(avgIncome*(settings.catOverrides[g]??Math.round(CAT_PCTS[g]*100))/100),
    })),[settings.catOverrides,avgIncome]);

    const totalAllocated=catAmounts.reduce((a,c)=>a+c.amt,0);
    const cushionedSavings=Math.max(0,avgIncome-totalAllocated-settings.cushionAmt);
    const goalAmt=Math.round(avgIncome*settings.savingsGoalPct/100);
    const surplusVsGoal=cushionedSavings-goalAmt;

    const forecastData=useMemo(()=>{
        let bal=startBal;
        return Array.from({length:settings.forecastMonths},(_,i)=>{
            const sav=Math.max(0,avgIncome-totalAllocated-settings.cushionAmt);
            bal=Math.round(bal+sav);
            return{month:`M${i+1}`,balance:bal,saved:sav,goal:goalAmt,metGoal:sav>=goalAmt};
        });
    },[settings,avgIncome,totalAllocated,startBal,goalAmt]);

    const suggestions=useMemo(()=>{
        const items:Array<{title:string;desc:string;impact:number;type:'cut'|'reallocate'|'goal'}>=[];
        const gt=deriveGroupTotals(template);
        GROUP_ORDER.forEach(g=>{
            const vals=gt[g].filter(v=>v>0);
            if(!vals.length)return;
            const avgActual=vals.reduce((a,b)=>a+b,0)/vals.length;
            const target=Math.round(avgIncome*CAT_PCTS[g]);
            if(avgActual>target*1.1){
                items.push({title:`Reduce ${g}`,desc:`Avg $${Math.round(avgActual)} vs $${target} target`,impact:Math.round(avgActual-target),type:'cut'});
            }
        });
        if(surplusVsGoal<0)items.push({title:'Raise savings to hit goal',desc:`Need $${Math.abs(Math.round(surplusVsGoal))} more per period`,impact:Math.abs(Math.round(surplusVsGoal)),type:'goal'});
        if(cushionedSavings>goalAmt*1.2&&goalAmt>0)items.push({title:'Invest surplus',desc:`$${Math.round(cushionedSavings-goalAmt)} above goal — route to investments`,impact:Math.round(cushionedSavings-goalAmt),type:'reallocate'});
        return items.slice(0,5);
    },[template,avgIncome,surplusVsGoal,cushionedSavings,goalAmt]);

    // ── Auto-optimize ─────────────────────────────────────────────────────────
    const [optimizeFlash,setOptimizeFlash]=useState(false);

    const autoOptimize=()=>{
        const gt=deriveGroupTotals(template);
        const rawAvgs:Record<string,number>={};
        GROUP_ORDER.forEach(g=>{
            const vals=gt[g].filter(v=>v>0);
            rawAvgs[g]=vals.length>0?vals.reduce((a,b)=>a+b,0)/vals.length:0;
        });
        const rawTotal=Object.values(rawAvgs).reduce((a,b)=>a+b,0);
        const spendBudget=Math.max(0,avgIncome-goalAmt-settings.cushionAmt);
        const newOverrides:Record<string,number>={};
        if(rawTotal>0){
            GROUP_ORDER.forEach(g=>{
                const targetAmt=Math.round((rawAvgs[g]/rawTotal)*spendBudget);
                newOverrides[g]=Math.max(1,Math.round(targetAmt/avgIncome*100));
            });
        } else {
            const scaleFactor=spendBudget/avgIncome;
            GROUP_ORDER.forEach(g=>{
                newOverrides[g]=Math.max(1,Math.round(CAT_PCTS[g]*scaleFactor*100));
            });
        }
        setSettings(s=>({...s,catOverrides:newOverrides}));
        setOptimizeFlash(true);
        setTimeout(()=>setOptimizeFlash(false),1800);
    };

    // ── Chart tooltip ─────────────────────────────────────────────────────────
    const ChartTooltip=({active,payload,label}:any)=>{
        if(!active||!payload?.length)return null;
        return(
            <Box sx={{p:1.25,bgcolor:'#fff',borderRadius:'7px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>
                <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:NAVY,mb:0.5}}>{label}</Typography>
                {payload.map((p:any,i:number)=>(
                    <Box key={i} sx={{display:'flex',alignItems:'center',gap:0.75,mb:0.3}}>
                        <Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:p.stroke||p.fill}}/>
                        <Typography sx={{fontSize:'0.69rem',color:NAVY}}>{p.name}: <strong>{fmtC(p.value)}</strong></Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    const tabs=[
        {key:'goals' as const,label:'Goals'},
        {key:'allocate' as const,label:'Allocate'},
        {key:'forecast' as const,label:'Forecast'},
    ];

    return(
        <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.07)}`,display:'flex',flexDirection:'column'}}>

            {/* ── Header ── */}
            <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 60%,#5a1515 100%)`,position:'relative',overflow:'hidden',flexShrink:0}}>
                <Box sx={{position:'absolute',top:-18,right:-18,width:65,height:65,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.05)'}}/>
                <Box sx={{display:'flex',alignItems:'center',gap:1.25,px:2.5,pt:1.75,pb:0,position:'relative'}}>
                    <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:'rgba(255,255,255,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <TrendingUp size={13} color="white"/>
                    </Box>
                    <Box>
                        <Typography sx={{fontWeight:600,fontSize:'0.86rem',color:'#fff'}}>Budget optimizer</Typography>
                        <Typography sx={{fontSize:'0.62rem',color:'rgba(255,255,255,0.6)',mt:0.1}}>Goals · allocations · forecast</Typography>
                    </Box>
                </Box>
                <Box sx={{display:'flex',px:2,mt:1.25,position:'relative',zIndex:1}}>
                    {tabs.map(({key,label})=>(
                        <Box key={key} onClick={()=>setTab(key)} sx={{
                            px:1.5,py:0.75,fontSize:'0.72rem',fontWeight:500,cursor:'pointer',
                            color:tab===key?'#fff':'rgba(255,255,255,0.5)',
                            borderBottom:`2px solid ${tab===key?'#fff':'transparent'}`,
                            transition:'all 0.15s',whiteSpace:'nowrap',
                            '&:hover':{color:'rgba(255,255,255,0.85)'},
                        }}>{label}</Box>
                    ))}
                </Box>
            </Box>

            {/* ── Body ── */}
            <Box sx={{bgcolor:'#fff',p:2,flex:1,overflowY:'auto'}}>

                {/* ────────── Goals tab ────────── */}
                {tab==='goals'&&(
                    <Box>
                        {/* Savings goal slider */}
                        <Box sx={{mb:2}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.75}}>
                                <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:NAVY}}>Savings goal</Typography>
                                <Box sx={{px:0.875,py:0.2,borderRadius:'4px',bgcolor:alpha(GREEN,0.09)}}>
                                    <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:GREEN}}>{settings.savingsGoalPct}% · {fmtC(goalAmt)}/period</Typography>
                                </Box>
                            </Box>
                            <Slider value={settings.savingsGoalPct} min={5} max={50} step={1}
                                    onChange={(_,v)=>setSettings(s=>({...s,savingsGoalPct:v as number}))}
                                    sx={{color:MAROON,'& .MuiSlider-thumb':{width:14,height:14},'& .MuiSlider-rail':{opacity:0.2}}}/>
                            <Box sx={{display:'flex',justifyContent:'space-between'}}>
                                <Typography sx={{fontSize:'0.66rem',color:SLATE}}>5%</Typography>
                                <Typography sx={{fontSize:'0.66rem',color:SLATE}}>50%</Typography>
                            </Box>
                        </Box>

                        {/* Cushion slider */}
                        <Box sx={{mb:2}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.75}}>
                                <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:NAVY}}>Monthly cushion</Typography>
                                <Box sx={{px:0.875,py:0.2,borderRadius:'4px',bgcolor:alpha(BLUE,0.08)}}>
                                    <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:BLUE}}>{fmtC(settings.cushionAmt)}</Typography>
                                </Box>
                            </Box>
                            <Slider value={settings.cushionAmt} min={0} max={2000} step={50}
                                    onChange={(_,v)=>setSettings(s=>({...s,cushionAmt:v as number}))}
                                    sx={{color:BLUE,'& .MuiSlider-thumb':{width:14,height:14},'& .MuiSlider-rail':{opacity:0.2}}}/>
                            <Box sx={{display:'flex',justifyContent:'space-between'}}>
                                <Typography sx={{fontSize:'0.66rem',color:SLATE}}>$0</Typography>
                                <Typography sx={{fontSize:'0.66rem',color:SLATE}}>$2,000</Typography>
                            </Box>
                        </Box>

                        {/* Forecast horizon */}
                        <Box sx={{mb:2.25}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.75}}>
                                <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:NAVY}}>Forecast horizon</Typography>
                                <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:SLATE}}>{settings.forecastMonths} months</Typography>
                            </Box>
                            <Box sx={{display:'flex',gap:0.75}}>
                                {[3,6,9,12].map(n=>(
                                    <Box key={n} onClick={()=>setSettings(s=>({...s,forecastMonths:n}))} sx={{
                                        flex:1,py:0.6,borderRadius:'5px',cursor:'pointer',textAlign:'center',
                                        fontSize:'0.72rem',fontWeight:600,userSelect:'none',
                                        border:`1px solid ${settings.forecastMonths===n?MAROON:alpha('#000',0.12)}`,
                                        bgcolor:settings.forecastMonths===n?MAROON:'#fff',
                                        color:settings.forecastMonths===n?'#fff':SLATE,
                                        transition:'all .15s',
                                    }}>{n}mo</Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Summary cards */}
                        <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,mb:2}}>
                            {[
                                {label:'Avg income',val:fmtC(avgIncome),color:NAVY},
                                {label:'Goal/period',val:fmtC(goalAmt),color:MAROON},
                                {label:'After cushion',val:fmtC(Math.max(0,avgIncome-totalAllocated-settings.cushionAmt)),color:cushionedSavings>=goalAmt?GREEN:RED},
                                {label:'vs goal',val:(surplusVsGoal>=0?'+':'')+fmtC(surplusVsGoal),color:surplusVsGoal>=0?GREEN:RED},
                            ].map(({label,val,color})=>(
                                <Box key={label} sx={{bgcolor:alpha(color,0.05),border:`1px solid ${alpha(color,0.14)}`,borderRadius:'7px',p:1.125}}>
                                    <Typography sx={{fontSize:'0.64rem',color:alpha(color,0.65),textTransform:'uppercase',letterSpacing:'0.05em',mb:0.3}}>{label}</Typography>
                                    <Typography sx={{fontSize:'0.92rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{val}</Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Suggestions */}
                        {suggestions.length>0&&(
                            <Box>
                                <Typography sx={{fontSize:'0.66rem',textTransform:'uppercase',letterSpacing:'0.06em',color:SLATE,fontWeight:600,mb:1}}>Suggestions</Typography>
                                <Box sx={{display:'flex',flexDirection:'column',gap:0.75}}>
                                    {suggestions.map((s,i)=>(
                                        <Box key={i} sx={{display:'flex',alignItems:'flex-start',gap:0.875,p:1,borderRadius:'6px',bgcolor:alpha('#000',0.018),border:`1px solid ${alpha('#000',0.06)}`}}>
                                            <Box sx={{
                                                width:18,height:18,borderRadius:'4px',flexShrink:0,
                                                display:'flex',alignItems:'center',justifyContent:'center',
                                                fontSize:'10px',fontWeight:700,
                                                bgcolor:s.type==='cut'?alpha(RED,0.09):s.type==='goal'?alpha(AMBER,0.1):alpha(GREEN,0.09),
                                                color:s.type==='cut'?RED:s.type==='goal'?AMBER:GREEN,
                                            }}>{s.type==='cut'?'↓':s.type==='goal'?'!':'↗'}</Box>
                                            <Box sx={{flex:1,minWidth:0}}>
                                                <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:NAVY}}>{s.title}</Typography>
                                                <Typography sx={{fontSize:'0.64rem',color:SLATE,lineHeight:1.35}}>{s.desc}</Typography>
                                            </Box>
                                            <Typography sx={{fontSize:'0.68rem',fontWeight:600,color:s.type==='cut'?RED:GREEN,flexShrink:0}}>
                                                {s.type==='cut'?'-':'+'}${s.impact.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ────────── Allocate tab ────────── */}
                {tab==='allocate'&&(
                    <Box>
                        {/* Header row: hint + auto-optimize button */}
                        <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.75}}>
                            <Box sx={{flex:1,px:0.875,py:0.75,borderRadius:'6px',bgcolor:alpha(MAROON,0.04),border:`1px solid ${alpha(MAROON,0.1)}`}}>
                                <Typography sx={{fontSize:'0.69rem',color:MAROON,fontWeight:500,lineHeight:1.4}}>
                                    Drag sliders · Income: {fmtC(avgIncome)}/period
                                </Typography>
                            </Box>
                            <Box
                                onClick={autoOptimize}
                                sx={{
                                    px:1.25,py:0.75,borderRadius:'6px',cursor:'pointer',flexShrink:0,
                                    border:`1px solid ${optimizeFlash?GREEN:alpha(MAROON,0.25)}`,
                                    bgcolor:optimizeFlash?alpha(GREEN,0.08):alpha(MAROON,0.06),
                                    transition:'all 0.2s',
                                    '&:hover':{bgcolor:alpha(MAROON,0.12),borderColor:MAROON},
                                }}
                            >
                                <Typography sx={{fontSize:'0.69rem',fontWeight:600,color:optimizeFlash?GREEN:MAROON,whiteSpace:'nowrap'}}>
                                    {optimizeFlash?'✓ Applied':'⚡ Auto-optimize'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Auto-optimize explanation when just applied */}
                        {optimizeFlash&&(
                            <Box sx={{mb:1.5,p:1,borderRadius:'6px',bgcolor:alpha(GREEN,0.06),border:`1px solid ${alpha(GREEN,0.2)}`}}>
                                <Typography sx={{fontSize:'0.68rem',color:GREEN,lineHeight:1.4}}>
                                    Allocations scaled from your actual spend history to fit within your {settings.savingsGoalPct}% savings goal and {fmtC(settings.cushionAmt)} cushion.
                                </Typography>
                            </Box>
                        )}

                        {catAmounts.map(({name,color,pct,amt})=>(
                            <Box key={name} sx={{mb:1.75}}>
                                <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',mb:0.5}}>
                                    <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
                                        <Box sx={{width:9,height:9,borderRadius:'2px',bgcolor:color,flexShrink:0}}/>
                                        <Typography sx={{fontSize:'0.74rem',fontWeight:600,color:NAVY}}>{name}</Typography>
                                    </Box>
                                    <Box sx={{display:'flex',gap:0.75,alignItems:'center'}}>
                                        <Typography sx={{fontSize:'0.7rem',color:SLATE}}>{pct}%</Typography>
                                        <Box sx={{px:0.625,py:0.1,borderRadius:'3px',bgcolor:alpha(color,0.08)}}>
                                            <Typography sx={{fontSize:'0.7rem',fontWeight:600,color}}>{fmtC(amt)}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Slider value={pct} min={0} max={60} step={1}
                                        onChange={(_,v)=>setSettings(s=>({...s,catOverrides:{...s.catOverrides,[name]:v as number}}))}
                                        sx={{color,py:0.5,'& .MuiSlider-thumb':{width:13,height:13},'& .MuiSlider-rail':{opacity:0.18},'& .MuiSlider-track':{border:'none'}}}/>
                            </Box>
                        ))}

                        {/* Allocation breakdown bar */}
                        <Box sx={{mt:1.5}}>
                            <Box sx={{display:'flex',justifyContent:'space-between',mb:0.625}}>
                                <Typography sx={{fontSize:'0.68rem',color:SLATE}}>Total allocated</Typography>
                                <Typography sx={{fontSize:'0.68rem',fontWeight:600,color:totalAllocated>avgIncome?RED:NAVY}}>
                                    {fmtC(totalAllocated)} / {fmtC(avgIncome)}
                                </Typography>
                            </Box>
                            <Box sx={{height:8,borderRadius:4,bgcolor:alpha('#000',0.06),overflow:'hidden',display:'flex'}}>
                                {catAmounts.map(({name,color,amt})=>(
                                    <Box key={name} sx={{flex:`${Math.max(amt,0)}`,bgcolor:color,height:'100%',transition:'flex 0.2s',minWidth:0}}/>
                                ))}
                                {avgIncome-totalAllocated-settings.cushionAmt>0&&(
                                    <Box sx={{flex:`${Math.max(avgIncome-totalAllocated-settings.cushionAmt,0)}`,bgcolor:GREEN,height:'100%',opacity:0.7}}/>
                                )}
                                {settings.cushionAmt>0&&(
                                    <Box sx={{flex:`${settings.cushionAmt}`,bgcolor:BLUE,height:'100%',opacity:0.5}}/>
                                )}
                            </Box>
                            <Box sx={{display:'flex',gap:1,mt:0.875,flexWrap:'wrap'}}>
                                {catAmounts.filter(c=>c.amt>0).map(({name,color,pct})=>(
                                    <Box key={name} sx={{display:'flex',alignItems:'center',gap:0.4}}>
                                        <Box sx={{width:7,height:7,borderRadius:'1px',bgcolor:color}}/>
                                        <Typography sx={{fontSize:'0.62rem',color:SLATE}}>{name} {pct}%</Typography>
                                    </Box>
                                ))}
                                <Box sx={{display:'flex',alignItems:'center',gap:0.4}}>
                                    <Box sx={{width:7,height:7,borderRadius:'1px',bgcolor:GREEN}}/>
                                    <Typography sx={{fontSize:'0.62rem',color:SLATE}}>Savings</Typography>
                                </Box>
                                <Box sx={{display:'flex',alignItems:'center',gap:0.4}}>
                                    <Box sx={{width:7,height:7,borderRadius:'1px',bgcolor:BLUE}}/>
                                    <Typography sx={{fontSize:'0.62rem',color:SLATE}}>Cushion</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{mt:1.75,p:1.125,borderRadius:'6px',bgcolor:cushionedSavings>=goalAmt?alpha(GREEN,0.05):alpha(RED,0.04),border:`1px solid ${alpha(cushionedSavings>=goalAmt?GREEN:RED,0.18)}`}}>
                            <Box sx={{display:'flex',justifyContent:'space-between'}}>
                                <Typography sx={{fontSize:'0.7rem',color:SLATE}}>Projected savings/period</Typography>
                                <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:cushionedSavings>=goalAmt?GREEN:RED}}>{fmtC(cushionedSavings)}</Typography>
                            </Box>
                            <Box sx={{display:'flex',justifyContent:'space-between',mt:0.25}}>
                                <Typography sx={{fontSize:'0.7rem',color:SLATE}}>vs {settings.savingsGoalPct}% goal</Typography>
                                <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:surplusVsGoal>=0?GREEN:RED}}>
                                    {surplusVsGoal>=0?'+':''}{fmtC(surplusVsGoal)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* ────────── Forecast tab ────────── */}
                {tab==='forecast'&&(
                    <Box>
                        <Typography sx={{fontSize:'0.66rem',textTransform:'uppercase',letterSpacing:'0.06em',color:SLATE,fontWeight:600,mb:1.25}}>
                            Balance &amp; savings projection
                        </Typography>

                        {/* Dual-line chart */}
                        <Box sx={{mb:1.5}}>
                            <ResponsiveContainer width="100%" height={170}>
                                <LineChart data={forecastData} margin={{top:4,right:4,left:0,bottom:4}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.05)} vertical={false}/>
                                    <XAxis dataKey="month" tick={{fontSize:9,fill:SLATE}} tickLine={false} axisLine={false}/>
                                    <YAxis tick={{fontSize:9,fill:SLATE}} tickLine={false} axisLine={false} width={44}
                                           tickFormatter={(v:number)=>v>=1000?`$${Math.round(v/1000)}k`:`$${v}`}/>
                                    <RTooltip content={<ChartTooltip/>}/>
                                    <ReferenceLine y={startBal} stroke={alpha(NAVY,0.2)} strokeDasharray="3 2" strokeWidth={1}/>
                                    <ReferenceLine y={goalAmt} stroke={alpha(GREEN,0.4)} strokeDasharray="4 2" strokeWidth={1}
                                                   label={{value:`Goal ${fmtC(goalAmt)}`,position:'insideTopRight',fontSize:8,fill:alpha(GREEN,0.7)}}/>
                                    <Line type="monotone" dataKey="balance" name="Balance" stroke={BLUE} strokeWidth={2.5}
                                          dot={(props:any)=>{
                                              const{cx,cy,payload}=props;
                                              return<circle key={payload.month} cx={cx} cy={cy} r={3.5}
                                                            fill={payload.balance>=startBal?BLUE:RED} stroke="#fff" strokeWidth={1.5}/>;
                                          }} activeDot={{r:5}}/>
                                    <Line type="monotone" dataKey="saved" name="Saved/period" stroke={GREEN}
                                          strokeWidth={2} strokeDasharray="5 2" dot={false} activeDot={{r:4}}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>

                        {/* Chart legend */}
                        <Box sx={{display:'flex',gap:2,mb:1.75,pl:0.5}}>
                            {[
                                {color:BLUE,label:'Balance',dashed:false},
                                {color:GREEN,label:'Saved/period',dashed:true},
                                {color:alpha(GREEN,0.5),label:`Goal ${fmtC(goalAmt)}`,dashed:true},
                            ].map(({color,label,dashed})=>(
                                <Box key={label} sx={{display:'flex',alignItems:'center',gap:0.5}}>
                                    <Box sx={{width:14,height:2,bgcolor:dashed?'transparent':'#fff',borderTop:dashed?`2px dashed ${color}`:`2px solid ${color}`,flexShrink:0}}/>
                                    <Typography sx={{fontSize:'0.62rem',color:SLATE}}>{label}</Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Period breakdown table */}
                        <Box sx={{borderRadius:'7px',overflow:'hidden',border:`1px solid ${alpha('#000',0.08)}`}}>
                            <Box sx={{display:'grid',gridTemplateColumns:'42px 1fr 1fr 52px',bgcolor:alpha(MAROON,0.04),borderBottom:`1px solid ${alpha(MAROON,0.12)}`}}>
                                {['Mo','Saved','Balance','Goal'].map(h=>(
                                    <Typography key={h} sx={{fontSize:'0.62rem',fontWeight:600,color:MAROON,textTransform:'uppercase',letterSpacing:'0.05em',py:0.875,px:1}}>{h}</Typography>
                                ))}
                            </Box>
                            {forecastData.map((d,i)=>(
                                <Box key={i} sx={{display:'grid',gridTemplateColumns:'42px 1fr 1fr 52px',borderBottom:i<forecastData.length-1?`1px solid ${alpha('#000',0.05)}`:'none',bgcolor:d.metGoal?alpha(GREEN,0.02):'#fff'}}>
                                    <Typography sx={{fontSize:'0.72rem',color:SLATE,py:0.875,px:1}}>{d.month}</Typography>
                                    <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:d.metGoal?GREEN:RED,py:0.875,px:1,fontVariantNumeric:'tabular-nums'}}>{fmtC(d.saved)}</Typography>
                                    <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:d.balance>=startBal?BLUE:RED,py:0.875,px:1,fontVariantNumeric:'tabular-nums'}}>{fmtC(d.balance)}</Typography>
                                    <Box sx={{display:'flex',alignItems:'center',py:0.875,px:1}}>
                                        <Box sx={{width:6,height:6,borderRadius:'50%',bgcolor:d.metGoal?GREEN:RED,flexShrink:0,mr:0.5}}/>
                                        <Typography sx={{fontSize:'0.66rem',color:d.metGoal?GREEN:RED}}>{d.metGoal?'Met':'Miss'}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* Final summary cards */}
                        <Box sx={{mt:1.5,display:'grid',gridTemplateColumns:'1fr 1fr',gap:0.875}}>
                            {[
                                {label:'Final balance',val:fmtC(forecastData[forecastData.length-1]?.balance??startBal),color:BLUE},
                                {label:'Total saved',val:fmtC(forecastData.reduce((a,d)=>a+d.saved,0)),color:GREEN},
                                {label:'Goals met',val:`${forecastData.filter(d=>d.metGoal).length}/${forecastData.length}`,color:MAROON},
                                {label:'Cushion safe',val:forecastData.every(d=>d.balance>=settings.cushionAmt)?'Always':'Risk',color:forecastData.every(d=>d.balance>=settings.cushionAmt)?GREEN:RED},
                            ].map(({label,val,color})=>(
                                <Box key={label} sx={{bgcolor:alpha(color,0.04),border:`1px solid ${alpha(color,0.13)}`,borderRadius:'6px',p:1}}>
                                    <Typography sx={{fontSize:'0.62rem',color:alpha(color,0.6),textTransform:'uppercase',letterSpacing:'0.04em',mb:0.2}}>{label}</Typography>
                                    <Typography sx={{fontSize:'0.86rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{val}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default BudgetOptimizerPanel;

// import React, { useState, useMemo } from 'react';
// import {
//     Box, Typography, Slider, alpha,
// } from '@mui/material';
// import { TrendingUp } from 'lucide-react';
// import {
//     ResponsiveContainer, LineChart, Line, XAxis, YAxis,
//     CartesianGrid, Tooltip as RTooltip, ReferenceLine,
// } from 'recharts';
//
// // ── Design tokens (duplicated so this file is self-contained) ─────────────────
// const MAROON = '#6b1a1a';
// const TEAL   = '#0d9488';
// const GREEN  = '#059669';
// const AMBER  = '#d97706';
// const RED    = '#dc2626';
// const NAVY   = '#1e293b';
// const SLATE  = '#64748b';
// const BLUE   = '#378ADD';
//
// const CAT_COLORS: Record<string,string> = {
//     Housing:'#1D9E75', Food:'#6b1a1a', Transportation:'#BA7517',
//     Entertainment:'#378ADD', Other:'#D4537E',
// };
// const CATEGORY_GROUPS: Record<string,string> = {
//     Rent:'Housing', Utilities:'Housing', Electric:'Housing', 'Gas Bill':'Housing',
//     Groceries:'Food', 'Order out':'Food', 'Coffee Supplies':'Food',
//     Gas:'Transportation',
//     Golf:'Entertainment', Subscriptions:'Entertainment', 'Trip Cost':'Entertainment', Haircut:'Entertainment',
//     Insurance:'Other', 'Phone Insurance':'Other', Payments:'Other', 'Other Stuff':'Other', Savings:'Other',
// };
// const GROUP_ORDER = ['Housing','Food','Transportation','Entertainment','Other'];
// const CAT_PCTS: Record<string,number> = {Housing:.44,Food:.22,Transportation:.09,Entertainment:.16,Other:.09};
//
// const fmtC = (n:number) => (n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString();
//
// // ── Shared types (must match BudgetPlanner.tsx) ───────────────────────────────
// interface SpreadsheetRow {
//     label: string;
//     rowType: 'expense'|'salary'|'expenses'|'balance'|'extra';
//     values: (number|null)[];
// }
// interface SpreadsheetTemplate {
//     id: string; name: string; periodType: string;
//     months: {name:string;cols:number[]}[];
//     periods: string[];
//     rows: SpreadsheetRow[];
//     viewOverride?: string;
// }
//
// function deriveGroupTotals(t:SpreadsheetTemplate):Record<string,number[]>{
//     const g:Record<string,number[]>={};
//     GROUP_ORDER.forEach(k=>{g[k]=Array(t.periods.length).fill(0);});
//     t.rows.filter(r=>r.rowType==='expense').forEach(row=>{
//         const grp=CATEGORY_GROUPS[row.label]??'Other';
//         row.values.forEach((v,i)=>{if(v!==null)g[grp][i]+=v;});
//     });
//     return g;
// }
//
// // ── Settings interface ────────────────────────────────────────────────────────
// interface OptimizerSettings {
//     savingsGoalPct: number;
//     cushionAmt: number;
//     forecastMonths: number;
//     catOverrides: Record<string,number>;
// }
// const DEFAULT_OPTIMIZER: OptimizerSettings = {
//     savingsGoalPct: 20,
//     cushionAmt: 500,
//     forecastMonths: 6,
//     catOverrides: {Housing:44,Food:22,Transportation:9,Entertainment:16,Other:9},
// };
//
// // ── Component ─────────────────────────────────────────────────────────────────
// interface Props { template: SpreadsheetTemplate; }
//
// const BudgetOptimizerPanel: React.FC<Props> = ({template}) => {
//     const [tab,setTab]=useState<'goals'|'allocate'|'forecast'>('goals');
//     const [settings,setSettings]=useState<OptimizerSettings>(DEFAULT_OPTIMIZER);
//
//     const avgIncome=useMemo(()=>{
//         const sal=template.rows.find(r=>r.label==='Salary')?.values.filter((v):v is number=>v!==null)??[];
//         return sal.length>0?Math.round(sal.reduce((a,b)=>a+b,0)/sal.length):2000;
//     },[template]);
//
//     const startBal=useMemo(()=>{
//         const bal=template.rows.find(r=>r.rowType==='balance')?.values.filter((v):v is number=>v!==null)??[];
//         return bal.length>0?(bal[bal.length-1]??1240):1240;
//     },[template]);
//
//     const catAmounts=useMemo(()=>GROUP_ORDER.map(g=>({
//         name:g,
//         color:CAT_COLORS[g],
//         pct:settings.catOverrides[g]??Math.round(CAT_PCTS[g]*100),
//         amt:Math.round(avgIncome*(settings.catOverrides[g]??Math.round(CAT_PCTS[g]*100))/100),
//     })),[settings.catOverrides,avgIncome]);
//
//     const totalAllocated=catAmounts.reduce((a,c)=>a+c.amt,0);
//     const cushionedSavings=Math.max(0,avgIncome-totalAllocated-settings.cushionAmt);
//     const goalAmt=Math.round(avgIncome*settings.savingsGoalPct/100);
//     const surplusVsGoal=cushionedSavings-goalAmt;
//
//     const forecastData=useMemo(()=>{
//         let bal=startBal;
//         return Array.from({length:settings.forecastMonths},(_,i)=>{
//             const sav=Math.max(0,avgIncome-totalAllocated-settings.cushionAmt);
//             bal=Math.round(bal+sav);
//             return{month:`M${i+1}`,balance:bal,saved:sav,goal:goalAmt,metGoal:sav>=goalAmt};
//         });
//     },[settings,avgIncome,totalAllocated,startBal,goalAmt]);
//
//     const suggestions=useMemo(()=>{
//         const items:Array<{title:string;desc:string;impact:number;type:'cut'|'reallocate'|'goal'}>=[];
//         const gt=deriveGroupTotals(template);
//         GROUP_ORDER.forEach(g=>{
//             const vals=gt[g].filter(v=>v>0);
//             if(!vals.length)return;
//             const avgActual=vals.reduce((a,b)=>a+b,0)/vals.length;
//             const target=Math.round(avgIncome*CAT_PCTS[g]);
//             if(avgActual>target*1.1){
//                 items.push({title:`Reduce ${g}`,desc:`Avg $${Math.round(avgActual)} vs $${target} target`,impact:Math.round(avgActual-target),type:'cut'});
//             }
//         });
//         if(surplusVsGoal<0)items.push({title:'Raise savings to hit goal',desc:`Need $${Math.abs(Math.round(surplusVsGoal))} more per period`,impact:Math.abs(Math.round(surplusVsGoal)),type:'goal'});
//         if(cushionedSavings>goalAmt*1.2&&goalAmt>0)items.push({title:'Invest surplus',desc:`$${Math.round(cushionedSavings-goalAmt)} above goal — route to investments`,impact:Math.round(cushionedSavings-goalAmt),type:'reallocate'});
//         return items.slice(0,5);
//     },[template,avgIncome,surplusVsGoal,cushionedSavings,goalAmt]);
//
//     const ChartTooltip=({active,payload,label}:any)=>{
//         if(!active||!payload?.length)return null;
//         return(
//             <Box sx={{p:1.25,bgcolor:'#fff',borderRadius:'7px',boxShadow:'0 4px 12px rgba(0,0,0,0.12)',border:`1px solid ${alpha('#000',0.08)}`}}>
//                 <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:NAVY,mb:0.5}}>{label}</Typography>
//                 {payload.map((p:any,i:number)=>(
//                     <Box key={i} sx={{display:'flex',alignItems:'center',gap:0.75,mb:0.3}}>
//                         <Box sx={{width:7,height:7,borderRadius:'50%',bgcolor:p.stroke||p.fill}}/>
//                         <Typography sx={{fontSize:'0.69rem',color:NAVY}}>{p.name}: <strong>{fmtC(p.value)}</strong></Typography>
//                     </Box>
//                 ))}
//             </Box>
//         );
//     };
//
//     const tabs=[
//         {key:'goals' as const,label:'Goals'},
//         {key:'allocate' as const,label:'Allocate'},
//         {key:'forecast' as const,label:'Forecast'},
//     ];
//
//     return(
//         <Box sx={{borderRadius:'12px',overflow:'hidden',border:`1px solid ${alpha(MAROON,0.15)}`,boxShadow:`0 4px 20px ${alpha(MAROON,0.07)}`,display:'flex',flexDirection:'column'}}>
//
//             {/* ── Header ── */}
//             <Box sx={{background:`linear-gradient(135deg,#4a1010 0%,#6b1a1a 60%,#5a1515 100%)`,position:'relative',overflow:'hidden',flexShrink:0}}>
//                 <Box sx={{position:'absolute',top:-18,right:-18,width:65,height:65,borderRadius:'50%',bgcolor:'rgba(255,255,255,0.05)'}}/>
//                 <Box sx={{display:'flex',alignItems:'center',gap:1.25,px:2.5,pt:1.75,pb:0,position:'relative'}}>
//                     <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:'rgba(255,255,255,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
//                         <TrendingUp size={13} color="white"/>
//                     </Box>
//                     <Box>
//                         <Typography sx={{fontWeight:600,fontSize:'0.86rem',color:'#fff'}}>Budget optimizer</Typography>
//                         <Typography sx={{fontSize:'0.62rem',color:'rgba(255,255,255,0.6)',mt:0.1}}>Goals · allocations · forecast</Typography>
//                     </Box>
//                 </Box>
//                 <Box sx={{display:'flex',px:2,mt:1.25,position:'relative',zIndex:1}}>
//                     {tabs.map(({key,label})=>(
//                         <Box key={key} onClick={()=>setTab(key)} sx={{
//                             px:1.5,py:0.75,fontSize:'0.72rem',fontWeight:500,cursor:'pointer',
//                             color:tab===key?'#fff':'rgba(255,255,255,0.5)',
//                             borderBottom:`2px solid ${tab===key?'#fff':'transparent'}`,
//                             transition:'all 0.15s',whiteSpace:'nowrap',
//                             '&:hover':{color:'rgba(255,255,255,0.85)'},
//                         }}>{label}</Box>
//                     ))}
//                 </Box>
//             </Box>
//
//             {/* ── Body ── */}
//             <Box sx={{bgcolor:'#fff',p:2,flex:1,overflowY:'auto'}}>
//
//                 {/* ────────── Goals tab ────────── */}
//                 {tab==='goals'&&(
//                     <Box>
//                         {/* Savings goal slider */}
//                         <Box sx={{mb:2}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.75}}>
//                                 <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:NAVY}}>Savings goal</Typography>
//                                 <Box sx={{px:0.875,py:0.2,borderRadius:'4px',bgcolor:alpha(GREEN,0.09)}}>
//                                     <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:GREEN}}>{settings.savingsGoalPct}% · {fmtC(goalAmt)}/period</Typography>
//                                 </Box>
//                             </Box>
//                             <Slider value={settings.savingsGoalPct} min={5} max={50} step={1}
//                                     onChange={(_,v)=>setSettings(s=>({...s,savingsGoalPct:v as number}))}
//                                     sx={{color:MAROON,'& .MuiSlider-thumb':{width:14,height:14},'& .MuiSlider-rail':{opacity:0.2}}}/>
//                             <Box sx={{display:'flex',justifyContent:'space-between'}}>
//                                 <Typography sx={{fontSize:'0.66rem',color:SLATE}}>5%</Typography>
//                                 <Typography sx={{fontSize:'0.66rem',color:SLATE}}>50%</Typography>
//                             </Box>
//                         </Box>
//
//                         {/* Cushion slider */}
//                         <Box sx={{mb:2}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.75}}>
//                                 <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:NAVY}}>Monthly cushion</Typography>
//                                 <Box sx={{px:0.875,py:0.2,borderRadius:'4px',bgcolor:alpha(BLUE,0.08)}}>
//                                     <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:BLUE}}>{fmtC(settings.cushionAmt)}</Typography>
//                                 </Box>
//                             </Box>
//                             <Slider value={settings.cushionAmt} min={0} max={2000} step={50}
//                                     onChange={(_,v)=>setSettings(s=>({...s,cushionAmt:v as number}))}
//                                     sx={{color:BLUE,'& .MuiSlider-thumb':{width:14,height:14},'& .MuiSlider-rail':{opacity:0.2}}}/>
//                             <Box sx={{display:'flex',justifyContent:'space-between'}}>
//                                 <Typography sx={{fontSize:'0.66rem',color:SLATE}}>$0</Typography>
//                                 <Typography sx={{fontSize:'0.66rem',color:SLATE}}>$2,000</Typography>
//                             </Box>
//                         </Box>
//
//                         {/* Forecast horizon */}
//                         <Box sx={{mb:2.25}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.75}}>
//                                 <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:NAVY}}>Forecast horizon</Typography>
//                                 <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:SLATE}}>{settings.forecastMonths} months</Typography>
//                             </Box>
//                             <Box sx={{display:'flex',gap:0.75}}>
//                                 {[3,6,9,12].map(n=>(
//                                     <Box key={n} onClick={()=>setSettings(s=>({...s,forecastMonths:n}))} sx={{
//                                         flex:1,py:0.6,borderRadius:'5px',cursor:'pointer',textAlign:'center',
//                                         fontSize:'0.72rem',fontWeight:600,userSelect:'none',
//                                         border:`1px solid ${settings.forecastMonths===n?MAROON:alpha('#000',0.12)}`,
//                                         bgcolor:settings.forecastMonths===n?MAROON:'#fff',
//                                         color:settings.forecastMonths===n?'#fff':SLATE,
//                                         transition:'all .15s',
//                                     }}>{n}mo</Box>
//                                 ))}
//                             </Box>
//                         </Box>
//
//                         {/* Summary cards */}
//                         <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,mb:2}}>
//                             {[
//                                 {label:'Avg income',val:fmtC(avgIncome),color:NAVY},
//                                 {label:'Goal/period',val:fmtC(goalAmt),color:MAROON},
//                                 {label:'After cushion',val:fmtC(Math.max(0,avgIncome-totalAllocated-settings.cushionAmt)),color:cushionedSavings>=goalAmt?GREEN:RED},
//                                 {label:'vs goal',val:(surplusVsGoal>=0?'+':'')+fmtC(surplusVsGoal),color:surplusVsGoal>=0?GREEN:RED},
//                             ].map(({label,val,color})=>(
//                                 <Box key={label} sx={{bgcolor:alpha(color,0.05),border:`1px solid ${alpha(color,0.14)}`,borderRadius:'7px',p:1.125}}>
//                                     <Typography sx={{fontSize:'0.64rem',color:alpha(color,0.65),textTransform:'uppercase',letterSpacing:'0.05em',mb:0.3}}>{label}</Typography>
//                                     <Typography sx={{fontSize:'0.92rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{val}</Typography>
//                                 </Box>
//                             ))}
//                         </Box>
//
//                         {/* Suggestions */}
//                         {suggestions.length>0&&(
//                             <Box>
//                                 <Typography sx={{fontSize:'0.66rem',textTransform:'uppercase',letterSpacing:'0.06em',color:SLATE,fontWeight:600,mb:1}}>Suggestions</Typography>
//                                 <Box sx={{display:'flex',flexDirection:'column',gap:0.75}}>
//                                     {suggestions.map((s,i)=>(
//                                         <Box key={i} sx={{display:'flex',alignItems:'flex-start',gap:0.875,p:1,borderRadius:'6px',bgcolor:alpha('#000',0.018),border:`1px solid ${alpha('#000',0.06)}`}}>
//                                             <Box sx={{
//                                                 width:18,height:18,borderRadius:'4px',flexShrink:0,
//                                                 display:'flex',alignItems:'center',justifyContent:'center',
//                                                 fontSize:'10px',fontWeight:700,
//                                                 bgcolor:s.type==='cut'?alpha(RED,0.09):s.type==='goal'?alpha(AMBER,0.1):alpha(GREEN,0.09),
//                                                 color:s.type==='cut'?RED:s.type==='goal'?AMBER:GREEN,
//                                             }}>{s.type==='cut'?'↓':s.type==='goal'?'!':'↗'}</Box>
//                                             <Box sx={{flex:1,minWidth:0}}>
//                                                 <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:NAVY}}>{s.title}</Typography>
//                                                 <Typography sx={{fontSize:'0.64rem',color:SLATE,lineHeight:1.35}}>{s.desc}</Typography>
//                                             </Box>
//                                             <Typography sx={{fontSize:'0.68rem',fontWeight:600,color:s.type==='cut'?RED:GREEN,flexShrink:0}}>
//                                                 {s.type==='cut'?'-':'+'}${s.impact.toLocaleString()}
//                                             </Typography>
//                                         </Box>
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}
//                     </Box>
//                 )}
//
//                 {/* ────────── Allocate tab ────────── */}
//                 {tab==='allocate'&&(
//                     <Box>
//                         <Box sx={{mb:1.5,px:0.5,py:0.875,borderRadius:'6px',bgcolor:alpha(MAROON,0.04),border:`1px solid ${alpha(MAROON,0.1)}`}}>
//                             <Typography sx={{fontSize:'0.7rem',color:MAROON,fontWeight:500}}>
//                                 Drag sliders to set target % per category · Income: {fmtC(avgIncome)}/period
//                             </Typography>
//                         </Box>
//
//                         {catAmounts.map(({name,color,pct,amt})=>(
//                             <Box key={name} sx={{mb:1.75}}>
//                                 <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',mb:0.5}}>
//                                     <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
//                                         <Box sx={{width:9,height:9,borderRadius:'2px',bgcolor:color,flexShrink:0}}/>
//                                         <Typography sx={{fontSize:'0.74rem',fontWeight:600,color:NAVY}}>{name}</Typography>
//                                     </Box>
//                                     <Box sx={{display:'flex',gap:0.75,alignItems:'center'}}>
//                                         <Typography sx={{fontSize:'0.7rem',color:SLATE}}>{pct}%</Typography>
//                                         <Box sx={{px:0.625,py:0.1,borderRadius:'3px',bgcolor:alpha(color,0.08)}}>
//                                             <Typography sx={{fontSize:'0.7rem',fontWeight:600,color}}>{fmtC(amt)}</Typography>
//                                         </Box>
//                                     </Box>
//                                 </Box>
//                                 <Slider value={pct} min={0} max={60} step={1}
//                                         onChange={(_,v)=>setSettings(s=>({...s,catOverrides:{...s.catOverrides,[name]:v as number}}))}
//                                         sx={{color,py:0.5,'& .MuiSlider-thumb':{width:13,height:13},'& .MuiSlider-rail':{opacity:0.18},'& .MuiSlider-track':{border:'none'}}}/>
//                             </Box>
//                         ))}
//
//                         {/* Allocation breakdown bar */}
//                         <Box sx={{mt:1.5}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between',mb:0.625}}>
//                                 <Typography sx={{fontSize:'0.68rem',color:SLATE}}>Total allocated</Typography>
//                                 <Typography sx={{fontSize:'0.68rem',fontWeight:600,color:totalAllocated>avgIncome?RED:NAVY}}>
//                                     {fmtC(totalAllocated)} / {fmtC(avgIncome)}
//                                 </Typography>
//                             </Box>
//                             <Box sx={{height:8,borderRadius:4,bgcolor:alpha('#000',0.06),overflow:'hidden',display:'flex'}}>
//                                 {catAmounts.map(({name,color,amt})=>(
//                                     <Box key={name} sx={{flex:`${Math.max(amt,0)}`,bgcolor:color,height:'100%',transition:'flex 0.2s',minWidth:0}}/>
//                                 ))}
//                                 {avgIncome-totalAllocated-settings.cushionAmt>0&&(
//                                     <Box sx={{flex:`${Math.max(avgIncome-totalAllocated-settings.cushionAmt,0)}`,bgcolor:GREEN,height:'100%',opacity:0.7}}/>
//                                 )}
//                                 {settings.cushionAmt>0&&(
//                                     <Box sx={{flex:`${settings.cushionAmt}`,bgcolor:BLUE,height:'100%',opacity:0.5}}/>
//                                 )}
//                             </Box>
//                             <Box sx={{display:'flex',gap:1,mt:0.875,flexWrap:'wrap'}}>
//                                 {catAmounts.filter(c=>c.amt>0).map(({name,color,pct})=>(
//                                     <Box key={name} sx={{display:'flex',alignItems:'center',gap:0.4}}>
//                                         <Box sx={{width:7,height:7,borderRadius:'1px',bgcolor:color}}/>
//                                         <Typography sx={{fontSize:'0.62rem',color:SLATE}}>{name} {pct}%</Typography>
//                                     </Box>
//                                 ))}
//                                 <Box sx={{display:'flex',alignItems:'center',gap:0.4}}>
//                                     <Box sx={{width:7,height:7,borderRadius:'1px',bgcolor:GREEN}}/>
//                                     <Typography sx={{fontSize:'0.62rem',color:SLATE}}>Savings</Typography>
//                                 </Box>
//                                 <Box sx={{display:'flex',alignItems:'center',gap:0.4}}>
//                                     <Box sx={{width:7,height:7,borderRadius:'1px',bgcolor:BLUE}}/>
//                                     <Typography sx={{fontSize:'0.62rem',color:SLATE}}>Cushion</Typography>
//                                 </Box>
//                             </Box>
//                         </Box>
//
//                         <Box sx={{mt:1.75,p:1.125,borderRadius:'6px',bgcolor:cushionedSavings>=goalAmt?alpha(GREEN,0.05):alpha(RED,0.04),border:`1px solid ${alpha(cushionedSavings>=goalAmt?GREEN:RED,0.18)}`}}>
//                             <Box sx={{display:'flex',justifyContent:'space-between'}}>
//                                 <Typography sx={{fontSize:'0.7rem',color:SLATE}}>Projected savings/period</Typography>
//                                 <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:cushionedSavings>=goalAmt?GREEN:RED}}>{fmtC(cushionedSavings)}</Typography>
//                             </Box>
//                             <Box sx={{display:'flex',justifyContent:'space-between',mt:0.25}}>
//                                 <Typography sx={{fontSize:'0.7rem',color:SLATE}}>vs {settings.savingsGoalPct}% goal</Typography>
//                                 <Typography sx={{fontSize:'0.7rem',fontWeight:600,color:surplusVsGoal>=0?GREEN:RED}}>
//                                     {surplusVsGoal>=0?'+':''}{fmtC(surplusVsGoal)}
//                                 </Typography>
//                             </Box>
//                         </Box>
//                     </Box>
//                 )}
//
//                 {/* ────────── Forecast tab ────────── */}
//                 {tab==='forecast'&&(
//                     <Box>
//                         <Typography sx={{fontSize:'0.66rem',textTransform:'uppercase',letterSpacing:'0.06em',color:SLATE,fontWeight:600,mb:1.25}}>
//                             Balance &amp; savings projection
//                         </Typography>
//
//                         {/* Dual-line chart */}
//                         <Box sx={{mb:1.5}}>
//                             <ResponsiveContainer width="100%" height={170}>
//                                 <LineChart data={forecastData} margin={{top:4,right:4,left:0,bottom:4}}>
//                                     <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000',0.05)} vertical={false}/>
//                                     <XAxis dataKey="month" tick={{fontSize:9,fill:SLATE}} tickLine={false} axisLine={false}/>
//                                     <YAxis tick={{fontSize:9,fill:SLATE}} tickLine={false} axisLine={false} width={44}
//                                            tickFormatter={(v:number)=>v>=1000?`$${Math.round(v/1000)}k`:`$${v}`}/>
//                                     <RTooltip content={<ChartTooltip/>}/>
//                                     <ReferenceLine y={startBal} stroke={alpha(NAVY,0.2)} strokeDasharray="3 2" strokeWidth={1}/>
//                                     <ReferenceLine y={goalAmt} stroke={alpha(GREEN,0.4)} strokeDasharray="4 2" strokeWidth={1}
//                                                    label={{value:`Goal ${fmtC(goalAmt)}`,position:'insideTopRight',fontSize:8,fill:alpha(GREEN,0.7)}}/>
//                                     <Line type="monotone" dataKey="balance" name="Balance" stroke={BLUE} strokeWidth={2.5}
//                                           dot={(props:any)=>{
//                                               const{cx,cy,payload}=props;
//                                               return<circle key={payload.month} cx={cx} cy={cy} r={3.5}
//                                                             fill={payload.balance>=startBal?BLUE:RED} stroke="#fff" strokeWidth={1.5}/>;
//                                           }} activeDot={{r:5}}/>
//                                     <Line type="monotone" dataKey="saved" name="Saved/period" stroke={GREEN}
//                                           strokeWidth={2} strokeDasharray="5 2" dot={false} activeDot={{r:4}}/>
//                                 </LineChart>
//                             </ResponsiveContainer>
//                         </Box>
//
//                         {/* Chart legend */}
//                         <Box sx={{display:'flex',gap:2,mb:1.75,pl:0.5}}>
//                             {[
//                                 {color:BLUE,label:'Balance',dashed:false},
//                                 {color:GREEN,label:'Saved/period',dashed:true},
//                                 {color:alpha(GREEN,0.5),label:`Goal ${fmtC(goalAmt)}`,dashed:true},
//                             ].map(({color,label,dashed})=>(
//                                 <Box key={label} sx={{display:'flex',alignItems:'center',gap:0.5}}>
//                                     <Box sx={{width:14,height:2,bgcolor:dashed?'transparent':'#fff',borderTop:dashed?`2px dashed ${color}`:`2px solid ${color}`,flexShrink:0}}/>
//                                     <Typography sx={{fontSize:'0.62rem',color:SLATE}}>{label}</Typography>
//                                 </Box>
//                             ))}
//                         </Box>
//
//                         {/* Period breakdown table */}
//                         <Box sx={{borderRadius:'7px',overflow:'hidden',border:`1px solid ${alpha('#000',0.08)}`}}>
//                             <Box sx={{display:'grid',gridTemplateColumns:'42px 1fr 1fr 52px',bgcolor:alpha(MAROON,0.04),borderBottom:`1px solid ${alpha(MAROON,0.12)}`}}>
//                                 {['Mo','Saved','Balance','Goal'].map(h=>(
//                                     <Typography key={h} sx={{fontSize:'0.62rem',fontWeight:600,color:MAROON,textTransform:'uppercase',letterSpacing:'0.05em',py:0.875,px:1}}>{h}</Typography>
//                                 ))}
//                             </Box>
//                             {forecastData.map((d,i)=>(
//                                 <Box key={i} sx={{display:'grid',gridTemplateColumns:'42px 1fr 1fr 52px',borderBottom:i<forecastData.length-1?`1px solid ${alpha('#000',0.05)}`:'none',bgcolor:d.metGoal?alpha(GREEN,0.02):'#fff'}}>
//                                     <Typography sx={{fontSize:'0.72rem',color:SLATE,py:0.875,px:1}}>{d.month}</Typography>
//                                     <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:d.metGoal?GREEN:RED,py:0.875,px:1,fontVariantNumeric:'tabular-nums'}}>{fmtC(d.saved)}</Typography>
//                                     <Typography sx={{fontSize:'0.72rem',fontWeight:600,color:d.balance>=startBal?BLUE:RED,py:0.875,px:1,fontVariantNumeric:'tabular-nums'}}>{fmtC(d.balance)}</Typography>
//                                     <Box sx={{display:'flex',alignItems:'center',py:0.875,px:1}}>
//                                         <Box sx={{width:6,height:6,borderRadius:'50%',bgcolor:d.metGoal?GREEN:RED,flexShrink:0,mr:0.5}}/>
//                                         <Typography sx={{fontSize:'0.66rem',color:d.metGoal?GREEN:RED}}>{d.metGoal?'Met':'Miss'}</Typography>
//                                     </Box>
//                                 </Box>
//                             ))}
//                         </Box>
//
//                         {/* Final summary cards */}
//                         <Box sx={{mt:1.5,display:'grid',gridTemplateColumns:'1fr 1fr',gap:0.875}}>
//                             {[
//                                 {label:'Final balance',val:fmtC(forecastData[forecastData.length-1]?.balance??startBal),color:BLUE},
//                                 {label:'Total saved',val:fmtC(forecastData.reduce((a,d)=>a+d.saved,0)),color:GREEN},
//                                 {label:'Goals met',val:`${forecastData.filter(d=>d.metGoal).length}/${forecastData.length}`,color:MAROON},
//                                 {label:'Cushion safe',val:forecastData.every(d=>d.balance>=settings.cushionAmt)?'Always':'Risk',color:forecastData.every(d=>d.balance>=settings.cushionAmt)?GREEN:RED},
//                             ].map(({label,val,color})=>(
//                                 <Box key={label} sx={{bgcolor:alpha(color,0.04),border:`1px solid ${alpha(color,0.13)}`,borderRadius:'6px',p:1}}>
//                                     <Typography sx={{fontSize:'0.62rem',color:alpha(color,0.6),textTransform:'uppercase',letterSpacing:'0.04em',mb:0.2}}>{label}</Typography>
//                                     <Typography sx={{fontSize:'0.86rem',fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{val}</Typography>
//                                 </Box>
//                             ))}
//                         </Box>
//                     </Box>
//                 )}
//             </Box>
//         </Box>
//     );
// };
//
// export default BudgetOptimizerPanel;