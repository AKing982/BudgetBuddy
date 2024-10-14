import axios from "axios";
import {apiUrl} from "../config/api";

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


class BudgetGoalsService {

    private static instance: BudgetGoalsService;

    private constructor(){}

    public static getInstance() : BudgetGoalsService {
        if(!BudgetGoalsService.instance){
            BudgetGoalsService.instance = new BudgetGoalsService();
        }
        return BudgetGoalsService.instance;
    }

    private createBudgetGoalsRequest(budgetGoal: BudgetGoal) : BudgetGoalsRequest {
        return {
            budgetId: budgetGoal.budgetId,
            goalName: budgetGoal.goalName,
            goalDescription: budgetGoal.goalDescription,
            goalType: budgetGoal.goalType,
            targetAmount: budgetGoal.targetAmount,
            monthlyAllocation: budgetGoal.monthlyAllocation,
            currentSavings: budgetGoal.currentSavings,
            savingsFrequency: budgetGoal.savingsFrequency,
            status: budgetGoal.status
        };
    }

    public async createBudgetGoal(budgetGoal: BudgetGoal) : Promise<null>{
        if(budgetGoal == null){
            throw new Error('BudgetGoal was found null');
        }
        try
        {
            const request = this.createBudgetGoalsRequest(budgetGoal);
            const response = await axios.post(`${apiUrl}/budget-goals/`, {
                request
            });
            return response.data;

        }catch(error){
            console.error('There was an error creating the budget goal: ', error);
            return null;
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