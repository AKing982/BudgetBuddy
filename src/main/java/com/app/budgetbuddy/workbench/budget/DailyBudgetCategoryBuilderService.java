package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class DailyBudgetCategoryBuilderService extends AbstractBudgetCategoryBuilder<DailyBudgetCategoryCriteria>
{
    @Autowired
    public DailyBudgetCategoryBuilderService(BudgetCategoryService budgetCategoryService,
                                             BudgetCalculations budgetCalculations,
                                             SubBudgetGoalsService subBudgetGoalsService, BudgetEstimatorService budgetEstimatorService)
    {
        super(budgetCategoryService, budgetCalculations, budgetEstimatorService, subBudgetGoalsService);
    }

    public List<CategoryPeriodSpending> getCategorySpendingByDate(final LocalDate date, final List<CategoryTransactions> categoryTransactions)
    {
        return null;
    }

    public DailyBudgetCategoryCriteria createBudgetCriteria(final SubBudget subBudget, final BudgetScheduleRange budgetWeek, final LocalDate currentDate, final List<CategoryPeriodSpending> categorySpendingByDate)
    {
        return null;
    }

    @Override
    protected List<BudgetCategory> initializeBudgetCategories(final SubBudget subBudget, final List<CategoryTransactions> categoryTransactions)
    {
        return List.of();
    }

    public List<BudgetCategory> buildDailyBudgetCategoryList(final DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria)
    {
        if(dailyBudgetCategoryCriteria == null)
        {
            return Collections.emptyList();
        }
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        SubBudget subBudget = dailyBudgetCategoryCriteria.getSubBudget();
        LocalDate monthStart = subBudget.getStartDate();
        LocalDate monthEnd = subBudget.getEndDate();
        LocalDate monthMiddle = monthStart.plusDays(14);
        Long subBudgetId = subBudget.getId();
        List<DailyCategorySpending> dailyCategorySpendings = dailyBudgetCategoryCriteria.getCategorySpendingByDate();
        if(dailyCategorySpendings == null || dailyCategorySpendings.isEmpty())
        {
            return Collections.emptyList();
        }
        CategoryBudgetAmount[] categoryBudgetAmounts = getBudgetEstimatorService().calculateBudgetCategoryAmount(subBudget);
        for(DailyCategorySpending dailyCategorySpending : dailyCategorySpendings)
        {
            String categorySpendingName = dailyCategorySpending.getCategory();
            double categorySpendingAmount = dailyCategorySpending.getCategorySpending().doubleValue();
            List<Transaction> transactions = dailyCategorySpending.getTransactions();
            LocalDate currentDate = dailyCategorySpending.getCurrentDate();
            DateRange dateRange = new DateRange();
            if(categorySpendingName.equals("Rent"))
            {
                setDateRangeByMonthParameters(monthStart, monthMiddle, monthEnd, currentDate, dateRange);
            }
            else
            {
                dateRange.setStartDate(currentDate);
                dateRange.setEndDate(currentDate);
            }
            log.info("Category Budget Amounts: {}", categoryBudgetAmounts.length);
            log.info("Category spending name: {}", categorySpendingName);
            BigDecimal categoryAmount = getBudgetEstimatorService().getBudgetCategoryAmountByCategory(categorySpendingName, categoryBudgetAmounts);
            double budgetAmountForCategory = categoryAmount.doubleValue();
            BudgetCategory budgetCategory = createBudgetCategory(subBudgetId, categorySpendingName, dateRange, transactions, categorySpendingAmount, budgetAmountForCategory,  0.0, false);
            budgetCategories.add(budgetCategory);
        }
        return budgetCategories;
    }

    private void setDateRangeByMonthParameters(LocalDate monthStart, LocalDate middleMonth, LocalDate monthEnd, LocalDate currentDate, DateRange dateRange)
    {
        // If current date is in the first two weeks
        if(currentDate.isBefore(middleMonth))
        {
            dateRange.setStartDate(currentDate);
            dateRange.setEndDate(middleMonth);
        }
        // else if the current date is in the last two weeks
        else if(currentDate.isAfter(middleMonth) || currentDate.isBefore(monthEnd))
        {
            dateRange.setStartDate(currentDate);
            dateRange.setEndDate(monthEnd);
        }
    }

    @Override
    protected List<BudgetCategory> buildBudgetCategoryList(final List<DailyBudgetCategoryCriteria> budgetCriteria)
    {
        // This method is not implemented
        return List.of();
    }

    public List<BudgetCategory> updateBudgetCategoriesByDate(final DailyBudgetCategoryCriteria dailyBudgetCriteria, final List<BudgetCategory> existingBudgetCategories)
    {
//        if(dailyBudgetCriteria == null)
//        {
//            return Collections.emptyList();
//        }
//        List<BudgetCategory> budgetCategories = new ArrayList<>();
//        List<DailyCategorySpending> categorySpendingListForDate = dailyBudgetCriteria.getCategorySpendingByDate();
//        if(categorySpendingListForDate == null || categorySpendingListForDate.isEmpty() || existingBudgetCategories.isEmpty())
//        {
//            return Collections.emptyList();
//        }
//        for(DailyCategorySpending categorySpending : categorySpendingListForDate)
//        {
//            String categorySpendingName = categorySpending.getCategory();
//            BigDecimal categorySpendingAmount = categorySpending.getCategorySpending();
//            List<Transaction> transactions = categorySpending.getTransactions();
//            for(BudgetCategory budgetCategory : existingBudgetCategories)
//            {
//                if(budgetCategory.getCategoryName().equals(categorySpendingName))
//                {
//                    double categorySpendingAsDouble = categorySpendingAmount.doubleValue();
//                    budgetCategory.setBudgetActual(categorySpendingAsDouble);
//                    budgetCategory.setTransactions(transactions);
//                    budgetCategories.add(budgetCategory);
//                }
//                else
//                {
//                    log.warn("No Budget Category was found with the category name: {}", categorySpendingName);
//                }
//            }
//        }
//        return budgetCategories;
        return null;
    }

    @Override
    protected List<BudgetCategory> updateBudgetCategories(final List<DailyBudgetCategoryCriteria> dailyBudgetCriteria)
    {
        // This method is not implemented for Daily
        return List.of();
    }

}
