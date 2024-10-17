class EmergencyFund {

    private readonly _budgetId: number;
    private readonly _accountId: string;
    private readonly _fundAmount: number;
    private _currentBalance: number;
    private readonly _monthlyAllocation: number;
    private _lastUpdatedDate: Date;

    constructor(budgetId: number, accountId: string, fundAmount: number, balance: number, monthlyAllocation: number){
        this._budgetId = budgetId;
        this._accountId = accountId;
        this._fundAmount = fundAmount;
        this._currentBalance = balance;
        this._monthlyAllocation = monthlyAllocation;
        this._lastUpdatedDate = new Date();
    }

    get budgetId(): number { return this._budgetId; }
    get accountId(): string { return this._accountId; }
    get fundAmount(): number { return this._fundAmount; }
    get currentBalance(): number { return this._currentBalance; }
    get monthlyAllocation(): number { return this._monthlyAllocation; }
    get lastUpdatedDate(): Date { return this._lastUpdatedDate; }

    public addFunds(amount: number) : void {
        if(amount < 0) throw new Error("Amount must be positive");
        this._currentBalance += amount;
        this.updateLastUpdatedDate();
    }

    public withdrawFunds(amount: number) : void {
        if(amount < 0) throw new Error('Amount must be positive');
        if(amount > this.currentBalance) throw new Error('Insufficient Funds');
        this._currentBalance -= amount;
        this.updateLastUpdatedDate();
    }

    public isFundFull() : boolean {
        return this._currentBalance >= this.fundAmount;
    }

    private updateLastUpdatedDate(): void {
        this._lastUpdatedDate = new Date();
    }
}
export default EmergencyFund;