import {CSVTransaction} from "../utils/Items";
import axios from "axios";
import {API_BASE_URL} from "../config/api";
import {CategorySaveData} from "../components/CategoryDialog";

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