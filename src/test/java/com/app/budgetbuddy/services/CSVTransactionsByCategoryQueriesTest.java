package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CSVTransactionsByCategoryQueriesTest
{
    @Mock
    private EntityManager entityManager;

    @Mock
    private CSVTransactionService csvTransactionService;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    private CSVTransactionsByCategoryQueries csvTransactionsByCategoryQueries;

    @Mock
    private TypedQuery<Object[]> typedQuery;

    @BeforeEach
    void setUp() {
        csvTransactionsByCategoryQueries = new CSVTransactionsByCategoryQueries(
                csvTransactionService,
                transactionCategoryService,
                entityManager
        );
    }

    private void mockQueryReturning(List<Object[]> rows)
    {
        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
        when(typedQuery.setParameter(anyString(), any())).thenReturn(typedQuery);
        when(typedQuery.getResultList()).thenReturn(rows);
    }

    private TransactionCSV buildCsvTransaction(Long id, String category, BigDecimal amount)
    {
        return TransactionCSV.builder()
                .id(id)
                .transactionAmount(amount.negate()) // stored as negative in DB
                .category(category)
                .transactionDate(LocalDate.of(2026, 2, 1)) // needed for compareTo
                .build();
    }

    @Test
    void testGetCSVTransactionsByCategoryList_whenResultsEmpty_thenReturnEmptyList()
    {
        mockQueryReturning(Collections.emptyList());

        List<CSVTransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertTrue(result.isEmpty());
        verifyNoInteractions(csvTransactionService);
    }

    @Test
    void testGetCSVTransactionsByCategoryList_eachCategoryHasOnlyItsOwnTransactions()
    {
        // Mirrors the regression test from TransactionsByCategoryQueriesTest
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{1L, "Groceries"});
        rows.add(new Object[]{2L, "Groceries"});
        rows.add(new Object[]{3L, "Subscription"});
        mockQueryReturning(rows);

        when(csvTransactionService.findTransactionCSVById(1L))
                .thenReturn(Optional.of(buildCsvTransaction(1L, "Groceries", new BigDecimal("33.35"))));
        when(csvTransactionService.findTransactionCSVById(2L))
                .thenReturn(Optional.of(buildCsvTransaction(2L, "Groceries", new BigDecimal("57.38"))));
        when(csvTransactionService.findTransactionCSVById(3L))
                .thenReturn(Optional.of(buildCsvTransaction(3L, "Subscription", new BigDecimal("21.49"))));

        List<CSVTransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertNotNull(result);
        assertEquals(2, result.size());

        CSVTransactionsByCategory groceries = result.stream()
                .filter(c -> "Groceries".equals(c.getCategory()))
                .findFirst().orElseThrow();

        CSVTransactionsByCategory subscription = result.stream()
                .filter(c -> "Subscription".equals(c.getCategory()))
                .findFirst().orElseThrow();

        assertEquals(2, groceries.getCsvTransactions().size(),
                "Groceries must have exactly 2 transactions");
        assertEquals(1, subscription.getCsvTransactions().size(),
                "Subscription must have exactly 1 transaction");

        assertFalse(groceries.getCsvTransactions().stream()
                        .anyMatch(t -> t.getId().equals(3L)),
                "Subscription transaction must not appear in Groceries");
        assertFalse(subscription.getCsvTransactions().stream()
                        .anyMatch(t -> t.getId().equals(1L) || t.getId().equals(2L)),
                "Grocery transactions must not appear in Subscription");
    }

    @Test
    void testGetCSVTransactionsByCategoryList_whenManyCategories_eachCategoryTransactionCountIsCorrect()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{1L, "Groceries"});
        rows.add(new Object[]{2L, "Groceries"});
        rows.add(new Object[]{3L, "Groceries"});
        rows.add(new Object[]{4L, "Gas"});
        rows.add(new Object[]{5L, "Subscription"});
        rows.add(new Object[]{6L, "Subscription"});
        rows.add(new Object[]{7L, "Order Out"});
        mockQueryReturning(rows);

        when(csvTransactionService.findTransactionCSVById(1L)).thenReturn(Optional.of(buildCsvTransaction(1L, "Groceries",    new BigDecimal("33.35"))));
        when(csvTransactionService.findTransactionCSVById(2L)).thenReturn(Optional.of(buildCsvTransaction(2L, "Groceries",    new BigDecimal("57.38"))));
        when(csvTransactionService.findTransactionCSVById(3L)).thenReturn(Optional.of(buildCsvTransaction(3L, "Groceries",    new BigDecimal("42.85"))));
        when(csvTransactionService.findTransactionCSVById(4L)).thenReturn(Optional.of(buildCsvTransaction(4L, "Gas",          new BigDecimal("17.55"))));
        when(csvTransactionService.findTransactionCSVById(5L)).thenReturn(Optional.of(buildCsvTransaction(5L, "Subscription", new BigDecimal("21.49"))));
        when(csvTransactionService.findTransactionCSVById(6L)).thenReturn(Optional.of(buildCsvTransaction(6L, "Subscription", new BigDecimal("8.60"))));
        when(csvTransactionService.findTransactionCSVById(7L)).thenReturn(Optional.of(buildCsvTransaction(7L, "Order Out",    new BigDecimal("13.00"))));

        List<CSVTransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(4, result.size());

        result.forEach(category -> {
            switch (category.getCategory()) {
                case "Groceries"    -> assertEquals(3, category.getCsvTransactions().size(),
                        "Groceries must have 3 transactions");
                case "Gas"          -> assertEquals(1, category.getCsvTransactions().size(),
                        "Gas must have 1 transaction");
                case "Subscription" -> assertEquals(2, category.getCsvTransactions().size(),
                        "Subscription must have 2 transactions");
                case "Order Out"    -> assertEquals(1, category.getCsvTransactions().size(),
                        "Order Out must have 1 transaction");
                default -> fail("Unexpected category: " + category.getCategory());
            }
        });
    }

    @Test
    void testGetCSVTransactionsByCategoryList_whenTransactionNotFound_thenSkipsAndContinues()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{1L, "Groceries"});
        rows.add(new Object[]{99L, "Groceries"});  // will not be found
        rows.add(new Object[]{3L, "Gas"});
        mockQueryReturning(rows);

        when(csvTransactionService.findTransactionCSVById(1L))
                .thenReturn(Optional.of(buildCsvTransaction(1L, "Groceries", new BigDecimal("33.35"))));
        when(csvTransactionService.findTransactionCSVById(99L))
                .thenReturn(Optional.empty());
        when(csvTransactionService.findTransactionCSVById(3L))
                .thenReturn(Optional.of(buildCsvTransaction(3L, "Gas", new BigDecimal("17.55"))));

        List<CSVTransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertNotNull(result);
        assertEquals(2, result.size());

        CSVTransactionsByCategory groceries = result.stream()
                .filter(c -> "Groceries".equals(c.getCategory()))
                .findFirst().orElseThrow();

        assertEquals(1, groceries.getCsvTransactions().size(),
                "Missing transaction should be skipped, leaving only 1");
    }

    @Test
    void testGetCSVTransactionsByCategoryList_totalSpendingIsCorrectPerCategory()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{1L, "Groceries"});
        rows.add(new Object[]{2L, "Groceries"});
        mockQueryReturning(rows);

        when(csvTransactionService.findTransactionCSVById(1L))
                .thenReturn(Optional.of(buildCsvTransaction(1L, "Groceries", new BigDecimal("33.35"))));
        when(csvTransactionService.findTransactionCSVById(2L))
                .thenReturn(Optional.of(buildCsvTransaction(2L, "Groceries", new BigDecimal("57.38"))));

        List<CSVTransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(1, result.size());
        // 33.35 + 57.38 = 90.73
        assertEquals(new BigDecimal("90.73"), result.get(0).getTotalCategorySpending());
    }

    @Test
    void testGetCSVTransactionsByCategoryList_marksTransactionsAsProcessed()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{1L, "Groceries"});
        rows.add(new Object[]{2L, "Gas"});
        mockQueryReturning(rows);

        when(csvTransactionService.findTransactionCSVById(1L))
                .thenReturn(Optional.of(buildCsvTransaction(1L, "Groceries", new BigDecimal("33.35"))));
        when(csvTransactionService.findTransactionCSVById(2L))
                .thenReturn(Optional.of(buildCsvTransaction(2L, "Gas", new BigDecimal("17.55"))));

        csvTransactionsByCategoryQueries
                .getCSVTransactionsByCategoryList(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        verify(transactionCategoryService, times(1))
                .updateCSVTransactionCategoryStatus(TransactionCategoryStatus.PROCESSED, 1L);
        verify(transactionCategoryService, times(1))
                .updateCSVTransactionCategoryStatus(TransactionCategoryStatus.PROCESSED, 2L);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getCSVExpenseTransactionsByCategories — aggregate query, no transaction lookup
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void testGetCSVExpenseTransactionsByCategories_whenResultsEmpty_thenReturnEmptyList()
    {
        mockQueryReturning(Collections.emptyList());

        List<TransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVExpenseTransactionsByCategories(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertTrue(result.isEmpty());
        verifyNoInteractions(csvTransactionService);
    }

    @Test
    void testGetCSVExpenseTransactionsByCategories_whenValidData_thenReturnSortedCategories()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"Utilities",    new BigDecimal("134.30"), CategoryPriorityLevel.LEVEL_1, CategoryExpenseType.FIXED});
        rows.add(new Object[]{"Gas",          new BigDecimal("17.55"),  CategoryPriorityLevel.LEVEL_2, CategoryExpenseType.VARIABLE});
        rows.add(new Object[]{"Subscription", new BigDecimal("136.28"), CategoryPriorityLevel.LEVEL_4, CategoryExpenseType.VARIABLE});
        mockQueryReturning(rows);

        List<TransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVExpenseTransactionsByCategories(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(3, result.size());
        // Should be sorted alphabetically
        assertEquals("Gas",          result.get(0).getCategoryName());
        assertEquals("Subscription", result.get(1).getCategoryName());
        assertEquals("Utilities",    result.get(2).getCategoryName());

        assertEquals(new BigDecimal("17.55"),  result.get(0).getTotalCategorySpending());
        assertEquals(new BigDecimal("136.28"), result.get(1).getTotalCategorySpending());
        assertEquals(new BigDecimal("134.30"), result.get(2).getTotalCategorySpending());

        assertEquals(CategoryExpenseType.FIXED,    result.get(2).getCategoryExpenseType());
        assertEquals(CategoryExpenseType.VARIABLE, result.get(0).getCategoryExpenseType());

        verifyNoInteractions(csvTransactionService);
    }

    @Test
    void testGetCSVExpenseTransactionsByCategories_whenNullPriorityAndExpenseType_thenUsesDefaults()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"Groceries", new BigDecimal("200.00"), null, null});
        mockQueryReturning(rows);

        List<TransactionsByCategory> result = csvTransactionsByCategoryQueries
                .getCSVExpenseTransactionsByCategories(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(1, result.size());
        assertEquals(CategoryPriorityLevel.LEVEL_5,   result.get(0).getPriority());
        assertEquals(CategoryExpenseType.VARIABLE, result.get(0).getCategoryExpenseType());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getTotalMatchedCategorySpending
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void testGetTotalMatchedCategorySpending_whenResultsEmpty_thenReturnEmptyList()
    {
        mockQueryReturning(Collections.emptyList());

        List<CategorySpendAmount> result = csvTransactionsByCategoryQueries
                .getTotalMatchedCategorySpending(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetTotalMatchedCategorySpending_whenValidData_thenReturnCategorySpendAmounts()
    {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"Groceries",    new BigDecimal("230.62")});
        rows.add(new Object[]{"Subscription", new BigDecimal("136.28")});
        mockQueryReturning(rows);

        List<CategorySpendAmount> result = csvTransactionsByCategoryQueries
                .getTotalMatchedCategorySpending(1L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(2, result.size());

        CategorySpendAmount groceries = result.stream()
                .filter(c -> "Groceries".equals(c.category()))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("230.62"), groceries.amount());
    }

    @AfterEach
    void tearDown() {
    }
}