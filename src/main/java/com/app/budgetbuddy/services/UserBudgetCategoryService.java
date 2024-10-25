package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;

import java.time.LocalDate;
import java.util.List;

public interface UserBudgetCategoryService extends ServiceModel<UserBudgetCategoryEntity>
{
    List<UserBudgetCategoryEntity> getAllUserBudgetsByUser(Long userId);

    List<UserBudgetCategoryEntity> getActiveUserBudgetCategoriesByUser(Long userId);

    List<UserBudgetCategoryEntity> getUserBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
