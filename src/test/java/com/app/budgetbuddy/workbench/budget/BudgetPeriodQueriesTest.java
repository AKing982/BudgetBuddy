package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetPeriodCategory;
import com.app.budgetbuddy.domain.BudgetStatus;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class BudgetPeriodQueriesTest {

    @Mock
    private EntityManager entityManager;


    @InjectMocks
    private BudgetPeriodQueries budgetPeriodQueries;

    private Budget testBudget;

//    @BeforeEach
//    void setUp() {
//        testBudget = new Budget();
//        testBudget.setId(1L);
//        testBudget.setActual(new BigDecimal("1630"));
//        testBudget.setBudgetAmount(new BigDecimal("3260"));
//        testBudget.setBudgetDescription("Savings Budget");
//        testBudget.setBudgetName("Savings Budget");
////        testBudget.setStartDate(LocalDate.of(2024, 10, 1));
////        testBudget.setEndDate(LocalDate.of(2024, 10, 31));
//        budgetPeriodQueries = new BudgetPeriodQueries(entityManager);
//    }
//
//    @Test
//    void testGetDailyBudgetPeriodQuery_whenDateIsNull_thenThrowIllegalDateException(){
//
//        assertThrows(IllegalDateException.class, () -> budgetPeriodQueries.getDailyBudgetPeriodQuery(null, testBudget));
//    }
//
//    @Test
//    void testGetDailyBudgetPeriodQuery_whenBudgetIsNull_thenThrowIllegalArgumentException(){
//        assertThrows(IllegalArgumentException.class, () -> {
//            budgetPeriodQueries.getDailyBudgetPeriodQuery(LocalDate.of(2024, 10, 1), null);
//        });
//    }
//
//    @Test
//    void testGetDailyBudgetPeriodQuery_whenSingleDateAndBudgetValid_thenReturnBudgetPeriodParams(){
//        final LocalDate dailyDate = LocalDate.of(2024, 10, 1);
//        final BigDecimal budgeted = new BigDecimal("3260.0");
//        final BigDecimal actualSpent = new BigDecimal("1630.0");
//        final DateRange dateRange = new DateRange(dailyDate, dailyDate);
//        final BudgetStatus budgetStatus = BudgetStatus.GOOD;
//        // Mock query result
//        Object[] queryResult = new Object[]{
//                "18000000",  // category.id
//                "Rent",      // category.name
//                3260.00,     // budgetedAmount
//                1630.00      // actual
//        };
//        List<Object[]> mockResults = Collections.singletonList(queryResult);
//
//        // Mock EntityManager and TypedQuery behavior
//        TypedQuery<Object[]> typedQuery = mock(TypedQuery.class);
//        when(entityManager.createQuery(anyString(), eq(Object[].class))).thenReturn(typedQuery);
//        when(typedQuery.setParameter("date", dailyDate)).thenReturn(typedQuery);
//        when(typedQuery.setParameter("budgetId", testBudget.getId())).thenReturn(typedQuery);
//        when(typedQuery.getResultList()).thenReturn(mockResults);
//
//        // Act
//        List<BudgetPeriodCategory> actualBudgetPeriodQuery = budgetPeriodQueries.getDailyBudgetPeriodQuery(dailyDate, testBudget);
//
//        // Assert
//        assertNotNull(actualBudgetPeriodQuery);
//        assertEquals(1, actualBudgetPeriodQuery.size());
//
//        BudgetPeriodCategory actual = actualBudgetPeriodQuery.get(0);
//        assertEquals("Rent", actual.getCategory());
//        assertEquals(budgeted, actual.getBudgeted());
//        assertEquals(new BigDecimal("1630.0"), actual.getActual());
//        assertEquals(dateRange, actual.getDateRange());
//        assertEquals(budgetStatus, actual.getBudgetStatus());
//        assertFalse(actual.isOverBudget());
//        assertEquals(0.5, actual.getSpendingPercentage());
//        assertEquals(new BigDecimal("1630.0"), actual.getRemaining());
//
//        // Verify interactions
//        verify(entityManager).createQuery(anyString(), eq(Object[].class));
//        verify(typedQuery).setParameter("date", dailyDate);
//        verify(typedQuery).setParameter("budgetId", testBudget.getId());
//        verify(typedQuery).getResultList();
//    }
//
//    @Test
//    void testGetWeeklyBudgetPeriodCategories_whenBudgetWeekDateRangesIsNull_thenReturnEmptyList(){
//
//        List<BudgetPeriodCategory> actual = budgetPeriodQueries.getWeeklyBudgetPeriodCategories(null, testBudget);
//        assertNotNull(actual);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetWeeklyBudgetPeriodCategories_whenBudgetIsNull_thenReturnEmptyList(){
//        List<DateRange> dateRanges = new ArrayList<>();
//        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31)));
//
//        List<BudgetPeriodCategory> actual = budgetPeriodQueries.getWeeklyBudgetPeriodCategories(dateRanges, null);
//        assertNotNull(actual);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetWeeklyBudgetPeriodCategories_whenBudgetWeeksListSizeGreaterThanFive_thenThrowException(){
//        List<DateRange> dateRanges = new ArrayList<>();
//        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 7)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 8), LocalDate.of(2024, 10, 14)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 15), LocalDate.of(2024, 10, 21)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 22), LocalDate.of(2024, 10, 28)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 29), LocalDate.of(2024, 11, 4)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 11, 5), LocalDate.of(2024, 11, 11))); // Sixth entry
//
//        // Act & Assert: Verify the exception is thrown
//        DateRangeException thrown = assertThrows(DateRangeException.class, () -> {
//            budgetPeriodQueries.getWeeklyBudgetPeriodCategories(dateRanges, testBudget);
//        });
//
//        // Verify exception message (optional but recommended for clarity)
//        String expectedMessage = "Weekly budget period cannot exceed 5 weeks.";
//        assertEquals(expectedMessage, thrown.getMessage());
//    }
//
//    @Test
//    void testGetWeeklyBudgetPeriodCategories_whenBudgetWeeksListFiveWeeks_thenReturnBudgetPeriodCategories(){
//        List<DateRange> dateRanges = new ArrayList<>();
//        dateRanges.add(new DateRange(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 8)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 12, 8), LocalDate.of(2024, 12, 15)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 12, 15), LocalDate.of(2024, 12, 22)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 12, 22), LocalDate.of(2024, 12, 29)));
//        dateRanges.add(new DateRange(LocalDate.of(2024, 12, 29), LocalDate.of(2024, 12, 31)));
//
//
//        List<BudgetPeriodCategory> expectedBudgetPeriodCategories = new ArrayList<>();
//        // Week 1
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Groceries",
//                        new BigDecimal("430.0"),
//                        new BigDecimal("120.0"),
//                        dateRanges.get(0),
//                        BudgetStatus.GOOD)
//        );
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Utilities",
//                        new BigDecimal("250.0"),
//                        new BigDecimal("200.0"),
//                        dateRanges.get(0),
//                        BudgetStatus.GOOD)
//        );
//
//        // Week 2
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Groceries",
//                        new BigDecimal("430.0"),
//                        new BigDecimal("150.0"),
//                        dateRanges.get(1),
//                        BudgetStatus.GOOD)
//        );
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Entertainment",
//                        new BigDecimal("200.0"),
//                        new BigDecimal("180.0"),
//                        dateRanges.get(1),
//                        BudgetStatus.WARNING)
//        );
//
//        // Week 3
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Groceries",
//                        new BigDecimal("430.0"),
//                        new BigDecimal("200.0"),
//                        dateRanges.get(2),
//                        BudgetStatus.GOOD)
//        );
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Transportation",
//                        new BigDecimal("300.0"),
//                        new BigDecimal("250.0"),
//                        dateRanges.get(2),
//                        BudgetStatus.GOOD)
//        );
//
//        // Week 4
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Groceries",
//                        new BigDecimal("430.0"),
//                        new BigDecimal("400.0"),
//                        dateRanges.get(3),
//                        BudgetStatus.WARNING)
//        );
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Shopping",
//                        new BigDecimal("500.0"),
//                        new BigDecimal("450.0"),
//                        dateRanges.get(3),
//                        BudgetStatus.WARNING)
//        );
//
//        // Week 5 (partial)
//        expectedBudgetPeriodCategories.add(
//                new BudgetPeriodCategory("Groceries",
//                        new BigDecimal("430.0"),
//                        new BigDecimal("100.0"),
//                        dateRanges.get(4),
//                        BudgetStatus.GOOD)
//        );
//
//        // Mock repository call
//        TypedQuery<Object[]> typedQuery = mock(TypedQuery.class);
//        when(entityManager.createQuery(anyString(), eq(Object[].class)))
//                .thenReturn(typedQuery);
//        when(typedQuery.setParameter(anyString(), any()))
//                .thenReturn(typedQuery);
//
//        // Setup different results for each date range
//        when(typedQuery.getResultList())
//                .thenReturn(mockResultsForDateRange(expectedBudgetPeriodCategories, 0, 2))   // Week 1
//                .thenReturn(mockResultsForDateRange(expectedBudgetPeriodCategories, 2, 4))   // Week 2
//                .thenReturn(mockResultsForDateRange(expectedBudgetPeriodCategories, 4, 6))   // Week 3
//                .thenReturn(mockResultsForDateRange(expectedBudgetPeriodCategories, 6, 8))   // Week 4
//                .thenReturn(mockResultsForDateRange(expectedBudgetPeriodCategories, 8, 9));  // Week 5
//
//        // Act
//        List<BudgetPeriodCategory> actualCategories =
//                budgetPeriodQueries.getWeeklyBudgetPeriodCategories(dateRanges, testBudget);
//
//        // Assert
//        assertNotNull(actualCategories);
//        assertEquals(expectedBudgetPeriodCategories.size(), actualCategories.size());
//
//
//        for (int i = 0; i < expectedBudgetPeriodCategories.size(); i++) {
//            BudgetPeriodCategory expected = expectedBudgetPeriodCategories.get(i);
//            BudgetPeriodCategory actual = actualCategories.get(i);
//
//            log.info("Testing category {} for date range: {} to {}",
//                    expected.getCategory(),
//                    expected.getDateRange().getStartDate(),
//                    expected.getDateRange().getEndDate());
//
//            assertEquals(expected.getCategory(), actual.getCategory(),
//                    String.format("Category name mismatch for index %d: expected '%s' but was '%s'",
//                            i, expected.getCategory(), actual.getCategory()));
//
//            assertEquals(expected.getBudgeted(), actual.getBudgeted(),
//                    String.format("Budgeted amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getBudgeted(), actual.getBudgeted()));
//
//            assertEquals(expected.getActual(), actual.getActual(),
//                    String.format("Actual amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getActual(), actual.getActual()));
//
//            assertEquals(expected.getRemaining(), actual.getRemaining(),
//                    String.format("Remaining amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getRemaining(), actual.getRemaining()));
//
//            assertEquals(expected.getDateRange(), actual.getDateRange(),
//                    String.format("Date range mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getDateRange(), actual.getDateRange()));
//
//            assertEquals(expected.getBudgetStatus(), actual.getBudgetStatus(),
//                    String.format("Budget status mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getBudgetStatus(), actual.getBudgetStatus()));
//        }
//    }
//
//    @Test
//    void testGetMonthlyBudgetPeriodCategories_whenDateRangeIsNull_thenReturnEmptyList(){
//        List<BudgetPeriodCategory> actual = budgetPeriodQueries.getMonthlyBudgetPeriodCategories(null, testBudget);
//        assertNotNull(actual);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetMonthlyBudgetPeriodCategories_whenBudgetIsNull_thenReturnEmptyList(){
//        DateRange monthlyDateRange = new DateRange(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 31));
//        List<BudgetPeriodCategory> actual = budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthlyDateRange, null);
//        assertNotNull(actual);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetMonthlyBudgetPeriodCategories_whenMonthRangeStartDateIsNull_thenThrowDateRangeException(){
//        DateRange monthlyDateRange = new DateRange(null, LocalDate.of(2024, 12, 31));
//        assertThrows(DateRangeException.class, () -> {
//            budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthlyDateRange, testBudget);
//        });
//    }
//
//    @Test
//    void testGetMonthlyBudgetPeriodCategories_whenMonthRangeEndDateIsNull_thenThrowDateRangeException(){
//        DateRange monthlyDateRange = new DateRange(LocalDate.of(2024, 10, 1), null);
//        assertThrows(DateRangeException.class, () -> {
//            budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthlyDateRange, testBudget);
//        });
//    }
//
//    @Test
//    void testGetMonthlyBudgetPeriodCategories_whenValidMonthRangeAndBudget_thenReturnCategories() {
//        // Arrange
//        DateRange monthRange = new DateRange(
//                LocalDate.of(2024, 12, 1),
//                LocalDate.of(2024, 12, 31)
//        );
//
//        List<BudgetPeriodCategory> expectedCategories = Arrays.asList(
//                new BudgetPeriodCategory(
//                        "Groceries",
//                        new BigDecimal("500.0"),
//                        new BigDecimal("450.0"),
//                        monthRange,
//                        BudgetStatus.WARNING
//                ),
//                new BudgetPeriodCategory(
//                        "Utilities",
//                        new BigDecimal("300.0"),
//                        new BigDecimal("280.0"),
//                        monthRange,
//                        BudgetStatus.WARNING
//                ),
//                new BudgetPeriodCategory(
//                        "Entertainment",
//                        new BigDecimal("200.0"),
//                        new BigDecimal("150.0"),
//                        monthRange,
//                        BudgetStatus.GOOD
//                )
//        );
//
//        // Mock setup
//        TypedQuery<Object[]> typedQuery = mock(TypedQuery.class);
//        when(entityManager.createQuery(anyString(), eq(Object[].class)))
//                .thenReturn(typedQuery);
//        when(typedQuery.setParameter(anyString(), any()))
//                .thenReturn(typedQuery);
//        when(typedQuery.getResultList())
//                .thenReturn(mockResultsForCategories(expectedCategories));
//
//        // Act
//        List<BudgetPeriodCategory> actualCategories =
//                budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthRange, testBudget);
//
//        // Assert
//        assertNotNull(actualCategories);
//        assertEquals(expectedCategories.size(), actualCategories.size());
//
//        for (int i = 0; i < expectedCategories.size(); i++) {
//            BudgetPeriodCategory expected = expectedCategories.get(i);
//            BudgetPeriodCategory actual = actualCategories.get(i);
//
//            log.info("Testing category {} for month range: {} to {}",
//                    expected.getCategory(),
//                    monthRange.getStartDate(),
//                    monthRange.getEndDate());
//
//            assertEquals(expected.getCategory(), actual.getCategory(),
//                    String.format("Category name mismatch: expected '%s' but was '%s'",
//                            expected.getCategory(), actual.getCategory()));
//
//            assertEquals(expected.getBudgeted(), actual.getBudgeted(),
//                    String.format("Budgeted amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getBudgeted(), actual.getBudgeted()));
//
//            assertEquals(expected.getActual(), actual.getActual(),
//                    String.format("Actual amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getActual(), actual.getActual()));
//
//            assertEquals(expected.getBudgetStatus(), actual.getBudgetStatus(),
//                    String.format("Budget status mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getBudgetStatus(), actual.getBudgetStatus()));
//        }
//
//        // Verify interactions
//        verify(entityManager).createQuery(anyString(), eq(Object[].class));
//        verify(typedQuery).setParameter("startDate", monthRange.getStartDate());
//        verify(typedQuery).setParameter("endDate", monthRange.getEndDate());
//        verify(typedQuery).setParameter("budgetId", testBudget.getId());
//        verify(typedQuery).getResultList();
//    }
//
//    @Test
//    void testGetBiWeeklyBudgetPeriodCategories_whenValidBiWeeksAndBudget_thenReturnCategories() {
//        // Arrange
//        List<DateRange> biWeeks = Arrays.asList(
//                new DateRange(LocalDate.of(2024, 12, 1), LocalDate.of(2024, 12, 14)),
//                new DateRange(LocalDate.of(2024, 12, 15), LocalDate.of(2024, 12, 28)),
//                new DateRange(LocalDate.of(2024, 12, 29), LocalDate.of(2024, 12, 31))
//        );
//
//        List<BudgetPeriodCategory> expectedCategories = new ArrayList<>();
//
//        // First bi-week
//        expectedCategories.add(
//                new BudgetPeriodCategory(
//                        "Groceries",
//                        new BigDecimal("250.0"),
//                        new BigDecimal("200.0"),
//                        biWeeks.get(0),
//                        BudgetStatus.GOOD
//                )
//        );
//        expectedCategories.add(
//                new BudgetPeriodCategory(
//                        "Utilities",
//                        new BigDecimal("150.0"),
//                        new BigDecimal("140.0"),
//                        biWeeks.get(0),
//                        BudgetStatus.WARNING
//                )
//        );
//
//        // Second bi-week
//        expectedCategories.add(
//                new BudgetPeriodCategory(
//                        "Groceries",
//                        new BigDecimal("250.0"),
//                        new BigDecimal("230.0"),
//                        biWeeks.get(1),
//                        BudgetStatus.WARNING
//                )
//        );
//        expectedCategories.add(
//                new BudgetPeriodCategory(
//                        "Entertainment",
//                        new BigDecimal("100.0"),
//                        new BigDecimal("90.0"),
//                        biWeeks.get(1),
//                        BudgetStatus.WARNING
//                )
//        );
//
//        // Third bi-week (partial)
//        expectedCategories.add(
//                new BudgetPeriodCategory(
//                        "Groceries",
//                        new BigDecimal("250.0"),
//                        new BigDecimal("50.0"),
//                        biWeeks.get(2),
//                        BudgetStatus.GOOD
//                )
//        );
//
//        // Mock setup
//        TypedQuery<Object[]> typedQuery = mock(TypedQuery.class);
//        when(entityManager.createQuery(anyString(), eq(Object[].class)))
//                .thenReturn(typedQuery);
//        when(typedQuery.setParameter(anyString(), any()))
//                .thenReturn(typedQuery);
//
//        // Setup different results for each bi-week
//        when(typedQuery.getResultList())
//                .thenReturn(mockResultsForDateRange(expectedCategories, 0, 2))   // First bi-week
//                .thenReturn(mockResultsForDateRange(expectedCategories, 2, 4))   // Second bi-week
//                .thenReturn(mockResultsForDateRange(expectedCategories, 4, 5));  // Third bi-week
//
//        // Act
//        List<BudgetPeriodCategory> actualCategories =
//                budgetPeriodQueries.getBiWeeklyBudgetPeriodCategories(biWeeks, testBudget);
//
//        // Assert
//        assertNotNull(actualCategories);
//        assertEquals(expectedCategories.size(), actualCategories.size());
//
//        for (int i = 0; i < expectedCategories.size(); i++) {
//            BudgetPeriodCategory expected = expectedCategories.get(i);
//            BudgetPeriodCategory actual = actualCategories.get(i);
//
//            log.info("Testing category {} for bi-week: {} to {}",
//                    expected.getCategory(),
//                    expected.getDateRange().getStartDate(),
//                    expected.getDateRange().getEndDate());
//
//            assertEquals(expected.getCategory(), actual.getCategory(),
//                    String.format("Category name mismatch: expected '%s' but was '%s'",
//                            expected.getCategory(), actual.getCategory()));
//
//            assertEquals(expected.getBudgeted(), actual.getBudgeted(),
//                    String.format("Budgeted amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getBudgeted(), actual.getBudgeted()));
//
//            assertEquals(expected.getActual(), actual.getActual(),
//                    String.format("Actual amount mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getActual(), actual.getActual()));
//
//            assertEquals(expected.getBudgetStatus(), actual.getBudgetStatus(),
//                    String.format("Budget status mismatch for %s: expected %s but was %s",
//                            expected.getCategory(), expected.getBudgetStatus(), actual.getBudgetStatus()));
//        }
//    }

    private List<Object[]> mockResultsForCategories(List<BudgetPeriodCategory> categories) {
        return categories.stream()
                .map(category -> new Object[] {
                        "categoryId",
                        category.getCategory(),
                        category.getBudgeted().doubleValue(),
                        category.getActual().doubleValue(),
                        category.getBudgeted().subtract(category.getActual()).doubleValue()
                })
                .collect(Collectors.toList());
    }

    private List<Object[]> mockResultsForDateRange(List<BudgetPeriodCategory> categories, int startIndex, int endIndex) {
        return categories.subList(startIndex, endIndex)
                .stream()
                .map(category -> new Object[] {
                        "categoryId",
                        category.getCategory(),
                        category.getBudgeted().doubleValue(),
                        category.getActual().doubleValue(),
                        category.getBudgeted().subtract(category.getActual()).doubleValue()
                })
                .collect(Collectors.toList());
    }
    @AfterEach
    void tearDown() {
    }
}