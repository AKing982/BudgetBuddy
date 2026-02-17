import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    Skeleton,
    ToggleButtonGroup,
    ToggleButton,
    alpha,
    useTheme,
    Grid
} from "@mui/material";
import React, { useMemo, useState } from "react";
import { Table as TableIcon, BarChart3 } from 'lucide-react';
import BudgetCategoryCard from './BudgetCategoryCard';

interface TopExpenseCategoryProps {
    isLoading: boolean;
    categories: {
        categoryName: string;
        budgetedAmount: number;
        actualAmount: number;
        remainingAmount: number;
        startDate: number[];
        endDate: number[];
        isActive: boolean;
    }[];
}

const maroonColor = '#800000';
const tealColor = '#0d9488';

const TopExpenseCategory: React.FC<TopExpenseCategoryProps> = ({ isLoading, categories }) => {
    const theme = useTheme();
    const [viewType, setViewType] = useState<'numeric' | 'visual'>('visual');

    const processedCategories = useMemo(() => {
        if (!categories?.length) return [];

        return categories
            .map(category => ({
                name: category.categoryName,
                budgeted: category.budgetedAmount || 0,
                actual: category.actualAmount || 0,
                remaining: category.remainingAmount || 0,
            }))
            .sort((a, b) => b.actual - a.actual)
            .slice(0, 5);
    }, [categories]);

    const formatCurrency = (amount: number) => `$${Math.abs(amount).toFixed(2)}`;

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    const renderNumericView = () => (
        <TableContainer component={Paper} sx={{
            boxShadow: 3,
            borderRadius: 4,
            overflow: 'hidden',
            transition: 'box-shadow 0.3s ease-in-out',
            '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.15)' }
        }}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'background.paper' }}>
                        {['Category', 'Budgeted', 'Actual', 'Remaining'].map((header, i) => (
                            <TableCell key={header} align={i === 0 ? 'left' : 'right'} sx={{ fontWeight: 'bold', color: maroonColor, fontSize: '0.95rem' }}>
                                {header}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {processedCategories.length > 0 ? (
                        processedCategories.map((row) => (
                            <TableRow key={row.name}>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                                <TableCell align="right">{formatCurrency(row.budgeted)}</TableCell>
                                <TableCell align="right">{formatCurrency(row.actual)}</TableCell>
                                <TableCell align="right" sx={{ color: row.remaining >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                                    {formatCurrency(row.remaining)} {row.remaining >= 0 ? 'under' : 'over'}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} align="center">No expense categories found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderVisualView = () => {
        if (processedCategories.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center', py: 6, px: 3,
                    background: alpha(theme.palette.divider, 0.02),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        No expense categories found
                    </Typography>
                </Box>
            );
        }

        return (
            <Grid container spacing={2}>
                {processedCategories.map((category) => (
                    <Grid item xs={12} sm={6} lg={4} key={category.name}>
                        <BudgetCategoryCard
                            categoryName={category.name}
                            budgeted={category.budgeted}
                            actual={category.actual}
                            remaining={category.remaining}
                            compact={true}
                        />
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box>
            {/* View Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={(_, newView) => newView && setViewType(newView)}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            py: 0.5, px: 2, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
                            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                            '&.Mui-selected': {
                                bgcolor: alpha(maroonColor, 0.1), color: maroonColor,
                                borderColor: alpha(maroonColor, 0.4),
                                '&:hover': { bgcolor: alpha(maroonColor, 0.15) }
                            }
                        }
                    }}
                >
                    <ToggleButton value="visual"><BarChart3 size={14} style={{ marginRight: 6 }} /> Visual</ToggleButton>
                    <ToggleButton value="numeric"><TableIcon size={14} style={{ marginRight: 6 }} /> Numeric</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Content */}
            {viewType === 'numeric' ? renderNumericView() : renderVisualView()}
        </Box>
    );
};

export default TopExpenseCategory;

// import {
//     Paper,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Typography,
//     Box,
//     Skeleton,
//     ToggleButtonGroup,
//     ToggleButton,
//     alpha,
//     useTheme,
//     Card,
//     LinearProgress,
//     Grid
// } from "@mui/material";
// import React, {useMemo, useState} from "react";
// import { Table as TableIcon, BarChart3 } from 'lucide-react';
//
// interface TopExpenseCategoryProps {
//     isLoading: boolean;
//     categories: {
//         categoryName: string;
//         budgetedAmount: number;
//         actualAmount: number;
//         remainingAmount: number;
//         startDate: number[];
//         endDate: number[];
//         isActive: boolean;
//     }[];
// }
//
// const maroonColor = '#800000';
// const tealColor = '#0d9488';
//
// const TopExpenseCategory: React.FC<TopExpenseCategoryProps> = ({isLoading, categories}) => {
//     const theme = useTheme();
//     const [viewType, setViewType] = useState<'numeric' | 'visual'>('visual');
//
//     const processedCategories = useMemo(() => {
//         if (!categories?.length) return [];
//
//         return categories
//             .map(category => ({
//                 name: category.categoryName,
//                 budgeted: category.budgetedAmount || 0,
//                 actual: category.actualAmount || 0,
//                 remaining: category.remainingAmount || 0
//             }))
//             .sort((a, b) => b.actual - a.actual)
//             .slice(0, 5);
//     }, [categories]);
//
//     const getProgressColor = (actual: number, budgeted: number) => {
//         if (budgeted === 0) return tealColor;
//         const percentage = (actual / budgeted) * 100;
//         if (percentage < 70) return tealColor;
//         if (percentage < 90) return '#f59e0b';
//         return '#dc2626';
//     };
//
//     const formatCurrency = (amount: number) => {
//         return `$${Math.abs(amount).toFixed(2)}`;
//     };
//
//     if (isLoading) {
//         return (
//             <Box>
//                 <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
//             </Box>
//         );
//     }
//
//     const renderNumericView = () => (
//         <TableContainer component={Paper} sx={{
//             boxShadow: 3,
//             borderRadius: 4,
//             overflow: 'hidden',
//             transition: 'box-shadow 0.3s ease-in-out',
//             '&:hover': {
//                 boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
//             }
//         }}>
//             <Table>
//                 <TableHead>
//                     <TableRow sx={{backgroundColor: 'background.paper'}}>
//                         <TableCell sx={{
//                             fontWeight: 'bold',
//                             color: maroonColor,
//                             fontSize: '0.95rem'
//                         }}>Category</TableCell>
//                         <TableCell align="right" sx={{
//                             fontWeight: 'bold',
//                             color: maroonColor,
//                             fontSize: '0.95rem'
//                         }}>Budgeted</TableCell>
//                         <TableCell align="right" sx={{
//                             fontWeight: 'bold',
//                             color: maroonColor,
//                             fontSize: '0.95rem'
//                         }}>Actual</TableCell>
//                         <TableCell align="right" sx={{
//                             fontWeight: 'bold',
//                             color: maroonColor,
//                             fontSize: '0.95rem'
//                         }}>Remaining</TableCell>
//                     </TableRow>
//                 </TableHead>
//                 <TableBody>
//                     {processedCategories.length > 0 ? (
//                         processedCategories.map((row) => (
//                             <TableRow key={row.name}>
//                                 <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
//                                     {row.name}
//                                 </TableCell>
//                                 <TableCell align="right">
//                                     {formatCurrency(row.budgeted)}
//                                 </TableCell>
//                                 <TableCell align="right">
//                                     {formatCurrency(row.actual)}
//                                 </TableCell>
//                                 <TableCell
//                                     align="right"
//                                     sx={{
//                                         color: row.remaining >= 0 ? '#059669' : '#dc2626',
//                                         fontWeight: 'bold'
//                                     }}
//                                 >
//                                     {formatCurrency(row.remaining)}
//                                     {row.remaining >= 0 ? ' under' : ' over'}
//                                 </TableCell>
//                             </TableRow>
//                         ))
//                     ) : (
//                         <TableRow>
//                             <TableCell colSpan={4} align="center">
//                                 No expense categories found
//                             </TableCell>
//                         </TableRow>
//                     )}
//                 </TableBody>
//             </Table>
//         </TableContainer>
//     );
//
//     const renderVisualView = () => {
//         if (processedCategories.length === 0) {
//             return (
//                 <Box sx={{
//                     textAlign: 'center',
//                     py: 6,
//                     px: 3,
//                     background: alpha(theme.palette.divider, 0.02),
//                     borderRadius: 2,
//                     border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
//                 }}>
//                     <Typography variant="body2" color="text.secondary" fontWeight={500}>
//                         No expense categories found
//                     </Typography>
//                 </Box>
//             );
//         }
//
//         return (
//             <Grid container spacing={2}>
//                 {processedCategories.map((category, index) => {
//                     const percentage = (category.actual / category.budgeted) * 100;
//                     const progressColor = getProgressColor(category.actual, category.budgeted);
//
//                     return (
//                         <Grid item xs={12} sm={6} lg={4} key={category.name}>
//                             <Card sx={{
//                                 p: 2.5,
//                                 borderRadius: 2,
//                                 background: `linear-gradient(135deg, ${alpha(progressColor, 0.1)} 0%, ${alpha(progressColor, 0.05)} 100%)`,
//                                 border: `1px solid ${alpha(progressColor, 0.2)}`
//                             }}>
//                                 <Typography variant="caption" color="text.secondary" sx={{
//                                     fontWeight: 600,
//                                     textTransform: 'uppercase',
//                                     letterSpacing: 0.5,
//                                     display: 'block',
//                                     mb: 1
//                                 }}>
//                                     {category.name}
//                                 </Typography>
//                                 <Box sx={{ mb: 2 }}>
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                                         <Typography variant="caption" color="text.secondary">Budgeted</Typography>
//                                         <Typography variant="body2" fontWeight={600}>{formatCurrency(category.budgeted)}</Typography>
//                                     </Box>
//                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                                         <Typography variant="caption" color="text.secondary">Actual</Typography>
//                                         <Typography variant="body2" fontWeight={700} color={progressColor}>
//                                             {formatCurrency(category.actual)}
//                                         </Typography>
//                                     </Box>
//                                 </Box>
//                                 <LinearProgress
//                                     variant="determinate"
//                                     value={Math.min(percentage, 100)}
//                                     sx={{
//                                         height: 8,
//                                         borderRadius: 4,
//                                         bgcolor: `${progressColor}20`,
//                                         '& .MuiLinearProgress-bar': {
//                                             bgcolor: progressColor,
//                                             borderRadius: 4
//                                         }
//                                     }}
//                                 />
//                                 <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
//                                     {formatCurrency(Math.abs(category.remaining))} {category.remaining >= 0 ? 'remaining' : 'over'}
//                                 </Typography>
//                             </Card>
//                         </Grid>
//                     );
//                 })}
//             </Grid>
//         );
//     };
//
//     return (
//         <Box>
//             {/* View Toggle */}
//             <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
//                 <ToggleButtonGroup
//                     value={viewType}
//                     exclusive
//                     onChange={(e, newView) => newView && setViewType(newView)}
//                     size="small"
//                     sx={{
//                         '& .MuiToggleButton-root': {
//                             py: 0.5,
//                             px: 2,
//                             fontSize: '0.75rem',
//                             fontWeight: 600,
//                             textTransform: 'none',
//                             border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
//                             '&.Mui-selected': {
//                                 bgcolor: alpha(maroonColor, 0.1),
//                                 color: maroonColor,
//                                 borderColor: alpha(maroonColor, 0.4),
//                                 '&:hover': {
//                                     bgcolor: alpha(maroonColor, 0.15)
//                                 }
//                             }
//                         }
//                     }}
//                 >
//                     <ToggleButton value="visual">
//                         <BarChart3 size={14} style={{ marginRight: 6 }} /> Visual
//                     </ToggleButton>
//                     <ToggleButton value="numeric">
//                         <TableIcon size={14} style={{ marginRight: 6 }} /> Numeric
//                     </ToggleButton>
//                 </ToggleButtonGroup>
//             </Box>
//
//             {/* Content */}
//             {viewType === 'numeric' ? renderNumericView() : renderVisualView()}
//         </Box>
//     );
// }
//
// export default TopExpenseCategory;