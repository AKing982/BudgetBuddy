import RecurringTransactionService from '../services/RecurringTransactionService'
import axios, {AxiosError} from "axios";
import {jest} from '@jest/globals';
import {apiUrl} from '../config/api';
jest.mock('axios');

interface RecurringTransaction {
    userId: number;
    accountId: string;
    streamId: string;
    categoryId: string;
    description: string;
    merchantName: string;
    firstDate: Date;
    lastDate: Date;
    frequency: string;
    averageAmount: number;
    lastAmount: number;
    active: boolean;
    type: string;
}

const mockAxios = axios as jest.Mocked<typeof axios>;
describe('RecurringTransactionService', () => {

    let service: RecurringTransactionService;
    const sampleInflowing: RecurringTransaction[] = [
        {
            userId: 1,
            accountId: 'ACC001',
            streamId: 'STR001',
            categoryId: 'CAT001',
            description: 'Salary',
            merchantName: 'Employer Inc.',
            firstDate: new Date('2023-01-01'),
            lastDate: new Date('2023-12-31'),
            frequency: 'monthly',
            averageAmount: 5000,
            lastAmount: 5000,
            active: true,
            type: 'income'
        },
        {
            userId: 1,
            accountId: 'ACC003',
            streamId: 'STR003',
            categoryId: 'CAT003',
            description: 'Freelance Income',
            merchantName: 'Various Clients',
            firstDate: new Date('2023-02-01'),
            lastDate: new Date('2023-12-31'),
            frequency: 'monthly',
            averageAmount: 2000,
            lastAmount: 2200,
            active: true,
            type: 'income'
        }
    ];

    const sampleOutflowing: RecurringTransaction[] = [
        {
            userId: 1,
            accountId: 'ACC002',
            streamId: 'STR002',
            categoryId: 'CAT002',
            description: 'Rent',
            merchantName: 'Landlord LLC',
            firstDate: new Date('2023-01-05'),
            lastDate: new Date('2023-12-05'),
            frequency: 'monthly',
            averageAmount: 1500,
            lastAmount: 1500,
            active: true,
            type: 'expense'
        },
        {
            userId: 1,
            accountId: 'ACC004',
            streamId: 'STR004',
            categoryId: 'CAT004',
            description: 'Gym Membership',
            merchantName: 'FitnessCo',
            firstDate: new Date('2023-01-10'),
            lastDate: new Date('2023-12-10'),
            frequency: 'monthly',
            averageAmount: 50,
            lastAmount: 50,
            active: true,
            type: 'expense'
        }
    ];

    beforeEach(() => {
        // Initialize service before each test
        // service = new RecurringTransactionService(sampleOutflowing, sampleInflowing);
    });

    test('should create an instance of RecurringTransactionService', () => {
        expect(service).toBeInstanceOf(RecurringTransactionService);
    });
    test('constructor initializes with provided transactions', () => {

        // const service = new RecurringTransactionService(sampleInflowing, sampleOutflowing);
        expect(service.getInflowingRecurringTransactions()).toHaveLength(2);
        expect(service.getOutflowingRecurringTransactions()).toHaveLength(2);
    });
    test('getInflowingRecurringTransactions returns correct transactions', () => {
        const inflowing = service.getInflowingRecurringTransactions();
        expect(inflowing).toContainEqual(sampleInflowing);
    });
    test('getOutflowingRecurringTransactions returns correct transactions', () => {
        const outflowing = service.getOutflowingRecurringTransactions();
        expect(outflowing).containEqual(sampleOutflowing);
    });
    test('fetchRecurringTransactions returns null')






})