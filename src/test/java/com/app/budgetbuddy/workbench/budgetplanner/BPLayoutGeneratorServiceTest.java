package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPLayoutGeneratorServiceTest
{
    @Mock
    private BPLayoutBuilderService bpLayoutBuilderService;

    @InjectMocks
    private BPLayoutGeneratorService generatorService;

    private SubBudget subBudget;
    private DateRange week1;
    private DateRange week2;
    private BPColumn col0;
    private BPColumn col1;
    private List<SubBudget> subBudgets;

    @BeforeEach
    void setUp() {
        Budget budget = new Budget();
        budget.setUserId(1L);

        subBudget = SubBudget.builder()
                .id(1L)
                .budget(budget)
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 1, 14))
                .allocatedAmount(new BigDecimal("5000.00"))
                .build();

        subBudgets = List.of(subBudget);

        week1 = new DateRange(LocalDate.of(2024, 1, 1),  LocalDate.of(2024, 1, 7));
        week2 = new DateRange(LocalDate.of(2024, 1, 8),  LocalDate.of(2024, 1, 14));

        col0 = new BPColumn(0, week1, Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        col1 = new BPColumn(1, week2, Period.BIWEEKLY, BPColumnType.ACTUAL, false);
    }

    private BPCategory budget(String name, int colIdx, DateRange range, String actual, String budgeted)
    {
        return BPCategory.builder()
                .name(name).type(BPType.BUDGET).columnIndex(colIdx)
                .range(range).actual(new BigDecimal(actual))
                .budgeted(new BigDecimal(budgeted)).isActive(true).build();
    }

    private BPCategory income(int colIdx, DateRange range, String actual)
    {
        return BPCategory.builder()
                .name("Salary").type(BPType.INCOME).columnIndex(colIdx)
                .range(range).actual(new BigDecimal(actual))
                .budgeted(BigDecimal.ZERO).isActive(true).build();
    }

    private BPCategory balance(int colIdx, DateRange range, String actual)
    {
        return BPCategory.builder()
                .name("Balance").type(BPType.BALANCE).columnIndex(colIdx)
                .range(range).actual(new BigDecimal(actual))
                .budgeted(BigDecimal.ZERO).isActive(true).build();
    }

