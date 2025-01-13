package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TransactionCategory that = (TransactionCategory) o;
        return isOverSpent == that.isOverSpent && Objects.equals(id, that.id) && Objects.equals(budgetId, that.budgetId) && Objects.equals(categoryId, that.categoryId) && Objects.equals(categoryName, that.categoryName) && Objects.equals(budgetedAmount, that.budgetedAmount) && Objects.equals(budgetActual, that.budgetActual) && Objects.equals(isActive, that.isActive) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(overSpendingAmount, that.overSpendingAmount) && Objects.equals(transactions, that.transactions);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, budgetId, categoryId, categoryName, budgetedAmount, budgetActual, isActive, startDate, endDate, overSpendingAmount, isOverSpent, transactions);
    }
}
