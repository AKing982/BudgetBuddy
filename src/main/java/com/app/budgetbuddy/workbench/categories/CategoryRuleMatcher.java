package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoryRuleMatcher
{
    private CategoryRuleService categoryRuleService;
    private CategoryService categoryService;
    private List<UserCategoryRule> userCategoryRules;
    private List<CategoryRule> systemCategoryRules;

    @Autowired
    public CategoryRuleMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService)
    {
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
        this.userCategoryRules = new ArrayList<UserCategoryRule>();
        this.systemCategoryRules = new ArrayList<>();
    }

    /**
     * Loads all the non user defined category rules from the database
     */
    public void loadCategoryRules()
    {

    }

    /**
     * Loads the user category rules by a particular userId
     * @param userId
     */
    public void loadUserCategoryRules(Long userId)
    {

    }

    public String categorizeTransactionByCustomRule(Transaction transaction, UserCategoryRule userCategoryRule)
    {
        return null;
    }

    public String categorizeTransaction(Transaction transaction)
    {
        return "";
    }

    private boolean matchesRule(Transaction transaction, CategoryRule categoryRule)
    {
        return false;
    }

    public List<CategoryRule> getMatchingCategoryRulesForTransaction(Transaction transaction)
    {
        return null;
    }
}
