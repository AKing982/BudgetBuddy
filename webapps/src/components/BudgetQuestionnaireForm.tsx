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
    InputLabel, Select, MenuItem, SelectChangeEvent, Slider
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
import BudgetCategoriesService from "../services/BudgetCategoriesService";

interface BudgetCategory {
    name: string;
    amount: number;
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
    budgetType: string;
    monthlyIncome: number;
    expenseCategories: BudgetCategory[];
    financialGoal: BudgetGoal;
    savingsGoalData?: SavingsGoalData;
    debtPayoffData?: DebtPayoffData;
    spendingControlData?: SpendingControlData;
}

interface BudgetRequestData {
    userid: number;
    budgetName: string;
    budgetDescription: string;
    totalBudgetAmount: number;
    monthlyIncome: number;
    startDate: Date;
    endDate: Date;
}

interface BudgetGoalsData {
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

interface BudgetCategoriesData {
    budgetId: number;
    categoryName: string;
    allocatedAmount: number;
    monthlySpendingLimit: number;
    currentSpending: number;
    isFixedExpense: boolean;
    isActive: boolean;
    priority: number;
}

interface SavingsGoalRequestData {

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

const steps = ['Budget Type', 'Income', 'Goals', 'Review'];

const BudgetQuestionnaireForm: React.FC<BudgetQuestionnaireProps> = ({ onSubmit }) => {
    const [activeStep, setActiveStep] = useState<number>(0);
    const [budgetData, setBudgetData] = useState<BudgetQuestions>({
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
    const [newCategory, setNewCategory] = useState<BudgetCategory>({name: '', amount: 0});
    const [savingsGoalData, setSavingsGoalData] = useState<SavingsGoalData | undefined>(undefined);
    const [debtPayoffData, setDebtPayoffData] = useState<DebtPayoffData | undefined>(undefined);
    const [spendingControlData, setSpendingControlData] = useState<SpendingControlData | undefined>(undefined);
    const navigate = useNavigate();
    const budgetService = BudgetService.getInstance();
    const budgetGoalsService = BudgetGoalsService.getInstance();
    const budgetCategoriesService = BudgetCategoriesService.getInstance();

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
        if (newCategory.name && newCategory.amount) {
            setBudgetData(prev => ({
                ...prev,
                expenseCategories: [...prev.expenseCategories, newCategory]
            }));
            setNewCategory({ name: '', amount: 0 });
        }
    };

    const handleCategoryDelete = (index: number) => {
        setBudgetData(prev => ({
            ...prev,
            expenseCategories: prev.expenseCategories.filter((_, i) => i !== index)
        }));
    };

    const createBudgetRequest = (budgetData: BudgetQuestions)  : BudgetRequestData => {
        if(budgetData == null){
            throw new Error('BudgetData found null');
        }
        return {
            userid: budgetData.
        }
    };

    const createDebtPayoffRequest = (debtPayOffData: DebtPayoffData): DebtPayoffData => {

    };

    const createControlSpendingRequest = (spendingControlData: SpendingControlData) : SpendingControlData => {

    };

    const createSavingsGoalRequest = (savingsGoalData: SavingsGoalData): SavingsGoalRequestData => {

    };

    const handleDebtPayoffRegistration = async () => {

    };

    const handleControlSpendingRegistration = async () => {

    };

    const handleSavingsGoalRegistration = async () => {

    };

    const handleBudgetCreationRegistration = async () => {

    };


    const handleSubmit = async () => {
        try {
            const finalBudgetData = {
                ...budgetData,
                savingGoalData: budgetData.budgetType === 'Saving for a goal' ? savingsGoalData : undefined,
                debtPayoffData: budgetData.budgetType === 'Paying off debt' ? debtPayoffData : undefined,
                spendingControlData: budgetData.budgetType === 'Controlling spending' ? spendingControlData : undefined,
            };
            onSubmit(finalBudgetData);
            navigate('/');
        } catch(error) {
            console.error('Error submitting budget data: ', error);
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
                            Select Your Budget Type
                        </Typography>
                        <Grid container spacing={2}>
                            {['Saving for a goal', 'Paying off debt', 'Controlling spending', 'Building emergency fund'].map((type) => (
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

                {activeStep === 1 && (
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

                {activeStep === 2 && (
                    <Box>
                        {budgetData.budgetType === 'Saving for a goal' && <SavingsGoalQuestions onDataChange={(data) => setSavingsGoalData(data)} />}
                        {budgetData.budgetType === 'Paying off debt' && <DebtPayoffQuestions onDataChange={(data) => setDebtPayoffData(data)}/>}
                        {budgetData.budgetType === 'Controlling spending' && <SpendingControlQuestions spendingControlData={spendingControlData} setSpendingControlData={setSpendingControlData}/>}

                    </Box>
                )}

                {activeStep === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom color="primary">
                            Review Your Budget
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText primary="Budget Type" secondary={budgetData.budgetType} />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemText primary="Monthly Income" secondary={`$${budgetData.monthlyIncome.toFixed(2)}`} />
                            </ListItem>
                            <Divider />

                            {/* Conditional rendering based on budget type */}
                            {budgetData.budgetType === 'Saving for a goal' && savingsGoalData && (
                                <ListItem>
                                    <ListItemText
                                        primary="Savings Goal"
                                        secondary={
                                            <>
                                                <Typography component="span" display="block">Goal Name: {savingsGoalData.goalName}</Typography>
                                                <Typography component="span" display="block">Goal Description: {savingsGoalData.goalDescription}</Typography>
                                                <Typography component="span" display="block">Target Amount: ${savingsGoalData.targetAmount}</Typography>
                                                <Typography component="span" display="block">Current Savings: ${savingsGoalData.currentSavings}</Typography>
                                                <Typography component="span" display="block">Saving Frequency: {savingsGoalData.savingsFrequency}</Typography>
                                                <Typography component="span" display="block">Target Date: {savingsGoalData.targetDate}</Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            )}

                            {budgetData.budgetType === 'Paying off debt' && debtPayoffData && (
                                <ListItem>
                                    <ListItemText
                                        primary="Debt Payoff Plan"
                                        secondary={
                                            <Box>
                                                <Typography variant="subtitle1" gutterBottom>Debt Breakdown:</Typography>
                                                {debtPayoffData.debts.map((debt, index) => (
                                                    <Box key={index} sx={{ mb: 1 }}>
                                                        <Typography component="span" display="block">
                                                            {debt.type}: ${debt.amount.toFixed(2)}
                                                            (Monthly Allocation: ${debt.allocation.toFixed(2)})
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                <Divider sx={{ my: 1 }} />
                                                <Typography component="span" display="block" fontWeight="bold">
                                                    Total Debt: ${debtPayoffData.debts.reduce((sum, debt) => sum + debt.amount, 0).toFixed(2)}
                                                </Typography>
                                                <Typography component="span" display="block" fontWeight="bold">
                                                    Total Monthly Allocation: ${debtPayoffData.debts.reduce((sum, debt) => sum + debt.allocation, 0).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )}

                            {budgetData.budgetType === 'Controlling spending' && spendingControlData && (
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
                                                <List disablePadding>
                                                    {spendingControlData.categories.map((category, index) => (
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
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )}

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