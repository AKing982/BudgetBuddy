package com.app.budgetbuddy.domain;

import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;

@Getter
@Setter
@Slf4j
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class BPAccountBalance implements Cloneable
{
    private Long id;
    private int columnIndex;
    private String accountId;
    private DateRange dateRange;
    private BigDecimal currentBalance;
    private BigDecimal plannedBalance;
    private BigDecimal availableBalance;
    private BigDecimal closingBalance;

    public BigDecimal calculatePlannedBalance(final BigDecimal totalPlannedSpending)
    {
        if(currentBalance == null)
        {
            log.warn("Current balance is null for accountId: {}", accountId);
            return BigDecimal.ZERO;
        }
        try
        {
            this.plannedBalance = currentBalance.subtract(totalPlannedSpending);
            return this.plannedBalance;
        }
        catch(ArithmeticException ex)
        {
            log.error("There was an error calculating the planned balance: ", ex);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal calculateAvailableBalance()
    {
        if(plannedBalance == null || currentBalance == null)
        {
            log.warn("Planned or current balance is null for accountId: {}", accountId);
            return BigDecimal.ZERO;
        }
        try
        {
            this.availableBalance = plannedBalance.subtract(currentBalance);
            return this.availableBalance;
        }
        catch(ArithmeticException ex)
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
            BPAccountBalance clone = (BPAccountBalance) super.clone();
            clone.currentBalance = this.currentBalance;
            clone.plannedBalance = this.plannedBalance;
            clone.availableBalance = this.availableBalance;
            clone.dateRange = this.dateRange;
            return clone;
        }
        catch(CloneNotSupportedException e)
        {
            throw new AssertionError();
        }
    }
}
