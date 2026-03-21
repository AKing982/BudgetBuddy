package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface BudgetCategoryService extends ServiceModel<BudgetCategoryEntity>
{
    List<BudgetCategoryEntity> getAllBudgetCategoriesByUser(Long userId);

    List<BudgetCategoryEntity> getActiveBudgetCategoriesByUser(Long userId);

    List<BudgetCategory> updateBudgetCategories(Map<Long, String> budgetCategoriesToUpdate);

    boolean existsByCategoryDateRange(String category, LocalDate dateStart, LocalDate dateEnd, Long subBudgetId);
    List<BudgetCategoryEntity> getBudgetCategoriesByBudgetId(Long budgetId);
    List<BudgetCategoryEntity> getBudgetCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<BudgetCategoryEntity> getBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    List<BudgetCategory> getBudgetCategoryListByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<BudgetCategory> getBudgetCategoriesByDate(Long subBudgetId, LocalDate currentDate, LocalDate startDate, LocalDate endDate);

    List<BudgetCategory> saveAll(List<BudgetCategory> budgetCategories);

    List<BudgetCategory> getBudgetCategoriesByUserId(Long userId);

    List<Object[]> getHistoricalMonthStatsByCategory(Long userId, LocalDate startDate, LocalDate endDate);

    List<Object[]> getHistoricalMonthHistoryByCategory(Long userId, LocalDate startDate, LocalDate endDate);

    void updateBudgetCategoryAmount(String category, Long userId, LocalDate startDate, LocalDate endDate, BigDecimal amount);

    Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
