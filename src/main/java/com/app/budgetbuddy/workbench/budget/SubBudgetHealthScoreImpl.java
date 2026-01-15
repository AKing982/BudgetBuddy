package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetHealthScore;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@Qualifier("subBudgetHealth")
public class SubBudgetHealthScoreImpl implements BudgetHealthService<SubBudget>
{
    private final SubBudgetMonthOverviewServiceImpl subBudgetMonthOverviewServiceImpl;
    private Map<Long, BudgetHealthScore> subBudgetHealthScoreMap = new HashMap<>();
    private final SubBudgetRepository subBudgetRepository;

    @Autowired
    public SubBudgetHealthScoreImpl(SubBudgetRepository subBudgetRepository, SubBudgetMonthOverviewServiceImpl subBudgetMonthOverviewServiceImpl)
    {
        this.subBudgetRepository = subBudgetRepository;
        this.subBudgetMonthOverviewServiceImpl = subBudgetMonthOverviewServiceImpl;
    }

    @Override
    public BudgetHealthScore calculateHealthScore(SubBudget budget)
    {
        if (budget == null)
        {
            throw new IllegalArgumentException("SubBudget cannot be null");
        }

        BigDecimal spendingRatio = trackSubBudgetSpendingRatio(budget);
        log.info("Spending ratio for sub-budget {} is {}", budget.getId(), spendingRatio);
        BigDecimal variance = calculateVariance(budget);
        log.info("Variance for sub-budget {} is {}", budget.getId(), variance);
        BigDecimal savingsRatio = getSavingsRatioCalculation(budget);
        log.info("Savings ratio for sub-budget {} is {}", budget.getId(), savingsRatio);
        BigDecimal score = computeHealthScore(spendingRatio, savingsRatio);
        log.info("Health score for sub-budget {} is {}", budget.getId(), score);
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

    public BigDecimal getSavingsRatioCalculation(SubBudget subBudget)
    {
        BigDecimal allocatedAmount = subBudget.getAllocatedAmount();
        BigDecimal subSavingsAmount = subBudget.getSubSavingsAmount();
        if(subSavingsAmount.compareTo(BigDecimal.ZERO) == 0)
        {
            LocalDate subBudgetStart = subBudget.getStartDate();
            LocalDate subBudgetEnd = subBudget.getEndDate();
            Long subBudgetId = subBudget.getId();
            subBudgetRepository.updateSubBudgetSavingsByDateRange(subBudgetStart, subBudgetEnd, subBudgetId);
            Optional<SubBudgetEntity> refreshedSubBudgetOptional = subBudgetRepository.findById(subBudgetId);
            if(refreshedSubBudgetOptional.isEmpty())
            {
                log.error("Sub budget {} could not be found after updating savings", subBudgetId);
                return BigDecimal.ZERO;
            }
            SubBudgetEntity refreshedSubBudget = refreshedSubBudgetOptional.get();
            subSavingsAmount = refreshedSubBudget.getSubSavingsAmount();
            log.info("Updated sub budget savings to {}", subSavingsAmount);
        }
        return subBudget.getSavingsRatio();
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
        if (budget.getAllocatedAmount().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal allocatedAmount = budget.getAllocatedAmount();
        log.info("Allocated amount for sub-budget {} is {}", budget.getId(), allocatedAmount);
        BigDecimal spentOnSubBudget = budget.getSpentOnBudget();
        if(spentOnSubBudget.compareTo(BigDecimal.ZERO) == 0)
        {
            log.info("Sub Budget spending is zero");
            LocalDate subBudgetStart = budget.getStartDate();
            LocalDate subBudgetEnd = budget.getEndDate();
            Long subBudgetId = budget.getId();
            subBudgetRepository.updateSubBudgetSpendingByDateRange(subBudgetStart, subBudgetEnd, subBudgetId);
            Optional<SubBudgetEntity> refreshedSubBudgetOptional = subBudgetRepository.findById(subBudgetId);
            if(refreshedSubBudgetOptional.isEmpty())
            {
                log.error("Sub budget {} could not be found after updating spending", subBudgetId);
                return BigDecimal.ZERO;
            }
            SubBudgetEntity refreshedSubBudget = refreshedSubBudgetOptional.get();
            spentOnSubBudget = refreshedSubBudget.getSpentOnBudget();
            log.info("Updated sub budget spending to {}", spentOnSubBudget);
        }
        log.info("Spent on sub-budget {} is {}", budget.getId(), spentOnSubBudget);
        BigDecimal spendingRatio = spentOnSubBudget.divide(allocatedAmount, 2, BigDecimal.ROUND_HALF_UP);
        log.info("Spending ratio for sub-budget {} is {}", budget.getId(), spendingRatio);
        return spendingRatio;
    }

    /**
     * Computes the final health score.
     * @param spendingRatio The spending ratio.
     * @param savingsRatio The savings ratio.
     * @return The computed health score.
     */
    private BigDecimal computeHealthScore(BigDecimal spendingRatio, BigDecimal savingsRatio) {
        BigDecimal baseScore = new BigDecimal("100");
        BigDecimal cappedSpendingRatio = spendingRatio.min(new BigDecimal("1.5"));
        BigDecimal spendingPenalty = cappedSpendingRatio.multiply(new BigDecimal("50"));
        BigDecimal savingsBoost = savingsRatio.multiply(new BigDecimal("100"));

        BigDecimal finalScore = baseScore.subtract(spendingPenalty).add(savingsBoost);
        log.info("Final Score: {}", finalScore);
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
