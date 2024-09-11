interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categoryName: string;
    categoryDescription: string;
    categoryId: string;
    date: Date | string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoUrl: string;
    authorizedDate: Date | string;
    transactionType: string;
}

class TransactionService {
    private static instance: TransactionService;

    private constructor(){

    }

    public static getInstance() : TransactionService {
        if(!TransactionService.instance){
            TransactionService.instance = new TransactionService();
        }
        return TransactionService.instance;
    }

    public async fetchTransactionsByUserId(userId: number) : Promise<Transaction[] | null>
    {
        if(userId < 1){
            throw new Error('Invalid userId. UserId must be a positive number.');
        }
        return null;
    }
}
export default TransactionService;