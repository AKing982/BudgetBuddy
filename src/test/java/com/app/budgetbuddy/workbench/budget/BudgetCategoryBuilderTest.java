package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
import com.app.budgetbuddy.workbench.converter.UserBudgetCategoryConverter;
import io.jsonwebtoken.Header;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetCategoryBuilderTest {

    @Mock
    private UserBudgetCategoryService userBudgetCategoryService;

    @Mock
    private CategoryRuleService categoryRuleService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private BudgetCalculator budgetCalculator;

    @Mock
    private UserBudgetCategoryConverter userBudgetCategoryConverter;

    @Spy
    @InjectMocks
    private BudgetCategoryBuilder budgetCategoryBuilder;

    private BudgetPeriod testBudgetPeriod;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this); // Initialize mocks
        testBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 6, 1));
    }

   @Test
   void testCreateCategoryPeriod_whenEndDateIsNull_thenThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            budgetCategoryBuilder.createCategoryPeriods("Groceries", LocalDate.of(2024, 6, 1), null, Period.WEEKLY,new ArrayList<>());
        });
   }

   @Test
   void testCreateCategoryPeriod_whenTransactionListIsEmpty_thenReturnDefaultCategoryPeriod() {
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 30);
        List<Transaction> transactionList = new ArrayList<>();

        DateRange expected = new DateRange(startDate, endDate);
        Map<String, List<DateRange>> actual = budgetCategoryBuilder.createCategoryPeriods("Groceries", startDate, endDate, Period.WEEKLY, transactionList);

   }

   @Test
   void testCreateCategoryPeriod_whenTransactionListAndStartDateAndEndDateIsNotNull_thenReturnDateRange(){
        LocalDate budgetStartDate = LocalDate.of(2024, 9, 5);
        LocalDate budgetEndDate = LocalDate.of(2025, 9, 6);
        LocalDate startDate = LocalDate.of(2024, 11, 1);
        LocalDate endDate = LocalDate.of(2025, 11, 8);
        List<Transaction> transactionList = new ArrayList<>();
        transactionList.add(createWalmartTransaction());
        transactionList.add(createWincoTransaction());
        transactionList.add(createAffirmTransaction());
        transactionList.add(createGasTransaction());
        DateRange expected = new DateRange(startDate, endDate);
        Map<String, List<DateRange>> actual = budgetCategoryBuilder.createCategoryPeriods("Groceries", budgetStartDate, budgetEndDate, Period.WEEKLY, transactionList);
        assertEquals(expected.getStartDate(), actual.get(expected.getStartDate()).get(0).getStartDate());
        assertEquals(expected.getEndDate(), actual.get(expected.getEndDate()).get(0).getEndDate());
   }

    @ParameterizedTest
    @MethodSource("provideTransactions")
    @DisplayName("Test createCategoryPeriod with a month of transactions for various categories")
    void testCreateCategoryPeriodWithGroceriesCategory(List<Transaction> transactions) {
        String categoryName = "Groceries";

        final LocalDate BUDGET_START_DATE = LocalDate.of(2024, 9, 1);
        final LocalDate BUDGET_END_DATE = LocalDate.of(2024, 9, 30);

        // Call the method under test
        Map<String, List<DateRange>> result = budgetCategoryBuilder.createCategoryPeriods(categoryName, BUDGET_START_DATE, BUDGET_END_DATE, Period.WEEKLY, transactions);

        // Expected start and end dates for the "Groceries" category in September
        List<DateRange> expectedWeeklyRanges = List.of(
                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)),
                new DateRange(LocalDate.of(2024, 9, 8), LocalDate.of(2024, 9, 15)),
                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22)),
                new DateRange(LocalDate.of(2024, 9, 22), LocalDate.of(2024, 9, 30))
