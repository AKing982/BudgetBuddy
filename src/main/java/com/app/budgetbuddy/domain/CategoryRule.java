package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryRule
{
    private String categoryName;
    private String merchantPattern;
    private String descriptionPattern;
    private double frequency;
    private TransactionType transactionType;
    private boolean isRecurring;

    public CategoryRule(String categoryName, String merchantPattern, String descriptionPattern, double frequency, TransactionType transactionType, boolean isRecurring) {
        this.categoryName = categoryName;
        this.merchantPattern = merchantPattern;
        this.descriptionPattern = descriptionPattern;
        this.frequency = frequency;
        this.transactionType = transactionType;
        this.isRecurring = isRecurring;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CategoryRule that = (CategoryRule) o;
        return Double.compare(frequency, that.frequency) == 0 && isRecurring == that.isRecurring && Objects.equals(categoryName, that.categoryName) && Objects.equals(merchantPattern, that.merchantPattern) && Objects.equals(descriptionPattern, that.descriptionPattern) && transactionType == that.transactionType;
    }

    @Override
    public int hashCode() {
        return Objects.hash(categoryName, merchantPattern, descriptionPattern, frequency, transactionType, isRecurring);
    }
}
