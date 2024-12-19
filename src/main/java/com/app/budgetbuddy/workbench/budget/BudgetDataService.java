package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.BudgetPeriodCategory;
import com.app.budgetbuddy.domain.BudgetStats;
import com.app.budgetbuddy.workbench.TransactionRunner;
import com.app.budgetbuddy.workbench.runner.BudgetScheduleRunner;
import com.app.budgetbuddy.workbench.runner.TransactionCategoryRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetDataService
{
    private BudgetScheduleRunner budgetScheduleRunner;
    private TransactionRunner transactionRunner;
    private TransactionCategoryRunner transactionCategoryRunner;

    @Autowired
    public BudgetDataService(BudgetScheduleRunner budgetScheduleRunner,
                             TransactionRunner transactionRunner,
                             TransactionCategoryRunner transactionCategoryRunner)
    {
        this.budgetScheduleRunner = budgetScheduleRunner;
        this.transactionRunner = transactionRunner;
        this.transactionCategoryRunner = transactionCategoryRunner;
    }

    public void refreshTransactions(Long userId, LocalDate startDate, LocalDate endDate){

    }

    public void createTransactionCategories(final Long userId, LocalDate startDate, LocalDate endDate)
    {

    }

    public BigDecimal getBudgetHealthScore(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }


    public List<BudgetPeriodCategory> getWeeklyBudgetCategories(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetPeriodCategory> getMonthlyBudgetCategories(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetPeriodCategory> getBiWeeklyBudgetCategories(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetPeriodCategory> getDailyBudgetCategories(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public BudgetStats getMonthlyBudgetStatistics(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetCategory> getTopExpenseCategories(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetCategory> getExpenseCategory(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetCategory> getSavingsCategory(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }

    public List<BudgetCategory> getIncomeCategory(LocalDate startDate, LocalDate endDate, Long userId){
        return null;
    }



}
