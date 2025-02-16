package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.services.TransactionCategoryService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class WeeklyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public WeeklyBudgetPeriodCategoryHandler(EntityManager entityManager)
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
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        if(budgetScheduleRanges.isEmpty())
        {
            log.warn("No Budget Schedule Ranges found for budget schedule: {}", budgetSchedule.getBudgetScheduleId());
            return Collections.emptyList();
        }
        try
        {
            for(BudgetScheduleRange budgetScheduleWeek : budgetScheduleRanges)
            {
                LocalDate budgetScheduleWeekStart = budgetScheduleWeek.getStartRange();
                LocalDate budgetScheduleWeekEnd = budgetScheduleWeek.getEndRange();
                log.info("Getting to Weekly Budget Query");
                final String weeklyBudgetQuery = """
                SELECT DISTINCT tc.category.id,
                       tc.category.name,
                       tc.budgetedAmount,
                       COALESCE(tc.actual, 0) as actualSpent,
                       tc.budgetedAmount - COALESCE(tc.actual, 0) as remainingAmount
                FROM TransactionCategoryEntity tc
                JOIN tc.category c
                JOIN tc.subBudget b
                WHERE tc.startDate <= :endDate
                AND tc.endDate >= :startDate
                AND tc.subBudget.id = :budgetId
                AND tc.isactive = true
                """;
                List<Object[]> results = entityManager.createQuery(weeklyBudgetQuery, Object[].class)
                        .setParameter("startDate", budgetScheduleWeekStart)
                        .setParameter("endDate", budgetScheduleWeekEnd)
                        .setParameter("budgetId", subBudgetId)
                        .getResultList();
                log.info("Running Weekly Budget Query: {}", weeklyBudgetQuery);
                log.info("Results size: {}", results.size());
                DateRange weekRange = budgetScheduleWeek.getBudgetDateRange();
                results.stream()
                        .map(row -> {
                            String categoryName = (String) row[1];
                            BigDecimal budgeted = BigDecimal.valueOf((Double) row[2]);
                            BigDecimal actual = BigDecimal.valueOf((Double) row[3]);
                            BigDecimal remaining = BigDecimal.valueOf((Double) row[4]);

                            return BudgetPeriodCategory.builder()
                                    .remaining(remaining)
                                    .budgetStatus(determineCategoryStatus(budgeted, actual))
                                    .actual(actual)
                                    .budgeted(budgeted)
                                    .category(categoryName)
                                    .dateRange(weekRange)
                                    .build();
                        })
                        .forEach(budgetPeriodCategories::add);
            }
            log.info("Budget Period Categories Size: {}", budgetPeriodCategories.size());
            return budgetPeriodCategories;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error with the budget schedule ranges: ", e);
            return Collections.emptyList();
        }
    }

    private BudgetStatus determineCategoryStatus(BigDecimal budgeted, BigDecimal actual) {
        if (actual.compareTo(budgeted) > 0) {
            return BudgetStatus.OVER_BUDGET;
        } else if (actual.compareTo(budgeted.multiply(new BigDecimal("0.8"))) < 0) {
            return BudgetStatus.UNDER_UTILIZED;
        } else {
            return BudgetStatus.GOOD;
        }
    }
}
