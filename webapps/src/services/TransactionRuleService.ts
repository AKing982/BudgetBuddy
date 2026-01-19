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
    transactionType?: string;
    isActive?: boolean;
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
            const response = await axios.get<TransactionRule[]>(`${this.api}/${userId}/rules`);
            return response.data;
        } catch (error) {
            console.error('Error fetching transaction rules:', error);
            throw error;
        }
    }

    public async deleteTransactionRule(userId: number, ruleId: number): Promise<boolean>
    {
        try
        {
            const response = await axios.delete<boolean>(`${this.api}/${userId}/delete/${ruleId}`);
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
            const response = await axios.put<TransactionRule>(`${this.api}/${userId}/update/${ruleId}`, transactionRule);
            return response.data;
        } catch (error) {
            console.error('Error updating transaction rule:', error);
            throw error;
        }
    }

    public async addTransactionRule(userId: number, transactionRule: TransactionRule): Promise<TransactionRule> {
        try {
            const response = await axios.post<TransactionRule>(`${this.api}/${userId}/add`, transactionRule);
            return response.data;
        } catch (error) {
            console.error('Error adding transaction rule:', error);
            throw error;
        }
    }

    public async getTransactionRulesByCategory(userId: number, category: string): Promise<TransactionRule[]>
    {
        try
        {
            const response = await axios.get<TransactionRule[]>(`${this.api}/${userId}/category`, {
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