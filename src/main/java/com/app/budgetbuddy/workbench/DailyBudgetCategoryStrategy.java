package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.DailyBudgetCategoryBuilderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DailyBudgetCategoryStrategy implements BudgetCategoryBuilderStrategy
{
    private final DailyBudgetCategoryBuilderService dailyBuilder;

    @Autowired
    public DailyBudgetCategoryStrategy(DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService)
    {
        this.dailyBuilder = dailyBudgetCategoryBuilderService;
    }

    @Override
    public boolean supports(Period period)
    {
        return period == Period.DAILY;
    }

    @Override
    public List<BudgetCategory> build(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, BudgetScheduleRange budgetScheduleRange)
    {
        LocalDate currentDate = LocalDate.now();
        List<DailyCategorySpending> dailyCategorySpendingList = dailyBuilder.getCategorySpendingByDate(currentDate, transactionsByCategory);
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = dailyBuilder.createDailyBudgetCriteria(subBudget, budgetScheduleRange, currentDate, dailyCategorySpendingList);
        return dailyBuilder.buildDailyBudgetCategoryList(dailyBudgetCategoryCriteria);
    }

    @Override
    public List<BudgetCategory> update(SubBudget subBudget, List<TransactionsByCategory> transactionsByCategory, List<BudgetCategory> existingBudgetCategories, BudgetScheduleRange budgetScheduleRange)
    {
        LocalDate currentDate = LocalDate.now();
        List<DailyCategorySpending> dailyCategorySpendingList = dailyBuilder.getCategorySpendingByDate(currentDate, transactionsByCategory);
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = dailyBuilder.createDailyBudgetCriteria(subBudget, budgetScheduleRange, currentDate, dailyCategorySpendingList);
        return dailyBuilder.updateBudgetCategoriesByDate(dailyBudgetCategoryCriteria, existingBudgetCategories);
    }
}
