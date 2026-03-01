import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Container,
    Link,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Alert,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Mail, ArrowLeft, CheckCircle, KeyRound, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordService from '../services/ForgotPasswordService';

const theme = createTheme({
    palette: {
        background: { default: '#d6d6d6' },
        primary: { main: '#800000', light: '#9a3324', dark: '#600000' },
        secondary: { main: '#f8f0e5' },
        text: { primary: '#333333', secondary: '#666666' },
        error: { main: '#d32f2f' },
        success: { main: '#2e7d32' },
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
        MuiStepper: {
            styleOverrides: {
                root: {
                    '& .MuiStepIcon-root.Mui-active': { color: '#800000' },
                    '& .MuiStepIcon-root.Mui-completed': { color: '#2e7d32' },
                },
            },
        },
    },
});

const steps = ['Request Code', 'Verify Code', 'Reset Password'];

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [validationCode, setValidationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const navigate = useNavigate();
    const forgotPasswordService = ForgotPasswordService.getInstance();

    const clearError = () => { if (error) setError(null); };

    const validateEmail = () => {
        if (!email) { setError('Please enter your email address'); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return false; }
        return true;
    };

    const validateCode = () => {
        if (!validationCode) { setError('Please enter the verification code'); return false; }
        if (validationCode.length !== 6 || !/^\d+$/.test(validationCode)) { setError('Please enter a valid 6-digit code'); return false; }
        return true;
    };

    const validatePassword = () => {
        if (!newPassword) { setError('Please enter a new password'); return false; }
        if (newPassword.length < 8) { setError('Password must be at least 8 characters long'); return false; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return false; }
        return true;
    };

    const handleRequestCode = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateEmail()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await forgotPasswordService.requestValidationCode(email);
            setActiveStep(1);
        } catch (err) {
            setError('Failed to send password reset email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyCode = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateCode()) return;
        setActiveStep(2);
    };

    const handleResetPassword = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validatePassword()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await forgotPasswordService.requestPasswordReset(email, newPassword);
            setResetSuccess(true);
        } catch (err) {
            setError('Failed to reset password. Please verify your code and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToLogin = () => navigate('/');
    const handleBack = () => { setActiveStep(s => s - 1); setError(null); };

    const BackButton = ({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) => (
        <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={onClick}
            disableRipple
            sx={{
                mb: 2, px: 0, py: 0.5,
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.875rem',
                minWidth: 0,
                borderRadius: 2,
                '&:hover': { color: '#800000', backgroundColor: 'transparent' },
            }}
        >
            {label}
        </Button>
    );

    const renderStepContent = () => {
        if (resetSuccess) {
            return (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '50%',
                        bgcolor: 'rgba(46,125,50,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 3, color: '#2e7d32',
                    }}>
                        <CheckCircle size={36} />
                    </Box>
                    <Typography variant="h5" gutterBottom>Password Reset Successfully</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Your password has been reset. You can now log in with your new password.
                    </Typography>
                    <Button variant="contained" fullWidth onClick={handleBackToLogin} sx={{ height: 52 }}>
                        Back to Login
                    </Button>
                </Box>
            );
        }

        if (activeStep === 0) {
            return (
                <Box component="form" onSubmit={handleRequestCode}>
                    <BackButton onClick={handleBackToLogin} label="Back to Login" />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box sx={{ color: '#800000' }}><Mail size={22} /></Box>
                        <Typography variant="h5">Forgot Password?</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter your email and we'll send you a code to reset your password.
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={clearError}>{error}</Alert>}
                    <TextField
                        fullWidth label="Email Address"
                        value={email}
                        onChange={e => { setEmail(e.target.value); clearError(); }}
                        error={!!error}
                        sx={{ mb: 3 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ pl: 1 }}>
                                    <Mail size={17} color="#888" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: 52, mb: 3 }}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
                    </Button>
                    <Typography variant="body2" color="text.secondary" align="center">
                        Remember your password?{' '}
                        <Link onClick={handleBackToLogin} sx={{ color: '#800000', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            Log in
                        </Link>
                    </Typography>
                </Box>
            );
        }

        if (activeStep === 1) {
            return (
                <Box component="form" onSubmit={handleVerifyCode}>
                    <BackButton onClick={handleBack} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box sx={{ color: '#800000' }}><KeyRound size={22} /></Box>
                        <Typography variant="h5">Verify Code</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        We've sent a 6-digit code to <strong>{email}</strong>. Enter it below.
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={clearError}>{error}</Alert>}
                    <TextField
                        fullWidth label="Verification Code"
                        value={validationCode}
                        onChange={e => { setValidationCode(e.target.value); clearError(); }}
                        error={!!error}
                        placeholder="123456"
                        inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', fontWeight: 600, fontSize: '1.1rem' } }}
                        sx={{ mb: 3 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ pl: 1 }}>
                                    <KeyRound size={17} color="#888" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: 52, mb: 3 }}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
                    </Button>
                    <Typography variant="body2" color="text.secondary" align="center">
                        Didn't receive the code?{' '}
                        <Link onClick={() => setActiveStep(0)} sx={{ color: '#800000', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            Try again
                        </Link>
                    </Typography>
                </Box>
            );
        }

        if (activeStep === 2) {
            return (
                <Box component="form" onSubmit={handleResetPassword}>
                    <BackButton onClick={handleBack} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box sx={{ color: '#800000' }}><Lock size={22} /></Box>
                        <Typography variant="h5">Create New Password</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter a new password for your account. Must be at least 8 characters.
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={clearError}>{error}</Alert>}
                    <TextField
                        fullWidth label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); clearError(); }}
                        sx={{ mb: 2.5 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ pl: 1 }}>
                                    <Lock size={17} color="#888" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(p => !p)} edge="end" size="small" sx={{ mr: 1, color: '#888' }}>
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                        sx={{ mb: 3.5 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ pl: 1 }}>
                                    <Lock size={17} color="#888" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirmPassword(p => !p)} edge="end" size="small" sx={{ mr: 1, color: '#888' }}>
                                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: 52 }}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                    </Button>
                </Box>
            );
        }

        return null;
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
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
                <Container maxWidth="xs">
                    <Paper elevation={4} sx={{ borderRadius: 3, px: 5, pt: 4, pb: 5, background: '#ffffff' }}>

                        {/* Logo — small, clickable, takes you back to login */}
                        <Box
                            onClick={handleBackToLogin}
                            sx={{ display: 'flex', justifyContent: 'center', mb: 3, cursor: 'pointer' }}
                        >
                            <Box
                                component="img"
                                src="/budget_buddy_logo_clean.png"
                                alt="Budget Buddy"
                                sx={{
                                    width: '70%',
                                    maxWidth: 220,
                                    height: 'auto',
                                    objectFit: 'contain',
                                    backgroundColor: '#ffffff',
                                }}
                            />
                        </Box>

                        {/* Stepper — hidden once reset succeeds */}
                        {!resetSuccess && (
                            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>
                                {steps.map(label => (
                                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                                ))}
                            </Stepper>
                        )}

                        {renderStepContent()}
                    </Paper>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default ForgotPassword;



