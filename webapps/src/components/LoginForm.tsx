import React, {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import {
    Alert,
    Box,
    Button, CircularProgress,
    Container,
    createTheme,
    CssBaseline,
    Link,
    Paper,
    TextField,
    ThemeProvider,
    Typography,
    InputAdornment,
    IconButton,
    Switch,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {useNavigate} from "react-router-dom";
import {authenticateUser, LoginCredentials} from "../api/LoginApiService";
import {PlaidLinkOnSuccessMetadata} from "react-plaid-link";
import PlaidService from "../services/PlaidService";
import PlaidLink, {PlaidLinkRef} from "./PlaidLink";
import LoginService from "../services/LoginService";
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

const theme = createTheme({
    palette: {
        background: { default: '#d6d6d6' },
        primary: {
            main: '#800000',
            light: '#9a3324',
            dark: '#600000',
        },
        secondary: { main: '#f8f0e5' },
        text: {
            primary: '#333333',
            secondary: '#666666',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h5: { fontWeight: 700 },
        body1: { fontSize: '0.95rem' },
        body2: { fontSize: '0.875rem' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 50,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '12px 0',
                },
                contained: {
                    backgroundColor: '#800000',
                    boxShadow: '0 2px 8px rgba(128,0,0,0.25)',
                    '&:hover': {
                        backgroundColor: '#600000',
                        boxShadow: '0 4px 12px rgba(128,0,0,0.35)',
                        transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                },
                outlined: {
                    borderColor: '#800000',
                    borderWidth: '2px',
                    color: '#800000',
                    '&:hover': {
                        borderColor: '#600000',
                        borderWidth: '2px',
                        backgroundColor: 'rgba(128,0,0,0.04)',
                        transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 50,
                        backgroundColor: '#f2f2f2',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: '#800000' },
                        '&.Mui-focused fieldset': { borderColor: '#800000', borderWidth: '2px' },
                    },
                    '& .MuiInputLabel-root': { paddingLeft: '8px' },
                    '& .MuiOutlinedInput-input': { paddingLeft: '20px' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { boxShadow: '0px 8px 40px rgba(0,0,0,0.13)' },
            },
        },
    },
});

const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [loginError, setLoginError] = useState<string | null>(null);
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [overrideAccessClick, setOverrideAccessClick] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const plaidLinkRef = useRef<PlaidLinkRef>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    let [loginAttempts, setLoginAttempts] = useState<number>(0);

    const plaidTransactionImport = PlaidImportService.getInstance();
    const plaidService = PlaidService.getInstance();
    const userLogService = UserLogService.getInstance();
    const userService = UserService.getInstance();
    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePlaidError = useCallback((error: any, metadata: any) => {
        if (error?.error_code === 'RATE_LIMIT') {
            setLoginError('Plaid connection is temporarily limited. Please wait a few minutes and try again, or use manual upload mode.');
            setLinkToken(null);
            sessionStorage.removeItem('plaidLinkToken');
            return;
        }
        setLoginError('Connection failed. Please try again.');
    }, []);

    const handleOverrideAccessOnClick = () => setOverrideAccessClick(prev => !prev);

    const fetchUserEmailById = async (userId: number): Promise<string> => {
        try {
            return await userService.findEmailByUserId(userId);
        } catch (error) {
            throw new Error(`Failed to fetch email: ${error}`);
        }
    };

    const fetchUserFullNameById = async (userId: number): Promise<string> => {
        try {
            const storedUserId = Number(sessionStorage.getItem('userId'));
            return await userService.findFirstAndLastNameByUserId(storedUserId);
        } catch (error) {
            throw new Error(`Failed to fetch user name: ${error}`);
        }
    };

    useEffect(() => {
        const savedLinkToken = sessionStorage.getItem('plaidLinkToken');
        if (savedLinkToken && !linkToken) setLinkToken(savedLinkToken);
    }, []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            if (!formData.email || !formData.password) return;

            const loginData: LoginCredentials = { username: formData.email, password: formData.password };
            sessionStorage.setItem('username', formData.email);

            const response = await authenticateUser(loginData);
            if (!response) return;

            setIsAuthenticated(true);
            const loginSvc = new LoginService();
            const userId = await loginSvc.fetchUserIdByUsername(formData.email);
            if (!userId) return;

            sessionStorage.setItem('userId', String(userId));
            const userFullName = await fetchUserFullNameById(userId);
            const userEmail = await fetchUserEmailById(userId);
            sessionStorage.setItem('fullName', userFullName);
            sessionStorage.setItem('email', userEmail);

            const isUserOverrideEnabled = await userService.fetchUserOverrideEnabled(userId);
            if (isUserOverrideEnabled || overrideAccessClick) {
                await userService.updateUserUploadEnabledAccess(userId, overrideAccessClick);
                await userLogService.saveUserLog(userId, 0, 0, new Date(), new Date());
                sessionStorage.setItem('sessionDuration', '0');
                navigate('/dashboard');
                return;
            }

            const plaidStatus = await handlePlaidLinkVerification(userId);
            if (!plaidStatus) return;

            if (!plaidStatus.isLinked) {
                if (plaidStatus.requiresLinkUpdate) {
                    await openUpdateMode(userId);
                } else {
                    const linkResponse = await plaidService.createLinkToken();
                    if (!linkResponse?.linkToken) return;
                    setLinkToken(linkResponse.linkToken);
                    sessionStorage.setItem('plaidLinkToken', linkResponse.linkToken);
                }
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            setIsAuthenticated(false);
            loginAttempts++;
            sessionStorage.removeItem('sessionActive');
            sessionStorage.removeItem('sessionId');
        }
    };

    const handleRegister = () => navigate('/register');

    const handlePlaidReady = useCallback(() => {
        if (plaidLinkRef.current) plaidLinkRef.current.open();
    }, []);

    const handlePlaidLinkSaveResponse = async (response: PlaidExchangeResponse): Promise<void> => {
        const { accessToken, itemID, userID } = response;
        try {
            const result = await plaidService.savePlaidLinkToDatabase(accessToken, itemID, userID);
            if (result.status === 201) return result.data;
        } catch (error) {
            throw error;
        }
    };

    const handleTokenExpired = useCallback(async () => {
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const plaidStatus = await plaidService.checkPlaidLinkStatusByUserId(userId);
            if (plaidStatus.requiresLinkUpdate) {
                const accessToken = await plaidService.getAccessTokenForUser(userId);
                if (!accessToken) return;
                const newLinkToken = await plaidService.updatePlaidLink(userId, accessToken);
                if (newLinkToken) {
                    setLinkToken(newLinkToken);
                    sessionStorage.setItem('plaidLinkToken', newLinkToken);
                }
            } else {
                const linkResponse = await plaidService.createLinkToken();
                if (linkResponse?.linkToken) {
                    setLinkToken(linkResponse.linkToken);
                    sessionStorage.setItem('plaidLinkToken', linkResponse.linkToken);
                }
            }
        } catch (error) {
            setLoginError('Failed to refresh connection. Please try logging in again.');
        }
    }, [plaidService]);

    const handlePlaidLinkVerification = async (userId: number): Promise<PlaidLinkStatus> => {
        try {
            const plaidStatus = await plaidService.checkPlaidLinkStatusByUserId(userId);
            const accessToken = await plaidService.getAccessTokenForUser(userId);
            if (!plaidStatus.isLinked || !accessToken) {
                const response = await plaidService.createLinkToken();
                setLinkToken(response.linkToken);
                return plaidStatus;
            }
            if (plaidStatus.requiresLinkUpdate && accessToken) {
                await openUpdateMode(userId);
            }
            return plaidStatus;
        } catch (error) {
            throw error;
        }
    };

    const openUpdateMode = async (userId: number) => {
        try {
            const accessToken = await plaidService.getAccessTokenForUser(userId);
            if (!accessToken) return;
            const token = await plaidService.updatePlaidLink(userId, accessToken);
            if (!token) return;
            setLinkToken(token);
            setTimeout(() => {
                if (plaidLinkRef.current) plaidLinkRef.current.open();
            }, 1000);
        } catch (error) {
            console.error('Error opening Plaid update mode:', error);
        }
    };

    const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const userId = Number(sessionStorage.getItem('userId'));
            const response = await plaidService.exchangePublicToken(publicToken, userId);
            await handlePlaidLinkSaveResponse(response);

            const linkedAccounts = await plaidService.fetchAndLinkPlaidAccounts(userId);
            if (!linkedAccounts) throw new Error('Failed to link accounts');
            //
            // const currentYear = new Date().getFullYear();
            // const currentMonth = new Date().getMonth();
            // const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            // const endDate = new Date().toISOString().split('T')[0];

            navigate('/dashboard');
            sessionStorage.removeItem('plaidLinkToken');
        } catch (error) {
            console.error('Error exchanging public token:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [navigate, isProcessing]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* Full-page background — neutral grey matching MACU style */}
            <Box
                sx={{
                    minHeight: '100vh',
                    backgroundColor: '#c8c8c8',
                    backgroundImage: 'url("/login-bg.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4,
                }}
            >
                <Container component="main" maxWidth="xs">
                    <Paper
                        elevation={4}
                        sx={{
                            borderRadius: 3,
                            px: 5,
                            pt: 5,
                            pb: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: '#ffffff',
                        }}
                    >
                        {/* ── LOGO: full combined Budget Buddy image ── */}
                        <Box
                            onClick={handleOverrideAccessOnClick}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: 3.5,
                                cursor: 'pointer',
                                userSelect: 'none',
                                width: '100%',
                                backgroundColor: '#ffffff',
                                py: 1,
                            }}
                        >
                            <Box
                                component="img"
                                src="/budget_buddy_logo_clean.png"
                                alt="Budget Buddy"
                                sx={{
                                    width: '92%',
                                    maxWidth: 360,
                                    height: 'auto',
                                    objectFit: 'contain',
                                    display: 'block',
                                    backgroundColor: '#ffffff',
                                }}
                            />
                        </Box>

                        {loginError && (
                            <Alert
                                severity="error"
                                sx={{ width: '100%', mb: 2, borderRadius: 2 }}
                                onClose={() => setLoginError(null)}
                            >
                                {loginError}
                            </Alert>
                        )}

                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ width: '100%' }}
                            noValidate
                        >
                            {/* Username field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Username"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={formData.email}
                                onChange={handleChange}
                                error={!!formErrors.username}
                                helperText={formErrors.username}
                                sx={{ mb: 2 }}
                            />

                            {/* Password field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                                error={!!formErrors.password}
                                helperText={formErrors.password}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(prev => !prev)}
                                                edge="end"
                                                size="small"
                                                sx={{ mr: 1, color: '#888' }}
                                            >
                                                {showPassword
                                                    ? <VisibilityOff fontSize="small" />
                                                    : <Visibility fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Remember Me */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml: 0.5 }}>
                                <Switch
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    size="small"
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#800000' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#800000',
                                        },
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: 'text.secondary', ml: 0.5 }}>
                                    Remember Me
                                </Typography>
                            </Box>

                            {/* Log in */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mb: 2.5, height: 52 }}
                                disabled={isLoading || isProcessing}
                            >
                                {isLoading || isProcessing
                                    ? <CircularProgress size={24} color="inherit" />
                                    : 'Log in'}
                            </Button>

                            {/* Forgot Username or Password */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 3 }}>
                                <Typography variant="body2" color="text.secondary">Forgot</Typography>
                                <Link
                                    href="/forgot-username"
                                    variant="body2"
                                    sx={{
                                        color: 'primary.main',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' },
                                    }}
                                >
                                    Username
                                </Link>
                                <Typography variant="body2" color="text.secondary">or</Typography>
                                <Link
                                    href="/forgot-password"
                                    variant="body2"
                                    sx={{
                                        color: 'primary.main',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' },
                                    }}
                                >
                                    Password?
                                </Link>
                            </Box>

                            {/* Register */}
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleRegister}
                                sx={{ height: 52 }}
                            >
                                Register a New Account
                            </Button>

                            {linkToken && (
                                <PlaidLink
                                    linkToken={linkToken}
                                    onSuccess={handlePlaidSuccess}
                                    onConnect={handlePlaidReady}
                                    onTokenExpired={handleTokenExpired}
                                    onExit={handlePlaidError}
                                    ref={plaidLinkRef}
                                />
                            )}
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default LoginForm;
// import React, {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
// import {
//     Alert,
//     Avatar,
//     Box,
//     Button, CircularProgress,
//     Container,
//     createTheme,
//     CssBaseline, Divider,
//     Grid, IconButton,
//     Link,
//     Paper,
//     TextField,
//     ThemeProvider,
//     Typography
// } from '@mui/material';
// import {LockOutlined} from '@mui/icons-material';
// import {useNavigate} from "react-router-dom";
// import {authenticateUser, LoginCredentials} from "../api/LoginApiService";
// import {PlaidLinkOnSuccessMetadata, usePlaidLink} from "react-plaid-link";
// import PlaidService from "../services/PlaidService";
// import PlaidLink, {PlaidLinkRef} from "./PlaidLink";
// import LoginService from "../services/LoginService";
// import loginService from "../services/LoginService";
// import RecurringTransactionService from "../services/RecurringTransactionService";
// import {be} from "date-fns/locale";
// import BudgetService from "../services/BudgetService";
// import TransactionRunnerService from "../services/TransactionRunnerService";
// import TransactionCategoryRunnerService from "../services/TransactionCategoryRunnerService";
// import UserService from '../services/UserService';
// import UserLogService from "../services/UserLogService";
// import PlaidImportService from "../services/PlaidImportService";
// import SessionService from "../services/SessionService";


