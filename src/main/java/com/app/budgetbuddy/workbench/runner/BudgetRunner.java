package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetRunner
{
    private final TransactionCategoryBuilder budgetCategoryBuilder;
    private final BudgetPeriodQueries budgetPeriodQueries;
    private final BudgetQueriesService budgetQueriesService;

    @Autowired
    public BudgetRunner(TransactionCategoryBuilder budgetCategoryBuilder,
                        BudgetPeriodQueries budgetPeriodQueries,
                        BudgetQueriesService budgetQueriesService){
        this.budgetCategoryBuilder = budgetCategoryBuilder;
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.budgetQueriesService = budgetQueriesService;
    }

    public List<DateRange> getCalculatedDateRanges(LocalDate startDate, LocalDate endDate, Period period){
        return null;
    }

    public BigDecimal calculateBudgetHealthScore(Budget budget, LocalDate startDate, LocalDate endDate){
        return null;
    }

    public List<BudgetPeriodParams> getBudgetPeriodData(final LocalDate startDate, final LocalDate endDate, final Long userId, final Period period)
    {
        return null;
    }

    public List<BudgetStats> loadBudgetStatisticsForUser(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        return null;
    }

    public List<BudgetCategory> loadTopExpenseCategories(final Budget budget, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public List<BudgetCategory> loadExpenseCategory(final Budget budget, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public List<BudgetCategory> loadSavingsCategory(final Budget budget, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;
    }

    public List<BudgetCategory> loadIncomeCategory(final BigDecimal incomeAmount, final Long budgetId, final LocalDate startDate, final LocalDate endDate, final Period period){
        return null;

    }

    public List<TransactionCategory> createNewTransactionCategories(List<Transaction> transactions, List<RecurringTransaction> recurringTransactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public List<TransactionCategory> updateTransactionCategories(final List<TransactionCategory> existingTransactionCategories, final List<Transaction> transactions, final Budget budget, final BudgetPeriod budgetPeriod){
        return null;
    }



}
