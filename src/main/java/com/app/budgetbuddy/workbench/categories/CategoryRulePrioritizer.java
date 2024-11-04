package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.UserCategoryRule;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryRulePrioritizer {

    public void setCategoryRulePriority(int priority, CategoryRule categoryRule) {

    }

    public CategoryRule findHighestPriorityRule(List<CategoryRule> categoryRules)
    {
        return null;
    }

    public int compareRulePriority(CategoryRule rule1 , CategoryRule rule2)
    {
        return 0;
    }

    public void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule) {

    }
}
