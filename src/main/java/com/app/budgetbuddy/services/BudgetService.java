package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.entities.BudgetEntity;

import java.math.BigDecimal;
import java.util.Optional;

public interface BudgetService extends ServiceModel<BudgetEntity>
{
    BudgetEntity createAndSaveBudget(BudgetCreateRequest createRequest);

    BigDecimal calculateTotalSpent(Long budgetId);

    BigDecimal calculateRemainingBudget(Long budgetId);

    Optional<BudgetEntity> updateBudget(Long id, BudgetCreateRequest updateRequest);

}
