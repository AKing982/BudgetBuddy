import {MemoryRouter, Router, useNavigate} from "react-router-dom";
import BudgetQuestionnaireForm from "../components/BudgetQuestionnaireForm";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('BudgetQuestionnaireForm', () => {
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        render(
            <MemoryRouter>
                <BudgetQuestionnaireForm onSubmit={mockOnSubmit}/>
            </MemoryRouter>
        );
    });

    test('renders the initial budget type selection step', () => {
        expect(screen.getByText('Create Your Personalized Budget')).toBeInTheDocument();
        expect(screen.getByText('Select Your Budget Type')).toBeInTheDocument();
        expect(screen.getByText('Saving for a goal')).toBeInTheDocument();
        expect(screen.getByText('Paying off debt')).toBeInTheDocument();
        expect(screen.getByText('Controlling spending')).toBeInTheDocument();
        expect(screen.getByText('Building emergency fund')).toBeInTheDocument();
    });
    test('navigates to income step when a budget type is selected', () => {
        fireEvent.click(screen.getByText('Saving for a goal'));
        expect(screen.getByText('Enter Your Income')).toBeInTheDocument();
        expect(screen.getByLabelText('Monthly Income')).toBeInTheDocument();
    });
    test('allows entering monthly income', () => {
        fireEvent.click(screen.getByText('Saving for a goal'));
        const incomeInput = screen.getByLabelText('Monthly Income');
        fireEvent.change(incomeInput, { target: { value: '5000' } });
        expect(incomeInput).toHaveValue(5000);
    });
    test('navigates through all steps for a savings goal budget', async () => {
        // Step 1: Select budget type
        fireEvent.click(screen.getByText('Saving for a goal'));

        // Step 2: Enter income
        const incomeInput = screen.getByLabelText('Monthly Income');
        fireEvent.change(incomeInput, { target: { value: '5000' } });
        fireEvent.click(screen.getByText('Next'));

        // Step 3: Enter savings goal details
        const goalNameInput = screen.getByLabelText('Goal Name');
        fireEvent.change(goalNameInput, { target: { value: 'New Car' } });

        const targetAmountInput = screen.getByLabelText('Target Amount');
        fireEvent.change(targetAmountInput, { target: { value: '20000' } });

        const currentSavingsInput = screen.getByLabelText('Current Savings');
        fireEvent.change(currentSavingsInput, { target: { value: '5000' } });

        fireEvent.click(screen.getByText('Next'));

        // Step 4: Review
        expect(await screen.findByText('Review Your Budget')).toBeInTheDocument();
        expect(screen.getAllByText('Budget Type')[1]).toBeInTheDocument();
        expect(screen.getByText('Saving for a goal')).toBeInTheDocument();
        expect(screen.getByText('Monthly Income')).toBeInTheDocument();
        expect(screen.getByText('$5000.00')).toBeInTheDocument();
        expect(screen.getByText('Savings Goal')).toBeInTheDocument();
        expect(screen.getByText(/Goal Name: New Car/)).toBeInTheDocument();
        expect(screen.getByText(/Target Amount: \$20000/)).toBeInTheDocument();
        expect(screen.getByText(/Current Savings: \$5000/)).toBeInTheDocument();

        // Submit the form
        fireEvent.click(screen.getByText('Finish and Create Budget'));

        const submitButton = screen.getByText('Finish and Create Budget');
        expect(submitButton).toBeInTheDocument();

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        }, { timeout: 5000 });

        if (!mockOnSubmit.mock.calls.length) {
            console.error('mockOnSubmit was not called. Current component state:', screen.debug());
        }

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
})