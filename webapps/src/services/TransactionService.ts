import axios from "axios";
import {API_BASE_URL, apiUrl} from "../config/api";
import {CSVTransaction, Transaction} from "../utils/Items";
import {CategorySaveData} from "../components/CategoryDialog";

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

    public async updateCSVTransactionWithCategorySaveData(categorySaveData: CategorySaveData) : Promise<CSVTransaction> {
        try
        {
            const transactionIdString = categorySaveData.transactionId;
            const transactionId: string | number | undefined = this.parseTransactionId(transactionIdString);
            console.log("TransactionId {}", transactionId);
            const response = await axios.put<CSVTransaction>(
                `${API_BASE_URL}/transaction/update/category`,
                null, // No request body needed
                {
                    params: {
                        transactionId: transactionId,
                        category: categorySaveData.category
                    }
                }
            );

            return response.data;
        }catch(error){
            console.error('There was an error updating the CSV transaction with category data: ', error);
            if(axios.isAxiosError(error) && error.response?.status === 500){
                throw error;
            }
            throw error;
        }
    }

    private parseTransactionId(transactionId: string | number | undefined) : number
    {
        if(transactionId === undefined)
        {
            throw new Error('Transaction id is undefined.');
        }
        try {
            if(typeof transactionId === 'string')
            {
                const transactionIdSplit: string[] = transactionId.split('-');
                return parseInt(transactionIdSplit[1]);
            }
            else {
                return transactionId;
            }
        }catch(error){
            console.error('There was an error parsing the transaction id: ', error);
            return 0;
        }
    }

    public async fetchCSVTransactionsByUserAndDateRange(userId: number, startDate: string, endDate: string) : Promise<CSVTransaction[]>
    {
        if(userId < 1)
        {
            throw new Error('Invalid userId. UserId must be a positive number.');
        }
        if(!Number.isInteger(userId)){
            throw new Error('Invalid userId. UserId must be an integer.');
        }
        try
        {
            const response = await axios.get(`${API_BASE_URL}/transaction/${userId}/csv`, {
                params:{
                    userId: userId,
                    startDate: startDate,
                    endDate: endDate
                }
            });
            return response.data;
        }catch(error){
            console.error('There was an error fetching transactions from the server: ', error);
            throw error;
        }
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
            const response = await axios.get<Transaction[]>(`${API_BASE_URL}/transaction/${userId}/by-date`, {
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
            const response = await axios.get<Transaction[]>(`${API_BASE_URL}/transaction/${userId}`);
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