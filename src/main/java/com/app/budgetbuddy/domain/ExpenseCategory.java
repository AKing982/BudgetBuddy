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
@ToString
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class ExpenseCategory
{
    private String category;
    private BigDecimal budgetedExpenses;
    private BigDecimal actualExpenses;
    private BigDecimal remainingExpenses;
    private boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isVariable;

    public ExpenseCategory(String category, BigDecimal budgetedExpenses, BigDecimal actualExpenses, BigDecimal remainingExpenses, boolean isActive, LocalDate startDate, LocalDate endDate) {
        this.category = category;
        this.budgetedExpenses = budgetedExpenses;
        this.actualExpenses = actualExpenses;
        this.remainingExpenses = remainingExpenses;
        this.isActive = isActive;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
