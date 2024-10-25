package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetCategoriesService;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class BudgetCalculator {
    private final BudgetService budgetService;
    private final BudgetGoalsService budgetGoalsService;
    private final BudgetCategoriesService budgetCategoriesService;
    private final UserBudgetCategoryService userBudgetCategoryService;

    @Autowired
    public BudgetCalculator(BudgetService budgetService,
                            BudgetGoalsService budgetGoalsService,
                            BudgetCategoriesService budgetCategoriesService,
                            UserBudgetCategoryService userBudgetCategoryService) {
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
        this.budgetCategoriesService = budgetCategoriesService;
        this.userBudgetCategoryService = userBudgetCategoryService;
    }

    public BigDecimal calculateSavingsGoalProgress(final Budget budget, List<Category> spendingCategories, BudgetPeriod budgetPeriod, Long userId) {
        return null;
    }

    public BigDecimal calculateTotalBudgetHealth(final BigDecimal budgetAmount, final BigDecimal budgetActual, final BigDecimal remainingBudget, final String budgetDescription) {
        return null;
    }

    public BigDecimal calculateTotalSavings(final Long budgetId, final BigDecimal budgetAmount, final BigDecimal budgetActual, final BigDecimal leftOver, final String budgetDescription) {

        return null;
    }

    public BigDecimal calculateTotalCategorySavings(final Long budgetId, final Category category) {
        return null;
    }

    public BigDecimal calculateTotalBudgetedAmountForCategory(final Category category, final Budget budget) {
        return null;
    }

    public BudgetStats calculateBudgetStats(final Long userId, final BigDecimal leftOver, final BigDecimal totalSpent, final BigDecimal totalBudgeted, final BigDecimal totalRemaining) {
        return null;
    }

    public BigDecimal calculateTotalCategoryExpensesForPeriod(final Budget budget, final BudgetPeriod budgetPeriod) {
        if(budget == null || budgetPeriod == null)
        {
            return BigDecimal.ZERO;
        }
        LocalDate startDate = budgetPeriod.startDate();
        LocalDate endDate = budgetPeriod.endDate();
        if(startDate == null || endDate == null)
        {
            return BigDecimal.ZERO;
        }

        List<UserBudgetCategoryEntity> userBudgetCategories = getUserBudgetCategoriesByUserAndDates(budget.getUserId(), startDate, endDate);
        if(userBudgetCategories == null || userBudgetCategories.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        BigDecimal totalExpenses = BigDecimal.ZERO;
        for(UserBudgetCategoryEntity userBudgetCategory : userBudgetCategories)
        {
            Double totalSpentOnCategory = userBudgetCategory.getActual();
            totalExpenses = totalExpenses.add(new BigDecimal(totalSpentOnCategory));
        }
        return totalExpenses;
    }

    public BigDecimal calculateMonthlyBudgetedAmount(final BudgetPeriod budgetPeriod, final Budget budget)
    {
        Period period = budgetPeriod.period();
        if(period == Period.MONTHLY)
        {
            LocalDate startDate = budgetPeriod.startDate();
            LocalDate endDate = budgetPeriod.endDate();
            DateRange monthRange = createDateRange(startDate, endDate);
            Boolean isStartDateWithinMonth = monthRange.isWithinMonth(startDate);
            Boolean isEndDateWithinMonth = monthRange.isWithinMonth(endDate);
            if(isStartDateWithinMonth && isEndDateWithinMonth)
            {
                return budget.getBudgetAmount();
            }
        }
        return BigDecimal.ZERO;
    }

    private LocalDate getStartDateFromBudgetPeriod(final BudgetPeriod budgetPeriod)
    {
        return budgetPeriod.startDate();
    }

    private LocalDate getEndDateFromBudgetPeriod(final BudgetPeriod budgetPeriod)
    {
        return budgetPeriod.endDate();
    }

    private Period getPeriodFromBudgetPeriod(final BudgetPeriod budgetPeriod)
    {
        return budgetPeriod.period();
    }

    private void validateStartDateAndEndDate(final LocalDate startDate, final LocalDate endDate)
    {
        if(startDate == null || endDate == null)
        {
            throw new IllegalDateException("Start date and end date cannot be null");
        }
    }

    private BigDecimal getTotalSpendingForAllUserBudgetCategories(final List<UserBudgetCategoryEntity> userBudgetCategories) {

        BigDecimal totalSpending = BigDecimal.ZERO;
        for(UserBudgetCategoryEntity userBudgetCategory : userBudgetCategories)
        {
            Double actualSpending = userBudgetCategory.getActual();
            totalSpending = totalSpending.add(new BigDecimal(actualSpending));
        }
        return totalSpending;
    }


    public BigDecimal calculateCategoryBudgetAmountForPeriod(final String categoryName, final String categoryDescription, final Budget budget, final BudgetPeriod budgetPeriod)
    {
        Period period = getPeriodFromBudgetPeriod(budgetPeriod);
        if(period == Period.MONTHLY)
        {
            LocalDate startDate = getStartDateFromBudgetPeriod(budgetPeriod);
            LocalDate endDate = getEndDateFromBudgetPeriod(budgetPeriod);

            validateStartDateAndEndDate(startDate, endDate);

            DateRange monthRange = createDateRange(startDate, endDate);
            Boolean isStartDateWithinMonth = monthRange.isWithinMonth(startDate);
            Boolean isEndDateWithinMonth = monthRange.isWithinMonth(endDate);
            if(isStartDateWithinMonth && isEndDateWithinMonth)
            {
                List<UserBudgetCategoryEntity> userBudgetCategories = getUserBudgetCategoriesByUserAndDates(budget.getUserId(), startDate, endDate);
                if(userBudgetCategories == null || userBudgetCategories.isEmpty())
                {
                    return BigDecimal.ZERO;
                }
                BigDecimal totalSpendingForAllCategories = getTotalSpendingForAllUserBudgetCategories(userBudgetCategories);
                for(UserBudgetCategoryEntity userBudgetCategory : userBudgetCategories)
                {
                    String userBudgetCategoryName = userBudgetCategory.getCategory().getName();
                    String userBudgetDescription = userBudgetCategory.getCategory().getDescription();
                    boolean isCategoryNameOrDescriptionMatch = userBudgetCategoryName.matches(categoryName) || userBudgetDescription.matches(categoryDescription);
                    if(isCategoryNameOrDescriptionMatch)
                    {
                        BigDecimal totalCategorySpending = BigDecimal.valueOf(userBudgetCategory.getActual());
                        BigDecimal totalCategoryBudgeted = BigDecimal.valueOf(userBudgetCategory.getBudgetedAmount());
                        BigDecimal categoryProportion = getCategoryBudgetAmountProportion(categoryName, totalCategorySpending, totalCategoryBudgeted, totalSpendingForAllCategories);
                        BigDecimal budgetedAmountForCategory = categoryProportion.multiply(budget.getBudgetAmount());
                    }
                }
            }
        }
        else if(period == Period.WEEKLY)
        {

        }
    }

    public BigDecimal calculateBiWeeklyBudgetedAmount(final BudgetPeriod budgetPeriod, final Budget budget)
    {
        Period biweeklyPeriod = budgetPeriod.period();
        if(biweeklyPeriod == Period.BIWEEKLY)
        {
            LocalDate startDate = budgetPeriod.startDate();
            LocalDate endDate = budgetPeriod.endDate();
            if(startDate == null || endDate == null)
            {
                return BigDecimal.ZERO;
            }
            DateRange biweeklyRange = createDateRange(startDate, endDate);
            Boolean isStartDateWithinBiWeek = biweeklyRange.isWithinBiWeek(startDate);
            Boolean isEndDateWithinBiWeek = biweeklyRange.isWithinBiWeek(endDate);
            if(isStartDateWithinBiWeek && isEndDateWithinBiWeek)
            {
                BigDecimal budgetedAmount = budget.getBudgetAmount();
                return budgetedAmount.divide(BigDecimal.valueOf(2), RoundingMode.CEILING);
            }
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal calculateWeeklyBudgetedAmount(final BudgetPeriod budgetPeriod, final Budget budget)
    {
        Period weeklyPeriod = budgetPeriod.period();
        if(weeklyPeriod == Period.WEEKLY)
        {
            LocalDate startDate = budgetPeriod.startDate();
            LocalDate endDate = budgetPeriod.endDate();
            DateRange weeklyRange = createDateRange(startDate, endDate);
            Boolean isStartDateWithinWeek = weeklyRange.isWithinWeek(startDate);
            Boolean isEndDateWithinWeek = weeklyRange.isWithinWeek(endDate);
            if(isStartDateWithinWeek && isEndDateWithinWeek)
            {
                BigDecimal budgetedAmount = budget.getBudgetAmount();

                // Get the number of weeks in the current month
                long numberOfWeeksInPeriod = weeklyRange.getWeeksInRange();
                BigDecimal numberOfWeeks = BigDecimal.valueOf(numberOfWeeksInPeriod);
                return budgetedAmount.divide(numberOfWeeks, RoundingMode.CEILING);
            }
        }
        return BigDecimal.ZERO;
    }

    public Map<Category, BigDecimal> createCategoryBudgetAmountMap(final List<Category> categories, final Budget budget, final BudgetPeriod budgetPeriod) {
        return null;
    }

    private DateRange createDateRange(LocalDate startDate, LocalDate endDate)
    {
        return new DateRange(startDate, endDate);
    }

    private BigDecimal getDefaultPercentageForCategory(final Category category, final Budget budget, final BigDecimal savingsTargetAmount) {
        switch (category.getCategoryType()) {
            case AUTO -> {
                return new BigDecimal("0.10");
            }
            case MEDICAL -> {
                return new BigDecimal("0.02");
            }
            case GROCERIES -> {
                return new BigDecimal("0.15");
            }
            case PAYMENT -> {
                return new BigDecimal("0.05");
            }
            case SUBSCRIPTIONS -> {
                return new BigDecimal("0.03");
            }
            case UTILITIES -> {
                return new BigDecimal("0.04");
            }
            case RENT -> {
                BigDecimal rentAmount = category.getBudgetedAmount();
                if(rentAmount != null && rentAmount.compareTo(savingsTargetAmount) > 0)
                {
                    // Calculate percentage of total budget that rent amount represents
                    return rentAmount.divide(budget.getBudgetAmount(), 2, BigDecimal.ROUND_HALF_UP);
                }

                // If no rent amount is defined, fall back to a dynamic percentage
                BigDecimal remainingBudget = budget.getBudgetAmount().subtract(savingsTargetAmount);
                if(remainingBudget.compareTo(budget.getBudgetAmount()) > 0)
                {
                    return remainingBudget.multiply(new BigDecimal("0.30")).divide(budget.getBudgetAmount(), RoundingMode.HALF_UP);
                }
                return new BigDecimal("0.30");
            }
        }
        return new BigDecimal("0.01");
    }



    private BigDecimal getBudgetControlAmount(final Category category, final List<BudgetCategoriesEntity> budgetCategories) {
        for (BudgetCategoriesEntity budgetCategoriesEntity : budgetCategories) {
            if (budgetCategoriesEntity.getCategoryName().equalsIgnoreCase(category.getCategoryName())) {
                return BigDecimal.valueOf(budgetCategoriesEntity.getAllocatedAmount());
            }
        }
        return category.getActual();
    }

    public BigDecimal getTotalSavedInCategoriesByPeriod(final BudgetPeriod budgetPeriod, final Budget budget)
    {
        if(budgetPeriod == null || budget == null)
        {
            throw new RuntimeException("BudgetPeriod and budget cannot be null");
        }

        List<UserBudgetCategoryEntity> userBudgetCategories = getUserBudgetCategoriesByUserAndDates(budget.getUserId(), budgetPeriod.startDate(), budgetPeriod.endDate());
        if(userBudgetCategories == null || userBudgetCategories.isEmpty())
        {
            return BigDecimal.ZERO;
        }

        BigDecimal totalSavedAmount = BigDecimal.ZERO;
        for(UserBudgetCategoryEntity userBudgetCategoryEntity : userBudgetCategories)
        {
            Double categorySpending = userBudgetCategoryEntity.getActual();
            Double categoryBudgetedAmount = userBudgetCategoryEntity.getBudgetedAmount();
            BigDecimal savedInCategory = getTotalSavedInCategory(categorySpending, categoryBudgetedAmount);
            totalSavedAmount = totalSavedAmount.add(savedInCategory);
        }
        return totalSavedAmount;
    }

    private BigDecimal getTotalSavedInCategory(final Double categorySpending, final Double categoryBudgeted)
    {
        if(categoryBudgeted == null || categorySpending == null)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal categorySpendingAmount = BigDecimal.valueOf(categorySpending);
        BigDecimal categoryBudgetedAmount = BigDecimal.valueOf(categoryBudgeted);
        return categoryBudgetedAmount.subtract(categorySpendingAmount);
    }

    public BigDecimal getTotalSavedInCategories(final List<Category> categories)
    {
        if(categories.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        BigDecimal totalSavedAmount = BigDecimal.ZERO;
        for(Category category : categories)
        {
            BigDecimal totalCategorySpending = category.getActual();
            BigDecimal totalBudgetedForCategory = category.getBudgetedAmount();

            BigDecimal savedAmount = totalBudgetedForCategory.subtract(totalCategorySpending);
            totalSavedAmount = totalSavedAmount.add(savedAmount);
        }
        return totalSavedAmount;
    }

    public BigDecimal getCategoryBudgetAmountProportion(final String categoryName, final BigDecimal totalCategorySpending, final BigDecimal totalBudgetAmount, final BigDecimal totalSpendingOnCategories)
    {
        if(categoryName == null || totalCategorySpending == null || totalBudgetAmount == null || totalSpendingOnCategories == null)
        {
            throw new IllegalArgumentException("Invalid input parameters");
        }
        if(totalSpendingOnCategories.compareTo(BigDecimal.ZERO) == 0)
        {
            return BigDecimal.ZERO;
        }
        BigDecimal categorySpendingProportion = totalCategorySpending.divide(totalSpendingOnCategories, 2, BigDecimal.ROUND_HALF_UP);
        return categorySpendingProportion.multiply(totalBudgetAmount).setScale(2, BigDecimal.ROUND_HALF_UP);
    }


    private List<BudgetCategoriesEntity> getBudgetCategoriesByBudgetId(Long budgetId){
        return budgetCategoriesService.findByBudgetId(budgetId);
    }

    private BudgetEntity getBudgetEntityById(Long budgetId){
        Optional<BudgetEntity> budgetEntity = budgetService.findById(budgetId);
        return budgetEntity.orElseThrow(() -> new IllegalArgumentException("Budget id " + budgetId + " not found"));
    }

    private List<UserBudgetCategoryEntity> getUserBudgetCategoriesByUserId(Long userId){
        List<UserBudgetCategoryEntity> userBudgetCategories = userBudgetCategoryService.getAllUserBudgetsByUser(userId);
        if(userBudgetCategories.isEmpty()){
            return List.of();
        }
        return userBudgetCategories;
    }

    private List<UserBudgetCategoryEntity> getUserBudgetCategoriesByUserAndDates(Long userId, LocalDate startDate, LocalDate endDate){
        List<UserBudgetCategoryEntity> userBudgetCategories = userBudgetCategoryService.getUserBudgetCategoriesByUserAndDateRange(userId, startDate, endDate);
        if(userBudgetCategories.isEmpty()){
            return List.of();
        }
        return userBudgetCategories;
    }

    public BigDecimal calculateRemainingBudgetAmountForCategory(final Category category, final Budget budget){
        return null;
    }
}
