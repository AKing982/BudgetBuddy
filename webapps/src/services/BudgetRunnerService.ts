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
    budgetPeriodCategories: BudgetPeriodCategory[];
    topExpenseCategories: any[];
    expenseCategories: any[];
    savingsCategories: any[];
    incomeCategories: any[];
    // ✅ Add missing budget schedule fields
    budgetSchedule?: BudgetSchedule;
    subBudget?: SubBudget;
}

export interface SubBudget {
    id: number;
    subBudgetName: string;
    allocatedAmount: number;
    subSavingsTarget: number;
    subSavingsAmount: number;
    spentOnBudget: number;
    budgetId: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface BudgetPeriodCategory
{
    category: string;
    budgeted: number;
    actual: number;
    remaining: number;
    dateRange: DateRange;
    isOverBudget: boolean;
    spendingPercentage: number;
    budgetStatus: BudgetStatus;
}

export interface DateRange {
    startDate: [number, number, number]; // ✅ [year, month, day]
    endDate: [number, number, number];   // ✅ [year, month, day]
    monthsInRange: number;
    yearsInRange: number;
    weeksInRange: number;
    biWeeksInRange: number;
    daysInRange: number;
}

export enum BudgetStatus {
    OVER_BUDGET = 0,
    NEAR_LIMIT = 1,
    WARNING = 2,
    UNDER_UTILIZED = 3,
    GOOD = 4
}


export interface BudgetSchedule {
    budgetScheduleId: number;
    startDate: string;
    endDate: string;
    period: string;
    totalPeriods: number;
    status: string;
    budgetScheduleRanges: BudgetScheduleRange[]; // ✅ Include budgetScheduleRanges
}

export interface BudgetScheduleRange {
    budgetScheduleId: number;
    startRange: string;
    endRange: string;
    budgetedAmount: number;
    spentOnRange: number;
    rangeType: string;
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