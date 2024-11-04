package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import org.hibernate.annotations.SecondaryRow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CategoryRuleRunner
{
    private CategoryRuleEngine categoryRuleEngine;

    @Autowired
    public CategoryRuleRunner(CategoryRuleEngine categoryRuleEngine)
    {
        this.categoryRuleEngine = categoryRuleEngine;
    }

}
