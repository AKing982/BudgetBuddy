package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class SubBudget
{
    private Long id;
    private String subBudgetName;
    private BigDecimal allocatedAmount;
    private BigDecimal subSavingsTarget;
    private BigDecimal subSavingsAmount;
    private BigDecimal spentOnBudget;
    private Budget budget;
    private LocalDate startDate;
    private LocalDate endDate;
    private int year;
    private List<BudgetSchedule> budgetSchedule;
    private List<ControlledBudgetCategory> controlledBudgetCategory;
    private boolean isActive;

    public SubBudget(Long id, String subBudgetName, BigDecimal allocatedAmount, BigDecimal subSavingsTarget, BigDecimal subSavingsAmount, BigDecimal spentOnBudget, Budget budget, LocalDate startDate, LocalDate endDate, List<BudgetSchedule> budgetSchedule, List<ControlledBudgetCategory> controlledBudgetCategory, boolean isActive) {
        this.id = id;
        this.subBudgetName = subBudgetName;
        this.allocatedAmount = allocatedAmount;
        this.subSavingsTarget = subSavingsTarget;
        this.subSavingsAmount = subSavingsAmount;
        this.spentOnBudget = spentOnBudget;
        this.budget = budget;
        this.startDate = startDate;
        this.endDate = endDate;
        this.budgetSchedule = budgetSchedule;
        this.controlledBudgetCategory = controlledBudgetCategory;
        this.isActive = isActive;
    }

    public SubBudget(Long id, String subBudgetName, BigDecimal allocatedAmount, BigDecimal subSavingsTarget, BigDecimal subSavingsAmount, BigDecimal spentOnBudget, Budget budget, LocalDate startDate, LocalDate endDate, int year, List<BudgetSchedule> budgetSchedule, List<ControlledBudgetCategory> controlledBudgetCategory, boolean isActive) {
        this.id = id;
        this.subBudgetName = subBudgetName;
        this.allocatedAmount = allocatedAmount;
        this.subSavingsTarget = subSavingsTarget;
        this.subSavingsAmount = subSavingsAmount;
        this.spentOnBudget = spentOnBudget;
        this.budget = budget;
        this.startDate = startDate;
        this.endDate = endDate;
        this.year = year;
        this.budgetSchedule = budgetSchedule;
        this.controlledBudgetCategory = controlledBudgetCategory;
        this.isActive = isActive;
    }

    public static SubBudget buildSubBudget(boolean isActive, BigDecimal allocatedAmount, BigDecimal savingsTarget, BigDecimal savingsAmount, Budget budget, BigDecimal spentOnBudget, String budgetName, LocalDate startDate, LocalDate endDate)
    {
        return SubBudget.builder()
                .budget(budget)
                .endDate(endDate)
                .startDate(startDate)
                .isActive(isActive)
                .year(LocalDate.now().getYear())
                .spentOnBudget(spentOnBudget)
                .subBudgetName(budgetName)
                .subSavingsTarget(savingsTarget)
                .subSavingsAmount(savingsAmount)
                .allocatedAmount(allocatedAmount)
                .budgetSchedule(new ArrayList<>())
                .build();
    }

    /**
     * Retrieves the total budgeted vs. actual difference.
     * @return The difference as a BigDecimal.
     */
    public BigDecimal getBudgetVariance() {
        return allocatedAmount.subtract(spentOnBudget);
    }

    /**
     * Retrieves the savings ratio.
     * @return The savings ratio as a BigDecimal.
     */
    public BigDecimal getSavingsRatio() {
        if (allocatedAmount.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return subSavingsAmount.divide(allocatedAmount, 2, BigDecimal.ROUND_HALF_UP);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SubBudget subBudget = (SubBudget) o;
        return isActive == subBudget.isActive && Objects.equals(id, subBudget.id) && Objects.equals(subBudgetName, subBudget.subBudgetName) && Objects.equals(allocatedAmount, subBudget.allocatedAmount) && Objects.equals(subSavingsTarget, subBudget.subSavingsTarget) && Objects.equals(subSavingsAmount, subBudget.subSavingsAmount) && Objects.equals(spentOnBudget, subBudget.spentOnBudget) && Objects.equals(budget, subBudget.budget) && Objects.equals(startDate, subBudget.startDate) && Objects.equals(endDate, subBudget.endDate) && Objects.equals(budgetSchedule, subBudget.budgetSchedule) && Objects.equals(controlledBudgetCategory, subBudget.controlledBudgetCategory);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, subBudgetName, allocatedAmount, subSavingsTarget, subSavingsAmount, spentOnBudget, budget, startDate, endDate, budgetSchedule, controlledBudgetCategory, isActive);
    }
}
