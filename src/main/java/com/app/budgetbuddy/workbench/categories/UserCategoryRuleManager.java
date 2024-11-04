package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.repositories.CategoryRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class UserCategoryRuleManager
{
    private final CategoryRuleRepository categoryRuleRepository;

    @Autowired
    public UserCategoryRuleManager(CategoryRuleRepository categoryRuleRepository)
    {
        this.categoryRuleRepository = categoryRuleRepository;
    }

    public UserCategoryRule userUpdatedCategoryRule(UserCategoryRule userCategoryRule) {
        return null;
    }

    public Set<UserCategoryRule> getCategoryRulesByUserId(Long userId, List<Transaction> userTransactions) {
        return Set.of();
    }

    public void saveOverrideAsNewRule(Transaction transaction, CategoryRule categoryRule, Category category) {

    }

    public CategoryRule updateCategoryRuleForTransaction(CategoryRule categoryRule, Transaction transaction) {

        return null;
    }

    private boolean ruleMatchesTransaction(UserCategoryRule userCategoryRule, Transaction transaction) {
        return false;
    }

}
