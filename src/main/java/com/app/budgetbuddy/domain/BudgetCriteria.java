package com.app.budgetbuddy.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= lombok.AccessLevel.PUBLIC)
@Builder
public class BudgetCriteria
{
    private BigDecimal budgeted;
    private BigDecimal actualSpent;
    private BigDecimal totalEnvelopeAmount;
    private BigDecimal currentAccountBalance;
    private Long userId;

    public BudgetCriteria(BigDecimal budgeted, BigDecimal actualSpent, BigDecimal totalEnvelopeAmount, BigDecimal currentAccountBalance, Long userId) {
        this.budgeted = budgeted;
        this.actualSpent = actualSpent;
        this.totalEnvelopeAmount = totalEnvelopeAmount;
        this.currentAccountBalance = currentAccountBalance;
        this.userId = userId;
    }

    public BigDecimal getAvailableEnvelopeSurplus()
    {
        return budgeted.subtract(actualSpent)
                .subtract(totalEnvelopeAmount);
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BudgetCriteria that = (BudgetCriteria) o;
        return Objects.equals(budgeted, that.budgeted) && Objects.equals(actualSpent, that.actualSpent) && Objects.equals(totalEnvelopeAmount, that.totalEnvelopeAmount) && Objects.equals(currentAccountBalance, that.currentAccountBalance) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(budgeted, actualSpent, totalEnvelopeAmount, currentAccountBalance, userId);
    }
}
