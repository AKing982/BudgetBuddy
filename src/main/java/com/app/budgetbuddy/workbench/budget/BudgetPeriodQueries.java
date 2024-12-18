package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;

import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetPeriodQueries
{
    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public BudgetPeriodQueries(EntityManager entityManager){
        this.entityManager = entityManager;
    }

    private void validateDailyBudget(final LocalDate date, final Budget monthlyBudget)
    {
        try
        {
            if(date == null){
                throw new IllegalDateException("INVALID DATE ENTERED: " + date);
            }
            if(monthlyBudget == null){
                throw new IllegalArgumentException("Monthly Budget is null");
            }

        }catch(IllegalDateException e){
            log.error("There was an error with the budget date: ", e);
            throw e;
        }catch(IllegalArgumentException e){
            log.error("There was an error with the budget data: ", e);
            throw e;
        }
    }

    public List<BudgetPeriodCategory> getDailyBudgetPeriodQuery(LocalDate date, Budget monthlyBudget)
    {
        validateDailyBudget(date, monthlyBudget);
        final String dailyBudgetQuery = """
        SELECT DISTINCT tc.category.id,
               tc.category.name,
               tc.budgetedAmount,
               COALESCE(daily_trans.total, 0) as actualSpent,
               tc.budgetedAmount - COALESCE(daily_trans.total, 0) as remainingAmount
        FROM TransactionCategoryEntity tc
        JOIN tc.category c
        JOIN tc.budget b
        LEFT JOIN (
            SELECT t.category.id as catId, SUM(t.amount) as total
            FROM TransactionsEntity t
            WHERE t.posted =:date
            GROUP BY t.category.id
            UNION ALL
            SELECT rt.category.id as catId, SUM(rt.lastAmount) as total
            FROM RecurringTransactionEntity rt
            WHERE rt.firstDate <=:date
            AND rt.lastDate >=:date
            AND rt.active = true
            GROUP BY rt.category.id
        ) daily_trans ON tc.category.id = daily_trans.catId
        WHERE tc.startDate <= :date
        AND tc.endDate >= :date
        AND tc.budget.id = :budgetId
        AND tc.isactive = true
        """;

        try {
            List<Object[]> results = entityManager.createQuery(dailyBudgetQuery, Object[].class)
                    .setParameter("date", date)
                    .setParameter("budgetId", monthlyBudget.getId())
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

        } catch(Exception e) {
            log.error("Error getting daily budget data for date: {} and budget: {}",
                    date, monthlyBudget.getId(), e);
            return null;
        }
    }


    private BudgetPeriodCategory createBudgetPeriodParams(BigDecimal budgeted, BigDecimal actual, BigDecimal remaining, DateRange dateRange, boolean isOverBudget, BudgetStatus budgetStatus){
        return null;
    }

    public List<BudgetPeriodCategory> getWeeklyBudgetPeriodCategories(final List<DateRange> budgetWeeks, final Budget monthlyBudget)
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(budgetWeeks == null || budgetWeeks.isEmpty() || monthlyBudget == null){
            return budgetPeriodCategories;
        }

        try
        {
            if(budgetWeeks.size() > 5){
                throw new DateRangeException("Weekly budget period cannot exceed 5 weeks.");
            }
            final String weeklyBudgetQuery = """
                    SELECT DISTINCT tc.category.id,
                   tc.category.name,
                   tc.budgetedAmount,
                   tc.actual as actualSpent,
                   tc.budgetedAmount - tc.actual as remainingAmount
            FROM TransactionCategoryEntity tc
            JOIN tc.category c
            JOIN tc.budget b
            WHERE tc.startDate <= :endDate\s
            AND tc.endDate >= :startDate
            AND tc.budget.id = :budgetId
            AND tc.isactive = true
            """;

            for(DateRange weekRange : budgetWeeks)
            {
                List<Object[]> results = entityManager.createQuery(weeklyBudgetQuery, Object[].class)
                        .setParameter("startDate", weekRange.getStartDate())
                        .setParameter("endDate", weekRange.getEndDate())
                        .setParameter("budgetId", monthlyBudget.getId())
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
                                    weekRange,
                                    determineBudgetStatus(budgeted, actual)
                            );
                        })
                        .forEach(budgetPeriodCategories::add);
            }

            return budgetPeriodCategories;


        }catch(DateRangeException e){
            log.error("There was an error with the budget date: ", e);
            throw e;
        }
    }

    private BudgetStatus determineBudgetStatus(BigDecimal budgetAmount, BigDecimal spentOnBudget){
        if (budgetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BudgetStatus.GOOD;
        }

        BigDecimal spendingRatio = spentOnBudget.divide(budgetAmount, 2, RoundingMode.HALF_UP);

        if (spendingRatio.compareTo(BigDecimal.ONE) > 0) {
            return BudgetStatus.OVER_BUDGET;
        } else if (spendingRatio.compareTo(new BigDecimal("0.90")) >= 0) {
            return BudgetStatus.WARNING;
        } else {
            return BudgetStatus.GOOD;
        }
    }

    public List<BudgetPeriodCategory> getMonthlyBudgetPeriodCategories(final DateRange monthRange, final Budget monthlyBudget)
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(monthRange == null || monthlyBudget == null){
            return budgetPeriodCategories;
        }
        try
        {
            LocalDate monthStartDate = monthRange.getStartDate();
            LocalDate monthEndDate = monthRange.getEndDate();
            if(monthStartDate == null || monthEndDate == null){
                throw new DateRangeException("Monthly budget period cannot have null start date or end date.");
            }
            final String monthlyBudgetQuery = """
            SELECT DISTINCT tc.category.id,
                   tc.category.name,
                   tc.budgetedAmount,
                   tc.actual as actualSpent,
                   tc.budgetedAmount - tc.actual as remainingAmount
            FROM TransactionCategoryEntity tc
            JOIN tc.category c
            JOIN tc.budget b
            WHERE tc.startDate <= :endDate 
            AND tc.endDate >= :startDate
            AND tc.budget.id = :budgetId
            AND tc.isactive = true
            """;

            List<Object[]> results = entityManager.createQuery(monthlyBudgetQuery, Object[].class)
                    .setParameter("startDate", monthStartDate)
                    .setParameter("endDate", monthEndDate)
                    .setParameter("budgetId", monthlyBudget.getId())
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
                                monthRange,
                                determineBudgetStatus(budgeted, actual)
                        );
                    })
                    .collect(Collectors.toList());

        }catch(DateRangeException e){
            log.error("There was an error with the month range: ", e);
            throw e;
        }
    }

    public List<BudgetPeriodCategory> getBiWeeklyBudgetPeriodCategories(final List<DateRange> biWeeks, final Budget budget){
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(biWeeks == null || biWeeks.isEmpty() || budget == null) {
            return budgetPeriodCategories;
        }

        try {
            if(biWeeks.size() > 3) { // Max 3 bi-weekly periods in a month
                throw new DateRangeException("Bi-weekly budget periods cannot exceed 3 periods.");
            }

            final String biWeeklyQuery = """
           SELECT DISTINCT tc.category.id,
                  tc.category.name,
                  tc.budgetedAmount,
                  tc.actual as actualSpent,
                  tc.budgetedAmount - tc.actual as remainingAmount
           FROM TransactionCategoryEntity tc
           JOIN tc.category c
           JOIN tc.budget b
           WHERE tc.startDate <= :endDate 
           AND tc.endDate >= :startDate
           AND tc.budget.id = :budgetId
           AND tc.isactive = true
           """;

            for(DateRange biWeek : biWeeks) {
                if(biWeek.getStartDate() == null || biWeek.getEndDate() == null) {
                    throw new DateRangeException("Bi-weekly period cannot have null start date or end date.");
                }

                List<Object[]> results = entityManager.createQuery(biWeeklyQuery, Object[].class)
                        .setParameter("startDate", biWeek.getStartDate())
                        .setParameter("endDate", biWeek.getEndDate())
                        .setParameter("budgetId", budget.getId())
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
                                    biWeek,
                                    determineBudgetStatus(budgeted, actual)
                            );
                        })
                        .forEach(budgetPeriodCategories::add);
            }

            return budgetPeriodCategories;

        } catch(DateRangeException e) {
            log.error("There was an error with the bi-weekly ranges: ", e);
            throw e;
        } catch(Exception e) {
            log.error("Error getting bi-weekly budget data for budget: {}", budget.getId(), e);
            return Collections.emptyList();
        }
    }


}
