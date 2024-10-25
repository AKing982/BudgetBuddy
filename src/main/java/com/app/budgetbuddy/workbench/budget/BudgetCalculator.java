package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.services.BudgetCategoriesService;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

@Component
public class BudgetCalculator
{
    private final BudgetService budgetService;
    private final BudgetGoalsService budgetGoalsService;
    private final BudgetCategoriesService budgetCategoriesService;

    @Autowired
    public BudgetCalculator(BudgetService budgetService,
                            BudgetGoalsService budgetGoalsService,
                            BudgetCategoriesService budgetCategoriesService){
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
        this.budgetCategoriesService = budgetCategoriesService;
    }

    public BigDecimal calculateSavingsGoalProgress(final Budget budget, List<Category> spendingCategories, BudgetPeriod budgetPeriod, Long userId){
        return null;
    }

    public BigDecimal calculateTotalBudgetHealth(final BigDecimal budgetAmount, final BigDecimal budgetActual, final BigDecimal remainingBudget, final String budgetDescription){
        return null;
    }

    public BigDecimal calculateTotalSavings(final Long budgetId, final BigDecimal budgetAmount, final BigDecimal budgetActual, final BigDecimal leftOver, final String budgetDescription){

        return null;
    }

    public BigDecimal calculateTotalCategorySavings(final Long budgetId, final Category category){
        return null;
    }

    public BigDecimal calculateTotalBudgetedAmountForCategory(final Category category, final Budget budget){
        return null;
    }

    public BudgetStats calculateBudgetStats(final Long userId, final BigDecimal leftOver, final BigDecimal totalSpent, final BigDecimal totalBudgeted, final BigDecimal totalRemaining){
        return null;
    }

    public BigDecimal calculateLeftOverBudgetAmount(Budget budget, BudgetPeriod budgetPeriod, List<Category> categories){
        return null;
    }

    public BigDecimal calculateRemainingBudgetAmount(final Budget budget, BudgetPeriod budgetPeriod, List<Category> categories){
        return null;
    }

    public BigDecimal calculateTotalExpenses(List<Category> categories, BudgetPeriod budgetPeriod){
        return null;
    }

    public BigDecimal calculateMonthlyBudgetedAmount(BudgetPeriod budgetPeriod, Budget budget){
        return null;
    }

    public BigDecimal calculateBiWeeklyBudgetedAmount(BudgetPeriod budgetPeriod, Budget budget){
        return null;
    }

    public BigDecimal calculateWeeklyBudgetedAmount(BudgetPeriod budgetPeriod, Budget budget){
        return null;
    }

    public Map<Category, BigDecimal> createCategoryBudgetAmountMap(final List<Category> categories, final Budget budget, final BudgetPeriod budgetPeriod){
        return null;
    }

    private void validateTotalCategoryPercentages(Category category, BigDecimal categoryPercentage, BigDecimal savingsPercentage, List<Category> allCategories)
    {

    }

    private BigDecimal getDefaultPercentageForCategory(Category category, Budget budget, BigDecimal savingsTargetAmount){
        switch(category.getCategoryType())
        {
            case AUTO -> {
                return new BigDecimal("0.10");
            }
            case MEDICAL -> {
                return new BigDecimal("0.05");
            }
            case RENT -> {

            }
        }
        return new BigDecimal("0.01");
    }

    private BigDecimal getBudgetControlAmount(final Category category, final List<BudgetCategoriesEntity> budgetCategories)
    {
        for(BudgetCategoriesEntity budgetCategoriesEntity : budgetCategories)
        {
            if(budgetCategoriesEntity.getCategoryName().equalsIgnoreCase(category.getCategoryName()))
            {
                return BigDecimal.valueOf(budgetCategoriesEntity.getAllocatedAmount());
            }
        }
        return category.getSpentOnCategory();
    }

    public BigDecimal getTotalSavedInCategories(List<Category> categories, BudgetPeriod budgetPeriod){
        return null;
    }

    public BigDecimal generateCategoryBudgetAmount(final Category category, final Budget budget, final BudgetPeriod budgetPeriod){
        if(category == null || budgetPeriod == null){
            throw new IllegalArgumentException("Invalid category or budget period");
        }
        if(budget == null)
        {
            throw new IllegalArgumentException("Invalid budget");
        }
        BudgetEntity budgetEntity = getBudgetEntityById(budget.getId());
        if(budgetEntity == null)
        {
            throw new IllegalArgumentException("Budget not found.");
        }
        String budgetDescription = budget.getBudgetDescription().trim();
        if(budgetDescription.equalsIgnoreCase("Budget Control Spending"))
        {
            List<BudgetCategoriesEntity> budgetCategoriesEntity = getBudgetCategoriesByBudgetId(budget.getId());
            if(budgetCategoriesEntity.isEmpty())
            {
                return BigDecimal.ZERO;
            }
            else
            {
                for(BudgetCategoriesEntity budgetCategory : budgetCategoriesEntity)
                {
                    if(budgetCategory.getCategoryName().equalsIgnoreCase(category.getCategoryName()))
                    {
                        Double allocatedAmount = budgetCategory.getAllocatedAmount();
                        return BigDecimal.valueOf(allocatedAmount);
                    }
                    else
                    {
                        // Get the total spend of the category
                        return category.getSpentOnCategory();
                    }
                }
            }
        }
        else if(budgetDescription.equalsIgnoreCase("Savings Budget"))
        {

        }

        // Does the user already have a budget?
        // Is that budget a spending budget?
           // if the budget is a spending budget
           // Does the user have budget category that matches the category?
             // If yes, then use the allocated amount as the budget amount
            // If no, then use a percentage of the budget as the allocated amount
            // What's the total spend on the category
            // Get the average of the total spend on the category
            // Return the average spend as the allocated amount
        // Is the budget a Savings Budget?
            // Get the total budget amount
            //

        // Is the budget a spending control budget?
        // Is the budget a paying off debt budget?

        return BigDecimal.ZERO;
    }

    @Deprecated
    public BigDecimal calculateActualBudgetedAmountForCategory(final Category category, final Long budgetId){
        if(category == null){
            throw new IllegalArgumentException("Category or Budget cannot be null");
        }

        return null;
    }

    private List<BudgetCategoriesEntity> getBudgetCategoriesByBudgetId(Long budgetId){
        return budgetCategoriesService.findByBudgetId(budgetId);
    }

    private BudgetEntity getBudgetEntityById(Long budgetId){
        Optional<BudgetEntity> budgetEntity = budgetService.findById(budgetId);
        return budgetEntity.orElseThrow(() -> new IllegalArgumentException("Budget id " + budgetId + " not found"));
    }


    public BigDecimal calculateRemainingBudgetAmountForCategory(final Category category, final Budget budget){
        return null;
    }
}
