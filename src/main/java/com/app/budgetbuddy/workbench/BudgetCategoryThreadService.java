package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.budget.DailyBudgetCategoryBuilderService;
import com.app.budgetbuddy.workbench.budget.MonthlyBudgetCategoryBuilderService;
import com.app.budgetbuddy.workbench.budget.WeeklyBudgetCategoryBuilderService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;

@Service
@Slf4j
@Async
public class BudgetCategoryThreadService
{
    private final DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService;
    private final MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService;
    private final WeeklyBudgetCategoryBuilderService weeklyBudgetCategoryBuilderService;
    private final BudgetCategoryService budgetCategoryService;
    private final ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public BudgetCategoryThreadService(DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService,
                                       MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService,
                                       WeeklyBudgetCategoryBuilderService weeklyBudgetCategoryBuilderService,
                                       BudgetCategoryService budgetCategoryService,
                                       @Qualifier("taskScheduler1") ThreadPoolTaskScheduler threadPoolTaskScheduler) {
        this.dailyBudgetCategoryBuilderService = dailyBudgetCategoryBuilderService;
        this.monthlyBudgetCategoryBuilderService = monthlyBudgetCategoryBuilderService;
        this.weeklyBudgetCategoryBuilderService = weeklyBudgetCategoryBuilderService;
        this.budgetCategoryService = budgetCategoryService;
        this.threadPoolTaskScheduler = threadPoolTaskScheduler;
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> fetchExistingBudgetCategoriesByDateRange(final LocalDate startDate, final LocalDate endDate, final Long subBudgetId)
    {
        try
        {
            log.info("SubBudgetId: {}", subBudgetId);
            List<BudgetCategory> budgetCategories = budgetCategoryService.getBudgetCategoryListByBudgetIdAndDateRange(subBudgetId, startDate, endDate);
            log.info("Existing budget categories: {}", budgetCategories);
            return CompletableFuture.completedFuture(budgetCategories);
        }catch(CompletionException e){
            log.error("There was an error retrieving the existing budget categories for week start {} to week end {}: {}", startDate, endDate, e.getMessage());
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> fetchExistingBudgetCategoriesForMonth(final SubBudget subBudget)
    {
        try
        {
            Long subBudgetId = subBudget.getId();
            LocalDate startDate = subBudget.getStartDate();
            LocalDate endDate = subBudget.getEndDate();
            List<BudgetCategory> budgetCategories = budgetCategoryService.getBudgetCategoryListByBudgetIdAndDateRange(subBudgetId, startDate, endDate);
            return CompletableFuture.completedFuture(budgetCategories);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the existing budget categories for month {}", subBudget, e);
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> createAsyncBudgetCategoriesByMonth(final SubBudget subBudget, final SubBudgetGoals subBudgetGoals, final List<TransactionsByCategory> categoryTransactions)
    {
        try
        {
            if(subBudget == null || categoryTransactions == null)
            {
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            log.info("SubBudgetGoals: {}", subBudgetGoals);
            BudgetSchedule monthBudgetSchedule = subBudget.getBudgetSchedule().get(0);
            log.info("Budget Schedule: {}", monthBudgetSchedule);
            List<BudgetScheduleRange> budgetScheduleRanges = monthBudgetSchedule.getBudgetScheduleRanges();
            List<MonthlyCategorySpending> monthlyCategorySpending = monthlyBudgetCategoryBuilderService.getCategorySpending(categoryTransactions, budgetScheduleRanges);
            List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, monthlyCategorySpending, subBudgetGoals);
            List<BudgetCategory> monthlyBudgetCategories = monthlyBudgetCategoryBuilderService.buildBudgetCategoryList(monthlyBudgetCategoryCriteria);
            saveAsyncBudgetCategories(monthlyBudgetCategories);
            log.info("Successfully built monthly budget categories.");
            monthlyBudgetCategories.forEach((monthlyBudgetCategory) -> {
                log.info("Budget Category: {}", monthlyBudgetCategory);
            });
            return CompletableFuture.completedFuture(monthlyBudgetCategories);
        } catch (CompletionException e) {
            log.error("There was an error creating the budget categories for month: {}", subBudget, e.getCause());
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> createAsyncBudgetCategoriesByWeek(final BudgetScheduleRange budgetScheduleRange, final SubBudget subBudget, final List<TransactionsByCategory> categoryTransactions)
    {
        if(budgetScheduleRange == null || subBudget == null || categoryTransactions == null)
        {
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
        LocalDate weekStart = budgetScheduleRange.getStartRange();
        LocalDate weekEnd = budgetScheduleRange.getEndRange();
        Long subBudgetId = subBudget.getId();
        try
        {
            List<BudgetCategory> existingBudgetCategories = budgetCategoryService.getBudgetCategoryListByBudgetIdAndDateRange(subBudgetId, weekStart, weekEnd);
            Set<String> existingCategoryNames = existingBudgetCategories.stream()
                    .map(BudgetCategory::getCategoryName)
                    .collect(Collectors.toSet());
            List<TransactionsByCategory> newTransactionsByCategory = categoryTransactions.stream()
                    .filter(t -> !existingCategoryNames.contains(t.getCategoryName()))
                    .toList();
            if(newTransactionsByCategory.isEmpty())
            {
                log.info("All Budget Categories already exist for SubBudgetId {} from {} to {} ", subBudgetId, weekStart, weekEnd);
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            List<WeeklyCategorySpending> weeklyCategorySpending = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd,  categoryTransactions);
            List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = weeklyBudgetCategoryBuilderService.createWeeklyBudgetCategoryCriteria(subBudget, weeklyCategorySpending);
            List<BudgetCategory> newBudgetCategories = weeklyBudgetCategoryBuilderService.buildBudgetCategoryList(weeklyBudgetCategoryCriteriaList);

            return saveAsyncBudgetCategories(newBudgetCategories);
        }catch(CompletionException e){
            log.error("There was an error creating budget categories for the budget schedule range: {}", budgetScheduleRange, e);
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> updateAsyncBudgetCategoriesByWeek(final BudgetScheduleRange budgetScheduleRange, final SubBudget subBudget, final List<TransactionsByCategory> categoryTransactions, final List<BudgetCategory> existingBudgetCategories)
    {
        if(budgetScheduleRange == null || categoryTransactions == null || existingBudgetCategories == null)
        {
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
        LocalDate budgetScheduleWeekStart = budgetScheduleRange.getStartRange();
        LocalDate budgetScheduleWeekEnd = budgetScheduleRange.getEndRange();
        try
        {
            List<WeeklyCategorySpending> weeklyCategorySpendingList = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(budgetScheduleWeekStart, budgetScheduleWeekEnd, categoryTransactions);
            List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = weeklyBudgetCategoryBuilderService.createWeeklyBudgetCategoryCriteria(subBudget, weeklyCategorySpendingList);
            List<BudgetCategory> updatedBudgetCategories = weeklyBudgetCategoryBuilderService.updateBudgetCategories(existingBudgetCategories, weeklyBudgetCategoryCriteriaList);
            log.info("Updated Budget Categories: {}", updatedBudgetCategories);
            return saveAsyncBudgetCategories(updatedBudgetCategories);

        }catch(CompletionException e){
            log.error("There was an error updating the budget categories for the week {} to {}", budgetScheduleWeekStart, budgetScheduleWeekEnd, e);
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
     }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> updateAsyncBudgetCategoriesByMonth(final SubBudget subBudget, final List<TransactionsByCategory> categoryTransactions, final List<BudgetCategory> existingBudgetCategories)
    {
        try
        {
            if(subBudget == null || categoryTransactions == null)
            {
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
            SubBudgetGoals subBudgetGoals = subBudget.getSubBudgetGoals();
            List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
            List<MonthlyCategorySpending> monthlyCategorySpending = monthlyBudgetCategoryBuilderService.getCategorySpending(categoryTransactions, budgetScheduleRanges);
            List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, monthlyCategorySpending, subBudgetGoals);
            List<BudgetCategory> updatedBudgetCategories = monthlyBudgetCategoryBuilderService.updateBudgetCategories(monthlyBudgetCategoryCriteria, existingBudgetCategories);
            if (updatedBudgetCategories.isEmpty()) {
                log.warn("No Budget categories have been updated for the month: {}", subBudget);
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            return CompletableFuture.completedFuture(updatedBudgetCategories);
        } catch (CompletionException e) {
            log.error("There was an error updating the budget categories for month: {}", subBudget, e.getCause());
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> saveAsyncBudgetCategories(final List<BudgetCategory> budgetCategories) {
        try
        {
            if (budgetCategories == null || budgetCategories.isEmpty())
            {
                log.info("Budget Categories list is empty....");
                return CompletableFuture.completedFuture(Collections.emptyList());
            } else {
                log.info("Budget Categories list: {}", budgetCategories);
                return CompletableFuture.completedFuture(budgetCategoryService.saveAll(budgetCategories));
            }
        } catch (CompletionException e) {
            log.error("There was an error saving the budget categories to the server: ", e);
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    private CompletableFuture<Boolean> validateBudgetCategoriesExist(final List<BudgetCategory> budgetCategories)
    {
        try
        {
            return CompletableFuture.completedFuture(true);
        }catch(CompletionException e){
            log.error("There was an error validating the budget categories to the server: ", e);
            return CompletableFuture.completedFuture(false);
        }
    }

    public CompletableFuture<List<BudgetCategory>> createAsyncBudgetCategoriesByCurrentDate(final LocalDate currentDate, final SubBudget subBudget, final List<TransactionsByCategory> categoryTransactions)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                if(categoryTransactions.isEmpty())
                {
                    return Collections.emptyList();
                }
                BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
                BudgetScheduleRange budgetWeekWithDate = budgetSchedule.getBudgetScheduleRangeByDate(currentDate);
                List<DailyCategorySpending> categorySpendingForDate = dailyBudgetCategoryBuilderService.getCategorySpendingByDate(currentDate, categoryTransactions);
                DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = dailyBudgetCategoryBuilderService.createDailyBudgetCriteria(subBudget, budgetWeekWithDate, currentDate, categorySpendingForDate);
                List<BudgetCategory> dailyBudgetCategories = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(dailyBudgetCategoryCriteria);
                if(dailyBudgetCategories.isEmpty())
                {
                    log.warn("No budget categories have been created for the current date: {}", currentDate);
                    return Collections.emptyList();
                }
                return dailyBudgetCategories;
            }catch(CompletionException e){
                log.error("There was an error creating the budget categories for date: {}", currentDate);
                return Collections.emptyList();
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<BudgetCategory>> updateAsyncBudgetCategoriesByCurrentDate(final List<BudgetCategory> existingBudgetCategories, final LocalDate currentDate, final SubBudget subBudget, final List<TransactionsByCategory> transactionsByCategoryList)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                if(currentDate == null || subBudget == null || transactionsByCategoryList == null)
                {
                    return Collections.emptyList();
                }
                BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
                BudgetScheduleRange budgetWeekWithDate = budgetSchedule.getBudgetScheduleRangeByDate(currentDate);
                List<DailyCategorySpending> dailyCategorySpending = dailyBudgetCategoryBuilderService.getCategorySpendingByDate(currentDate, transactionsByCategoryList);
                DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = dailyBudgetCategoryBuilderService.createDailyBudgetCriteria(subBudget, budgetWeekWithDate, currentDate, dailyCategorySpending);
                List<BudgetCategory> updatedBudgetCategories = dailyBudgetCategoryBuilderService.updateBudgetCategoriesByDate(dailyBudgetCategoryCriteria, existingBudgetCategories);
                if (updatedBudgetCategories.isEmpty()) {
                    log.warn("No budget categories have been updated for the current date: {}", currentDate);
                    return Collections.emptyList();
                }
                return updatedBudgetCategories;
            }catch(CompletionException e){
                log.error("There was an error updating the budget categories for date: {}", currentDate);
                return Collections.emptyList();
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

}
