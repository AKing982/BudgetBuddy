package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionsByCategory;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@Data
@Slf4j
public class TransactionsByCategoryService
{
    private TransactionCategoryService transactionCategoryService;
    private TransactionsByCategoryQueries transactionsByCategoryQueries;

    @Autowired
    public TransactionsByCategoryService(TransactionCategoryService transactionCategoryService,
                                         TransactionsByCategoryQueries transactionsByCategoryQueries)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionsByCategoryQueries = transactionsByCategoryQueries;
    }

    @Async("taskExecutor")
    public CompletableFuture<List<TransactionsByCategory>> fetchTransactionsByCategoryListByDate(final Long userId, final LocalDate date)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategories = transactionsByCategoryQueries.getTransactionsByCategoryListByDate(userId, date);
            return CompletableFuture.completedFuture(transactionsByCategories);
        }catch(DataAccessException e)
        {
            log.error("There was an error fetching the transactions by categories by date {}", date, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<TransactionsByCategory>> fetchUpdatedTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = transactionsByCategoryQueries.getUpdatedTransactionsByCategoryList(userId, startDate, endDate);
            return CompletableFuture.completedFuture(transactionsByCategoryList);
        }catch(DataException e){
            log.error("There was an error fetching the updated transactions by category list {}: ", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("taskExecutor")
    public CompletableFuture<List<TransactionsByCategory>> fetchTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            List<TransactionsByCategory> transactionsByCategoryList = transactionsByCategoryQueries.getTransactionsByCategoryList(userId, startDate, endDate);

            return CompletableFuture.completedFuture(transactionsByCategoryList);
        }catch(DataAccessException e){
            log.error("There was an error fetching all the transactions by categories: ", e);
            return CompletableFuture.failedFuture(e);
        }
    }

}
