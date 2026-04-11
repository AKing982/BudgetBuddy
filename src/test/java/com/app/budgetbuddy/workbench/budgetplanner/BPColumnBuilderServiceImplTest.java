package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPColumnService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BPColumnBuilderServiceImplTest
{
    @Mock
    private BPColumnService bpColumnService;

    @InjectMocks
    private BPColumnBuilderServiceImpl bpColumnBuilderService;

    private DateRange validDateRange;

    @BeforeEach
    void setUp() {
        validDateRange = new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));
    }

    @Test
    void testBuildColumns_whenTemplateTypeIsNull_thenReturnEmptyCollection()
    {
        List<DateRange> dateRanges = List.of(validDateRange);
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(Period.MONTHLY, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildColumns_whenPeriodIsNull_thenReturnEmptyCollection()
    {
        List<DateRange> dateRanges = List.of(validDateRange);
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(null, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildColumns_whenDateRangesIsNull_thenReturnEmptyCollection()
    {
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(Period.MONTHLY, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildColumns_whenDateRangesIsEmpty_thenReturnEmptyCollection()
    {
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(Period.MONTHLY, List.of());
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }


    @Test
    void testBuildColumns_whenValidMonthlyArgs_thenReturnColumnPerDateRange()
    {
        DateRange jan = new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));
        DateRange feb = new DateRange(LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 29));
        DateRange mar = new DateRange(LocalDate.of(2024, 3, 1), LocalDate.of(2024, 3, 31));

        List<DateRange> dateRanges = List.of(jan, feb, mar);

        List<BPColumn> expected = List.of(
                new BPColumn(0, jan, Period.MONTHLY, BPColumnType.ACTUAL, false),
                new BPColumn(1, feb, Period.MONTHLY, BPColumnType.ACTUAL, false),
                new BPColumn(2, mar, Period.MONTHLY, BPColumnType.ACTUAL, false)
        );

        List<BPColumn> actual = bpColumnBuilderService.buildColumns(
                Period.MONTHLY, dateRanges);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).columnIndex(), actual.get(i).columnIndex());
            assertEquals(expected.get(i).dateRange(),   actual.get(i).dateRange());
            assertEquals(expected.get(i).period(),      actual.get(i).period());
            assertEquals(expected.get(i).columnType(),  actual.get(i).columnType());
            assertEquals(expected.get(i).isHeader(),    actual.get(i).isHeader());
        }
    }

    @Test
    void buildHeaderColumn_whenDateRangeIsNull_thenReturnNull()
    {
        BPColumn actual = bpColumnBuilderService.buildHeaderColumn(0, Period.MONTHLY, null);
        assertNull(actual);
    }

    @Test
    void buildHeaderColumn_whenValidArgs_thenReturnHeaderColumn()
    {
        BPColumn expected = new BPColumn(0, validDateRange, Period.MONTHLY, null, true);

        BPColumn actual = bpColumnBuilderService.buildHeaderColumn(0, Period.MONTHLY, validDateRange);

        assertNotNull(actual);
        assertEquals(expected.columnIndex(), actual.columnIndex());
        assertEquals(expected.dateRange(),   actual.dateRange());
        assertEquals(expected.period(),      actual.period());
        assertTrue(actual.isHeader());
        assertNull(actual.columnType());
    }

    @Test
    void buildSubColumn_whenDateRangeIsNull_thenReturnNull()
    {
        BPColumn actual = bpColumnBuilderService.buildSubColumn(0, Period.MONTHLY, null, BPColumnType.ACTUAL);
        assertNull(actual);
    }

    @Test
    void buildSubColumn_whenColumnTypeIsNull_thenReturnNull()
    {
        BPColumn actual = bpColumnBuilderService.buildSubColumn(0, Period.MONTHLY, validDateRange, null);
        assertNull(actual);
    }

    @Test
    void buildSubColumn_whenValidArgsActual_thenReturnActualSubColumn()
    {
        BPColumn expected = new BPColumn(1, validDateRange, Period.MONTHLY, BPColumnType.ACTUAL, false);

        BPColumn actual = bpColumnBuilderService.buildSubColumn(1, Period.MONTHLY, validDateRange, BPColumnType.ACTUAL);

        assertNotNull(actual);
        assertEquals(expected.columnIndex(), actual.columnIndex());
        assertEquals(expected.dateRange(),   actual.dateRange());
        assertEquals(expected.period(),      actual.period());
        assertEquals(expected.columnType(),  actual.columnType());
        assertFalse(actual.isHeader());
    }

    @Test
    void buildSubColumn_whenValidArgsEstimated_thenReturnEstimatedSubColumn()
    {
        BPColumn expected = new BPColumn(1, validDateRange, Period.MONTHLY, BPColumnType.ESTIMATED, false);

        BPColumn actual = bpColumnBuilderService.buildSubColumn(1, Period.MONTHLY, validDateRange, BPColumnType.ESTIMATED);

        assertNotNull(actual);
        assertEquals(expected.columnIndex(), actual.columnIndex());
        assertEquals(expected.columnType(),  actual.columnType());
        assertFalse(actual.isHeader());
    }


    @AfterEach
    void tearDown() {
    }
}