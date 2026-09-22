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
        // const savedLinkToken = sessionStorage.getItem('plaidLinkToken');
        // if (savedLinkToken && !linkToken) setLinkToken(savedLinkToken);
        const savedLinkToken = sessionStorage.getItem('plaidLinkToken');
        const existingUserId = sessionStorage.getItem('userId');
        const sessionActive = sessionStorage.getItem('sessionActive');
        if (savedLinkToken && !linkToken && existingUserId && sessionActive) {
            setLinkToken(savedLinkToken);
        }
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
            // if (plaidStatus.requiresLinkUpdate) {
            //     const accessTokens: string[] = await plaidService.getAccessTokenForUser(userId);
            //     if (!accessTokens) return;
            //     const newLinkTokens: string[] = await plaidService.updatePlaidLink(userId, accessTokens);
            //     if (newLinkTokens) {
            //         setLinkToken(newLinkToken);
            //         sessionStorage.setItem('plaidLinkToken', newLinkToken);
            //     }
            // } else {
            //     const linkResponse = await plaidService.createLinkToken();
            //     if (linkResponse?.linkToken) {
            //         setLinkToken(linkResponse.linkToken);
            //         sessionStorage.setItem('plaidLinkToken', linkResponse.linkToken);
            //     }
            // }
        } catch (error) {
            setLoginError('Failed to refresh connection. Please try logging in again.');
        }
    }, [plaidService]);

    const handlePlaidLinkVerification = async (userId: number): Promise<PlaidLinkStatus> => {
        try {
            const plaidStatuses: PlaidLinkStatus[] = await plaidService.checkPlaidLinkStatusByUserId(userId);
            const accessToken = await plaidService.getAccessTokenForUser(userId);
            // if (!plaidStatus.isLinked || !accessToken) {
            //     const response = await plaidService.createLinkToken();
            //     setLinkToken(response.linkToken);
            //     return plaidStatus;
            // }
            // if (plaidStatus.requiresLinkUpdate && accessToken) {
            //     await openUpdateMode(userId);
            // }
            // return plaidStatus;
            const isLinked = plaidStatuses.length > 0 && plaidStatuses.every(s => s.isLinked);
            const requiresLinkUpdate = plaidStatuses.some(s => s.requiresLinkUpdate);
            if(!isLinked || !accessToken)
            {
                const response = await plaidService.createLinkToken();
                setLinkToken(response.linkToken);
                return {isLinked, requiresLinkUpdate};
            }
            if(requiresLinkUpdate && accessToken){
                await openUpdateMode(userId);
            }
            return {isLinked, requiresLinkUpdate};
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
