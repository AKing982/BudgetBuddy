package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryConverter;

import lombok.extern.slf4j.Slf4j;
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
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class TransactionCategoryBuilderTest {

    @Mock
    private TransactionCategoryService userBudgetCategoryService;

    @Mock
    private CategoryRuleService categoryRuleService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private BudgetCalculations budgetCalculator;

    @Mock
    private CategoryRuleEngine categoryRuleEngine;

    @Mock
    private TransactionCategoryConverter userBudgetCategoryConverter;

    @Spy
    @InjectMocks
    private TransactionCategoryBuilder budgetCategoryBuilder;

    private BudgetPeriod testBudgetPeriod;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this); // Initialize mocks
        testBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 6, 1));
    }

//   @Test
//   void testCreateCategoryPeriod_whenEndDateIsNull_thenThrowException() {
//        assertThrows(IllegalArgumentException.class, () -> {
//            budgetCategoryBuilder.createCategoryPeriods("Groceries", LocalDate.of(2024, 6, 1), null, Period.WEEKLY,new ArrayList<>());
//        });
//   }

   @Test
   void testBuildDateRanges_WhenBudgetStartIsNull_thenReturnEmptyList(){
        LocalDate budgetEnd = LocalDate.of(2024, 6, 8);
        Period period = Period.MONTHLY;

        List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(null, budgetEnd, period);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
   }

   @Test
   void testBuildDateRanges_whenBudgetEndIsNull_thenReturnEmptyList(){
       LocalDate budgetStart = LocalDate.of(2024, 6, 8);
       Period period = Period.MONTHLY;

       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart,null, period);
       assertEquals(0, actual.size());
       assertTrue(actual.isEmpty());
   }

   @Test
   void testBuildDateRanges_whenPeriodIsNull_thenReturnEmptyList(){
       LocalDate budgetStart = LocalDate.of(2024, 6, 8);
       LocalDate budgetEnd = LocalDate.of(2024, 6, 15);
       Period period = Period.MONTHLY;

       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart,budgetEnd, null);
       assertEquals(0, actual.size());
       assertTrue(actual.isEmpty());
   }

   @Test
   void testBuildDateRanges_whenTransactionListIsNull_thenReturnEmptyList(){
        LocalDate budgetStart = LocalDate.of(2024, 6, 8);
        LocalDate budgetEnd = LocalDate.of(2024, 6, 15);
        Period period = Period.MONTHLY;

        List<DateRange> dateRanges = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
        assertEquals(0, dateRanges.size());
        assertTrue(dateRanges.isEmpty());
   }

    /**
     * When Budget StartDate is Equal to Budget end date, then recalculate the end date to be one month out
     */
   @Test
   void testBuildDateRanges_whenBudgetStartDateIsEqualToBudgetEndDate_thenReturnDateRangeList(){
        LocalDate budgetStart = LocalDate.of(2024, 11, 1);
        LocalDate budgetEnd = budgetStart;
        Period period = Period.WEEKLY;

        List<DateRange> expectedDateRanges = new ArrayList<>();
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 29)));
        expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 12, 1)));

        List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
        assertEquals(expectedDateRanges.size(), actual.size());
        for(int i = 0; i < expectedDateRanges.size(); i++){
            assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
        }
   }

   @Test
   void testBuildDateRanges_whenBudgetStartDateIsNotEqualToBudgetEndDate_thenReturnDateRangeList(){
       LocalDate budgetStart = LocalDate.of(2024, 11, 1);
       LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
       Period period = Period.WEEKLY;

       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 29)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30)));

       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for(int i = 0; i < expectedDateRanges.size(); i++){
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }

   @Test
   void testBuildDateRanges_whenBudgetPeriodIsBiWeekly_thenReturnDateRangeList(){
       LocalDate budgetStart = LocalDate.of(2024, 11, 1);
       LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
       Period period = Period.BIWEEKLY;
       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 15)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 29)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30)));
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for(int i = 0; i < expectedDateRanges.size(); i++){
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }


    @Test
    void testCreateCategoryPeriods_withSpecificTransactionExample() {
        // Setup dates
        LocalDate budgetStart = LocalDate.of(2024, 11, 1);
        LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
        Period period = Period.WEEKLY;

        Budget budget = new Budget();
        budget.setId(1L);
        budget.setStartDate(budgetStart);
        budget.setEndDate(budgetEnd);

        // Create grocery transactions
        // Create transactions
        List<Transaction> groceryTransactions = List.of(
                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "trans_11_02",
                        null, null, LocalDate.of(2024, 11, 2)),
                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 8), "desc", "merchant", "name", false, "trans_11_08",
                        null, null, LocalDate.of(2024, 11, 8)),
                new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
                        null, null, LocalDate.of(2024, 11, 16)),
                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 23), "desc", "merchant", "name", false, "trans_11_23",
                        null, null, LocalDate.of(2024, 11, 23))
        );

        // Create CategoryDesignators
        List<CategoryDesignator> categoryDesignators = new ArrayList<>();

        CategoryDesignator groceriesDesignator = new CategoryDesignator("cat1", "Groceries");
        groceriesDesignator.setTransactions(groceryTransactions);

        CategoryDesignator rentDesignator = new CategoryDesignator("cat2", "Rent");
        List<Transaction> rentTransactions = List.of(
                new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"), "cat2",
                        LocalDate.of(2024, 11, 1), "desc", "merchant", "name", false, "trans_11_01",
                        null, null, LocalDate.of(2024, 11, 1)),
                new Transaction("acc1", new BigDecimal("707.00"), "USD", List.of("Rent"), "cat2",
                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
                        null, null, LocalDate.of(2024, 11, 16))
        );
        rentDesignator.setTransactions(rentTransactions);

        categoryDesignators.add(groceriesDesignator);
        categoryDesignators.add(rentDesignator);

        // Create CategorySpending data
        List<CategorySpending> categorySpendingData = List.of(
                new CategorySpending("cat1", "Groceries", new BigDecimal("161.56"),
                        new DateRange(budgetStart, budgetEnd)),
                new CategorySpending("cat2", "Rent", new BigDecimal("1907.00"),
                        new DateRange(budgetStart, budgetEnd))
        );

        List<DateRange> actualDateRanges = List.of(
                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
                new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)),
                new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)),
                new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 29)),
                new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30))
        );

        Mockito.doReturn(new BigDecimal("2068.56"))
                .when(budgetCalculator)
                .getTotalSpendingOnAllCategories(categorySpendingData);

        List<CategoryPeriod> expectedCategoryPeriods = new ArrayList<>();

        List<DateRange> groceryDateRanges = new ArrayList<>();
        groceryDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)));
        groceryDateRanges.add(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16)));
        groceryDateRanges.add(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 23)));

        List<BudgetPeriodAmount> groceryBudgetedAmounts = new ArrayList<>();
        groceryBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)), 187.00));
        groceryBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16)), 167.00));
        groceryBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 23)), 167.00));

        List<BudgetPeriodAmount> groceryActualAmounts = new ArrayList<>();
        groceryActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)), 150.00));
        groceryActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16)), 142.00));
        groceryActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 23)), 105.00));

        CategoryPeriodCriteria groceryCategoryCriteria = new CategoryPeriodCriteria();
        groceryCategoryCriteria.setCategoryDateRanges(groceryDateRanges);
        groceryCategoryCriteria.setActualAmounts(groceryActualAmounts);
        groceryCategoryCriteria.setBudgetAmounts(groceryBudgetedAmounts);

        expectedCategoryPeriods.add(new CategoryPeriod(
                "cat1",
                "Groceries",
                groceryTransactions,
                groceryCategoryCriteria,
                1L,
                true
        ));

        List<DateRange> rentDateRanges = List.of(
                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 16)),
                new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30))
        );

        List<BudgetPeriodAmount> rentBudgetedAmounts = new ArrayList<>();
        rentBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 16)), 1200.00));
        rentBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30)), 707.00));

        List<BudgetPeriodAmount> rentActualAmounts = new ArrayList<>();
        rentActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 16)), 1200.00));
        rentActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30)), 707.00));

        CategoryPeriodCriteria rentCategoryCriteria = new CategoryPeriodCriteria();
        rentCategoryCriteria.setCategoryDateRanges(rentDateRanges);
        rentCategoryCriteria.setActualAmounts(rentActualAmounts);
        rentCategoryCriteria.setBudgetAmounts(rentBudgetedAmounts);

        expectedCategoryPeriods.add(new CategoryPeriod(
                "cat2",
                "Rent",
                rentTransactions,
                rentCategoryCriteria,
                1L,
                true
        ));

        Mockito.doReturn(groceryBudgetedAmounts)
                .when(budgetCalculator)
                .calculateBudgetedAmountForCategoryDateRange(
                        Mockito.eq(categorySpendingData.get(0)),
                        Mockito.any(BigDecimal.class),
                        Mockito.anyList(),
                        Mockito.eq(budget)
                );

        Mockito.doReturn(rentBudgetedAmounts)
                .when(budgetCalculator)
                .calculateBudgetedAmountForCategoryDateRange(
                        Mockito.eq(categorySpendingData.get(1)),
                        Mockito.any(BigDecimal.class),
                        Mockito.anyList(),
                        Mockito.eq(budget)
                );

        Mockito.doReturn(groceryActualAmounts)
                .when(budgetCalculator)
                .calculateActualAmountForCategoryDateRange(
                        Mockito.eq(categorySpendingData.get(0)),
                        Mockito.eq(groceriesDesignator),
                        Mockito.anyList(),
                        Mockito.eq(budget)
                );

        Mockito.doReturn(rentActualAmounts)
                .when(budgetCalculator)
                .calculateActualAmountForCategoryDateRange(
                        Mockito.eq(categorySpendingData.get(1)),
                        Mockito.eq(rentDesignator),
                        Mockito.anyList(),
                        Mockito.eq(budget)
                );

        List<CategoryPeriod> actual = budgetCategoryBuilder.createCategoryPeriods(
                budget, budgetStart, budgetEnd, period, categorySpendingData, categoryDesignators
        );

        assertEquals(expectedCategoryPeriods.size(), actual.size());
        for(int i = 0; i < actual.size(); i++)
        {
            CategoryPeriod expected = expectedCategoryPeriods.get(i);
            CategoryPeriod actualPeriod = actual.get(i);

            assertEquals(expected.getCategory(), actualPeriod.getCategory());
            assertEquals(expected.getTransactions(), actualPeriod.getTransactions());
            assertEquals(expected.getBudgetId(), actualPeriod.getBudgetId());
            assertEquals(expected.getIsActive(), actualPeriod.getIsActive());

            CategoryPeriodCriteria expectedCategoryPeriodCriteria = expected.getCategoryPeriodCriteria();
            CategoryPeriodCriteria actualCategoryPeriodCriteria = actualPeriod.getCategoryPeriodCriteria();
//            assertEquals(expectedCategoryPeriodCriteria.getCategoryDateRanges(), actualCategoryPeriodCriteria.getCategoryDateRanges());
            assertEquals(expectedCategoryPeriodCriteria.getBudgetAmounts(), actualCategoryPeriodCriteria.getBudgetAmounts());
            assertEquals(expectedCategoryPeriodCriteria.getActualAmounts(), actualCategoryPeriodCriteria.getActualAmounts());
        }
    }

    @Test
    void testUpdateTransactionCategories_whenCategoryPeriodsIsNull_thenReturnEmptyList(){
       List<TransactionCategory> transactionCategories = new ArrayList<>();
       transactionCategories.add(createGasBudgetCategory(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 60.00, 90.00));

       List<TransactionCategory> actual = budgetCategoryBuilder.updateTransactionCategories(null, transactionCategories);
       assertTrue(actual.isEmpty());

    }

    @Test
    void testUpdateTransactionCategories_whenExistingTransactionCategoriesIsNull_thenReturnEmptyList(){
       List<CategoryPeriod> categoryPeriods = new ArrayList<>();
       categoryPeriods.add(new CategoryPeriod("Groceries", List.of(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)))));

       List<TransactionCategory> actual = budgetCategoryBuilder.updateTransactionCategories(categoryPeriods, null);
       assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateTransactionCategories_whenPeriodsDoNotOverlap_createsNewCategories() {
        // Setup
        DateRange newGroceryRange = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16));
        DateRange newRentRange = new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30));

        // Transactions
        Transaction groceryTrans = new Transaction("acc1", new BigDecimal("45.00"), "USD", List.of("Groceries"),
                "cat1", LocalDate.of(2024, 11, 9), "desc", "merchant", "name", false, "grocery_trans_3", null, null, null);
        Transaction rentTrans = new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"),
                "cat2", LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "rent_trans_2", null, null, null);

        // New CategoryPeriods
        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
        groceryCriteria.setCategoryDateRanges(List.of(newGroceryRange));
        groceryCriteria.setBudgetAmounts(List.of(new BudgetPeriodAmount(newGroceryRange, 200.0)));
        groceryCriteria.setActualAmounts(List.of(new BudgetPeriodAmount(newGroceryRange, 45.0)));

        CategoryPeriod groceriesPeriod = new CategoryPeriod("cat1", "Groceries", List.of(groceryTrans), groceryCriteria, 1L, true);

        CategoryPeriodCriteria rentCriteria = new CategoryPeriodCriteria();
        rentCriteria.setCategoryDateRanges(List.of(newRentRange));
        rentCriteria.setBudgetAmounts(List.of(new BudgetPeriodAmount(newRentRange, 1200.0)));
        rentCriteria.setActualAmounts(List.of(new BudgetPeriodAmount(newRentRange, 1200.0)));

        CategoryPeriod rentPeriod = new CategoryPeriod("cat2", "Rent", List.of(rentTrans), rentCriteria, 1L, true);

        // Existing categories from previous period
        List<TransactionCategory> existingCategories = List.of(
                new TransactionCategory(1L, 1L, "cat2", "Rent", 1200.0, 1200.0, true,
                        LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 0.0, false),
                new TransactionCategory(2L, 1L, "cat1", "Groceries", 200.0, 150.0, true,
                        LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 0.0, false)
        );

        List<CategoryPeriod> newPeriods = List.of(groceriesPeriod, rentPeriod);

        // Execute
        List<TransactionCategory> result = budgetCategoryBuilder.updateTransactionCategories(newPeriods, existingCategories);

        // Verify
        assertEquals(4, result.size()); // 2 existing + 2 new

        // Verify existing categories unchanged
        verifyTransactionCategory(result, "cat1", "Groceries",
                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 200.0, 150.0, false);
        verifyTransactionCategory(result, "cat2", "Rent",
                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 1200.0, 1200.0, false);

        // Verify new categories created
        verifyTransactionCategory(result, "cat1", "Groceries",
                LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16), 200.0, 45.0, false);
        verifyTransactionCategory(result, "cat2", "Rent",
                LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30), 1200.0, 1200.0, false);
    }

    private void verifyTransactionCategory(List<TransactionCategory> categories, String categoryId,
                                           String categoryName, LocalDate startDate, LocalDate endDate, Double budgeted, Double actual,
                                           boolean isOverspent) {

        TransactionCategory matchingCategory = categories.stream()
                .filter(tc -> tc.getCategoryId().equals(categoryId) &&
                        tc.getStartDate().equals(startDate) &&
                        tc.getEndDate().equals(endDate))
                .findFirst()
                .orElseThrow(() -> new AssertionError(
                        String.format("No category found with ID: %s and date range: %s - %s",
                                categoryId, startDate, endDate)));


        assertEquals(categoryId, matchingCategory.getCategoryId(), "Category ID mismatch");
        assertEquals(categoryName, matchingCategory.getCategoryName(), "Category name mismatch");
        assertEquals(startDate, matchingCategory.getStartDate(), "Start date mismatch");
        assertEquals(endDate, matchingCategory.getEndDate(), "End date mismatch");
        assertEquals(budgeted, matchingCategory.getBudgetedAmount(), "Budget amount mismatch");
        assertEquals(actual, matchingCategory.getBudgetActual(), "Actual amount mismatch");
        assertEquals(isOverspent, matchingCategory.isOverSpent(), "Overspent flag mismatch");
    }

    @Test
    void testUpdateTransactionCategories_whenCategoryPeriodsInSamePeriodAsExistingTransactionCategories_thenReturnTransactionCategories() {
        // Create date ranges that match existing transaction categories
        DateRange dateRange = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));

        // Setup CategoryPeriods with same date range as existing
        CategoryPeriod groceriesCategoryPeriod = new CategoryPeriod("Groceries", List.of(dateRange), 1L, true);
        groceriesCategoryPeriod.setBudgetForDateRange(dateRange, 200.0);
        groceriesCategoryPeriod.setCategoryActualAmountForDateRange(dateRange, 85.0);
        groceriesCategoryPeriod.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("85.00"), "USD", Arrays.asList("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_3",
                        null, null, LocalDate.of(2024, 11, 3))
        ));

        CategoryPeriod rentCategoryPeriod = new CategoryPeriod("Rent", List.of(dateRange), 1L, true);
        rentCategoryPeriod.setBudgetForDateRange(dateRange, 1200.0);
        rentCategoryPeriod.setCategoryActualAmountForDateRange(dateRange, 800.0);
        rentCategoryPeriod.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("800.00"), "USD", Arrays.asList("Rent"), "cat2",
                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "rent_trans_2",
                        null, null, LocalDate.of(2024, 11, 2))
        ));

        List<CategoryPeriod> categoryPeriods = List.of(groceriesCategoryPeriod, rentCategoryPeriod);

        // Setup existing TransactionCategories for same period
        TransactionCategory existingRentCategory = new TransactionCategory();
        existingRentCategory.setCategoryName("Rent");
        existingRentCategory.setStartDate(LocalDate.of(2024, 11, 1));
        existingRentCategory.setEndDate(LocalDate.of(2024, 11, 8));
        existingRentCategory.setBudgetedAmount(1200.0);
        existingRentCategory.setBudgetActual(1200.0);
        existingRentCategory.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("800.00"), "USD", Arrays.asList("Rent"), "cat2",
                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "rent_trans_2",
                        null, null, LocalDate.of(2024, 11, 2))
        ));
        existingRentCategory.setBudgetId(1L);
        existingRentCategory.setIsActive(true);

        TransactionCategory existingGroceriesCategory = new TransactionCategory();
        existingGroceriesCategory.setCategoryName("Groceries");
        existingGroceriesCategory.setStartDate(LocalDate.of(2024, 11, 1));
        existingGroceriesCategory.setEndDate(LocalDate.of(2024, 11, 8));
        existingGroceriesCategory.setBudgetedAmount(200.0);
        existingGroceriesCategory.setBudgetActual(150.0);
        existingGroceriesCategory.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("85.00"), "USD", Arrays.asList("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_3",
                        null, null, LocalDate.of(2024, 11, 3))
        ));
        existingGroceriesCategory.setBudgetId(1L);
        existingGroceriesCategory.setIsActive(true);

        List<TransactionCategory> existingCategories = Arrays.asList(
                existingRentCategory,
                existingGroceriesCategory
        );

        // Execute
        List<TransactionCategory> result = budgetCategoryBuilder.updateTransactionCategories(
                categoryPeriods,
                existingCategories
        );

        // Verify
        assertEquals(2, result.size()); // Should only have 2 categories since they're merged

        // Verify Groceries category was merged correctly
        Optional<TransactionCategory> mergedGroceries = result.stream()
                .filter(tc -> tc.getCategoryName().equals("Groceries"))
                .findFirst();

        assertTrue(mergedGroceries.isPresent());
        TransactionCategory groceriesResult = mergedGroceries.get();
        assertEquals(85.0, groceriesResult.getBudgetActual()); // 150 + 85
        assertEquals(1, groceriesResult.getTransactions().size());

        // Verify Rent category was merged correctly
        Optional<TransactionCategory> mergedRent = result.stream()
                .filter(tc -> tc.getCategoryName().equals("Rent"))
                .findFirst();

        assertTrue(mergedRent.isPresent());
        TransactionCategory rentResult = mergedRent.get();
        assertEquals(800.0, rentResult.getBudgetActual()); // 1200 + 800
        assertEquals(1, rentResult.getTransactions().size()); // Both transaction IDs
    }


    @Test
    void testBuildTransactionCategoryList_whenCategoryPeriodsIsNull_thenReturnEmptyList(){
       Budget budget = new Budget(1L, new BigDecimal("320"), new BigDecimal("120"), 1L, "Test Budget", "Test Budget", LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30), LocalDateTime.now());
       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(null, budget);
       assertEquals(0, actual.size());
       assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildTransactionCategoryList_whenCategoryPeriodsValid_thenReturnTransactionCategoryList() {
        DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
        DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15));

        List<Transaction> transactions = List.of(
                new Transaction("acc1", new BigDecimal("150.00"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_1",
                        null, null, LocalDate.of(2024, 11, 3)),
                new Transaction("acc1", new BigDecimal("200.00"), "USD", List.of("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 10), "desc", "merchant", "name", false, "grocery_trans_2",
                        null, null, LocalDate.of(2024, 11, 10))
        );

        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
        groceryCriteria.setCategoryDateRanges(List.of(dateRange1, dateRange2));
        groceryCriteria.setBudgetAmounts(List.of(
                new BudgetPeriodAmount(dateRange1, 200.0),
                new BudgetPeriodAmount(dateRange2, 250.0)
        ));
        groceryCriteria.setActualAmounts(List.of(
                new BudgetPeriodAmount(dateRange1, 150.0),
                new BudgetPeriodAmount(dateRange2, 200.0)
        ));

        CategoryPeriod groceriesPeriod = new CategoryPeriod("cat1", "Groceries", transactions,
                groceryCriteria, 1L, true);

        Budget budget = new Budget();
        budget.setId(1L);
        budget.setStartDate(LocalDate.of(2024, 11, 1));
        budget.setEndDate(LocalDate.of(2024, 11, 15));

        List<CategoryPeriod> categoryPeriods = List.of(groceriesPeriod);

        List<TransactionCategory> result = budgetCategoryBuilder.buildTransactionCategoryList(
                categoryPeriods, budget);

        assertEquals(2, result.size());

        verifyTransactionCategory(result, "cat1", "Groceries",
                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 200.0, 150.0, false);
        verifyTransactionCategory(result, "cat1", "Groceries",
                LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15), 250.0, 200.0, false);
    }

    private void verifyDateRanges(List<DateRange> actual, List<DateRange> expected) {
        assertEquals(expected.size(), actual.size(), "Date range size mismatch");
        for (int i = 0; i < expected.size(); i++) {
            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate(),
                    "Start date mismatch at index " + i);
            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate(),
                    "End date mismatch at index " + i);
        }
    }

    private RecurringTransaction createWalmartRecurringTransaction() {
        return new RecurringTransaction(
                "account-12345",                  // accountId
                new BigDecimal("50.75"),          // amount
                "USD",                            // isoCurrencyCode
                List.of("Groceries"),             // categories
                "cat-001",                        // categoryId
                LocalDate.of(2024, 11, 1),        // date
                "Walmart Purchase",               // description
                "Walmart",                        // merchantName
                "Walmart Grocery Purchase",       // name
                false,                            // pending
                "txn-12345",                      // transactionId
                LocalDate.of(2024, 11, 1),        // authorizedDate
                "https://example.com/logo.png",   // logoUrl
                LocalDate.of(2024, 10, 2),        // posted
                "stream-67890",                   // streamId
                LocalDate.of(2024, 10, 1),        // firstDate
                LocalDate.of(2025, 10, 1),        // lastDate
                "WEEKLY",                         // frequency
                new BigDecimal("60.00"),          // averageAmount
                new BigDecimal("50.75"),          // lastAmount
                true,                             // active
                "Subscription"                    // type
        );
    }

    private RecurringTransaction createWincoRecurringTransaction() {
        return new RecurringTransaction(
                "account-12345",                  // accountId
                new BigDecimal("50.75"),          // amount
                "USD",                            // isoCurrencyCode
                List.of("Groceries"),             // categories
                "cat-001",                        // categoryId
                LocalDate.of(2024, 11, 5),        // date
                "WINCO Purchase",                 // description
                "WINCO",                          // merchantName
                "WINCO Grocery Purchase",         // name
                false,                            // pending
                "txn-12345",                      // transactionId
                LocalDate.of(2024, 11, 6),        // authorizedDate
                "https://example.com/logo.png",   // logoUrl
                LocalDate.of(2024, 10, 5),        // posted
                "stream-54321",                   // streamId
                LocalDate.of(2024, 9, 1),         // firstDate
                LocalDate.of(2025, 9, 1),         // lastDate
                "BIWEEKLY",                       // frequency
                new BigDecimal("70.00"),          // averageAmount
                new BigDecimal("50.75"),          // lastAmount
                true,                             // active
                "Subscription"                    // type
        );
    }

    private TransactionLink createTransactionLink(Transaction transaction, String category){
        return new TransactionLink(category, transaction.getTransactionId());
    }

    private TransactionCategory createUserBudgetCategory(String categoryId, String categoryName, Double budgetedAmount, Double actualAmount, LocalDate startDate, LocalDate endDate, Long userId) {
        TransactionCategory category = new TransactionCategory();
        category.setCategoryId(categoryId);
        category.setCategoryName(categoryName);
        category.setBudgetedAmount(budgetedAmount);
        category.setBudgetActual(actualAmount);
        category.setStartDate(startDate);
        category.setEndDate(endDate);
        category.setIsActive(true); // Assuming all categories are active for this test
        return category;
    }

    private TransactionCategory createGasBudgetCategory(LocalDate startDate, LocalDate endDate, Double actual, Double budgetAmount)
    {
        TransactionCategory gasBudgetCategory = new TransactionCategory();
        gasBudgetCategory.setCategoryId("cat-003");
        gasBudgetCategory.setBudgetedAmount(budgetAmount);
        gasBudgetCategory.setCategoryName("Gas");
        gasBudgetCategory.setBudgetActual(actual);
        gasBudgetCategory.setIsActive(true);
        gasBudgetCategory.setStartDate(startDate);
        gasBudgetCategory.setEndDate(endDate);
        return gasBudgetCategory;
    }

    private TransactionCategory createGroceriesCategory(LocalDate startDate, LocalDate endDate)
    {
        TransactionCategory groceriesCategory = new TransactionCategory();
        groceriesCategory.setCategoryId("cat-001");
        groceriesCategory.setBudgetedAmount(450.00);
        groceriesCategory.setBudgetActual(120.00);
        groceriesCategory.setCategoryName("Groceries");
        groceriesCategory.setIsActive(true);
        groceriesCategory.setStartDate(startDate);
        groceriesCategory.setEndDate(endDate);
        return groceriesCategory;
    }

    private TransactionCategory createPaymentCategory(LocalDate startDate, LocalDate endDate)
    {
        TransactionCategory paymentCategory = new TransactionCategory();
        paymentCategory.setCategoryId("cat-222");
        paymentCategory.setCategoryName("Payments");
        paymentCategory.setBudgetedAmount(149.00);
        paymentCategory.setBudgetActual(120.00);
        paymentCategory.setIsActive(true);
        paymentCategory.setStartDate(startDate);
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

    private RecurringTransaction createRecurringTransactionExample(LocalDate posted, List<String> categories, String categoryId, String description, String merchant, String name, BigDecimal amount) {
        return new RecurringTransaction(
                "account-12345",                  // accountId
                amount,                           // amount
                "USD",                            // isoCurrencyCode
                categories,                       // categories
                categoryId,                       // categoryId
                posted,                           // date
                description,                      // description
                merchant,                         // merchantName
                name,                             // name
                false,                            // pending
                "txn-12345",                      // transactionId
                posted,                           // authorizedDate
                "https://example.com/logo.png",   // logoUrl
                posted,                           // posted
                "stream-12345",                   // streamId
                LocalDate.of(2024, 1, 1),         // firstDate
                LocalDate.of(2024, 12, 31),       // lastDate
                "MONTHLY",                        // frequency
                new BigDecimal("100.00"),         // averageAmount
                amount,                           // lastAmount
                true,                             // active
                "Bill"                            // type
        );
    }

    @AfterEach
    void tearDown() {
    }
}