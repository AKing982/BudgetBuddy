import {Period} from "../config/Types";
import {BudgetGoal} from "./BudgetUtils";
import DateRange from "../domain/DateRange";

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

export enum BudgetMode
{
    CONTROLLED_SPENDING = "CONTROLLED_SPENDING",
    SAVINGS_PLAN = "SAVINGS_PLAN",
    DEBT_PAYOFF = "DEBT_PAYOFF",
    EMERGENCY_FUND = "EMERGENCY_FUND"
}

export interface Transaction {
    accountId: string;
    amount: number;  // BigDecimal in Java maps to number in TypeScript
    isoCurrencyCode: string;
    categories: string[];
    categoryId: string;
    date: string;    // LocalDate will come as string in JSON
    description: string;
    merchantName: string;
    name: string;
    pending: boolean;
    transactionId: string;
    authorizedDate: string | null;  // LocalDate, optional
    logoUrl: string | null;         // Optional
    posted: string | null;          // LocalDate, optional
}

export interface CSVTransaction {
    id: number;
    csvAcctId: number;
    transactionDate: string | null;
    transactionAmount: number;
    transactionDescription: string;
    extendedDescription: string;
    merchantName: string;
    category: string;
    balance: number;
    isSystemCategorized: boolean;
}

export interface UserLog
{
    id: number;
    userId: number;
    lastLogin?: string;
    lastLogout?: string;
    sessionDuration: number;
    loginAttempts: number;
    isActive: boolean;
}

export interface ManageBudgetsData
{
    id: number;
    budgetName: string;
    budgetDescription: string;
    userId: number;
    userFirstName: string;
    userLastName: string;
    monthlyIncome: number;
    yearlyIncome: number;
    savingsAmount: number;
    budgetPeriod: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'BIMONTHLY' | 'YEARLY';
    budgetMode: 'SAVINGS PLAN' | 'EMERGENCY FUND' | 'DEBT PAYOFF';
    budgetYear: number;
    savingsAllocation?: number;
}

export interface BudgetRegistration
{
    userId: number;
    budgetName: string;
    budgetDescription: string;
    budgetPeriod: Period;
    budgetMode: BudgetMode;
    budgetGoals: BudgetGoal;
    budgetYear: number;
    budgetStartDate: [number, number, number];
    budgetEndDate: [number, number, number];
    budgetDateRanges: DateRange[];
    totalIncomeAmount: number;
    numberOfMonths: number;
    totalBudgetsNeeded: number;
    previousIncomeAmount: number;
    previousBudgetName: string;
    previousBudgetSkipped: boolean;
}

// Interface for the budget data array

export interface DateRangeInput {
    startDate: [number, number, number];
    endDate: [number, number, number];
}

export interface BudgetStats {
    averageSpendingPerDay: number;
    budgetId: number;
    dateRange: DateRange;
    healthScore: number;
    monthlyProjection: number | null;
    remaining: number;
    totalBudget: number;
    totalSaved: number;
    totalSpent: number;
}

export interface IncomeCategory
{
    budgetedIncome: number;
    actualBudgetedIncome: number;
    remainingIncome: number;
    category: string;
    startMonth: number[];
    endMonth: number[];
    active: boolean;
}

interface ExpenseCategory
{
    budgetedExpenses: number;
    actualExpenses: number;
    remainingExpenses: number;
    category: string;
    startDate: number[];
    endDate: number[];
    active: boolean;
}

interface SavingsCategory
{
    budgetedSavingsTarget: number;
    actualSavedAmount: number;
    remainingToSave: number;
    categoryName: string;
    startDate: number[];
    endDate: number[];
    active: boolean;
}

export interface ProcessedStats {
    dateRange: DateRange;
    averageSpendingPerDay: number;
    budgetId: number;
    healthScore: number;
    monthlyProjection: number | null;
    remaining: number;
    totalBudget: number;
    totalSaved: number;
    totalSpent: number;
}

export interface InputStats {
    dateRange: {
        startDate: [number, number, number];
        endDate: [number, number, number];
    };
    averageSpendingPerDay: number;
    budgetId: number;
    healthScore: number;
    monthlyProjection: number | null;
    remaining: number;
    totalBudget: number;
    totalSaved: number;
    totalSpent: number;
}

export interface BudgetCategoryStats
{
    budgetPeriodCategories: BudgetPeriodCategory[];
    expenseCategories: ExpenseCategory;
    topExpenseCategories: ExpenseCategory[];
    savingsCategories: SavingsCategory;
    incomeCategories: IncomeCategory;
}

export interface SubBudget
{
    active: boolean;
    allocatedAmount: number;
    budget: Budget;
    budgetSchedule: BudgetSchedule[];
    budgetVariance: number;
    controlledBudgetCategory: null;
    endDate: [number, number, number];
    id: number;
    savingsRatio: number;
    spentOnBudget: number;
    startDate: [number, number, number];
    subBudgetName: string;
    subSavingsAmount: number;
    subSavingsTarget: number;
}

export interface BiWeekRange {
    biWeeksInRange: number;
    daysInRange: number;
    endDate: [number, number, number];
    monthsInRange: number;
    startDate: [number, number, number];
    weeksInRange: number;
    yearsInRange: number;
}


export interface BudgetPeriodCategory
{
    category: string;
    budgeted: number;
    actual: number;
    biWeekRanges?: BiWeekRange[];
    remaining: number;
    dateRange: DateRange;
    isOverBudget: boolean;
    spendingPercentage: number;
    budgetStatus: BudgetStatus;
}

// export interface DateRange {
//     startDate: number[];
//     endDate: number[];
//     // yearsInRange: number;
//     // monthsInRange: number;
//     // daysInRange: number;
//     // weeksInRange: number;     // Added missing property
//     // biWeeksInRange: number;   // Added missing property
// }
//

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
