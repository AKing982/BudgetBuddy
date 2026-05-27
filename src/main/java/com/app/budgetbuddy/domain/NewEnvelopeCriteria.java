package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class NewEnvelopeCriteria
{
    private String goalType;
    private String goalName;
    private EnvelopeType envelopeType;
    private String description;
    private double targetAmount;
    private double initialContribution;
    private LocalDate startDate;
    private LocalDate targetDate;
    private boolean isAutoContribution;
    private String frequency;
    private PaymentInfo paymentInfo;
    private double score;
    private Long userId;

    public NewEnvelopeCriteria(String goalType, String goalName, EnvelopeType envelopeType, String description, double targetAmount, double initialContribution, LocalDate startDate, LocalDate targetDate, boolean isAutoContribution, String frequency, PaymentInfo paymentInfo, double score, Long userId) {
        this.goalType = goalType;
        this.goalName = goalName;
        this.envelopeType = envelopeType;
        this.description = description;
        this.targetAmount = targetAmount;
        this.initialContribution = initialContribution;
        this.startDate = startDate;
        this.targetDate = targetDate;
        this.isAutoContribution = isAutoContribution;
        this.frequency = frequency;
        this.paymentInfo = paymentInfo;
        this.score = score;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        NewEnvelopeCriteria that = (NewEnvelopeCriteria) o;
        return Double.compare(targetAmount, that.targetAmount) == 0 && Double.compare(initialContribution, that.initialContribution) == 0 && isAutoContribution == that.isAutoContribution && Double.compare(score, that.score) == 0 && Objects.equals(goalType, that.goalType) && Objects.equals(goalName, that.goalName) && envelopeType == that.envelopeType && Objects.equals(description, that.description) && Objects.equals(startDate, that.startDate) && Objects.equals(targetDate, that.targetDate) && Objects.equals(frequency, that.frequency) && Objects.equals(paymentInfo, that.paymentInfo) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(goalType, goalName, envelopeType, description, targetAmount, initialContribution, startDate, targetDate, isAutoContribution, frequency, paymentInfo, score, userId);
    }
}
