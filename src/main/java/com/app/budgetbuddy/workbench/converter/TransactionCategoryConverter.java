package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TransactionCategoryConverter implements Converter<TransactionCategory, TransactionCategoryEntity>
{
    private final CategoryService categoryService;

    @Autowired
    public TransactionCategoryConverter(CategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    @Override
    public TransactionCategoryEntity convert(TransactionCategory userBudgetCategory) {
        TransactionCategoryEntity userBudgetCategoryEntity = new TransactionCategoryEntity();
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
