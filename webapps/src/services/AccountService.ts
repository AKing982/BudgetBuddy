import {apiUrl} from "../config/api";
import axios from "axios";

interface Account {
    accountId: string;
    userId: number;
    name: string;
    balance: string;
    type: string;
    mask: string;
    officialName: string;
    subtype: string;
    action: 'gear' | 'add';
    color?: string;
}


class AccountService {

    private static instance: AccountService;

    private Constructor(){

    }

    public static getInstance() : AccountService {
        if(!AccountService.instance){
            AccountService.instance = new AccountService();
        }
        return AccountService.instance;
    }

    public async fetchAccountsForUser(userId: number): Promise<Account[]> {
        if(userId < 1){
            throw new Error('UserId is invalid');
        }
        try
        {
            const response = await axios.get<Account[]>(`${apiUrl}/api/accounts/${userId}`);
            return response.data;
        }catch(error){
            console.error(`There was an error fetching accounts for user: ${userId}: `, error);
            throw error;
        }
    }
}

export default AccountService;