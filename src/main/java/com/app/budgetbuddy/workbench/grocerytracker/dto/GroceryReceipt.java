package com.app.budgetbuddy.workbench.grocerytracker.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class GroceryReceipt
{
    private Long id;
    private Long groceryBudgetId;
    private String description;
    private String storeName;
    private String merchantName;
    private String address;
    private LocalDate date;
    private double price;
    private double total;
    private double totalSavings;
    private int numberOfItems;
    private List<ReceiptItem> items;

}
