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
    private final BudgetScheduleService budgetScheduleService;
    private final BudgetScheduleRangeService budgetScheduleRangeService;

    private static final String budgetQuery =  """
    SELECT DISTINCT tc.category.id,
           tc.category.name,
           tc.budgetedAmount,
           COALESCE(tc.actual, 0) as actualSpent,
           tc.budgetedAmount - COALESCE(tc.actual, 0) as remainingAmount
    FROM TransactionCategoryEntity tc
    JOIN tc.category c
    JOIN tc.%s b
    WHERE tc.startDate <= :endDate
    AND tc.endDate >= :startDate
    AND tc.%s.id = :budgetId
    AND tc.isactive = true
    """;


    @Autowired
    public BudgetPeriodQueries(EntityManager entityManager,
                               BudgetPeriodCategoryService budgetPeriodCategoryService,
                               SubBudgetService subBudgetService,
                               BudgetScheduleService budgetScheduleService,
                               BudgetScheduleRangeService budgetScheduleRangeService)
    {
        this.entityManager = entityManager;
        this.budgetPeriodCategoryService = budgetPeriodCategoryService;
        this.subBudgetService = subBudgetService;
        this.budgetScheduleService = budgetScheduleService;
        this.budgetScheduleRangeService = budgetScheduleRangeService;
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

    private Optional<BudgetSchedule> getBudgetScheduleWithDate(final LocalDate date, final List<BudgetSchedule> budgetSchedules)
    {
        Optional<BudgetSchedule> optionalBudgetSchedule = Optional.empty();
        for(BudgetSchedule budgetSchedule : budgetSchedules)
        {
            LocalDate budgetStartDate = budgetSchedule.getStartDate();
            LocalDate budgetEndDate = budgetSchedule.getEndDate();
            if(date.isAfter(budgetStartDate) && date.isBefore(budgetEndDate))
            {
                optionalBudgetSchedule = Optional.of(budgetSchedule);
                break;
            }
        }
        return optionalBudgetSchedule;
    }

    private class BudgetQueryResult
    {
        private final String categoryName;
        private final BigDecimal budgeted;
        private final BigDecimal actual;
        private final DateRange dateRange;

        public BudgetQueryResult(Object[] row, DateRange dateRange) {
            this.categoryName = (String) row[1];
            this.budgeted = BigDecimal.valueOf((Double) row[2]);
            this.actual = BigDecimal.valueOf((Double) row[3]);
            this.dateRange = dateRange;
        }

        public BudgetPeriodCategory toBudgetPeriodCategory()
        {
            return new BudgetPeriodCategory(
                    categoryName,
                    budgeted,
                    actual,
                    dateRange,
                    determineBudgetStatus(budgeted, actual)
            );
        }
    }

    private List<BudgetPeriodCategory> executeBudgetQuery(String query,
                                                          LocalDate startDate,
                                                          LocalDate endDate,
                                                          Long subBudgetId,
                                                          DateRange dateRange) {
        List<Object[]> results = entityManager.createQuery(query, Object[].class)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .setParameter("budgetId", subBudgetId)
                .getResultList();

        return results.stream()
                .map(row -> new BudgetQueryResult(row, dateRange).toBudgetPeriodCategory())
                .collect(Collectors.toList());
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

    public List<BudgetPeriodCategory> getWeeklyBudgetPeriodCategories(final Long userId, final LocalDate monthStart, final LocalDate monthEnd)
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(userId == null || userId <= 0)
        {
            return Collections.emptyList();
        }
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, monthStart, monthEnd);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("Sub budget not found for user {} and monthStart {} and monthEnd {}", userId, monthStart, monthEnd);
            return Collections.emptyList();
        }
        SubBudget subBudget = subBudgetOptional.get();
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        Long subBudgetId = subBudget.getId();
        try
        {
            if(budgetSchedules.size() == 1)
            {
                BudgetSchedule budgetSchedule = budgetSchedules.get(0);
                List<BudgetScheduleRange> budgetScheduleRanges = getBudgetSchedulesRanges(budgetSchedule);
                getBudgetPeriodCategoryResultList(budgetScheduleRanges, subBudgetId, budgetPeriodCategories);
                return budgetPeriodCategories;
            }
            else
            {
                for(BudgetSchedule budgetSchedule : budgetSchedules)
                {
                    List<BudgetScheduleRange> budgetScheduleRanges = getBudgetSchedulesRanges(budgetSchedule);
                    getBudgetPeriodCategoryResultList(budgetScheduleRanges, subBudgetId, budgetPeriodCategories);
                }
            }
            return budgetPeriodCategories;
        }catch(Exception e)
        {
            log.error("Error retrieving weekly budget period categories for user {} and period {} to {}: {}",
                    userId, monthStart, monthEnd, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private void getBudgetPeriodCategoryResultList(List<BudgetScheduleRange> budgetScheduleRanges, Long subBudgetId, List<BudgetPeriodCategory> budgetPeriodCategories)
    {
        for (BudgetScheduleRange budgetScheduleWeek : budgetScheduleRanges)
        {
            LocalDate budgetScheduleRangeWeekStart = budgetScheduleWeek.getStartRange();
            LocalDate budgetScheduleRangeWeekEnd = budgetScheduleWeek.getEndRange();
            DateRange weekRange = budgetScheduleWeek.getBudgetDateRange();
            List<BudgetPeriodCategory> budgetPeriodCategoryList = executeBudgetQuery(budgetQuery, budgetScheduleRangeWeekStart, budgetScheduleRangeWeekEnd, subBudgetId, weekRange);
            budgetPeriodCategories.addAll(budgetPeriodCategoryList);
        }
    }

    private List<BudgetScheduleRange> getBudgetSchedulesRanges(final BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        return budgetSchedule.getBudgetScheduleRanges();
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

    public List<BudgetPeriodCategory> getMonthlyBudgetPeriodCategories(final LocalDate monthStart, final LocalDate monthEnd, final Long userId)
    {
        try
        {
            Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, monthStart, monthEnd);
            if(subBudgetOptional.isEmpty())
            {
                log.warn("Sub budget not found for user {} and monthStart {} and monthEnd {}", userId, monthStart, monthEnd);
                return Collections.emptyList();
            }
            SubBudget subBudget = subBudgetOptional.get();
            DateRange monthRange = new DateRange(monthStart, monthEnd);
            return executeBudgetQuery(budgetQuery, monthStart, monthEnd, subBudget.getId(), monthRange);

        }catch(Exception e)
        {
            log.error("Error retrieving monthly budget period categories for user {} and period {} to {}: {}",
                    userId, monthStart, monthEnd, e.getMessage(), e);
            return Collections.emptyList();
        }
    }



    public List<BudgetPeriodCategory> getBiWeeklyBudgetPeriodCategories(final Long userId, final LocalDate monthStart, final LocalDate monthEnd)
    {
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        if(userId == null || userId <= 0)
        {
            return Collections.emptyList();
        }
        try
        {
            Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, monthStart, monthEnd);
            if(subBudgetOptional.isEmpty())
            {
                log.warn("Sub budget not found for user {} and monthStart {} and monthEnd {}", userId, monthStart, monthEnd);
                return Collections.emptyList();
            }
            SubBudget subBudget = subBudgetOptional.get();
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();


        }catch(Exception e)
        {
            log.error("Error retrieving bi-weekly budget period categories for user {} and period {} to {}: {}",
                    userId, monthStart, monthEnd, e.getMessage(), e);
            return Collections.emptyList();
        }

        return null;
    }


}
