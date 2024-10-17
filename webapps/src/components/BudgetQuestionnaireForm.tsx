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
import BudgetCategoriesService, {BudgetCategoryRequest} from "../services/BudgetCategoriesService";
import LoginService from "../services/LoginService";
import axios from "axios";
import {apiUrl} from "../config/api";

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
    const navigate = useNavigate();
    const budgetService = BudgetService.getInstance();
    const budgetGoalsService = BudgetGoalsService.getInstance();
    const budgetCategoriesService = BudgetCategoriesService.getInstance();
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


    const handleBudgetRegistration = async (budgetData: BudgetQuestions)=> {
        if(budgetData == null){
            return null;
        }
        try
        {
            // Create the budget Request
            if(!budgetData.savingsGoalData){
                return null;
            }

            const budgetRequest = await budgetService.createBudgetRequest(budgetData, budgetData.savingsGoalData);
            console.log('Budget Request: ', budgetRequest);
            // Get the response from the server
            const budgetServerResponse = await budgetService.saveBudget(budgetData, budgetData.savingsGoalData);
            console.log('Budget Response: ', budgetServerResponse.data);
            return budgetServerResponse.data;
        }catch(error){
            console.error('There was an error creating the budget: ', error);
            throw error;
        }
    };

    const handleBudgetGoalRegistration = async (budgetId: number) => {
        try {
            let goalData;
            switch (budgetData.budgetType) {
                case 'Saving for a goal':
                    if (!budgetData.savingsGoalData) {
                        console.error('Savings goal data is missing');
                        return null;
                    }
                    goalData = budgetData.savingsGoalData;
                    break;
                case 'Paying off debt':
                    if (!budgetData.debtPayoffData) {
                        console.error('Debt payoff data is missing');
                        return null;
                    }
                    goalData = budgetData.debtPayoffData;
                    break;
                case 'Controlling spending':
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

            const budgetCategories: BudgetCategoryRequest[] = budgetData.spendingControlData.categories.map(category => ({
                budgetId: budgetId,
                categoryName: category.name,
                allocatedAmount: category.spendingLimit,
                monthlySpendingLimit: category.spendingLimit,
                currentSpending: category.currentSpending,
                isFixedExpense: false, // Assuming this is false for all categories
                isActive: true, // Assuming all categories are active
                priority: category.reductionPriority
            }));

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


    const handleSubmit = async () => {
        try {
            const finalBudgetData = {
                ...budgetData,
                savingGoalData: budgetData.budgetType === 'Saving for a goal' ? budgetData.savingsGoalData : undefined,
                debtPayoffData: budgetData.budgetType === 'Paying off debt' ? budgetData.debtPayoffData : undefined,
                spendingControlData: budgetData.budgetType === 'Controlling spending' ? budgetData.spendingControlData : undefined,
            };

            // Step 1: Register the budget
            let createdBudget;
            try {
                console.log('Attempting to register budget...');
                console.log('Budget Data: ', budgetData);
                createdBudget = await handleBudgetRegistration(budgetData);
                if (!createdBudget) {
                    throw new Error('Budget registration returned null');
                }
                console.log('Budget registered successfully:', createdBudget);
            } catch (error) {
                console.error('Error during budget registration:', error);
                let errorMessage = 'Failed to create budget';
                if (error instanceof Error) {
                    errorMessage += `: ${error.message}`;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage += `: ${error.message}`;
                }
                throw new Error(errorMessage);
            }

            // Step 2: Register the Budget Goal
            try {
                console.log('Attempting to register budget goal...');
                await handleBudgetGoalRegistration(createdBudget.id);
                console.log('Budget goal registered successfully');
            } catch (goalError) {
                console.error('Error during budget goal registration:', goalError);
                // Consider whether you want to throw here or continue
            }

            // Step 3: Handle the Budget Categories when budget type is controlled spending
            if (budgetData.budgetType === 'Controlling spending') {
                try {
                    console.log('Attempting to register budget categories...');
                    await handleBudgetCategoriesRegistration(createdBudget.id);
                    console.log('Budget categories registered successfully');
                } catch (categoriesError) {
                    console.error('Error during budget categories registration:', categoriesError);
                    // Consider whether you want to throw here or continue
                }
            }
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
                        {budgetData.budgetType === 'Saving for a goal' && <SavingsGoalQuestions onDataChange={handleSavingsGoalDataChange} />}
                        {budgetData.budgetType === 'Paying off debt' && <DebtPayoffQuestions onDataChange={handleDebtPayoffDataChange}/>}
                        {budgetData.budgetType === 'Controlling spending' && <SpendingControlQuestions onDataChange={handleSpendingControlDataChange} />}

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
                            {budgetData.budgetType === 'Saving for a goal' && budgetData.savingsGoalData && (
                                <ListItem>
                                    <ListItemText
                                        primary="Savings Goal"
                                        secondary={
                                            <>
                                                <Typography component="span" display="block">Goal Name: {budgetData.savingsGoalData.goalName}</Typography>
                                                <Typography component="span" display="block">Goal Description: {budgetData.savingsGoalData.goalDescription}</Typography>
                                                <Typography component="span" display="block">Target Amount: ${budgetData.savingsGoalData.targetAmount}</Typography>
                                                <Typography component="span" display="block">Current Savings: ${budgetData.savingsGoalData.currentSavings}</Typography>
                                                <Typography component="span" display="block">Saving Frequency: {budgetData.savingsGoalData.savingsFrequency}</Typography>
                                                <Typography component="span" display="block">Target Date: {budgetData.savingsGoalData.targetDate}</Typography>
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