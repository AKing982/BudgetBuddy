import axios from "axios";
import {apiUrl} from "../config/api";

interface TransactionStream {
    accountId: string;
    streamId: string;
    category: string[];
    categoryId: string;
    description: string;
    merchantName: string;
    firstDate: Date;
    lastDate: Date;
    frequency: string;
    transactionIds: string[];

}

interface RecurringTransactionRequest {
    outflowStreams: RecurringTransaction[];
    inflowStreams: RecurringTransaction[];
}

interface RecurringTransaction {
    userId: number;
    accountId: string;
    streamId: string;
    categoryId: string;
    description: string;
    merchantName: string;
    firstDate: Date;
    lastDate: Date;
    frequency: string;
    averageAmount: number;
    lastAmount: number;
    active: boolean;
    type: string;
}

type RecurringTransactionMap = {
    outflowing: RecurringTransaction[],
    inflowing: RecurringTransaction[]
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
            const response = await axios.get(`${apiUrl}/api/plaid/users/${userId}/recurring-transactions`);
            const {inflowingStreams, outflowingStreams} = response.data;
            return this.createRecurringTransactionMap(outflowingStreams, inflowingStreams);

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

    public async addRecurringTransactions() : Promise<RecurringTransaction[]> {
        // Fetch Recurring transactions from plaid
        const userId = Number(sessionStorage.getItem('userId'));
        const recurringTransactionsPlaid : RecurringTransactionMap = await this.fetchPlaidRecurringTransactions(userId);

        // Create the RecurringTransactionRequest
        let outflowStream = recurringTransactionsPlaid.outflowing;
        let inflowStream = recurringTransactionsPlaid.inflowing;

        let recurringTransactionMap = this.createRecurringTransactionRequest(outflowStream, inflowStream);

        // Call the addRecurringTransaction endpoint
        try
        {
            const outflowStreamsFromMap = recurringTransactionMap.outflowStreams;
            const inflowStreamsFromMap = recurringTransactionMap.inflowStreams;

            return axios.post(`${apiUrl}/api/recurring-transactions/`, {
                outflowStreams: outflowStreamsFromMap,
                inflowStreams: inflowStreamsFromMap
            });

        }catch(error){
            console.error('There was an error adding the recurring transactions to the server: ', error);
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