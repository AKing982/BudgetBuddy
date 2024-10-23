package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.Category;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class BudgetSetupEngine
{

    public BigDecimal initializeBudgetExpenses(){
        return null;
    }

    public Map<Long, List<Category>> loadTopBudgetExpenseCategories(){
        return null;
    }

    public BigDecimal calculateInitialSavingsData(){
        return null;
    }

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
