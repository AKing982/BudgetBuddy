import React, {useCallback, useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    Grid,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ThemeProvider,
    CssBaseline,
    createTheme,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    FormControl,
    InputLabel, Select, MenuItem, SelectChangeEvent, Slider, FormControlLabel, FormLabel, RadioGroup, Radio
} from '@mui/material';
import { AddCircleOutline, Check } from '@mui/icons-material';

import categoryDropdown from "./CategoryDropdown";
import {Delete} from "lucide-react";
import {useNavigate} from "react-router-dom";
import SavingsGoalQuestions, {SavingsGoalData} from "./SavingsGoalQuestions";
import SpendingControlQuestions, {SpendingControlData} from "./SpendingControlQuestions";
import DebtPayoffQuestions, {DebtPayoffData} from "./DebtPayoffQuestions";
import CategoryItem from "./CategoryItem";
import BudgetService from "../services/BudgetService";
import BudgetGoalsService from "../services/BudgetGoalsService";
import BudgetCategoriesService, {BudgetCategoryRequest} from "../services/BudgetCategoriesService";
import LoginService from "../services/LoginService";
import axios from "axios";
import {HistoricalBudgetData} from "./HistoricalBudgetQuestions";
import BudgetSetupService from "../services/BudgetSetupService";
import {BudgetRegistration} from "../utils/Items";
import {Period} from "../config/Types";

interface BudgetCategory {
    budgetId: number;
    categoryName: string;
    allocatedAmount: number;
    monthlySpendingLimit: number;
    currentSpending: number;
    isFixedExpense: boolean;
    isActive: boolean;
    priority: number;
}

interface BudgetGoal {
    id?: number;
    budgetId: number;
    goalName: string;
    goalDescription: string;
    goalType: string;
    targetAmount: number;
    monthlyAllocation: number;
    currentSavings: number;
    savingsFrequency: string;
    status: string;
}

interface BudgetQuestions {
    historicalData?: HistoricalBudgetData;
    budgetType: string;
    monthlyIncome: number;
    expenseCategories: BudgetCategory[];
    financialGoal: BudgetGoal;
    savingsGoalData?: SavingsGoalData;
    debtPayoffData?: DebtPayoffData;
    spendingControlData?: SpendingControlData;
}


interface BudgetCategoriesRequest {
    categories: BudgetCategory[];
}


interface BudgetQuestionnaireProps {
    onSubmit: (budgetData: BudgetQuestions) => void;
}


const theme = createTheme({
    palette: {
        background: {
            default: '#f5e6d3', // Beige background
        },
        primary: {
            main: '#800000', // Maroon for primary color (buttons and text)
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0, // Flat buttons
                    textTransform: 'none', // Prevents all-caps text
                },
                contained: {
                    boxShadow: 'none', // Removes default shadow for a flatter look
                    '&:hover': {
                        boxShadow: 'none', // Keeps it flat on hover
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                            borderColor: '#800000', // Maroon outline when focused
                            borderWidth: '2px', // Make the outline a bit thicker
                        },
                    },
                },
            },
        },
    },
});

const steps = ['Previous Budget','Budget Type', 'Income', 'Goals', 'Review'];

