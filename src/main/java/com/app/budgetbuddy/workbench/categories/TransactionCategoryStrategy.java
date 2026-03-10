package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionCategoryStrategy implements TransactionCategoryBuilderStrategy<Transaction>
{

    @Override
    public boolean supports(Object transactionType)
    {
        return transactionType instanceof Transaction;
    }

    @Override
    public List<TransactionCategory> build(List<Transaction> transactions, List<SubBudget> subBudgets) {
        return List.of();
    }

    @Override
    public List<TransactionCategory> reCategorize(List<TransactionCategory> transactionCategories, List<Transaction> transactions, List<SubBudget> subBudgets)
    {
        return List.of();
    }


}
