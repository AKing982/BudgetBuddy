class DebtItem {
    private _type: string;
    private _amount: number;
    private _allocation: number;
    private _targetDate: Date;

    constructor(type: string, amount: number, allocation: number, targetDate: Date){
        this._type = type;
        this._amount = amount;
        this._allocation = allocation;
        this._targetDate = targetDate;
    }
}