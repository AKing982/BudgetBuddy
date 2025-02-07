package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.TransactionCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class MonthlyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public MonthlyBudgetPeriodCategoryHandler(TransactionCategoryService transactionCategoryService)
    {
        this.transactionCategoryService = transactionCategoryService;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(SubBudget budget, BudgetSchedule budgetSchedule)
    {
        if(budget == null || budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        try
        {
            LocalDate subBudgetStartDate = budget.getStartDate();
            LocalDate subBudgetEndDate = budget.getEndDate();
            Long subBudgetId = budget.getId();

            // Fetch the Transaction Categories tied to this sub budget
            List<TransactionCategory> transactionCategories = transactionCategoryService.getTransactionCategoryListByBudgetIdAndDateRange(subBudgetId, subBudgetStartDate, subBudgetEndDate);
            for(TransactionCategory category : transactionCategories)
            {
                // Safely convert nullable Double values to BigDecimal
                BigDecimal budgetedAmount = Optional.ofNullable(category.getBudgetedAmount())
                        .map(BigDecimal::valueOf)
                        .orElse(BigDecimal.ZERO);

                BigDecimal actualSpent = Optional.ofNullable(category.getBudgetActual())
                        .map(BigDecimal::valueOf)
                        .orElse(BigDecimal.ZERO);

                // Determine budget status
                BudgetStatus status = determineCategoryStatus(budgetedAmount, actualSpent);

                // Build the BudgetPeriodCategory object
                BudgetPeriodCategory periodCategory = new BudgetPeriodCategory(
                        category.getCategoryName(),   // Category name
                        budgetedAmount,              // Budgeted amount
                        actualSpent,                 // Actual spent
                        new DateRange(subBudgetStartDate, subBudgetEndDate),  // Date range
                        status                        // Budget status
                );

                budgetPeriodCategories.add(periodCategory);
            }
            return budgetPeriodCategories;
        }catch(Exception e)
        {
            log.error("Error retrieving budget period categories for SubBudget ID: {}", budget.getId(), e);
            return Collections.emptyList();
        }
    }

    private BigDecimal calculateRemainingBudget(BigDecimal budgeted, BigDecimal actual) {
        return budgeted.subtract(actual).max(BigDecimal.ZERO);
    }

    private BudgetStatus determineCategoryStatus(BigDecimal budgeted, BigDecimal actual) {
        if (actual.compareTo(budgeted) > 0) {
            return BudgetStatus.OVER_BUDGET;
        } else if (actual.compareTo(budgeted.multiply(new BigDecimal("0.8"))) < 0) {
            return BudgetStatus.UNDER_UTILIZED;
        } else {
            return BudgetStatus.GOOD;
        }
    }
}
