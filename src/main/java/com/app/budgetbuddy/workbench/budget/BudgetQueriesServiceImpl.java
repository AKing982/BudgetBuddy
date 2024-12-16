package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetQueriesServiceImpl implements BudgetQueriesService
{

    @Override
    public List<BudgetCategory> getTopExpenseBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getIncomeBudgetCategory(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getSavingsBudgetCategory(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getExpensesBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public BigDecimal getTotalBudgeted(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

    @Override
    public BigDecimal getRemainingOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

    @Override
    public BigDecimal getTotalSpentOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

}
