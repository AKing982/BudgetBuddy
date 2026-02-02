package com.app.budgetbuddy.domain;

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
    private List<GroceryReceipt> receipts = new ArrayList<>();
    private List<String> groceryStoreList = new ArrayList<>();
    private List<Transaction> transactions = new ArrayList<>();
    private List<TransactionCSV> csvTransactions = new ArrayList<>();
}
