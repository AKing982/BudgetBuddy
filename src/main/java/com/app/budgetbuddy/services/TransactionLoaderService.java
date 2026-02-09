//package com.app.budgetbuddy.services;
//
//import com.app.budgetbuddy.domain.RecurringTransaction;
//import com.app.budgetbuddy.domain.Transaction;
//import com.app.budgetbuddy.exceptions.DataAccessException;
//import com.app.budgetbuddy.workbench.RecurringTransactionLoader;
//import com.app.budgetbuddy.workbench.TransactionLoader;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.util.List;
//
//@Service
//@Slf4j
//public class TransactionLoaderService
//{
//    private final TransactionLoader transactionLoader;
//    private final RecurringTransactionLoader recurringTransactionLoader;
//
//    @Autowired
//    public TransactionLoaderService(TransactionLoader transactionLoader, RecurringTransactionLoader recurringTransactionLoader)
//    {
//        this.transactionLoader = transactionLoader;
//        this.recurringTransactionLoader = recurringTransactionLoader;
//    }
//
//    public List<Transaction> loadTransactionsByDatePeriod(LocalDate startDate, LocalDate endDate){
//        return null;
//    }
//
//    public List<Transaction> loadTransactionsByDate(LocalDate date, Long userID)
//    {
//        return transactionLoader.loadTransactionsByPosted(date, userID);
//    }
//
//    public List<RecurringTransaction> loadRecurringTransactionsByDate(LocalDate date){
//        return null;
//    }
//
//    public List<Transaction> loadPendingTransactions(){
//        return null;
//    }
//
//    public List<Transaction> loadTransactionsByCategoryId(String categoryId){
//        return null;
//    }
//
//    public List<Transaction> loadTransactionsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount){
//        return null;
//    }
//
//    public List<Transaction> loadTransactionsByUserDateRange(Long userId, LocalDate startDate, LocalDate endDate){
//        return null;
//    }
//
//    public List<Transaction> loadRecentTransactions(int limit){
//        return null;
//    }
//
//    public List<RecurringTransaction> loadRecurringTransactionsByDateRange(LocalDate startDate, LocalDate endDate){
//        return null;
//    }
//
//    public List<RecurringTransaction> loadRecurringTransactionsByUserDateRange(Long userId, LocalDate startDate, LocalDate endDate){
//        return null;
//    }
//
//    public List<RecurringTransaction> loadRecurringTransactionsByCategoryId(String categoryId){
//        return null;
//    }
//}
