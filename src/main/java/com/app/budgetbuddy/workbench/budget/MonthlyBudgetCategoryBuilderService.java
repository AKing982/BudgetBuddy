package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MonthlyBudgetCategoryBuilderService extends AbstractBudgetCategoryBuilder<MonthlyBudgetCategoryCriteria>
{
    public MonthlyBudgetCategoryBuilderService(BudgetCategoryService budgetCategoryService, BudgetCalculations budgetCalculations, BudgetEstimatorService budgetEstimatorService, SubBudgetGoalsService subBudgetGoalsService)
    {
        super(budgetCategoryService, budgetCalculations, budgetEstimatorService, subBudgetGoalsService);
    }

    //TODO: Move this method to the orchestrator class to use
    public List<BudgetCategory> initializeBudgetCategories(final SubBudget budget, final List<CategoryTransactions> categoryDesignators)
    {
        if(budget == null || categoryDesignators == null)
        {
            return Collections.emptyList();
        }
        SubBudgetGoals subBudgetGoals = getSubBudgetGoalsService().getSubBudgetGoalsEntitiesBySubBudgetId(budget.getId());
        BudgetSchedule budgetSchedule = budget.getBudgetSchedule().get(0);
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        List<MonthlyCategorySpending> monthlyCategorySpending = getMonthlyCategorySpending(categoryDesignators, budgetScheduleRanges);
        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = createMonthlyCategoryBudgetCriteriaList(budget,monthlyCategorySpending, subBudgetGoals);
        return buildBudgetCategoryList(monthlyBudgetCategoryCriteria);
    }

    private List<CategoryWeeklySpending> createCategoryWeeklySpending(final List<BudgetScheduleRange> budgetScheduleRanges, final List<DateRangeSpending> categoryDateRanges, final String category)
    {
        List<CategoryWeeklySpending> categoryWeeklySpending = new ArrayList<>();
        for(DateRangeSpending dateRange : categoryDateRanges)
        {
            LocalDate dateRangeStart = dateRange.getDateRange().getStartDate();
            LocalDate dateRangeEnd = dateRange.getDateRange().getEndDate();
            double spentOnRange = dateRange.getSpentOnRange();
            boolean matchFound = false;
            for(BudgetScheduleRange budgetWeek : budgetScheduleRanges)
            {
                LocalDate budgetWeekStart = budgetWeek.getStartRange();
                LocalDate budgetWeekEnd = budgetWeek.getEndRange();
                BigDecimal actualSpentOnBudgetWeek = budgetWeek.getSpentOnRange();
                boolean exactMatch = dateRangeStart.equals(budgetWeekStart) && dateRangeEnd.equals(budgetWeekEnd);
                if(exactMatch)
                {
                    // Set the total category spending for this week
                    CategoryWeeklySpending categoryWeeklySpending1 = new CategoryWeeklySpending(category, budgetWeek, spentOnRange);
                    categoryWeeklySpending.add(categoryWeeklySpending1);
                    matchFound = true;
                }
            }
            if(!matchFound)
            {
                log.warn("No matching budget schedule range found for category date range: {} to {}",
                        dateRangeStart, dateRangeEnd);
            }
        }
 //       Note: This preserves the relationship while providing a sorted view
        return categoryWeeklySpending.stream()
                .sorted(Comparator.comparing(CategoryWeeklySpending::getCategory)
                        .thenComparing(cws -> cws.getBudgetWeek().getStartRange()))
                .collect(Collectors.toList());
    }

    @Override
    protected List<BudgetCategory> buildBudgetCategoryList(final List<MonthlyBudgetCategoryCriteria> budgetCriteria)
    {
        if(budgetCriteria == null || budgetCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        Set<BudgetCategory> budgetCategories = new HashSet<>();
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
            BigDecimal categorySpending = monthlyCategorySpending.getTotalCategorySpending();
            CategoryBudgetAmount[] categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
            BigDecimal budgetedAmountForCategory = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
            //TODO: Need to know when the category spending took place
            List<DateRangeSpending> categoryWeeks = monthlyCategorySpending.getWeeklySpending();
            //TODO: Need to track how much of the category spending was spent during each category week
            List<CategoryWeeklySpending> categoryWeeklySpendingList = createCategoryWeeklySpending(budgetScheduleRanges, categoryWeeks, category);
            log.info("Filtered Budget Schedule Ranges size: {}", categoryWeeklySpendingList.size());
            for(CategoryWeeklySpending categoryWeeklySpending : categoryWeeklySpendingList)
            {
                String categoryName = categoryWeeklySpending.getCategory();
                BudgetScheduleRange budgetWeek = categoryWeeklySpending.getBudgetWeek();
                BigDecimal categorySpendingForWeek = BigDecimal.valueOf(categoryWeeklySpending.getSpentOnCategory());
                log.info("Budget Week: {}", budgetWeek.toString());
                LocalDate budgetWeekStart = categoryWeeklySpending.getBudgetWeek().getStartRange();
                LocalDate budgetWeekEnd = categoryWeeklySpending.getBudgetWeek().getEndRange();
                //TODO: We need the total spent for the category during the week, not total spent during week from all categories
                List<Transaction> transactionsForWeek = filterTransactionsByBudgetWeek(transactions, budgetWeekStart, budgetWeekEnd);
                DateRange currentWeekRange = new DateRange(budgetWeekStart, budgetWeekEnd);
                BudgetCategory budgetCategory = createBudgetCategory(
                        subBudgetId,
                        categoryName,
                        currentWeekRange,
                        transactionsForWeek,
                        //TODO: For the budget category actual spent, use the total spent during the budget week that was stored alongside the category week
                        Double.valueOf(String.valueOf(categorySpendingForWeek)),
                        //TODO: For the budget category budgeted amount for the category, use budgeted amount for the category not the budgeted amount for the budget schedule range
                        budgetedAmountForCategory.doubleValue(),
                        0.0,
                        false
                );
                log.info("Budget Category: {}", budgetCategory.toString());
                budgetCategories.add(budgetCategory);
            }
        }
        return new ArrayList<>(budgetCategories);
    }

    //TODO: Fix issue to reduce using a triple for loop
    private Optional<BudgetCategory> updateSingleBudgetCategory(final MonthlyCategorySpending budgetCategorySpending, final BudgetCategory budgetCategory, final List<DateRangeSpending> dateRangeSpending)
    {
        Optional<BudgetCategory> budgetCategoryOptional = Optional.empty();
        String category = budgetCategorySpending.getCategory();
        List<Transaction> transactions = budgetCategorySpending.getTransactions();
        for(DateRangeSpending weeklySpending : dateRangeSpending)
        {
            DateRange week = weeklySpending.getDateRange();
            double weeklyCategorySpending = weeklySpending.getSpentOnRange();
            double newBudgetCategoryActual = weeklyCategorySpending + budgetCategory.getBudgetActual();
            double overSpendingAmount = getBudgetOverSpending(BigDecimal.valueOf(newBudgetCategoryActual), BigDecimal.valueOf(budgetCategory.getBudgetedAmount()));
            boolean isOverSpending = isBudgetOverSpending(overSpendingAmount);
            BudgetCategory updatedBudgetCategory = createBudgetCategory(budgetCategory.getSubBudgetId(), category, week, transactions, newBudgetCategoryActual, budgetCategory.getBudgetedAmount(), overSpendingAmount, isOverSpending);
            budgetCategoryOptional = Optional.of(updatedBudgetCategory);
        }
        return budgetCategoryOptional;
    }

    //TODO: Fix issue to reduce using a triple for loop
    @Override
    protected List<BudgetCategory> updateBudgetCategories(final List<MonthlyBudgetCategoryCriteria> budgetCriteria, final List<BudgetCategory> existingBudgetCategories)
    {
        if(budgetCriteria == null || existingBudgetCategories == null || existingBudgetCategories.isEmpty())
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

    public List<MonthlyCategorySpending> getMonthlyCategorySpending(final List<CategoryTransactions> categoryDesignators, final List<BudgetScheduleRange> budgetScheduleRanges)
    {
        if(categoryDesignators == null || budgetScheduleRanges == null)
        {
            return Collections.emptyList();
        }
        if(categoryDesignators.isEmpty() || budgetScheduleRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        log.info("Budget Schedule size: {}", budgetScheduleRanges.size());
        List<MonthlyCategorySpending> categoryPeriodSpendingList = new ArrayList<>();
        long startTime = System.currentTimeMillis();
        List<CategoryTransactions> sortedCategoryTransactionsByCategory = categoryDesignators.stream()
                .sorted(Comparator.comparing(CategoryTransactions::getCategoryName))
                .toList();
        for(CategoryTransactions categoryTransactions : sortedCategoryTransactionsByCategory)
        {
            String category = categoryTransactions.getCategoryName();
            List<Transaction> allTransactions = categoryTransactions.getTransactions();
            if(category.isEmpty() || allTransactions.isEmpty())
            {
                log.warn("Category {} has no transactions, skipping to next category", category);
                continue;
            }
            List<DateRangeSpending> weeklySpending = new ArrayList<>();
            double totalSpendingForCategory = 0.0;
            for(BudgetScheduleRange budgetWeek : budgetScheduleRanges)
            {
                LocalDate budgetWeekStart = budgetWeek.getStartRange();
                LocalDate budgetWeekEnd = budgetWeek.getEndRange();
                // Get the transaction spending for this week and given category
                List<Transaction> transactionsForBudgetWeek = filterTransactionsByBudgetWeek(allTransactions, budgetWeekStart, budgetWeekEnd);
                double transactionSpendingForWeek = getTotalTransactionSpending(transactionsForBudgetWeek).doubleValue();
                if(transactionSpendingForWeek == 0)
                {
                    continue;
                }
                totalSpendingForCategory += transactionSpendingForWeek;
                DateRange budgetDateRange = new DateRange(budgetWeekStart, budgetWeekEnd);
                weeklySpending.add(new DateRangeSpending(budgetDateRange, transactionSpendingForWeek));
            }
            BigDecimal totalCategorySpending = new BigDecimal(totalSpendingForCategory).setScale(1, RoundingMode.HALF_UP);
            MonthlyCategorySpending monthlyCategorySpending = new MonthlyCategorySpending(category, totalCategorySpending, allTransactions,weeklySpending);
            categoryPeriodSpendingList.add(monthlyCategorySpending);
        }
        return categoryPeriodSpendingList;
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

    //TODO: Retest this method
    //TODO: Implement method using SubBudgetGoals by using SubBudgetId to fetch any SubBudgetGoals from the database
    public List<MonthlyBudgetCategoryCriteria> createMonthlyCategoryBudgetCriteriaList(final SubBudget budget, final List<MonthlyCategorySpending> monthlyCategorySpendingList, final SubBudgetGoals subBudgetGoals)
    {
        if(budget == null || monthlyCategorySpendingList == null || subBudgetGoals == null)
        {
            return Collections.emptyList();
        }
        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteriaList = new ArrayList<>();
        for(MonthlyCategorySpending monthlyCategorySpending : monthlyCategorySpendingList)
        {
            String category = monthlyCategorySpending.getCategory();
            MonthlyBudgetCategoryCriteria monthlyBudgetCategoryCriteria = new MonthlyBudgetCategoryCriteria(category, budget, true, monthlyCategorySpending);
            monthlyBudgetCategoryCriteriaList.add(monthlyBudgetCategoryCriteria);
        }
        return monthlyBudgetCategoryCriteriaList;
    }

    private BigDecimal getTotalTransactionSpending(List<Transaction> transactions)
    {
        return transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<BudgetCategory> saveBudgetCategories(List<BudgetCategory> budgetCategories)
    {
        return getBudgetCategoryService().saveAll(budgetCategories);
    }
}
