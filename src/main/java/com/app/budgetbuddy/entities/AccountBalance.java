package com.app.budgetbuddy.entities;

import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

@Embeddable
public class AccountBalance
{
    private BigDecimal currentBalance;
    private BigDecimal availableBalance;
}
