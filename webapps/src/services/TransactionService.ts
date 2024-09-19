import axios from "axios";
import {apiUrl} from "../config/api";

interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    posted: Date | string;
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

    private swapStartDateAndEndDate(startDate: Date, endDate: Date) : Date {
       if(startDate > endDate){
           return new Date(startDate.getTime());
       }else{
           return new Date(endDate.getTime());
       }
    }

    public getStartDate() : string {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getDay() - 15);
        return currentDate.toISOString().split('T')[0];
    }

    public async fetchTransactionsByUserAndDateRange(userId: number, startDate: string, endDate: string) {
        if(userId < 1){
            throw new Error('Invalid userId. UserId must be a positive number.');
        }
        if(!Number.isInteger(userId)){
            throw new Error('Invalid userId. UserId must be an integer.');
        }

        try
        {
            const response = await axios.get<Transaction[]>(`${apiUrl}/api/transaction/${userId}/by-date`, {
                params:{
                    userId: userId,
                    startDate: startDate,
                    endDate: endDate
                }
            });
            console.log('Transactions from database: ', response.data);
            return response.data;
        }catch(error)
        {
            console.error('There was an error fetching transactions from the server: ', error);
            if(axios.isAxiosError(error) && error.response?.status === 500){
                throw error;
            }
            throw error;
        }
    }

    public async updateTransactionCategory(transactionId: string, categoryId: string, newCategory: string){

    }

    public async fetchTransactionsByUserId(userId: number): Promise<Transaction[]>
    {
        if(!Number.isInteger(userId)){
            throw new Error('Invalid userId. UserId must be an integer.');
        }

        if(userId < 1){
            throw new Error('Invalid userId. UserId must be a positive number.');
        }
        try
        {
            const response = await axios.get<Transaction[]>(`${apiUrl}/api/transaction/${userId}`);
            if(response.data.length === 0){
                return [];
            }
            return response.data;
        }catch(error)
        {

            // For all other errors, we'll log and rethrow
            console.error('There was an error fetching transactions from the server: ', error);
            throw error;
        }
    }
}
export default TransactionService;