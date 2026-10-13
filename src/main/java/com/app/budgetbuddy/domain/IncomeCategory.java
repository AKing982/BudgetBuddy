package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
@ToString
public class IncomeCategory
{
    private final String category = "Income";
    private BigDecimal budgetedIncome;
    private BigDecimal actualBudgetedIncome;
    private BigDecimal remainingIncome;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isActive;

    public IncomeCategory(BigDecimal budgetedIncome, BigDecimal actualBudgetedIncome, BigDecimal remainingIncome, LocalDate startDate, LocalDate endDate, boolean isActive)
    {
        this.budgetedIncome = budgetedIncome;
        this.actualBudgetedIncome = actualBudgetedIncome;
        this.remainingIncome = remainingIncome;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isActive = isActive;
    }
}
