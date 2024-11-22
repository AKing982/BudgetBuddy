package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.TransactionCriteria;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.RecurringTransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class RecurringTransactionLoaderImpl implements RecurringTransactionLoader
{
    private final RecurringTransactionService recurringTransactionService;

    @Autowired
    public RecurringTransactionLoaderImpl(RecurringTransactionService recurringTransactionService)
    {
        this.recurringTransactionService = recurringTransactionService;
    }

    @Override
    public List<RecurringTransaction> loadTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        if(startDate == null || endDate == null){
            throw new IllegalArgumentException("startDate and endDate cannot be null");
        }
        try
        {
            List<RecurringTransaction> recurringTransactions = recurringTransactionService.getRecurringTransactions(userId, startDate, endDate);
            log.info("Loaded {} recurring transactions", recurringTransactions.size());
            return recurringTransactions;
        }catch(DataAccessException ex){
            log.error("There was an error retrieving recurring transactions from the database: ", ex);
            return new ArrayList<>();
        }

    }


    @Override
    public List<RecurringTransaction> loadRecentTransactions(Long userId, int limit) {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> loadTransactionsByCategory(String categoryId) {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> loadPendingTransactions(Long userId) {
        return List.of();
    }

    @Override
    public List<RecurringTransaction> loadTransactionsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        return List.of();
    }
}
