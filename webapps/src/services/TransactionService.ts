import axios from "axios";
import {apiUrl} from "../config/api";

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

    // public async fetchTransactionsByUserId(userId: number) : Promise<Transaction[]>
    // {
    //     if(userId < 1){
    //         throw new Error('Invalid userId. UserId must be a positive number.');
    //     }
    //     try
    //     {
    //         const response = await axios.get<Transaction[]>(`${apiUrl}/api/transaction/${userId}`);
    //         return response.data;
    //     }catch(error)
    //     {
    //         console.error('There as an error fetching transactions from the server: ', error);
    //     }
    // }
}
export default TransactionService;