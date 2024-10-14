import axios from "axios";
import {apiUrl} from "../config/api";

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
    budgetAmount: string;
    monthlyIncome: number;
    startDate: Date;
    endDate: Date;
}

class BudgetService {
    private static instance: BudgetService;

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

    private createBudgetRequest(budget: Budget) : BudgetCreateRequest {
        return {
            userId: budget.userId,
            budgetName: budget.budgetName,
            budgetDescription: budget.budgetDescription,
            budgetAmount: budget.budgetAmount,
            monthlyIncome: budget.monthlyIncome,
            startDate: budget.startDate,
            endDate: budget.endDate
        }
    }

    public async saveBudget(budget: Budget) : Promise<null> {
        if(budget == null){
            throw new Error('Budget is null');
        }
        try
        {
            const request = this.createBudgetRequest(budget);
            const response = await axios.post(`${apiUrl}/budgets/`, {
                request
            });
            return response.data;
        }catch(error){
            console.error('There was an error saving the budget: ', error);
            return null;
        }
    }

    public async updateBudget(budget: Budget) : Promise<null> {
        return null;
    }
}

export default BudgetService;