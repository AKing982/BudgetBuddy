package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
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
    private List<Transaction> transactions;

    public TransactionCategory(Long id, Long budgetId, String categoryId, String categoryName, Double budgetedAmount, Double budgetActual, Boolean isActive, LocalDate startDate, LocalDate endDate, Double overSpendingAmount, boolean isOverSpent) {
        this.id = id;
        this.budgetId = budgetId;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.budgetedAmount = budgetedAmount;
        this.budgetActual = budgetActual;
        this.isActive = isActive;
        this.startDate = startDate;
        this.endDate = endDate;
        this.overSpendingAmount = overSpendingAmount;
        this.isOverSpent = isOverSpent;
    }


}
