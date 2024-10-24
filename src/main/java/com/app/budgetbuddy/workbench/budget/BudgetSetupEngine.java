package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoriesService;
import com.app.budgetbuddy.services.BudgetService;
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
    private boolean isBudgetSetupCompleted;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             BudgetCalculator budgetCalculator,
                             TransactionCategorizationService transactionCategorizationService,
                             BudgetCategoriesService budgetCategoriesService){
        this.userService = userService;
        this.budgetService = budgetService;
        this.budgetCalculator = budgetCalculator;
        this.transactionCategorizationService = transactionCategorizationService;
        this.budgetCategoriesService = budgetCategoriesService;
    }

    private BigDecimal getCalculatedBudgetAmountForCategory(Category category, Long budgetId){
        return null;
    }

    private BigDecimal getCalculatedActualBudgetAmountForCategory(Category category, Long budgetId){
        return null;
    }

    private BigDecimal getCalculatedRemainingBudgetAmountForCategory(Category category, Long budgetId){
        return null;
    }

    public void budgetInitializer(Budget budget, List<Category> categories, List<BudgetStats> budgetStats, BudgetPeriod budgetPeriod){

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


}