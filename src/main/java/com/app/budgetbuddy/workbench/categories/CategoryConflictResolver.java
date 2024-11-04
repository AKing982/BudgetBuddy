package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.CategoryService;
import io.swagger.annotations.Authorization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryConflictResolver
{
    private final CategoryService categoryService;

    @Autowired
    public CategoryConflictResolver(CategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    public Category resolveCategoryRuleConflict(Transaction transaction, List<CategoryRule> categoryRules) {
        return null;
    }
}
