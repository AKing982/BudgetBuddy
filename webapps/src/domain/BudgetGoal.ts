// class BudgetGoal {
//     private id: number;
//     private budgetId: number;
//     private goalName: string;
//     private goalDescription: string;
//     private goalType: string;
//     private targetAmount: number;
//     private monthlyAllocation: number;
//     private currentSavings: number;
//     private savingsFrequency: string;
//     private status: string;
//
//     constructor(
//         id: number,
//         budgetId: number,
//         goalName: string,
//         goalDescription: string,
//         goalType: string,
//         targetAmount: number,
//         monthlyAllocation: number,
//         currentSavings: number,
//         savingsFrequency: string,
//         status: string
//     ) {
//         this.id = id;
//         this.budgetId = budgetId;
//         this.goalName = goalName;
//         this.goalDescription = goalDescription;
//         this.goalType = goalType;
//         this.targetAmount = targetAmount;
//         this.monthlyAllocation = monthlyAllocation;
//         this.currentSavings = currentSavings;
//         this.savingsFrequency = savingsFrequency;
//         this.status = status;
//     }
//
//     // Getter methods
//     getId(): number {
//         return this.id;
//     }
//
//     getBudgetId(): number {
//         return this.budgetId;
//     }
//
//     getGoalName(): string {
//         return this.goalName;
//     }
//
//     getGoalDescription(): string {
//         return this.goalDescription;
//     }
//
//     getGoalType(): string {
//         return this.goalType;
//     }
//
//     getTargetAmount(): number {
//         return this.targetAmount;
//     }
//
//     getMonthlyAllocation(): number {
//         return this.monthlyAllocation;
//     }
//
//     getCurrentSavings(): number {
//         return this.currentSavings;
//     }
//
//     getSavingsFrequency(): string {
//         return this.savingsFrequency;
//     }
//
//     getStatus(): string {
//         return this.status;
//     }
//
//     // Setter methods
//     setId(id: number): void {
//         this.id = id;
//     }
//
//     setBudgetId(budgetId: number): void {
//         this.budgetId = budgetId;
//     }
//
//     setGoalName(goalName: string): void {
//         this.goalName = goalName;
//     }
//
//     setGoalDescription(goalDescription: string): void {
//         this.goalDescription = goalDescription;
//     }
//
//     setGoalType(goalType: string): void {
//         this.goalType = goalType;
//     }
//
//     setTargetAmount(targetAmount: number): void {
//         this.targetAmount = targetAmount;
//     }
//
//     setMonthlyAllocation(monthlyAllocation: number): void {
//         this.monthlyAllocation = monthlyAllocation;
//     }
//
//     setCurrentSavings(currentSavings: number): void {
//         this.currentSavings = currentSavings;
//     }
//
//     setSavingsFrequency(savingsFrequency: string): void {
//         this.savingsFrequency = savingsFrequency;
//     }
//
//     setStatus(status: string): void {
//         this.status = status;
//     }
//
//     // Method to calculate progress towards the goal
//     calculateProgress(): number {
//         return (this.currentSavings / this.targetAmount) * 100;
//     }
//
//     // Method to update current savings
//     updateSavings(amount: number): void {
//         this.currentSavings += amount;
//         this.updateStatus();
//     }
//
//     // Method to update status based on current savings
//     private updateStatus(): void {
//         const progress = this.calculateProgress();
//         if (progress >= 100) {
//             this.status = 'Completed';
//         } else if (progress > 0) {
//             this.status = 'In Progress';
//         } else {
//             this.status = 'Not Started';
//         }
//     }
// }