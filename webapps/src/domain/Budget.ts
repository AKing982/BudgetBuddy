class Budget {
    private budgetId: number;
    private budgetName: string;
    private budgetDescription: string;
    private budgetAmount: number;
    private budgetActual: number;
    private monthlyIncome: number;
    private startDate: Date;
    private endDate: Date;

    constructor(id: number, budgetName: string, budgetDescription: string, budgetAmount: number,
                budgetActual: number, monthlyIncome: number, startDate: Date, endDate: Date){
        this.budgetId = id;
        this.budgetName = budgetName;
        this.budgetDescription = budgetDescription;
        this.budgetAmount = budgetAmount;
        this.budgetActual = budgetActual;
        this.monthlyIncome = monthlyIncome;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    getBudgetActual(): number {
        return this.budgetActual;
    }

    getBudgetId(): number {
        return this.budgetId;
    }

    getBudgetName(): string {
        return this.budgetName;
    }

    getBudgetDescription(): string {
        return this.budgetDescription;
    }

    getBudgetAmount(): number {
        return this.budgetAmount;
    }

    getMonthlyIncome(): number {
        return this.monthlyIncome;
    }

    getStartDate(): Date {
        return this.startDate;
    }

    getEndDate(): Date {
        return this.endDate;
    }

    // Setter methods
    setBudgetId(id: number): void {
        this.budgetId = id;
    }

    setBudgetName(name: string): void {
        this.budgetName = name;
    }

    setBudgetDescription(description: string): void {
        this.budgetDescription = description;
    }

    setBudgetAmount(amount: number): void {
        this.budgetAmount = amount;
    }

    setMonthlyIncome(income: number): void {
        this.monthlyIncome = income;
    }

    setStartDate(date: Date): void {
        this.startDate = date;
    }

    setEndDate(date: Date): void {
        this.endDate = date;
    }


}