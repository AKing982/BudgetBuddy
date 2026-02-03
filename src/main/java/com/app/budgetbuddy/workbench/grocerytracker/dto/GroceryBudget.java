package com.app.budgetbuddy.workbench.grocerytracker.dto;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCSV;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class GroceryBudget
{
    private Long id;
    private Long budgetScheduleRangeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private double budgetedAmount;
    private double totalSpent;
    private double savingsGoal;
    private GroceryList groceryList;
    private List<GroceryReceipt> receipts = new ArrayList<>();
    private List<Store> groceryStores = new ArrayList<>();
    private List<Transaction> transactions = new ArrayList<>();
    private List<TransactionCSV> csvTransactions = new ArrayList<>();
}
