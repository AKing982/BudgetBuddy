package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetHealthScore;
import com.app.budgetbuddy.domain.SubBudget;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SubBudgetHealthScoreImpl implements BudgetHealthService<SubBudget>
{
    private Map<Long, BudgetHealthScore> subBudgetHealthScoreMap = new HashMap<>();

    @Override
    public BudgetHealthScore calculateHealthScore(SubBudget budget)
    {
        if (budget == null)
        {
            throw new IllegalArgumentException("SubBudget cannot be null");
        }

        BigDecimal spendingRatio = trackSubBudgetSpendingRatio(budget);
        BigDecimal variance = calculateVariance(budget);
        BigDecimal savingsRatio = budget.getSavingsRatio();
        BigDecimal score = computeHealthScore(spendingRatio, savingsRatio);
        BudgetHealthScore healthScore = new BudgetHealthScore(
                budget.getId(),
                score,
                spendingRatio,
                savingsRatio,
                variance,
                LocalDate.now()
        );

        subBudgetHealthScoreMap.put(budget.getId(), healthScore);
        return healthScore;
    }

    /**
     * Retrieves the health score for a specific sub-budget.
     * @param subBudgetId The ID of the sub-budget.
     * @return The latest health score.
     */
    public BudgetHealthScore getHealthScore(Long subBudgetId) {
        return subBudgetHealthScoreMap.getOrDefault(subBudgetId, new BudgetHealthScore());
    }

    /**
     * Retrieves all sub-budget health scores for a given budget.
     * @param budgetId The ID of the main budget.
     * @return A map of sub-budget IDs and their scores.
     */
    public Map<Long, BudgetHealthScore> getAllHealthScoresForBudget(Long budgetId) {
        return subBudgetHealthScoreMap.entrySet().stream()
                .filter(entry -> entry.getValue().getBudgetId().equals(budgetId))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    /**
     * Finds sub-budgets with a health score below a given threshold.
     * @param threshold The score threshold.
     * @return List of sub-budget IDs below the threshold.
     */
    public List<Long> getSubBudgetsBelowThreshold(BigDecimal threshold) {
        return subBudgetHealthScoreMap.entrySet().stream()
                .filter(entry -> entry.getValue().getScoreValue().compareTo(threshold) < 0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * Calculates the variance between actual and budgeted spending.
     * @param budget The sub-budget.
     * @return The variance.
     */
    private BigDecimal calculateVariance(SubBudget budget)
    {
        return budget.getSpentOnBudget().subtract(budget.getAllocatedAmount()).abs();
    }

    /**
     * Determines the spending ratio of a sub-budget.
     * @param budget The sub-budget.
     * @return The spending ratio.
     */
    private BigDecimal trackSubBudgetSpendingRatio(SubBudget budget) {
        if (budget.getSpentOnBudget().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return budget.getSpentOnBudget().divide(budget.getAllocatedAmount(), 2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * Computes the final health score.
     * @param spendingRatio The spending ratio.
     * @param savingsRatio The savings ratio.
     * @return The computed health score.
     */
    private BigDecimal computeHealthScore(BigDecimal spendingRatio, BigDecimal savingsRatio) {
        BigDecimal baseScore = new BigDecimal("100");
        BigDecimal spendingPenalty = spendingRatio.multiply(new BigDecimal("120"));
        BigDecimal savingsBoost = savingsRatio.multiply(new BigDecimal("50"));

        BigDecimal finalScore = baseScore.subtract(spendingPenalty).add(savingsBoost);
        return finalScore.max(BigDecimal.ZERO).min(new BigDecimal("100"));
    }


    @Override
    public void updateBudgetHealthScore(SubBudget budget, BudgetHealthScore newScore)
    {
        if (budget == null || newScore == null) {
            throw new IllegalArgumentException("SubBudget and Score cannot be null");
        }

        newScore.updateScore(trackSubBudgetSpendingRatio(budget), budget.getSavingsRatio());
        subBudgetHealthScoreMap.put(budget.getId(), newScore);
    }


}
