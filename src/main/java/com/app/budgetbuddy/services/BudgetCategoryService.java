package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BudgetCategoryService extends ServiceModel<BudgetCategoryEntity>
{
    List<BudgetCategoryEntity> getAllBudgetCategoriesByUser(Long userId);

    List<BudgetCategoryEntity> getActiveBudgetCategoriesByUser(Long userId);

    List<BudgetCategory> updateBudgetCategories(Map<Long, String> budgetCategoriesToUpdate);

    BigDecimal getTotalCSVIncomesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId);
    BigDecimal getTotalIncomesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId);

    BigDecimal getTotalCSVExpensesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId);
    BigDecimal getTotalExpensesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId);
    BigDecimal getTotalExpensesByDateRange(Long subBudgetId, LocalDate startDate, LocalDate endDate);
    BigDecimal getTotalIncomeByDateRange(Long subBudgetId, LocalDate startDate, LocalDate endDate);
    BigDecimal getBudgetCategorySpendingByDateRange(String category, LocalDate startDate, LocalDate endDate, Long subBudgetId);
    boolean existsByCategoryDateRange(String category, LocalDate dateStart, LocalDate dateEnd, Long subBudgetId);
    List<BudgetCategoryEntity> getBudgetCategoriesByBudgetId(Long budgetId);
    List<BudgetCategoryEntity> getBudgetCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<BudgetCategoryEntity> getBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    List<BudgetCategory> getBudgetCategoryListByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate);
    List<BudgetCategory> getBudgetCategoriesByDate(Long subBudgetId, LocalDate currentDate, LocalDate startDate, LocalDate endDate);
    List<BudgetCategory> getBudgetCategoriesByDateRange(LocalDate startDate, LocalDate endDate, Long userId);

    List<BudgetCategory> getBudgetCategorySpendingByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId);

    Optional<BudgetCategoryEntity> findBudgetCategoryById(Long id);
    List<BudgetCategory> saveAll(List<BudgetCategory> budgetCategories);

    List<BudgetCategory> getBudgetCategoriesByUserId(Long userId);

    List<Object[]> getHistoricalMonthStatsByCategory(Long userId, LocalDate startDate, LocalDate endDate);

    List<Object[]> getHistoricalMonthHistoryByCategory(Long userId, LocalDate startDate, LocalDate endDate);

    void updateBudgetCategoryAmount(String category, Long userId, LocalDate startDate, LocalDate endDate, BigDecimal amount);

    Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}
