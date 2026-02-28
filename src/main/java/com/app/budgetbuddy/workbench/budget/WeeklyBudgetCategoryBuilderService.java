package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@Getter
@Setter
public class WeeklyBudgetCategoryBuilderService extends AbstractBudgetCategoryBuilder<WeeklyBudgetCategoryCriteria, WeeklyCategorySpending>
{
    @Autowired
    public WeeklyBudgetCategoryBuilderService(BudgetCategoryService budgetCategoryService,
                                              BudgetCalculations budgetCalculations,
                                              BudgetEstimatorService budgetEstimatorService,
                                              SubBudgetGoalsService subBudgetGoalsService)
    {
        super(budgetCategoryService, budgetCalculations, budgetEstimatorService, subBudgetGoalsService);
    }

    @Override
    public List<WeeklyBudgetCategoryCriteria> createCategoryBudgetCriteriaList(SubBudget budget,
                                                                               List<WeeklyCategorySpending> categorySpendingList,
                                                                               SubBudgetGoals subBudgetGoals)
    {
        // subBudgetGoals unused for weekly
        return createWeeklyBudgetCategoryCriteria(budget, categorySpendingList);
    }

    @Override
    public List<BudgetCategory> updateBudgetCategories(List<WeeklyBudgetCategoryCriteria> budgetCriteria, List<BudgetCategory> existingBudgetCategories)
    {
        return updateWeeklyBudgetCategories(existingBudgetCategories, budgetCriteria);
    }

    @Override
    public List<WeeklyCategorySpending> getCategorySpending(List<TransactionsByCategory> transactionsByCategory, List<BudgetScheduleRange> budgetScheduleRanges)
    {
        if(budgetScheduleRanges == null || budgetScheduleRanges.isEmpty()) return Collections.emptyList();
        BudgetScheduleRange range = budgetScheduleRanges.get(0);
        return getWeeklyCategorySpending(range.getStartRange(), range.getEndRange(), transactionsByCategory);
    }

