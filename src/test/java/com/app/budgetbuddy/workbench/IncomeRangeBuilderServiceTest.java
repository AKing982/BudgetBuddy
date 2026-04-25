package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.services.TransactionCategoryService;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncomeRangeBuilderServiceTest {

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @InjectMocks
    private IncomeRangeBuilderService incomeRangeBuilderService;

    private Budget testBudget;
    private List<SubBudget> subBudgets = new ArrayList<>();

    private List<LocalDate> pastIncomePostedDates = List.of(
            // October 2025
            LocalDate.of(2025, 10, 23),
            LocalDate.of(2025, 11, 6),
            LocalDate.of(2025, 11, 20),
            LocalDate.of(2025, 12, 4),
            LocalDate.of(2025, 12, 18),
            LocalDate.of(2025, 12, 31),
            LocalDate.of(2026, 1,  15),
            LocalDate.of(2026, 1, 29),
            LocalDate.of(2026, 2, 12),
            LocalDate.of(2026, 2, 25),
            LocalDate.of(2026, 3, 11),
            LocalDate.of(2026, 3, 25),
            LocalDate.of(2026, 4, 8)
    );

    @BeforeEach
    void setUp() {
        testBudget = Budget.builder()
                .id(1L)
                .budgetName("Test Annual Budget")
                .build();

        subBudgets = List.of(
                // 2025
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "October 2025",   LocalDate.of(2025, 10, 1), LocalDate.of(2025, 10, 31)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "November 2025",  LocalDate.of(2025, 11, 1), LocalDate.of(2025, 11, 30)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "December 2025",  LocalDate.of(2025, 12, 1), LocalDate.of(2025, 12, 31)),
                // 2026
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "January 2026",   LocalDate.of(2026,  1, 1), LocalDate.of(2026,  1, 31)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "February 2026",  LocalDate.of(2026,  2, 1), LocalDate.of(2026,  2, 28)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "March 2026",     LocalDate.of(2026,  3, 1), LocalDate.of(2026,  3, 31)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "April 2026",     LocalDate.of(2026,  4, 1), LocalDate.of(2026,  4, 30)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "May 2026",       LocalDate.of(2026,  5, 1), LocalDate.of(2026,  5, 31)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "June 2026",      LocalDate.of(2026,  6, 1), LocalDate.of(2026,  6, 30)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "July 2026",      LocalDate.of(2026,  7, 1), LocalDate.of(2026,  7, 31)),
                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "August 2026",    LocalDate.of(2026,  8, 1), LocalDate.of(2026,  8, 31))
//                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "September 2026", LocalDate.of(2026,  9, 1), LocalDate.of(2026,  9, 30)),
//                SubBudget.buildSubBudget(true, new BigDecimal("3500.00"), new BigDecimal("500.00"), BigDecimal.ZERO, testBudget, BigDecimal.ZERO, "October 2026",   LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31))
        );
    }

    @Test
    void testGenerateFutureIncomeRanges_whenPastIncomePostedDatesAreNull_thenReturnEmptyList(){
        List<DateRange> actual = incomeRangeBuilderService.generateFutureIncomeRanges(subBudgets, null);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateFutureIncomeRanges_whenPastIncomePostedDatesIsEmpty_thenReturnEmptyList(){
        List<DateRange> actual = incomeRangeBuilderService.generateFutureIncomeRanges(subBudgets, new ArrayList<>());
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateFutureIncomeRanges_whenSubBudgetsAreNull_thenReturnEmptyList(){
        List<DateRange> actual = incomeRangeBuilderService.generateFutureIncomeRanges(null, pastIncomePostedDates);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateFutureIncomeRanges_whenValidPostedAndSubBudgets_thenReturnFutureIncomeRanges(){

        List<DateRange> expected = new ArrayList<>();
        expected.add(new DateRange(LocalDate.of(2026, 4, 8), LocalDate.of(2026, 4, 21)));
        expected.add(new DateRange(LocalDate.of(2026, 4, 22), LocalDate.of(2026, 5, 5)));
        expected.add(new DateRange(LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5,  19)));
        expected.add(new DateRange(LocalDate.of(2026, 5, 20), LocalDate.of(2026, 6, 2)));
        expected.add(new DateRange(LocalDate.of(2026, 6, 3), LocalDate.of(2026, 6, 16)));
        expected.add(new DateRange(LocalDate.of(2026, 6, 17), LocalDate.of(2026, 6, 30)));
        expected.add(new DateRange(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 14)));
        expected.add(new DateRange(LocalDate.of(2026, 7, 15), LocalDate.of(2026, 7, 28)));
        expected.add(new DateRange(LocalDate.of(2026, 7, 29), LocalDate.of(2026, 8, 11)));
        expected.add(new DateRange(LocalDate.of(2026, 8, 12), LocalDate.of(2026, 8, 25)));

        List<DateRange> actual = incomeRangeBuilderService.generateFutureIncomeRanges(subBudgets, pastIncomePostedDates);
        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        for(int i = 0; i < expected.size(); i++){
            DateRange actualRange = actual.get(i);
            DateRange expectedRange = expected.get(i);
            System.out.println("Expected Range: " + expectedRange);
            System.out.println("Actual Range: " + actualRange);
            assertEquals(expectedRange.getStartDate(), actualRange.getStartDate());
            assertEquals(expectedRange.getEndDate(), actualRange.getEndDate());
        }
    }

    @Test
    void testGenerateStandardIncomeRanges_whenSubBudgetsAreNull_thenReturnEmptyList(){
        List<DateRange> actual = incomeRangeBuilderService.generateStandardIncomeRanges(null, 1);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateStandardIncomeRanges_whenSubBudgetsAreEmpty_thenReturnEmptyList(){
        List<DateRange> actual = incomeRangeBuilderService.generateStandardIncomeRanges(new ArrayList<>(), 1);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGenerateStandardIncomeRanges_whenStartDayIsNull_thenReturnRangesFromSubBudgetStartDate(){
        List<LocalDate> mockPostedDates = List.of(
                LocalDate.of(2025, 10, 1),
                LocalDate.of(2025, 10, 15),
                LocalDate.of(2025, 10, 29)
        );

        SubBudget octSubBudget = subBudgets.get(0);
        when(transactionCategoryService.getIncomePostedDatesByDateShift(
                any(), eq(octSubBudget.getId()),
                eq(LocalDate.of(2025, 10, 1)),
                eq(LocalDate.of(2025, 10, 31))
        )).thenReturn(mockPostedDates);

        List<DateRange> actual = incomeRangeBuilderService.generateStandardIncomeRanges(
                List.of(octSubBudget), null
        );

        assertNotNull(actual);
        assertFalse(actual.isEmpty());
        assertEquals(2, actual.size());
        assertEquals(LocalDate.of(2025, 10, 1),  actual.get(0).getStartDate());
        assertEquals(LocalDate.of(2025, 10, 14), actual.get(0).getEndDate());
        assertEquals(LocalDate.of(2025, 10, 15), actual.get(1).getStartDate());
        assertEquals(LocalDate.of(2025, 10, 28), actual.get(1).getEndDate());
    }


    @AfterEach
    void tearDown() {
    }
}