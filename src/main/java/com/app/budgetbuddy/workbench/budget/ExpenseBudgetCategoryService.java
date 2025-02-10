package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.ExpenseCategory;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ExpenseBudgetCategoryService
{
    private final BudgetQueriesService budgetQueriesService;
    private final TransactionService transactionService;

    @Autowired
    public ExpenseBudgetCategoryService(BudgetQueriesService budgetQueriesService,
                                        TransactionService transactionService)
    {
        this.budgetQueriesService = budgetQueriesService;
        this.transactionService = transactionService;
    }

    /**
     * Retrieves expense categories for a given budget within a specified date range.
     *
     * @param budgetId The budget ID.
     * @param startDate The start date of the period.
     * @param endDate The end date of the period.
     * @return List of expense categories.
     */
    public List<ExpenseCategory> getBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        if (budgetId == null || startDate == null || endDate == null)
        {
            throw new IllegalArgumentException("Budget ID, start date, and end date must not be null.");
        }

        return budgetQueriesService.getExpensesBudgetCategories(budgetId, startDate, endDate)
                .stream()
                .map(this::mapToExpenseCategory)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves the top expense categories based on spending.
     *
     * @param budgetId The budget ID.
     * @param startDate The start date of the period.
     * @param endDate The end date of the period.
     * @return List of top expense categories.
     */
    public List<ExpenseCategory> getTopExpenseCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        if (budgetId == null || startDate == null || endDate == null)
        {
            return Collections.emptyList();
        }

        List<Category> topCategories = budgetQueriesService.getTopExpenseBudgetCategories(budgetId, startDate, endDate);
        return topCategories.stream()
                .map(this::mapToExpenseCategory)
                .collect(Collectors.toList());
    }


    /**
     * Maps a `Category` entity into an `ExpenseCategory` model and attaches transactions.
     */
    private ExpenseCategory mapToExpenseCategory(Category category) {
//        Set<String> transactionIds = transactionService.get(category.getCategoryId());
//
//        return new ExpenseCategory(
//                category.getCategoryId(),
//                category.getCategoryName(),
//                category.getCategoryDescription(),
//                category.getBudgetedAmount(),
//                category.getCategoryStartDate(),
//                category.getCategoryEndDate(),
//                category.getActual(),
//                category.isActive(),
//                category.getCategoryType(),
//                category.getDateRange(),
//                transactionIds // Attach transactions
//        );
        return null;
    }

    /**
     * Calculates the total spent on expenses for a given budget period.
     *
     * @param budgetId The budget ID.
     * @param startDate The start date.
     * @param endDate The end date.
     * @return Total spent amount.
     */
    public BigDecimal calculateTotalSpent(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        return budgetQueriesService.getTotalSpentOnBudget(budgetId, startDate, endDate);
    }

}
