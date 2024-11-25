import React, {useState} from "react";
import {
    Box,
    Button,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography
} from "@mui/material";
import {ContentCopy, PlayArrow} from "@mui/icons-material";
import {Download, Save, Settings} from "lucide-react";
import {styled} from "@mui/material/styles";
import Sidebar from "./Sidebar";
import CellTypesPanel, {CellTypeOption} from "./CellTypesPanel";

interface GridCell {
    id: string;
    col: string;
    row: number;
    cell: Cell
}

interface BudgetPlannerState {
    cells: Record<string, GridCell>;
    activeCell: string | null;
    selectedRange: string[] | null;
    draggedCell: string | null;
    mode: 'simple' | 'advanced';
    period: 'daily' | 'weekly' | 'biweekly' | 'monthly';
}

const StyledGridCell = styled(Box)(({ theme }) => ({
    width: 160,
    height: 40,
    padding: theme.spacing(1),
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledHeaderCell = styled(Box)(({ theme }) => ({
    width: 160,
    height: 40,
    padding: theme.spacing(1),
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
}));

const StyledRowHeader = styled(Box)(({ theme }) => ({
    width: 50,
    height: 40,
    padding: theme.spacing(1),
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const BudgetPlannerDesigner: React.FC = () => {
    const [state, setState] = useState<BudgetPlannerState>({
        cells: {},
        activeCell: null,
        selectedRange: null,
        draggedCell: null,
        mode: 'simple',
        period: 'monthly',
    });

    const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    const ROWS = 110;

    const renderToolbar = () => (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Period</InputLabel>
                        <Select
                            value={state.period}
                            label="Period"
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                period: e.target.value as BudgetPlannerState['period']
                            }))}
                        >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="biweekly">Bi-weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Mode</InputLabel>
                        <Select
                            value={state.mode}
                            label="Mode"
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                mode: e.target.value as BudgetPlannerState['mode']
                            }))}
                        >
                            <MenuItem value="simple">Simple</MenuItem>
                            <MenuItem value="advanced">Advanced</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small">
                        <ContentCopy />
                    </IconButton>
                    <IconButton size="small">
                        <Download />
                    </IconButton>
                    <IconButton size="small">
                        <Settings />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        size="small"
                    >
                        Save Template
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        size="small"
                    >
                        Preview Impact
                    </Button>
                </Box>
            </Box>
        </Box>
    );

    const renderGrid = () => {
        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e: React.DragEvent, cellId: string) => {
            e.preventDefault();
            e.stopPropagation();

            try
            {
                const cellTypeData = JSON.parse(e.dataTransfer.getData('application/json')) as CellTypeOption;

                const newCell: GridCell = {
                    id: cellId,
                    col: cellId.match(/[A-Z]+/)?.[0] || '',
                    row: parseInt(cellId.match(/\d+/)?.[0] || '0'),
                    cell: {
                        id: cellId,
                        value: cellTypeData.defaultValue,
                        formula: cellTypeData.type === 'formula' ? '' : undefined,
                        editable: true
                    }
                };

                setState(prev => ({
                    ...prev,
                    cells: {
                        ...prev.cells,
                        [cellId]: newCell
                    }
                }));
            }catch(error){
                console.error('Error dropping cell: ', error);
            }
        };

        return (
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {/* Column Headers */}
                <Box sx={{ display: 'flex', position: 'sticky', top: 0, bgcolor: 'background.paper' }}>
                    <StyledRowHeader />
                    {COLUMNS.map(col => (
                        <StyledHeaderCell key={col}>
                            {col}
                        </StyledHeaderCell>
                    ))}
                </Box>

                {/* Grid Rows */}
                {Array.from({ length: ROWS }, (_, i) => i + 1).map(row => (
                    <Box key={row} sx={{ display: 'flex' }}>
                        <StyledRowHeader>
                            {row}
                        </StyledRowHeader>
                        {COLUMNS.map(col => {
                            const cellId = `${col}${row}`;
                            const cellData = state.cells[cellId];

                            return (
                                <StyledGridCell
                                    key={cellId}
                                    onClick={() => handleCellClick(cellId)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, cellId)}
                                    sx={{
                                        bgcolor: state.activeCell === cellId ? 'action.selected' : 'inherit',
                                        '&.drag-over': {
                                            bgcolor: 'action.hover',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    {/* Render cell content based on type */}
                                    {cellData?.cell.value}
                                </StyledGridCell>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        );

    }

    const renderCellEditor = () => (
        state.activeCell && (
            <Paper
                elevation={0}
                sx={{
                    width: 320,
                    borderLeft: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Cell Editor
                    </Typography>
                    {/* Cell editor form will go here */}
                </Box>
            </Paper>
        )
    );

    const handleCellClick = (cellId: string) => {
        setState(prev => ({ ...prev, activeCell: cellId }));
    };

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            bgcolor: 'background.paper'
        }}>
            {<CellTypesPanel/>}

            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {renderToolbar()}
                {renderGrid()}
            </Box>

            {renderCellEditor()}
        </Box>
    );
};

export default BudgetPlannerDesigner;


