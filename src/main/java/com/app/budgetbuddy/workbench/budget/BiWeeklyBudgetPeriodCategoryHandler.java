package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(SubBudget budget, BudgetSchedule budgetSchedule)
    {
        if (budget == null || budgetSchedule == null) {
            return Collections.emptyList();
        }

        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        try
        {
            LocalDate subBudgetStartDate = budget.getStartDate();
            LocalDate subBudgetEndDate = budget.getEndDate();
            Long subBudgetId = budget.getId();

            // Split the budget period into biweekly periods
            DateRange dateRange = new DateRange(subBudgetStartDate, subBudgetEndDate);
            List<DateRange> biWeeklyRanges = dateRange.splitIntoBiWeeks();
            if (biWeeklyRanges.isEmpty())
            {
                log.warn("No biweekly date ranges found for SubBudget ID: {}", subBudgetId);
                return Collections.emptyList();
            }

            if (biWeeklyRanges.size() > 3)
            {
                throw new DateRangeException("Bi-weekly budget periods cannot exceed 3 periods.");
            }

            final String biWeeklyQuery = """
               SELECT DISTINCT tc.category.id,
                      tc.category.name,
                      tc.budgetedAmount,
                      COALESCE(tc.actual, 0) as actualSpent,
                      tc.budgetedAmount - COALESCE(tc.actual, 0) as remainingAmount
               FROM TransactionCategoryEntity tc
               JOIN tc.category c
               JOIN tc.budget b
               WHERE tc.startDate <= :endDate 
               AND tc.endDate >= :startDate
               AND tc.budget.id = :budgetId
               AND tc.isactive = true
               """;

            for(DateRange biWeeklyRange : biWeeklyRanges)
            {
                if (biWeeklyRange.getStartDate() == null || biWeeklyRange.getEndDate() == null)
                {
                    throw new DateRangeException("Bi-weekly period cannot have null start date or end date.");
                }

                List<Object[]> results = entityManager.createQuery(biWeeklyQuery, Object[].class)
                        .setParameter("startDate", biWeeklyRange.getStartDate())
                        .setParameter("endDate", biWeeklyRange.getEndDate())
                        .setParameter("budgetId", subBudgetId)
                        .getResultList();

                results.stream()
                        .map(row -> {
                            String categoryName = (String) row[1];
                            BigDecimal budgeted = BigDecimal.valueOf((Double) row[2]);
                            BigDecimal actual = BigDecimal.valueOf((Double) row[3]);

                            return new BudgetPeriodCategory(
                                    categoryName,
                                    budgeted,
                                    actual,
                                    biWeeklyRange,
                                    determineCategoryStatus(budgeted, actual)
                            );
                        })
                        .forEach(budgetPeriodCategories::add);
            }

            return budgetPeriodCategories;

        } catch (DateRangeException e)
        {
            log.error("There was an error with the bi-weekly ranges: ", e);
            throw e;
        } catch (Exception e)
        {
            log.error("Error getting bi-weekly budget data for budget ID: {}", budget.getId(), e);
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
