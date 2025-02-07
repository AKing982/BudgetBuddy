package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetHealthScore;

import java.math.BigDecimal;

public interface BudgetHealthService<T>
{
    BudgetHealthScore calculateHealthScore(T budget);

    void updateBudgetHealthScore(T budget, BudgetHealthScore score);
}
