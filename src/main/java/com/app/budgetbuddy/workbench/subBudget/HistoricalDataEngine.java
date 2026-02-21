package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.HistoricalMonthStats;
import com.app.budgetbuddy.domain.MonthHistory;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class HistoricalDataEngine
{
    private final CSVTransactionService csvTransactionService;
    private final TransactionService transactionService;
    private final BudgetCategoryService budgetCategoryService;

    @Autowired
    public HistoricalDataEngine(CSVTransactionService csvTransactionService,
                                TransactionService transactionService,
                                BudgetCategoryService budgetCategoryService)
    {
        this.csvTransactionService = csvTransactionService;
        this.transactionService = transactionService;
        this.budgetCategoryService = budgetCategoryService;
    }

    public Map<String, HistoricalMonthStats> getHistoricalMonthStatsByCategory(final int numberOfMonths, final Long userId, final LocalDate startDate)
    {
        Map<String, HistoricalMonthStats> historicalMonthStatsByCategory = new HashMap<>();
        if(numberOfMonths == 0)
        {
            return historicalMonthStatsByCategory;
        }
        return null;
    }

    public Map<String, List<MonthHistory>> getHistoricalMonthHistoryByCategory(final int numberOfMonths, Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        return null;
    }

    //TODO: Replace this method with getHistoricalMonthDataByCategory
    public Map<DateRange, BigDecimal> getHistoricalWeeklyBudgetedAmounts(final int numberOfMonths, final Long userId, final LocalDate currentMonthStart, final LocalDate currentMonthEnd, final BigDecimal subBudgetAmount)
    {
//        Map<DateRange, BigDecimal> weeklyBudgetedAmounts = new HashMap<>();
//        if(numberOfMonths < 0 || userId == null || currentMonthStart == null || currentMonthEnd == null)
//        {
//            return weeklyBudgetedAmounts;
//        }
//        final LocalDate january1st = LocalDate.of(currentMonthStart.getYear(), 1, 1);
//        final LocalDate january31st = LocalDate.of(currentMonthEnd.getYear(), 1, 31);
//        final LocalDate january14 = LocalDate.of(currentMonthStart.getYear(), 1, 14);
//        if(numberOfMonths == 0 && currentMonthStart.isEqual(january1st) && currentMonthEnd.isEqual(january31st))
//        {
//            DateRange currentMonth = DateRange.createDateRange(currentMonthStart, currentMonthEnd);
//            List<DateRange> weeksInMonth = currentMonth.splitIntoWeeks();
//            int numOfWeeks = weeksInMonth.size();
//            BigDecimal estimatedWeeklyBudget = subBudgetAmount.divide(BigDecimal.valueOf(numOfWeeks), RoundingMode.CEILING);
//            BigDecimal januaryRentFirst = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, january1st, january14, "Rent"));
//            for(DateRange week : weeksInMonth)
//            {
//                LocalDate weekStart = week.getStartDate();
//                LocalDate weekEnd = week.getEndDate();
//                boolean isEarlyJanuaryWeek = !weekStart.isAfter(january14) && !weekEnd.isBefore(january1st);
//                if(isEarlyJanuaryWeek)
//                {
//                    // Account for rent/mortgage
//                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(januaryRentFirst);
//                    log.info("Week {} estimated weekly budget after rent: {}", week, estimatedWeeklyBudget);
//                }
//                weeklyBudgetedAmounts.put(week, estimatedWeeklyBudget);
//            }
//            return weeklyBudgetedAmounts;
//        }
//        for(int i = 0; i < numberOfMonths; i++)
//        {
//            LocalDate previousMonthStart = currentMonthStart.minusMonths(i);
//            LocalDate previousMonthEnd = currentMonthEnd.plusMonths(i);
//            DateRange month = new DateRange(previousMonthStart, previousMonthEnd);
//            List<DateRange> weeksInMonth = month.splitIntoWeeks();
//            int numberOfWeeksInMonth = weeksInMonth.size();
//            BigDecimal estimatedWeeklyBudget = subBudgetAmount.divide(BigDecimal.valueOf(numberOfWeeksInMonth), RoundingMode.CEILING);
//            //TODO: Add test cases for when there is no transaction spending for past months
//            for(DateRange week : weeksInMonth)
//            {
//                LocalDate weekStart = week.getStartDate();
//                LocalDate weekEnd = week.getEndDate();
//                // if its the first week, check if there are any rent, insurance, mortgage, subscription, payments, etc...
//                CategoryDateInfo categoryDateInfo = new CategoryDateInfo(userId, weekStart, weekEnd);
//                budgetCategoryQueries.initializeCategoryDateInfo(categoryDateInfo);
//                boolean hasSubscriptions = budgetCategoryQueries.userHasSubscriptions();
//                boolean hasRent = budgetCategoryQueries.userHasRent();
//                boolean hasPayments = budgetCategoryQueries.userHasPayments();
//                if(hasRent)
//                {
//                    BigDecimal rentAmount = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, weekStart, weekEnd, "Rent"));
//                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(rentAmount);
//                }
//                else if(hasSubscriptions)
//                {
//                    BigDecimal subscriptionAmount = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, weekStart, weekEnd, "Subscription"));
//                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(subscriptionAmount);
//                }
//                else if(hasPayments)
//                {
//                    BigDecimal paymentsAmount = BigDecimal.valueOf(budgetCategoryQueries.getCategoryAmount(userId, weekStart, weekEnd, "Payments"));
//                    estimatedWeeklyBudget = estimatedWeeklyBudget.add(paymentsAmount);
//                }
//                log.info("Week {} estimated weekly budget: {}", week, estimatedWeeklyBudget);
//                weeklyBudgetedAmounts.put(week, estimatedWeeklyBudget);
//            }
//        }
//        return weeklyBudgetedAmounts;
        return null;
    }

    public Map<DateRange, BigDecimal> getTotalWeeklySpending(final int numberOfMonths, final Long userId, final LocalDate currentMonthStart, final LocalDate currentMonthEnd)
    {
//        final String totalSpendingForMonthsByWeekQuery = """
//            SELECT CASE
//                       WHEN abs(SUM(t.amount)) IS NULL
//                       THEN 0
//                       ELSE abs(SUM(t.amount))
//                   END as totalWeeklySpending
//            FROM TransactionsEntity t
//            INNER JOIN AccountEntity a ON t.account.id = a.id
//            WHERE a.user.id = :userId
//              AND t.posted BETWEEN :weekStart AND :weekEnd
//            """;
//        Map<DateRange, BigDecimal> totalWeeklySpending = new HashMap<>();
//        //TODO: Add test cases for when there is no transaction spending for past months
//        try
//        {
//            for(int i = 0; i < numberOfMonths; i++)
//            {
//                LocalDate previousMonthStart = currentMonthStart.minusMonths(i);
//                LocalDate previousMonthEnd = currentMonthEnd.minusMonths(i);
//                DateRange monthRange = DateRange.createDateRange(previousMonthStart, previousMonthEnd);
//                List<DateRange> weeksInMonths = monthRange.splitIntoWeeks();
//                for(DateRange week : weeksInMonths)
//                {
//                    LocalDate weekStart = week.getStartDate();
//                    LocalDate weekEnd = week.getEndDate();
//                    BigDecimal spendingForWeek = entityManager.createQuery(totalSpendingForMonthsByWeekQuery, BigDecimal.class)
//                            .setParameter("userId", userId)
//                            .setParameter("weekStart", weekStart)
//                            .setParameter("weekEnd", weekEnd)
//                            .getSingleResult();
//                    totalWeeklySpending.put(week, spendingForWeek);
//                }
//            }
//            return totalWeeklySpending;
//        }catch(DataAccessException e){
//            log.error("There was an error fetching the historical spending for {} months: {}", numberOfMonths, e.getMessage());
//            return Collections.emptyMap();
//        }
        return null;
    }

}
