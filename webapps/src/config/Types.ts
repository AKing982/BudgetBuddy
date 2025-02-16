import {BudgetPeriodCategory, BudgetStatus, DateRange} from "../utils/Items";

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