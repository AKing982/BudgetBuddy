import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogActions, Button, TextField,
    Box, Typography, IconButton, Stack, Chip, alpha, Switch,
    FormControlLabel, Divider, Tabs, Tab, Tooltip, InputAdornment,
    CircularProgress, Grid,
} from '@mui/material';
import {
    X, Plus, Trash2, Eye, EyeOff, Tag, CheckCircle2,
    LayoutGrid, Sparkles, PiggyBank, Save,
} from 'lucide-react';

// ── Tokens ────────────────────────────────────────────────────────────────────
const MAROON  = '#6b1a1a';
const MAROON2 = '#4a1010';
const TEAL    = '#0d9488';
const TEAL2   = '#0f766e';
const GREEN   = '#059669';
const SLATE   = '#64748b';
const RED     = '#dc2626';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BudgetCategory {
    id?:             number;
    name:            string;
    budgetedAmount:  number;
    savingsGoal?:    number;
    isDefault:       boolean;
    isActive:        boolean;
    isCustom:        boolean;
}

interface ManageBudgetCategoriesDialogProps {
    open:               boolean;
    onClose:            () => void;
    defaultCategories:  BudgetCategory[];
    customCategories:   BudgetCategory[];
    onSaveCategories:   (categories: BudgetCategory[], useCustomOnly: boolean) => Promise<void>;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '&:hover fieldset':       { borderColor: alpha(MAROON, 0.4) },
        '&.Mui-focused fieldset': { borderColor: MAROON },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: MAROON },
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{
        fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: alpha(MAROON, 0.5), mb: 1.25,
    }}>
        {children}
    </Typography>
);

// ── Default category row ──────────────────────────────────────────────────────
const DefaultRow: React.FC<{ cat: BudgetCategory; onToggle: () => void }> = ({ cat, onToggle }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 1.75, py: 1.25, borderRadius: '10px',
        border: `1px solid ${cat.isActive ? alpha(TEAL, 0.25) : alpha('#000', 0.07)}`,
        borderLeft: `4px solid ${cat.isActive ? TEAL : alpha('#000', 0.12)}`,
        bgcolor: cat.isActive ? alpha(TEAL, 0.035) : '#fafafa',
        transition: 'all 0.15s ease',
        '&:hover': { boxShadow: `0 2px 8px ${alpha(TEAL, 0.1)}` },
    }}>
        {/* Status dot */}
        <Box sx={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            bgcolor: cat.isActive ? TEAL : alpha('#000', 0.2),
        }} />

        {/* Name + budget */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: cat.isActive ? '#111' : '#888' }}>
                    {cat.name}
                </Typography>
                <Chip size="small" label="Default"
                      sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800,
                          bgcolor: alpha(MAROON, 0.08), color: MAROON,
                          border: `1px solid ${alpha(MAROON, 0.18)}` }} />
            </Box>
            <Typography sx={{ fontSize: '0.65rem', color: SLATE, mt: 0.2 }}>
                {cat.budgetedAmount > 0 ? `$${cat.budgetedAmount.toFixed(2)} budgeted` : 'No budget set'}
            </Typography>
        </Box>

        {/* Toggle */}
        <Tooltip title={cat.isActive ? 'Disable category' : 'Enable category'}>
            <IconButton size="small" onClick={onToggle} sx={{
                color: cat.isActive ? TEAL : alpha('#000', 0.3),
                '&:hover': { bgcolor: cat.isActive ? alpha(TEAL, 0.1) : alpha('#000', 0.05) },
            }}>
                {cat.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
            </IconButton>
        </Tooltip>
    </Box>
);

