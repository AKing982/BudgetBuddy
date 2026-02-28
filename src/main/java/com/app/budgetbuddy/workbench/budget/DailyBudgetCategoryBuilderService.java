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
import java.util.function.Function;

@Service
@Slf4j
public class DailyBudgetCategoryBuilderService extends AbstractBudgetCategoryBuilder<DailyBudgetCategoryCriteria, DailyCategorySpending>
{
    @Autowired
    public DailyBudgetCategoryBuilderService(BudgetCategoryService budgetCategoryService,
                                             BudgetCalculations budgetCalculations,
                                             SubBudgetGoalsService subBudgetGoalsService,
                                             BudgetEstimatorService budgetEstimatorService)
    {
        super(budgetCategoryService, budgetCalculations, budgetEstimatorService, subBudgetGoalsService);
    }

    @Override
    public List<DailyCategorySpending> getCategorySpending(List<TransactionsByCategory> transactionsByCategory,
                                                           List<BudgetScheduleRange> budgetScheduleRanges)
    {
        // Daily doesn't use schedule ranges — delegate to date-based method
        return getCategorySpendingByDate(transactionsByCategory, LocalDate.now());
    }

    @Override
    public List<BudgetCategory> updateBudgetCategories(List<DailyBudgetCategoryCriteria> budgetCriteria,
                                                       List<BudgetCategory> existingBudgetCategories)
    {
        if(budgetCriteria == null || budgetCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        return updateBudgetCategoriesByDate(budgetCriteria.get(0), existingBudgetCategories);
    }

    @Override
    public List<BudgetCategory> buildBudgetCategoryList(List<DailyBudgetCategoryCriteria> budgetCriteria)
    {
        if(budgetCriteria == null || budgetCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        // Daily criteria is always a single criteria object containing all spending
        return buildDailyBudgetCategoryList(budgetCriteria.get(0));
    }

    @Override
    public List<DailyBudgetCategoryCriteria> createCategoryBudgetCriteriaList(SubBudget budget,
                                                                              List<DailyCategorySpending> categorySpendingList,
                                                                              SubBudgetGoals subBudgetGoals)
    {
        // Daily doesn't use SubBudgetGoals — subBudgetGoals will be null
        if(budget == null || categorySpendingList == null)
        {
            return Collections.emptyList();
        }
        return categorySpendingList.stream()
                .map(spending -> {
                    DailyBudgetCategoryCriteria criteria = new DailyBudgetCategoryCriteria();
                    criteria.setSubBudget(budget);
                    criteria.setCategory(spending.getCategory());
                    criteria.setDate(spending.getCurrentDate());
                    criteria.setActive(true);
                    criteria.setCategorySpendingByDate(categorySpendingList);
                    return criteria;
                })
                .toList();
    }

    public List<DailyCategorySpending> getCategorySpendingByDate(final LocalDate date, final List<TransactionsByCategory> categoryTransactions)
    {
        if(date == null || categoryTransactions == null || categoryTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        List<DailyCategorySpending> dailyCategorySpendingList = new ArrayList<>();
        for(TransactionsByCategory transactionsByCategory : categoryTransactions)
        {
            String category = transactionsByCategory.getCategoryName();
            if(category.isEmpty())
            {
                continue;
            }
            List<Transaction> transactions = transactionsByCategory.getTransactions();
            BigDecimal categorySpending = transactions.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            DailyCategorySpending dailyCategorySpending = new DailyCategorySpending(category, categorySpending, transactions, date);
            dailyCategorySpendingList.add(dailyCategorySpending);
        }
        return dailyCategorySpendingList;
    }

    public DailyBudgetCategoryCriteria createDailyBudgetCriteria(final SubBudget subBudget, final BudgetScheduleRange budgetWeek, final LocalDate currentDate, final List<DailyCategorySpending> categorySpendingByDate)
    {
        if(subBudget == null || budgetWeek == null || currentDate == null || categorySpendingByDate == null)
        {
            throw new IllegalArgumentException("subBudget and budgetWeek and currentDate are null");
        }
        LocalDate weekStart = budgetWeek.getStartRange();
        LocalDate weekEnd = budgetWeek.getEndRange();
        if(currentDate.isBefore(weekStart) || currentDate.isAfter(weekEnd))
        {
            throw new RuntimeException("Current date is outside the week range: " + weekStart + " - " + weekEnd);
        }
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        for(DailyCategorySpending dailyCategorySpending : categorySpendingByDate)
        {
            String category = dailyCategorySpending.getCategory();
            LocalDate currDate = dailyCategorySpending.getCurrentDate();
            if(currDate.equals(currentDate))
            {
                dailyBudgetCategoryCriteria.setCategory(category);
                dailyBudgetCategoryCriteria.setDate(currDate);
                dailyBudgetCategoryCriteria.setSubBudget(subBudget);
                dailyBudgetCategoryCriteria.setActive(true);
                dailyBudgetCategoryCriteria.setCategorySpendingByDate(categorySpendingByDate);
            }
        }
        return dailyBudgetCategoryCriteria;
    }

    public List<BudgetCategory> buildDailyBudgetCategoryList(final DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria)
    {
        if(dailyBudgetCategoryCriteria == null)
        {
            log.warn("Daily Budget Criteria is null....Returning an empty array");
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
        List<CategoryBudgetAmount> categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
        for(DailyCategorySpending dailyCategorySpending : dailyCategorySpendings)
        {
            String categorySpendingName = dailyCategorySpending.getCategory();
            double categorySpendingAmount = dailyCategorySpending.getTotalCategorySpending().doubleValue();
            List<Transaction> transactions = dailyCategorySpending.getTransactions();
            if(transactions == null)
            {
                transactions = new ArrayList<>();
            }
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
            log.info("Category Budget Amounts: {}", categoryBudgetAmounts.size());
            log.info("Category spending name: {}", categorySpendingName);
            BigDecimal categoryAmount = budgetEstimatorService.getBudgetCategoryAmountByCategory(categorySpendingName, categoryBudgetAmounts);
            log.info("Category amount {} for category {}", categoryAmount, categorySpendingName);
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

    public List<BudgetCategory> updateBudgetCategoriesByDate(final DailyBudgetCategoryCriteria dailyBudgetCriteria, final List<BudgetCategory> existingBudgetCategories)
    {
        if(dailyBudgetCriteria == null)
        {
            return Collections.emptyList();
        }
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        List<DailyCategorySpending> categorySpendingListForDate = dailyBudgetCriteria.getCategorySpendingByDate();
        if(categorySpendingListForDate == null || categorySpendingListForDate.isEmpty() || existingBudgetCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        for(DailyCategorySpending categorySpending : categorySpendingListForDate)
        {
            String categorySpendingName = categorySpending.getCategory();
            BigDecimal categorySpendingAmount = categorySpending.getTotalCategorySpending();
            List<Transaction> transactions = categorySpending.getTransactions();
            for(BudgetCategory budgetCategory : existingBudgetCategories)
            {
                if(budgetCategory.getCategoryName().equals(categorySpendingName))
                {
                    double budgetCategoryActualSpent = budgetCategory.getBudgetActual();
                    budgetCategoryActualSpent += categorySpendingAmount.doubleValue();
                    budgetCategory.setBudgetActual(budgetCategoryActualSpent);
                    budgetCategory.setTransactions(transactions);
                    budgetCategories.add(budgetCategory);
                }
                else
                {
                    log.warn("No Budget Category was found with the category name: {}", categorySpendingName);
                }
            }
        }
        return budgetCategories;
    }
}
