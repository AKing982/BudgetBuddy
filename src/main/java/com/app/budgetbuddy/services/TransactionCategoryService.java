package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;

import java.util.List;

public interface TransactionCategoryService extends ServiceModel<TransactionCategoryEntity>
{
    void saveAll(List<TransactionCategory> transactionCategoryList);

    TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory);
}
