package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.CategoryPeriodCriteriaException;
import com.app.budgetbuddy.exceptions.DateRangeException;
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
import java.util.stream.Collectors;
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

    @Captor
    private ArgumentCaptor<List<Transaction>> categoryTransactionsCaptor;

    @Captor
    private ArgumentCaptor<DateRange> dateRangeCaptor;


    @Spy
    @InjectMocks
    private TransactionCategoryBuilder budgetCategoryBuilder;

    private BudgetPeriod testBudgetPeriod;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this); // Initialize mocks
        testBudgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 5, 1), LocalDate.of(2024, 6, 1));
    }

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

    /**
     * When Budget StartDate is Equal to Budget end date, then recalculate the end date to be one month out
     */
   @Test
   void testBuildDateRanges_whenBudgetStartDateIsEqualToBudgetEndDate_thenReturnDateRangeList(){
        LocalDate budgetStart = LocalDate.of(2024, 11, 1);
        LocalDate budgetEnd = budgetStart;
        Period period = Period.WEEKLY;

       // Only one date range since startDate == endDate
       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 1)));

       // Call method and verify
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for (int i = 0; i < expectedDateRanges.size(); i++) {
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }

   @Test
   void testBuildDateRanges_whenBudgetStartDateIsNotEqualToBudgetEndDate_thenReturnDateRangeList(){
       LocalDate budgetStart = LocalDate.of(2024, 11, 1);
       LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
       Period period = Period.WEEKLY;

       // Correct weekly ranges within the given date range
       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30))); // Last partial week

       // Call method and verify
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for (int i = 0; i < expectedDateRanges.size(); i++) {
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
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 14)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 28)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30)));
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for(int i = 0; i < expectedDateRanges.size(); i++){
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }


//    @Test
//    void testCreateCategoryPeriods_withSpecificTransactionExample() {
//        // Setup dates
//        LocalDate budgetStart = LocalDate.of(2024, 11, 1);
//        LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
//        Period period = Period.WEEKLY;
//
//        Budget budget = new Budget();
//        budget.setId(1L);
//        budget.setStartDate(budgetStart);
//        budget.setEndDate(budgetEnd);
//
//        // Create grocery transactions
//        // Create transactions
//        List<Transaction> groceryTransactions = List.of(
//                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "trans_11_02",
//                        null, null, LocalDate.of(2024, 11, 2)),
//                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 8), "desc", "merchant", "name", false, "trans_11_08",
//                        null, null, LocalDate.of(2024, 11, 8)),
//                new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 23), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 23))
//        );
//
//        // Create CategoryDesignators
//        List<CategoryTransactions> categoryDesignators = new ArrayList<>();
//
//        CategoryTransactions groceriesDesignator = new CategoryTransactions("cat1", "Groceries");
//        groceriesDesignator.setTransactions(groceryTransactions);
//
//        CategoryTransactions rentDesignator = new CategoryTransactions("cat2", "Rent");
//        List<Transaction> rentTransactions = List.of(
//                new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 1), "desc", "merchant", "name", false, "trans_11_01",
//                        null, null, LocalDate.of(2024, 11, 1)),
//                new Transaction("acc1", new BigDecimal("707.00"), "USD", List.of("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16))
//        );
//        rentDesignator.setTransactions(rentTransactions);
//
//        categoryDesignators.add(groceriesDesignator);
//        categoryDesignators.add(rentDesignator);
//
//        // Create CategorySpending data
//        List<CategoryPeriodSpending> categorySpendingData = List.of(
//                new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("161.56"),
//                        new DateRange(budgetStart, budgetEnd)),
//                new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("1907.00"),
//                        new DateRange(budgetStart, budgetEnd))
//        );
//
//        List<DateRange> actualDateRanges = List.of(
//                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//                new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15)),
//                new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 22)),
//                new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 29)),
//                new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30))
//        );
//
//        Mockito.doReturn(new BigDecimal("2068.56"))
//                .when(budgetCalculator)
//                .getTotalSpendingOnAllCategories(categorySpendingData);
//
//        List<CategoryBudget> expectedCategoryPeriods = new ArrayList<>();
//
//        List<DateRange> groceryDateRanges = new ArrayList<>();
//        groceryDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)));
//        groceryDateRanges.add(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16)));
//        groceryDateRanges.add(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 23)));
//
//        List<BudgetPeriodAmount> groceryBudgetedAmounts = new ArrayList<>();
//        groceryBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)), 187.00));
//        groceryBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16)), 167.00));
//        groceryBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 23)), 167.00));
//
//        List<BudgetPeriodAmount> groceryActualAmounts = new ArrayList<>();
//        groceryActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)), 150.00));
//        groceryActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16)), 142.00));
//        groceryActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 23)), 105.00));
//
//        CategoryPeriodCriteria groceryCategoryCriteria = new CategoryPeriodCriteria();
//        groceryCategoryCriteria.setCategoryDateRanges(groceryDateRanges);
//        groceryCategoryCriteria.setActualAmounts(groceryActualAmounts);
//        groceryCategoryCriteria.setBudgetAmounts(groceryBudgetedAmounts);
//
//        CategoryBudget groceryCategoryBudget = CategoryBudget.buildCategoryBudget(
//                "cat1",
//                "Groceries",
//                groceryTransactions,
//                groceryBudgetedAmounts,
//                groceryActualAmounts,
//                groceryDateRanges,
//                budget,
//                true);
//        expectedCategoryPeriods.add(groceryCategoryBudget);
//
//        List<DateRange> rentDateRanges = List.of(
//                new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 16)),
//                new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30))
//        );
//
//        List<BudgetPeriodAmount> rentBudgetedAmounts = new ArrayList<>();
//        rentBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 16)), 1200.00));
//        rentBudgetedAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30)), 707.00));
//
//        List<BudgetPeriodAmount> rentActualAmounts = new ArrayList<>();
//        rentActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 16)), 1200.00));
//        rentActualAmounts.add(new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30)), 707.00));
//
//        CategoryPeriodCriteria rentCategoryCriteria = new CategoryPeriodCriteria();
//        rentCategoryCriteria.setCategoryDateRanges(rentDateRanges);
//        rentCategoryCriteria.setActualAmounts(rentActualAmounts);
//        rentCategoryCriteria.setBudgetAmounts(rentBudgetedAmounts);
//
//        CategoryBudget categoryBudget = CategoryBudget.buildCategoryBudget(
//                "cat2",
//                "Rent",
//                rentTransactions,
//                rentBudgetedAmounts,
//                rentActualAmounts,
//                rentDateRanges,
//                budget,
//                true);
//        expectedCategoryPeriods.add(categoryBudget);
//
//        Mockito.doReturn(groceryBudgetedAmounts)
//                .when(budgetCalculator)
//                .calculateBudgetedAmountForCategoryDateRange(
//                        Mockito.eq(categorySpendingData.get(0)),
//                        Mockito.any(BigDecimal.class),
//                        Mockito.anyList(),
//                        Mockito.eq(budget)
//                );
//
//        Mockito.doReturn(rentBudgetedAmounts)
//                .when(budgetCalculator)
//                .calculateBudgetedAmountForCategoryDateRange(
//                        Mockito.eq(categorySpendingData.get(1)),
//                        Mockito.any(BigDecimal.class),
//                        Mockito.anyList(),
//                        Mockito.eq(budget)
//                );
//
//        Mockito.doReturn(groceryActualAmounts)
//                .when(budgetCalculator)
//                .calculateActualAmountForCategoryDateRange(
//                        Mockito.eq(categorySpendingData.get(0)),
//                        Mockito.eq(groceriesDesignator),
//                        Mockito.anyList(),
//                        Mockito.eq(budget)
//                );
//
//        Mockito.doReturn(rentActualAmounts)
//                .when(budgetCalculator)
//                .calculateActualAmountForCategoryDateRange(
//                        Mockito.eq(categorySpendingData.get(1)),
//                        Mockito.eq(rentDesignator),
//                        Mockito.anyList(),
//                        Mockito.eq(budget)
//                );
//
//        List<CategoryBudget> actual = budgetCategoryBuilder.createCategoryBudgets(
//                budget, budgetStart, budgetEnd, period, categorySpendingData, categoryDesignators
//        );
//
//        assertEquals(expectedCategoryPeriods.size(), actual.size());
//        for(int i = 0; i < actual.size(); i++)
//        {
//            CategoryBudget expectedCategoryBudget = expectedCategoryPeriods.get(i);
//            CategoryBudget actualCategoryBudget = actual.get(i);
//
//            assertEquals(expectedCategoryBudget.getCategory(), actualCategoryBudget.getCategory());
//            assertEquals(expectedCategoryBudget.getCategoryTransactions(), actualCategoryBudget.getCategoryTransactions());
//            assertEquals(expectedCategoryBudget.getBudget().getId(), actualCategoryBudget.getBudget().getId());
//            assertEquals(expectedCategoryBudget.isActive(),actualCategoryBudget.isActive());
//
//            assertEquals(expectedCategoryBudget.getBudgetedAmounts(), actualCategoryBudget.getBudgetedAmounts());
//            assertEquals(expectedCategoryBudget.getActualAmounts(), actualCategoryBudget.getActualAmounts());
//        }
//    }
//
//    @Test
//    void testUpdateTransactionCategories_whenCategoryPeriodsIsNull_thenReturnEmptyList(){
//       List<TransactionCategory> transactionCategories = new ArrayList<>();
//       transactionCategories.add(createGasBudgetCategory(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 60.00, 90.00));
//
//       List<TransactionCategory> actual = budgetCategoryBuilder.updateTransactionCategories(null, transactionCategories);
//       assertTrue(actual.isEmpty());
//
//    }

    @Test
    void testUpdateTransactionCategories_whenExistingTransactionCategoriesIsNull_thenReturnEmptyList(){
       List<CategoryBudget> categoryPeriods = new ArrayList<>();
       categoryPeriods.add(new CategoryBudget("Groceries", List.of(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)))));

       List<TransactionCategory> actual = budgetCategoryBuilder.updateTransactionCategories(categoryPeriods, null);
       assertTrue(actual.isEmpty());
    }

