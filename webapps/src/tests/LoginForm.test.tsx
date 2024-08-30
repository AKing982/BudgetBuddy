import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginForm from '../components/LoginForm';
import { PlaidLink } from 'react-plaid-link';
import userEvent from "@testing-library/user-event";

// A mock of the PlaidLink component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));


jest.mock('react-plaid-link', () => {
  return {
    __esModule: true,  
    PlaidLink: jest.fn().mockImplementation(({ onSuccess, onConnect }) => {
      return <button onClick={onSuccess} ></button>;
    }),
  };
});

describe('LoginForm Test', () => {
  it('should update value when input fields are changed', async () => {
    const {getByLabelText} = render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {name: /email address/i}) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(passwordInput, 'password');

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password');
  });

  it('should call PlaidLink onSuccess when PlaidLink button is clicked', async () => {
    render(<LoginForm />);

    const plaidLinkToken = screen.getByRole('button', {name: /connect to plaid/i});
    userEvent.click(plaidLinkToken);

    expect(PlaidLink).toHaveBeenCalledWith(
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
        {}
    );
  });

  it('should update form data state when inputs are changed', async () => {
    let setFormData = jest.fn();
    React.useState = jest.fn(() => ['', setFormData]);

    const { getByLabelText } = render(<LoginForm />);

    const emailInput = getByLabelText('Email Address');
    const passwordInput = getByLabelText('Password');
    expect(setFormData.mock.calls.length).toBe(2);
  });
});