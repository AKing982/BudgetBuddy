package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;

import java.time.LocalDate;
import java.util.List;

public interface BudgetCategoryService extends ServiceModel<BudgetCategoryEntity>
{
    List<BudgetCategoryEntity> getAllBudgetCategoriesByUser(Long userId);

    List<BudgetCategoryEntity> getActiveBudgetCategoriesByUser(Long userId);

    List<BudgetCategoryEntity> getBudgetCategoriesByBudgetId(Long budgetId);
    List<BudgetCategoryEntity> getBudgetCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<BudgetCategoryEntity> getBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    List<BudgetCategory> getBudgetCategoryListByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<BudgetCategory> getBudgetCategoriesByDate(Long subBudgetId, LocalDate currentDate, LocalDate startDate, LocalDate endDate);

    List<BudgetCategory> saveAll(List<BudgetCategory> budgetCategories);

    Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
