package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class BudgetCategoryRunner {
    private List<UserBudgetCategory> createdUserBudgetCategories = new ArrayList<>();
    private List<Transaction> convertedPlaidTransactions = new ArrayList<>();
    private BudgetService budgetService;
    private BudgetGoalsService budgetGoalsService;
    private TransactionService transactionService;
    private boolean categoriesLoaded;

    @Autowired
    public BudgetCategoryRunner(BudgetService budgetService, BudgetGoalsService budgetGoalsService, TransactionService transactionService) {
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
        this.transactionService = transactionService;
    }

    public BigDecimal getBudgetedAmountByGoal()
    {
        return null;
    }

    public BigDecimal

    public void fetchPlaidTransactionsForUser(Long userId, LocalDate startDate, LocalDate endDate)
    {
        this.convertedPlaidTransactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
    }

    public List<UserBudgetCategory> buildUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod) {
        return null;
    }

    public List<UserBudgetCategory> updateUserBudgetCategories(List<Transaction> newTransactions, Budget budget, Period period, LocalDate startDate, LocalDate endDate) {
        return null;
    }

    public void saveUserBudgetCategories(List<UserBudgetCategory> userBudgetCategories) {

    }

    public void run(boolean start)
    {

    }

    public static void main(String[] args)
    {

    }
}
