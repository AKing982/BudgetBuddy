package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.CategoryBudgetAmount;
import com.app.budgetbuddy.domain.CategoryDateInfo;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@Getter
@Slf4j
public class BudgetEstimatorService
{
    private final BudgetCategoryQueries budgetCategoryQueries;
    private final PercentageCalculator percentageCalculator;
    private final String[] categories = new String[]{"Rent", "Utilities", "Insurance",
            "Gas", "Groceries", "Payments", "Subscription", "Savings", "Order Out", "Other"};

    @Autowired
    public BudgetEstimatorService(BudgetCategoryQueries budgetCategoryQueries,
                                  PercentageCalculator percentageCalculator)
    {
        this.budgetCategoryQueries = budgetCategoryQueries;
        this.percentageCalculator = percentageCalculator;
    }

    public BigDecimal getBudgetCategoryAmountByCategory(final String category, final CategoryBudgetAmount[] categoryBudgetAmounts)
    {
        if(category.isEmpty())
        {
            return BigDecimal.ZERO;
        }
        for(CategoryBudgetAmount categoryBudgetAmount : categoryBudgetAmounts)
        {
            String categoryName = categoryBudgetAmount.getCategory();
            BigDecimal budgetAmount = categoryBudgetAmount.getBudgetAmount();
            if(categoryName.equals(category))
            {
                return budgetAmount;
            }
        }
        return BigDecimal.ZERO;
    }

    public CategoryBudgetAmount[] calculateBudgetCategoryAmount(final SubBudget subBudget)
    {
        CategoryBudgetAmount[] categoryBudgetAmounts = new CategoryBudgetAmount[categories.length];
        if(subBudget == null)
        {
            return new CategoryBudgetAmount[0];
        }
        Long subBudgetId = subBudget.getId();
        Long userId = subBudget.getBudget().getUserId();
        LocalDate budgetStart = subBudget.getStartDate();
        LocalDate budgetEnd = subBudget.getEndDate();
        if(subBudget.getAllocatedAmount().compareTo(BigDecimal.ZERO) == 0)
        {
            log.warn("Sub BudgetId {} has zero allocated amount....", subBudgetId);
            return new CategoryBudgetAmount[0];
        }
        CategoryDateInfo categoryDateInfo = CategoryDateInfo.createCategoryDateInfo(userId, budgetStart, budgetEnd);
        budgetCategoryQueries.initializeCategoryDateInfo(categoryDateInfo);
        BigDecimal monthlyIncome = subBudget.getAllocatedAmount().setScale(1, RoundingMode.CEILING);
        double budgetAmount = monthlyIncome.doubleValue();
        double remainingBudgetAmount = budgetAmount;
        for(int i = 0; i < categories.length; i++)
        {
            String category = categories[i];
            log.info("Processing Category: {}", category);
            log.info("Remaining Budget: {}", remainingBudgetAmount);
            // Does the user have rent?
            // Does the user have mortgage?
            if(category.equals("Rent") || category.equals("Utilities") || category.equals("Insurance"))
            {
                double categoryAmount = budgetCategoryQueries.getCategoryAmount(userId, budgetStart, budgetEnd, category);
                log.info("Category amount: {}", categoryAmount);
                BigDecimal budgetAmountAsBigDecimal = new BigDecimal(categoryAmount).setScale(1, RoundingMode.CEILING);
                CategoryBudgetAmount categoryBudgetAmount = new CategoryBudgetAmount(category, budgetAmountAsBigDecimal);
                categoryBudgetAmounts[i] = categoryBudgetAmount;
                remainingBudgetAmount = remainingBudgetAmount - categoryAmount;
                log.info("Remaining Budget Amount for primary category: {}", remainingBudgetAmount);
            }
            // Process the secondary and remaining categories
            else
            {
                if(category.equals("Payments"))
                {
                    boolean hasPayments = budgetCategoryQueries.userHasPayments();
                    if(!hasPayments)
                    {
                        CategoryBudgetAmount paymentBudgetAmountZero = new CategoryBudgetAmount("Payments", BigDecimal.ZERO);
                        categoryBudgetAmounts[i] = paymentBudgetAmountZero;
                        log.warn("User has no payments, setting zero budget for payments category");
                        continue;
                    }
                }
                if(category.equals("Savings"))
                {
                    double savingsPercentage = percentageCalculator.estimateCategoryPercentage(budgetAmount, "Savings").doubleValue();
                    double savingsTargetAmount = budgetAmount * savingsPercentage;
                    if(remainingBudgetAmount > savingsTargetAmount)
                    {
                        BigDecimal savingsBudget = new BigDecimal(savingsTargetAmount).setScale(1, RoundingMode.CEILING);
                        CategoryBudgetAmount savingsBudgetAmount = new CategoryBudgetAmount("Savings", savingsBudget);
                        categoryBudgetAmounts[i] = savingsBudgetAmount;
                        remainingBudgetAmount = remainingBudgetAmount - savingsTargetAmount;
                    }
                    else
                    {
                        log.warn("Skipping allocating to savings category");
                        CategoryBudgetAmount savingsBudgetAmountNoSavings = new CategoryBudgetAmount("Savings", BigDecimal.ZERO);
                        categoryBudgetAmounts[i] = savingsBudgetAmountNoSavings;
                        continue;
                    }
                }
                else
                {
                    double categoryPercentage = percentageCalculator.estimateCategoryPercentage(budgetAmount, category).doubleValue();
                    double targetBudgetAmount = budgetAmount * categoryPercentage;
                    log.info("Category budget allocation: {}", targetBudgetAmount);
                    BigDecimal categoryBudget = new BigDecimal(targetBudgetAmount).setScale(1, RoundingMode.CEILING);
                    CategoryBudgetAmount categoryBudgetAmount = new CategoryBudgetAmount(category,categoryBudget);
                    log.info("Category Budget: {}", categoryBudgetAmount);
                    categoryBudgetAmounts[i] = categoryBudgetAmount;
                    BigDecimal categoryAmountAsBig = BigDecimal.valueOf(targetBudgetAmount).setScale(1, RoundingMode.CEILING);
                    remainingBudgetAmount = remainingBudgetAmount - categoryAmountAsBig.doubleValue();
                    log.info("Remaining Budget Amount: {}", remainingBudgetAmount);
                }
            }
            if(remainingBudgetAmount == 0 || remainingBudgetAmount < 0)
            {
                break;
            }
        }
        return categoryBudgetAmounts;
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
