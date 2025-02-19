package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class HistoricalBudget
{
    private Long id;
    private Long userId;
    private String budgetName;
    private BigDecimal budgetedAmount;
    private BigDecimal spentAmount;
    private BigDecimal budgetSavingsAmount;
    private BigDecimal budgetTotalSavings;
    private LocalDate startDate;
    private LocalDate endDate;
    private int year;
    private BudgetStats historicalBudgetStats;
    private IncomeCategory incomeCategory;
    private ExpenseCategory expenseCategoryOverview;
    private SavingsCategory savingsCategory;
    private List<ExpenseCategory> topExpenseCategories = new ArrayList<>();
    private List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
}