// ── Custom category card ──────────────────────────────────────────────────────
const CustomCard: React.FC<{ cat: BudgetCategory; onDelete: () => void }> = ({ cat, onDelete }) => (
    <Box sx={{
        p: 1.75, borderRadius: '10px',
        border: `1px solid ${alpha(TEAL, 0.22)}`,
        borderLeft: `4px solid ${TEAL}`,
        bgcolor: '#fff',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: `0 3px 12px ${alpha(TEAL, 0.12)}`, '& .del-btn': { opacity: 1 } },
    }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#111' }}>
                        {cat.name}
                    </Typography>
                    <Chip size="small" label="Custom"
                          sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800,
                              bgcolor: alpha(TEAL, 0.1), color: TEAL,
                              border: `1px solid ${alpha(TEAL, 0.25)}` }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: SLATE }}>Budgeted</Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                            ${cat.budgetedAmount.toFixed(2)}
                        </Typography>
                    </Box>
                    {cat.savingsGoal && cat.savingsGoal > 0 && (
                        <Box>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: SLATE }}>Savings Goal</Typography>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: GREEN, fontVariantNumeric: 'tabular-nums' }}>
                                ${cat.savingsGoal.toFixed(2)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <IconButton className="del-btn" size="small" onClick={onDelete} sx={{
                opacity: 0, transition: 'opacity 0.15s',
                color: RED, '&:hover': { bgcolor: alpha(RED, 0.1) },
            }}>
                <Trash2 size={14} />
            </IconButton>
        </Box>
    </Box>
);

