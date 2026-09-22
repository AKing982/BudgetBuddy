import {apiUrl} from '../config/api'
import axios, {AxiosError, AxiosInstance, AxiosStatic} from "axios";
import {Plaid} from "react-plaid-link";

interface PlaidLinkToken {
    linkToken: string;
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

interface InvestmentHolding {
    id: number;
    name: string;
    securityId: string;
    accountId: string;
    amount: number;
    vestedAmount: number;
    costBasis: number;
}

interface InvestmentTransactions {
    id: number;
    account: {
        id: string;
        accountName: string;
        officialName: string;
        type: string;
        subtype: string;
        mask: string;
        balance: number;
    };
    investmentTransactionId: string;
    name: string;
    price: number;
    quantity: number;
    date: string;
    amount: number;
    type: string;
    subtype: string;
}

interface PlaidLinkStatus {
    isLinked: boolean;
    requiresLinkUpdate: boolean;
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

export interface PlaidAccount {
    accountId: string;
    name: string;
    officialName: string;
    balance: number;
    type: string;
    subtype: string;
    mask: string;
}

export interface AccountEntity{
    id: string;
    userId: number;
    plaid_link_id: number;
    accountName: string;
    officialName: string;
    type: string;
    subtype: string;
    mask: string;
    balance: number;
}

interface UserEntity {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    overrideUploadEnabled: boolean;
    enablePlaidCsvSync: boolean;
}

interface PlaidLinkEntity {
    id: number;
    accessToken: string;
    itemId: string;
    institution: string;
    requiresUpdate: boolean;
    accounts: AccountEntity[];
}

interface Transaction {
    transactionId: string;
    accountId: string;
    amount: number;
    categories: string[];
    categoryId: string;
    posted: Date | string;
    name: string;
    merchantName: string;
    pending: boolean;
    logoURL: string;
    authorizedDate: Date | string;
    transactionType: string;
}

interface TransactionDTO {
    accountId: string;
    amount: number;
    isoCurrencyCode: string;
    categories: string[];
    categoryId: string;
    date: string;
    merchantName: string;
    name: string;
    pending: boolean;
    transactionId: string;
    logoUrl: string;
    authorizedDate: string;
}

interface PlaidAccountRequest {
    userId: number;
    accounts: PlaidAccount[];
}

interface AccountResponse {
    accountId: string;
    name: string;
    balance: number;
    type: string;
    subtype: string;
    officialName: string;
    mask: string;
    itemId: string;
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

