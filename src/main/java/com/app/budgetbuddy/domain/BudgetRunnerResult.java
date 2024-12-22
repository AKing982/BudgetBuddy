package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetRunnerResult
{
    private Long budgetId;
    private Long userId;
    private String budgetName;
    private String budgetDescription;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate processDate;
    private LocalDateTime processedAt;

    private BigDecimal budgetAmount;
    private BigDecimal actualBudgetAmount;
    private BigDecimal remainingBudgetAmount;

    private BigDecimal healthScore;
    private BigDecimal dailyAverage;
    private BigDecimal monthlyProjection;
    private BigDecimal savingsAmount;

    private List<BudgetPeriodCategory> budgetPeriodCategories;
    private List<BudgetCategory> topExpenseCategories;
    private List<BudgetCategory> expenseCategories;
    private List<BudgetCategory> savingsCategories;
    private List<BudgetCategory> incomeCategories;

    private BudgetStats budgetStats;

    private boolean isOverBudget;

    // Utility methods
    public boolean isWithinBudget() {
        return actualBudgetAmount.compareTo(budgetAmount) <= 0;
    }

    public BigDecimal getSpendingPercentage() {
        if (budgetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return actualBudgetAmount
                .divide(budgetAmount, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    public BigDecimal getRemainingPercentage() {
        return new BigDecimal("100").subtract(getSpendingPercentage());
    }

    public void calculateFlags() {
        this.isOverBudget = actualBudgetAmount.compareTo(budgetAmount) > 0;
    }

    @JsonProperty("processingSummary")
    public Map<String, Object> getProcessingSummary() {
        return Map.of(
                "budgetId", budgetId,
                "processDate", processDate,
                "healthScore", healthScore,
                "isOverBudget", isOverBudget,
                "remainingAmount", remainingBudgetAmount,
                "spendingPercentage", getSpendingPercentage()
        );
    }

}
