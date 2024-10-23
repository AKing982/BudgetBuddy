package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.Category;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class BudgetSetupEngine
{
    public BigDecimal calculateBudgetAmountForBudget(Budget budget){
        return null;
    }

    public BigDecimal calculateBudgetAmount(Budget budget){
        return null;
    }

    public List<Category> getCategoriesPreload(Long userId){
        return null;
    }


}
