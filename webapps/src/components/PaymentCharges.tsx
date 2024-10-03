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
import RecurringTransactionService from "../services/RecurringTransactionService";
import { parse, addDays, isBefore, isEqual } from 'date-fns';

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

interface RecurringTransaction {
    userId: number;
    accountId: string;
    streamId: string;
    categoryId: string;
    category: string[];
    transactionIds: string[];
    description: string;
    merchantName: string;
    firstDate: any;
    lastDate: any;
    frequency: string;
    averageAmount: number;
    lastAmount: number;
    active: boolean;
    type: string;
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
    const [recurringCharges, setRecurringCharges] = useState<RecurringTransaction[] | null>(null);
    const recurringTransactionsService = new RecurringTransactionService();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchCharges = async () => {
            try
            {
                const userId = Number(sessionStorage.getItem('userId'));
                if(isNaN(userId)){
                    throw new Error(`Invalid UserId: ${userId}`);
                }
                const fetchedRecurringCharges = await recurringTransactionsService.fetchRecurringTransactionsForUser(userId);
                console.log('Fetched Recurring Charges: ', fetchedRecurringCharges);
                setRecurringCharges(fetchedRecurringCharges);
            }catch(error)
            {
                console.error('There was an error fetching recurring charges: ', error);
            }
        }
        fetchCharges();
    }, []);

    const getUpcomingCharges = (streams: RecurringTransaction[]) : RecurringTransaction[] => {
        if (!streams || !Array.isArray(streams)) {
            return [];
        }

        const now = new Date();
        const thirteenDaysLater = addDays(now, 13);

        const filteredStreams = streams.filter(stream => {
            if (!stream.lastDate || !stream.active) {
                return false;
            }

            try {
                // Assuming lastDate is in 'yyyy-MM-dd' format
                const [year, month, day] = stream.lastDate;
                const nextDate = new Date(year, month - 1, day);
                return (isBefore(nextDate, thirteenDaysLater) || isEqual(nextDate, thirteenDaysLater)) && stream.active;
            } catch (error) {
                console.error(`Error parsing date for stream ${stream.streamId}:`, error);
                return false;
            }
        });

        console.log('filteredStreams: ', filteredStreams);
        return filteredStreams;
    };

    const parseDate = (dateArray: [number, number, number]): Date => {
        const [year, month, day] = dateArray;
        return new Date(year, month - 1, day);  // month is 0-indexed in JS Date
    };

    const formatDate = (dateArray: [number, number, number]): string => {
        const date = parseDate(dateArray);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // const parseDate = (dateString: string | null | undefined): Date => {
    //     // This assumes dateString is in format "YYYY-MM-DD"
    //     if(!dateString || typeof dateString !== 'string'){
    //         console.error('Invalid date string:', dateString);
    //         return new Date();
    //     }
    //
    //     const parts = dateString.split('-');
    //     if(parts.length !== 3){
    //         console.error('Date string is not in expected format (YYYY-MM-DD):', dateString);
    //         return new Date();
    //     }
    //
    //     const [year, month, day] = parts.map(Number);
    //     if(isNaN(year) || isNaN(month) || isNaN(day)){
    //         console.error('Date parts are not valid numbers:', {year, month, day});
    //         return new Date();
    //     }
    //     return new Date(year, month - 1, day);
    // };
    //
    // const formatDate = (dateString: string): string => {
    //     const date = parseDate(dateString);
    //     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    // };

    const upcomingCharges = recurringCharges ? getUpcomingCharges(recurringCharges) : [];
    // const upcomingCharges: any[] = [];
    const totalAmount = upcomingCharges.reduce((sum, charge) => sum + Math.abs(charge.lastAmount), 0);

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
                                    ${Math.abs(charge.lastAmount).toFixed(2)}
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