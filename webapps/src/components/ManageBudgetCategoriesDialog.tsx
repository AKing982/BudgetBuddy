import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogContent, Button, TextField,
    Box, Typography, IconButton, Stack, Chip, alpha, Switch,
    Tabs, Tab, Tooltip, InputAdornment,
    CircularProgress, List, ListItem, ListItemButton, ListItemText,
    Collapse, Checkbox,
} from '@mui/material';
import {
    X, Plus, Trash2, Eye, EyeOff, Tag, CheckCircle2,
    LayoutGrid, Sparkles, PiggyBank, Save, Search, PenLine,
    ListChecks, ArrowLeftRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import CategoryService from '../services/CategoryService';
import UserCategoryService, { UserCategory } from '../services/UserCategoryService';

// ── Tokens ────────────────────────────────────────────────────────────────────
const MAROON  = '#6b1a1a';
const MAROON2 = '#4a1010';
const TEAL    = '#0d9488';
const TEAL2   = '#0f766e';
const GREEN   = '#059669';
const AMBER   = '#d97706';
const SLATE   = '#64748b';
const RED     = '#dc2626';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BudgetCategory {
    id?:            number;
    name:           string;
    budgetedAmount: number;
    savingsGoal?:   number;
    isDefault:      boolean;
    isActive:       boolean;
    isCustom:       boolean;
}

// Maps customCategoryId -> set of default category ids it replaces
type SwapMap = Record<number, Set<number>>;

interface ManageBudgetCategoriesDialogProps {
    open:              boolean;
    onClose:           () => void;
    defaultCategories: BudgetCategory[];
    customCategories:  BudgetCategory[];
    onSaveCategories:  (
        categories: BudgetCategory[],
        useCustomOnly: boolean,
        swappedDefaultIds: number[],
    ) => Promise<void>;
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
const DefaultRow: React.FC<{
    cat:         BudgetCategory;
    onToggle:    () => void;
    replacedBy?: string;
}> = ({ cat, onToggle, replacedBy }) => {
    const isReplaced       = Boolean(replacedBy);
    const effectivelyActive = cat.isActive && !isReplaced;

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.75, py: 1.25, borderRadius: '10px',
            border: `1px solid ${isReplaced ? alpha(AMBER, 0.3) : effectivelyActive ? alpha(TEAL, 0.25) : alpha('#000', 0.07)}`,
            borderLeft: `4px solid ${isReplaced ? AMBER : effectivelyActive ? TEAL : alpha('#000', 0.12)}`,
            bgcolor: isReplaced ? alpha(AMBER, 0.04) : effectivelyActive ? alpha(TEAL, 0.035) : '#fafafa',
            transition: 'all 0.15s ease',
            '&:hover': { boxShadow: `0 2px 8px ${alpha(isReplaced ? AMBER : TEAL, 0.1)}` },
        }}>
            <Box sx={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                bgcolor: isReplaced ? AMBER : effectivelyActive ? TEAL : alpha('#000', 0.2),
            }} />

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{
                        fontWeight: 700, fontSize: '0.8rem',
                        color: isReplaced ? alpha('#111', 0.45) : effectivelyActive ? '#111' : '#888',
                        textDecoration: isReplaced ? 'line-through' : 'none',
                    }}>
                        {cat.name}
                    </Typography>
                    <Chip size="small" label="Default"
                          sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800,
                              bgcolor: alpha(MAROON, 0.08), color: MAROON,
                              border: `1px solid ${alpha(MAROON, 0.18)}` }} />
                    {isReplaced && (
                        <Chip size="small"
                              icon={<ArrowLeftRight size={9} />}
                              label={`→ ${replacedBy}`}
                              sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700,
                                  bgcolor: alpha(AMBER, 0.12), color: AMBER,
                                  border: `1px solid ${alpha(AMBER, 0.25)}`,
                                  '& .MuiChip-icon': { color: AMBER, ml: '4px' } }} />
                    )}
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: SLATE, mt: 0.2 }}>
                    {isReplaced
                        ? 'Hidden — replaced by custom category'
                        : cat.budgetedAmount > 0
                            ? `$${cat.budgetedAmount.toFixed(2)} budgeted`
                            : 'No budget set'}
                </Typography>
            </Box>

            <Tooltip title={isReplaced ? 'Managed via custom category swap' : cat.isActive ? 'Disable category' : 'Enable category'}>
                <span>
                    <IconButton size="small" onClick={onToggle} disabled={isReplaced} sx={{
                        color: isReplaced ? alpha('#000', 0.2) : effectivelyActive ? TEAL : alpha('#000', 0.3),
                        '&:hover': { bgcolor: effectivelyActive ? alpha(TEAL, 0.1) : alpha('#000', 0.05) },
                    }}>
                        {effectivelyActive || isReplaced ? <Eye size={15} /> : <EyeOff size={15} />}
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
};

