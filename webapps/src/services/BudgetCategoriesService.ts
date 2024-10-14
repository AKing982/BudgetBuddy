interface BudgetCategories {
    budget: Budget;
    categoryName: string;
    allocatedAmount: number;
    monthlySpendingLimit: number;
    currentSpending: number;
    isFixedExpense: boolean;
    isActive: boolean;
    priority: number;
}


class BudgetCategoriesService {
    private static instance: BudgetCategoriesService;

    private constructor(){

    }

    public static getInstance() : BudgetCategoriesService {
        if(!BudgetCategoriesService.instance){
            BudgetCategoriesService.instance = new BudgetCategoriesService();
        }
        return BudgetCategoriesService.instance;
    }

    public async createBudgetCategory(budgetCategory: BudgetCategories) : Promise<null> {
        return null;
    }

    public async getBudgetCategoryById(id: number) : Promise<null> {
        return null;
    }

    public async updateBudgetCategory(id: number, budgetCategory: BudgetCategories) : Promise<null> {
        return null;
    }
}