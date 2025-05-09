package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.budget.DailyBudgetCategoryBuilderService;
import com.app.budgetbuddy.workbench.budget.MonthlyBudgetCategoryBuilderService;
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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

@Service
@Slf4j
@Async
public class BudgetCategoryThreadService
{
    private final DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService;
    private final MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService;
    private final BudgetCategoryService budgetCategoryService;
    private final ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public BudgetCategoryThreadService(DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService,
                                       MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService,
                                       BudgetCategoryService budgetCategoryService,
                                       @Qualifier("taskScheduler1") ThreadPoolTaskScheduler threadPoolTaskScheduler) {
        this.dailyBudgetCategoryBuilderService = dailyBudgetCategoryBuilderService;
        this.monthlyBudgetCategoryBuilderService = monthlyBudgetCategoryBuilderService;
        this.budgetCategoryService = budgetCategoryService;
        this.threadPoolTaskScheduler = threadPoolTaskScheduler;
    }

    public CompletableFuture<List<BudgetCategory>> fetchExistingBudgetCategoriesForMonth(final SubBudget subBudget)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                Long subBudgetId = subBudget.getId();
                LocalDate startDate = subBudget.getStartDate();
                LocalDate endDate = subBudget.getEndDate();
                return budgetCategoryService.getBudgetCategoryListByBudgetIdAndDateRange(subBudgetId, startDate, endDate);
            }catch(DataAccessException e){
                log.error("There was an error retrieving the existing budget categories for month {}", subBudget, e);
                return Collections.emptyList();
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<BudgetCategory>> createAsyncBudgetCategoriesByMonth(final SubBudget subBudget, final List<TransactionsByCategory> categoryTransactions)
    {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (subBudget == null || categoryTransactions == null) {
                    return Collections.emptyList();
                }
                SubBudgetGoals subBudgetGoals = subBudget.getSubBudgetGoals();
                BudgetSchedule monthBudgetSchedule = subBudget.getBudgetSchedule().get(0);
                List<BudgetScheduleRange> budgetScheduleRanges = monthBudgetSchedule.getBudgetScheduleRanges();
                List<MonthlyCategorySpending> monthlyCategorySpending = monthlyBudgetCategoryBuilderService.getCategorySpending(categoryTransactions, budgetScheduleRanges);
                List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, monthlyCategorySpending, subBudgetGoals);
                return monthlyBudgetCategoryBuilderService.buildBudgetCategoryList(monthlyBudgetCategoryCriteria);
            } catch (CompletionException e) {
                log.error("There was an error creating the budget categories for month: {}", subBudget, e.getCause());
                return Collections.emptyList();
            }
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<BudgetCategory>> updateAsyncBudgetCategoriesByMonth(final SubBudget subBudget, final List<TransactionsByCategory> categoryTransactions, final List<BudgetCategory> existingBudgetCategories)
    {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (subBudget == null || categoryTransactions == null) {
                    return Collections.emptyList();
                }
                BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
                SubBudgetGoals subBudgetGoals = subBudget.getSubBudgetGoals();
                List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
                List<MonthlyCategorySpending> monthlyCategorySpending = monthlyBudgetCategoryBuilderService.getCategorySpending(categoryTransactions, budgetScheduleRanges);
                List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, monthlyCategorySpending, subBudgetGoals);
                List<BudgetCategory> updatedBudgetCategories = monthlyBudgetCategoryBuilderService.updateBudgetCategories(monthlyBudgetCategoryCriteria, existingBudgetCategories);
                if (updatedBudgetCategories.isEmpty()) {
                    log.warn("No Budget categories have been updated for the month: {}", subBudget);
                    return Collections.emptyList();
                }
                return updatedBudgetCategories;
            } catch (CompletionException e) {
                log.error("There was an error updating the budget categories for month: {}", subBudget, e.getCause());
                return Collections.emptyList();
            }

        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<BudgetCategory>> saveAsyncBudgetCategories(final List<BudgetCategory> budgetCategories) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (budgetCategories == null || budgetCategories.isEmpty()) {
                    return Collections.emptyList();
                } else {
                    return budgetCategoryService.saveAll(budgetCategories);
                }
            } catch (CompletionException e) {
                log.error("There was an error saving the budget categories to the server: ", e);
                return Collections.emptyList();
            }

        }, threadPoolTaskScheduler.getScheduledExecutor());
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
