package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.repositories.CSVTransactionRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.repositories.UserCategoryRepository;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TransactionCategoryToEntityConverter implements Converter<TransactionCategory, TransactionCategoryEntity>
{
    private final TransactionRepository transactionRepository;
    private final CSVTransactionRepository csvTransactionRepository;
    private final UserCategoryRepository userCategoryRepository;
    private final CategoryService categoryService;

    @Autowired
    public TransactionCategoryToEntityConverter(TransactionRepository transactionRepository,
                                                CSVTransactionRepository csvTransactionRepository,
                                                UserCategoryRepository userCategoryRepository,
                                                CategoryService categoryService)
    {
        this.transactionRepository = transactionRepository;
        this.csvTransactionRepository = csvTransactionRepository;
        this.userCategoryRepository = userCategoryRepository;
        this.categoryService = categoryService;
    }

    @Override
    public TransactionCategoryEntity convert(TransactionCategory transactionCategory)
    {
        CategoryEntity category = getCategoryEntity(transactionCategory.getCategoryId());
        CategoryEntity categoryEntity = category.isActive()
                && "SYSTEM".equals(transactionCategory.getCategorizedBy())
                ? category
                : null;
        UserCategoryEntity userCategory = getUserCategoryEntity(transactionCategory.getCategoryId());
        UserCategoryEntity userCategoryEntity = userCategory.getIsActive()
                && "USER".equals(transactionCategory.getCategorizedBy())
                ? userCategory
                : null;
        return TransactionCategoryEntity.builder()
                .transaction(getTransactionEntity(transactionCategory.getTransactionId()))
                .csvTransaction(getCSVTransactionEntity(transactionCategory.getCsvTransactionId()))
                .category(categoryEntity)
                .userCategory(userCategoryEntity)
                .categorizedBy(transactionCategory.getCategorizedBy())
                .categorized_date(transactionCategory.getCategorizedDate())
                .id(transactionCategory.getId())
                .build();
    }

    private UserCategoryEntity getUserCategoryEntity(Long categoryId)
    {
        return userCategoryRepository.findById(categoryId)
                .orElse(null);
    }

    private CategoryEntity getCategoryEntity(Long categoryId)
    {
        return categoryService.findCategoryById(categoryId)
                .orElse(null);
    }

    private CSVTransactionEntity getCSVTransactionEntity(Long transactionId)
    {
        return csvTransactionRepository.findById(transactionId).orElse(null);
    }

    private TransactionsEntity getTransactionEntity(String transactionId)
    {
        return transactionRepository.findTransactionByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }
}
