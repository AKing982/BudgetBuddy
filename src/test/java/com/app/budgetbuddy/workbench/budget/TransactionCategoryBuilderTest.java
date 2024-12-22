package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryConverter;

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

        // Create grocery transactions
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
        rentDesignator.setTransactions(List.of(
                new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"), "cat2",
                        LocalDate.of(2024, 11, 1), "desc", "merchant", "name", false, "trans_11_01",
                        null, null, LocalDate.of(2024, 11, 1)),
                new Transaction("acc1", new BigDecimal("707.00"), "USD", List.of("Rent"), "cat2",
                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
                        null, null, LocalDate.of(2024, 11, 16))
        ));

        categoryDesignators.add(groceriesDesignator);
        categoryDesignators.add(rentDesignator);

        // Execute
        Collection<CategoryPeriod> actual = budgetCategoryBuilder.createCategoryPeriods(
                1L,budgetStart, budgetEnd, period, categoryDesignators);

        // Verify
        assertFalse(actual.isEmpty());
        assertEquals(2, actual.size());

        // Convert to list and sort for comparison
        List<CategoryPeriod> actualList = new ArrayList<>(actual);
        actualList.sort(Comparator.comparing(CategoryPeriod::getCategory));

        // Verify Groceries
        CategoryPeriod groceriesPeriod = actualList.get(0);
        assertEquals("Groceries", groceriesPeriod.getCategory());
        assertEquals(4, groceriesPeriod.getDateRanges().size());

        // Verify Rent
        CategoryPeriod rentPeriod = actualList.get(1);
        assertEquals("Rent", rentPeriod.getCategory());
        assertEquals(2, rentPeriod.getDateRanges().size());

        // Verify specific date ranges
        verifyDateRanges(groceriesPeriod.getDateRanges(), List.of(
                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
                new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)),
                new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)),
                new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 29))
        ));

        verifyDateRanges(rentPeriod.getDateRanges(), List.of(
                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
                new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22))
        ));
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
    void testUpdateTransactionCategories_whenCategoryPeriodAndExistingTransactionCategory_thenReturnTransactionCategories() {
        List<CategoryPeriod> categoryPeriods = new ArrayList<>();

        // Create date ranges
        DateRange groceryRange1 = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16));
        DateRange groceryRange2 = new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 24));
        DateRange rentRange = new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30));
        DateRange utilitiesRange = new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30));

        // Setup Groceries CategoryPeriod
        CategoryPeriod groceriesCategoryPeriod = new CategoryPeriod("Groceries",
                List.of(groceryRange1, groceryRange2), 1L, true);
        groceriesCategoryPeriod.setBudgetForDateRange(groceryRange1, 200.0);
        groceriesCategoryPeriod.setBudgetForDateRange(groceryRange2, 250.0);
        groceriesCategoryPeriod.setCategoryActualAmountForDateRange(groceryRange1, 45.0);
        groceriesCategoryPeriod.setCategoryActualAmountForDateRange(groceryRange2, 65.0);
        groceriesCategoryPeriod.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("45.00"), "USD", Arrays.asList("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 9), "desc", "merchant", "name", false, "grocery_trans_3",
                        null, null, LocalDate.of(2024, 11, 9)),
                new Transaction("acc1", new BigDecimal("65.00"), "USD", Arrays.asList("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 17), "desc", "merchant", "name", false, "grocery_trans_4",
                        null, null, LocalDate.of(2024, 11, 17))
        ));

        // Setup Rent CategoryPeriod
        CategoryPeriod rentCategoryPeriod = new CategoryPeriod("Rent", List.of(rentRange), 1L, true);
        rentCategoryPeriod.setBudgetForDateRange(rentRange, 1200.0);
        rentCategoryPeriod.setCategoryActualAmountForDateRange(rentRange, 1200.0);
        rentCategoryPeriod.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("1200.00"), "USD", Arrays.asList("Rent"), "cat2",
                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "rent_trans_2",
                        null, null, LocalDate.of(2024, 11, 16))
        ));

        // Setup Utilities CategoryPeriod
        CategoryPeriod utilitiesCategoryPeriod = new CategoryPeriod("Utilities", List.of(utilitiesRange), 1L, true);
        utilitiesCategoryPeriod.setBudgetForDateRange(utilitiesRange, 150.0);
        utilitiesCategoryPeriod.setCategoryActualAmountForDateRange(utilitiesRange, 145.0);
        utilitiesCategoryPeriod.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("145.00"), "USD", Arrays.asList("Utilities"), "cat3",
                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "utilities_trans_1",
                        null, null, LocalDate.of(2024, 11, 16))
        ));

        categoryPeriods.add(groceriesCategoryPeriod);
        categoryPeriods.add(rentCategoryPeriod);
        categoryPeriods.add(utilitiesCategoryPeriod);

        // Setup existing TransactionCategories
        TransactionCategory rentTransactionCategory = new TransactionCategory();
        rentTransactionCategory.setCategoryName("Rent");
        rentTransactionCategory.setStartDate(LocalDate.of(2024, 11, 1));
        rentTransactionCategory.setEndDate(LocalDate.of(2024, 11, 8));
        rentTransactionCategory.setBudgetedAmount(1200.0);
        rentTransactionCategory.setBudgetActual(1200.0);
        rentTransactionCategory.setTransactionIds(Arrays.asList("rent_trans_1"));

        TransactionCategory groceriesTransactionCategory = new TransactionCategory();
        groceriesTransactionCategory.setCategoryName("Groceries");
        groceriesTransactionCategory.setStartDate(LocalDate.of(2024, 11, 1));
        groceriesTransactionCategory.setEndDate(LocalDate.of(2024, 11, 8));
        groceriesTransactionCategory.setBudgetedAmount(200.0);
        groceriesTransactionCategory.setBudgetActual(150.0);
        groceriesTransactionCategory.setTransactionIds(Arrays.asList("grocery_trans_1", "grocery_trans_2"));

        List<TransactionCategory> existingCategories = Arrays.asList(
                rentTransactionCategory,
                groceriesTransactionCategory
        );

        // Execute
        List<TransactionCategory> result = budgetCategoryBuilder.updateTransactionCategories(
                categoryPeriods,
                existingCategories
        );

        // Verify basics
        assertFalse(result.isEmpty());
        assertEquals(6, result.size());

        // Verify existing categories remain unchanged
        assertTrue(result.stream()
                .anyMatch(tc -> tc.getCategoryName().equals("Rent") &&
                        tc.getStartDate().equals(LocalDate.of(2024, 11, 1)) &&
                        tc.getBudgetedAmount() == 1200.0 &&
                        tc.getBudgetActual() == 1200.0));

        // Verify new categories with updated structure
        assertTrue(result.stream()
                .anyMatch(tc -> tc.getCategoryName().equals("Groceries") &&
                        tc.getStartDate().equals(LocalDate.of(2024, 11, 8)) &&
                        tc.getBudgetedAmount() == 200.0 &&
                        tc.getBudgetActual() == 45.0 &&
                        tc.getBudgetId() == 1L));

        assertTrue(result.stream()
                .anyMatch(tc -> tc.getCategoryName().equals("Groceries") &&
                        tc.getStartDate().equals(LocalDate.of(2024, 11, 16)) &&
                        tc.getBudgetedAmount() == 250.0 &&
                        tc.getBudgetActual() == 65.0 &&
                        tc.getBudgetId() == 1L));

        assertTrue(result.stream()
                .anyMatch(tc -> tc.getCategoryName().equals("Utilities") &&
                        tc.getStartDate().equals(LocalDate.of(2024, 11, 16)) &&
                        tc.getBudgetedAmount() == 150.0 &&
                        tc.getBudgetActual() == 145.0 &&
                        tc.getBudgetId() == 1L &&
                        tc.getIsActive()));
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

        List<CategoryPeriod> categoryPeriods = Arrays.asList(groceriesCategoryPeriod, rentCategoryPeriod);

        // Setup existing TransactionCategories for same period
        TransactionCategory existingRentCategory = new TransactionCategory();
        existingRentCategory.setCategoryName("Rent");
        existingRentCategory.setStartDate(LocalDate.of(2024, 11, 1));
        existingRentCategory.setEndDate(LocalDate.of(2024, 11, 8));
        existingRentCategory.setBudgetedAmount(1200.0);
        existingRentCategory.setBudgetActual(1200.0);
        existingRentCategory.setTransactionIds(Arrays.asList("rent_trans_1"));
        existingRentCategory.setBudgetId(1L);
        existingRentCategory.setIsActive(true);

        TransactionCategory existingGroceriesCategory = new TransactionCategory();
        existingGroceriesCategory.setCategoryName("Groceries");
        existingGroceriesCategory.setStartDate(LocalDate.of(2024, 11, 1));
        existingGroceriesCategory.setEndDate(LocalDate.of(2024, 11, 8));
        existingGroceriesCategory.setBudgetedAmount(200.0);
        existingGroceriesCategory.setBudgetActual(150.0);
        existingGroceriesCategory.setTransactionIds(Arrays.asList("grocery_trans_1", "grocery_trans_2"));
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
        assertEquals(235.0, groceriesResult.getBudgetActual()); // 150 + 85
        assertEquals(3, groceriesResult.getTransactionIds().size()); // All 3 transaction IDs
        assertTrue(groceriesResult.getTransactionIds().containsAll(Arrays.asList(
                "grocery_trans_1", "grocery_trans_2", "grocery_trans_3")));

        // Verify Rent category was merged correctly
        Optional<TransactionCategory> mergedRent = result.stream()
                .filter(tc -> tc.getCategoryName().equals("Rent"))
                .findFirst();

        assertTrue(mergedRent.isPresent());
        TransactionCategory rentResult = mergedRent.get();
        assertEquals(2000.0, rentResult.getBudgetActual()); // 1200 + 800
        assertEquals(2, rentResult.getTransactionIds().size()); // Both transaction IDs
        assertTrue(rentResult.getTransactionIds().containsAll(Arrays.asList(
                "rent_trans_1", "rent_trans_2")));
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
        // Setup date ranges
        DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
        DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15));

        // Setup CategoryPeriods
        CategoryPeriod groceriesCategoryPeriod = new CategoryPeriod("Groceries", List.of(dateRange1, dateRange2), 1L, true);
        groceriesCategoryPeriod.setBudgetForDateRange(dateRange1, 200.0);
        groceriesCategoryPeriod.setBudgetForDateRange(dateRange2, 250.0);
        groceriesCategoryPeriod.setCategoryActualAmountForDateRange(dateRange1, 150.0);
        groceriesCategoryPeriod.setCategoryActualAmountForDateRange(dateRange2, 200.0);
        groceriesCategoryPeriod.setTransactions(Arrays.asList(
                new Transaction("acc1", new BigDecimal("150.00"), "USD", Arrays.asList("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_1",
                        null, null, LocalDate.of(2024, 11, 3)),
                new Transaction("acc1", new BigDecimal("200.00"), "USD", Arrays.asList("Groceries"), "cat1",
                        LocalDate.of(2024, 11, 10), "desc", "merchant", "name", false, "grocery_trans_2",
                        null, null, LocalDate.of(2024, 11, 10))
        ));

        // Setup Budget
        Budget budget = new Budget();
        budget.setId(1L);
        budget.setStartDate(LocalDate.of(2024, 11, 1));
        budget.setEndDate(LocalDate.of(2024, 11, 15));

        List<CategoryPeriod> categoryPeriods = List.of(groceriesCategoryPeriod);

        // Execute
        List<TransactionCategory> result = budgetCategoryBuilder.buildTransactionCategoryList(
                categoryPeriods, budget);

        // Verify
        assertFalse(result.isEmpty());
        assertEquals(2, result.size());  // Should create one category per date range

        // Verify first period
        TransactionCategory firstPeriod = result.get(0);
        assertEquals("Groceries", firstPeriod.getCategoryName());
        assertEquals(LocalDate.of(2024, 11, 1), firstPeriod.getStartDate());
        assertEquals(LocalDate.of(2024, 11, 8), firstPeriod.getEndDate());
        assertEquals(200.0, firstPeriod.getBudgetedAmount());
        assertEquals(150.0, firstPeriod.getBudgetActual());
        assertEquals(1L, firstPeriod.getBudgetId());
        assertTrue(firstPeriod.getIsActive());
        assertFalse(firstPeriod.isOverSpent());
        assertEquals(0.0, firstPeriod.getOverSpendingAmount());

        // Verify second period
        TransactionCategory secondPeriod = result.get(1);
        assertEquals("Groceries", secondPeriod.getCategoryName());
        assertEquals(LocalDate.of(2024, 11, 8), secondPeriod.getStartDate());
        assertEquals(LocalDate.of(2024, 11, 15), secondPeriod.getEndDate());
        assertEquals(250.0, secondPeriod.getBudgetedAmount());
        assertEquals(200.0, secondPeriod.getBudgetActual());
        assertEquals(1L, secondPeriod.getBudgetId());
        assertTrue(secondPeriod.getIsActive());
        assertFalse(secondPeriod.isOverSpent());
        assertEquals(0.0, secondPeriod.getOverSpendingAmount());
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

//    @Test
//    void testInitializeUserBudgetCategories_SeptMockData_returnDateRanges()
//    {
//        Budget budget = new Budget();
//        budget.setBudgetAmount(new BigDecimal("3070"));
//        budget.setBudgetName("Savings Plan");
//        budget.setActual(new BigDecimal("1609"));
//        budget.setStartDate(LocalDate.of(2024, 9, 1));
//        budget.setEndDate(LocalDate.of(2024, 9, 30));
//        budget.setUserId(1L);
//
//        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 30));
//
//        List<Transaction> transactions = new ArrayList<>();
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 1), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("35.23")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 3), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("35.23")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 4), List.of("Gas Stations"), "22009000", "PIN Purchase MAVERICK", "MAVERICK", "MAVERICK", new BigDecimal("31.55")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 5), List.of("Subscription"), "18061000", "AFFIRM Purchase", "AFFIRM", "AFFIRM", new BigDecimal("19.23")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 8), List.of("Subscription"), "18061000", "AFFIRM Purchase", "AFFIRM", "AFFIRM", new BigDecimal("10.00")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 15), List.of("Subscription"), "18061000", "Spotify", "Spotify", "Spotify", new BigDecimal("12.57")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 15), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("16.23")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 15), List.of("Supermarkets and Groceries"), "19047000", "Pin Purchase HARMONS", "HARMONS", "HARMONS", new BigDecimal("7.89")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 20), List.of("Gas Stations"), "22009000", "PIN Purchase MAVERICK", "MAVERICK", "MAVERICK", new BigDecimal("35.23")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 25), List.of("Supermarkets and Groceries"), "19047000", "PIN Purchase WINCO", "WINCO", "WINCO", new BigDecimal("17.89")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 27), List.of("Subscription"), "18061000", "AFFIRM Purchase", "AFFIRM", "AFFIRM", new BigDecimal("31.00")));
//        transactions.add(createTransactionExample(LocalDate.of(2024, 9, 30), List.of("Gas Stations"), "22009000", "PIN Purchase MAVERICK", "MAVERICK", "MAVERICK", new BigDecimal("24.56")));
//
//        List<CategorySpending> mockCategorySpendingList = new ArrayList<>();
//        mockCategorySpendingList.add(new CategorySpending("19047000", "Supermarkets and Groceries", new BigDecimal("112.47")));
//        mockCategorySpendingList.add(new CategorySpending("19047000", "Gas Stations", new BigDecimal("91.34")));
//        mockCategorySpendingList.add(new CategorySpending("18061000", "Subscription", new BigDecimal("72.8")));
//
//        Map<String, BigDecimal> mockCategoryToBudgetMap = new HashMap<>();
//        mockCategoryToBudgetMap.put("Supermarkets and Groceries", new BigDecimal("200"));
//        mockCategoryToBudgetMap.put("Gas Stations", new BigDecimal("100"));
//        mockCategoryToBudgetMap.put("Subscription", new BigDecimal("120"));
//
//        Map<String, List<DateRange>> categoryPeriods = new HashMap<>();
//        categoryPeriods.put("Supermarkets and Groceries", List.of(
//                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)),   // Covers transactions on Sept 1, 3
//                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22)), // Covers transactions on Sept 15
//                new DateRange(LocalDate.of(2024, 9, 25), LocalDate.of(2024, 9, 27))  // Covers transaction on Sept 25
//        ));
//
//        categoryPeriods.put("Gas Stations", List.of(
//                new DateRange(LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8)),   // Covers transaction on Sept 4
//                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 20)), // Covers transaction on Sept 20
//                new DateRange(LocalDate.of(2024, 9, 30), LocalDate.of(2024, 9, 30))  // Covers transaction on Sept 30
//        ));
//
//        categoryPeriods.put("Subscription", List.of(
//                new DateRange(LocalDate.of(2024, 9, 5), LocalDate.of(2024, 9, 8)),   // Covers transactions on Sept 5, 8
//                new DateRange(LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 27))  // Covers transactions on Sept 15, 27
//        ));
//
//        when(categoryService.getCategoryIdByName("Supermarkets and Groceries")).thenReturn(Optional.of("19047000"));
//        when(categoryService.getCategoryIdByName("Gas Stations")).thenReturn(Optional.of("19047000"));
//        when(categoryService.getCategoryIdByName("Subscription")).thenReturn(Optional.of("18061000"));
//
//        doReturn(categoryPeriods).when(budgetCategoryBuilder)
//                .createCategoryPeriods(anyString(), any(LocalDate.class), any(LocalDate.class), any(Period.class), anyList());
//
//        when(budgetCalculator.createCategoryToBudgetMap(anyList(), any(Budget.class), any(BigDecimal.class), any(BudgetPeriod.class)))
//                .thenReturn(mockCategoryToBudgetMap);
//
//
//        List<TransactionCategory> expectedBudgetCategories = new ArrayList<>();
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "19047000", "Supermarkets and Groceries", 200.0, 112.47,
//                LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 1L
//        ));
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "19047000", "Supermarkets and Groceries", 200.0, 112.47,
//                LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 22), 1L
//        ));
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "19047000", "Supermarkets and Groceries", 200.0, 112.47,
//                LocalDate.of(2024, 9, 25), LocalDate.of(2024, 9, 27), 1L
//        ));
//
//// Adding expected UserBudgetCategory entries for "Gas Stations"
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "22009000", "Gas Stations", 100.0, 91.34,
//                LocalDate.of(2024, 9, 1), LocalDate.of(2024, 9, 8), 1L
//        ));
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "22009000", "Gas Stations", 100.0, 91.34,
//                LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 20), 1L
//        ));
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "22009000", "Gas Stations", 100.0, 91.34,
//                LocalDate.of(2024, 9, 30), LocalDate.of(2024, 9, 30), 1L
//        ));
//
//// Adding expected UserBudgetCategory entries for "Subscription"
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "18061000", "Subscription", 120.0, 72.8,
//                LocalDate.of(2024, 9, 5), LocalDate.of(2024, 9, 8), 1L
//        ));
//        expectedBudgetCategories.add(createUserBudgetCategory(
//                "18061000", "Subscription", 120.0, 72.8,
//                LocalDate.of(2024, 9, 15), LocalDate.of(2024, 9, 27), 1L
//        ));
//
//        List<TransactionCategory> actual = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, transactions);
//        for(int i = 0; i < expectedBudgetCategories.size(); i++)
//        {
//            TransactionCategory expected = expectedBudgetCategories.get(i);
//            TransactionCategory actualCategory = actual.get(i);
//
//            // Log category information before the assertions
//            System.out.println("Comparing category: " + expected.getCategoryName());
//            System.out.println("Expected Budget Actual: " + expected.getBudgetActual() + ", Actual Budget Actual: " + actualCategory.getBudgetActual());
//            System.out.println("Expected Budgeted Amount: " + expected.getBudgetedAmount() + ", Actual Budgeted Amount: " + actualCategory.getBudgetedAmount());
//            System.out.println("Expected Start Date: " + expected.getStartDate() + ", Actual Start Date: " + actualCategory.getStartDate());
//            System.out.println("Expected End Date: " + expected.getEndDate() + ", Actual End Date: " + actualCategory.getEndDate());
//
//            // Perform assertions
//            assertEquals(expected.getBudgetActual(), actualCategory.getBudgetActual(), "Budget actual does not match for category: " + expected.getCategoryName());
//            assertEquals(expected.getBudgetedAmount(), actualCategory.getBudgetedAmount(), "Budgeted amount does not match for category: " + expected.getCategoryName());
//            assertEquals(expected.getStartDate(), actualCategory.getStartDate(), "Start date does not match for category: " + expected.getCategoryName());
//            assertEquals(expected.getEndDate(), actualCategory.getEndDate(), "End date does not match for category: " + expected.getCategoryName());
//        }
//
//    }


