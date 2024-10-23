package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetRunner
{
    private final BudgetSetupEngine budgetSetupEngine;

    @Autowired
    public BudgetRunner(BudgetSetupEngine budgetSetupEngine){
        this.budgetSetupEngine = budgetSetupEngine;
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
