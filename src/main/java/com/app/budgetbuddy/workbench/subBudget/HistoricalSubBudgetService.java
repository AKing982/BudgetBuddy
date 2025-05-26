package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.CategoryDateInfo;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryQueries;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class HistoricalSubBudgetService
{
    @PersistenceContext
    private final EntityManager entityManager;
    private final BudgetCategoryQueries budgetCategoryQueries;

    @Autowired
    public HistoricalSubBudgetService(EntityManager entityManager,
                                      BudgetCategoryQueries budgetCategoryQueries)
    {
        this.entityManager = entityManager;
        this.budgetCategoryQueries = budgetCategoryQueries;
    }

    public Map<DateRange, BigDecimal> getWeeklyBudgetedAmounts(final int numberOfMonths, final Long userId, final LocalDate currentMonthStart, final LocalDate currentMonthEnd, final BigDecimal subBudgetAmount)
    {
        Map<DateRange, BigDecimal> weeklyBudgetedAmounts = new HashMap<>();
        if(numberOfMonths <= 0 || userId == null || currentMonthStart == null || currentMonthEnd == null)
        {
            return weeklyBudgetedAmounts;
        }
        for(int i = 0; i < numberOfMonths; i++)
        {
            LocalDate previousMonthStart = currentMonthStart.minusMonths(i);
            LocalDate previousMonthEnd = currentMonthEnd.plusMonths(i);
            DateRange month = new DateRange(previousMonthStart, previousMonthEnd);
            List<DateRange> weeksInMonth = month.splitIntoWeeks();
            int numberOfWeeksInMonth = weeksInMonth.size();
            BigDecimal estimatedWeeklyBudget = subBudgetAmount.divide(BigDecimal.valueOf(numberOfWeeksInMonth), RoundingMode.CEILING);
            //TODO: Add test cases for when there is no transaction spending for past months
            for(DateRange week : weeksInMonth)
            {
                LocalDate weekStart = week.getStartDate();
                LocalDate weekEnd = week.getEndDate();
                // if its the first week, check if there are any rent, insurance, mortgage, subscription, payments, etc...
                CategoryDateInfo categoryDateInfo = new CategoryDateInfo(userId, weekStart, weekEnd);
                budgetCategoryQueries.initializeCategoryDateInfo(categoryDateInfo);
                boolean hasSubscriptions = budgetCategoryQueries.userHasSubscriptions();
                boolean hasRent = budgetCategoryQueries.userHasRent();
                boolean hasPayments = budgetCategoryQueries.userHasPayments();
                if(hasRent)
                {
                    BigDecimal rentAmount = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, weekStart, weekEnd, "Rent"));
                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(rentAmount);
                }
                else if(hasSubscriptions)
                {
                    BigDecimal subscriptionAmount = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, weekStart, weekEnd, "Subscription"));
                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(subscriptionAmount);
                }
                else if(hasPayments)
                {
                    BigDecimal paymentsAmount = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, weekStart, weekEnd, "Payments"));
                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(paymentsAmount);
                }
                weeklyBudgetedAmounts.put(week, estimatedWeeklyBudget);
            }
        }
        return weeklyBudgetedAmounts;
    }

    public Map<DateRange, BigDecimal> getTotalWeeklySpending(final int numberOfMonths, final Long userId, final LocalDate currentMonthStart, final LocalDate currentMonthEnd)
    {
        final String totalSpendingForMonthsByWeekQuery = """
            SELECT CASE
                       WHEN abs(SUM(t.amount)) IS NULL
                       THEN 0
                       ELSE abs(SUM(t.amount))
                   END as totalWeeklySpending
            FROM TransactionsEntity t
            INNER JOIN AccountEntity a ON t.account.id = a.id
            WHERE a.user.id = :userId
              AND t.posted BETWEEN :weekStart AND :weekEnd
            """;
        Map<DateRange, BigDecimal> totalWeeklySpending = new HashMap<>();
        //TODO: Add test cases for when there is no transaction spending for past months
        try
        {
            for(int i = 0; i < numberOfMonths; i++)
            {
                LocalDate previousMonthStart = currentMonthStart.minusMonths(i);
                LocalDate previousMonthEnd = currentMonthEnd.minusMonths(i);
                DateRange monthRange = DateRange.createDateRange(previousMonthStart, previousMonthEnd);
                List<DateRange> weeksInMonths = monthRange.splitIntoWeeks();
                for(DateRange week : weeksInMonths)
                {
                    LocalDate weekStart = week.getStartDate();
                    LocalDate weekEnd = week.getEndDate();
                    BigDecimal spendingForWeek = entityManager.createQuery(totalSpendingForMonthsByWeekQuery, BigDecimal.class)
                            .setParameter("userId", userId)
                            .setParameter("weekStart", weekStart)
                            .setParameter("weekEnd", weekEnd)
                            .getSingleResult();
                    totalWeeklySpending.put(week, spendingForWeek);
                }
            }
            return totalWeeklySpending;
        }catch(DataAccessException e){
            log.error("There was an error fetching the historical spending for {} months: {}", numberOfMonths, e.getMessage());
            return Collections.emptyMap();
        }
    }

    public BigDecimal getMonthlySpendingByCategory(final int numberOfMonths, final Long userId, final LocalDate startDate, final LocalDate endDate, final String category)
    {
        final String totalSpendingForMonthCategoryQuery = """
            SELECT CASE
                       WHEN abs(SUM(t.amount)) IS NULL
                       THEN 0
                       ELSE abs(SUM(t.amount))
                   END as totalCategorySpending
            FROM TransactionsEntity t
            INNER JOIN TransactionCategoryEntity tc ON t.id = tc.transaction.id
            INNER JOIN AccountEntity a ON t.account.id = a.id
            WHERE a.user.id = :userId
              AND t.posted BETWEEN :startDate AND :endDate
              AND t.posted >= :monthsBackDate
              AND tc.matchedCategory = :category
            """;
        try
        {
            BigDecimal totalSpendingForMonths = BigDecimal.ZERO;
            for(int i = 0; i < numberOfMonths; i++)
            {
                LocalDate previousMonthStart = startDate.minusMonths(i);
                LocalDate previousMonthEnd = endDate.minusMonths(i);
                BigDecimal totalMonthSpendingByCategory = entityManager.createQuery(totalSpendingForMonthCategoryQuery, BigDecimal.class)
                        .setParameter("userId", userId)
                        .setParameter("startDate", previousMonthStart)
                        .setParameter("endDate", previousMonthEnd)
                        .setParameter("category", category)
                        .getSingleResult();
                totalSpendingForMonths = totalSpendingForMonths.add(totalMonthSpendingByCategory);
            }
            return totalSpendingForMonths;
        }catch(DataAccessException e){
            log.error("There was an error calculating the total spending for {} months by category {}: {}", numberOfMonths, category, e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    public Map<String, Map<DateRange, BigDecimal>> getMonthlySpendingByCategory(final int numberOfMonths, final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        final String spendingByCategoryQuery = """
            SELECT tc.matchedCategory, CASE
                       WHEN abs(SUM(t.amount)) IS NULL
                       THEN 0
                       ELSE abs(SUM(t.amount))
                   END as totalCategorySpending
            FROM TransactionsEntity t
            INNER JOIN TransactionCategoryEntity tc ON t.id = tc.transaction.id
            INNER JOIN AccountEntity a ON t.account.id = a.id
            WHERE a.user.id = :userId
              AND t.posted BETWEEN :startDate AND :endDate
            GROUP BY tc.matchedCategory
            ORDER BY tc.matchedCategory
            """;
        try
        {
            Map<String, Map<DateRange, BigDecimal>> categorySpendingByWeek = new HashMap<>();
            for(int i = 0; i < numberOfMonths; i++)
            {
                LocalDate previousMonthStart = startDate.minusMonths(i);
                LocalDate previousMonthEnd = endDate.minusMonths(i);
                List<Object[]> results = entityManager.createQuery(spendingByCategoryQuery, Object[].class)
                        .setParameter("userId", userId)
                        .setParameter("startDate", previousMonthStart)
                        .setParameter("endDate", previousMonthEnd)
                        .getResultList();
                DateRange dateRange = DateRange.createDateRange(previousMonthStart, previousMonthEnd);
                for(Object[] result : results)
                {
                    String category = (String) result[0];
                    BigDecimal amount = (BigDecimal) result[1];
                    categorySpendingByWeek.computeIfAbsent(category, k -> new HashMap<>()).put(dateRange, amount);
                }
            }
            return categorySpendingByWeek;
        }catch(DataAccessException e){
            log.error("There was an error retrieving the monthly spending by category: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

}
