import React, {useState} from "react";
import {format, addDays, addWeeks, addMonths} from 'date-fns';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, ButtonGroup, Box } from '@mui/material';
import {styled} from "@mui/material/styles";

type BudgetPeriod = 'Daily' | 'Weekly' | 'BiWeekly' | 'Monthly';

const dummyData = [
    { name: 'Housing', budgeted: 1500, actual: 1450, remaining: 50 },
    { name: 'Food', budgeted: 500, actual: 480, remaining: 20 },
    { name: 'Transportation', budgeted: 300, actual: 310, remaining: -10 },
    { name: 'Utilities', budgeted: 200, actual: 190, remaining: 10 },
    { name: 'Entertainment', budgeted: 150, actual: 200, remaining: -50 },
];

const CustomButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '10px 16px',
    transition: 'all 0.3s ease',
    backgroundColor: theme.palette.error.main, // Maroon color
    color: theme.palette.common.white,
    '&:hover': {
        backgroundColor: theme.palette.error.dark,
    },
    '&.clicked': {
        backgroundColor: theme.palette.common.white,
        color: theme.palette.error.main,
        border: `1px solid ${theme.palette.error.main}`,
    },
}));

const BudgetPeriodTable: React.FC = () => {
    const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('Monthly');
    const [startDate, setStartDate] = useState(new Date());
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(true);
        // Add your logic here for what should happen when the button is clicked
        setTimeout(() => setIsClicked(false), 300); // Reset after 300ms for visual feedback
    };

    const getEndDate = () => {
        switch(budgetPeriod){
            case 'Daily':
                return startDate;
            case 'Weekly':
                return addDays(startDate, 6);
            case 'BiWeekly':
                return addDays(startDate, 13);
            case 'Monthly':
                return addMonths(startDate, 1);
            default:
                return startDate;
        }
    }

    const formatDateRange = () => {
        const endDate = getEndDate();
        return `${format(startDate, 'MM/dd/yy')} - ${format(endDate, 'MM/dd/yy')}`;
    }

    const maroonColor = '#800000'; // You can adjust this to match your exact maroon shade

    const StyledButton = styled(Button)(({ theme }) => ({
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 16px',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        color: maroonColor,
        borderColor: maroonColor,
        '&:hover': {
            backgroundColor: 'rgba(128, 0, 0, 0.04)', // Light maroon background on hover
            borderColor: maroonColor,
        },
        '&.Mui-selected, &.MuiButton-contained': {
            backgroundColor: maroonColor,
            color: 'white',
            '&:hover': {
                backgroundColor: '#600000', // Darker maroon on hover for selected state
            },
        },
    }));

    const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
        '& .MuiButtonGroup-grouped': {
            border: `1px solid ${maroonColor}`,
            '&:not(:last-of-type)': {
                borderRight: `1px solid ${maroonColor}`,
            },
        },
    }));

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{
                fontWeight: 'bold',
                mb:2,
                textAlign: 'left',
                fontSize: '0.875rem',
                color: 'text.secondary'}}>
                Budget for {formatDateRange()}
            </Typography>

            <Box sx={{ mb: 2 }}>
                <StyledButtonGroup variant="outlined" aria-label="budget period toggle">
                    {['Daily', 'Weekly', 'Biweekly', 'Monthly'].map((period) => (
                        <StyledButton
                            key={period}
                            onClick={() => setBudgetPeriod(period as BudgetPeriod)}
                            variant={budgetPeriod === period ? 'contained' : 'outlined'}
                        >
                            {period}
                        </StyledButton>
                    ))}
                </StyledButtonGroup>
            </Box>

            <TableContainer component={Paper} sx={{
                boxShadow: 3,
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow  sx={{backgroundColor: 'background.paper'}}>
                            <TableCell sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Name</TableCell>
                            <TableCell align="right" sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Budgeted</TableCell>
                            <TableCell align="right"sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Actual</TableCell>
                            <TableCell align="right"sx={{
                                fontWeight: 'bold',
                                color: maroonColor,
                                fontSize: '0.95rem'
                            }}>Remaining</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dummyData.map((row) => (
                            <TableRow key={row.name}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">${row.budgeted.toFixed(2)}</TableCell>
                                <TableCell align="right">${row.actual.toFixed(2)}</TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        color: row.remaining >= 0 ? 'green' : 'red',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ${Math.abs(row.remaining).toFixed(2)}
                                    {row.remaining >= 0 ? ' under' : ' over'}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ borderBottom: 'none', pt: 2, pb: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleClick}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: isClicked ? 'white' : '#800000', // Maroon color
                                        color: isClicked ? '#800000' : 'white',
                                        border: isClicked ? '1px solid #800000' : 'none',
                                        '&:hover': {
                                            backgroundColor: isClicked ? 'white' : '#600000', // Darker maroon on hover
                                        },
                                    }}
                                >
                                    Add Budget
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default BudgetPeriodTable;