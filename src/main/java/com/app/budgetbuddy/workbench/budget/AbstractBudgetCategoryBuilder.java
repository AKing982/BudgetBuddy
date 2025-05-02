package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Data
public abstract class AbstractBudgetCategoryBuilder<T extends BudgetCategoryCriteriaBase>
{
    private final BudgetCategoryService budgetCategoryService;
    private final BudgetCalculations budgetCalculations;
    private final BudgetEstimatorService budgetEstimatorService;
    private final SubBudgetGoalsService subBudgetGoalsService;

    public AbstractBudgetCategoryBuilder(BudgetCategoryService budgetCategoryService,
                                         BudgetCalculations budgetCalculations,
                                         BudgetEstimatorService budgetEstimatorService,
                                         SubBudgetGoalsService subBudgetGoalsService)
    {
        this.budgetCategoryService = budgetCategoryService;
        this.budgetCalculations = budgetCalculations;
        this.budgetEstimatorService = budgetEstimatorService;
        this.subBudgetGoalsService = subBudgetGoalsService;
    }

    protected abstract List<BudgetCategory> initializeBudgetCategories(final SubBudget subBudget, final List<CategoryTransactions> categoryTransactions);

    protected abstract List<BudgetCategory> buildBudgetCategoryList(final List<T> budgetCriteria);

    protected BudgetCategory createBudgetCategory(
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

    protected abstract List<BudgetCategory> updateBudgetCategories(List<T> budgetCriteria);

    protected Double getBudgetOverSpending(final BigDecimal budgetActualAmount, final BigDecimal budgetAmount)
    {
        double budgetActual = Double.parseDouble(budgetActualAmount.toString());
        double budgeted = Double.parseDouble(budgetAmount.toString());
        if(budgetActual > budgeted)
        {
            return budgetActual;
        }
        return 0.0;
    }

    protected boolean isBudgetOverSpending(final Double budgetOverSpendingAmount)
    {
        return budgetOverSpendingAmount > 0.0;
    }
}
