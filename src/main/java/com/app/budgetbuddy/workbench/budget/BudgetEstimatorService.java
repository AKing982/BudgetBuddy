package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserCategoryService;
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
    private final UserCategoryService userCategoryService;
    private final double VARIABLE_EXPENSE_RATIO = 0.30;
    private final Map<String, double[]> CATEGORY_BUDGET_RATIO_MAP = Map.of(
            "Groceries", new double[]{0.15, 0.175, 0.20}
    );

    @Autowired
    public BudgetEstimatorService(BudgetCategoryQueries budgetCategoryQueries,
                                  HistoricalDataEngine historicalDataEngine,
                                  CategoryService categoryService,
                                  UserCategoryService userCategoryService)
    {
        this.budgetCategoryQueries = budgetCategoryQueries;
        this.historicalDataEngine = historicalDataEngine;
        this.categoryService = categoryService;
        this.userCategoryService = userCategoryService;
    }

    private double getGroceryBudgetRatio(double monthlyBudget) {
        if(monthlyBudget < 2000) return 0.20;
        else if(monthlyBudget < 5000) return 0.175;
        else return 0.15;
    }

    private double calculateVariableCategoryBudget(String category, double spending, double monthlyBudget)
    {
        double categoryBudget = spending - (spending * VARIABLE_EXPENSE_RATIO);
        if(CATEGORY_BUDGET_RATIO_MAP.containsKey(category))
        {
            double ratio = 0.0;
            if(category.equals("Groceries"))
            {
                ratio = getGroceryBudgetRatio(monthlyBudget); // dynamically picks the right ratio
            }
            double targetAllocation = monthlyBudget * ratio;
            categoryBudget = Math.min(categoryBudget, targetAllocation);
        }
        return categoryBudget;
    }

    private Map<Integer, List<TransactionsByCategory>> sortTransactionsByCategoryByPriority(
            List<TransactionsByCategory> transactionsByCategories)
    {
        return transactionsByCategories.stream()
                .collect(Collectors.groupingBy(t ->
                                t.getPriority() != null
                                        ? t.getPriority().getOrder()
                                        : CategoryPriorityLevel.LEVEL_5.getOrder(),
                        TreeMap::new,  // TreeMap guarantees ascending key order
                        Collectors.toList()));
    }

    /**
     * This method calculate the budget for expense transactions by categories which does not include non-expenses like income, withdrawals, or deposits.
     * This should calculate the category budget for default and custom user categories
     * @param transactionsByCategories
     * @param monthlyBudget
     * @return
     */
    public Map<String, Double> calculateStandardCategoryBudget(final List<TransactionsByCategory> transactionsByCategories, final BigDecimal monthlyBudget)
    {
        if(transactionsByCategories == null || transactionsByCategories.isEmpty())
        {
            return Collections.emptyMap();
        }
        if(monthlyBudget == null)
        {
            throw new DataException("Budget Amount cannot be null");
        }
        Map<String, Double> categoryBudgetMap = new HashMap<>();
        double remainingMonthlyBudget = monthlyBudget.doubleValue();
        Map<Integer, List<TransactionsByCategory>> transactionsByCategoryMap = sortTransactionsByCategoryByPriority(transactionsByCategories);
        for(Map.Entry<Integer, List<TransactionsByCategory>> entry : transactionsByCategoryMap.entrySet())
        {
            List<TransactionsByCategory> transactionsByCategoryList = entry.getValue();
            for(TransactionsByCategory transactionsByCategory : transactionsByCategoryList)
            {
                String category = transactionsByCategory.getCategoryName();
                CategoryExpenseType categoryType = transactionsByCategory.getCategoryExpenseType();
                BigDecimal totalCategorySpending = transactionsByCategory.getTotalCategorySpending();
                if(remainingMonthlyBudget <= 0)
                {
                    categoryBudgetMap.put(category, 0.0);
                    continue;
                }
                switch(categoryType){
                    case FIXED -> {
                        double spending = totalCategorySpending.doubleValue();
                        double fixed_allocated = Math.min(spending, remainingMonthlyBudget);
                        remainingMonthlyBudget -= fixed_allocated;
                        categoryBudgetMap.put(category, fixed_allocated);
                    }
                    case VARIABLE -> {
                        double allocated = calculateVariableCategoryBudget(
                                category,
                                totalCategorySpending.doubleValue(),
                                monthlyBudget.doubleValue());
                        allocated = Math.min(allocated, remainingMonthlyBudget); // cap at what's left
                        remainingMonthlyBudget -= allocated;                     // deduct only once
                        categoryBudgetMap.put(category, allocated);
                    }
                }
            }
        }
        return categoryBudgetMap;
    }

    private Map<String, Double> calculateWantsNeedsSavingsBudget(final double needsRatio, double monthlyBudget)
    {
        Map<String, Double> wantsNeedsSavingsBudgetMap = new HashMap<>();
        double needsPercent, wantsPercent, savingsPercent;
        if(needsRatio <= 0.5){
            needsPercent = 0.5; wantsPercent = 0.30; savingsPercent = 0.20;
        }else if(needsRatio <= 0.60){
            needsPercent = 0.6; wantsPercent = 0.20; savingsPercent = 0.20;
        }else {
            needsPercent = 0.7; wantsPercent = 0.20; savingsPercent = 0.10;
        }
        double needsBudget = needsPercent * monthlyBudget;
        double wantsBudget = wantsPercent * monthlyBudget;
        double savingsBudget = savingsPercent * monthlyBudget;
        wantsNeedsSavingsBudgetMap.put("Needs", needsBudget);
        wantsNeedsSavingsBudgetMap.put("Wants", wantsBudget);
        wantsNeedsSavingsBudgetMap.put("Savings", savingsBudget);
        return wantsNeedsSavingsBudgetMap;
    }

    public List<CategoryBudgetAmount> optimizeBudgetCategoryAmounts(final List<BudgetCategory> existingBudgetCategories, final SubBudget subBudget)
    {
        return null;
    }

    public Optional<CategoryBudgetAmount> optimizeBudgetCategoryAmount(final BudgetCategory budgetCategory, final SubBudget subBudget)
    {
        return Optional.empty();
    }

    public List<CategoryBudgetAmount> calculateBudgetCategoryAmount(final SubBudget subBudget)
    {
        if(subBudget == null)
        {
            return Collections.emptyList();
        }
        List<CategoryBudgetAmount> categoryBudgetAmounts;
        Long userId = subBudget.getBudget().getUserId();
        LocalDate budgetStart = subBudget.getStartDate();
        log.info("Budget Start: " + budgetStart);
        BigDecimal monthlyIncome = subBudget.getAllocatedAmount();
        log.info("Monthly Income: " + monthlyIncome);
        final int numOfMonths = 6;
        log.info("No historical data found for category budget calculation");
        List<TransactionsByCategory> historicalTransactionCategories = historicalDataEngine.getHistoricalTransactionsByCategories(userId, budgetStart, numOfMonths);
        Map<String, Double> categoryBudgetMap = calculateStandardCategoryBudget(historicalTransactionCategories, monthlyIncome);
        categoryBudgetAmounts = categoryBudgetMap.keySet().stream()
                .map(category -> new CategoryBudgetAmount(category, BigDecimal.valueOf(categoryBudgetMap.get(category))))
                .toList();
        log.info("Category Budget Amounts: " + categoryBudgetAmounts);
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
