import {CSVTransaction} from "../utils/Items";
import axios from "axios";
import {API_BASE_URL} from "../config/api";
import {CategorySaveData} from "../components/CategoryDialog";


export interface BoolStatus {
    status: boolean;
    message: string;
}

class TransactionCategoryService {
    private static instance: TransactionCategoryService;

    public static getInstance() : TransactionCategoryService
    {
        if(!TransactionCategoryService.instance){
            return new TransactionCategoryService();
        }
        return TransactionCategoryService.instance;
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

    public async checkUpdatedTransactionCategoriesByDateRange(userId: number, startDate: Date, endDate: Date) : Promise<boolean>
    {
        try
        {
            const response = await axios.get<BoolStatus>(
                `${API_BASE_URL}/transaction-category/is-updated-by-month`,
                {
                    params: {
                        userId: userId,
                        startDate: this.formatDate(startDate),
                        endDate: this.formatDate(endDate)
                    }
                }
            );

            return response.data.status;
        }catch(error){
            console.error("There was an error checking for updated transaction categories: ", error);
            return false;
        }
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    public async checkNewTransactionCategoriesByDateRange(userId: number, startDate: Date, endDate: Date) : Promise<boolean>
    {
        try
        {
            const response = await axios.get<BoolStatus>(
                `${API_BASE_URL}/transaction-category/is-new-by-month`,
                {
                    params: {
                        userId: userId,
                        startDate: this.formatDate(startDate),
                        endDate: this.formatDate(endDate)
                    }
                }
            );

            console.log(response.data.message); // Log the message from backend
            return response.data.status;

        } catch(error) {
            console.error(`There was an error checking for new transaction categories for userId ${userId}:`, error);
            return false;
        }
    }

    public async updateTransactionCSVWithCategory(userId: number, categorySaveData: CategorySaveData) : Promise<CSVTransaction>
    {
        if(categorySaveData == null)
        {
            throw new Error('Category save data is null');
        }
        const transactionIdString = categorySaveData.transactionId;
        const csvId = this.parseTransactionId(transactionIdString);
        const category = categorySaveData.category;
        try
        {
            const response = await axios.put<CSVTransaction>(`${API_BASE_URL}/transaction-category/update/category`, null,
                {
                    params: {
                        csvTransactionId: csvId,
                        category: category,
                        userId: userId
                    }
                });
            return response.data;
        }catch(error){
            console.error(`There was an error updating the transaction with id ${csvId} with new category ${category}: `, error);
            throw error;
        }
    }

    public async fetchTransactionCSVByCategoryList(userId: number, start: string, end: string) : Promise<CSVTransaction[]>
    {
       if(userId < 1 || start == '' || end == '')
       {
           throw new Error("Invalid input... Please check the userId and start and end dates");
       }
        try
        {
            console.log('UserId', userId);
            const response = await axios.get<CSVTransaction[]>(`${API_BASE_URL}/transaction-category/${userId}/csv`,
                {
                    params: {
                        startDate: start,
                        endDate: end
                    }
                });
            return response.data;
        }catch(error){
           console.error("There was an error fetching the Transaction CSV with category list: ", error);
           return [];
        }
    }
}

export default TransactionCategoryService;