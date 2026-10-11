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

/** Spending in a recurring category during one week (from the week's budgetPeriodCategories). */
export interface RecurringPayment {
    category: string;
    amount: number;
    date?: Date;
}

export interface BudgetScheduleRange {
    id: number | null;
    budgetScheduleId: number;
    spentOnRange: number;     // BigDecimal
    budgetedAmount: number;   // BigDecimal
    rangeType: string;        // "Week"
    active: boolean;          // isActive → "active" in JSON
    startRange: string;       // LocalDate "2026-08-01"
    endRange: string;         // LocalDate "2026-08-07"
    singleDate: boolean;      // isSingleDate → "singleDate"
}