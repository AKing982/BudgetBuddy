import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    Chip,
    LinearProgress,
    alpha,
    Card,
    Collapse,
    IconButton,
    Divider,
    MenuItem,
    Select,
    FormControl,
} from '@mui/material';
import {
    TrendingUp, TrendingDown, ShoppingCart, Tag, LayoutGrid,
    ChevronDown, ChevronUp, AlertTriangle, CheckCircle, BarChart2,
} from 'lucide-react';
import { GroceryBudgetWithTotals } from '../config/Types';
import { parseISO, isWithinInterval, endOfWeek, addWeeks, differenceInWeeks } from 'date-fns';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MAROON      = '#6b1a1a';
const MAROON_DARK = '#4a1010';
const TEAL        = '#0d9488';
const GREEN       = '#059669';
const AMBER       = '#d97706';
const RED         = '#dc2626';
const NAVY        = '#1e293b';
const SLATE       = '#64748b';

interface ItemAnalysis {
    itemName: string; totalSpent: number; purchaseCount: number;
    averageCost: number; category?: string; percentOfBudget: number;
}
interface CategoryAnalysis {
    category: string; totalSpent: number; itemCount: number; percentOfBudget: number;
}
interface GroceryAnalyticsPanelProps { budget: GroceryBudgetWithTotals; }

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{
        fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: SLATE, mb: 1.25,
    }}>
        {children}
    </Typography>
);

