import axios from "axios";
import {apiUrl} from "../config/api";


interface RecurringTransactionsResponse {
    inflowStreams: any[];
    outflowStreams: any[];
    updatedDatetime: number;
    requestId: string;
}

interface AmountDTO {
    amount: number;
    currency: string;
}

interface RecurringTransactionDTO {
    userId: number;
    accountId: string;
    streamId: string;
    categoryId: string;
    description: string;
    merchantName: string;
    firstDate: any; // Ensure this is in the correct format for LocalDateArrayDeserializer
    lastDate: any; // Ensure this is in the correct format for LocalDateArrayDeserializer
    frequency: string;
    averageAmount: number;
    lastAmount: number;
    active: boolean;
    type: string;
}

interface RecurringTransactionRequest {
    outflowStreams: RecurringTransaction[];
    inflowStreams: RecurringTransaction[];
}

enum RecurringTransactionType {
    OUTFLOW_STREAM = "outflowStreams",
    INFLOW_STREAM = "inflowStreams"
}

interface RecurringTransaction {
    userId: number;
    accountId: string;
    streamId: string;
    categoryId: string;
    category: string[];
    transactionIds: string[];
    description: string;
    merchantName: string;
    firstDate: any;
    lastDate: any;
    frequency: string;
    averageAmount: number;
    lastAmount: number;
    active: boolean;
    type: string;
}

type RecurringTransactionMap = {
    outflowing: any[];
    inflowing: any[];
}

class RecurringTransactionService {
    private readonly outflowingRecurring: RecurringTransaction[];
    private readonly inflowingRecurring: RecurringTransaction[];

    constructor()
    constructor(inflowingTransactions: RecurringTransaction[], outflowingTransactions: RecurringTransaction[]);
    constructor(inflowingTransactions?: RecurringTransaction[], outflowingTransactions?: RecurringTransaction[]) {
        this.outflowingRecurring = inflowingTransactions || [];
        this.inflowingRecurring = outflowingTransactions || [];
    }

    private createRecurringTransactionRequest(outflowing: RecurringTransaction[], inflowing: RecurringTransaction[]) : RecurringTransactionRequest {
        return {
            outflowStreams: outflowing,
            inflowStreams: inflowing
        };
    }

    public getInflowingRecurringTransactions(): RecurringTransaction[] {
        return this.inflowingRecurring;
    }

    public getOutflowingRecurringTransactions() : RecurringTransaction[] {
        return this.outflowingRecurring;
    }

    private createRecurringTransactionMap(outflowing: any, inflowing: any) : RecurringTransactionMap {
        return {
            outflowing: outflowing,
            inflowing: inflowing
        }
    }

    public async fetchPlaidRecurringTransactions(userId: number) : Promise<RecurringTransactionMap> {
        if(userId < 1){
            throw new Error('Invalid UserId.');
        }

        try
        {
            const response = await axios.get<RecurringTransactionsResponse>(`${apiUrl}/api/plaid/users/${userId}/recurring-transactions`);
            console.log('Fetched Plaid Recurring Transactions: ', response.data);
            const {outflowStreams, inflowStreams} = response.data;
            return this.createRecurringTransactionMap(outflowStreams, inflowStreams);

        }catch(error){
            console.error('There was and error fetching Plaid Recurring Transactions: ', error);
            return {outflowing: [], inflowing: []};
        }
    }

    public async fetchRecurringTransactionsByDateRangeAndUser(userId: number, startDate: Date, endDate: Date): Promise<RecurringTransaction[]>{
        if(userId < 1){
            throw new Error("UserId is invalid.");
        }

        if(startDate === null || endDate === null){
            throw new Error("StartDate or EndDate is null");
        }
        try
        {
            const response = await axios.get(`${apiUrl}/recurring-transactions/${userId}/by-date-range`);
            return response.data;

        }catch(error){
            console.error('There was an error fetching recurring transactions from the server: ', error);
            return [];
        }
    }

    public async fetchRecurringTransactionsForUser(userId: number) : Promise<RecurringTransaction[]>
    {
        if(userId < 1){
            throw new Error("Userid is invalid.");
        }
        try
        {
            const response = await axios.get(`${apiUrl}/api/recurring-transactions/users/${userId}/recurring`);
            return response.data;

        }catch(error){
            console.error(`There was an error fetching recurring transactions for user: ${userId}: `, error);
            return [];
        }
    }

    private formatDate(date: string | null | Date): string | null | Date {
        if (!date) return null;
        try {
            const formattedDate = new Date(date).toISOString().split('T')[0];
            console.log('Formatted Date: ', formattedDate);
            return formattedDate;
        } catch (error) {
            console.warn(`Invalid date format: ${date}`);
            return null;
        }
    }

