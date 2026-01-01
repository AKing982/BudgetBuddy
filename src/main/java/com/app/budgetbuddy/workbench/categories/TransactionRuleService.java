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

    List<TransactionRuleEntity> findByUserId(Long userId);

    List<TransactionRule> getConvertedCategoryRules(List<TransactionRuleEntity> categoryRuleEntities);

    TransactionRule createCategoryRuleFromEntity(TransactionRuleEntity categoryRuleEntity);

    List<TransactionRuleEntity> findAllSystemCategoryRules();

    List<TransactionRule> getSystemCategoryRules();

    CSVTransactionRule createCSVTransactionRuleFromEntity(TransactionRuleEntity csvTransactionRuleEntity);

    List<CSVTransactionRule> findCSVTransactionRulesByUserId(Long userId);

    List<UserCategoryRule> getUserCategoryRules(Long userId);
}
