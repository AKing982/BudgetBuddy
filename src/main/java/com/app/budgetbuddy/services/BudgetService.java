package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.entities.BudgetEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetService extends ServiceModel<BudgetEntity>
{
    Budget loadUserBudget(Long userId);

    Budget loadUserBudgetForPeriod(Long userId, LocalDate startDate, LocalDate endDate);

    Optional<Budget> loadBudgetByUserIdAndYear(Long userId, Integer year);

    BudgetEntity createAndSaveBudget(BudgetCreateRequest createRequest);

    List<BudgetEntity> getBudgetByUserId(Long id);

    BigDecimal calculateTotalSpent(Long budgetId);

    BigDecimal calculateRemainingBudget(Long budgetId);

    Optional<BudgetEntity> saveBudget(Budget budget);

    Optional<BudgetEntity> saveBudgetEntity(BudgetEntity budgetEntity);

//    Optional<BudgetEntity> updateBudget(Long id, BudgetCreateRequest updateRequest);

    Budget convertBudgetEntity(BudgetEntity budgetEntity);

    Optional<BudgetEntity> updateBudget(Budget budget);

    boolean validateBudgetExistsForYear(Long userId, Integer year);

    List<BudgetEntity> getBudgetsByUserIdAndYear(Long userId, int year);

}
