package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CSVTransactionRule;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.services.ServiceModel;

import java.util.List;
import java.util.Optional;

public interface TransactionRuleService extends ServiceModel<TransactionRuleEntity>
{
    TransactionRuleEntity create(TransactionRule transactionRule);

    Optional<TransactionRuleEntity> findById(Long id);

    void createAll(List<TransactionRule> categoryRules);

    List<TransactionRule> findByUserId(Long userId);

    List<TransactionRule> getConvertedCategoryRules(List<TransactionRuleEntity> categoryRuleEntities);

    TransactionRule createCategoryRuleFromEntity(TransactionRuleEntity categoryRuleEntity);

    List<TransactionRule> getSystemCategoryRules();

    void updateTransactionRule(TransactionRule transactionRule);

    void updateTransactionRuleActiveStatus(boolean active, Long ruleId, Long userId);

    void updateMatchCount(Long ruleId, int matchCount);
}
