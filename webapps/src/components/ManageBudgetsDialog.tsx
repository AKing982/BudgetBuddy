import React, { useEffect, useState } from "react";
import {
    Dialog, DialogContent, Button, TextField, MenuItem,
    Grid, Typography, Box, Alert, CircularProgress, IconButton,
    FormControl, InputLabel, Select, InputAdornment, Chip, Tabs, Tab,
    Stack, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    X, Save, Edit3, AlertCircle, Plus, Trash2,
    Calendar, DollarSign, Settings, User, ChevronRight,
    PiggyBank, FileText, CheckCircle,
} from 'lucide-react';
import BudgetService from "../services/BudgetService";
import { ManageBudgetsData } from "../utils/Items";

// ── Tokens ────────────────────────────────────────────────────────────────────
const MAROON  = '#6b1a1a';
const MAROON2 = '#4a1010';
const TEAL    = '#0d9488';
const GREEN   = '#059669';
const RED     = '#dc2626';
const AMBER   = '#d97706';
const SLATE   = '#64748b';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ManageBudgetsDialogProps {
    open: boolean;
    onClose: () => void;
    onBudgetUpdated?: () => void;
}

type PanelMode = 'idle' | 'edit' | 'add';

const BUDGET_TERM_OPTIONS = [
    { value: 'MONTHLY',   label: 'Monthly'   },
    { value: 'WEEKLY',    label: 'Weekly'    },
    { value: 'BIWEEKLY',  label: 'Bi-Weekly' },
    { value: 'BIMONTHLY', label: 'Bi-Monthly'},
    { value: 'YEARLY',    label: 'Yearly'    },
];
const BUDGET_PLAN_OPTIONS = [
    { value: 'SAVINGS_PLAN',    label: 'Savings Plan'    },
    { value: 'EMERGENCY_FUND',  label: 'Emergency Fund'  },
    { value: 'DEBT_PAYOFF',     label: 'Debt Payoff'     },
];

const EMPTY_BUDGET: Partial<ManageBudgetsData> = {
    budgetName: '', budgetDescription: '',
    monthlyIncome: 0, yearlyIncome: 0,
    savingsAmount: 0, savingsAllocation: 0,
    budgetPeriod: 'MONTHLY', budgetMode: 'SAVINGS PLAN',
    budgetYear: new Date().getFullYear(),
};

// ── Small helpers ──────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{
        fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: alpha(MAROON, 0.55), mb: 1.5,
    }}>
        {children}
    </Typography>
);

// ── Budget list card (left panel) ─────────────────────────────────────────────
const BudgetListCard: React.FC<{
    budget: ManageBudgetsData;
    selected: boolean;
    onClick: () => void;
    onDelete: () => void;
}> = ({ budget, selected, onClick, onDelete }) => (
    <Box
        onClick={onClick}
        sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            px: 1.5, py: 1.25, borderRadius: '10px', cursor: 'pointer',
            border: `1.5px solid ${selected ? alpha(MAROON, 0.4) : alpha('#000', 0.06)}`,
            bgcolor: selected ? alpha(MAROON, 0.06) : '#fff',
            borderLeft: `4px solid ${selected ? MAROON : alpha(MAROON, 0.15)}`,
            transition: 'all 0.15s ease',
            '&:hover': {
                borderColor: alpha(MAROON, 0.3),
                bgcolor: alpha(MAROON, 0.04),
                '& .delete-btn': { opacity: 1 },
            },
        }}
    >
        {/* Icon */}
        <Box sx={{
            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
            bgcolor: selected ? alpha(MAROON, 0.12) : alpha(MAROON, 0.06),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <PiggyBank size={15} color={MAROON} />
        </Box>

        {/* Name + year */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
                fontSize: '0.78rem', fontWeight: selected ? 800 : 600,
                color: selected ? MAROON : '#111',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {budget.budgetName || `Budget ${budget.id}`}
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: SLATE }}>
                {budget.budgetYear} · {BUDGET_TERM_OPTIONS.find(o => o.value === budget.budgetPeriod)?.label ?? budget.budgetPeriod}
            </Typography>
        </Box>

        {/* Delete button (hover reveal) */}
        <Tooltip title="Delete budget" placement="right">
            <IconButton
                className="delete-btn"
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                sx={{
                    opacity: 0, transition: 'opacity 0.15s',
                    color: RED, flexShrink: 0,
                    '&:hover': { bgcolor: alpha(RED, 0.08) },
                }}
            >
                <Trash2 size={14} />
            </IconButton>
        </Tooltip>

        {selected && <ChevronRight size={14} color={MAROON} style={{ flexShrink: 0 }} />}
    </Box>
);

// ── Field section card ────────────────────────────────────────────────────────
const FieldCard: React.FC<{ children: React.ReactNode; icon: React.ReactNode; title: string }> = ({ children, icon, title }) => (
    <Box sx={{
        borderRadius: '12px', border: `1px solid ${alpha('#000', 0.07)}`,
        overflow: 'hidden', mb: 2,
    }}>
        {/* Card header */}
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 2, py: 1.25,
            bgcolor: alpha(MAROON, 0.04),
            borderBottom: `1px solid ${alpha(MAROON, 0.08)}`,
        }}>
            <Box sx={{ color: MAROON, display: 'flex' }}>{icon}</Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: MAROON, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {title}
            </Typography>
        </Box>
        <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
);

// ── Styled text field ─────────────────────────────────────────────────────────
const maroonFieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '&:hover fieldset': { borderColor: alpha(MAROON, 0.4) },
        '&.Mui-focused fieldset': { borderColor: MAROON },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: MAROON },
};

