package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class EnvelopeEstimateCriteria
{
    private String goalName;
    private double totalAmount;
    private String paymentType;
    private LocalDate purchaseDate;
    private int priority;
    private double monthlyIncome;
    private double monthlyExpenses;
    private double overallEnvelopeAllocation;

    public EnvelopeEstimateCriteria(String goalName, double totalAmount, String paymentType, LocalDate purchaseDate, int priority, double monthlyIncome, double monthlyExpenses, double overallEnvelopeAllocation) {
        this.goalName = goalName;
        this.totalAmount = totalAmount;
        this.paymentType = paymentType;
        this.purchaseDate = purchaseDate;
        this.priority = priority;
        this.monthlyIncome = monthlyIncome;
        this.monthlyExpenses = monthlyExpenses;
        this.overallEnvelopeAllocation = overallEnvelopeAllocation;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        EnvelopeEstimateCriteria that = (EnvelopeEstimateCriteria) o;
        return Double.compare(totalAmount, that.totalAmount) == 0 && priority == that.priority && Double.compare(monthlyIncome, that.monthlyIncome) == 0 && Double.compare(monthlyExpenses, that.monthlyExpenses) == 0 && Double.compare(overallEnvelopeAllocation, that.overallEnvelopeAllocation) == 0 && Objects.equals(goalName, that.goalName) && Objects.equals(paymentType, that.paymentType) && Objects.equals(purchaseDate, that.purchaseDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(goalName, totalAmount, paymentType, purchaseDate, priority, monthlyIncome, monthlyExpenses, overallEnvelopeAllocation);
    }
}

