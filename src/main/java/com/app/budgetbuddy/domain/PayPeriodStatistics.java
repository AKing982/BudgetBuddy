package com.app.budgetbuddy.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class PayPeriodStatistics
{
    private Long id;
    private Long subBudgetId;
    private LocalDate startDate;
    private LocalDate endDate;
    private double incomeAmount;
    private double totalSpent;
    private double totalBills;
    private double totalRecurring;
    private double totalSavings;
    private double remaining;
    private int incomeDaysLeft;
    private double spendingPerDay;

    public PayPeriodStatistics(Long id, Long subBudgetId, LocalDate startDate, LocalDate endDate, double incomeAmount, double totalSpent, double totalBills, double totalRecurring, double totalSavings, double remaining, int incomeDaysLeft, double spendingPerDay) {
        this.id = id;
        this.subBudgetId = subBudgetId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.incomeAmount = incomeAmount;
        this.totalSpent = totalSpent;
        this.totalBills = totalBills;
        this.totalRecurring = totalRecurring;
        this.totalSavings = totalSavings;
        this.remaining = remaining;
        this.incomeDaysLeft = incomeDaysLeft;
        this.spendingPerDay = spendingPerDay;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        PayPeriodStatistics that = (PayPeriodStatistics) o;
        return Double.compare(incomeAmount, that.incomeAmount) == 0 && Double.compare(totalSpent, that.totalSpent) == 0 && Double.compare(totalBills, that.totalBills) == 0 && Double.compare(totalRecurring, that.totalRecurring) == 0 && Double.compare(totalSavings, that.totalSavings) == 0 && Double.compare(remaining, that.remaining) == 0 && incomeDaysLeft == that.incomeDaysLeft && Double.compare(spendingPerDay, that.spendingPerDay) == 0 && Objects.equals(id, that.id) && Objects.equals(subBudgetId, that.subBudgetId) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, subBudgetId, startDate, endDate, incomeAmount, totalSpent, totalBills, totalRecurring, totalSavings, remaining, incomeDaysLeft, spendingPerDay);
    }

    @Override
    public String toString() {
        return "PayPeriodStatistics{" +
                "id=" + id +
                ", subBudgetId=" + subBudgetId +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", incomeAmount=" + incomeAmount +
                ", totalSpent=" + totalSpent +
                ", totalBills=" + totalBills +
                ", totalRecurring=" + totalRecurring +
                ", totalSavings=" + totalSavings +
                ", remaining=" + remaining +
                ", incomeDaysLeft=" + incomeDaysLeft +
                ", spendingPerDay=" + spendingPerDay +
                '}';
    }
}
