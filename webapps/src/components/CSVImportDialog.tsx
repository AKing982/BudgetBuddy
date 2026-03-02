// import React, {useState} from "react";
// import {
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     Button,
//     TextField,
//     Box,
//     Typography,
//     IconButton,
//     Alert,
//     MenuItem,
//     Select,
//     FormControl,
//     InputLabel
// } from '@mui/material';
import React, { useState } from "react";
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
    InputLabel,
    alpha,
} from '@mui/material';
import { Upload, X, FileText } from 'lucide-react';

interface CSVImportDialogProps {
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

const INSTITUTIONS = [
    'Chase',
    'Bank of America',
    'Wells Fargo',
    'Granite Credit Union',
    'Mountain America Credit Union',
];

const MAROON      = '#800000';
const MAROON_DARK = '#600000';

// Shared field style — matches the banking aesthetic
const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '6px',
        fontSize: '0.875rem',
        bgcolor: '#fafafa',
        '& fieldset': { borderColor: '#d5d5d5' },
        '&:hover fieldset': { borderColor: MAROON },
        '&.Mui-focused fieldset': { borderColor: MAROON, borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: MAROON },
    '& .MuiFormHelperText-root': { fontSize: '0.72rem', mt: 0.5 },
};

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [institution, setInstitution] = useState('');
    const [accountName, setAccountName] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (selected.type === 'text/csv' || selected.name.endsWith('.csv')) {
            setFile(selected);
            setError('');
        } else {
            setError('Please select a valid CSV file');
            setFile(null);
        }
    };

    const handleImport = () => {
        if (!file)                              return setError('Please select a CSV file');
        if (!startDate || !endDate)             return setError('Please select both start and end dates');
        if (new Date(startDate) > new Date(endDate)) return setError('Start date must be before end date');
        if (!institution)                       return setError('Please select an institution');
        if (!accountName.trim())                return setError('Please enter an account name');

        onImport({ file, startDate, endDate, institution, accountName });
        handleClose();
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

    const canImport = !!file && !!startDate && !!endDate && !!institution && !!accountName.trim();

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    overflow: 'hidden',
                }
            }}
        >
            {/* ── Header ── */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                    px: 3, pt: 3, pb: 2,
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Box>
                        <Box sx={{ width: 24, height: 3, background: MAROON, borderRadius: '2px', mb: 0.6 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', letterSpacing: '-0.01em' }}>
                            Import CSV Data
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.25 }}>
                            Upload a transaction file from your financial institution
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{
                            color: '#999', border: '1px solid #e8e8e8', borderRadius: '6px',
                            '&:hover': { color: MAROON, borderColor: MAROON, bgcolor: alpha(MAROON, 0.04) },
                        }}
                    >
                        <X size={16} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Error */}
                    {error && (
                        <Alert
                            severity="error"
                            onClose={() => setError('')}
                            sx={{ borderRadius: '6px', fontSize: '0.8rem', py: 0.5 }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* ── File Upload ── */}
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', mb: 1 }}>
                            CSV File
                        </Typography>
                        {!file ? (
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                startIcon={<Upload size={16} />}
                                sx={{
                                    py: 2.5,
                                    borderRadius: '6px',
                                    borderStyle: 'dashed',
                                    borderColor: '#d5d5d5',
                                    color: '#555',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    bgcolor: '#fafafa',
                                    '&:hover': {
                                        borderColor: MAROON,
                                        color: MAROON,
                                        bgcolor: alpha(MAROON, 0.03),
                                    },
                                }}
                            >
                                Choose CSV File
                                <input type="file" hidden accept=".csv" onChange={handleFileChange} />
                            </Button>
                        ) : (
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 2, py: 1.5,
                                border: '1px solid #d5d5d5',
                                borderLeft: `3px solid ${MAROON}`,
                                borderRadius: '6px',
                                bgcolor: '#fafafa',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '6px',
                                        bgcolor: alpha(MAROON, 0.08),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <FileText size={16} color={MAROON} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>
                                            {file.name}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                                            {(file.size / 1024).toFixed(1)} KB · CSV
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => setFile(null)}
                                    sx={{
                                        color: '#aaa', borderRadius: '4px',
                                        '&:hover': { color: MAROON, bgcolor: alpha(MAROON, 0.06) },
                                    }}
                                >
                                    <X size={15} />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* ── Institution ── */}
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', mb: 1 }}>
                            Institution
                        </Typography>
                        <FormControl fullWidth sx={fieldSx}>
                            <InputLabel sx={{ fontSize: '0.875rem', '&.Mui-focused': { color: MAROON } }}>
                                Select institution
                            </InputLabel>
                            <Select
                                value={institution}
                                label="Select institution"
                                onChange={(e) => setInstitution(e.target.value)}
                                sx={{ borderRadius: '6px', fontSize: '0.875rem' }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: { borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', mt: 0.5 }
                                    }
                                }}
                            >
                                {INSTITUTIONS.map(inst => (
                                    <MenuItem key={inst} value={inst} sx={{ fontSize: '0.875rem', '&:hover': { bgcolor: alpha(MAROON, 0.06) }, '&.Mui-selected': { bgcolor: alpha(MAROON, 0.08), '&:hover': { bgcolor: alpha(MAROON, 0.12) } } }}>
                                        {inst}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* ── Account Name ── */}
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', mb: 1 }}>
                            Account Name
                        </Typography>
                        <TextField
                            fullWidth
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="e.g., Checking Account, Visa Credit Card"
                            helperText="Enter a descriptive name for this account"
                            sx={fieldSx}
                        />
                    </Box>

                    {/* ── Date Range ── */}
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', mb: 1 }}>
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
                                sx={fieldSx}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Box>
                    </Box>

                </Box>
            </DialogContent>

            {/* ── Footer ── */}
            <DialogActions sx={{
                px: 3, py: 2.5, mt: 1,
                borderTop: '1px solid #f0f0f0',
                gap: 1,
            }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        borderRadius: '6px', textTransform: 'none', fontWeight: 600,
                        fontSize: '0.82rem', color: '#555',
                        border: '1px solid #d5d5d5', bgcolor: '#fff',
                        '&:hover': { borderColor: '#bbb', bgcolor: '#f5f5f5' },
                        px: 2.5,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={!canImport}
                    startIcon={<Upload size={14} />}
                    sx={{
                        borderRadius: '6px', textTransform: 'none', fontWeight: 700,
                        fontSize: '0.82rem', bgcolor: MAROON, px: 2.5,
                        boxShadow: 'none',
                        '&:hover': { bgcolor: MAROON_DARK, boxShadow: '0 2px 8px rgba(128,0,0,0.25)' },
                        '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#aaa' },
                    }}
                >
                    Import
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CSVImportDialog;


// import { Upload, X } from 'lucide-react';
//
// interface CSVImportDialogProps{
//     open: boolean;
//     onClose: () => void;
//     onImport: (data: {
//         file: File;
//         startDate: string;
//         endDate: string;
//         institution: string;
//         accountName: string;
//     }) => void;
// }
//
// // Common financial institutions
// const INSTITUTIONS = [
//     'Chase',
//     'Bank of America',
//     'Wells Fargo',
//     'Granite Credit Union',
//     'Mountain America Credit Union'
// ];
//
// const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onClose, onImport}) => {
//     const [file, setFile] = useState<File | null>(null);
//     const [startDate, setStartDate] = useState<string>('');
//     const [endDate, setEndDate] = useState<string>('');
//     const [institution, setInstitution] = useState<string>('');
//     const [accountName, setAccountName] = useState<string>('');
//     const [error, setError] = useState<string>('');
//
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0];
//         if (selectedFile) {
//             if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
//                 setFile(selectedFile);
//                 setError('');
//             } else {
//                 setError('Please select a valid CSV file');
//                 setFile(null);
//             }
//         }
//     };
//
//     const handleRemoveFile = () => {
//         setFile(null);
//     };
//
//     const handleImport = () => {
//         if (!file) {
//             setError('Please select a CSV file');
//             return;
//         }
//         if (!startDate || !endDate) {
//             setError('Please select both start and end dates');
//             return;
//         }
//         if (new Date(startDate) > new Date(endDate)) {
//             setError('Start date must be before end date');
//             return;
//         }
//         if (!institution) {
//             setError('Please select an institution');
//             return;
//         }
//         if (!accountName.trim()) {
//             setError('Please enter an account name');
//             return;
//         }
//
//         // Import logic here
//         console.log('Importing:', { file, startDate, endDate, institution, accountName });
//         onImport({ file, startDate, endDate, institution, accountName });
//
//         // Reset form
//         setFile(null);
//         setStartDate('');
//         setEndDate('');
//         setInstitution('');
//         setAccountName('');
//         setError('');
//     };
//
//     const handleClose = () => {
//         setFile(null);
//         setStartDate('');
//         setEndDate('');
//         setInstitution('');
//         setAccountName('');
//         setError('');
//         onClose();
//     };
//
//     return (
//         <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
//             <DialogTitle>
//                 Import CSV Data
//             </DialogTitle>
//
//             <DialogContent>
//                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
//                     {error && (
//                         <Alert severity="error" onClose={() => setError('')}>
//                             {error}
//                         </Alert>
//                     )}
//
//                     {/* File Upload */}
//                     <Box>
//                         <Typography variant="subtitle2" sx={{ mb: 1 }}>
//                             CSV File
//                         </Typography>
//                         {!file ? (
//                             <Button
//                                 variant="outlined"
//                                 component="label"
//                                 fullWidth
//                                 startIcon={<Upload size={20} />}
//                                 sx={{
//                                     py: 2,
//                                     borderStyle: 'dashed',
//                                     textTransform: 'none'
//                                 }}
//                             >
//                                 Choose CSV File
//                                 <input
//                                     type="file"
//                                     hidden
//                                     accept=".csv"
//                                     onChange={handleFileChange}
//                                 />
//                             </Button>
//                         ) : (
//                             <Box
//                                 sx={{
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     justifyContent: 'space-between',
//                                     p: 2,
//                                     border: '1px solid',
//                                     borderColor: 'success.main',
//                                     borderRadius: 1,
//                                     bgcolor: 'success.lighter'
//                                 }}
//                             >
//                                 <Typography variant="body2" sx={{ flex: 1 }}>
//                                     {file.name}
//                                 </Typography>
//                                 <IconButton
//                                     size="small"
//                                     onClick={handleRemoveFile}
//                                     sx={{ ml: 1 }}
//                                 >
//                                     <X size={18} />
//                                 </IconButton>
//                             </Box>
//                         )}
//                     </Box>
//
//                     {/* Institution Selection */}
//                     <Box>
//                         <FormControl fullWidth>
//                             <InputLabel id="institution-label">Institution</InputLabel>
//                             <Select
//                                 labelId="institution-label"
//                                 id="institution-select"
//                                 value={institution}
//                                 label="Institution"
//                                 onChange={(e) => setInstitution(e.target.value)}
//                             >
//                                 {INSTITUTIONS.map((inst) => (
//                                     <MenuItem key={inst} value={inst}>
//                                         {inst}
//                                     </MenuItem>
//                                 ))}
//                             </Select>
//                         </FormControl>
//                     </Box>
//
//                     {/* Account Name */}
//                     <Box>
//                         <TextField
//                             label="Account Name"
//                             fullWidth
//                             value={accountName}
//                             onChange={(e) => setAccountName(e.target.value)}
//                             placeholder="e.g., Checking Account, Visa Credit Card"
//                             helperText="Enter a descriptive name for this account"
//                         />
//                     </Box>
//
//                     {/* Date Range */}
//                     <Box>
//                         <Typography variant="subtitle2" sx={{ mb: 1 }}>
//                             Date Range
//                         </Typography>
//                         <Box sx={{ display: 'flex', gap: 2 }}>
//                             <TextField
//                                 label="Start Date"
//                                 type="date"
//                                 fullWidth
//                                 value={startDate}
//                                 onChange={(e) => setStartDate(e.target.value)}
//                                 InputLabelProps={{ shrink: true }}
//                             />
//                             <TextField
//                                 label="End Date"
//                                 type="date"
//                                 fullWidth
//                                 value={endDate}
//                                 onChange={(e) => setEndDate(e.target.value)}
//                                 InputLabelProps={{ shrink: true }}
//                             />
//                         </Box>
//                     </Box>
//                 </Box>
//             </DialogContent>
//
//             <DialogActions sx={{ px: 3, pb: 2 }}>
//                 <Button onClick={handleClose}>
//                     Cancel
//                 </Button>
//                 <Button
//                     variant="contained"
//                     onClick={handleImport}
//                     disabled={!file || !startDate || !endDate || !institution || !accountName.trim()}
//                 >
//                     Import
//                 </Button>
//             </DialogActions>
//         </Dialog>
//     );
// };
//
// export default CSVImportDialog;