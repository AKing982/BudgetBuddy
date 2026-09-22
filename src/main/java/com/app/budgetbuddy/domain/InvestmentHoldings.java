package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class InvestmentHoldings
{
    private Long id;
    private String accountId;
    private String name;
    private double amount;
    private String securityId;
    private double vestedAmount;
    private double costBasis;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        InvestmentHoldings that = (InvestmentHoldings) o;
        return Double.compare(amount, that.amount) == 0 && Double.compare(vestedAmount, that.vestedAmount) == 0 && Double.compare(costBasis, that.costBasis) == 0 && Objects.equals(accountId, that.accountId) && Objects.equals(name, that.name) && Objects.equals(securityId, that.securityId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(accountId, name, amount, securityId, vestedAmount, costBasis);
    }

    @Override
    public String toString() {
        return "InvestmentHoldings{" +
                "accountId='" + accountId + '\'' +
                ", name='" + name + '\'' +
                ", amount=" + amount +
                ", securityId='" + securityId + '\'' +
                ", vestedAmount=" + vestedAmount +
                ", costBasis=" + costBasis +
                '}';
    }
}
