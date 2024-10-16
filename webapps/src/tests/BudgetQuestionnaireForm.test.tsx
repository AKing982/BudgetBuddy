import {Router, useNavigate} from "react-router-dom";
import BudgetQuestionnaireForm from "../components/BudgetQuestionnaireForm";
import {render, screen, fireEvent} from "@testing-library/react";

jest.mock('../services/BudgetService');
jest.mock('../services/BudgetGoalService');
jest.mock('../services/BudgetCategoriesService');
jest.mock('../services/LoginService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('BudgetQuestionnaireForm', () => {
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        render(
            <Router>
                <BudgetQuestionnaireForm onSubmit={mockOnSubmit}/>
            </Router>
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
})