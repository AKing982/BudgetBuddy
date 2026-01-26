package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import org.springframework.stereotype.Component;

@Component
public class TransactionRuleConverter implements Converter<TransactionRuleEntity, TransactionRule>
{

    @Override
    public TransactionRule convert(TransactionRuleEntity transactionRuleEntity) {
        return TransactionRule.builder()
                .id(transactionRuleEntity.getId())
                .amountMax(transactionRuleEntity.getAmountMax())
                .amountMin(transactionRuleEntity.getAmountMin())
                .descriptionRule(transactionRuleEntity.getDescriptionRule())
                .priority(transactionRuleEntity.getPriority())
                .merchantRule(transactionRuleEntity.getMerchantRule())
                .extendedDescriptionRule(transactionRuleEntity.getExtendedDescriptionRule())
                .isActive(transactionRuleEntity.isActive())
                .categoryName(transactionRuleEntity.getCategory())
                .userId(transactionRuleEntity.getUser().getId())
                .dateCreated(transactionRuleEntity.getDateCreated())
                .dateModified(transactionRuleEntity.getDateModified())
                .build();
    }
}
