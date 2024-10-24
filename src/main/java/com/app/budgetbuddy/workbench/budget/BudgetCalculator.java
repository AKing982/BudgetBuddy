package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.BudgetStats;
import com.app.budgetbuddy.domain.Category;
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

    public BigDecimal generateCategoryBudgetAmount(final Category category, final Budget budget, final BudgetPeriod budgetPeriod){
        if(category == null || budgetPeriod == null){
            throw new IllegalArgumentException("Invalid category or budget period");
        }
        if(budget == null){
            throw new IllegalArgumentException("Invalid budget");
        }

        // Does the user already have a budget?
        // Is that budget a spending budget?
           // if the budget is a spending budget
           // Does the user have budget category that matches the category?
             // If yes, then use the allocated amount as the budget amount
            // If no, then use a percentage of the budget amount as the allocated amount
        // Is the budget a spending control budget?
        // Is the budget a paying off debt budget?

        return null;
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
