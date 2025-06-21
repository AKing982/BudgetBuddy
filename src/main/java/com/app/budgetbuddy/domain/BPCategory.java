package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class BPCategory
{
    private DateRange categoryWeek;
    private String category;
    private BigDecimal plannedAmount;
    private BigDecimal actualAmount;
    private BigDecimal remainingAmount;
    private double spendingPercentage;
    private double savingsPercentage;
}