// interface LoginFormData {
//     email: string;
//     password: string;
// }
//
// interface FormErrors {
//     username?: string;
//     password?: string;
//
// }
//
// interface PlaidLinkStatus {
//     isLinked: boolean;
//     requiresLinkUpdate: boolean;
// }
//
//
// interface PlaidExchangeResponse {
//     accessToken: string;
//     itemID: string;
//     userID: bigint;
// }
//
// // Theme Configuration
// const theme = createTheme({
//     palette: {
//         background: {
//             default: '#f8f9fa',
//         },
//         primary: {
//             main: '#800000', // Maroon primary color
//             light: '#9a3324',
//             dark: '#600000',
//         },
//         secondary: {
//             main: '#f8f0e5', // Light cream color for contrast
//         },
//         text: {
//             primary: '#333333',
//             secondary: '#666666',
//         },
//     },
//     typography: {
//         fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
//         h4: {
//             fontWeight: 600,
//         },
//         h5: {
//             fontWeight: 500,
//         },
//         body1: {
//             fontSize: '0.95rem',
//         },
//     },
//     shape: {
//         borderRadius: 8,
//     },
//     components: {
//         MuiButton: {
//             styleOverrides: {
//                 root: {
//                     borderRadius: 6,
//                     textTransform: 'none',
//                     padding: '10px 0',
//                     fontWeight: 500,
//                 },
//                 contained: {
//                     boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
//                     '&:hover': {
//                         boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
//                     },
//                 },
//                 outlined: {
//                     borderColor: '#800000',
//                     color: '#800000',
//                     '&:hover': {
//                         borderColor: '#600000',
//                         backgroundColor: 'rgba(128, 0, 0, 0.04)',
//                     },
//                 },
//             },
//         },
//         MuiTextField: {
//             styleOverrides: {
//                 root: {
//                     '& .MuiOutlinedInput-root': {
//                         '&:hover fieldset': {
//                             borderColor: '#800000',
//                         },
//                     },
//                 },
//             },
//         },
//         MuiPaper: {
//             styleOverrides: {
//                 elevation3: {
//                     boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
//                 },
//             },
//         },
//     },
// });
//
// const LoginForm: React.FC = () => {
//     const [formData, setFormData] = useState<LoginFormData>({
//         email: '',
//         password: ''
//     });
//     const [formErrors, setFormErrors] = useState<FormErrors>({});
//     const [loginError, setLoginError] = useState<string | null>(null);
//     const [fullName, setFullName] = useState<string>('');
//     const [linkToken, setLinkToken] = useState<string | null>(null);
//     const [overrideAccessClick, setOverrideAccessClick] = useState<boolean>(false);
//     const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
//     const plaidLinkRef = useRef<PlaidLinkRef>(null);
//     const [isProcessing, setIsProcessing] = useState<boolean>(false);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [rateLimitError, setRateLimitError] = useState<boolean>(false);
//     let [loginAttempts, setLoginAttempts] = useState<number>(0);
//     const plaidTransactionImport = PlaidImportService.getInstance();
//     const plaidService = PlaidService.getInstance();
//
//     const userLogService = UserLogService.getInstance();
//     const userService = UserService.getInstance();
//     const navigate = useNavigate();
//
//
//     const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = event.target;
//         setFormData((prevData) => ({
//             ...prevData,
//             [name]: value,
//         }));
//     };
//
//     const handlePlaidError = useCallback((error: any, metadata: any) => {
//         console.log('Plaid Link Error:', error);
//
//         if (error?.error_code === 'RATE_LIMIT') {
//             setLoginError('Plaid connection is temporarily limited. Please wait a few minutes and try again, or click the lock icon above to use manual upload mode.');
//
//             // Clear the link token to prevent repeated attempts
//             setLinkToken(null);
//             sessionStorage.removeItem('plaidLinkToken');
//
//             return;
//         }
//
//         // Handle other errors...
//         setLoginError('Connection failed. Please try again.');
//     }, []);
//
//     const handleOverrideAccessOnClick = () => {
//         setOverrideAccessClick(prev => !prev);
//         console.log('Override Access Clicked: ', !overrideAccessClick);
//     }
//
//     const fetchUserEmailById = async(userId: number) : Promise<string> => {
//         try
//         {
//             const response = await userService.findEmailByUserId(userId);
//             return response;
//         }catch(error){
//             console.error('Error fetching email: ', error);
//             throw new Error(`Failed to fetch email: ${error}`);
//         }
//     }
//
//     const fetchUserFullNameById = async (userId: number): Promise<string> => {
//         try {
//             const storedUserId = Number(sessionStorage.getItem('userId'));
//             console.log('UserId: ', storedUserId);
//             const response = await userService.findFirstAndLastNameByUserId(storedUserId);
//             console.log('Name response: ', response);
//             return response;
//         } catch (error) {
//             console.error("Error fetching name: ", error);
//             // Return a fallback value or re-throw the error to maintain the Promise<string> return type
//             throw new Error(`Failed to fetch user name: ${error}`);
//         }
//     };
//
//     const validateForm = (): boolean => {
//         const newErrors: FormErrors = {};
//         if(!formData.email) newErrors.username = 'UserName or Email is required';
//         if(!formData.password) newErrors.password = 'Password is required';
//         setFormErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     }
//
//     useEffect(() => {
//         // Restore link token from session storage if it exists
//         const savedLinkToken = sessionStorage.getItem('plaidLinkToken');
//         if (savedLinkToken && !linkToken) {
//             console.log('Restoring link token from session storage');
//             setLinkToken(savedLinkToken);
//         }
//     }, []);
//
// // Modified handleSubmit function with enhanced Plaid open logic
//     const handleSubmit = async (event: FormEvent) => {
//         event.preventDefault();
//
//         try {
//             // Validate form data
//             if (!formData.email || !formData.password) {
//                 console.error('Email or password missing');
//                 return;
//             }
//
//             const loginData: LoginCredentials = {
//                 username: formData.email,
//                 password: formData.password,
//             };
//             sessionStorage.setItem('username', formData.email);
//             console.log('LoginData: ', loginData);
//
//             const response = await authenticateUser(loginData);
//             if (!response) {
//                 console.error('Authentication failed: No response');
//                 return;
//             }
//
//             setIsAuthenticated(true);
//             const loginService = new LoginService();
//             const userId = await loginService.fetchUserIdByUsername(formData.email);
//             if (!userId) {
//                 console.error('Failed to fetch userId');
//                 return;
//             }
//             console.log('UserID: ', userId);
//             sessionStorage.setItem('userId', String(userId));
//             let userFullName = await fetchUserFullNameById(userId);
//             let userEmail = await fetchUserEmailById(userId);
//             sessionStorage.setItem('fullName', userFullName);
//             sessionStorage.setItem('email', userEmail);
//
//             let sessionDuration = 0;
//             let loginAttempts = 0;
//             let lastLogin = new Date();
//             let lastLogout = new Date();
//
//             console.log('Is Authenticated: ', true);
//             const isUserOverrideEnabled = await userService.fetchUserOverrideEnabled(userId);
//             console.log('Is User Override Enabled in DB: ', isUserOverrideEnabled);
//             if(isUserOverrideEnabled || overrideAccessClick)
//             {
//                 console.log('Override Access Clicked: ', overrideAccessClick);
//
//                 // Update the override_upload_enabled in the database
//                 await userService.updateUserUploadEnabledAccess(userId, overrideAccessClick);
//                 console.log('User override is enabled, navigating to dashboard...');
//                 await userLogService.saveUserLog(userId, sessionDuration, loginAttempts, lastLogin, lastLogout);
//                 sessionStorage.setItem('sessionDuration', String(sessionDuration));
//                 navigate('/dashboard');
//                 return;
//             }
//             else
//             {
//                 console.log('User override is disabled, navigating to Plaid Link...');
//                 // Create user log for this login session
//                 // await handleUserLogCreation(userId);
//                 const plaidService = PlaidService.getInstance();
//                 const plaidStatus = await handlePlaidLinkVerification(userId);
//                 console.log('Plaid Status: ', plaidStatus);
//                 if (!plaidStatus) {
//                     console.error('Error: Failed to verify Plaid link status');
//                     return;
//                 }
//                 console.log('Plaid Link Status: ', plaidStatus);
//                 // Handle Plaid linking or updating - ENHANCED LOGIC
//                 if (!plaidStatus.isLinked) {
//                     if (plaidStatus.requiresLinkUpdate) {
//                         // Case 1: Link exists but needs update
//                         console.log('Plaid link requires update, opening update mode...');
//                         await openUpdateMode(userId);
//                     } else {
//                         // Case 2: No link exists, need to create new one
//                         console.log('Plaid not linked, creating link token...');
//                         const linkResponse = await plaidService.createLinkToken();
//                         // Enhanced error handling and logging for link token
//                         if (!linkResponse || !linkResponse.linkToken) {
//                             console.error('Failed to create link token:', linkResponse);
//                             return;
//                         }
//                         console.log('Link token created successfully:', linkResponse.linkToken);
//                         setLinkToken(linkResponse.linkToken);
//                         sessionStorage.setItem('plaidLinkToken', linkResponse.linkToken);
//                     }
//                     // Note: Navigation waits until Plaid linking/updating completes (via callback)
//                 } else {
//                     // Case 3: Link exists and is up-to-date
//                     console.log('Plaid linked and up-to-date, syncing transactions...');
//
//
//
//                     navigate('/dashboard');
//                 }
//             }
//         } catch (error) {
//             console.error('Error in handleSubmit:', error);
//             setIsAuthenticated(false); // Reset auth state on failure
//             // Optionally notify user (e.g., setError('Login failed'))
//             // Clear any partial session data
//             loginAttempts++;
//             sessionStorage.removeItem('sessionActive');
//             sessionStorage.removeItem('sessionId');
//         }
//     };
//
//     // const handleUserLogCreation = async (userId: number) => {
//     //     try {
//     //         // Current time for the login timestamp
//     //         const currentTime = new Date();
//     //
//     //         // Create a new user log with login information
//     //         // We set lastLogout to the same time temporarily (will be updated on logout)
//     //         let sessionDuration = 0;
//     //         sessionStorage.setItem('sessionDuration', String(sessionDuration));
//     //         await userLogService.saveUserLog(
//     //             userId,                // userId
//     //             sessionDuration,                     // sessionDuration (will be calculated on logout)
//     //             loginAttempts,                     // loginAttempts (new session)
//     //             currentTime,           // lastLogin
//     //             currentTime,           // lastLogout (placeholder, updated on actual logout)
//     //         );
//     //
//     //         console.log('User log created successfully for user ID:', userId);
//     //     } catch (error) {
//     //         console.error('Error creating user log:', error);
//     //     }
//     // }
//
//     const handleRegister = () => {
//         navigate('/register');
//     }
//
//     const handlePlaidReady = useCallback(() => {
//         if(plaidLinkRef.current){
//             plaidLinkRef.current.open()
//         }
//     }, []);
//
//     const handlePlaidLinkSaveResponse = async (response: PlaidExchangeResponse) : Promise<void> => {
//         const {accessToken, itemID , userID} = response;
//         try
//         {
//             console.log('AccessToken: ', accessToken);
//             console.log('ItemID: ', itemID);
//             console.log('UserID: ', userID);
//             const plaidService = PlaidService.getInstance();
//             const response = await plaidService.savePlaidLinkToDatabase(accessToken, itemID, userID);
//             if(response.status === 201){
//                 return response.data;
//             }
//         }catch(error)
//         {
//             console.error('There was an error saving the plaid link to the server: ', error);
//             throw error;
//         }
//     }
//
//     const handleTokenExpired = useCallback(async () => {
//         console.log('Link token expired, fetching new token...');
//         try {
//             const userId = Number(sessionStorage.getItem('userId'));
//
//             // Check if we're in update mode or regular linking mode
//             const plaidStatus = await plaidService.checkPlaidLinkStatusByUserId(userId);
//
//             if (plaidStatus.requiresLinkUpdate) {
//                 // Refresh update mode token
//                 console.log('Refreshing update mode token...');
//                 const accessToken = await plaidService.getAccessTokenForUser(userId);
//                 if (!accessToken) {
//                     console.error('Access token not available for update mode refresh');
//                     return;
//                 }
//                 const newLinkToken = await plaidService.updatePlaidLink(userId, accessToken);
//                 if (newLinkToken) {
//                     console.log('New update mode link token created');
//                     setLinkToken(newLinkToken);
//                     sessionStorage.setItem('plaidLinkToken', newLinkToken);
//                 }
//             } else {
//                 // Refresh regular linking token
//                 console.log('Refreshing regular link token...');
//                 const linkResponse = await plaidService.createLinkToken();
//                 if (linkResponse?.linkToken) {
//                     console.log('New link token created');
//                     setLinkToken(linkResponse.linkToken);
//                     sessionStorage.setItem('plaidLinkToken', linkResponse.linkToken);
//                 }
//             }
//         } catch (error) {
//             console.error('Error refreshing link token:', error);
//             setLoginError('Failed to refresh connection. Please try logging in again.');
//         }
//     }, [plaidService]);
//
//     const handlePlaidLinkVerification = async (userId: number) : Promise<PlaidLinkStatus>  => {
//         try
//         {
//
//             const plaidStatus = await plaidService.checkPlaidLinkStatusByUserId(userId);
//             // Fetch access token from session storage or backend
//             const accessToken = await plaidService.getAccessTokenForUser(userId);
//             if (!plaidStatus.isLinked || !accessToken)
//             {
//                 console.warn('Plaid link is not active. Reconnecting...');
//                 const response = await plaidService.createLinkToken();
//                 setLinkToken(response.linkToken);
//                 return plaidStatus;
//             }
//
//             // Case 2: Plaid link requires update and access token exists
//             if (plaidStatus.requiresLinkUpdate && accessToken) {
//                 console.warn('Plaid link requires update. Opening update mode...');
//                 await openUpdateMode(userId); // Pass userId; accessToken is handled in openUpdateMode
//             }
//
//             return plaidStatus;
//         } catch (error) {
//             console.error('Error verifying Plaid link:', error);
//             throw error;
//         }
//
//     }
//     const openUpdateMode = async (userId: number) => {
//         try {
//             console.log('UserID: ', userId);
//             const accessToken = await plaidService.getAccessTokenForUser(userId);
//             if(!accessToken){
//                 console.error("Access Token is null or unavailable for user: ", userId);
//                 return;
//             }
//             const linkToken = await plaidService.updatePlaidLink(userId, accessToken);
//             if (!linkToken) {
//                 console.error("Failed to fetch update link token");
//                 return;
//             }
//
//             // Set the link token
//             setLinkToken(linkToken);
//
//             // ✅ Wait for component to render and ref to be available
//             setTimeout(() => {
//                 if (plaidLinkRef.current) {
//                     console.log('Opening Plaid Link in update mode...');
//                     plaidLinkRef.current.open();
//                 } else {
//                     console.error('Plaid Link ref not available');
//                 }
//             }, 1000); // Increased timeout
//
//         } catch (error) {
//             console.error("Error opening Plaid update mode:", error);
//         }
//     };
//
//     const handlePlaidSuccess = useCallback(async(publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
//         if(isProcessing) return;
//         setIsProcessing(true);
//         try
//         {
//             const plaidService = PlaidService.getInstance();
//             const userId = Number(sessionStorage.getItem('userId'));
//             const response = await plaidService.exchangePublicToken(publicToken, userId);
//             const plaidLinkResponse = await handlePlaidLinkSaveResponse(response);
//
//             await new Promise<void>(async (resolve) => {
//                 try
//                 {
//                     // Link accounts
//                     const linkedAccounts = await plaidService.fetchAndLinkPlaidAccounts(userId);
//                     console.log('Linked Accounts:', linkedAccounts);
//                     if (!linkedAccounts) {
//                         throw new Error('Failed to link accounts');
//                     }
//
//                     // Save transactions
//                     const previousMonth = new Date().getMonth() - 1;
//                     const currentYear = new Date().getFullYear();
//                     const beginningPreviousMonth = new Date(currentYear, previousMonth, 1)
//                         .toISOString().split('T')[0];
//
//                     const currentMonth = new Date().getMonth();
//                     const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
//                     const endDate = new Date().toISOString().split('T')[0];
//                     console.info("Importing Plaid Transactions");
//                     await plaidTransactionImport.importPlaidTransactions(userId, startDate, endDate);
//
//                     resolve();
//                 } catch (error) {
//                     console.error('Error during Plaid setup:', error);
//                     throw error;
//                 }
//             });
//
//             navigate('/dashboard');
//
//             sessionStorage.removeItem('plaidLinkToken');
//         }catch(error)
//         {
//             console.error('Error exchanging public token: ', error);
//         }finally{
//             setIsProcessing(false);
//         }
//         console.log('Plaid Connection Successful', publicToken, metadata)
//
//
//     }, [navigate]);
//
//     return (
//         <ThemeProvider theme={theme}>
//             <CssBaseline />
//             <Container component="main" maxWidth="sm">
//                 <Paper
//                     elevation={3}
//                     sx={{
//                         marginTop: 8,
//                         borderRadius: 2,
//                         overflow: 'hidden'
//                     }}
//                 >
//                     <Grid container>
//                         {/* Left side decoration */}
//                         <Grid
//                             item
//                             xs={0}
//                             sm={4}
//                             sx={{
//                                 background: 'linear-gradient(135deg, #800000 0%, #600000 100%)',
//                                 display: { xs: 'none', sm: 'flex' },
//                                 flexDirection: 'column',
//                                 justifyContent: 'center',
//                                 alignItems: 'center',
//                                 py: 8,
//                                 color: 'white',
//                             }}
//                         >
//                             <Box
//                                 sx={{
//                                     display: 'flex',
//                                     flexDirection: 'column',
//                                     alignItems: 'center',
//                                     px: 3
//                                 }}
//                             >
//                                 <Avatar
//                                     sx={{
//                                         m: 1,
//                                         bgcolor: 'white',
//                                         color: '#800000',
//                                         width: 56,
//                                         height: 56
//                                     }}
//                                     onClick={(e) => {
//                                         e.stopPropagation(); // Prevent parent handlers
//                                         console.log('Clicked!');
//                                         handleOverrideAccessOnClick()
//                                     }}
//                                 >
//                                     <LockOutlined />
//                                 </Avatar>
//                                 <Typography
//                                     component="h1"
//                                     variant="h4"
//                                     sx={{ mt: 1, fontWeight: 600, textAlign: 'center' }}
//                                 >
//                                     Budget Buddy
//                                 </Typography>
//                                 <Typography
//                                     variant="body1"
//                                     sx={{ mt: 2, textAlign: 'center', opacity: 0.9 }}
//                                 >
//                                     Your personal finance assistant
//                                 </Typography>
//                             </Box>
//                         </Grid>
//
//                         {/* Right side login form */}
//                         <Grid item xs={12} sm={8}>
//                             <Box
//                                 sx={{
//                                     display: 'flex',
//                                     flexDirection: 'column',
//                                     alignItems: 'center',
//                                     p: 4,
//                                 }}
//                             >
//                                 {/* Mobile only logo */}
//                                 <Box
//                                     sx={{
//                                         display: { xs: 'flex', sm: 'none' },
//                                         flexDirection: 'column',
//                                         alignItems: 'center',
//                                         mb: 3
//                                     }}
//                                 >
//                                     <Avatar
//                                         sx={{
//                                             m: 1,
//                                             bgcolor: '#800000',
//                                             width: 56,
//                                             height: 56
//                                         }}
//                                         onClick={(e) => {
//                                             console.log('Click event fired', e);
//                                             handleOverrideAccessOnClick()
//                                         }}
//                                     >
//                                             <LockOutlined />
//                                     </Avatar>
//                                     <Typography
//                                         component="h1"
//                                         variant="h5"
//                                         sx={{ fontWeight: 600 }}
//                                     >
//                                         Budget Buddy
//                                     </Typography>
//                                 </Box>
//
//                                 <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
//                                     Sign in to your account
//                                 </Typography>
//
//                                 {loginError && (
//                                     <Alert
//                                         severity="error"
//                                         sx={{ width: '100%', mb: 2 }}
//                                     >
//                                         {loginError}
//                                     </Alert>
//                                 )}
//
//                                 <Box
//                                     component="form"
//                                     onSubmit={handleSubmit}
//                                     sx={{ width: '100%' }}
//                                 >
//                                     <TextField
//                                         margin="normal"
//                                         required
//                                         fullWidth
//                                         id="email"
//                                         label="Email Address"
//                                         name="email"
//                                         autoComplete="email"
//                                         autoFocus
//                                         value={formData.email}
//                                         onChange={handleChange}
//                                         error={!!formErrors.username}
//                                         helperText={formErrors.username}
//                                         sx={{ mb: 2 }}
//                                     />
//
//                                     <TextField
//                                         margin="normal"
//                                         required
//                                         fullWidth
//                                         name="password"
//                                         label="Password"
//                                         type="password"
//                                         id="password"
//                                         autoComplete="current-password"
//                                         value={formData.password}
//                                         onChange={handleChange}
//                                         error={!!formErrors.password}
//                                         helperText={formErrors.password}
//                                         sx={{ mb: 1 }}
//                                     />
//
//                                     <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
//                                         <Link
//                                             href="/forgot-password"
//                                             variant="body2"
//                                             sx={{
//                                                 color: 'primary.main',
//                                                 textDecoration: 'none',
//                                                 '&:hover': {
//                                                     textDecoration: 'underline'
//                                                 }
//                                             }}
//                                         >
//                                             Forgot Password?
//                                         </Link>
//                                     </Box>
//
//                                     <Button
//                                         type="submit"
//                                         fullWidth
//                                         variant="contained"
//                                         sx={{
//                                             mt: 1,
//                                             mb: 2,
//                                             height: 48,
//                                             fontSize: '1rem'
//                                         }}
//                                         disabled={isLoading}
//                                     >
//                                         {isLoading ? (
//                                             <CircularProgress size={24} color="inherit" />
//                                         ) : (
//                                             'Sign In'
//                                         )}
//                                     </Button>
//
//                                     <Divider sx={{ my: 3 }}>
//                                         <Typography variant="body2" color="text.secondary">
//                                             OR
//                                         </Typography>
//                                     </Divider>
//
//                                     <Button
//                                         fullWidth
//                                         variant="outlined"
//                                         sx={{
//                                             mb: 2,
//                                             height: 48,
//                                             fontSize: '1rem'
//                                         }}
//                                         onClick={handleRegister}
//                                     >
//                                         Create New Account
//                                     </Button>
//
//                                     {linkToken && (
//                                         <PlaidLink
//                                             linkToken={linkToken}
//                                             onSuccess={handlePlaidSuccess}
//                                             onConnect={handlePlaidReady}
//                                             onTokenExpired={handleTokenExpired}
//                                             onExit={handlePlaidError}
//                                             ref={plaidLinkRef}
//                                         />
//                                     )}
//                                 </Box>
//                             </Box>
//                         </Grid>
//                     </Grid>
//                 </Paper>
//             </Container>
//         </ThemeProvider>
//     );
// };
//
// export default LoginForm;