package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransactionRule extends TransactionRule
{
    private boolean isRecurring;
    private String frequency;
    private Boolean isActive;
    private BigDecimal recurringAmount;

    public RecurringTransactionRule(String categoryId, String categoryName, String transactionId, String descriptionPattern, String merchantPattern, int priority, List<String> categories, String matchedCategory, String plaidCategory, String transactionType, boolean isSystemRule, boolean isActive, boolean isRecurring, String frequency, Boolean isActive1, BigDecimal recurringAmount) {
        super(categoryId, categoryName, transactionId, descriptionPattern, merchantPattern, priority, categories, matchedCategory, plaidCategory, transactionType, isSystemRule, isActive);
        this.isRecurring = isRecurring;
        this.frequency = frequency;
        this.isActive = isActive1;
        this.recurringAmount = recurringAmount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RecurringTransactionRule that = (RecurringTransactionRule) o;
        return isRecurring == that.isRecurring && Objects.equals(frequency, that.frequency) && Objects.equals(isActive, that.isActive) && Objects.equals(recurringAmount, that.recurringAmount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(isRecurring, frequency, isActive, recurringAmount);
    }
}
