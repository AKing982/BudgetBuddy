package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@AllArgsConstructor(access= AccessLevel.PUBLIC)
public class BudgetRegistration
{
    private Long userId;
    private String budgetName;
    private String budgetType;
    private Period budgetPeriod;
    private BudgetGoals budgetGoals;
    private LocalDate budgetStartDate;
    private LocalDate budgetEndDate;
    private BigDecimal budgetedAmount;
    private BigDecimal totalIncomeAmount;
    private int numberOfMonths;
    private int totalBudgetsNeeded;
    private boolean budgetExists;
}
