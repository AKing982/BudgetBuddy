package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.entities.BudgetEntity;

import java.math.BigDecimal;

public interface BudgetService extends ServiceModel<BudgetEntity>
{
    BudgetEntity createAndSaveBudget(BudgetCreateRequest createRequest);

    BigDecimal calculateTotalSpent(Long budgetId);

    BigDecimal calculateRemainingBudget(Long budgetId);

}
