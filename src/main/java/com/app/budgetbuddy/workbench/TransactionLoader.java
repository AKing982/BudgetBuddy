package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCriteria;

import java.time.LocalDate;
import java.util.List;

public interface TransactionLoader extends TransactionDataLoaderBase<Transaction>
{
    List<Transaction> loadTransactionsByPosted(LocalDate date, Long userID);
}
