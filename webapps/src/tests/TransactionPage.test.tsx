// import React from 'react';
// import {render, screen, fireEvent, within} from '@testing-library/react';
// import '@testing-library/jest-dom';
// import TransactionsPage from "../components/TransactionsPage";
// import {Router} from "react-router-dom";
// import userEvent from "@testing-library/user-event";
//
//
// // Mock the Sidebar component
// jest.mock('../components/Sidebar', () => {
//     return {
//         __esModule: true,
//         default: () => <div data-testid="sidebar-mock">Mocked Sidebar</div>,
//     };
// });
//
//
// describe('TransactionsPage', () => {
//
//     const renderComponent = () => {
//         return render(
//             <TransactionsPage />
//         );
//     };
//
//     beforeEach(() => {
//         renderComponent();
//     });
//
//     test('renders the Transactions title', () => {
//         expect(screen.getByText('Transactions')).toBeInTheDocument();
//     });
//     test('renders the search bar', () => {
//         expect(screen.getByPlaceholderText('Search your transactions...')).toBeInTheDocument();
//     });
//
//     test('renders filter buttons', () => {
//         const dateButton = screen.getByRole('button', { name: 'Date' });
//         const categoryButton = screen.getByRole('button', { name: 'Category' });
//         const accountButton = screen.getByRole('button', { name: 'Account' });
//         const amountButton = screen.getByRole('button', { name: 'Amount' });
//
//         expect(dateButton).toBeInTheDocument();
//         expect(categoryButton).toBeInTheDocument();
//         expect(accountButton).toBeInTheDocument();
//         expect(amountButton).toBeInTheDocument();
//     });
//
//     test('renders export and sort buttons', () => {
//         expect(screen.getByText('Export')).toBeInTheDocument();
//         expect(screen.getByText('Sort by date')).toBeInTheDocument();
//     });
//
//     test('renders the transactions table with correct headers', () => {
//         const table = screen.getByRole('table');
//         expect(table).toBeInTheDocument();
//
//         const headers = within(table).getAllByRole('columnheader');
//         expect(headers).toHaveLength(6);
//
//         expect(headers[1]).toHaveTextContent('Date');
//         expect(headers[2]).toHaveTextContent('Name');
//         expect(headers[3]).toHaveTextContent('Category');
//         expect(headers[4]).toHaveTextContent('Actions');
//         expect(headers[5]).toHaveTextContent('Amount');
//     });
//
//     test('renders transaction rows', () => {
//         const rows = screen.getAllByRole('row');
//         expect(rows).toHaveLength(3);
//
//         // Check contents of the first transaction row
//         const firstRow = rows[1]; // Index 0 is the header row
//         expect(within(firstRow).getByText('WinCo')).toBeInTheDocument();
//         expect(within(firstRow).getByText('Groceries')).toBeInTheDocument();
//         expect(within(firstRow).getByText('$22.16')).toBeInTheDocument();
//
//         // Check contents of the second transaction row
//         const secondRow = rows[2];
//         expect(within(secondRow).getByText('Affirm')).toBeInTheDocument();
//         expect(within(secondRow).getByText('Loan Payment')).toBeInTheDocument();
//         expect(within(secondRow).getByText('$19.54')).toBeInTheDocument();
//     });
//
//
//     test('displays correct number of transactions', () => {
//         const rows = screen.getAllByRole('row');
//         // 2 transactions + 1 header row
//         expect(rows).toHaveLength(3);
//     });
//
//     test('displays transaction details correctly', () => {
//         expect(screen.getByText('WinCo')).toBeInTheDocument();
//         expect(screen.getByText('Affirm')).toBeInTheDocument();
//         expect(screen.getByText('$22.16')).toBeInTheDocument();
//         expect(screen.getByText('$19.54')).toBeInTheDocument();
//     });
//
//     test('allows changing transaction category', async () => {
//         render(<TransactionsPage/>);
//
//         // Find all category dropdown buttons within the table
//         const table = screen.getAllByRole('table')[0];
//         const categoryButtons = within(table).getAllByRole('button', { name: /(groceries|loan payment)/i });
//
//         expect(categoryButtons).toHaveLength(2); // Assuming two transactions
//
//         // Check initial values
//         expect(categoryButtons[0]).toHaveTextContent(/groceries/i);
//         expect(categoryButtons[1]).toHaveTextContent(/loan payment/i);
//
//         // Open the category dropdown for the first transaction
//         await userEvent.click(categoryButtons[0]);
//
//         // Find and click the "Dining & Drinks" option
//         const diningOption = await screen.findByRole('option', { name: /dining & drinks/i });
//         await userEvent.click(diningOption);
//
//         // Check if the category has been updated
//         expect(categoryButtons[0]).toHaveTextContent(/dining & drinks/i);
//
//         // The second dropdown should remain unchanged
//         expect(categoryButtons[1]).toHaveTextContent(/loan payment/i);
//     });
//
//
//     test('renders transaction logos', () => {
//         const logos = screen.getAllByRole('img');
//         expect(logos).toHaveLength(2);
//         expect(logos[0]).toHaveAttribute('alt', 'WinCo Foods logo');
//         expect(logos[1]).toHaveAttribute('alt', 'Affirm logo');
//     });
//
//     test('renders edit and delete buttons for each transaction', () => {
//         const rows = screen.getAllByRole('row').slice(1); // Exclude header row
//         rows.forEach((row) => {
//             const withinRow = within(row);
//             expect(withinRow.getByRole('button', { name: /edit/i })).toBeInTheDocument();
//             expect(withinRow.getByRole('button', { name: /delete/i })).toBeInTheDocument();
//         });
//     });
// })