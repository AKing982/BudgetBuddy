package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class TransactionCategorizationService
{
    public Category categorizeTransaction(Transaction transaction){
        return null;
    }

    public List<Category> categorizePlaidCategoriesFromTransaction(final List<PlaidTransaction> plaidTransaction){
        return null;
    }

    public List<Category> categorizeTransactions(List<Transaction> transactions){
        return List.of();
    }

    public List<Category> recategorizeTransactions(List<Transaction> transactions){
        return List.of();
    }

    public Category recategorizeCategory(String categoryId){
        return null;
    }

    public List<Category> recategorizeTransactionForDateRange(LocalDate startDate, LocalDate endDate){
        return null;
    }




}
