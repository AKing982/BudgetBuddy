import React from "react";
import {IconButton, ListItem, ListItemSecondaryAction, ListItemText} from "@mui/material";
import {Delete} from "lucide-react";


interface BudgetCategory {
    name: string;
    amount: number;
}

const CategoryItem: React.FC<{ category: BudgetCategory; onDelete: () => void }> = ({ category, onDelete }) => (
    <ListItem>
        <ListItemText
            primary={category.name}
            secondary={`$${category.amount.toFixed(2)}`}
        />
        <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="delete" onClick={onDelete}>
                <Delete />
            </IconButton>
        </ListItemSecondaryAction>
    </ListItem>
);

export default CategoryItem;