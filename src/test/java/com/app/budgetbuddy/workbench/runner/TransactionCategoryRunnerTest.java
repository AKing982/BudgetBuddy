package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.BudgetPeriodException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.TransactionCategoryBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionCategoryRunnerTest {

    @Mock
    private TransactionService transactionService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @Mock
    private TransactionCategoryBuilder transactionCategoryBuilder;

    @InjectMocks
    private TransactionCategoryRunner transactionCategoryRunner;

    private Budget testBudget;

    @BeforeEach
    void setUp() {

        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setActual(new BigDecimal("1200"));
        testBudget.setBudgetAmount(new BigDecimal("3070"));
        testBudget.setUserId(1L);
        testBudget.setStartDate(LocalDate.of(2024, 8, 1));
        testBudget.setEndDate(LocalDate.of(2024, 8, 30));
        testBudget.setBudgetName("Savings Budget Plan");
        testBudget.setBudgetDescription("Savings Budget Plan for Savings Account");
        transactionCategoryRunner = new TransactionCategoryRunner(transactionCategoryService, transactionCategoryBuilder, transactionService, budgetService,categoryService, recurringTransactionService);
    }

    @Test
    void testCreateNewTransactionCategories_whenTransactionsIsNull_thenReturnEmptyList(){
        LocalDate startDate = LocalDate.of(2024, 8,1);
        LocalDate endDate = LocalDate.of(2024, 8,8);

        List<TransactionCategory> actual = transactionCategoryRunner.createNewTransactionCategories(null, testBudget, startDate, endDate);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateNewTransactionCategories_whenStartDateIsNull_thenThrowIllegalDateException(){
        List<Transaction> expected = new ArrayList<>();
        expected.add(new Transaction());
        LocalDate endDate = LocalDate.of(2024, 8, 8);

        assertThrows(IllegalDateException.class, () -> {
            transactionCategoryRunner.createNewTransactionCategories(expected, testBudget, null, endDate);
        });
    }

    @Test
    void testCreateNewTransactionCategories_whenEndDateIsNull_thenThrowIllegalDateException(){
        List<Transaction> expected = new ArrayList<>();
        expected.add(new Transaction());
        LocalDate startDate = LocalDate.of(2024, 8, 8);

        assertThrows(IllegalDateException.class, () -> {
            transactionCategoryRunner.createNewTransactionCategories(expected, testBudget, startDate, null);
        });
    }

    @Test
    void testCreateNewTransactionCategories_whenStartDateAndEndDateNotInBudgetPeriod_thenThrowBudgetPeriodException(){
        LocalDate startDate = LocalDate.of(2024, 7, 20);
        LocalDate endDate = LocalDate.of(2024, 7, 27);
        List<Transaction> expected = new ArrayList<>();
        expected.add(new Transaction());
        assertThrows(BudgetPeriodException.class, () -> {
            transactionCategoryRunner.createNewTransactionCategories(expected, testBudget, startDate, endDate);
        });
    }



    @Test
    void testCreateNewTransactionCategories_whenParametersValid_thenReturnTransactionCategories() {
        // Setup

        Transaction transaction = new Transaction(
                "acct123",
                new BigDecimal("100.00"),
                "USD",
                List.of("Groceries"),
                "cat123",
                LocalDate.of(2024, 8, 15),
                "Grocery Store",
                "Store",
                "Store",
                false,
                "tx123",
                LocalDate.of(2024, 8, 15),
                "logo.png",
                LocalDate.of(2024, 8, 15)
        );

        LocalDate startDate = LocalDate.of(2024, 8, 1);
        LocalDate endDate = LocalDate.of(2024, 8, 16);

        List<TransactionCategory> expected = List.of(
                new TransactionCategory(1L, 1L, "cat123", "Food",
                        200.0, 100.0, true, startDate, endDate, 0.0, false)
        );

        when(categoryService.findCategoryByName("Groceries")).thenReturn(Optional.of(createCategory("Groceries")));

        when(transactionCategoryBuilder.initializeTransactionCategories(
                any(Budget.class),
                any(BudgetPeriod.class),
                anyList()
        )).thenReturn(expected);

        // Execute
        List<TransactionCategory> result = transactionCategoryRunner.createNewTransactionCategories(
                List.of(transaction), testBudget, startDate, endDate);

        // Verify
        assertEquals(expected, result);
        verify(transactionCategoryBuilder).initializeTransactionCategories(
                eq(testBudget),
                any(BudgetPeriod.class),
                anyList()
        );
    }

    private CategoryEntity createCategory(String name){
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setName(name);
        return categoryEntity;
    }

    @AfterEach
    void tearDown() {
    }
}