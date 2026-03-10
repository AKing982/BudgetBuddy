package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.TransactionCategory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionCategoryBuilder
{
    private List<TransactionCategoryBuilderStrategy<?>> strategies;

    @Autowired
    public TransactionCategoryBuilder(List<TransactionCategoryBuilderStrategy<?>> strategies)
    {
        this.strategies = strategies;
    }

    @SuppressWarnings("unchecked")
    public List<TransactionCategory> build(List<?> transactions, List<SubBudget> subBudgets)
    {
        if(transactions == null || transactions.isEmpty())
        {
            return Collections.emptyList();
        }
        Object transaction = transactions.get(0);
        return strategies.stream()
                .filter(s -> s.supports(transaction))
                .findFirst()
                .map(s -> ((TransactionCategoryBuilderStrategy<Object>) s).build((List<Object>) transactions, subBudgets))
                .orElseThrow(() -> new IllegalArgumentException("No strategy found for transaction type: " + transaction.getClass()));
    }

    @SuppressWarnings("unchecked")
    public List<TransactionCategory> reCategorize(List<TransactionCategory> existing, List<?> transactions, List<SubBudget> subBudgets)
    {
        if (transactions == null || transactions.isEmpty()) return Collections.emptyList();

        Object transaction = transactions.get(0);
        return strategies.stream()
                .filter(s -> s.supports(transaction))
                .findFirst()
                .map(s -> ((TransactionCategoryBuilderStrategy<Object>) s).reCategorize(existing, (List<Object>) transactions, subBudgets))
                .orElseThrow(() -> new IllegalArgumentException("No strategy found for transaction type: " + transaction.getClass()));
    }

}
