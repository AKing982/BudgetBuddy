package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CategoryEntryAmount
{
    private EntryType entryType;
    private String category;
    private DateRange dateRange;
    private BigDecimal budgeted;
    private BigDecimal amount;
    private BigDecimal goalsReached;
    private BigDecimal saved;

    public CategoryEntryAmount(EntryType entryType, DateRange dateRange, String category, BigDecimal budgeted, BigDecimal amount)
    {
        this.entryType = entryType;
        this.dateRange = dateRange;
        this.category = category;
        this.budgeted = budgeted;
        this.amount = amount;
    }

    public CategoryEntryAmount(EntryType entryType, BigDecimal totalBudgeted, BigDecimal totalSpending, BigDecimal totalGoalsReached, BigDecimal totalSaved)
    {
        this.entryType = entryType;
        this.budgeted = totalBudgeted;
        this.amount = totalSpending;
        this.goalsReached = totalGoalsReached;
        this.saved = totalSaved;
    }
}
