package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionsByCategoryQueriesTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private TypedQuery<Object[]> typedQuery;

    private TransactionsByCategoryQueries transactionsByCategoryQueries;

    @BeforeEach
    void setUp()
    {
        transactionsByCategoryQueries = new TransactionsByCategoryQueries(
                entityManager,
                transactionCategoryService,
                transactionService
        );
    }

    private Transaction buildTransaction(String id, String category, BigDecimal amount)
    {
        Transaction t = new Transaction();
        t.setTransactionId(id);
        t.setAmount(amount);
        return t;
    }

    private void mockQueryReturning(List<Object[]> rows)
    {
        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
        when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
        when(typedQuery.getResultList()).thenReturn(rows);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getTransactionsByCategoryList — the method that uses createTransactionsByCategoryList
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void testGetTransactionsByCategoryList_whenResultsEmpty_thenReturnEmptyList()
    {
        mockQueryReturning(Collections.emptyList());

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertTrue(result.isEmpty());
    }

    @Test
    void testGetTransactionsByCategoryList_eachCategoryHasOnlyItsOwnTransactions()
    {
        // THE KEY REGRESSION TEST — catches the shared-list bug
        // 3 rows: 2 Groceries, 1 Subscription
        List<Object[]> rows = List.of(
                new Object[]{"Groceries",    "txn-001"},
                new Object[]{"Groceries",    "txn-002"},
                new Object[]{"Subscription", "txn-003"}
        );
        mockQueryReturning(rows);

        Transaction t1 = buildTransaction("txn-001", "Groceries",    new BigDecimal("45.00"));
        Transaction t2 = buildTransaction("txn-002", "Groceries",    new BigDecimal("32.00"));
        Transaction t3 = buildTransaction("txn-003", "Subscription", new BigDecimal("9.99"));

        when(transactionService.findTransactionById("txn-001")).thenReturn(Optional.of(t1));
        when(transactionService.findTransactionById("txn-002")).thenReturn(Optional.of(t2));
        when(transactionService.findTransactionById("txn-003")).thenReturn(Optional.of(t3));

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertNotNull(result);
        assertEquals(2, result.size(), "Should have exactly 2 distinct categories");

        TransactionsByCategory groceries = result.stream()
                .filter(t -> "Groceries".equals(t.getCategoryName()))
                .findFirst().orElseThrow();

        TransactionsByCategory subscription = result.stream()
                .filter(t -> "Subscription".equals(t.getCategoryName()))
                .findFirst().orElseThrow();

        // THE CRITICAL ASSERTIONS — each category must only contain its own transactions
        assertEquals(2, groceries.getTransactions().size(),
                "Groceries must have exactly 2 transactions, not all 3");
        assertEquals(1, subscription.getTransactions().size(),
                "Subscription must have exactly 1 transaction, not all 3");

        assertTrue(groceries.getTransactions().stream()
                        .allMatch(t -> "txn-001".equals(t.getTransactionId()) || "txn-002".equals(t.getTransactionId())),
                "Groceries must only contain its own transaction IDs");

        assertTrue(subscription.getTransactions().stream()
                        .allMatch(t -> "txn-003".equals(t.getTransactionId())),
                "Subscription must only contain its own transaction ID");

        // Ensure no cross-contamination — txn-003 must NOT appear in Groceries
        assertFalse(groceries.getTransactions().stream()
                        .anyMatch(t -> "txn-003".equals(t.getTransactionId())),
                "Subscription transaction must not bleed into Groceries");

        // Ensure no cross-contamination — txn-001/002 must NOT appear in Subscription
        assertFalse(subscription.getTransactions().stream()
                        .anyMatch(t -> "txn-001".equals(t.getTransactionId()) || "txn-002".equals(t.getTransactionId())),
                "Grocery transactions must not bleed into Subscription");
    }

    @Test
    void testGetTransactionsByCategoryList_whenManyCategories_eachCategoryTransactionCountIsCorrect()
    {
        // Simulates the 36-transaction scenario from the logs
        List<Object[]> rows = List.of(
                new Object[]{"Groceries",    "txn-001"},
                new Object[]{"Groceries",    "txn-002"},
                new Object[]{"Groceries",    "txn-003"},
                new Object[]{"Gas",          "txn-004"},
                new Object[]{"Subscription", "txn-005"},
                new Object[]{"Subscription", "txn-006"},
                new Object[]{"Order Out",    "txn-007"}
        );
        mockQueryReturning(rows);

        when(transactionService.findTransactionById("txn-001")).thenReturn(Optional.of(buildTransaction("txn-001", "Groceries",    new BigDecimal("33.00"))));
        when(transactionService.findTransactionById("txn-002")).thenReturn(Optional.of(buildTransaction("txn-002", "Groceries",    new BigDecimal("57.00"))));
        when(transactionService.findTransactionById("txn-003")).thenReturn(Optional.of(buildTransaction("txn-003", "Groceries",    new BigDecimal("42.00"))));
        when(transactionService.findTransactionById("txn-004")).thenReturn(Optional.of(buildTransaction("txn-004", "Gas",          new BigDecimal("17.55"))));
        when(transactionService.findTransactionById("txn-005")).thenReturn(Optional.of(buildTransaction("txn-005", "Subscription", new BigDecimal("21.49"))));
        when(transactionService.findTransactionById("txn-006")).thenReturn(Optional.of(buildTransaction("txn-006", "Subscription", new BigDecimal("8.60"))));
        when(transactionService.findTransactionById("txn-007")).thenReturn(Optional.of(buildTransaction("txn-007", "Order Out",    new BigDecimal("13.00"))));

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertEquals(4, result.size());

        result.forEach(category -> {
            switch (category.getCategoryName()) {
                case "Groceries"    -> assertEquals(3, category.getTransactions().size(),
                        "Groceries must have 3 transactions, not " + category.getTransactions().size());
                case "Gas"          -> assertEquals(1, category.getTransactions().size(),
                        "Gas must have 1 transaction, not " + category.getTransactions().size());
                case "Subscription" -> assertEquals(2, category.getTransactions().size(),
                        "Subscription must have 2 transactions, not " + category.getTransactions().size());
                case "Order Out"    -> assertEquals(1, category.getTransactions().size(),
                        "Order Out must have 1 transaction, not " + category.getTransactions().size());
                default -> fail("Unexpected category: " + category.getCategoryName());
            }
        });
    }

    @Test
    void testGetTransactionsByCategoryList_whenTransactionNotFound_thenSkipsAndContinues()
    {
        List<Object[]> rows = List.of(
                new Object[]{"Groceries", "txn-001"},
                new Object[]{"Groceries", "txn-missing"},  // this one won't be found
                new Object[]{"Gas",       "txn-003"}
        );
        mockQueryReturning(rows);

        when(transactionService.findTransactionById("txn-001")).thenReturn(Optional.of(buildTransaction("txn-001", "Groceries", new BigDecimal("45.00"))));
        when(transactionService.findTransactionById("txn-missing")).thenReturn(Optional.empty());
        when(transactionService.findTransactionById("txn-003")).thenReturn(Optional.of(buildTransaction("txn-003", "Gas", new BigDecimal("17.55"))));

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertNotNull(result);
        assertEquals(2, result.size());

        TransactionsByCategory groceries = result.stream()
                .filter(t -> "Groceries".equals(t.getCategoryName()))
                .findFirst().orElseThrow();

        // Should have 1, not 2 — the missing transaction is skipped gracefully
        assertEquals(1, groceries.getTransactions().size());
    }

    @Test
    void testGetTransactionsByCategoryList_whenSingleCategory_thenAllTransactionsBelongToIt()
    {
        List<Object[]> rows = List.of(
                new Object[]{"Groceries", "txn-001"},
                new Object[]{"Groceries", "txn-002"},
                new Object[]{"Groceries", "txn-003"}
        );
        mockQueryReturning(rows);

        when(transactionService.findTransactionById("txn-001")).thenReturn(Optional.of(buildTransaction("txn-001", "Groceries", new BigDecimal("33.00"))));
        when(transactionService.findTransactionById("txn-002")).thenReturn(Optional.of(buildTransaction("txn-002", "Groceries", new BigDecimal("57.00"))));
        when(transactionService.findTransactionById("txn-003")).thenReturn(Optional.of(buildTransaction("txn-003", "Groceries", new BigDecimal("42.00"))));

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertEquals(1, result.size());
        assertEquals(3, result.get(0).getTransactions().size());
    }

    @Test
    void testGetTransactionsByCategoryList_marksTransactionsAsProcessed()
    {
        List<Object[]> rows = List.of(
                new Object[]{"Groceries", "txn-001"},
                new Object[]{"Gas",       "txn-002"}
        );
        mockQueryReturning(rows);

        when(transactionService.findTransactionById("txn-001")).thenReturn(Optional.of(buildTransaction("txn-001", "Groceries", new BigDecimal("45.00"))));
        when(transactionService.findTransactionById("txn-002")).thenReturn(Optional.of(buildTransaction("txn-002", "Gas",       new BigDecimal("17.55"))));

        transactionsByCategoryQueries
                .getTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        // Verify each transaction ID was marked as PROCESSED exactly once
        verify(transactionCategoryService, times(1))
                .updateTransactionCategoryStatus("txn-001", TransactionCategoryStatus.PROCESSED);
        verify(transactionCategoryService, times(1))
                .updateTransactionCategoryStatus("txn-002", TransactionCategoryStatus.PROCESSED);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getExpenseTransactionsByCategoryList — uses convertExpenseTransactionsByCategory
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void testGetExpenseTransactionsByCategoryList_whenResultsEmpty_thenReturnEmptyList()
    {
        mockQueryReturning(Collections.emptyList());

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getExpenseTransactionsByCategoryList(1L, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertTrue(result.isEmpty());
        verifyNoInteractions(transactionService);
    }

    @Test
    void testGetExpenseTransactionsByCategoryList_whenValidData_thenReturnAggregatedCategories()
    {
        List<Object[]> rows = List.of(
                new Object[]{"Gas",       new BigDecimal("58.50"),  CategoryPriorityLevel.LEVEL_2, CategoryExpenseType.VARIABLE},
                new Object[]{"Groceries", new BigDecimal("497.44"), CategoryPriorityLevel.LEVEL_2, CategoryExpenseType.VARIABLE},
                new Object[]{"Utilities", new BigDecimal("130.78"), CategoryPriorityLevel.LEVEL_1, CategoryExpenseType.FIXED}
        );
        mockQueryReturning(rows);

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getExpenseTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertNotNull(result);
        assertEquals(3, result.size());

        // Results should be sorted by category name
        assertEquals("Gas",       result.get(0).getCategoryName());
        assertEquals("Groceries", result.get(1).getCategoryName());
        assertEquals("Utilities", result.get(2).getCategoryName());

        assertEquals(new BigDecimal("58.50"),  result.get(0).getTotalCategorySpending());
        assertEquals(new BigDecimal("497.44"), result.get(1).getTotalCategorySpending());
        assertEquals(new BigDecimal("130.78"), result.get(2).getTotalCategorySpending());

        assertEquals(CategoryExpenseType.VARIABLE, result.get(0).getCategoryExpenseType());
        assertEquals(CategoryExpenseType.FIXED,    result.get(2).getCategoryExpenseType());

        // getExpenseTransactionsByCategoryList must never touch transactionService — it's aggregate only
        verifyNoInteractions(transactionService);
    }

    @Test
    void testGetExpenseTransactionsByCategoryList_whenNullPriorityAndExpenseType_thenUsesDefaults()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"Groceries", new BigDecimal("200.00"), null, null});
        mockQueryReturning(rows);

        List<TransactionsByCategory> result = transactionsByCategoryQueries
                .getExpenseTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(1, result.size());
        assertEquals(CategoryPriorityLevel.LEVEL_5,   result.get(0).getPriority());
        assertEquals(CategoryExpenseType.VARIABLE, result.get(0).getCategoryExpenseType());
    }
}