//    @Test
//    void testUpdateTransactionCategories_whenPeriodsDoNotOverlap_createsNewCategories() {
//        // Setup
//        DateRange newGroceryRange = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16));
//        DateRange newRentRange = new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30));
//
//
//        // Transactions
//        Transaction groceryTrans = new Transaction("acc1", new BigDecimal("45.00"), "USD", List.of("Groceries"),
//                "cat1", LocalDate.of(2024, 11, 9), "desc", "merchant", "name", false, "grocery_trans_3", null, null, null);
//        Transaction rentTrans = new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"),
//                "cat2", LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "rent_trans_2", null, null, null);
//
//        // New CategoryPeriods
//        List<BudgetPeriodAmount> groceriesBudgetedAmounts = List.of(new BudgetPeriodAmount(newGroceryRange, 200.0));
//        List<BudgetPeriodAmount> groceriesActualBudgetAmounts = List.of(new BudgetPeriodAmount(newGroceryRange, 45.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", List.of(groceryTrans), groceriesBudgetedAmounts,groceriesActualBudgetAmounts, List.of(newGroceryRange), createTestBudget(), true);
//
//        List<BudgetPeriodAmount> rentBudgetedAmounts = List.of(new BudgetPeriodAmount(newRentRange, 1200.0));
//        List<BudgetPeriodAmount> rentActualBudgetAmounts = List.of(new BudgetPeriodAmount(newRentRange, 1200.0));
//        CategoryBudget rentPeriod = CategoryBudget.buildCategoryBudget("cat2", "Rent", List.of(rentTrans), rentBudgetedAmounts, rentActualBudgetAmounts,List.of(newRentRange),createTestBudget(), true);
//
//        // Existing categories from previous period
//        List<TransactionCategory> existingCategories = List.of(
//                new TransactionCategory(1L, 1L, "cat2", "Rent", 1200.0, 1200.0, true,
//                        LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 0.0, false),
//                new TransactionCategory(2L, 1L, "cat1", "Groceries", 200.0, 150.0, true,
//                        LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 0.0, false)
//        );
//
//        List<CategoryBudget> newPeriods = List.of(groceriesPeriod, rentPeriod);
//
//        // Execute
//        List<TransactionCategory> result = budgetCategoryBuilder.updateTransactionCategories(newPeriods, existingCategories);
//
//        // Verify
//        assertEquals(4, result.size()); // 2 existing + 2 new
//
//        // Verify existing categories unchanged
//        verifyTransactionCategory(result, "cat1", "Groceries",
//                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 200.0, 150.0, false);
//        verifyTransactionCategory(result, "cat2", "Rent",
//                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 1200.0, 1200.0, false);
//
//        // Verify new categories created
//        verifyTransactionCategory(result, "cat1", "Groceries",
//                LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 16), 200.0, 45.0, false);
//        verifyTransactionCategory(result, "cat2", "Rent",
//                LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 30), 1200.0, 1200.0, false);
//    }

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


