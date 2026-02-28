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

        double monthlyBudget = budgetAmount.doubleValue();
//        log.info("Monthly Budget: " + monthlyBudget);
//        log.info("Number of Months: " + numOfMonths);
        List<String> NEED_CATEGORIES = List.of("Rent", "Utilities", "Insurance", "Groceries", "Electric", "Gas Bill", "Gas");
        List<String> INCOME_CATEGORIES = List.of("Income");
        List<String> EXCLUDED_CATEGORIES = List.of("Deposit", "Withdrawal", "Uncategorized", "Refund");
        double totalWantsAvg = 0.0;
        double totalNeedsSpending = 0.0;
        double totalIncome = 0.0;
        Map<String, Double> monthlyAverages = new HashMap<>();
        for(TransactionsByCategory transactionsByCategory : transactionsByCategories)
        {
            String category = transactionsByCategory.getCategoryName();
            if(EXCLUDED_CATEGORIES.contains(category))
            {
                continue;
            }
            double totalCategorySpending = transactionsByCategory.getTotalCategorySpending().doubleValue();
            double monthlyAverage = Math.abs(totalCategorySpending / numOfMonths);
            if(category.equalsIgnoreCase("Groceries"))
            {
                monthlyAverage = Math.min(450.00, monthlyAverage);
            }
            monthlyAverages.put(category, monthlyAverage);
            if(NEED_CATEGORIES.contains(category))
            {
                totalNeedsSpending += monthlyAverage;
            }
            else if(INCOME_CATEGORIES.contains(category))
            {
                totalIncome += monthlyAverage;
            }
            else
            {
               totalWantsAvg += monthlyAverage;
            }
        }

        double remainingBudget = Math.max(0, monthlyBudget - totalNeedsSpending);
        Map<String, Double> envelopes = calculateWantsNeedsSavingsBudget(totalNeedsSpending / monthlyBudget, remainingBudget);
        double wantsBudget = envelopes.get("Wants");
        Map<String, Double> categoryBudgetMap = new HashMap<>();
        for(Map.Entry<String, Double> entry : monthlyAverages.entrySet())
        {
            String category = entry.getKey();
            double average = entry.getValue();
            double allocated;
            if(NEED_CATEGORIES.contains(category))
            {
                if(remainingBudget == 0 && category.equalsIgnoreCase("Groceries"))
                {
                    double fixedNeedsTotal = monthlyAverages.entrySet().stream()
                            .filter(e -> NEED_CATEGORIES.contains(e.getKey()) && !e.getKey().equalsIgnoreCase("Groceries"))
                            .mapToDouble(Map.Entry::getValue)
                            .sum();
                    allocated = Math.max(0, monthlyBudget - fixedNeedsTotal);
                }
                else
                {
                    allocated = average; // already capped at 300-450 for Groceries from first pass
                }
            }
            else if(INCOME_CATEGORIES.contains(category))
            {
                allocated = Math.min(average, totalIncome);
            }
            else
            {
                double weight = (totalWantsAvg > 0) ? average / totalWantsAvg : 0.0;
                allocated = Math.min(average, weight * wantsBudget);
            }
            categoryBudgetMap.put(category, Math.round(allocated * 100.0) / 100.0);
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
        List<CategoryBudgetAmount> categoryBudgetAmounts = new ArrayList<>();
        Long userId = subBudget.getBudget().getUserId();
        LocalDate budgetStart = subBudget.getStartDate();
        log.info("Budget Start: " + budgetStart);
        BigDecimal monthlyIncome = subBudget.getAllocatedAmount();
        log.info("Monthly Income: " + monthlyIncome);
        final int numOfMonths = 6;
        Map<String, List<MonthHistory>> categoryMonthHistory = historicalDataEngine.getHistoricalMonthHistoryByCategory(numOfMonths,userId, budgetStart);
        if(categoryMonthHistory == null || categoryMonthHistory.isEmpty())
        {
            log.info("No historical data found for category budget calculation");
            LocalDate historicStart = LocalDate.now();
            HistoricalTransactionsByCategories historicalTransactionCategories = historicalDataEngine.getHistoricalTransactionCategories(userId, budgetStart);
            List<TransactionsByCategory> transactionsByCategories = historicalTransactionCategories.historicalTransactions();
            Map<String, Double> categoryBudgetMap = calculateCategoryBudget(transactionsByCategories, monthlyIncome, 1);
            categoryBudgetAmounts = categoryBudgetMap.keySet().stream()
                    .map(category -> new CategoryBudgetAmount(category, BigDecimal.valueOf(categoryBudgetMap.get(category))))
                    .toList();
            log.info("Category Budget Amounts: " + categoryBudgetAmounts);
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
                    BigDecimal totalBudgeted = filteredMonthHistories.stream()
                            .map(m -> BigDecimal.valueOf(m.totalBudgeted()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal averageBudgetedAmount = totalBudgeted.divide(BigDecimal.valueOf(filteredMonthHistories.size()), 2, RoundingMode.HALF_UP);
                    BigDecimal suggestedAmount = averageBudgetedAmount.multiply(BigDecimal.valueOf(1.10)).setScale(2, RoundingMode.HALF_UP);
                    log.info("Category: " + category + "Budgeted Amount: " + suggestedAmount);
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
