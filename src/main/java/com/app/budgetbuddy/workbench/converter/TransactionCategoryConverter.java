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
        return TransactionCategory.builder()
                .categorizedDate(transactionCategoryEntity.getCategorized_date())
                .csvTransactionId(transactionCategoryEntity.getCsvTransaction().getId())
                .categorizedBy(transactionCategoryEntity.getCategorizedBy())
                .subBudgetId(transactionCategoryEntity.getSubBudget().getId())
                .category(transactionCategoryEntity.getMatchedCategory())
                .isUpdated(transactionCategoryEntity.isUpdated())
                .transactionCategoryStatus(transactionCategoryEntity.getStatus())
                .transactionId(transactionCategoryEntity.getTransaction().getId())
                .build();
    }
}
