package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SubBudgetMonthOverviewServiceImpl implements SubBudgetOverviewService
{
    private final TransactionCategoryService transactionCategoryService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public SubBudgetMonthOverviewServiceImpl(TransactionCategoryService transactionCategoryService,
                                             SubBudgetService subBudgetService)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.subBudgetService = subBudgetService;
    }

    @Override
    public List<IncomeCategory> loadIncomeCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {

        return List.of();
    }

    @Override
    public List<ExpenseCategory> loadExpenseCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        if (budgetId == null || startDate == null || endDate == null) {
            log.warn("Invalid parameters provided to loadExpenseCategories");
            return Collections.emptyList();
        }

        List<TransactionCategory> transactionCategories = transactionCategoryService
                .getTransactionCategoryListByBudgetIdAndDateRange(budgetId, startDate, endDate);

        return transactionCategories.stream()
                .map(this::mapToExpenseCategory)
                .collect(Collectors.toList());
    }

    @Override
    public List<SavingsCategory> loadSavingsCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        return List.of();
    }

    private ExpenseCategory mapToExpenseCategory(TransactionCategory category)
    {
        return new ExpenseCategory(
                category.getCategoryId(),
                category.getCategoryName(),
                "Expense category",
                BigDecimal.valueOf(category.getBudgetedAmount()),
                category.getStartDate(),
                category.getEndDate(),
                BigDecimal.valueOf(category.getBudgetActual()),
                category.getIsActive(),
                CategoryType.EXPENSE,
                new DateRange(category.getStartDate(), category.getEndDate()),
                category.getTransactions().stream().map(Transaction::getTransactionId).collect(Collectors.toSet())
        );
    }
}
