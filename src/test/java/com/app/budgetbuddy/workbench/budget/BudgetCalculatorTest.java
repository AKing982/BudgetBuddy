package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.BudgetService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetCalculatorTest {

    @InjectMocks
    private BudgetCalculator budgetCalculator;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetGoalsService budgetGoalsService;

    private Category testCategory;

    private Budget testBudget;

    private BudgetPeriod testBudgetPeriod;

    @BeforeEach
    void setUp() {

        testCategory = new Category();
        testCategory.setCategoryDescription("Groceries and Supermarkets");
        testCategory.setCategoryName("Groceries");

        testBudget = new Budget();
        testBudget.setActual(new BigDecimal("400.00"));
        testBudget.setBudgetName("Test Budget");
        testBudget.setBudgetDescription("Test Budget Description");
        testBudget.setBudgetAmount(new BigDecimal("500.00"));
        testBudget.setLeftOver(new BigDecimal("100.00"));
        testBudget.setUserId(1L);
        testBudget.setId(1L);

        testBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 5, 30));
    }

    @Test
    void testCalculateActualBudgetedAmountForCategory_whenCategoryIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.calculateActualBudgetedAmountForCategory(null, 1L);
        });
    }

    @Test
    void testCalculateActualBudgetedAmountForCategory_whenBudgetIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.calculateActualBudgetedAmountForCategory(testCategory, null);
        });
    }

    @Test
    void testCalculateActualBudgetAmount_whenCategoryAndBudgetAreNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.calculateActualBudgetedAmountForCategory(null, null);
        });
    }

    @Test
    void testGenerateCategoryBudgetAmount_whenCategoryIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.generateCategoryBudgetAmount(null, testBudget, testBudgetPeriod);
        });
    }

    @Test
    void testGenerateCategoryBudgetAmount_whenBudgetIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.generateCategoryBudgetAmount(testCategory, null, testBudgetPeriod);
        });
    }

    @Test
    void testGenerateCategoryBudgetAmount_whenBudgetPeriodIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.generateCategoryBudgetAmount(testCategory, testBudget, null);
        });
    }

    @Test
    void testGenerateCategoryBudgetAmount_whenParametersAreValid(){

    }



    @Test
    void testCalculateActualBudgetAmount_whenCategoryAndBudgetValid_thenReturnBudgetAmount(){

    }



    @AfterEach
    void tearDown() {
    }
}