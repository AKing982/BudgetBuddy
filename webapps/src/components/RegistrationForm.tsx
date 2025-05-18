import React, {useEffect, useState} from 'react';
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
    ThemeProvider,
    createTheme,
    CssBaseline,
    SelectChangeEvent,
    Link,
    Divider,
    CircularProgress,
    Grid,
    Alert,
    Avatar,
    Stack,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import { registerUser, Registration } from "../api/RegistrationApiService";
import { useNavigate } from "react-router-dom";
import BudgetQuestionnaireForm from "./BudgetQuestionnaireForm";
//
// // Create a custom theme
// const theme = createTheme({
//     palette: {
//         background: {
//             default: '#f5e6d3', // Beige background
//         },
//         primary: {
//             main: '#800000', // Maroon for primary color (buttons)
//         },
//     },
//     components: {
//         MuiButton: {
//             styleOverrides: {
//                 root: {
//                     borderRadius: 0, // Flat buttons
//                     textTransform: 'none', // Prevents all-caps text
//                 },
//                 contained: {
//                     boxShadow: 'none', // Removes default shadow for a flatter look
//                     '&:hover': {
//                         boxShadow: 'none', // Keeps it flat on hover
//                     },
//                 },
//             },
//         },
//         MuiTextField: {
//             styleOverrides: {
//                 root: {
//                     '& .MuiOutlinedInput-root': {
//                         '&.Mui-focused fieldset': {
//                             borderColor: '#1976d2', // Blue outline when focused
//                             borderWidth: '2px', // Make the outline a bit thicker
//                         },
//                     },
//                 },
//             },
//         },
//         MuiSelect: {
//             styleOverrides: {
//                 root: {
//                     '& .MuiOutlinedInput-notchedOutline': {
//                         borderColor: '#800000', // Maroon border for select
//                     },
//                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                         borderColor: '#600000', // Darker on hover
//                     },
//                 },
//             },
//         },
//     },
// });
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
        error: {
            main: '#d32f2f',
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
                        '&.Mui-focused fieldset': {
                            borderColor: '#800000',
                            borderWidth: '2px',
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
        MuiStepper: {
            styleOverrides: {
                root: {
                    '& .MuiStepIcon-root.Mui-active': {
                        color: '#800000',
                    },
                    '& .MuiStepIcon-root.Mui-completed': {
                        color: '#006400',
                    },
                },
            },
        },
    },
});

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

