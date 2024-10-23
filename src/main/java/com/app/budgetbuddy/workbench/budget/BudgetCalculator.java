package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
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
import java.util.Optional;

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

    public BigDecimal calculateSavingsGoalProgress(final Budget budget){
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

    public BigDecimal calculateActualBudgetedAmountForCategory(final Category category, final Long budgetId){
        if(category == null){
            throw new IllegalArgumentException("Category or Budget cannot be null");
        }
        BudgetEntity budgetEntity = getBudgetEntityById(budgetId);
        String budgetDescription = budgetEntity.getBudgetDescription();
        BigDecimal budgetedAmount;
        if(budgetDescription.equals("Spending Control Budget"))
        {
            // Are there any Budget Categories with this budget?
            List<BudgetCategoriesEntity> budgetCategories = getBudgetCategoriesByBudgetId(budgetId);
            if(budgetCategories.isEmpty())
            {
                return BigDecimal.ZERO;
            }
            else
            {
                for(BudgetCategoriesEntity budgetCategory : budgetCategories)
                {
                    if(budgetCategory != null)
                    {
                        String categoryName = category.getCategoryName();
                        String categoryDescription = category.getCategoryDescription();
                        if(categoryName.equals(budgetCategory.getCategoryName()) || categoryDescription.equals(budgetCategory.getCategoryName()))
                        {
                            budgetedAmount = BigDecimal.valueOf(budgetCategory.getAllocatedAmount());
                            break;
                        }
                    }
                }
            }
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
