package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import com.app.budgetbuddy.workbench.subBudget.HistoricalDataEngine;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Getter
@Slf4j
public class BudgetEstimatorService
{
    private final BudgetCategoryQueries budgetCategoryQueries;
    private final HistoricalDataEngine historicalDataEngine;
    private final CategoryService categoryService;

    @Autowired
    public BudgetEstimatorService(BudgetCategoryQueries budgetCategoryQueries,
                                  HistoricalDataEngine historicalDataEngine,
                                  CategoryService categoryService)
    {
        this.budgetCategoryQueries = budgetCategoryQueries;
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


    public Map<String, Double> calculateCategoryBudget(final List<TransactionsByCategory> transactionsByCategories, final BigDecimal budgetAmount, final int numOfMonths)
    {
        if(transactionsByCategories == null || transactionsByCategories.isEmpty())
        {
            return Collections.emptyMap();
        }
        if(budgetAmount == null)
        {
            throw new DataException("Budget Amount cannot be null");
        }
        Map<String, Double> categoryBudgetMap = new HashMap<>();
        double monthlyBudget = budgetAmount.doubleValue();
        log.info("Monthly Budget: " + monthlyBudget);
        log.info("Number of Months: " + numOfMonths);
        List<String> NEED_CATEGORIES = List.of("Rent", "Utilities", "Insurance", "Groceries");
        List<String> SAVINGS_CATEGORY = List.of("Savings");
        List<String> EXCLUDED_CATEGORIES = List.of("Deposit", "Withdrawal");
        double totalNeedsSpending = 0.0;
        double totalWantsSpending = 0.0;
        double totalSavingsSpending = 0.0;
        Map<String, Double> monthlyAverages = new HashMap<>();
        for(TransactionsByCategory transactionsByCategory : transactionsByCategories)
        {
            String category = transactionsByCategory.getCategoryName();
            if(EXCLUDED_CATEGORIES.contains(category))
            {
                continue;
            }
            double totalCategorySpending = transactionsByCategory.getTotalCategorySpending().doubleValue();
            log.info("Category: " + category + " - Total Spending: " + totalCategorySpending);
            double monthlyAverage = Math.abs(transactionsByCategory.getTotalCategorySpending().doubleValue() / numOfMonths);
            log.info("Category: " + category + " - Monthly Average: " + monthlyAverage);
            monthlyAverages.put(category, monthlyAverage);
            if(NEED_CATEGORIES.contains(category))
            {
                totalNeedsSpending += monthlyAverage;
            }
            else if(SAVINGS_CATEGORY.contains(category))
            {
                totalSavingsSpending += monthlyAverage;
            }
            else
            {
                totalWantsSpending += monthlyAverage;
            }
        }

        double needsRatio = totalNeedsSpending / monthlyBudget;
        double needsPercent, wantsPercent, savingsPercent;
        if(needsRatio <= 0.5){
            needsPercent = 0.5; wantsPercent = 0.30; savingsPercent = 0.20;
        }else if(needsRatio <= 0.60){
            needsPercent = 0.6; wantsPercent = 0.40; savingsPercent = 0.20;
        }else{
            needsPercent = 0.7; wantsPercent = 0.20; savingsPercent = 0.10;
        }
        double needsBudget = needsPercent * monthlyBudget;
        double wantsBudget = wantsPercent * monthlyBudget;
        double savingsBudget = savingsPercent * monthlyBudget;

        for(Map.Entry<String, Double> entry : monthlyAverages.entrySet())
        {
            String category = entry.getKey();
            double averageSpending = entry.getValue();
            double allocated;
            if(NEED_CATEGORIES.contains(category))
            {
                double share = (totalNeedsSpending > 0) ? averageSpending / totalNeedsSpending : 0.0;
                double proportionalShare = share * needsBudget;
                allocated = Math.max(proportionalShare, averageSpending);
            }
            else if(SAVINGS_CATEGORY.contains(category))
            {
                double share = (totalSavingsSpending > 0) ? averageSpending / totalSavingsSpending : 0.0;
                allocated = share * savingsBudget;
            }
            else
            {
                double share = (totalWantsSpending > 0) ? averageSpending / totalWantsSpending : 0.0;
                allocated    = Math.min(averageSpending, share * wantsBudget);
            }
            log.info("Category: " + category + " - Allocated: " + (allocated * 100.0 / 100.0));
            categoryBudgetMap.put(category, Math.round(allocated * 100.0) / 100.0);
        }
        return categoryBudgetMap;
    }

    private boolean isNeedCategory(TransactionsByCategory transactionsByCategory)
    {
        String name = transactionsByCategory.getCategoryName();
        return name.contains("Rent") || name.contains("Groceries") || name.contains("Utilities") || name.contains("Electric");
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
        BigDecimal monthlyIncome = subBudget.getAllocatedAmount();
        final int numOfMonths = 6;
        Map<String, List<MonthHistory>> categoryMonthHistory = historicalDataEngine.getHistoricalMonthHistoryByCategory(numOfMonths,userId, budgetStart);
        if(categoryMonthHistory == null || categoryMonthHistory.isEmpty())
        {
            List<TransactionsByCategory> transactionsByCategories = historicalDataEngine.getHistoricalTransactionCategories(userId, budgetStart);
            Map<String, Double> categoryBudgetMap = calculateCategoryBudget(transactionsByCategories, monthlyIncome, numOfMonths);
            categoryBudgetAmounts = categoryBudgetMap.keySet().stream()
                    .map(category -> new CategoryBudgetAmount(category, BigDecimal.valueOf(categoryBudgetMap.get(category))))
                    .toList();
        }
        else
        {
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
