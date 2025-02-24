import {Box, IconButton, TableCell, TableRow, Typography} from "@mui/material";
import {AccountBalanceWallet, Block, ChevronRight, Edit} from "@mui/icons-material";
import {useState} from "react";
import {Transaction} from "../utils/Items";


interface TransactionRowProps {
    transaction: Transaction;
}

const TransactionRow: React.FC<TransactionRowProps> = ({transaction}) => {
    const formattedDate = transaction.posted ?
        new Date(transaction.posted).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) :
        transaction.date ?
            new Date(transaction.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Pending';
    const [imageError, setImageError] = useState<boolean>(false);

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(transaction.amount);

    const handleImageError = () => {
        setImageError(true);
    }


    return (
        <TableRow sx={{
            '&:hover': { backgroundColor: '#F3F4F6' },
            '&:last-child td, &:last-child th': { border: 0 }
        }}>
            <TableCell sx={{ color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{formattedDate}</TableCell>
            <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>
                <Box display="flex" alignItems="center">
                    {transaction.logoUrl && !imageError ? (
                        <img
                            src={transaction.logoUrl}
                            alt={`${transaction.name} logo`}
                            style={{ width: 24, height: 24, marginRight: 8, objectFit: 'contain' }}
                            onError={handleImageError}
                        />
                    ) : (
                        <AccountBalanceWallet sx={{ width: 24, height: 24, marginRight: 1, color: '#6B7280' }} />
                    )}
                    <Typography variant="body2" sx={{ color: '#111827' }}>{transaction.name}</Typography>
                </Box>
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'medium', color: '#111827', borderBottom: '1px solid #E5E7EB' }}>
                {formattedAmount}
            </TableCell>
            <TableCell align="right" sx={{ borderBottom: '1px solid #E5E7EB' }}>
                <IconButton size="small" sx={{ color: '#6B7280' }}><Edit /></IconButton>
                <IconButton size="small" sx={{ color: '#6B7280' }}><Block /></IconButton>
                <IconButton size="small" sx={{ color: '#6B7280' }}><ChevronRight /></IconButton>
            </TableCell>
        </TableRow>
    );
};

export default TransactionRow;
