package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;


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
        return envelopeCriteria.stream()
                .peek(envelopeCriteria1 -> {
                    BigDecimal singleScore = getSingleFeasibiltyScore(envelopeCriteria1, budgetCriteria);
                    envelopeCriteria1.setScore(singleScore.doubleValue());
                })
                .filter(envelopeCriteria1 -> isFeasible(BigDecimal.valueOf(envelopeCriteria1.getScore())))
                .toList();
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
        BigDecimal target = BigDecimal.valueOf(envelopeCriteria.getTargetAmount());
        BigDecimal initial = BigDecimal.valueOf(envelopeCriteria.getInitialContribution());
        BigDecimal gap = target.subtract(initial);

        if (gap.compareTo(BigDecimal.ZERO) <= 0)
        {
            return BigDecimal.ONE;
        }

        // Step 1: coverageRatio = initialContribution / gap
        //         — how much of the remaining gap is already covered by the initial contribution
        // Step 2: surplusRatio = surplus / targetAmount — capped at 1.0
        //         — can the monthly surplus meaningfully dent the target
        // Step 3: return coverageRatio * surplusRatio, scaled to SCALE decimal places

        BigDecimal coverageRatio = initial.divide(gap, 4, RoundingMode.HALF_UP);

        BigDecimal surplusRatio = surplus.divide(target, 4, RoundingMode.HALF_UP)
                .min(BigDecimal.ONE);

        return coverageRatio.multiply(surplusRatio).setScale(4, RoundingMode.HALF_UP);
    }

    private static BigDecimal scorePayoff(NewEnvelopeCriteria envelopeCriteria, BigDecimal surplus)
    {
        BigDecimal envelopeTargetAmount = BigDecimal.valueOf(envelopeCriteria.getTargetAmount());
        BigDecimal initialContribution = BigDecimal.valueOf(envelopeCriteria.getInitialContribution());
        if(envelopeTargetAmount.compareTo(surplus) == 0)
        {
            return BigDecimal.ONE;
        }
        long monthsLeft = ChronoUnit.MONTHS.between(LocalDate.now(), envelopeCriteria.getTargetDate());
        if(monthsLeft <= 0)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal initialCoverageRatio = initialContribution.divide(envelopeTargetAmount, 4, RoundingMode.HALF_UP);
        BigDecimal totalCapacity = surplus.multiply(BigDecimal.valueOf(monthsLeft));
        BigDecimal capacityRatio = totalCapacity.divide(envelopeTargetAmount, 4, RoundingMode.HALF_UP);
        return initialCoverageRatio.multiply(capacityRatio).setScale(4, RoundingMode.HALF_UP);
    }

    private static BigDecimal scorePurchase(NewEnvelopeCriteria envelopeCriteria, BigDecimal surplus)
    {
        BigDecimal envelopeTargetAmount = BigDecimal.valueOf(envelopeCriteria.getTargetAmount());
        BigDecimal initialContribution = BigDecimal.valueOf(envelopeCriteria.getInitialContribution());
        if(envelopeTargetAmount.compareTo(surplus) == 0)
        {
            return BigDecimal.ONE;
        }
        long monthsLeft = ChronoUnit.MONTHS.between(LocalDate.now(), envelopeCriteria.getTargetDate());
        if(monthsLeft <= 0)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal initialCoverageRatio = initialContribution.divide(envelopeTargetAmount, 4, RoundingMode.HALF_UP);
        BigDecimal monthsNeeded = envelopeTargetAmount.divide(surplus, 4, RoundingMode.HALF_UP);
        BigDecimal timeRatio = BigDecimal.valueOf(monthsLeft).divide(monthsNeeded, 4, RoundingMode.HALF_UP)
                .min(BigDecimal.ONE);
        return initialCoverageRatio.multiply(timeRatio).setScale(4, RoundingMode.HALF_UP);
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
