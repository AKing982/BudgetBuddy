package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
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
import java.util.stream.Collectors;

@Service
@Slf4j
public class MonthlyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public MonthlyBudgetPeriodCategoryHandler(EntityManager entityManager)
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
        LocalDate startDate = budgetSchedule.getStartDate();
        LocalDate endDate = budgetSchedule.getEndDate();
        try
        {
            if(startDate == null || endDate == null){
                throw new DateRangeException("Monthly budget period cannot have null start date or end date.");
            }
            final String monthlyBudgetQuery = """
            SELECT DISTINCT tc.category.name,
                   SUM(tc.budgetedAmount) as totalBudgeted,
                   SUM(tc.actual) as actualSpent,
                   SUM(tc.budgetedAmount - tc.actual) as remainingAmount
            FROM TransactionCategoryEntity tc
            JOIN tc.category c
            WHERE tc.startDate >= :startDate
            AND tc.endDate <= :endDate
            AND tc.subBudget.id = :budgetId
            AND tc.isactive = true
            GROUP BY c.name
            """;

            Long subBudgetId = budgetSchedule.getSubBudgetId();
            List<Object[]> results = entityManager.createQuery(monthlyBudgetQuery, Object[].class)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("budgetId", subBudgetId)
                    .getResultList();

            DateRange monthRange = new DateRange(startDate, endDate);
            return results.stream()
                    .map(row -> {
                        String categoryName = (String) row[0];
                        BigDecimal budgeted = BigDecimal.valueOf((Double) row[1]);
                        BigDecimal actual = BigDecimal.valueOf((Double) row[2]);

                        return new BudgetPeriodCategory(
                                categoryName,
                                budgeted,
                                actual,
                                monthRange,
                                determineCategoryStatus(budgeted, actual)
                        );
                    })
                    .collect(Collectors.toList());

        }catch(DateRangeException e){
            log.error("There was an error with the month range: ", e);
            throw e;
        }
    }

    private BigDecimal calculateRemainingBudget(BigDecimal budgeted, BigDecimal actual) {
        return budgeted.subtract(actual).max(BigDecimal.ZERO);
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
