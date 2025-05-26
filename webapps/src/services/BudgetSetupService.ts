import axios, {AxiosInstance} from "axios";
import {BudgetMode, BudgetRegistration} from "../utils/Items";
import DateRange from "../domain/DateRange";
import {apiUrl} from "../config/api";


class BudgetSetupService {
    private static instance: BudgetSetupService;
    private static axios: AxiosInstance;

    constructor() {
        // const baseURL = process.env.NODE_ENV === 'production'
        //     ? 'http://localhost:8080/api/budgetSetup/'
        //     : '/api/budgetSetup/';
        BudgetSetupService.axios = axios.create({
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    public static getInstance(): BudgetSetupService {
        if (!BudgetSetupService.instance) {
            BudgetSetupService.instance = new BudgetSetupService();
        }
        return BudgetSetupService.instance;
    }

    public async startBudgetSetupProcess(budgetRegistration: BudgetRegistration): Promise<boolean> {
        let userId = budgetRegistration.userId;

        try {

            const transformedRegistration = {
                ...budgetRegistration,
                budgetDateRanges: budgetRegistration.budgetDateRanges.map(dateRange => ({
                    startDate: dateRange.startDate.toISOString().split('T')[0],
                    endDate: dateRange.endDate.toISOString().split('T')[0]
                }))
            };
            // Log the exact data being sent
            console.log('Sending budget setup request with payload:', JSON.stringify(transformedRegistration, null, 2));

            console.log('Budget DateRanges: ', budgetRegistration.budgetDateRanges);
            // Ensure userId is set in the budgetRegistration
            const response = await BudgetSetupService.axios.post(`${apiUrl}/budgetSetup/setup`, transformedRegistration);
            if (response.status === 200) {
                console.log(`Budget setup completed successfully for user ${userId}`);
                return true;
            } else {
                console.error(`Budget setup failed for user ${userId}. Status: ${response.status}`);
                return false;
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Budget setup request failed for user ${userId}:`, error.response?.data || error.message);
                throw new Error(`Budget setup failed: ${error.response?.data || error.message}`);
            } else {
                console.error(`Unexpected error during budget setup for user ${userId}:`, error);
                throw new Error('An unexpected error occurred during budget setup');
            }
        }
    }

    public calculateMonthlyAllocationNeeded(
        startDate: number,
        targetDate: number,
        savingsTarget: number,
        currentSavings: number = 0
    ): number {
        // Validate inputs
        if (savingsTarget < 0 || currentSavings < 0) {
            throw new Error("Savings target and current savings must be non-negative");
        }
        if (startDate >= targetDate) {
            throw new Error("Target date must be after start date");
        }

        // Convert timestamps to Date objects
        const start = new Date(startDate);
        const target = new Date(targetDate);

        // Calculate number of months between dates
        const monthsDiff = (target.getFullYear() - start.getFullYear()) * 12 +
            (target.getMonth() - start.getMonth());

        // If no months remain, return infinity or throw an error based on your needs
        if (monthsDiff <= 0) {
            throw new Error("No full months available between start and target dates");
        }

        // Calculate remaining amount to save
        const remainingAmount = savingsTarget - currentSavings;

        // If target is already met or exceeded
        if (remainingAmount <= 0) {
            return 0;
        }

        // Calculate monthly allocation (round to 2 decimal places)
        const monthlyAllocation = remainingAmount / monthsDiff;
        return Number(monthlyAllocation.toFixed(2));
    }

    public getBudgetModeByBudgetType(budgetType: string): BudgetMode {
        switch (budgetType) {
            case 'Saving for a goal':
                return BudgetMode.SAVINGS_PLAN
            case 'Paying off debt':
                return BudgetMode.DEBT_PAYOFF
            case 'Controlling spending':
                return BudgetMode.CONTROLLED_SPENDING
            case 'Building Emergency Fund':
                return BudgetMode.EMERGENCY_FUND
            default:
                throw new Error("Budget Type is invalid");
        }
    }

    public calculateExpectedSavingsDeadline(startDate: number, savingsTarget: number, monthlyAllocation: number, currentSavings: number) : number
    {
        if(monthlyAllocation <= 0 || savingsTarget < 0 || currentSavings < 0){
            throw new Error("Invalid input parameters");
        }
        const remainingAmount = savingsTarget - currentSavings;
        if(remainingAmount <= 0){
            return startDate;
        }
        const monthsNeeded = Math.ceil(remainingAmount / monthlyAllocation);
        const start = new Date(startDate);
        const deadline = new Date(start);
        deadline.setMonth(start.getMonth() + monthsNeeded);
        return deadline.getTime();
    }

    public calculateBudgetDateRanges(startDate: [number, number, number], endDate: [number, number, number]): DateRange[] {
        const dateRanges: DateRange[] = [];
        const year = startDate[0];

        for (let month = 1; month <= 12; month++) {
            const lastDay = new Date(year, month, 0).getDate();
            const monthRange = new DateRange(
                new Date(year, month - 1, 1),
                new Date(year, month - 1, lastDay)
            );
            dateRanges.push(monthRange);
        }

        // Sort by start date
        dateRanges.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        return dateRanges;
    }

    public calculateTotalDateRange(startDate: [number, number, number],
                                   endDate: [number, number, number]): DateRange {
        return new DateRange(
            new Date(startDate[0], startDate[1] - 1, startDate[2]),  // Month is 0-based
            new Date(endDate[0], endDate[1] - 1, endDate[2])
        );
    }

    public calculateNumberOfMonths(startDate: [number, number, number],
                                   endDate: [number, number, number]): number
    {
        const startYear = startDate[0];
        const startMonth = startDate[1];
        const endYear = endDate[0];
        const endMonth = endDate[1];

        return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    }
}

export default BudgetSetupService;