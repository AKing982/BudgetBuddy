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
public class WeeklyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public WeeklyBudgetPeriodCategoryHandler(TransactionCategoryService transactionCategoryService)
    {
        this.transactionCategoryService = transactionCategoryService;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(SubBudget budget, BudgetSchedule budgetSchedule)
    {
        if(budget == null || budgetSchedule == null)
        {
            return new ArrayList<>();
        }
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        try
        {
            LocalDate subBudgetStartDate = budget.getStartDate();
            LocalDate subBudgetEndDate = budget.getEndDate();
            Long subBudgetId = budget.getId();
            DateRange dateRange = new DateRange(subBudgetStartDate, subBudgetEndDate);
            // Split the budget period into weeks
            List<DateRange> weeklyRanges = dateRange.splitIntoWeeks();
            for(DateRange weekRange : weeklyRanges)
            {
                // Fetch transactions for this week
                List<TransactionCategory> transactionCategories = transactionCategoryService
                        .getTransactionCategoryListByBudgetIdAndDateRange(subBudgetId, weekRange.getStartDate(), weekRange.getEndDate());

                for(TransactionCategory category : transactionCategories)
                {
                    BigDecimal budgetedAmount = Optional.ofNullable(category.getBudgetedAmount())
                            .map(BigDecimal::valueOf)
                            .orElse(BigDecimal.ZERO);

                    BigDecimal actualSpent = Optional.ofNullable(category.getBudgetActual())
                            .map(BigDecimal::valueOf)
                            .orElse(BigDecimal.ZERO);

                    // Determine budget performance
                    BudgetStatus status = determineCategoryStatus(budgetedAmount, actualSpent);

                    // Create weekly BudgetPeriodCategory
                    BudgetPeriodCategory periodCategory = new BudgetPeriodCategory(
                            category.getCategoryName(),
                            budgetedAmount,
                            actualSpent,
                            weekRange,
                            status
                    );

                    budgetPeriodCategories.add(periodCategory);
                }
            }

            return budgetPeriodCategories;

        } catch (Exception e) {
            log.error("Error retrieving weekly budget period categories for SubBudget ID: {}", budget.getId(), e);
            return Collections.emptyList();
        }
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
