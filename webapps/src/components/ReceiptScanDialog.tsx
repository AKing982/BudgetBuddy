
import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
    alpha,
    useTheme,
    SelectChangeEvent,
} from '@mui/material';
import {
    Upload,
    X,
    Camera,
    FileImage,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface Budget {
    id: number;
    name: string;
    budgetAmount: number;
}

interface ReceiptScanDialogProps {
    open: boolean;
    onClose: () => void;
    budgets: Budget[];
    onUpload: (file: File, budgetId: number) => Promise<void>;
}

const ReceiptScanDialog: React.FC<ReceiptScanDialogProps> = ({
                                                                 open,
                                                                 onClose,
                                                                 budgets,
                                                                 onUpload,
                                                             }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedBudgetId, setSelectedBudgetId] = useState<number | ''>('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState<string>('');
    const theme = useTheme();

    const handleReset = () => {
        setSelectedFile(null);
        setSelectedBudgetId('');
        setPreviewUrl(null);
        setError('');
        setUploadSuccess(false);
        setIsUploading(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPG, PNG, HEIC, etc.)');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setError('');

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        },
        [handleFileSelect]
    );

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleBudgetChange = (event: SelectChangeEvent<number>) => {
        setSelectedBudgetId(event.target.value as number);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('');
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedBudgetId) {
            setError('Please select both a receipt image and a budget');
            return;
        }

        try {
            setIsUploading(true);
            setError('');
            await onUpload(selectedFile, selectedBudgetId as number);
            setUploadSuccess(true);

            // Auto-close after success
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload receipt. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                            color: 'white',
                        }}
                    >
                        <Camera size={24} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                            Scan Receipt
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Upload an image of your grocery receipt
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: 'error.main',
                            },
                        }}
                    >
                        <X size={20} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {/* Success Message */}
                {uploadSuccess && (
                    <Alert
                        icon={<CheckCircle2 size={20} />}
                        severity="success"
                        sx={{
                            mb: 3,
                            borderRadius: 3,
                            '& .MuiAlert-icon': {
                                alignItems: 'center',
                            },
                        }}
                    >
                        Receipt uploaded successfully!
                    </Alert>
                )}

                {/* Error Message */}
                {error && (
                    <Alert
                        icon={<AlertCircle size={20} />}
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 3,
                            '& .MuiAlert-icon': {
                                alignItems: 'center',
                            },
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {/* Budget Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="budget-select-label">Select Budget</InputLabel>
                    <Select
                        labelId="budget-select-label"
                        value={selectedBudgetId}
                        label="Select Budget"
                        onChange={handleBudgetChange}
                        sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(theme.palette.divider, 0.8),
                            },
                        }}
                    >
                        {budgets.map((budget) => (
                            <MenuItem key={budget.id} value={budget.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Typography sx={{ flex: 1, fontWeight: 500 }}>
                                        {budget.name}
                                    </Typography>
                                    <Chip
                                        label={`$${budget.budgetAmount.toFixed(0)}`}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                        }}
                                    />
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* File Upload Area */}
                {!selectedFile ? (
                    <Paper
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        sx={{
                            border: `2px dashed ${
                                isDragging
                                    ? theme.palette.primary.main
                                    : alpha(theme.palette.divider, 0.8)
                            }`,
                            borderRadius: 3,
                            p: 4,
                            textAlign: 'center',
                            bgcolor: isDragging
                                ? alpha(theme.palette.primary.main, 0.05)
                                : alpha(theme.palette.background.default, 0.5),
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                            },
                        }}
                        onClick={() => document.getElementById('receipt-file-input')?.click()}
                    >
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                mb: 2,
                            }}
                        >
                            <Upload size={32} color={theme.palette.primary.main} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Drop your receipt here
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            or click to browse files
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Supports: JPG, PNG, HEIC (Max 10MB)
                        </Typography>
                        <input
                            id="receipt-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                        />
                    </Paper>
                ) : (
                    /* File Preview */
                    <Paper
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                        }}
                    >
                        {/* Preview Image */}
                        {previewUrl && (
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: 300,
                                    bgcolor: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src={previewUrl}
                                    alt="Receipt preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                                <IconButton
                                    onClick={handleRemoveFile}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        bgcolor: alpha('#000', 0.6),
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: alpha('#000', 0.8),
                                        },
                                    }}
                                >
                                    <X size={18} />
                                </IconButton>
                            </Box>
                        )}

                        {/* File Info */}
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                    }}
                                >
                                    <FileImage size={20} color={theme.palette.success.main} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {selectedFile.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1].toUpperCase()}
                                    </Typography>
                                </Box>
                                <Chip
                                    icon={<CheckCircle2 size={14} />}
                                    label="Ready"
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        color: theme.palette.success.main,
                                        fontWeight: 600,
                                    }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                )}

                {/* Info Alert */}
                <Alert
                    severity="info"
                    icon={<AlertCircle size={18} />}
                    sx={{
                        mt: 3,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                        '& .MuiAlert-icon': {
                            alignItems: 'center',
                        },
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Our AI will automatically extract items and prices from your receipt
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={isUploading}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 600,
                        borderColor: alpha(theme.palette.divider, 0.8),
                        color: 'text.primary',
                        '&:hover': {
                            borderColor: theme.palette.text.primary,
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!selectedFile || !selectedBudgetId || isUploading}
                    startIcon={
                        isUploading ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            <Upload size={18} />
                        )
                    }
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
                        },
                        '&.Mui-disabled': {
                            background: alpha(theme.palette.action.disabled, 0.12),
                        },
                    }}
                >
                    {isUploading ? 'Uploading...' : 'Upload Receipt'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReceiptScanDialog;