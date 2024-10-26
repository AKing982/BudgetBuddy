package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.services.UserBudgetCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BudgetCategoryBuilder
{
    private UserBudgetCategoryService userBudgetCategoryService;

    @Autowired
    public BudgetCategoryBuilder(UserBudgetCategoryService userBudgetCategoryService)
    {
        this.userBudgetCategoryService = userBudgetCategoryService;
    }

}
