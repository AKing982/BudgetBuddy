package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.*;

@Data
@NoArgsConstructor
public class BudgetCategoryCriteria
{
    private String categoryId;
    private String category;
    private SubBudget budget;
    private BudgetSchedule budgetSchedule;
    private List<DateRange> categoryDateRanges;
    private List<BudgetPeriodAmount> periodAmounts;
    private boolean active;

    public BudgetCategoryCriteria(String categoryId, SubBudget budget, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, boolean active) {
        this.categoryId = categoryId;
        this.budget = budget;
        this.budgetSchedule = budgetSchedule;
        this.categoryDateRanges = categoryDateRanges;
        this.active = active;
    }

    public BudgetCategoryCriteria(String categoryId, String category, List<DateRange> dateRanges, Boolean isActive) {
        this.categoryId = categoryId;
        this.category = category;
        this.categoryDateRanges = dateRanges;
        this.periodAmounts = new ArrayList<>();
        this.active = isActive;
    }

    public BudgetCategoryCriteria(String category, List<DateRange> dateRange){
        this.category = category;
        this.categoryDateRanges = dateRange;
        this.periodAmounts = new ArrayList<>();
    }

    public BudgetCategoryCriteria(String category, List<DateRange> dateRanges, SubBudget budget, Boolean isActive) {
        this.category = category;
        this.categoryDateRanges = dateRanges;
        this.periodAmounts = new ArrayList<>();
        this.budget = budget;
        this.active = isActive;
    }

    public BudgetCategoryCriteria(String categoryId, String category, SubBudget budget, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, List<BudgetPeriodAmount> budgetedAmounts, List<BudgetPeriodAmount> actualAmounts, boolean active) {
        this.categoryId = categoryId;
        this.category = category;
        this.budget = budget;
        this.budgetSchedule = budgetSchedule;
        this.categoryDateRanges = categoryDateRanges;
        this.periodAmounts = budgetedAmounts;
        this.active = active;
    }

    public BigDecimal getBudgetAmount(DateRange dateRange) {
        return periodAmounts.stream()
                .filter(pa -> pa.getDateRange().equals(dateRange))
                .findFirst()
                .map(BudgetPeriodAmount::getBudgeted)
                .orElse(BigDecimal.ZERO);
    }


    public BigDecimal getActualAmount(DateRange dateRange) {
        return periodAmounts.stream()
                .filter(pa -> pa.getDateRange().equals(dateRange))
                .findFirst()
                .map(BudgetPeriodAmount::getActual)
                .orElse(BigDecimal.ZERO);
    }

    public static BudgetCategoryCriteria buildCategoryBudget(List<BudgetPeriodAmount> periodAmounts,
                                               List<DateRange> categoryDateRanges, SubBudget budget, BudgetSchedule budgetSchedule, String category) {

        BudgetCategoryCriteria categoryBudget = new BudgetCategoryCriteria();
        categoryBudget.setCategory(category);
        categoryBudget.setBudget(budget);
        categoryBudget.setBudgetSchedule(budgetSchedule);
        categoryBudget.setActive(true);
        categoryBudget.setPeriodAmounts(periodAmounts);
        categoryBudget.setCategoryDateRanges(categoryDateRanges);

        return categoryBudget;
    }

    public static BudgetCategoryCriteria buildCategoryBudget(String categoryId, String category, List<BudgetPeriodAmount> periodAmounts,
                                                     List<DateRange> categoryDateRanges, SubBudget budget, BudgetSchedule budgetSchedule, boolean isActive) {

        BudgetCategoryCriteria categoryBudget = new BudgetCategoryCriteria();
        categoryBudget.setCategory(category);
        categoryBudget.setBudget(budget);
        categoryBudget.setBudgetSchedule(budgetSchedule);
        categoryBudget.setCategoryId(categoryId);
        categoryBudget.setActive(isActive);
        categoryBudget.setPeriodAmounts(periodAmounts);

        categoryBudget.setCategoryDateRanges(categoryDateRanges);

        return categoryBudget;
    }

    public void setCategoryPeriodAmountForDateRange(DateRange dateRange, BigDecimal budgeted, BigDecimal actual) {
        periodAmounts.add(new BudgetPeriodAmount(dateRange, budgeted, actual));
    }
}
