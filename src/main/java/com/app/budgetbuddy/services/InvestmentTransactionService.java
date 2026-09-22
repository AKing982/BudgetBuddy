package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.InvestmentTransaction;
import com.app.budgetbuddy.entities.InvestmentTransactionEntity;

import java.time.LocalDate;
import java.util.List;

public interface InvestmentTransactionService extends ServiceModel<InvestmentTransactionEntity>
{
    List<InvestmentTransactionEntity> createAndSave(List<InvestmentTransaction> investmentTransactions);
    List<InvestmentTransactionEntity> findByUserId(Long userId, LocalDate startDate, LocalDate endDate);
}
