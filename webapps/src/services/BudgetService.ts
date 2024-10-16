import axios from "axios";
import {apiUrl} from "../config/api";
import {SavingsGoalData} from "../components/SavingsGoalQuestions";
import {DebtPayoffData} from "../components/DebtPayoffQuestions";
import {SpendingControlData} from "../components/SpendingControlQuestions";
import LoginService from "./LoginService";


interface Budget {
    id: number;
    userId: number;
    budgetName: string;
    budgetDescription: string;
    budgetAmount: string;
    monthlyIncome: number;
    startDate: Date;
    endDate: Date;
}


interface BudgetCreateRequest {
    userId: number;
    budgetName: string;
    budgetDescription: string;
    totalBudgetAmount: number;
    monthlyIncome: number;
    startDate: Date;
    endDate: string | Date | null | undefined ;
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



class BudgetService {
    private static instance: BudgetService;
    private loginService: LoginService = new LoginService();

    private constructor(){

    }

    public static getInstance() : BudgetService {
        if(!BudgetService.instance){
            BudgetService.instance = new BudgetService();
        }
        return BudgetService.instance;
    }

    public async fetchUserBudget(userId: number) : Promise<null> {
        return null;
    }


    public calculateTotalBudgetAmount(budgetType: string, startDate: Date, endDate: Date, targetAmount: number, monthlyIncome: number, currentSavings: number, monthlyAllocation: number) : number {
        if(targetAmount < 0) throw new Error('Invalid Target Amount has been entered');
        let totalBudgetAmount = 0;
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
        switch(budgetType){
            case 'Saving for a goal':
                let totalToSave = targetAmount - currentSavings;
                let monthlySavings = totalToSave / months;
                totalBudgetAmount = (monthlyIncome - monthlySavings);
                break;

            case 'paying off debt':
                let debtAmount = targetAmount;
                totalBudgetAmount = monthlyIncome - monthlyAllocation;

                // Check if the debt can be paid off within the
                if(monthlyAllocation * months < debtAmount){
                    alert('Warning: The specified monthly allocation may not be sufficient to pay off the debt within the budget period');
                }
                break;

            case 'Controlling spending':
                totalBudgetAmount = monthlyIncome;
                break;

            default:
                throw new Error('Invalid Budget type');
        }
        return totalBudgetAmount;
    }


    public async createBudgetRequest(budgetData: BudgetQuestions, savingsGoalData: SavingsGoalData): Promise<BudgetCreateRequest> {
        if (budgetData == null) {
            throw new Error('BudgetData found null');
        }
        const newUserId = await this.loginService.fetchMaximumUserId();
        let budgetName = budgetData.budgetType === 'Saving for a goal'
            ? 'Savings Budget'
            : (budgetData.budgetType === 'Controlling spending'
                ? 'Spending Control Budget'
                : (budgetData.budgetType === 'paying off debt'
                    ? 'Debt Payoff Budget'
                    : 'Unknown Budget Type'));

        const startDate = new Date();
        const targetAmount = budgetData.savingsGoalData?.targetAmount;
        const endDate = this.createEndDateTarget(budgetData, savingsGoalData);

        return {
            userId: newUserId,
            budgetName: budgetName,
            budgetDescription: budgetName,
            totalBudgetAmount: 0,
            monthlyIncome: budgetData.monthlyIncome,
            startDate: new Date(),
            endDate: endDate
        };
    };

    private createEndDateTarget(budgetData: BudgetQuestions, savingsGoalData: SavingsGoalData) : string | Date {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        switch(budgetData.budgetType){
            case 'Saving for a goal':
                return savingsGoalData?.targetDate;
            case 'Controlling spending':
            case 'Pay off debt':
                return oneYearFromNow;
            default:
                throw new Error('Invalid budget type found');
        }
    }


    public async saveBudget(budget: BudgetQuestions, savingsGoalData: SavingsGoalData) : Promise<Budget> {
        if(budget == null){
            throw new Error('Budget is null');
        }
        try
        {
            const request = await this.createBudgetRequest(budget,savingsGoalData);
            const response = await axios.post(`${apiUrl}/api/budgets/`, {
                request
            });
            return response.data;
        }catch(error){
            console.error('There was an error saving the budget: ', error);
            throw error;
        }
    }

    public async updateBudget(budget: Budget) : Promise<null> {
        return null;
    }
}

export default BudgetService;