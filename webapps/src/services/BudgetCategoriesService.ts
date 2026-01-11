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

    public async createBudgetCategoriesForDateRange(userId: number,
                                                    startDate: Date,
                                                    endDate: Date) : Promise<BudgetCategory[]>
    {
        try
        {
            const response = await axios.get<BudgetCategory[]>("http://localhost:8080/api/budget-category/create",
                {
                    params: {
                        userID: userId,
                        startDate: this.formatDate(startDate),
                        endDate: this.formatDate(endDate)
                    }
                });
            return response.data;
        }catch(error){
            console.error("Error creating budget categories for date range: ", error);
            if(axios.isAxiosError(error))
            {
                if(error.response?.status === 404)
                {
                    throw new Error('Budget categories were not found for the specified date range.');
                }else if(error.response?.status === 500){
                    throw new Error('Server error while creating budget categories');
                }
            }
            throw error;
        }
    }

    /**
     * Helper method to format Date to YYYY-MM-DD string
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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