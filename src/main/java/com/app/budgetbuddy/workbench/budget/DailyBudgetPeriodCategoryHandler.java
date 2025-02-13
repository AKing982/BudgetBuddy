package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
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
import java.util.stream.Collectors;

@Service
@Slf4j
public class DailyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public DailyBudgetPeriodCategoryHandler(EntityManager entityManager)
    {
        this.entityManager = entityManager;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        try
        {
            LocalDate subBudgetStartDate = budgetSchedule.getStartDate();
            LocalDate subBudgetEndDate = budgetSchedule.getEndDate();
            Long subBudgetId = budgetSchedule.getSubBudgetId();
            // Generate daily date ranges
            DateRange dailyDateRange = new DateRange(subBudgetStartDate, subBudgetEndDate);
            List<LocalDate> dailyDates = dailyDateRange.splitIntoDays().stream()
                    .map(DateRange::getStartDate)
                    .toList();

            for(LocalDate date : dailyDates)
            {
                List<Object[]> results = entityManager.createQuery("""
                    SELECT DISTINCT tc.category.id AS categoryId,
                           c.name AS categoryName,
                           tc.budgetedAmount,
                           COALESCE(tc.actual, 0) AS actualSpent,
                           (tc.budgetedAmount - COALESCE(tc.actual, 0)) AS remainingAmount
                    FROM TransactionCategoryEntity tc
                    JOIN CategoryEntity c ON tc.category.id = c.id
                    WHERE tc.startDate <= :date
                      AND tc.endDate >= :date
                      AND tc.subBudget.id = :budgetId
                      AND tc.isactive = true
                """, Object[].class)
                        .setParameter("date", date)
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
                                    new DateRange(date, date),
                                    determineCategoryStatus(budgeted, actual)
                            );
                        })
                        .forEach(budgetPeriodCategories::add);
            }

            return budgetPeriodCategories;

        } catch (Exception e) {
            log.error("Error retrieving daily budget period categories for SubBudget ID: {}", budgetSchedule.getBudgetScheduleId(), e);
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
