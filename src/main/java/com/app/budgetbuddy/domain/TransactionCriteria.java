package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionCriteria
{
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String categoryId;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String frequency;
    private Boolean pending;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TransactionCriteria that = (TransactionCriteria) o;
        return Objects.equals(userId, that.userId) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(categoryId, that.categoryId) && Objects.equals(minAmount, that.minAmount) && Objects.equals(maxAmount, that.maxAmount) && Objects.equals(frequency, that.frequency) && Objects.equals(pending, that.pending);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, startDate, endDate, categoryId, minAmount, maxAmount, frequency, pending);
    }

    @Override
    public String toString() {
        return "TransactionCriteria{" +
                "userId=" + userId +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", categoryId='" + categoryId + '\'' +
                ", minAmount=" + minAmount +
                ", maxAmount=" + maxAmount +
                ", frequency='" + frequency + '\'' +
                ", pending=" + pending +
                '}';
    }
}
