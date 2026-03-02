import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    Chip,
    alpha,
    Divider,
    Collapse,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import {
    Receipt, Store, Calendar, Tag, ArrowLeft, List,
    ShoppingCart, DollarSign, LayoutGrid, ChevronDown, ChevronUp,
    PieChart as PieIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ReceiptSummary } from './GroceryBudgetTable';

// ── Design tokens (exact match with GroceryTracker / BudgetPage) ──────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';

const CHART_COLORS = ['#0d9488','#6b1a1a','#f59e0b','#8b5cf6','#ec4899','#10b981','#3b82f6','#f97316','#14b8a6','#a855f7'];

interface ReceiptDetailPanelProps {
    receipt: ReceiptSummary | null;
    weekReceipts?: ReceiptSummary[];
}

type ViewMode  = 'single' | 'week';
type ChartMode = 'store'  | 'category';

// ── Small reusable stat tile ─────────────────────────────────────────────────
const StatTile: React.FC<{ icon: React.ReactNode; value: string | number; label: string; color: string }> =
    ({ icon, value, label, color }) => (
        <Box sx={{
            flex: 1, p: 1.5, borderRadius: '10px', textAlign: 'center',
            bgcolor: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`,
        }}>
            <Box sx={{ color, display: 'flex', justifyContent: 'center', mb: 0.5 }}>{icon}</Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {value}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: SLATE, mt: 0.25 }}>{label}</Typography>
        </Box>
    );

// ── Custom pie tooltip ────────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', border: `1px solid ${alpha(MAROON, 0.12)}` }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY }}>{payload[0].name}</Typography>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>${payload[0].value.toFixed(2)}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{payload[0].payload.percentage.toFixed(1)}%</Typography>
        </Box>
    );
};

const ReceiptDetailPanel: React.FC<ReceiptDetailPanelProps> = ({ receipt, weekReceipts }) => {
    const [viewMode, setViewMode]               = useState<ViewMode>('single');
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSummary | null>(receipt);
    const [chartMode, setChartMode]             = useState<ChartMode>('store');
    const [expandedCats, setExpandedCats]       = useState<Set<string>>(new Set());

    React.useEffect(() => {
        setSelectedReceipt(receipt);
        setViewMode('single');
    }, [receipt]);

    const toggleCat = (name: string) =>
        setExpandedCats(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    // ── Receipt summary (categories + price range) ────────────────────────────
    const receiptSummary = useMemo(() => {
        if (!selectedReceipt) return null;
        const categoryMap = new Map<string, { items: any[]; total: number }>();
        selectedReceipt.items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!categoryMap.has(cat)) categoryMap.set(cat, { items: [], total: 0 });
            const d = categoryMap.get(cat)!;
            d.items.push(item);
            d.total += item.itemCost;
        });
        const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
            name,
            items: data.items.sort((a, b) => b.itemCost - a.itemCost),
            total: data.total,
            itemCount: data.items.length,
            percentage: (data.total / selectedReceipt.totalCost) * 100,
        })).sort((a, b) => b.total - a.total);

        const sorted      = [...selectedReceipt.items].sort((a, b) => b.itemCost - a.itemCost);
        const avgItemCost = selectedReceipt.totalCost / selectedReceipt.itemCount;
        return { categories, mostExpensive: sorted[0], leastExpensive: sorted[sorted.length - 1], avgItemCost };
    }, [selectedReceipt]);

    // ── Week summary (pie data) ───────────────────────────────────────────────
    const weekSummary = useMemo(() => {
        if (!weekReceipts?.length) return null;
        const total = weekReceipts.reduce((s, r) => s + r.totalCost, 0);
        const storeMap    = new Map<string, number>();
        const categoryMap = new Map<string, number>();
        weekReceipts.forEach(r => {
            storeMap.set(r.storeName, (storeMap.get(r.storeName) || 0) + r.totalCost);
            r.items.forEach(item => {
                const cat = item.category || 'Uncategorized';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.itemCost);
            });
        });
        const make = (map: Map<string, number>) =>
            Array.from(map.entries()).map(([name, value]) => ({ name, value, percentage: (value / total) * 100 })).sort((a, b) => b.value - a.value);
        return {
            totalSpending: total,
            byStore: make(storeMap),
            byCategory: make(categoryMap),
            totalItems: weekReceipts.reduce((s, r) => s + r.itemCount, 0),
            receiptCount: weekReceipts.length,
        };
    }, [weekReceipts]);

    // ── Empty state ───────────────────────────────────────────────────────────
    if (!receipt) {
        return (
            <Box sx={{
                height: '100%', borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${alpha(MAROON, 0.12)}`,
                boxShadow: `0 4px 20px ${alpha(MAROON, 0.08)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', p: 4, bgcolor: '#fafafa',
            }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: alpha(SLATE, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Receipt size={26} color={SLATE} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: NAVY, mb: 0.5 }}>Select a Receipt</Typography>
                <Typography sx={{ fontSize: '0.82rem', color: SLATE, textAlign: 'center' }}>Click a receipt to view details</Typography>
            </Box>
        );
    }

    const subtotal = selectedReceipt?.totalCost || 0;
    const tax      = subtotal * 0.08;
    const total    = subtotal + tax;

    return (
        <Box sx={{
            height: '100%', borderRadius: '16px', overflow: 'hidden',
            border: `1px solid ${alpha(MAROON, 0.12)}`,
            boxShadow: `0 4px 20px ${alpha(MAROON, 0.1)}`,
            display: 'flex', flexDirection: 'column', bgcolor: '#fff',
        }}>

            {/* ── Maroon header ── */}
            <Box sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 55%, #5a1515 100%)`,
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                {/* Title row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: viewMode === 'single' ? 2 : 0, position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Receipt size={17} color="#fff" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                {viewMode === 'week' ? 'Week Receipts' : 'Receipt Details'}
                            </Typography>
                            {viewMode === 'week' && (
                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                    {receipt.weekLabel} · {weekReceipts?.length} receipts
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Nav buttons */}
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        {viewMode === 'week' && (
                            <IconButton size="small" onClick={() => setViewMode('single')} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '7px', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                                <ArrowLeft size={15} />
                            </IconButton>
                        )}
                        {weekReceipts && weekReceipts.length > 1 && viewMode === 'single' && (
                            <IconButton size="small" onClick={() => setViewMode('week')} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '7px', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }} title="View all receipts this week">
                                <List size={15} />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {/* Single-receipt meta */}
                {viewMode === 'single' && selectedReceipt && (
                    <Stack spacing={0.75} sx={{ position: 'relative' }}>
                        {[
                            { icon: <Store size={13} />, text: selectedReceipt.storeName },
                            { icon: <Calendar size={13} />, text: format(parseISO(selectedReceipt.purchaseDate), 'EEEE, MMMM d, yyyy') },
                            { icon: <Tag size={13} />, text: selectedReceipt.weekLabel },
                        ].map(({ icon, text }) => (
                            <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{ color: 'rgba(255,255,255,0.65)', display: 'flex' }}>{icon}</Box>
                                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{text}</Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', p: 2.5,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TEAL, 0.35), borderRadius: 3 },
            }}>

                {/* ════════════ SINGLE RECEIPT VIEW ════════════ */}
                {viewMode === 'single' && receiptSummary && selectedReceipt && (
                    <>
                        {/* Quick stats */}
                        <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5 }}>
                            <StatTile icon={<ShoppingCart size={15} />} value={selectedReceipt.itemCount} label="Items" color={TEAL} />
                            <StatTile icon={<DollarSign size={15} />} value={`$${receiptSummary.avgItemCost.toFixed(2)}`} label="Avg Cost" color={MAROON} />
                            <StatTile icon={<LayoutGrid size={15} />} value={receiptSummary.categories.length} label="Categories" color="#7c3aed" />
                        </Box>

                        {/* Price range */}
                        <Box sx={{
                            p: 2, mb: 2.5, borderRadius: '10px',
                            bgcolor: alpha(TEAL, 0.04), border: `1px solid ${alpha(TEAL, 0.15)}`,
                        }}>
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: SLATE, mb: 1.25 }}>
                                Price Range
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0 }}>
                                {[
                                    { label: 'Most Expensive', item: receiptSummary.mostExpensive, color: MAROON },
                                    { label: 'Least Expensive', item: receiptSummary.leastExpensive, color: TEAL },
                                ].map(({ label, item, color }, i, arr) => (
                                    <Box key={label} sx={{ flex: 1, pr: i < arr.length - 1 ? 2 : 0, borderRight: i < arr.length - 1 ? `1px solid ${alpha('#000', 0.08)}` : 'none', pl: i > 0 ? 2 : 0 }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: SLATE, mb: 0.25 }}>{label}</Typography>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: NAVY, mb: 0.25, lineHeight: 1.2 }}>{item.itemName}</Typography>
                                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>${item.itemCost.toFixed(2)}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Items by category */}
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: SLATE, mb: 1.25 }}>
                            Items by Category ({selectedReceipt.itemCount})
                        </Typography>

                        <Stack spacing={1}>
                            {receiptSummary.categories.map((cat) => {
                                const open = expandedCats.has(cat.name);
                                return (
                                    <Box key={cat.name} sx={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${alpha('#000', 0.07)}` }}>
                                        {/* Category header */}
                                        <Box
                                            onClick={() => toggleCat(cat.name)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                px: 2, py: 1.25, cursor: 'pointer',
                                                bgcolor: open ? alpha(TEAL, 0.06) : alpha(TEAL, 0.03),
                                                '&:hover': { bgcolor: alpha(TEAL, 0.08) },
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LayoutGrid size={13} color={TEAL} />
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{cat.name}</Typography>
                                                <Box sx={{ px: 0.75, py: 0.1, borderRadius: '20px', bgcolor: alpha(TEAL, 0.12), color: TEAL, fontSize: '0.62rem', fontWeight: 800 }}>
                                                    {cat.itemCount}
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                                    ${cat.total.toFixed(2)}
                                                </Typography>
                                                <Box sx={{ color: SLATE, display: 'flex' }}>
                                                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Category items */}
                                        <Collapse in={open}>
                                            <Box sx={{ bgcolor: '#fafafa' }}>
                                                {cat.items.map((item, idx) => (
                                                    <Box key={idx} sx={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        px: 2, py: 1.25,
                                                        borderTop: `1px solid ${alpha('#000', 0.05)}`,
                                                        '&:hover': { bgcolor: alpha(TEAL, 0.03) },
                                                    }}>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: NAVY }}>{item.itemName}</Typography>
                                                            {item.itemDescription && (
                                                                <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{item.itemDescription}</Typography>
                                                            )}
                                                            {item.quantity > 1 && (
                                                                <Typography sx={{ fontSize: '0.65rem', color: SLATE }}>Qty: {item.quantity}</Typography>
                                                            )}
                                                        </Box>
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums', flexShrink: 0, ml: 1 }}>
                                                            ${item.itemCost.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </>
                )}

                {/* ════════════ WEEK VIEW ════════════ */}
                {viewMode === 'week' && weekReceipts && weekSummary && (
                    <>
                        {/* Week stats */}
                        <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5 }}>
                            <StatTile icon={<DollarSign size={15} />} value={`$${weekSummary.totalSpending.toFixed(2)}`} label="Total" color={MAROON} />
                            <StatTile icon={<Receipt size={15} />} value={weekSummary.receiptCount} label="Receipts" color={TEAL} />
                            <StatTile icon={<ShoppingCart size={15} />} value={weekSummary.totalItems} label="Items" color="#7c3aed" />
                        </Box>

                        {/* Pie chart */}
                        <Box sx={{
                            p: 2, mb: 2.5, borderRadius: '12px',
                            bgcolor: alpha(TEAL, 0.03), border: `1px solid ${alpha(TEAL, 0.12)}`,
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: SLATE }}>
                                    Spending Breakdown
                                </Typography>
                                <ToggleButtonGroup
                                    value={chartMode} exclusive
                                    onChange={(_, v) => { if (v) setChartMode(v); }}
                                    size="small"
                                    sx={{
                                        '& .MuiToggleButton-root': {
                                            px: 1.25, py: 0.4, fontSize: '0.7rem', textTransform: 'none',
                                            fontWeight: 600, color: SLATE,
                                            border: `1px solid ${alpha('#000', 0.1)}`,
                                            '&.Mui-selected': {
                                                bgcolor: MAROON, color: '#fff',
                                                '&:hover': { bgcolor: MAROON_DARK },
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="store">By Store</ToggleButton>
                                    <ToggleButton value="category">By Category</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            <Box sx={{ height: 260 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartMode === 'store' ? weekSummary.byStore : weekSummary.byCategory}
                                            cx="50%" cy="45%"
                                            labelLine={false}
                                            label={({ percentage }) => `${percentage.toFixed(0)}%`}
                                            outerRadius={75}
                                            dataKey="value"
                                        >
                                            {(chartMode === 'store' ? weekSummary.byStore : weekSummary.byCategory).map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                        <Legend
                                            verticalAlign="bottom" height={36}
                                            formatter={value => (
                                                <span style={{ fontSize: '0.72rem', color: NAVY, fontWeight: 600 }}>{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>

                        {/* Receipt list */}
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: SLATE, mb: 1.25 }}>
                            All Receipts · {receipt.weekLabel} ({weekReceipts.length})
                        </Typography>

                        <Stack spacing={1}>
                            {weekReceipts.map(r => (
                                <Box
                                    key={r.id}
                                    onClick={() => { setSelectedReceipt(r); setViewMode('single'); }}
                                    sx={{
                                        p: 2, borderRadius: '10px', cursor: 'pointer',
                                        border: `1px solid ${selectedReceipt?.id === r.id ? alpha(TEAL, 0.35) : alpha('#000', 0.07)}`,
                                        bgcolor: selectedReceipt?.id === r.id ? alpha(TEAL, 0.05) : '#fafafa',
                                        '&:hover': { borderColor: alpha(TEAL, 0.3), bgcolor: alpha(TEAL, 0.06), boxShadow: `0 2px 8px ${alpha(TEAL, 0.1)}` },
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(TEAL, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Store size={14} color={TEAL} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{r.storeName}</Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>
                                                    {format(parseISO(r.purchaseDate), 'MMM d, yyyy')} · {r.itemCount} items
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                            ${r.totalCost.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </>
                )}
            </Box>

            {/* ── Receipt total footer (single view only) ── */}
            {viewMode === 'single' && (
                <Box sx={{
                    px: 3, py: 2,
                    borderTop: `1px solid ${alpha(MAROON, 0.1)}`,
                    bgcolor: alpha(MAROON, 0.02),
                }}>
                    <Stack spacing={0.75}>
                        {[
                            { label: 'Subtotal', value: subtotal, bold: false },
                            { label: 'Tax (8%)', value: tax, bold: false },
                        ].map(({ label, value, bold }) => (
                            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>{label}</Typography>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: bold ? 700 : 500, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>
                                    ${value.toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                        <Divider sx={{ borderColor: alpha(MAROON, 0.1), my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: MAROON }}>Total</Typography>
                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                ${total.toFixed(2)}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default ReceiptDetailPanel;




// import React, { useMemo, useState } from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     Divider,
//     Chip,
//     Stack,
//     alpha,
//     useTheme,
//     Card,
//     Grid,
//     Table,
//     TableBody,
//     TableCell,
//     TableRow,
//     Accordion,
//     AccordionSummary,
//     AccordionDetails,
//     IconButton,
//     List,
//     ListItemButton,
//     ListItemText
// } from '@mui/material';
// import { format, parseISO } from 'date-fns';
// import StoreIcon from '@mui/icons-material/Store';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import CategoryIcon from '@mui/icons-material/Category';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
// import ViewListIcon from '@mui/icons-material/ViewList';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import { ReceiptSummary } from './GroceryBudgetTable';
//
// interface ReceiptDetailPanelProps {
//     receipt: ReceiptSummary | null;
//     weekReceipts?: ReceiptSummary[]; // All receipts from the same week
// }
//
// type ViewMode = 'single' | 'week';
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// const ReceiptDetailPanel: React.FC<ReceiptDetailPanelProps> = ({ receipt, weekReceipts }) => {
//     const theme = useTheme();
//     const [viewMode, setViewMode] = useState<ViewMode>('single');
//     const [selectedReceipt, setSelectedReceipt] = useState<ReceiptSummary | null>(receipt);
//
//     // Update selected receipt when prop changes
//     React.useEffect(() => {
//         setSelectedReceipt(receipt);
//         setViewMode('single');
//     }, [receipt]);
//
//     // Calculate receipt summary for the currently selected receipt
//     const receiptSummary = useMemo(() => {
//         if (!selectedReceipt) return null;
//
//         // Group items by category
//         const categoryMap = new Map<string, { items: any[], total: number }>();
//
//         selectedReceipt.items.forEach(item => {
//             const category = item.category || 'Uncategorized';
//             if (!categoryMap.has(category)) {
//                 categoryMap.set(category, { items: [], total: 0 });
//             }
//             const categoryData = categoryMap.get(category)!;
//             categoryData.items.push(item);
//             categoryData.total += item.itemCost;
//         });
//
//         const categories = Array.from(categoryMap.entries())
//             .map(([name, data]) => ({
//                 name,
//                 items: data.items.sort((a, b) => b.itemCost - a.itemCost),
//                 total: data.total,
//                 itemCount: data.items.length,
//                 percentage: (data.total / selectedReceipt.totalCost) * 100
//             }))
//             .sort((a, b) => b.total - a.total);
//
//         const sortedItems = [...selectedReceipt.items].sort((a, b) => b.itemCost - a.itemCost);
//         const mostExpensive = sortedItems[0];
//         const leastExpensive = sortedItems[sortedItems.length - 1];
//         const avgItemCost = selectedReceipt.totalCost / selectedReceipt.itemCount;
//
//         return {
//             categories,
//             mostExpensive,
//             leastExpensive,
//             avgItemCost
//         };
//     }, [selectedReceipt]);
//
//     if (!receipt) {
//         return (
//             <Paper sx={{
//                 height: '100%',
//                 borderRadius: 4,
//                 boxShadow: 3,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column',
//                 p: 4,
//                 background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
//             }}>
//                 <ReceiptLongIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
//                 <Typography variant="h6" color="text.secondary" fontWeight={500}>
//                     Select a receipt
//                 </Typography>
//                 <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
//                     Click on a receipt to view details
//                 </Typography>
//             </Paper>
//         );
//     }
//
//     const subtotal = selectedReceipt?.totalCost || 0;
//     const tax = subtotal * 0.08;
//     const total = subtotal + tax;
//
//     return (
//         <Paper sx={{
//             height: '100%',
//             borderRadius: 4,
//             boxShadow: 3,
//             overflow: 'hidden',
//             display: 'flex',
//             flexDirection: 'column'
//         }}>
//             {/* Header */}
//             <Box sx={{
//                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
//                 color: 'white',
//                 p: 3
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <ReceiptLongIcon />
//                         <Typography variant="h6" fontWeight={600}>
//                             {viewMode === 'week' ? 'Week Receipts' : 'Receipt Details'}
//                         </Typography>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', gap: 1 }}>
//                         {viewMode === 'week' && (
//                             <IconButton
//                                 size="small"
//                                 onClick={() => setViewMode('single')}
//                                 sx={{
//                                     color: 'white',
//                                     bgcolor: 'rgba(255, 255, 255, 0.1)',
//                                     '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
//                                 }}
//                             >
//                                 <ArrowBackIcon />
//                             </IconButton>
//                         )}
//
//                         {weekReceipts && weekReceipts.length > 1 && viewMode === 'single' && (
//                             <IconButton
//                                 size="small"
//                                 onClick={() => setViewMode('week')}
//                                 sx={{
//                                     color: 'white',
//                                     bgcolor: 'rgba(255, 255, 255, 0.1)',
//                                     '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
//                                 }}
//                                 title="View all receipts from this week"
//                             >
//                                 <ViewListIcon />
//                             </IconButton>
//                         )}
//                     </Box>
//                 </Box>
//
//                 {viewMode === 'single' ? (
//                     <Stack spacing={1.5}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <StoreIcon sx={{ fontSize: 18 }} />
//                             <Typography variant="body1" fontWeight={500}>
//                                 {selectedReceipt?.storeName}
//                             </Typography>
//                         </Box>
//
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <CalendarTodayIcon sx={{ fontSize: 18 }} />
//                             <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                 {selectedReceipt && format(parseISO(selectedReceipt.purchaseDate), 'EEEE, MMMM d, yyyy')}
//                             </Typography>
//                         </Box>
//
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <LocalOfferIcon sx={{ fontSize: 18 }} />
//                             <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                                 {selectedReceipt?.weekLabel}
//                             </Typography>
//                         </Box>
//                     </Stack>
//                 ) : (
//                     <Box>
//                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                             {receipt.weekLabel} • {weekReceipts?.length} receipts
//                         </Typography>
//                     </Box>
//                 )}
//             </Box>
//
//             {/* Scrollable Content */}
//             <Box sx={{
//                 flex: 1,
//                 overflowY: 'auto',
//                 p: 3,
//                 '&::-webkit-scrollbar': {
//                     width: '8px',
//                 },
//                 '&::-webkit-scrollbar-track': {
//                     backgroundColor: 'rgba(0,0,0,0.05)',
//                 },
//                 '&::-webkit-scrollbar-thumb': {
//                     backgroundColor: tealColor,
//                     borderRadius: '4px',
//                     '&:hover': {
//                         backgroundColor: '#0f766e',
//                     },
//                 },
//             }}>
//                 {/* SINGLE RECEIPT VIEW */}
//                 {viewMode === 'single' && receiptSummary && selectedReceipt && (
//                     <>
//                         {/* Quick Stats */}
//                         <Grid container spacing={2} sx={{ mb: 3 }}>
//                             <Grid item xs={4}>
//                                 <Card sx={{ bgcolor: alpha(tealColor, 0.05), borderRadius: 2, p: 1.5, textAlign: 'center' }}>
//                                     <ShoppingCartIcon sx={{ fontSize: 20, color: tealColor, mb: 0.5 }} />
//                                     <Typography variant="h6" fontWeight={700}>
//                                         {selectedReceipt.itemCount}
//                                     </Typography>
//                                     <Typography variant="caption" color="text.secondary">
//                                         Items
//                                     </Typography>
//                                 </Card>
//                             </Grid>
//                             <Grid item xs={4}>
//                                 <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, p: 1.5, textAlign: 'center' }}>
//                                     <AttachMoneyIcon sx={{ fontSize: 20, color: theme.palette.info.main, mb: 0.5 }} />
//                                     <Typography variant="h6" fontWeight={700}>
//                                         ${receiptSummary.avgItemCost.toFixed(2)}
//                                     </Typography>
//                                     <Typography variant="caption" color="text.secondary">
//                                         Avg
//                                     </Typography>
//                                 </Card>
//                             </Grid>
//                             <Grid item xs={4}>
//                                 <Card sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 2, p: 1.5, textAlign: 'center' }}>
//                                     <CategoryIcon sx={{ fontSize: 20, color: theme.palette.secondary.main, mb: 0.5 }} />
//                                     <Typography variant="h6" fontWeight={700}>
//                                         {receiptSummary.categories.length}
//                                     </Typography>
//                                     <Typography variant="caption" color="text.secondary">
//                                         Categories
//                                     </Typography>
//                                 </Card>
//                             </Grid>
//                         </Grid>
//
//                         {/* Price Range */}
//                         <Card sx={{
//                             mb: 3,
//                             bgcolor: alpha(tealColor, 0.03),
//                             border: `1px solid ${alpha(tealColor, 0.2)}`,
//                             borderRadius: 2,
//                             p: 2
//                         }}>
//                             <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
//                                 Price Range
//                             </Typography>
//                             <Grid container spacing={2}>
//                                 <Grid item xs={6}>
//                                     <Box>
//                                         <Typography variant="caption" color="text.secondary">
//                                             Most Expensive
//                                         </Typography>
//                                         <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
//                                             {receiptSummary.mostExpensive.itemName}
//                                         </Typography>
//                                         <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                             ${receiptSummary.mostExpensive.itemCost.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//                                 </Grid>
//                                 <Grid item xs={6}>
//                                     <Box>
//                                         <Typography variant="caption" color="text.secondary">
//                                             Least Expensive
//                                         </Typography>
//                                         <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
//                                             {receiptSummary.leastExpensive.itemName}
//                                         </Typography>
//                                         <Typography variant="h6" fontWeight={700} color={tealColor}>
//                                             ${receiptSummary.leastExpensive.itemCost.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//                                 </Grid>
//                             </Grid>
//                         </Card>
//
//                         {/* Items by Category */}
//                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                             Items by Category ({selectedReceipt.itemCount})
//                         </Typography>
//
//                         {receiptSummary.categories.map((category, index) => (
//                             <Accordion
//                                 key={index}
//                                 defaultExpanded={index === 0}
//                                 sx={{
//                                     mb: 1,
//                                     borderRadius: 2,
//                                     '&:before': { display: 'none' },
//                                     boxShadow: 'none',
//                                     border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         bgcolor: alpha(tealColor, 0.03),
//                                         borderRadius: 2
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                             <CategoryIcon sx={{ fontSize: 18, color: tealColor }} />
//                                             <Typography variant="body2" fontWeight={600}>
//                                                 {category.name}
//                                             </Typography>
//                                             <Chip
//                                                 label={`${category.itemCount} items`}
//                                                 size="small"
//                                                 sx={{ height: 20, fontSize: '0.7rem' }}
//                                             />
//                                         </Box>
//                                         <Typography variant="body2" fontWeight={700} color={maroonColor}>
//                                             ${category.total.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//                                 </AccordionSummary>
//                                 <AccordionDetails sx={{ pt: 2 }}>
//                                     <Table>
//                                         <TableBody>
//                                             {category.items.map((item, itemIndex) => (
//                                                 <TableRow
//                                                     key={itemIndex}
//                                                     sx={{
//                                                         '&:last-child td': {
//                                                             borderBottom: 0
//                                                         }
//                                                     }}
//                                                 >
//                                                     <TableCell sx={{ py: 1.5, px: 0, border: 0 }}>
//                                                         <Typography variant="body2" fontWeight={500}>
//                                                             {item.itemName}
//                                                         </Typography>
//                                                         {item.itemDescription && (
//                                                             <Typography variant="caption" color="text.secondary">
//                                                                 {item.itemDescription}
//                                                             </Typography>
//                                                         )}
//                                                         {item.quantity && item.quantity > 1 && (
//                                                             <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
//                                                                 Qty: {item.quantity}
//                                                             </Typography>
//                                                         )}
//                                                     </TableCell>
//                                                     <TableCell align="right" sx={{ py: 1.5, px: 0, border: 0 }}>
//                                                         <Typography variant="body2" fontWeight={600} color={maroonColor}>
//                                                             ${item.itemCost.toFixed(2)}
//                                                         </Typography>
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ))}
//                                         </TableBody>
//                                     </Table>
//                                 </AccordionDetails>
//                             </Accordion>
//                         ))}
//                     </>
//                 )}
//
//                 {/* WEEK RECEIPTS VIEW */}
//                 {viewMode === 'week' && weekReceipts && (
//                     <>
//                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                             All Receipts from {receipt.weekLabel} ({weekReceipts.length})
//                         </Typography>
//
//                         <Stack spacing={1.5}>
//                             {weekReceipts.map((r) => (
//                                 <Card
//                                     key={r.id}
//                                     onClick={() => {
//                                         setSelectedReceipt(r);
//                                         setViewMode('single');
//                                     }}
//                                     sx={{
//                                         p: 2,
//                                         cursor: 'pointer',
//                                         border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
//                                         borderRadius: 2,
//                                         bgcolor: selectedReceipt?.id === r.id ? alpha(tealColor, 0.05) : 'background.paper',
//                                         transition: 'all 0.2s',
//                                         '&:hover': {
//                                             boxShadow: 2,
//                                             borderColor: alpha(tealColor, 0.3),
//                                             bgcolor: alpha(tealColor, 0.08)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                             <StoreIcon sx={{ fontSize: 18, color: tealColor }} />
//                                             <Box>
//                                                 <Typography variant="body2" fontWeight={600}>
//                                                     {r.storeName}
//                                                 </Typography>
//                                                 <Typography variant="caption" color="text.secondary">
//                                                     {format(parseISO(r.purchaseDate), 'MMM d, yyyy')} • {r.itemCount} items
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                         <Typography variant="body1" fontWeight={700} color={maroonColor}>
//                                             ${r.totalCost.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//                                 </Card>
//                             ))}
//                         </Stack>
//                     </>
//                 )}
//             </Box>
//
//             {/* Receipt Total Section */}
//             {viewMode === 'single' && (
//                 <Box sx={{
//                     borderTop: `2px solid ${theme.palette.divider}`,
//                     p: 3,
//                     backgroundColor: alpha(tealColor, 0.02)
//                 }}>
//                     <Stack spacing={1.5}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Typography variant="body2" color="text.secondary">
//                                 Subtotal
//                             </Typography>
//                             <Typography variant="body2" fontWeight={500}>
//                                 ${subtotal.toFixed(2)}
//                             </Typography>
//                         </Box>
//
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Typography variant="body2" color="text.secondary">
//                                 Tax (8%)
//                             </Typography>
//                             <Typography variant="body2" fontWeight={500}>
//                                 ${tax.toFixed(2)}
//                             </Typography>
//                         </Box>
//
//                         <Divider sx={{ my: 1 }} />
//
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Typography variant="h6" fontWeight={600} color={maroonColor}>
//                                 Total
//                             </Typography>
//                             <Typography variant="h6" fontWeight={700} color={maroonColor}>
//                                 ${total.toFixed(2)}
//                             </Typography>
//                         </Box>
//                     </Stack>
//                 </Box>
//             )}
//         </Paper>
//     );
// };
//
// export default ReceiptDetailPanel;
//
//
// //
// // import React from 'react';
// // import {
// //     Box,
// //     Paper,
// //     Typography,
// //     Divider,
// //     Table,
// //     TableBody,
// //     TableCell,
// //     TableRow,
// //     Chip,
// //     Stack,
// //     alpha,
// //     useTheme
// // } from '@mui/material';
// // import { format, parseISO } from 'date-fns';
// // import StoreIcon from '@mui/icons-material/Store';
// // import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// // import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// // import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// // import { ReceiptSummary } from './GroceryBudgetTable';
// //
// // interface ReceiptDetailPanelProps {
// //     receipt: ReceiptSummary | null;
// // }
// //
// // const maroonColor = '#800000';
// // const tealColor = '#0d9488';
// //
// // const ReceiptDetailPanel: React.FC<ReceiptDetailPanelProps> = ({ receipt }) => {
// //     const theme = useTheme();
// //
// //     if (!receipt) {
// //         return (
// //             <Paper sx={{
// //                 height: '100%',
// //                 borderRadius: 4,
// //                 boxShadow: 3,
// //                 display: 'flex',
// //                 alignItems: 'center',
// //                 justifyContent: 'center',
// //                 flexDirection: 'column',
// //                 p: 4,
// //                 background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
// //             }}>
// //                 <ReceiptLongIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
// //                 <Typography variant="h6" color="text.secondary" fontWeight={500}>
// //                     Select a receipt
// //                 </Typography>
// //                 <Typography variant="body2" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
// //                     Click on a receipt from the list to view detailed items
// //                 </Typography>
// //             </Paper>
// //         );
// //     }
// //
// //     const subtotal = receipt.totalCost;
// //     const tax = subtotal * 0.08; // Assuming 8% tax (adjust as needed)
// //     const total = subtotal + tax;
// //
// //     return (
// //         <Paper sx={{
// //             height: '100%',
// //             borderRadius: 4,
// //             boxShadow: 3,
// //             overflow: 'hidden',
// //             display: 'flex',
// //             flexDirection: 'column'
// //         }}>
// //             {/* Header */}
// //             <Box sx={{
// //                 background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
// //                 color: 'white',
// //                 p: 3
// //             }}>
// //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
// //                     <ReceiptLongIcon />
// //                     <Typography variant="h6" fontWeight={600}>
// //                         Receipt Details
// //                     </Typography>
// //                 </Box>
// //
// //                 <Stack spacing={1.5}>
// //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                         <StoreIcon sx={{ fontSize: 18 }} />
// //                         <Typography variant="body1" fontWeight={500}>
// //                             {receipt.storeName}
// //                         </Typography>
// //                     </Box>
// //
// //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                         <CalendarTodayIcon sx={{ fontSize: 18 }} />
// //                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
// //                             {format(parseISO(receipt.purchaseDate), 'EEEE, MMMM d, yyyy')}
// //                         </Typography>
// //                     </Box>
// //
// //                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                         <LocalOfferIcon sx={{ fontSize: 18 }} />
// //                         <Typography variant="body2" sx={{ opacity: 0.9 }}>
// //                             {receipt.weekLabel}
// //                         </Typography>
// //                     </Box>
// //                 </Stack>
// //             </Box>
// //
// //             {/* Items List */}
// //             <Box sx={{
// //                 flex: 1,
// //                 overflowY: 'auto',
// //                 p: 3,
// //                 '&::-webkit-scrollbar': {
// //                     width: '8px',
// //                 },
// //                 '&::-webkit-scrollbar-track': {
// //                     backgroundColor: 'rgba(0,0,0,0.05)',
// //                 },
// //                 '&::-webkit-scrollbar-thumb': {
// //                     backgroundColor: tealColor,
// //                     borderRadius: '4px',
// //                     '&:hover': {
// //                         backgroundColor: '#0f766e',
// //                     },
// //                 },
// //             }}>
// //                 <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
// //                     Items ({receipt.itemCount})
// //                 </Typography>
// //
// //                 <Table>
// //                     <TableBody>
// //                         {receipt.items.map((item, index) => (
// //                             <TableRow
// //                                 key={index}
// //                                 sx={{
// //                                     '&:hover': {
// //                                         backgroundColor: alpha(tealColor, 0.04)
// //                                     },
// //                                     '&:last-child td': {
// //                                         borderBottom: 0
// //                                     }
// //                                 }}
// //                             >
// //                                 <TableCell sx={{ py: 2, px: 0, border: 0 }}>
// //                                     <Typography variant="body2" fontWeight={500}>
// //                                         {item.itemName}
// //                                     </Typography>
// //                                     {item.category && (
// //                                         <Chip
// //                                             label={item.category}
// //                                             size="small"
// //                                             sx={{
// //                                                 mt: 0.5,
// //                                                 height: 20,
// //                                                 fontSize: '0.7rem',
// //                                                 backgroundColor: alpha(tealColor, 0.1),
// //                                                 color: tealColor,
// //                                                 fontWeight: 500
// //                                             }}
// //                                         />
// //                                     )}
// //                                     {item.itemDescription && (
// //                                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
// //                                             {item.itemDescription}
// //                                         </Typography>
// //                                     )}
// //                                     {item.quantity && item.quantity > 1 && (
// //                                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
// //                                             Quantity: {item.quantity}
// //                                         </Typography>
// //                                     )}
// //                                 </TableCell>
// //                                 <TableCell align="right" sx={{ py: 2, px: 0, border: 0 }}>
// //                                     <Typography variant="body2" fontWeight={600} color={maroonColor}>
// //                                         ${item.itemCost.toFixed(2)}
// //                                     </Typography>
// //                                 </TableCell>
// //                             </TableRow>
// //                         ))}
// //                     </TableBody>
// //                 </Table>
// //             </Box>
// //
// //             {/* Receipt Total Section */}
// //             <Box sx={{
// //                 borderTop: `2px solid ${theme.palette.divider}`,
// //                 p: 3,
// //                 backgroundColor: alpha(tealColor, 0.02)
// //             }}>
// //                 <Stack spacing={1.5}>
// //                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                         <Typography variant="body2" color="text.secondary">
// //                             Subtotal
// //                         </Typography>
// //                         <Typography variant="body2" fontWeight={500}>
// //                             ${subtotal.toFixed(2)}
// //                         </Typography>
// //                     </Box>
// //
// //                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                         <Typography variant="body2" color="text.secondary">
// //                             Tax (8%)
// //                         </Typography>
// //                         <Typography variant="body2" fontWeight={500}>
// //                             ${tax.toFixed(2)}
// //                         </Typography>
// //                     </Box>
// //
// //                     <Divider sx={{ my: 1 }} />
// //
// //                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                         <Typography variant="h6" fontWeight={600} color={maroonColor}>
// //                             Total
// //                         </Typography>
// //                         <Typography variant="h6" fontWeight={700} color={maroonColor}>
// //                             ${total.toFixed(2)}
// //                         </Typography>
// //                     </Box>
// //                 </Stack>
// //             </Box>
// //         </Paper>
// //     );
// // };
// //
// // export default ReceiptDetailPanel;