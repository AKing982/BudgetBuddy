interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    categoryId: string;
    date: Date;
    name: string;
    merchantName: string;
    pending: boolean;
    logoUrl: string;
    authorizedDate: Date;
    transactionType: string;
}