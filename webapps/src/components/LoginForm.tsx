import React, {FormEvent, useCallback, useRef, useState} from 'react';
import {
    Box,
    Button,
    Container,
    createTheme,
    CssBaseline,
    Grid,
    Link,
    Paper,
    TextField,
    ThemeProvider,
    Typography
} from '@mui/material';
import {LockOutlined} from '@mui/icons-material';
import {useNavigate} from "react-router-dom";
import {authenticateUser, LoginCredentials} from "../api/LoginApiService";
import {PlaidLinkOnSuccessMetadata, usePlaidLink} from "react-plaid-link";
import PlaidService from "../services/PlaidService";
import PlaidLink, {PlaidLinkRef} from "./PlaidLink";
import LoginService from "../services/LoginService";
import loginService from "../services/LoginService";
import RecurringTransactionService from "../services/RecurringTransactionService";
import {be} from "date-fns/locale";
import BudgetService from "../services/BudgetService";
import TransactionRunnerService from "../services/TransactionRunnerService";
import TransactionCategoryRunnerService from "../services/TransactionCategoryRunnerService";


interface LoginFormData {
    email: string;
    password: string;
}

interface FormErrors {
    username?: string;
    password?: string;

}

interface PlaidLinkStatus {
    isLinked: boolean;
    requiresLinkUpdate: boolean;
}


interface PlaidExchangeResponse {
    accessToken: string;
    itemID: string;
    userID: bigint;
}

const theme = createTheme({
    palette: {
        background: {
            default: '#f5e6d3', // Beige background
        },
        primary: {
            main: '#800000', // Maroon for primary color (buttons)
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0, // Flat buttons
                    textTransform: 'none', // Prevents all-caps text
                },
                contained: {
                    boxShadow: 'none', // Removes default shadow for a flatter look
                    '&:hover': {
                        boxShadow: 'none', // Keeps it flat on hover
                    },
                },
                outlined: {
                    borderColor: '#800000', // Maroon border for outlined button
                    color: '#800000', // Maroon text for outlined button
                    '&:hover': {
                        borderColor: '#600000', // Darker on hover
                        backgroundColor: 'rgba(128, 0, 0, 0.04)', // Slight background change on hover
                    },
                },
            },
        },
    },
});