//                new DateRange(LocalDate.of(2024, 9, 29), LocalDate.of(2024, 9, 30)) // Partial week if only days 29-30 have transactions
        );

        Map<String, List<DateRange>> expected = new HashMap<>();
        expected.put(categoryName, expectedWeeklyRanges);

        List<DateRange> dateRanges = result.get(categoryName);
        assertEquals(expectedWeeklyRanges.size(), dateRanges.size(), "Should have a DateRange for each weekly period");

        // Iterate over the expected weekly ranges and compare each with the actual results
        for (int i = 0; i < expectedWeeklyRanges.size(); i++) {
            DateRange expectedRange = expectedWeeklyRanges.get(i);
            DateRange actualRange = dateRanges.get(i);

            assertEquals(expectedRange.getStartDate(), actualRange.getStartDate(),
                    "Start date for week " + (i + 1) + " should match");
            assertEquals(expectedRange.getEndDate(), actualRange.getEndDate(),
                    "End date for week " + (i + 1) + " should match");
        }
    }

    private static Stream<List<Transaction>> provideTransactions() {
        return Stream.of(List.of(
                // Week 1: Transactions for September 1–8
                new Transaction("account-1", new BigDecimal("45.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 3), "Walmart Purchase", "Walmart", "Grocery Purchase", false, "txn-1", LocalDate.of(2024, 9, 3), "https://example.com/logo.png", LocalDate.of(2024, 9, 3)),
                new Transaction("account-1", new BigDecimal("30.00"), "USD", List.of("Gas"), "cat-gas", LocalDate.of(2024, 9, 5), "Gas Station", "Shell", "Fuel Purchase", false, "txn-2", LocalDate.of(2024, 9, 5), "https://example.com/logo.png", LocalDate.of(2024, 9, 5)),
                new Transaction("account-1", new BigDecimal("100.00"), "USD", List.of("Rent"), "cat-rent", LocalDate.of(2024, 9, 7), "Rent Payment", "Landlord", "Monthly Rent", false, "txn-3", LocalDate.of(2024, 9, 7), "https://example.com/logo.png", LocalDate.of(2024, 9, 7)),

                // Week 2: September 8–15 (No "Groceries" transactions needed in this week for test purposes)
                new Transaction("account-1", new BigDecimal("20.00"), "USD", List.of("Dining"), "cat-dining", LocalDate.of(2024, 9, 10), "Restaurant", "Local Diner", "Dinner Out", false, "txn-9", LocalDate.of(2024, 9, 10), "https://example.com/logo.png", LocalDate.of(2024, 9, 10)),
                new Transaction("account-1", new BigDecimal("35.34"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 12), "PIN Purchase WINCO", "WINCO", "PIN Purchase WINCO", false, "txn-25", LocalDate.of(2024, 9, 12), "https://example.com/logo.png", LocalDate.of(2024, 9, 12)),
                // Week 3: Transactions for September 15–22
                new Transaction("account-1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 15), "Costco Purchase", "Costco", "Grocery Purchase", false, "txn-4", LocalDate.of(2024, 9, 15), "https://example.com/logo.png", LocalDate.of(2024, 9, 15)),
                new Transaction("account-1", new BigDecimal("75.00"), "USD", List.of("Utilities"), "cat-utilities", LocalDate.of(2024, 9, 17), "Electric Bill", "Electric Company", "Monthly Utility", false, "txn-5", LocalDate.of(2024, 9, 17), "https://example.com/logo.png", LocalDate.of(2024, 9, 17)),

                // Week 4: Transactions for September 22–29
                new Transaction("account-1", new BigDecimal("40.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 22), "Trader Joe's Purchase", "Trader Joe's", "Grocery Purchase", false, "txn-8", LocalDate.of(2024, 9, 28), "https://example.com/logo.png", LocalDate.of(2024, 9, 28)),
                new Transaction("account-1", new BigDecimal("25.00"), "USD", List.of("Order Out"), "cat-orderout", LocalDate.of(2024, 9, 22), "Uber Eats", "Uber Eats", "Food Delivery", false, "txn-7", LocalDate.of(2024, 9, 22), "https://example.com/logo.png", LocalDate.of(2024, 9, 22)),

                // Week 5: Transactions for September 29–30 (Partial week)
                new Transaction("account-1", new BigDecimal("35.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 29), "Grocery Store", "Grocery Mart", "Grocery Purchase", false, "txn-10", LocalDate.of(2024, 9, 29), "https://example.com/logo.png", LocalDate.of(2024, 9, 29))
        ));
    }

    @ParameterizedTest
    @MethodSource("provideBiweeklyTransactions")
    @DisplayName("Test createCategoryPeriod with a month of biweekly transactions for the Groceries category")
    void testCreateCategoryPeriodWithBiweeklyGroceriesCategory(List<Transaction> transactions) {
        String categoryName = "Groceries";

        final LocalDate BUDGET_START_DATE = LocalDate.of(2024, 9, 1);
        final LocalDate BUDGET_END_DATE = LocalDate.of(2024, 9, 30);

        // Call the method under test with Period.BIWEEKLY
        Map<String, List<DateRange>> result = budgetCategoryBuilder.createCategoryPeriods(
                categoryName, BUDGET_START_DATE, BUDGET_END_DATE, Period.BIWEEKLY, transactions);

        // Expected biweekly date ranges for September 2024
        List<DateRange> expectedBiweeklyRanges = List.of(
                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 15)),
                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 30))
        );

        Map<String, List<DateRange>> expected = new HashMap<>();
        expected.put(categoryName, expectedBiweeklyRanges);

        List<DateRange> dateRanges = result.get(categoryName);
        assertEquals(expectedBiweeklyRanges.size(), dateRanges.size(), "Should have a DateRange for each biweekly period");

        assertEquals(expected.get(categoryName), result.get(categoryName));
        assertEquals(expected.get(categoryName).get(0), result.get(categoryName).get(0));
        assertEquals(expected.get(categoryName).get(1), result.get(categoryName).get(1));

        // Iterate over the expected biweekly ranges and compare each with the actual results
        for (int i = 0; i < expectedBiweeklyRanges.size(); i++) {
            DateRange expectedRange = expectedBiweeklyRanges.get(i);
            DateRange actualRange = dateRanges.get(i);

            assertEquals(expectedRange.getStartDate(), actualRange.getStartDate(),
                    "Start date for biweekly period " + (i + 1) + " should match");
            assertEquals(expectedRange.getEndDate(), actualRange.getEndDate(),
                    "End date for biweekly period " + (i + 1) + " should match");
        }
    }

    private static Stream<List<Transaction>> provideBiweeklyTransactions() {
        return Stream.of(List.of(
                // Biweekly Period 1: September 1–14
                new Transaction("account-1", new BigDecimal("45.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 3), "Walmart Purchase", "Walmart", "Grocery Purchase", false, "txn-1", LocalDate.of(2024, 9, 3), "https://example.com/logo.png", LocalDate.of(2024, 9, 3)),
                new Transaction("account-1", new BigDecimal("20.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 10), "Local Grocery Store", "Local Grocery", "Grocery Purchase", false, "txn-2", LocalDate.of(2024, 9, 10), "https://example.com/logo.png", LocalDate.of(2024, 9, 10)),

                // Biweekly Period 2: September 15–30
                new Transaction("account-1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 15), "Costco Purchase", "Costco", "Grocery Purchase", false, "txn-3", LocalDate.of(2024, 9, 15), "https://example.com/logo.png", LocalDate.of(2024, 9, 15)),
                new Transaction("account-1", new BigDecimal("40.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 28), "Trader Joe's Purchase", "Trader Joe's", "Grocery Purchase", false, "txn-4", LocalDate.of(2024, 9, 28), "https://example.com/logo.png", LocalDate.of(2024, 9, 28))
        ));
    }

    @ParameterizedTest
    @MethodSource("provideMonthlyTransactions")
    @DisplayName("Test createCategoryPeriod with a month of transactions for the Groceries category (Monthly Period)")
    void testCreateCategoryPeriodWithMonthlyGroceriesCategory(List<Transaction> transactions) {
        String categoryName = "Groceries";

        final LocalDate BUDGET_START_DATE = LocalDate.of(2024, 9, 1);
        final LocalDate BUDGET_END_DATE = LocalDate.of(2024, 9, 30);

        // Call the method under test with Period.MONTHLY
        Map<String, List<DateRange>> result = budgetCategoryBuilder.createCategoryPeriods(
                categoryName, BUDGET_START_DATE, BUDGET_END_DATE, Period.MONTHLY, transactions);


        // Expected single DateRange for the entire month
        List<DateRange> expectedMonthlyRange = List.of(
                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30))
        );

        Map<String, List<DateRange>> expected = new HashMap<>();
        expected.put("Groceries", expectedMonthlyRange);

        assertEquals(expected.get(categoryName), result.get(categoryName));
        assertEquals(expected.get(categoryName).get(0), result.get(categoryName).get(0));

        List<DateRange> dateRanges = result.get(categoryName);
        assertEquals(expectedMonthlyRange.size(), dateRanges.size(), "Should have a single DateRange for the whole month");

        // Compare the expected monthly range with the actual result
        DateRange expectedRange = expectedMonthlyRange.get(0);
        DateRange actualRange = dateRanges.get(0);

        assertEquals(expectedRange.getStartDate(), actualRange.getStartDate(), "Start date for the monthly period should match");
        assertEquals(expectedRange.getEndDate(), actualRange.getEndDate(), "End date for the monthly period should match");
    }

    private static Stream<List<Transaction>> provideMonthlyTransactions() {
        return Stream.of(List.of(
                // "Groceries" transactions throughout September
                new Transaction("account-1", new BigDecimal("45.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 3), "Walmart Purchase", "Walmart", "Grocery Purchase", false, "txn-1", LocalDate.of(2024, 9, 3), "https://example.com/logo.png", LocalDate.of(2024, 9, 3)),
                new Transaction("account-1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 15), "Costco Purchase", "Costco", "Grocery Purchase", false, "txn-2", LocalDate.of(2024, 9, 15), "https://example.com/logo.png", LocalDate.of(2024, 9, 15)),
                new Transaction("account-1", new BigDecimal("40.00"), "USD", List.of("Groceries"), "cat-groceries", LocalDate.of(2024, 9, 28), "Trader Joe's Purchase", "Trader Joe's", "Grocery Purchase", false, "txn-3", LocalDate.of(2024, 9, 28), "https://example.com/logo.png", LocalDate.of(2024, 9, 28)),

                // Other category transactions throughout September
                new Transaction("account-1", new BigDecimal("30.00"), "USD", List.of("Gas"), "cat-gas", LocalDate.of(2024, 9, 5), "Gas Station", "Shell", "Fuel Purchase", false, "txn-4", LocalDate.of(2024, 9, 5), "https://example.com/logo.png", LocalDate.of(2024, 9, 5)),
                new Transaction("account-1", new BigDecimal("100.00"), "USD", List.of("Rent"), "cat-rent", LocalDate.of(2024, 9, 1), "Rent Payment", "Landlord", "Monthly Rent", false, "txn-5", LocalDate.of(2024, 9, 1), "https://example.com/logo.png", LocalDate.of(2024, 9, 1)),
                new Transaction("account-1", new BigDecimal("75.00"), "USD", List.of("Utilities"), "cat-utilities", LocalDate.of(2024, 9, 17), "Electric Bill", "Electric Company", "Monthly Utility", false, "txn-6", LocalDate.of(2024, 9, 17), "https://example.com/logo.png", LocalDate.of(2024, 9, 17)),
                new Transaction("account-1", new BigDecimal("25.00"), "USD", List.of("Dining"), "cat-dining", LocalDate.of(2024, 9, 20), "Restaurant", "Local Diner", "Dinner Out", false, "txn-7", LocalDate.of(2024, 9, 20), "https://example.com/logo.png", LocalDate.of(2024, 9, 20)),
                new Transaction("account-1", new BigDecimal("60.00"), "USD", List.of("Subscriptions"), "cat-subscriptions", LocalDate.of(2024, 9, 10), "Netflix Subscription", "Netflix", "Monthly Subscription", false, "txn-8", LocalDate.of(2024, 9, 10), "https://example.com/logo.png", LocalDate.of(2024, 9, 10))
        ));
    }



    @Test
    void testInitializeUserBudgetCategories_whenBudgetIsNull_thenReturnEmptyMap(){
       List<Transaction> transactions = new ArrayList<>();
       transactions.add(createWincoTransaction());
       List<UserBudgetCategory> userBudgetCategories = budgetCategoryBuilder.initializeUserBudgetCategories(null, testBudgetPeriod, transactions);
       assertNotNull(userBudgetCategories);
       assertTrue(userBudgetCategories.isEmpty());
    }


    @Test
    void testInitializeUserBudgetCategories_whenBudgetPeriodIsNull_thenReturnEmptyMap(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070"));
        budget.setBudgetName("Savings Plan");
        budget.setActual(new BigDecimal("1609"));

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createWincoTransaction());

        List<UserBudgetCategory> actual = budgetCategoryBuilder.initializeUserBudgetCategories(budget, null, transactions);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeUserBudgetCategories_whenTransactionsListIsEmpty_thenReturnEmptyMap(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070"));
        budget.setBudgetName("Savings Plan");
        budget.setActual(new BigDecimal("1609"));

        List<Transaction> transactions = new ArrayList<>();

        List<UserBudgetCategory> actual = budgetCategoryBuilder.initializeUserBudgetCategories(budget, testBudgetPeriod, transactions);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeUserBudgetCategories_SeptMockData_returnDateRanges()
    {
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070"));
        budget.setBudgetName("Savings Plan");
        budget.setActual(new BigDecimal("1609"));
        budget.setStartDate(LocalDate.of(2024, 9, 1));
        budget.setEndDate(LocalDate.of(2024, 9, 30));
        budget.setUserId(1L);

        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30));

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 1), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("35.23")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 3), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("35.23")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 4), List.of("Gas Stations"), "22009000", "PIN Purchase MAVERICK", "MAVERICK", "MAVERICK", new BigDecimal("31.55")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 5), List.of("Subscription"), "18061000", "AFFIRM Purchase", "AFFIRM", "AFFIRM", new BigDecimal("19.23")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 8), List.of("Subscription"), "18061000", "AFFIRM Purchase", "AFFIRM", "AFFIRM", new BigDecimal("10.00")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 15), List.of("Subscription"), "18061000", "Spotify", "Spotify", "Spotify", new BigDecimal("12.57")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 15), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("16.23")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 15), List.of("Supermarkets and Groceries"), "19047000", "Pin Purchase HARMONS", "HARMONS", "HARMONS", new BigDecimal("7.89")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 20), List.of("Gas Stations"), "22009000", "PIN Purchase MAVERICK", "MAVERICK", "MAVERICK", new BigDecimal("35.23")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 25), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("17.89")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 27), List.of("Subscription"), "18061000", "AFFIRM Purchase", "AFFIRM", "AFFIRM", new BigDecimal("31.00")));
        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 30), List.of("Gas Stations"), "22009000", "PIN Purchase MAVERICK", "MAVERICK", "MAVERICK", new BigDecimal("24.56")));

        List<CategorySpending> mockCategorySpendingList = new ArrayList<>();
        mockCategorySpendingList.add(new CategorySpending("19047000", "Supermarkets and Groceries", new BigDecimal("112.47")));
        mockCategorySpendingList.add(new CategorySpending("19047000", "Gas Stations", new BigDecimal("91.34")));
        mockCategorySpendingList.add(new CategorySpending("18061000", "Subscription", new BigDecimal("72.8")));

        Map<String, BigDecimal> mockCategoryToBudgetMap = new HashMap<>();
        mockCategoryToBudgetMap.put("Supermarkets and Groceries", new BigDecimal("200"));
        mockCategoryToBudgetMap.put("Gas Stations", new BigDecimal("100"));
        mockCategoryToBudgetMap.put("Subscription", new BigDecimal("120"));

        Map<String, List<DateRange>> categoryPeriods = new HashMap<>();
        categoryPeriods.put("Supermarkets and Groceries", List.of(
                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)),   // Covers transactions on Sept 1, 3
                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22)), // Covers transactions on Sept 15
                new DateRange(LocalDate.of(2024, 9, 25), LocalDate.of(2024, 9, 27))  // Covers transaction on Sept 25
        ));

        categoryPeriods.put("Gas Stations", List.of(
                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)),   // Covers transaction on Sept 4
                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 20)), // Covers transaction on Sept 20
                new DateRange(LocalDate.of(2024, 9, 30), LocalDate.of(2024, 9, 30))  // Covers transaction on Sept 30
        ));

        categoryPeriods.put("Subscription", List.of(
                new DateRange(LocalDate.of(2024, 9, 5), LocalDate.of(2024, 9, 8)),   // Covers transactions on Sept 5, 8
                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 27))  // Covers transactions on Sept 15, 27
        ));

        when(categoryService.getCategoryIdByName("Supermarkets and Groceries")).thenReturn(List.of("19047000"));
        when(categoryService.getCategoryIdByName("Gas Stations")).thenReturn(List.of("19047000"));
        when(categoryService.getCategoryIdByName("Subscription")).thenReturn(List.of("18061000"));

        doReturn(categoryPeriods).when(budgetCategoryBuilder)
                .createCategoryPeriods(anyString(), any(LocalDate.class), any(LocalDate.class), any(Period.class), anyList());

        when(budgetCalculator.createCategoryToBudgetMap(anyList(), any(Budget.class), any(BigDecimal.class), any(BudgetPeriod.class)))
                .thenReturn(mockCategoryToBudgetMap);


        List<UserBudgetCategory> expectedBudgetCategories = new ArrayList<>();
        expectedBudgetCategories.add(createUserBudgetCategory(
                "19047000", "Supermarkets and Groceries", 200.0, 112.47,
                LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 1L
        ));
        expectedBudgetCategories.add(createUserBudgetCategory(
                "19047000", "Supermarkets and Groceries", 200.0, 112.47,
                LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22), 1L
        ));
        expectedBudgetCategories.add(createUserBudgetCategory(
                "19047000", "Supermarkets and Groceries", 200.0, 112.47,
                LocalDate.of(2024, 9, 25), LocalDate.of(2024, 9, 27), 1L
        ));

