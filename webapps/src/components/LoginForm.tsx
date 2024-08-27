
import React, {useState, FormEvent, useCallback, useRef} from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper, Grid, Link, createTheme, ThemeProvider, CssBaseline
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import {useNavigate} from "react-router-dom";
import {authenticateUser, LoginCredentials} from "../api/LoginApiService";
import {PlaidLinkOnSuccessMetadata} from "react-plaid-link";
import PlaidService from "../services/PlaidService";
import PlaidLink, {PlaidLinkRef} from "./PlaidLink";
import plaidService from "../services/PlaidService";
import LoginService from "../services/LoginService";


interface LoginFormData {
    email: string;
    password: string;
}

interface FormErrors {
    username?: string;
    password?: string;

}

interface PlaidExchangeResponse {
    accessToken: string;
    itemID: string;
    userID: number;
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

    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };


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
            if(response != null){
                console.log('Is Authenticated: ', isAuthenticated);
                const plaidService = PlaidService.getInstance();
                // Fetch the link token
                const response = await plaidService.createLinkToken();
                console.log('Response: ', response);
                console.log('Link Token: ', response.linkToken);
                setLinkToken(response.linkToken);
                if(plaidLinkRef.current){
                    plaidLinkRef.current.open();
                }else{
                    console.log('Authenticated Failed');
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

    const handlePlaidSuccess = useCallback(async(publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
        try
        {
            const plaidService = PlaidService.getInstance();
            const loginService = new LoginService(formData.email, formData.password);
            const username: string | null = sessionStorage.getItem('username');
            const userId = await loginService.fetchUserIdByUsername(username);

            const response = await plaidService.exchangePublicToken(publicToken, userId);
            const plaidLinkResponse = await handlePlaidLinkSaveResponse(response);
            if(plaidLinkResponse != null){
                navigate('/dashboard');
            }
        }catch(error)
        {
            console.error('Error exchanging public token: ', error);
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