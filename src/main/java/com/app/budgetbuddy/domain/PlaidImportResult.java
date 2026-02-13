package com.app.budgetbuddy.domain;

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

    public PlaidImportResult(Long userId, List<Transaction> transactions, List<RecurringTransaction> recurringTransactions) {
        this.userId = userId;
        this.transactions = transactions;
        this.recurringTransactions = recurringTransactions;
    }
}
