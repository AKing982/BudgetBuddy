package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class BudgetCategoryRunner {
    private List<BudgetCategory> createdUserBudgetCategories = new ArrayList<>();
    private List<Transaction> convertedPlaidTransactions = new ArrayList<>();
    private List<Transaction> existingPlaidTransactions = new ArrayList<>();
    private BudgetService budgetService;
    private BudgetGoalsService budgetGoalsService;
    private TransactionService transactionService;
    private BudgetCategoryBuilder budgetCategoryBuilder;
    private Budget budget;
    private BudgetPeriod budgetPeriod;
    private boolean categoriesLoaded;

    @Autowired
    public BudgetCategoryRunner(BudgetService budgetService, BudgetGoalsService budgetGoalsService, TransactionService transactionService,
                                BudgetCategoryBuilder budgetCategoryBuilder) {
        this.budgetService = budgetService;
        this.budgetGoalsService = budgetGoalsService;
        this.transactionService = transactionService;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
    }

    public void loadBudgetPeriod(LocalDate startDate, LocalDate endDate, Period period) {

    }

    public void loadUserBudget(Long userId) {

    }

    /**
     * Determines if new plaid transactions have been added during the specified startDate and endDate
     *
     * @param userId
     * @param startDate
     * @param endDate
     * @return
     */
    public boolean hasNewPlaidTransactions(Long userId, LocalDate startDate, LocalDate endDate) {
        return false;
    }

    /**
     * Creates the initial User Budget Categories
     *
     * @param budget
     * @param budgetPeriod
     * @param transactions
     */
    public void createUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod, List<Transaction> transactions) {

    }

    /**
     * Updates current user Budget Categories using new Transactions
     * @param newTransactions
     * @param budget
     * @param budgetPeriod
     */
    public void updateUserBudgetCategories(List<Transaction> newTransactions, Budget budget, BudgetPeriod budgetPeriod)
    {

    }

    public void fetchPlaidTransactionsForUser(Long userId, LocalDate startDate, LocalDate endDate)
    {
        this.convertedPlaidTransactions = transactionService.getConvertedPlaidTransactions(userId, startDate, endDate);
    }

    /**
     * Persists the User Budget Categories to the database
     * @param userBudgetCategories
     */
    public void saveUserBudgetCategories(List<BudgetCategory> userBudgetCategories) {

    }

    @Async("taskExecutor")
    public CompletableFuture<Boolean> runForUser(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return CompletableFuture.completedFuture(true);
    }

    public void run(boolean start)
    {

    }

    public static void main(String[] args)
    {

    }
}
