package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
import io.jsonwebtoken.Header;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

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

    @InjectMocks
    private BudgetCategoryBuilder budgetCategoryBuilder;

    private BudgetPeriod testBudgetPeriod;

    @BeforeEach
    void setUp() {
        budgetCategoryBuilder = new BudgetCategoryBuilder(userBudgetCategoryService, categoryRuleService, categoryService, budgetCalculator);
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
    void testCreateCategoryPeriod_thenReturnDateRange(){

    }

    @Test
    void testInitializeUserBudgetCategories_whenBudgetIsNull_thenReturnEmptyMap(){
       Map<Long, List<UserBudgetCategory>> userBudgetCategories = budgetCategoryBuilder.initializeUserBudgetCategories(null, testBudgetPeriod);
       assertNotNull(userBudgetCategories);
       assertTrue(userBudgetCategories.isEmpty());
    }


    @Test
    void testInitializeUserBudgetCategories_whenBudgetPeriodIsNull_thenReturnEmptyMap(){
        Budget budget = new Budget();
        budget.setBudgetAmount(new BigDecimal("3070"));
        budget.setBudgetName("Savings Plan");
        budget.setActual(new BigDecimal("1609"));
        Map<Long, List<UserBudgetCategory>> actual = budgetCategoryBuilder.initializeUserBudgetCategories(budget, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }


    private Transaction createAffirmTransaction(){
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Payments", "Subscriptions"),  // categories
                "cat-001",                     // categoryId
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

    private Transaction createWalmartTransaction() {
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Groceries", "Food"),  // categories
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
                List.of("Groceries", "Food"),  // categories
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
                List.of("Gas Stations", "Gas"),  // categories
                "cat-001",                     // categoryId
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