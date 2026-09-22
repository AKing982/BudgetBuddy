package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.entities.InvestmentTransactionEntity;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class PlaidImportResult
{
    private Long userId;
    private List<Transaction> transactions;
    private List<RecurringTransaction> recurringTransactions;
    private List<InvestmentTransactionEntity> investmentTransactions;

    public PlaidImportResult(Long userId, List<Transaction> transactions, List<RecurringTransaction> recurringTransactions) {
        this.userId = userId;
        this.transactions = transactions;
        this.recurringTransactions = recurringTransactions;
    }

    public PlaidImportResult(Long userId, List<Transaction> transactions, List<RecurringTransaction> recurringTransactions, List<InvestmentTransactionEntity> investmentTransactions) {
        this.userId = userId;
        this.transactions = transactions;
        this.recurringTransactions = recurringTransactions;
        this.investmentTransactions = investmentTransactions;
    }
}
