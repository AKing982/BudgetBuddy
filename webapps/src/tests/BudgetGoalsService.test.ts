import BudgetGoalsService, {BudgetGoal} from "../services/BudgetGoalsService";

import axios from "axios";

jest.mock('axios');

// A mock for our API call
const mockPost = axios.post as jest.MockedFunction<typeof axios.post>;

const apiUrl: string = 'https://localhost:8080'; // Replace with your API url

describe('BudgetGoalsService', () => {

    beforeEach(() => {
        mockPost.mockClear();
    });

    const budgetGoalsService = BudgetGoalsService.getInstance();
    test('createBudgetGoal should create new budget goal ', async () => {

        const budgetGoal: BudgetGoal = {
            id: 1,
            budgetId: 1,
            goalName: 'Add to Savings',
            goalDescription: 'Add $1200 to savings account',
            goalType: 'Savings',
            targetAmount: 1000,
            monthlyAllocation: 0,
            currentSavings: 120,
            savingsFrequency: 'Monthly',
            status: 'Active'
        };

        const expectedResponse = {...budgetGoal, id: '123'}

        const createdBudget = await budgetGoalsService.createBudgetGoal(budgetGoal);
        expect(mockPost).toHaveBeenCalledWith(`${apiUrl}/budget-goals`, budgetGoal);
        expect(createdBudget).toEqual(expectedResponse);
    });
})

