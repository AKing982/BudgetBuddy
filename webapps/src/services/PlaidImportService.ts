import {Plaid} from "react-plaid-link";
import PlaidService from "./PlaidService";
import axios from "axios";
import {apiUrl} from "../config/api";

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

    public async importPlaidTransactions(userId: number, startDate: string, endDate: string): Promise<BudgetCategory[]> {
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
                `${apiUrl}/plaid-import/${userId}/import`,
                null,
                {
                    params: {
                        startDate: startDate,
                        endDate: endDate
                    }
                }
            );

            return response.data as BudgetCategory[];
        } catch (error) {
            console.error("There was an error running the plaid transaction import: ", error);
            throw error; // Re-throw to allow caller to handle
        }
    }
}

export default PlaidImportService;