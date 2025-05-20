import React, {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button, CircularProgress,
    Container,
    createTheme,
    CssBaseline, Divider,
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
import UserService from '../services/UserService';
import UserLogService from "../services/UserLogService";
import PlaidImportService from "../services/PlaidImportService";


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

// Theme Configuration
const theme = createTheme({
    palette: {
        background: {
            default: '#f8f9fa',
        },
        primary: {
            main: '#800000', // Maroon primary color
            light: '#9a3324',
            dark: '#600000',
        },
        secondary: {
            main: '#f8f0e5', // Light cream color for contrast
        },
        text: {
            primary: '#333333',
            secondary: '#666666',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
        body1: {
            fontSize: '0.95rem',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    textTransform: 'none',
                    padding: '10px 0',
                    fontWeight: 500,
                },
                contained: {
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                    },
                },
                outlined: {
                    borderColor: '#800000',
                    color: '#800000',
                    '&:hover': {
                        borderColor: '#600000',
                        backgroundColor: 'rgba(128, 0, 0, 0.04)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                            borderColor: '#800000',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                elevation3: {
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
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
    const [loginError, setLoginError] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string>('');
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const plaidLinkRef = useRef<PlaidLinkRef>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const plaidTransactionImport = PlaidImportService.getInstance();
    const plaidService = PlaidService.getInstance();

    const userLogService = UserLogService.getInstance();
    const userService = UserService.getInstance();
    const navigate = useNavigate();


    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const fetchUserEmailById = async(userId: number) : Promise<string> => {
        try
        {
            const response = await userService.findEmailByUserId(userId);
            return response;
        }catch(error){
            console.error('Error fetching email: ', error);
            throw new Error(`Failed to fetch email: ${error}`);
        }
    }

    const fetchUserFullNameById = async (userId: number): Promise<string> => {
        try {
            const storedUserId = Number(sessionStorage.getItem('userId'));
            console.log('UserId: ', storedUserId);
            const response = await userService.findFirstAndLastNameByUserId(storedUserId);
            console.log('Name response: ', response);
            return response;
        } catch (error) {
            console.error("Error fetching name: ", error);
            // Return a fallback value or re-throw the error to maintain the Promise<string> return type
            throw new Error(`Failed to fetch user name: ${error}`);
        }
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

// Modified handleSubmit function with enhanced Plaid open logic
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            // Validate form data
            if (!formData.email || !formData.password) {
                console.error('Email or password missing');
                return;
            }

            const loginData: LoginCredentials = {
                username: formData.email,
                password: formData.password,
            };
            sessionStorage.setItem('username', formData.email);
            console.log('LoginData: ', loginData);

            const response = await authenticateUser(loginData);
            if (!response) {
                console.error('Authentication failed: No response');
                return;
            }

            setIsAuthenticated(true);
            const loginService = new LoginService();
            const userId = await loginService.fetchUserIdByUsername(formData.email);
            if (!userId) {
                console.error('Failed to fetch userId');
                return;
            }

            console.log('UserID: ', userId);
            sessionStorage.setItem('userId', String(userId));
            let userFullName = await fetchUserFullNameById(userId);
            let userEmail = await fetchUserEmailById(userId);
            sessionStorage.setItem('fullName', userFullName);
            sessionStorage.setItem('email', userEmail);
            console.log('Is Authenticated: ', true);

            // Create user log for this login session
            await handleUserLogCreation(userId);
            const plaidService = PlaidService.getInstance();
            const plaidStatus = await handlePlaidLinkVerification(userId);
            console.log('Plaid Status: ', plaidStatus);
            if (!plaidStatus) {
                console.error('Error: Failed to verify Plaid link status');
                return;
            }
            console.log('Plaid Link Status: ', plaidStatus);
            // Handle Plaid linking or updating - ENHANCED LOGIC
            if (!plaidStatus.isLinked) {
                if (plaidStatus.requiresLinkUpdate) {
                    // Case 1: Link exists but needs update
                    console.log('Plaid link requires update, opening update mode...');
                    await openUpdateMode(userId);
                } else {
                    // Case 2: No link exists, need to create new one
                    console.log('Plaid not linked, creating link token...');
                    const linkResponse = await plaidService.createLinkToken();
                    // Enhanced error handling and logging for link token
                    if (!linkResponse || !linkResponse.linkToken) {
                        console.error('Failed to create link token:', linkResponse);
                        return;
                    }
                    console.log('Link token created successfully:', linkResponse.linkToken);
                    setLinkToken(linkResponse.linkToken);
                    // Add a small delay to ensure state updates before opening
                    setTimeout(() => {
                        if (plaidLinkRef.current) {
                            console.log('Opening Plaid Link window...');
                            plaidLinkRef.current.open();
                        } else {
                            console.error('Plaid Link reference is not available');
                        }
                    }, 500);
                }
                // Note: Navigation waits until Plaid linking/updating completes (via callback)
            } else {
                // Case 3: Link exists and is up-to-date
                console.log('Plaid linked and up-to-date, syncing transactions...');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            setIsAuthenticated(false); // Reset auth state on failure
            // Optionally notify user (e.g., setError('Login failed'))
        }
    };

    const handleUserLogCreation = async (userId: number) => {
        try {
            // Current time for the login timestamp
            const currentTime = new Date();

            // Create a new user log with login information
            // We set lastLogout to the same time temporarily (will be updated on logout)
            await userLogService.saveUserLog(
                userId,                // userId
                0,                     // sessionDuration (will be calculated on logout)
                1,                     // loginAttempts (new session)
                currentTime,           // lastLogin
                currentTime,           // lastLogout (placeholder, updated on actual logout)
            );

            console.log('User log created successfully for user ID:', userId);
        } catch (error) {
            console.error('Error creating user log:', error);
        }
    }

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
            if (!plaidStatus.isLinked || !accessToken)
            {
                console.warn('Plaid link is not active. Reconnecting...');
                const response = await plaidService.createLinkToken();
                setLinkToken(response.linkToken);
                return plaidStatus;
            }

            // Case 2: Plaid link requires update and access token exists
            if (plaidStatus.requiresLinkUpdate && accessToken) {
                console.warn('Plaid link requires update. Opening update mode...');
                await openUpdateMode(userId); // Pass userId; accessToken is handled in openUpdateMode
            }

            return plaidStatus;
        } catch (error) {
            console.error('Error verifying Plaid link:', error);
            throw error;
        }

    }

    const openUpdateMode = async (userId: number) => {
        try
        {
            console.log('UserID: ', userId);
            const accessToken = await plaidService.getAccessTokenForUser(userId);
            if(!accessToken){
                console.error("Access Token is null or unavailable for user: ", userId);
                return;
            }
            const linkToken = await plaidService.updatePlaidLink(userId, accessToken);
            if (!linkToken) {
                console.error("Failed to fetch update link token");
                return;
            }

            // Use the Plaid React hook to open update mode
            setLinkToken(linkToken);
            const waitForPlaidReady = (timeoutMs = 60000) => {
                return new Promise<void>((resolve, reject) => {
                    // If already ready, resolve immediately
                    if (ready) {
                        resolve();
                        return;
                    }

                    // Set a timeout for the maximum wait time
                    const timeout = setTimeout(() => {
                        clearInterval(checkInterval);
                        reject(new Error("Timed out waiting for Plaid to be ready"));
                    }, timeoutMs);

                    // Check periodically if Plaid is ready
                    const checkInterval = setInterval(() => {
                        if (ready) {
                            clearTimeout(timeout);
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 200); // Check every 200ms
                });
            };

            // Wait for Plaid to be ready with a generous timeout
            await waitForPlaidReady();
            console.log("Plaid is ready, opening update mode...");
            open();
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
            const userId = Number(sessionStorage.getItem('userId'));
            const response = await plaidService.exchangePublicToken(publicToken, userId);
            const plaidLinkResponse = await handlePlaidLinkSaveResponse(response);

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

                    const currentMonth = new Date().getMonth();
                    const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
                    const endDate = new Date().toISOString().split('T')[0];
                    console.info("Importing Plaid Transactions");
                    await plaidTransactionImport.importPlaidTransactions(userId, startDate, endDate);

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
            <Container component="main" maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        marginTop: 8,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Grid container>
                        {/* Left side decoration */}
                        <Grid
                            item
                            xs={0}
                            sm={4}
                            sx={{
                                background: 'linear-gradient(135deg, #800000 0%, #600000 100%)',
                                display: { xs: 'none', sm: 'flex' },
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                py: 8,
                                color: 'white',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    px: 3
                                }}
                            >
                                <Avatar
                                    sx={{
                                        m: 1,
                                        bgcolor: 'white',
                                        color: '#800000',
                                        width: 56,
                                        height: 56
                                    }}
                                >
                                    <LockOutlined />
                                </Avatar>
                                <Typography
                                    component="h1"
                                    variant="h4"
                                    sx={{ mt: 1, fontWeight: 600, textAlign: 'center' }}
                                >
                                    Budget Buddy
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ mt: 2, textAlign: 'center', opacity: 0.9 }}
                                >
                                    Your personal finance assistant
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Right side login form */}
                        <Grid item xs={12} sm={8}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 4,
                                }}
                            >
                                {/* Mobile only logo */}
                                <Box
                                    sx={{
                                        display: { xs: 'flex', sm: 'none' },
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        mb: 3
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            m: 1,
                                            bgcolor: '#800000',
                                            width: 56,
                                            height: 56
                                        }}
                                    >
                                        <LockOutlined />
                                    </Avatar>
                                    <Typography
                                        component="h1"
                                        variant="h5"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Budget Buddy
                                    </Typography>
                                </Box>

                                <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
                                    Sign in to your account
                                </Typography>

                                {loginError && (
                                    <Alert
                                        severity="error"
                                        sx={{ width: '100%', mb: 2 }}
                                    >
                                        {loginError}
                                    </Alert>
                                )}

                                <Box
                                    component="form"
                                    onSubmit={handleSubmit}
                                    sx={{ width: '100%' }}
                                >
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
                                        error={!!formErrors.username}
                                        helperText={formErrors.username}
                                        sx={{ mb: 2 }}
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
                                        error={!!formErrors.password}
                                        helperText={formErrors.password}
                                        sx={{ mb: 1 }}
                                    />

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                        <Link
                                            href="/forgot-password"
                                            variant="body2"
                                            sx={{
                                                color: 'primary.main',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            Forgot Password?
                                        </Link>
                                    </Box>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        sx={{
                                            mt: 1,
                                            mb: 2,
                                            height: 48,
                                            fontSize: '1rem'
                                        }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Sign In'
                                        )}
                                    </Button>

                                    <Divider sx={{ my: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            OR
                                        </Typography>
                                    </Divider>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        sx={{
                                            mb: 2,
                                            height: 48,
                                            fontSize: '1rem'
                                        }}
                                        onClick={handleRegister}
                                    >
                                        Create New Account
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
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </ThemeProvider>
    );

    // return (
    //     <ThemeProvider theme={theme}>
    //         <CssBaseline />
    //         <Container component="main" maxWidth="xs">
    //             <Paper elevation={3} sx={{
    //                 marginTop: 8,
    //                 display: 'flex',
    //                 flexDirection: 'column',
    //                 alignItems: 'center',
    //                 padding: 3
    //             }}>
    //                 <LockOutlined sx={{ m: 1, bgcolor: 'secondary.main', padding: 1, borderRadius: '50%', color: 'white' }} />
    //                 <Typography component="h1" variant="h5">
    //                     Sign in to Budget Buddy
    //                 </Typography>
    //                 <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         id="email"
    //                         label="Email Address"
    //                         name="email"
    //                         autoComplete="email"
    //                         autoFocus
    //                         value={formData.email}
    //                         onChange={handleChange}
    //                     />
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="password"
    //                         label="Password"
    //                         type="password"
    //                         id="password"
    //                         autoComplete="current-password"
    //                         value={formData.password}
    //                         onChange={handleChange}
    //                     />
    //                     <Grid container justifyContent="flex-start">
    //                         <Grid item>
    //                             <Link href="/forgot-password" variant="body1">
    //                                 Forgot Password?
    //                             </Link>
    //                         </Grid>
    //                     </Grid>
    //                     <Button
    //                         type="submit"
    //                         fullWidth
    //                         variant="contained"
    //                         sx={{ mt: 3, mb: 2 }}
    //                     >
    //                         Sign In
    //                     </Button>
    //                     <Button
    //                         fullWidth
    //                         variant="outlined"
    //                         sx={{mb: 2}}
    //                         onClick={handleRegister}>
    //                         Register
    //                     </Button>
    //                     {linkToken && (
    //                         <PlaidLink
    //                           linkToken={linkToken}
    //                           onSuccess={handlePlaidSuccess}
    //                           onConnect={handlePlaidReady}
    //                           ref={plaidLinkRef}
    //                           />
    //
    //                     )}
    //                 </Box>
    //             </Paper>
    //         </Container>
    //     </ThemeProvider>
    // );
};

export default LoginForm;