package com.app.budgetbuddy.domain;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class BudgetSchedule
{
    private Long budgetId;
    private LocalDate budgetStartDate;
    private LocalDate budgetEndDate;
    private List<TransactionCategory> transactionCategories;
    private List<BudgetCategory> budgetCategories;
    private List<DateRange> budgetDateRanges;
    private List<BudgetStats> budgetStatistics;
}
