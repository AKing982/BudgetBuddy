import axios from 'axios';
import {Period} from '../config/Types';
import {BudgetCategoryResponse} from '../config/Types';
import BudgetCategoriesService from "./BudgetCategoriesService";
import {apiUrl} from "../config/api";

const API_BASE_URL = 'http://localhost:8080/api/budgetPeriod';
class BudgetPeriodService
{
    private static instance: BudgetPeriodService;

    public static getInstance() : BudgetPeriodService {
        if(!BudgetPeriodService.instance){
            BudgetPeriodService.instance = new BudgetPeriodService();
        }
        return BudgetPeriodService.instance;
    }

   async getDailyBudgetPeriodCategories(userId: number, date: string) : Promise<BudgetCategoryResponse>
   {
        try
        {
            const response = await axios.get(`${apiUrl}/budgetPeriod/daily`, {
                params: {
                    userId,
                    date
                }
            });
            return response.data;
        }catch(error){
            throw this.handleError(error);
        }
   }

   async getBudgetPeriodsByPeriod(userId: number,
                                  period: Period,
                                  startDate: string,
                                  endDate: string) : Promise<BudgetCategoryResponse>
   {
       try
       {
           const response = await axios.get(`${apiUrl}/budgetPeriod/period`, {
               params: {
                   userId,
                   period,
                   startDate,
                   endDate
               }
           });
           return response.data;
       }catch(error){
           throw this.handleError(error);
       }
   }

    private handleError(error: any): Error {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 400) {
                return new Error('Invalid request parameters');
            }
            if (error.response?.status === 500) {
                return new Error('Server error occurred');
            }
            return new Error(error.response?.data || 'An error occurred');
        }
        return new Error('An unexpected error occurred');
    }

}
export default BudgetPeriodService;