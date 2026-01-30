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
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetCategoryRunner
{
    private final TransactionsByCategoryService transactionsByCategoryService;
    private final BudgetCategoryThreadService budgetCategoryThreadService;
    private final CSVTransactionsThreadService csvTransactionsThreadService;
    private final SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    public BudgetCategoryRunner(TransactionsByCategoryService transactionsByCategoryService,
                                BudgetCategoryThreadService budgetCategoryThreadService,
                                CSVTransactionsThreadService csvTransactionsThreadService,
                                SubBudgetGoalsService subBudgetGoalsService)
    {
        this.transactionsByCategoryService = transactionsByCategoryService;
        this.budgetCategoryThreadService = budgetCategoryThreadService;
        this.csvTransactionsThreadService = csvTransactionsThreadService;
        this.subBudgetGoalsService = subBudgetGoalsService;
    }

    private List<CSVTransactionsByCategory> getCSVTransactionsByCategoryForMonth(final SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return Collections.emptyList();
        }
        LocalDate monthStartDate = subBudget.getStartDate();
        LocalDate monthEndDate = subBudget.getEndDate();
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            CompletableFuture<List<CSVTransactionsByCategory>> future = csvTransactionsThreadService.fetchCSVTransactionsByCategoryListByDateRange(userId, monthStartDate, monthEndDate);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching the CSV Transactions by Category list for sub Budget {}: {}", subBudget, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<CSVTransactionsByCategory> getCSVTransactionsByCategoryListByBudgetScheduleRange(final BudgetScheduleRange budgetSchedule, final SubBudget subBudget)
    {
        if(budgetSchedule == null || subBudget == null)
        {
            return Collections.emptyList();
        }
        LocalDate weekStart = budgetSchedule.getStartRange();
        LocalDate weekEnd = budgetSchedule.getEndRange();
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            CompletableFuture<List<CSVTransactionsByCategory>> future = csvTransactionsThreadService.fetchCSVTransactionsByCategoryListByDateRange(userId, weekStart, weekEnd);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching the CSV Transactions By category list {}: ", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> getTransactionsByCategoryListByBudgetScheduleRange(final BudgetScheduleRange budgetScheduleRange, final Long userId)
    {
        LocalDate budgetWeekStart = budgetScheduleRange.getStartRange();
        LocalDate budgetWeekEnd = budgetScheduleRange.getEndRange();
        try
        {
            CompletableFuture<List<TransactionsByCategory>> future = transactionsByCategoryService.fetchTransactionsByCategoryList(userId, budgetWeekStart, budgetWeekEnd);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching transactions by category list for budget schedule range {}", budgetScheduleRange, e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> getUpdatedTransactionsByCategoryListByMonth(final SubBudget subBudget)
    {
        LocalDate monthStartDate = subBudget.getStartDate();
        LocalDate monthEndDate = subBudget.getEndDate();
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            CompletableFuture<List<TransactionsByCategory>> future = transactionsByCategoryService.fetchUpdatedTransactionsByCategoryList(userId, monthStartDate, monthEndDate);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching updated transactions by category list: {}", e.getMessage());
            return Collections.emptyList();
        }
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

    private List<BudgetCategory> getExistingBudgetCategoriesByBudgetScheduleRange(final BudgetScheduleRange budgetScheduleRange, final Long subBudgetId)
    {
        LocalDate startDate = budgetScheduleRange.getStartRange();
        LocalDate endDate = budgetScheduleRange.getEndRange();
        try
        {
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.fetchExistingBudgetCategoriesByDateRange(startDate, endDate, subBudgetId);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching the existing budget categories for budget schedule range {}",  budgetScheduleRange, e);
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

    private List<CSVTransactionsByCategory> getUpdatedCSVTransactionsByCategoryForMonth(final SubBudget subBudget)
    {
        LocalDate startDate = subBudget.getStartDate();
        LocalDate endDate = subBudget.getEndDate();
        Long userId =  subBudget.getBudget().getUserId();
        try
        {
            CompletableFuture<List<CSVTransactionsByCategory>> updatedTransactionsByCategories = csvTransactionsThreadService.fetchUpdatedCSVTransactionsByCategoryListByDateRange(userId, startDate, endDate);
            return updatedTransactionsByCategories.join();
        }catch(CompletionException e){
            log.error("There was an error fetching the updated csv transactions by category: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryProcessForMonth(final SubBudget subBudget)
    {
        try
        {
            Long subBudgetId = subBudget.getId();
            SubBudgetGoals subBudgetGoals1 = subBudgetGoalsService.getSubBudgetGoalsEntitiesBySubBudgetId(subBudgetId);
            List<TransactionsByCategory> transactionsByCategoryList = getTransactionsByCategoryListByMonth(subBudget);
            List<CSVTransactionsByCategory> csvTransactionsByCategoryList = getCSVTransactionsByCategoryForMonth(subBudget);
            // Merge TransactionsByCategory and CSVTransactionsByCategory into TransactionsByCategory
            List<TransactionsByCategory> mergedTransactionsByCategory = mergeTransactionsByCategoryAndCSVTransactionsByCategory(transactionsByCategoryList, csvTransactionsByCategoryList);
            log.info("Starting Thread for async budget category creation");
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByMonth(subBudget, subBudgetGoals1, mergedTransactionsByCategory);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error fetching budget category list", e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> mergeTransactionsByCategoryAndCSVTransactionsByCategory(List<TransactionsByCategory> transactionsByCategoryList, List<CSVTransactionsByCategory> csvTransactionsByCategoryList)
    {
        List<TransactionsByCategory> convertedCSVTransactionsByCategory = csvTransactionsByCategoryList.stream()
                .map(this::convertCSVTransactionsByCategory)
                .toList();
        List<TransactionsByCategory> mergedTransactionsByCategoryList = new ArrayList<>(transactionsByCategoryList);
        mergedTransactionsByCategoryList.addAll(convertedCSVTransactionsByCategory);
        return mergedTransactionsByCategoryList;
    }

    private List<Transaction> convertCSVTransactionToTransactions(final List<TransactionCSV> transactionCSVList)
    {
        return transactionCSVList.stream()
                .map(csv -> Transaction.builder()
                        .transactionId("csv-" + csv.getId())
                        .amount(csv.getTransactionAmount())
                        .categories(List.of())
                        .accountId(csv.getAccount())
                        .description(csv.getDescription())
                        .date(csv.getTransactionDate())
                        .merchantName(csv.getMerchantName())
                        .posted(csv.getTransactionDate())
                        .pending(false)
                        .isoCurrencyCode("USD")
                        .categoryId(null)
                        .logoUrl(null)
                        .build())
                .collect(Collectors.toList());
    }

    private TransactionsByCategory convertCSVTransactionsByCategory(CSVTransactionsByCategory csvTransactionsByCategories)
    {
        List<Transaction> convertedTransactions = convertCSVTransactionToTransactions(csvTransactionsByCategories.getCsvTransactions());
        return new TransactionsByCategory(csvTransactionsByCategories.getCategory(), csvTransactionsByCategories.getTotalCategorySpending(), convertedTransactions);
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForBudgetScheduleRange(final BudgetScheduleRange budgetScheduleRange, final SubBudget subBudget,  Long userId)
    {
        try
        {
            Long subBudgetId = subBudget.getId();
            // Get the Transactions categories for current budget schedule range
            List<TransactionsByCategory> transactionsByCategoryList = getTransactionsByCategoryListByBudgetScheduleRange(budgetScheduleRange, userId);
            List<CSVTransactionsByCategory> csvTransactionsByCategoryList = getCSVTransactionsByCategoryListByBudgetScheduleRange(budgetScheduleRange, subBudget);
            List<TransactionsByCategory> mergedTransactionsByCategory = mergeTransactionsByCategoryAndCSVTransactionsByCategory(transactionsByCategoryList, csvTransactionsByCategoryList);
            log.info("CSVTransactionsByCategoryList: {}", transactionsByCategoryList);
            List<BudgetCategory> budgetCategoriesByBudgetScheduleRange = getExistingBudgetCategoriesByBudgetScheduleRange(budgetScheduleRange, subBudgetId);
            log.info("ExistingBudgetCategoriesByBudgetScheduleRange: {}", budgetCategoriesByBudgetScheduleRange);
            log.info("Starting Thread for async budget category update");
            // run thread process to update budget categories for this week
            CompletableFuture<List<BudgetCategory>> updatedBudgetCategories = budgetCategoryThreadService.updateAsyncBudgetCategoriesByWeek(budgetScheduleRange,subBudget, mergedTransactionsByCategory, budgetCategoriesByBudgetScheduleRange);
            log.info("Updated Budget Categories: {}", updatedBudgetCategories);
            log.info("Finished Thread for async budget category update");
            // return the future bitch
            return updatedBudgetCategories.join();

        }catch(CompletionException e){
            log.error("There was an error fetching budget category updates", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryUpdateProcessForMonth(final SubBudget subBudget)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = getUpdatedTransactionsByCategoryListByMonth(subBudget);
            List<CSVTransactionsByCategory> csvTransactionsByCategoryList = getUpdatedCSVTransactionsByCategoryForMonth(subBudget);
            List<TransactionsByCategory> mergedTransactionsByCategory = mergeTransactionsByCategoryAndCSVTransactionsByCategory(transactionsByCategoryList, csvTransactionsByCategoryList);
            List<BudgetCategory> existingBudgetCategories = getExistingBudgetCategoriesByMonth(subBudget);
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.updateAsyncBudgetCategoriesByMonth(subBudget, mergedTransactionsByCategory, existingBudgetCategories);
            return future.join();
        }catch(CompletionException e){
            log.error("There was an error updating the budget category list for month: {}", subBudget, e);
            return Collections.emptyList();
        }
    }

    public List<BudgetCategory> runBudgetCategoryCreateProcessForWeek(final SubBudget subBudget, final BudgetScheduleRange budgetScheduleRange)
    {
        Long userId = subBudget.getBudget().getUserId();
        LocalDate startDate = budgetScheduleRange.getStartRange();
        LocalDate endDate = budgetScheduleRange.getEndRange();
        try
        {
            // Get the transaction categories for the specified time period
            List<TransactionsByCategory> transactionsByCategories = getTransactionsByCategoryListByBudgetScheduleRange(budgetScheduleRange, userId);
            List<CSVTransactionsByCategory> csvTransactionsByCategoryList = getCSVTransactionsByCategoryListByBudgetScheduleRange(budgetScheduleRange, subBudget);
            List<TransactionsByCategory> mergedTransactionsByCategory = mergeTransactionsByCategoryAndCSVTransactionsByCategory(transactionsByCategories, csvTransactionsByCategoryList);
            // Run the create Async Budget Categories for this time period
            CompletableFuture<List<BudgetCategory>> future = budgetCategoryThreadService.createAsyncBudgetCategoriesByWeek(budgetScheduleRange, subBudget, mergedTransactionsByCategory);
            List<BudgetCategory> newBudgetCategories = future.join();
            log.info("New BudgetCategories for week {}: {}", budgetScheduleRange, newBudgetCategories);
            // return the result
            return newBudgetCategories;

        }catch(CompletionException e){
            log.error("There was an error running the budget category creation for {} to {}:", startDate, endDate, e);
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
