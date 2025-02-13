package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.services.TransactionCategoryService;
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
        List<BudgetScheduleRange> biWeeklyRanges = budgetSchedule.getBudgetScheduleRanges()
                .stream()
                .filter(range -> ChronoUnit.DAYS.between(range.getStartRange(), range.getEndRange()) == 13) // 14 days (bi-weekly) is 13 days between
                .toList();
        if(biWeeklyRanges.isEmpty())
        {
            log.warn("No Bi Weekly BudgetScheduleRanges found for budgetScheduleId: {}", budgetSchedule.getBudgetScheduleId());
            return Collections.emptyList();
        }
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        try
        {
            for(BudgetScheduleRange budgetScheduleBiWeek : biWeeklyRanges)
            {
                LocalDate biWeekStart = budgetScheduleBiWeek.getStartRange();
                LocalDate biWeekEnd = budgetScheduleBiWeek.getEndRange();
                log.info("Getting to Weekly Budget Query");
                final String biWeeklyBudgetQuery = """
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
                List<Object[]> results = entityManager.createQuery(biWeeklyBudgetQuery, Object[].class)
                        .setParameter("startDate", biWeekStart)
                        .setParameter("endDate", biWeekEnd)
                        .setParameter("budgetId", subBudgetId)
                        .getResultList();
                DateRange biWeekRange = budgetScheduleBiWeek.getBudgetDateRange();
                results.stream()
                        .map(row -> {
                            String categoryName = (String) row[1];
                            BigDecimal budgeted = BigDecimal.valueOf((Double) row[2]);
                            BigDecimal actual = BigDecimal.valueOf((Double) row[3]);

                            return new BudgetPeriodCategory(
                                    categoryName,
                                    budgeted,
                                    actual,
                                    biWeekRange,
                                    determineCategoryStatus(budgeted, actual)
                            );
                        })
                        .forEach(budgetPeriodCategories::add);
            }

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
