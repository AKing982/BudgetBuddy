package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Deprecated
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetCategory
{
    private String categoryName;
    private BigDecimal budgetedAmount;
    private BigDecimal actualAmount;
    private BigDecimal remainingAmount;
    private DateRange dateRange;
}
