package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransactionRule extends TransactionRule
{
    private boolean isRecurring;
    private String frequency;
    private Boolean isActive;
    private BigDecimal recurringAmount;

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
