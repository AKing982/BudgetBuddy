import TransactionService from '../services/TransactionService';
import axios from "axios";
import {jest} from '@jest/globals';
jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;
describe('TransactionService', () => {
    test('should create an instance of TransactionService', () => {
        const serviceInstance = TransactionService.getInstance();
        expect(serviceInstance).toBeInstanceOf(TransactionService);
    });
    // test('should throw error when userId invalid', async () => {
    //     const serviceInstance = TransactionService.getInstance();
    //     const userId = -1;
    //     await expect(serviceInstance.fetchTransactionsByUserId(userId))
    //         .rejects
    //         .toThrow('Invalid userId. UserId must be a positive number.');
    // });
    test('fetchTransactionsByUserId when userId valid, return transactions', async () => {
        const serviceInstance = TransactionService.getInstance();
        const userId = 1;

        mockAxios.get.mockResolvedValueOnce({})
    })

})