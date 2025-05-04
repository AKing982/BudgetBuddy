package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilderFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final BudgetCategoryBuilderFactory budgetCategoryBuilderFactory;
    private final BudgetCategoryService budgetCategoryService;
    private final ThreadPoolTaskScheduler threadPoolTaskScheduler;

    @Autowired
    public BudgetCategoryThreadService(BudgetCategoryBuilderFactory budgetCategoryBuilderFactory,
                                       BudgetCategoryService budgetCategoryService,
                                       ThreadPoolTaskScheduler threadPoolTaskScheduler)
    {
        this.budgetCategoryBuilderFactory = budgetCategoryBuilderFactory;
        this.budgetCategoryService = budgetCategoryService;
        this.threadPoolTaskScheduler = threadPoolTaskScheduler;
    }

    public CompletableFuture<Boolean> runCreateAsyncOperationForCurrentDate(final SubBudget subBudget, final BudgetSchedule budgetSchedule, final List<CategoryTransactions> categoryTransactions)
    {
        final LocalDate currentDate = LocalDate.now();
        try
        {
            log.info("Starting budget category thread for current date {}", currentDate);
            CompletableFuture<List<BudgetCategory>> budgetCategoriesFuture = createAsyncBudgetCategoriesByCurrentDate(currentDate, subBudget, budgetSchedule, categoryTransactions);
            List<BudgetCategory> budgetCategories = budgetCategoriesFuture.get();
            if(!budgetCategories.isEmpty())
            {
                return CompletableFuture.completedFuture(true);
            }
            return CompletableFuture.completedFuture(false);
        }catch(Exception e){
            log.error("Failed to run create operation for date: ", e);
            return CompletableFuture.completedFuture(false);
        }
    }

    public CompletableFuture<Boolean> runNormalBudgetCategorySetupOperation(final SubBudget subBudget, final BudgetSchedule budgetSchedule, final List<CategoryTransactions> categoryTransactions)
    {
        return null;
    }

    public CompletableFuture<Boolean> runUpdateAsyncOperationForCurrentDate(final LocalDate currentDate, final List<BudgetCategory> existingBudgetCategories, final SubBudget subBudget, final List<CategoryTransactions> categoryTransactions)
    {
        return null;
    }

    public CompletableFuture<List<BudgetCategory>> saveAsyncBudgetCategories(final List<BudgetCategory> budgetCategories)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                if(budgetCategories == null || budgetCategories.isEmpty())
                {
                    return Collections.emptyList();
                }
                else
                {
                    return budgetCategoryService.saveAll(budgetCategories);
                }
            }catch(CompletionException e){
                log.error("There was an error saving the budget categories to the server: ", e);
                return Collections.emptyList();
            }

        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<BudgetCategory>> createAsyncBudgetCategoriesByCurrentDate(final LocalDate currentDate, final SubBudget subBudget, final BudgetSchedule budgetSchedule, final List<CategoryTransactions> categoryTransactions)
    {
        return CompletableFuture.supplyAsync(() -> {
            if(categoryTransactions.isEmpty())
            {
                return Collections.emptyList();
            }
            return null;
        }, threadPoolTaskScheduler.getScheduledExecutor());
    }

    public CompletableFuture<List<BudgetCategory>> updateAsyncBudgetCategoriesByCurrentDate(final List<BudgetCategory> existingBudgetCategories, final LocalDate currentDate, final SubBudget subBudget, final List<CategoryTransactions> categoryTransactions)
    {
        return null;
    }

//    public CompletableFuture<List<BudgetCategory>> createAsyncBudgetCategories(final SubBudget subBudget, final BudgetSchedule budgetSchedule, final List<CategoryTransactions> categoryTransactions, final SubBudgetGoals subBudgetGoals)
//    {
//        return CompletableFuture.supplyAsync(() -> {
//            try
//            {
//                log.info("Starting async budget category creation for SubBudget: {}, Schedule: {}", subBudget.getId(), budgetSchedule.getBudgetScheduleId());
//                // 3. Initialize the Budget Categories
//                List<BudgetCategory> createdBudgetCategories = budgetCategoryBuilder.initializeBudgetCategories(subBudget, budgetSchedule, categoryTransactions, subBudgetGoals);
//                createdBudgetCategories.forEach((budgetCategory -> {
//                    log.info("BudgetCategory: {}", budgetCategory);
//                }));
//                return createdBudgetCategories;
//
//            }catch(CompletionException e)
//            {
//                log.error("There was an error creating the budget categories for subBudget: {}", subBudget, e);
//                throw e;
//            }
//
//        }, threadPoolTaskScheduler.getScheduledExecutor());
//    }

}
