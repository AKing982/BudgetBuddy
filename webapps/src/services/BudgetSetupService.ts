import axios, {AxiosInstance} from "axios";
import {BudgetMode, BudgetRegistration} from "../utils/Items";
import DateRange from "../domain/DateRange";


class BudgetSetupService {
    private static instance: BudgetSetupService;
    private static axios: AxiosInstance;

    constructor() {
        BudgetSetupService.axios = axios.create({
            baseURL: 'http://localhost:8080/api/budgetSetup/',
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

            console.log('Budget DateRanges: ', budgetRegistration.budgetDateRanges);
            // Ensure userId is set in the budgetRegistration
            const response = await BudgetSetupService.axios.post('/setup', transformedRegistration);
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

    public calculateExpectedSavingsDeadline(startDate: number, savingsTarget: number, monthlyAllocation: number, numberOfMonths: number) : number
    {
        return 0;
    }

    public calculateBudgetDateRanges(startDate: [number, number, number],
                                     endDate: [number, number, number]): DateRange[] {
        const dateRanges: DateRange[] = [];
        const year = startDate[0];  // Get the year from startDate

        // Always start from January (month 1)
        for (let month = 1; month <= 12; month++) {
            // Get the last day of the current month
            const lastDay = new Date(year, month, 0).getDate();

            const monthRange = new DateRange(
                new Date(year, month - 1, 1),    // Month is 0-based in Date constructor
                new Date(year, month - 1, lastDay)
            );

            dateRanges.push(monthRange);
        }

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