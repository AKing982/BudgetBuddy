package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.*;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
public class MonthlyBudgetCategoryCriteria extends BudgetCategoryCriteriaBase
{
    private String categoryId;
    private BudgetSchedule budgetSchedule;
    private List<DateRange> categoryDateRanges;
    private List<BudgetPeriodAmount> periodAmounts;

    public MonthlyBudgetCategoryCriteria(String categoryId, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, List<BudgetPeriodAmount> periodAmounts) {
        this.categoryId = categoryId;
        this.budgetSchedule = budgetSchedule;
        this.categoryDateRanges = categoryDateRanges;
        this.periodAmounts = periodAmounts;
    }

    public MonthlyBudgetCategoryCriteria(String category, SubBudget subBudget, boolean active, String categoryId, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, List<BudgetPeriodAmount> periodAmounts) {
        super(category, subBudget, active);
        this.categoryId = categoryId;
        this.budgetSchedule = budgetSchedule;
        this.categoryDateRanges = categoryDateRanges;
        this.periodAmounts = periodAmounts;
    }

    //    public BudgetCategoryCriteria(String categoryId, SubBudget budget, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, boolean active) {
//        this.categoryId = categoryId;
//        this.budget = budget;
//        this.budgetSchedule = budgetSchedule;
//        this.categoryDateRanges = categoryDateRanges;
//        this.active = active;
//    }
//
//    public BudgetCategoryCriteria(String categoryId, String category, List<DateRange> dateRanges, Boolean isActive) {
//        this.categoryId = categoryId;
//        this.category = category;
//        this.categoryDateRanges = dateRanges;
//        this.periodAmounts = new ArrayList<>();
//        this.active = isActive;
//    }
//
//    public BudgetCategoryCriteria(String category, List<DateRange> dateRange){
//        this.category = category;
//        this.categoryDateRanges = dateRange;
//        this.periodAmounts = new ArrayList<>();
//    }
//
//    public BudgetCategoryCriteria(String category, List<DateRange> dateRanges, SubBudget budget, Boolean isActive) {
//        this.category = category;
//        this.categoryDateRanges = dateRanges;
//        this.periodAmounts = new ArrayList<>();
//        this.budget = budget;
//        this.active = isActive;
//    }
//
//    public BudgetCategoryCriteria(String categoryId, String category, SubBudget budget, BudgetSchedule budgetSchedule, List<DateRange> categoryDateRanges, List<BudgetPeriodAmount> budgetedAmounts, List<BudgetPeriodAmount> actualAmounts, boolean active) {
//        this.categoryId = categoryId;
//        this.category = category;
//        this.budget = budget;
//        this.budgetSchedule = budgetSchedule;
//        this.categoryDateRanges = categoryDateRanges;
//        this.periodAmounts = budgetedAmounts;
//        this.active = active;
//    }

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

    public static MonthlyBudgetCategoryCriteria buildCategoryBudget(List<BudgetPeriodAmount> periodAmounts,
                                               List<DateRange> categoryDateRanges, SubBudget budget, BudgetSchedule budgetSchedule, String category) {

        MonthlyBudgetCategoryCriteria categoryBudget = new MonthlyBudgetCategoryCriteria();
        categoryBudget.setCategory(category);
        categoryBudget.setSubBudget(budget);
        categoryBudget.setBudgetSchedule(budgetSchedule);
        categoryBudget.setActive(true);
        categoryBudget.setPeriodAmounts(periodAmounts);
        categoryBudget.setCategoryDateRanges(categoryDateRanges);

        return categoryBudget;
    }

    public static MonthlyBudgetCategoryCriteria buildCategoryBudget(String categoryId, String category, List<BudgetPeriodAmount> periodAmounts,
                                                     List<DateRange> categoryDateRanges, SubBudget budget, BudgetSchedule budgetSchedule, boolean isActive) {

        MonthlyBudgetCategoryCriteria categoryBudget = new MonthlyBudgetCategoryCriteria();
        categoryBudget.setCategory(category);
        categoryBudget.setSubBudget(budget);
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
