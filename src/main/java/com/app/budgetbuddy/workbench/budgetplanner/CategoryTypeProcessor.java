package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * This class manages budget category data into different types such as income category,
 * variable expenses, fixed expenses and more.
 */

@Service
public class CategoryTypeProcessor
{
    private List<IncomeCategory> incomeCategoryList = new ArrayList<>();
    private List<ExpenseCategory> expenseCategoryList = new ArrayList<>();
    private List<SavingsCategory> savingsCategoryList = new ArrayList<>();

    public Map<String, List<IncomeCategory>> createIncomeCategoriesByDateRange(List<BudgetCategory> budgetCategories)
    {
        return null;
    }

    public Map<String, List<ExpenseCategory>> createFixedExpenseCategoriesByDateRange(List<BudgetCategory> budgetCategories)
    {
        return null;
    }

    public Map<String, List<ExpenseCategory>> createVariableExpenseCategoriesByDateRange(List<BudgetCategory> budgetCategories)
    {
        return null;
    }

    public Map<String, List<SavingsCategory>> createSavingsCategoriesByDateRange(List<BudgetCategory> budgetCategories)
    {
        return null;
    }
}
