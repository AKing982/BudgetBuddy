import {Box, Button, Dialog, FormControl, MenuItem, Select, Stack, Typography, IconButton, alpha} from "@mui/material";
import {useState} from "react";
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const maroonColor = '#800000';
const tealColor = '#0d9488';

const MonthPickerDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentMonth: Date | null;
}> = ({ open, onClose, onSelect, currentMonth }) => {
    const [selectedYear, setSelectedYear] = useState(currentMonth?.getFullYear() || new Date().getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonth?.getMonth() || new Date().getMonth());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const handleConfirm = () => {
        const date = new Date(selectedYear, selectedMonthIndex, 1);
        onSelect(date);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                background: `linear-gradient(135deg, ${maroonColor} 0%, #a00000 100%)`,
                color: 'white',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarMonthIcon />
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            Select Month
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            Choose a month and year
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
                {/* Year Selector */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                        Year
                    </Typography>
                    <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha('#e0e0e0', 0.8)
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: maroonColor
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: maroonColor
                            }
                        }}
                    >
                        {years.map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Month Grid */}
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                    Month
                </Typography>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1.5,
                    mb: 3
                }}>
                    {months.map((month, index) => (
                        <Button
                            key={month}
                            variant={selectedMonthIndex === index ? 'contained' : 'outlined'}
                            onClick={() => setSelectedMonthIndex(index)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.5,
                                ...(selectedMonthIndex === index ? {
                                    bgcolor: tealColor,
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: '#0f766e'
                                    }
                                } : {
                                    borderColor: alpha('#e0e0e0', 0.8),
                                    color: 'text.primary',
                                    '&:hover': {
                                        borderColor: tealColor,
                                        bgcolor: alpha(tealColor, 0.05),
                                        color: tealColor
                                    }
                                })
                            }}
                        >
                            {month.substring(0, 3)}
                        </Button>
                    ))}
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 600,
                        px: 3,
                        borderColor: alpha('#e0e0e0', 0.8),
                        color: 'text.primary',
                        '&:hover': {
                            borderColor: '#757575',
                            bgcolor: alpha('#757575', 0.05)
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 600,
                        px: 3,
                        bgcolor: maroonColor,
                        '&:hover': {
                            bgcolor: '#a00000'
                        }
                    }}
                >
                    Apply
                </Button>
            </Box>
        </Dialog>
    );
};

export default MonthPickerDialog;