// import React, { useState } from 'react';
// import {
//     Box,
//     Typography,
//     TextField,
//     Button,
//     Paper,
//     Container,
//     Link,
//     useTheme,
//     alpha,
//     Snackbar,
//     Alert,
//     CircularProgress,
//     InputAdornment,
//     IconButton,
//     Stepper,
//     Step,
//     StepLabel
// } from '@mui/material';
// import { Mail, ArrowLeft, AlertCircle, CheckCircle, X, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import ForgotPasswordService from '../services/ForgotPasswordService';
//
// const ForgotPassword: React.FC = () => {
//     const [email, setEmail] = useState('');
//     const [validationCode, setValidationCode] = useState('');
//     const [newPassword, setNewPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [activeStep, setActiveStep] = useState(0);
//     const [error, setError] = useState<string | null>(null);
//     const [showPassword, setShowPassword] = useState(false);
//     const [resetSuccess, setResetSuccess] = useState(false);
//
//     const navigate = useNavigate();
//     const theme = useTheme();
//     const forgotPasswordService = ForgotPasswordService.getInstance();
//
//     const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setEmail(event.target.value);
//         if (error) setError(null);
//     };
//
//     const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setValidationCode(event.target.value);
//         if (error) setError(null);
//     };
//
//     const handleNewPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setNewPassword(event.target.value);
//         if (error) setError(null);
//     };
//
//     const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setConfirmPassword(event.target.value);
//         if (error) setError(null);
//     };
//
//     const handleTogglePasswordVisibility = () => {
//         setShowPassword(!showPassword);
//     };
//
//     const validateEmail = () => {
//         if (!email) {
//             setError('Please enter your email address');
//             return false;
//         }
//
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(email)) {
//             setError('Please enter a valid email address');
//             return false;
//         }
//
//         return true;
//     };
//
//     const validateCode = () => {
//         if (!validationCode) {
//             setError('Please enter the verification code');
//             return false;
//         }
//
//         if (validationCode.length !== 6 || !/^\d+$/.test(validationCode)) {
//             setError('Please enter a valid 6-digit code');
//             return false;
//         }
//
//         return true;
//     };
//
//     const validatePassword = () => {
//         if (!newPassword) {
//             setError('Please enter a new password');
//             return false;
//         }
//
//         if (newPassword.length < 8) {
//             setError('Password must be at least 8 characters long');
//             return false;
//         }
//
//         if (newPassword !== confirmPassword) {
//             setError('Passwords do not match');
//             return false;
//         }
//
//         return true;
//     };
//
//     const handleRequestCode = async (event: React.FormEvent) => {
//         event.preventDefault();
//
//         if (!validateEmail()) return;
//
//         setIsSubmitting(true);
//         setError(null);
//
//         try {
//             await forgotPasswordService.requestValidationCode(email);
//             setActiveStep(1); // Move to code verification step
//         } catch (err) {
//             setError('Failed to send password reset email. Please try again.');
//             console.error('Error sending reset email:', err);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//
//     const handleVerifyCode = async (event: React.FormEvent) => {
//         event.preventDefault();
//
//         if (!validateCode()) return;
//
//         // Just move to next step - actual verification happens at final submission
//         setActiveStep(2);
//     };
//
//     const handleResetPassword = async (event: React.FormEvent) => {
//         event.preventDefault();
//
//         if (!validatePassword()) return;
//
//         setIsSubmitting(true);
//         setError(null);
//
//         try {
//             // Call service to verify code and reset password
//             await forgotPasswordService.requestPasswordReset(email, newPassword);
//             setResetSuccess(true);
//         } catch (err) {
//             setError('Failed to reset password. Please verify your code and try again.');
//             console.error('Error resetting password:', err);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//
//     const handleBackToLogin = () => {
//         navigate('/');
//     };
//
//     const handleBack = () => {
//         setActiveStep((prevStep) => prevStep - 1);
//         setError(null);
//     };
//
//     const handleCloseError = () => {
//         setError(null);
//     };
//
//     const steps = ['Request Code', 'Verify Code', 'Reset Password'];
//
//     // Determine which form to show based on active step
//     const renderStepContent = () => {
//         if (resetSuccess) {
//             return (
//                 <Box sx={{ textAlign: 'center' }}>
//                     <Box
//                         sx={{
//                             width: 80,
//                             height: 80,
//                             borderRadius: '50%',
//                             bgcolor: alpha(theme.palette.success.main, 0.1),
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             margin: '0 auto 24px',
//                             color: theme.palette.success.main
//                         }}
//                     >
//                         <CheckCircle size={40} />
//                     </Box>
//                     <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
//                         Password Reset Successfully
//                     </Typography>
//                     <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
//                         Your password has been reset successfully. You can now log in with your new password.
//                     </Typography>
//                     <Button
//                         variant="contained"
//                         fullWidth
//                         onClick={handleBackToLogin}
//                         sx={{
//                             py: 1.5,
//                             borderRadius: 2,
//                             textTransform: 'none',
//                             fontSize: '1rem',
//                             fontWeight: 600,
//                             backgroundColor: theme.palette.primary.main,
//                             '&:hover': {
//                                 backgroundColor: theme.palette.primary.dark
//                             }
//                         }}
//                     >
//                         Back to Login
//                     </Button>
//                 </Box>
//             );
//         }
//
//         switch (activeStep) {
//             case 0:
//                 return (
//                     <Box component="form" onSubmit={handleRequestCode}>
//                         <Button
//                             startIcon={<ArrowLeft size={18} />}
//                             onClick={handleBackToLogin}
//                             sx={{
//                                 mb: 2,
//                                 color: theme.palette.text.secondary,
//                                 textTransform: 'none',
//                                 '&:hover': {
//                                     backgroundColor: 'transparent',
//                                     color: theme.palette.primary.main
//                                 }
//                             }}
//                         >
//                             Back to Login
//                         </Button>
//
//                         <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
//                             Forgot Password?
//                         </Typography>
//                         <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
//                             Enter your email address below and we'll send you a code to reset your password.
//                         </Typography>
//
//                         <TextField
//                             fullWidth
//                             label="Email Address"
//                             variant="outlined"
//                             value={email}
//                             onChange={handleEmailChange}
//                             error={!!error}
//                             helperText={error}
//                             sx={{
//                                 mb: 3,
//                                 '& .MuiOutlinedInput-root': {
//                                     borderRadius: 2,
//                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                         borderWidth: 2,
//                                         borderColor: theme.palette.primary.main
//                                     }
//                                 }
//                             }}
//                             InputProps={{
//                                 startAdornment: (
//                                     <InputAdornment position="start">
//                                         <Mail size={20} color={theme.palette.text.secondary} />
//                                     </InputAdornment>
//                                 ),
//                                 endAdornment: error && (
//                                     <InputAdornment position="end">
//                                         <AlertCircle size={20} color={theme.palette.error.main} />
//                                     </InputAdornment>
//                                 )
//                             }}
//                         />
//
//                         <Button
//                             type="submit"
//                             variant="contained"
//                             fullWidth
//                             disabled={isSubmitting}
//                             sx={{
//                                 py: 1.5,
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 fontSize: '1rem',
//                                 fontWeight: 600,
//                                 backgroundColor: theme.palette.primary.main,
//                                 '&:hover': {
//                                     backgroundColor: theme.palette.primary.dark
//                                 }
//                             }}
//                         >
//                             {isSubmitting ? (
//                                 <CircularProgress size={24} color="inherit" />
//                             ) : (
//                                 'Send Reset Code'
//                             )}
//                         </Button>
//
//                         <Box sx={{ mt: 3, textAlign: 'center' }}>
//                             <Typography variant="body2" color="text.secondary">
//                                 Remember your password?{' '}
//                                 <Link
//                                     href="#"
//                                     onClick={(e) => {
//                                         e.preventDefault();
//                                         handleBackToLogin();
//                                     }}
//                                     sx={{
//                                         color: theme.palette.primary.main,
//                                         fontWeight: 600,
//                                         textDecoration: 'none',
//                                         '&:hover': {
//                                             textDecoration: 'underline'
//                                         }
//                                     }}
//                                 >
//                                     Log in
//                                 </Link>
//                             </Typography>
//                         </Box>
//                     </Box>
//                 );
//             case 1:
//                 return (
//                     <Box component="form" onSubmit={handleVerifyCode}>
//                         <Button
//                             startIcon={<ArrowLeft size={18} />}
//                             onClick={handleBack}
//                             sx={{
//                                 mb: 2,
//                                 color: theme.palette.text.secondary,
//                                 textTransform: 'none',
//                                 '&:hover': {
//                                     backgroundColor: 'transparent',
//                                     color: theme.palette.primary.main
//                                 }
//                             }}
//                         >
//                             Back
//                         </Button>
//
//                         <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
//                             Enter Verification Code
//                         </Typography>
//                         <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
//                             We've sent a 6-digit code to {email}. Enter the code below to continue.
//                         </Typography>
//
//                         <TextField
//                             fullWidth
//                             label="Verification Code"
//                             variant="outlined"
//                             value={validationCode}
//                             onChange={handleCodeChange}
//                             error={!!error}
//                             helperText={error}
//                             placeholder="123456"
//                             sx={{
//                                 mb: 3,
//                                 '& .MuiOutlinedInput-root': {
//                                     borderRadius: 2,
//                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                         borderWidth: 2,
//                                         borderColor: theme.palette.primary.main
//                                     }
//                                 }
//                             }}
//                             InputProps={{
//                                 startAdornment: (
//                                     <InputAdornment position="start">
//                                         <KeyRound size={20} color={theme.palette.text.secondary} />
//                                     </InputAdornment>
//                                 )
//                             }}
//                         />
//
//                         <Button
//                             type="submit"
//                             variant="contained"
//                             fullWidth
//                             disabled={isSubmitting}
//                             sx={{
//                                 py: 1.5,
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 fontSize: '1rem',
//                                 fontWeight: 600,
//                                 backgroundColor: theme.palette.primary.main,
//                                 '&:hover': {
//                                     backgroundColor: theme.palette.primary.dark
//                                 }
//                             }}
//                         >
//                             {isSubmitting ? (
//                                 <CircularProgress size={24} color="inherit" />
//                             ) : (
//                                 'Verify Code'
//                             )}
//                         </Button>
//
//                         <Box sx={{ mt: 3, textAlign: 'center' }}>
//                             <Typography variant="body2" color="text.secondary">
//                                 Didn't receive the code?{' '}
//                                 <Link
//                                     href="#"
//                                     onClick={(e) => {
//                                         e.preventDefault();
//                                         setActiveStep(0);
//                                     }}
//                                     sx={{
//                                         color: theme.palette.primary.main,
//                                         fontWeight: 600,
//                                         textDecoration: 'none',
//                                         '&:hover': {
//                                             textDecoration: 'underline'
//                                         }
//                                     }}
//                                 >
//                                     Try again
//                                 </Link>
//                             </Typography>
//                         </Box>
//                     </Box>
//                 );
//             case 2:
//                 return (
//                     <Box component="form" onSubmit={handleResetPassword}>
//                         <Button
//                             startIcon={<ArrowLeft size={18} />}
//                             onClick={handleBack}
//                             sx={{
//                                 mb: 2,
//                                 color: theme.palette.text.secondary,
//                                 textTransform: 'none',
//                                 '&:hover': {
//                                     backgroundColor: 'transparent',
//                                     color: theme.palette.primary.main
//                                 }
//                             }}
//                         >
//                             Back
//                         </Button>
//
//                         <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
//                             Create New Password
//                         </Typography>
//                         <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
//                             Enter a new password for your account. Password must be at least 8 characters long.
//                         </Typography>
//
//                         <TextField
//                             fullWidth
//                             label="New Password"
//                             variant="outlined"
//                             type={showPassword ? 'text' : 'password'}
//                             value={newPassword}
//                             onChange={handleNewPasswordChange}
//                             error={!!error}
//                             sx={{
//                                 mb: 3,
//                                 '& .MuiOutlinedInput-root': {
//                                     borderRadius: 2,
//                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                         borderWidth: 2,
//                                         borderColor: theme.palette.primary.main
//                                     }
//                                 }
//                             }}
//                             InputProps={{
//                                 startAdornment: (
//                                     <InputAdornment position="start">
//                                         <Lock size={20} color={theme.palette.text.secondary} />
//                                     </InputAdornment>
//                                 ),
//                                 endAdornment: (
//                                     <InputAdornment position="end">
//                                         <IconButton
//                                             onClick={handleTogglePasswordVisibility}
//                                             edge="end"
//                                         >
//                                             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                                         </IconButton>
//                                     </InputAdornment>
//                                 )
//                             }}
//                         />
//
//                         <TextField
//                             fullWidth
//                             label="Confirm Password"
//                             variant="outlined"
//                             type={showPassword ? 'text' : 'password'}
//                             value={confirmPassword}
//                             onChange={handleConfirmPasswordChange}
//                             error={!!error}
//                             helperText={error}
//                             sx={{
//                                 mb: 3,
//                                 '& .MuiOutlinedInput-root': {
//                                     borderRadius: 2,
//                                     '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                         borderWidth: 2,
//                                         borderColor: theme.palette.primary.main
//                                     }
//                                 }
//                             }}
//                             InputProps={{
//                                 startAdornment: (
//                                     <InputAdornment position="start">
//                                         <Lock size={20} color={theme.palette.text.secondary} />
//                                     </InputAdornment>
//                                 )
//                             }}
//                         />
//
//                         <Button
//                             type="submit"
//                             variant="contained"
//                             fullWidth
//                             disabled={isSubmitting}
//                             sx={{
//                                 py: 1.5,
//                                 borderRadius: 2,
//                                 textTransform: 'none',
//                                 fontSize: '1rem',
//                                 fontWeight: 600,
//                                 backgroundColor: theme.palette.primary.main,
//                                 '&:hover': {
//                                     backgroundColor: theme.palette.primary.dark
//                                 }
//                             }}
//                         >
//                             {isSubmitting ? (
//                                 <CircularProgress size={24} color="inherit" />
//                             ) : (
//                                 'Reset Password'
//                             )}
//                         </Button>
//                     </Box>
//                 );
//             default:
//                 return null;
//         }
//     };
//
//     return (
//         <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//             <Paper
//                 elevation={0}
//                 sx={{
//                     width: '100%',
//                     p: 4,
//                     borderRadius: 3,
//                     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
//                     background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`,
//                     backdropFilter: 'blur(10px)',
//                     border: `1px solid ${alpha(theme.palette.divider, 0.6)}`
//                 }}
//             >
//                 {!resetSuccess && (
//                     <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//                         {steps.map((label) => (
//                             <Step key={label}>
//                                 <StepLabel>{label}</StepLabel>
//                             </Step>
//                         ))}
//                     </Stepper>
//                 )}
//
//                 {renderStepContent()}
//             </Paper>
//
//             <Snackbar
//                 open={!!error}
//                 autoHideDuration={6000}
//                 onClose={handleCloseError}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//             >
//                 <Alert
//                     severity="error"
//                     onClose={handleCloseError}
//                     sx={{
//                         width: '100%',
//                         alignItems: 'center',
//                         borderRadius: 2
//                     }}
//                     action={
//                         <IconButton
//                             size="small"
//                             aria-label="close"
//                             color="inherit"
//                             onClick={handleCloseError}
//                         >
//                             <X size={16} />
//                         </IconButton>
//                     }
//                 >
//                     {error}
//                 </Alert>
//             </Snackbar>
//         </Container>
//     );
// };
//
// export default ForgotPassword;