//    @Test
//    void testUpdateTransactionCategories_whenCategoryPeriodsInSamePeriodAsExistingTransactionCategories_thenReturnTransactionCategories() {
//        // Create date ranges that match existing transaction categories
//        DateRange dateRange = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//
//        // Setup CategoryPeriods with same date range as existing
//        CategoryBudget groceriesCategoryPeriod = new CategoryBudget("Groceries", List.of(dateRange), createTestBudget(), true);
//        groceriesCategoryPeriod.setCategoryBudgetAmountForDateRange(dateRange, 200.0);
//        groceriesCategoryPeriod.setCategoryBudgetActualAmountForDateRange(dateRange, 85.0);
//        groceriesCategoryPeriod.setCategoryTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("85.00"), "USD", Arrays.asList("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 4), "desc", "merchant", "name", false, "grocery_trans_3",
//                        null, null, LocalDate.of(2024, 11, 4))
//        ));
//
//        CategoryBudget rentCategoryPeriod = new CategoryBudget("Rent", List.of(dateRange),createTestBudget() , true);
//        rentCategoryPeriod.setCategoryBudgetAmountForDateRange(dateRange, 1200.0);
//        rentCategoryPeriod.setCategoryBudgetActualAmountForDateRange(dateRange, 800.0);
//        rentCategoryPeriod.setCategoryTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("800.00"), "USD", Arrays.asList("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 5), "desc", "merchant", "name", false, "rent_trans_2",
//                        null, null, LocalDate.of(2024, 11, 5))
//        ));
//
//        List<CategoryBudget> categoryPeriods = List.of(groceriesCategoryPeriod, rentCategoryPeriod);
//
//        // Setup existing TransactionCategories for same period
//        TransactionCategory existingRentCategory = new TransactionCategory();
//        existingRentCategory.setCategoryName("Rent");
//        existingRentCategory.setStartDate(LocalDate.of(2024, 11, 1));
//        existingRentCategory.setEndDate(LocalDate.of(2024, 11, 8));
//        existingRentCategory.setBudgetedAmount(1200.0);
//        existingRentCategory.setBudgetActual(1200.0);
//        existingRentCategory.setTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("800.00"), "USD", Arrays.asList("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "rent_trans_2",
//                        null, null, LocalDate.of(2024, 11, 2))
//        ));
//        existingRentCategory.setBudgetId(1L);
//        existingRentCategory.setIsActive(true);
//
//        TransactionCategory existingGroceriesCategory = new TransactionCategory();
//        existingGroceriesCategory.setCategoryName("Groceries");
//        existingGroceriesCategory.setStartDate(LocalDate.of(2024, 11, 1));
//        existingGroceriesCategory.setEndDate(LocalDate.of(2024, 11, 8));
//        existingGroceriesCategory.setBudgetedAmount(200.0);
//        existingGroceriesCategory.setBudgetActual(150.0);
//        existingGroceriesCategory.setTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("85.00"), "USD", Arrays.asList("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_3",
//                        null, null, LocalDate.of(2024, 11, 3))
//        ));
//        existingGroceriesCategory.setBudgetId(1L);
//        existingGroceriesCategory.setIsActive(true);
//
//        List<TransactionCategory> existingCategories = Arrays.asList(
//                existingRentCategory,
//                existingGroceriesCategory
//        );
//
//        // Execute
//        List<TransactionCategory> result = budgetCategoryBuilder.updateTransactionCategories(
//                categoryPeriods,
//                existingCategories
//        );
//
//        // Verify
//        assertEquals(2, result.size()); // Should only have 2 categories since they're merged
//
//        // Verify Groceries category was merged correctly
//        Optional<TransactionCategory> mergedGroceries = result.stream()
//                .filter(tc -> tc.getCategoryName().equals("Groceries"))
//                .findFirst();
//
//        assertTrue(mergedGroceries.isPresent());
//        TransactionCategory groceriesResult = mergedGroceries.get();
//        assertEquals(85.0, groceriesResult.getBudgetActual()); // 150 + 85
//        assertEquals(1, groceriesResult.getTransactions().size());
//
//        // Verify Rent category was merged correctly
//        Optional<TransactionCategory> mergedRent = result.stream()
//                .filter(tc -> tc.getCategoryName().equals("Rent"))
//                .findFirst();
//
//        assertTrue(mergedRent.isPresent());
//        TransactionCategory rentResult = mergedRent.get();
//        assertEquals(800.0, rentResult.getBudgetActual()); // 1200 + 800
//        assertEquals(1, rentResult.getTransactions().size()); // Both transaction IDs
//    }


