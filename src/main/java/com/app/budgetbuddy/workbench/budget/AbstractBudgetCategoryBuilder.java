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
public abstract class AbstractBudgetCategoryBuilder<T extends BudgetCategoryCriteriaBase, S extends CategorySpending>
{
    protected final BudgetCategoryService budgetCategoryService;
    protected final BudgetCalculations budgetCalculations;
    protected final BudgetEstimatorService budgetEstimatorService;
    protected final SubBudgetGoalsService subBudgetGoalsService;

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

    public abstract List<BudgetCategory> initializeBudgetCategories(final SubBudget subBudget, final List<TransactionsByCategory> TransactionsByCategory);

    public abstract List<BudgetCategory> buildBudgetCategoryList(final List<T> budgetCriteria);

    protected BudgetCategory createBudgetCategory(
            Long subBudgetId,
            String categoryName,
            DateRange dateRange,
            List<Transaction> transactions,
            Double budgetActualSpendingAmount,
            Double budgetAmount,
            Double overSpendingAmount,
            boolean isOverSpending) {

        BudgetCategory newCategory = new BudgetCategory();
        newCategory.setSubBudgetId(subBudgetId);
        newCategory.setCategoryName(categoryName);
        newCategory.setBudgetActual(budgetActualSpendingAmount);
        newCategory.setBudgetedAmount(budgetAmount);
        newCategory.setStartDate(dateRange.getStartDate());
        newCategory.setEndDate(dateRange.getEndDate());
        newCategory.setTransactions(transactions);
        newCategory.setIsActive(true);
        newCategory.setOverSpent(isOverSpending);
        newCategory.setOverSpendingAmount(overSpendingAmount);

        return newCategory;
    }

    public abstract List<T> createCategoryBudgetCriteriaList(final SubBudget budget, final List<S> CategorySpendingList, final SubBudgetGoals subBudgetGoals);

    public abstract List<BudgetCategory> updateBudgetCategories(List<T> budgetCriteria, List<BudgetCategory> existingBudgetCategories);

    public abstract List<S> getCategorySpending(List<TransactionsByCategory> transactionsByCategory, List<BudgetScheduleRange> budgetDateRanges);

    public Double getBudgetOverSpending(final BigDecimal budgetActualAmount, final BigDecimal budgetAmount)
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
