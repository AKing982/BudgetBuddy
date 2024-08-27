
import apiUrl from '../config/api'
import axios, {AxiosError, AxiosInstance, AxiosStatic} from "axios";

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

interface ExchangePublicTokenDTO{
    exchangePublicTokenMap: Map<number, string>;
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

    public async createLinkToken() : Promise<any> {
        try
        {
            let userId = sessionStorage.getItem('userId');
            const linkTokenRequest = this.createLinkTokenRequest("1");
            this.validateLinkTokenRequest(linkTokenRequest);
            const response = await axios.post<PlaidLinkToken>(`http://localhost:8080/api/plaid/create_link_token`, {
               userId: "1"
            });
            console.log('Link Token: ', response);
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


    public async exchangePublicToken(publicToken: string) : Promise<PlaidExchangeResponse>
    {
        if(publicToken == null){
            throw new Error("Public Token cannot be null");
        }

        let userId = sessionStorage.getItem('userId');
        if(!userId){
            throw new Error("User ID not found in session storage");
        }

        const exchangePublicTokenDTO: ExchangePublicTokenDTO = {
            exchangePublicTokenMap: new Map([[Number(userId), publicToken]])
        };

        try
        {
            const response = await PlaidService.axios.post<PlaidExchangeResponse>('/exchange-public-token',
                this.mapToObject(exchangePublicTokenDTO.exchangePublicTokenMap));
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