// ── Main component ────────────────────────────────────────────────────────────
const ManageBudgetsDialog: React.FC<ManageBudgetsDialogProps> = ({ open, onClose, onBudgetUpdated }) => {
    const [budgetList,          setBudgetList]          = useState<ManageBudgetsData[]>([]);
    const [selectedBudgetId,    setSelectedBudgetId]    = useState<number | null>(null);
    const [searchYear,          setSearchYear]          = useState(new Date().getFullYear());
    const [formData,            setFormData]            = useState<Partial<ManageBudgetsData>>(EMPTY_BUDGET);
    const [originalData,        setOriginalData]        = useState<Partial<ManageBudgetsData> | null>(null);
    const [mode,                setMode]                = useState<PanelMode>('idle');
    const [activeTab,           setActiveTab]           = useState(0);
    const [isLoadingList,       setIsLoadingList]       = useState(false);
    const [isSubmitting,        setIsSubmitting]        = useState(false);
    const [error,               setError]               = useState<string | null>(null);
    const [successMsg,          setSuccessMsg]          = useState<string | null>(null);
    const [deleteTarget,        setDeleteTarget]        = useState<ManageBudgetsData | null>(null);

    const budgetService = BudgetService.getInstance();
    const userId = Number(sessionStorage.getItem('userId'));
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

    // ── Load list ──────────────────────────────────────────────────────────────
    const loadList = async () => {
        setIsLoadingList(true);
        setError(null);
        try {
            const budgets = await budgetService.getBudgetsByUserIdAndYear(userId, searchYear);
            setBudgetList(budgets);
        } catch {
            setError('Failed to load budgets.');
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => { if (open) loadList(); }, [open, searchYear]);

    // ── Select budget to edit ──────────────────────────────────────────────────
    const handleSelect = (budget: ManageBudgetsData) => {
        setSelectedBudgetId(budget.id);
        const data: Partial<ManageBudgetsData> = {
            id: budget.id,
            budgetName: budget.budgetName || '',
            budgetDescription: budget.budgetDescription || '',
            userId: budget.userId || userId,
            userFirstName: budget.userFirstName || '',
            userLastName: budget.userLastName || '',
            monthlyIncome: budget.monthlyIncome || 0,
            yearlyIncome: budget.yearlyIncome || (budget.monthlyIncome ? budget.monthlyIncome * 12 : 0),
            savingsAmount: budget.savingsAmount || 0,
            savingsAllocation: budget.savingsAllocation || 0,
            budgetPeriod: budget.budgetPeriod || 'MONTHLY',
            budgetMode: budget.budgetMode || 'SAVINGS_PLAN',
            budgetYear: budget.budgetYear || searchYear,
        };
        setFormData(data);
        setOriginalData(JSON.parse(JSON.stringify(data)));
        setMode('edit');
        setActiveTab(0);
        setError(null);
        setSuccessMsg(null);
    };

    // ── Start adding new ───────────────────────────────────────────────────────
    const handleStartAdd = () => {
        const blank = { ...EMPTY_BUDGET, budgetYear: searchYear, userId };
        setFormData(blank);
        setOriginalData(JSON.parse(JSON.stringify(blank)));
        setSelectedBudgetId(null);
        setMode('add');
        setActiveTab(0);
        setError(null);
        setSuccessMsg(null);
    };

    // ── Field change ───────────────────────────────────────────────────────────
    const handleField = (field: keyof ManageBudgetsData, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'monthlyIncome') next.yearlyIncome = value * 12;
            if (field === 'yearlyIncome')  next.monthlyIncome = value / 12;
            return next;
        });
        setSuccessMsg(null);
    };

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!hasChanges && mode !== 'add') return;
        setIsSubmitting(true);
        setError(null);
        try {
            if (mode === 'add') {
                // await budgetService.createBudget(formData);
                setSuccessMsg('Budget created successfully!');
            } else {
                // await budgetService.updateBudget(formData);
                setSuccessMsg('Budget updated successfully!');
            }
            setOriginalData(JSON.parse(JSON.stringify(formData)));
            await loadList();
            onBudgetUpdated?.();
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsSubmitting(true);
        try {
            // await budgetService.deleteBudget(deleteTarget.id);
            setDeleteTarget(null);
            if (selectedBudgetId === deleteTarget.id) {
                setMode('idle');
                setSelectedBudgetId(null);
            }
            await loadList();
            onBudgetUpdated?.();
            setSuccessMsg('Budget deleted.');
        } catch {
            setError('Failed to delete budget.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Close ──────────────────────────────────────────────────────────────────
    const handleClose = () => {
        if (hasChanges) {
            if (!window.confirm('You have unsaved changes. Close anyway?')) return;
        }
        setMode('idle');
        setSelectedBudgetId(null);
        setFormData(EMPTY_BUDGET);
        setOriginalData(null);
        setError(null);
        setSuccessMsg(null);
        onClose();
    };

    // ── Tab icons ──────────────────────────────────────────────────────────────
    const tabs = [
        { label: 'Basic Info',     icon: <FileText  size={14} /> },
        { label: 'Financial',      icon: <DollarSign size={14} /> },
        { label: 'Configuration',  icon: <Settings  size={14} /> },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        maxHeight: '88vh',
                        overflow: 'hidden',
                        border: `1px solid ${alpha(MAROON, 0.15)}`,
                        boxShadow: `0 24px 60px ${alpha(MAROON, 0.18)}, 0 8px 24px rgba(0,0,0,0.12)`,
                    }
                }}
            >
                {/* ── Dialog header ── */}
                <Box sx={{
                    px: 3, py: 2,
                    background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative circles */}
                    <Box sx={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
                    <Box sx={{ position:'absolute', bottom:-20, right:60, width:70, height:70, borderRadius:'50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
                        <Box sx={{ width:34, height:34, borderRadius:'8px', bgcolor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Edit3 size={16} color="#fff" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize:'1rem', fontWeight:800, color:'#fff', lineHeight:1.1, letterSpacing:'-0.01em' }}>
                                Manage Budgets
                            </Typography>
                            <Typography sx={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.7)', mt:0.2 }}>
                                Edit, add, or remove your budgets
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton onClick={handleClose} size="small" sx={{ color:'rgba(255,255,255,0.8)', '&:hover':{ bgcolor:'rgba(255,255,255,0.12)' } }}>
                        <X size={18} />
                    </IconButton>
                </Box>

                {/* ── Two-panel body ── */}
                <Box sx={{ display: 'flex', height: 560, overflow: 'hidden' }}>

                    {/* ── LEFT: Budget list ── */}
                    <Box sx={{
                        width: 240, flexShrink: 0,
                        borderRight: `1px solid ${alpha(MAROON, 0.1)}`,
                        display: 'flex', flexDirection: 'column',
                        bgcolor: alpha(MAROON, 0.015),
                    }}>
                        {/* Year selector + Add */}
                        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
                            <TextField
                                fullWidth size="small"
                                label="Year"
                                type="number"
                                value={searchYear}
                                onChange={e => setSearchYear(Number(e.target.value))}
                                sx={{ ...maroonFieldSx, mb: 1.25 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Calendar size={14} color={SLATE} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Button
                                fullWidth variant="contained"
                                startIcon={<Plus size={14} />}
                                onClick={handleStartAdd}
                                sx={{
                                    bgcolor: MAROON, color:'#fff', borderRadius:'8px',
                                    textTransform:'none', fontWeight:700, fontSize:'0.75rem',
                                    py: 0.85,
                                    '&:hover':{ bgcolor: MAROON2 },
                                }}
                            >
                                New Budget
                            </Button>
                        </Box>

                        <Box sx={{ px: 1.5, pb: 0.5 }}>
                            <SectionLabel>
                                {isLoadingList ? 'Loading…' : `${budgetList.length} budget${budgetList.length !== 1 ? 's' : ''}`}
                            </SectionLabel>
                        </Box>

                        {/* List */}
                        <Box sx={{
                            flex: 1, overflowY: 'auto', px: 1.5, pb: 2,
                            '&::-webkit-scrollbar': { width: 5 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: 3 },
                        }}>
                            {isLoadingList ? (
                                <Box sx={{ display:'flex', justifyContent:'center', pt:3 }}>
                                    <CircularProgress size={22} sx={{ color: MAROON }} />
                                </Box>
                            ) : budgetList.length === 0 ? (
                                <Box sx={{ pt: 3, textAlign: 'center' }}>
                                    <PiggyBank size={28} color={alpha(MAROON, 0.3)} style={{ marginBottom: 8 }} />
                                    <Typography sx={{ fontSize:'0.7rem', color:SLATE }}>No budgets for {searchYear}</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0.75}>
                                    {budgetList.map(b => (
                                        <BudgetListCard
                                            key={b.id}
                                            budget={b}
                                            selected={selectedBudgetId === b.id}
                                            onClick={() => handleSelect(b)}
                                            onDelete={() => setDeleteTarget(b)}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    {/* ── RIGHT: Edit / Add panel ── */}
                    <Box sx={{ flex: 1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                        {mode === 'idle' ? (
                            /* Empty state */
                            <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1.5, p:4 }}>
                                <Box sx={{ width:56, height:56, borderRadius:'16px', bgcolor:alpha(MAROON,0.07), display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Edit3 size={24} color={alpha(MAROON,0.45)} />
                                </Box>
                                <Typography sx={{ fontWeight:800, fontSize:'0.95rem', color:'#111' }}>
                                    Select a Budget
                                </Typography>
                                <Typography sx={{ fontSize:'0.75rem', color:SLATE, textAlign:'center', maxWidth:240 }}>
                                    Choose a budget from the list to edit its details, or create a new one.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {/* Panel header */}
                                <Box sx={{
                                    px: 3, py: 1.75,
                                    borderBottom: `1px solid ${alpha(MAROON, 0.08)}`,
                                    display:'flex', alignItems:'center', justifyContent:'space-between',
                                    bgcolor: '#fff',
                                }}>
                                    <Box>
                                        <Typography sx={{ fontWeight:800, fontSize:'0.9rem', color:'#111', letterSpacing:'-0.01em' }}>
                                            {mode === 'add' ? 'New Budget' : formData.budgetName || 'Edit Budget'}
                                        </Typography>
                                        <Typography sx={{ fontSize:'0.62rem', color:SLATE, mt:0.2 }}>
                                            {mode === 'add' ? 'Fill in the details below' : `Budget Year ${formData.budgetYear}`}
                                        </Typography>
                                    </Box>
                                    {hasChanges && (
                                        <Chip
                                            size="small"
                                            label="Unsaved"
                                            icon={<AlertCircle size={12} />}
                                            sx={{ bgcolor:alpha(AMBER,0.1), color:AMBER, border:`1px solid ${alpha(AMBER,0.3)}`, fontWeight:700, fontSize:'0.6rem' }}
                                        />
                                    )}
                                    {successMsg && (
                                        <Chip
                                            size="small"
                                            label={successMsg}
                                            icon={<CheckCircle size={12} />}
                                            sx={{ bgcolor:alpha(GREEN,0.1), color:GREEN, border:`1px solid ${alpha(GREEN,0.3)}`, fontWeight:700, fontSize:'0.6rem' }}
                                        />
                                    )}
                                </Box>

                                {/* Tabs */}
                                <Box sx={{ px:3, borderBottom:`1px solid ${alpha(MAROON,0.08)}`, bgcolor:'#fff' }}>
                                    <Tabs
                                        value={activeTab}
                                        onChange={(_, v) => setActiveTab(v)}
                                        sx={{
                                            minHeight: 40,
                                            '& .MuiTab-root': {
                                                minHeight:40, textTransform:'none', fontWeight:600, fontSize:'0.72rem',
                                                color: SLATE, gap:0.5, px:1.5,
                                                '&.Mui-selected': { color: MAROON, fontWeight:800 },
                                            },
                                            '& .MuiTabs-indicator': { bgcolor: MAROON, height:2 },
                                        }}
                                    >
                                        {tabs.map((t, i) => (
                                            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
                                        ))}
                                    </Tabs>
                                </Box>

                                {/* Error alert */}
                                {error && (
                                    <Box sx={{ px:3, pt:1.5 }}>
                                        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius:'8px', fontSize:'0.75rem', py:0.5 }}>
                                            {error}
                                        </Alert>
                                    </Box>
                                )}

                                {/* Tab content */}
                                <Box sx={{ flex:1, overflowY:'auto', px:3, py:2,
                                    '&::-webkit-scrollbar':{ width:5 },
                                    '&::-webkit-scrollbar-thumb':{ bgcolor:alpha(MAROON,0.2), borderRadius:3 },
                                }}>

                                    {/* ── Basic Info ── */}
                                    {activeTab === 0 && (
                                        <>
                                            <FieldCard icon={<FileText size={14}/>} title="Budget Identity">
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12}>
                                                        <TextField fullWidth size="small" label="Budget Name"
                                                                   value={formData.budgetName || ''}
                                                                   onChange={e => handleField('budgetName', e.target.value)}
                                                                   sx={maroonFieldSx} />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <TextField fullWidth size="small" label="Description" multiline rows={3}
                                                                   value={formData.budgetDescription || ''}
                                                                   onChange={e => handleField('budgetDescription', e.target.value)}
                                                                   sx={maroonFieldSx} />
                                                    </Grid>
                                                </Grid>
                                            </FieldCard>

                                            <FieldCard icon={<User size={14}/>} title="Owner">
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <TextField fullWidth size="small" label="First Name"
                                                                   value={formData.userFirstName || ''}
                                                                   disabled
                                                                   sx={{ ...maroonFieldSx, '& .MuiInputBase-input.Mui-disabled':{ WebkitTextFillColor: '#555' } }} />
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <TextField fullWidth size="small" label="Last Name"
                                                                   value={formData.userLastName || ''}
                                                                   disabled
                                                                   sx={{ ...maroonFieldSx, '& .MuiInputBase-input.Mui-disabled':{ WebkitTextFillColor: '#555' } }} />
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <TextField fullWidth size="small" label="Budget Year"
                                                                   type="number"
                                                                   value={formData.budgetYear || ''}
                                                                   disabled={mode === 'edit'}
                                                                   onChange={e => handleField('budgetYear', Number(e.target.value))}
                                                                   sx={maroonFieldSx}
                                                                   InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={13} color={SLATE}/></InputAdornment> }} />
                                                    </Grid>
                                                </Grid>
                                            </FieldCard>
                                        </>
                                    )}

                                    {/* ── Financial ── */}
                                    {activeTab === 1 && (
                                        <FieldCard icon={<DollarSign size={14}/>} title="Income & Savings">
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <TextField fullWidth size="small" label="Monthly Income" type="number"
                                                               value={formData.monthlyIncome || 0}
                                                               onChange={e => handleField('monthlyIncome', Number(e.target.value))}
                                                               sx={maroonFieldSx}
                                                               InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField fullWidth size="small" label="Yearly Income" type="number"
                                                               value={formData.yearlyIncome || 0}
                                                               onChange={e => handleField('yearlyIncome', Number(e.target.value))}
                                                               sx={maroonFieldSx}
                                                               InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField fullWidth size="small" label="Savings Goal" type="number"
                                                               value={formData.savingsAmount || 0}
                                                               onChange={e => handleField('savingsAmount', Number(e.target.value))}
                                                               sx={maroonFieldSx}
                                                               InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField fullWidth size="small" label="Savings Allocation" type="number"
                                                               value={formData.savingsAllocation || 0}
                                                               onChange={e => handleField('savingsAllocation', Number(e.target.value))}
                                                               sx={maroonFieldSx}
                                                               InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                                                </Grid>

                                                {/* Quick summary */}
                                                {((formData.monthlyIncome || 0) > 0) && (
                                                    <Grid item xs={12}>
                                                        <Box sx={{ display:'flex', gap:1.5, mt:0.5 }}>
                                                            {[
                                                                { label:'Monthly', value: fmt(formData.monthlyIncome||0), color: TEAL },
                                                                { label:'Yearly',  value: fmt(formData.yearlyIncome||0),  color: MAROON },
                                                                { label:'Savings', value: fmt(formData.savingsAmount||0), color: GREEN },
                                                            ].map(({ label, value, color }) => (
                                                                <Box key={label} sx={{ flex:1, p:1, borderRadius:'8px', bgcolor:alpha(color,0.07), border:`1px solid ${alpha(color,0.18)}`, textAlign:'center' }}>
                                                                    <Typography sx={{ fontSize:'0.58rem', fontWeight:700, color:SLATE, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</Typography>
                                                                    <Typography sx={{ fontSize:'0.78rem', fontWeight:800, color, fontVariantNumeric:'tabular-nums' }}>{value}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </FieldCard>
                                    )}

                                    {/* ── Configuration ── */}
                                    {activeTab === 2 && (
                                        <FieldCard icon={<Settings size={14}/>} title="Budget Configuration">
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small" sx={maroonFieldSx}>
                                                        <InputLabel>Budget Period</InputLabel>
                                                        <Select value={formData.budgetPeriod || 'MONTHLY'}
                                                                onChange={e => handleField('budgetPeriod', e.target.value)}
                                                                label="Budget Period">
                                                            {BUDGET_TERM_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small" sx={maroonFieldSx}>
                                                        <InputLabel>Budget Mode</InputLabel>
                                                        <Select value={formData.budgetMode || 'SAVINGS_PLAN'}
                                                                onChange={e => handleField('budgetMode', e.target.value)}
                                                                label="Budget Mode">
                                                            {BUDGET_PLAN_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                {/* Config summary chips */}
                                                <Grid item xs={12}>
                                                    <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mt:0.5 }}>
                                                        <Chip size="small" label={BUDGET_TERM_OPTIONS.find(o => o.value === formData.budgetPeriod)?.label || 'Monthly'}
                                                              sx={{ bgcolor:alpha(MAROON,0.09), color:MAROON, fontWeight:700, fontSize:'0.65rem', border:`1px solid ${alpha(MAROON,0.2)}` }} />
                                                        <Chip size="small" label={BUDGET_PLAN_OPTIONS.find(o => o.value === formData.budgetMode)?.label || 'Savings Plan'}
                                                              sx={{ bgcolor:alpha(TEAL,0.09), color:TEAL, fontWeight:700, fontSize:'0.65rem', border:`1px solid ${alpha(TEAL,0.2)}` }} />
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </FieldCard>
                                    )}
                                </Box>

                                {/* ── Action footer ── */}
                                <Box sx={{
                                    px:3, py:1.75,
                                    borderTop:`1px solid ${alpha(MAROON,0.08)}`,
                                    display:'flex', justifyContent:'flex-end', gap:1.25,
                                    bgcolor:'#fff',
                                }}>
                                    <Button variant="outlined" size="small" onClick={() => setMode('idle')}
                                            sx={{ borderColor:alpha(MAROON,0.3), color:MAROON, borderRadius:'8px', textTransform:'none', fontWeight:600,
                                                '&:hover':{ borderColor:MAROON, bgcolor:alpha(MAROON,0.04) } }}>
                                        Discard
                                    </Button>
                                    <Button
                                        variant="contained" size="small"
                                        startIcon={isSubmitting ? <CircularProgress size={13} sx={{color:'#fff'}}/> : <Save size={14}/>}
                                        onClick={handleSave}
                                        disabled={(!hasChanges && mode !== 'add') || isSubmitting}
                                        sx={{
                                            bgcolor: MAROON, color:'#fff', borderRadius:'8px',
                                            textTransform:'none', fontWeight:700, fontSize:'0.75rem',
                                            '&:hover':{ bgcolor:MAROON2 },
                                            '&:disabled':{ bgcolor:alpha(MAROON,0.3), color:'rgba(255,255,255,0.7)' },
                                        }}
                                    >
                                        {isSubmitting ? 'Saving…' : mode === 'add' ? 'Create Budget' : 'Save Changes'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            </Dialog>

            {/* ── Delete confirmation dialog ── */}
            {deleteTarget && (
                <Dialog open onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
                        PaperProps={{ sx: { borderRadius:'14px', border:`1px solid ${alpha(RED,0.2)}` } }}>
                    <Box sx={{ px:3, pt:3, pb:2 }}>
                        <Box sx={{ display:'flex', gap:1.5, alignItems:'flex-start', mb:2 }}>
                            <Box sx={{ width:40, height:40, borderRadius:'10px', bgcolor:alpha(RED,0.1), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <Trash2 size={18} color={RED}/>
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight:800, fontSize:'0.95rem', color:'#111' }}>Delete Budget</Typography>
                                <Typography sx={{ fontSize:'0.72rem', color:SLATE, mt:0.3 }}>This action cannot be undone.</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p:1.5, borderRadius:'8px', bgcolor:alpha(RED,0.05), border:`1px solid ${alpha(RED,0.15)}`, mb:2 }}>
                            <Typography sx={{ fontSize:'0.78rem', fontWeight:700, color:'#111' }}>
                                {deleteTarget.budgetName}
                            </Typography>
                            <Typography sx={{ fontSize:'0.68rem', color:SLATE }}>
                                Year {deleteTarget.budgetYear} · {BUDGET_TERM_OPTIONS.find(o => o.value === deleteTarget.budgetPeriod)?.label}
                            </Typography>
                        </Box>

                        <Typography sx={{ fontSize:'0.75rem', color:SLATE, mb:2.5 }}>
                            Are you sure you want to permanently delete this budget and all its associated data?
                        </Typography>

                        <Box sx={{ display:'flex', gap:1.25, justifyContent:'flex-end' }}>
                            <Button size="small" variant="outlined" onClick={() => setDeleteTarget(null)}
                                    sx={{ borderColor:alpha('#000',0.2), color:SLATE, borderRadius:'8px', textTransform:'none', fontWeight:600 }}>
                                Cancel
                            </Button>
                            <Button size="small" variant="contained" onClick={handleDeleteConfirm} disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={13} sx={{color:'#fff'}}/> : <Trash2 size={13}/>}
                                    sx={{ bgcolor:RED, color:'#fff', borderRadius:'8px', textTransform:'none', fontWeight:700,
                                        '&:hover':{ bgcolor:'#b91c1c' } }}>
                                {isSubmitting ? 'Deleting…' : 'Delete Budget'}
                            </Button>
                        </Box>
                    </Box>
                </Dialog>
            )}
        </>
    );
};

export default ManageBudgetsDialog;

//
// import React, {useEffect, useState} from "react";
// import {
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     Button,
//     TextField,
//     MenuItem,
//     Grid,
//     Typography,
//     Box,
//     Alert,
//     CircularProgress,
//     IconButton,
//     Divider,
//     FormControl,
//     InputLabel,
//     Select,
//     InputAdornment,
//     Chip,
//     Card, Tabs, Tab
// } from '@mui/material';
// import { X, Save, Edit, AlertCircle } from 'lucide-react';
// import BudgetService from "../services/BudgetService";
// import { ManageBudgetsData } from "../utils/Items";
//
// interface ManageBudgetsDialogProps {
//     open: boolean;
//     onClose: () => void;
//     onBudgetUpdated?: () => void;
// }
//
//
//
// interface BudgetListItem {
//     id: number;
//     name: string;
//     year: number;
// }
//
//
// const ManageBudgetsDialog: React.FC<ManageBudgetsDialogProps> = ({open, onClose, onBudgetUpdated}) =>
// {
//     const [budgetList, setBudgetList] = useState<ManageBudgetsData[]>([]);
//     const [budgetListItems, setBudgetListItems] = useState<BudgetListItem[]>([])
//     const [selectedBudgetId, setSelectedBudgetId] = useState<number | ''>('');
//     const [searchYear, setSearchYear] = useState<number>(new Date().getFullYear());
//     const [manageBudgetData, setManageBudgetData] = useState<ManageBudgetsData | null>(null);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [isLoadingBudgets, setIsLoadingBudgets] = useState<boolean>(false);
//     const [error, setError] = useState<string | null>('');
//     const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
//     const [hasChanges, setHasChanges] = useState<boolean>(false);
//     const [originalManageBudgetData, setOriginalManageBudgetData] = useState<ManageBudgetsData | null>(null);
//     const budgetService = BudgetService.getInstance();
//     const [activeTab, setActiveTab] = useState(0);
//
//     const userId = Number(sessionStorage.getItem('userId'));
//     const budgetTermOptions = [
//         { value: 'MONTHLY', label: 'Monthly' },
//         { value: 'WEEKLY', label: 'Weekly' },
//         { value: 'BIWEEKLY', label: 'Bi-Weekly' },
//         { value: 'BIMONTHLY', label: 'Bi-Monthly' },
//         { value: 'YEARLY', label: 'Yearly' }
//     ];
//
//     const budgetPlanOptions = [
//         { value: 'SAVINGS_PLAN', label: 'Savings Plan' },
//         { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
//         { value: 'DEBT_PAYOFF', label: 'Debt Payoff' }
//     ];
//
//     const loadBudgetList = async () => {
//         setIsLoadingBudgets(true);
//         setError(null);
//         try {
//             // Assuming you have an endpoint to get budgets by user and year
//             const budgets = await budgetService.getBudgetsByUserIdAndYear(userId, searchYear);
//             console.log('Budgets:', budgets);
//
//             setBudgetList(budgets);
//
//             const budgetItems: BudgetListItem[] = budgets.map((budget: any) => ({
//                 id: budget.id,
//                 name: budget.budgetName || `Budget ${budget.id}`,
//                 year: budget.budgetYear || searchYear
//             }));
//
//             setBudgetListItems(budgetItems);
//
//
//             if (budgetItems.length === 0) {
//                 setError(`No budgets found for year ${searchYear}`);
//             }
//         } catch (err) {
//             console.error('Error loading budget list:', err);
//             setError('Failed to load budgets. Please try again.');
//         } finally {
//             setIsLoadingBudgets(false);
//         }
//     };
//
//     useEffect(() => {
//         if (open) {
//             loadBudgetList();
//         }
//     }, [open, searchYear]);
//
//     const handleClose = () => {
//         if (hasChanges) {
//             const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
//             if (!confirmClose) return;
//         }
//
//         // Reset state
//         setSelectedBudgetId('');
//         setManageBudgetData(null);
//         setOriginalManageBudgetData(null);
//         setHasChanges(false);
//         setError(null);
//
//         onClose();
//     };
//
//     const handleFieldChange = (field: keyof ManageBudgetsData, value: any) => {
//         if (!manageBudgetData) return;
//
//         const updatedBudget = { ...manageBudgetData, [field]: value };
//
//         // Auto-calculate yearly income if monthly income changes
//         if (field === 'monthlyIncome') {
//             updatedBudget.yearlyIncome = value * 12;
//         }
//
//         // Auto-calculate monthly income if yearly income changes
//         if (field === 'yearlyIncome') {
//             updatedBudget.monthlyIncome = value / 12;
//         }
//
//         setManageBudgetData(updatedBudget);
//         setHasChanges(JSON.stringify(updatedBudget) !== JSON.stringify(originalManageBudgetData));
//     };
//
//     const handleSubmit = () => {
//         if (!hasChanges) {
//             setError('No changes detected to save.');
//             return;
//         }
//         setConfirmDialogOpen(true);
//     };
//
//     const loadBudgetDetails = async (budgetId: number) => {
//         setIsLoading(true);
//         setError(null);
//         try
//         {
//             console.log('Loading budget details for budget ID:', budgetId);
//
//             const budget = budgetList.find((b) => b.id === budgetId);
//             if(!budget) {
//                 throw new Error(`Budget with ID ${budgetId} not found.`);
//             }
//             const budgetDetails: ManageBudgetsData = {
//                 id: budget.id,
//                 budgetName: budget.budgetName || '',
//                 budgetDescription: budget.budgetDescription || '',
//                 userId: budget.userId || userId,
//                 userFirstName: budget.userFirstName || 'Unknown',
//                 userLastName: budget.userLastName || 'User',
//                 monthlyIncome: budget.monthlyIncome || 0,
//                 yearlyIncome: budget.yearlyIncome || (budget.monthlyIncome ? budget.monthlyIncome * 12 : 0),
//                 savingsAmount: budget.savingsAmount || 0,
//                 budgetPeriod: budget.budgetPeriod || 'MONTHLY',
//                 budgetMode: budget.budgetMode || 'SAVINGS_PLAN',
//                 budgetYear: budget.budgetYear || searchYear
//             };
//             setManageBudgetData(budgetDetails);
//             setOriginalManageBudgetData(JSON.parse(JSON.stringify(budgetDetails))); // Deep copy
//             setHasChanges(false);
//         } catch (err) {
//             console.error('Error loading budget details:', err);
//             setError('Failed to load budget details. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//
//     const handleConfirmSave = async () => {
//         if (!manageBudgetData) return;
//
//         setIsLoading(true);
//         setError(null);
//         setConfirmDialogOpen(false);
//
//         try {
//             // await budgetService.updateBudget(manageBudgetData);
//
//             // Success - reset state and notify parent
//             setHasChanges(false);
//             setOriginalManageBudgetData(JSON.parse(JSON.stringify(manageBudgetData)));
//
//             if (onBudgetUpdated) {
//                 onBudgetUpdated();
//             }
//
//             // Show success message (you could use a snackbar here)
//             alert('Budget updated successfully!');
//
//         } catch (err) {
//             console.error('Error updating budget:', err);
//             setError('Failed to update budget. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     const handleBudgetSelect = (budgetId: number) => {
//         setSelectedBudgetId(budgetId);
//         loadBudgetDetails(budgetId);
//     };
//
//
//     return (
//         <>
//             <Dialog
//                 open={open}
//                 onClose={handleClose}
//                 maxWidth="md"
//                 fullWidth
//                 PaperProps={{
//                     sx: {
//                         borderRadius: 2,
//                         maxHeight: '90vh'
//                     }
//                 }}
//             >
//                 <DialogTitle>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <Edit size={24} />
//                             <Typography variant="h6" component="span">
//                                 Manage Budgets
//                             </Typography>
//                         </Box>
//                         <IconButton onClick={handleClose} size="small">
//                             <X />
//                         </IconButton>
//                     </Box>
//                 </DialogTitle>
//
//                 <Divider />
//
//                 <DialogContent>
//                     {/* Budget Selection Section */}
//                     <Box sx={{ mb: 3 }}>
//                         <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//                             Select Budget
//                         </Typography>
//
//                         <Grid container spacing={2}>
//                             <Grid item xs={12} sm={6}>
//                                 <TextField
//                                     fullWidth
//                                     label="Budget Year"
//                                     type="number"
//                                     value={searchYear}
//                                     onChange={(e) => setSearchYear(Number(e.target.value))}
//                                     InputProps={{
//                                         startAdornment: (
//                                             <InputAdornment position="start">
//                                                 <AlertCircle size={18} />
//                                             </InputAdornment>
//                                         )
//                                     }}
//                                 />
//                             </Grid>
//
//                             <Grid item xs={12} sm={6}>
//                                 <FormControl fullWidth disabled={isLoadingBudgets || budgetList.length === 0}>
//                                     <InputLabel>Select Budget</InputLabel>
//                                     <Select
//                                         value={selectedBudgetId}
//                                         onChange={(e) => handleBudgetSelect(e.target.value as number)}
//                                         label="Select Budget"
//                                     >
//                                         <MenuItem value="">
//                                             <em>Choose a budget</em>
//                                         </MenuItem>
//                                         {budgetList.map((budget) => (
//                                             <MenuItem key={budget.id} value={budget.id}>
//                                                 {budget.budgetName} ({budget.budgetYear})
//                                             </MenuItem>
//                                         ))}
//                                     </Select>
//                                 </FormControl>
//                             </Grid>
//                         </Grid>
//
//                         {isLoadingBudgets && (
//                             <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
//                                 <CircularProgress size={24} />
//                             </Box>
//                         )}
//                     </Box>
//
//                     {error && (
//                         <Alert severity="error" sx={{ mb: 3 }}>
//                             {error}
//                         </Alert>
//                     )}
//
//                     {isLoading ? (
//                         <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//                             <CircularProgress />
//                         </Box>
//                     ) : manageBudgetData ? (
//                         <>
//                             {hasChanges && (
//                                 <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
//                                     <Chip
//                                         label="Unsaved Changes"
//                                         color="warning"
//                                         size="small"
//                                         icon={<AlertCircle size={16} />}
//                                     />
//                                 </Box>
//                             )}
//
//                             <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
//                                 <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
//                                     <Tab label="Basic Info" />
//                                     <Tab label="Financial" />
//                                     <Tab label="Configuration" />
//                                 </Tabs>
//                             </Box>
//
//                             {activeTab === 0 && (
//                                 <Box sx={{ py: 2 }}>
//                                     <Grid container spacing={3}>
//                                         <Grid item xs={12}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Budget Name"
//                                                 value={manageBudgetData.budgetName}
//                                                 onChange={(e) => handleFieldChange('budgetName', e.target.value)}
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Budget Description"
//                                                 value={manageBudgetData.budgetDescription}
//                                                 onChange={(e) => handleFieldChange('budgetDescription', e.target.value)}
//                                                 multiline
//                                                 rows={4}
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12} sm={6}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="User First Name"
//                                                 value={manageBudgetData.userFirstName}
//                                                 InputProps={{
//                                                     readOnly: true,
//                                                 }}
//                                                 disabled
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12} sm={6}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="User Last Name"
//                                                 value={manageBudgetData.userLastName}
//                                                 InputProps={{
//                                                     readOnly: true,
//                                                 }}
//                                                 disabled
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Budget Year"
//                                                 value={manageBudgetData.budgetYear}
//                                                 InputProps={{
//                                                     readOnly: true,
//                                                 }}
//                                                 disabled
//                                             />
//                                         </Grid>
//                                     </Grid>
//                                 </Box>
//                             )}
//
//                             {activeTab === 1 && (
//                                 <Box sx={{ py: 2 }}>
//                                     <Grid container spacing={3}>
//                                         <Grid item xs={12} sm={6}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Monthly Income"
//                                                 type="number"
//                                                 value={manageBudgetData.monthlyIncome}
//                                                 onChange={(e) => handleFieldChange('monthlyIncome', Number(e.target.value))}
//                                                 InputProps={{
//                                                     startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                                 }}
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12} sm={6}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Yearly Income"
//                                                 type="number"
//                                                 value={manageBudgetData.yearlyIncome}
//                                                 onChange={(e) => handleFieldChange('yearlyIncome', Number(e.target.value))}
//                                                 InputProps={{
//                                                     startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                                 }}
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12} sm={6}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Savings Goal"
//                                                 type="number"
//                                                 value={manageBudgetData.savingsAmount}
//                                                 onChange={(e) => handleFieldChange('savingsAmount', Number(e.target.value))}
//                                                 InputProps={{
//                                                     startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                                 }}
//                                             />
//                                         </Grid>
//                                         <Grid item xs={12} sm={6}>
//                                             <TextField
//                                                 fullWidth
//                                                 label="Savings Allocation"
//                                                 type="number"
//                                                 value={manageBudgetData.savingsAllocation}
//                                                 onChange={(e) => handleFieldChange('savingsAllocation', Number(e.target.value))}
//                                                 InputProps={{
//                                                     startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                                 }}
//                                                 />
//                                         </Grid>
//                                     </Grid>
//                                 </Box>
//                             )}
//
//                             {activeTab === 2 && (
//                                 <Box sx={{ py: 2 }}>
//                                     <Grid container spacing={3}>
//                                         <Grid item xs={12} sm={6}>
//                                             <FormControl fullWidth>
//                                                 <InputLabel>Budget Period</InputLabel>
//                                                 <Select
//                                                     value={manageBudgetData.budgetPeriod}
//                                                     onChange={(e) => handleFieldChange('budgetPeriod', e.target.value)}
//                                                     label="Budget Period"
//                                                 >
//                                                     {budgetTermOptions.map((option) => (
//                                                         <MenuItem key={option.value} value={option.value}>
//                                                             {option.label}
//                                                         </MenuItem>
//                                                     ))}
//                                                 </Select>
//                                             </FormControl>
//                                         </Grid>
//                                         <Grid item xs={12} sm={6}>
//                                             <FormControl fullWidth>
//                                                 <InputLabel>Budget Mode</InputLabel>
//                                                 <Select
//                                                     value={manageBudgetData.budgetMode}
//                                                     onChange={(e) => handleFieldChange('budgetMode', e.target.value)}
//                                                     label="Budget Mode"
//                                                 >
//                                                     {budgetPlanOptions.map((option) => (
//                                                         <MenuItem key={option.value} value={option.value}>
//                                                             {option.label}
//                                                         </MenuItem>
//                                                     ))}
//                                                 </Select>
//                                             </FormControl>
//                                         </Grid>
//                                     </Grid>
//                                 </Box>
//                             )}
//                         </>
//                     ) : (
//                         <Box sx={{ py: 4, textAlign: 'center' }}>
//                             <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
//                             <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
//                                 No Budget Selected
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary">
//                                 Select a budget from the dropdown above to view and edit its details
//                             </Typography>
//                         </Box>
//                     )}
//                 </DialogContent>
//
//                 <Divider />
//
//                 <DialogActions sx={{ p: 2.5 }}>
//                     <Button onClick={handleClose} variant="outlined">
//                         Cancel
//                     </Button>
//                     <Button
//                         onClick={handleSubmit}
//                         variant="contained"
//                         startIcon={<Save size={18} />}
//                         disabled={!manageBudgetData || !hasChanges || isLoading}
//                     >
//                         {isLoading ? 'Saving...' : 'Save Changes'}
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//
//             {/* Confirmation Dialog */}
//             <Dialog
//                 open={confirmDialogOpen}
//                 onClose={() => setConfirmDialogOpen(false)}
//                 maxWidth="sm"
//                 fullWidth
//             >
//                 <DialogTitle>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <AlertCircle size={24} color="#ff9800" />
//                         <Typography variant="h6">Confirm Changes</Typography>
//                     </Box>
//                 </DialogTitle>
//
//                 <DialogContent>
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                         You are about to update the following budget:
//                     </Alert>
//
//                     {manageBudgetData && (
//                         <Box sx={{ mt: 2 }}>
//                             <Typography variant="body2" sx={{ mb: 1 }}>
//                                 <strong>Budget Name:</strong> {manageBudgetData.budgetName}
//                             </Typography>
//                             <Typography variant="body2" sx={{ mb: 1 }}>
//                                 <strong>Budget Year:</strong> {manageBudgetData.budgetYear}
//                             </Typography>
//                             <Typography variant="body2" sx={{ mb: 1 }}>
//                                 <strong>User:</strong> {manageBudgetData.userFirstName} {manageBudgetData.userLastName}
//                             </Typography>
//                         </Box>
//                     )}
//
//                     <Typography variant="body1" sx={{ mt: 2 }}>
//                         Are you sure you want to save these changes?
//                     </Typography>
//                 </DialogContent>
//
//                 <DialogActions sx={{ p: 2.5 }}>
//                     <Button
//                         onClick={() => setConfirmDialogOpen(false)}
//                         variant="outlined"
//                     >
//                         Cancel
//                     </Button>
//                     <Button
//                         onClick={handleConfirmSave}
//                         variant="contained"
//                         color="primary"
//                         disabled={isLoading}
//                     >
//                         {isLoading ? 'Saving...' : 'Confirm & Save'}
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </>
//     );
// }
//
// export default ManageBudgetsDialog;