interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    date: Date | string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoUrl: string;
    authorizedDate: Date | string;
    transactionType: string;
}