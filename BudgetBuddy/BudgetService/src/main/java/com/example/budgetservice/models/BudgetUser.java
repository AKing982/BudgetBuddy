package com.example.budgetservice.models;

import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class BudgetUser
{
    private int id;
    private String userName;
    private Set<Expense> expenses = new HashSet<>();
    private Set<Budget> budgets = new HashSet<>();

    public BudgetUser(int id, String userName) {
        this.id = id;
        this.userName = userName;
    }

    public void addBudgets(Set<Budget> budgets) {
        this.budgets.addAll(budgets);
    }

    public void addExpenses(Set<Expense> expenses) {
        this.expenses.addAll(expenses);
    }

    public void addExpense(Expense expense) {
        this.expenses.add(expense);
    }

    public void addBudget(Budget budget) {
        this.budgets.add(budget);
    }

    public void removeBudget(Budget budget) {
        this.budgets.remove(budget);
    }

    public void removeExpense(Expense expense) {
        this.expenses.remove(expense);
    }
}
