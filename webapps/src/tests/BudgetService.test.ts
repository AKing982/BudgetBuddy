import BudgetService from '../services/BudgetService';
import axios from "axios";
import { jest } from '@jest/globals';
import { BudgetQuestions } from "../utils/BudgetUtils";
import LoginService from "../services/LoginService";
import { SavingsGoalData } from "../components/SavingsGoalQuestions";
import { SpendingCategory } from "../components/SpendingControlQuestions";
import { DebtPayoffData } from "../components/DebtPayoffQuestions";
import BudgetSetupService from "../services/BudgetSetupService";

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../services/LoginService');
jest.mock('../services/BudgetSetupService');

describe('BudgetService', () => {
    let budgetService: BudgetService;
    let mockLoginService: jest.Mocked<LoginService>;
    let mockBudgetSetupService: jest.Mocked<BudgetSetupService>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLoginService = {
            fetchUserIdByUsername: jest.fn(),
            fetchMaximumUserId: jest.fn(),
        } as jest.Mocked<LoginService>;

        mockBudgetSetupService = {
            calculateMonthlyAllocationNeeded: jest.fn(),
            calculateExpectedSavingsDeadline: jest.fn(),
            getBudgetModeByBudgetType: jest.fn(),
            calculateBudgetDateRanges: jest.fn(),
            calculateTotalDateRange: jest.fn(),
            calculateNumberOfMonths: jest.fn(),
            startBudgetSetupProcess: jest.fn(),
        } as jest.Mocked<BudgetSetupService>;

        budgetService = BudgetService.getInstance();
        (budgetService as any).loginService = mockLoginService;
        // Assuming BudgetService might use BudgetSetupService internally
        (budgetService as any).budgetSetupService = mockBudgetSetupService;
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

        test('should throw error when savingsGoalData is null for savings budget', async () => {
            const budgetData: BudgetQuestions = {
                budgetType: 'Saving for a goal',
                monthlyIncome: 5000,
                expenseCategories: [],
                financialGoal: {} as any,
            };
            await expect(budgetService.createBudgetRequest(budgetData))
                .rejects.toThrow('SavingsGoalData found null');
        });

        test('should create a Savings Budget request with calculated values', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const startDate = new Date('2025-02-25').getTime();
            const targetDate = new Date('2026-02-25').getTime();

            mockBudgetSetupService.calculateMonthlyAllocationNeeded.mockReturnValue(833.33);
            mockBudgetSetupService.calculateExpectedSavingsDeadline.mockReturnValue(targetDate);

            const savingsGoalData: SavingsGoalData = {
                goalName: 'Vacation Fund',
                goalDescription: 'Save for a summer vacation',
                targetAmount: 10000,
                currentSavings: 1000,
                savingsFrequency: 'monthly',
                targetDate: '2026-02-25', // Calculated by BudgetSetupService
                monthlyAllocation: 833.33, // Calculated by BudgetSetupService
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
                    monthlyAllocation: savingsGoalData.monthlyAllocation,
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
                totalBudgetAmount: 0, // Adjust if calculateTotalBudgetAmount is used
                monthlyIncome: 5000,
                startDate: expect.any(Date),
                endDate: '2026-02-25',
            });

            expect(mockBudgetSetupService.calculateMonthlyAllocationNeeded).toHaveBeenCalledWith(
                expect.any(Number), // startDate
                new Date('2026-02-25').getTime(),
                10000,
                1000
            );
            expect(mockBudgetSetupService.calculateExpectedSavingsDeadline).toHaveBeenCalledWith(
                expect.any(Number), // startDate
                10000,
                833.33,
                1000
            );
        });

        test('should create a Spending Control Budget Request', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(2);
            const spendingControlData: SpendingCategory[] = [
                { id: '1', name: 'Groceries', currentSpending: 600, spendingLimit: 500, reductionPriority: 2 },
                { id: '2', name: 'Entertainment', currentSpending: 300, spendingLimit: 200, reductionPriority: 1 },
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
                    { type: 'Credit Card', amount: 6300, allocation: 250, targetDate: new Date('2025-01-25') },
                ],
                otherDebtType: 'Personal Loan',
                otherDebtAmount: 3000,
                otherDebtAllocation: 300,
                otherDebtTargetDate: new Date('2025-10-16'),
            };
            const budgetData: BudgetQuestions = {
                budgetType: 'Paying off debt',
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
            if (result.endDate) {
                const expectedDate = new Date('2025-10-16');
                if (result.endDate instanceof Date) {
                    expect(result.endDate.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0]);
                } else if (typeof result.endDate === 'string') {
                    expect(result.endDate).toBe(expectedDate.toISOString().split('T')[0]);
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
                monthlyAllocation: 0, // Will be calculated, but test expects rejection first
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
    });

    describe('calculateTotalBudgetAmount tests', () => {
        beforeEach(() => {
            budgetService = BudgetService.getInstance();
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

        // Other calculateTotalBudgetAmount tests remain unchanged unless they need adjustment for new logic
    });

    describe('saveBudget tests', () => {
        const apiUrl = 'http://localhost:8080';
        let consoleErrorSpy: jest.SpiedFunction<any>;

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
            savingsGoalData: {
                goalName: 'Test Goal',
                goalDescription: 'Test Description',
                targetAmount: 10000,
                currentSavings: 1000,
                savingsFrequency: 'monthly',
                targetDate: '2024-12-31',
                monthlyAllocation: 833.33, // Calculated value
            }
        };

        test('should successfully save a budget', async () => {
            mockLoginService.fetchMaximumUserId.mockResolvedValue(1);
            const mockResponse = { data: { id: 1, ...mockBudget } };
            mockAxios.post.mockResolvedValue(mockResponse);
            const result = await budgetService.saveBudget(mockBudget);

            expect(result).toEqual(mockResponse);
            expect(mockAxios.post).toHaveBeenCalledWith(`${apiUrl}/api/budgets/`, expect.objectContaining({
                userId: 1,
                budgetName: 'Test Budget',
                budgetDescription: 'Test Description',
                monthlyIncome: 5000,
                startDate: expect.any(Date),
                endDate: expect.any(Date),
            }));
        });

        // Other saveBudget tests remain largely unchanged unless BudgetService logic changes
    });
});