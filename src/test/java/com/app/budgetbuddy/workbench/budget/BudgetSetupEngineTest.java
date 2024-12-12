package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

    @Mock
    private TransactionLoaderService transactionLoaderService;

    @InjectMocks
    private BudgetSetupEngine budgetSetupEngine;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
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
    void testCreateBudgetDateRanges_whenBudgetStartDateAndEndDateIsMonth_thenReturnDateRangesForMonth(){
        Long budgetId = 1L;
        LocalDate budgetStartDate = LocalDate.of(2024, 9, 1);
        LocalDate budgetEndDate = LocalDate.of(2024, 9, 30);

        List<DateRange> expectedDateRanges = new ArrayList<>();
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 9, 9),  LocalDate.of(2024, 9, 16)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 9, 17), LocalDate.of(2024, 9, 24)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 9, 25), LocalDate.of(2024, 9, 30)));

        List<DateRange> actual = budgetSetupEngine.createBudgetDateRanges(budgetStartDate, budgetEndDate);
        assertTrue(actual.containsAll(expectedDateRanges));
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

    @Test
    void testCreateRecurringTransactionCategories() {
        // Setup test data
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);

        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", startDate, endDate, LocalDateTime.now());

        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7)),
                new DateRange(LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14)),
                new DateRange(LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 21)),
                new DateRange(LocalDate.of(2024, 1, 22), LocalDate.of(2024, 1, 31))
        );

        List<RecurringTransaction> recurringTransactions = Arrays.asList(
                new RecurringTransaction(
                        "acc1", new BigDecimal("1500.00"), "USD",
                        List.of("HOUSING", "RENT"), "40000000",
                        LocalDate.of(2024, 1, 1), "Monthly Rent",
                        "ABC Properties", "Rent Payment", false, "r1",
                        LocalDate.of(2024, 1, 1), "abc-logo.png",
                        LocalDate.of(2024, 1, 1), "stream1",
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31),
                        "MONTHLY", new BigDecimal("1500.00"),
                        new BigDecimal("1500.00"), true, "RECURRING"
                ),
                new RecurringTransaction(
                        "acc2", new BigDecimal("200.00"), "USD",
                        List.of("UTILITIES", "ELECTRICITY"), "50000000",
                        LocalDate.of(2024, 1, 15), "Monthly Utilities",
                        "City Power", "Electricity Bill", false, "r2",
                        LocalDate.of(2024, 1, 15), "citypower-logo.png",
                        LocalDate.of(2024, 1, 15), "stream2",
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31),
                        "MONTHLY", new BigDecimal("200.00"),
                        new BigDecimal("200.00"), true, "RECURRING"
                )
        );

        // Setup expected results for each date range
        List<TransactionCategory> expectedCategoriesWeek1 = Arrays.asList(
                new TransactionCategory(1L, budget.getId(), "40000000", "Rent", 1500.00, 1500.00, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false)
        );

        List<TransactionCategory> expectedCategoriesWeek2 = Arrays.asList(
                new TransactionCategory(2L, budget.getId(), "40000000", "Rent", 1500.00, 1500.00, true,
                        LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14), 0.0, false)
        );

        List<TransactionCategory> expectedCategoriesWeek3 = Arrays.asList(
                new TransactionCategory(3L, budget.getId(), "40000000", "Rent", 1500.00, 1500.00, true,
                        LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 21), 0.0, false),
                new TransactionCategory(4L, budget.getId(), "50000000", "Utilities", 200.00, 200.00, true,
                        LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 21), 0.0, false)
        );

        List<TransactionCategory> expectedCategoriesWeek4 = Arrays.asList(
                new TransactionCategory(5L, budget.getId(), "40000000", "Rent", 1500.00, 1500.00, true,
                        LocalDate.of(2024, 1, 22), LocalDate.of(2024, 1, 31), 0.0, false)
        );

        // Mock behavior for each date range
        Mockito.when(budgetCategoryBuilder.initializeTransactionCategories(
                Mockito.eq(budget),
                Mockito.eq(new BudgetPeriod(Period.MONTHLY, dateRanges.get(0).getStartDate(), dateRanges.get(0).getEndDate())),
                Mockito.eq(recurringTransactions)
        )).thenReturn(expectedCategoriesWeek1);

        Mockito.when(budgetCategoryBuilder.initializeTransactionCategories(
                Mockito.eq(budget),
                Mockito.eq(new BudgetPeriod(Period.MONTHLY, dateRanges.get(1).getStartDate(), dateRanges.get(1).getEndDate())),
                Mockito.eq(recurringTransactions)
        )).thenReturn(expectedCategoriesWeek2);

        Mockito.when(budgetCategoryBuilder.initializeTransactionCategories(
                Mockito.eq(budget),
                Mockito.eq(new BudgetPeriod(Period.MONTHLY, dateRanges.get(2).getStartDate(), dateRanges.get(2).getEndDate())),
                Mockito.eq(recurringTransactions)
        )).thenReturn(expectedCategoriesWeek3);

        Mockito.when(budgetCategoryBuilder.initializeTransactionCategories(
                Mockito.eq(budget),
                Mockito.eq(new BudgetPeriod(Period.MONTHLY, dateRanges.get(3).getStartDate(), dateRanges.get(3).getEndDate())),
                Mockito.eq(recurringTransactions)
        )).thenReturn(expectedCategoriesWeek4);

        // Execute method
        List<TransactionCategory> result = budgetSetupEngine.createRecurringTransactionCategories(
                recurringTransactions, budget, dateRanges
        );

        // Assertions
        assertNotNull(result);
        assertEquals(6, result.size()); // Total number of categories across all weeks

        // Verify each category's components
        List<TransactionCategory> allExpectedCategories = new ArrayList<>();
        allExpectedCategories.addAll(expectedCategoriesWeek1);
        allExpectedCategories.addAll(expectedCategoriesWeek2);
        allExpectedCategories.addAll(expectedCategoriesWeek3);
        allExpectedCategories.addAll(expectedCategoriesWeek4);

        for (int i = 0; i < allExpectedCategories.size(); i++) {
            TransactionCategory expected = allExpectedCategories.get(i);
            TransactionCategory actual = result.get(i);

            assertEquals(expected.getId(), actual.getId(),
                    "Transaction category ID mismatch at index " + i);
            assertEquals(expected.getBudgetId(), actual.getBudgetId(),
                    "Budget ID mismatch at index " + i);
            assertEquals(expected.getCategoryId(), actual.getCategoryId(),
                    "Category ID mismatch at index " + i);
            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name mismatch at index " + i);
            assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
                    "Budgeted amount mismatch at index " + i);
            assertEquals(expected.getBudgetActual(), actual.getBudgetActual(),
                    "Budget actual mismatch at index " + i);
            assertEquals(expected.getIsActive(), actual.getIsActive(),
                    "IsActive mismatch at index " + i);
            assertEquals(expected.getStartDate(), actual.getStartDate(),
                    "Start date mismatch at index " + i);
            assertEquals(expected.getEndDate(), actual.getEndDate(),
                    "End date mismatch at index " + i);
            assertEquals(expected.getOverSpendingAmount(), actual.getOverSpendingAmount(),
                    "Overspending amount mismatch at index " + i);
            assertEquals(expected.isOverSpent(), actual.isOverSpent(),
                    "IsOverspent mismatch at index " + i);
        }

        // Verify method was called for each date range
        for (DateRange dateRange : dateRanges) {
            Mockito.verify(budgetCategoryBuilder).initializeTransactionCategories(
                    Mockito.eq(budget),
                    Mockito.eq(new BudgetPeriod(Period.MONTHLY, dateRange.getStartDate(), dateRange.getEndDate())),
                    Mockito.eq(recurringTransactions)
            );
        }
    }


    @Test
    void testCreateTransactionCategories_whenDateRangesForMonthAndValidTransactions_thenReturnTransactionCategories() {
        // Setup test data
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);

        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", startDate, endDate, LocalDateTime.now());

        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7)),
                new DateRange(LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14)),
                new DateRange(LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 21)),
                new DateRange(LocalDate.of(2024, 1, 22), LocalDate.of(2024, 1, 31))
        );

        List<Transaction> transactions = Arrays.asList(
                new Transaction(
                        "acc1", new BigDecimal("45.50"), "USD",
                        List.of("TRANSPORTATION", "GAS"), "10000000",
                        LocalDate.of(2024, 1, 5), "Shell Gas Station",
                        "Shell", "Gas Purchase", false, "t1",
                        LocalDate.of(2024, 1, 5), "shell-logo.png",
                        LocalDate.of(2024, 1, 5)
                ),
                new Transaction(
                        "acc1", new BigDecimal("125.75"), "USD",
                        List.of("FOOD", "GROCERY"), "20000000",
                        LocalDate.of(2024, 1, 10), "Whole Foods Market",
                        "Whole Foods", "Groceries", false, "t2",
                        LocalDate.of(2024, 1, 10), "wholefoods-logo.png",
                        LocalDate.of(2024, 1, 10)
                )
        );

        List<RecurringTransaction> recurringTransactions = Arrays.asList(
                new RecurringTransaction(
                        "acc1", new BigDecimal("1500.00"), "USD",
                        List.of("HOUSING", "RENT"), "40000000",
                        LocalDate.of(2024, 1, 1), "Monthly Rent",
                        "ABC Properties", "Rent Payment", false, "r1",
                        LocalDate.of(2024, 1, 1), "abc-logo.png",
                        LocalDate.of(2024, 1, 1), "stream1",
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31),
                        "MONTHLY", new BigDecimal("1500.00"),
                        new BigDecimal("1500.00"), true, "RECURRING"
                )
        );

        // Create expected categories for regular transactions
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, budget.getId(), "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false),
                new TransactionCategory(2L, budget.getId(), "20000000", "Groceries", 150.00, 125.75, true,
                        LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14), 0.0, false)
        );

        // Create expected categories for recurring transactions
        List<TransactionCategory> expectedRecurringCategories = List.of(
                new TransactionCategory(3L, budget.getId(), "40000000", "Rent", 1500.00, 1500.00, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false)
        );

        // Mock behavior for createTransactionCategories and createRecurringTransactionCategories
        Mockito.when(budgetSetupEngine.createTransactionCategories(transactions, budget, dateRanges))
                .thenReturn(expectedRegularCategories);

        Mockito.when(budgetSetupEngine.createRecurringTransactionCategories(recurringTransactions, budget, dateRanges))
                .thenReturn(expectedRecurringCategories);

        // Execute method
        TreeMap<Long, List<TransactionCategory>> result = budgetSetupEngine
                .createTransactionCategories(recurringTransactions, transactions, budget, dateRanges);

        // Assertions
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertTrue(result.containsKey(budget.getUserId()));

        List<TransactionCategory> resultCategories = result.get(budget.getUserId());
        assertNotNull(resultCategories);
        assertEquals(expectedRegularCategories.size(), resultCategories.size());

        // Compare each component of each transaction category
        for (int i = 0; i < expectedRegularCategories.size(); i++) {
            TransactionCategory expected = expectedRegularCategories.get(i);
            TransactionCategory actual = resultCategories.get(i);

            assertEquals(expected.getId(), actual.getId(),
                    "Transaction category ID mismatch at index " + i);
            assertEquals(expected.getBudgetId(), actual.getBudgetId(),
                    "Budget ID mismatch at index " + i);
            assertEquals(expected.getCategoryId(), actual.getCategoryId(),
                    "Category ID mismatch at index " + i);
            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name mismatch at index " + i);
            assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
                    "Budgeted amount mismatch at index " + i);
            assertEquals(expected.getBudgetActual(), actual.getBudgetActual(),
                    "Budget actual mismatch at index " + i);
            assertEquals(expected.getIsActive(), actual.getIsActive(),
                    "IsActive mismatch at index " + i);
            assertEquals(expected.getStartDate(), actual.getStartDate(),
                    "Start date mismatch at index " + i);
            assertEquals(expected.getEndDate(), actual.getEndDate(),
                    "End date mismatch at index " + i);
            assertEquals(expected.getOverSpendingAmount(), actual.getOverSpendingAmount(),
                    "Overspending amount mismatch at index " + i);
            assertEquals(expected.isOverSpent(), actual.isOverSpent(),
                    "IsOverspent mismatch at index " + i);
        }
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenBudgetIsNull_thenReturnEmptyList(){
        // Create expected categories for regular transactions
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false));

        List<DateRange> dateRanges = List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10)));
        List<BudgetCategory> budgetCategories = budgetSetupEngine.initializeBudgetExpenseCategory(null, expectedRegularCategories, dateRanges);
        assertNotNull(budgetCategories);
        assertTrue(budgetCategories.isEmpty());
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenTransactionCategoryListIsNull_thenReturnEmptyList(){
        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,5), LocalDateTime.now());

        List<TransactionCategory> expectedRegularCategories = List.of();
        List<DateRange> dateRanges = List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 10)));
        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetExpenseCategory(budget, null, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenDateRangeListIsNull_thenReturnEmptyList(){
        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,5), LocalDateTime.now());
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false));

        List<DateRange> dateRanges = List.of();
        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetExpenseCategory(budget, expectedRegularCategories, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenDateRangeHasNullStartDate_thenThrowIllegalDateException(){
        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,5), LocalDateTime.now());
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false));

        List<DateRange> dateRanges = List.of(new DateRange(null, LocalDate.of(2024,9 ,10)));
        assertThrows(IllegalDateException.class, () -> {
            budgetSetupEngine.initializeBudgetExpenseCategory(budget, expectedRegularCategories, dateRanges);
        });
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenDateRangeHasNullEndDate_thenThrowIllegalDateException(){
        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,5), LocalDateTime.now());
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false));
        List<DateRange> dateRanges = List.of(new DateRange(LocalDate.of(2024, 9, 1), null));
        assertThrows(IllegalDateException.class, () -> {
            budgetSetupEngine.initializeBudgetExpenseCategory(budget, expectedRegularCategories, dateRanges);
        });
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenDateRangeIsNull_thenSkipDateRangeAndReturnList(){
        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,5), LocalDateTime.now());
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 7), 0.0, false));
        List<DateRange> dateRanges = new ArrayList<>();
        dateRanges.add(null);
        dateRanges.add(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024,9,8)));

        List<BudgetCategory> expectedBudgetCategories = List.of(new BudgetCategory("Expenses", new BigDecimal("3000"), new BigDecimal("45.5"), new BigDecimal("2954.5"), new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,8))));
        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetExpenseCategory(budget, expectedRegularCategories, dateRanges);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expectedBudgetCategories.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expectedBudgetCategories.get(i).getActualAmount(), actual.get(i).getActualAmount());
            assertEquals(expectedBudgetCategories.get(i).getDateRange(), actual.get(i).getDateRange());
            assertEquals(expectedBudgetCategories.get(i).getCategoryName(), actual.get(i).getCategoryName());
        }
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenParametersValid_thenReturnBudgetCategoryList(){
        Budget budget = new Budget(1L, new BigDecimal("3000"), BigDecimal.ZERO, 1L,
                "January Budget", "Test Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,5), LocalDateTime.now());
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false));
        List<DateRange> dateRanges = List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)));
        List<BudgetCategory> expectedBudgetCategories = List.of(new BudgetCategory("Expenses", new BigDecimal("3000"), new BigDecimal("45.5"), new BigDecimal("2954.5"), new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9 ,8))));
        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetExpenseCategory(budget, expectedRegularCategories, dateRanges);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expectedBudgetCategories.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expectedBudgetCategories.get(i).getActualAmount(), actual.get(i).getActualAmount());
            assertEquals(expectedBudgetCategories.get(i).getDateRange(), actual.get(i).getDateRange());
            assertEquals(expectedBudgetCategories.get(i).getCategoryName(), actual.get(i).getCategoryName());
        }
    }

    @Test
    void testInitializeBudgetExpenseCategory_whenNullTransactionCategoryFound_thenSkipAndReturnBudgetCategoryList(){

    }


    @ParameterizedTest
    @MethodSource("provideTestCases")
    void testInitializeBudgetExpenseCategory(String testCase, Budget budget,
                                             List<TransactionCategory> transactionCategories, List<DateRange> dateRanges,
                                             List<BudgetCategory> expectedCategories) {

        List<BudgetCategory> result = budgetSetupEngine.initializeBudgetExpenseCategory(
                budget, transactionCategories, dateRanges);

        if (expectedCategories.isEmpty()) {
            assertTrue(result.isEmpty());
        } else {
            assertEquals(expectedCategories.size(), result.size());
            for (int i = 0; i < expectedCategories.size(); i++) {
                BudgetCategory expected = expectedCategories.get(i);
                BudgetCategory actual = result.get(i);

                assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                        "Category name mismatch for test case: " + testCase);
                assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
                        "Budgeted amount mismatch for test case: " + testCase);
                assertEquals(expected.getActualAmount(), actual.getActualAmount(),
                        "Actual amount mismatch for test case: " + testCase);
                assertEquals(expected.getRemainingAmount(), actual.getRemainingAmount(),
                        "Remaining amount mismatch for test case: " + testCase);
                assertEquals(expected.getDateRange(), actual.getDateRange(),
                        "Date range mismatch for test case: " + testCase);
            }
        }
    }

    @Test
    void testInitializeBudgetSavingsCategories_whenBudgetGoalsIsNull_thenReturnEmptyList(){
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false));

        Budget budget = new Budget(1L, new BigDecimal("1000"), BigDecimal.ZERO, 1L,
                "Test Budget", "Description", LocalDate.of(2024, 1, 1),
                LocalDate.of(2024, 1, 31), LocalDateTime.now());

        Map<DateRange, Budget> monthlyBudget = new HashMap<>();
        monthlyBudget.put(new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31)), budget);

        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7)),
                new DateRange(LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14))
        );

        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetSavingsCategories(null, expectedRegularCategories, monthlyBudget, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetSavingsCategories_whenTransactionCategoriesIsNull_thenReturnEmptyList(){
        List<TransactionCategory> expectedRegularCategories = new ArrayList<>();

        Budget budget = new Budget(1L, new BigDecimal("1000"), BigDecimal.ZERO, 1L,
                "Test Budget", "Description", LocalDate.of(2024, 1, 1),
                LocalDate.of(2024, 1, 31), LocalDateTime.now());

        Map<DateRange, Budget> monthlyBudget = new HashMap<>();
        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7)),
                new DateRange(LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14))
        );

        monthlyBudget.put(new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31)), budget);
        BudgetGoals budgetGoals = new BudgetGoals(1L, 1200.0, 250.0, 145.00, "Savings Plan", "MONTHLY", "Active");

        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetSavingsCategories(budgetGoals, null, monthlyBudget, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetSavingsCategories_whenBudgetIsNull_thenReturnEmptyList(){
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false));

        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7)),
                new DateRange(LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14))
        );
        BudgetGoals budgetGoals = new BudgetGoals(1L, 1200.0, 250.0, 145.00, "Savings Plan", "MONTHLY", "Active");

        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetSavingsCategories(budgetGoals, expectedRegularCategories, null, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetSavingsCategories_whenDateRangesIsNull_thenReturnEmptyList(){
        List<TransactionCategory> expectedRegularCategories = List.of(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false));

        Budget budget = new Budget(1L, new BigDecimal("1000"), BigDecimal.ZERO, 1L,
                "Test Budget", "Description", LocalDate.of(2024, 1, 1),
                LocalDate.of(2024, 1, 31), LocalDateTime.now());

        Map<DateRange, Budget> monthlyBudget = new HashMap<>();
        monthlyBudget.put(new DateRange(LocalDate.of(2024, 1, 1),LocalDate.of(2024, 1, 31)), budget);

        BudgetGoals budgetGoals = new BudgetGoals(1L, 1200.0, 250.0, 145.00, "Savings Plan", "MONTHLY", "Active");
        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetSavingsCategories(budgetGoals, expectedRegularCategories, monthlyBudget, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetSavingsCategories_whenParametersValid_thenReturnSavingsBudgetCategory(){
        Budget augustBudget = new Budget(1L, new BigDecimal("3260.0"), BigDecimal.ZERO, 1L,
                "Test Budget", "Description", LocalDate.of(2024, 8, 1),
                LocalDate.of(2024, 8, 31), LocalDateTime.now());

        Budget septemberBudget = new Budget(1L, new BigDecimal("3260.0"), BigDecimal.ZERO, 1L, "September Budget", "September Month Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30), LocalDateTime.now());
        Map<DateRange, Budget> monthlyBudgets = new HashMap<>();
        monthlyBudgets.put(new DateRange(LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31)), augustBudget);
        monthlyBudgets.put(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30)), septemberBudget);

        List<TransactionCategory> septemberCategories = Arrays.asList(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false),
                new TransactionCategory(2L, 1L, "20000000", "Groceries", 150.00, 125.75, true,
                        LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22), 0.0, false)
        );

        // Setup transaction categories for August
        List<TransactionCategory> augustCategories = Arrays.asList(
                new TransactionCategory(3L, 1L, "10000000", "Gas", 55.00, 52.30, true,
                        LocalDate.of(2024, 8, 5), LocalDate.of(2024, 8, 12), 0.0, false),
                new TransactionCategory(4L, 1L, "20000000", "Groceries", 160.00, 145.80, true,
                        LocalDate.of(2024, 8, 20), LocalDate.of(2024, 8, 27), 0.0, false)
        );

        List<TransactionCategory> allCategories = new ArrayList<>();
        allCategories.addAll(septemberCategories);
        allCategories.addAll(augustCategories);

        List<DateRange> dateRanges = Arrays.asList(new DateRange(LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31)), new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30)));

        BudgetGoals budgetGoals = new BudgetGoals(1L, 1200.0, 250.0, 145.00, "Savings Plan", "MONTHLY", "Active");

        // Expected savings categories for each month
        List<BudgetCategory> expectedSavingsCategories = Arrays.asList(

                // August savings (3260 budget - 198.10 total expenses = 3061.90 remaining)
                new BudgetCategory(
                        "Savings",
                        new BigDecimal("250.0"), // Monthly savings goal
                        new BigDecimal("250.0"), // Actual savings
                        new BigDecimal("950.0"), // Difference between actual and goal
                        dateRanges.get(0)),  // August date range)

                // September savings (3260 budget - 171.25 total expenses = 3088.75 remaining)
                new BudgetCategory(
                        "Savings",
                        new BigDecimal("250.0"), // Monthly savings goal from budgetGoals
                        new BigDecimal("500.0"), // Actual savings (remaining budget)
                        new BigDecimal("700.0"), // Difference between actual and goal
                        dateRanges.get(1)  // September date range
                ));

        List<BudgetCategory> result = budgetSetupEngine.initializeBudgetSavingsCategories(budgetGoals, allCategories, monthlyBudgets, dateRanges);
        assertNotNull(result);
        assertEquals(2, result.size());
        for (int i = 0; i < result.size(); i++) {
            BudgetCategory expected = expectedSavingsCategories.get(i);
            BudgetCategory actual = result.get(i);

            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name should be Savings for month " + (i + 1));
            assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
                    "Budgeted savings amount should match for month " + (i + 1));
            assertEquals(expected.getActualAmount(), actual.getActualAmount(),
                    "Actual savings should match for month " + (i + 1));
            assertEquals(expected.getRemainingAmount(), actual.getRemainingAmount(),
                    "Remaining amount should match for month " + (i + 1));
            assertEquals(expected.getDateRange(), actual.getDateRange(),
                    "Date range should match for month " + (i + 1));
        }
    }

    @Test
    void testInitializeBudgetSavingsCategories_whenBudgetAmountIsZero_thenReturnEmptyList(){
        Budget augustBudget = new Budget(1L, new BigDecimal("0"), BigDecimal.ZERO, 1L,
                "Test Budget", "Description", LocalDate.of(2024, 8, 1),
                LocalDate.of(2024, 8, 31), LocalDateTime.now());

        Budget septemberBudget = new Budget(1L, new BigDecimal("3260.0"), BigDecimal.ZERO, 1L, "September Budget", "September Month Budget", LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30), LocalDateTime.now());

        Map<DateRange, Budget> monthlyBudgets = new HashMap<>();
        monthlyBudgets.put(new DateRange(LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31)), augustBudget);
        monthlyBudgets.put(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30)), septemberBudget);

        List<TransactionCategory> septemberCategories = Arrays.asList(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false),
                new TransactionCategory(2L, 1L, "20000000", "Groceries", 150.00, 125.75, true,
                        LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22), 0.0, false)
        );
        BudgetGoals budgetGoals = new BudgetGoals(1L, 1200.0, 250.0, 145.00, "Savings Plan", "MONTHLY", "Active");

        List<DateRange> dateRanges = Arrays.asList(new DateRange(LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31)), new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30)));
        List<BudgetCategory> actual = budgetSetupEngine.initializeBudgetSavingsCategories(budgetGoals, septemberCategories, monthlyBudgets, dateRanges);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTopBudgetExpenseCategories_whenTransactionCategoryListIsNull_thenReturnEmptyList(){
        List<DateRange> dateRanges = Arrays.asList(new DateRange(LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 31)), new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30)));
        List<BudgetCategory> actual = budgetSetupEngine.createTopBudgetExpenseCategories(null, dateRanges);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTopBudgetExpensesCategories_whenDateRangesIsNull_thenReturnEmptyList(){
        List<TransactionCategory> septemberCategories = Arrays.asList(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 0.0, false),
                new TransactionCategory(2L, 1L, "20000000", "Groceries", 150.00, 125.75, true,
                        LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22), 0.0, false)
        );
        List<BudgetCategory> actual = budgetSetupEngine.createTopBudgetExpenseCategories(septemberCategories, null);
        assertNotNull(actual);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTopBudgetExpenseCategories_whenParametersValid_thenReturnTopFiveExpenses() {
        // Setup test data
        List<TransactionCategory> transactionCategories = Arrays.asList(
                // High expense categories
                new TransactionCategory(1L, 1L, "RENT1", "Rent", 1500.0, 1500.0, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false),
                new TransactionCategory(2L, 1L, "UTILS1", "Utilities", 300.00, 275.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false),
                new TransactionCategory(3L, 1L, "GROC1", "Groceries", 600.00, 585.75, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false),

                // Lower expense categories
                new TransactionCategory(4L, 1L, "ENT1", "Entertainment", 100.00, 95.50, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false),
                new TransactionCategory(5L, 1L, "GAS1", "Gas", 150.00, 145.80, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false),
                new TransactionCategory(6L, 1L, "MISC1", "Miscellaneous", 75.00, 72.30, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31), 0.0, false)
        );

        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31))
        );

        // Expected top 5 categories ordered by actual spending
        List<BudgetCategory> expectedTopCategories = Arrays.asList(
                new BudgetCategory("Rent", new BigDecimal("1500.0"), new BigDecimal("1500.0"),
                        new BigDecimal("0.0"), dateRanges.get(0)),
                new BudgetCategory("Groceries", new BigDecimal("600.0"), new BigDecimal("585.75"),
                        new BigDecimal("14.25"), dateRanges.get(0)),
                new BudgetCategory("Utilities", new BigDecimal("300.0"), new BigDecimal("275.5"),
                        new BigDecimal("24.5"), dateRanges.get(0)),
                new BudgetCategory("Gas", new BigDecimal("150.0"), new BigDecimal("145.8"),
                        new BigDecimal("4.2"), dateRanges.get(0)),
                new BudgetCategory("Entertainment", new BigDecimal("100.0"), new BigDecimal("95.5"),
                        new BigDecimal("4.5"), dateRanges.get(0))
        );

        // Execute method
        List<BudgetCategory> result = budgetSetupEngine.createTopBudgetExpenseCategories(
                transactionCategories, dateRanges);

        // Assertions
        assertNotNull(result);
        assertEquals(5, result.size(), "Should return top 5 categories");

        // Verify each category and its order
        for (int i = 0; i < result.size(); i++) {
            BudgetCategory expected = expectedTopCategories.get(i);
            BudgetCategory actual = result.get(i);

            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name mismatch at position " + i);
            assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
                    "Budgeted amount mismatch for " + expected.getCategoryName());
            assertEquals(expected.getActualAmount(), actual.getActualAmount(),
                    "Actual amount mismatch for " + expected.getCategoryName());
            assertEquals(expected.getRemainingAmount(), actual.getRemainingAmount(),
                    "Remaining amount mismatch for " + expected.getCategoryName());
            assertEquals(expected.getDateRange(), actual.getDateRange(),
                    "Date range mismatch for " + expected.getCategoryName());
        }
    }


    private static Stream<Arguments> provideTestCases() {
        Budget budget = new Budget(1L, new BigDecimal("1000"), BigDecimal.ZERO, 1L,
                "Test Budget", "Description", LocalDate.of(2024, 1, 1),
                LocalDate.of(2024, 1, 31), LocalDateTime.now());

        List<DateRange> dateRanges = Arrays.asList(
                new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7)),
                new DateRange(LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14))
        );

        // Test case 1: Normal transactions
        List<TransactionCategory> normalTransactions = Arrays.asList(
                new TransactionCategory(1L, 1L, "CAT1", "Gas", 100.0, 50.0, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false),
                new TransactionCategory(2L, 1L, "CAT2", "Groceries", 200.0, 150.0, true,
                        LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 14), 0.0, false)
        );

        List<BudgetCategory> expectedNormal = Arrays.asList(
                new BudgetCategory("Expenses", new BigDecimal("1000"),
                        new BigDecimal("50.0"), new BigDecimal("950.0"),
                        dateRanges.get(0)),
                new BudgetCategory("Expenses", new BigDecimal("1000"),
                        new BigDecimal("150.0"), new BigDecimal("850.0"),
                        dateRanges.get(1))
        );

        // Test case 2: Null transaction
        List<TransactionCategory> withNullTransaction = new ArrayList<>(normalTransactions);
        withNullTransaction.add(null);

        // Test case 3: Empty transaction list
        List<TransactionCategory> emptyTransactions = Collections.emptyList();

        // Test case 4: Single transaction
        List<TransactionCategory> singleTransaction = Collections.singletonList(
                new TransactionCategory(1L, 1L, "CAT1", "Gas", 100.0, 75.0, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false)
        );

        List<BudgetCategory> expectedSingle = Collections.singletonList(
                new BudgetCategory("Expenses", new BigDecimal("1000"),
                        new BigDecimal("75.0"), new BigDecimal("925.0"),
                        dateRanges.get(0))
        );

        return Stream.of(
                Arguments.of("Normal transactions", budget, normalTransactions, dateRanges, expectedNormal),
                Arguments.of("With null transaction", budget, withNullTransaction, dateRanges, expectedNormal),
                Arguments.of("Empty transactions", budget, emptyTransactions, dateRanges, Collections.emptyList()),
                Arguments.of("Single transaction", budget, singleTransaction, dateRanges, expectedSingle),
                Arguments.of("Null budget", null, normalTransactions, dateRanges, Collections.emptyList()),
                Arguments.of("Null date ranges", budget, normalTransactions, null, Collections.emptyList()),
                Arguments.of("Null transactions", budget, null, dateRanges, Collections.emptyList())
        );
    }

    @Test
    void testLoadDailyBudgetPeriodData_whenDateIsNull_thenReturnEmptyList(){
        List<TransactionCategory> singleTransaction = Collections.singletonList(
                new TransactionCategory(1L, 1L, "CAT1", "Gas", 100.0, 75.0, true,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 7), 0.0, false)
        );

        List<BudgetCategory> actual = budgetSetupEngine.loadDailyBudgetPeriodData(null, singleTransaction);
        assertNotNull(actual);
        assertEquals(0, actual.size(), "Should return empty list");
        assertTrue(actual.isEmpty(), "Should return empty list");
    }

    @Test
    void testLoadDailyBudgetPeriodData_whenTransactionCategoriesIsNull_thenReturnEmptyList(){
        LocalDate date = LocalDate.of(2024, 1, 1);
        List<BudgetCategory> actual = budgetSetupEngine.loadDailyBudgetPeriodData(date, null);
        assertNotNull(actual);
        assertEquals(0, actual.size(), "Should return empty list");
        assertTrue(actual.isEmpty(), "Should return empty list");
    }

    @Test
    void testLoadDailyBudgetPeriodData_whenValidParameters_thenReturnBudgetCategoriesForDate() {
        // Setup test date
        LocalDate testDate = LocalDate.of(2024, 1, 15);  // January 15, 2024

        // Setup test transaction categories that span this date
        List<TransactionCategory> transactionCategories = Arrays.asList(
                new TransactionCategory(1L, 1L, "10000000", "Gas", 50.00, 45.50, true,
                        LocalDate.of(2024, 1, 7), LocalDate.of(2024, 1, 16), 0.0, false),
                new TransactionCategory(2L, 1L, "20000000", "Groceries", 150.00, 125.75, true,
                        LocalDate.of(2024, 1, 7), LocalDate.of(2024, 1, 16), 0.0, false),
                // Category that shouldn't be included (different date)
                new TransactionCategory(3L, 1L, "30000000", "Entertainment", 75.00, 70.00, true,
                        LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 16), 0.0, false)
        );

        // Expected budget categories for January 15
        List<BudgetCategory> expectedCategories = Arrays.asList(
                new BudgetCategory(
                        "Gas",
                        new BigDecimal("50.0"),
                        new BigDecimal("0"),
                        new BigDecimal("50.0"),
                        new DateRange(testDate, testDate)
                ),
                new BudgetCategory(
                        "Groceries",
                        new BigDecimal("150.00"),
                        new BigDecimal("34.23"),
                        new BigDecimal("115.77"),
                        new DateRange(testDate, testDate)
                )
        );

        // Execute method
        List<BudgetCategory> result = budgetSetupEngine.loadDailyBudgetPeriodData(testDate, transactionCategories);

        // Assertions
        assertNotNull(result);
        assertEquals(2, result.size(), "Should return 2 categories for the specified date");

        // Verify each category
        for (int i = 0; i < expectedCategories.size(); i++) {
            BudgetCategory expected = expectedCategories.get(i);
            BudgetCategory actual = result.get(i);

            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name mismatch for index " + i);
            assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
                    "Budgeted amount mismatch for " + expected.getCategoryName());
            assertEquals(expected.getActualAmount(), actual.getActualAmount(),
                    "Actual amount mismatch for " + expected.getCategoryName());
            assertEquals(expected.getRemainingAmount(), actual.getRemainingAmount(),
                    "Remaining amount mismatch for " + expected.getCategoryName());
            assertEquals(expected.getDateRange().getStartDate(), actual.getDateRange().getStartDate(),
                    "Start date mismatch for " + expected.getCategoryName());
            assertEquals(expected.getDateRange().getEndDate(), actual.getDateRange().getEndDate(),
                    "End date mismatch for " + expected.getCategoryName());
        }
    }

    // Helper methods to create test data
    private List<Transaction> createTestTransactions() {
        return Arrays.asList(
                new Transaction(
                        "acc1", new BigDecimal("45.50"), "USD",
                        List.of("TRANSPORTATION", "GAS"), "10000000",
                        LocalDate.of(2024, 1, 5), "Shell Gas Station",
                        "Shell", "Gas Purchase", false, "t1",
                        LocalDate.of(2024, 1, 5), "shell-logo.png",
                        LocalDate.of(2024, 1, 5)
                )

        );
    }


    private List<RecurringTransaction> createTestRecurringTransactions() {
        return Arrays.asList(
                new RecurringTransaction(
                        "acc1", new BigDecimal("1500.00"), "USD",
                        List.of("HOUSING", "RENT"), "40000000",
                        LocalDate.of(2024, 1, 1), "Monthly Rent",
                        "ABC Properties", "Rent Payment", false, "r1",
                        LocalDate.of(2024, 1, 1), "abc-logo.png",
                        LocalDate.of(2024, 1, 1), "stream1",
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31),
                        "MONTHLY", new BigDecimal("1500.00"),
                        new BigDecimal("1500.00"), true, "RECURRING"
                )
        );
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