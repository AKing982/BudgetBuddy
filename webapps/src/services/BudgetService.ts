import axios from "axios";
import {API_BASE_URL, apiUrl} from "../config/api";
import {SavingsGoalData} from "../components/SavingsGoalQuestions";
import {DebtPayoffData} from "../components/DebtPayoffQuestions";
import {SpendingControlData} from "../components/SpendingControlQuestions";
import LoginService from "./LoginService";
import {BudgetType} from "../domain/BudgetType";
import {BudgetStats, ManageBudgetsData} from "../utils/Items";


export interface Budget {
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

    private calculateNumberOfMonths(startDate: Date, endDate: Date) : number {
        if(!startDate || !endDate){
            throw new Error('Invalid StartDate or EndDate found');
        }

        const yearDifference = endDate.getFullYear() - startDate.getFullYear();
        const monthDifference = endDate.getMonth() - startDate.getMonth();
        return yearDifference * 12 + monthDifference;
    }

    public calculateTotalBudgetAmount(budgetType: string, startDate: Date, endDate: Date, targetAmount: number, monthlyIncome: number, currentSavings: number, monthlyAllocation: number) : number
    {
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

            case 'Paying off debt':
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

    public calculateDailySpendingAmount(date: string, userId: number) : number
    {
        return 0.0;
    }

    public async createBudgetRequest(budgetData: BudgetQuestions): Promise<BudgetCreateRequest> {
        if (!budgetData) {
            throw new Error('BudgetData found null');
        }


        const newUserId = await this.loginService.fetchMaximumUserId();
        let budgetName: string = this.getBudgetName(budgetData.budgetType);

        let monthlyIncome = budgetData.monthlyIncome;
        if(monthlyIncome < 0){
            throw new Error('Invalid monthly income');
        }
        const startDate = new Date();
        console.log('target number: ', budgetData.savingsGoalData?.targetAmount);
        const targetAmount = budgetData.savingsGoalData?.targetAmount as number;
        const endDate = this.createEndDateTarget(budgetData) as Date;
        const currentSavings = this.getCurrentSavings(budgetData);
        const budgetAmount = this.calculateTotalBudgetAmount(budgetData.budgetType, startDate, endDate, targetAmount, monthlyIncome, currentSavings, 0);

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

    private getBiWeeklyIncome(income: number): number {
        this.validateMonthlyIncome(income);
        const biWeeklyIncome = income / 2;
        return Math.round(biWeeklyIncome * 100) / 100;
    }

    private validateMonthlyIncome(income: number) : number {
        if(income < 0){
            throw new Error('Invalid monthly income: income cannot be negative');
        }
        return income;
    }

    private getTargetAmount(budgetQuestions: BudgetQuestions) : number
    {
        if(!budgetQuestions){
            return 0;
        }
        let budgetType: string = budgetQuestions.budgetType;
        let targetAmount: number = 0;
        switch(budgetType){
            case BudgetType.SAVINGS:
                const targetValue = budgetQuestions.savingsGoalData?.targetAmount;
                if(!targetValue) return 0;
                targetAmount = targetValue;
                break;
            case BudgetType.CONTROL_SPENDING:
                targetAmount = 0;
                break;
            case BudgetType.PAY_DEBT:
                const debtTargetValue = budgetQuestions.debtPayoffData?.debts?.reduce((total, debt) =>
                        total + debt.amount
                    , 0) ?? 0;
                targetAmount = debtTargetValue;
                break;
            default:
                throw new Error('Invalid Budget Type');
        }
        return targetAmount;
    }

    private getBudgetName(budgetType: string) : string {
        switch(budgetType){
            case 'Saving for a goal':
                return "Savings Budget";
            case 'Controlling spending':
                return "Spending Control Budget";
            case 'Paying off debt':
                return "Debt Payoff Budget";
            default:
                throw new Error('Invalid Budget Type');
        }
    }

    private getCurrentSavings(budgetQuestions: BudgetQuestions){
        if(budgetQuestions.savingsGoalData && 'currentSavings' in budgetQuestions.savingsGoalData){
            return budgetQuestions.savingsGoalData.currentSavings;
        }
        return 0;
    }

    private createEndDateTarget(budgetData: BudgetQuestions) : Date {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        switch(budgetData.budgetType){
            case 'Saving for a goal':
                if("targetDate" in budgetData && budgetData?.targetDate){
                    const date = budgetData.savingsGoalData?.targetDate;
                    if(!date) throw new Error('Target Date is invalid');
                    const targetDate = new Date(date);
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

    public async getBudgetsByUserIdAndYear(userId: number, year: number) : Promise<ManageBudgetsData[]>
    {
        if(userId < 1 || year < 0)
        {
            throw new Error('Invalid userId or year found');
        }
        try
        {
            const response = await axios.get(`${API_BASE_URL}/budgets/${userId}/${year}`);
            return response.data;
        }catch(error){
            console.error('There was an error fetching budgets for userId: ', userId);
            return [];
        }
    }

    public async checkIfBudgetExistsForYear(userId: number, year: number) : Promise<boolean>
    {
        if(userId < 0){
            throw new Error('Invalid userId found');
        }
        try
        {
            const response = await axios.get(`${API_BASE_URL}/budgets/check-if-budget-exists/${userId}/${year}`);
            // Validate response
            if (response.status !== 200) {
                throw new Error(`Unexpected status code: ${response.status}`);
            }

            if (typeof response.data !== 'boolean') {
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid response format: expected boolean');
            }
            return response.data;
        }catch(error){
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with error status
                    const status = error.response.status;
                    const message = error.response.data?.message || error.message;

                    console.error(
                        `Server error checking budget existence for userId: ${userId}, year: ${year}`,
                        {
                            status,
                            message,
                            data: error.response.data
                        }
                    );

                    switch (status) {
                        case 400:
                            throw new Error(`Bad request: ${message}`);
                        case 404:
                            // Budget not found - this is actually a valid case, return false
                            console.log(`No budget found for userId: ${userId}, year: ${year}`);
                            return false;
                        case 500:
                            throw new Error(`Server error: ${message}`);
                        case 503:
                            throw new Error('Service temporarily unavailable. Please try again later.');
                        default:
                            throw new Error(`Failed to check budget existence: ${message}`);
                    }
                } else if (error.request) {
                    // Request was made but no response received
                    console.error(
                        `No response received when checking budget for userId: ${userId}, year: ${year}`,
                        error.request
                    );
                    throw new Error('No response from server. Please check your internet connection.');
                } else {
                    // Error setting up the request
                    console.error(
                        `Error setting up request for userId: ${userId}, year: ${year}`,
                        error.message
                    );
                    throw new Error(`Request setup error: ${error.message}`);
                }
            }

            // Handle non-Axios errors
            console.error(
                `Unexpected error checking budget existence for userId: ${userId}, year: ${year}`,
                error
            );

            if (error instanceof Error) {
                throw error;
            }

            throw new Error('An unexpected error occurred while checking budget existence');
        }
    }

    public async getBudgetTypeByUserId(userId: number) : Promise<Budget[]> {
        if(userId < 0){
            throw new Error('Invalid userId found');
        }
        try
        {
            const response = await axios.get(`${API_BASE_URL}/budgets/budget-type/${userId}`);
            return response.data;
        }catch(error){
            console.error('There was an error fetching the budget type for userId: ', userId);
            return [];
        }
    }

    public async saveBudget(budget: BudgetQuestions) : Promise<any> {
        if(!budget){
            throw new Error('Budget is null');
        }

        // If the budget data is empty, then throw error
        if(Object.keys(budget).length === 0){
            throw new Error();
        }

        try
        {
            const request = await this.createBudgetRequest(budget);
            if(!request){
                throw new Error('Invalid budget request');
            }
            return await axios.post(`${API_BASE_URL}/budgets/`, {
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