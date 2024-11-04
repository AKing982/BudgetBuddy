package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilder;
import com.app.budgetbuddy.workbench.budget.BudgetDebtService;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodQueries;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetRunner
{
    private final BudgetCategoryBuilder budgetCategoryBuilder;
    private final BudgetPeriodQueries budgetPeriodQueries;
    private final BudgetGoalsService budgetGoalsService;

    @Autowired
    public BudgetRunner(BudgetCategoryBuilder budgetCategoryBuilder,
                        BudgetPeriodQueries budgetPeriodQueries,
                        BudgetGoalsService budgetGoalsService){
        this.budgetCategoryBuilder = budgetCategoryBuilder;
        this.budgetPeriodQueries = budgetPeriodQueries;
        this.budgetGoalsService = budgetGoalsService;
    }

    public BudgetPeriodParams getBudgetPeriodData(LocalDate startDate, LocalDate endDate, Long userId)
    {
        return null;
    }

    public List<Category> createUserCategoriesForPeriod(LocalDate startDate, LocalDate endDate, Long userId)
    {
        return null;
    }

    public List<BudgetStats> createUserBudgetStatistics(LocalDate startDate, LocalDate endDate, Long userId)
    {
        return null;
    }

    public BudgetGoalsEntity getBudgetGoalForUser(Long userId)
    {
        return null;
    }

    public void runBudgetSetup(boolean isRun){

    }

    private Budget initializeBudget(){
        return null;
    }

    private List<Category> initializeCategories(){
        return null;
    }

    private void runIncomeCategoryInitialization(){

    }

    private void runBudgetStatisticsInitialization(){

    }

    private void runTopExpenseCategoriesInitialization(){

    }

    private List<Transaction> fetchUserTransactions(Long userId, LocalDate startDate, LocalDate endDate){
        return null;
    }

}
