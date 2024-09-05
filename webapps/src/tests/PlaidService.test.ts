
import PlaidService from '../services/PlaidService';

import axios from "axios";

import {jest} from '@jest/globals'
import {apiUrl} from "../config/api";

interface PlaidLinkStatus {
    isLinked: boolean;
}


jest.mock('axios');

// Arrange
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('PlaidService', () => {

    test('should create an instance of PlaidService', () => {
        const serviceInstance = PlaidService.getInstance();
        expect(serviceInstance).toBeInstanceOf(PlaidService);
    });

    test('createLinkTokenRequest method should return object with userId', () => {
        const serviceInstance = PlaidService.getInstance();
        const userId = "1";
        const result = serviceInstance.createLinkTokenRequest(userId);
        expect(result).toEqual({ userId });
    });

    test('checkPlaidLinkStatusByUserId axios get call', async () => {
        const serviceInstance = PlaidService.getInstance();
        const userId = 1;
        const apiUrl = "http://localhost:8080";
        const responseData: PlaidLinkStatus = {isLinked: true};
        mockAxios.get.mockResolvedValueOnce({ data: responseData  });

        const result = await serviceInstance.checkPlaidLinkStatusByUserId(userId);
        console.log(result);
        expect(result).toEqual(responseData);
        expect(mockAxios.get).toBeCalledWith(`${apiUrl}/api/plaid/${userId}/plaid-link`);
    });

    test('checkPlaidLinkStatusByUserId throws error for userId = -1', async () => {
        const serviceInstance = PlaidService.getInstance();
        const userId = -1;
        await expect(serviceInstance.checkPlaidLinkStatusByUserId(userId))
            .rejects
            .toThrow('Invalid userId. UserId must be a positive number.');

    });

    test('checkPlaidLinkStatusByUserId when response is null', async () => {
        const serviceInstance = PlaidService.getInstance();
        const userId = 1;
        const apiUrl = "http://localhost:8080";

        mockAxios.get.mockResolvedValueOnce({data: null});

        const result = await serviceInstance.checkPlaidLinkStatusByUserId(userId);
        expect(result).toBeNull();
        expect(mockAxios.get).toHaveBeenCalledWith(`${apiUrl}/api/plaid/${userId}/plaid-link`);
    });

    test('createLinkToken axios post call', async () => {
        const serviceInstance = PlaidService.getInstance();
        const data = { linkToken: "linkToken" };
        mockAxios.post.mockResolvedValueOnce({ data });

        await expect(serviceInstance.createLinkToken()).resolves.toBe(data);
        expect(mockAxios.post).toBeCalled();
    });

    test('exchangePublicToken axios post call', async () => {
        const serviceInstance = PlaidService.getInstance();
        const publicToken = "publicToken";
        const userId = 1;
        const data = { accessToken: 'access_token', itemID: "232423423", userID: 1};
        mockAxios.post.mockResolvedValueOnce({ data });
        const apiUrl = "http://localhost:8080";

        const result = await serviceInstance.exchangePublicToken(publicToken, userId);
        expect(result).toEqual(data);
        expect(mockAxios.post).toHaveBeenCalledWith(
            `${apiUrl}/api/plaid/exchange_public_token`,
            {"1": "publicToken"}
        );
    });

    test('fetchRecurringChargesForUser when userId invalid, then throw Error', async () => {
        const serviceInstance = PlaidService.getInstance();
        const userId = -1;
        await expect(serviceInstance.fetchRecurringChargesForUser(userId)).rejects.toThrow('Invalid userId. UserId must be a positive number.');
    });

    test('fetchRecurringChargesForUser when userId is valid', async () => {
        const serviceInstance = PlaidService.getInstance();
        const userId = 1;
        const apiUrl = "http://localhost:8080";
        const responseData = { charges: [] };
        mockAxios.get.mockResolvedValueOnce({ data: responseData });

        const result = await serviceInstance.fetchRecurringChargesForUser(userId);
        expect(result).toEqual(responseData);
        expect(mockAxios.get).toHaveBeenCalledWith(`${apiUrl}/api/plaid/users/${userId}/recurring-transactions`);
    })


});