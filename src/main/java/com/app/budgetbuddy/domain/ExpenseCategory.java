package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class ExpenseCategory extends Category
{
    private Set<String> transactions = new HashSet<>();

    public ExpenseCategory(String categoryId, String categoryName, String categoryDescription, BigDecimal budgetedAmount, LocalDate categoryStartDate, LocalDate categoryEndDate, BigDecimal actual, boolean isActive, CategoryType categoryType, DateRange dateRange, Set<String> transactions) {
        super(categoryId, categoryName, categoryDescription, budgetedAmount, categoryStartDate, categoryEndDate, actual, isActive, categoryType, dateRange);
        this.transactions = transactions;
    }

    public void addTransaction(String transactionId)
    {
        if(transactionId != null && !transactionId.isEmpty())
        {
            transactions.add(transactionId);
        }
    }

    public boolean containsTransaction(String transactionId)
    {
        return transactions.contains(transactionId);
    }
}
