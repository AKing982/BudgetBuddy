import TransactionService from '../services/TransactionService';
import axios, {AxiosError} from "axios";
import {jest} from '@jest/globals';
import {apiUrl} from "../config/api";
jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;
describe('TransactionService', () => {
    let  serviceInstance = TransactionService.getInstance();
    test('should create an instance of TransactionService', () => {
        const serviceInstance = TransactionService.getInstance();
        expect(serviceInstance).toBeInstanceOf(TransactionService);
    });
    test('should throw error when userId invalid', async () => {
        const userId = -1;
        await expect(serviceInstance.fetchTransactionsByUserId(userId))
            .rejects
            .toThrow('Invalid userId. UserId must be a positive number.');
    });
    test('fetchTransactionsByUserId when userId valid, return transactions', async () => {
        const userId = 1;
        const mockTransactions: Transaction[] = [
            {
                transactionId: '123',
                accountId: 'acc123',
                amount: 100,
                categories: ['food'],
                date: '2023-09-17',
                name: 'Restaurant XYZ',
                merchantName: 'XYZ Corp',
                pending: false,
                logoUrl: 'http://example.com/logo.png',
                authorizedDate: '2023-09-16',
                transactionType: 'debit'
            }
        ];

        mockAxios.get.mockResolvedValueOnce({data: mockTransactions});

        const result = await serviceInstance.fetchTransactionsByUserId(userId);
        expect(result).toEqual(mockTransactions);
        expect(mockAxios.get).toHaveBeenCalledWith(`${apiUrl}/api/transaction/${userId}`);
    });
    test('fetchTransactionsByUserId should throw error when API call fails', async () => {
        const userId = 1;
        const errorMessage = 'Network Error';

        mockAxios.get.mockRejectedValueOnce(new Error(errorMessage));
        await expect(serviceInstance.fetchTransactionsByUserId(userId))
            .rejects
            .toThrow(errorMessage)
    });
    test('fetchTransactionsByUserId when userId is zero throw error', async () => {
        await expect(serviceInstance.fetchTransactionsByUserId(0))
            .rejects
            .toThrow('Invalid userId. UserId must be a positive number.');
    });
    test('fetchTransactionsByUserId when userId is not an integer', async () => {
        await expect(serviceInstance.fetchTransactionsByUserId(1.5))
            .rejects
            .toThrow('Invalid userId. UserId must be an integer.');
    });
    test('fetchTransactionsByUserId should return empty array when user has no transactions', async () => {
        const userId = 2;

        mockAxios.get.mockResolvedValueOnce({data: []});
        const result = await serviceInstance.fetchTransactionsByUserId(userId);
        expect(result).toEqual([]);
    });

    describe('fetchTransactionsByUserAndDateRange', () => {
        const validUserId = 1;
        const validStartDate = new Date('2023-01-01');
        const validEndDate = new Date('2023-12-31');

        test('fetchTransactionsByUserAndDateRange should throw error with invalid userId', async () => {
            const userId = -1;
            await expect(serviceInstance.fetchTransactionsByUserAndDateRange(userId, validStartDate, validEndDate))
                .rejects
                .toThrow('Invalid userId. UserId must be a positive number.');
        });
        test('fetchTransactionsByUserAndDateRange should throw error when startDate is invalid', async () => {

            await expect(serviceInstance.fetchTransactionsByUserAndDateRange(validUserId, new Date('invalid'), validEndDate))
                .rejects
                .toThrow('Invalid startDate. startDate must be a valid date object.');
        })
    })


})