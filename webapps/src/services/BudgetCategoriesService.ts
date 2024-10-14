import BudgetCategoryDetails from "../components/BudgetCategoryDetails";
import axios from "axios";
import {apiUrl} from "../config/api";

interface BudgetCategories {
    budgetId: number;
    categoryName: string;
    allocatedAmount: number;
    monthlySpendingLimit: number;
    currentSpending: number;
    isFixedExpense: boolean;
    isActive: boolean;
    priority: number;
}

interface BudgetCategoryRequest {
    budgetId: number;
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

    private createBudgetCategoryRequest(budgetCategory: BudgetCategories) : BudgetCategoryRequest {
        return {
            budgetId: budgetCategory.budgetId,
            categoryName: budgetCategory.categoryName,
            allocatedAmount: budgetCategory.allocatedAmount,
            monthlySpendingLimit: budgetCategory.monthlySpendingLimit,
            currentSpending: budgetCategory.currentSpending,
            isFixedExpense: budgetCategory.isFixedExpense,
            isActive: budgetCategory.isActive,
            priority: budgetCategory.priority
        };
    }

    public async createBudgetCategory(budgetCategory: BudgetCategories) : Promise<null> {
        if(budgetCategory == null){
            throw new Error('Budget Category was found null');
        }
        try
        {
            const request = this.createBudgetCategoryRequest(budgetCategory);
            const response = await axios.post(`${apiUrl}/budget-categories/`, {
                request
            });
            return response.data;

        }catch(error){
            console.error('There was an error creating the budget category: ', error);
            return null;
        }
    }

    public async getBudgetCategoryById(id: number) : Promise<null> {
        return null;
    }

    public async updateBudgetCategory(id: number, budgetCategory: BudgetCategories) : Promise<null> {
        return null;
    }
}
export default BudgetCategoriesService;