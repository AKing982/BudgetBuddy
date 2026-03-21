package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.Flow;

@Component
public class BudgetCategoryConverter implements Converter<BudgetCategory, BudgetCategoryEntity>
{
    private final UserService userService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public BudgetCategoryConverter(UserService userService, SubBudgetService subBudgetService)
    {
        this.userService = userService;
        this.subBudgetService = subBudgetService;
    }

    @Override
    public BudgetCategoryEntity convert(BudgetCategory userBudgetCategory)
    {
        BudgetCategoryEntity userBudgetCategoryEntity = new BudgetCategoryEntity();
        userBudgetCategoryEntity.setId(userBudgetCategory.getId());
        userBudgetCategoryEntity.setActive(true);
        if(userBudgetCategory.getUserId() != 0)
        {
            userBudgetCategoryEntity.setUser(userService.findById(userBudgetCategory.getUserId()).get());
        }
        userBudgetCategoryEntity.setBudgetedAmount(userBudgetCategory.getBudgetedAmount());
        userBudgetCategoryEntity.setActual(userBudgetCategory.getBudgetActual());
        userBudgetCategoryEntity.setStartDate(userBudgetCategory.getStartDate());
        userBudgetCategoryEntity.setEndDate(userBudgetCategory.getEndDate());
        userBudgetCategoryEntity.setSubBudget(subBudgetService.findById(userBudgetCategory.getSubBudgetId()).get());
        return userBudgetCategoryEntity;
    }

}
