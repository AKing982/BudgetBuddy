import {apiUrl} from '../config/api'
import axios, {AxiosError, AxiosInstance, AxiosStatic} from "axios";

interface PlaidLinkToken {
    link_token: string;
    expiration: string;
}

interface LinkTokenCreateRequest {
   userId: string | null;
}

interface PlaidExchangeResponse {
    accessToken: string;
    itemID: string;
    userID: bigint;
}

interface PlaidLinkStatus {
    isLinked: boolean;
}

interface PlaidLinkRequest {
    accessToken: string;
    itemID: string;
    userID: string;
}

interface PlaidExchangeRequest{
    userId: number;
    publicToken: string;
}

interface Transaction {
    transaction_id: string;
    amount: number;
    date: string;
    name: string;
}

class PlaidService {

    private static instance: PlaidService;
    private static axios: AxiosInstance;

    constructor(){
        PlaidService.axios = axios.create({
            baseURL: 'http://localhost:8080/api/plaid',
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }

    public static getInstance() : PlaidService
    {
        if(!PlaidService.instance){
            PlaidService.instance = new PlaidService();
            PlaidService.axios = require('axios').default as AxiosStatic;
        }
        return PlaidService.instance;
    }


    public createLinkTokenRequest(userId: string | null) : LinkTokenCreateRequest {
        return {
            userId: userId
        };
    }

    private createPlaidLinkRequest(accessToken: string, itemID: string, userID: bigint) : PlaidLinkRequest {
        return {
            accessToken: accessToken,
            itemID: itemID,
            userID: userID.toString()
        }
    }

    public async checkPlaidLinkStatusByUserId(userId: number) : Promise<PlaidLinkStatus>
    {
        if(userId < 1){
            throw new Error("Invalid userId. UserId must be a positive number.");
        }
        try
        {
            const response = await axios.get(`${apiUrl}/api/plaid/${userId}/plaid-link`);
            return response.data;
        }catch(error)
        {
            if (axios.isAxiosError(error)) {
                console.error('Error checking Plaid link status:', error.message);
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
            } else {
                console.error('Unexpected error:', error);
            }
            throw error;
        }
    }

    public async savePlaidLinkToDatabase(accessToken: string, itemID: string, userID: bigint) : Promise<any>
    {
        if(accessToken === null || itemID === null || userID < 0){
            console.log('AccessToken: ', accessToken);
            console.log('ItemID: ', itemID);
            console.log('UserID: ', userID);
            throw new Error("Invalid Plaid Link Criteria found: ");
        }

        const request: PlaidLinkRequest = this.createPlaidLinkRequest(accessToken, itemID, userID);
        console.log('PlaidLinkRequest: ', request);
        try
        {
            const response = await axios.post<PlaidLinkRequest>(`${apiUrl}/api/plaid/link`, {
                accessToken: accessToken,
                itemID: itemID,
                userID: userID
            });
            return response.data;

        }catch(error)
        {
            console.error('There was an error saving the Plaid Link: ', error);
            throw error;
        }
    }

    public async createLinkToken() : Promise<any> {
        try
        {

            // let userId = sessionStorage.getItem('userId');
            const linkTokenRequest = this.createLinkTokenRequest("1");
            const response = await axios.post<PlaidLinkToken>(`http://localhost:8080/api/plaid/create_link_token`, {
               userId: "1"
            });
            return response.data;
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

    public async exchangePublicToken(publicToken: string, userId: number) : Promise<PlaidExchangeResponse>
    {
        if(publicToken == null){
            throw new Error("Public Token cannot be null");
        }

        try
        {
            const response = await axios.post<PlaidExchangeResponse>(`${apiUrl}/api/plaid/exchange_public_token`, {
                userId: userId,
                publicToken: publicToken
            });
            console.log('Response: ', response);
            return response.data;
        }catch(error)
        {
            console.error('Error exchanging public token: ', error);
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
            const response = await PlaidService.axios.get(`http://localhost:8080/api/plaid/transactions/filtered`, {
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
            const response = await PlaidService.axios.get<Transaction[]>('/transactions', {
                params: {startDate, endDate},
            });
            return response.data;
        }catch(error)
        {
            console.error('Error fetching transactions: ', error);
            throw error;
        }
    }

    public async fetchAndLinkPlaidAccounts(userID: number) {
        try
        {
            const  response = await axios.get(`http://localhost:8080/api/plaid/accounts`, {
                params: {
                    userID: userID
                }
            });

            if(response.status === 200 || response.status === 201){
                console.log('Found response: ', response.data);
                return response.data;
            }else{
                console.log(`Request completed with status: ${response.status}`);
                return null;
            }
        }catch(error){
            if (axios.isAxiosError(error)) {
                // This is an Axios error
                const axiosError = error as AxiosError;
                if (axiosError.response) {
                    console.error(`Server responded with status ${axiosError.response.status}: `, axiosError.response.data);
                } else if (axiosError.request) {
                    console.error('No response received for the request: ', axiosError.request);
                } else {
                    console.error('Error', axiosError.message);
                }
            } else {
                // This is not an Axios error
                console.error('An unexpected error occurred:', error);
            }
            return null;
        }
    }

    private mapToObject(map: Map<number, string>): { [key: number]: string } {
        return Object.fromEntries(Array.from(map));
    }

}
export default PlaidService;