//    @Test
//    void generateLayoutGrid_whenTemplateTypeIsNull_thenThrowDataException()
//    {
//        assertThrows(DataException.class,
//                () -> generatorService.generateLayoutGrid(null, subBudgets));
//    }
//
//    @Test
//    void generateLayoutGrid_whenSubBudgetsIsNull_thenThrowDataException()
//    {
//        assertThrows(DataException.class,
//                () -> generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, null));
//    }
//
//    @Test
//    void generateLayoutGrid_whenSubBudgetsIsEmpty_thenThrowDataException()
//    {
//        assertThrows(DataException.class,
//                () -> generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, Collections.emptyList()));
//    }
//
//    @Test
//    void generateLayoutGrid_thenGridContainsSameColumnsAsLayout()
//    {
//        List<BPCategory> categories = List.of(
//                budget("Rent", 0, week1, "1927.03", "1927.00"),
//                budget("Rent", 1, week2, "0.00",    "1927.00"));
//
//        BPLayoutGrid expected = new BPLayoutGrid(
//                List.of(col0, col1),
//                List.of(
//                        new BPGridRow("Rent", BPType.BUDGET, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("1927.03"), new BigDecimal("1927.00"), false, true),
//                                new BPGridCell(1, week2, new BigDecimal("0.00"),    new BigDecimal("1927.00"), false, true)))
//                ),
//                new BPLayout(List.of(col0, col1), categories));
//
//        when(bpLayoutBuilderService.buildLayout(BPTemplateType.BIWEEKLY_STD, subBudgets))
//                .thenReturn(expected.bpLayout());
//
//        BPLayoutGrid actual = generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, subBudgets);
//
//        assertNotNull(actual);
//        assertEquals(expected.columns().size(), actual.columns().size());
//        assertEquals(expected.columns().get(0), actual.columns().get(0));
//        assertEquals(expected.columns().get(1), actual.columns().get(1));
//    }
//
//    @Test
//    void generateLayoutGrid_thenEachUniqueCategoryNameProducesOneGridRow()
//    {
//        List<BPCategory> categories = List.of(
//                budget("Rent", 0, week1, "1927.03", "1927.00"),
//                budget("Gas",  0, week1, "35.37",   "40.00"),
//                budget("Rent", 1, week2, "0.00",    "1927.00"),
//                budget("Gas",  1, week2, "51.68",   "40.00"));
//
//        BPLayoutGrid expected = new BPLayoutGrid(
//                List.of(col0, col1),
//                List.of(
//                        new BPGridRow("Rent", BPType.BUDGET, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("1927.03"), new BigDecimal("1927.00"), false, true),
//                                new BPGridCell(1, week2, new BigDecimal("0.00"),    new BigDecimal("1927.00"), false, true))),
//                        new BPGridRow("Gas", BPType.BUDGET, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("35.37"), new BigDecimal("40.00"), false, true),
//                                new BPGridCell(1, week2, new BigDecimal("51.68"), new BigDecimal("40.00"), false, true)))
//                ),
//                new BPLayout(List.of(col0, col1), categories));
//
//        when(bpLayoutBuilderService.buildLayout(any(), any()))
//                .thenReturn(expected.bpLayout());
//
//        BPLayoutGrid actual = generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, subBudgets);
//
//        long expectedBudgetRowCount = expected.rows().stream().filter(r -> r.type() == BPType.BUDGET).count();
//        long actualBudgetRowCount   = actual.rows().stream().filter(r -> r.type() == BPType.BUDGET).count();
//        assertEquals(expectedBudgetRowCount, actualBudgetRowCount);
//    }
//
//    @Test
//    void generateLayoutGrid_whenCategoryMissingForColumn_thenCellActualIsNull()
//    {
//        List<BPCategory> categories = List.of(
//                budget("Rent", 0, week1, "1927.03", "1927.00"));
//
//        BPLayoutGrid expected = new BPLayoutGrid(
//                List.of(col0, col1),
//                List.of(
//                        new BPGridRow("Rent", BPType.BUDGET, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("1927.03"), new BigDecimal("1927.00"), false, false),
//                                new BPGridCell(1, week2, null, null, false, false)))
//                ),
//                new BPLayout(List.of(col0, col1), categories));
//
//        when(bpLayoutBuilderService.buildLayout(any(), any()))
//                .thenReturn(expected.bpLayout());
//
//        BPLayoutGrid actual = generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, subBudgets);
//
//        BPGridRow expectedRentRow = expected.rows().get(0);
//        BPGridRow actualRentRow   = actual.rows().stream()
//                .filter(r -> r.category().equals("Rent"))
//                .findFirst().orElseThrow();
//
//        assertEquals(0, expectedRentRow.cells().get(0).actual().compareTo(actualRentRow.cells().get(0).actual()));
//        assertNull(expectedRentRow.cells().get(1).actual());
//        assertNull(actualRentRow.cells().get(1).actual());
//    }
//
//    @Test
//    void generateLayoutGrid_thenEachRowHasCellCountEqualToColumnCount()
//    {
//        List<BPCategory> categories = List.of(
//                budget("Gas", 0, week1, "35.37", "40.00"),
//                budget("Gas", 1, week2, "51.68", "40.00"));
//
//        BPLayoutGrid expected = new BPLayoutGrid(
//                List.of(col0, col1),
//                List.of(
//                        new BPGridRow("Gas", BPType.BUDGET, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("35.37"), new BigDecimal("40.00"), false, true),
//                                new BPGridCell(1, week2, new BigDecimal("51.68"), new BigDecimal("40.00"), false, true)))
//                ),
//                new BPLayout(List.of(col0, col1), categories));
//
//        when(bpLayoutBuilderService.buildLayout(any(), any()))
//                .thenReturn(expected.bpLayout());
//
//        BPLayoutGrid actual = generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, subBudgets);
//
//        BPGridRow expectedRow = expected.rows().get(0);
//        BPGridRow actualRow   = actual.rows().get(0);
//        assertEquals(expectedRow.cells().size(), actualRow.cells().size());
//    }
//
//    @Test
//    void generateLayoutGrid_thenIncomeRowActualAmountsMatchCategories()
//    {
//        List<BPCategory> categories = List.of(
//                income(0, week1, "2548.23"),
//                income(1, week2, "2257.57"));
//
//        BPLayoutGrid expected = new BPLayoutGrid(
//                List.of(col0, col1),
//                List.of(
//                        new BPGridRow("Salary", BPType.INCOME, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("2548.23"), BigDecimal.ZERO, false, true),
//                                new BPGridCell(1, week2, new BigDecimal("2257.57"), BigDecimal.ZERO, false, true)))
//                ),
//                new BPLayout(List.of(col0, col1), categories));
//
//        when(bpLayoutBuilderService.buildLayout(any(), any()))
//                .thenReturn(expected.bpLayout());
//
//        BPLayoutGrid actual = generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, subBudgets);
//
//        BPGridRow expectedIncomeRow = expected.rows().get(0);
//        BPGridRow actualIncomeRow   = actual.rows().stream()
//                .filter(r -> r.type() == BPType.INCOME)
//                .findFirst().orElseThrow();
//
//        assertEquals(0, expectedIncomeRow.cells().get(0).actual().compareTo(actualIncomeRow.cells().get(0).actual()));
//        assertEquals(0, expectedIncomeRow.cells().get(1).actual().compareTo(actualIncomeRow.cells().get(1).actual()));
//    }
//
//    @Test
//    void generateLayoutGrid_thenBalanceRowActualAmountsMatchCategories()
//    {
//        List<BPCategory> categories = List.of(
//                balance(0, week1, "86.86"),
//                balance(1, week2, "859.07"));
//
//        BPLayoutGrid expected = new BPLayoutGrid(
//                List.of(col0, col1),
//                List.of(
//                        new BPGridRow("Balance", BPType.BALANCE, List.of(
//                                new BPGridCell(0, week1, new BigDecimal("86.86"),  BigDecimal.ZERO, true, true),
//                                new BPGridCell(1, week2, new BigDecimal("859.07"), BigDecimal.ZERO, true, true)))
//                ),
//                new BPLayout(List.of(col0, col1), categories));
//
//        when(bpLayoutBuilderService.buildLayout(any(), any()))
//                .thenReturn(expected.bpLayout());
//
//        BPLayoutGrid actual = generatorService.generateLayoutGrid(BPTemplateType.BIWEEKLY_STD, subBudgets);
//
//        BPGridRow expectedBalanceRow = expected.rows().get(0);
//        BPGridRow actualBalanceRow   = actual.rows().stream()
//                .filter(r -> r.type() == BPType.BALANCE)
//                .findFirst().orElseThrow();
//
//        assertEquals(0, expectedBalanceRow.cells().get(0).actual().compareTo(actualBalanceRow.cells().get(0).actual()));
//        assertEquals(0, expectedBalanceRow.cells().get(1).actual().compareTo(actualBalanceRow.cells().get(1).actual()));
//    }




    @AfterEach
    void tearDown() {
    }
}