
import React, { useState, FormEvent } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper, Grid, Link, createTheme, ThemeProvider
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import {useNavigate} from "react-router-dom";
import {authenticateUser, LoginCredentials} from "../api/LoginApiService";


interface LoginFormData {
    email: string;
    password: string;
}

interface FormErrors {
    username?: string;
    password?: string;

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
            console.log('LoginData: ', loginData);
            const response = await authenticateUser(loginData);
            console.log('Response: ', response);
            // await new Promise(resolve => setTimeout(resolve, 3000));
            navigate('/dashboard');
        }catch(err)
        {
            console.error(err);
        }
    };

    const handleRegister = () => {
        navigate('/register');
    }

    return (
        <ThemeProvider theme={theme}>
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
                        Sign in to Budget App
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

                    </Box>
                </Paper>
            </Container>
        </ThemeProvider>

    );
};

export default LoginForm;