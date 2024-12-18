package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.budget.TransactionCategoryBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class TransactionCategoryRunner
{
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionCategoryBuilder transactionCategoryBuilder;

    @Autowired
    public TransactionCategoryRunner(TransactionCategoryService transactionCategoryService,
                                     TransactionCategoryBuilder transactionCategoryBuilder)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionCategoryBuilder = transactionCategoryBuilder;
    }

    public Boolean checkIfTransactionCategoryExists(TransactionCategory transactionCategory){
        return null;
    }

    public void batchSaveTransactionCategories(List<TransactionCategory> transactionCategories){

    }

    public void saveCreatedTransactionCategory(TransactionCategory transactionCategory){

    }

    public List<TransactionCategory> createNewRecurringTransactionCategories(List<RecurringTransaction> recurringTransactions, Budget budget, LocalDate startDate, LocalDate endDate){
        return null;
    }

    public List<TransactionCategory> createNewTransactionCategories(List<Transaction> transactions, Budget budget, LocalDate startDate, LocalDate endDate){
        return null;
    }

    public List<TransactionCategory> updateTransactionCategories(final List<TransactionCategory> existingTransactionCategories, final List<Transaction> transactions, final Budget budget, final BudgetPeriod budgetPeriod){
        return null;
    }

}