const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const plaidLinkRef = useRef<PlaidLinkRef>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const budgetService = BudgetService.getInstance();
    const transactionRunnerService = TransactionRunnerService.getInstance();
    const plaidService = PlaidService.getInstance();
    const transactionCategoryRunnerService = TransactionCategoryRunnerService.getInstance();

    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: async (publicToken, metadata) => {
            console.log("Plaid re-authentication successful!", metadata);
            await plaidService.exchangePublicToken(publicToken, Number(sessionStorage.getItem("userId")));
            console.log("Plaid access token updated successfully!");
        },
        onExit: (error, metadata) => {
            if (error) {
                console.error("Error exiting Plaid Link:", error);
            }
        },
    });


    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if(!formData.email) newErrors.username = 'UserName or Email is required';
        if(!formData.password) newErrors.password = 'Password is required';
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try
        {
            const loginData: LoginCredentials = {
                username: formData.email,
                password: formData.password
            };
            sessionStorage.setItem('username',formData.email);
            console.log('LoginData: ', loginData);
            const response = await authenticateUser(loginData);
            setIsAuthenticated(true);
            const loginService = new LoginService();
            const userId = await loginService.fetchUserIdByUsername(formData.email);
            console.log('UserID: ', userId);
            sessionStorage.setItem('userId', String(userId));
            if(response != null){
                console.log('Is Authenticated: ', isAuthenticated);
                const plaidService = PlaidService.getInstance();
                // Fetch the link token

                const isPlaidLinkedResponse = await handlePlaidLinkVerification(userId);
                console.log('Plaid Link Response: ', isPlaidLinkedResponse);
                if(!isPlaidLinkedResponse){
                    console.error("Error: Failed to verify Plaid link status, defaulting to not linked.");
                    return;
                }
                const isPlaidLinked = isPlaidLinkedResponse.isLinked;
                const requiresLinkUpdate = isPlaidLinkedResponse.requiresLinkUpdate;
                console.log('Requires Update: ', requiresLinkUpdate);
                if(!isPlaidLinked){
                    const response = await plaidService.createLinkToken();

                    console.log('Response: ', response);
                    console.log('Link Token: ', response.linkToken);
                    setLinkToken(response.linkToken);

                    if(plaidLinkRef.current){
                        plaidLinkRef.current.open();
                        // Fetch and link plaid accounts

                    }
                }else if(requiresLinkUpdate){
                    console.log('Updating Plaid Link automatically...');
                    await openUpdateMode(userId);
                } else{
                    try {

                        await transactionRunnerService.syncTransactions(userId);
                        console.log('Transaction sync completed');

                        const result = await transactionCategoryRunnerService.processCurrentMonthTransactionCategories(userId);
                        if(!result.success){
                            console.error('Error Processing transaction categories: ', result.error);
                        }else{
                            console.log('Transaction Categories already processed for user: ', userId);
                        }
                    } catch (error) {
                        console.error('Error syncing transactions:', error);
                    }
                    navigate('/dashboard')
                }
            }
            console.log('Response: ', response);
            // await new Promise(resolve => setTimeout(resolve, 3000));
        }catch(err)
        {
            console.error(err);
        }
    };


    const handleRegister = () => {
        navigate('/register');
    }

    const handlePlaidReady = useCallback(() => {
        if(plaidLinkRef.current){
            plaidLinkRef.current.open()
        }
    }, []);

    const handlePlaidLinkSaveResponse = async (response: PlaidExchangeResponse) : Promise<void> => {
        const {accessToken, itemID , userID} = response;
        try
        {
            console.log('AccessToken: ', accessToken);
            console.log('ItemID: ', itemID);
            console.log('UserID: ', userID);
            const plaidService = PlaidService.getInstance();
            const response = await plaidService.savePlaidLinkToDatabase(accessToken, itemID, userID);
            if(response.status === 201){
                return response.data;
            }
        }catch(error)
        {
            console.error('There was an error saving the plaid link to the server: ', error);
            throw error;
        }
    }

    const handlePlaidLinkVerification = async (userId: number) : Promise<PlaidLinkStatus>  => {
        try
        {

            const plaidStatus = await plaidService.checkPlaidLinkStatusByUserId(userId);
            // Fetch access token from session storage or backend
            const accessToken = await plaidService.getAccessTokenForUser(userId);
            if (!plaidStatus.isLinked)
            {
                console.warn('Plaid link is not active. Reconnecting...');
                const response = await plaidService.createLinkToken();
                setLinkToken(response.linkToken);
            }
            else if (plaidStatus.requiresLinkUpdate && accessToken)
            {
                console.warn('Plaid link requires update. Opening update mode...');
                if(accessToken){
                    await openUpdateMode(userId);
                }
            }
            return plaidStatus;
        } catch (error) {
            console.error('Error verifying Plaid link:', error);
            throw error;
        }

    }

    const openUpdateMode = async (userId: number) => {
        try {
            const accessToken = await plaidService.getAccessTokenForUser(userId);
            const linkToken = await plaidService.updatePlaidLink(userId, accessToken);
            if (!linkToken) {
                console.error("Failed to fetch update link token");
                return;
            }

            // Use the Plaid React hook to open update mode
            setLinkToken(linkToken);

            // Ensure Plaid is ready before opening update mode
            let attempts = 0;
            const maxAttempts = 10;

            while (!ready && attempts < maxAttempts) {
                console.warn(`Waiting for Plaid to be ready... (${attempts + 1}/${maxAttempts})`);
                await new Promise((resolve) => setTimeout(resolve, 3500)); // Wait 500ms before checking again
                attempts++;
            }

            if (ready) {
                console.log("Opening Plaid update mode...");
                open();
            } else {
                console.error("Plaid did not become ready in time. Update mode not opened.");
            }
        } catch (error) {
            console.error("Error opening Plaid update mode:", error);
        }
    };

    const handlePlaidSuccess = useCallback(async(publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
        if(isProcessing) return;
        setIsProcessing(true);
        try
        {
            const plaidService = PlaidService.getInstance();
            const recurringTransactionService = new RecurringTransactionService();

            const loginService = new LoginService();
            const username: string | null = sessionStorage.getItem('username');
            const userId = Number(sessionStorage.getItem('userId'));

            const response = await plaidService.exchangePublicToken(publicToken, userId);

            const plaidLinkResponse = await handlePlaidLinkSaveResponse(response);

            // setTimeout(async() => {
            //     const linkedAccounts = await plaidService.fetchAndLinkPlaidAccounts(userId);
            //     console.log('Linked Accounts: ', linkedAccounts);
            //     const previousMonth = new Date().getMonth() - 1;
            //     const currentYear = new Date().getFullYear();
            //     const beginningPreviousMonth = new Date(currentYear, previousMonth, 1).toISOString().split('T')[0];
            //     const startDate = (new Date().getMonth() - 1);
            //     const endDate = new Date().toISOString().split('T')[0];
            //     const savedTransactions = await plaidService.fetchAndSaveTransactions(beginningPreviousMonth, endDate, userId);
            //     console.log('Saved Transactions: ', savedTransactions);
            //
            //     const savedRecurringTransactions = await recurringTransactionService.addRecurringTransactions();
            //     console.log('Saved Recurring Transactions: ', savedRecurringTransactions);
            //     try
            //     {
            //
            //         await transactionRunnerService.syncTransactions(userId);
            //         console.log('Initial Transaction Sync completed.');
            //     }catch(error){
            //         console.error('Error syncing transactions: ', error);
            //     }
            //
            // }, 6000);
            // Use Promise instead of setTimeout
            await new Promise<void>(async (resolve) => {
                try {
                    // Link accounts
                    const linkedAccounts = await plaidService.fetchAndLinkPlaidAccounts(userId);
                    console.log('Linked Accounts:', linkedAccounts);
                    if (!linkedAccounts) {
                        throw new Error('Failed to link accounts');
                    }

                    // Save transactions
                    const previousMonth = new Date().getMonth() - 1;
                    const currentYear = new Date().getFullYear();
                    const beginningPreviousMonth = new Date(currentYear, previousMonth, 1)
                        .toISOString().split('T')[0];
                    const endDate = new Date().toISOString().split('T')[0];

                    const savedTransactions = await plaidService.fetchAndSaveTransactions(
                        beginningPreviousMonth,
                        endDate,
                        userId
                    );
                    if (!savedTransactions) {
                        throw new Error('Failed to save transactions');
                    }
                    console.log('Saved Transactions:', savedTransactions);

                    // Save recurring transactions
                    const savedRecurringTransactions = await recurringTransactionService.addRecurringTransactions();
                    if (!savedRecurringTransactions) {
                        throw new Error('Failed to save recurring transactions');
                    }
                    console.log('Saved Recurring Transactions:', savedRecurringTransactions);

                    // Sync everything
                    await transactionRunnerService.syncTransactions(userId);
                    console.log('Initial Transaction Sync completed');

                    // Process categories
                    const processingResult = await transactionCategoryRunnerService
                        .processCurrentMonthTransactionCategories(userId);
                    if (!processingResult.success) {
                        throw new Error(`Failed to process categories: ${processingResult.error}`);
                    }

                    resolve();
                } catch (error) {
                    console.error('Error during Plaid setup:', error);
                    throw error;
                }
            });

            navigate('/dashboard');
        }catch(error)
        {
            console.error('Error exchanging public token: ', error);
        }finally{
            setIsProcessing(false);
        }
        console.log('Plaid Connection Successful', publicToken, metadata)


    }, [navigate]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container component="main" maxWidth="xs">
                <Paper elevation={3} sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 3
                }}>
                    <LockOutlined sx={{ m: 1, bgcolor: 'secondary.main', padding: 1, borderRadius: '50%', color: 'white' }} />
                    <Typography component="h1" variant="h5">
                        Sign in to Budget Buddy
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <Grid container justifyContent="flex-start">
                            <Grid item>
                                <Link href="/forgot-password" variant="body1">
                                    Forgot Password?
                                </Link>
                            </Grid>
                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign In
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            sx={{mb: 2}}
                            onClick={handleRegister}>
                            Register
                        </Button>
                        {linkToken && (
                            <PlaidLink
                              linkToken={linkToken}
                              onSuccess={handlePlaidSuccess}
                              onConnect={handlePlaidReady}
                              ref={plaidLinkRef}
                              />

                        )}
                    </Box>
                </Paper>
            </Container>
        </ThemeProvider>
    );
};

export default LoginForm;