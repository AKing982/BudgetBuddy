import axios, {AxiosInstance} from "axios";
import apiUrl from '../config/api'
import * as string_decoder from "node:string_decoder";

interface PlaidLinkToken {
    link_token: string;
    expiration: string;
}

interface LinkTokenCreateRequest {
   userId: string | null;
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

    constructor(){}

    public static getInstance() : PlaidService
    {
        if(!PlaidService.instance){
            PlaidService.instance = new PlaidService();
        }
        return PlaidService.instance;
    }

    public createLinkTokenRequest(userId: string | null) : LinkTokenCreateRequest {
        return {
            userId: userId
        };
    }

    public async createLinkToken() : Promise<string> {
        try
        {
            let userId = sessionStorage.getItem('userId');
            const linkTokenRequest = this.createLinkTokenRequest(userId);
            this.validateLinkTokenRequest(linkTokenRequest);
            const response = await axios.post<PlaidLinkToken>(`http://localhost:8080/api/plaid/create_link_token`, {
                linkTokenRequest
            });
            console.log('Link Token Response: ', response);
            return response.data.link_token;
        }catch(error)
        {
            console.error('Error creating Plaid Link Token: ', error);
            throw error;
        }
    }

    public validateLinkTokenRequest(request: LinkTokenCreateRequest) : void {
        if(request == null){
            throw new Error("")
        }
    }

    public async exchangePublicToken(publicToken: string) : Promise<PlaidExchangeResponse>
    {
        if(publicToken == null){
            throw new Error("Public Token cannot be null");
        }
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

    public async getFilteredTransactions(startDate: string, endDate: string, pageCount: number) : Promise<Transaction[]>
    {
        if(startDate == null || endDate == null || pageCount == 0){
            return [];
        }
        try
        {
            const userId = sessionStorage.getItem('userId');
            const response = await axios.get(`http://localhost:8080/api/plaid/transactions/filtered`, {
                params: {
                    userId,
                    startDate,
                    endDate,
                    pageCount
                }
            })
            return response.data;
        }catch(error)
        {
            console.error("There was an issue retrieving filtered transactions due to the error: ", error);
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