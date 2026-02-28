package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.MonthlyBudgetCategoryBuilderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MonthlyBudgetCategoryStrategy implements BudgetCategoryBuilderStrategy
{
    private final MonthlyBudgetCategoryBuilderService monthlyBuilder;

    @Autowired
    public MonthlyBudgetCategoryStrategy(MonthlyBudgetCategoryBuilderService monthlyBuilder)
    {
        this.monthlyBuilder = monthlyBuilder;
    }

    @Override
    public boolean supports(Period period)
    {
        return period == Period.MONTHLY;
    }

    private BudgetSchedule getBudgetSchedule(SubBudget subBudget)
    {
        return subBudget.getBudgetSchedule().get(0);
    }

    @Override
    public List<BudgetCategory> build(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, BudgetScheduleRange budgetScheduleRange)
    {
        BudgetSchedule budgetSchedule = getBudgetSchedule(subBudget);
        SubBudgetGoals goals = subBudget.getSubBudgetGoals();
        List<BudgetScheduleRange> ranges = budgetSchedule.getBudgetScheduleRanges();
        List<MonthlyCategorySpending> spending = monthlyBuilder.getCategorySpending(transactionsByCategory, ranges);
        List<MonthlyBudgetCategoryCriteria> criteria = monthlyBuilder.createCategoryBudgetCriteriaList(subBudget, spending, goals);
        return monthlyBuilder.buildBudgetCategoryList(criteria);
    }

    @Override
    public List<BudgetCategory> update(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, List<BudgetCategory> existingBudgetCategories, BudgetScheduleRange budgetScheduleRange)
    {
        BudgetSchedule budgetSchedule = getBudgetSchedule(subBudget);
        SubBudgetGoals goals = subBudget.getSubBudgetGoals();
        List<BudgetScheduleRange> ranges = budgetSchedule.getBudgetScheduleRanges();
        List<MonthlyCategorySpending> spending = monthlyBuilder.getCategorySpending(transactionsByCategory, ranges);
        List<MonthlyBudgetCategoryCriteria> criteria = monthlyBuilder.createCategoryBudgetCriteriaList(subBudget, spending, goals);
        return monthlyBuilder.updateBudgetCategories(criteria, existingBudgetCategories);
    }
}
