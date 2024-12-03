package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.entities.BudgetEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BudgetService extends ServiceModel<BudgetEntity>
{
    Budget loadUserBudget(Long userId);

    BudgetEntity createAndSaveBudget(BudgetCreateRequest createRequest);

    List<BudgetEntity> getBudgetByUserId(Long id);

    BigDecimal calculateTotalSpent(Long budgetId);

    BigDecimal calculateRemainingBudget(Long budgetId);

    Optional<BudgetEntity> updateBudget(Long id, BudgetCreateRequest updateRequest);


}
