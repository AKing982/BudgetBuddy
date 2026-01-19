//package com.app.budgetbuddy.workbench.runner;
//
//import com.app.budgetbuddy.domain.RecurringTransaction;
//import com.app.budgetbuddy.domain.Transaction;
//import com.app.budgetbuddy.domain.TransactionCategory;
//import com.app.budgetbuddy.services.*;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.util.Collections;
//import java.util.List;
//import java.util.concurrent.CompletableFuture;
//import java.util.concurrent.CompletionException;
//
//@Service
//@Slf4j
//public class CategoryRuleRunner
//{
//    private final CategoryRuleThreadService categoryRuleThreadService;
//
//    @Autowired
//    public CategoryRuleRunner(CategoryRuleThreadService categoryRuleThreadService)
//    {
//        this.categoryRuleThreadService = categoryRuleThreadService;
//    }
//
//    public List<TransactionCategory> runTransactionCategorization(final List<Transaction> transactions)
//    {
//        if(transactions == null || transactions.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            CompletableFuture<List<TransactionCategory>> future = categoryRuleThreadService.categorizeTransactions(transactions);
//            return future.join();
//        }catch(CompletionException e){
//            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
//            return Collections.emptyList();
//        }
//    }
//
//    public List<TransactionCategory> runRecurringTransactionCategorization(final List<RecurringTransaction> recurringTransactions)
//    {
//        if(recurringTransactions == null || recurringTransactions.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            CompletableFuture<List<TransactionCategory>> future = categoryRuleThreadService.categorizeRecurringTransactions(recurringTransactions);
//            return future.join();
//        }catch(CompletionException e){
//            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
//            return Collections.emptyList();
//        }
//    }
//}
