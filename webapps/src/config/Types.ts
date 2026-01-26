import {BudgetPeriodCategory, BudgetStatus} from "../utils/Items";

interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    posted: Date | string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoURL?: string;
    authorizedDate: Date | string;
    transactionType: string;
}

export enum Period {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    BIWEEKLY = 'BIWEEKLY',
    QUARTERLY = 'QUARTERLY',
    SEMIANNUAL = 'SEMIANNUAL',
    BIMONTHLY = 'BIMONTHLY',
    ANNUAL = 'ANNUAL'
}

export interface GroceryBudget {
    id?: number;
    name: string;
    budgetAmount: number;
    startDate: string;
    endDate: string;
    subBudgetId: number;
    savingsGoal: number;
    stores: StoreItemList[];
    sections: GroceryBudgetSection[];
    plannedItems: Array<{
        itemName: string;
        estimatedCost: number;
    }>;
}

export interface GroceryPurchase {
    id?: number;
    subBudgetId: number;
    items: GroceryItem[];
    receiptImageUrl?: string;
    totalAmount: number;
    purchaseDate: string;
    storeName: string;
}

export interface BudgetComparison {
    budget1: {
        id: string;
        totalSpent: number;
        savingsPercentage: number;
    };
    budget2: {
        id: string;
        totalSpent: number;
        savingsPercentage: number;
    };
    spendingDifference: number;
    savingsDifference: number;
}

export interface GroceryItem {
    id?: number;
    itemName: string;
    itemCost: number;
    itemDescription?: string;
    storeName: string;
    datePurchased: string;
    category?: string;
    quantity?: number;
}

export interface StoreItemList {
    storeName: string;
    items: GroceryItem[];
}


export interface GroceryBudgetSection {
    id?: number;
    name: string;
    budgetAmount: number;
    items: GroceryItem[];
}


export interface BudgetStatistics {
    totalSpent: number;
    remainingBudget: number;
    savingsGoalAchieved: boolean;
    savingsAmount: number;
    mostPurchasedItem: string;
    topFiveItems: Array<{ name: string; count: number }>;
    healthScore: number;
}

export interface SpendingInsight {
    category: string;
    currentSpending: number;
    averageSpending: number;
    suggestion: 'overspending' | 'underspending' | 'on-track';
    message: string;
}

export type BudgetPeriod = 'week' | 'biweekly' | 'month' | 'day';

export interface BudgetCategoryResponse {
    budgetPeriodCategories: BudgetPeriodCategory[];
}

// export interface BudgetPeriodCategory {
//     categoryName: string;
//     budgetedAmount: number;
//     actualAmount: number;
//     dateRange: DateRange;
//     budgetStatus: BudgetStatus;
// }