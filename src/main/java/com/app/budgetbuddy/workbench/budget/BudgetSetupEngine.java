package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Component
public class BudgetSetupEngine
{

    public void budgetInitializer(Budget budget, List<Category> categories, List<Transaction> transactions, List<BudgetStats> budgetStats, List<RecurringTransactionDTO> recurringTransactions, LocalDate startDate, LocalDate endDate){

    }

    public Category initializeIncomeCategory(List<RecurringTransactionDTO> recurringTransactions){
        return null;
    }

    public Map<Long, List<BudgetStats>> initializeUserBudgetStatistics(Long budgetId, List<BudgetStats> budgetStats, BudgetPeriod budgetPeriod){
        return null;
    }

    public TreeMap<Long, List<Category>> initializeUserCategories(List<Transaction> transactions, List<BudgetCategory> budgetCategories, Long userId){
        return null;
    }

    public BigDecimal initializeBudgetExpenses(List<Transaction> transactions, Budget budget, List<Category> categories, LocalDate startDate, LocalDate endDate){
        return null;
    }

    public Map<Long, List<Category>> loadTopBudgetExpenseCategories(final List<Transaction> transactions, BudgetPeriod budgetPeriod){
        return null;
    }


}
