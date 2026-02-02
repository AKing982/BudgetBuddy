import axios, {AxiosInstance} from "axios";
import {API_BASE_URL} from "../config/api";

export interface TransactionRule {
    id?: number;
    userId: number;
    categoryName?: string;
    descriptionRule?: string;
    merchantRule?: string;
    extendedDescriptionRule?: string;
    amountMin?: number;
    amountMax?: number;
    priority?: number;
    isActive?: boolean;
    matchCount: number;
    dateCreated?: string;  // ISO date string
    dateModified?: string; // ISO date string
}

class TransactionRuleService
{
    private static instance: TransactionRuleService;
    private readonly api: string;
    public static getInstance() : TransactionRuleService {
        if(!TransactionRuleService.instance){
            TransactionRuleService.instance = new TransactionRuleService();
        }
        return TransactionRuleService.instance;
    }

    constructor(){
        this.api = API_BASE_URL;
    }

    public async getTransactionRulesByUser(userId: number) : Promise<TransactionRule[]>
    {
        try {
            const response = await axios.get<TransactionRule[]>(`${this.api}/transaction-rules/${userId}/rules`);
            return response.data;
        } catch (error) {
            console.error('Error fetching transaction rules:', error);
            throw error;
        }
    }

    public async updateTransactionRuleActiveState(userId: number, ruleId: number, active: boolean) : Promise<TransactionRule>
    {
        try {
            const response = await axios.put<TransactionRule>(
                `${this.api}/transaction-rules/${ruleId}/${userId}/update-active`,
                null,
                {
                    params: { active }
                }
            );
            return response.data;
        } catch(error) {
            console.error('There was an error updating the transaction rule active state: ', error);
            throw error;
        }
    }

    public async deleteTransactionRule(userId: number, ruleId: number): Promise<boolean>
    {
        try
        {
            const response = await axios.delete<boolean>(`${this.api}/transaction-rules/${userId}/delete/${ruleId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting transaction rule:', error);
            throw error;
        }
    }

    public async updateTransactionRule(userId: number, ruleId: number, transactionRule: TransactionRule): Promise<TransactionRule>
    {
        try
        {
            const response = await axios.put<TransactionRule>(`${this.api}/transaction-rules/${userId}/update/${ruleId}`, transactionRule);
            return response.data;
        } catch (error) {
            console.error('Error updating transaction rule:', error);
            throw error;
        }
    }

    public async addTransactionRule(userId: number, transactionRule: TransactionRule): Promise<TransactionRule> {
        try {

            console.log('Request payload:', JSON.stringify(transactionRule, null, 2));
            const response = await axios.post<TransactionRule>(`${this.api}/transaction-rules/${userId}/add`, transactionRule);
            return response.data;
        } catch (error: any) {
            console.error('Error adding transaction rule:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', JSON.stringify(error.response.data, null, 2)); // <-- DETAILED ERROR
                console.error('Response headers:', error.response.headers);
            }
            throw error;
        }
    }

    public async getTransactionRulesByCategory(userId: number, category: string): Promise<TransactionRule[]>
    {
        try
        {
            const response = await axios.get<TransactionRule[]>(`${this.api}/transaction-rules/${userId}/category`, {
                params: { category }
            });
            return response.data;
        } catch (error)
        {
            console.error('Error fetching transaction rules by category:', error);
            throw error;
        }
    }
}
export default TransactionRuleService;