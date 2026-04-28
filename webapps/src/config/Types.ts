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

export interface StoresWithTotal {
    storeName: string;
    totalSpent: number;
    items: GroceryItem[];
}

export interface SectionWithDetails {
    name: string;
    budgetAmount: number;
    items: GroceryItem[];
    actual: number;
    remaining: number;
    percentUsed: number;
}

export type GroceryBudgetWithTotals = Required<Omit<GroceryBudget, 'stores'>> & {
    totalSpent: number;
    stores: StoresWithTotal[];
};

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

// Replace with this:
export enum BPTemplateType {
    MONTHLY_STD                  = "MONTHLY_STD",
    BIWEEKLY_STD                 = "BIWEEKLY_STD",
    WEEKLY_STD                   = "WEEKLY_STD",
    TWO_MONTHLY_STD              = "TWO_MONTHLY_STD",
    THREE_MONTHLY_STD            = "THREE_MONTHLY_STD",
    BIWEEKLY_PAYCHECK            = "BIWEEKLY_PAYCHECK",
    MONTHLY_PAYCHECK             = "MONTHLY_PAYCHECK",
    TWO_MONTHLY_PAYCHECK         = "TWO_MONTHLY_PAYCHECK",
    THREE_MONTHLY_PAYCHECK       = "THREE_MONTHLY_PAYCHECK",
    FIFTY_THIRTY_TWENTY_MONTHLY  = "FIFTY_THIRTY_TWENTY_MONTHLY",
    FIFTY_THIRTY_TWENTY_BIWEEKLY = "FIFTY_THIRTY_TWENTY_BIWEEKLY",
    MONTHLY_BALANCE_SHEET        = "MONTHLY_BALANCE_SHEET",
    BASIC_ESSENTIALS             = "BASIC_ESSENTIALS",
}

export interface DateRange {
    startDate: string; // ISO-8601, e.g. "2024-01-01"
    endDate: string;
}

export enum Period {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    BIWEEKLY = "BIWEEKLY",
    QUARTERLY = "QUARTERLY",
    SEMIANNUAL = "SEMIANNUAL",
    BIMONTHLY = "BIMONTHLY",
    ANNUAL = "ANNUAL",
    INCOME = "INCOME",
}


export enum BPType {
    INCOME  = "INCOME",
    EXPENSE = "EXPENSE",
    BALANCE = "BALANCE",
}

export enum BPLayoutType {
    CLASSIC = "CLASSIC",
    VISUAL  = "VISUAL",
    MIX     = "MIX",
}

export enum GoalStatus {
    ON_TRACK  = "ON_TRACK",
    AT_RISK   = "AT_RISK",
    EXCEEDED  = "EXCEEDED",
    MET       = "MET",
    NOT_STARTED = "NOT_STARTED",
}

export interface BudgetPlannerRequest {
    userId:               number;
    dateRanges:           DateRange[];
    templateType:         BPTemplateType;
    period:               Period;
    isCustom?:            boolean;
    requireHeaders?:      boolean;
    categoryHeaders?:     string[];
    categoryAllocations?: CategoryAllocation[];
    incomeCriteria?:      BPIncomeCriteria;
    startDay?: number;
}

export interface CategoryAllocation {
    category: string;
    amount:   number;
}

export interface BPIncomeCriteria {
    incomeAmount:    number;
    incomeFrequency: Period;
    startDate:       string;
    endDate:         string;
}

export interface BPGridCell {
    columnIndex: number;
    dateRange:   DateRange;
    actual:      number | null;
    planned:     number | null;
    budgeted:    number | null;
    isBalance:   boolean;
    isEditable:  boolean;
}

export interface BPGridRow {
    category: string;
    type:     BPType;
    cells:    BPGridCell[];
}

export interface BPColumn {
    columnIndex: number;
    dateRange:   DateRange;
    period:      Period;
    columnType:  string;
    isHeader:    boolean;
}

export interface BPLayoutGrid {
    columns: BPColumn[];
    rows:    BPGridRow[];
}

export interface BPGoalsDetail {
    id:                    number;
    bp_template_id:        number;
    subBudgetGoals_id:     number;
    bpGoalsName:           string;
    totalAllocatedAmount:  number;
    totalSpent:            number;
    monthGoalAmount:       number;
    goalType:              string;
    goalStatus:            GoalStatus;
    savingsPercent:        number;
    overBudgetPercentage:  number;
}

export interface BPTemplateDetail {
    id:          number;
    templateId:  number;
    layoutGrid:  BPLayoutGrid;
    layoutType:  BPLayoutType;
    lastUpdated: string;
    createdAt:   string;
}


// Shape returned by the controller – extend as needed once you know the full model
export interface BPTemplate {
    id:               number;
    templateType:     BPTemplateType;
    period:           Period;
    bpGoalsDetail:    BPGoalsDetail  | null;
    bpTemplateDetail: BPTemplateDetail | null;
    active:           boolean;
    isSaved:          boolean;
}

// export interface BudgetPeriodCategory {
//     categoryName: string;
//     budgetedAmount: number;
//     actualAmount: number;
//     dateRange: DateRange;
//     budgetStatus: BudgetStatus;
// }