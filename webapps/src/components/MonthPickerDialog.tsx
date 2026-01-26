import {Box, Button, Dialog, FormControl, MenuItem, Select, Stack, Typography} from "@mui/material";
import {useState} from "react";

const MonthPickerDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentMonth: Date | null;
}> = ({ open, onClose, onSelect, currentMonth }) => {
    const [selectedYear, setSelectedYear] = useState(currentMonth?.getFullYear() || new Date().getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonth?.getMonth() || new Date().getMonth());

    // Define gradient locally
    const blueGradient = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)';
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
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    minWidth: 400,
                    p: 2
                }
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Select Month
                </Typography>

                {/* Year Selector */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                        Year
                    </Typography>
                    <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{ borderRadius: 2 }}
                    >
                        {years.map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Month Grid */}
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
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
                                fontWeight: selectedMonthIndex === index ? 600 : 500,
                                py: 1.5,
                                ...(selectedMonthIndex === index && {
                                    background: blueGradient, // Use local gradient
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                    }
                                })
                            }}
                        >
                            {month.substring(0, 3)}
                        </Button>
                    ))}
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                        onClick={onClose}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 600,
                            px: 3
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
                            background: blueGradient, // Use local gradient
                            '&:hover': {
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            }
                        }}
                    >
                        Apply
                    </Button>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default MonthPickerDialog;