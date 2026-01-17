package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@Getter
@Setter
public class WeeklyBudgetCategoryBuilderService
{
    private final BudgetEstimatorService budgetEstimatorService;

    @Autowired
    public WeeklyBudgetCategoryBuilderService(BudgetEstimatorService budgetEstimatorService)
    {
        this.budgetEstimatorService = budgetEstimatorService;
    }

    public List<WeeklyCategorySpending> getWeeklyCategorySpending(final LocalDate weekStart, final LocalDate weekEnd, final List<TransactionsByCategory> transactionsByCategory)
    {
        if(weekStart == null ||  transactionsByCategory == null)
        {
            return Collections.emptyList();
        }
        List<WeeklyCategorySpending> weeklyCategorySpendings = new ArrayList<>();
        for(TransactionsByCategory transactionsByCategory1 : transactionsByCategory)
        {
            String categoryName = transactionsByCategory1.getCategoryName();
            List<Transaction> transactions = transactionsByCategory1.getTransactions();
            BigDecimal categorySpending = transactions.stream()
                    .filter(e -> (!e.getPosted().isAfter(weekEnd) && !e.getPosted().isBefore(weekStart)))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            DateRange weekRange = DateRange.createDateRange(weekStart, weekEnd);
            WeeklyCategorySpending weeklyCategorySpending = new WeeklyCategorySpending(categoryName, categorySpending, transactions, weekRange);
            weeklyCategorySpendings.add(weeklyCategorySpending);
        }
        return weeklyCategorySpendings;
    }

    public List<BudgetCategory> buildBudgetCategoryList(final List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList)
    {
        return weeklyBudgetCategoryCriteriaList.stream()
                .map(weeklyBudgetCategoryCriteria -> {
                    WeeklyCategorySpending weeklyCategorySpending = weeklyBudgetCategoryCriteria.getWeeklyCategorySpending();
                    SubBudget subBudget = weeklyBudgetCategoryCriteria.getSubBudget();
                    String category = weeklyCategorySpending.getCategory();
                    CategoryBudgetAmount[] categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
                    BigDecimal budgetedAmount = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
                    List<Transaction> transactions = weeklyCategorySpending.getTransactions();
                    BigDecimal categorySpending = weeklyCategorySpending.getTotalCategorySpending();
                    DateRange weekRange = weeklyCategorySpending.getWeekRange();
                    double overSpending = 0.0;
                    boolean isOverSpending = false;
                    if(budgetedAmount != null && categorySpending.doubleValue() > budgetedAmount.doubleValue())
                    {
                        isOverSpending = true;
                        overSpending = categorySpending.doubleValue() - budgetedAmount.doubleValue();
                    }
                    return BudgetCategory.builder()
                            .budgetActual(categorySpending.doubleValue())
                            .subBudgetId(subBudget.getId())
                            .budgetedAmount(budgetedAmount.doubleValue())
                            .isActive(true)
                            .startDate(weekRange.getStartDate())
                            .endDate(weekRange.getEndDate())
                            .overSpendingAmount(overSpending)
                            .isOverSpent(isOverSpending)
                            .transactions(transactions)
                            .categoryName(category)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<BudgetCategory> updateBudgetCategories(List<BudgetCategory> existingBudgetCategories, List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteria)
    {
        if(existingBudgetCategories == null || existingBudgetCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        Map<String, WeeklyBudgetCategoryCriteria> criteriaMap = weeklyBudgetCategoryCriteria.stream()
                .collect(Collectors.toMap(
                        WeeklyBudgetCategoryCriteria::getCategory,
                        Function.identity(),
                        (existing, replacement) -> replacement));
        List<BudgetCategory> updatedBudgetCategories = new ArrayList<>();
        for(BudgetCategory budgetCategory : existingBudgetCategories)
        {
            WeeklyBudgetCategoryCriteria criteria = criteriaMap.get(budgetCategory.getCategoryName());
            if(criteria != null)
            {
                WeeklyCategorySpending weeklyCategorySpending = criteria.getWeeklyCategorySpending();
                if(weeklyCategorySpending != null)
                {
                    BigDecimal weeklySpending = weeklyCategorySpending.getTotalCategorySpending();
                    budgetCategory.setBudgetActual(weeklySpending.doubleValue());
                }
                if(budgetCategory.getBudgetActual() != null && budgetCategory.getBudgetedAmount() != null)
                {
                    double overSpending = budgetCategory.getBudgetActual() - budgetCategory.getBudgetedAmount();
                    if(overSpending > 0)
                    {
                        budgetCategory.setOverSpendingAmount(overSpending);
                        budgetCategory.setOverSpent(true);
                    }
                    else
                    {
                        budgetCategory.setOverSpendingAmount(0.0);
                        budgetCategory.setOverSpent(false);
                    }
                }

            }
            updatedBudgetCategories.add(budgetCategory);
        }
        return updatedBudgetCategories;
    }

    public List<WeeklyBudgetCategoryCriteria> createWeeklyBudgetCategoryCriteria(final SubBudget subBudget, final List<WeeklyCategorySpending> weeklyCategorySpendings)
    {
        if(weeklyCategorySpendings == null)
        {
            return Collections.emptyList();
        }
        return weeklyCategorySpendings.stream()
                .map(weeklyCategorySpending -> {
                    String category = weeklyCategorySpending.getCategory();
                    return WeeklyBudgetCategoryCriteria.createWeeklyBudgetCategoryCriteria(category, weeklyCategorySpending, subBudget, true);
                })
                .toList();
    }
}
