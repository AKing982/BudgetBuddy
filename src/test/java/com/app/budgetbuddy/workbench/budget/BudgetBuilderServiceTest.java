package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.BudgetRegistration;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.BudgetService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class BudgetBuilderServiceTest
{
    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetScheduleEngine budgetScheduleEngine;

    @InjectMocks
    private BudgetBuilderService budgetBuilderService;

    private BudgetRegistration testBudgetRegistration;

    private BudgetRegistration budgetRegistrationMissingParams;

    @BeforeEach
    void setUp() {
        budgetBuilderService = new BudgetBuilderService(budgetService, budgetScheduleEngine);

        // Fully populated BudgetRegistration, including BudgetGoals
        testBudgetRegistration = new BudgetRegistration();
        testBudgetRegistration.setUserId(1L);
        testBudgetRegistration.setBudgetName("Test Budget");
        testBudgetRegistration.setBudgetType("MONTHLY");
        testBudgetRegistration.setBudgetPeriod(Period.MONTHLY);

        // Here’s where you add your BudgetGoals record:
        // The constructor parameters must match your record definition:
        // public record BudgetGoals(
        //      Long budgetId, double targetAmount, double monthlyAllocation,
        //      double currentSavings, String goalType, String savingsFrequency, String status)
        BudgetGoals goals = new BudgetGoals(
                101L,       // budgetId
                5000.0,     // targetAmount
                500.0,      // monthlyAllocation
                250.0,      // currentSavings
                "LONG_TERM",// goalType
                "MONTHLY",  // savingsFrequency
                "ACTIVE"    // status
        );
        testBudgetRegistration.setBudgetGoals(goals);

        testBudgetRegistration.setBudgetStartDate(LocalDate.of(2025, 1, 1));
        testBudgetRegistration.setBudgetEndDate(LocalDate.of(2025, 1, 31));
        testBudgetRegistration.setBudgetedAmount(BigDecimal.valueOf(1000));
        testBudgetRegistration.setTotalIncomeAmount(BigDecimal.valueOf(2000));
        testBudgetRegistration.setNumberOfMonths(1);
        testBudgetRegistration.setTotalBudgetsNeeded(1);
        testBudgetRegistration.setBudgetExists(false);

        // BudgetRegistration with missing parameters, including missing BudgetGoals
        budgetRegistrationMissingParams = new BudgetRegistration();
        budgetRegistrationMissingParams.setUserId(null);
        budgetRegistrationMissingParams.setBudgetName("");
        budgetRegistrationMissingParams.setBudgetType(null);
        budgetRegistrationMissingParams.setBudgetPeriod(Period.MONTHLY);
        budgetRegistrationMissingParams.setBudgetGoals(null); // For missing goals
        budgetRegistrationMissingParams.setBudgetStartDate(LocalDate.of(2025, 1, 1));
        budgetRegistrationMissingParams.setBudgetEndDate(LocalDate.of(2025, 1, 31));
        budgetRegistrationMissingParams.setBudgetedAmount(new BigDecimal("2050"));
        budgetRegistrationMissingParams.setTotalIncomeAmount(null);
        budgetRegistrationMissingParams.setNumberOfMonths(3);
        budgetRegistrationMissingParams.setTotalBudgetsNeeded(0);
        budgetRegistrationMissingParams.setBudgetExists(false);
    }

    @Test
    void testBuildBudgetFromRegistration_whenBudgetRegistrationIsNull_thenReturnEmptyOptional()
    {
        Optional<Budget> actual = budgetBuilderService.buildBudgetFromRegistration(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void buildBudgetFromRegistration_whenBudgetRegistrationParametersNull_thenThrowException()
    {
        assertThrows(BudgetBuildException.class, () -> {
            budgetBuilderService.buildBudgetFromRegistration(budgetRegistrationMissingParams);
        });
    }




    @AfterEach
    void tearDown() {
    }
}