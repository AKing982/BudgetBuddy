package com.example.budgetservice.models;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class Expense
{
    private int id;
    private BigDecimal amount;
    private Category category;
    private String description;
    private LocalDate expenseDate;
    private BudgetUser user;
    private Budget budget;

    public Expense(int id, BigDecimal amount, Category category, String description, LocalDate expenseDate, BudgetUser user, Budget budget) {
        this.id = id;
        this.amount = amount;
        this.category = category;
        this.description = description;
        this.expenseDate = expenseDate;
        this.user = user;
        this.budget = budget;
    }
}
