package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.BudgetPeriodException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.budget.TransactionCategoryBuilder;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

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
    private CategoryRuleEngine categoryRuleEngine;

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
        transactionCategoryRunner = new TransactionCategoryRunner(transactionCategoryService, transactionCategoryBuilder, transactionService, budgetService,categoryService, categoryRuleEngine, recurringTransactionService);
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
        Map<String, List<String>> categorizedTransactions = new HashMap<>();
        categorizedTransactions.put("Groceries", List.of("tx123"));

        List<TransactionCategory> expected = List.of(
                new TransactionCategory(1L, 1L, "cat123", "Food",
                        200.0, 100.0, true, startDate, endDate, 0.0, false)
        );
        DateRange dateRange = new DateRange(startDate, endDate);
        when(categoryRuleEngine.finalizeUserTransactionCategoriesForDateRange(List.of(transaction), 1L, dateRange))
                .thenReturn(categorizedTransactions);

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

    @Test
    void testUpdateTransactionCategories_whenExistingTransactionCategoriesIsNull_thenReturnEmptyList(){
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

        List<Transaction> transactions = List.of(transaction);
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 30));
        List<TransactionCategory> actual = transactionCategoryRunner.updateTransactionCategories(null, transactions, testBudget, budgetPeriod);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateTransactionCategories_whenTransactionsListNull_thenReturnEmptyList(){
        List<Transaction> transactions = new ArrayList<>();
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 30));
        List<TransactionCategory> existingTransactionCategories = new ArrayList<>();

        TransactionCategory groceryTransactionCategory = new TransactionCategory();
        groceryTransactionCategory.setId(1L);
        groceryTransactionCategory.setOverSpent(false);
        groceryTransactionCategory.setTransactions(createGroceryTransactions());
        groceryTransactionCategory.setCategoryId("cat1");
        groceryTransactionCategory.setIsActive(true);
        groceryTransactionCategory.setCategoryName("Groceries");
        groceryTransactionCategory.setBudgetId(1L);
        groceryTransactionCategory.setBudgetActual(79.56);
        groceryTransactionCategory.setBudgetedAmount(120.0);
        groceryTransactionCategory.setStartDate(LocalDate.of(2024, 8, 1));
        groceryTransactionCategory.setEndDate(LocalDate.of(2024, 8, 8));
        groceryTransactionCategory.setOverSpendingAmount(0.0);
        existingTransactionCategories.add(groceryTransactionCategory);

        List<TransactionCategory> actual = transactionCategoryRunner.updateTransactionCategories(existingTransactionCategories, null, testBudget, budgetPeriod);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateTransactionCategories_whenNewTransactionsDontOverlapExistingTransactionCategories_thenReturnTransactionCategories(){

        List<Transaction> transactions = List.of(
                new Transaction("acc1", new BigDecimal("50.23"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 8, 12), "desc", "merchant", "name", false, "trans_11_02",
                        null, null, LocalDate.of(2024, 8, 15)),
                new Transaction("acc1", new BigDecimal("23.23"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 8, 8), "desc", "merchant", "name", false, "trans_11_08",
                        null, null, LocalDate.of(2024, 8, 16)));

        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 30));

        List<TransactionCategory> existingTransactionCategories = new ArrayList<>();
        TransactionCategory existingGroceryTransactionCategory = new TransactionCategory();
        existingGroceryTransactionCategory.setId(1L);
        existingGroceryTransactionCategory.setOverSpent(false);
        existingGroceryTransactionCategory.setTransactions(createGroceryTransactions());
        existingGroceryTransactionCategory.setCategoryId("cat1");
        existingGroceryTransactionCategory.setIsActive(true);
        existingGroceryTransactionCategory.setCategoryName("Groceries");
        existingGroceryTransactionCategory.setBudgetId(1L);
        existingGroceryTransactionCategory.setBudgetActual(79.56);
        existingGroceryTransactionCategory.setBudgetedAmount(120.0);
        existingGroceryTransactionCategory.setStartDate(LocalDate.of(2024, 8, 1));
        existingGroceryTransactionCategory.setEndDate(LocalDate.of(2024, 8, 8));
        existingGroceryTransactionCategory.setOverSpendingAmount(0.0);
        existingTransactionCategories.add(existingGroceryTransactionCategory);

        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
        TransactionCategory groceryTransactionCategory = new TransactionCategory();
        groceryTransactionCategory.setId(1L);
        groceryTransactionCategory.setOverSpent(false);
        groceryTransactionCategory.setTransactions(transactions);
        groceryTransactionCategory.setCategoryId("cat1");
        groceryTransactionCategory.setIsActive(true);
        groceryTransactionCategory.setCategoryName("Groceries");
        groceryTransactionCategory.setBudgetId(1L);
        groceryTransactionCategory.setBudgetActual(79.56);
        groceryTransactionCategory.setBudgetedAmount(120.0);
        groceryTransactionCategory.setStartDate(LocalDate.of(2024, 8, 9));
        groceryTransactionCategory.setEndDate(LocalDate.of(2024, 8, 16));
        groceryTransactionCategory.setOverSpendingAmount(0.0);
        expectedTransactionCategories.add(existingGroceryTransactionCategory);
        expectedTransactionCategories.add(groceryTransactionCategory);

        when(transactionService.getTransactionById("trans1")).thenReturn(Optional.of())

        List<TransactionCategory> actual = transactionCategoryRunner.updateTransactionCategories(existingTransactionCategories, transactions, testBudget, budgetPeriod);
        assertNotNull(actual);
        assertEquals(expectedTransactionCategories.size(), actual.size());
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expectedTransactionCategories.get(i).getTransactions().size(), actual.get(i).getTransactions().size());
            assertEquals(expectedTransactionCategories.get(i).getCategoryId(), actual.get(i).getCategoryId());
            assertEquals(expectedTransactionCategories.get(i).getIsActive(), actual.get(i).getIsActive());
            assertEquals(expectedTransactionCategories.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expectedTransactionCategories.get(i).getBudgetId(), actual.get(i).getBudgetId());
            assertEquals(expectedTransactionCategories.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
            assertEquals(expectedTransactionCategories.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expectedTransactionCategories.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expectedTransactionCategories.get(i).getEndDate(), actual.get(i).getEndDate());
            assertEquals(expectedTransactionCategories.get(i).getOverSpendingAmount(), actual.get(i).getOverSpendingAmount());
        }
    }


    private List<Transaction> createGroceryTransactions(){
        return List.of(
                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 8, 2), "desc", "merchant", "name", false, "trans_11_02",
                        null, null, LocalDate.of(2024, 8, 2)),
                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 8, 8), "desc", "merchant", "name", false, "trans_11_08",
                        null, null, LocalDate.of(2024, 8, 8))
        );
    }

    private TransactionsEntity createTransactionEntity(){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setPosted();
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