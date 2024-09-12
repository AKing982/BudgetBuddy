import React, {useEffect, useState} from 'react';
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
import PlaidService from "../services/PlaidService";

interface Charge {
    name: string;
    dueDate: string;
    amount: string;
    icon: string;
}

interface RecurringTransactionResponse {
    inflowStreams: TransactionStream[];
    outflowStreams: TransactionStream[];
    updatedDatetime: string;
    requestId: string;
}

interface TransactionStream {
    accountId: string;
    active: boolean;
    averageAmount: Amount;
    category: string[];
    categoryId: string;
    description: string;
    firstDate: Date;
    frequency: string;
    lastAmount: Amount;
    lastDate: string;
    lastUserModifiedDate: Date;
    merchantName: string;
    personalFinanceCategory: PersonalFinanceCategory;
    status: string;
    transactionIds: string[];
    userModified: boolean;
}

interface Amount {
    amount: number;
    isoCurrency: string | null;
    unofficialCurrency: string | null;
}

interface PersonalFinanceCategory {
    primary: string;
    detailed: string;
    confidenceLevel: string;
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
    const [recurringCharges, setRecurringCharges] = useState<RecurringTransactionResponse | null>(null);
    const plaidService = PlaidService.getInstance();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchCharges = async () => {
            try
            {
                const userId = Number(sessionStorage.getItem('userId'));
                if(isNaN(userId)){
                    throw new Error(`Invalid UserId: ${userId}`);
                }
                const fetchedRecurringCharges = await plaidService.fetchRecurringChargesForUser(userId);
                console.log('Fetched Recurring Charges: ', fetchedRecurringCharges);
                setRecurringCharges(fetchedRecurringCharges);
            }catch(error)
            {
                console.error('There was an error fetching recurring charges: ', error);
            }
        }
        fetchCharges();
    }, []);

    const getUpcomingCharges = (streams: TransactionStream[]) : TransactionStream[] => {
        const now = new Date();
        const thirteenDaysLater = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000);
        return streams.filter(stream => {
            const nextDate = new Date(stream.lastDate);
            return nextDate <= thirteenDaysLater && stream.active;
        });
    };

    const parseDate = (dateString: string): Date => {
        // This assumes dateString is in format "YYYY-MM-DD"
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (dateString: string): string => {
        const date = parseDate(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const upcomingCharges = recurringCharges ? getUpcomingCharges(recurringCharges.outflowStreams) : [];
    const totalAmount = upcomingCharges.reduce((sum, charge) => sum + Math.abs(charge.lastAmount.amount), 0);

    return (
        <Paper elevation={3} sx={{ maxWidth: 400, margin: 'auto', mt: 2, borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, backgroundColor: '#F9FAFB' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#111827', mb: 2 }}>COMING UP</Typography>
                <Typography variant="body2" sx={{ color: '#4B5563', mb: 2 }}>
                    You have {upcomingCharges.length} recurring charges due within the next 13 days for ${totalAmount.toFixed(2)}.
                </Typography>
                <List disablePadding>
                    {upcomingCharges.map((charge, index) => (
                        <ListItem
                            key={`${charge.accountId}-${index}`}
                            divider={index !== upcomingCharges.length - 1}
                            sx={{
                                py: 1.5,
                                '&:hover': { backgroundColor: '#F3F4F6' }
                            }}
                        >
                            <ListItemIcon>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: getBgColor(charge.merchantName) }}>
                                    {(charge.merchantName || charge.description || 'U')[0].toUpperCase()}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={charge.merchantName || charge.description}
                                secondary={formatDate(charge.lastDate)}
                                primaryTypographyProps={{
                                    sx: { fontWeight: 'medium', color: '#111827' }
                                }}
                                secondaryTypographyProps={{
                                    sx: { color: '#6B7280', fontSize: '0.75rem' }
                                }}
                            />
                            <ListItemSecondaryAction>
                                <Typography sx={{ fontWeight: 'bold', color: '#111827' }}>
                                    ${Math.abs(charge.lastAmount.amount).toFixed(2)}
                                </Typography>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Paper>
    );
};

const getBgColor = (merchantName: string): string => {
    switch (merchantName.toLowerCase()) {
        case 'hulu': return '#1DB954';
        case 'jetbrains': return '#000000';
        case 'youtube premium': return '#FF0000';
        case 'paypal inst xfer': return '#003087';
        case 'american express card p...': return '#006FCF';
        default: return '#6B7280';
    }
};


export default PaymentCharges;