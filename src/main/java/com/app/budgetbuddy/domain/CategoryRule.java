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
    private String categoryId;
    private String categoryName;
    private String merchantPattern;
    private String descriptionPattern;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private TransactionType transactionType;
    private boolean isRecurring;

    public CategoryRule(String categoryId, String categoryName, String merchantPattern, String descriptionPattern, BigDecimal minAmount, BigDecimal maxAmount, TransactionType transactionType, boolean isRecurring) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.merchantPattern = merchantPattern;
        this.descriptionPattern = descriptionPattern;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
        this.transactionType = transactionType;
        this.isRecurring = isRecurring;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CategoryRule that = (CategoryRule) o;
        return isRecurring == that.isRecurring && Objects.equals(categoryId, that.categoryId) && Objects.equals(categoryName, that.categoryName) && Objects.equals(merchantPattern, that.merchantPattern) && Objects.equals(descriptionPattern, that.descriptionPattern) && Objects.equals(minAmount, that.minAmount) && Objects.equals(maxAmount, that.maxAmount) && transactionType == that.transactionType;
    }

    @Override
    public int hashCode() {
        return Objects.hash(categoryId, categoryName, merchantPattern, descriptionPattern, minAmount, maxAmount, transactionType, isRecurring);
    }
}
