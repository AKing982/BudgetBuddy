package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TransactionRuleToEntityConverter implements Converter<TransactionRule, TransactionRuleEntity>
{
    private final UserRepository userRepository;

    @Autowired
    public TransactionRuleToEntityConverter(UserRepository userRepository)
    {
        this.userRepository = userRepository;
    }

    @Override
    public TransactionRuleEntity convert(TransactionRule transactionRule) {
        return TransactionRuleEntity.builder()
                .id(transactionRule.getId())
                .user(getUserById(transactionRule.getUserId()))
                .descriptionRule(transactionRule.getDescriptionRule())
                .merchantRule(transactionRule.getMerchantRule())
                .amountMax(transactionRule.getAmountMax())
                .amountMin(transactionRule.getAmountMin())
                .category(transactionRule.getCategoryName())
                .isActive(transactionRule.isActive())
                .extendedDescriptionRule(transactionRule.getExtendedDescriptionRule())
                .priority(transactionRule.getPriority())
                .transactionType(transactionRule.getTransactionType())
                .dateCreated(transactionRule.getDateCreated())
                .dateModified(transactionRule.getDateModified())
                .build();
    }

    private UserEntity getUserById(Long userId)
    {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with id " + userId + " not found"));
    }
}
