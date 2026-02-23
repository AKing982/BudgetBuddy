package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.CategoryBudgetAmount;
import com.app.budgetbuddy.domain.CategoryDateInfo;
import com.app.budgetbuddy.domain.MonthHistory;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import com.app.budgetbuddy.workbench.subBudget.HistoricalDataEngine;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Getter
@Slf4j
public class BudgetEstimatorService
{
    private final BudgetCategoryQueries budgetCategoryQueries;
    private final PercentageCalculator percentageCalculator;
    private final HistoricalDataEngine historicalDataEngine;
    private final CategoryService categoryService;

    @Autowired
    public BudgetEstimatorService(BudgetCategoryQueries budgetCategoryQueries,
                                  PercentageCalculator percentageCalculator,
                                  HistoricalDataEngine historicalDataEngine,
                                  CategoryService categoryService)
    {
        this.budgetCategoryQueries = budgetCategoryQueries;
        this.percentageCalculator = percentageCalculator;
        this.historicalDataEngine = historicalDataEngine;
        this.categoryService = categoryService;
    }

    private String[] getDefaultSystemCategories()
    {
        List<CategoryEntity> categoryEntities = categoryService.findAllSystemCategories();
        return categoryEntities.stream()
                .map(CategoryEntity::getCategory)
                .toArray(String[]::new);
    }

    public List<CategoryBudgetAmount> calculateBudgetCategoryAmount(final SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return Collections.emptyList();
        }
        List<CategoryBudgetAmount> categoryBudgetAmounts = new ArrayList<>();
        Long userId = subBudget.getBudget().getUserId();
        LocalDate budgetStart = subBudget.getStartDate();
        double monthlyIncome = subBudget.getAllocatedAmount().doubleValue();
        final int numOfMonths = 6;
        Map<String, List<MonthHistory>> categoryMonthHistory = historicalDataEngine.getHistoricalMonthHistoryByCategory(numOfMonths,userId, budgetStart);
        if(categoryMonthHistory == null || categoryMonthHistory.isEmpty())
        {
            List<CategoryEntity> systemCategories = categoryService.findAllSystemCategories();
            return systemCategories.stream()
                    .map(c -> {
                        try
                        {
                            String category = c.getCategory();
                            BigDecimal percentage = percentageCalculator.estimateCategoryPercentage(monthlyIncome, category);
                            BigDecimal amount = percentage.multiply(BigDecimal.valueOf(monthlyIncome)).setScale(2, RoundingMode.HALF_UP);
                            return new CategoryBudgetAmount(category, amount);
                        }catch(RuntimeException e){
                            log.error("There was an error calculating the budget category amount: ", e);
                            return null;
                        }
                    })
                    .toList();
        }
        for(Map.Entry<String, List<MonthHistory>> entry : categoryMonthHistory.entrySet())
        {
            String category = entry.getKey();
            if(category.isEmpty())
            {
                continue;
            }
            List<MonthHistory> monthHistories = entry.getValue();
            List<MonthHistory> filteredMonthHistories = monthHistories.stream()
                    .filter(m -> m.totalBudgeted() >= 0)
                    .toList();
            if(filteredMonthHistories.size() == 1)
            {
               MonthHistory monthHistory = filteredMonthHistories.get(0);
               categoryBudgetAmounts.add(new CategoryBudgetAmount(category, BigDecimal.valueOf(monthHistory.totalBudgeted())));
            }
            else
            {
                BigDecimal averageBudgetedAmount;
                BigDecimal totalBudgeted = filteredMonthHistories.stream()
                        .map(m -> BigDecimal.valueOf(m.totalBudgeted()))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                averageBudgetedAmount = totalBudgeted.divide(BigDecimal.valueOf(monthHistories.size()), 2, RoundingMode.HALF_UP);
                BigDecimal suggestedAmount = averageBudgetedAmount.multiply(BigDecimal.valueOf(1.10)).setScale(2, RoundingMode.HALF_UP);
                categoryBudgetAmounts.add(new CategoryBudgetAmount(category, suggestedAmount));
            }
        }
        return categoryBudgetAmounts;
    }

    public BigDecimal getBudgetCategoryAmountByCategory(final String category, final List<CategoryBudgetAmount> categoryBudgetAmounts)
    {
        if(category.isEmpty() || categoryBudgetAmounts.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        return categoryBudgetAmounts.stream()
                .map(categoryBudgetAmount -> {
                    String categoryName = categoryBudgetAmount.category();
                    return categoryName.equalsIgnoreCase(category) ? categoryBudgetAmount.budgetAmount() : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static double getRemainingBudgetAmount(String category, double paymentBudgetTarget, CategoryBudgetAmount[] categoryBudgetAmounts, int i, double remainingBudgetAmount)
    {
        BigDecimal paymentBudget = new BigDecimal(paymentBudgetTarget);
        CategoryBudgetAmount paymentBudgetAmount = new CategoryBudgetAmount(category, paymentBudget);
        categoryBudgetAmounts[i] = paymentBudgetAmount;
        remainingBudgetAmount -= paymentBudgetTarget;
        return remainingBudgetAmount;
    }


}
