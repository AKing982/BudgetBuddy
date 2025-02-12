export interface Budget {
    id: number;
    userId: number;
    budgetName: string;
    budgetDescription: string;
    budgetAmount: number;
    actual: number;
    budgetMode: string;
    budgetPeriod: string;
    createdDate: string | null;
    startDate: [number, number, number];
    endDate: [number, number, number];
    income?: number | null;
    savingsAmountAllocated?: number | null;
    savingsProgress?: number | null;
    subBudgets: SubBudget[];
    totalMonthsToSave: number;
}

export interface BudgetStats {
    budgetId: number;
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    totalSaved: number | null;
    averageSpendingPerDay?: number;
    healthScore?: number;
    monthlyProjection?: number;
    dateRange: DateRange;
}

export interface BudgetCategoryStats
{
    budgetPeriodCategories: BudgetPeriodCategory[];
    expenseCategories: any[];
    topExpenseCategories: any[];
    savingsCategories: any[];
    incomeCategories: any[];
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