// ── Swap selector (inside custom card) ───────────────────────────────────────
const SwapSelector: React.FC<{
    customCatName: string;
    defaultCats:   BudgetCategory[];
    swappedIds:    Set<number>;
    allSwappedIds: Set<number>;
    onToggleSwap:  (defaultId: number) => void;
}> = ({ customCatName, defaultCats, swappedIds, allSwappedIds, onToggleSwap }) => {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return defaultCats.filter(c => !q || c.name.toLowerCase().includes(q));
    }, [defaultCats, search]);

    return (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${alpha(AMBER, 0.3)}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <ArrowLeftRight size={12} color={AMBER} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: AMBER }}>
                    Replace Default Categories
                </Typography>
                {swappedIds.size > 0 && (
                    <Chip size="small" label={`${swappedIds.size} selected`}
                          sx={{ height: 15, fontSize: '0.52rem', fontWeight: 700,
                              bgcolor: alpha(AMBER, 0.12), color: AMBER,
                              border: `1px solid ${alpha(AMBER, 0.25)}` }} />
                )}
            </Box>

            <Typography sx={{ fontSize: '0.65rem', color: SLATE, mb: 1.25, lineHeight: 1.5 }}>
                Check any default categories to hide them and have{' '}
                <strong style={{ color: TEAL }}>"{customCatName}"</strong> take their place in your budget.
            </Typography>

            {defaultCats.length > 6 && (
                <TextField fullWidth size="small" placeholder="Search defaults…"
                           value={search} onChange={e => setSearch(e.target.value)}
                           sx={{ ...fieldSx, mb: 1,
                               '& .MuiOutlinedInput-root': { borderRadius: '7px', fontSize: '0.75rem' } }}
                           InputProps={{
                               startAdornment: (
                                   <InputAdornment position="start">
                                       <Search size={12} color={SLATE} />
                                   </InputAdornment>
                               ),
                           }} />
            )}

            <Box sx={{
                borderRadius: '8px',
                border: `1px solid ${alpha(AMBER, 0.2)}`,
                bgcolor: alpha(AMBER, 0.02),
                overflow: 'hidden',
                maxHeight: 230,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(AMBER, 0.3), borderRadius: 2 },
            }}>
                {filtered.length === 0 ? (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: SLATE }}>No matching default categories</Typography>
                    </Box>
                ) : filtered.map((cat, i) => {
                    const isChecked  = swappedIds.has(cat.id!);
                    const isDisabled = !isChecked && allSwappedIds.has(cat.id!); // swapped by a different custom cat

                    return (
                        <Box key={cat.id} onClick={() => !isDisabled && onToggleSwap(cat.id!)} sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            px: 1.25, py: 0.85,
                            borderBottom: i < filtered.length - 1 ? `1px solid ${alpha('#000', 0.05)}` : 'none',
                            bgcolor: isChecked ? alpha(AMBER, 0.06) : 'transparent',
                            opacity: isDisabled ? 0.4 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'background 0.12s',
                            '&:hover': !isDisabled ? { bgcolor: isChecked ? alpha(AMBER, 0.09) : alpha(AMBER, 0.04) } : {},
                        }}>
                            <Checkbox size="small" checked={isChecked} disabled={isDisabled}
                                      onChange={() => !isDisabled && onToggleSwap(cat.id!)}
                                      onClick={e => e.stopPropagation()}
                                      sx={{ p: 0.5, color: alpha(AMBER, 0.4), '&.Mui-checked': { color: AMBER } }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: isChecked ? 700 : 500, color: '#111' }}>
                                    {cat.name}
                                </Typography>
                                {isDisabled && (
                                    <Typography sx={{ fontSize: '0.58rem', color: SLATE }}>
                                        Already swapped to another category
                                    </Typography>
                                )}
                            </Box>
                            {isChecked && <CheckCircle2 size={13} color={AMBER} style={{ flexShrink: 0 }} />}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

