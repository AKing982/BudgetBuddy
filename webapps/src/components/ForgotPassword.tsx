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
    IconButton
} from '@mui/material';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const theme = useTheme();

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validate email
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Replace this with your actual API call
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

            // Simulating successful password reset email
            setEmailSent(true);
            setEmail('');
        } catch (err) {
            setError('Failed to send password reset email. Please try again.');
            console.error('Error sending reset email:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/');
    };

    const handleCloseError = () => {
        setError(null);
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
                {emailSent ? (
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
                            Check Your Email
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Didn't receive the email? Check your spam folder or try again.
                        </Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setEmailSent(false)}
                            sx={{
                                py: 1.5,
                                mb: 2,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    borderColor: theme.palette.primary.dark,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }
                            }}
                        >
                            Try Again
                        </Button>
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
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
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
                            Enter your email address below and we'll send you a link to reset your password.
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
                                'Send Reset Link'
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
                )}
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