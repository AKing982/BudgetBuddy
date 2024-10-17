class SavingsGoalData {
    private _goalName: string;
    private _goalDescription: string;
    private _targetAmount: number;
    private _currentSavings: number;
    private _savingsFrequency: 'weekly' | 'monthly' | 'yearly';
    private _targetDate: string;

    constructor(goalName: string, goalDescription: string, targetAmount: number, currentSavings: number, savingsFrequency: 'weekly' | 'monthly' | 'yearly',
                targetDate: string){
        this._goalName = goalName;
        this._goalDescription = goalDescription;
        this._targetAmount = targetAmount;
        this._currentSavings = currentSavings;
        this._savingsFrequency = savingsFrequency;
        this._targetDate = targetDate;
    }

    // Getters
    get goalName(): string {
        return this._goalName;
    }

    get goalDescription(): string {
        return this._goalDescription;
    }

    get targetAmount(): number {
        return this._targetAmount;
    }

    get currentSavings(): number {
        return this._currentSavings;
    }

    get savingsFrequency(): 'weekly' | 'monthly' | 'yearly' {
        return this._savingsFrequency;
    }

    get targetDate(): string {
        return this._targetDate;
    }

    // Setters
    set goalName(value: string) {
        this._goalName = value;
    }

    set goalDescription(value: string) {
        this._goalDescription = value;
    }

    set targetAmount(value: number) {
        this._targetAmount = value;
    }

    set currentSavings(value: number) {
        this._currentSavings = value;
    }

    set savingsFrequency(value: 'weekly' | 'monthly' | 'yearly') {
        this._savingsFrequency = value;
    }

    set targetDate(value: string) {
        this._targetDate = value;
    }

}