package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@ToString
public class TransactionCategory
{
    private Long id;
    private Long budgetId;
    private String categoryId;
    private String categoryName;
    private Double budgetedAmount;
    private Double budgetActual;
    private Boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double overSpendingAmount;
    private boolean isOverSpent;


}