interface RegistrationFormData {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

const RegistrationForm: React.FC = () => {
    const [formData, setFormData] = useState<RegistrationFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        username: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [registrationError, setRegistrationError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState<number>(0);

    const [showBudgetQuestionnaire, setShowBudgetQuestionnaire] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        // Clear errors when user types
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[name as keyof FormErrors];
                return updated;
            });
        }

        // Clear general registration error when user makes changes
        if (registrationError) setRegistrationError(null);
    };

    // Form Validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // First Name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        // Last Name validation
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 4) {
            newErrors.username = 'Username must be at least 4 characters';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        // Confirm Password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        document.title = 'User Registration';
        return () => {
            document.title = 'User Registration';
        }
    }, [])

    const createRegistrationRequest = (formData: RegistrationFormData): Registration => {
        return {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            username: formData.username,
            password: formData.password
        }
    };


    const handleBudgetQuestionnaireSubmit = async (budgetData: any) => {
        setActiveStep(2);
        navigate('/');
    }

    // Next Step Handler
    const handleNext = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validate form before proceeding
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Register the user
            const request = createRegistrationRequest(formData);
            const response = await registerUser(request);

            // If successful, proceed to the budget questionnaire
            setActiveStep(1);
            setShowBudgetQuestionnaire(true);
        } catch (error) {
            console.error('Registration error:', error);
            setRegistrationError('An error occurred during registration. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // const handleNext = async (event: React.FormEvent) => {
    //     event.preventDefault();
    //     await handleSubmit();
    //     // Here you can add any validation logic before moving to the next step
    //     setShowBudgetQuestionnaire(true);
    // };
    //
    // const handleSubmit = async () => {
    //     try {
    //         let request = createRegistrationRequest(formData);
    //         const response = await registerUser(request);
    //         console.log('Response: ', response);
    //         console.log('ShowBudgetQuestionnaireForm: ', showBudgetQuestionnaire);
    //         // await new Promise(resolve => setTimeout(resolve, 6000));
    //     } catch (error) {
    //         console.error('Error: ', error);
    //     }
    // };

    // Go back to login page
    const handleBackToLogin = () => {
        navigate('/');
    };

    if (showBudgetQuestionnaire) {
        console.log('calling BudgetQuestionnaireForm');
        return <BudgetQuestionnaireForm onSubmit={handleBudgetQuestionnaireSubmit} />;
    }

    // Registration Process Steps
    const steps = ['Create Account', 'Budget Setup', 'Complete'];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container component="main" maxWidth="md" sx={{ py: 8 }}>
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    {/* Progress Stepper */}
                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel
                        sx={{ width: '100%', mb: 5 }}
                    >
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Main Content */}
                    <Paper
                        elevation={3}
                        sx={{
                            width: '100%',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Grid container>
                            {/* Left side decoration */}
                            <Grid
                                item
                                xs={0}
                                md={5}
                                sx={{
                                    background: 'linear-gradient(135deg, #800000 0%, #600000 100%)',
                                    display: { xs: 'none', md: 'flex' },
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    py: 8,
                                    px: 4,
                                    color: 'white',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            m: 1,
                                            bgcolor: 'white',
                                            color: '#800000',
                                            width: 70,
                                            height: 70
                                        }}
                                    >
                                        <AccountBalance fontSize="large" />
                                    </Avatar>
                                    <Typography
                                        component="h1"
                                        variant="h4"
                                        sx={{ mt: 3, mb: 2, fontWeight: 600, textAlign: 'center' }}
                                    >
                                        Budget Buddy
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ mb: 4, textAlign: 'center', opacity: 0.9 }}
                                    >
                                        Your personal finance management tool
                                    </Typography>

                                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                                        <Typography variant="h6" sx={{ mb: 2 }}>
                                            Why join Budget Buddy?
                                        </Typography>

                                        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                ✓ Track your expenses automatically
                                            </Typography>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                ✓ Create custom budgets that work for you
                                            </Typography>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                ✓ Securely connect to your bank accounts
                                            </Typography>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                ✓ Get personalized financial insights
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Right side registration form */}
                            <Grid item xs={12} md={7}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        p: { xs: 3, sm: 5 },
                                    }}
                                >
                                    {/* Mobile only logo */}
                                    <Box
                                        sx={{
                                            display: { xs: 'flex', md: 'none' },
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
                                            <AccountBalance />
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
                                        Create your account
                                    </Typography>

                                    {registrationError && (
                                        <Alert
                                            severity="error"
                                            sx={{ width: '100%', mb: 2 }}
                                        >
                                            {registrationError}
                                        </Alert>
                                    )}

                                    <Box
                                        component="form"
                                        onSubmit={handleNext}
                                        sx={{ width: '100%' }}
                                    >
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    id="firstName"
                                                    name="firstName"
                                                    label="First Name"
                                                    autoComplete="given-name"
                                                    autoFocus
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    error={!!formErrors.firstName}
                                                    helperText={formErrors.firstName}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    id="lastName"
                                                    name="lastName"
                                                    label="Last Name"
                                                    autoComplete="family-name"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    error={!!formErrors.lastName}
                                                    helperText={formErrors.lastName}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    id="email"
                                                    name="email"
                                                    label="Email Address"
                                                    type="email"
                                                    autoComplete="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    error={!!formErrors.email}
                                                    helperText={formErrors.email}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    id="username"
                                                    name="username"
                                                    label="Username"
                                                    autoComplete="username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    error={!!formErrors.username}
                                                    helperText={formErrors.username}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    id="password"
                                                    name="password"
                                                    label="Password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    error={!!formErrors.password}
                                                    helperText={formErrors.password}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    label="Confirm Password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    error={!!formErrors.confirmPassword}
                                                    helperText={formErrors.confirmPassword}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Button
                                            type="submit"
                                            fullWidth
                                            variant="contained"
                                            sx={{
                                                mt: 4,
                                                mb: 2,
                                                height: 48,
                                                fontSize: '1rem'
                                            }}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <CircularProgress size={24} color="inherit" />
                                            ) : (
                                                'Continue to Budget Setup'
                                            )}
                                        </Button>

                                        <Divider sx={{ my: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Already have an account?
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
                                            onClick={handleBackToLogin}
                                        >
                                            Back to Login
                                        </Button>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            align="center"
                                            sx={{ mt: 3 }}
                                        >
                                            By creating an account, you agree to our{' '}
                                            <Link href="#" color="primary.main">
                                                Terms of Service
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="#" color="primary.main">
                                                Privacy Policy
                                            </Link>
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Container>
        </ThemeProvider>
    );

    // return (
    //     <ThemeProvider theme={theme}>
    //         <CssBaseline />
    //         <Container component="main" maxWidth="xs" sx={{
    //             minHeight: '100vh',
    //             display: 'flex',
    //             flexDirection: 'column',
    //             justifyContent: 'center',
    //             py: 4,
    //         }}>
    //             <Paper elevation={3} sx={{
    //                 display: 'flex',
    //                 flexDirection: 'column',
    //                 alignItems: 'center',
    //                 padding: 4,
    //                 backgroundColor: 'white',
    //             }}>
    //                 <AccountBalance sx={{ m: 1, bgcolor: 'primary.main', padding: 1, borderRadius: '50%', color: 'white' }} />
    //                 <Typography component="h1" variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
    //                     Sign up for Budget Buddy
    //                 </Typography>
    //                 <Box component="form" onSubmit={handleNext} sx={{ mt: 1, width: '100%' }}>
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="firstName"
    //                         label="First Name"
    //                         autoFocus
    //                         value={formData.firstName}
    //                         onChange={handleChange}
    //                     />
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="lastName"
    //                         label="Last Name"
    //                         value={formData.lastName}
    //                         onChange={handleChange}
    //                     />
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="email"
    //                         label="Email Address"
    //                         type="email"
    //                         value={formData.email}
    //                         onChange={handleChange}
    //                     />
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="username"
    //                         label="User Name"
    //                         value={formData.username}
    //                         onChange={handleChange}
    //                     />
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="password"
    //                         label="Password"
    //                         type="password"
    //                         value={formData.password}
    //                         onChange={handleChange}
    //                     />
    //                     <TextField
    //                         margin="normal"
    //                         required
    //                         fullWidth
    //                         name="confirmPassword"
    //                         label="Confirm Password"
    //                         type="password"
    //                         value={formData.confirmPassword}
    //                         onChange={handleChange}
    //                     />
    //                     <Button
    //                         type="submit"
    //                         fullWidth
    //                         variant="contained"
    //                         sx={{ mt: 3, mb: 2, py: 1.5 }}
    //                     >
    //                         Next
    //                     </Button>
    //                 </Box>
    //             </Paper>
    //         </Container>
    //     </ThemeProvider>
    // );
};

export default RegistrationForm;