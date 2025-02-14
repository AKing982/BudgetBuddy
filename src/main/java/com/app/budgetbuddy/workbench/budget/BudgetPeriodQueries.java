package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;

import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.SubBudgetService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetPeriodQueries
{
    @PersistenceContext
    private final EntityManager entityManager;
    private final BudgetPeriodCategoryService budgetPeriodCategoryService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public BudgetPeriodQueries(EntityManager entityManager,
                               BudgetPeriodCategoryService budgetPeriodCategoryService,
                               SubBudgetService subBudgetService)
    {
        this.entityManager = entityManager;
        this.budgetPeriodCategoryService = budgetPeriodCategoryService;
        this.subBudgetService = subBudgetService;
    }

    public List<BudgetPeriodCategory> getBudgetPeriodQueryData(Long userId, LocalDate startMonth, LocalDate endMonth, Period period)
    {
        if(userId <= 0 || startMonth == null || endMonth == null)
        {
            return Collections.emptyList();
        }
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startMonth, endMonth);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("No SubBudget was found for user {} and startMonth {} and endMonth {}", userId, startMonth, endMonth);
            return Collections.emptyList();
        }
        try
        {
            SubBudget subBudget = subBudgetOptional.get();
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            BudgetSchedule budgetSchedule = budgetSchedules.get(0);
            return budgetPeriodCategoryService.getBudgetPeriodCategoriesByPeriod(budgetSchedule, period);
        }catch(Exception e)
        {
            log.error("There was an error retrieving the budget period query data from the server: ", e);
            return Collections.emptyList();
        }
    }


    public List<BudgetPeriodCategory> getBudgetPeriodQueryForDate(final LocalDate date, final Long userId)
    {
        if(userId == null || userId <= 0)
        {
            log.warn("Found null or invalid user id");
            return Collections.emptyList();
        }
        LocalDate monthStart = date.withDayOfMonth(1);
        LocalDate monthEnd = date.withDayOfMonth(date.lengthOfMonth());
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, monthStart, monthEnd);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("Sub budget not found for user {} and date: {}", userId, date);
            return Collections.emptyList();
        }
        SubBudget subBudget = subBudgetOptional.get();
        Long subBudgetId = subBudget.getId();
        try
        {

            final String dateBudgetQuery = """
                    SELECT DISTINCT tc.category.id,
                   tc.category.name,
                   tc.budgetedAmount,
                   tc.actual as actualSpent,
                   tc.budgetedAmount - tc.actual as remainingAmount
            FROM TransactionCategoryEntity tc
            JOIN tc.category c
            JOIN tc.subBudget sb
            WHERE tc.startDate <= :date
           AND tc.endDate >= :date
            AND tc.subBudget.id = :budgetId
            AND tc.isactive = true""";
            List<Object[]> results = entityManager.createQuery(dateBudgetQuery, Object[].class)
                    .setParameter("date", date)
                    .setParameter("budgetId", subBudgetId)
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        String categoryName = (String) row[1];
                        BigDecimal budgeted = BigDecimal.valueOf((Double) row[2]);
                        BigDecimal actual = BigDecimal.valueOf((Double) row[3]);

                        return new BudgetPeriodCategory(
                                categoryName,
                                budgeted,
                                actual,
                                new DateRange(date, date),
                                BudgetStatus.GOOD
                        );
                    })
                    .collect(Collectors.toList());


        }catch(BudgetScheduleException e)
        {
            log.error("Error getting daily budget data for date: {} and budget: {}",
                    date,subBudget.getId(), e);
            return Collections.emptyList();
        }
    }
}
