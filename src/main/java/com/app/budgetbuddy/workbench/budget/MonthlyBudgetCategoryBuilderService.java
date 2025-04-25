package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.BudgetCategoryCriteria;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MonthlyBudgetCategoryBuilderService
{

    public List<BudgetCategory> buildBudgetCategoryList(final List<BudgetCategoryCriteria> budgetCategoryCriteria)
    {
        return List.of();
    }

    public List<BudgetCategory> updateBudgetCategoryList(final List<BudgetCategoryCriteria> budgetCategoryCriteria, final List<BudgetCategory> budgetCategoryList)
    {
        return List.of();
    }

    private BudgetCategory createBudgetCategory(
            Long subBudgetId,
            String categoryName,
            DateRange dateRange,
            List<Transaction> transactions,
            Double budgetActualSpendingAmount,
            Double budgetAmount,
            Double overSpendingAmount,
            boolean isOverSpending) {

        // Calculate total amount from all transactions
        double actualAmount = transactions.stream()
                .map(t -> t.getAmount().doubleValue())
                .reduce(0.0, Double::sum);

        BudgetCategory newCategory = new BudgetCategory();
        newCategory.setSubBudgetId(subBudgetId);
        newCategory.setCategoryName(categoryName);
        newCategory.setBudgetActual(budgetActualSpendingAmount);
        newCategory.setBudgetedAmount(budgetAmount);
        newCategory.setStartDate(dateRange.getStartDate());
        newCategory.setEndDate(dateRange.getEndDate());
        newCategory.setTransactions(transactions);
        newCategory.setIsActive(true);
        newCategory.setBudgetActual(actualAmount);
        newCategory.setOverSpent(isOverSpending);
        newCategory.setOverSpendingAmount(overSpendingAmount);

        return newCategory;
    }
}
