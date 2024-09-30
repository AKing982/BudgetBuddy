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
    private outflowingRecurringTransaction: RecurringTransaction[];
    private inflowingRecurringTransaction: RecurringTransaction[];

    constructor(outflowing: RecurringTransaction[], inflowing: RecurringTransaction[]){
        this.inflowingRecurringTransaction = inflowing;
        this.outflowingRecurringTransaction = outflowing;
    }

    public async fetchRecurringTransactionsForUser(userId: number) : Promise<RecurringTransactionMap>
    {
        return null;
    }

    public async fetchInflowingTransactions() : Promise<RecurringTransaction[]> {
        return null;
    }

    public async fetchOutflowingTransactions() : Promise<RecurringTransaction[]> {
        return null;
    }

    public async addRecurringTransactions() : Promise<void> {

    }

    public getPayrollIncome() : number {
        return 0;
    }

    public async refreshRecurringTransactionsForUser(userId: number) : Promise<RecurringTransactionMap> {
        return null;
    }

}