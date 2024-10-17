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

    private calculateNumberOfMonths(startDate: Date, endDate: Date) : number {
        if(!startDate || !endDate){
            throw new Error('Invalid StartDate or EndDate found');
        }

        const yearDifference = endDate.getFullYear() - startDate.getFullYear();
        const monthDifference = endDate.getMonth() - startDate.getMonth();
        return yearDifference * 12 + monthDifference;
    }

    public calculateTotalBudgetAmount(budgetType: string, startDate: Date, endDate: Date, targetAmount: number, monthlyIncome: number, currentSavings: number, monthlyAllocation: number) : number {
        console.log('Target Amount: ', targetAmount);
        console.log('Current Savings: ', currentSavings);
        if(targetAmount < 0) throw new Error('Invalid Target Amount has been entered');

        // If the start Date and endDate are equal, then adjust the end date to be one month out from the start date
        if(startDate.getDate() === endDate.getDate()){
            endDate.setMonth(startDate.getMonth() + 1);
        }

        let totalBudgetAmount = 0;
        const months = this.calculateNumberOfMonths(startDate, endDate);
        switch(budgetType){
            case 'Saving for a goal':
                let totalToSave = targetAmount - currentSavings;
                console.log('Total to Save: ', totalToSave);
                let monthlySavings = totalToSave / months;
                console.log('Monthly Savings: ', monthlySavings);
                totalBudgetAmount = (monthlyIncome - monthlySavings);
                console.log('Total Budget Amount for savings: ', totalBudgetAmount);
                break;

            case 'paying off debt':
                let debtAmount = targetAmount;
                totalBudgetAmount = monthlyIncome - monthlyAllocation;

                // // Check if the debt can be paid off within the
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
    };

    public async createBudgetRequest(budgetData: BudgetQuestions, savingsGoalData: SavingsGoalData): Promise<BudgetCreateRequest> {
        if (!budgetData) {
            throw new Error('BudgetData found null');
        }

        if(!savingsGoalData){
            throw new Error('SavingsGoalData found null');
        }

        const newUserId = await this.loginService.fetchMaximumUserId();
        let budgetName = budgetData.budgetType === 'Saving for a goal'
            ? 'Savings Budget'
            : (budgetData.budgetType === 'Controlling spending'
                ? 'Spending Control Budget'
                : (budgetData.budgetType === 'paying off debt'
                    ? 'Debt Payoff Budget'
                    : 'Unknown Budget Type'));

        let monthlyIncome = budgetData.monthlyIncome;
        if(monthlyIncome < 0){
            throw new Error('Invalid monthly income');
        }
        const startDate = new Date();
        console.log('target number: ', budgetData.savingsGoalData?.targetAmount);
        const targetAmount = budgetData.savingsGoalData?.targetAmount as number;
        const endDate = this.createEndDateTarget(budgetData, savingsGoalData) as Date;
        const budgetAmount = this.calculateTotalBudgetAmount(budgetData.budgetType, startDate, endDate, targetAmount, monthlyIncome, savingsGoalData.currentSavings, 0);

        return {
            userId: newUserId,
            budgetName: budgetName,
            budgetDescription: budgetName,
            totalBudgetAmount: budgetAmount,
            monthlyIncome: monthlyIncome,
            startDate: new Date(),
            endDate: endDate
        };
    };

    private createEndDateTarget(budgetData: BudgetQuestions, savingsGoalData: SavingsGoalData) : Date {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        switch(budgetData.budgetType){
            case 'Saving for a goal':
                if(savingsGoalData?.targetDate){
                    const targetDate = new Date(savingsGoalData.targetDate);
                    return isNaN(targetDate.getTime()) ? oneYearFromNow : targetDate;
                }
                return oneYearFromNow;
            case 'Controlling spending':
            case 'Paying off debt':
                return oneYearFromNow;
            default:
                throw new Error('Invalid budget type found');
        }
    };

    public async saveBudget(budget: BudgetQuestions, savingsGoalData: SavingsGoalData) : Promise<any> {
        if(!budget){
            throw new Error('Budget is null');
        }

        if(!savingsGoalData){
            throw new Error('SavingsGoalData cannot be null');
        }

        // If the budget data is empty, then throw error
        if(Object.keys(budget).length === 0){
            throw new Error();
        }

        try
        {
            const request = await this.createBudgetRequest(budget,savingsGoalData);
            if(!request){
                throw new Error('Invalid budget request');
            }
            return await axios.post(`${apiUrl}/api/budgets/`, {
                userId: request.userId,
                budgetName: request.budgetName,
                budgetDescription: request.budgetDescription,
                budgetAmount: request.totalBudgetAmount,
                monthlyIncome: request.monthlyIncome,
                startDate: request.startDate,
                endDate: request.endDate
            });
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