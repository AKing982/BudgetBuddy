package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
public class BudgetCategoryModelConverter implements Converter<BudgetCategoryEntity, BudgetCategory>
{

    @Override
    public BudgetCategory convert(BudgetCategoryEntity budgetCategoryEntity)
    {
        BudgetCategory budgetCategory = new BudgetCategory();
        budgetCategory.setId(budgetCategoryEntity.getId());
        budgetCategory.setSubBudgetId(budgetCategoryEntity.getSubBudget().getId());
        budgetCategory.setCategoryName(budgetCategoryEntity.getCategoryName());
        budgetCategory.setBudgetedAmount(budgetCategoryEntity.getBudgetedAmount());
        budgetCategory.setBudgetActual(budgetCategoryEntity.getActual());
        budgetCategory.setEndDate(budgetCategoryEntity.getEndDate());
        budgetCategory.setStartDate(budgetCategoryEntity.getStartDate());
        budgetCategory.setIsActive(budgetCategoryEntity.isActive());
        budgetCategory.setOverSpendingAmount(budgetCategoryEntity.getOverspendingAmount());
        budgetCategory.setOverSpent(budgetCategoryEntity.getIsOverSpent());
        budgetCategory.setUserId(budgetCategoryEntity.getUser().getId());
        return budgetCategory;
    }
}
