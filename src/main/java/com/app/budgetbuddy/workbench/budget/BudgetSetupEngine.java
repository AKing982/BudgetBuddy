package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.services.BudgetCategoriesService;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.services.UserService;
import com.app.budgetbuddy.workbench.categories.TransactionCategorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Component
public class BudgetSetupEngine
{
    private final UserService userService;
    private final BudgetService budgetService;
    private final BudgetCalculator budgetCalculator;
    private final TransactionCategorizationService transactionCategorizationService;
    private final BudgetCategoriesService budgetCategoriesService;
    private final BudgetCategoryBuilder budgetCategoryBuilder;
    private boolean isBudgetSetupCompleted;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             BudgetCalculator budgetCalculator,
                             TransactionCategorizationService transactionCategorizationService,
                             BudgetCategoriesService budgetCategoriesService,
                             UserBudgetCategoryService userBudgetCategoryService,
                             BudgetCategoryBuilder budgetCategoryBuilder){
        this.userService = userService;
        this.budgetService = budgetService;
        this.budgetCalculator = budgetCalculator;
        this.transactionCategorizationService = transactionCategorizationService;
        this.budgetCategoriesService = budgetCategoriesService;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
    }

    public Budget loadUserBudget(Long userId)
    {
        return null;
    }

    public void initializeDebtPlan(Budget budget)
    {

    }

    public void initializeEmergencyFundPlan(Budget budget)
    {

    }

    public void initializeControlSpendingPlan(Budget budget)
    {

    }

    public void setupBudgetPeriodData(Long userId, BudgetPeriod budgetPeriod)
    {

    }

    public BudgetGoalsEntity loadUserBudgetGoals(Long userId)
    {
        return null;
    }

    public Map<Long, SavingsGoal> loadUserSavingsGoal(Long userId)
    {
        return null;
    }

    public BudgetCategoriesEntity loadUserBudgetCategories(Long userId){
        return null;
    }

    public void budgetInitializer(Budget budget, List<Category> categories, List<BudgetStats> budgetStats, BudgetPeriod budgetPeriod){

    }

    public List<Transaction> fetchPlaidTransactionsForUser(Long userId)
    {
        return null;
    }

    public List<UserBudgetCategoryEntity> createUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod)
    {
        return null;
    }

    public Boolean checkIfBudgetCategoriesExist(){
        return false;
    }

    public List<BudgetCategory> createInitialBudgetCategories(List<Category> categories, BudgetPeriod budgetPeriod, Long userId){
        return List.of();
    }

    public Category initializeIncomeCategory(List<RecurringTransactionDTO> recurringTransactions, Long userId, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<LocalDate, List<BudgetStats>> initializeUserBudgetStatistics(Long budgetId, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public TreeMap<Long, List<Category>> initializeUserCategories(List<Transaction> transactions, List<BudgetCategory> budgetCategories, Long userId, BudgetPeriod budgetPeriod){
        return null;
    }

    public Category initializeBudgetExpenses(List<Transaction> transactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public Category initializeBudgetSavings(List<Transaction> transactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<Long, List<Category>> loadTopBudgetExpenseCategories(final List<Transaction> transactions, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<String, Category> loadBudgetPeriodCategories(final BudgetPeriod budgetPeriod, final Budget budget){
        return null;
    }


}