// ── Custom category card ──────────────────────────────────────────────────────
const CustomCard: React.FC<{
    cat:           BudgetCategory;
    defaultCats:   BudgetCategory[];
    swappedIds:    Set<number>;
    allSwappedIds: Set<number>;
    onDelete:      () => void;
    onToggleSwap:  (defaultId: number) => void;
}> = ({ cat, defaultCats, swappedIds, allSwappedIds, onDelete, onToggleSwap }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Box sx={{
            borderRadius: '10px',
            border: `1px solid ${alpha(TEAL, 0.22)}`,
            borderLeft: `4px solid ${TEAL}`,
            bgcolor: '#fff',
            transition: 'box-shadow 0.15s',
            overflow: 'hidden',
            '&:hover': { boxShadow: `0 3px 12px ${alpha(TEAL, 0.12)}` },
        }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.75, py: 1.25 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: TEAL }} />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#111' }}>
                            {cat.name}
                        </Typography>
                        <Chip size="small" label="Custom"
                              sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800,
                                  bgcolor: alpha(TEAL, 0.1), color: TEAL,
                                  border: `1px solid ${alpha(TEAL, 0.25)}` }} />
                        {swappedIds.size > 0 && (
                            <Chip size="small"
                                  icon={<ArrowLeftRight size={9} />}
                                  label={`Replaces ${swappedIds.size}`}
                                  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700,
                                      bgcolor: alpha(AMBER, 0.1), color: AMBER,
                                      border: `1px solid ${alpha(AMBER, 0.25)}`,
                                      '& .MuiChip-icon': { color: AMBER, ml: '4px' } }} />
                        )}
                    </Box>
                </Box>

                {/* Swap expand button */}
                <Tooltip title={expanded ? 'Close swap settings' : 'Choose which default categories this replaces'}>
                    <Box onClick={() => setExpanded(v => !v)} sx={{
                        display: 'flex', alignItems: 'center', gap: 0.4,
                        px: 1, py: 0.5, borderRadius: '6px', cursor: 'pointer',
                        border: `1px solid ${expanded ? alpha(AMBER, 0.35) : alpha('#000', 0.1)}`,
                        bgcolor: expanded ? alpha(AMBER, 0.08) : 'transparent',
                        color: expanded ? AMBER : SLATE,
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: alpha(AMBER, 0.1), color: AMBER, borderColor: alpha(AMBER, 0.3) },
                    }}>
                        <ArrowLeftRight size={12} />
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.03em' }}>
                            Swap
                        </Typography>
                        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </Box>
                </Tooltip>

                <Tooltip title="Remove custom category">
                    <IconButton size="small" onClick={onDelete}
                                sx={{ color: RED, '&:hover': { bgcolor: alpha(RED, 0.1) } }}>
                        <Trash2 size={14} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Expandable swap section */}
            <Collapse in={expanded}>
                <Box sx={{ px: 1.75, pb: 1.75 }}>
                    <SwapSelector
                        customCatName={cat.name}
                        defaultCats={defaultCats}
                        swappedIds={swappedIds}
                        allSwappedIds={allSwappedIds}
                        onToggleSwap={onToggleSwap}
                    />
                </Box>
            </Collapse>
        </Box>
    );
};

// ── Add category form ─────────────────────────────────────────────────────────
type AddMode = 'new' | 'existing';

