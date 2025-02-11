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
    private Budget budget;
    private BudgetSchedule budgetSchedule;
    private List<BudgetStats> budgetStats;
    private BudgetCategoryStats budgetCategoryStats;
    private boolean isOverBudget;

    // Utility methods
    public boolean isWithinBudget() {
        return budget.getActual().compareTo(budget.getBudgetAmount()) <= 0;
    }

    public BigDecimal getSpendingPercentage() {
        BigDecimal budgetAmount = budget.getBudgetAmount();
        if (budgetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal actualBudgetAmount = budget.getActual();
        return actualBudgetAmount
                .divide(budgetAmount, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    public BigDecimal getRemainingPercentage() {
        return new BigDecimal("100").subtract(getSpendingPercentage());
    }


    @JsonProperty("processingSummary")
    public Map<String, Object> getProcessingSummary() {
        return Map.of(
                "budgetId", budget.getId(),
                "processDate", LocalDateTime.now(),
//                "healthScore", budgetStats.getHealthScore(),
                "isOverBudget", isOverBudget,
                "budgetSchedule", budgetSchedule,
                "remainingAmount", budget.getBudgetAmount().subtract(budget.getActual()),
                "spendingPercentage", getSpendingPercentage()
        );
    }

}
