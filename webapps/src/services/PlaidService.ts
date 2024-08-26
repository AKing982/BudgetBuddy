import axios, {AxiosInstance} from "axios";
import apiUrl from '../config/api'

interface PlaidLinkToken {
    link_token: string;
    expiration: string;
}

interface LinkTokenCreateRequest {
   userId: number;
}

interface PlaidExchangeResponse {
    access_token: string;
    item_id: string;
}

interface Transaction {
    transaction_id: string;
    amount: number;
    date: string;
    name: string;
}

class PlaidService {

    private static instance: PlaidService;

    constructor(){

    }

    public static getInstance() : PlaidService
    {
        if(!PlaidService.instance){
            PlaidService.instance = new PlaidService();
        }
        return PlaidService.instance;
    }

    public createLinkTokenRequest() : LinkTokenCreateRequest {

    }

    public async createLinkToken() : Promise<string> {
        try
        {
            const response = await axios.post<PlaidLinkToken>(`/${apiUrl}/api/plaid/create_link_token`, {

            });
            return response.data.link_token;
        }catch(error)
        {
            console.error('Error creating Plaid Link Token: ', error);
            throw error;
        }
    }

    public async exchangePublicToken(publicToken: string) : Promise<PlaidExchangeResponse>
    {
        try
        {
            const response = await axios.post<PlaidExchangeResponse>('/exchange-public-token', {public_token: publicToken});
            return response.data;
        }catch(error)
        {
            console.error('Error creating Plaid Link Token: ', error);
            throw error;
        }
    }

    public async getTransactions(startDate: string, endDate: string) : Promise<Transaction[]>
    {
        try
        {
            const response = await axios.get<Transaction[]>('/transactions', {
                params: {startDate, endDate},
            });

            return response.data;
        }catch(error)
        {
            console.error('Error fetching transactions: ', error);
            throw error;
        }
    }
}
export default PlaidService;