package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodQueries;
import com.app.budgetbuddy.workbench.budget.BudgetQueriesService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Slf4j
class BudgetRunnerTest {

    @Mock
    private BudgetPeriodQueries budgetPeriodQueries;

    @Mock
    private BudgetQueriesService budgetQueriesService;

    @InjectMocks
    private BudgetRunner budgetRunner;

    private Budget testBudget;

    @BeforeEach
    void setUp() {
        testBudget = new Budget();
        testBudget.setId(1L);
        testBudget.setActual(new BigDecimal("1630"));
        testBudget.setBudgetAmount(new BigDecimal("3260"));
        testBudget.setBudgetDescription("Savings Budget");
        testBudget.setBudgetName("Savings Budget");
        testBudget.setStartDate(LocalDate.of(2024, 10, 1));
        testBudget.setEndDate(LocalDate.of(2024, 10, 31));
        budgetRunner = new BudgetRunner(budgetPeriodQueries, budgetQueriesService);
    }

    @Test
    void testGetBudgetPeriodCategories_whenBudgetPeriodIsNull_shouldReturnEmptyList() {
        List<BudgetPeriodCategory> actual = budgetRunner.getBudgetPeriodCategories(null, testBudget);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetBudgetPeriodCategories_whenBudgetPeriodAndBudgetValid_thenReturnBudgetPeriodCategories(){
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.MONTHLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));

        DateRange monthRange = new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        List<BudgetPeriodCategory> expectedCategories = Arrays.asList(
                new BudgetPeriodCategory(
                        "Groceries",
                        new BigDecimal("500.0"),
                        new BigDecimal("450.0"),
                        monthRange,
                        BudgetStatus.WARNING
                ),
                new BudgetPeriodCategory(
                        "Utilities",
                        new BigDecimal("300.0"),
                        new BigDecimal("280.0"),
                        monthRange,
                        BudgetStatus.WARNING
                ),
                new BudgetPeriodCategory(
                        "Entertainment",
                        new BigDecimal("200.0"),
                        new BigDecimal("150.0"),
                        monthRange,
                        BudgetStatus.GOOD
                )
        );

        when(budgetPeriodQueries.getMonthlyBudgetPeriodCategories(monthRange, testBudget)).thenReturn(expectedCategories);

