package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetHealthScore
{
    private Long budgetId;
    private BigDecimal scoreValue; // Health score value (0 - 100)
    private BigDecimal spendingRatio; // Ratio of spent amount to budgeted amount
    private BigDecimal savingsRatio; // Ratio of saved amount to budgeted amount
    private BigDecimal variance; // Difference between expected & actual performance

    private LocalDate evaluationDate; // Date when the health score was calculated

    /**
     * Updates the score value based on spending and savings ratios.
     */
    public void updateScore(BigDecimal spendingRatio, BigDecimal savingsRatio) {
        this.spendingRatio = spendingRatio;
        this.savingsRatio = savingsRatio;
        this.scoreValue = calculateHealthScore(spendingRatio, savingsRatio);
        this.evaluationDate = LocalDate.now(); // Update to today's date
    }

    /**
     * Method to calculate the budget health score.
     */
    protected BigDecimal calculateHealthScore(BigDecimal spendingRatio, BigDecimal savingsRatio)
    {
        BigDecimal baseScore = new BigDecimal("100");

        // Deduct points for overspending
        BigDecimal spendingDeduction = spendingRatio.multiply(new BigDecimal("100"));

        // Reward savings contribution
        BigDecimal savingsBoost = savingsRatio.multiply(new BigDecimal("50")); // Rewards savings

        // Calculate final score
        BigDecimal finalScore = baseScore.subtract(spendingDeduction).add(savingsBoost);

        // Ensure score remains within 0-100 range
        return finalScore.max(BigDecimal.ZERO).min(new BigDecimal("100"));
    }

}
