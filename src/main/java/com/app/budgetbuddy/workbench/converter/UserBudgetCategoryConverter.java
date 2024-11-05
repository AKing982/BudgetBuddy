package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.UserBudgetCategory;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserBudgetCategoryConverter implements Converter<UserBudgetCategory, UserBudgetCategoryEntity>
{
    private final CategoryService categoryService;

    @Autowired
    public UserBudgetCategoryConverter(CategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    @Override
    public UserBudgetCategoryEntity convert(UserBudgetCategory userBudgetCategory) {
        UserBudgetCategoryEntity userBudgetCategoryEntity = new UserBudgetCategoryEntity();
        userBudgetCategoryEntity.setId(userBudgetCategory.getId());
        userBudgetCategoryEntity.setIsactive(true);
        userBudgetCategoryEntity.setBudgetedAmount(userBudgetCategory.getBudgetedAmount());
        userBudgetCategoryEntity.setActual(userBudgetCategory.getBudgetActual());
        userBudgetCategoryEntity.setStartDate(userBudgetCategory.getStartDate());
        userBudgetCategoryEntity.setEndDate(userBudgetCategory.getEndDate());
        userBudgetCategoryEntity.setCategory(getCategoryById(userBudgetCategory.getCategoryId()));
        return userBudgetCategoryEntity;
    }

    private CategoryEntity getCategoryById(String categoryId)
    {
        if(categoryId.isEmpty())
        {
            return null;
        }
        return categoryService.findCategoryById(categoryId)
                .orElse(null);
    }
}
