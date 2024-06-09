package com.example.budgetservice.models;

import com.example.budgetservice.BudgetType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class Budget
{
    private int id;
    private String name;
    private BudgetType budgetType;
    private BigDecimal allocatedAmount;
    private BigDecimal budgetGoal;
    private BudgetPeriod budgetPeriod;
    private LocalDate dateCreated;

    public Budget(int id, String name, BudgetType budgetType, BigDecimal allocatedAmount, BigDecimal budgetGoal, BudgetPeriod budgetPeriod, LocalDate dateCreated) {
        this.id = id;
        this.name = name;
        this.budgetType = budgetType;
        this.allocatedAmount = allocatedAmount;
        this.budgetGoal = budgetGoal;
        this.budgetPeriod = budgetPeriod;
        this.dateCreated = dateCreated;
    }
}