    public List<WeeklyCategorySpending> getWeeklyCategorySpending(final LocalDate weekStart, final LocalDate weekEnd, final List<TransactionsByCategory> transactionsByCategory)
    {
        if(weekStart == null || weekEnd == null)
        {
            return Collections.emptyList();
        }
        if(transactionsByCategory == null || transactionsByCategory.isEmpty())
        {
            return Collections.emptyList();
        }
        List<WeeklyCategorySpending> weeklyCategorySpendings = new ArrayList<>();
        for(TransactionsByCategory transactionsByCategory1 : transactionsByCategory)
        {
            String categoryName = transactionsByCategory1.getCategoryName();
            List<Transaction> transactions = transactionsByCategory1.getTransactions();
            if(transactions == null || transactions.isEmpty())
            {
                continue;
            }
            BigDecimal categorySpending = transactions.stream()
                    .filter(Objects::nonNull)
                    .map(Transaction::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            DateRange weekRange = DateRange.createDateRange(weekStart, weekEnd);
            WeeklyCategorySpending weeklyCategorySpending = new WeeklyCategorySpending(categoryName, categorySpending, transactions, weekRange);
            weeklyCategorySpendings.add(weeklyCategorySpending);
        }
        return weeklyCategorySpendings;
    }

    public BigDecimal getEstimatedWeeklyBudgetedAmount(final SubBudget subBudget, DateRange dateRange, final String category)
    {
        List<CategoryBudgetAmount> categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
        return budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
    }

    public List<BudgetCategory> buildBudgetCategoryList(final List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList)
    {
        if(weeklyBudgetCategoryCriteriaList == null || weeklyBudgetCategoryCriteriaList.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BudgetCategory> budgetCategoryList = new ArrayList<>();
        for(WeeklyBudgetCategoryCriteria weeklyBudgetCategoryCriteria : weeklyBudgetCategoryCriteriaList)
        {
            WeeklyCategorySpending weeklyCategorySpending = weeklyBudgetCategoryCriteria.getWeeklyCategorySpending();
            if(weeklyCategorySpending == null)
            {
                log.warn("Skipping category: {} - weekly category spending is null", weeklyBudgetCategoryCriteria.getCategory());
                continue;
            }
            String categoryName = weeklyCategorySpending.getCategory();
            BigDecimal weeklySpending = weeklyCategorySpending.getTotalCategorySpending();
            SubBudget subBudget = weeklyBudgetCategoryCriteria.getSubBudget();
            DateRange weekRange = weeklyCategorySpending.getWeekRange();
            List<Transaction> transactions = weeklyCategorySpending.getTransactions();
            BigDecimal budgetedAmount = getEstimatedWeeklyBudgetedAmount(subBudget, weekRange, categoryName);
            BudgetCategory budgetCategory = BudgetCategory.builder()
                    .budgetActual(weeklySpending.doubleValue())
                    .subBudgetId(subBudget.getId())
                    .budgetedAmount(budgetedAmount.doubleValue())
                    .isActive(true)
                    .startDate(weekRange.getStartDate())
                    .endDate(weekRange.getEndDate())
                    .overSpendingAmount(0.0)
                    .isOverSpent(false)
                    .transactions(transactions)
                    .categoryName(categoryName)
                    .build();
            budgetCategoryList.add(budgetCategory);
        }
        return budgetCategoryList;
    }

    public List<BudgetCategory> updateWeeklyBudgetCategories(List<BudgetCategory> existingBudgetCategories, List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteria)
    {
        if(existingBudgetCategories == null || existingBudgetCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        if(weeklyBudgetCategoryCriteria == null || weeklyBudgetCategoryCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
//        Map<String, WeeklyBudgetCategoryCriteria> criteriaMap = weeklyBudgetCategoryCriteria.stream()
//                .collect(Collectors.toMap(
//                        WeeklyBudgetCategoryCriteria::getCategory,
//                        Function.identity(),
//                        (existing, replacement) -> replacement));
//        List<BudgetCategory> updatedBudgetCategories = new ArrayList<>();
//        for(BudgetCategory budgetCategory : existingBudgetCategories)
//        {
//            WeeklyBudgetCategoryCriteria criteria = criteriaMap.get(budgetCategory.getCategoryName());
//            if(criteria != null)
//            {
//                WeeklyCategorySpending weeklyCategorySpending = criteria.getWeeklyCategorySpending();
//                if(weeklyCategorySpending != null)
//                {
//                    BigDecimal weeklySpending = weeklyCategorySpending.getTotalCategorySpending();
//                    budgetCategory.setBudgetActual(weeklySpending.doubleValue());
//                }
//                if(budgetCategory.getBudgetActual() != null && budgetCategory.getBudgetedAmount() != null)
//                {
//                    double overSpending = budgetCategory.getBudgetActual() - budgetCategory.getBudgetedAmount();
//                    if(overSpending > 0)
//                    {
//                        budgetCategory.setOverSpendingAmount(overSpending);
//                        budgetCategory.setOverSpent(true);
//                    }
//                    else
//                    {
//                        budgetCategory.setOverSpendingAmount(0.0);
//                        budgetCategory.setOverSpent(false);
//                    }
//                }
//
//            }
//            updatedBudgetCategories.add(budgetCategory);
//        }
//        return updatedBudgetCategories;
        return null;
    }

    public List<WeeklyBudgetCategoryCriteria> createWeeklyBudgetCategoryCriteria(final SubBudget subBudget, final List<WeeklyCategorySpending> weeklyCategorySpendings)
    {
        if(weeklyCategorySpendings == null)
        {
            return Collections.emptyList();
        }
//        return weeklyCategorySpendings.stream()
//                .map(weeklyCategorySpending -> {
//                    String category = weeklyCategorySpending.getCategory();
//                    return WeeklyBudgetCategoryCriteria.createWeeklyBudgetCategoryCriteria(category, weeklyCategorySpending, subBudget, true);
//                })
//                .toList();
        return null;
    }
}
