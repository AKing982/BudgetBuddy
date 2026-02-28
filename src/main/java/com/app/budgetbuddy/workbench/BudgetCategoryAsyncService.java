package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

@Service
@Slf4j
@Async
public class BudgetCategoryAsyncService
{
    private final List<BudgetCategoryBuilderStrategy> strategies;
    private final BudgetCategoryService budgetCategoryService;

    @Autowired
    public BudgetCategoryAsyncService(List<BudgetCategoryBuilderStrategy> strategies,
                                       BudgetCategoryService budgetCategoryService)
    {
        this.strategies = strategies;
        this.budgetCategoryService = budgetCategoryService;
    }

    private BudgetCategoryBuilderStrategy getStrategy(Period periodType)
    {
        return strategies.stream()
                .filter(s -> s.supports(periodType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No strategy found for: " + periodType));
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> createAsync(final SubBudget subBudget,
                                                               final List<TransactionsByCategory> transactions,
                                                               final BudgetScheduleRange range,
                                                               final Period periodType)
    {
        try
        {
            if(subBudget == null || transactions == null || range == null)
            {
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            List<BudgetCategory> categories = getStrategy(periodType).build(subBudget, transactions, range);
            if(categories.isEmpty())
            {
                log.warn("No budget categories built for period {} subBudget {}", periodType, subBudget.getId());
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            return CompletableFuture.completedFuture(budgetCategoryService.saveAll(categories));
        }
        catch(Exception e)
        {
            log.error("Error creating budget categories for period {}: {}", periodType, e.getMessage(), e);
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<BudgetCategory>> updateAsync(final SubBudget subBudget,
                                                               final List<TransactionsByCategory> transactions,
                                                               final List<BudgetCategory> existing,
                                                               final BudgetScheduleRange range,
                                                               final Period periodType)
    {
        try
        {
            if(subBudget == null || transactions == null || existing == null || range == null)
            {
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            List<BudgetCategory> updated = getStrategy(periodType).update(subBudget, transactions, existing, range);
            if(updated.isEmpty())
            {
                log.warn("No budget categories updated for period {} subBudget {}", periodType, subBudget.getId());
                return CompletableFuture.completedFuture(Collections.emptyList());
            }
            return CompletableFuture.completedFuture(budgetCategoryService.saveAll(updated));
        }
        catch(Exception e)
        {
            log.error("Error updating budget categories for period {}: {}", periodType, e.getMessage(), e);
            return CompletableFuture.completedFuture(Collections.emptyList());
        }
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

}
