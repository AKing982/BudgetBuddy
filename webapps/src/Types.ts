// ── types.ts ──────────────────────────────────────────────────────────────────
// Page-level models for Layout C. Buckets live in page state only for now (no backend yet).

export interface BucketItem {
    id: string;
    name: string;
    amount: number;
    purchased: boolean;
}

export interface SpendingBucket {
    weekKey: string;        // yyyy-mm-dd of the week's first day
    limitAmount: number;
    items: BucketItem[];
}

export type BucketItemPatch = Partial<Pick<BucketItem, 'name' | 'amount' | 'purchased'>>;

/** A recurring category from BudgetRunnerService's budgetPeriodCategories (isRecurring = true). */
export interface RecurringCategory {
    name: string;
    budgeted: number;
    actual: number;
    remaining: number;
}

/** A payment to a recurring category, found in the spending-by-date data. */
export interface RecurringPayment {
    category: string;
    amount: number;
    date: Date;
}