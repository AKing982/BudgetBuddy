package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BudgetCalculator
{
    private final BudgetService budgetService;
    private final BudgetGoalsService budgetGoalsService;

    @Autowired
    public BudgetCalculator(BudgetService budgetService,
                            BudgetGoalsService budgetGoalsService){
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
    }

    public BigDecimal calculateTotalBudgetedAmountForCategory(Category category, Long budgetId){
        return null;
    }

    public BigDecimal calculateActualBudgetedAmountForCategory(Category category, Long budgetId){
        return null;
    }

    public BigDecimal calculateRemainingBudgetAmountForCategory(Category category, Long budgetId){
        return null;
    }
}
