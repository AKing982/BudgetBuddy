import BudgetService from '../services/BudgetService'
import axios from "axios";
import {jest} from '@jest/globals';
import {BudgetQuestions} from "../utils/BudgetUtils";
import LoginService from "../services/LoginService";
import {SavingsGoalData} from "../components/SavingsGoalQuestions";
import {SpendingCategory} from "../components/SpendingControlQuestions";
import {DebtPayoffData} from "../components/DebtPayoffQuestions";
jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../services/LoginService');

describe('BudgetService', () => {

    let budgetService: BudgetService;
    let mockLoginService: jest.Mocked<LoginService>;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create a minimal mock that satisfies the LoginService interface
        mockLoginService = {
            fetchUserIdByUsername: jest.fn(),
            fetchMaximumUserId: jest.fn(),
        } as jest.Mocked<LoginService>;

        // Get the BudgetService instance and set the mocked LoginService
        budgetService = BudgetService.getInstance();
        (budgetService as any).loginService = mockLoginService;
    });

    test('should create an instance of BudgetService', () => {
        const serviceInstance = BudgetService.getInstance();
        expect(serviceInstance).toBeInstanceOf(BudgetService);
    });


    describe('createBudgetRequest tests', () => {
        test('should throw error when budgetData is null', async () => {
            await expect(budgetService.createBudgetRequest(null as any))
                .rejects.toThrow('BudgetData found null');
        });
        test('should throw error when savingsGoalData is null', async () => {
            await expect(budgetService.createBudgetRequest({} as BudgetQuestions))
                .rejects.toThrow('SavingsGoalData found null');
        });

        test('should create a Savings Budget request', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const savingsGoalData: SavingsGoalData = {
                goalName: 'Vacation Fund',
                goalDescription: 'Save for a summer vacation',
                targetAmount: 5000,
                currentSavings: 1000,
                savingsFrequency: 'monthly',
                targetDate: '2024-08-01',
            };
            const budgetData: BudgetQuestions = {
                budgetType: 'Saving for a goal',
                monthlyIncome: 5000,
                expenseCategories: [],
                financialGoal: {
                    id: 1,
                    budgetId: 1,
                    goalName: savingsGoalData.goalName,
                    goalDescription: savingsGoalData.goalDescription,
                    goalType: 'Savings',
                    targetAmount: savingsGoalData.targetAmount,
                    monthlyAllocation: 500,
                    currentSavings: savingsGoalData.currentSavings,
                    savingsFrequency: savingsGoalData.savingsFrequency,
                    status: 'In Progress',
                },
                savingsGoalData: savingsGoalData,
            };

            const result = await budgetService.createBudgetRequest(budgetData);
            expect(result).toEqual({
                userId: 1,
                budgetName: 'Savings Budget',
                budgetDescription: 'Savings Budget',
                totalBudgetAmount: 0,
                monthlyIncome: 5000,
                startDate: expect.any(Date),
                endDate: '2024-08-01',
            });
        });

        test('should create a Spending Control Budget Request', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(2);
            const spendingControlData: SpendingCategory[] = [
                {id: '1', name: 'Groceries', currentSpending: 600, spendingLimit: 500, reductionPriority: 2},
                {id: '1', name: 'Entertainment', currentSpending: 300, spendingLimit: 200, reductionPriority: 1},
            ];
            const budgetData: BudgetQuestions = {
                budgetType: 'Controlling spending',
                monthlyIncome: 4000,
                expenseCategories: [],
                financialGoal: {} as any,
                spendingControlData: { categories: spendingControlData },
            };

            const result = await budgetService.createBudgetRequest(budgetData);

            expect(result).toEqual({
                userId: 2,
                budgetName: 'Spending Control Budget',
                budgetDescription: 'Spending Control Budget',
                totalBudgetAmount: 0,
                monthlyIncome: 4000,
                startDate: expect.any(Date),
                endDate: expect.any(Date),
            });
        });

        test('should create a Debt Payoff Budget request', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const debtPayoffData: DebtPayoffData = {
                debts: [
                    { type: 'Credit Card', amount: 6300, allocation: 250, targetDate: new Date('01-25-25') },
                ],
                otherDebtType: 'Personal Loan',
                otherDebtAmount: 3000,
                otherDebtAllocation: 300,
                otherDebtTargetDate: new Date('2025-10-16'),
            };
            const budgetData: BudgetQuestions = {
                budgetType: 'paying off debt',
                monthlyIncome: 6000,
                expenseCategories: [],
                financialGoal: {} as any,
                debtPayoffData: debtPayoffData,
            };

            const result = await budgetService.createBudgetRequest(budgetData);

            expect(result).toEqual(expect.objectContaining({
                userId: 1,
                budgetName: 'Debt Payoff Budget',
                budgetDescription: 'Debt Payoff Budget',
                totalBudgetAmount: 0,
                monthlyIncome: 6000,
                startDate: expect.any(Date),
            }));
            // Check that the endDate is correct, ignoring the time
            expect(result.endDate).toBeDefined();
            if (result.endDate) {
                const expectedDate = new Date('2025-10-16');
                if (result.endDate instanceof Date) {
                    expect(result.endDate.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0]);
                } else if (typeof result.endDate === 'string') {
                    expect(result.endDate).toBe(expectedDate.toISOString().split('T')[0]);
                } else {
                    fail('endDate is neither a Date object nor a string');
                }
            }
        });

        test('should handle negative monthly income', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const budgetData: BudgetQuestions = {
                budgetType: 'Saving for a goal',
                monthlyIncome: -5000,
                expenseCategories: [],
                financialGoal: {} as any,
            };

            await expect(budgetService.createBudgetRequest(budgetData))
                .rejects.toThrow('Invalid monthly income');
        });
        test('should handle empty expense categories', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const budgetData: BudgetQuestions = {
                budgetType: 'Controlling spending',
                monthlyIncome: 5000,
                expenseCategories: [],
                financialGoal: {} as any,
            };

            const result = await budgetService.createBudgetRequest(budgetData);
            expect(result.totalBudgetAmount).toBe(0);
        });
        test('should handle missing savingsGoalData for Savings Budget', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const budgetData: BudgetQuestions = {
                budgetType: 'Saving for a goal',
                monthlyIncome: 5000,
                expenseCategories: [],
                financialGoal: {} as any,
            };

            await expect(budgetService.createBudgetRequest(budgetData))
                .rejects.toThrow('SavingsGoalData found null');
        });

        test('should handle past date for savings goal target', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            const savingsGoalData: SavingsGoalData = {
                goalName: 'Past Goal',
                goalDescription: 'Goal in the past',
                targetAmount: 5000,
                currentSavings: 0,
                savingsFrequency: 'monthly',
                targetDate: pastDate.toISOString().split('T')[0],
            };
            const budgetData: BudgetQuestions = {
                budgetType: 'Saving for a goal',
                monthlyIncome: 5000,
                expenseCategories: [],
                financialGoal: {} as any,
                savingsGoalData: savingsGoalData,
            };

            await expect(budgetService.createBudgetRequest(budgetData))
                .rejects.toThrow('Savings goal target date cannot be in the past');
        });
    })


    describe('calculateTotalBudgetAmount tests', () => {

        beforeEach(() => {
            budgetService = BudgetService.getInstance();
            // Mock the alert function
            global.alert = jest.fn();
        });

        test('should throw error for negative target amount', () => {
            expect(() =>
                budgetService.calculateTotalBudgetAmount('Saving for a goal', new Date(), new Date(), -1000, 5000, 0, 500)
            ).toThrow('Invalid Target Amount has been entered');
        });

        test('should calculate total budget amount for Saving for a goal', () => {
            const startDate = new Date('2024-01-10');
            const endDate = new Date('2025-01-25');
            const result = budgetService.calculateTotalBudgetAmount('Saving for a goal', startDate, endDate, 12000, 5000, 2000, 500);
            expect(result).toBeCloseTo(4166.67, 2);
        });
        test('should calculate total budget amount for paying off debt', () => {
            const startDate = new Date('2024-01-10');
            const endDate = new Date('2025-01-25');
            const result = budgetService.calculateTotalBudgetAmount('paying off debt', startDate, endDate, 6300, 3260, 250, 200);
            expect(result).toBe(3060);
        });
        test('should show warning when monthly allocation is insufficient for debt payoff', () => {
            const startDate = new Date('2024-01-10');
            const endDate = new Date('2025-01-25');
            budgetService.calculateTotalBudgetAmount('paying off debt', startDate, endDate, 24000, 5000, 0, 1000);
            expect(global.alert).toHaveBeenCalledWith('Warning: The specified monthly allocation may not be sufficient to pay off the debt within the budget period');
        });
        test('should calculate total budget amount for Controlling spending', () => {
            const startDate = new Date('2024-01-10');
            const endDate = new Date('2025-01-25');
            const result = budgetService.calculateTotalBudgetAmount('Controlling spending', startDate, endDate, 0, 5000, 0, 0);
            expect(result).toBe(5000);
        });
        test('should throw error for invalid budget type', () => {
            expect(() =>
                budgetService.calculateTotalBudgetAmount('Invalid type', new Date(), new Date(), 1000, 5000, 0, 500)

            ).toThrow('Invalid Budget type');
        });

        test('should handle same start and end date by adjusting end date to one month later', () => {
            const startDate = new Date('2024-01-10');
            const endDate = new Date('2024-01-10');
            const result = budgetService.calculateTotalBudgetAmount('Saving for a goal', startDate, endDate, 12000, 5000, 2000, 500);
            const expectedMonthlySavings = 10000;
            const expectedTotalBudgetAmount = 5000 - expectedMonthlySavings;
            expect(result).toBe(expectedTotalBudgetAmount);
        });
        test('should handle very large target amount', () => {
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2024-01-01');
            const result = budgetService.calculateTotalBudgetAmount('Saving for a goal', startDate, endDate, Number.MAX_SAFE_INTEGER, 5000, 0, 500);
            expect(result).toBeLessThan(5000);
        });

        test('should handle zero monthly income', () => {
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2024-01-01');
            const result = budgetService.calculateTotalBudgetAmount('Controlling spending', startDate, endDate, 0, 0, 0, 0);
            expect(result).toBe(0);
        });
    });

    describe('saveBudget tests',  () => {

        let budgetService: BudgetService;
        const apiUrl = 'http://localhost:8080';
        let consoleErrorSpy: jest.Spied<any>

        beforeEach(() => {
            budgetService = BudgetService.getInstance();
            jest.spyOn(budgetService as any, 'createBudgetRequest').mockResolvedValue({
                userId: 1,
                budgetName: 'Test Budget',
                budgetDescription: 'Test Description',
                totalBudgetAmount: 1000,
                monthlyIncome: 5000,
                startDate: new Date(),
                endDate: new Date(),
            });
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });


        afterEach(() => {
            jest.clearAllMocks();
            consoleErrorSpy.mockRestore();
        });

        const mockBudget: BudgetQuestions = {
            budgetType: 'Saving for a goal',
            monthlyIncome: 5000,
            expenseCategories: [],
            financialGoal: {} as any,
        };

        const mockSavingsGoalData: SavingsGoalData = {
            goalName: 'Test Goal',
            goalDescription: 'Test Description',
            targetAmount: 10000,
            currentSavings: 1000,
            savingsFrequency: 'monthly',
            targetDate: '2024-12-31',
        };

        test('should throw error when budget questions is null', async () => {
            await expect(budgetService.saveBudget(null as any))
                .rejects
                .toThrow('Budget is null');
        });

        test('should throw error when savingsGoalData is null', async() => {
            await expect(budgetService.saveBudget({} as BudgetQuestions))
                .rejects
                .toThrow('SavingsGoalData cannot be null');
        });

        test('should successfully save a budget', async() => {
            const mockResponse = {data: {id: 1, ...mockBudget}};
            mockAxios.post.mockResolvedValue(mockResponse);
            const result = await budgetService.saveBudget(mockBudget);

            expect(result).toEqual(mockResponse);
            expect(mockAxios.post).toHaveBeenCalledWith(`${apiUrl}/api/budgets/`, {
                userId: 1,
                budgetName: 'Test Budget',
                budgetDescription: 'Test Description',
                budgetAmount: 1000,
                monthlyIncome: 5000,
                startDate: expect.any(Date),
                endDate: expect.any(Date),
            });
        });

        test('should throw error when budget request is null', async() => {
            // Mock createBudgetRequest to return null
            jest.spyOn(budgetService as any, 'createBudgetRequest').mockResolvedValue(null);

            await expect(budgetService.saveBudget(mockBudget))
                .rejects.toThrow('Invalid budget request');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'There was an error saving the budget: ',
                expect.any(Error)
            );
        })

        test('should throw an error if axios post request fails', async() => {
            const errorMessage = 'Network Error';
            mockAxios.post.mockRejectedValue(new Error(errorMessage));

            await expect(budgetService.saveBudget(mockBudget))
                .rejects.toThrow(errorMessage);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'There was an error saving the budget: ',
                expect.any(Error)
            );
        });

        test('should handle empty budget object', async() => {
            const emptyBudget = {} as BudgetQuestions;
            await expect(budgetService.saveBudget(emptyBudget))
                .rejects.toThrow();
        });
        test('should handle malformed API response', async () => {
            const malformedResponse = { data: 'Not a budget object' };
            mockAxios.post.mockResolvedValue(malformedResponse);

            const result = await budgetService.saveBudget(mockBudget);

            expect(result).toEqual(malformedResponse);
        });

    })









})