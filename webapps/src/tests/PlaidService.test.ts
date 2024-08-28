
import PlaidService from '../services/PlaidService';

import axios from "axios";

import {jest} from '@jest/globals'

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

        const result = serviceInstance.checkPlaidLinkStatusByUserId(userId);
        expect(result).toEqual(responseData);
        expect(mockAxios.get).toBeCalledWith(`${apiUrl}/api/plaid/${userId}/plaid-link`);
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


});