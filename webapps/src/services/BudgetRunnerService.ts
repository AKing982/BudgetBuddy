import axios, {AxiosInstance} from "axios";
import {apiUrl} from "../config/api";

export interface BudgetRunnerResult {
    budgetId: number;
    userId: number;
    budgetName: string;
    budgetDescription: string;
    startDate: string;
    endDate: string;
    processDate: string;
    processedAt: string;
    budgetAmount: number;
    actualAmount: number;
    remainingAmount: number;
    healthScore: number;
    dailyAverage: number;
    monthlyProjection: number;
    savingsAmount: number;
    isOverBudget: boolean;
    needsAttention: boolean;
    periodStats: any;
    budgetPeriodCategories: any[];
    topExpenseCategories: any[];
    expenseCategories: any[];
    savingsCategories: any[];
    incomeCategories: any[];
}


class BudgetRunnerService {
    private static instance: BudgetRunnerService;
    private static axios: AxiosInstance;

    constructor(){
        BudgetRunnerService.axios = axios.create({
            baseURL: 'http://localhost:8080/api/budgetRunner',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    public static getInstance() : BudgetRunnerService {
        if(!BudgetRunnerService.instance){
            BudgetRunnerService.instance = new BudgetRunnerService();
        }
        return BudgetRunnerService.instance;
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }


    private handleError(error: any): Error {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // Server responded with error
                return new Error(
                    `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`
                );
            } else if (error.request) {
                // Request made but no response
                return new Error('No response received from server');
            }
        }
        // Something else went wrong
        return new Error('An unexpected error occurred');
    }


    public static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Utility method to calculate percentage
    public static calculatePercentage(actual: number, total: number): number {
        if (total === 0) return 0;
        return (actual / total) * 100;
    }

    public async syncBudgetByMonth(userId: number, startDate: Date, endDate: Date): Promise<void> {
        try {
            const formattedStartDate = this.formatDate(startDate);
            const formattedEndDate = this.formatDate(endDate);

            await BudgetRunnerService.axios.get('/period', {
                params: {
                    userId,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate
                }
            });
        } catch (error) {
            console.error('Error syncing budget by month:', error);
            throw this.handleError(error);
        }
    }

    public async getBudgetsByDateRange(
        userId: number,
        startDate: Date,
        endDate: Date
    ): Promise<BudgetRunnerResult[]> {
        try {
            const formattedStartDate = this.formatDate(startDate);
            const formattedEndDate = this.formatDate(endDate);

            const response = await BudgetRunnerService.axios.get<BudgetRunnerResult[]>('/period', {  // Remove trailing slash
                params: {
                    userId,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error getting budgets by date range:', error);
            throw this.handleError(error);
        }
    }
}

export default BudgetRunnerService;