    // private formatDate(date: [number, number, number] | unknown): string {
    //     console.log('Formatting date:', date, 'Type:', typeof date);
    //
    //     if (Array.isArray(date) && date.length === 3) {
    //         const [year, month, day] = date;
    //         // Note: month is 0-indexed in JavaScript Date, so we subtract 1
    //         return new Date(year, month - 1, day).toISOString().split('T')[0];
    //     } else if (date instanceof Date) {
    //         return date.toISOString().split('T')[0];
    //     } else if (typeof date === 'string') {
    //         // Try to parse the string date
    //         const parsedDate = new Date(date);
    //         if (!isNaN(parsedDate.getTime())) {
    //             return parsedDate.toISOString().split('T')[0];
    //         }
    //         // If parsing fails, return the original string
    //         return date;
    //     } else if (typeof date === 'number') {
    //         // Assume it's a timestamp
    //         const dateObj = new Date(date);
    //         return dateObj.toISOString().split('T')[0];
    //     } else {
    //         console.error('Invalid date format:', date);
    //         return 'Invalid Date';
    //     }
    // }

    public transformPlaidToDTO(plaidTransaction: RecurringTransaction, userId: number): RecurringTransactionDTO {
        console.log('Transforming Plaid transaction:', plaidTransaction);

        const transactionType = this.determineTransactionType(plaidTransaction);

        try {
            const dto: RecurringTransactionDTO = {
                userId: userId,
                accountId: plaidTransaction.accountId,
                streamId: plaidTransaction.streamId,
                categoryId: plaidTransaction.categoryId,
                description: plaidTransaction.description,
                merchantName: plaidTransaction.merchantName || 'Unknown Merchant',
                firstDate: this.formatDate(plaidTransaction.firstDate),
                lastDate: this.formatDate(plaidTransaction.lastDate),
                frequency: plaidTransaction.frequency,
                averageAmount: plaidTransaction.averageAmount,
                    // currency: plaidTransaction.averageAmount.isoCurrency || 'USD
                lastAmount: plaidTransaction.lastAmount,
                    // currency: plaidTransaction.lastAmount.isoCurrency || 'USD,
                active: Boolean(plaidTransaction.active),
                type: transactionType
            };

            // Validate the DTO
            Object.entries(dto).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    console.warn(`Field ${key} is ${value} in DTO`);
                }
            });
            console.log('RecurringTransactionDTO: ', dto);
            return dto;
        } catch (error) {
            console.error('Error in transformPlaidToDTO:', error);
            console.error('Problematic transaction:', plaidTransaction);
            throw error;
        }
    }

    private determineTransactionType(plaidTransaction: RecurringTransaction): string {
        // You'll need to determine how to distinguish between outflow and inflow
        // This might be based on the transaction amount, a specific field from Plaid, or some other logic
        // For this example, I'm assuming transactions with negative amounts are outflows
        if (Number(plaidTransaction.averageAmount) < 0) {
            return "OUTFLOW_STREAM";
        } else {
            return "INFLOW_STREAM";
        }
    }

    public async addRecurringTransactions() : Promise<RecurringTransactionDTO[]> {
        // Fetch Recurring transactions from plaid
        const userId = Number(sessionStorage.getItem('userId'));
        const recurringTransactionsPlaid : RecurringTransactionMap = await this.fetchPlaidRecurringTransactions(userId);
        console.log('Recurring Transactions Plaid Inflow: ', recurringTransactionsPlaid.inflowing);
        console.log('Recurring Transactions Plaid Outflow: ', recurringTransactionsPlaid.outflowing);
        // Call the addRecurringTransaction endpoint
        try
        {

            const outflowStreams = recurringTransactionsPlaid.outflowing
                .filter((transaction): transaction is RecurringTransaction =>
                    typeof transaction === 'object' && transaction !== null)
                .map(transaction => {
                    try {
                        return this.transformPlaidToDTO(transaction, userId);
                    } catch (error) {
                        console.error('Error transforming outflow transaction:', error, transaction);
                        return null;
                    }
                })
                .filter((dto): dto is RecurringTransactionDTO => dto !== null);

            const inflowStreams = recurringTransactionsPlaid.inflowing
                .filter((transaction): transaction is RecurringTransaction =>
                    typeof transaction === 'object' && transaction !== null)
                .map(transaction => {
                    try {
                        return this.transformPlaidToDTO(transaction, userId);
                    } catch (error) {
                        console.error('Error transforming inflow transaction:', error, transaction);
                        return null;
                    }
                })
                .filter((dto): dto is RecurringTransactionDTO => dto !== null);

            console.log('InflowStreams: ', inflowStreams);

            const payload = {
                outflowStreams,
                inflowStreams
            }

            console.log('Request payload:', JSON.stringify(payload, null, 2));

            const response = await axios.post(`${apiUrl}/api/recurring-transactions/`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Recurring Transactions Response: ', response.data);
            return response.data;

        }catch(error){
            console.error('There was an error adding the recurring transactions to the server: ', error);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                console.error('Response headers:', error.response.headers);
            }
            return [];
        }
    }

    public getPayrollIncome() : number {
        return 0;
    }

    public getAverageAmount() : number | null {
        return null;
    }

    public async refreshRecurringTransactionsForUser(userId: number) : Promise<null> {
        return null;
    }

}
export default RecurringTransactionService;