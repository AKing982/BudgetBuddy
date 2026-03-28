package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
@EqualsAndHashCode
public class BPBudgetCategory
{
    private Long id;
    private int columnIndex;
    private BigDecimal plannedAmount;
    private BigDecimal actualAmount;
    private BigDecimal budgetedAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String category;
    private double percentage;
    private boolean isOverBudget;
}
