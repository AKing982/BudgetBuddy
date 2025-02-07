package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.ExpenseCategory;
import com.app.budgetbuddy.domain.IncomeCategory;
import com.app.budgetbuddy.domain.SavingsCategory;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class SubBudgetMonthOverviewServiceImpl implements SubBudgetOverviewService
{
    private final TransactionCategoryService transactionCategoryService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public SubBudgetMonthOverviewServiceImpl(TransactionCategoryService transactionCategoryService,
                                             SubBudgetService subBudgetService)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.subBudgetService = subBudgetService;
    }

    @Override
    public List<IncomeCategory> loadIncomeCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {

        return List.of();
    }

    @Override
    public List<ExpenseCategory> loadExpenseCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        return List.of();
    }

    @Override
    public List<SavingsCategory> loadSavingsCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        return List.of();
    }
}
