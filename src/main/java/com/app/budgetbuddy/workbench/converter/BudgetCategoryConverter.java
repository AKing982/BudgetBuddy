package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BudgetCategoryConverter implements Converter<BudgetCategory, BudgetCategoryEntity>
{
    private final CategoryService categoryService;

    @Autowired
    public BudgetCategoryConverter(CategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    @Override
    public BudgetCategoryEntity convert(BudgetCategory userBudgetCategory) {
        BudgetCategoryEntity userBudgetCategoryEntity = new BudgetCategoryEntity();
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