    public async checkPlaidLinkStatusByUserId(userId: number) : Promise<PlaidLinkStatus[]>
    {
        if(userId < 1){
            throw new Error("Invalid userId. UserId must be a positive number.");
        }
        try
        {
            console.log('API URL:', apiUrl);
            const response = await axios.get<PlaidLinkStatus[]>(`${apiUrl}/plaid/${userId}/plaid-link`);
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

    public async createInvestmentLinkToken() : Promise<PlaidLinkToken> {
        try
        {
            const userId = sessionStorage.getItem('userId');
            const response = await axios.post<PlaidLinkToken>(`${apiUrl}/plaid/create_investment_link_token`, {
                userId: userId
            });
            return response.data;
        }catch(error){
            console.error('Error creating Plaid Investment Link Token: ', error);
            throw error;
        }
    }

    public async fetchLinkedInvestmentAccounts(userId: number): Promise<PlaidAccount[]> {
        const accounts = await this.fetchAndLinkPlaidAccounts(userId);
        if (!accounts) return [];
        return (accounts as PlaidAccount[]).filter(a => a.type?.toLowerCase() === 'investment');
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
            const response = await axios.post<PlaidLinkRequest>(`${apiUrl}/plaid/link`, {
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

             let userId = sessionStorage.getItem('userId');
            // const linkTokenRequest = this.createLinkTokenRequest(userId);
            const response = await axios.post<PlaidLinkToken>(`${apiUrl}/plaid/create_link_token`, {
               userId: userId
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

    public async getInvestmentHoldings(userId: number): Promise<AccountEntity[]>
    {
        if(!userId)
        {
            throw new Error("Invalid userId. UserId must be a positive number.");
        }
        try
        {
            const response = await axios.get<AccountEntity[]>(`${apiUrl}/plaid/${userId}/investment-accounts`);
            console.log('Investment Holdings Response: ', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching investment holdings: ', error);
            throw error;
        }
    }

    public async getInvestmentTransactions(userId: number, startDate: string, endDate: string): Promise<InvestmentTransactions[]>
    {
        if (!userId || !startDate || !endDate) {
            throw new Error("Invalid userId, startDate, or endDate.");
        }
        console.log('Fetching Investment Transactions for User ID: ', userId);
        console.log('Start Date: ', startDate);
        console.log('End Date: ', endDate);
        try {
            const response = await axios.get<InvestmentTransactions[]>(`${apiUrl}/plaid/${userId}/investment-transactions`, {
                params: { startDate, endDate }
            });
            console.log('Investment Transactions Response: ', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching investment transactions: ', error);
            throw error;
        }
    }

    public async importPlaidInvestmentHoldings(userId: number): Promise<InvestmentHolding[]>
    {
        if(!userId)
        {
            throw new Error("Invalid userId. UserId must be a positive number.");
        }
        try
        {
            const response = await axios.post<InvestmentHolding[]>(`${apiUrl}/plaid/${userId}/import-investment-holdings`);
            return response.data;
        }catch(error){
            console.error('Error importing Plaid Investment Holdings: ', error);
            throw error;
        }
    }

    public async importPlaidInvestmentTransactions(userId: number, startDate: string, endDate: string) : Promise<InvestmentTransactions[]>
    {
        if(!userId || !startDate || !endDate)
        {
            throw new Error("Invalid userId, startDate, or endDate. UserId must be a positive number, startDate must be a valid date, and endDate must be a valid date.");
        }
        try
        {
            const response = await axios.post<InvestmentTransactions[]>(`${apiUrl}/plaid/${userId}/import-investments-transactions`, null, {
                params: {
                    startDate,
                    endDate
                }
            });
            return response.data;
        }catch(error){
            console.error('Error importing Plaid Investment Transactions: ', error);
            throw error;
        }
    }

    public async exchangePublicToken(publicToken: string, userId: number) : Promise<PlaidExchangeResponse>
    {
        if(publicToken == null){
            throw new Error("Public Token cannot be null");
        }

        try
        {
            const response = await axios.post<PlaidExchangeResponse>(`${apiUrl}/plaid/exchange_public_token`, {
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
            const response = await PlaidService.axios.get(`${apiUrl}/plaid/transactions/filtered`, {
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

    public async getTransactions(startDate: string, endDate: string, userId: number) : Promise<Transaction[]>
    {
        console.log('StartDate: ', startDate);
        console.log('EndDate: ', endDate);
        console.log('userId: ', userId);
        try
        {
            const response = await axios.get<Transaction[]>(`${apiUrl}/plaid/transactions`, {
                params: {userId, startDate, endDate},
            });
            console.log('Response Data: ', response.data);
            return response.data;
        }catch(error)
        {
            console.error('Error fetching transactions: ', error);
            throw error;
        }
    }

    private createTransactionRequest(transactions: Transaction[]): TransactionDTO[] {
        return transactions.map(transaction => ({
            accountId: transaction.accountId,
            amount: transaction.amount,
            isoCurrencyCode: 'USD',
            categories: transaction.categories,
            categoryId: transaction.categoryId,
            date: this.ensureDate(transaction.posted).toISOString(),
            merchantName: transaction.merchantName,
            name: transaction.name,
            pending: transaction.pending,
            transactionId: transaction.transactionId,
            logoUrl: transaction.logoURL,
            authorizedDate: this.ensureDate(transaction.authorizedDate).toISOString()
        }));
    }

    private ensureDate(date: Date | string): Date {
        if (date instanceof Date) return date;
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }
        return parsedDate;
    }

    public async fetchAndSaveTransactions(startDate: string, endDate: string, userId: number)
    {
        try
        {
            const transactions = await this.getTransactions(startDate, endDate, userId);
            console.log('Transaction received: ', transactions);
            const transactionRequest = this.createTransactionRequest(transactions);
            console.log('Transaction Request: ', transactionRequest);
            const response = await axios.post<TransactionDTO[]>(`${apiUrl}/plaid/save-transactions`, {
                transactions: transactionRequest
            });
            console.log('Response: ', response.data);
            return response.data;
        }catch(error)
        {
            console.error('Error saving transactions to the database.');
            throw error;
        }
    }

    public async fetchAccounts(userID: number) {
        try
        {
            const response = await axios.get(`${apiUrl}/plaid/users/${userID}/accounts`);
            return response.data;
        }catch(err)
        {
            console.error('There was an error fetching accounts: ', err);
        }

    }

    public createAccountRequest(accounts: AccountResponse[], userId: number): PlaidAccountRequest {

        const accountData = accounts.map(account => ({
            accountId: account.accountId,
            balance: account.balance,
            name: account.name,
            subtype: account.subtype,
            type: account.type,
            officialName: account.officialName,
            mask: account.mask,
            itemId: account.itemId,
        }));
        return {
            userId: userId,
            accounts: accountData,
        };
    }

    public async fetchAndLinkPlaidAccounts(userID: number) {
        try
        {
            const response = await axios.get<AccountResponse[]>(`${apiUrl}/plaid/users/${userID}/accounts`, {
                params: {
                    userID: userID
                }
            });
            const accountData = response.data;
            const accountRequest = this.createAccountRequest(accountData, userID);
            console.log('Account Request: ', accountRequest);
            const savedAccountsResponse = await axios.post(`${apiUrl}/plaid/save-accounts`, {
                userId: userID,
                accounts: accountData
            });
            console.log('Saved Accounts Response: ', savedAccountsResponse.data);
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

    public async getAccessTokenForUser(userId: number) : Promise<string[]>
    {
        try
        {
            const response = await axios.get(`${apiUrl}/plaid/${userId}/access-token`);
            console.log('Access Token response: ', response);
            return response.data;
        }catch(error)
        {
            console.error(`Error fetching the plaid access token for user ${userId}: `, error);
            throw error;
        }
    }

    public async markPlaidAsUpdated(userId: number) : Promise<void>
    {
        try
        {
            const response = await axios.post(`${apiUrl}/plaid/users/${userId}/mark-updated`);
            console.log(`Successfully marked Plaid as updated for user ${userId}:`, response.data);
        }catch(error)
        {
            console.error(`Error marking plaid as updated for user ${userId}: `, error);
            throw error;
        }
    }

    public async updatePlaidLink(userId: number, accessTokens: string[]) : Promise<string>
    {
        console.log('UserId: ', userId);
        console.log('Access Token: ', accessTokens);
        if (!userId || userId < 1 || !accessTokens) {
            throw new Error("Invalid userId or accessToken provided for Plaid update.");
        }
        try
        {
            const response = await axios.post<{linkToken: string}>(`${apiUrl}/plaid/update_link_token`, {
                userId,
                accessTokens
            });
            if (!response.data || !response.data.linkToken) {
                throw new Error("Failed to retrieve update link token from server.");
            }
            return response.data.linkToken;
        }catch(error){
            if (axios.isAxiosError(error)) {
                console.error("Axios error updating Plaid link:", error.response?.data || error.message);
            } else {
                console.error("Unexpected error updating Plaid link:", error);
            }
            throw error;
        }
    }

    public async fetchRecurringChargesForUser(userId: number){
        if(userId < 1){
            throw new Error('Invalid userId. UserId must be a positive number.');
        }
        try
        {
            const response = await axios.get(`${apiUrl}/plaid/users/${userId}/recurring-transactions`);
            return response.data;

        }catch(error)
        {
            console.error(`There was an error fetching recurring charges for userId: ${userId}: `, error);
            throw error;
        }
    }

    private mapToObject(map: Map<number, string>): { [key: number]: string } {
        return Object.fromEntries(Array.from(map));
    }

}
export default PlaidService;