        List<BudgetPeriodCategory> actual = budgetRunner.getBudgetPeriodCategories(budgetPeriod, testBudget);
        assertNotNull(actual);
        assertEquals(expectedCategories.size(), actual.size());
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expectedCategories.get(i).getCategory(), actual.get(i).getCategory());
            assertEquals(expectedCategories.get(i).getBudgeted(), actual.get(i).getBudgeted());
            assertEquals(expectedCategories.get(i).getActual(), actual.get(i).getActual());
            assertEquals(expectedCategories.get(i).getDateRange(), actual.get(i).getDateRange());
            assertEquals(expectedCategories.get(i).getRemaining(), actual.get(i).getRemaining());
            assertEquals(expectedCategories.get(i).getSpendingPercentage(), actual.get(i).getSpendingPercentage());
            assertEquals(expectedCategories.get(i).getBudgetStatus(), actual.get(i).getBudgetStatus());
        }
    }

    @Test
    void testGetBudgetPeriodCategories_whenBudgetPeriodIsWeekly_ThenReturnBudgetPeriodCategories(){
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));

        List<DateRange> dateRanges = new ArrayList<>();
        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 8)));
        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 8), LocalDate.of(2024, 10, 16)));
        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 16), LocalDate.of(2024, 10, 23)));
        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 23), LocalDate.of(2024, 10, 31)));

        List<BudgetPeriodCategory> expectedBudgetPeriodCategories = new ArrayList<>();
        // Week 1
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Groceries",
                        new BigDecimal("430.0"),
                        new BigDecimal("120.0"),
                        dateRanges.get(0),
                        BudgetStatus.GOOD)
        );
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Utilities",
                        new BigDecimal("250.0"),
                        new BigDecimal("200.0"),
                        dateRanges.get(0),
                        BudgetStatus.GOOD)
        );

        // Week 2
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Groceries",
                        new BigDecimal("430.0"),
                        new BigDecimal("150.0"),
                        dateRanges.get(1),
                        BudgetStatus.GOOD)
        );
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Entertainment",
                        new BigDecimal("200.0"),
                        new BigDecimal("180.0"),
                        dateRanges.get(1),
                        BudgetStatus.WARNING)
        );

        // Week 3
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Groceries",
                        new BigDecimal("430.0"),
                        new BigDecimal("200.0"),
                        dateRanges.get(2),
                        BudgetStatus.GOOD)
        );
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Transportation",
                        new BigDecimal("300.0"),
                        new BigDecimal("250.0"),
                        dateRanges.get(2),
                        BudgetStatus.GOOD)
        );

        // Week 4
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Groceries",
                        new BigDecimal("430.0"),
                        new BigDecimal("400.0"),
                        dateRanges.get(3),
                        BudgetStatus.WARNING)
        );
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory("Shopping",
                        new BigDecimal("500.0"),
                        new BigDecimal("450.0"),
                        dateRanges.get(3),
                        BudgetStatus.WARNING)
        );

        when(budgetPeriodQueries.getWeeklyBudgetPeriodCategories(anyList(), any(Budget.class))).thenReturn(expectedBudgetPeriodCategories);

        List<BudgetPeriodCategory> actualCategories = budgetRunner.getBudgetPeriodCategories(budgetPeriod, testBudget);
        assertNotNull(actualCategories);
        assertEquals(expectedBudgetPeriodCategories.size(), actualCategories.size());
        for (int i = 0; i < expectedBudgetPeriodCategories.size(); i++) {
            BudgetPeriodCategory expected = expectedBudgetPeriodCategories.get(i);
            BudgetPeriodCategory actual = actualCategories.get(i);

            log.info("Testing category {} for date range: {} to {}",
                    expected.getCategory(),
                    expected.getDateRange().getStartDate(),
                    expected.getDateRange().getEndDate());

            assertEquals(expected.getCategory(), actual.getCategory(),
                    String.format("Category name mismatch for index %d: expected '%s' but was '%s'",
                            i, expected.getCategory(), actual.getCategory()));

            assertEquals(expected.getBudgeted(), actual.getBudgeted(),
                    String.format("Budgeted amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getBudgeted(), actual.getBudgeted()));

            assertEquals(expected.getActual(), actual.getActual(),
                    String.format("Actual amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getActual(), actual.getActual()));

            assertEquals(expected.getRemaining(), actual.getRemaining(),
                    String.format("Remaining amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getRemaining(), actual.getRemaining()));

            assertEquals(expected.getDateRange(), actual.getDateRange(),
                    String.format("Date range mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getDateRange(), actual.getDateRange()));

            assertEquals(expected.getBudgetStatus(), actual.getBudgetStatus(),
                    String.format("Budget status mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getBudgetStatus(), actual.getBudgetStatus()));
        }
    }

    @Test
    void testGetBudgetPeriodCategories_whenBudgetPeriodIsBiWeekly_thenReturnBudgetPeriodCategories(){
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.BIWEEKLY, LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 31));
        List<DateRange> dateRanges = new ArrayList<>();
        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 1), LocalDate.of(2024, 10, 14)));
        dateRanges.add(new DateRange(LocalDate.of(2024, 10, 14), LocalDate.of(2024, 10, 28)));

        List<BudgetPeriodCategory> expectedBudgetPeriodCategories = new ArrayList<>();

        // First bi-week
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Groceries",
                        new BigDecimal("250.0"),
                        new BigDecimal("200.0"),
                        dateRanges.get(0),
                        BudgetStatus.GOOD
                )
        );
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Utilities",
                        new BigDecimal("150.0"),
                        new BigDecimal("140.0"),
                        dateRanges.get(0),
                        BudgetStatus.WARNING
                )
        );

        // Second bi-week
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Groceries",
                        new BigDecimal("250.0"),
                        new BigDecimal("230.0"),
                        dateRanges.get(1),
                        BudgetStatus.WARNING
                )
        );
        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Entertainment",
                        new BigDecimal("100.0"),
                        new BigDecimal("90.0"),
                        dateRanges.get(1),
                        BudgetStatus.WARNING
                )
        );

        when(budgetPeriodQueries.getBiWeeklyBudgetPeriodCategories(anyList(), any(Budget.class))).thenReturn(expectedBudgetPeriodCategories);
        List<BudgetPeriodCategory> actualCategories = budgetRunner.getBudgetPeriodCategories(budgetPeriod, testBudget);
        assertNotNull(actualCategories);
        assertEquals(expectedBudgetPeriodCategories.size(), actualCategories.size());
        for (int i = 0; i < expectedBudgetPeriodCategories.size(); i++) {
            BudgetPeriodCategory expected = expectedBudgetPeriodCategories.get(i);
            BudgetPeriodCategory actual = actualCategories.get(i);

            log.info("Testing category {} for date range: {} to {}",
                    expected.getCategory(),
                    expected.getDateRange().getStartDate(),
                    expected.getDateRange().getEndDate());

            assertEquals(expected.getCategory(), actual.getCategory(),
                    String.format("Category name mismatch for index %d: expected '%s' but was '%s'",
                            i, expected.getCategory(), actual.getCategory()));

            assertEquals(expected.getBudgeted(), actual.getBudgeted(),
                    String.format("Budgeted amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getBudgeted(), actual.getBudgeted()));

            assertEquals(expected.getActual(), actual.getActual(),
                    String.format("Actual amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getActual(), actual.getActual()));

            assertEquals(expected.getRemaining(), actual.getRemaining(),
                    String.format("Remaining amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getRemaining(), actual.getRemaining()));

            assertEquals(expected.getDateRange(), actual.getDateRange(),
                    String.format("Date range mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getDateRange(), actual.getDateRange()));

            assertEquals(expected.getBudgetStatus(), actual.getBudgetStatus(),
                    String.format("Budget status mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getBudgetStatus(), actual.getBudgetStatus()));
        }
    }

    @Test
    void testGetBudgetPeriodCategories_whenBudgetPeriodDaily_thenReturnDailyBudgetCategories() {
        // Arrange
        BudgetPeriod budgetPeriod = new BudgetPeriod(Period.DAILY,
                LocalDate.of(2024, 10, 2),
                LocalDate.of(2024, 10, 2));
        LocalDate date = LocalDate.of(2024, 10, 2);

        List<BudgetPeriodCategory> expectedBudgetPeriodCategories = new ArrayList<>();
        DateRange dailyRange = new DateRange(date, date);

        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Groceries",
                        new BigDecimal("100.00"),
                        new BigDecimal("80.00"),
                        dailyRange,
                        BudgetStatus.GOOD
                )
        );

        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Utilities",
                        new BigDecimal("50.00"),
                        new BigDecimal("45.00"),
                        dailyRange,
                        BudgetStatus.WARNING
                )
        );

        expectedBudgetPeriodCategories.add(
                new BudgetPeriodCategory(
                        "Entertainment",
                        new BigDecimal("30.00"),
                        new BigDecimal("25.00"),
                        dailyRange,
                        BudgetStatus.GOOD
                )
        );

        // Mock setup
        when(budgetPeriodQueries.getDailyBudgetPeriodQuery(eq(date), eq(testBudget)))
                .thenReturn(expectedBudgetPeriodCategories);

        // Act
        List<BudgetPeriodCategory> actualCategories =
                budgetRunner.getBudgetPeriodCategories(budgetPeriod, testBudget);

        // Assert
        assertNotNull(actualCategories);
        assertEquals(expectedBudgetPeriodCategories.size(), actualCategories.size());

        for (int i = 0; i < expectedBudgetPeriodCategories.size(); i++) {
            BudgetPeriodCategory expected = expectedBudgetPeriodCategories.get(i);
            BudgetPeriodCategory actual = actualCategories.get(i);

            log.info("Testing category {} for date: {}",
                    expected.getCategory(),
                    date);

            assertEquals(expected.getCategory(), actual.getCategory(),
                    String.format("Category name mismatch: expected '%s' but was '%s'",
                            expected.getCategory(), actual.getCategory()));

            assertEquals(expected.getBudgeted(), actual.getBudgeted(),
                    String.format("Budgeted amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getBudgeted(), actual.getBudgeted()));

            assertEquals(expected.getActual(), actual.getActual(),
                    String.format("Actual amount mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getActual(), actual.getActual()));

            assertEquals(expected.getDateRange(), actual.getDateRange(),
                    String.format("Date range mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getDateRange(), actual.getDateRange()));

            assertEquals(expected.getBudgetStatus(), actual.getBudgetStatus(),
                    String.format("Budget status mismatch for %s: expected %s but was %s",
                            expected.getCategory(), expected.getBudgetStatus(), actual.getBudgetStatus()));
        }

        // Verify
        verify(budgetPeriodQueries).getDailyBudgetPeriodQuery(date, testBudget);
    }


    @Test
    void testLoadBudgetStatisticsForUser_whenValidDatesAndUserId_thenReturnBudgetStats() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        Long userId = 1L;

        List<BudgetStats> expectedBudgetStats = Arrays.asList(
                new BudgetStats(
                        1L,                           // budgetId
                        new BigDecimal("3000.00"),    // totalBudget
                        new BigDecimal("2500.00"),    // totalSpent
                        new BigDecimal("500.00"),     // remaining
                        new BigDecimal("300.00"),     // totalSaved
                        new BigDecimal("80.65"),      // averageSpendingPerDay
                        new DateRange(startDate, endDate)
                ),
                new BudgetStats(
                        1L,
                        new BigDecimal("3000.00"),
                        new BigDecimal("2800.00"),
                        new BigDecimal("200.00"),
                        new BigDecimal("150.00"),
                        new BigDecimal("90.32"),
                        new DateRange(startDate.plusMonths(1), endDate.plusMonths(1))
                )
        );

        // Mock query setup
        TypedQuery<Object[]> typedQuery = mock(TypedQuery.class);
        EntityManager entityManager = mock(EntityManager.class);
        when(entityManager.createQuery(anyString(), eq(Object[].class)))
                .thenReturn(typedQuery);
        when(typedQuery.setParameter(anyString(), any()))
                .thenReturn(typedQuery);
        when(typedQuery.getResultList())
                .thenReturn(mockBudgetStatsResults(expectedBudgetStats));

        // Act
        List<BudgetStats> actualBudgetStats = budgetRunner.loadBudgetStatisticsForUser(startDate, endDate, testBudget);

        // Assert
        assertNotNull(actualBudgetStats);
        assertEquals(expectedBudgetStats.size(), actualBudgetStats.size());

        for (int i = 0; i < expectedBudgetStats.size(); i++) {
            BudgetStats expected = expectedBudgetStats.get(i);
            BudgetStats actual = actualBudgetStats.get(i);

            log.info("Testing budget stats for period {}: {} to {}",
                    i + 1,
                    expected.getDateRange().getStartDate(),
                    expected.getDateRange().getEndDate());

            assertEquals(expected.getBudgetId(), actual.getBudgetId(),
                    String.format("Budget ID mismatch for period %d", i + 1));

            assertEquals(expected.getTotalBudget(), actual.getTotalBudget(),
                    String.format("Total budget mismatch for period %d: expected %s but was %s",
                            i + 1, expected.getTotalBudget(), actual.getTotalBudget()));

            assertEquals(expected.getTotalSpent(), actual.getTotalSpent(),
                    String.format("Total spent mismatch for period %d: expected %s but was %s",
                            i + 1, expected.getTotalSpent(), actual.getTotalSpent()));

            assertEquals(expected.getRemaining(), actual.getRemaining(),
                    String.format("Remaining mismatch for period %d: expected %s but was %s",
                            i + 1, expected.getRemaining(), actual.getRemaining()));

            assertEquals(expected.getTotalSaved(), actual.getTotalSaved(),
                    String.format("Total saved mismatch for period %d: expected %s but was %s",
                            i + 1, expected.getTotalSaved(), actual.getTotalSaved()));

            assertEquals(expected.getAverageSpendingPerDay(), actual.getAverageSpendingPerDay(),
                    String.format("Average spending per day mismatch for period %d: expected %s but was %s",
                            i + 1, expected.getAverageSpendingPerDay(), actual.getAverageSpendingPerDay()));

            assertEquals(expected.getDateRange(), actual.getDateRange(),
                    String.format("Date range mismatch for period %d: expected %s but was %s",
                            i + 1, expected.getDateRange(), actual.getDateRange()));
        }

        // Verify
        verify(entityManager).createQuery(anyString(), eq(Object[].class));
        verify(typedQuery).setParameter("startDate", startDate);
        verify(typedQuery).setParameter("endDate", endDate);
        verify(typedQuery).setParameter("userId", userId);
        verify(typedQuery).getResultList();
    }

    private List<Object[]> mockBudgetStatsResults(List<BudgetStats> expectedStats) {
        return expectedStats.stream()
                .map(stat -> new Object[] {
                        stat.getBudgetId(),
                        stat.getTotalBudget().doubleValue(),
                        stat.getTotalSpent().doubleValue(),
                        stat.getRemaining().doubleValue(),
                        stat.getTotalSaved().doubleValue(),
                        stat.getAverageSpendingPerDay().doubleValue(),
                        stat.getDateRange().getStartDate(),
                        stat.getDateRange().getEndDate()
                })
                .collect(Collectors.toList());
    }

    @AfterEach
    void tearDown() {
    }
}