//    @Test
//    void testBuildTransactionCategoryList_whenCategoryPeriodsIsNull_thenReturnEmptyList(){
//       Budget budget = new Budget(1L, new BigDecimal("320"), new BigDecimal("120"), 1L, "Test Budget", "Test Budget", LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30), LocalDateTime.now());
//       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(null, budget);
//       assertEquals(0, actual.size());
//       assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenCategoryPeriodsValid_thenReturnTransactionCategoryList() {
//        DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//        DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15));
//        Budget budget = new Budget();
//        budget.setId(1L);
//        budget.setStartDate(LocalDate.of(2024, 11, 1));
//        budget.setEndDate(LocalDate.of(2024, 11, 15));
//        List<Transaction> transactions = List.of(
//                new Transaction("acc1", new BigDecimal("150.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_1",
//                        null, null, LocalDate.of(2024, 11, 3)),
//                new Transaction("acc1", new BigDecimal("200.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 10), "desc", "merchant", "name", false, "grocery_trans_2",
//                        null, null, LocalDate.of(2024, 11, 10))
//        );
//
//        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange1, dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 200.0),
//                new BudgetPeriodAmount(dateRange2, 250.0));
//
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 150.0),
//                new BudgetPeriodAmount(dateRange2, 200.0));
//
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", transactions,
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange1, dateRange2), budget, true);
//
//        List<CategoryBudget> categoryPeriods = List.of(groceriesPeriod);
//
//        List<TransactionCategory> result = budgetCategoryBuilder.buildTransactionCategoryList(
//                categoryPeriods, budget);
//
//        assertEquals(2, result.size());
//
//        verifyTransactionCategory(result, "cat1", "Groceries",
//                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 200.0, 150.0, false);
//        verifyTransactionCategory(result, "cat1", "Groceries",
//                LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15), 250.0, 200.0, false);
//    }
//
//
//    @Test
//    void testGetCategorySpendingByCategoryDesignator_whenParametersValid_thenReturnCategorySpending(){
//       List<CategoryTransactions> categoryDesignators = createTestCategoryDesignators();
//       List<DateRange> budgetDateRanges = List.of(
//               new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//               new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)),
//               new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24)),
//               new DateRange(LocalDate.of(2024, 11, 25), LocalDate.of(2024, 11, 30))
//       );
//
//       List<CategoryPeriodSpending> expectedCategorySpendings = List.of(
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("79.56"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("32.00"), new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("50.00"), new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("50.00"), new DateRange(LocalDate.of(2024, 11, 25), LocalDate.of(2024, 11, 30))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("1200.00"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("707.00"), new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)))
//       );
//
//       List<CategoryPeriodSpending> actual = budgetCategoryBuilder.getCategorySpendingByCategoryDesignator(categoryDesignators, budgetDateRanges);
//       assertEquals(expectedCategorySpendings.size(), actual.size());
//        for (int i = 0; i < actual.size(); i++) {
//            CategoryPeriodSpending expected = expectedCategorySpendings.get(i);
//            CategoryPeriodSpending actualSpending = actual.get(i);
//
//            // Log the details of the current test iteration
//            System.out.printf("Testing CategorySpending: [CategoryId: %s, CategoryName: %s, Spending: %s, Range: %s - %s]%n",
//                    expected.getCategoryId(),
//                    expected.getCategoryName(),
//                    expected.getActualSpending(),
//                    expected.getDateRange().getStartDate(),
//                    expected.getDateRange().getEndDate());
//
//            // Perform the assertions
//            assertEquals(expected.getCategoryId(), actualSpending.getCategoryId(), "Mismatch in CategoryId.");
//            assertEquals(expected.getCategoryName(), actualSpending.getCategoryName(), "Mismatch in CategoryName.");
//            assertEquals(expected.getActualSpending(), actualSpending.getActualSpending(), "Mismatch in ActualSpending.");
//            assertEquals(expected.getDateRange().getStartDate(), actualSpending.getDateRange().getStartDate(), "Mismatch in StartDate.");
//            assertEquals(expected.getDateRange().getEndDate(), actualSpending.getDateRange().getEndDate(), "Mismatch in EndDate.");
//        }
//    }
//
//    @Test
//    void testInitializeTransactionCategories_whenBudget_BudgetPeriodAndCategoryDesignatorsAreNull_thenReturnEmptyList(){
//        List<TransactionCategory> actual = budgetCategoryBuilder.initializeTransactionCategories(null, null, null);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//
//    @Test
//    void testInitializeTransactionCategories_whenBudgetIsNull_thenReturnEmptyList(){
//       BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30));
//       List<CategoryTransactions> categoryDesignators = List.of(new CategoryTransactions("cat1", "desc"));
//       List<TransactionCategory> result = budgetCategoryBuilder.initializeTransactionCategories(null, budgetPeriod, categoryDesignators);
//       assertEquals(0, result.size());
//       assertTrue(result.isEmpty());
//    }