// Adding expected UserBudgetCategory entries for "Gas Stations"
        expectedBudgetCategories.add(createUserBudgetCategory(
                "22009000", "Gas Stations", 100.0, 91.34,
                LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 1L
        ));
        expectedBudgetCategories.add(createUserBudgetCategory(
                "22009000", "Gas Stations", 100.0, 91.34,
                LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 20), 1L
        ));
        expectedBudgetCategories.add(createUserBudgetCategory(
                "22009000", "Gas Stations", 100.0, 91.34,
                LocalDate.of(2024, 9, 30), LocalDate.of(2024, 9, 30), 1L
        ));

// Adding expected UserBudgetCategory entries for "Subscription"
        expectedBudgetCategories.add(createUserBudgetCategory(
                "18061000", "Subscription", 120.0, 72.8,
                LocalDate.of(2024, 9, 5), LocalDate.of(2024, 9, 8), 1L
        ));
        expectedBudgetCategories.add(createUserBudgetCategory(
                "18061000", "Subscription", 120.0, 72.8,
                LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 27), 1L
        ));

        List<UserBudgetCategory> actual = budgetCategoryBuilder.initializeUserBudgetCategories(budget, budgetPeriod, transactions);
        for(int i = 0; i < expectedBudgetCategories.size(); i++)
        {
            UserBudgetCategory expected = expectedBudgetCategories.get(i);
            UserBudgetCategory actualCategory = actual.get(i);

            // Log category information before the assertions
            System.out.println("Comparing category: " + expected.getCategoryName());
            System.out.println("Expected Budget Actual: " + expected.getBudgetActual() + ", Actual Budget Actual: " + actualCategory.getBudgetActual());
            System.out.println("Expected Budgeted Amount: " + expected.getBudgetedAmount() + ", Actual Budgeted Amount: " + actualCategory.getBudgetedAmount());
            System.out.println("Expected Start Date: " + expected.getStartDate() + ", Actual Start Date: " + actualCategory.getStartDate());
            System.out.println("Expected End Date: " + expected.getEndDate() + ", Actual End Date: " + actualCategory.getEndDate());
            System.out.println("Expected User ID: " + expected.getUserId() + ", Actual User ID: " + actualCategory.getUserId());

            // Perform assertions
            assertEquals(expected.getBudgetActual(), actualCategory.getBudgetActual(), "Budget actual does not match for category: " + expected.getCategoryName());
            assertEquals(expected.getBudgetedAmount(), actualCategory.getBudgetedAmount(), "Budgeted amount does not match for category: " + expected.getCategoryName());
            assertEquals(expected.getStartDate(), actualCategory.getStartDate(), "Start date does not match for category: " + expected.getCategoryName());
            assertEquals(expected.getEndDate(), actualCategory.getEndDate(), "End date does not match for category: " + expected.getCategoryName());
            assertEquals(expected.getUserId(), actualCategory.getUserId(), "User ID does not match for category: " + expected.getCategoryName());
        }

    }

    @Test
    void testCreateCategorySpendingList_whenCategoriesIsEmpty_thenReturnEmptyList(){
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createAffirmTransaction());

        List<CategorySpending> actual = budgetCategoryBuilder.createCategorySpendingList(new ArrayList<>(), transactions);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategorySpendingList_whenTransactionsIsEmpty_thenReturnEmptyList(){
        List<String> categories = new ArrayList<>();
        categories.add("Groceries");

        List<CategorySpending> actual = budgetCategoryBuilder.createCategorySpendingList(categories, new ArrayList<>());
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategorySpendingList_returnCategorySpendingList(){
        List<String> categories = new ArrayList<>();
        categories.add("Groceries");
        categories.add("Gas");
        categories.add("Payments");

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createAffirmTransaction());
        transactions.add(createWalmartTransaction());
        transactions.add(createGasTransaction());

        List<CategorySpending> expectedCategorySpending = new ArrayList<>();

        Mockito.when(categoryService.getCategoryIdByName("Payments")).thenReturn(List.of("cat-005"));
        Mockito.when(categoryService.getCategoryIdByName("Gas")).thenReturn(List.of("cat-003"));
        Mockito.when(categoryService.getCategoryIdByName("Groceries")).thenReturn(List.of("cat-001"));

        expectedCategorySpending.add(new CategorySpending("cat-001","Groceries", new BigDecimal("50.75")));
        expectedCategorySpending.add(new CategorySpending("cat-003", "Gas", new BigDecimal("50.75")));
        expectedCategorySpending.add(new CategorySpending("cat-005","Payments", new BigDecimal("50.75")));

        List<CategorySpending> actual = budgetCategoryBuilder.createCategorySpendingList(categories, transactions);
        for(int i = 0; i < expectedCategorySpending.size(); i++)
        {
            assertEquals(expectedCategorySpending.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expectedCategorySpending.get(i).getCategoryId(), actual.get(i).getCategoryId());
            assertEquals(expectedCategorySpending.get(i).getActualSpending(), actual.get(i).getActualSpending());
        }
        assertEquals(expectedCategorySpending.size(), actual.size());
    }

    @Test
    void testBuildUserBudgetCategoryList_whenCategoryBudgetIsEmpty_thenReturnEmptyList(){
        List<CategorySpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(new CategorySpending("cat-001","Groceries", new BigDecimal("50.75")));

        Map<String, List<DateRange>> categoryDateRanges = new HashMap<>();
        categoryDateRanges.put("cat-001", List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8))));
        Long userId = 1L;

        Map<String, BigDecimal> categoryBudgets = new HashMap<>();

        List<UserBudgetCategory> userBudgetCategories = budgetCategoryBuilder.buildUserBudgetCategoryList(categoryBudgets, categorySpendings, categoryDateRanges, userId);
        assertNotNull(userBudgetCategories);
        assertTrue(userBudgetCategories.isEmpty());
    }

    @Test
    void testBuildUserBudgetCategoryList_whenCategorySpendingListIsEmpty_thenReturnEmptyList(){
        Map<String, List<DateRange>> categoryDateRanges = new HashMap<>();
        categoryDateRanges.put("cat-001", List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8))));
        Long userId = 1L;

        List<CategorySpending> categorySpendings = new ArrayList<>();;

        Map<String, BigDecimal> categoryBudgets = new HashMap<>();
        categoryBudgets.put("cat-001", new BigDecimal("50.75"));
        categoryBudgets.put("cat-003", new BigDecimal("50.75"));

        List<UserBudgetCategory> actual = budgetCategoryBuilder.buildUserBudgetCategoryList(categoryBudgets, categorySpendings, categoryDateRanges, userId);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildUserBudgetCategoryList_whenCategoryDateRangesListIsEmpty_thenReturnEmptyList(){
        Map<String, List<DateRange>> categoryDateRanges = new HashMap<>();

        List<CategorySpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(new CategorySpending("cat-001","Groceries", new BigDecimal("50.75")));

        Map<String, BigDecimal> categoryBudgets = new HashMap<>();
        categoryBudgets.put("cat-001", new BigDecimal("50.75"));
        categoryBudgets.put("cat-003", new BigDecimal("50.75"));
        Long userId = 1L;

        List<UserBudgetCategory> actual = budgetCategoryBuilder.buildUserBudgetCategoryList(categoryBudgets, categorySpendings, categoryDateRanges, userId);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildUserBudgetCategoryList_thenReturnUserBudgetCategories(){
        List<CategorySpending> categorySpendings = new ArrayList<>();
        categorySpendings.add(new CategorySpending("cat-001","Groceries", new BigDecimal("176.0")));
        categorySpendings.add(new CategorySpending("cat-003","Gas", new BigDecimal("32.23")));

        Map<String, BigDecimal> categoryBudgets = new HashMap<>();
        categoryBudgets.put("Groceries", new BigDecimal("450.0"));
        categoryBudgets.put("Gas", new BigDecimal("67.0"));
        Long userId = 1L;

        Map<String, List<DateRange>> categoryDateRanges = new HashMap<>();
        categoryDateRanges.put("Groceries", List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8))));
        categoryDateRanges.put("Gas", List.of(new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8))));

        List<UserBudgetCategory> expectedUserBudgetCategories = new ArrayList<>();
        expectedUserBudgetCategories.add(createGroceriesCategory(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)));
        expectedUserBudgetCategories.add(createGasBudgetCategory(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 67.00, 32.22));

        List<UserBudgetCategory> actual = budgetCategoryBuilder.buildUserBudgetCategoryList(categoryBudgets, categorySpendings, categoryDateRanges, userId);
        for(int i = 0; i < expectedUserBudgetCategories.size(); i++){
            assertEquals(expectedUserBudgetCategories.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expectedUserBudgetCategories.get(i).getCategoryId(), actual.get(i).getCategoryId());
            assertEquals(expectedUserBudgetCategories.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expectedUserBudgetCategories.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
            assertEquals(expectedUserBudgetCategories.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expectedUserBudgetCategories.get(i).getEndDate(), actual.get(i).getEndDate());
            assertEquals(expectedUserBudgetCategories.get(i).getUserId(), actual.get(i).getUserId());
        }
    }

    private UserBudgetCategory createUserBudgetCategory(String categoryId, String categoryName, Double budgetedAmount, Double actualAmount, LocalDate startDate, LocalDate endDate, Long userId) {
        UserBudgetCategory category = new UserBudgetCategory();
        category.setCategoryId(categoryId);
        category.setCategoryName(categoryName);
        category.setBudgetedAmount(budgetedAmount);
        category.setBudgetActual(actualAmount);
        category.setStartDate(startDate);
        category.setEndDate(endDate);
        category.setUserId(userId);
        category.setIsActive(true); // Assuming all categories are active for this test
        return category;
    }

    private UserBudgetCategory createGasBudgetCategory(LocalDate startDate, LocalDate endDate, Double actual, Double budgetAmount)
    {
        UserBudgetCategory gasBudgetCategory = new UserBudgetCategory();
        gasBudgetCategory.setCategoryId("cat-003");
        gasBudgetCategory.setBudgetedAmount(budgetAmount);
        gasBudgetCategory.setCategoryName("Gas");
        gasBudgetCategory.setBudgetActual(actual);
        gasBudgetCategory.setIsActive(true);
        gasBudgetCategory.setStartDate(startDate);
        gasBudgetCategory.setEndDate(endDate);
        gasBudgetCategory.setUserId(1L);
        return gasBudgetCategory;
    }

    private UserBudgetCategory createGroceriesCategory(LocalDate startDate, LocalDate endDate)
    {
        UserBudgetCategory groceriesCategory = new UserBudgetCategory();
        groceriesCategory.setCategoryId("cat-001");
        groceriesCategory.setBudgetedAmount(450.00);
        groceriesCategory.setBudgetActual(120.00);
        groceriesCategory.setCategoryName("Groceries");
        groceriesCategory.setIsActive(true);
        groceriesCategory.setStartDate(startDate);
        groceriesCategory.setEndDate(endDate);
        groceriesCategory.setUserId(1L);
        return groceriesCategory;
    }

    private UserBudgetCategory createPaymentCategory(LocalDate startDate, LocalDate endDate)
    {
        UserBudgetCategory paymentCategory = new UserBudgetCategory();
        paymentCategory.setCategoryId("cat-222");
        paymentCategory.setCategoryName("Payments");
        paymentCategory.setBudgetedAmount(149.00);
        paymentCategory.setBudgetActual(120.00);
        paymentCategory.setIsActive(true);
        paymentCategory.setStartDate(startDate);
        paymentCategory.setUserId(1L);
        paymentCategory.setEndDate(endDate);
        return paymentCategory;
    }

    private Transaction createAffirmTransaction(){
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Payments"),  // categories
                "cat-005",                     // categoryId
                LocalDate.of(2024, 11, 5),     // date
                "Affirm Purchase",            // description
                "Affirm",                     // merchantName
                "Affirm Payment",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 4),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 11, 5)      // posted
        );
    }

    private Transaction createTransactionExample(LocalDate posted, List<String> categories, String categoryId, String description, String merchant, String name, BigDecimal amount){
        return new Transaction(
                "account-12345",
                amount,
                "USD",
                categories,
                categoryId,
                posted,
                description,
                merchant,
                name,
                false,
                "txn-12345",
                posted,
                "https://example.com/logo.png",
                posted
        );
    }

    private Transaction createWalmartTransaction() {
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Groceries"),  // categories
                "cat-001",                     // categoryId
                LocalDate.of(2024, 11, 1),     // date
                "Walmart Purchase",            // description
                "Walmart",                     // merchantName
                "Walmart Grocery Purchase",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 1),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 2)      // posted
        );
    }

    private Transaction createWincoTransaction(){
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Groceries"),  // categories
                "cat-001",                     // categoryId
                LocalDate.of(2024, 11, 5),     // date
                "WINCO Purchase",            // description
                "WINCO",                     // merchantName
                "WINCO Grocery Purchase",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 6),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 5)      // posted
        );
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

    @AfterEach
    void tearDown() {
    }
}