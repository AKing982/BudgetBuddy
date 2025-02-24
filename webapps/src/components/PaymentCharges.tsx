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
    Avatar, Button
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
    const [visibleCount, setVisibleCount] = useState<number>(6); // State to track number of visible charges
    const recurringTransactionsService = new RecurringTransactionService();

    useEffect(() => {
        const fetchCharges = async () => {
            try {
                const userId = Number(sessionStorage.getItem('userId'));
                if (isNaN(userId)) {
                    throw new Error(`Invalid UserId: ${userId}`);
                }
                const fetchedRecurringCharges = await recurringTransactionsService.fetchRecurringTransactionsForUser(userId);
                console.log('Fetched Recurring Charges: ', fetchedRecurringCharges);
                setRecurringCharges(fetchedRecurringCharges);
            } catch (error) {
                console.error('There was an error fetching recurring charges: ', error);
            }
        };
        fetchCharges();
    }, []);

    const getUpcomingCharges = (streams: RecurringTransaction[]): RecurringTransaction[] => {
        if (!streams || !Array.isArray(streams)) {
            return [];
        }

        const now = new Date();
        const thirteenDaysLater = addDays(now, 13);

        return streams.filter(stream => {
            if (!stream.lastDate || !stream.active) {
                return false;
            }

            try {
                const nextDate = new Date(stream.lastDate[0], stream.lastDate[1] - 1, stream.lastDate[2]);
                return (isBefore(nextDate, thirteenDaysLater) || isEqual(nextDate, thirteenDaysLater)) && stream.active;
            } catch (error) {
                console.error(`Error parsing date for stream ${stream.streamId}:`, error);
                return false;
            }
        });
    };

    const parseDate = (dateArray: [number, number, number]): Date => {
        const [year, month, day] = dateArray;
        return new Date(year, month - 1, day);
    };

    const formatDate = (dateArray: [number, number, number]): string => {
        const date = parseDate(dateArray);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const upcomingCharges = recurringCharges ? getUpcomingCharges(recurringCharges) : [];
    const totalAmount = upcomingCharges.reduce((sum, charge) => {
        return charge && charge.lastAmount ? sum + Math.abs(charge.lastAmount) : sum;
    }, 0);

    // Slice the charges to show only the visible count
    const visibleCharges = upcomingCharges.slice(0, visibleCount);
    const hasMoreCharges = upcomingCharges.length > visibleCount;

    const handleShowMore = () => {
        setVisibleCount(prevCount => prevCount + 6); // Show 6 more charges
    };

    return (
        <Paper
            elevation={3}
            sx={{
                maxWidth: 400,
                margin: 'auto',
                mt: 2,
                borderRadius: '12px',
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
            }}
        >
            <Box sx={{ p: 2, backgroundColor: '#F9FAFB' }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 'bold',
                        color: '#111827',
                        mb: 1.5,
                    }}
                >
                    COMING UP
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#4B5563',
                        mb: 2.5,
                        fontSize: '0.875rem',
                    }}
                >
                    You have {upcomingCharges.length} recurring charges due within the next 13 days for ${totalAmount.toFixed(2)}.
                </Typography>
                <Box
                    sx={{
                        maxHeight: 300, // Fixed height to limit visible area
                        overflowY: 'auto', // Enable vertical scrolling
                        scrollbarWidth: 'thin', // For Firefox
                        '&::-webkit-scrollbar': {
                            width: '6px', // For Webkit browsers (Chrome, Safari)
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#6B7280',
                            borderRadius: '4px',
                        },
                    }}
                >
                    <List disablePadding>
                        {visibleCharges.map((charge, index) => (
                            <ListItem
                                key={`${charge.accountId}-${index}`}
                                divider={index !== visibleCharges.length - 1}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    '&:hover': { backgroundColor: '#F3F4F6' },
                                    alignItems: 'center',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            fontSize: '0.875rem',
                                            bgcolor: getBgColor(charge.merchantName),
                                        }}
                                    >
                                        {(charge.merchantName || charge.description || 'U')[0].toUpperCase()}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={charge.merchantName || charge.description}
                                    secondary={formatDate(charge.lastDate)}
                                    primaryTypographyProps={{
                                        sx: {
                                            fontWeight: 'medium',
                                            color: '#111827',
                                            fontSize: '0.9375rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '180px',
                                        },
                                    }}
                                    secondaryTypographyProps={{
                                        sx: {
                                            color: '#6B7280',
                                            fontSize: '0.75rem',
                                        },
                                    }}
                                />
                                <ListItemSecondaryAction sx={{ right: 16 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            fontSize: '0.9375rem',
                                        }}
                                    >
                                        ${Math.abs(charge.lastAmount).toFixed(2)}
                                    </Typography>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Box>
                {hasMoreCharges && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleShowMore}
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                color: '#111827',
                                borderColor: '#D1D5DB',
                                '&:hover': {
                                    backgroundColor: '#F3F4F6',
                                    borderColor: '#9CA3AF',
                                },
                            }}
                        >
                            Show More Charges
                        </Button>
                    </Box>
                )}
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