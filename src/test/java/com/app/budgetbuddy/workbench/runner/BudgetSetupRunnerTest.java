package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.BudgetRegistration;
import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetSetupRunnerTest
{
    @Mock
    private BudgetSetupEngine budgetSetupEngine;

    @InjectMocks
    private BudgetSetupRunner budgetSetupRunner;

    private BudgetRegistration budgetRegistration;
    private Budget currentBudget;
    private Budget previousYearBudget;


    @BeforeEach
    void setUp() {

        // Setup budget registration
        budgetRegistration = new BudgetRegistration();
        budgetRegistration.setUserId(1L);
        budgetRegistration.setBudgetYear(2023);
        budgetRegistration.setBudgetName("Test Budget 2023");
        budgetRegistration.setTotalIncomeAmount(new BigDecimal("50000.00"));
        budgetRegistration.setBudgetGoals(new BudgetGoals());

        // Setup current budget
        currentBudget = new Budget();
        currentBudget.setId(101L);
        currentBudget.setUserId(1L);
        currentBudget.setBudgetYear(2023);
        currentBudget.setBudgetName("Test Budget 2023");
        currentBudget.setStartDate(LocalDate.of(2023, 1, 1));
        currentBudget.setEndDate(LocalDate.of(2023, 12, 31));

        // Setup previous year budget
        previousYearBudget = new Budget();
        previousYearBudget.setId(102L);
        previousYearBudget.setUserId(1L);
        previousYearBudget.setBudgetYear(2022);
        previousYearBudget.setBudgetName("Test Budget 2022");
        previousYearBudget.setStartDate(LocalDate.of(2022, 1, 1));
        previousYearBudget.setEndDate(LocalDate.of(2022, 12, 31));

        budgetSetupRunner = new BudgetSetupRunner(budgetSetupEngine);
    }



    @AfterEach
    void tearDown() {
    }
}