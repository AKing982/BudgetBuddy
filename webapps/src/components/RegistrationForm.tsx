import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
} from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import {registerUser, Registration} from "../api/RegistrationApiService";
import {useNavigate} from "react-router-dom";

interface RegistrationFormData {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    initialBalance: number;
    currency: string;
}

const RegistrationForm: React.FC = () => {
    const [formData, setFormData] = useState<RegistrationFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        username: '',
        confirmPassword: '',
        initialBalance: 0,
        currency: 'USD',
    });
    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name as string]: value,
        }));
    };

    const createRegistrationRequest = (formData: RegistrationFormData) : Registration => {
        return {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            username: formData.username,
            password: formData.password,
            balance: formData.initialBalance,
            currency: formData.currency
        }
    };


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try
        {
            let request = createRegistrationRequest(formData);
            const response = await registerUser(request);
            console.log('Response: ', response);
            await new Promise(resolve => setTimeout(resolve, 6000));
            navigate('/');

        }catch(error)
        {
            console.error('Error: ', error);
        }

        console.log('Registration attempted with:', formData);
        // Here you would typically handle the registration logic
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 3,
            }}>
                <AccountBalance sx={{ m: 1, bgcolor: 'secondary.main', padding: 1, borderRadius: '50%', color: 'white' }} />
                <Typography component="h1" variant="h5">
                    Sign up for Budget Buddy
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="firstName"
                        label="First Name"
                        autoFocus
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="email"
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="username"
                        label="User Name"
                        value={formData.username}
                        onChange={handleChange}
                        />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="initialBalance"
                        label="Initial Balance"
                        type="number"
                        value={formData.initialBalance}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="currency-label">Currency</InputLabel>
                        <Select
                            labelId="currency-label"
                            name="currency"
                            value={formData.currency}
                            label="Currency"
                        >
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                            <MenuItem value="JPY">JPY</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default RegistrationForm;