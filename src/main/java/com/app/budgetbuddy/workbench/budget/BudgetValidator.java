package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.exceptions.InvalidBudgetActualAmountException;
import com.app.budgetbuddy.exceptions.InvalidBudgetAmountException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BudgetValidator
{
    public void validateBudgetAmount(BigDecimal budgetAmount)
    {
        if(budgetAmount.compareTo(BigDecimal.ZERO) < 0)
        {
            throw new InvalidBudgetAmountException("Invalid Budget Amount: " + budgetAmount + "Unable to calculate Total Budget Health");
        }
    }

    public void validateBudgetActual(BigDecimal budgetActual)
    {
        if(budgetActual.compareTo(BigDecimal.ZERO) < 0)
        {
            throw new InvalidBudgetActualAmountException("Invalid Budget Actual Amount: " + budgetActual + "Unable to calculate Total Budget Health");
        }
    }
}
