class BudgetCategory {
    private _id: number;
    private _budgetId: number;
    private _categoryName: string;
    private _allocatedAmount: number;
    private _monthlySpendingLimit: number;
    private _currentSpending: number;
    private _isFixedExpense: boolean;
    private _isActive: boolean;
    private _priority: number;

    constructor(id: number, budgetId: number, categoryName: string, allocatedAmount: number,
                monthlySpendingLimit: number, currentSpending: number, isFixedExpense: boolean,
                isActive: boolean, priority: number){
        this._id = id;
        this._budgetId = budgetId;
        this._categoryName = categoryName;
        this._allocatedAmount = allocatedAmount;
        this._monthlySpendingLimit = monthlySpendingLimit;
        this._currentSpending = currentSpending;
        this._isFixedExpense = isFixedExpense;
        this._isActive = isActive;
        this._priority = priority;
    }

    // Getters
    get id(): number {
        return this._id;
    }

    get budgetId(): number {
        return this._budgetId;
    }

    get categoryName(): string {
        return this._categoryName;
    }

    get allocatedAmount(): number {
        return this._allocatedAmount;
    }

    get monthlySpendingLimit(): number {
        return this._monthlySpendingLimit;
    }

    get currentSpending(): number {
        return this._currentSpending;
    }

    get isFixedExpense(): boolean {
        return this._isFixedExpense;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get priority(): number {
        return this._priority;
    }

    // Setters
    set id(value: number) {
        this._id = value;
    }

    set budgetId(value: number) {
        this._budgetId = value;
    }

    set categoryName(value: string) {
        this._categoryName = value;
    }

    set allocatedAmount(value: number) {
        this._allocatedAmount = value;
    }

    set monthlySpendingLimit(value: number) {
        this._monthlySpendingLimit = value;
    }

    set currentSpending(value: number) {
        this._currentSpending = value;
    }

    set isFixedExpense(value: boolean) {
        this._isFixedExpense = value;
    }

    set isActive(value: boolean) {
        this._isActive = value;
    }

    set priority(value: number) {
        this._priority = value;
    }

    // Additional methods
    addSpending(amount: number): void {
        this._currentSpending += amount;
    }

    resetCurrentSpending(): void {
        this._currentSpending = 0;
    }

    getRemainingBudget(): number {
        return this._monthlySpendingLimit - this._currentSpending;
    }

    isOverBudget(): boolean {
        return this._currentSpending > this._monthlySpendingLimit;
    }

    getSpendingPercentage(): number {
        return (this._currentSpending / this._monthlySpendingLimit) * 100;
    }

    toggleActive(): void {
        this._isActive = !this._isActive;
    }
}