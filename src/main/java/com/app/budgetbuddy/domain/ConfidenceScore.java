package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ConfidenceScore
{
    private final List<Transaction> transactions;
    private final String category;

    public ConfidenceScore(String category, List<Transaction> categoryTransactions)
    {
        this.category = category;
        this.transactions = categoryTransactions;
    }

    public int calculate()
    {
        if(transactions.isEmpty())
        {
            return 0;
        }
        int count = transactions.size();
        int score = 40;
        if(count >= 3)
        {
            score += Math.min(20, count * 2);
        }
        BigDecimal varianceRatio = calculateVariance();
        if(varianceRatio.compareTo(BigDecimal.valueOf(0.15)) < 0)
        {
            score += 10;
        }
        else if(varianceRatio.compareTo(BigDecimal.valueOf(0.3)) < 0)
        {
            score += 5;
        }
        double recurrenceScore = calculateRecurrence();
        if(recurrenceScore >= 0.75)
        {
            score += 10;
        }
        else if(recurrenceScore >= 0.5)
        {
            score += 5;
        }
        return Math.min(score, 100);
    }

    private BigDecimal calculateVariance()
    {
        List<BigDecimal> transactionAmounts = transactions.stream()
                .map(Transaction::getAmount)
                .toList();

        if(transactionAmounts.size() < 2)
        {
            return BigDecimal.ONE;
        }
        BigDecimal mean = transactionAmounts.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(transactionAmounts.size()), 2, BigDecimal.ROUND_HALF_UP);
        if(mean.compareTo(BigDecimal.ZERO) == 0)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal variance = transactionAmounts.stream()
                .map(a -> a.subtract(mean).pow(2))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(transactionAmounts.size()), 2, BigDecimal.ROUND_HALF_UP);

        BigDecimal stdDev = BigDecimal.valueOf(variance.longValue(), 10);
        return stdDev.divide(mean, 4, BigDecimal.ROUND_HALF_UP);
    }

    private double calculateRecurrence()
    {
        List<Integer> days = transactions.stream()
                .map(tx -> tx.getDate().getDayOfMonth())
                .toList();

        if(days.size() < 2)
        {
            return 0;
        }
        double avgDay = days.stream()
                .mapToInt(i -> i).average().orElse(0);
        long closeMatches = days.stream()
                .filter(day -> Math.abs(day - avgDay) <= 3)
                .count();
        return (double) closeMatches / (double) days.size();
    }
}