//    @Test
//    void testInitializeTransactionCategories_whenParametersValid_thenReturnTransactionCategoryList(){
//        Budget budget = createTestBudget();
//        BudgetPeriod budgetPeriod = createTestBudgetPeriod();
//        List<CategoryTransactions> categoryDesignators = createTestCategoryDesignators();
//
//        // Create CategorySpending objects
//        Map<String, List<String>> categorizedTransactions = new HashMap<>();
//        categorizedTransactions.put("Groceries", Arrays.asList("trans_11_02", "trans_11_08", "trans_11_16", "trans_11_23"));
//        categorizedTransactions.put("Rent", Arrays.asList("trans_11_01", "trans_11_16"));
//
//        // Week 1: Nov 1-7
//        TransactionCategory groceryWeek1 = new TransactionCategory();
//        groceryWeek1.setId(1L);
//        groceryWeek1.setBudgetId(budget.getId());
//        groceryWeek1.setCategoryId("cat1");
//        groceryWeek1.setCategoryName("Groceries");
//        groceryWeek1.setBudgetedAmount(96.00);  // Weekly budget allocation
//        groceryWeek1.setBudgetActual(34.32);    // Nov 2 transaction
//        groceryWeek1.setIsActive(true);
//        groceryWeek1.setStartDate(LocalDate.of(2024, 11, 1));
//        groceryWeek1.setEndDate(LocalDate.of(2024, 11, 7));
//        groceryWeek1.setOverSpendingAmount(0.0);
//        groceryWeek1.setOverSpent(false);
//        groceryWeek1.setTransactions(List.of(
//                categoryDesignators.get(0).getTransactions().get(0)  // Nov 2 transaction
//        ));
//
//        // Week 2: Nov 8-14
//        TransactionCategory groceryWeek2 = new TransactionCategory();
//        groceryWeek2.setId(2L);
//        groceryWeek2.setBudgetId(budget.getId());
//        groceryWeek2.setCategoryId("cat1");
//        groceryWeek2.setCategoryName("Groceries");
//        groceryWeek2.setBudgetedAmount(101.0);
//        groceryWeek2.setBudgetActual(45.24);    // Nov 8 transaction
//        groceryWeek2.setIsActive(true);
//        groceryWeek2.setStartDate(LocalDate.of(2024, 11, 8));
//        groceryWeek2.setEndDate(LocalDate.of(2024, 11, 14));
//        groceryWeek2.setOverSpendingAmount(0.0);
//        groceryWeek2.setOverSpent(false);
//        groceryWeek2.setTransactions(List.of(categoryDesignators.get(0).getTransactions().get(1))); // Nov 8 transaction
//
//        // Week 3: Nov 15-21
//        TransactionCategory groceryWeek3 = new TransactionCategory();
//        groceryWeek3.setId(3L);
//        groceryWeek3.setBudgetId(budget.getId());
//        groceryWeek3.setCategoryId("cat1");
//        groceryWeek3.setCategoryName("Groceries");
//        groceryWeek3.setBudgetedAmount(96.00);
//        groceryWeek3.setBudgetActual(32.0);    // Nov 16 transaction
//        groceryWeek3.setIsActive(true);
//        groceryWeek3.setStartDate(LocalDate.of(2024, 11, 15));
//        groceryWeek3.setEndDate(LocalDate.of(2024, 11, 21));
//        groceryWeek3.setOverSpendingAmount(0.0);
//        groceryWeek3.setOverSpent(false);
//        groceryWeek3.setTransactions(List.of(categoryDesignators.get(0).getTransactions().get(2))); // Nov 16 transaction
//
//        TransactionCategory groceryWeek4 = new TransactionCategory();
//        groceryWeek4.setId(4L);
//        groceryWeek4.setBudgetId(budget.getId());
//        groceryWeek4.setCategoryId("cat1");
//        groceryWeek4.setCategoryName("Groceries");
//        groceryWeek4.setBudgetedAmount(105.0);
//        groceryWeek4.setBudgetActual(50.0);    // Nov 16 transaction
//        groceryWeek4.setIsActive(true);
//        groceryWeek4.setStartDate(LocalDate.of(2024, 11, 22));
//        groceryWeek4.setEndDate(LocalDate.of(2024, 11, 28));
//        groceryWeek4.setOverSpendingAmount(0.0);
//        groceryWeek4.setOverSpent(false);
//        groceryWeek4.setTransactions(List.of(categoryDesignators.get(0).getTransactions().get(3))); // Nov 16 transaction
//
//        // Week 1: Nov 1-7 (Rent)
//        TransactionCategory rentWeek1 = new TransactionCategory();
//        rentWeek1.setId(5L);
//        rentWeek1.setBudgetId(budget.getId());
//        rentWeek1.setCategoryId("cat2");
//        rentWeek1.setCategoryName("Rent");
//        rentWeek1.setBudgetedAmount(1200.0);    // Weekly budget allocation
//        rentWeek1.setBudgetActual(1200.00);     // Nov 1 transaction
//        rentWeek1.setIsActive(true);
//        rentWeek1.setStartDate(LocalDate.of(2024, 11, 1));
//        rentWeek1.setEndDate(LocalDate.of(2024, 11, 7));
//        rentWeek1.setOverSpendingAmount(0.0);
//        rentWeek1.setOverSpent(false);
//        rentWeek1.setTransactions(List.of(categoryDesignators.get(1).getTransactions().get(0))); // Nov 1 transaction
//
//        // Week 3: Nov 15-21 (Rent)
//        TransactionCategory rentWeek3 = new TransactionCategory();
//        rentWeek3.setId(6L);
//        rentWeek3.setBudgetId(budget.getId());
//        rentWeek3.setCategoryId("cat2");
//        rentWeek3.setCategoryName("Rent");
//        rentWeek3.setBudgetedAmount(707.0);
//        rentWeek3.setBudgetActual(707.00);      // Nov 16 transaction
//        rentWeek3.setIsActive(true);
//        rentWeek3.setStartDate(LocalDate.of(2024, 11, 15));
//        rentWeek3.setEndDate(LocalDate.of(2024, 11, 21));
//        rentWeek3.setOverSpendingAmount(0.0);
//        rentWeek3.setOverSpent(false);
//        rentWeek3.setTransactions(List.of(categoryDesignators.get(1).getTransactions().get(1))); // Nov 16 transaction
//
//        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
//        expectedTransactionCategories.addAll(Arrays.asList(
//                groceryWeek1, groceryWeek2, groceryWeek3, groceryWeek4,
//                rentWeek1, rentWeek3
//        ));
//
//        // Mock budgetCalculator responses for Groceries
//        when(budgetCalculator.calculateBudgetedAmountForCategoryDateRange(
//                any(CategoryPeriodSpending.class),  // Changed from argThat
//                any(BigDecimal.class),
//                anyList(),
//                eq(budget)
//        )).thenAnswer(invocation -> {
//            CategoryPeriodSpending cs = invocation.getArgument(0);
//            if (cs != null && cs.getCategoryName().equals("Groceries")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 96.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 101.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 96.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 105.0)
//                );
//            }
//            if (cs != null && cs.getCategoryName().equals("Rent")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 1200.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 0.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 707.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 0.0)   // Add this
//                );
//            }
//            return Collections.emptyList();
//        });
//
//        // Mock budgetCalculator responses for actual amounts
//        when(budgetCalculator.calculateActualAmountForCategoryDateRange(
//                any(CategoryPeriodSpending.class),  // Changed from argThat
//                any(CategoryTransactions.class),
//                anyList(),
//                eq(budget)
//        )).thenAnswer(invocation -> {
//            CategoryPeriodSpending cs = invocation.getArgument(0);
//            if (cs != null && cs.getCategoryName().equals("Groceries")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 34.32),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 45.24),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 32.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 32.00)
//                );
//            }
//            if (cs != null && cs.getCategoryName().equals("Rent")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 1200.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 0.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 707.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 0.0)
//                );
//            }
//            return Collections.emptyList();
//        });
//
//
//        // Mock budgetCalculator responses
//        when(budgetCalculator.getTotalSpendingOnAllCategories(anyList()))
//                .thenReturn(new BigDecimal("2068.56")); // Total of all transactions
//
//
//        List<TransactionCategory> actualTransactionCategories = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, categoryDesignators);
//
//        assertNotNull(actualTransactionCategories);
//        assertEquals(expectedTransactionCategories.size(), actualTransactionCategories.size(), "Should have 5 transaction categories (3 grocery + 2 rent)");
//
//        List<TransactionCategory> actualGroceryCategories = actualTransactionCategories.stream()
//                .filter(tc -> tc.getCategoryName().equals("Groceries"))
//                .sorted(Comparator.comparing(TransactionCategory::getStartDate))
//                .collect(Collectors.toList());
//
//        assertEquals(4, actualGroceryCategories.size(), "Should have 3 grocery categories");
//
//        verifyTransactionCategory(groceryWeek1, actualGroceryCategories.get(0));
//        verifyTransactionCategory(groceryWeek2, actualGroceryCategories.get(1));
//        verifyTransactionCategory(groceryWeek3, actualGroceryCategories.get(2));
//
//        // Verify rent categories
//        List<TransactionCategory> actualRentCategories = actualTransactionCategories.stream()
//                .filter(tc -> tc.getCategoryName().equals("Rent"))
//                .sorted(Comparator.comparing(TransactionCategory::getStartDate))
//                .collect(Collectors.toList());
//
//        assertEquals(2, actualRentCategories.size(), "Should have 2 rent categories");
//
//        // Verify each rent week
//        verifyTransactionCategory(rentWeek1, actualRentCategories.get(0));
//        verifyTransactionCategory(rentWeek3, actualRentCategories.get(1));
//    }
//
//    @Test
//    void testInitializeTransactionCategories_whenEmptyTransactionsInCategoryDesignator_thenReturnEmptyList(){
//        Budget budget = createTestBudget();
//        BudgetPeriod budgetPeriod = createTestBudgetPeriod();
//        List<CategoryTransactions> categoryDesignators = createTestCategoryDesignatorNoTransactions();
//        List<TransactionCategory> actual = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, categoryDesignators);
//        assertTrue(actual.isEmpty(), "Should return an empty list");
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenCategoryPeriodTransactionsAreEmpty_thenReturnEmptyList(){
//       Budget budget = createTestBudget();
//       List<CategoryBudget> categoryPeriods = new ArrayList<>();
//       DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//       DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16));
//       CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange1, dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 200.0),
//                new BudgetPeriodAmount(dateRange2, 250.0));
//
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 150.0),
//                new BudgetPeriodAmount(dateRange2, 200.0));
//
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", new ArrayList<>(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange1, dateRange2), budget, true);
//       categoryPeriods.add(groceriesPeriod);
//
//
//       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//       assertTrue(actual.isEmpty(), "Should return an empty list");
//       assertEquals(0, actual.size(), "Should return empty list");
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenCategoryBudgetIsNull_thenSkipAndReturnTransactionCategoryList(){
//       Budget budget = createTestBudget();
//       List<CategoryBudget> categoryPeriods = new ArrayList<>();
//       DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//       DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16));
//       CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//       groceryCriteria.setCategoryDateRanges(List.of(dateRange2));
//       List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//       List<BudgetPeriodAmount> actualBudgetAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange2), budget, true);
//        categoryPeriods.add(null);
//        categoryPeriods.add(groceriesPeriod);
//
//        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
//        TransactionCategory groceryTransactionCategory = new TransactionCategory(1L, 1L, "cat1", "Groceries", 250.0, 32.0, true, LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16), 0.0, false);
//        groceryTransactionCategory.setTransactions(List.of(new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                null, null, LocalDate.of(2024, 11, 16))));
//        expectedTransactionCategories.add(groceryTransactionCategory);
//
//        List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//        assertNotNull(actual, "Should not be null");
//        assertEquals(expectedTransactionCategories.size(), actual.size());
//        for(int i = 0; i < actual.size(); i++){
//            assertEquals(expectedTransactionCategories.get(i).getCategoryId(), actual.get(i).getCategoryId());
//            assertEquals(expectedTransactionCategories.get(i).getCategoryName(), actual.get(i).getCategoryName());
//            assertEquals(expectedTransactionCategories.get(i).getTransactions().size(), actual.get(i).getTransactions().size());
//            assertEquals(expectedTransactionCategories.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
//            assertEquals(expectedTransactionCategories.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
//            assertEquals(expectedTransactionCategories.get(i).getOverSpendingAmount(), actual.get(i).getOverSpendingAmount());
//            assertEquals(expectedTransactionCategories.get(i).getStartDate(), actual.get(i).getStartDate());
//            assertEquals(expectedTransactionCategories.get(i).getEndDate(), actual.get(i).getEndDate());
//        }
//    }
//
//
//    @Test
//    void testBuildTransactionCategoryList_whenDateRangesListIsEmpty_thenReturnEmptyList(){
//       Budget budget = createTestBudget();
//       List<CategoryBudget> categoryPeriods = new ArrayList<>();
//       DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//       List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//       List<BudgetPeriodAmount> budgetActualAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, budgetActualAmounts, List.of(), budget, true);
//       categoryPeriods.add(groceriesPeriod);
//
//       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//       assertTrue(actual.isEmpty(), "Should return an empty list");
//       assertEquals(0, actual.size(), "Should return empty list");
//    }
//
//
//    @Test
//    void testBuildTransactionCategoryList_whenDateRangeStartDateIsNull_thenThrowException() {
//        Budget budget = createTestBudget();
//        List<CategoryBudget> categoryPeriods = new ArrayList<>();
//        DateRange dateRange2 = new DateRange(null, LocalDate.of(2024, 11, 8));
//        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange2), budget, true);
//        categoryPeriods.add(groceriesPeriod);
//        assertThrows(DateRangeException.class, () -> {
//            budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//        });
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenDateRangeEndDateIsNull_thenThrowException(){
//        Budget budget = createTestBudget();
//        List<CategoryBudget> categoryPeriods = new ArrayList<>();
//        DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 1), null);
//        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange2), budget, true);
//        categoryPeriods.add(groceriesPeriod);
//        assertThrows(DateRangeException.class, () -> {
//            budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//        });
//    }
//
//    private void verifyTransactionCategory(TransactionCategory expected, TransactionCategory actual) {
//        String categoryInfo = String.format("Category: %s, Period: %s to %s",
//                expected.getCategoryName(),
//                expected.getStartDate(),
//                expected.getEndDate());
//
//        assertEquals(expected.getCategoryName(), actual.getCategoryName(),
//                "Category name mismatch for " + categoryInfo);
//
//        assertEquals(expected.getStartDate(), actual.getStartDate(),
//                "Start date mismatch for " + categoryInfo);
//
//        assertEquals(expected.getEndDate(), actual.getEndDate(),
//                "End date mismatch for " + categoryInfo);
//
//        assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
//                "Budgeted amount mismatch for " + categoryInfo);
//
//        assertEquals(expected.getBudgetActual(), actual.getBudgetActual(),
//                "Budget actual mismatch for " + categoryInfo);
//
//        assertEquals(expected.getOverSpendingAmount(), actual.getOverSpendingAmount(),
//                "Overspending amount mismatch for " + categoryInfo);
//
//        assertEquals(expected.isOverSpent(), actual.isOverSpent(),
//                "Overspent flag mismatch for " + categoryInfo);
//
//        assertEquals(expected.getTransactions().size(), actual.getTransactions().size(),
//                "Transaction count mismatch for " + categoryInfo);
//    }
//
//    @Test
//    void testBuildCategoryPeriodDateRanges_whenValidBudgetDateRangesAndCategorySpending_thenReturnDateRanges(){
//       List<DateRange> budgetDateRanges = List.of(
//               new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//               new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)),
//               new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24)),
//               new DateRange(LocalDate.of(2024, 11, 25), LocalDate.of(2024, 11, 30))
//       );
//       List<CategoryPeriodSpending> categorySpendings = List.of(
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("120"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("95"), new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("101"), new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("1200"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("707"), new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 24)))
//       );
//
//       List<DateRange> categoryPeriodDateRanges = new ArrayList<>();
//       categoryPeriodDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)));
//       categoryPeriodDateRanges.add(new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)));
//       categoryPeriodDateRanges.add(new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24)));
//
//       List<DateRange> actual = budgetCategoryBuilder.buildCategoryPeriodDateRanges(budgetDateRanges, categorySpendings);
//       assertNotNull(actual);
//       assertEquals(categoryPeriodDateRanges.size(), actual.size());
//       for(int i = 0; i < actual.size(); i++) {
//           DateRange actualDateRange = actual.get(i);
//           DateRange expectedDateRange = categoryPeriodDateRanges.get(i);
//
//           assertEquals(expectedDateRange.getStartDate(), actualDateRange.getStartDate());
//           assertEquals(expectedDateRange.getEndDate(), actualDateRange.getEndDate());
//       }
//
//    }
//
//    private List<CategoryTransactions> createTestCategoryDesignatorNoTransactions(){
//       List<CategoryTransactions> categoryDesignators = new ArrayList<>();
//       CategoryTransactions testCategoryDesignator = new CategoryTransactions("cat1", "Groceries");
//       List<Transaction> transactions = new ArrayList<>();
//       testCategoryDesignator.setTransactions(transactions);
//       categoryDesignators.add(testCategoryDesignator);
//       return categoryDesignators;
//    }
//
//    private List<Transaction> createGroceryTransactions(){
//        return List.of(
//                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "trans_11_02",
//                        null, null, LocalDate.of(2024, 11, 2)),
//                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 8), "desc", "merchant", "name", false, "trans_11_08",
//                        null, null, LocalDate.of(2024, 11, 8)),
//                new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 23), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 23))
//        );
//    }
//
//    private List<CategoryTransactions> createTestCategoryDesignators(){
//        List<CategoryTransactions> categoryDesignators = new ArrayList<>();
//        CategoryTransactions groceryDesignator = new CategoryTransactions("cat1", "Groceries");
//        List<Transaction> groceryTransactions = List.of(
//                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "trans_11_02",
//                        null, null, LocalDate.of(2024, 11, 2)),
//                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 8), "desc", "merchant", "name", false, "trans_11_08",
//                        null, null, LocalDate.of(2024, 11, 8)),
//                new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 23), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 23)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 25), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 25))
//
//        );
//
//        groceryDesignator.setTransactions(groceryTransactions);
//        categoryDesignators.add(groceryDesignator);
//
//        CategoryTransactions rentDesignator = new CategoryTransactions("cat2", "Rent");
//        List<Transaction> rentTransactions = List.of(
//                new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 1), "desc", "merchant", "name", false, "trans_11_01",
//                        null, null, LocalDate.of(2024, 11, 1)),
//                new Transaction("acc1", new BigDecimal("707.00"), "USD", List.of("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16))
//        );
//        rentDesignator.setTransactions(rentTransactions);
//        categoryDesignators.add(rentDesignator);
//        return categoryDesignators;
//    }
//
//    private BudgetPeriod createTestBudgetPeriod()
//    {
//       return new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30));
//    }
//
//    private Budget createTestBudget(){
//       Budget budget = new Budget();
//       budget.setBudgetAmount(new BigDecimal("3260"));
//       budget.setActual(new BigDecimal("1609"));
//       budget.setId(1L);
//       budget.setStartDate(LocalDate.of(2024, 11, 1));
//       budget.setEndDate(LocalDate.of(2024, 11, 30));
//       return budget;
//    }
//
//    private void verifyDateRanges(List<DateRange> actual, List<DateRange> expected) {
//        assertEquals(expected.size(), actual.size(), "Date range size mismatch");
//        for (int i = 0; i < expected.size(); i++) {
//            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate(),
//                    "Start date mismatch at index " + i);
//            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate(),
//                    "End date mismatch at index " + i);
//        }
//    }
//
//    private RecurringTransaction createWalmartRecurringTransaction() {
//        return new RecurringTransaction(
//                "account-12345",                  // accountId
//                new BigDecimal("50.75"),          // amount
//                "USD",                            // isoCurrencyCode
//                List.of("Groceries"),             // categories
//                "cat-001",                        // categoryId
//                LocalDate.of(2024, 11, 1),        // date
//                "Walmart Purchase",               // description
//                "Walmart",                        // merchantName
//                "Walmart Grocery Purchase",       // name
//                false,                            // pending
//                "txn-12345",                      // transactionId
//                LocalDate.of(2024, 11, 1),        // authorizedDate
//                "https://example.com/logo.png",   // logoUrl
//                LocalDate.of(2024, 10, 2),        // posted
//                "stream-67890",                   // streamId
//                LocalDate.of(2024, 10, 1),        // firstDate
//                LocalDate.of(2025, 10, 1),        // lastDate
//                "WEEKLY",                         // frequency
//                new BigDecimal("60.00"),          // averageAmount
//                new BigDecimal("50.75"),          // lastAmount
//                true,                             // active
//                "Subscription"                    // type
//        );
//    }
//
//    private RecurringTransaction createWincoRecurringTransaction() {
//        return new RecurringTransaction(
//                "account-12345",                  // accountId
//                new BigDecimal("50.75"),          // amount
//                "USD",                            // isoCurrencyCode
//                List.of("Groceries"),             // categories
//                "cat-001",                        // categoryId
//                LocalDate.of(2024, 11, 5),        // date
//                "WINCO Purchase",                 // description
//                "WINCO",                          // merchantName
//                "WINCO Grocery Purchase",         // name
//                false,                            // pending
//                "txn-12345",                      // transactionId
//                LocalDate.of(2024, 11, 6),        // authorizedDate
//                "https://example.com/logo.png",   // logoUrl
//                LocalDate.of(2024, 10, 5),        // posted
//                "stream-54321",                   // streamId
//                LocalDate.of(2024, 9, 1),         // firstDate
//                LocalDate.of(2025, 9, 1),         // lastDate
//                "BIWEEKLY",                       // frequency
//                new BigDecimal("70.00"),          // averageAmount
//                new BigDecimal("50.75"),          // lastAmount
//                true,                             // active
//                "Subscription"                    // type
//        );
//    }
//
//    private TransactionLink createTransactionLink(Transaction transaction, String category){
//        return new TransactionLink(category, transaction.getTransactionId());
//    }
//
//    private TransactionCategory createUserBudgetCategory(String categoryId, String categoryName, Double budgetedAmount, Double actualAmount, LocalDate startDate, LocalDate endDate, Long userId) {
//        TransactionCategory category = new TransactionCategory();
//        category.setCategoryId(categoryId);
//        category.setCategoryName(categoryName);
//        category.setBudgetedAmount(budgetedAmount);
//        category.setBudgetActual(actualAmount);
//        category.setStartDate(startDate);
//        category.setEndDate(endDate);
//        category.setIsActive(true); // Assuming all categories are active for this test
//        return category;
//    }
//
//    private TransactionCategory createGasBudgetCategory(LocalDate startDate, LocalDate endDate, Double actual, Double budgetAmount)
//    {
//        TransactionCategory gasBudgetCategory = new TransactionCategory();
//        gasBudgetCategory.setCategoryId("cat-003");
//        gasBudgetCategory.setBudgetedAmount(budgetAmount);
//        gasBudgetCategory.setCategoryName("Gas");
//        gasBudgetCategory.setBudgetActual(actual);
//        gasBudgetCategory.setIsActive(true);
//        gasBudgetCategory.setStartDate(startDate);
//        gasBudgetCategory.setEndDate(endDate);
//        return gasBudgetCategory;
//    }
//
//    private TransactionCategory createGroceriesCategory(LocalDate startDate, LocalDate endDate)
//    {
//        TransactionCategory groceriesCategory = new TransactionCategory();
//        groceriesCategory.setCategoryId("cat-001");
//        groceriesCategory.setBudgetedAmount(450.00);
//        groceriesCategory.setBudgetActual(120.00);
//        groceriesCategory.setCategoryName("Groceries");
//        groceriesCategory.setIsActive(true);
//        groceriesCategory.setStartDate(startDate);
//        groceriesCategory.setEndDate(endDate);
//        return groceriesCategory;
//    }
//
//    private TransactionCategory createPaymentCategory(LocalDate startDate, LocalDate endDate)
//    {
//        TransactionCategory paymentCategory = new TransactionCategory();
//        paymentCategory.setCategoryId("cat-222");
//        paymentCategory.setCategoryName("Payments");
//        paymentCategory.setBudgetedAmount(149.00);
//        paymentCategory.setBudgetActual(120.00);
//        paymentCategory.setIsActive(true);
//        paymentCategory.setStartDate(startDate);
//        paymentCategory.setEndDate(endDate);
//        return paymentCategory;
//    }
//
//    private Transaction createAffirmTransaction(){
//        return new Transaction(
//                "account-12345",               // accountId
//                new BigDecimal("50.75"),       // amount
//                "USD",                         // isoCurrencyCode
//                List.of("Payments"),  // categories
//                "cat-005",                     // categoryId
//                LocalDate.of(2024, 11, 5),     // date
//                "Affirm Purchase",            // description
//                "Affirm",                     // merchantName
//                "Affirm Payment",    // name
//                false,                         // pending
//                "txn-12345",                   // transactionId
//                LocalDate.of(2024, 11, 4),     // authorizedDate
//                "https://example.com/logo.png", // logoUrl
//                LocalDate.of(2024, 11, 5)      // posted
//        );
//    }
//
//    private Transaction createTransactionExample(LocalDate posted, List<String> categories, String categoryId, String description, String merchant, String name, BigDecimal amount){
//        return new Transaction(
//                "account-12345",
//                amount,
//                "USD",
//                categories,
//                categoryId,
//                posted,
//                description,
//                merchant,
//                name,
//                false,
//                "txn-12345",
//                posted,
//                "https://example.com/logo.png",
//                posted
//        );
//    }

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