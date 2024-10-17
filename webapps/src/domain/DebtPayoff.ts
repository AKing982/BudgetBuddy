export class DebtPayoff{
    private _debts: DebtItem[];
    private _otherDebtType: string;
    private _otherDebtAmount: number;
    private _otherDebtAllocation: number;
    private _otherDebtTargetDate: Date;

    constructor(
        debts: DebtItem[],
        otherDebtType: string,
        otherDebtAmount: number,
        otherDebtAllocation: number,
        otherDebtTargetDate: Date
    ) {
        this._debts = debts;
        this._otherDebtType = otherDebtType;
        this._otherDebtAmount = otherDebtAmount;
        this._otherDebtAllocation = otherDebtAllocation;
        this._otherDebtTargetDate = otherDebtTargetDate;
    }

    // Getters
    get debts(): DebtItem[] {
        return this._debts;
    }

    get otherDebtType(): string {
        return this._otherDebtType;
    }

    get otherDebtAmount(): number {
        return this._otherDebtAmount;
    }

    get otherDebtAllocation(): number {
        return this._otherDebtAllocation;
    }

    get otherDebtTargetDate(): Date {
        return this._otherDebtTargetDate;
    }

    // Setters
    set debts(value: DebtItem[]) {
        this._debts = value;
    }

    set otherDebtType(value: string) {
        this._otherDebtType = value;
    }

    set otherDebtAmount(value: number) {
        this._otherDebtAmount = value;
    }

    set otherDebtAllocation(value: number) {
        this._otherDebtAllocation = value;
    }

    set otherDebtTargetDate(value: Date) {
        this._otherDebtTargetDate = value;
    }

    // Method to add a new debt item
    addDebtItem(debtItem: DebtItem): void {
        this._debts.push(debtItem);
    }

    // Method to remove a debt item
    removeDebtItem(debtItemId: string): void {
        this._debts = this._debts.filter(debt => debt.id !== debtItemId);
    }

    // Method to calculate total debt
    calculateTotalDebt(): number {
        const debtItemsTotal = this._debts.reduce((total, debt) => total + debt.amount, 0);
        return debtItemsTotal + this._otherDebtAmount;
    }

    // Method to calculate total monthly allocation
    calculateTotalMonthlyAllocation(): number {
        const debtItemsAllocation = this._debts.reduce((total, debt) => total + debt.monthlyAllocation, 0);
        return debtItemsAllocation + this._otherDebtAllocation;
    }

    // Method to estimate payoff date for other debt
    estimateOtherDebtPayoffDate(): Date {
        if (this._otherDebtAllocation <= 0) {
            throw new Error("Monthly allocation must be greater than zero to estimate payoff date.");
        }
        const monthsToPayoff = this._otherDebtAmount / this._otherDebtAllocation;
        const estimatedPayoffDate = new Date();
        estimatedPayoffDate.setMonth(estimatedPayoffDate.getMonth() + Math.ceil(monthsToPayoff));
        return estimatedPayoffDate;
    }

    // Method to check if on track for other debt target date
    isOtherDebtOnTrack(): boolean {
        const estimatedPayoffDate = this.estimateOtherDebtPayoffDate();
        return estimatedPayoffDate <= this._otherDebtTargetDate;
    }
}