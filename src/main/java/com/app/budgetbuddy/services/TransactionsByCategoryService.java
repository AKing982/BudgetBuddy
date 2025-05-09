package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionsByCategory;
import com.app.budgetbuddy.exceptions.DataAccessException;
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
@Async
public class TransactionsByCategoryService
{
    private TransactionCategoryService transactionCategoryService;
    private TransactionsByCategoryQueries transactionsByCategoryQueries;
    private ThreadPoolTaskExecutor taskExecutor;

    @Autowired
    public TransactionsByCategoryService(TransactionCategoryService transactionCategoryService,
                                         TransactionsByCategoryQueries transactionsByCategoryQueries,
                                         ThreadPoolTaskExecutor taskExecutor) {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionsByCategoryQueries = transactionsByCategoryQueries;
        this.taskExecutor = taskExecutor;
    }

    public CompletableFuture<List<TransactionsByCategory>> fetchTransactionsByCategoryListByDate(final Long userId, final LocalDate date)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                return transactionsByCategoryQueries.getTransactionsByCategoryListByDate(userId, date);
            }catch(DataAccessException e){
                log.error("There was an error fetching the transactions by categories by date {}", date, e);
                return Collections.emptyList();
            }
        }, taskExecutor.getThreadPoolExecutor());
    }

    public CompletableFuture<List<TransactionsByCategory>> fetchTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        return CompletableFuture.supplyAsync(() -> {
            try
            {
                return transactionsByCategoryQueries.getTransactionsByCategoryList(userId, startDate, endDate);
            }catch(DataAccessException e){
                log.error("There was an error fetching all the transactions by categories: ", e);
                return Collections.emptyList();
            }
        }, taskExecutor.getThreadPoolExecutor());
    }

}
