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


}