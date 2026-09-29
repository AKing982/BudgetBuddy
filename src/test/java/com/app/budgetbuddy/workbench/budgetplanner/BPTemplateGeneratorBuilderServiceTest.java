package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.IncomeRangeBuilderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BPTemplateGeneratorBuilderServiceTest
{
    @Mock
    private BPTemplateBuilderService bpTemplateBuilderService;

    @Mock
    private BPColumnBuilderService bpColumnBuilderService;

    @Mock
    private IncomeRangeBuilderService incomeRangeBuilderService;

    @Mock
    private BPTemplatePointerBuilderService bpTemplatePointerBuilderService;

    @InjectMocks
    private BPTemplateGeneratorBuilderService bpTemplateGeneratorBuilderService;

    @BeforeEach
    void setUp() {

    }

    @Test
    void testBuildFutureColumns_whenBPTemplateTypeIsIncomeSTD_thenReturnBPColumns(){
        List<BPColumn> existingColumns = createTestColumns();                 // 9/9 – 10/20, indexes 0..2
        List<DateRange> existingRanges = existingColumns.stream().map(BPColumn::getDateRange).toList();
        LocalDate nextFuturePointerDate = LocalDate.of(2026, 11, 4);

        // The income range builder returns every range up to the date, existing ones included
        DateRange newRange1 = new DateRange(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 11, 3));
        DateRange newRange2 = new DateRange(LocalDate.of(2026, 11, 4),  LocalDate.of(2026, 11, 17));
        List<DateRange> allIncomeRanges = new ArrayList<>(existingRanges);
        allIncomeRanges.add(newRange1);
        allIncomeRanges.add(newRange2);
        when(incomeRangeBuilderService.generateIncomeRangesUpToFuturePointerDate(existingRanges, nextFuturePointerDate))
                .thenReturn(allIncomeRanges);

        // Only the new ranges should reach the column builder, starting at the next index (3)
        List<BPColumn> expected = List.of(
                createColumn(3, newRange1, Period.BIWEEKLY),
                createColumn(4, newRange2, Period.BIWEEKLY));
        when(bpColumnBuilderService.buildColumns(Period.BIWEEKLY, List.of(newRange1, newRange2), 3))
                .thenReturn(expected);

        List<BPColumn> actual = bpTemplateGeneratorBuilderService.buildFutureColumns(BPTemplateType.INCOME_STD, existingColumns, nextFuturePointerDate);

        assertNotNull(actual);
        assertEquals(2, actual.size());
        assertEquals(3, actual.get(0).getColumnIndex());
        assertEquals(LocalDate.of(2026, 10, 21), actual.get(0).getDateRange().getStartDate());
        assertEquals(LocalDate.of(2026, 11, 3),  actual.get(0).getDateRange().getEndDate());
        assertEquals(4, actual.get(1).getColumnIndex());
        assertEquals(LocalDate.of(2026, 11, 4),  actual.get(1).getDateRange().getStartDate());
        assertEquals(LocalDate.of(2026, 11, 17), actual.get(1).getDateRange().getEndDate());
        assertEquals(Period.BIWEEKLY, actual.get(0).getPeriod());
    }

    @Test
    void testBuildFutureColumns_whenBPTemplateTypeIsMonthlySTD_thenReturnMonthlyBPColumns(){
        List<BPColumn> existingColumns = createTestMonthlyColumns();          // Aug – Oct 2026, indexes 0..2
        LocalDate nextFuturePointerDate = LocalDate.of(2026, 12, 15);

        List<DateRange> existingRanges = existingColumns.stream().map(BPColumn::getDateRange).toList();
        List<BPColumn> expected = List.of(
                createColumn(3, new DateRange(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30)), Period.MONTHLY),
                createColumn(4, new DateRange(LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 31)), Period.MONTHLY));
        when(bpColumnBuilderService.buildColumns(eq(Period.MONTHLY), anyList(), eq(3)))
                .thenReturn(expected);

        List<BPColumn> actual = bpTemplateGeneratorBuilderService.buildFutureColumns(BPTemplateType.MONTHLY_STD, existingColumns, nextFuturePointerDate);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getColumnIndex(), actual.get(i).getColumnIndex());
            assertEquals(expected.get(i).getDateRange(), actual.get(i).getDateRange());
            assertEquals(expected.get(i).getPeriod(), actual.get(i).getPeriod());
            assertEquals(expected.get(i).getColumnType(), actual.get(i).getColumnType());
            assertEquals(expected.get(i).isHeader(), actual.get(i).isHeader());
        }
        verify(bpColumnBuilderService).buildColumns(eq(Period.MONTHLY), anyList(), eq(3));
        verifyNoInteractions(incomeRangeBuilderService);
    }

    @Test
    void testBuildFutureColumns_whenNextFuturePointerDateNotAfterLastColumn_thenReturnEmptyList(){
        List<BPColumn> existingColumns = createTestColumns();                 // last column ends 10/20

        List<BPColumn> actual = bpTemplateGeneratorBuilderService.buildFutureColumns(
                BPTemplateType.INCOME_STD, existingColumns, LocalDate.of(2026, 10, 15));

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verifyNoInteractions(incomeRangeBuilderService, bpColumnBuilderService);
    }

    @Test
    void testBuildFutureColumns_whenExistingColumnsEmpty_thenReturnEmptyList(){
        List<BPColumn> actual = bpTemplateGeneratorBuilderService.buildFutureColumns(
                BPTemplateType.INCOME_STD, List.of(), LocalDate.of(2026, 11, 4));

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verifyNoInteractions(incomeRangeBuilderService, bpColumnBuilderService);
    }

    @Test
    void testBuildFutureColumns_whenIncomeBuilderReturnsNoNewRanges_thenReturnEmptyList(){
        List<BPColumn> existingColumns = createTestColumns();
        List<DateRange> existingRanges = existingColumns.stream().map(BPColumn::getDateRange).toList();
        LocalDate nextFuturePointerDate = LocalDate.of(2026, 11, 4);

        // Only the ranges that already exist come back — nothing new to add
        when(incomeRangeBuilderService.generateIncomeRangesUpToFuturePointerDate(existingRanges, nextFuturePointerDate))
                .thenReturn(new ArrayList<>(existingRanges));

        List<BPColumn> actual = bpTemplateGeneratorBuilderService.buildFutureColumns(BPTemplateType.INCOME_STD, existingColumns, nextFuturePointerDate);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }


    private List<BPColumn> createTestColumns(){
        List<BPColumn> columns = new ArrayList<>();
        columns.add(createColumn(0, new DateRange(LocalDate.of(2026, 9, 9),  LocalDate.of(2026, 9, 22)),  Period.BIWEEKLY));
        columns.add(createColumn(1, new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)),  Period.BIWEEKLY));
        columns.add(createColumn(2, new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)), Period.BIWEEKLY));
        return columns;
    }

    private List<BPColumn> createTestMonthlyColumns(){
        List<BPColumn> columns = new ArrayList<>();
        columns.add(createColumn(0, new DateRange(LocalDate.of(2026, 8, 1),  LocalDate.of(2026, 8, 31)),  Period.MONTHLY));
        columns.add(createColumn(1, new DateRange(LocalDate.of(2026, 9, 1),  LocalDate.of(2026, 9, 30)),  Period.MONTHLY));
        columns.add(createColumn(2, new DateRange(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)), Period.MONTHLY));
        return columns;
    }

    private BPColumn createColumn(int columnIndex, DateRange dateRange, Period period){
        return BPColumn.builder()
                .columnIndex(columnIndex)
                .dateRange(dateRange)
                .period(period)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build();
    }



    @AfterEach
    void tearDown() {
    }
}