//    @Test
//    void testCreateCategorySpendingList_returnCategorySpendingList(){
//        List<String> categories = new ArrayList<>();
//        categories.add("Groceries");
//        categories.add("Gas");
//        categories.add("Payments");
//
//        List<Transaction> transactions = new ArrayList<>();
//        transactions.add(createAffirmTransaction());
//        transactions.add(createWalmartTransaction());
//        transactions.add(createGasTransaction());
//
//        List<CategorySpending> expectedCategorySpending = new ArrayList<>();
//
//        Mockito.when(categoryService.getCategoryIdByName("Payments")).thenReturn(Optional.of("cat-005"));
//        Mockito.when(categoryService.getCategoryIdByName("Gas")).thenReturn(Optional.of("cat-003"));
//        Mockito.when(categoryService.getCategoryIdByName("Groceries")).thenReturn(Optional.of("cat-001"));
//
//        expectedCategorySpending.add(new CategorySpending("cat-001","Groceries", new BigDecimal("50.75")));
//        expectedCategorySpending.add(new CategorySpending("cat-003", "Gas", new BigDecimal("50.75")));
//        expectedCategorySpending.add(new CategorySpending("cat-005","Payments", new BigDecimal("50.75")));
//
//        List<CategorySpending> actual = budgetCategoryBuilder.createCategorySpendingList(categories, transactions);
//        for(int i = 0; i < expectedCategorySpending.size(); i++)
//        {
//            assertEquals(expectedCategorySpending.get(i).getCategoryName(), actual.get(i).getCategoryName());
//            assertEquals(expectedCategorySpending.get(i).getCategoryId(), actual.get(i).getCategoryId());
//            assertEquals(expectedCategorySpending.get(i).getActualSpending(), actual.get(i).getActualSpending());
//        }
//        assertEquals(expectedCategorySpending.size(), actual.size());
//    }
//



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