package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class SubBudgetCriteria
{
    private Long subBudgetId;
    private BigDecimal allocatedAmount;
    private BigDecimal subSavingsTarget;
    private BigDecimal subSavingsAmount;
    private BigDecimal spentOnBudget;
    private LocalDate subBudgetStartDate;
    private LocalDate subBudgetEndDate;
    private Budget budget;
}
