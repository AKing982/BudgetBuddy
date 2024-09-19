interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    posted: Date | string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoURL?: string;
    authorizedDate: Date | string;
    transactionType: string;
}