// Collapsible section header matching BudgetPage card-header style
const SectionHeader: React.FC<{
    icon: React.ReactNode; label: string; count?: number;
    expanded: boolean; onToggle: () => void; accent?: string;
    subtitle?: string;
}> = ({ icon, label, count, expanded, onToggle, accent = MAROON, subtitle }) => (
    <Box
        onClick={onToggle}
        sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 1.5, borderRadius: '10px', cursor: 'pointer', mb: 1.25,
            bgcolor: alpha(accent, 0.04),
            border: `1px solid ${alpha(accent, 0.12)}`,
            '&:hover': { bgcolor: alpha(accent, 0.08) },
            transition: 'background 0.15s',
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>
                    {label}
                </Typography>
                {subtitle && (
                    <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{subtitle}</Typography>
                )}
            </Box>
            {count !== undefined && (
                <Box sx={{
                    px: 0.75, py: 0.1, borderRadius: '20px',
                    bgcolor: alpha(accent, 0.12), color: accent,
                    fontSize: '0.65rem', fontWeight: 800,
                }}>
                    {count}
                </Box>
            )}
        </Box>
        <IconButton size="small" sx={{ color: accent, p: 0.5 }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </IconButton>
    </Box>
);

const GroceryAnalyticsPanel: React.FC<GroceryAnalyticsPanelProps> = ({ budget }) => {
    const [selectedWeek, setSelectedWeek] = useState<number>(0);
    const [expanded, setExpanded] = useState({ topItems: true, categories: false, reduce: true });
    const toggle = (k: keyof typeof expanded) => setExpanded(p => ({ ...p, [k]: !p[k] }));

    const weeks = useMemo(() => {
        const startDate  = parseISO(budget.startDate);
        const endDate    = parseISO(budget.endDate);
        const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
        return Array.from({ length: totalWeeks }, (_, i) => {
            const weekStart     = addWeeks(startDate, i);
            const weekEnd       = endOfWeek(weekStart, { weekStartsOn: 0 });
            const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
            return { weekNumber: i + 1, weekLabel: `Week ${i + 1}`, startDate: weekStart, endDate: actualWeekEnd };
        });
    }, [budget]);

    const analytics = useMemo(() => {
        const allItems = budget.stores.flatMap(store =>
            store.items.map(item => ({ ...item, storeName: store.storeName }))
        );
        const filteredItems = selectedWeek === 0 ? allItems : allItems.filter(item => {
            const wd = weeks.find(w => w.weekNumber === selectedWeek);
            return wd ? isWithinInterval(parseISO(item.datePurchased), { start: wd.startDate, end: wd.endDate }) : false;
        });

        const filteredTotal = filteredItems.reduce((s, i) => s + i.itemCost, 0);
        const periodBudget  = selectedWeek === 0 ? budget.budgetAmount : budget.budgetAmount / weeks.length;

        const itemMap = new Map<string, ItemAnalysis>();
        filteredItems.forEach(item => {
            const key = item.itemName.toLowerCase();
            if (!itemMap.has(key)) itemMap.set(key, { itemName: item.itemName, totalSpent: 0, purchaseCount: 0, averageCost: 0, category: item.category, percentOfBudget: 0 });
            const a = itemMap.get(key)!;
            a.totalSpent += item.itemCost;
            a.purchaseCount += (item.quantity || 1);
        });
        const items: ItemAnalysis[] = Array.from(itemMap.values()).map(item => ({
            ...item,
            averageCost: item.totalSpent / item.purchaseCount,
            percentOfBudget: filteredTotal > 0 ? (item.totalSpent / filteredTotal) * 100 : 0,
        })).sort((a, b) => b.totalSpent - a.totalSpent);

        const categoryMap = new Map<string, CategoryAnalysis>();
        filteredItems.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!categoryMap.has(cat)) categoryMap.set(cat, { category: cat, totalSpent: 0, itemCount: 0, percentOfBudget: 0 });
            const c = categoryMap.get(cat)!;
            c.totalSpent += item.itemCost;
            c.itemCount  += 1;
        });
        const categories: CategoryAnalysis[] = Array.from(categoryMap.values()).map(c => ({
            ...c, percentOfBudget: filteredTotal > 0 ? (c.totalSpent / filteredTotal) * 100 : 0,
        })).sort((a, b) => b.totalSpent - a.totalSpent);

        const itemsToReduce = items.filter(i => i.percentOfBudget > 10 || i.purchaseCount >= 3).slice(0, 10);
        const totalSavings  = itemsToReduce.reduce((s, i) => s + i.totalSpent * 0.2, 0);

        return {
            topItems: items.slice(0, 10), categories: categories.slice(0, 10),
            itemsToReduce, totalSavings,
            totalUniqueItems: items.length,
            avgItemCost: filteredItems.length > 0 ? filteredTotal / filteredItems.length : 0,
            filteredTotal, periodBudget,
        };
    }, [budget, selectedWeek, weeks]);

    const remaining        = analytics.periodBudget - analytics.filteredTotal;
    const budgetUsedPct    = (analytics.filteredTotal / analytics.periodBudget) * 100;
    const progressColor    = budgetUsedPct > 100 ? RED : budgetUsedPct > 80 ? AMBER : TEAL;

    return (
        <Box sx={{
            height: '100%', borderRadius: '16px', overflow: 'hidden',
            border: `1px solid ${alpha(TEAL, 0.2)}`,
            boxShadow: `0 4px 20px ${alpha(TEAL, 0.1)}`,
            display: 'flex', flexDirection: 'column', bgcolor: '#fff',
        }}>
            {/* ── Teal header — differentiates from maroon stats panel ── */}
            <Box sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(135deg, #0f766e 0%, ${TEAL} 55%, #14b8a6 100%)`,
                position: 'relative', overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BarChart2 size={17} color="#fff" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.01em' }}>
                                Spending Analytics
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                {selectedWeek === 0 ? 'Full period view' : `Week ${selectedWeek} view`}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Compact week selector */}
                    <FormControl size="small">
                        <Select
                            value={selectedWeek}
                            onChange={e => setSelectedWeek(e.target.value as number)}
                            sx={{
                                color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '8px',
                                minWidth: 100,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                                '& .MuiSvgIcon-root': { color: '#fff' },
                            }}
                        >
                            <MenuItem value={0}>All Weeks</MenuItem>
                            {weeks.map(w => (
                                <MenuItem key={w.weekNumber} value={w.weekNumber}>{w.weekLabel}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* ── Scrollable body ── */}
            <Box sx={{
                flex: 1, overflowY: 'auto', p: 2.5,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TEAL, 0.35), borderRadius: 3 },
            }}>

                {/* ── Budget snapshot ── */}
                <Card sx={{
                    p: 2.5, mb: 2.5, borderRadius: '12px', boxShadow: 'none',
                    border: `1px solid ${alpha(TEAL, 0.15)}`, bgcolor: alpha(TEAL, 0.04),
                }}>
                    <Box sx={{ display: 'flex', gap: 0, mb: 1.5 }}>
                        {[
                            { label: 'Spent', value: `$${analytics.filteredTotal.toFixed(2)}`, color: MAROON },
                            { label: 'Remaining', value: `$${Math.abs(remaining).toFixed(2)}${remaining < 0 ? ' over' : ''}`, color: remaining < 0 ? RED : GREEN },
                        ].map(({ label, value, color }, i, arr) => (
                            <Box key={label} sx={{ flex: 1, pr: i < arr.length - 1 ? 2 : 0, borderRight: i < arr.length - 1 ? `1px solid ${alpha('#000', 0.08)}` : 'none', pl: i > 0 ? 2 : 0 }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SLATE, mb: 0.25 }}>{label}</Typography>
                                <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>Budget used</Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: progressColor }}>{budgetUsedPct.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(budgetUsedPct, 100)}
                        sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: alpha(progressColor, 0.12),
                            '& .MuiLinearProgress-bar': { bgcolor: progressColor, borderRadius: 3 },
                        }}
                    />
                </Card>

                {/* ── Quick stats ── */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                    {[
                        { icon: <ShoppingCart size={15} />, label: 'Unique Items', value: analytics.totalUniqueItems, color: TEAL },
                        { icon: <Tag size={15} />, label: 'Avg. Item Cost', value: `$${analytics.avgItemCost.toFixed(2)}`, color: MAROON },
                    ].map(({ icon, label, value, color }) => (
                        <Box key={label} sx={{
                            flex: 1, p: 1.75, borderRadius: '10px',
                            bgcolor: alpha(color, 0.05), border: `1px solid ${alpha(color, 0.15)}`,
                        }}>
                            <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{label}</Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ mb: 2.5, borderColor: alpha('#000', 0.06) }} />

                {/* ── Top spending items ── */}
                <SectionHeader
                    icon={<TrendingUp size={15} />}
                    label="Top Spending Items"
                    count={analytics.topItems.length}
                    expanded={expanded.topItems}
                    onToggle={() => toggle('topItems')}
                    accent={MAROON}
                />
                <Collapse in={expanded.topItems}>
                    <Stack spacing={1.25} sx={{ mb: 2.5 }}>
                        {analytics.topItems.slice(0, 3).map((item, i) => (
                            <Box key={i} sx={{
                                p: 2, borderRadius: '10px',
                                bgcolor: '#fafafa', border: `1px solid ${alpha('#000', 0.06)}`,
                                '&:hover': { borderColor: alpha(TEAL, 0.3), bgcolor: alpha(TEAL, 0.02) },
                                transition: 'all 0.15s',
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{item.itemName}</Typography>
                                        {item.category && (
                                            <Box sx={{
                                                mt: 0.4, px: 0.75, py: 0.1, borderRadius: '20px', display: 'inline-block',
                                                bgcolor: alpha(TEAL, 0.1), color: TEAL, fontSize: '0.65rem', fontWeight: 700,
                                            }}>
                                                {item.category}
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: MAROON, fontVariantNumeric: 'tabular-nums' }}>
                                        ${item.totalSpent.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>
                                        {item.purchaseCount}x · avg ${item.averageCost.toFixed(2)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: TEAL }}>
                                        {item.percentOfBudget.toFixed(1)}% of spending
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(item.percentOfBudget, 100)}
                                    sx={{
                                        height: 3, borderRadius: 2,
                                        bgcolor: alpha(MAROON, 0.08),
                                        '& .MuiLinearProgress-bar': { bgcolor: MAROON, borderRadius: 2 },
                                    }}
                                />
                            </Box>
                        ))}
                        {analytics.topItems.length > 3 && (
                            <Typography sx={{ fontSize: '0.72rem', color: SLATE, textAlign: 'center', fontStyle: 'italic' }}>
                                +{analytics.topItems.length - 3} more items
                            </Typography>
                        )}
                    </Stack>
                </Collapse>

                <Divider sx={{ mb: 2.5, borderColor: alpha('#000', 0.06) }} />

                {/* ── Category breakdown ── */}
                <SectionHeader
                    icon={<LayoutGrid size={15} />}
                    label="Spending by Category"
                    count={analytics.categories.length}
                    expanded={expanded.categories}
                    onToggle={() => toggle('categories')}
                    accent={TEAL}
                />
                <Collapse in={expanded.categories}>
                    <Stack spacing={1.25} sx={{ mb: 2.5 }}>
                        {analytics.categories.slice(0, 5).map((cat, i) => (
                            <Box key={i} sx={{
                                p: 2, borderRadius: '10px',
                                bgcolor: alpha(TEAL, 0.03), border: `1px solid ${alpha(TEAL, 0.12)}`,
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{cat.category}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: TEAL, fontVariantNumeric: 'tabular-nums' }}>
                                        ${cat.totalSpent.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: SLATE }}>{cat.itemCount} items</Typography>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: TEAL }}>{cat.percentOfBudget.toFixed(1)}%</Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={cat.percentOfBudget}
                                    sx={{
                                        height: 3, borderRadius: 2,
                                        bgcolor: alpha(TEAL, 0.12),
                                        '& .MuiLinearProgress-bar': { bgcolor: TEAL, borderRadius: 2 },
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Collapse>

                <Divider sx={{ mb: 2.5, borderColor: alpha('#000', 0.06) }} />

                {/* ── Items to reduce ── */}
                {analytics.itemsToReduce.length > 0 ? (
                    <>
                        <SectionHeader
                            icon={<AlertTriangle size={15} />}
                            label="Items to Consider Reducing"
                            count={analytics.itemsToReduce.length}
                            expanded={expanded.reduce}
                            onToggle={() => toggle('reduce')}
                            accent={AMBER}
                            subtitle={`Potential savings: $${analytics.totalSavings.toFixed(2)}`}
                        />
                        <Collapse in={expanded.reduce}>
                            <Stack spacing={1.25}>
                                {analytics.itemsToReduce.slice(0, 3).map((item, i) => {
                                    const savings = item.totalSpent * 0.2;
                                    return (
                                        <Box key={i} sx={{
                                            p: 2, borderRadius: '10px',
                                            bgcolor: alpha(AMBER, 0.04),
                                            border: `1px solid ${alpha(AMBER, 0.18)}`,
                                            '&:hover': { bgcolor: alpha(AMBER, 0.07) },
                                            transition: 'background 0.15s',
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY }}>{item.itemName}</Typography>
                                                    {item.category && (
                                                        <Box sx={{
                                                            mt: 0.4, px: 0.75, py: 0.1, borderRadius: '20px', display: 'inline-block',
                                                            bgcolor: alpha(AMBER, 0.12), color: AMBER, fontSize: '0.65rem', fontWeight: 700,
                                                        }}>
                                                            {item.category}
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: AMBER, fontVariantNumeric: 'tabular-nums' }}>
                                                    ${item.totalSpent.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                                                <Box sx={{ px: 0.75, py: 0.2, borderRadius: '20px', bgcolor: alpha('#000', 0.05), fontSize: '0.65rem', fontWeight: 600, color: SLATE }}>
                                                    {item.purchaseCount}× purchased
                                                </Box>
                                                <Box sx={{ px: 0.75, py: 0.2, borderRadius: '20px', bgcolor: alpha('#000', 0.05), fontSize: '0.65rem', fontWeight: 600, color: SLATE }}>
                                                    {item.percentOfBudget.toFixed(1)}% of spending
                                                </Box>
                                            </Box>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', gap: 0.75, p: 1,
                                                bgcolor: alpha(GREEN, 0.07), borderRadius: '6px',
                                            }}>
                                                <TrendingDown size={13} color={GREEN} />
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: GREEN }}>
                                                    Save ${savings.toFixed(2)} with 20% reduction
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                {analytics.itemsToReduce.length > 3 && (
                                    <Typography sx={{ fontSize: '0.72rem', color: SLATE, textAlign: 'center', fontStyle: 'italic' }}>
                                        +{analytics.itemsToReduce.length - 3} more items to review
                                    </Typography>
                                )}
                            </Stack>
                        </Collapse>
                    </>
                ) : (
                    <Box sx={{
                        p: 3, borderRadius: '12px', textAlign: 'center',
                        bgcolor: alpha(GREEN, 0.05), border: `1px solid ${alpha(GREEN, 0.2)}`,
                    }}>
                        <CheckCircle size={36} color={GREEN} style={{ marginBottom: 8 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: GREEN, mb: 0.25 }}>
                            Great Job!
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: SLATE }}>
                            No high-impact items to reduce right now.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default GroceryAnalyticsPanel;

// import React, { useMemo, useState } from 'react';
// import {
//     Box,
//     Paper,
//     Typography,
//     Divider,
//     Stack,
//     Chip,
//     LinearProgress,
//     alpha,
//     useTheme,
//     Card,
//     Grid,
//     Tooltip,
//     FormControl,
//     InputLabel,
//     Select,
//     MenuItem,
//     Collapse,
//     IconButton
// } from '@mui/material';
// import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// import WarningAmberIcon from '@mui/icons-material/WarningAmber';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// import CategoryIcon from '@mui/icons-material/Category';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import { GroceryBudgetWithTotals } from '../config/Types';
// import { parseISO, isWithinInterval, endOfWeek, addWeeks, differenceInWeeks } from 'date-fns';
//
// interface ItemAnalysis {
//     itemName: string;
//     totalSpent: number;
//     purchaseCount: number;
//     averageCost: number;
//     category?: string;
//     percentOfBudget: number;
//     trend?: 'increasing' | 'stable' | 'decreasing';
// }
//
// interface CategoryAnalysis {
//     category: string;
//     totalSpent: number;
//     itemCount: number;
//     percentOfBudget: number;
// }
//
// interface GroceryAnalyticsPanelProps {
//     budget: GroceryBudgetWithTotals;
// }
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
// const warningColor = '#ea580c';
// const successColor = '#059669';
//
// const GroceryAnalyticsPanel: React.FC<GroceryAnalyticsPanelProps> = ({
//                                                                          budget
//                                                                      }) => {
//     const theme = useTheme();
//     const [selectedWeek, setSelectedWeek] = useState<number>(0); // 0 = All Weeks
//     const [expandedSections, setExpandedSections] = useState({
//         topItems: true,
//         categories: false,
//         itemsToReduce: true
//     });
//
//     // Calculate weeks from budget
//     const weeks = useMemo(() => {
//         const startDate = parseISO(budget.startDate);
//         const endDate = parseISO(budget.endDate);
//         const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;
//
//         const weeksList = [];
//         for (let i = 0; i < totalWeeks; i++) {
//             const weekStart = addWeeks(startDate, i);
//             const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
//             const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
//
//             weeksList.push({
//                 weekNumber: i + 1,
//                 weekLabel: `Week ${i + 1}`,
//                 startDate: weekStart,
//                 endDate: actualWeekEnd
//             });
//         }
//
//         return weeksList;
//     }, [budget]);
//
//     // Calculate analytics
//     const analytics = useMemo(() => {
//         // Collect all items from all stores
//         const allItems = budget.stores.flatMap(store =>
//             store.items.map(item => ({
//                 ...item,
//                 storeName: store.storeName
//             }))
//         );
//
//         // Filter by selected week if not "All Weeks"
//         const filteredItems = selectedWeek === 0
//             ? allItems
//             : allItems.filter(item => {
//                 const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
//                 if (!selectedWeekData) return false;
//
//                 const itemDate = parseISO(item.datePurchased);
//                 return isWithinInterval(itemDate, {
//                     start: selectedWeekData.startDate,
//                     end: selectedWeekData.endDate
//                 });
//             });
//
//         // Calculate total for filtered items
//         const filteredTotal = filteredItems.reduce((sum, item) => sum + item.itemCost, 0);
//
//         // Calculate budget for selected period
//         const periodBudget = selectedWeek === 0
//             ? budget.budgetAmount
//             : budget.budgetAmount / weeks.length;
//
//         // Group by item name
//         const itemMap = new Map<string, ItemAnalysis>();
//
//         filteredItems.forEach(item => {
//             const key = item.itemName.toLowerCase();
//             if (!itemMap.has(key)) {
//                 itemMap.set(key, {
//                     itemName: item.itemName,
//                     totalSpent: 0,
//                     purchaseCount: 0,
//                     averageCost: 0,
//                     category: item.category,
//                     percentOfBudget: 0
//                 });
//             }
//
//             const analysis = itemMap.get(key)!;
//             analysis.totalSpent += item.itemCost;
//             analysis.purchaseCount += (item.quantity || 1);
//         });
//
//         // Calculate averages and percentages
//         const items: ItemAnalysis[] = Array.from(itemMap.values()).map(item => ({
//             ...item,
//             averageCost: item.totalSpent / item.purchaseCount,
//             percentOfBudget: filteredTotal > 0 ? (item.totalSpent / filteredTotal) * 100 : 0
//         }));
//
//         // Sort by total spent
//         items.sort((a, b) => b.totalSpent - a.totalSpent);
//
//         // Category analysis
//         const categoryMap = new Map<string, CategoryAnalysis>();
//         filteredItems.forEach(item => {
//             const category = item.category || 'Uncategorized';
//             if (!categoryMap.has(category)) {
//                 categoryMap.set(category, {
//                     category,
//                     totalSpent: 0,
//                     itemCount: 0,
//                     percentOfBudget: 0
//                 });
//             }
//
//             const catAnalysis = categoryMap.get(category)!;
//             catAnalysis.totalSpent += item.itemCost;
//             catAnalysis.itemCount += 1;
//         });
//
//         const categories: CategoryAnalysis[] = Array.from(categoryMap.values()).map(cat => ({
//             ...cat,
//             percentOfBudget: filteredTotal > 0 ? (cat.totalSpent / filteredTotal) * 100 : 0
//         }));
//
//         categories.sort((a, b) => b.totalSpent - a.totalSpent);
//
//         // Identify items to reduce
//         const highSpendingThreshold = 10; // 10% of total budget
//         const highFrequencyThreshold = 3; // Purchased 3+ times
//
//         const itemsToReduce = items.filter(item =>
//             item.percentOfBudget > highSpendingThreshold ||
//             item.purchaseCount >= highFrequencyThreshold
//         );
//
//         // Calculate savings opportunity
//         const totalSavingsOpportunity = itemsToReduce.reduce((sum, item) =>
//             sum + (item.totalSpent * 0.2), 0 // Assume 20% reduction potential
//         );
//
//         return {
//             topItems: items.slice(0, 10), // Get top 10, but show only 3 initially
//             allItems: items,
//             categories: categories.slice(0, 10),
//             itemsToReduce: itemsToReduce.slice(0, 10),
//             totalSavingsOpportunity,
//             totalUniqueItems: items.length,
//             averageItemCost: filteredItems.length > 0
//                 ? filteredItems.reduce((sum, item) => sum + item.itemCost, 0) / filteredItems.length
//                 : 0,
//             filteredTotal,
//             periodBudget
//         };
//     }, [budget, selectedWeek, weeks]);
//
//     const budgetRemaining = analytics.periodBudget - analytics.filteredTotal;
//     const budgetUsedPercent = (analytics.filteredTotal / analytics.periodBudget) * 100;
//
//     const toggleSection = (section: keyof typeof expandedSections) => {
//         setExpandedSections(prev => ({
//             ...prev,
//             [section]: !prev[section]
//         }));
//     };
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
//                 background: `linear-gradient(135deg, ${tealColor} 0%, #14b8a6 100%)`,
//                 color: 'white',
//                 p: 3
//             }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//                     <TrendingUpIcon />
//                     <Typography variant="h6" fontWeight={600}>
//                         Spending Analytics
//                     </Typography>
//                 </Box>
//
//                 {/* Week Selector */}
//                 <FormControl fullWidth size="small" sx={{
//                     bgcolor: 'rgba(255, 255, 255, 0.15)',
//                     borderRadius: 2,
//                     '& .MuiOutlinedInput-root': {
//                         color: 'white',
//                         '& fieldset': {
//                             borderColor: 'rgba(255, 255, 255, 0.3)',
//                         },
//                         '&:hover fieldset': {
//                             borderColor: 'rgba(255, 255, 255, 0.5)',
//                         },
//                         '&.Mui-focused fieldset': {
//                             borderColor: 'white',
//                         },
//                     },
//                     '& .MuiSvgIcon-root': {
//                         color: 'white',
//                     },
//                     '& .MuiInputLabel-root': {
//                         color: 'rgba(255, 255, 255, 0.8)',
//                         '&.Mui-focused': {
//                             color: 'white',
//                         }
//                     }
//                 }}>
//                     <InputLabel>Time Period</InputLabel>
//                     <Select
//                         value={selectedWeek}
//                         label="Time Period"
//                         onChange={(e) => setSelectedWeek(e.target.value as number)}
//                         startAdornment={<CalendarTodayIcon sx={{ mr: 1, fontSize: 18 }} />}
//                     >
//                         <MenuItem value={0}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Typography fontWeight={600}>All Weeks</Typography>
//                                 <Chip label="Complete View" size="small" color="primary" sx={{ height: 20 }} />
//                             </Box>
//                         </MenuItem>
//                         <Divider />
//                         {weeks.map((week) => (
//                             <MenuItem key={week.weekNumber} value={week.weekNumber}>
//                                 {week.weekLabel}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>
//             </Box>
//
//             {/* Content */}
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
//                 {/* Budget Overview */}
//                 <Card sx={{ p: 2.5, mb: 3, bgcolor: alpha(tealColor, 0.05), borderRadius: 3 }}>
//                     <Grid container spacing={2}>
//                         <Grid item xs={6}>
//                             <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
//                                 Total Spent
//                             </Typography>
//                             <Typography variant="h5" fontWeight={700} color={maroonColor}>
//                                 ${analytics.filteredTotal.toFixed(2)}
//                             </Typography>
//                         </Grid>
//                         <Grid item xs={6}>
//                             <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
//                                 Remaining
//                             </Typography>
//                             <Typography
//                                 variant="h5"
//                                 fontWeight={700}
//                                 color={budgetRemaining >= 0 ? successColor : warningColor}
//                             >
//                                 ${Math.abs(budgetRemaining).toFixed(2)}
//                             </Typography>
//                         </Grid>
//                         <Grid item xs={12}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                                 <Typography variant="caption" color="text.secondary">
//                                     Budget Used ({selectedWeek === 0 ? 'Full Period' : `Week ${selectedWeek}`})
//                                 </Typography>
//                                 <Typography variant="caption" fontWeight={600} color={budgetUsedPercent > 100 ? warningColor : tealColor}>
//                                     {budgetUsedPercent.toFixed(1)}%
//                                 </Typography>
//                             </Box>
//                             <LinearProgress
//                                 variant="determinate"
//                                 value={Math.min(budgetUsedPercent, 100)}
//                                 sx={{
//                                     height: 8,
//                                     borderRadius: 4,
//                                     bgcolor: alpha(theme.palette.divider, 0.3),
//                                     '& .MuiLinearProgress-bar': {
//                                         borderRadius: 4,
//                                         background: budgetUsedPercent > 100
//                                             ? `linear-gradient(90deg, ${warningColor} 0%, #dc2626 100%)`
//                                             : `linear-gradient(90deg, ${tealColor} 0%, #14b8a6 100%)`
//                                     }
//                                 }}
//                             />
//                         </Grid>
//                     </Grid>
//                 </Card>
//
//                 {/* Quick Stats */}
//                 <Grid container spacing={2} sx={{ mb: 3 }}>
//                     <Grid item xs={6}>
//                         <Card sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 3 }}>
//                             <ShoppingCartIcon sx={{ fontSize: 20, color: theme.palette.info.main, mb: 1 }} />
//                             <Typography variant="h6" fontWeight={700}>
//                                 {analytics.totalUniqueItems}
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Unique Items
//                             </Typography>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={6}>
//                         <Card sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 3 }}>
//                             <LocalOfferIcon sx={{ fontSize: 20, color: theme.palette.secondary.main, mb: 1 }} />
//                             <Typography variant="h6" fontWeight={700}>
//                                 ${analytics.averageItemCost.toFixed(2)}
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                                 Avg. Item Cost
//                             </Typography>
//                         </Card>
//                     </Grid>
//                 </Grid>
//
//                 {/* Top Spending Items */}
//                 <Box sx={{ mb: 3 }}>
//                     <Box
//                         sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'space-between',
//                             mb: 2,
//                             cursor: 'pointer',
//                             p: 1,
//                             borderRadius: 2,
//                             '&:hover': {
//                                 bgcolor: alpha(theme.palette.action.hover, 0.05)
//                             }
//                         }}
//                         onClick={() => toggleSection('topItems')}
//                     >
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <TrendingUpIcon sx={{ fontSize: 20, color: maroonColor }} />
//                             <Typography variant="subtitle2" fontWeight={600} color="text.primary">
//                                 Top Spending Items
//                             </Typography>
//                             <Chip
//                                 label={analytics.topItems.length}
//                                 size="small"
//                                 sx={{ height: 20, fontSize: '0.7rem' }}
//                             />
//                         </Box>
//                         <IconButton size="small">
//                             {expandedSections.topItems ? <ExpandLessIcon /> : <ExpandMoreIcon />}
//                         </IconButton>
//                     </Box>
//
//                     <Collapse in={expandedSections.topItems}>
//                         <Stack spacing={1.5}>
//                             {analytics.topItems.slice(0, 3).map((item, index) => (
//                                 <Card
//                                     key={index}
//                                     sx={{
//                                         p: 2,
//                                         bgcolor: alpha(theme.palette.background.paper, 0.5),
//                                         borderRadius: 2,
//                                         border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
//                                         '&:hover': {
//                                             boxShadow: 2,
//                                             borderColor: alpha(tealColor, 0.3)
//                                         }
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
//                                         <Box>
//                                             <Typography variant="body2" fontWeight={600}>
//                                                 {item.itemName}
//                                             </Typography>
//                                             {item.category && (
//                                                 <Chip
//                                                     label={item.category}
//                                                     size="small"
//                                                     sx={{
//                                                         mt: 0.5,
//                                                         height: 18,
//                                                         fontSize: '0.65rem',
//                                                         bgcolor: alpha(tealColor, 0.1),
//                                                         color: tealColor
//                                                     }}
//                                                 />
//                                             )}
//                                         </Box>
//                                         <Typography variant="body1" fontWeight={700} color={maroonColor}>
//                                             ${item.totalSpent.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                                         <Typography variant="caption" color="text.secondary">
//                                             Purchased {item.purchaseCount}x • Avg: ${item.averageCost.toFixed(2)}
//                                         </Typography>
//                                         <Typography variant="caption" fontWeight={600} color={tealColor}>
//                                             {item.percentOfBudget.toFixed(1)}% of spending
//                                         </Typography>
//                                     </Box>
//
//                                     <LinearProgress
//                                         variant="determinate"
//                                         value={Math.min(item.percentOfBudget, 100)}
//                                         sx={{
//                                             height: 4,
//                                             borderRadius: 2,
//                                             bgcolor: alpha(theme.palette.divider, 0.2),
//                                             '& .MuiLinearProgress-bar': {
//                                                 borderRadius: 2,
//                                                 bgcolor: maroonColor
//                                             }
//                                         }}
//                                     />
//                                 </Card>
//                             ))}
//                             {analytics.topItems.length > 3 && (
//                                 <Typography
//                                     variant="caption"
//                                     color="text.secondary"
//                                     sx={{
//                                         textAlign: 'center',
//                                         fontStyle: 'italic',
//                                         pt: 1
//                                     }}
//                                 >
//                                     +{analytics.topItems.length - 3} more items
//                                 </Typography>
//                             )}
//                         </Stack>
//                     </Collapse>
//                 </Box>
//
//                 {/* Category Breakdown */}
//                 <Box sx={{ mb: 3 }}>
//                     <Box
//                         sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'space-between',
//                             mb: 2,
//                             cursor: 'pointer',
//                             p: 1,
//                             borderRadius: 2,
//                             '&:hover': {
//                                 bgcolor: alpha(theme.palette.action.hover, 0.05)
//                             }
//                         }}
//                         onClick={() => toggleSection('categories')}
//                     >
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                             <CategoryIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
//                             <Typography variant="subtitle2" fontWeight={600} color="text.primary">
//                                 Spending by Category
//                             </Typography>
//                             <Chip
//                                 label={analytics.categories.length}
//                                 size="small"
//                                 sx={{ height: 20, fontSize: '0.7rem' }}
//                             />
//                         </Box>
//                         <IconButton size="small">
//                             {expandedSections.categories ? <ExpandLessIcon /> : <ExpandMoreIcon />}
//                         </IconButton>
//                     </Box>
//
//                     <Collapse in={expandedSections.categories}>
//                         <Stack spacing={1.5}>
//                             {analytics.categories.slice(0, 5).map((category, index) => (
//                                 <Card
//                                     key={index}
//                                     sx={{
//                                         p: 2,
//                                         bgcolor: alpha(theme.palette.info.main, 0.03),
//                                         borderRadius: 2,
//                                         border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
//                                     }}
//                                 >
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                                         <Typography variant="body2" fontWeight={600}>
//                                             {category.category}
//                                         </Typography>
//                                         <Typography variant="body2" fontWeight={700} color={theme.palette.info.main}>
//                                             ${category.totalSpent.toFixed(2)}
//                                         </Typography>
//                                     </Box>
//
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                                         <Typography variant="caption" color="text.secondary">
//                                             {category.itemCount} items
//                                         </Typography>
//                                         <Typography variant="caption" fontWeight={600} color={theme.palette.info.main}>
//                                             {category.percentOfBudget.toFixed(1)}%
//                                         </Typography>
//                                     </Box>
//
//                                     <LinearProgress
//                                         variant="determinate"
//                                         value={category.percentOfBudget}
//                                         sx={{
//                                             height: 4,
//                                             borderRadius: 2,
//                                             bgcolor: alpha(theme.palette.divider, 0.2),
//                                             '& .MuiLinearProgress-bar': {
//                                                 borderRadius: 2,
//                                                 bgcolor: theme.palette.info.main
//                                             }
//                                         }}
//                                     />
//                                 </Card>
//                             ))}
//                             {analytics.categories.length > 5 && (
//                                 <Typography
//                                     variant="caption"
//                                     color="text.secondary"
//                                     sx={{
//                                         textAlign: 'center',
//                                         fontStyle: 'italic',
//                                         pt: 1
//                                     }}
//                                 >
//                                     +{analytics.categories.length - 5} more categories
//                                 </Typography>
//                             )}
//                         </Stack>
//                     </Collapse>
//                 </Box>
//
//                 {/* Items to Consider Reducing */}
//                 {analytics.itemsToReduce.length > 0 && (
//                     <Box>
//                         <Box
//                             sx={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'space-between',
//                                 mb: 2,
//                                 p: 2,
//                                 bgcolor: alpha(warningColor, 0.05),
//                                 borderRadius: 2,
//                                 border: `1px solid ${alpha(warningColor, 0.2)}`,
//                                 cursor: 'pointer',
//                                 '&:hover': {
//                                     bgcolor: alpha(warningColor, 0.08)
//                                 }
//                             }}
//                             onClick={() => toggleSection('itemsToReduce')}
//                         >
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
//                                 <WarningAmberIcon sx={{ fontSize: 20, color: warningColor }} />
//                                 <Box sx={{ flex: 1 }}>
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                         <Typography variant="subtitle2" fontWeight={600} color={warningColor}>
//                                             Items to Consider Reducing
//                                         </Typography>
//                                         <Chip
//                                             label={analytics.itemsToReduce.length}
//                                             size="small"
//                                             sx={{
//                                                 height: 20,
//                                                 fontSize: '0.7rem',
//                                                 bgcolor: alpha(warningColor, 0.15),
//                                                 color: warningColor
//                                             }}
//                                         />
//                                     </Box>
//                                     <Typography variant="caption" color="text.secondary">
//                                         Potential savings: ${analytics.totalSavingsOpportunity.toFixed(2)}
//                                     </Typography>
//                                 </Box>
//                             </Box>
//                             <IconButton size="small" sx={{ color: warningColor }}>
//                                 {expandedSections.itemsToReduce ? <ExpandLessIcon /> : <ExpandMoreIcon />}
//                             </IconButton>
//                         </Box>
//
//                         <Collapse in={expandedSections.itemsToReduce}>
//                             <Stack spacing={1.5}>
//                                 {analytics.itemsToReduce.slice(0, 3).map((item, index) => {
//                                     const savingsPotential = item.totalSpent * 0.2; // 20% reduction
//
//                                     return (
//                                         <Tooltip
//                                             key={index}
//                                             title={`High impact item: ${item.percentOfBudget.toFixed(1)}% of spending. Reducing by 20% could save $${savingsPotential.toFixed(2)}`}
//                                             arrow
//                                         >
//                                             <Card
//                                                 sx={{
//                                                     p: 2,
//                                                     bgcolor: alpha(warningColor, 0.02),
//                                                     borderRadius: 2,
//                                                     border: `1px solid ${alpha(warningColor, 0.15)}`,
//                                                     cursor: 'pointer',
//                                                     '&:hover': {
//                                                         boxShadow: 2,
//                                                         borderColor: alpha(warningColor, 0.3),
//                                                         bgcolor: alpha(warningColor, 0.05)
//                                                     }
//                                                 }}
//                                             >
//                                                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
//                                                     <Box>
//                                                         <Typography variant="body2" fontWeight={600}>
//                                                             {item.itemName}
//                                                         </Typography>
//                                                         {item.category && (
//                                                             <Chip
//                                                                 label={item.category}
//                                                                 size="small"
//                                                                 sx={{
//                                                                     mt: 0.5,
//                                                                     height: 18,
//                                                                     fontSize: '0.65rem',
//                                                                     bgcolor: alpha(warningColor, 0.1),
//                                                                     color: warningColor
//                                                                 }}
//                                                             />
//                                                         )}
//                                                     </Box>
//                                                     <Typography variant="body1" fontWeight={700} color={warningColor}>
//                                                         ${item.totalSpent.toFixed(2)}
//                                                     </Typography>
//                                                 </Box>
//
//                                                 <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
//                                                     <Chip
//                                                         label={`${item.purchaseCount}x purchased`}
//                                                         size="small"
//                                                         icon={<ShoppingCartIcon sx={{ fontSize: 14 }} />}
//                                                         sx={{
//                                                             height: 22,
//                                                             fontSize: '0.7rem',
//                                                             bgcolor: alpha(theme.palette.background.paper, 0.7)
//                                                         }}
//                                                     />
//                                                     <Chip
//                                                         label={`${item.percentOfBudget.toFixed(1)}% of spending`}
//                                                         size="small"
//                                                         sx={{
//                                                             height: 22,
//                                                             fontSize: '0.7rem',
//                                                             bgcolor: alpha(theme.palette.background.paper, 0.7)
//                                                         }}
//                                                     />
//                                                 </Stack>
//
//                                                 <Box sx={{
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     gap: 1,
//                                                     p: 1,
//                                                     bgcolor: alpha(successColor, 0.05),
//                                                     borderRadius: 1
//                                                 }}>
//                                                     <TrendingDownIcon sx={{ fontSize: 16, color: successColor }} />
//                                                     <Typography variant="caption" color={successColor} fontWeight={600}>
//                                                         Save ${savingsPotential.toFixed(2)} with 20% reduction
//                                                     </Typography>
//                                                 </Box>
//                                             </Card>
//                                         </Tooltip>
//                                     );
//                                 })}
//                                 {analytics.itemsToReduce.length > 3 && (
//                                     <Typography
//                                         variant="caption"
//                                         color="text.secondary"
//                                         sx={{
//                                             textAlign: 'center',
//                                             fontStyle: 'italic',
//                                             pt: 1
//                                         }}
//                                     >
//                                         +{analytics.itemsToReduce.length - 3} more items to review
//                                     </Typography>
//                                 )}
//                             </Stack>
//                         </Collapse>
//                     </Box>
//                 )}
//
//                 {/* No High-Impact Items Message */}
//                 {analytics.itemsToReduce.length === 0 && (
//                     <Card sx={{
//                         p: 3,
//                         bgcolor: alpha(successColor, 0.05),
//                         borderRadius: 3,
//                         textAlign: 'center',
//                         border: `1px solid ${alpha(successColor, 0.2)}`
//                     }}>
//                         <CheckCircleIcon sx={{ fontSize: 48, color: successColor, mb: 1 }} />
//                         <Typography variant="subtitle1" fontWeight={600} color={successColor} sx={{ mb: 0.5 }}>
//                             Great Job!
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                             Your spending is well-distributed. No high-impact items to reduce.
//                         </Typography>
//                     </Card>
//                 )}
//             </Box>
//         </Paper>
//     );
// };
//
// export default GroceryAnalyticsPanel;