const AddCategoryForm: React.FC<{
    onAdd:               (name: string) => void;
    onCancel:            () => void;
    existingBudgetNames: Set<string>;
}> = ({ onAdd, onCancel, existingBudgetNames }) => {
    const [mode,     setMode]     = useState<AddMode>('new');
    const [newName,  setNewName]  = useState('');
    const [search,   setSearch]   = useState('');
    const [selected, setSelected] = useState('');
    const [loading,  setLoading]  = useState(false);

    const [systemCats, setSystemCats] = useState<string[]>([]);
    const [userCats,   setUserCats]   = useState<UserCategory[]>([]);

    const categoryService     = CategoryService.getInstance();
    const userCategoryService = UserCategoryService.getInstance();
    const userId = Number(sessionStorage.getItem('userId'));

    useEffect(() => {
        if (mode !== 'existing') return;
        const load = async () => {
            setLoading(true);
            try {
                const [sys, usr] = await Promise.all([
                    categoryService.getAllSystemCategories(),
                    userCategoryService.getCustomUserCategories(userId),
                ]);
                setSystemCats(sys.map(c => c.category));
                setUserCats(usr);
            } catch (e) {
                console.error('Error fetching categories:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [mode, userId]);

    const allExisting = useMemo(() => {
        const set = new Set<string>();
        systemCats.forEach(c => set.add(c));
        userCats.forEach(c => { if (c.category) set.add(c.category); });
        return Array.from(set).sort();
    }, [systemCats, userCats]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allExisting.filter(c =>
            (!q || c.toLowerCase().includes(q)) && !existingBudgetNames.has(c)
        );
    }, [allExisting, search, existingBudgetNames]);

    const isSystemCat = (c: string) => systemCats.includes(c);
    const canAdd = mode === 'new' ? newName.trim().length > 0 : selected.length > 0;
    const handleAdd = () => {
        const name = mode === 'new' ? newName.trim() : selected;
        if (name) onAdd(name);
    };

    return (
        <Box sx={{ mb: 2, borderRadius: '12px', border: `1.5px solid ${alpha(TEAL, 0.3)}`, bgcolor: alpha(TEAL, 0.03), overflow: 'hidden' }}>
            {/* Mode tabs */}
            <Box sx={{ display: 'flex', borderBottom: `1px solid ${alpha(TEAL, 0.15)}` }}>
                {(['new', 'existing'] as AddMode[]).map((m) => (
                    <Box key={m} onClick={() => { setMode(m); setSelected(''); setSearch(''); }}
                         sx={{
                             flex: 1, py: 1.25, display: 'flex', alignItems: 'center',
                             justifyContent: 'center', gap: 0.75, cursor: 'pointer',
                             bgcolor: mode === m ? alpha(TEAL, 0.08) : 'transparent',
                             borderBottom: `2px solid ${mode === m ? TEAL : 'transparent'}`,
                             transition: 'all 0.15s',
                         }}>
                        {m === 'new'
                            ? <PenLine size={13} color={mode === m ? TEAL : SLATE} />
                            : <ListChecks size={13} color={mode === m ? TEAL : SLATE} />}
                        <Typography sx={{
                            fontSize: '0.68rem', fontWeight: 700,
                            color: mode === m ? TEAL : SLATE,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                            {m === 'new' ? 'New Name' : 'From Existing'}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ p: 2 }}>
                {mode === 'new' ? (
                    <TextField fullWidth size="small" label="Category Name *" sx={fieldSx}
                               value={newName} onChange={e => setNewName(e.target.value)}
                               placeholder="e.g. Entertainment, Pet Care, Hobbies"
                               onKeyDown={e => { if (e.key === 'Enter' && canAdd) handleAdd(); }}
                               autoFocus />
                ) : (
                    <Box>
                        <TextField fullWidth size="small" placeholder="Search categories…"
                                   sx={{ ...fieldSx, mb: 1 }}
                                   value={search} onChange={e => setSearch(e.target.value)}
                                   InputProps={{
                                       startAdornment: (
                                           <InputAdornment position="start">
                                               <Search size={14} color={SLATE} />
                                           </InputAdornment>
                                       ),
                                   }} />
                        {loading ? (
                            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={22} sx={{ color: TEAL }} />
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Box sx={{ py: 2.5, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.72rem', color: SLATE }}>
                                    {allExisting.length === 0
                                        ? 'No categories found. Try "New Name" instead.'
                                        : 'All matching categories are already added.'}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{
                                maxHeight: 200, overflowY: 'auto',
                                borderRadius: '8px', border: `1px solid ${alpha(TEAL, 0.15)}`, bgcolor: '#fff',
                                '&::-webkit-scrollbar': { width: 4 },
                                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TEAL, 0.25), borderRadius: 2 },
                            }}>
                                <List disablePadding>
                                    {filtered.map((cat, i) => {
                                        const isSys      = isSystemCat(cat);
                                        const isSelected = selected === cat;
                                        return (
                                            <ListItem key={cat} disablePadding
                                                      sx={{ borderBottom: i < filtered.length - 1 ? `1px solid ${alpha('#000', 0.05)}` : 'none' }}>
                                                <ListItemButton onClick={() => setSelected(cat)} sx={{
                                                    py: 0.9, px: 1.5,
                                                    bgcolor: isSelected ? alpha(TEAL, 0.08) : 'transparent',
                                                    '&:hover': { bgcolor: alpha(TEAL, 0.05) },
                                                }}>
                                                    <ListItemText primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <Typography sx={{
                                                                fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500,
                                                                color: isSelected ? TEAL : '#111', flex: 1,
                                                            }}>
                                                                {cat}
                                                            </Typography>
                                                            <Chip size="small" label={isSys ? 'System' : 'Custom'}
                                                                  sx={{
                                                                      height: 15, fontSize: '0.52rem', fontWeight: 700,
                                                                      bgcolor: alpha(isSys ? MAROON : TEAL, 0.1),
                                                                      color: isSys ? MAROON : TEAL,
                                                                      border: `1px solid ${alpha(isSys ? MAROON : TEAL, 0.2)}`,
                                                                  }} />
                                                        </Box>
                                                    } />
                                                    {isSelected && <CheckCircle2 size={14} color={TEAL} style={{ flexShrink: 0, marginLeft: 4 }} />}
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        )}
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                    <Button size="small" onClick={onCancel}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: SLATE,
                                borderRadius: '7px', '&:hover': { bgcolor: alpha('#000', 0.04) } }}>
                        Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleAdd}
                            disabled={!canAdd} startIcon={<Plus size={13} />}
                            sx={{ bgcolor: TEAL, color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem',
                                borderRadius: '7px', '&:hover': { bgcolor: TEAL2 },
                                '&:disabled': { bgcolor: alpha(TEAL, 0.3), color: 'rgba(255,255,255,0.6)' } }}>
                        Add
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const ManageBudgetCategoriesDialog: React.FC<ManageBudgetCategoriesDialogProps> = ({
                                                                                       open, onClose, defaultCategories, customCategories, onSaveCategories,
                                                                                   }) => {
    const [activeTab,     setActiveTab]     = useState(0);
    const [useCustomOnly, setUseCustomOnly] = useState(false);
    const [localDefault,  setLocalDefault]  = useState<BudgetCategory[]>(defaultCategories);
    const [localCustom,   setLocalCustom]   = useState<BudgetCategory[]>(customCategories);
    const [showAddForm,   setShowAddForm]   = useState(false);
    const [isSaving,      setIsSaving]      = useState(false);

    // swapMap: customCategoryId -> Set<defaultCategoryId>
    const [swapMap, setSwapMap] = useState<SwapMap>({});

    useEffect(() => { setLocalDefault(defaultCategories); }, [defaultCategories]);
    useEffect(() => { setLocalCustom(customCategories);   }, [customCategories]);

    // All default ids swapped to ANY custom category
    const allSwappedDefaultIds = useMemo(() => {
        const s = new Set<number>();
        Object.values(swapMap).forEach(ids => ids.forEach(id => s.add(id)));
        return s;
    }, [swapMap]);

    // defaultId -> customCatName for display
    const replacedByMap = useMemo(() => {
        const m: Record<number, string> = {};
        Object.entries(swapMap).forEach(([customId, defaultIds]) => {
            const customCat = localCustom.find(c => c.id === Number(customId));
            if (customCat) defaultIds.forEach(did => { m[did] = customCat.name; });
        });
        return m;
    }, [swapMap, localCustom]);

    const activeDefaultCount = localDefault.filter(c => c.isActive && !allSwappedDefaultIds.has(c.id!)).length;
    const swappedCount       = allSwappedDefaultIds.size;
    const totalActive        = useCustomOnly
        ? localCustom.length
        : activeDefaultCount + localCustom.length;

    const existingCustomNames = useMemo(() => new Set(localCustom.map(c => c.name)), [localCustom]);

    const handleAddCustom = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed || existingCustomNames.has(trimmed)) return;
        const newCat: BudgetCategory = {
            id:             Date.now(),
            name:           trimmed,
            budgetedAmount: 0,
            isDefault:      false,
            isActive:       true,
            isCustom:       true,
        };
        setLocalCustom(prev => [...prev, newCat]);
        setShowAddForm(false);
    };

    const handleToggleDefault = (id: number) =>
        setLocalDefault(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));

    const handleDeleteCustom = (id: number) => {
        setLocalCustom(prev => prev.filter(c => c.id !== id));
        setSwapMap(prev => { const n = { ...prev }; delete n[id]; return n; });
    };

    const handleToggleSwap = (customId: number, defaultId: number) => {
        setSwapMap(prev => {
            const current = new Set(prev[customId] ?? []);
            if (current.has(defaultId)) current.delete(defaultId); else current.add(defaultId);
            return { ...prev, [customId]: current };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const swappedDefaultIds = Array.from(allSwappedDefaultIds);
            const all = useCustomOnly
                ? localCustom
                : [
                    ...localDefault.filter(c => c.isActive && !allSwappedDefaultIds.has(c.id!)),
                    ...localCustom,
                ];
            await onSaveCategories(all, useCustomOnly, swappedDefaultIds);
            onClose();
        } catch { alert('Failed to save categories. Please try again.'); }
        finally   { setIsSaving(false); }
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
                            {swappedCount > 0 && ` · ${swappedCount} default${swappedCount > 1 ? 's' : ''} swapped out`}
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
                    { label: 'Default Active', value: activeDefaultCount, color: MAROON, dim: useCustomOnly },
                    { label: 'Swapped Out',    value: swappedCount,       color: AMBER,  dim: useCustomOnly },
                    { label: 'Custom',         value: localCustom.length, color: TEAL,   dim: false },
                    { label: 'Total Active',   value: totalActive,        color: '#111', dim: false, bold: true },
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
                            Toggle categories on or off. Categories marked{' '}
                            <Box component="span" sx={{ color: AMBER, fontWeight: 700 }}>↔ Replaced</Box>
                            {' '}are hidden because a custom category is swapping them out.
                        </Typography>

                        {useCustomOnly && (
                            <Box sx={{ p: 1.5, mb: 2, borderRadius: '8px', bgcolor: alpha(TEAL, 0.06), border: `1px solid ${alpha(TEAL, 0.2)}` }}>
                                <Typography sx={{ fontSize: '0.7rem', color: TEAL, fontWeight: 600 }}>
                                    Custom-only mode is active — default categories are currently excluded.
                                </Typography>
                            </Box>
                        )}

                        <SectionLabel>
                            {activeDefaultCount} of {localDefault.length} active
                            {swappedCount > 0 && ` · ${swappedCount} swapped out`}
                        </SectionLabel>

                        <Stack spacing={0.75} sx={{ opacity: useCustomOnly ? 0.45 : 1, pointerEvents: useCustomOnly ? 'none' : 'auto' }}>
                            {localDefault.map(cat => (
                                <DefaultRow key={cat.id} cat={cat}
                                            onToggle={() => handleToggleDefault(cat.id!)}
                                            replacedBy={replacedByMap[cat.id!]} />
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
                                Add custom categories and optionally swap out default ones. Click the{' '}
                                <Box component="span" sx={{ color: AMBER, fontWeight: 700 }}>↔ Swap</Box>
                                {' '}button on any card to pick which defaults it replaces.
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
                                existingBudgetNames={existingCustomNames}
                            />
                        )}

                        {localCustom.length > 0 ? (
                            <>
                                <SectionLabel>{localCustom.length} custom {localCustom.length === 1 ? 'category' : 'categories'}</SectionLabel>
                                <Stack spacing={0.75}>
                                    {localCustom.map(cat => (
                                        <CustomCard
                                            key={cat.id}
                                            cat={cat}
                                            defaultCats={localDefault}
                                            swappedIds={swapMap[cat.id!] ?? new Set()}
                                            allSwappedIds={allSwappedDefaultIds}
                                            onDelete={() => handleDeleteCustom(cat.id!)}
                                            onToggleSwap={(defaultId) => handleToggleSwap(cat.id!, defaultId)}
                                        />
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
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small"
                          icon={<CheckCircle2 size={11} />}
                          label={`${totalActive} ${totalActive === 1 ? 'category' : 'categories'} will be saved`}
                          sx={{ bgcolor: alpha(GREEN, 0.09), color: GREEN, fontWeight: 700, fontSize: '0.65rem',
                              border: `1px solid ${alpha(GREEN, 0.22)}` }} />
                    {swappedCount > 0 && (
                        <Chip size="small"
                              icon={<ArrowLeftRight size={10} />}
                              label={`${swappedCount} default${swappedCount > 1 ? 's' : ''} replaced`}
                              sx={{ bgcolor: alpha(AMBER, 0.09), color: AMBER, fontWeight: 700, fontSize: '0.65rem',
                                  border: `1px solid ${alpha(AMBER, 0.22)}`,
                                  '& .MuiChip-icon': { color: AMBER } }} />
                    )}
                </Stack>

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