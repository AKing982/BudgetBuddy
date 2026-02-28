package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionsByCategoryLoaderService
{
    private final TransactionsByCategoryService transactionsByCategoryService;
    private final CSVTransactionsThreadService csvTransactionsThreadService;

    @Autowired
    public TransactionsByCategoryLoaderService(TransactionsByCategoryService transactionsByCategoryService,
                                     CSVTransactionsThreadService csvTransactionsThreadService)
    {
        this.transactionsByCategoryService = transactionsByCategoryService;
        this.csvTransactionsThreadService = csvTransactionsThreadService;
    }

    public List<TransactionsByCategory> fetchAndMergeForMonth(final SubBudget subBudget)
    {
        List<TransactionsByCategory> transactions = fetchByMonth(subBudget);
        List<CSVTransactionsByCategory> csvTransactions = fetchCSVByMonth(subBudget);
        return merge(transactions, csvTransactions);
    }

    public List<TransactionsByCategory> fetchAndMergeUpdatedForMonth(final SubBudget subBudget)
    {
        List<TransactionsByCategory> transactions = fetchUpdatedByMonth(subBudget);
        List<CSVTransactionsByCategory> csvTransactions = fetchUpdatedCSVByMonth(subBudget);
        return merge(transactions, csvTransactions);
    }

    public List<TransactionsByCategory> fetchAndMergeForRange(final BudgetScheduleRange range, final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        List<TransactionsByCategory> transactions = fetchByRange(range, userId);
        List<CSVTransactionsByCategory> csvTransactions = fetchCSVByRange(range, subBudget);
        return merge(transactions, csvTransactions);
    }

    public List<TransactionsByCategory> fetchByDate(final SubBudget subBudget, final LocalDate date)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            return transactionsByCategoryService.fetchTransactionsByCategoryListByDate(userId, date).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching transactions by category for date {}", date, e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> fetchByMonth(final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            return transactionsByCategoryService.fetchTransactionsByCategoryList(
                    userId, subBudget.getStartDate(), subBudget.getEndDate()).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching transactions by category for month", e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> fetchUpdatedByMonth(final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            return transactionsByCategoryService.fetchUpdatedTransactionsByCategoryList(
                    userId, subBudget.getStartDate(), subBudget.getEndDate()).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching updated transactions by category for month", e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> fetchByRange(final BudgetScheduleRange range, final Long userId)
    {
        try
        {
            return transactionsByCategoryService.fetchTransactionsByCategoryList(
                    userId, range.getStartRange(), range.getEndRange()).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching transactions by category for range {}", range, e);
            return Collections.emptyList();
        }
    }

    private List<CSVTransactionsByCategory> fetchCSVByMonth(final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            return csvTransactionsThreadService.fetchCSVTransactionsByCategoryListByDateRange(
                    userId, subBudget.getStartDate(), subBudget.getEndDate()).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching CSV transactions for month", e);
            return Collections.emptyList();
        }
    }

    private List<CSVTransactionsByCategory> fetchUpdatedCSVByMonth(final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            return csvTransactionsThreadService.fetchUpdatedCSVTransactionsByCategoryListByDateRange(
                    userId, subBudget.getStartDate(), subBudget.getEndDate()).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching updated CSV transactions for month", e);
            return Collections.emptyList();
        }
    }

    private List<CSVTransactionsByCategory> fetchCSVByRange(final BudgetScheduleRange range, final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        try
        {
            return csvTransactionsThreadService.fetchCSVTransactionsByCategoryListByDateRange(
                    userId, range.getStartRange(), range.getEndRange()).join();
        }
        catch(CompletionException e)
        {
            log.error("Error fetching CSV transactions for range {}", range, e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> merge(List<TransactionsByCategory> transactions,
                                               List<CSVTransactionsByCategory> csvTransactions)
    {
        List<TransactionsByCategory> converted = csvTransactions.stream()
                .map(this::convertCSVTransactionsByCategory)
                .toList();
        List<TransactionsByCategory> merged = new ArrayList<>(transactions);
        merged.addAll(converted);
        return merged;
    }

    private TransactionsByCategory convertCSVTransactionsByCategory(CSVTransactionsByCategory csv)
    {
        List<Transaction> converted = csv.getCsvTransactions().stream()
                .map(c -> Transaction.builder()
                        .transactionId("csv-" + c.getId())
                        .amount(c.getTransactionAmount())
                        .primaryCategory("")
                        .secondaryCategory("")
                        .accountId(c.getAccount())
                        .description(c.getDescription())
                        .date(c.getTransactionDate())
                        .merchantName(c.getMerchantName())
                        .posted(c.getTransactionDate())
                        .pending(false)
                        .isoCurrencyCodes("USD")
                        .categoryId(null)
                        .logoUrl(null)
                        .build())
                .collect(Collectors.toList());
        return new TransactionsByCategory(csv.getCategory(), csv.getTotalCategorySpending(), converted);
    }
}
