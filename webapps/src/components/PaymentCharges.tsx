import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    Avatar
} from '@mui/material';

interface Charge {
    name: string;
    dueDate: string;
    amount: string;
    icon: string;
}

const charges: Charge[] = [
    { name: 'Hulu', dueDate: 'Due tomorrow', amount: '$8.57', icon: 'H' },
    { name: 'JetBrains', dueDate: 'Due on 8/29/24', amount: '$14.48', icon: 'JB' },
    { name: 'YouTube Premium', dueDate: 'Due on 8/30/24', amount: '$15.01', icon: 'YT' },
    { name: 'Conservice', dueDate: 'Due on 9/3/24', amount: '$112.28', icon: 'C' },
    { name: 'PAYPAL INST XFER', dueDate: 'Due on 9/3/24', amount: '$30.00', icon: 'P' },
    { name: 'Rocky Mountain Power', dueDate: 'Due on 9/3/24', amount: '$161.46', icon: 'RM' },
    { name: 'American Express Card P...', dueDate: 'Due on 9/5/24', amount: '$98.55', icon: 'AE' },
    { name: 'JetBrains', dueDate: 'Due on 9/6/24', amount: '$10.73', icon: 'JB' },
];

const PaymentCharges: React.FC = () => {
    return (
        <Paper elevation={3} sx={{ maxWidth: 400, margin: 'auto', mt: 2, borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, backgroundColor: '#F9FAFB' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827', mb: 2 }}>COMING UP</Typography>
                <Typography variant="body2" sx={{ color: '#4B5563', mb: 2 }}>
                    You have {charges.length} recurring charges due within the next 13 days for ${charges.reduce((sum, charge) => sum + parseFloat(charge.amount.slice(1)), 0).toFixed(2)}.
                </Typography>
                <List disablePadding>
                    {charges.map((charge, index) => (
                        <ListItem
                            key={index}
                            divider={index !== charges.length - 1}
                            sx={{
                                py: 1.5,
                                '&:hover': { backgroundColor: '#F3F4F6' }
                            }}
                        >
                            <ListItemIcon>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor:
                                        charge.name === 'Hulu' ? '#1DB954' :
                                            charge.name === 'JetBrains' ? '#000000' :
                                                charge.name === 'YouTube Premium' ? '#FF0000' :
                                                    charge.name === 'PAYPAL INST XFER' ? '#003087' :
                                                        charge.name === 'American Express Card P...' ? '#006FCF' :
                                                            '#6B7280'
                                }}>
                                    {charge.icon}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={charge.name}
                                secondary={charge.dueDate}
                                primaryTypographyProps={{
                                    sx: { fontWeight: 'medium', color: '#111827' }
                                }}
                                secondaryTypographyProps={{
                                    sx: { color: '#6B7280', fontSize: '0.75rem' }
                                }}
                            />
                            <ListItemSecondaryAction>
                                <Typography sx={{ fontWeight: 'bold', color: '#111827' }}>
                                    {charge.amount}
                                </Typography>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Paper>
    );
};

export default PaymentCharges;