package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class ExpenseCategory extends Category
{
    private Set<Transaction> expenseTransactions = new HashSet<>();

    public ExpenseCategory(String categoryId, String categoryName, String categoryDescription, BigDecimal budgetedAmount, LocalDate categoryStartDate, LocalDate categoryEndDate, BigDecimal actual, boolean isActive, CategoryType categoryType, DateRange dateRange) {
        super(categoryId, categoryName, categoryDescription, budgetedAmount, categoryStartDate, categoryEndDate, actual, isActive, categoryType, dateRange);
        this.expenseTransactions = new HashSet<>();
    }

//    public void addExpenseCategory(TransactionCategory expenseCategory)
//    {
//        expenseCategories.add(expenseCategory);
//        setBudgetedAmount(getBudgetedAmount().add(BigDecimal.valueOf(expenseCategory.getBudgetedAmount())));
//        setActual(getActual().add(BigDecimal.valueOf(expenseCategory.getBudgetActual())));
//    }

}
