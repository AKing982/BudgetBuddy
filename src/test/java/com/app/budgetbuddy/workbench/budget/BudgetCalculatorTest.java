package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.Category;
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

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetCalculatorTest {

    @InjectMocks
    private BudgetCalculator budgetCalculator;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetGoalsService budgetGoalsService;

    private Budget testBudget;

    private Category testCategory;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setBudgetAmount(new BigDecimal("500.00"));
        testBudget.setBudgetDescription("test budget");
        testBudget.setBudgetName("test budget");
        testBudget.setLeftOver(new BigDecimal("100.00"));
        testBudget.setUserId(1L);
        testBudget.setActual(new BigDecimal("400.00"));

        testCategory = new Category();
        testCategory.setCategoryDescription("Groceries and Supermarkets");
        testCategory.setCategoryName("Groceries");
    }

    @Test
    void testCalculateActualBudgetedAmountForCategory_whenCategoryIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCalculator.calculateActualBudgetedAmountForCategory(null, testBudget);
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
    void testCalculateActualBudgetAmount_whenCategoryAndBudgetValid_thenReturnBudgetAmount(){

    }



    @AfterEach
    void tearDown() {
    }
}