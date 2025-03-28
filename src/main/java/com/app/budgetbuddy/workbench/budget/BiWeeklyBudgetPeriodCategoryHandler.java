package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.app.budgetbuddy.workbench.budget.BudgetScheduleRangeUtil.buildBiWeeklyBudgetScheduleRanges;

@Service
@Slf4j
public class BiWeeklyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public BiWeeklyBudgetPeriodCategoryHandler(EntityManager entityManager)
    {
        this.entityManager = entityManager;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(final BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        budgetScheduleRanges.forEach((bs) -> {
            log.info("Budget Schedule Range: {}", bs);
        });
        List<BudgetScheduleRange> biWeeklyRanges = buildBiWeeklyBudgetScheduleRanges(budgetScheduleRanges);
        if(biWeeklyRanges.isEmpty())
        {
            log.warn("No Bi Weekly BudgetScheduleRanges found for budgetScheduleId: {}", budgetSchedule.getBudgetScheduleId());
            return Collections.emptyList();
        }
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        try
        {

            log.info("Getting to BiWeekly Budget Query");
            final String biWeeklyBudgetQuery = """
            SELECT DISTINCT tc.category.name,
                   SUM(tc.budgetedAmount) as totalBudgeted,
                   SUM(COALESCE(tc.actual, 0)) as actualSpent,
                   SUM(tc.budgetedAmount - COALESCE(tc.actual, 0)) as remainingAmount
            FROM BudgetCategoryEntity tc
            JOIN tc.category c
            WHERE tc.subBudget.id = :budgetId
            AND tc.isactive = true
            AND (
                (tc.startDate >= :firstPeriodStart AND tc.endDate <= :firstPeriodEnd)
                OR
                (tc.startDate >= :secondPeriodStart AND tc.endDate <= :secondPeriodEnd)
            )
            GROUP BY c.name
            """;
            BudgetScheduleRange firstBiWeekRange = biWeeklyRanges.get(0);
            log.info("First BiWeek Range: start={}, end={}", firstBiWeekRange.getStartRange(), firstBiWeekRange.getEndRange());
            BudgetScheduleRange secondBiWeekRange = biWeeklyRanges.get(1);
            log.info("Second BiWeek Range: start={}, end={}", secondBiWeekRange.getStartRange(), secondBiWeekRange.getEndRange());
            List<Object[]> results = entityManager.createQuery(biWeeklyBudgetQuery, Object[].class)
                    .setParameter("budgetId", subBudgetId)
                    .setParameter("firstPeriodStart", firstBiWeekRange.getStartRange())
                    .setParameter("firstPeriodEnd", firstBiWeekRange.getEndRange())
                    .setParameter("secondPeriodStart", secondBiWeekRange.getStartRange())
                    .setParameter("secondPeriodEnd", secondBiWeekRange.getEndRange())
                    .getResultList();
                    results.stream()
                        .map(row -> {
                            String categoryName = (String) row[0];  // First column: category.name
                            BigDecimal budgeted = BigDecimal.valueOf((Double) row[1]);  // Second column: totalBudgeted
                            BigDecimal actual = BigDecimal.valueOf((Double) row[2]);    // Third column: actualSpent
                            BigDecimal remaining = BigDecimal.valueOf((Double) row[3]); // Fourth column: remainingAmount
                            return BudgetPeriodCategory.builder()
                                    .category(categoryName)
                                    .budgeted(budgeted)
                                    .remaining(remaining)
                                    .actual(actual)
                                    .budgetStatus(determineCategoryStatus(budgeted, actual))
                                    .biWeekRanges(buildBiWeeklyDateRanges(firstBiWeekRange, secondBiWeekRange))
                                    .build();

                        })
                        .forEach(budgetPeriodCategories::add);
                    log.info("Budget Period Categories Size: {}", budgetPeriodCategories.size());

            return budgetPeriodCategories;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error with the bi-weekly ranges: ", e);
            return Collections.emptyList();
        }
    }

     /**
 * Determines the budget category status based on spending.
 */
    private BudgetStatus determineCategoryStatus(BigDecimal budgeted, BigDecimal actual)
    {
        if (actual.compareTo(budgeted) > 0)
        {
            return BudgetStatus.OVER_BUDGET;
        }
        else if(actual.compareTo(budgeted.multiply(new BigDecimal("0.8"))) < 0)
        {
            return BudgetStatus.UNDER_UTILIZED;
        }
        else
        {
            return BudgetStatus.GOOD;
        }
    }

    private List<DateRange> buildBiWeeklyDateRanges(BudgetScheduleRange biWeekRange1, BudgetScheduleRange biWeekRange2)
    {
        List<DateRange> biWeekRanges = new ArrayList<>();
        DateRange biWeek1 = biWeekRange1.getBudgetDateRange();
        DateRange biWeek2 = biWeekRange2.getBudgetDateRange();
        biWeekRanges.add(biWeek1);
        biWeekRanges.add(biWeek2);
        return biWeekRanges;
    }
}
