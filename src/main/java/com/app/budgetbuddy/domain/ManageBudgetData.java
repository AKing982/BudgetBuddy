package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@Builder
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class ManageBudgetData
{
    private Long budgetId;
    private Long userId;
    private String budgetName;
    private String budgetDescription;
    private String userFirstName;
    private String userLastName;
    private BigDecimal yearlyIncome;
    private BigDecimal savingsAmount;
    private Period budgetPeriod;
    private BudgetMode budgetMode;
    private int budgetYear;

    public ManageBudgetData(Long budgetId, Long userId, String budgetName, String budgetDescription, String userFirstName, String userLastName, BigDecimal yearlyIncome, BigDecimal savingsAmount, Period budgetPeriod, BudgetMode budgetMode, int budgetYear) {
        this.budgetId = budgetId;
        this.userId = userId;
        this.budgetName = budgetName;
        this.budgetDescription = budgetDescription;
        this.userFirstName = userFirstName;
        this.userLastName = userLastName;
        this.yearlyIncome = yearlyIncome;
        this.savingsAmount = savingsAmount;
        this.budgetPeriod = budgetPeriod;
        this.budgetMode = budgetMode;
        this.budgetYear = budgetYear;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        ManageBudgetData that = (ManageBudgetData) o;
        return budgetYear == that.budgetYear && Objects.equals(budgetId, that.budgetId) && Objects.equals(userId, that.userId) && Objects.equals(budgetName, that.budgetName) && Objects.equals(budgetDescription, that.budgetDescription) && Objects.equals(userFirstName, that.userFirstName) && Objects.equals(userLastName, that.userLastName) && Objects.equals(yearlyIncome, that.yearlyIncome) && Objects.equals(savingsAmount, that.savingsAmount) && budgetPeriod == that.budgetPeriod && budgetMode == that.budgetMode;
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgetId, userId, budgetName, budgetDescription, userFirstName, userLastName, yearlyIncome, savingsAmount, budgetPeriod, budgetMode, budgetYear);
    }
}
