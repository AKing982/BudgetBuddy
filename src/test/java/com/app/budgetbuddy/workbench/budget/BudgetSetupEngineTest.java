package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetSetupEngineTest {

    @Mock
    private UserService userService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private TransactionCategoryBuilder budgetCategoryBuilder;

    @Mock
    private BudgetCalculations budgetCalculations;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @InjectMocks
    private BudgetSetupEngine budgetSetupEngine;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
    }

    @Test
    void testInitializeDefaultUserBudgetCategories_whenTransactionListIsEmpty_thenReturnEmptyList(){
        final Long userId = 1L;
        List<Transaction> transactions = new ArrayList<>();
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        recurringTransactions.add(createAffirmRecurringTransaction());
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));

        List<TransactionCategory> actual = budgetSetupEngine.initializeDefaultUserBudgetCategories(userId, transactions, recurringTransactions, budgetPeriod);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeDefaultUserBudgetCategories_whenRecurringTransactionsListIsEmpty_thenReturnEmptyList(){
        final Long userId = 1L;
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createGasTransaction());
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10));

        List<TransactionCategory> actual = budgetSetupEngine.initializeDefaultUserBudgetCategories(userId, transactions, recurringTransactions, budgetPeriod);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeDefaultUserBudgetCategories_whenBudgetPeriodIsNull_thenReturnEmptyList(){
        final Long userId = 1L;
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        recurringTransactions.add(createAffirmRecurringTransaction());
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createGasTransaction());
        BudgetPeriod budgetPeriod = null;

        List<TransactionCategory> actual = budgetSetupEngine.initializeDefaultUserBudgetCategories(userId, transactions, recurringTransactions, budgetPeriod);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeDefaultUserBudgetCategories_whenBudgetPeriodHasNullStartDate_thenThrowException(){
        final Long userId = 1L;
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        recurringTransactions.add(createAffirmRecurringTransaction());
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createGasTransaction());
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, null, LocalDate.of(2024, 9, 10));
        assertThrows(IllegalDateException.class, () -> {
            budgetSetupEngine.initializeDefaultUserBudgetCategories(userId, transactions, recurringTransactions, budgetPeriod);
        });
    }

    @Test
    void testInitializeDefaultUserBudgetCategories_whenBudgetPeriodHasNullEndDate_thenThrowException(){
        final Long userId = 1L;
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        recurringTransactions.add(createAffirmRecurringTransaction());
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createGasTransaction());
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 9, 1), null);
        assertThrows(IllegalDateException.class, () -> {
            budgetSetupEngine.initializeDefaultUserBudgetCategories(userId, transactions, recurringTransactions, budgetPeriod);
        });
    }

    @Test
    void testCreateControlledSpendingCategories_whenCategoryQuestionnaireDataIsEmpty_thenReturnEmptyList(){
        Budget budget = new Budget(1L, new BigDecimal("5000"), new BigDecimal("4500"), 1L, "Test Budget", "Monthly Budget", LocalDate.now(), LocalDate.now().plusMonths(1), LocalDateTime.now());
        BudgetGoals budgetGoals = new BudgetGoals(1L, 1000, 200, 300, "Savings", "Monthly", "Active");
        List<CategoryQuestionnaireData> categoryQuestionnaireData = new ArrayList<>();

        List<ControlledBudgetCategory> actual = budgetSetupEngine.createControlledSpendingCategories(budget, budgetGoals, categoryQuestionnaireData);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeUserBudgetStatistics_whenDateRangesIsNull_thenReturnEmptyList() {
        Budget budget = new Budget(1L, BigDecimal.TEN, BigDecimal.ZERO, 1L, "Test", "Test",
                LocalDate.now(), LocalDate.now(), LocalDateTime.now());
        Map<DateRange, BigDecimal> totalSpentByPeriod = new HashMap<>();
        Map<DateRange, BigDecimal> totalBudgetedByPeriod = new HashMap<>();
        Map<DateRange, BigDecimal> averageSpendingPerDay = new HashMap<>();

        List<BudgetStats> result = budgetSetupEngine.initializeUserBudgetStatistics(
                budget, null, totalSpentByPeriod, totalBudgetedByPeriod, averageSpendingPerDay);

        assertTrue(result.isEmpty());
    }

    @Test
    void testInitializeUserBudgetStatistics_whenDateRangesIsEmpty_thenReturnEmptyList() {
        Budget budget = new Budget(1L, BigDecimal.TEN, BigDecimal.ZERO, 1L, "Test", "Test",
                LocalDate.now(), LocalDate.now(), LocalDateTime.now());
        List<DateRange> dateRanges = Collections.emptyList();
        Map<DateRange, BigDecimal> totalSpentByPeriod = new HashMap<>();
        Map<DateRange, BigDecimal> totalBudgetedByPeriod = new HashMap<>();
        Map<DateRange, BigDecimal> averageSpendingPerDay = new HashMap<>();

        List<BudgetStats> result = budgetSetupEngine.initializeUserBudgetStatistics(
                budget, dateRanges, totalSpentByPeriod, totalBudgetedByPeriod, averageSpendingPerDay);

        assertTrue(result.isEmpty());
    }



    @Test
    void testInitializeUserBudgetStatistics_whenSeveralNonOverlappingDateRangesOnBudget_thenReturnBudgetStats() {
        // Setup budget
        BigDecimal budgetAmount = new BigDecimal("3260");
        BigDecimal actualSpent = new BigDecimal("1804");
        Long userId = 1L;
        Long budgetId = 1L;
        Budget budget = new Budget(1L, budgetAmount, actualSpent, userId, "Test Budget", "Test Budget Description",
                LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30), LocalDateTime.now());

        // Setup date ranges
        List<DateRange> dateRanges = List.of(
                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)),
                new DateRange(LocalDate.of(2024, 9, 9), LocalDate.of(2024, 9, 16)),
                new DateRange(LocalDate.of(2024, 9, 17), LocalDate.of(2024, 9, 24)),
                new DateRange(LocalDate.of(2024, 9, 25), LocalDate.of(2024, 9, 30))
        );

        // Setup period maps
        Map<DateRange, BigDecimal> totalSpentByPeriod = Map.of(
                dateRanges.get(0), new BigDecimal("900"),
                dateRanges.get(1), new BigDecimal("700"),
                dateRanges.get(2), new BigDecimal("204"),
                dateRanges.get(3), BigDecimal.ZERO
        );

        Map<DateRange, BigDecimal> totalBudgetedByPeriod = Map.of(
                dateRanges.get(0), new BigDecimal("3260"),
                dateRanges.get(1), new BigDecimal("3260"),
                dateRanges.get(2), new BigDecimal("3260"),
                dateRanges.get(3), new BigDecimal("3260")
        );

        Map<DateRange, BigDecimal> averageSpendingPerDay = Map.of(
                dateRanges.get(0), new BigDecimal("112.50"),
                dateRanges.get(1), new BigDecimal("87.50"),
                dateRanges.get(2), new BigDecimal("102.00"),
                dateRanges.get(3), BigDecimal.ZERO
        );

        // Define expected results for each range
        List<BudgetStats> expectedBudgetStatsList = List.of(
                new BudgetStats(1L, new BigDecimal("3260"), new BigDecimal("900"),
                        new BigDecimal("2360"), new BigDecimal("900"),
                        new BigDecimal("112.50"), dateRanges.get(0)),
                new BudgetStats(1L, new BigDecimal("3260"), new BigDecimal("700"),
                        new BigDecimal("2560"), new BigDecimal("1600"),
                        new BigDecimal("87.50"), dateRanges.get(1)),
                new BudgetStats(1L, new BigDecimal("3260"), new BigDecimal("204"),
                        new BigDecimal("3056"), new BigDecimal("2004"),
                        new BigDecimal("102.00"), dateRanges.get(2)),
                new BudgetStats(1L, new BigDecimal("3260"), BigDecimal.ZERO,
                        new BigDecimal("3260"), new BigDecimal("3260"),
                        BigDecimal.ZERO, dateRanges.get(3))
        );

        // Execute the method
        List<BudgetStats> actualBudgetStatsList = budgetSetupEngine.initializeUserBudgetStatistics(
                budget,
                dateRanges,
                totalSpentByPeriod,
                totalBudgetedByPeriod,
                averageSpendingPerDay
        );

        // Assertions
        assertEquals(expectedBudgetStatsList.size(), actualBudgetStatsList.size());
        for (int i = 0; i < actualBudgetStatsList.size(); i++) {
            BudgetStats expectedStats = expectedBudgetStatsList.get(i);
            BudgetStats actualStats = actualBudgetStatsList.get(i);

            assertEquals(expectedStats.getBudgetId(), actualStats.getBudgetId(),
                    "Budget ID mismatch at index " + i);
            assertEquals(expectedStats.getTotalSpent(), actualStats.getTotalSpent(),
                    "Budget amount mismatch at index " + i);
            assertEquals(expectedStats.getTotalSpent(), actualStats.getTotalSpent(),
                    "Total spent mismatch at index " + i);
            assertEquals(expectedStats.getRemaining(), actualStats.getRemaining(),
                    "Remaining budget mismatch at index " + i);
            assertEquals(expectedStats.getAverageSpendingPerDay(), actualStats.getAverageSpendingPerDay(),
                    "Average spending per day mismatch at index " + i);
            assertEquals(expectedStats.getDateRange(), actualStats.getDateRange(),
                    "Date range mismatch at index " + i);
        }
    }

    @Test
    void testInitializeUserBudgetStatistics_whenNegativeValues_thenCalculateCorrectly() {
        Budget budget = new Budget(1L, new BigDecimal("-100"), BigDecimal.ZERO, 1L, "Test", "Test",
                LocalDate.now(), LocalDate.now(), LocalDateTime.now());
        DateRange dateRange = new DateRange(LocalDate.now(), LocalDate.now());
        List<DateRange> dateRanges = List.of(dateRange);

        Map<DateRange, BigDecimal> totalSpentByPeriod = Map.of(dateRange, new BigDecimal("-50"));
        Map<DateRange, BigDecimal> totalBudgetedByPeriod = Map.of(dateRange, new BigDecimal("-100"));
        Map<DateRange, BigDecimal> averageSpendingPerDay = Map.of(dateRange, new BigDecimal("-10"));

        List<BudgetStats> result = budgetSetupEngine.initializeUserBudgetStatistics(
                budget, dateRanges, totalSpentByPeriod, totalBudgetedByPeriod, averageSpendingPerDay);

        assertFalse(result.isEmpty());
        assertEquals(new BigDecimal("-50"), result.get(0).getRemaining());
    }

    @AfterEach
    void tearDown() {
    }

    private Transaction createGasTransaction() {
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Gas"),  // categories
                "cat-003",                     // categoryId
                LocalDate.of(2024, 11, 4),     // date
                "PIN Purchase - MAVERICK",            // description
                "MAVERICK",                     // merchantName
                "PIN Purcahse - MAVERICK",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 4),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 11, 5)      // posted
        );
    }

    private RecurringTransaction createAffirmRecurringTransaction() {
        return new RecurringTransaction(
                "account-12345",                  // accountId
                new BigDecimal("50.75"),          // amount
                "USD",                            // isoCurrencyCode
                List.of("Payments"),              // categories
                "cat-005",                        // categoryId
                LocalDate.of(2024, 11, 5),        // date
                "Affirm Purchase",                // description
                "Affirm",                         // merchantName
                "Affirm Payment",                 // name
                false,                            // pending
                "txn-12345",                      // transactionId
                LocalDate.of(2024, 11, 4),        // authorizedDate
                "https://example.com/logo.png",   // logoUrl
                LocalDate.of(2024, 11, 5),        // posted
                "stream-12345",                   // streamId
                LocalDate.of(2024, 10, 1),        // firstDate
                LocalDate.of(2024, 12, 1),        // lastDate
                "MONTHLY",                        // frequency
                new BigDecimal("50.75"),          // averageAmount
                new BigDecimal("50.75"),          // lastAmount
                true,                             // active
                "Subscription"                    // type
        );
    }
}