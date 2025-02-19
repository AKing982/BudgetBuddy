package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoricalBudgetDataService
{
    private final HistoricalBudgetsService historicalBudgetsService;

    @Autowired
    public HistoricalBudgetDataService(HistoricalBudgetsService historicalBudgetsService)
    {
        this.historicalBudgetsService = historicalBudgetsService;
    }

    public Optional<BudgetHealthScore> createBudgetHealthScoreForMonth(int year, int month, Long userId)
    {
        return null;
    }

    public void runBudgetHistoricalProcess(int year, int month, Long userId)
    {
        // 1. Validate against the year and month and determine if this matches any budget period
        // If there is no budget that runs through the year and month, then
        // Run the historical budget process
        // Else return if the year and month has a budget

        // 4. Next Build the Sub Budget for this period

        // 5. Save the Sub Budgets to the database

        // 6. Build the Monthly Budget Goal

        // 7. Build the Budget Stats

        // 8. Build the IncomeCategory Overview

        // 9. Build the Expense Category Overview

        // 10. Build the Top 5 Expense Categories Overview

        // 11. Build the Budget Period Categories
    }

    public Optional<Budget> buildBudgetTemplateForYear(int year, Long userId)
    {
        return null;
    }

    public void saveSubBudgetTemplates(final List<SubBudget> subBudgets)
    {

    }

    public void saveBudgetTemplate(final Budget budget)
    {

    }

    public Optional<SubBudget> buildSubBudgetTemplateForMonth(int month, int year, Long userId)
    {
        return null;
    }

    public Optional<MonthlyBudgetGoals> buildMonthlyBudgetGoalsForMonth(int month, int year, Long userId)
    {
        return null;
    }

    public Optional<BudgetStats> buildBudgetStatsForMonth(int month, int year, Long userId) {
        return null;
    }

    public Optional<IncomeCategory> buildIncomeCategoryOverviewForMonth(int month, int year, Long userId)
    {
        return null;
    }

    public Optional<ExpenseCategory> buildExpenseCategoryOverviewForMonth(int month, int year, Long userId)
    {
        return null;
    }

    public List<ExpenseCategory> buildTopExpenseCategoriesForMonth(int month, int year, Long userId)
    {
        return null;
    }

    public List<BudgetPeriodCategory> buildBudgetPeriodCategoriesForMonth(int month, int year, Long userId)
    {
        return null;
    }

}
