package com.example.budgetservice.models;

import com.example.budgetservice.PeriodType;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class BudgetPeriod
{
    private LocalDate startDate;
    private LocalDate endDate;
    private Budget budget;
    private PeriodType periodType;
    private Set<Expense> expenses;

    public BudgetPeriod(LocalDate startDate, LocalDate endDate, Budget budget, PeriodType periodType, Set<Expense> expenses) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.budget = budget;
        this.periodType = periodType;
        this.expenses = expenses;
    }

    public BudgetPeriod(){

    }

    public void addExpense(Expense expense){
        this.expenses.add(expense);
    }

    public void addExpenses(Set<Expense> expenses){
        this.expenses.addAll(expenses);
    }

    public void removeExpense(Expense expense){
        this.expenses.remove(expense);
    }
}
