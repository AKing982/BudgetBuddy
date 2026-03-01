package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Getter
@Setter
@Slf4j
public class MonthlyBudgetCategoryBuilderService extends AbstractBudgetCategoryBuilder<MonthlyBudgetCategoryCriteria, MonthlyCategorySpending>
{
    public MonthlyBudgetCategoryBuilderService(BudgetCategoryService budgetCategoryService, BudgetCalculations budgetCalculations, BudgetEstimatorService budgetEstimatorService, SubBudgetGoalsService subBudgetGoalsService)
    {
        super(budgetCategoryService, budgetCalculations, budgetEstimatorService, subBudgetGoalsService);
    }

    private Map<DateRange, BigDecimal> createDateRangeSpendingMap(final List<DateRangeSpending> dateRangeSpendingList)
    {
        return dateRangeSpendingList.stream()
                .collect(Collectors.toMap(
                        DateRangeSpending::getDateRange,
                        d -> BigDecimal.valueOf(d.getSpentOnRange()),
                        (existing, replacement) -> existing
                ));
    }

    public List<CategoryWeeklySpending> createCategoryWeeklySpending(final List<BudgetScheduleRange> budgetScheduleRanges, final List<DateRangeSpending> categoryDateRanges, final String category)
    {
        if(budgetScheduleRanges == null || budgetScheduleRanges.isEmpty() || categoryDateRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        List<CategoryWeeklySpending> categoryWeeklySpending = new ArrayList<>();
        Map<DateRange, BigDecimal> dateRangeSpendingMap = createDateRangeSpendingMap(categoryDateRanges);
        for(BudgetScheduleRange budgetWeek : budgetScheduleRanges)
        {
            LocalDate budgetWeekStart = budgetWeek.getStartRange();
            LocalDate budgetWeekEnd = budgetWeek.getEndRange();
            BigDecimal spentOnWeek = dateRangeSpendingMap.getOrDefault(new DateRange(budgetWeekStart, budgetWeekEnd), BigDecimal.ZERO);
            if(spentOnWeek.compareTo(BigDecimal.ZERO) == 0)
            {
                continue;
            }
            CategoryWeeklySpending categoryWeeklySpending1 = new CategoryWeeklySpending(category, budgetWeek, spentOnWeek.doubleValue());
            categoryWeeklySpending.add(categoryWeeklySpending1);
        }
        return categoryWeeklySpending;
    }

    @Override
    public List<BudgetCategory> buildBudgetCategoryList(final List<MonthlyBudgetCategoryCriteria> budgetCriteria)
    {
        if(budgetCriteria == null || budgetCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        log.info("Monthly Budget Category Criteria: {}", budgetCriteria);
        Map<String, BudgetCategory> uniqueBudgetCategories = new HashMap<>();
        for(MonthlyBudgetCategoryCriteria monthlyCriteria : budgetCriteria)
        {
            SubBudget subBudget = monthlyCriteria.getSubBudget();
            Long subBudgetId = subBudget.getId();
            BudgetSchedule budgetSchedule = subBudget.getBudgetSchedule().get(0);
            List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
            MonthlyCategorySpending monthlyCategorySpending = monthlyCriteria.getMonthlyCategorySpending();
            String category = monthlyCategorySpending.getCategory();
            List<Transaction> transactions = monthlyCategorySpending.getTransactions();
            // Category Spending is the overall spending for the category during the month
            BigDecimal monthlyCategorySpendingAmount = monthlyCategorySpending.getTotalCategorySpending();
            List<CategoryBudgetAmount> categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
            BigDecimal budgetedAmountForCategory = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
            List<DateRangeSpending> categoryWeeks = monthlyCategorySpending.getWeeklySpending();
            List<CategoryWeeklySpending> categoryWeeklySpendingList = createCategoryWeeklySpending(budgetScheduleRanges, categoryWeeks, category);
            for(CategoryWeeklySpending categoryWeeklySpending : categoryWeeklySpendingList)
            {
                String categoryName = categoryWeeklySpending.getCategory();
                BudgetScheduleRange budgetWeek = categoryWeeklySpending.getWeekRange();
                BigDecimal categorySpendingForWeek = BigDecimal.valueOf(categoryWeeklySpending.getSpentOnCategory());
                LocalDate budgetWeekStart = categoryWeeklySpending.getWeekRange().getStartRange();
                LocalDate budgetWeekEnd = categoryWeeklySpending.getWeekRange().getEndRange();
                List<Transaction> transactionsForWeek = filterTransactionsByBudgetWeek(transactions, budgetWeekStart, budgetWeekEnd);
                DateRange currentWeekRange = new DateRange(budgetWeekStart, budgetWeekEnd);
                String uniqueKey = categoryName + "_" +
                        budgetWeekStart.toString() + "_" +
                        budgetWeekEnd.toString();
                if(!uniqueBudgetCategories.containsKey(uniqueKey))
                {
                    BudgetCategory budgetCategory = BudgetCategory.builder()
                            .categoryName(categoryName)
                            .budgetedAmount(budgetedAmountForCategory.doubleValue())
                            .budgetActual(categorySpendingForWeek.doubleValue())
                            .startDate(budgetWeekStart)
                            .endDate(budgetWeekEnd)
                            .subBudgetId(subBudgetId)
                            .transactions(transactionsForWeek)
                            .overSpendingAmount(0.0)
                            .isOverSpent(false)
                            .isActive(true)
                            .build();
                    uniqueBudgetCategories.put(uniqueKey, budgetCategory);
                }
            }
        }
        log.info("Unique Budget Categories: {}", uniqueBudgetCategories.size());
        return new ArrayList<>(uniqueBudgetCategories.values());
    }

    @Override
    public List<MonthlyBudgetCategoryCriteria> createCategoryBudgetCriteriaList(SubBudget budget, List<MonthlyCategorySpending> categorySpendingList, SubBudgetGoals subBudgetGoals)
    {
        if(budget == null || categorySpendingList == null)
        {
            return Collections.emptyList();
        }
        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteriaList = categorySpendingList.stream()
                .map(monthlyCategorySpending -> {
                    String category = monthlyCategorySpending.getCategory();
                    return new MonthlyBudgetCategoryCriteria(category, budget, false, monthlyCategorySpending);
                })
                .toList();
        log.info("Monthly Budget Category Criteria List: {}", monthlyBudgetCategoryCriteriaList);
        return monthlyBudgetCategoryCriteriaList;
    }

    @Override
    public List<BudgetCategory> updateBudgetCategories(final List<MonthlyBudgetCategoryCriteria> budgetCriteria, final List<BudgetCategory> existingBudgetCategories)
    {
        if(budgetCriteria == null || existingBudgetCategories == null)
        {
            return Collections.emptyList();
        }
        Map<String, BudgetCategory> budgetCategoryMap = existingBudgetCategories.stream()
                .collect(Collectors.toMap(BudgetCategory::getCategoryName, bc -> bc, (bc1, bc2) -> bc1));
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        for(MonthlyBudgetCategoryCriteria monthlyCriteria : budgetCriteria)
        {
            MonthlyCategorySpending monthlyCategorySpending = monthlyCriteria.getMonthlyCategorySpending();
            String categoryName = monthlyCategorySpending.getCategory();
            BudgetCategory existingBudgetCategory = budgetCategoryMap.get(categoryName);
            if(existingBudgetCategory == null)
            {
                log.warn("No existing budget category found for category: {}. Skipping update.", categoryName);
                continue;
            }
            List<Transaction> transactions = monthlyCategorySpending.getTransactions();
            DateRange budgetCategoryDateRange = new DateRange(existingBudgetCategory.getStartDate(), existingBudgetCategory.getEndDate());
            List<DateRangeSpending> dateRangeSpending = monthlyCategorySpending.getWeeklySpending();
            Map<DateRange, Double> weeklySpendingMap = getWeeklySpendingMap(dateRangeSpending);
            double weeklySpendingAmount = weeklySpendingMap.get(budgetCategoryDateRange);
            double newBudgetCategoryActualAmount = weeklySpendingAmount + existingBudgetCategory.getBudgetActual();
            double overSpendingAmount = getBudgetOverSpending(BigDecimal.valueOf(newBudgetCategoryActualAmount), BigDecimal.valueOf(existingBudgetCategory.getBudgetedAmount()));
            Long budgetCategoryId = existingBudgetCategory.getId();
            Long subBudgetId = existingBudgetCategory.getSubBudgetId();
            double categoryBudgetAmount = existingBudgetCategory.getBudgetedAmount();
            BudgetCategory updatedBudgetCategory = createBudgetCategory(budgetCategoryId, subBudgetId, categoryName, transactions, budgetCategoryDateRange, categoryBudgetAmount,newBudgetCategoryActualAmount, overSpendingAmount);
            budgetCategories.add(updatedBudgetCategory);
        }
        return budgetCategories;
    }

    private BudgetCategory createBudgetCategory(Long budgetCategoryId, Long subBudgetId, String categoryName, List<Transaction> transactions, DateRange budgetCategoryDateRange, double budgetAmount, double budgetActual, double overSpendingAmount)
    {
        BudgetCategory budgetCategory = new BudgetCategory();
        budgetCategory.setId(budgetCategoryId);
        budgetCategory.setSubBudgetId(subBudgetId);
        budgetCategory.setCategoryName(categoryName);
        budgetCategory.setBudgetActual(budgetActual);
        budgetCategory.setBudgetedAmount(budgetAmount);
        budgetCategory.setOverSpendingAmount(overSpendingAmount);
        if(budgetActual > budgetAmount)
        {
            budgetCategory.setOverSpent(true);
        }
        budgetCategory.setOverSpent(false);
        budgetCategory.setIsActive(true);
        budgetCategory.setTransactions(transactions);
        budgetCategory.setStartDate(budgetCategoryDateRange.getStartDate());
        budgetCategory.setEndDate(budgetCategoryDateRange.getEndDate());
        return budgetCategory;
    }

    private Map<DateRange, Double> getWeeklySpendingMap(List<DateRangeSpending> dateRangeSpending)
    {
        return dateRangeSpending.stream()
                .collect(Collectors.toMap(DateRangeSpending::getDateRange,
                        DateRangeSpending::getSpentOnRange, (existing, replacement) -> existing));
    }

    private List<TransactionsByCategory> sortTransactionsByCategoryList(List<TransactionsByCategory> transactionsByCategories)
    {
        return transactionsByCategories.stream()
                .sorted(Comparator.comparing(TransactionsByCategory::getCategoryName))
                .collect(Collectors.toList());
    }

    @Override
    public List<MonthlyCategorySpending> getCategorySpending(List<TransactionsByCategory> transactionsByCategoryList, List<BudgetScheduleRange> budgetScheduleRanges)
    {
        if(transactionsByCategoryList == null || budgetScheduleRanges == null)
        {
            return Collections.emptyList();
        }
        if(transactionsByCategoryList.isEmpty() || budgetScheduleRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        List<MonthlyCategorySpending> monthlyCategorySpendingList = new ArrayList<>();
        List<TransactionsByCategory> sortedTransactionsByCategoryByCategory = sortTransactionsByCategoryList(transactionsByCategoryList);
        for(TransactionsByCategory TransactionsByCategory : sortedTransactionsByCategoryByCategory)
        {
            String category = TransactionsByCategory.getCategoryName();
            List<Transaction> allTransactions = TransactionsByCategory.getTransactions();
            if(allTransactions.isEmpty())
            {
                continue;
            }
            List<DateRangeSpending> weeklySpending = new ArrayList<>();
            double totalSpendingForCategory = 0.0;
            for(BudgetScheduleRange budgetWeek : budgetScheduleRanges)
            {
                LocalDate budgetWeekStart = budgetWeek.getStartRange();
                LocalDate budgetWeekEnd = budgetWeek.getEndRange();
                List<Transaction> transactionsForBudgetWeek = filterTransactionsByBudgetWeek(allTransactions, budgetWeekStart, budgetWeekEnd);
                double transactionSpendingForWeek = getTotalTransactionSpending(transactionsForBudgetWeek).doubleValue();
                if(transactionSpendingForWeek == 0.0)
                {
                    continue;
                }
                totalSpendingForCategory += transactionSpendingForWeek;
                DateRange budgetDateRange = new DateRange(budgetWeekStart, budgetWeekEnd);
                weeklySpending.add(new DateRangeSpending(budgetDateRange, transactionSpendingForWeek));
            }
            BigDecimal totalCategorySpending = new BigDecimal(totalSpendingForCategory).setScale(1, RoundingMode.HALF_UP);
            MonthlyCategorySpending monthlyCategorySpending = new MonthlyCategorySpending(category, totalCategorySpending, allTransactions,weeklySpending);
            monthlyCategorySpendingList.add(monthlyCategorySpending);
        }
        return monthlyCategorySpendingList;
    }

    private List<Transaction> filterTransactionsByBudgetWeek(List<Transaction> transactions, LocalDate weekStart, LocalDate weekEnd)
    {
        return transactions.stream()
                .filter(transaction -> {
                    LocalDate postedDate = transaction.getPosted();
                    return (!postedDate.isBefore(weekStart) && !postedDate.isAfter(weekEnd));
                })
                .collect(Collectors.toList());
    }

    private BigDecimal getTotalTransactionSpending(List<Transaction> transactions)
    {
        return transactions.stream()
                .map(transaction -> {
                    BigDecimal amount = transaction.getAmount();
                    // Convert negative amounts to positive
                    return amount.compareTo(BigDecimal.ZERO) < 0 ? amount.negate() : amount;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
