package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.CategoryBudgetAmount;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class BudgetEstimatorService
{
    private final BudgetCategoryQueries budgetCategoryQueries;
    private final PercentageCalculator percentageCalculator;
    private final String[] categories = new String[]{"Rent", "Utilities", "Insurance",
            "Gas", "Groceries", "Payments", "Subscriptions", "Savings", "Order Out", "OtherPurchases"};

    @Autowired
    public BudgetEstimatorService(BudgetCategoryQueries budgetCategoryQueries,
                                  PercentageCalculator percentageCalculator)
    {
        this.budgetCategoryQueries = budgetCategoryQueries;
        this.percentageCalculator = percentageCalculator;
    }

    public CategoryBudgetAmount[] calculateBudgetCategoryAmount(final SubBudget subBudget)
    {
        Long userId = subBudget.getBudget().getUserId();
        LocalDate budgetStart = subBudget.getStartDate();
        LocalDate budgetEnd = subBudget.getEndDate();
        BigDecimal monthlyIncome = subBudget.getAllocatedAmount();
        CategoryBudgetAmount[] categoryBudgetAmounts = new CategoryBudgetAmount[categories.length];
        double budgetAmount = monthlyIncome.doubleValue();
        for(String category : categories)
        {
            // Get the category amount from the database
            double categoryAmount = budgetCategoryQueries.getCategoryAmount(userId, budgetStart, budgetEnd, category);
            double remainingBudgetAmount = budgetAmount - categoryAmount;
            for(int i = 0; i < categoryBudgetAmounts.length; i++)
            {
                while(remainingBudgetAmount > 0)
                {
                    BigDecimal categoryAmountAsBig = BigDecimal.valueOf(categoryAmount);
                    CategoryBudgetAmount categoryBudgetAmount = new CategoryBudgetAmount(category, categoryAmountAsBig);
                    categoryBudgetAmounts[i] = categoryBudgetAmount;
                    remainingBudgetAmount = remainingBudgetAmount - categoryAmountAsBig.doubleValue();
                }
                //TODO: Add code for the Non-Primary Categories, Secondary Categories, and Third Categories, then Savings, Extra Categories, then OtherPurchases
            }
        }
        return categoryBudgetAmounts;
    }

}
