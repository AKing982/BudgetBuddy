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
}