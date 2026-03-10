package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.TransactionCategory;

import java.util.List;

public interface TransactionCategoryBuilderStrategy<T>
{
    boolean supports(Object transactionType);
    List<TransactionCategory> build(List<T> transactions, List<SubBudget> subBudgets);
    List<TransactionCategory> reCategorize(List<TransactionCategory> transactionCategories, List<T> transactions, List<SubBudget> subBudgets);
}
