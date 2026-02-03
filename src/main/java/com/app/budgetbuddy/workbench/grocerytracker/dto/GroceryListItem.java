package com.app.budgetbuddy.workbench.grocerytracker.dto;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Embeddable
public class GroceryListItem
{
    private String itemName;
    private String category;
    private double cost;
    private String store;
    private int quantity;
}
