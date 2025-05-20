import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Container,
    Link,
    useTheme,
    alpha,
    Snackbar,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, X, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordService from '../services/ForgotPasswordService';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [validationCode, setValidationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const navigate = useNavigate();
    const theme = useTheme();
    const forgotPasswordService = ForgotPasswordService.getInstance();

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
        if (error) setError(null);
    };

    const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValidationCode(event.target.value);
        if (error) setError(null);
    };

    const handleNewPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(event.target.value);
        if (error) setError(null);
    };

    const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(event.target.value);
        if (error) setError(null);
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateEmail = () => {
        if (!email) {
            setError('Please enter your email address');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const validateCode = () => {
        if (!validationCode) {
            setError('Please enter the verification code');
            return false;
        }

        if (validationCode.length !== 6 || !/^\d+$/.test(validationCode)) {
            setError('Please enter a valid 6-digit code');
            return false;
        }

        return true;
    };

    const validatePassword = () => {
        if (!newPassword) {
            setError('Please enter a new password');
            return false;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleRequestCode = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateEmail()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await forgotPasswordService.requestValidationCode(email);
            setActiveStep(1); // Move to code verification step
        } catch (err) {
            setError('Failed to send password reset email. Please try again.');
            console.error('Error sending reset email:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyCode = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateCode()) return;

        // Just move to next step - actual verification happens at final submission
        setActiveStep(2);
    };

    const handleResetPassword = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validatePassword()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Call service to verify code and reset password
            await forgotPasswordService.requestPasswordReset(email, newPassword);
            setResetSuccess(true);
        } catch (err) {
            setError('Failed to reset password. Please verify your code and try again.');
            console.error('Error resetting password:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/');
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setError(null);
    };

    const handleCloseError = () => {
        setError(null);
    };

    const steps = ['Request Code', 'Verify Code', 'Reset Password'];

    // Determine which form to show based on active step
    const renderStepContent = () => {
        if (resetSuccess) {
            return (
                <Box sx={{ textAlign: 'center' }}>
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: theme.palette.success.main
                        }}
                    >
                        <CheckCircle size={40} />
                    </Box>
                    <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                        Password Reset Successfully
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Your password has been reset successfully. You can now log in with your new password.
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleBackToLogin}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            backgroundColor: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark
                            }
                        }}
                    >
                        Back to Login
                    </Button>
                </Box>
            );
        }

        switch (activeStep) {
            case 0:
                return (
                    <Box component="form" onSubmit={handleRequestCode}>
                        <Button
                            startIcon={<ArrowLeft size={18} />}
                            onClick={handleBackToLogin}
                            sx={{
                                mb: 2,
                                color: theme.palette.text.secondary,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            Back to Login
                        </Button>

                        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                            Forgot Password?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Enter your email address below and we'll send you a code to reset your password.
                        </Typography>

                        <TextField
                            fullWidth
                            label="Email Address"
                            variant="outlined"
                            value={email}
                            onChange={handleEmailChange}
                            error={!!error}
                            helperText={error}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: 2,
                                        borderColor: theme.palette.primary.main
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Mail size={20} color={theme.palette.text.secondary} />
                                    </InputAdornment>
                                ),
                                endAdornment: error && (
                                    <InputAdornment position="end">
                                        <AlertCircle size={20} color={theme.palette.error.main} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Send Reset Code'
                            )}
                        </Button>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Remember your password?{' '}
                                <Link
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleBackToLogin();
                                    }}
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    Log in
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                );
            case 1:
                return (
                    <Box component="form" onSubmit={handleVerifyCode}>
                        <Button
                            startIcon={<ArrowLeft size={18} />}
                            onClick={handleBack}
                            sx={{
                                mb: 2,
                                color: theme.palette.text.secondary,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            Back
                        </Button>

                        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                            Enter Verification Code
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            We've sent a 6-digit code to {email}. Enter the code below to continue.
                        </Typography>

                        <TextField
                            fullWidth
                            label="Verification Code"
                            variant="outlined"
                            value={validationCode}
                            onChange={handleCodeChange}
                            error={!!error}
                            helperText={error}
                            placeholder="123456"
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: 2,
                                        borderColor: theme.palette.primary.main
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <KeyRound size={20} color={theme.palette.text.secondary} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Verify Code'
                            )}
                        </Button>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Didn't receive the code?{' '}
                                <Link
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveStep(0);
                                    }}
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    Try again
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                );
            case 2:
                return (
                    <Box component="form" onSubmit={handleResetPassword}>
                        <Button
                            startIcon={<ArrowLeft size={18} />}
                            onClick={handleBack}
                            sx={{
                                mb: 2,
                                color: theme.palette.text.secondary,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            Back
                        </Button>

                        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                            Create New Password
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Enter a new password for your account. Password must be at least 8 characters long.
                        </Typography>

                        <TextField
                            fullWidth
                            label="New Password"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            error={!!error}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: 2,
                                        borderColor: theme.palette.primary.main
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock size={20} color={theme.palette.text.secondary} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleTogglePasswordVisibility}
                                            edge="end"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Confirm Password"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            error={!!error}
                            helperText={error}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: 2,
                                        borderColor: theme.palette.primary.main
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock size={20} color={theme.palette.text.secondary} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    p: 4,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`
                }}
            >
                {!resetSuccess && (
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                )}

                {renderStepContent()}
            </Paper>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    onClose={handleCloseError}
                    sx={{
                        width: '100%',
                        alignItems: 'center',
                        borderRadius: 2
                    }}
                    action={
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleCloseError}
                        >
                            <X size={16} />
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ForgotPassword;