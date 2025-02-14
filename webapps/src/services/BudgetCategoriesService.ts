import axios from "axios";
import {apiUrl} from "../config/api";
import {BudgetCategory} from "../utils/BudgetUtils";

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

interface BudgetCategoryRequestWrapper{
    categories: BudgetCategory[];
}

export interface BudgetCategoryRequest {
    categories: BudgetCategory[];
}


class BudgetCategoriesService
{
    private static instance: BudgetCategoriesService;

    private constructor(){

    }

    public static getInstance() : BudgetCategoriesService {
        if(!BudgetCategoriesService.instance){
            BudgetCategoriesService.instance = new BudgetCategoriesService();
        }
        return BudgetCategoriesService.instance;
    }

    private createBudgetCategoryRequest(budgetCategories: BudgetCategory[]): BudgetCategoryRequest {
        return {
            categories: budgetCategories
        };
    }

    public async createBudgetCategory(budgetCategories: BudgetCategory[]) : Promise<any> {
        if(budgetCategories == null){
            throw new Error('Budget Category was found null');
        }
        try
        {
            const request = this.createBudgetCategoryRequest(budgetCategories);
            return await axios.post(`${apiUrl}/api/budget-categories/`, {
                categories: budgetCategories
            });

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