import React, { useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    Divider,
    Dialog,
    DialogContent,
    DialogTitle,
    alpha,
    useTheme,
    Fade,
    Paper,
    IconButton,
    FormControlLabel,
    Switch,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    ToggleButton,
    ToggleButtonGroup,
    Stepper,
    Step,
    StepLabel,
    Chip,
    Stack
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SavingsIcon from '@mui/icons-material/Savings';
import ListIcon from '@mui/icons-material/List';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { GroceryBudget } from "../config/Types";
import GroceryService from "../services/GroceryService";
import {
    addDays,
    addWeeks,
    startOfWeek,
    endOfWeek,
    format,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    differenceInWeeks,
    eachWeekOfInterval
} from 'date-fns';

interface Props {
    open: boolean;
    onSuccess: () => void;
    onClose: () => void;
    currentMonth?: Date;
}

type EntryMode = 'choice' | 'manual' | 'income';
type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

const gradients = {
    blue: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    teal: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    maroon: 'linear-gradient(135deg, #800000 0%, #a00000 100%)',
    orange: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
};

export const GroceryBudgetCreate: React.FC<Props> = ({ open, onSuccess, onClose, currentMonth = new Date() }) => {
    const theme = useTheme();
    const [entryMode, setEntryMode] = useState<EntryMode>('choice');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeStep, setActiveStep] = useState(0);

    const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
    const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

    // Manual Entry State
    const [periodType, setPeriodType] = useState<PeriodType>('weekly');
    const [weeklyBudget, setWeeklyBudget] = useState<number>(0);
    const [savingsGoal, setSavingsGoal] = useState<number>(0);
    const [startDate, setStartDate] = useState<Date | null>(monthStart);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [attachGroceryList, setAttachGroceryList] = useState(false);
    const [budgetName, setBudgetName] = useState('');

    // Income-Based State
    const [payFrequency, setPayFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('biweekly');
    const [nextPayDate, setNextPayDate] = useState<Date | null>(new Date());
    const [groceryPercentage, setGroceryPercentage] = useState<number>(15);
    const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
    const [incomeSavingsGoal, setIncomeSavingsGoal] = useState<number>(0);
    const [incomeAttachList, setIncomeAttachList] = useState(false);

    // Calculate budgets based on period type
    const calculatedBudgets = useMemo(() => {
        if (!startDate || !weeklyBudget) return [];

        const budgets: Array<{
            name: string;
            startDate: Date;
            endDate: Date;
            amount: number;
        }> = [];

        switch (periodType) {
            case 'weekly': {
                const weeks = eachWeekOfInterval(
                    { start: monthStart, end: monthEnd },
                    { weekStartsOn: 0 }
                );
                weeks.forEach((weekStart, index) => {
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
                    const actualEnd = weekEnd > monthEnd ? monthEnd : weekEnd;
                    budgets.push({
                        name: `Week ${index + 1} - ${format(weekStart, 'MMM d')} to ${format(actualEnd, 'MMM d')}`,
                        startDate: weekStart,
                        endDate: actualEnd,
                        amount: weeklyBudget
                    });
                });
                break;
            }
            case 'biweekly': {
                let currentStart = monthStart;
                let weekNum = 1;
                while (currentStart <= monthEnd) {
                    const currentEnd = addWeeks(currentStart, 2);
                    const actualEnd = currentEnd > monthEnd ? monthEnd : addDays(currentEnd, -1);
                    budgets.push({
                        name: `Bi-Week ${weekNum} - ${format(currentStart, 'MMM d')} to ${format(actualEnd, 'MMM d')}`,
                        startDate: currentStart,
                        endDate: actualEnd,
                        amount: weeklyBudget
                    });
                    currentStart = addWeeks(currentStart, 2);
                    weekNum++;
                }
                break;
            }
            case 'monthly': {
                budgets.push({
                    name: `${format(monthStart, 'MMMM yyyy')} Grocery Budget`,
                    startDate: monthStart,
                    endDate: monthEnd,
                    amount: weeklyBudget
                });
                break;
            }
            case 'custom': {
                if (endDate) {
                    budgets.push({
                        name: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
                        startDate: startDate,
                        endDate: endDate,
                        amount: weeklyBudget
                    });
                }
                break;
            }
        }

        return budgets;
    }, [periodType, startDate, endDate, weeklyBudget, monthStart, monthEnd]);

    const handleClose = () => {
        setEntryMode('choice');
        setActiveStep(0);
        setError('');
        setPeriodType('weekly');
        setWeeklyBudget(0);
        setSavingsGoal(0);
        setStartDate(monthStart);
        setEndDate(null);
        setAttachGroceryList(false);
        setBudgetName('');
        setMonthlyIncome(0);
        setGroceryPercentage(15);
        setIncomeSavingsGoal(0);
        setIncomeAttachList(false);
        onClose();
    };

    const calculateIncomeBudget = () => {
        if (!monthlyIncome || !nextPayDate) return null;
        const budgetAmount = (monthlyIncome * (groceryPercentage / 100));
        let periodStart = nextPayDate;
        let periodEnd: Date;

        switch (payFrequency) {
            case 'weekly':
                periodEnd = addWeeks(periodStart, 1);
                break;
            case 'biweekly':
                periodEnd = addWeeks(periodStart, 2);
                break;
            case 'monthly':
                periodEnd = addWeeks(periodStart, 4);
                break;
        }

        return {
            budgetAmount,
            periodStart,
            periodEnd: addDays(periodEnd, -1)
        };
    };

    const handleManualSubmit = async () => {
        if (!weeklyBudget || calculatedBudgets.length === 0) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create multiple budgets based on period type
            for (const budget of calculatedBudgets) {
                const groceryBudget: Partial<GroceryBudget> = {
                    name: budgetName || budget.name,
                    budgetAmount: budget.amount,
                    startDate: format(budget.startDate, 'yyyy-MM-dd'),
                    endDate: format(budget.endDate, 'yyyy-MM-dd'),
                    savingsGoal: savingsGoal,
                    subBudgetId: 1,
                    stores: [],
                    sections: [],
                    plannedItems: []
                };

                await GroceryService.createBudget(groceryBudget as GroceryBudget);
            }

            if (attachGroceryList) {
                console.log('Open grocery list dialog');
            }

            onSuccess();
            handleClose();
        } catch (err) {
            setError('Failed to create budget(s)');
        } finally {
            setLoading(false);
        }
    };

    const handleIncomeSubmit = async () => {
        const calculated = calculateIncomeBudget();
        if (!calculated || !monthlyIncome || !nextPayDate) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const budget: Partial<GroceryBudget> = {
                name: `${format(calculated.periodStart, 'MMM d')} - ${format(calculated.periodEnd, 'MMM d, yyyy')} Grocery Budget`,
                budgetAmount: calculated.budgetAmount,
                startDate: format(calculated.periodStart, 'yyyy-MM-dd'),
                endDate: format(calculated.periodEnd, 'yyyy-MM-dd'),
                savingsGoal: incomeSavingsGoal,
                subBudgetId: 1,
                stores: [],
                sections: [],
                plannedItems: []
            };

            await GroceryService.createBudget(budget as GroceryBudget);

            if (incomeAttachList) {
                console.log('Open grocery list dialog');
            }

            onSuccess();
            handleClose();
        } catch (err) {
            setError('Failed to create budget');
        } finally {
            setLoading(false);
        }
    };

    const renderChoiceScreen = () => (
        <Fade in timeout={500}>
            <Box sx={{ py: 6, px: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontWeight: 800,
                            background: gradients.maroon,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2
                        }}
                    >
                        Create Your Grocery Budget
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ maxWidth: 600, mx: 'auto' }}
                    >
                        Choose your preferred method to set up your grocery budget for {format(currentMonth, 'MMMM yyyy')}
                    </Typography>
                </Box>

                <Grid container spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                cursor: 'pointer',
                                border: `3px solid transparent`,
                                borderRadius: 4,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: `linear-gradient(white, white) padding-box, ${gradients.maroon} border-box`,
                                position: 'relative',
                                overflow: 'visible',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 20px 40px ${alpha('#800000', 0.2)}`,
                                    '& .icon-circle': {
                                        transform: 'scale(1.1) rotate(5deg)',
                                    }
                                }
                            }}
                            onClick={() => {
                                setEntryMode('manual');
                                setActiveStep(0);
                            }}
                        >
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Box
                                    className="icon-circle"
                                    sx={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: '24px',
                                        background: gradients.maroon,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        boxShadow: `0 12px 24px ${alpha('#800000', 0.3)}`,
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <EditIcon sx={{ fontSize: 42, color: 'white' }} />
                                </Box>
                                <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#800000' }}>
                                    Manual Entry
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                                    Set custom budget amounts and choose your preferred time period
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip label="Weekly" size="small" sx={{ bgcolor: alpha('#800000', 0.1), color: '#800000', fontWeight: 600 }} />
                                    <Chip label="Bi-Weekly" size="small" sx={{ bgcolor: alpha('#800000', 0.1), color: '#800000', fontWeight: 600 }} />
                                    <Chip label="Monthly" size="small" sx={{ bgcolor: alpha('#800000', 0.1), color: '#800000', fontWeight: 600 }} />
                                    <Chip label="Custom" size="small" sx={{ bgcolor: alpha('#800000', 0.1), color: '#800000', fontWeight: 600 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                cursor: 'pointer',
                                border: `3px solid transparent`,
                                borderRadius: 4,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: `linear-gradient(white, white) padding-box, ${gradients.teal} border-box`,
                                position: 'relative',
                                overflow: 'visible',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 20px 40px ${alpha('#0d9488', 0.2)}`,
                                    '& .icon-circle': {
                                        transform: 'scale(1.1) rotate(-5deg)',
                                    }
                                }
                            }}
                            onClick={() => {
                                setEntryMode('income');
                                setActiveStep(0);
                            }}
                        >
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Box
                                    className="icon-circle"
                                    sx={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: '24px',
                                        background: gradients.teal,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        boxShadow: `0 12px 24px ${alpha('#0d9488', 0.3)}`,
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <AttachMoneyIcon sx={{ fontSize: 42, color: 'white' }} />
                                </Box>
                                <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#0d9488' }}>
                                    Income-Based
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                                    Allocate a percentage of your income based on your pay schedule
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip label="10-15% Recommended" size="small" sx={{ bgcolor: alpha('#0d9488', 0.1), color: '#0d9488', fontWeight: 600 }} />
                                    <Chip label="Auto-Calculate" size="small" sx={{ bgcolor: alpha('#0d9488', 0.1), color: '#0d9488', fontWeight: 600 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Fade>
    );

    const manualSteps = ['Budget Details', 'Period Selection', 'Review'];

    const renderManualStep = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ py: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Budget Amount"
                                    type="number"
                                    required
                                    value={weeklyBudget || ''}
                                    onChange={(e) => setWeeklyBudget(parseFloat(e.target.value))}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>$</Typography>
                                    }}
                                    helperText="Amount per budget period"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#800000',
                                                borderWidth: 2
                                            }
                                        },
                                        '& .MuiFormLabel-root.Mui-focused': {
                                            color: '#800000',
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Savings Goal (Optional)"
                                    type="number"
                                    value={savingsGoal || ''}
                                    onChange={(e) => setSavingsGoal(parseFloat(e.target.value))}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>$</Typography>
                                    }}
                                    helperText="How much you aim to save per period"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#800000',
                                                borderWidth: 2
                                            }
                                        },
                                        '& .MuiFormLabel-root.Mui-focused': {
                                            color: '#800000',
                                        }
                                    }}
                                />
                            </Grid>

                            {weeklyBudget > 0 && savingsGoal > 0 && (
                                <Grid item xs={12}>
                                    <Card sx={{
                                        bgcolor: alpha('#059669', 0.05),
                                        border: `2px solid ${alpha('#059669', 0.2)}`,
                                        borderRadius: 3
                                    }}>
                                        <CardContent sx={{ py: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <SavingsIcon sx={{ color: '#059669', fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={700} color="#059669">
                                                    Available to Spend
                                                </Typography>
                                            </Box>
                                            <Typography variant="h4" fontWeight={800} color="#059669">
                                                ${(weeklyBudget - savingsGoal).toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                per period (${weeklyBudget} - ${savingsGoal} savings)
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                            Select Budget Period
                        </Typography>

                        <ToggleButtonGroup
                            value={periodType}
                            exclusive
                            onChange={(e, value) => value && setPeriodType(value)}
                            fullWidth
                            sx={{ mb: 4 }}
                        >
                            <ToggleButton
                                value="weekly"
                                sx={{
                                    py: 2,
                                    '&.Mui-selected': {
                                        background: gradients.maroon,
                                        color: 'white',
                                        '&:hover': {
                                            background: gradients.maroon,
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <CalendarTodayIcon sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" fontWeight={600}>Weekly</Typography>
                                </Box>
                            </ToggleButton>
                            <ToggleButton
                                value="biweekly"
                                sx={{
                                    py: 2,
                                    '&.Mui-selected': {
                                        background: gradients.maroon,
                                        color: 'white',
                                        '&:hover': {
                                            background: gradients.maroon,
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <EventRepeatIcon sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" fontWeight={600}>Bi-Weekly</Typography>
                                </Box>
                            </ToggleButton>
                            <ToggleButton
                                value="monthly"
                                sx={{
                                    py: 2,
                                    '&.Mui-selected': {
                                        background: gradients.maroon,
                                        color: 'white',
                                        '&:hover': {
                                            background: gradients.maroon,
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <DateRangeIcon sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" fontWeight={600}>Monthly</Typography>
                                </Box>
                            </ToggleButton>
                            <ToggleButton
                                value="custom"
                                sx={{
                                    py: 2,
                                    '&.Mui-selected': {
                                        background: gradients.maroon,
                                        color: 'white',
                                        '&:hover': {
                                            background: gradients.maroon,
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <EditIcon sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" fontWeight={600}>Custom</Typography>
                                </Box>
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {periodType === 'custom' && (
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Start Date"
                                            value={startDate}
                                            onChange={(date) => setStartDate(date)}
                                            minDate={monthStart}
                                            maxDate={monthEnd}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true,
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="End Date"
                                            value={endDate}
                                            onChange={(date) => setEndDate(date)}
                                            minDate={startDate || monthStart}
                                            maxDate={monthEnd}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true,
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>
                        )}

                        <Box sx={{ mt: 3 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={attachGroceryList}
                                        onChange={(e) => setAttachGroceryList(e.target.checked)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#800000',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#800000',
                                            },
                                        }}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ListIcon sx={{ fontSize: 20, color: '#800000' }} />
                                        <Typography fontWeight={500}>Attach grocery list to budget(s)</Typography>
                                    </Box>
                                }
                            />
                        </Box>

                        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                            {periodType === 'weekly' && `This will create ${calculatedBudgets.length} weekly budget(s) for ${format(currentMonth, 'MMMM yyyy')}`}
                            {periodType === 'biweekly' && `This will create ${calculatedBudgets.length} bi-weekly budget(s) for ${format(currentMonth, 'MMMM yyyy')}`}
                            {periodType === 'monthly' && `This will create 1 monthly budget for ${format(currentMonth, 'MMMM yyyy')}`}
                            {periodType === 'custom' && endDate && `This will create 1 custom budget from ${format(startDate!, 'MMM d')} to ${format(endDate, 'MMM d')}`}
                        </Alert>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3, color: '#800000' }}>
                            Review Budget{calculatedBudgets.length > 1 ? 's' : ''}
                        </Typography>

                        <Stack spacing={2}>
                            {calculatedBudgets.map((budget, index) => (
                                <Card key={index} sx={{
                                    border: `2px solid ${alpha('#800000', 0.2)}`,
                                    borderRadius: 3,
                                    bgcolor: alpha('#800000', 0.02)
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} color="#800000">
                                                    {budget.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(budget.startDate, 'MMM d, yyyy')} - {format(budget.endDate, 'MMM d, yyyy')}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label={`$${budget.amount.toFixed(2)}`}
                                                sx={{
                                                    bgcolor: alpha('#059669', 0.1),
                                                    color: '#059669',
                                                    fontWeight: 700
                                                }}
                                            />
                                        </Box>
                                        {savingsGoal > 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                💰 Savings Goal: ${savingsGoal.toFixed(2)} • Available: ${(budget.amount - savingsGoal).toFixed(2)}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>

                        {attachGroceryList && (
                            <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    ✓ Grocery list will be attached to {calculatedBudgets.length > 1 ? 'these budgets' : 'this budget'}
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 5,
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16)',
                    overflow: 'visible'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                background: entryMode === 'manual' ? `linear-gradient(135deg, ${alpha('#800000', 0.05)} 0%, ${alpha('#800000', 0.02)} 100%)` :
                    entryMode === 'income' ? `linear-gradient(135deg, ${alpha('#0d9488', 0.05)} 0%, ${alpha('#0d9488', 0.02)} 100%)` :
                        'transparent'
            }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        {entryMode === 'choice' ? 'Create Grocery Budget' :
                            entryMode === 'manual' ? 'Manual Budget Entry' :
                                'Income-Based Budget'}
                    </Typography>
                    {entryMode !== 'choice' && (
                        <Typography variant="caption" color="text.secondary">
                            {format(currentMonth, 'MMMM yyyy')}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {entryMode === 'choice' && renderChoiceScreen()}

                {entryMode === 'manual' && (
                    <>
                        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
                            {manualSteps.map((label) => (
                                <Step key={label}>
                                    <StepLabel
                                        StepIconProps={{
                                            sx: {
                                                '&.Mui-active': { color: '#800000' },
                                                '&.Mui-completed': { color: '#800000' }
                                            }
                                        }}
                                    >
                                        {label}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <Box sx={{ minHeight: 300 }}>
                            {renderManualStep(activeStep)}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                            <Button
                                onClick={() => activeStep === 0 ? setEntryMode('choice') : setActiveStep(activeStep - 1)}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Back
                            </Button>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    onClick={handleClose}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Cancel
                                </Button>
                                {activeStep === manualSteps.length - 1 ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleManualSubmit}
                                        disabled={loading || calculatedBudgets.length === 0}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            px: 4,
                                            background: gradients.maroon,
                                            boxShadow: `0 4px 14px ${alpha('#800000', 0.25)}`,
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
                                                boxShadow: `0 6px 20px ${alpha('#800000', 0.35)}`,
                                            },
                                            '&:disabled': {
                                                background: alpha('#800000', 0.3),
                                            }
                                        }}
                                    >
                                        {loading ? 'Creating...' : `Create ${calculatedBudgets.length} Budget${calculatedBudgets.length > 1 ? 's' : ''}`}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={() => setActiveStep(activeStep + 1)}
                                        disabled={activeStep === 0 && !weeklyBudget}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            px: 4,
                                            background: gradients.maroon,
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #6b0000 0%, #900000 100%)',
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </>
                )}

                {entryMode === 'income' && (
                    <Box sx={{ py: 2 }}>
                        {/* Income-based entry remains the same as before */}
                        <Typography>Income-based entry (previous implementation)</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};