import {Plaid} from "react-plaid-link";
import PlaidService from "./PlaidService";
import axios from "axios";
import {API_BASE_URL, apiUrl} from "../config/api";
import {Transaction} from "../utils/Items";

interface RecurringTransaction extends Transaction {
    streamId: string;
    firstDate: string; // ISO date string (YYYY-MM-DD)
    lastDate: string; // ISO date string (YYYY-MM-DD)
    frequency: string;
    averageAmount: number;
    lastAmount: number;
    active: boolean;
    type: string;
}


interface PlaidImportResult {
    userId: number;
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
}

class PlaidImportService
{
    private static instance: PlaidImportService;
    private readonly baseURL: string = "http://localhost:8080/api/plaid-import";
    private constructor(){

    }

    public static getInstance() : PlaidImportService {
        if(!PlaidImportService.instance){
            PlaidImportService.instance = new PlaidImportService();
        }
        return PlaidImportService.instance;
    }

    public async importPlaidTransactions(userId: number, startDate: string, endDate: string): Promise<PlaidImportResult> {
        if(userId < 1)
        {
            throw new Error("UserId is invalid");
        }
        if(startDate === null || endDate === null)
        {
            throw new Error("Start Date or End Date is null");
        }
        try
        {

            console.log("Importing Plaid Transactions");
            const response = await axios.post(
                `${API_BASE_URL}/plaid-import/${userId}/import`,
                null,
                {
                    params: {
                        startDate: startDate,
                        endDate: endDate
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error("There was an error running the plaid transaction import: ", error);
            throw error; // Re-throw to allow caller to handle
        }
    }
}

export default PlaidImportService;