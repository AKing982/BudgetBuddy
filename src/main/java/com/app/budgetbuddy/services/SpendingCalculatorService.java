package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.PlaidTransaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SpendingCalculatorService
{
    private final TransactionService transactionService;

    @Autowired
    public SpendingCalculatorService(TransactionService transactionService){
        this.transactionService = transactionService;
    }

    public List<PlaidTransaction> loadPlaidTransactionsForUser(Long userID)
    {
        return null;
    }

    public BigDecimal calculateSpendingForPeriod(LocalDate startDate, LocalDate endDate){
        return null;
    }

    public BigDecimal calculateAverageSpendingForPeriod(LocalDate startDate, LocalDate endDate){
        return null;
    }
}
