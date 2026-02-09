import React, {useState} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { Upload, X } from 'lucide-react';

interface CSVImportDialogProps{
    open: boolean;
    onClose: () => void;
    onImport: (data: {
        file: File;
        startDate: string;
        endDate: string;
        institution: string;
        accountName: string;
    }) => void;
}

// Common financial institutions
const INSTITUTIONS = [
    'Chase',
    'Bank of America',
    'Wells Fargo',
    'Granite Credit Union',
    'Mountain America Credit Union'
];

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onClose, onImport}) => {
    const [file, setFile] = useState<File | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [institution, setInstitution] = useState<string>('');
    const [accountName, setAccountName] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
                setError('');
            } else {
                setError('Please select a valid CSV file');
                setFile(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
    };

    const handleImport = () => {
        if (!file) {
            setError('Please select a CSV file');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date must be before end date');
            return;
        }
        if (!institution) {
            setError('Please select an institution');
            return;
        }
        if (!accountName.trim()) {
            setError('Please enter an account name');
            return;
        }

        // Import logic here
        console.log('Importing:', { file, startDate, endDate, institution, accountName });
        onImport({ file, startDate, endDate, institution, accountName });

        // Reset form
        setFile(null);
        setStartDate('');
        setEndDate('');
        setInstitution('');
        setAccountName('');
        setError('');
    };

    const handleClose = () => {
        setFile(null);
        setStartDate('');
        setEndDate('');
        setInstitution('');
        setAccountName('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Import CSV Data
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* File Upload */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            CSV File
                        </Typography>
                        {!file ? (
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                startIcon={<Upload size={20} />}
                                sx={{
                                    py: 2,
                                    borderStyle: 'dashed',
                                    textTransform: 'none'
                                }}
                            >
                                Choose CSV File
                                <input
                                    type="file"
                                    hidden
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                            </Button>
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'success.main',
                                    borderRadius: 1,
                                    bgcolor: 'success.lighter'
                                }}
                            >
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    {file.name}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={handleRemoveFile}
                                    sx={{ ml: 1 }}
                                >
                                    <X size={18} />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Institution Selection */}
                    <Box>
                        <FormControl fullWidth>
                            <InputLabel id="institution-label">Institution</InputLabel>
                            <Select
                                labelId="institution-label"
                                id="institution-select"
                                value={institution}
                                label="Institution"
                                onChange={(e) => setInstitution(e.target.value)}
                            >
                                {INSTITUTIONS.map((inst) => (
                                    <MenuItem key={inst} value={inst}>
                                        {inst}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Account Name */}
                    <Box>
                        <TextField
                            label="Account Name"
                            fullWidth
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="e.g., Checking Account, Visa Credit Card"
                            helperText="Enter a descriptive name for this account"
                        />
                    </Box>

                    {/* Date Range */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Date Range
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Start Date"
                                type="date"
                                fullWidth
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={!file || !startDate || !endDate || !institution || !accountName.trim()}
                >
                    Import
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CSVImportDialog;