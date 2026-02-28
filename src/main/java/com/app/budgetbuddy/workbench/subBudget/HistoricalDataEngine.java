package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.HistoricalDataException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@Slf4j
public class HistoricalDataEngine
{
    private final TransactionCategoryQueries transactionCategoryQueries;
    private final CSVTransactionsByCategoryQueries csvTransactionsByCategoryQueries;
    private final BudgetCategoryService budgetCategoryService;

    @Autowired
    public HistoricalDataEngine(TransactionCategoryQueries transactionCategoryQueries,
                                CSVTransactionsByCategoryQueries csvTransactionsByCategoryQueries,
                                BudgetCategoryService budgetCategoryService)
    {
        this.transactionCategoryQueries = transactionCategoryQueries;
        this.budgetCategoryService = budgetCategoryService;
        this.csvTransactionsByCategoryQueries = csvTransactionsByCategoryQueries;
    }

    public HistoricalTransactionsByCategories getHistoricalTransactionCategories(final Long userId, final LocalDate startDate)
    {
        final int MIN_MONTHS = 4;
        final int MAX_MONTHS = 12;
        int monthsWithData = 0;
        Map<String, BigDecimal> aggregated = new HashMap<>();
        for(int i = 0; i < MAX_MONTHS; i++)
        {
            LocalDate monthStart = startDate.minusMonths(i + 1).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            List<CSVTransactionsByCategory> csvTransactionsByCategories =
                    csvTransactionsByCategoryQueries.getCSVTransactionsByCategories(userId, monthStart, monthEnd);
            if(!csvTransactionsByCategories.isEmpty())
            {
                monthsWithData++;
                for(CSVTransactionsByCategory csvTransactionsByCategory : csvTransactionsByCategories)
                {
                    String category = csvTransactionsByCategory.getCategory();
                    BigDecimal categorySpending = csvTransactionsByCategory.getTotalCategorySpending();
                    aggregated.merge(category, categorySpending, BigDecimal::add);
                }
            }
            if(i >= MIN_MONTHS && monthsWithData == 0)
            {
                break;
            }

        }
        log.info("Found {} months of transaction data scanning back from {}", monthsWithData, startDate);
        final int actualMonths = Math.max(1, monthsWithData);
        List<TransactionsByCategory> transactions = aggregated.entrySet().stream()
                .map(e -> {
                    TransactionsByCategory t = new TransactionsByCategory();
                    t.setCategoryName(e.getKey());
                    t.setTotalCategorySpending(e.getValue());
                    return t;
                })
                .toList();
        return new HistoricalTransactionsByCategories(transactions, actualMonths);
    }

    public Map<String, HistoricalMonthStats> getHistoricalMonthStatsByCategory(final int numberOfMonths, final Long userId, final LocalDate startDate)
    {
        Map<String, HistoricalMonthStats> historicalMonthStatsByCategory = new HashMap<>();
        if(numberOfMonths == 0)
        {
            return historicalMonthStatsByCategory;
        }
        if(numberOfMonths < 0)
        {
            throw new HistoricalDataException("Number of months cannot be negative");
        }
        Map<String, Map<YearMonth, Double>> monthlySavingsByCategory = new HashMap<>();
        for(int i = 0; i < numberOfMonths; i++)
        {
            LocalDate monthStart = startDate.minusMonths(i + 1).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            List<Object[]> monthResult = budgetCategoryService.getHistoricalMonthStatsByCategory(userId, monthStart, monthEnd);
            for(Object[] row : monthResult)
            {
                String category = (String) row[0];
                validateCategoryKey(category);
                String monthStr = (String) row[1];
                if(monthStr == null || monthStr.isEmpty())
                {
                    throw new HistoricalDataException("Month cannot be null");
                }
                YearMonth month = YearMonth.parse((String) row[1]);
                double totalSaved = ((Number) row[2]).doubleValue();
                monthlySavingsByCategory.computeIfAbsent(category, k -> new HashMap<>()).put(month, totalSaved);
            }
        }

        for(Map.Entry<String, Map<YearMonth, Double>> entry : monthlySavingsByCategory.entrySet())
        {
            String category = entry.getKey();
            Map<YearMonth, Double> monthData = entry.getValue();
            YearMonth bestMonth = null;
            YearMonth worstMonth = null;
            double bestSaved = Double.NEGATIVE_INFINITY, worstSaved = Double.POSITIVE_INFINITY;
            for(Map.Entry<YearMonth, Double> monthEntry : monthData.entrySet())
            {
                if(monthEntry.getValue() > bestSaved)
                {
                    bestSaved = monthEntry.getValue();
                    bestMonth = monthEntry.getKey();
                }
                if(monthEntry.getValue() < worstSaved)
                {
                    worstSaved = monthEntry.getValue();
                    worstMonth = monthEntry.getKey();
                }
            }
            historicalMonthStatsByCategory.put(category, new HistoricalMonthStats(worstMonth, bestMonth, bestSaved, worstSaved));
        }
        return historicalMonthStatsByCategory;
    }

    public Map<String, List<MonthHistory>> getHistoricalMonthHistoryByCategory(final int numberOfMonths, Long userId, final LocalDate startDate)
    {
        Map<String, List<MonthHistory>> historicalMonthHistoryByCategory = new HashMap<>();
        if(numberOfMonths == 0)
        {
            return historicalMonthHistoryByCategory;
        }
        if(numberOfMonths < 0)
        {
            throw new HistoricalDataException("Number of months cannot be negative");
        }
        for(int i = 0; i < numberOfMonths; i++)
        {
            LocalDate monthStart = startDate.minusMonths(i + 1).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            List<Object[]> monthResult = budgetCategoryService.getHistoricalMonthHistoryByCategory(userId, monthStart, monthEnd);
            for(Object[] row : monthResult)
            {
                String category = (String) row[0];
                validateCategoryKey(category);
                String monthStr = (String) row[1];
                validateMonth(monthStr);
                YearMonth month = YearMonth.parse(monthStr);
                double totalSaved = (Double) row[2];
                double totalSpent = (Double) row[3];
                double totalBudgeted = (Double) row[4];
                double percentSaved = (Double) row[5];
                double averageSaved = (Double) row[6];
                double averageSpent = (Double) row[7];
                MonthHistory monthHistory = new MonthHistory(month, totalSaved, totalSpent, percentSaved, totalBudgeted, averageSaved, averageSpent);
                historicalMonthHistoryByCategory.computeIfAbsent(category, k -> new ArrayList<>()).add(monthHistory);
            }
        }
        return historicalMonthHistoryByCategory;
    }

    private void validateMonth(String month)
    {
        if(month == null)
        {
            throw new HistoricalDataException("Month cannot be null");
        }
    }

    private void validateCategoryKey(String category)
    {
        if(category == null || category.isEmpty())
        {
            throw new HistoricalDataException("Category Key cannot be null");
        }
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
