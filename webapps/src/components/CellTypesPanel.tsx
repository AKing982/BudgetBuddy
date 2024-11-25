import {
    List,
    ListItem,
    ListSubheader,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Paper,
    Box,
    Typography,
    Divider,
    Collapse
} from '@mui/material';
import {
    AttachMoney,
    Calculate,
    Label,
    Percent,
    Link,
    ShoppingCart,
    CalendarToday,
    TrendingUp,
    Category,
    AccountBalance,
    ExpandLess,
    ExpandMore,
    DragIndicator
} from '@mui/icons-material';
import { useState } from 'react';

export interface CellTypeOption {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    type: 'label' | 'income' | 'expense' | 'percentage' | 'calculation' | 'reference' | 'grocery' | 'formula' | 'currency' | 'date';
    defaultValue: any;
    category: 'basic' | 'calculation' | 'reference' | 'budget';
    defaultFormats?: CellFormat;
}
const defaultFormats: Record<CellTypeOption['type'], CellFormat> = {
    // Basic formatting types
    currency: {
        numberFormat: {
            type: 'currency',
            currency: 'USD',
            locale: 'en-US',
            decimals: 2
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {},
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    percentage: {
        numberFormat: {
            type: 'percentage',
            decimals: 1
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {},
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    label: {
        visualFormatting: {
            textAlign: 'left',
            fontStyle: {},
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    formula: {
        numberFormat: {
            type: 'decimal',
            decimals: 2
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {
                italic: true
            },
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    date: {
        dateFormat: {
            format: 'short',
            includeTime: false
        },
        visualFormatting: {
            textAlign: 'center',
            fontStyle: {},
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    },

    // Required cell types
    income: {
        numberFormat: {
            type: 'currency',
            currency: 'USD',
            locale: 'en-US',
            decimals: 2
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {},
            fontSize: 'medium',
            color: '#2E7D32' // Green for income
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    expense: {
        numberFormat: {
            type: 'currency',
            currency: 'USD',
            locale: 'en-US',
            decimals: 2
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {},
            fontSize: 'medium',
            color: '#C62828' // Red for expenses
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    calculation: {
        numberFormat: {
            type: 'decimal',
            decimals: 2
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {
                italic: true
            },
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    reference: {
        visualFormatting: {
            textAlign: 'left',
            fontStyle: {
                italic: true
            },
            fontSize: 'medium',
            color: '#1976D2' // Blue for references
        },
        conditionalFormatting: {
            conditions: []
        }
    },
    grocery: {
        numberFormat: {
            type: 'currency',
            currency: 'USD',
            locale: 'en-US',
            decimals: 2
        },
        visualFormatting: {
            textAlign: 'right',
            fontStyle: {},
            fontSize: 'medium'
        },
        conditionalFormatting: {
            conditions: []
        }
    }
};

const cellTypes: CellTypeOption[] = [
    // Basic Cells
    {
        id: 'label',
        name: 'Label',
        description: 'Add text labels and descriptions',
        icon: <Label />,
        type: 'label',
        defaultValue: '',
        category: 'basic',
        defaultFormats: {
            visualFormatting: {
                textAlign: 'left',
                fontStyle: {
                    bold: true
                },
                fontSize: 'medium'
            },
            conditionalFormatting: {
                conditions: []
            }
        }
    },
    {
        id: 'income',
        name: 'Income',
        description: 'Track income and revenue',
        icon: <AttachMoney />,
        type: 'income',
        defaultValue: 0,
        category: 'basic',
        defaultFormats: {
            numberFormat: {
                type: 'currency',
                currency: 'USD',
                locale: 'en-US',
                decimals: 2
            },
            visualFormatting: {
                textAlign: 'right',
                fontStyle: {},
                color: '#2E7D32' // Green for income
            },
            conditionalFormatting: {
                conditions: []
            }
        }
    },
    {
        id: 'expense',
        name: 'Expense',
        description: 'Track expenses and costs',
        icon: <AttachMoney />,
        type: 'expense',
        defaultValue: 0,
        category: 'basic',
        defaultFormats: {
            numberFormat: {
                type: 'currency',
                currency: 'USD',
                locale: 'en-US',
                decimals: 2
            },
            visualFormatting: {
                textAlign: 'right',
                fontStyle: {},
                color: '#C62828' // Red for expenses
            },
            conditionalFormatting: {
                conditions: []
            }
        }
    },
    {
        id: 'percentage',
        name: 'Percentage',
        description: 'Calculate percentages',
        icon: <Percent />,
        type: 'percentage',
        defaultValue: 0,
        category: 'basic',
        defaultFormats: defaultFormats.percentage
    },

    // Calculation Cells
    {
        id: 'calculation',
        name: 'Formula',
        description: 'Custom calculations and formulas',
        icon: <Calculate />,
        type: 'formula',
        defaultValue: '',
        category: 'calculation',
        defaultFormats: defaultFormats.formula
    },

    // Reference Cells
    {
        id: 'reference',
        name: 'Cell Reference',
        description: 'Reference other cells',
        icon: <Link />,
        type: 'reference',
        defaultValue: '',
        category: 'reference',
        defaultFormats: {
            visualFormatting: {
                textAlign: 'left',
                fontStyle: {
                    italic: true
                },
                fontSize: 'medium',
                color: '#1976D2' // Blue for references
            },
            conditionalFormatting: {
                conditions: []
            }
        }
    },

    // Budget Cells
    {
        id: 'grocery',
        name: 'Grocery',
        description: 'Track grocery expenses',
        icon: <ShoppingCart />,
        type: 'grocery',
        defaultValue: 0,
        category: 'budget',
        defaultFormats: {
            numberFormat: {
                type: 'currency',
                currency: 'USD',
                locale: 'en-US',
                decimals: 2
            },
            visualFormatting: {
                textAlign: 'right',
                fontStyle: {},
                fontSize: 'medium'
            },
            conditionalFormatting: {
                conditions: []
            }
        }
    }
];


const CellTypesPanel: React.FC = () => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        basic: true,
        calculation: true,
        budget: true,
        reference: true
    });

    const handleCategoryToggle = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleDragStart = (e: React.DragEvent, cellType: CellTypeOption) => {
        e.dataTransfer.setData('application/json', JSON.stringify(cellType));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: 280,
                borderRight: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Cell Types
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Drag cells to the grid
                </Typography>
            </Box>
            <Divider />

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {/* Basic Cells */}
                <ListItem button onClick={() => handleCategoryToggle('basic')}>
                    <ListItemText primary="Basic Cells" />
                    {expandedCategories.basic ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedCategories.basic}>
                    {cellTypes
                        .filter(cell => cell.category === 'basic')
                        .map(cellType => (
                            <ListItem
                                key={cellType.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, cellType)}
                                sx={{
                                    pl: 4,
                                    cursor: 'move',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <DragIndicator fontSize="small" />
                                </ListItemIcon>
                                <ListItemIcon>
                                    {cellType.icon}
                                </ListItemIcon>
                                <Tooltip title={cellType.description} placement="right">
                                    <ListItemText
                                        primary={cellType.name}
                                        primaryTypographyProps={{
                                            variant: 'body2'
                                        }}
                                    />
                                </Tooltip>
                            </ListItem>
                        ))}
                </Collapse>

                {/* Calculation Cells */}
                <ListItem button onClick={() => handleCategoryToggle('calculation')}>
                    <ListItemText primary="Calculations" />
                    {expandedCategories.calculation ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedCategories.calculation}>
                    {cellTypes
                        .filter(cell => cell.category === 'calculation')
                        .map(cellType => (
                            <ListItem
                                key={cellType.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, cellType)}
                                sx={{
                                    pl: 4,
                                    cursor: 'move',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <DragIndicator fontSize="small" />
                                </ListItemIcon>
                                <ListItemIcon>
                                    {cellType.icon}
                                </ListItemIcon>
                                <Tooltip title={cellType.description} placement="right">
                                    <ListItemText
                                        primary={cellType.name}
                                        primaryTypographyProps={{
                                            variant: 'body2'
                                        }}
                                    />
                                </Tooltip>
                            </ListItem>
                        ))}
                </Collapse>

                {/* Budget Cells */}
                <ListItem button onClick={() => handleCategoryToggle('budget')}>
                    <ListItemText primary="Budget" />
                    {expandedCategories.budget ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedCategories.budget}>
                    {cellTypes
                        .filter(cell => cell.category === 'budget')
                        .map(cellType => (
                            <ListItem
                                key={cellType.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, cellType)}
                                sx={{
                                    pl: 4,
                                    cursor: 'move',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <DragIndicator fontSize="small" />
                                </ListItemIcon>
                                <ListItemIcon>
                                    {cellType.icon}
                                </ListItemIcon>
                                <Tooltip title={cellType.description} placement="right">
                                    <ListItemText
                                        primary={cellType.name}
                                        primaryTypographyProps={{
                                            variant: 'body2'
                                        }}
                                    />
                                </Tooltip>
                            </ListItem>
                        ))}
                </Collapse>

                {/* Reference Cells */}
                <ListItem button onClick={() => handleCategoryToggle('reference')}>
                    <ListItemText primary="References" />
                    {expandedCategories.reference ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedCategories.reference}>
                    {cellTypes
                        .filter(cell => cell.category === 'reference')
                        .map(cellType => (
                            <ListItem
                                key={cellType.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, cellType)}
                                sx={{
                                    pl: 4,
                                    cursor: 'move',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <DragIndicator fontSize="small" />
                                </ListItemIcon>
                                <ListItemIcon>
                                    {cellType.icon}
                                </ListItemIcon>
                                <Tooltip title={cellType.description} placement="right">
                                    <ListItemText
                                        primary={cellType.name}
                                        primaryTypographyProps={{
                                            variant: 'body2'
                                        }}
                                    />
                                </Tooltip>
                            </ListItem>
                        ))}
                </Collapse>
            </List>
        </Paper>
    );
}
export default CellTypesPanel;