// ── Add category form ─────────────────────────────────────────────────────────
const AddCategoryForm: React.FC<{
    onAdd: (name: string, budget: string, savings: string) => void;
    onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
    const [name,    setName]    = useState('');
    const [budget,  setBudget]  = useState('');
    const [savings, setSavings] = useState('');

    const numericOnly = (v: string) => v === '' || /^\d*\.?\d{0,2}$/.test(v);

    return (
        <Box sx={{
            p: 2, mb: 2, borderRadius: '12px',
            border: `1.5px solid ${alpha(TEAL, 0.3)}`,
            bgcolor: alpha(TEAL, 0.03),
        }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: TEAL, mb: 1.75 }}>
                New Category
            </Typography>
            <Stack spacing={1.5}>
                <TextField fullWidth size="small" label="Category Name *" sx={fieldSx}
                           value={name} onChange={e => setName(e.target.value)}
                           placeholder="e.g. Entertainment, Pet Care, Hobbies" />
                <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Budgeted Amount" sx={fieldSx}
                                   value={budget} onChange={e => numericOnly(e.target.value) && setBudget(e.target.value)}
                                   placeholder="0.00"
                                   InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Savings Goal" sx={fieldSx}
                                   value={savings} onChange={e => numericOnly(e.target.value) && setSavings(e.target.value)}
                                   placeholder="0.00"
                                   InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                   helperText="Optional" />
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={onCancel}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: SLATE,
                                borderRadius: '7px', '&:hover': { bgcolor: alpha('#000', 0.04) } }}>
                        Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={() => { if (name.trim()) onAdd(name, budget, savings); }}
                            disabled={!name.trim()}
                            startIcon={<Plus size={13} />}
                            sx={{ bgcolor: TEAL, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem',
                                borderRadius: '7px', '&:hover': { bgcolor: TEAL2 },
                                '&:disabled': { bgcolor: alpha(TEAL, 0.3), color: 'rgba(255,255,255,0.6)' } }}>
                        Add
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const ManageBudgetCategoriesDialog: React.FC<ManageBudgetCategoriesDialogProps> = ({
                                                                                       open, onClose, defaultCategories, customCategories, onSaveCategories,
                                                                                   }) => {
    const [activeTab,            setActiveTab]            = useState(0);
    const [useCustomOnly,        setUseCustomOnly]        = useState(false);
    const [localDefault,         setLocalDefault]         = useState<BudgetCategory[]>(defaultCategories);
    const [localCustom,          setLocalCustom]          = useState<BudgetCategory[]>(customCategories);
    const [showAddForm,          setShowAddForm]          = useState(false);
    const [isSaving,             setIsSaving]             = useState(false);

    useEffect(() => { setLocalDefault(defaultCategories); }, [defaultCategories]);
    useEffect(() => { setLocalCustom(customCategories);   }, [customCategories]);

    const activeDefaultCount = localDefault.filter(c => c.isActive).length;
    const totalActive        = useCustomOnly ? localCustom.length : activeDefaultCount + localCustom.length;

    const handleAddCustom = (name: string, budget: string, savings: string) => {
        const cat: BudgetCategory = {
            id:             Date.now(),
            name:           name.trim(),
            budgetedAmount: parseFloat(budget) || 0,
            savingsGoal:    parseFloat(savings) > 0 ? parseFloat(savings) : undefined,
            isDefault:      false,
            isActive:       true,
            isCustom:       true,
        };
        setLocalCustom(prev => [...prev, cat]);
        setShowAddForm(false);
    };

    const handleToggleDefault = (id: number) =>
        setLocalDefault(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));

    const handleDeleteCustom = (id: number) =>
        setLocalCustom(prev => prev.filter(c => c.id !== id));

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const all = useCustomOnly
                ? localCustom
                : [...localDefault.filter(c => c.isActive), ...localCustom];
            await onSaveCategories(all, useCustomOnly);
            onClose();
        } catch { alert('Failed to save categories. Please try again.'); }
        finally { setIsSaving(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', maxHeight: '88vh', overflow: 'hidden',
                        border: `1px solid ${alpha(MAROON, 0.15)}`,
                        boxShadow: `0 24px 60px ${alpha(MAROON, 0.18)}, 0 8px 24px rgba(0,0,0,0.12)`,
                    }}}>

            {/* ── Maroon header ── */}
            <Box sx={{
                px: 3, py: 2,
                background: `linear-gradient(135deg, #4a1010 0%, #6b1a1a 50%, #5a1515 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
                <Box sx={{ position:'absolute', bottom:-20, right:70, width:65, height:65, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

                <Box sx={{ display:'flex', alignItems:'center', gap:1.5, position:'relative' }}>
                    <Box sx={{ width:34, height:34, borderRadius:'8px', bgcolor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Tag size={16} color="#fff" />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize:'1rem', fontWeight:800, color:'#fff', lineHeight:1.1, letterSpacing:'-0.01em' }}>
                            Manage Budget Categories
                        </Typography>
                        <Typography sx={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.7)', mt:0.2 }}>
                            {totalActive} {totalActive === 1 ? 'category' : 'categories'} active
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color:'rgba(255,255,255,0.8)', position:'relative', '&:hover':{ bgcolor:'rgba(255,255,255,0.12)' } }}>
                    <X size={18} />
                </IconButton>
            </Box>

            {/* ── Mode toggle strip ── */}
            <Box sx={{
                px: 3, py: 1.75,
                borderBottom: `1px solid ${alpha('#000', 0.07)}`,
                bgcolor: useCustomOnly ? alpha(TEAL, 0.04) : alpha(MAROON, 0.03),
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#111' }}>
                        {useCustomOnly ? 'Custom Categories Only' : 'Default + Custom Categories'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>
                        {useCustomOnly
                            ? 'Only your custom categories will be used for budgeting'
                            : 'Enabled default categories plus custom categories are both active'}
                    </Typography>
                </Box>
                <Switch checked={useCustomOnly} onChange={e => setUseCustomOnly(e.target.checked)}
                        sx={{ '& .Mui-checked': { color: TEAL }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: TEAL } }} />
            </Box>

            {/* ── Stats strip ── */}
            <Box sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${alpha('#000', 0.06)}`, display: 'flex', gap: 3 }}>
                {[
                    { label: 'Default Active',  value: activeDefaultCount, color: MAROON, dim: useCustomOnly },
                    { label: 'Custom',          value: localCustom.length, color: TEAL, dim: false },
                    { label: 'Total Active',    value: totalActive, color: '#111', dim: false, bold: true },
                ].map(({ label, value, color, dim, bold }) => (
                    <Box key={label} sx={{ opacity: dim ? 0.35 : 1 }}>
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE }}>
                            {label}
                        </Typography>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: bold ? 900 : 800, color, fontVariantNumeric: 'tabular-nums' }}>
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Tabs ── */}
            <Box sx={{ px: 3, borderBottom: `1px solid ${alpha('#000', 0.07)}` }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
                      sx={{
                          minHeight: 42,
                          '& .MuiTab-root': {
                              minHeight: 42, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                              color: SLATE, gap: 0.5, px: 1.5,
                              '&.Mui-selected': { color: MAROON, fontWeight: 800 },
                          },
                          '& .MuiTabs-indicator': { bgcolor: MAROON, height: 2 },
                      }}>
                    <Tab icon={<LayoutGrid size={13} />} iconPosition="start"
                         label={`Default (${activeDefaultCount}/${localDefault.length})`} />
                    <Tab icon={<Sparkles size={13} />} iconPosition="start"
                         label={`Custom (${localCustom.length})`} />
                </Tabs>
            </Box>

            {/* ── Content ── */}
            <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Default tab */}
                {activeTab === 0 && (
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5,
                        '&::-webkit-scrollbar': { width: 5 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: 3 },
                    }}>
                        <Typography sx={{ fontSize: '0.72rem', color: SLATE, mb: 2 }}>
                            Toggle categories on or off to show or hide them from your budget. Disabled categories won't be counted.
                        </Typography>

                        {useCustomOnly && (
                            <Box sx={{
                                p: 1.5, mb: 2, borderRadius: '8px',
                                bgcolor: alpha(TEAL, 0.06), border: `1px solid ${alpha(TEAL, 0.2)}`,
                            }}>
                                <Typography sx={{ fontSize: '0.7rem', color: TEAL, fontWeight: 600 }}>
                                    Custom-only mode is active — default categories are currently excluded.
                                </Typography>
                            </Box>
                        )}

                        <SectionLabel>
                            {localDefault.filter(c => c.isActive).length} of {localDefault.length} enabled
                        </SectionLabel>

                        <Stack spacing={0.75} sx={{ opacity: useCustomOnly ? 0.45 : 1, pointerEvents: useCustomOnly ? 'none' : 'auto' }}>
                            {localDefault.map(cat => (
                                <DefaultRow key={cat.id} cat={cat} onToggle={() => handleToggleDefault(cat.id!)} />
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Custom tab */}
                {activeTab === 1 && (
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5,
                        '&::-webkit-scrollbar': { width: 5 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(MAROON, 0.2), borderRadius: 3 },
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: SLATE, flex: 1, mr: 2 }}>
                                Create custom categories with optional budgets and savings goals. These are always included regardless of mode.
                            </Typography>
                            {!showAddForm && (
                                <Button size="small" variant="outlined" startIcon={<Plus size={13} />}
                                        onClick={() => setShowAddForm(true)}
                                        sx={{ flexShrink: 0, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem',
                                            borderColor: alpha(MAROON, 0.35), color: MAROON,
                                            '&:hover': { borderColor: MAROON, bgcolor: alpha(MAROON, 0.04) } }}>
                                    Add Category
                                </Button>
                            )}
                        </Box>

                        {showAddForm && (
                            <AddCategoryForm
                                onAdd={handleAddCustom}
                                onCancel={() => setShowAddForm(false)}
                            />
                        )}

                        {localCustom.length > 0 ? (
                            <>
                                <SectionLabel>{localCustom.length} custom {localCustom.length === 1 ? 'category' : 'categories'}</SectionLabel>
                                <Stack spacing={0.75}>
                                    {localCustom.map(cat => (
                                        <CustomCard key={cat.id} cat={cat} onDelete={() => handleDeleteCustom(cat.id!)} />
                                    ))}
                                </Stack>
                            </>
                        ) : !showAddForm && (
                            <Box sx={{
                                py: 5, textAlign: 'center',
                                borderRadius: '10px', border: `1px dashed ${alpha(MAROON, 0.2)}`,
                                bgcolor: alpha(MAROON, 0.02),
                            }}>
                                <PiggyBank size={36} color={alpha(MAROON, 0.3)} style={{ marginBottom: 10 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111', mb: 0.5 }}>
                                    No custom categories
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>
                                    Click "Add Category" above to create your first one.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* ── Footer ── */}
            <Box sx={{
                px: 3, py: 2,
                borderTop: `1px solid ${alpha(MAROON, 0.08)}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: '#fff',
            }}>
                {/* Summary pill */}
                <Chip size="small"
                      icon={<CheckCircle2 size={11} />}
                      label={`${totalActive} ${totalActive === 1 ? 'category' : 'categories'} will be saved`}
                      sx={{ bgcolor: alpha(GREEN, 0.09), color: GREEN, fontWeight: 700, fontSize: '0.65rem',
                          border: `1px solid ${alpha(GREEN, 0.22)}` }} />

                <Box sx={{ display: 'flex', gap: 1.25 }}>
                    <Button size="small" onClick={onClose}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                                color: SLATE, border: `1px solid ${alpha('#000', 0.15)}`,
                                '&:hover': { bgcolor: alpha('#000', 0.04) } }}>
                        Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSave} disabled={isSaving}
                            startIcon={isSaving ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <Save size={14} />}
                            sx={{ bgcolor: MAROON, color: '#fff', borderRadius: '8px', textTransform: 'none',
                                fontWeight: 700, fontSize: '0.75rem',
                                '&:hover': { bgcolor: MAROON2 },
                                '&:disabled': { bgcolor: alpha(MAROON, 0.3), color: 'rgba(255,255,255,0.6)' } }}>
                        {isSaving ? 'Saving…' : 'Save Changes'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default ManageBudgetCategoriesDialog;

// import React, { useState, useEffect } from 'react';
// import {
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     Button,
//     TextField,
//     Box,
//     Typography,
//     IconButton,
//     Stack,
//     Chip,
//     Card,
//     alpha,
//     Switch,
//     FormControlLabel,
//     Divider,
//     Tab,
//     Tabs,
//     List,
//     ListItem,
//     ListItemText,
//     ListItemSecondaryAction,
//     Tooltip,
//     InputAdornment
// } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import AddIcon from '@mui/icons-material/Add';
// import DeleteIcon from '@mui/icons-material/Delete';
// import EditIcon from '@mui/icons-material/Edit';
// import SaveIcon from '@mui/icons-material/Save';
// import CancelIcon from '@mui/icons-material/Cancel';
// import CategoryIcon from '@mui/icons-material/Category';
// import VisibilityIcon from '@mui/icons-material/Visibility';
// import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// interface BudgetCategory {
//     id?: number;
//     name: string;
//     budgetedAmount: number;
//     savingsGoal?: number;
//     isDefault: boolean;
//     isActive: boolean;
//     isCustom: boolean;
// }
//
// interface ManageBudgetCategoriesDialogProps {
//     open: boolean;
//     onClose: () => void;
//     defaultCategories: BudgetCategory[];
//     customCategories: BudgetCategory[];
//     onSaveCategories: (categories: BudgetCategory[], useCustomOnly: boolean) => Promise<void>;
// }
//
// const ManageBudgetCategoriesDialog: React.FC<ManageBudgetCategoriesDialogProps> = ({
//                                                                                        open,
//                                                                                        onClose,
//                                                                                        defaultCategories,
//                                                                                        customCategories,
//                                                                                        onSaveCategories
//                                                                                    }) => {
//     const [activeTab, setActiveTab] = useState(0);
//     const [useCustomOnly, setUseCustomOnly] = useState(false);
//     const [localDefaultCategories, setLocalDefaultCategories] = useState<BudgetCategory[]>(defaultCategories);
//     const [localCustomCategories, setLocalCustomCategories] = useState<BudgetCategory[]>(customCategories);
//     const [editingCategory, setEditingCategory] = useState<number | null>(null);
//     const [isSaving, setIsSaving] = useState(false);
//
//     // Sync local state with props when they change
//     useEffect(() => {
//         setLocalDefaultCategories(defaultCategories);
//     }, [defaultCategories]);
//
//     useEffect(() => {
//         setLocalCustomCategories(customCategories);
//     }, [customCategories]);
//
//     // New category form
//     const [newCategoryName, setNewCategoryName] = useState('');
//     const [newCategoryBudget, setNewCategoryBudget] = useState('');
//     const [newCategorySavings, setNewCategorySavings] = useState('');
//     const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
//
//     const handleAddCustomCategory = () => {
//         if (newCategoryName.trim() === '') {
//             alert('Please enter a category name');
//             return;
//         }
//
//         const budgetAmount = parseFloat(newCategoryBudget) || 0;
//         const savingsGoal = parseFloat(newCategorySavings) || 0;
//
//         const newCategory: BudgetCategory = {
//             id: Date.now(), // temporary ID, backend will assign real ID
//             name: newCategoryName.trim(),
//             budgetedAmount: budgetAmount,
//             savingsGoal: savingsGoal > 0 ? savingsGoal : undefined,
//             isDefault: false,
//             isActive: true,
//             isCustom: true
//         };
//
//         setLocalCustomCategories([...localCustomCategories, newCategory]);
//
//         // Reset form
//         setNewCategoryName('');
//         setNewCategoryBudget('');
//         setNewCategorySavings('');
//         setShowNewCategoryForm(false);
//     };
//
//     const handleDeleteCustomCategory = (id: number) => {
//         setLocalCustomCategories(localCustomCategories.filter(cat => cat.id !== id));
//     };
//
//     const handleToggleDefaultCategory = (id: number) => {
//         setLocalDefaultCategories(localDefaultCategories.map(cat =>
//             cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
//         ));
//     };
//
//     const handleSave = async () => {
//         setIsSaving(true);
//         try {
//             const allCategories = useCustomOnly
//                 ? localCustomCategories
//                 : [...localDefaultCategories.filter(cat => cat.isActive), ...localCustomCategories];
//
//             await onSaveCategories(allCategories, useCustomOnly);
//             onClose();
//         } catch (error) {
//             console.error('Error saving categories:', error);
//             alert('Failed to save categories. Please try again.');
//         } finally {
//             setIsSaving(false);
//         }
//     };
//
//     const handleUpdateCustomCategory = (id: number, field: 'budgetedAmount' | 'savingsGoal', value: number) => {
//         setLocalCustomCategories(localCustomCategories.map(cat =>
//             cat.id === id ? { ...cat, [field]: value } : cat
//         ));
//     };
//
//     return (
//         <Dialog
//             open={open}
//             onClose={onClose}
//             maxWidth="md"
//             fullWidth
//             PaperProps={{
//                 sx: {
//                     borderRadius: 3,
//                     maxHeight: '90vh'
//                 }
//             }}
//         >
//             {/* Header */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                 color: 'white',
//                 p: 3,
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center'
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                     <CategoryIcon />
//                     <Typography variant="h6" fontWeight={600}>
//                         Manage Budget Categories
//                     </Typography>
//                 </Box>
//                 <IconButton onClick={onClose} sx={{ color: 'white' }}>
//                     <CloseIcon />
//                 </IconButton>
//             </Box>
//
//             {/* Mode Toggle */}
//             <Box sx={{ px: 3, pt: 3, pb: 2 }}>
//                 <Card sx={{
//                     p: 2,
//                     bgcolor: alpha(useCustomOnly ? tealColor : maroonColor, 0.05),
//                     border: `1px solid ${alpha(useCustomOnly ? tealColor : maroonColor, 0.2)}`
//                 }}>
//                     <FormControlLabel
//                         control={
//                             <Switch
//                                 checked={useCustomOnly}
//                                 onChange={(e) => setUseCustomOnly(e.target.checked)}
//                                 sx={{
//                                     '& .MuiSwitch-switchBase.Mui-checked': {
//                                         color: tealColor,
//                                     },
//                                     '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
//                                         backgroundColor: tealColor,
//                                     }
//                                 }}
//                             />
//                         }
//                         label={
//                             <Box>
//                                 <Typography variant="body2" fontWeight={600}>
//                                     {useCustomOnly ? 'Using Custom Categories Only' : 'Using Default + Custom Categories'}
//                                 </Typography>
//                                 <Typography variant="caption" color="text.secondary">
//                                     {useCustomOnly
//                                         ? 'Only your custom categories will be used'
//                                         : 'Enabled default categories plus your custom categories will be used'
//                                     }
//                                 </Typography>
//                             </Box>
//                         }
//                     />
//                 </Card>
//             </Box>
//
//             {/* Tabs */}
//             <Tabs
//                 value={activeTab}
//                 onChange={(e, newValue) => setActiveTab(newValue)}
//                 sx={{
//                     px: 3,
//                     '& .MuiTab-root': {
//                         textTransform: 'none',
//                         fontWeight: 600
//                     },
//                     '& .MuiTabs-indicator': {
//                         backgroundColor: maroonColor
//                     }
//                 }}
//             >
//                 <Tab label={`Default Categories (${localDefaultCategories.filter(c => c.isActive).length})`} />
//                 <Tab label={`Custom Categories (${localCustomCategories.length})`} />
//             </Tabs>
//
//             <Divider />
//
//             <DialogContent sx={{ p: 0 }}>
//                 {/* Default Categories Tab */}
//                 {activeTab === 0 && (
//                     <Box sx={{ p: 3 }}>
//                         <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//                             These are the categories currently in your budget. Toggle them on/off to show or hide them from your budget view.
//                         </Typography>
//                         <List>
//                             {localDefaultCategories.map((category) => (
//                                 <ListItem
//                                     key={category.id}
//                                     sx={{
//                                         border: `1px solid ${alpha(category.isActive ? tealColor : '#ccc', 0.3)}`,
//                                         borderRadius: 2,
//                                         mb: 1,
//                                         bgcolor: alpha(category.isActive ? tealColor : '#ccc', 0.05)
//                                     }}
//                                 >
//                                     <ListItemText
//                                         primary={
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                                 <Typography variant="body1" fontWeight={600}>
//                                                     {category.name}
//                                                 </Typography>
//                                                 <Chip
//                                                     label="Default"
//                                                     size="small"
//                                                     sx={{
//                                                         height: 20,
//                                                         fontSize: '0.65rem',
//                                                         bgcolor: alpha(maroonColor, 0.1),
//                                                         color: maroonColor
//                                                     }}
//                                                 />
//                                             </Box>
//                                         }
//                                         secondary={
//                                             category.budgetedAmount > 0
//                                                 ? `Budgeted: $${category.budgetedAmount.toFixed(2)}`
//                                                 : 'No budget set'
//                                         }
//                                     />
//                                     <ListItemSecondaryAction>
//                                         <Tooltip title={category.isActive ? 'Disable category' : 'Enable category'}>
//                                             <IconButton
//                                                 edge="end"
//                                                 onClick={() => handleToggleDefaultCategory(category.id!)}
//                                                 sx={{
//                                                     color: category.isActive ? tealColor : '#999'
//                                                 }}
//                                             >
//                                                 {category.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
//                                             </IconButton>
//                                         </Tooltip>
//                                     </ListItemSecondaryAction>
//                                 </ListItem>
//                             ))}
//                         </List>
//                     </Box>
//                 )}
//
//                 {/* Custom Categories Tab */}
//                 {activeTab === 1 && (
//                     <Box sx={{ p: 3 }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                             <Typography variant="body2" color="text.secondary">
//                                 Create custom budget categories with optional budgeted amounts and savings goals.
//                             </Typography>
//                             {!showNewCategoryForm && (
//                                 <Button
//                                     variant="outlined"
//                                     size="small"
//                                     startIcon={<AddIcon />}
//                                     onClick={() => setShowNewCategoryForm(true)}
//                                     sx={{
//                                         borderColor: maroonColor,
//                                         color: maroonColor,
//                                         '&:hover': {
//                                             borderColor: maroonColor,
//                                             bgcolor: alpha(maroonColor, 0.05)
//                                         }
//                                     }}
//                                 >
//                                     Add Category
//                                 </Button>
//                             )}
//                         </Box>
//
//                         {/* New Category Form */}
//                         {showNewCategoryForm && (
//                             <Card sx={{
//                                 p: 2,
//                                 mb: 3,
//                                 bgcolor: alpha(tealColor, 0.05),
//                                 border: `1px solid ${alpha(tealColor, 0.2)}`
//                             }}>
//                                 <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
//                                     New Custom Category
//                                 </Typography>
//                                 <Stack spacing={2}>
//                                     <TextField
//                                         label="Category Name"
//                                         value={newCategoryName}
//                                         onChange={(e) => setNewCategoryName(e.target.value)}
//                                         size="small"
//                                         fullWidth
//                                         required
//                                         placeholder="e.g., Entertainment, Hobbies, Pet Care"
//                                     />
//                                     <TextField
//                                         label="Budgeted Amount (Optional)"
//                                         value={newCategoryBudget}
//                                         onChange={(e) => {
//                                             const value = e.target.value;
//                                             if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
//                                                 setNewCategoryBudget(value);
//                                             }
//                                         }}
//                                         size="small"
//                                         fullWidth
//                                         placeholder="0.00"
//                                         InputProps={{
//                                             startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                         }}
//                                     />
//                                     <TextField
//                                         label="Savings Goal (Optional)"
//                                         value={newCategorySavings}
//                                         onChange={(e) => {
//                                             const value = e.target.value;
//                                             if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
//                                                 setNewCategorySavings(value);
//                                             }
//                                         }}
//                                         size="small"
//                                         fullWidth
//                                         placeholder="0.00"
//                                         InputProps={{
//                                             startAdornment: <InputAdornment position="start">$</InputAdornment>
//                                         }}
//                                         helperText="Amount you want to save in this category"
//                                     />
//                                     <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
//                                         <Button
//                                             variant="outlined"
//                                             size="small"
//                                             onClick={() => {
//                                                 setShowNewCategoryForm(false);
//                                                 setNewCategoryName('');
//                                                 setNewCategoryBudget('');
//                                                 setNewCategorySavings('');
//                                             }}
//                                             startIcon={<CancelIcon />}
//                                         >
//                                             Cancel
//                                         </Button>
//                                         <Button
//                                             variant="contained"
//                                             size="small"
//                                             onClick={handleAddCustomCategory}
//                                             startIcon={<AddIcon />}
//                                             sx={{
//                                                 bgcolor: tealColor,
//                                                 '&:hover': {
//                                                     bgcolor: '#0f766e'
//                                                 }
//                                             }}
//                                         >
//                                             Add Category
//                                         </Button>
//                                     </Box>
//                                 </Stack>
//                             </Card>
//                         )}
//
//                         {/* Custom Categories List */}
//                         {localCustomCategories.length > 0 ? (
//                             <List>
//                                 {localCustomCategories.map((category) => (
//                                     <ListItem
//                                         key={category.id}
//                                         sx={{
//                                             border: `1px solid ${alpha(tealColor, 0.3)}`,
//                                             borderRadius: 2,
//                                             mb: 1,
//                                             bgcolor: alpha(tealColor, 0.05),
//                                             display: 'block',
//                                             p: 2
//                                         }}
//                                     >
//                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
//                                             <Box>
//                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//                                                     <Typography variant="body1" fontWeight={600}>
//                                                         {category.name}
//                                                     </Typography>
//                                                     <Chip
//                                                         label="Custom"
//                                                         size="small"
//                                                         sx={{
//                                                             height: 20,
//                                                             fontSize: '0.65rem',
//                                                             bgcolor: alpha(tealColor, 0.2),
//                                                             color: tealColor
//                                                         }}
//                                                     />
//                                                 </Box>
//                                                 <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
//                                                     <Box>
//                                                         <Typography variant="caption" color="text.secondary">
//                                                             Budgeted
//                                                         </Typography>
//                                                         <Typography variant="body2" fontWeight={600}>
//                                                             ${category.budgetedAmount.toFixed(2)}
//                                                         </Typography>
//                                                     </Box>
//                                                     {category.savingsGoal && category.savingsGoal > 0 && (
//                                                         <Box>
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 Savings Goal
//                                                             </Typography>
//                                                             <Typography variant="body2" fontWeight={600} color={tealColor}>
//                                                                 ${category.savingsGoal.toFixed(2)}
//                                                             </Typography>
//                                                         </Box>
//                                                     )}
//                                                 </Stack>
//                                             </Box>
//                                             <Tooltip title="Delete category">
//                                                 <IconButton
//                                                     edge="end"
//                                                     onClick={() => handleDeleteCustomCategory(category.id!)}
//                                                     sx={{
//                                                         color: '#dc2626',
//                                                         '&:hover': {
//                                                             bgcolor: alpha('#dc2626', 0.1)
//                                                         }
//                                                     }}
//                                                 >
//                                                     <DeleteIcon />
//                                                 </IconButton>
//                                             </Tooltip>
//                                         </Box>
//                                     </ListItem>
//                                 ))}
//                             </List>
//                         ) : (
//                             <Box sx={{
//                                 p: 4,
//                                 textAlign: 'center',
//                                 color: 'text.secondary',
//                                 bgcolor: alpha('#ccc', 0.05),
//                                 borderRadius: 2
//                             }}>
//                                 <CategoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
//                                 <Typography variant="body2">
//                                     No custom categories yet. Click "Add Category" to create one.
//                                 </Typography>
//                             </Box>
//                         )}
//                     </Box>
//                 )}
//             </DialogContent>
//
//             {/* Footer */}
//             <DialogActions sx={{ p: 3, pt: 2 }}>
//                 <Button onClick={onClose} variant="outlined">
//                     Cancel
//                 </Button>
//                 <Button
//                     onClick={handleSave}
//                     variant="contained"
//                     disabled={isSaving}
//                     startIcon={isSaving ? <SaveIcon /> : <SaveIcon />}
//                     sx={{
//                         bgcolor: maroonColor,
//                         '&:hover': {
//                             bgcolor: '#a00000'
//                         }
//                     }}
//                 >
//                     {isSaving ? 'Saving...' : 'Save Changes'}
//                 </Button>
//             </DialogActions>
//         </Dialog>
//     );
// };
//
// export default ManageBudgetCategoriesDialog;