package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;


import java.util.List;
import java.util.Map;
import java.util.Set;

public interface CategoryRuleManager
{
    CategoryRule userUpdatedCategoryRule(UserCategoryRule userCategoryRule);
    CategoryRule updateCategoryRuleForTransaction(CategoryRule categoryRule);
    Boolean isCategoryRuleMatchForTransaction(CategoryRule categoryRule, Transaction transaction);

    List<UserCategoryRule> getUserCategoryRules(Long userId);
    Set<CategoryRule> createCategoryRuleListFromTransactions(List<Transaction> transactions, List<RecurringTransactionDTO> recurringTransactionDTOs);
    List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction);

    boolean validateCategoryRule(CategoryRule categoryRule);
    void saveOverrideAsNewRule(Transaction transaction, CategoryRule categoryRule, Category category);

    Map<CategoryRule, Double> getRuleSuccessRate();

    CategoryRule getTransactionCategoryRule(Transaction transaction);
    UserCategoryRule getTransactionUserCategoryRule(Transaction transaction);

    Category resolveCategoryRuleConflict(Transaction transaction, List<CategoryRule> categoryRules);
    void setCategoryRulePriority(int priority, CategoryRule categoryRule);
    void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule);

    double getCategoryRuleSuccessRate(CategoryRule categoryRule);

    void notifyUserOnCategoryRuleAssignment(Transaction transaction, Category category);
}
