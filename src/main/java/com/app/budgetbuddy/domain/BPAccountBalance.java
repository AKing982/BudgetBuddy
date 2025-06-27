package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Getter
@Setter
@Slf4j
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPAccountBalance implements Cloneable
{
    private Long id;
    private String accountId;
    private DateRange dateRange;
    private BigDecimal currentBalance;

    public BPAccountBalance(String accountId, DateRange dateRange, BigDecimal currentBalance)
    {
        this.accountId = accountId;
        this.dateRange = dateRange;
        this.currentBalance = currentBalance;
    }

    public BigDecimal calculatePlannedBalance(final BigDecimal currentBalance, final BigDecimal totalPlannedSpending)
    {
        if(currentBalance == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            return currentBalance.subtract(totalPlannedSpending);
        }catch(ArithmeticException ex){
            log.error("There was an error calculating the planned balance: ", ex);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal calculateAvailableBalance(final BigDecimal plannedBalance, final BigDecimal actualBalance)
    {
        if (plannedBalance == null || actualBalance == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            return plannedBalance.subtract(actualBalance);
        } catch (ArithmeticException ex)
        {
            log.error("There was an error calculating the available balance: ", ex);
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BPAccountBalance clone()
    {
        try
        {
            // TODO: copy mutable state here, so the clone can't change the internals of the original
            return (BPAccountBalance) super.clone();
        } catch (CloneNotSupportedException e)
        {
            throw new AssertionError();
        }
    }
}
