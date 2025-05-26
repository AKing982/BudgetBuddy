package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.*;

import com.app.budgetbuddy.workbench.BudgetCategoryThreadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

@Service
@Slf4j
public class BudgetCategoryRunner
{
    private final TransactionsByCategoryService transactionsByCategoryService;
    private final BudgetCategoryThreadService budgetCategoryThreadService;
    private final SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    public BudgetCategoryRunner(TransactionsByCategoryService transactionsByCategoryService,
                                BudgetCategoryThreadService budgetCategoryThreadService,
                                SubBudgetGoalsService subBudgetGoalsService)
    {
        this.transactionsByCategoryService = transactionsByCategoryService;
        this.budgetCategoryThreadService = budgetCategoryThreadService;
        this.subBudgetGoalsService = subBudgetGoalsService;
    }

    private List<TransactionsByCategory> getTransactionsByCategoryListByMonth(final SubBudget subBudget)
    {
        LocalDate startDate = subBudget.getStartDate();
        LocalDate endDate = subBudget.getEndDate();
        Long userID = subBudget.getBudget().getUserId();
        try
        {
            CompletableFuture<List<TransactionsByCategory>> future = transactionsByCategoryService.fetchTransactionsByCategoryList(userID, startDate, endDate);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching transactions by category list", e);
            return Collections.emptyList();
        }
    }

    private List<BudgetCategory> getExistingBudgetCategoriesByMonth(final SubBudget subBudget)
    {
        try
        {
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.fetchExistingBudgetCategoriesForMonth(subBudget);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching the existing budget categories for month {}", subBudget, e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> getTransactionsByCategoryListByDate(final SubBudget subBudget, final LocalDate date)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            CompletableFuture<List<TransactionsByCategory>> future = transactionsByCategoryService.fetchTransactionsByCategoryListByDate(userId, date);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching transactions by category list by date", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryProcessForMonth(final SubBudget subBudget)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = getTransactionsByCategoryListByMonth(subBudget);
            Long subBudgetId = subBudget.getId();
            SubBudgetGoals subBudgetGoals1 = subBudgetGoalsService.getSubBudgetGoalsEntitiesBySubBudgetId(subBudgetId);
            log.info("Starting Thread for async budget category creation");
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByMonth(subBudget, subBudgetGoals1, transactionsByCategoryList);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching budget category list", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForMonth(final SubBudget subBudget)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = getTransactionsByCategoryListByMonth(subBudget);
            List<BudgetCategory> existingBudgetCategories = getExistingBudgetCategoriesByMonth(subBudget);
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.updateAsyncBudgetCategoriesByMonth(subBudget, transactionsByCategoryList, existingBudgetCategories);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error updating the budget category list for month: {}", subBudget, e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryProcessForDate(final LocalDate date, final SubBudget subBudget)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = getTransactionsByCategoryListByDate(subBudget, date);
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByCurrentDate(date, subBudget, transactionsByCategoryList);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error processing the budget categories for date {}", date, e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForDate(final LocalDate date, final SubBudget subBudget)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = getTransactionsByCategoryListByDate(subBudget, date);
            List<BudgetCategory> existingBudgetCategories = getExistingBudgetCategoriesByMonth(subBudget);
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.updateAsyncBudgetCategoriesByCurrentDate(existingBudgetCategories, date, subBudget, transactionsByCategoryList);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error updating the budget category list for date {}", date, e);
            return Collections.emptyList();
        }
    }

    public boolean saveBudgetCategories(List<BudgetCategory> budgetCategories)
    {
        try
        {
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.saveAsyncBudgetCategories(budgetCategories);
            List<BudgetCategory> budgetCategoriesList = future.join();
            return !budgetCategoriesList.isEmpty();
        }catch(CompletionException e){
            log.error("There was an error saving the budget categories", e);
            return false;
        }
    }
}