const BudgetQuestionnaireForm: React.FC<BudgetQuestionnaireProps> = ({ onSubmit }) => {
    const [activeStep, setActiveStep] = useState<number>(0);
    const [budgetData, setBudgetData] = useState<BudgetQuestions>({
        historicalData: {
            previousIncome: 0,
            hadPreviousBudget: false
        },
        budgetType: '',
        monthlyIncome: 0,
        expenseCategories: [],
        financialGoal: {
            budgetId: 0,
            goalName: '',
            goalDescription: '',
            goalType: '',
            targetAmount: 0,
            monthlyAllocation: 0,
            currentSavings: 0,
            savingsFrequency: '',
            status: ''
        },
        savingsGoalData: undefined,
        debtPayoffData: undefined,
        spendingControlData: undefined
    });
    const [newCategory, setNewCategory] = useState<BudgetCategory>({
        budgetId: 0, // You might want to set this to a default value or generate it
        categoryName: '',
        allocatedAmount: 0,
        monthlySpendingLimit: 0,
        currentSpending: 0,
        isFixedExpense: false,
        isActive: true,
        priority: 0
    });
    // Add state for notification
    const [notification, setNotification] = useState<{
        message: string;
        severity: 'success' | 'error' | 'warning';
        show: boolean;
    }>({
        message: '',
        severity: 'success',
        show: false
    });

    const navigate = useNavigate();
    const budgetService = BudgetService.getInstance();
    const budgetGoalsService = BudgetGoalsService.getInstance();
    const budgetCategoriesService = BudgetCategoriesService.getInstance();
    const budgetSetupService = BudgetSetupService.getInstance();
    const loginService = new LoginService();

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleBudgetTypeSelect = (type: string) => {
        setBudgetData({...budgetData, budgetType: type});
        handleNext();
    };

    const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBudgetData({...budgetData, monthlyIncome: parseFloat(e.target.value) || 0});
    };

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBudgetData({
            ...budgetData,
            financialGoal: { ...budgetData.financialGoal, [e.target.name]: e.target.value }
        });
    };

    const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCategory(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleCategoryAdd = () => {
        if (newCategory.categoryName && newCategory.allocatedAmount) {
            setBudgetData(prev => ({
                ...prev,
                expenseCategories: [...prev.expenseCategories, newCategory]
            }));
            setNewCategory({
                budgetId: 0, // You might want to generate a new ID here
                categoryName: '',
                allocatedAmount: 0,
                monthlySpendingLimit: 0,
                currentSpending: 0,
                isFixedExpense: false,
                isActive: true,
                priority: 0
            });
        }
    };

    const handleHistoricalDataChange = (field: keyof HistoricalBudgetData, value: any) => {
        setBudgetData(prev => ({
            ...prev,
            historicalData: {
                ...prev.historicalData!,
                [field]:value
            }
        }));
    };

    const handleCategoryDelete = (index: number) => {
        setBudgetData(prev => ({
            ...prev,
            expenseCategories: prev.expenseCategories.filter((_, i) => i !== index)
        }));
    };

    const createBudgetCategoriesRequest = () : BudgetCategoriesRequest | null => {
        if(budgetData.spendingControlData){
            const categories = budgetData.spendingControlData.categories.map(category => ({
                budgetId: 0, // This will be set after budget creation
                categoryName: category.name,
                allocatedAmount: category.spendingLimit,
                monthlySpendingLimit: category.spendingLimit,
                currentSpending: category.currentSpending,
                isFixedExpense: false, // Assuming all categories are not fixed expenses
                isActive: true,
                priority: category.reductionPriority
            }));

            return { categories };
        }
        return null;
    }

    const handleSavingsGoalDataChange = (data: SavingsGoalData) => {
        setBudgetData(prevData => ({
            ...prevData,
            savingsGoalData: data
        }));
    };

    const handleDebtPayoffDataChange = (data: DebtPayoffData) => {
        setBudgetData(prevData => ({
            ...prevData,
            debtPayoffData: data
        }));
    };

    const handleSpendingControlDataChange = (data: SpendingControlData) => {
        setBudgetData(prevData => ({
            ...prevData,
            spendingControlData: data
        }));
    };

    const handleBudgetGoalRegistration = async (budgetId: number) => {
        try {
            let goalData;
            switch (budgetData.budgetType) {
                case "Saving for a goal":
                    if (!budgetData.savingsGoalData) {
                        console.error('Savings goal data is missing');
                        return null;
                    }
                    goalData = budgetData.savingsGoalData;
                    break;
                case "Paying off debt":
                    if (!budgetData.debtPayoffData) {
                        console.error('Debt payoff data is missing');
                        return null;
                    }
                    goalData = budgetData.debtPayoffData;
                    break;
                case "Controlling spending":
                    if (!budgetData.spendingControlData) {
                        console.error('Spending control data is missing');
                        return null;
                    }
                    goalData = budgetData.spendingControlData;
                    break;
                default:
                    console.error('Invalid budget type');
                    return null;
            }

            const budgetGoalsServerResponse = await budgetGoalsService.createBudgetGoal(
                budgetId,
                budgetData,
                goalData
            );
            console.log('Budget Goals Response: ', budgetGoalsServerResponse.data);
            return budgetGoalsServerResponse.data;
        } catch (error) {
            console.error('There was an error sending the budget goals to the server: ', error);
            throw error;
        }
    };

    const handleBudgetCategoriesRegistration = async (budgetId: number) => {
        try {
            if (!budgetData.spendingControlData || !budgetData.spendingControlData.categories) {
                console.error('Spending control data is missing');
                return null;
            }

            const budgetCategories: BudgetCategory[] = budgetData.spendingControlData.categories.map(category => ({
                budgetId: budgetId,
                categoryName: category.name,
                allocatedAmount: category.spendingLimit,
                monthlySpendingLimit: category.spendingLimit,
                currentSpending: category.currentSpending,
                isFixedExpense: false, // Assuming this is false for all categories
                isActive: true, // Assuming all categories are active
                priority: category.reductionPriority
            }));

            budgetCategories.forEach((category, index) => {
                console.log(`Budget Category ${index + 1}:`, category);
            });

            if (budgetCategories.length === 0) {
                console.warn('No budget categories to register');
                return null;
            }

            const budgetCategoriesResponse = await budgetCategoriesService.createBudgetCategory(budgetCategories);
            console.log('Budget Categories Response: ', budgetCategoriesResponse);
            return budgetCategoriesResponse.data;
        } catch (error) {
            console.error('There was an error sending the budget categories to the server: ', error);
            throw error;
        }
    }

    // Add notification clearing function
    const clearNotification = () => {
        setNotification(prev => ({ ...prev, show: false }));
    };


    const handleSubmit = async () => {
        try {

            const userId = await loginService.fetchMaximumUserId();
            const currentDate = new Date();
            const startDate: [number, number, number] = [
                currentDate.getFullYear(),
                1,
                1
            ];

            const endDate: [number, number, number] = [
                currentDate.getFullYear(),
                12,
                31
            ];
            const budgetMode = budgetSetupService.getBudgetModeByBudgetType(budgetData.budgetType);
            const budgetDateRanges = budgetSetupService.calculateBudgetDateRanges(startDate, endDate);
            const numberOfMonths = budgetSetupService.calculateNumberOfMonths(startDate, endDate);
            const budgetName = `${startDate[0]} ${budgetData.budgetType} Budget`;
            let budgetDescription = `${budgetData.budgetType} budget`;
            let budgetGoals: BudgetGoal;
            switch(budgetData.budgetType){
                case 'Saving for a goal':
                    if(!budgetData.savingsGoalData){
                        throw new Error("Savings Goal data is missing");
                    }
                    budgetGoals = {
                        budgetId: 0,
                        goalName: budgetData.savingsGoalData.goalName,
                        goalDescription: budgetData.savingsGoalData.goalDescription || "Savings goal",
                        goalType: "SAVINGS",
                        targetAmount: budgetData.savingsGoalData.targetAmount,
                        monthlyAllocation: budgetData.savingsGoalData.monthlyAllocation,
                        currentSavings: budgetData.savingsGoalData.currentSavings || 0,
                        savingsFrequency: budgetData.savingsGoalData.savingsFrequency || "monthly",
                        status: "ACTIVE"
                    };
                    budgetDescription += ` for ${budgetData.savingsGoalData.goalName}`;
                    break;
                case "Paying off debt":
                    if (!budgetData.debtPayoffData) {
                        throw new Error("Debt payoff data is missing");
                    }
                    budgetGoals = {
                        budgetId: 0,
                        goalName: "Debt Reduction",
                        goalDescription: "Paying off outstanding debts",
                        goalType: "DEBT_REDUCTION",
                        targetAmount: budgetData.debtPayoffData.debts.reduce((sum, debt) => sum + debt.amount, 0),
                        monthlyAllocation: budgetData.debtPayoffData.debts.reduce((sum, debt) => sum + debt.allocation, 0),
                        currentSavings: 0,
                        savingsFrequency: "MONTHLY",
                        status: "ACTIVE"
                    };
                    budgetDescription += ` for debt repayment`;
                    break;
                case "Controlling spending":
                    if (!budgetData.spendingControlData) {
                        throw new Error("Spending control data is missing");
                    }
                    budgetGoals = {
                        budgetId: 0,
                        goalName: "Spending Control",
                        goalDescription: "Manage and reduce spending",
                        goalType: "SPENDING_CONTROL",
                        targetAmount: budgetData.spendingControlData.categories.reduce((sum, cat) => sum + cat.spendingLimit, 0),
                        monthlyAllocation: 0,
                        currentSavings: 0,
                        savingsFrequency: "MONTHLY",
                        status: "ACTIVE"
                    };
                    budgetDescription += ` for spending control`;
                    break;
                default:
                    budgetGoals = budgetData.financialGoal; // Fallback to existing goal
            }

            if(budgetData.savingsGoalData){
                budgetDescription += ` for ${budgetData.savingsGoalData.goalName}`;
            }else if(budgetData.debtPayoffData){
                budgetDescription += ` for debt repayment`;
            }else if(budgetData.spendingControlData){
                budgetDescription += ` for spending control`;
            }

            // const budgetGoals = budgetData.financialGoal;
            // Create the budget registration object
            const budgetRegistration: BudgetRegistration = {
                userId: userId,
                budgetName: budgetName,
                budgetDescription: budgetDescription,
                budgetPeriod: Period.MONTHLY,
                budgetMode: budgetMode,
                budgetGoals: budgetGoals,
                budgetYear: startDate[0],
                budgetStartDate: startDate,
                budgetEndDate: endDate,
                budgetDateRanges: budgetDateRanges,
                totalIncomeAmount: budgetData.monthlyIncome * numberOfMonths,
                numberOfMonths: numberOfMonths,
                totalBudgetsNeeded: numberOfMonths,
                previousIncomeAmount: budgetData.historicalData?.previousIncome || 0,
                previousBudgetName: budgetData.historicalData?.hadPreviousBudget ?
                    `${startDate[0] - 1} ${budgetData.historicalData.previousBudgetType} Budget` : ''
            };

            console.log('Starting budget setup process...', budgetRegistration);
            const setupSuccess = await budgetSetupService.startBudgetSetupProcess(budgetRegistration);

            if (!setupSuccess) {
                throw new Error('Budget setup process failed');
            }
            console.log('Budget setup completed successfully');

            // // Step 2: Register the Budget Goal
            // try {
            //     console.log('Attempting to register budget goal...');
            //     await handleBudgetGoalRegistration(budgetRegistration.budgetGoals.budgetId);
            //     console.log('Budget goal registered successfully');
            // } catch (goalError) {
            //     console.error('Error during budget goal registration:', goalError);
            //     setNotification({
            //         message: 'Warning: Budget was created but goal registration failed',
            //         severity: 'warning',
            //         show: true
            //     });
            //     // Continue execution despite goal registration failure
            // }

            // Success path
            setNotification({
                message: 'Budget created successfully!',
                severity: 'success',
                show: true
            });
            onSubmit(budgetData);
            navigate('/');

        } catch (error) {
            console.error('Error during budget setup:', error);
            let errorMessage = 'Failed to create budget';

            if (error instanceof Error) {
                errorMessage += `: ${error.message}`;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage += `: ${error.message}`;
            }

            setNotification({
                message: errorMessage,
                severity: 'error',
                show: true
            });
        }

    };

    return (
        <ThemeProvider theme={ theme}>
            <CssBaseline />
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 2, textAlign: 'center', fontSize: '2.0rem'}}>
                    Create Your Personalized Budget
                </Typography>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>


                {activeStep === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Previous Year's Budget Information
                        </Typography>
                        <TextField
                            fullWidth
                            label="What was your annual income last year?"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={budgetData.historicalData?.previousIncome || ''}
                            onChange={(e) => handleHistoricalDataChange('previousIncome', Number(e.target.value))}
                            sx={{ mb: 3 }}
                        />

                        <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                            <FormLabel>Did you have a budget last year?</FormLabel>
                            <RadioGroup
                                value={budgetData.historicalData?.hadPreviousBudget || false}
                                onChange={(e) => handleHistoricalDataChange('hadPreviousBudget', e.target.value === 'true')}
                            >
                                <FormControlLabel value={true} control={<Radio />} label="Yes" />
                                <FormControlLabel value={false} control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>

                        {budgetData.historicalData?.hadPreviousBudget && (
                            <>
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel>What was your primary financial focus last year?</InputLabel>
                                    <Select
                                        value={budgetData.historicalData?.previousBudgetType || ''}
                                        onChange={(e) => handleHistoricalDataChange('previousBudgetType', e.target.value)}
                                    >
                                        <MenuItem value="Saving">Saving money</MenuItem>
                                        <MenuItem value="DebtPayoff">Paying off debt</MenuItem>
                                        <MenuItem value="SpendingControl">Controlling spending</MenuItem>
                                        <MenuItem value="EmergencyFund">Building emergency fund</MenuItem>
                                    </Select>
                                </FormControl>

                                {budgetData.historicalData?.previousBudgetType === 'Saving' && (
                                    <TextField
                                        fullWidth
                                        label="How much did you manage to save?"
                                        type="number"
                                        InputProps={{ startAdornment: '$' }}
                                        value={budgetData.historicalData?.previousSavingsAmount || ''}
                                        onChange={(e) => handleHistoricalDataChange('previousSavingsAmount', Number(e.target.value))}
                                        sx={{ mb: 3 }}
                                    />
                                )}

                                {budgetData.historicalData?.previousBudgetType === 'DebtPayoff' && (
                                    <TextField
                                        fullWidth
                                        label="How much debt did you pay off?"
                                        type="number"
                                        InputProps={{ startAdornment: '$' }}
                                        value={budgetData.historicalData?.previousDebtAmount || ''}
                                        onChange={(e) => handleHistoricalDataChange('previousDebtAmount', Number(e.target.value))}
                                        sx={{ mb: 3 }}
                                    />
                                )}

                                {budgetData.historicalData?.previousBudgetType === 'SpendingControl' && (
                                    <TextField
                                        fullWidth
                                        label="What was your average monthly spending?"
                                        type="number"
                                        InputProps={{ startAdornment: '$' }}
                                        value={budgetData.historicalData?.previousSpendingAmount || ''}
                                        onChange={(e) => handleHistoricalDataChange('previousSpendingAmount', Number(e.target.value))}
                                        sx={{ mb: 3 }}
                                    />
                                )}

                                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                                    <FormLabel>Are your financial goals similar to last year?</FormLabel>
                                    <RadioGroup
                                        value={budgetData.historicalData?.previousGoalsSimilar || false}
                                        onChange={(e) => handleHistoricalDataChange('previousGoalsSimilar', e.target.value === 'true')}
                                    >
                                        <FormControlLabel value={true} control={<Radio />} label="Yes" />
                                        <FormControlLabel value={false} control={<Radio />} label="No" />
                                    </RadioGroup>
                                </FormControl>

                                {budgetData.historicalData?.previousGoalsSimilar === false && (
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Please describe what's different this year"
                                        value={budgetData.historicalData?.previousGoalsDifference || ''}
                                        onChange={(e) => handleHistoricalDataChange('previousGoalsDifference', e.target.value)}
                                        sx={{ mb: 3 }}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Select Your Budget Type
                        </Typography>
                        <Grid container spacing={2}>
                            {["Saving for a goal", "Paying off debt", "Controlling spending", "Building Emergency Fund"].map((type) => (
                                <Grid item xs={6} key={type}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => handleBudgetTypeSelect(type)}
                                        sx={{
                                            height: '100px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderColor: 'primary.main',
                                            color: 'primary.main',
                                            '&:hover': {
                                                backgroundColor: 'primary.main',
                                                color: 'white',
                                            },
                                        }}
                                    >
                                        {type}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Enter Your Income
                        </Typography>
                        <TextField
                            fullWidth
                            label="Monthly Income"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            value={budgetData.monthlyIncome || ''}
                            onChange={handleIncomeChange}
                            sx={{ mb: 2 }}
                        />
                    </Box>
                )}

                {activeStep === 3 && (
                    <Box>
                        {budgetData.budgetType === 'Saving for a goal' && <SavingsGoalQuestions onDataChange={handleSavingsGoalDataChange} />}
                        {budgetData.budgetType === 'Paying off debt' && <DebtPayoffQuestions onDataChange={handleDebtPayoffDataChange}/>}
                        {budgetData.budgetType === 'Controlling spending' && <SpendingControlQuestions onDataChange={handleSpendingControlDataChange} />}

                    </Box>
                )}

                {activeStep === 4 && (
                    <Box>
                        <Typography variant="h6" gutterBottom color="primary">
                            Review Your Budget
                        </Typography>


                        <List>
                            {/* Historical Data Review */}
                            {budgetData.historicalData && (
                                <>
                                    <ListItem>
                                        <ListItemText
                                            primary="Previous Year's Information"
                                            secondary={
                                                <>
                                                    <Typography component="span" display="block">
                                                        Previous Annual Income: ${budgetData.historicalData.previousIncome?.toFixed(2)}
                                                    </Typography>
                                                    <Typography component="span" display="block">
                                                        Had Previous Budget: {budgetData.historicalData.hadPreviousBudget ? 'Yes' : 'No'}
                                                    </Typography>
                                                    {budgetData.historicalData.hadPreviousBudget && (
                                                        <>
                                                            <Typography component="span" display="block">
                                                                Previous Focus: {budgetData.historicalData.previousBudgetType}
                                                            </Typography>
                                                            {budgetData.historicalData.previousGoalsSimilar === false && (
                                                                <Typography component="span" display="block">
                                                                    Changes This Year: {budgetData.historicalData.previousGoalsDifference}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                </>
                            )}
                            <ListItem>
                                <ListItemText primary="Budget Type" secondary={budgetData.budgetType} />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemText primary="Monthly Income" secondary={`$${budgetData.monthlyIncome.toFixed(2)}`} />
                            </ListItem>
                            <Divider />

                            {/* Conditional rendering based on budget type */}
                            {budgetData.budgetType === 'Saving for a goal' && budgetData.savingsGoalData && (
                                <ListItem>
                                    <ListItemText
                                        primary="Savings Goal"
                                        secondary={
                                            <>
                                                <Typography component="span" display="block">
                                                    Goal Name: {budgetData.savingsGoalData.goalName}
                                                </Typography>
                                                <Typography component="span" display="block">
                                                    Goal Description: {budgetData.savingsGoalData.goalDescription}
                                                </Typography>
                                                <Typography component="span" display="block">
                                                    Target Amount: ${budgetData.savingsGoalData.targetAmount.toFixed(2)}
                                                </Typography>
                                                <Typography component="span" display="block">
                                                    Current Savings: ${budgetData.savingsGoalData.currentSavings.toFixed(2)}
                                                </Typography>
                                                <Typography component="span" display="block">
                                                    Saving Frequency: {budgetData.savingsGoalData.savingsFrequency}
                                                </Typography>
                                                <Typography component="span" display="block">
                                                    Monthly Allocation: ${budgetData.savingsGoalData.monthlyAllocation?.toFixed(2) || 'N/A'}
                                                </Typography>
                                                <Typography component="span" display="block">
                                                    Target Date: {budgetData.savingsGoalData.targetDate ? new Date(budgetData.savingsGoalData.targetDate).toLocaleDateString() : 'N/A'}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            )}

                            {budgetData.budgetType === 'Paying off debt' && budgetData.debtPayoffData && (
                                <ListItem>
                                    <ListItemText
                                        primary="Debt Payoff Plan"
                                        secondary={
                                            <Box>
                                                <Typography variant="subtitle1" gutterBottom>Debt Breakdown:</Typography>
                                                {budgetData.debtPayoffData.debts.map((debt, index) => (
                                                    <Box key={index} sx={{ mb: 1 }}>
                                                        <Typography component="span" display="block">
                                                            {debt.type}: ${debt.amount.toFixed(2)}
                                                            (Monthly Allocation: ${debt.allocation.toFixed(2)})
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                <Divider sx={{ my: 1 }} />
                                                <Typography component="span" display="block" fontWeight="bold">
                                                    Total Debt: ${budgetData.debtPayoffData.debts.reduce((sum, debt) => sum + debt.amount, 0).toFixed(2)}
                                                </Typography>
                                                <Typography component="span" display="block" fontWeight="bold">
                                                    Total Monthly Allocation: ${budgetData.debtPayoffData.debts.reduce((sum, debt) => sum + debt.allocation, 0).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )}

                            {budgetData.budgetType === 'Controlling spending' && budgetData.spendingControlData && (
                                <ListItem>
                                    <ListItemText
                                        primary="Spending Control Plan"
                                        secondary={
                                            <Box sx={{
                                                maxHeight: 200,
                                                overflow: 'auto',
                                                border: 1,
                                                borderColor: 'grey.300',
                                                borderRadius: 1,
                                                mt: 1,
                                                '&::-webkit-scrollbar': {
                                                    width: '0.4em'
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
                                                    webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    backgroundColor: 'rgba(0,0,0,.1)',
                                                    outline: '1px solid slategrey'
                                                }
                                            }}>
                                                {budgetData.spendingControlData.categories &&
                                                budgetData.spendingControlData.categories.length > 0 ? (
                                                    <List disablePadding>
                                                        {budgetData.spendingControlData.categories.map((category, index) => (
                                                            <ListItem key={index} dense divider>
                                                                <ListItemText
                                                                    primary={category.name}
                                                                    secondary={
                                                                        <>
                                                                            <Typography component="span" display="block">Current Spending: ${category.currentSpending}</Typography>
                                                                            <Typography component="span" display="block">Spending Limit: ${category.spendingLimit}</Typography>
                                                                            <Typography component="span" display="block">Reduction Priority: {category.reductionPriority}</Typography>
                                                                        </>
                                                                    }
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                ) : (
                                                    <Typography>No spending categories added.</Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )}

                            {/*/!* Debug information *!/*/}
                            {/*<ListItem>*/}
                            {/*    <ListItemText*/}
                            {/*        primary="Debug Info"*/}
                            {/*        secondary={*/}
                            {/*            <>*/}
                            {/*                <Typography>Budget Type: {budgetData.budgetType}</Typography>*/}
                            {/*                <Typography>Has Spending Control Data: {budgetData.spendingControlData ? 'Yes' : 'No'}</Typography>*/}
                            {/*                {budgetData.spendingControlData && (*/}
                            {/*                    <Typography>*/}
                            {/*                        Number of categories: {budgetData.spendingControlData.categories?.length || 0}*/}
                            {/*                    </Typography>*/}
                            {/*                )}*/}
                            {/*            </>*/}
                            {/*        }*/}
                            {/*    />*/}
                            {/*</ListItem>*/}

                            {/* You can add more conditions for other budget types here */}
                        </List>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            startIcon={<Check />}
                            sx={{ mt: 2, bgcolor: 'primary.main', color: 'white' }}
                        >
                            Finish and Create Budget
                        </Button>
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Button
                        disabled={activeStep == 4}
                        onClick={handleNext}
                        >
                        Next
                    </Button>
                </Box>
            </Paper>
        </Container>
        </ThemeProvider>
    );
};

export default BudgetQuestionnaireForm;