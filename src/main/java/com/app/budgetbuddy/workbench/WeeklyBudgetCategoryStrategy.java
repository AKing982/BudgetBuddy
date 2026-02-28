package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.WeeklyBudgetCategoryBuilderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class WeeklyBudgetCategoryStrategy implements BudgetCategoryBuilderStrategy
{
    private final WeeklyBudgetCategoryBuilderService weeklyBuilder;

    @Autowired
    public WeeklyBudgetCategoryStrategy(WeeklyBudgetCategoryBuilderService weeklyBuilder)
    {
        this.weeklyBuilder = weeklyBuilder;
    }

    @Override
    public boolean supports(Period period)
    {
        return period == Period.WEEKLY;
    }

    @Override
    public List<BudgetCategory> build(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, BudgetScheduleRange budgetScheduleRange)
    {
        LocalDate weekStart = budgetScheduleRange.getStartRange();
        LocalDate weekEnd   = budgetScheduleRange.getEndRange();
        List<WeeklyCategorySpending> spending = weeklyBuilder.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategory);
        List<WeeklyBudgetCategoryCriteria> criteria = weeklyBuilder.createWeeklyBudgetCategoryCriteria(subBudget, spending);
        return weeklyBuilder.buildBudgetCategoryList(criteria);
    }

    @Override
    public List<BudgetCategory> update(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, List<BudgetCategory> existingBudgetCategories, BudgetScheduleRange budgetScheduleRange)
    {
        LocalDate weekStart = budgetScheduleRange.getStartRange();
        LocalDate weekEnd   = budgetScheduleRange.getEndRange();
        List<WeeklyCategorySpending> spending = weeklyBuilder.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategory);
        List<WeeklyBudgetCategoryCriteria> criteria = weeklyBuilder.createWeeklyBudgetCategoryCriteria(subBudget, spending);
        return weeklyBuilder.updateBudgetCategories(criteria, existingBudgetCategories);
    }
}
