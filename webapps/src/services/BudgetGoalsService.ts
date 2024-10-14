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


class BudgetGoalsService {

    private static instance: BudgetGoalsService;

    private constructor(){}

    public static getInstance() : BudgetGoalsService {
        if(!BudgetGoalsService.instance){
            BudgetGoalsService.instance = new BudgetGoalsService();
        }
        return BudgetGoalsService.instance;
    }

    public async createBudgetGoal(budgetGoal: BudgetGoal) : Promise<null>{
        return null;
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