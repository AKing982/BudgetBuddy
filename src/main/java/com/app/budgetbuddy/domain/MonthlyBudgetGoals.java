package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Objects;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class MonthlyBudgetGoals
{
    private Long id;
    private Long subBudgetId;
    private Long budgetGoalId;
    private BigDecimal monthlySavingsTarget;
    private BigDecimal monthlyContributed;
    private BigDecimal goalScore;
    private BigDecimal remainingAmount;
    private String monthlyStatus;
}
