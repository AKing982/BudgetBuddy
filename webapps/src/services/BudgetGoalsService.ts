import axios from "axios";
import {apiUrl} from "../config/api";
import {SavingsGoalData} from "../components/SavingsGoalQuestions";
import {DebtPayoffData} from "../components/DebtPayoffQuestions";
import {SpendingControlData} from "../components/SpendingControlQuestions";

export interface BudgetGoal {
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

interface BudgetGoalsRequest {
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


interface BudgetQuestions {
    budgetType: string;
    monthlyIncome: number;
    expenseCategories: BudgetCategory[];
    financialGoal: BudgetGoal;
    savingsGoalData?: SavingsGoalData;
    debtPayoffData?: DebtPayoffData;
    spendingControlData?: SpendingControlData;
}

class BudgetGoalsService {

    private static instance: BudgetGoalsService;

    private constructor(){}

    public static getInstance() : BudgetGoalsService {
        if(!BudgetGoalsService.instance){
            BudgetGoalsService.instance = new BudgetGoalsService();
        }
        return BudgetGoalsService.instance;
    }

    public createBudgetGoalsRequest(budgetData: BudgetQuestions, goalData: SavingsGoalData | DebtPayoffData | SpendingControlData) : Omit<BudgetGoalsRequest, 'budgetId'>  {
        switch (budgetData.budgetType) {
            case 'Saving for a goal':
                if (!('targetAmount' in goalData)) throw new Error('Savings goal data is required for this budget type');
                return {
                    goalName: goalData.goalName,
                    goalDescription: goalData.goalDescription,
                    goalType: 'Savings',
                    targetAmount: goalData.targetAmount,
                    monthlyAllocation: 0,
                    currentSavings: goalData.currentSavings,
                    savingsFrequency: goalData.savingsFrequency,
                    status: 'In Progress'
                };

            case 'Paying off debt':
                if (!('debts' in goalData)) throw new Error('Debt payoff data is required for this budget type');
                const totalDebt = goalData.debts.reduce((sum, debt) => sum + debt.amount, 0);
                const totalAllocation = goalData.debts.reduce((sum, debt) => sum + debt.allocation, 0);
                return {
                    goalName: 'Debt Payoff',
                    goalDescription: 'Paying off all debts',
                    goalType: 'Debt Payoff',
                    targetAmount: totalDebt,
                    monthlyAllocation: totalAllocation,
                    currentSavings: 0,
                    savingsFrequency: 'monthly',
                    status: 'In Progress'
                };

            case 'Controlling spending':
                if (!('categories' in goalData)) throw new Error('Spending Control Data is required for this budget type');
                const totalSpendingLimit = goalData.categories.reduce((sum, category) => sum + category.spendingLimit, 0);
                return {
                    goalName: 'Spending Control',
                    goalDescription: 'Managing and reducing overall spending',
                    goalType: 'Spending Control',
                    targetAmount: totalSpendingLimit,
                    monthlyAllocation: totalSpendingLimit,
                    currentSavings: 0,
                    savingsFrequency: 'monthly',
                    status: 'In Progress'
                };

            default:
                throw new Error('Invalid budget type');
        }
    }


    public async createBudgetGoal(budgetId: number, budgetQuestions: BudgetQuestions, goalData: SavingsGoalData | DebtPayoffData | SpendingControlData) : Promise<any>{
        if(budgetQuestions == null){
            throw new Error('BudgetGoal was found null');
        }
        try
        {
            const budgetGoalsRequest = this.createBudgetGoalsRequest(budgetQuestions, goalData);
            const budgetGoalsWithId = {...budgetGoalsRequest, budgetId};
            const response = await axios.post(`${apiUrl}/api/budget-goals/`, {
                budgetId: budgetGoalsWithId.budgetId,
                goalName: budgetGoalsWithId.goalName,
                goalDescription: budgetGoalsWithId.goalDescription,
                goalType: budgetGoalsWithId.goalType,
                targetAmount: budgetGoalsWithId.targetAmount,
                monthlyAllocation: budgetGoalsWithId.monthlyAllocation,
                currentSavings: budgetGoalsWithId.currentSavings,
                savingsFrequency: budgetGoalsWithId.savingsFrequency,
                status: budgetGoalsWithId.status
            });
            console.log('Budget Goals Response: ', response);
            return response;

        }catch(error){
            console.error('There was an error creating the budget goal: ', error);
            throw error;
        }
    }

    public async getBudgetGoalById(id: number) : Promise<null> {
        return null;
    }

    public async getAllBudgetGoals() : Promise<null> {
        return null;
    }

    public async updateBudgetGoal(id: number, budgetGoal: BudgetGoal) : Promise<null> {
        return null;
    }
}

export default BudgetGoalsService;