package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.*;

import com.app.budgetbuddy.workbench.BudgetCategoryAsyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletionException;

@Service
@Slf4j
public class BudgetCategoryRunner
{
    private final BudgetCategoryAsyncService budgetCategoryAsyncService;
    private final TransactionsByCategoryLoaderService transactionsByCategoryService;
    private final SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    public BudgetCategoryRunner(BudgetCategoryAsyncService budgetCategoryAsyncService,
                                TransactionsByCategoryLoaderService transactionsByCategoryService,
                                SubBudgetGoalsService subBudgetGoalsService)
    {
        this.budgetCategoryAsyncService = budgetCategoryAsyncService;
        this.transactionsByCategoryService = transactionsByCategoryService;
        this.subBudgetGoalsService = subBudgetGoalsService;
    }

    public List<BudgetCategory> runBudgetCategoryProcessForMonth(final SubBudget subBudget)
    {
        try
        {
            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
            BudgetScheduleRange range = budgetSchedule.getBudgetScheduleRanges().get(0);
            List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForMonth(subBudget);
            log.info("TransactionsByCategory size: {}", merged.size());
            log.info("Starting async budget category creation for month");
            return budgetCategoryAsyncService.createAsync(subBudget, merged, range, Period.MONTHLY).join();
        }
        catch(CompletionException e)
        {
            log.error("Error running budget category process for month", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForBudgetScheduleRange(final BudgetScheduleRange budgetScheduleRange, final SubBudget subBudget, Long userId)
    {
        try
        {
            Long subBudgetId = subBudget.getId();
            List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForRange(budgetScheduleRange, subBudget);
            List<BudgetCategory> existing = budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(budgetScheduleRange.getStartRange(), budgetScheduleRange.getEndRange(), subBudgetId).join();
            log.info("Starting async budget category update for week");
            return budgetCategoryAsyncService.updateAsync(subBudget, merged, existing, budgetScheduleRange, Period.WEEKLY).join();
        }
        catch(CompletionException e)
        {
            log.error("Error updating budget categories for schedule range", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForMonth(final SubBudget subBudget)
    {
        try
        {
            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
            BudgetScheduleRange range = budgetSchedule.getBudgetScheduleRanges().get(0);

            List<BudgetCategory> existing = budgetCategoryAsyncService
                    .fetchExistingBudgetCategoriesByDateRange(
                            subBudget.getStartDate(), subBudget.getEndDate(), subBudget.getId())
                    .join();

            if(existing.isEmpty())
            {
                log.info("No existing budget categories for subBudget {}, creating", subBudget.getId());
                // Try processed transactions first, fall back to regular merge — but only ONE createAsync call
                List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeUpdatedForMonth(subBudget);
                if(merged.isEmpty())
                {
                    merged = transactionsByCategoryService.fetchAndMergeForMonth(subBudget);
                }
                if(merged.isEmpty())
                {
                    log.warn("No transactions found for subBudget {}, skipping", subBudget.getId());
                    return Collections.emptyList();
                }
                return budgetCategoryAsyncService.createAsync(subBudget, merged, range, Period.MONTHLY).join();
            }

            // Categories exist — update them
            List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForMonth(subBudget);
            return budgetCategoryAsyncService.updateAsync(subBudget, merged, existing, range, Period.MONTHLY).join();
        }
        catch(CompletionException e)
        {
            log.error("Error updating budget category list for month: {}", subBudget, e);
            return Collections.emptyList();
        }
    }
//    public List<BudgetCategory> runBudgetCategoryUpdateProcessForMonth(final SubBudget subBudget)
//    {
//        try
//        {
//            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
//            BudgetScheduleRange range = budgetSchedule.getBudgetScheduleRanges().get(0);
//            List<BudgetCategory> existing = budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(
//                    subBudget.getStartDate(), subBudget.getEndDate(), subBudget.getId()).join();
//
//            if(existing.isEmpty())
//            {
//                log.info("No existing budget categories found for subBudget {}, checking for processed transactions", subBudget.getId());
//                // Use processed transactions instead of new ones since status is already PROCESSED
//                List<TransactionsByCategory> mergedFromProcessed = transactionsByCategoryService.fetchAndMergeUpdatedForMonth(subBudget);
//                if(!mergedFromProcessed.isEmpty())
//                {
//                    log.info("Found processed transactions, creating budget categories from processed data");
//                    return budgetCategoryAsyncService.createAsync(subBudget, mergedFromProcessed, range, Period.MONTHLY).join();
//                }
//                // Fall back to regular merge if no processed transactions found
//                List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForMonth(subBudget);
//                return budgetCategoryAsyncService.createAsync(subBudget, merged, range, Period.MONTHLY).join();
//            }
//
//            List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForMonth(subBudget);
//            return budgetCategoryAsyncService.updateAsync(subBudget, merged, existing, range, Period.MONTHLY).join();
//        }
//        catch(CompletionException e)
//        {
//            log.error("Error updating budget category list for month: {}", subBudget, e);
//            return Collections.emptyList();
//        }
//    }

//    public List<BudgetCategory> runBudgetCategoryUpdateProcessForMonth(final SubBudget subBudget)
//    {
//        try
//        {
//            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
//            BudgetScheduleRange range = budgetSchedule.getBudgetScheduleRanges().get(0);
//            List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForMonth(subBudget);
//            List<BudgetCategory> existing = budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(
//                    subBudget.getStartDate(), subBudget.getEndDate(), subBudget.getId()).join();
//            if(existing.isEmpty())
//            {
//                budgetCategoryAsyncService.createAsync(subBudget, merged, range, Period.MONTHLY).join();
//            }
//            return budgetCategoryAsyncService.updateAsync(subBudget, merged, existing, range, Period.MONTHLY).join();
//        }
//        catch(CompletionException e)
//        {
//            log.error("Error updating budget category list for month: {}", subBudget, e);
//            return Collections.emptyList();
//        }
//    }

    public List<BudgetCategory> runBudgetCategoryCreateProcessForWeek(final SubBudget subBudget, final BudgetScheduleRange budgetScheduleRange)
    {
        try
        {
            List<TransactionsByCategory> merged = transactionsByCategoryService.fetchAndMergeForRange(budgetScheduleRange, subBudget);
            List<BudgetCategory> newBudgetCategories = budgetCategoryAsyncService.createAsync(subBudget, merged, budgetScheduleRange, Period.WEEKLY).join();
            log.info("New BudgetCategories for week {}: {}", budgetScheduleRange, newBudgetCategories);
            return newBudgetCategories;
        }
        catch(CompletionException e)
        {
            log.error("Error running budget category creation for week {} to {}", budgetScheduleRange.getStartRange(), budgetScheduleRange.getEndRange(), e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryProcessForDate(final LocalDate date, final SubBudget subBudget)
    {
        try
        {
            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
            BudgetScheduleRange range = budgetSchedule.getBudgetScheduleRangeByDate(date);
            List<TransactionsByCategory> transactions = transactionsByCategoryService.fetchByDate(subBudget, date);
            return budgetCategoryAsyncService.createAsync(subBudget, transactions, range, Period.DAILY).join();
        }
        catch(CompletionException e)
        {
            log.error("Error processing budget categories for date {}", date, e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForDate(final LocalDate date, final SubBudget subBudget)
    {
        try
        {
            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
            BudgetScheduleRange range = budgetSchedule.getBudgetScheduleRangeByDate(date);
            List<TransactionsByCategory> transactions = transactionsByCategoryService.fetchByDate(subBudget, date);
            List<BudgetCategory> existing = budgetCategoryAsyncService.fetchExistingBudgetCategoriesByDateRange(
                    subBudget.getStartDate(), subBudget.getEndDate(), subBudget.getId()).join();
            return budgetCategoryAsyncService.updateAsync(subBudget, transactions, existing, range, Period.DAILY).join();
        }
        catch(CompletionException e)
        {
            log.error("Error updating budget categories for date {}", date, e);
            return Collections.emptyList();
        }
    }

    public boolean saveBudgetCategories(List<BudgetCategory> budgetCategories)
    {
        try
        {
            return !budgetCategoryAsyncService.saveAsyncBudgetCategories(budgetCategories).join().isEmpty();
        }
        catch(CompletionException e)
        {
            log.error("Error saving budget categories", e);
            return false;
        }
    }
}
