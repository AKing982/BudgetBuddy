
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

    public async saveBudget(budget: Budget) : Promise<null> {
        return null;
    }

    public async updateBudget(budget: Budget) : Promise<null> {
        return null;
    }

}