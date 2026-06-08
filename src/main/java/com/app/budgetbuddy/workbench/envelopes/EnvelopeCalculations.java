package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

@Slf4j
public class EnvelopeCalculations
{
    public static BigDecimal getEnvelopeAllocation(NewEnvelopeCriteria envelopeCriteria, List<EnvelopeCriteriaAllocations> envelopeCriteriaAllocations)
    {
        if(envelopeCriteria == null || envelopeCriteriaAllocations.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        return envelopeCriteriaAllocations.stream()
                .filter(envelopeCriteriaAllocation -> envelopeCriteriaAllocation.criteria().equals(envelopeCriteria))
                .map(EnvelopeCriteriaAllocations::allocation)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    public static BigDecimal getSingleEnvelopeAllocation(final NewEnvelopeCriteria envelopeCriteria, final EnvelopeCriteriaAllocations envelopeCriteriaAllocation)
    {
        if(envelopeCriteria == null || envelopeCriteriaAllocation == null)
        {
            return BigDecimal.ZERO;
        }
        return envelopeCriteriaAllocation.criteria().equals(envelopeCriteria) ? envelopeCriteriaAllocation.allocation() : BigDecimal.ZERO;
    }

    public static BigDecimal getFeasibilityScore(List<NewEnvelopeCriteria> envelopeCriteria, BudgetCriteria budgetCriteria)
    {
        if (envelopeCriteria == null || envelopeCriteria.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        return envelopeCriteria.stream()
                .map(criteria -> getSingleFeasibiltyScore(criteria, budgetCriteria))
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    public static BigDecimal getTotalEnvelopeBudgeted(List<Envelope> envelopes)
    {
        if(envelopes == null || envelopes.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        return envelopes.stream()
                .map(Envelope::getBudgeted)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static List<NewEnvelopeCriteria> determineFeasibleEnvelopes(List<NewEnvelopeCriteria> envelopeCriteria, BudgetCriteria budgetCriteria)
    {
        if(envelopeCriteria == null || envelopeCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        List<NewEnvelopeCriteria> feasibleEnvelopes = envelopeCriteria.stream()
                .peek(envelopeCriteria1 -> {
                    BigDecimal singleScore = getSingleFeasibiltyScore(envelopeCriteria1, budgetCriteria);
                    log.info("Single score: {}", singleScore);
                    envelopeCriteria1.setScore(singleScore.doubleValue());
                })
                .filter(envelopeCriteria1 -> isFeasible(BigDecimal.valueOf(envelopeCriteria1.getScore())))
                .toList();
        log.info("Feasible Envelopes: {}", feasibleEnvelopes);
        return feasibleEnvelopes;
    }

    public static BigDecimal calculateEnvelopeAllocation(final NewEnvelopeCriteria newEnvelopeCriteria, final BudgetCriteria budgetCriteria)
    {
        if(newEnvelopeCriteria == null || budgetCriteria == null)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal envelopeTargetAmount = BigDecimal.valueOf(newEnvelopeCriteria.getTargetAmount());
        BigDecimal availableBudget = budgetCriteria.getAvailableEnvelopeSurplus();
        if(availableBudget.compareTo(BigDecimal.ZERO) <= 0)
        {
            return BigDecimal.ZERO;
        }
        return availableBudget.min(envelopeTargetAmount);
    }

    public static List<EnvelopeCriteriaAllocations> calculateEnvelopeAllocations(final List<NewEnvelopeCriteria> newEnvelopeCriteria, final BudgetCriteria budgetCriteria)
    {
        if(newEnvelopeCriteria == null || newEnvelopeCriteria.isEmpty())
        {
            return Collections.emptyList();
        }

        BigDecimal sharedBudget = budgetCriteria.getAvailableEnvelopeSurplus();
        BigDecimal totalScore = newEnvelopeCriteria.stream()
                .map(c -> BigDecimal.valueOf(c.getScore()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if(totalScore.compareTo(BigDecimal.ZERO) == 0)
        {
            return Collections.emptyList();
        }
        return newEnvelopeCriteria.stream().map(newEnvelopeCriterion -> {
                    BigDecimal score = BigDecimal.valueOf(newEnvelopeCriterion.getScore());
                    BigDecimal allocation = score
                            .divide(totalScore, 4, RoundingMode.HALF_UP)
                            .multiply(sharedBudget)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new EnvelopeCriteriaAllocations(newEnvelopeCriterion, allocation);
                })
                .toList();
    }

    public static boolean isFeasible(BigDecimal score)
    {
        if(score == null || score.compareTo(BigDecimal.ZERO) == 0)
        {
            return false;
        }
        return score.compareTo(BigDecimal.valueOf(0.80)) > 0;
    }

    public static BigDecimal getSingleFeasibiltyScore(NewEnvelopeCriteria envelopeCriteria, BudgetCriteria budgetCriteria)
    {
        if(envelopeCriteria == null || budgetCriteria == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            BigDecimal surplus = budgetCriteria.getAvailableEnvelopeSurplus();
            if(surplus == null || surplus.compareTo(BigDecimal.ZERO) < 0)
            {
                return BigDecimal.ZERO;
            }
            return switch(envelopeCriteria.getEnvelopeType()){
                case PURCHASE -> scorePurchase(envelopeCriteria, surplus);
                case PAYOFF -> scorePayoff(envelopeCriteria, surplus);
                case FUND -> scoreFund(envelopeCriteria, surplus);
            };

        }catch(Exception e)
        {
            return BigDecimal.ZERO;
        }
    }

    private static BigDecimal scoreFund(NewEnvelopeCriteria envelopeCriteria, BigDecimal surplus)
    {
        BigDecimal target  = BigDecimal.valueOf(envelopeCriteria.getTargetAmount());
        BigDecimal initial = BigDecimal.valueOf(envelopeCriteria.getInitialContribution());

        // Already fully funded
        if(initial.compareTo(target) >= 0)
        {
            return BigDecimal.ONE;
        }

        BigDecimal remaining = target.subtract(initial);

        // No target date — score purely on whether surplus covers target at all
        if(envelopeCriteria.getTargetDate() == null)
        {
            return surplus.divide(remaining, 4, RoundingMode.HALF_UP)
                    .min(BigDecimal.ONE)
                    .setScale(4, RoundingMode.HALF_UP);
        }

        long monthsLeft = ChronoUnit.MONTHS.between(LocalDate.now(), envelopeCriteria.getTargetDate());
        if (monthsLeft <= 0)
        {
            return BigDecimal.ZERO;
        }

        BigDecimal totalCapacity = surplus.multiply(BigDecimal.valueOf(monthsLeft));

        // capacityRatio = can the total available surplus cover the remaining gap
        BigDecimal capacityRatio = totalCapacity
                .divide(remaining, 4, RoundingMode.HALF_UP)
                .min(BigDecimal.ONE);

        return capacityRatio.setScale(4, RoundingMode.HALF_UP);
    }

    private static BigDecimal scorePayoff(NewEnvelopeCriteria envelopeCriteria, BigDecimal surplus)
    {
        BigDecimal target = BigDecimal.valueOf(envelopeCriteria.getTargetAmount());
        BigDecimal initial = BigDecimal.valueOf(envelopeCriteria.getInitialContribution());

        // If already fully covered by initial contribution
        if(initial.compareTo(target) >= 0)
        {
            return BigDecimal.ONE;
        }

        long monthsLeft = ChronoUnit.MONTHS.between(LocalDate.now(), envelopeCriteria.getTargetDate());
        if(monthsLeft <= 0)
        {
            return BigDecimal.ZERO;
        }

        BigDecimal remaining    = target.subtract(initial);
        BigDecimal totalCapacity = surplus.multiply(BigDecimal.valueOf(monthsLeft));

        // capacityRatio = how much of the remaining balance the surplus can cover
        // over the available months — capped at 1.0 (can't be more than fully funded)
        BigDecimal capacityRatio = totalCapacity
                .divide(remaining, 4, RoundingMode.HALF_UP)
                .min(BigDecimal.ONE);

        return capacityRatio.setScale(4, RoundingMode.HALF_UP);
    }

    private static BigDecimal scorePurchase(NewEnvelopeCriteria envelopeCriteria, BigDecimal surplus)
    {
        BigDecimal target  = BigDecimal.valueOf(envelopeCriteria.getTargetAmount());
        BigDecimal initial = BigDecimal.valueOf(envelopeCriteria.getInitialContribution());

        if (initial.compareTo(target) >= 0)
        {
            return BigDecimal.ONE;
        }

        long monthsLeft = ChronoUnit.MONTHS.between(LocalDate.now(), envelopeCriteria.getTargetDate());
        if (monthsLeft <= 0)
        {
            return BigDecimal.ZERO;
        }

        BigDecimal remaining     = target.subtract(initial);
        BigDecimal monthsNeeded  = remaining.divide(surplus, 4, RoundingMode.HALF_UP);

        // timeRatio = do we have enough months left to save up — capped at 1.0
        BigDecimal timeRatio = BigDecimal.valueOf(monthsLeft)
                .divide(monthsNeeded, 4, RoundingMode.HALF_UP)
                .min(BigDecimal.ONE);

        return timeRatio.setScale(4, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateContributionAmount(BigDecimal budgetAmount, BigDecimal currentSpending, LocalDate targetDate, BigDecimal envelopeTargetAmount)
    {
        return BigDecimal.ZERO;
    }

    public LocalDate calculateNextContributionDate(LocalDate currentDate, LocalDate targetDate, BigDecimal currentContributedAmount, BigDecimal envelopePercentage)
    {
        return null;
    }

    public BigDecimal calculateAllocatedEnvelopeAmount(EnvelopeLink envelopeLink)
    {
        return BigDecimal.ZERO;
    }

    public int calculateNumberOfDaysLeft(LocalDate currentDate, LocalDate targetDate)
    {
        return 0;
    }

    public int calculateMonthStreaks(List<EnvelopeContribution> envelopeContributions)
    {
        return 0;
    }

    public BigDecimal calculateContributionVelocity(int totalMonths, BigDecimal targetEnvelopeAmount, BigDecimal totalContributed)
    {
        return BigDecimal.ZERO;
    }

    public BigDecimal calculateEnvelopePercentage(BigDecimal totalEnvelopeTarget, BigDecimal actualContributedAmount)
    {
        return BigDecimal.ZERO;
    }
}
