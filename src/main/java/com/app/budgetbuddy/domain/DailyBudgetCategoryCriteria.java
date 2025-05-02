package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class DailyBudgetCategoryCriteria extends BudgetCategoryCriteriaBase
{
    private BudgetScheduleRange budgetScheduleRange;
    private List<DailyCategorySpending> categorySpendingByDate;
    private LocalDate date;

    public DailyBudgetCategoryCriteria(BudgetScheduleRange budgetScheduleRange, List<DailyCategorySpending> categorySpendingByDate, LocalDate date) {
        this.budgetScheduleRange = budgetScheduleRange;
        this.categorySpendingByDate = categorySpendingByDate;
        this.date = date;
    }

    public DailyBudgetCategoryCriteria(String category, SubBudget subBudget, boolean active, BudgetScheduleRange budgetScheduleRange, List<DailyCategorySpending> categorySpendingByDate, LocalDate date) {
        super(category, subBudget, active);
        this.budgetScheduleRange = budgetScheduleRange;
        this.categorySpendingByDate = categorySpendingByDate;
        this.date = date;
    }
}
