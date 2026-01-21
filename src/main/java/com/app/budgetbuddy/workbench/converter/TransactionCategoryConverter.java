package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import org.springframework.stereotype.Component;

@Component
public class TransactionCategoryConverter implements Converter<TransactionCategoryEntity, TransactionCategory>
{

    @Override
    public TransactionCategory convert(TransactionCategoryEntity transactionCategoryEntity)
    {
        String categoryName = (transactionCategoryEntity.getCategory() != null) ? transactionCategoryEntity.getCategory().getCategory() : transactionCategoryEntity.getUserCategory().getCategory();
        Long categoryId = (transactionCategoryEntity.getCategory() != null) ?  transactionCategoryEntity.getCategory().getId() : transactionCategoryEntity.getUserCategory().getId();
        return TransactionCategory.builder()
                .categorizedDate(transactionCategoryEntity.getCategorized_date())
                .csvTransactionId(transactionCategoryEntity.getCsvTransaction().getId())
                .categorizedBy(transactionCategoryEntity.getCategorizedBy())
                .category(categoryName)
                .categoryId(categoryId)
                .transactionId(transactionCategoryEntity.getTransaction().getId())
                .build();
    }
}
