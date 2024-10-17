import {
    Box,
    Button,
    Grid,
    IconButton,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Slider,
    TextField,
    Typography
} from "@mui/material";
import {AddCircleOutline} from "@mui/icons-material";
import {Delete} from "lucide-react";
import React, {useEffect, useState} from "react";

export interface SpendingCategory {
    id: string;
    name: string;
    currentSpending: number;
    spendingLimit: number;
    reductionPriority: number;
}

export interface SpendingControlData {
    categories: SpendingCategory[];
}

interface SpendingControlQuestionsProps {
    onDataChange: (data: SpendingControlData) => void;
}

const SpendingControlQuestions: React.FC<SpendingControlQuestionsProps> = ({ onDataChange }) => {
    const [categories, setCategories] = useState<SpendingCategory[]>([]);

    useEffect(() => {
        onDataChange({ categories });
    }, [categories, onDataChange]);


    const addCategory = () => {
        setCategories(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                name: '',
                currentSpending: 0,
                spendingLimit: 0,
                reductionPriority: prev.length + 1
            }
        ]);
    };

    const removeCategory = (id: string) => {
        setCategories(prev => prev.filter(category => category.id !== id));
    };


    const handleCategoryChange = (id: string, field: keyof SpendingCategory, value: string | number) => {
        setCategories(prev => prev.map(category =>
            category.id === id
                ? { ...category, [field]: field === 'name' ? value : Number(value) }
                : category
        ));
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Spending Control Specific Questions
            </Typography>
            <Button
                variant="outlined"
                startIcon={<AddCircleOutline />}
                onClick={addCategory}
                sx={{ mb: 2 }}
            >
                Add Spending Category
            </Button>
            {categories.map((category) => (
                <Box key={category.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Category Name"
                                value={category.name}
                                onChange={(e) => handleCategoryChange(category.id, 'name', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Current Monthly Spending"
                                type="number"
                                InputProps={{ startAdornment: '$' }}
                                value={category.currentSpending}
                                onChange={(e) => handleCategoryChange(category.id, 'currentSpending', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Monthly Spending Limit"
                                type="number"
                                InputProps={{ startAdornment: '$' }}
                                value={category.spendingLimit}
                                onChange={(e) => handleCategoryChange(category.id, 'spendingLimit', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <Typography gutterBottom>Reduction Priority</Typography>
                            <Slider
                                value={category.reductionPriority}
                                min={1}
                                max={categories.length}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                                onChange={(_, value) => handleCategoryChange(category.id, 'reductionPriority', Array.isArray(value) ? value[0] : value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                            <IconButton onClick={() => removeCategory(category.id)}>
                                <Delete />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
            ))}
        </Box>
    );


    // If spendingControlData is undefined, initialize it with an empty categories array
    //     return (
    //         <Box>
    //             <Typography variant="h6" gutterBottom>
    //                 Spending Control Specific Questions
    //             </Typography>
    //             <Button
    //                 variant="outlined"
    //                 startIcon={<AddCircleOutline />}
    //                 onClick={addCategory}
    //                 sx={{ mb: 2 }}
    //             >
    //                 Add Spending Category
    //             </Button>
    //         </Box>
    //     );


};

export default SpendingControlQuestions;