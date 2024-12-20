import axios, {AxiosInstance} from "axios";

interface ProcessingResponse {
    message: string;
    success: boolean;
    error?: string;
}

class TransactionCategoryRunnerService {
    private static instance: TransactionCategoryRunnerService;
    private static axios: AxiosInstance;

    constructor() {
        TransactionCategoryRunnerService.axios = axios.create({
            baseURL: 'http://localhost:8080/api/transaction-category-runner',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    public static getInstance(): TransactionCategoryRunnerService {
        if (!TransactionCategoryRunnerService.instance) {
            TransactionCategoryRunnerService.instance = new TransactionCategoryRunnerService();
        }
        return TransactionCategoryRunnerService.instance;
    }

    /**
     * Process transaction categories for a specific date range
     */
    public async processTransactionCategories(
        userId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ProcessingResponse> {
        try {
            const response = await TransactionCategoryRunnerService.axios.post<string>(
                '/process',
                null,
                {
                    params: {
                        userId,
                        startDate: this.formatDate(startDate),
                        endDate: this.formatDate(endDate)
                    }
                }
            );

            return {
                message: response.data,
                success: true
            };
        } catch (error) {
            console.error('Error processing transaction categories:', error);
            const errorMessage = this.handleError(error);
            return {
                message: 'Failed to process transaction categories',
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Process transaction categories for a specific month
     */
    public async processMonthlyTransactionCategories(
        userId: number,
        year?: number,
        month?: number
    ): Promise<ProcessingResponse> {
        try {
            const params: Record<string, number> = { userId };
            if (year) params.year = year;
            if (month) params.month = month;

            const response = await TransactionCategoryRunnerService.axios.post<string>(
                '/process/monthly',
                null,
                { params }
            );

            return {
                message: response.data,
                success: true
            };
        } catch (error) {
            console.error('Error processing monthly transaction categories:', error);
            const errorMessage = this.handleError(error);
            return {
                message: 'Failed to process monthly transaction categories',
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Process transaction categories for the current month
     */
    public async processCurrentMonthTransactionCategories(
        userId: number
    ): Promise<ProcessingResponse> {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            return await this.processTransactionCategories(
                userId,
                startOfMonth,
                endOfMonth
            );
        } catch (error) {
            console.error('Error processing current month transaction categories:', error);
            const errorMessage = this.handleError(error);
            return {
                message: 'Failed to process current month transaction categories',
                success: false,
                error: errorMessage
            };
        }
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private handleError(error: any): string {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                return `Server error: ${error.response.status} - ${error.response.data || 'Unknown error'}`;
            } else if (error.request) {
                return 'No response received from server';
            }
        }
        return 'An unexpected error occurred';
    }
}
export default TransactionCategoryRunnerService;