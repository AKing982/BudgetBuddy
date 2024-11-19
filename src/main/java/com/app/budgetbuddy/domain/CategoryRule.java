package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.Objects;

@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryRule
{
    private String categoryId;
    private String categoryName;
    private String merchantPattern;
    private String descriptionPattern;
    private String frequency;
    private TransactionType transactionType;
    private boolean isRecurring;
    private int priority;

    public CategoryRule(String categoryName, String merchantPattern, String descriptionPattern, String frequency, TransactionType transactionType, boolean isRecurring, int priority) {
        this.categoryName = categoryName;
        this.merchantPattern = merchantPattern;
        this.descriptionPattern = descriptionPattern;
        this.frequency = frequency;
        this.transactionType = transactionType;
        this.isRecurring = isRecurring;
        this.priority = priority;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CategoryRule that = (CategoryRule) o;
        return isRecurring == that.isRecurring && Objects.equals(categoryName, that.categoryName) && Objects.equals(merchantPattern, that.merchantPattern) && Objects.equals(descriptionPattern, that.descriptionPattern) && Objects.equals(frequency, that.frequency) && transactionType == that.transactionType;
    }

    @Override
    public int hashCode() {
        return Objects.hash(categoryName, merchantPattern, descriptionPattern, frequency, transactionType, isRecurring);
    }
}
