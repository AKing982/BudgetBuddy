package com.app.budgetbuddy.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class RecurringCategory
{
    private String categoryName = "Recurring";
    private LocalDate firstDate;
    private LocalDate lastDate;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String merchant;
    private boolean isActive;
    private String frequency;

    public RecurringCategory(String categoryName, LocalDate firstDate, LocalDate lastDate, BigDecimal minAmount, BigDecimal maxAmount, String merchant, boolean isActive, String frequency) {
        this.categoryName = categoryName;
        this.firstDate = firstDate;
        this.lastDate = lastDate;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
        this.merchant = merchant;
        this.isActive = isActive;
        this.frequency = frequency;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        RecurringCategory that = (RecurringCategory) o;
        return isActive == that.isActive && Objects.equals(categoryName, that.categoryName) && Objects.equals(firstDate, that.firstDate) && Objects.equals(lastDate, that.lastDate) && Objects.equals(minAmount, that.minAmount) && Objects.equals(maxAmount, that.maxAmount) && Objects.equals(merchant, that.merchant) && Objects.equals(frequency, that.frequency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(categoryName, firstDate, lastDate, minAmount, maxAmount, merchant, isActive, frequency);
    }

    @Override
    public String toString() {
        return "RecurringCategory{" +
                "categoryName='" + categoryName + '\'' +
                ", firstDate=" + firstDate +
                ", lastDate=" + lastDate +
                ", minAmount=" + minAmount +
                ", maxAmount=" + maxAmount +
                ", merchant='" + merchant + '\'' +
                ", isActive=" + isActive +
                ", frequency='" + frequency + '\'' +
                '}';
    }
}
