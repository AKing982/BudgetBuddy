package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;


import java.util.List;
import java.util.Map;
import java.util.Set;

public interface CategoryRuleManager
{
    CategoryRule userUpdatedCategoryRule(UserCategoryRule userCategoryRule);
    CategoryRule updateCategoryRuleForTransaction(CategoryRule categoryRule, Transaction transaction);
    Boolean ruleMatchesTransaction(CategoryRule categoryRule, Transaction transaction);

    List<UserCategoryRule> getUserCategoryRules(Long userId);
    List<CategoryRule> createCategoryRuleListFromTransactions(List<Transaction> transactions, List<RecurringTransaction> recurringTransactionDTOs);
    List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction);

    boolean validateCategoryRule(CategoryRule categoryRule);
    void saveOverrideAsNewRule(Transaction transaction, CategoryRule categoryRule, Category category);

    List<Transaction> getUncategorizedTransactions(final List<Transaction> transactions);
    List<RecurringTransaction> getUncategorizedRecurringTransactions(final List<Transaction> transactions);
    Map<CategoryRule, Double> getRuleSuccessRate();

    CategoryRule getTransactionCategoryRule(Transaction transaction);
    UserCategoryRule getTransactionUserCategoryRule(Transaction transaction);

    Set<UserCategoryRule> getCategoryRulesByUserId(Long userId, List<Transaction> userTransactions);

    Category resolveCategoryRuleConflict(Transaction transaction, List<CategoryRule> categoryRules);
    void setCategoryRulePriority(int priority, CategoryRule categoryRule);
    void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule);

    double getCategoryRuleSuccessRate(CategoryRule categoryRule);

    void notifyUserOnCategoryRuleAssignment(Transaction transaction, Category category);
}
