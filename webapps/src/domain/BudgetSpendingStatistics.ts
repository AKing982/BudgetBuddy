class BudgetSpendingStatistics
{
    private budgetAmount: number;
    private currentSpending: number;

    constructor(budgetAmount: number, currentSpending: number)
    {
        this.budgetAmount = budgetAmount;
        this.currentSpending = currentSpending;
    }

    public calculateAllowedSpendingForDate(date: string) : number
    {
        const targetDate = new Date(date);
        const numberOfDaysInMonth = this.getNumberOfDaysInMonth(targetDate.getMonth(),  targetDate.getFullYear());
        return this.budgetAmount / numberOfDaysInMonth;
    }

    public getNumberOfDaysInMonth(month: number, year: number) : number
    {
        return new Date(year, month + 1, 0).getDate();
    }

    public calculateAllowedSpendingForMonth(month: string) : number
    {
        const [year, monthNum] = month.split('-').map(num => parseInt(num));
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        return 0;
    }

    public calculateAllowedSpendingForWeek(weekStart: string, weekEnd: string) : number
    {
        return 0;
    }

    public getLeftOverSpendingForWeek(totalWeekSpending: number) : number
    {
        return 0;
    }
}