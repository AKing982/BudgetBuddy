import {Box, TableCell} from "@mui/material";
import {ArrowDownward, ArrowUpward} from "@mui/icons-material";
import {useState} from "react";
import {Transaction} from '../utils/Items';

type SortConfig = {
    key: keyof Transaction;
    direction: 'asc' | 'desc';
} | null;

const SortableTableHeader: React.FC<{label: string, sortKey: keyof Transaction}> = ({label, sortKey}) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const handleSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <TableCell
            onClick={() => handleSort(sortKey)}
            sx={{
                fontWeight: 'bold',
                color: '#1A237E',
                fontSize: '0.95rem',
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                    backgroundColor: '#E8EAF6',
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {label}
                {sortConfig?.key === sortKey && (
                    sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                )}
            </Box>
        </TableCell>
    );
}

